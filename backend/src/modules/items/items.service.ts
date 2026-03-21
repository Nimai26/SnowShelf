import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';
import { Item, SearchState } from '../../database/entities/item.entity';
import { ItemMetadata } from '../../database/entities/item-metadata.entity';
import { Category } from '../../database/entities/category.entity';
import { PrimaryType } from '../../database/entities/primary-type.entity';
import { PrimaryTypeField } from '../../database/entities/primary-type-field.entity';
import { User, UserRole } from '../../database/entities/user.entity';
import { Status } from '../../database/entities/status.entity';
import { Grade } from '../../database/entities/grade.entity';
import { StorageLocation } from '../../database/entities/storage-location.entity';
import { FieldType } from '../../database/entities/primary-type-field.entity';
import { CategoryField } from '../../database/entities/category-field.entity';
import { ItemCategoryMetadata } from '../../database/entities/item-category-metadata.entity';
import { ItemImage } from '../../database/entities/item-image.entity';
import { ItemVideo } from '../../database/entities/item-video.entity';
import { ItemAudio } from '../../database/entities/item-audio.entity';
import { ItemDocument } from '../../database/entities/item-document.entity';
import { CreateItemDto, UpdateItemDto, QueryItemsDto, CopyItemDto } from './dto/item.dto';
import { CategoryRelationship } from '../../database/entities/category-relationship.entity';
import { CategoryRelationshipDefault } from '../../database/entities/category-relationship-default.entity';

@Injectable()
export class ItemsService implements OnModuleInit {
  private readonly logger = new Logger(ItemsService.name);
  private hasFulltextIndex = false;

  constructor(
    @InjectRepository(Item)
    private readonly itemRepo: Repository<Item>,
    @InjectRepository(ItemMetadata)
    private readonly metaRepo: Repository<ItemMetadata>,
    @InjectRepository(Category)
    private readonly catRepo: Repository<Category>,
    @InjectRepository(PrimaryType)
    private readonly ptRepo: Repository<PrimaryType>,
    @InjectRepository(PrimaryTypeField)
    private readonly ptfRepo: Repository<PrimaryTypeField>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Status)
    private readonly statusRepo: Repository<Status>,
    @InjectRepository(Grade)
    private readonly gradeRepo: Repository<Grade>,
    @InjectRepository(StorageLocation)
    private readonly storageLocRepo: Repository<StorageLocation>,
    @InjectRepository(CategoryRelationship)
    private readonly catRelRepo: Repository<CategoryRelationship>,
    @InjectRepository(CategoryRelationshipDefault)
    private readonly catRelDefaultRepo: Repository<CategoryRelationshipDefault>,
    @InjectRepository(CategoryField)
    private readonly catFieldRepo: Repository<CategoryField>,
    @InjectRepository(ItemCategoryMetadata)
    private readonly catMetaRepo: Repository<ItemCategoryMetadata>,
    @InjectRepository(ItemImage)
    private readonly itemImageRepo: Repository<ItemImage>,
    @InjectRepository(ItemVideo)
    private readonly itemVideoRepo: Repository<ItemVideo>,
    @InjectRepository(ItemAudio)
    private readonly itemAudioRepo: Repository<ItemAudio>,
    @InjectRepository(ItemDocument)
    private readonly itemDocRepo: Repository<ItemDocument>,
    private readonly dataSource: DataSource,
  ) {}

  async onModuleInit() {
    await this.ensureFulltextIndex();
  }

  /**
   * Create FULLTEXT index on items(name, description) if not exists.
   * MariaDB/MySQL FULLTEXT supports MATCH AGAINST for relevance-based search.
   */
  private async ensureFulltextIndex() {
    try {
      // Check if the index already exists
      const indexes: any[] = await this.dataSource.query(
        `SHOW INDEX FROM items WHERE Key_name = 'ft_items_search'`,
      );
      if (indexes.length === 0) {
        await this.dataSource.query(
          `ALTER TABLE items ADD FULLTEXT INDEX ft_items_search (name, description)`,
        );
        this.logger.log('FULLTEXT index ft_items_search created on items(name, description)');
      } else {
        this.logger.log('FULLTEXT index ft_items_search already exists');
      }
      this.hasFulltextIndex = true;
    } catch (err) {
      this.logger.warn('Could not create FULLTEXT index, falling back to LIKE search: ' + err.message);
      this.hasFulltextIndex = false;
    }
  }

  // ──────────────────────────────────────────────
  // CHECK DUPLICATE
  // ──────────────────────────────────────────────

  async checkDuplicate(userId: number, barcode?: string, name?: string) {
    const existingItems: { id: number; name: string; barcode: string | null; primaryTypeName: string; createdAt: Date }[] = [];

    if (barcode) {
      const byBarcode = await this.itemRepo.find({
        where: { userId, barcode },
        relations: ['primaryType'],
        take: 5,
      });
      for (const item of byBarcode) {
        existingItems.push({
          id: item.id,
          name: item.name,
          barcode: item.barcode,
          primaryTypeName: item.primaryType?.keyName || 'unknown',
          createdAt: item.createdAt,
        });
      }
    }

    if (name && existingItems.length === 0) {
      // Recherche par nom similaire (exact ou partiel)
      const byName = await this.itemRepo
        .createQueryBuilder('item')
        .leftJoinAndSelect('item.primaryType', 'pt')
        .where('item.userId = :userId', { userId })
        .andWhere('item.name LIKE :name', { name: `%${name}%` })
        .take(5)
        .getMany();
      for (const item of byName) {
        existingItems.push({
          id: item.id,
          name: item.name,
          barcode: item.barcode,
          primaryTypeName: item.primaryType?.keyName || 'unknown',
          createdAt: item.createdAt,
        });
      }
    }

    return {
      isDuplicate: existingItems.length > 0,
      existingItems,
    };
  }

  // ──────────────────────────────────────────────
  // SERIALIZE ITEM (format response)
  // ──────────────────────────────────────────────
  private serializeItem(item: Item, lang = 'fr') {
    const pt = item.primaryType;
    const categories = (item.categories || []).map((c) => ({
      id: c.id,
      name: c.name,
      icon: c.icon,
      iconType: c.iconType,
      color: c.color,
    }));

    // Transform metadata EAV → flat object
    const metadata: Record<string, any> = {};
    for (const meta of item.metadata || []) {
      if (!meta.field) continue;
      const field = meta.field;
      const key = field.fieldKey;
      const label = lang === 'en' ? field.fieldNameEn : field.fieldNameFr;

      let value: any = null;
      switch (field.fieldType) {
        case FieldType.NUMBER:
        case FieldType.YEAR:
        case FieldType.RATING:
        case FieldType.DURATION:
          value = meta.valueNumber != null ? Number(meta.valueNumber) : null;
          break;
        case FieldType.DATE:
          value = meta.valueDate;
          break;
        case FieldType.BOOLEAN:
          value = meta.valueText === 'true';
          break;
        case FieldType.MULTISELECT:
        case FieldType.CHECKLIST:
          value = meta.valueJson;
          break;
        default:
          value = meta.valueText;
      }

      metadata[key] = {
        fieldId: field.id,
        label,
        value,
        type: field.fieldType,
        icon: field.icon,
      };
    }

    // Transform category metadata EAV → flat object
    const categoryMetadata: Record<string, any> = {};
    for (const meta of item.categoryMetadata || []) {
      if (!meta.field) continue;
      const field = meta.field;
      const key = field.fieldKey;
      const label = lang === 'en' ? field.fieldNameEn : field.fieldNameFr;

      let value: any = null;
      switch (field.fieldType) {
        case FieldType.NUMBER:
        case FieldType.YEAR:
        case FieldType.RATING:
        case FieldType.DURATION:
          value = meta.valueNumber != null ? Number(meta.valueNumber) : null;
          break;
        case FieldType.DATE:
          value = meta.valueDate;
          break;
        case FieldType.BOOLEAN:
          value = meta.valueText === 'true';
          break;
        case FieldType.MULTISELECT:
          value = meta.valueJson;
          break;
        case FieldType.CHECKLIST:
          value = meta.valueJson;
          break;
        default:
          value = meta.valueText;
      }

      categoryMetadata[key] = {
        fieldId: field.id,
        label,
        value,
        type: field.fieldType,
        icon: field.icon,
      };
    }

    return {
      id: item.id,
      name: item.name,
      description: item.description,
      notes: item.notes,
      primaryType: pt
        ? {
            id: pt.id,
            key: pt.keyName,
            name: lang === 'en' ? pt.nameEn : pt.nameFr,
            icon: pt.icon,
          }
        : null,
      rating: item.rating,
      purchasePrice: item.purchasePrice != null ? Number(item.purchasePrice) : null,
      marketValue: item.marketValue != null ? Number(item.marketValue) : null,
      dateObtained: item.dateObtained,
      searchState: item.searchState,
      barcode: item.barcode,
      status: item.status
        ? {
            id: item.status.id,
            name: item.status.name,
            color: item.status.color,
            icon: item.status.icon,
          }
        : null,
      storageLocation: item.storageLocation
        ? {
            id: item.storageLocation.id,
            name: item.storageLocation.name,
            description: item.storageLocation.description,
          }
        : null,
      grades: (item.grades || []).map((g) => ({
        id: g.id,
        name: g.name,
      })),
      categories,
      metadata,
      categoryMetadata,
      owner: item.user
        ? {
            id: item.user.id,
            username: item.user.username,
            avatarUrl: item.user.avatarUrl,
          }
        : null,
      images: (item.images || []).sort((a, b) => a.displayOrder - b.displayOrder).map((img) => ({
        id: img.id,
        url: img.url,
        thumbnailUrl: img.thumbnailUrl,
        title: img.title,
        filename: img.filename,
        mimeType: img.mimeType,
        size: img.size,
        width: img.width,
        height: img.height,
        displayOrder: img.displayOrder,
        createdAt: img.createdAt,
      })),
      videos: (item.videos || []).sort((a, b) => a.displayOrder - b.displayOrder).map((v) => ({
        id: v.id,
        url: v.url,
        title: v.title,
        filename: v.filename,
        mimeType: v.mimeType,
        size: v.size,
        duration: v.duration,
        displayOrder: v.displayOrder,
        createdAt: v.createdAt,
      })),
      audio: (item.audio || []).sort((a, b) => a.displayOrder - b.displayOrder).map((a) => ({
        id: a.id,
        url: a.url,
        title: a.title,
        filename: a.filename,
        mimeType: a.mimeType,
        size: a.size,
        duration: a.duration,
        displayOrder: a.displayOrder,
        createdAt: a.createdAt,
      })),
      documents: (item.documents || []).sort((a, b) => a.displayOrder - b.displayOrder).map((d) => ({
        id: d.id,
        url: d.url,
        title: d.title,
        filename: d.filename,
        mimeType: d.mimeType,
        size: d.size,
        displayOrder: d.displayOrder,
        createdAt: d.createdAt,
      })),
      externalLinks: item.externalLinks || [],
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  // ──────────────────────────────────────────────
  // SERIALIZE ITEM compact (for list view)
  // ──────────────────────────────────────────────
  private serializeItemCompact(item: Item, lang = 'fr') {
    const pt = item.primaryType;
    // Pick the first image by displayOrder
    const sortedImages = (item.images || []).sort((a, b) => a.displayOrder - b.displayOrder);
    const firstImage = sortedImages[0] || null;
    return {
      id: item.id,
      name: item.name,
      description: item.description,
      primaryType: pt
        ? {
            key: pt.keyName,
            name: lang === 'en' ? pt.nameEn : pt.nameFr,
            icon: pt.icon,
          }
        : null,
      rating: item.rating,
      marketValue: item.marketValue != null ? Number(item.marketValue) : null,
      dateObtained: item.dateObtained,
      searchState: item.searchState,
      categories: (item.categories || []).map((c) => ({
        id: c.id,
        name: c.name,
        icon: c.icon,
        iconType: c.iconType,
      })),
      status: item.status
        ? { id: item.status.id, name: item.status.name, color: item.status.color, icon: item.status.icon }
        : null,
      thumbnailUrl: firstImage?.thumbnailUrl || null,
      imageUrl: firstImage?.url || null,
      createdAt: item.createdAt,
    };
  }

  /**
   * Given a list of categoryIds, resolve all ancestor parent categories
   * (walks up the hierarchy via user-specific then default relationships).
   * Returns the full expanded set of category IDs.
   */
  async resolveWithParentCategories(
    categoryIds: number[],
    userId: number,
  ): Promise<number[]> {
    const allIds = new Set(categoryIds);
    const queue = [...categoryIds];

    while (queue.length > 0) {
      const catId = queue.shift()!;

      // Check user-specific parents first
      const userRels = await this.catRelRepo.find({
        where: { childId: catId, userId },
      });
      let parentIds = userRels.map((r) => r.parentId);

      // Fallback to default parents if no user-specific ones
      if (parentIds.length === 0) {
        const defaultRels = await this.catRelDefaultRepo.find({
          where: { childId: catId },
        });
        parentIds = defaultRels.map((r) => r.parentId);
      }

      for (const pid of parentIds) {
        if (!allIds.has(pid)) {
          allIds.add(pid);
          queue.push(pid);
        }
      }
    }

    return [...allIds];
  }

  // ──────────────────────────────────────────────
  // CREATE
  // ──────────────────────────────────────────────
  async create(userId: number, dto: CreateItemDto) {
    // Validate PrimaryType exists
    const primaryType = await this.ptRepo.findOne({
      where: { id: dto.primaryTypeId },
    });
    if (!primaryType) {
      throw new BadRequestException(`PrimaryType ${dto.primaryTypeId} introuvable`);
    }

    // Resolve categories with parent inheritance
    const resolvedCatIds = await this.resolveWithParentCategories(dto.categoryIds, userId);
    const categories = await this.catRepo.findBy({ id: In(resolvedCatIds) });
    if (categories.length !== resolvedCatIds.length) {
      throw new BadRequestException('Une ou plusieurs catégories sont introuvables');
    }
    if (resolvedCatIds.length > dto.categoryIds.length) {
      this.logger.debug(
        `Category inheritance: ${dto.categoryIds} → ${resolvedCatIds} (added parents)`,
      );
    }

    // Create item
    const item = this.itemRepo.create({
      userId,
      primaryTypeId: dto.primaryTypeId,
      name: dto.name,
      description: dto.description || null,
      notes: dto.notes || null,
      rating: dto.rating || null,
      purchasePrice: dto.purchasePrice ?? null,
      marketValue: dto.marketValue ?? null,
      dateObtained: dto.dateObtained ? new Date(dto.dateObtained) : null,
      searchState: dto.searchState ? (dto.searchState as SearchState) : null,
      barcode: dto.barcode || null,
      statusId: dto.statusId ?? null,
      storageLocationId: dto.storageLocationId ?? null,
      userCategoryIds: dto.categoryIds,
      externalLinks: dto.externalLinks || null,
      categories,
    });

    // Resolve grades
    if (dto.gradeIds && dto.gradeIds.length > 0) {
      item.grades = await this.gradeRepo.findBy({ id: In(dto.gradeIds) });
    }

    const saved = await this.itemRepo.save(item);

    // Save metadata if provided
    if (dto.metadata && Object.keys(dto.metadata).length > 0) {
      await this.saveMetadata(saved.id, dto.primaryTypeId, dto.metadata);
    }

    // Save category metadata if provided
    if (dto.categoryMetadata && Object.keys(dto.categoryMetadata).length > 0) {
      const catIds = categories.map((c) => c.id);
      await this.saveCategoryMetadata(saved.id, catIds, dto.categoryMetadata);
    }

    // Increment user items count
    await this.userRepo.increment({ id: userId }, 'itemsCount', 1);

    // Increment categories items count
    for (const cat of categories) {
      await this.catRepo.increment({ id: cat.id }, 'itemsCount', 1);
    }

    this.logger.log(`Item created: ${saved.name} (id: ${saved.id}) by user ${userId}`);

    return {
      success: true,
      message: 'Item créé',
      data: {
        id: saved.id,
        name: saved.name,
      },
    };
  }

  // ──────────────────────────────────────────────
  // SAVE METADATA (EAV)
  // ──────────────────────────────────────────────
  private async saveMetadata(
    itemId: number,
    primaryTypeId: number,
    metadata: Record<string, any>,
  ) {
    // Get fields for this primary type
    const fields = await this.ptfRepo.find({
      where: { primaryTypeId },
    });

    const fieldMap = new Map(fields.map((f) => [f.fieldKey, f]));

    const metaEntities: Partial<ItemMetadata>[] = [];

    for (const [key, value] of Object.entries(metadata)) {
      if (value === null || value === undefined || value === '') continue;

      const field = fieldMap.get(key);
      if (!field) {
        this.logger.warn(`Unknown metadata key "${key}" for primaryType ${primaryTypeId}, skipping`);
        continue;
      }

      const meta: Partial<ItemMetadata> = {
        itemId,
        fieldId: field.id,
        valueText: null,
        valueNumber: null,
        valueDate: null,
        valueJson: null,
      };

      switch (field.fieldType) {
        case FieldType.NUMBER:
        case FieldType.YEAR:
        case FieldType.RATING:
        case FieldType.DURATION:
          meta.valueNumber = Number(value);
          break;
        case FieldType.DATE:
          meta.valueDate = new Date(value);
          break;
        case FieldType.BOOLEAN:
          meta.valueText = String(value);
          break;
        case FieldType.MULTISELECT:
          meta.valueJson = Array.isArray(value) ? value : [value];
          break;
        case FieldType.CHECKLIST:
          meta.valueJson = typeof value === 'object' ? value : JSON.parse(value);
          break;
        default:
          meta.valueText = String(value);
      }

      metaEntities.push(meta);
    }

    if (metaEntities.length > 0) {
      await this.metaRepo.save(metaEntities);
    }
  }

  // ──────────────────────────────────────────────
  // SAVE CATEGORY METADATA (EAV — category-level fields)
  // ──────────────────────────────────────────────
  private async saveCategoryMetadata(
    itemId: number,
    categoryIds: number[],
    metadata: Record<string, any>,
  ) {
    // Get all CategoryField records for the item's categories
    const fields = await this.catFieldRepo.find({
      where: { categoryId: In(categoryIds) },
    });

    const fieldMap = new Map(fields.map((f) => [f.fieldKey, f]));

    const metaEntities: Partial<ItemCategoryMetadata>[] = [];

    for (const [key, value] of Object.entries(metadata)) {
      if (value === null || value === undefined || value === '') continue;

      const field = fieldMap.get(key);
      if (!field) {
        this.logger.warn(`Unknown category field key "${key}", skipping`);
        continue;
      }

      const meta: Partial<ItemCategoryMetadata> = {
        itemId,
        fieldId: field.id,
        valueText: null,
        valueNumber: null,
        valueDate: null,
        valueJson: null,
      };

      switch (field.fieldType) {
        case FieldType.NUMBER:
        case FieldType.YEAR:
        case FieldType.RATING:
        case FieldType.DURATION:
          meta.valueNumber = Number(value);
          break;
        case FieldType.DATE:
          meta.valueDate = new Date(value);
          break;
        case FieldType.BOOLEAN:
          meta.valueText = String(value);
          break;
        case FieldType.MULTISELECT:
          meta.valueJson = Array.isArray(value) ? value : [value];
          break;
        case FieldType.CHECKLIST:
          meta.valueJson = typeof value === 'object' ? value : JSON.parse(value);
          break;
        default:
          meta.valueText = String(value);
      }

      metaEntities.push(meta);
    }

    if (metaEntities.length > 0) {
      await this.catMetaRepo.save(metaEntities);
    }
  }

  // ──────────────────────────────────────────────
  // FIND ALL (with filters & pagination)
  // ──────────────────────────────────────────────
  async findAll(userId: number, query: QueryItemsDto, lang = 'fr') {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 50, 100);
    const sort = query.sort || 'createdAt';
    const order = (query.order || 'desc').toUpperCase() as 'ASC' | 'DESC';

    const qb = this.itemRepo
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.primaryType', 'pt')
      .leftJoinAndSelect('item.categories', 'cat')
      .leftJoinAndSelect('item.status', 'status')
      .leftJoinAndSelect('item.images', 'img')
      .where('item.userId = :userId', { userId })
      .andWhere('item.deletedAt IS NULL');

    // Filter by category
    if (query.categoryId) {
      qb.andWhere('cat.id = :categoryId', { categoryId: query.categoryId });
    }

    // Full-text search (MATCH AGAINST with LIKE fallback)
    if (query.search) {
      if (this.hasFulltextIndex && query.search.length >= 2) {
        // Use FULLTEXT MATCH AGAINST in boolean mode for relevance search
        const searchTerm = query.search
          .replace(/[+\-><()~*"@]/g, '') // sanitize special FULLTEXT chars
          .trim();
        if (searchTerm) {
          qb.andWhere(
            `MATCH(item.name, item.description) AGAINST(:search IN BOOLEAN MODE)`,
            { search: `*${searchTerm}*` },
          );
        }
      } else {
        // Fallback to LIKE for short queries or if index not available
        qb.andWhere(
          '(item.name LIKE :searchLike OR item.description LIKE :searchLike)',
          { searchLike: `%${query.search}%` },
        );
      }
    }

    // Rating filter
    if (query.minRating) {
      qb.andWhere('item.rating >= :minRating', { minRating: query.minRating });
    }

    // Value filters
    if (query.minValue != null) {
      qb.andWhere('item.marketValue >= :minValue', { minValue: query.minValue });
    }
    if (query.maxValue != null) {
      qb.andWhere('item.marketValue <= :maxValue', { maxValue: query.maxValue });
    }

    // Date filters
    if (query.dateFrom) {
      qb.andWhere('item.dateObtained >= :dateFrom', { dateFrom: query.dateFrom });
    }
    if (query.dateTo) {
      qb.andWhere('item.dateObtained <= :dateTo', { dateTo: query.dateTo });
    }

    // Search state
    if (query.searchState) {
      qb.andWhere('item.searchState = :searchState', { searchState: query.searchState });
    }

    // Status filter
    if (query.statusId) {
      qb.andWhere('item.statusId = :statusId', { statusId: query.statusId });
    }

    // PrimaryType filter
    if (query.primaryTypeId) {
      qb.andWhere('item.primaryTypeId = :primaryTypeId', { primaryTypeId: query.primaryTypeId });
    }

    // Storage location filter
    if (query.storageLocationId) {
      qb.andWhere('item.storageLocationId = :storageLocationId', {
        storageLocationId: query.storageLocationId,
      });
    }

    // Barcode filter (exact match)
    if (query.barcode) {
      qb.andWhere('item.barcode = :barcode', { barcode: query.barcode });
    }

    // Grades filter (items having at least one of the specified grades)
    if (query.gradeIds && query.gradeIds.length > 0) {
      qb.leftJoin('item.grades', 'grade')
        .andWhere('grade.id IN (:...gradeIds)', { gradeIds: query.gradeIds });
    }

    // Sort
    const sortMap: Record<string, string> = {
      name: 'item.name',
      createdAt: 'item.createdAt',
      value: 'item.marketValue',
      rating: 'item.rating',
      purchasePrice: 'item.purchasePrice',
      dateObtained: 'item.dateObtained',
    };
    qb.orderBy(sortMap[sort] || 'item.createdAt', order);

    // Aggregations
    const totalValue = await this.itemRepo
      .createQueryBuilder('item')
      .select('SUM(item.marketValue)', 'total')
      .addSelect('AVG(item.rating)', 'avgRating')
      .where('item.userId = :userId', { userId })
      .andWhere('item.deletedAt IS NULL')
      .getRawOne();

    const total = await qb.getCount();
    const items = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      success: true,
      data: {
        items: items.map((i) => this.serializeItemCompact(i, lang)),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
        aggregations: {
          totalValue: totalValue?.total ? Number(totalValue.total) : 0,
          avgRating: totalValue?.avgRating ? Number(Number(totalValue.avgRating).toFixed(1)) : 0,
        },
      },
    };
  }

  // ──────────────────────────────────────────────
  // FIND ONE
  // ──────────────────────────────────────────────
  async findOne(userId: number, id: number, lang = 'fr') {
    const item = await this.itemRepo.findOne({
      where: { id },
      relations: [
        'user',
        'primaryType',
        'categories',
        'metadata',
        'metadata.field',
        'categoryMetadata',
        'categoryMetadata.field',
        'status',
        'storageLocation',
        'grades',
        'images',
        'videos',
        'audio',
        'documents',
      ],
    });

    if (!item || item.deletedAt) {
      throw new NotFoundException(`Item #${id} introuvable`);
    }

    // Access control: owner or admin
    if (item.userId !== userId) {
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user || user.role !== UserRole.ADMIN) {
        throw new ForbiddenException('Accès refusé');
      }
    }

    return {
      success: true,
      data: this.serializeItem(item, lang),
    };
  }

  // ──────────────────────────────────────────────
  // UPDATE
  // ──────────────────────────────────────────────
  async update(userId: number, id: number, dto: UpdateItemDto) {
    const item = await this.itemRepo.findOne({
      where: { id },
      relations: ['categories', 'grades'],
    });

    if (!item || item.deletedAt) {
      throw new NotFoundException(`Item #${id} introuvable`);
    }

    // Access control
    if (item.userId !== userId) {
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user || user.role !== UserRole.ADMIN) {
        throw new ForbiddenException('Accès refusé');
      }
    }

    // Update basic fields
    if (dto.name !== undefined) {
      item.name = dto.name;
    }
    if (dto.description !== undefined) item.description = dto.description || null;
    if (dto.notes !== undefined) item.notes = dto.notes || null;
    if (dto.rating !== undefined) item.rating = dto.rating || null;
    if (dto.purchasePrice !== undefined) item.purchasePrice = dto.purchasePrice ?? null;
    if (dto.marketValue !== undefined) item.marketValue = dto.marketValue ?? null;
    if (dto.dateObtained !== undefined) {
      item.dateObtained = dto.dateObtained ? new Date(dto.dateObtained) : null;
    }
    if (dto.searchState !== undefined) {
      item.searchState = dto.searchState ? (dto.searchState as SearchState) : null;
    }
    if (dto.barcode !== undefined) item.barcode = dto.barcode || null;
    if (dto.statusId !== undefined) item.statusId = dto.statusId ?? null;
    if (dto.storageLocationId !== undefined) item.storageLocationId = dto.storageLocationId ?? null;
    if (dto.externalLinks !== undefined) item.externalLinks = dto.externalLinks || null;

    // Update grades
    if (dto.gradeIds !== undefined) {
      item.grades = dto.gradeIds.length > 0
        ? await this.gradeRepo.findBy({ id: In(dto.gradeIds) })
        : [];
    }

    // Update categories (with parent inheritance)
    if (dto.categoryIds !== undefined) {
      const oldCatIds = item.categories.map((c) => c.id);
      const resolvedCatIds = await this.resolveWithParentCategories(dto.categoryIds, item.userId);
      const newCategories = await this.catRepo.findBy({ id: In(resolvedCatIds) });
      if (newCategories.length !== resolvedCatIds.length) {
        throw new BadRequestException('Une ou plusieurs catégories sont introuvables');
      }
      if (resolvedCatIds.length > dto.categoryIds.length) {
        this.logger.debug(
          `Category inheritance (update): ${dto.categoryIds} → ${resolvedCatIds}`,
        );
      }

      // Only adjust counts for categories that actually changed
      const newCatIds = newCategories.map((c) => c.id);
      const removedCatIds = oldCatIds.filter((id) => !newCatIds.includes(id));
      const addedCatIds = newCatIds.filter((id) => !oldCatIds.includes(id));

      for (const catId of removedCatIds) {
        await this.catRepo
          .createQueryBuilder()
          .update()
          .set({ itemsCount: () => 'GREATEST(items_count, 1) - 1' })
          .where('id = :id', { id: catId })
          .execute();
      }
      for (const catId of addedCatIds) {
        await this.catRepo.increment({ id: catId }, 'itemsCount', 1);
      }

      item.userCategoryIds = dto.categoryIds;
      item.categories = newCategories;
    }

    await this.itemRepo.save(item);

    // Update metadata
    if (dto.metadata !== undefined) {
      // Delete existing metadata
      await this.metaRepo.delete({ itemId: item.id });
      // Save new metadata
      if (Object.keys(dto.metadata).length > 0) {
        await this.saveMetadata(item.id, item.primaryTypeId, dto.metadata);
      }
    }

    // Update category metadata
    if (dto.categoryMetadata !== undefined) {
      await this.catMetaRepo.delete({ itemId: item.id });
      if (Object.keys(dto.categoryMetadata).length > 0) {
        const catIds = (item.categories || []).map((c) => c.id);
        await this.saveCategoryMetadata(item.id, catIds, dto.categoryMetadata);
      }
    }

    this.logger.log(`Item updated: ${item.name} (id: ${item.id})`);

    return {
      success: true,
      message: 'Item mis à jour',
    };
  }

  // ──────────────────────────────────────────────
  // DELETE (soft)
  // ──────────────────────────────────────────────
  async remove(userId: number, id: number) {
    const item = await this.itemRepo.findOne({
      where: { id },
      relations: ['categories'],
    });

    if (!item || item.deletedAt) {
      throw new NotFoundException(`Item #${id} introuvable`);
    }

    // Access control
    if (item.userId !== userId) {
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user || user.role !== UserRole.ADMIN) {
        throw new ForbiddenException('Accès refusé');
      }
    }

    // Soft delete
    await this.itemRepo.softRemove(item);

    // Decrement counters
    await this.userRepo.decrement({ id: item.userId }, 'itemsCount', 1);
    for (const cat of item.categories) {
      await this.catRepo
        .createQueryBuilder()
        .update()
        .set({ itemsCount: () => 'GREATEST(items_count, 1) - 1' })
        .where('id = :id', { id: cat.id })
        .execute();
    }

    this.logger.log(`Item deleted: ${item.name} (id: ${item.id})`);

    return {
      success: true,
      message: 'Item supprimé',
    };
  }

  // ──────────────────────────────────────────────
  // COPY (duplicate)
  // ──────────────────────────────────────────────
  async copy(userId: number, itemId: number, dto: CopyItemDto) {
    // Load full item with all relations
    const item = await this.itemRepo.findOne({
      where: { id: itemId },
      relations: [
        'categories',
        'grades',
        'metadata',
        'metadata.field',
        'categoryMetadata',
        'categoryMetadata.field',
      ],
    });

    if (!item || item.deletedAt) {
      throw new NotFoundException(`Item #${itemId} introuvable`);
    }

    // Access control: owner only
    if (item.userId !== userId) {
      throw new ForbiddenException('Seul le propriétaire peut dupliquer cet item');
    }

    // Determine name for the copy
    const baseName = dto.name || `${item.name} (copie)`;
    let copyName = baseName;
    let suffix = 1;
    while (
      await this.itemRepo.findOne({
        where: { userId, name: copyName },
      })
    ) {
      suffix++;
      copyName = `${baseName} (${suffix})`;
    }

    // Create the new item
    const newItem = this.itemRepo.create({
      userId,
      primaryTypeId: item.primaryTypeId,
      name: copyName,
      description: item.description,
      notes: item.notes,
      rating: item.rating,
      purchasePrice: item.purchasePrice,
      marketValue: item.marketValue,
      dateObtained: item.dateObtained,
      searchState: item.searchState,
      barcode: item.barcode,
      statusId: item.statusId,
      storageLocationId: item.storageLocationId,
      userCategoryIds: item.userCategoryIds,
      externalLinks: item.externalLinks,
      categories: item.categories,
    });

    // Copy grades
    if (item.grades && item.grades.length > 0) {
      newItem.grades = item.grades;
    }

    const saved = await this.itemRepo.save(newItem);

    // Copy PrimaryType metadata (EAV)
    if (item.metadata && item.metadata.length > 0) {
      const metaEntities = item.metadata.map((meta) =>
        this.metaRepo.create({
          itemId: saved.id,
          fieldId: meta.fieldId,
          valueText: meta.valueText,
          valueNumber: meta.valueNumber,
          valueDate: meta.valueDate,
          valueJson: meta.valueJson,
        }),
      );
      await this.metaRepo.save(metaEntities);
    }

    // Copy Category metadata (EAV)
    if (item.categoryMetadata && item.categoryMetadata.length > 0) {
      const catMetaEntities = item.categoryMetadata.map((meta) =>
        this.catMetaRepo.create({
          itemId: saved.id,
          fieldId: meta.fieldId,
          valueText: meta.valueText,
          valueNumber: meta.valueNumber,
          valueDate: meta.valueDate,
          valueJson: meta.valueJson,
        }),
      );
      await this.catMetaRepo.save(catMetaEntities);
    }

    // Copy media files if requested
    if (dto.copyMedia) {
      await this.copyItemMediaFiles(item, saved, userId);
    }

    // Increment user items count
    await this.userRepo.increment({ id: userId }, 'itemsCount', 1);

    // Increment categories items count
    for (const cat of item.categories) {
      await this.catRepo.increment({ id: cat.id }, 'itemsCount', 1);
    }

    this.logger.log(
      `Item copied: "${item.name}" → "${saved.name}" (id: ${saved.id}) by user ${userId}`,
    );

    return {
      success: true,
      message: 'Item dupliqué',
      data: {
        id: saved.id,
        name: saved.name,
      },
    };
  }

  // ──────────────────────────────────────────────
  // COPY ITEM MEDIA FILES
  // ──────────────────────────────────────────────
  private async copyItemMediaFiles(
    source: Item,
    target: Item,
    userId: number,
  ): Promise<void> {
    const fs = await import('fs/promises');
    const path = await import('path');
    const storagePath = path.join(process.cwd(), 'storage');

    const mediaTypes = ['images', 'videos', 'audio', 'documents'] as const;

    for (const type of mediaTypes) {
      const repo = this.getItemMediaRepo(type);
      const items = await repo.find({
        where: { itemId: source.id },
        order: { displayOrder: 'ASC' },
      });

      if (items.length === 0) continue;

      const srcDir = path.join(
        storagePath, 'users', String(userId), 'items', String(source.id), type,
      );
      const destDir = path.join(
        storagePath, 'users', String(userId), 'items', String(target.id), type,
      );
      await fs.mkdir(destDir, { recursive: true });

      for (const mediaItem of items) {
        try {
          const filename = path.basename(mediaItem.url);
          const srcFile = path.join(srcDir, filename);
          const destFile = path.join(destDir, filename);

          await fs.copyFile(srcFile, destFile);

          const newUrl = `/storage/users/${userId}/items/${target.id}/${type}/${filename}`;

          const entityData: any = {
            itemId: target.id,
            url: newUrl,
            title: mediaItem.title,
            filename: mediaItem.filename,
            mimeType: mediaItem.mimeType,
            size: mediaItem.size,
            displayOrder: mediaItem.displayOrder,
          };

          if (type === 'images') {
            entityData.thumbnailUrl = newUrl;
            entityData.width = mediaItem.width;
            entityData.height = mediaItem.height;

            if (mediaItem.thumbnailUrl && mediaItem.thumbnailUrl !== mediaItem.url) {
              const thumbFilename = path.basename(mediaItem.thumbnailUrl);
              const srcThumbDir = path.join(srcDir, 'thumbs');
              const destThumbDir = path.join(destDir, 'thumbs');
              try {
                await fs.mkdir(destThumbDir, { recursive: true });
                await fs.copyFile(
                  path.join(srcThumbDir, thumbFilename),
                  path.join(destThumbDir, thumbFilename),
                );
                entityData.thumbnailUrl = `/storage/users/${userId}/items/${target.id}/${type}/thumbs/${thumbFilename}`;
              } catch {
                // Thumbnail copy failed, use main URL
              }
            }
          }
          if (type === 'videos') {
            entityData.duration = mediaItem.duration;
            entityData.thumbnailUrl = mediaItem.thumbnailUrl ? newUrl : null;
          }
          if (type === 'audio') {
            entityData.duration = mediaItem.duration;
          }

          const entity = repo.create(entityData);
          await repo.save(entity);
        } catch (err) {
          this.logger.warn(`Failed to copy media file ${mediaItem.url}: ${err.message}`);
        }
      }
    }

    this.logger.log(
      `Media files copied from item ${source.id} to ${target.id}`,
    );
  }

  private getItemMediaRepo(mediaType: string): Repository<any> {
    switch (mediaType) {
      case 'images': return this.itemImageRepo;
      case 'videos': return this.itemVideoRepo;
      case 'audio': return this.itemAudioRepo;
      case 'documents': return this.itemDocRepo;
      default: throw new BadRequestException(`Invalid media type: ${mediaType}`);
    }
  }
}
