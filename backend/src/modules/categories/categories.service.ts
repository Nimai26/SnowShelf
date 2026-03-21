import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import { Category } from '../../database/entities/category.entity';
import { CategoryRelationship } from '../../database/entities/category-relationship.entity';
import { CategoryRelationshipDefault } from '../../database/entities/category-relationship-default.entity';
import { CategoryImage } from '../../database/entities/category-image.entity';
import { CategoryVideo } from '../../database/entities/category-video.entity';
import { CategoryAudio } from '../../database/entities/category-audio.entity';
import { CategoryDocument } from '../../database/entities/category-document.entity';
import { CategoryField } from '../../database/entities/category-field.entity';
import { User, UserRole } from '../../database/entities/user.entity';
import { Grade } from '../../database/entities/grade.entity';
import { Item } from '../../database/entities/item.entity';
import { PrimaryType } from '../../database/entities/primary-type.entity';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  QueryCategoriesDto,
  CopyCategoryDto,
  UpdateCategoryGradesDto,
  QueryCategoryItemsDto,
} from './dto/category.dto';
import {
  CreateCategoryFieldDto,
  UpdateCategoryFieldDto,
} from './dto/category-field.dto';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);
  private readonly storagePath = '/app/storage';

  constructor(
    @InjectRepository(Category)
    private readonly catRepo: Repository<Category>,
    @InjectRepository(CategoryRelationship)
    private readonly relRepo: Repository<CategoryRelationship>,
    @InjectRepository(CategoryRelationshipDefault)
    private readonly relDefaultRepo: Repository<CategoryRelationshipDefault>,
    @InjectRepository(CategoryImage)
    private readonly catImageRepo: Repository<CategoryImage>,
    @InjectRepository(CategoryVideo)
    private readonly catVideoRepo: Repository<CategoryVideo>,
    @InjectRepository(CategoryAudio)
    private readonly catAudioRepo: Repository<CategoryAudio>,
    @InjectRepository(CategoryDocument)
    private readonly catDocRepo: Repository<CategoryDocument>,
    @InjectRepository(CategoryField)
    private readonly catFieldRepo: Repository<CategoryField>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Grade)
    private readonly gradeRepo: Repository<Grade>,
    @InjectRepository(Item)
    private readonly itemRepo: Repository<Item>,
    @InjectRepository(PrimaryType)
    private readonly primaryTypeRepo: Repository<PrimaryType>,
  ) {}

  // ──────────────────────────────────────────────
  // SLUGIFY
  // ──────────────────────────────────────────────
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 120);
  }

  // ──────────────────────────────────────────────
  // HELPER: load user-specific hierarchy for a category
  // ──────────────────────────────────────────────
  private async getParentIds(categoryId: number, userId: number): Promise<number[]> {
    const rels = await this.relRepo.find({
      where: { childId: categoryId, userId },
    });
    return rels.map((r) => r.parentId);
  }

  private async getChildIds(categoryId: number, userId: number): Promise<number[]> {
    const rels = await this.relRepo.find({
      where: { parentId: categoryId, userId },
    });
    return rels.map((r) => r.childId);
  }

  private async getDefaultParentIds(categoryId: number): Promise<number[]> {
    const rels = await this.relDefaultRepo.find({
      where: { childId: categoryId },
    });
    return rels.map((r) => r.parentId);
  }

  private async getDefaultChildIds(categoryId: number): Promise<number[]> {
    const rels = await this.relDefaultRepo.find({
      where: { parentId: categoryId },
    });
    return rels.map((r) => r.childId);
  }

  // ──────────────────────────────────────────────
  // HELPER: sync parent relationships for a user
  // ──────────────────────────────────────────────
  private async syncUserParents(
    categoryId: number,
    userId: number,
    parentIds: number[],
  ): Promise<void> {
    // Remove existing parent relationships for this user+child
    await this.relRepo.delete({ childId: categoryId, userId });

    // Add new ones
    if (parentIds.length > 0) {
      const validParents = await this.catRepo.findBy({ id: In(parentIds) });
      const entities = validParents.map((p) =>
        this.relRepo.create({ parentId: p.id, childId: categoryId, userId }),
      );
      await this.relRepo.save(entities);
    }
  }

  private async syncDefaultParents(
    categoryId: number,
    parentIds: number[],
  ): Promise<void> {
    // Remove existing default parent relationships
    await this.relDefaultRepo.delete({ childId: categoryId });

    // Add new ones
    if (parentIds.length > 0) {
      const validParents = await this.catRepo.findBy({ id: In(parentIds) });
      const entities = validParents.map((p) =>
        this.relDefaultRepo.create({ parentId: p.id, childId: categoryId }),
      );
      await this.relDefaultRepo.save(entities);
    }
  }

  // ──────────────────────────────────────────────
  // HELPER: resolve full parent chain for category IDs
  // ──────────────────────────────────────────────
  private async resolveParentChain(
    categoryIds: number[],
    userId: number,
  ): Promise<number[]> {
    const allIds = new Set(categoryIds);
    const queue = [...categoryIds];

    while (queue.length > 0) {
      const catId = queue.shift()!;

      // User-specific parents first
      const userRels = await this.relRepo.find({
        where: { childId: catId, userId },
      });
      let parentIds = userRels.map((r) => r.parentId);

      // Fallback to default parents
      if (parentIds.length === 0) {
        const defaultRels = await this.relDefaultRepo.find({
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
  // HELPER: propagate parent change to all affected items
  // ──────────────────────────────────────────────
  private async propagateParentChangeToItems(
    categoryId: number,
  ): Promise<void> {
    // Find all items that have this category (via join table)
    const items = await this.itemRepo
      .createQueryBuilder('item')
      .innerJoinAndSelect('item.categories', 'cat')
      .where(
        `item.id IN (SELECT item_id FROM item_categories WHERE category_id = :catId)`,
        { catId: categoryId },
      )
      .getMany();

    if (items.length === 0) return;

    this.logger.log(
      `Propagating parent change for category ${categoryId} to ${items.length} item(s)`,
    );

    for (const item of items) {
      // Use userCategoryIds if available, otherwise use current categories
      const baseCatIds: number[] =
        item.userCategoryIds && item.userCategoryIds.length > 0
          ? item.userCategoryIds
          : item.categories.map((c) => c.id);

      // Recalculate with new hierarchy
      const resolvedIds = await this.resolveParentChain(baseCatIds, item.userId);

      // Check if anything changed
      const currentIds = new Set(item.categories.map((c) => c.id));
      const newIdSet = new Set(resolvedIds);

      if (
        currentIds.size === newIdSet.size &&
        [...currentIds].every((id) => newIdSet.has(id))
      ) {
        continue; // No change needed
      }

      // Update itemsCount
      for (const catId of currentIds) {
        await this.catRepo.decrement({ id: catId }, 'itemsCount', 1);
      }

      const newCategories = await this.catRepo.findBy({ id: In(resolvedIds) });
      for (const cat of newCategories) {
        await this.catRepo.increment({ id: cat.id }, 'itemsCount', 1);
      }

      item.categories = newCategories;
      await this.itemRepo.save(item);

      this.logger.debug(
        `Item ${item.id} (${item.name}): categories ${[...currentIds]} → ${resolvedIds}`,
      );
    }
  }

  // ──────────────────────────────────────────────
  // CREATE
  // ──────────────────────────────────────────────
  async create(userId: number, dto: CreateCategoryDto) {
    const user = await this.userRepo.findOne({ where: { id: userId } });

    // Only admin can create default categories
    const isAdmin = user?.role === UserRole.ADMIN;
    const isDefault = dto.isDefault && isAdmin;

    // For default categories, userId is null (global)
    const categoryUserId = isDefault ? null : userId;

    // Validate primaryTypeId
    if (!dto.primaryTypeId) {
      throw new BadRequestException("Le type d'objet est obligatoire");
    }
    const primaryType = await this.primaryTypeRepo.findOne({ where: { id: dto.primaryTypeId } });
    if (!primaryType) {
      throw new BadRequestException("Type d'objet introuvable");
    }

    // Vérifier unicité nom pour cet utilisateur (ou parmi les defaults)
    const whereClause = isDefault
      ? { userId: null as any, name: dto.name, isDefault: true }
      : { userId, name: dto.name };
    const existing = await this.catRepo.findOne({ where: whereClause });
    if (existing) {
      throw new ConflictException(
        isDefault
          ? 'Une catégorie par défaut avec ce nom existe déjà'
          : 'Vous avez déjà une catégorie avec ce nom',
      );
    }

    const slug = this.slugify(dto.name);

    const category = this.catRepo.create({
      userId: categoryUserId,
      originalCreatorId: userId,
      primaryTypeId: dto.primaryTypeId,
      name: dto.name,
      slug,
      description: dto.description || null,
      notes: dto.notes || null,
      icon: dto.icon || '📁',
      iconType: dto.iconType || 'emoji',
      color: dto.color || '#3498db',
      defaultProviders: dto.defaultProviders || null,
      isPublic: dto.isPublic || false,
      isDefault: isDefault || false,
    });

    const saved = await this.catRepo.save(category);

    // Ajouter les relations parent-enfant
    if (dto.parentIds && dto.parentIds.length > 0) {
      if (isDefault) {
        await this.syncDefaultParents(saved.id, dto.parentIds);
      } else {
        await this.syncUserParents(saved.id, userId, dto.parentIds);
      }
    }

    // Incrémenter le compteur seulement pour les catégories personnelles
    if (!isDefault) {
      await this.userRepo.increment({ id: userId }, 'categoriesCount', 1);
    }

    this.logger.log(
      `Category created: ${saved.name} (id: ${saved.id}) by user ${userId}${isDefault ? ' [DEFAULT]' : ''}`,
    );

    return {
      success: true,
      message: isDefault ? 'Catégorie par défaut créée' : 'Catégorie créée',
      data: {
        id: saved.id,
        name: saved.name,
        slug: saved.slug,
        isDefault: saved.isDefault,
      },
    };
  }

  // ──────────────────────────────────────────────
  // FIND ALL (with filters)
  // ──────────────────────────────────────────────
  async findAll(userId: number, query: QueryCategoriesDto) {
    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 50, 500);
    const filter = query.filter || 'all';

    const qb = this.catRepo
      .createQueryBuilder('cat')
      .leftJoinAndSelect('cat.user', 'user')
      .leftJoinAndSelect('cat.primaryType', 'primaryType')
      .where('cat.deletedAt IS NULL');

    switch (filter) {
      case 'default':
        qb.andWhere('cat.isDefault = :isDefault', { isDefault: true });
        break;
      case 'public':
        qb.andWhere('cat.isPublic = :isPublic', { isPublic: true });
        break;
      case 'mine':
        qb.andWhere('cat.userId = :userId', { userId });
        break;
      case 'all':
      default:
        // Catégories de l'utilisateur + catégories par défaut + catégories publiques
        qb.andWhere(
          '(cat.userId = :userId OR cat.isDefault = true OR cat.isPublic = true)',
          { userId },
        );
        break;
    }

    if (query.search) {
      qb.andWhere('(cat.name LIKE :search OR cat.description LIKE :search)', {
        search: `%${query.search}%`,
      });
    }

    qb.orderBy('cat.name', 'ASC');

    const total = await qb.getCount();
    const categories = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    // Load hierarchy for each category (default vs user-specific)
    const formatted = await Promise.all(
      categories.map(async (cat) => {
        const parentIds = cat.isDefault
          ? await this.getDefaultParentIds(cat.id)
          : await this.getParentIds(cat.id, userId);
        const childIds = cat.isDefault
          ? await this.getDefaultChildIds(cat.id)
          : await this.getChildIds(cat.id, userId);
        return this.formatCategory(cat, parentIds, childIds);
      }),
    );

    return {
      success: true,
      data: {
        categories: formatted,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    };
  }

  // ──────────────────────────────────────────────
  // FIND ONE
  // ──────────────────────────────────────────────
  async findOne(userId: number, categoryId: number) {
    const category = await this.catRepo.findOne({
      where: { id: categoryId },
      relations: ['user', 'grades', 'primaryType'],
    });

    if (!category) {
      throw new NotFoundException('Catégorie non trouvée');
    }

    // Vérifier accès : propriétaire, publique, par défaut, ou admin
    if (
      category.userId !== userId &&
      !category.isPublic &&
      !category.isDefault
    ) {
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user || user.role !== UserRole.ADMIN) {
        throw new ForbiddenException('Accès non autorisé à cette catégorie');
      }
    }

    // Load hierarchy (default table for default categories, user table otherwise)
    const parentIds = category.isDefault
      ? await this.getDefaultParentIds(categoryId)
      : await this.getParentIds(categoryId, userId);
    const childIds = category.isDefault
      ? await this.getDefaultChildIds(categoryId)
      : await this.getChildIds(categoryId, userId);

    // Load parent/child category details
    const parents = parentIds.length > 0
      ? await this.catRepo.findBy({ id: In(parentIds) })
      : [];
    const children = childIds.length > 0
      ? await this.catRepo.findBy({ id: In(childIds) })
      : [];

    // Load recent items (5 most recent)
    const recentItems = await this.itemRepo
      .createQueryBuilder('item')
      .innerJoin('item.categories', 'cat', 'cat.id = :categoryId', { categoryId })
      .where('item.deletedAt IS NULL')
      .orderBy('item.createdAt', 'DESC')
      .take(5)
      .getMany();

    // Load media counts
    const [imagesCount, videosCount, audioCount, documentsCount] = await Promise.all([
      this.catImageRepo.count({ where: { categoryId } }),
      this.catVideoRepo.count({ where: { categoryId } }),
      this.catAudioRepo.count({ where: { categoryId } }),
      this.catDocRepo.count({ where: { categoryId } }),
    ]);

    const mediaCounts = {
      images: imagesCount,
      videos: videosCount,
      audio: audioCount,
      documents: documentsCount,
    };

    return {
      success: true,
      data: this.formatCategoryDetail(category, parents, children, recentItems, mediaCounts),
    };
  }

  // ──────────────────────────────────────────────
  // UPDATE
  // ──────────────────────────────────────────────
  async update(userId: number, categoryId: number, dto: UpdateCategoryDto) {
    const category = await this.catRepo.findOne({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException('Catégorie non trouvée');
    }

    // Seul le propriétaire ou un admin peut modifier
    const user = await this.userRepo.findOne({ where: { id: userId } });
    const isAdmin = user?.role === UserRole.ADMIN;
    if (category.userId !== userId && !isAdmin) {
      throw new ForbiddenException('Vous ne pouvez pas modifier cette catégorie');
    }

    // On ne peut pas modifier une catégorie par défaut (sauf admin)
    if (category.isDefault && !isAdmin) {
      throw new ForbiddenException('Les catégories par défaut ne peuvent pas être modifiées');
    }

    // Vérifier unicité du nom si changé
    if (dto.name && dto.name !== category.name) {
      const whereClause = category.isDefault
        ? { isDefault: true, name: dto.name, id: Not(categoryId) }
        : { userId: category.userId, name: dto.name, id: Not(categoryId) };
      const existing = await this.catRepo.findOne({ where: whereClause });
      if (existing) {
        throw new ConflictException('Une catégorie avec ce nom existe déjà');
      }
      category.name = dto.name;
      category.slug = this.slugify(dto.name);
    }

    if (dto.description !== undefined) category.description = dto.description || null;
    if (dto.notes !== undefined) category.notes = dto.notes || null;
    if (dto.icon !== undefined) category.icon = dto.icon;
    if (dto.iconType !== undefined) category.iconType = dto.iconType;
    if (dto.color !== undefined) category.color = dto.color;
    if (dto.defaultProviders !== undefined) category.defaultProviders = dto.defaultProviders.length > 0 ? dto.defaultProviders : null;
    if (dto.isPublic !== undefined) category.isPublic = dto.isPublic;

    // Admin can toggle isDefault
    if (dto.isDefault !== undefined && isAdmin) {
      const wasDefault = category.isDefault;
      category.isDefault = dto.isDefault;
      // If making it default, remove userId (global)
      if (dto.isDefault) {
        category.userId = null;
      }
      // Transfer files if isDefault changed
      if (wasDefault !== dto.isDefault) {
        await this.transferCategoryFiles(category, wasDefault, dto.isDefault, userId);
      }
    }

    await this.catRepo.save(category);

    // Mettre à jour les parents si fournis
    if (dto.parentIds !== undefined) {
      if (category.isDefault) {
        await this.syncDefaultParents(categoryId, dto.parentIds);
      } else {
        await this.syncUserParents(categoryId, userId, dto.parentIds);
      }

      // Propagate parent change to all items that have this category
      await this.propagateParentChangeToItems(categoryId);
    }

    this.logger.log(`Category updated: ${category.name} (id: ${category.id})`);

    return {
      success: true,
      message: 'Catégorie mise à jour',
    };
  }

  // ──────────────────────────────────────────────
  // DELETE (soft)
  // ──────────────────────────────────────────────
  async remove(userId: number, categoryId: number) {
    const category = await this.catRepo.findOne({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException('Catégorie non trouvée');
    }

    // Seul le propriétaire ou un admin peut supprimer
    const user = await this.userRepo.findOne({ where: { id: userId } });
    const isAdmin = user?.role === UserRole.ADMIN;
    if (category.userId !== userId && !isAdmin) {
      throw new ForbiddenException('Vous ne pouvez pas supprimer cette catégorie');
    }

    // Default categories can be deleted by admin
    if (category.isDefault && !isAdmin) {
      throw new ForbiddenException('Les catégories par défaut ne peuvent pas être supprimées');
    }

    // Clean up relationships
    await this.relRepo.delete({ parentId: categoryId });
    await this.relRepo.delete({ childId: categoryId });
    if (category.isDefault) {
      await this.relDefaultRepo.delete({ parentId: categoryId });
      await this.relDefaultRepo.delete({ childId: categoryId });
    }

    // Clean up physical media files
    await this.cleanupCategoryFiles(category);

    await this.catRepo.softRemove(category);

    // Décrémenter le compteur
    if (category.userId) {
      await this.userRepo.decrement({ id: category.userId }, 'categoriesCount', 1);
    }

    this.logger.log(`Category deleted: ${category.name} (id: ${category.id})`);

    return {
      success: true,
      message: 'Catégorie supprimée',
    };
  }

  // ──────────────────────────────────────────────
  // COPY
  // ──────────────────────────────────────────────
  async copy(userId: number, categoryId: number, dto: CopyCategoryDto) {
    const source = await this.catRepo.findOne({
      where: { id: categoryId },
      relations: ['grades'],
    });

    if (!source) {
      throw new NotFoundException('Catégorie source non trouvée');
    }

    // Vérifier accès : propriétaire, publique, par défaut, ou admin
    if (
      source.userId !== userId &&
      !source.isPublic &&
      !source.isDefault
    ) {
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user || user.role !== UserRole.ADMIN) {
        throw new ForbiddenException('Accès non autorisé à cette catégorie');
      }
    }

    const newName = dto.name || `${source.name} (copie)`;

    // Vérifier unicité du nom
    const existing = await this.catRepo.findOne({
      where: { userId, name: newName },
    });
    if (existing) {
      throw new ConflictException('Vous avez déjà une catégorie avec ce nom');
    }

    const copy = this.catRepo.create({
      userId,
      originalCreatorId: source.originalCreatorId || source.userId,
      primaryTypeId: source.primaryTypeId,
      name: newName,
      slug: this.slugify(newName),
      description: source.description,
      notes: source.notes,
      icon: source.icon,
      iconType: source.iconType,
      color: source.color,
      defaultProviders: source.defaultProviders,
      isPublic: false,
      isDefault: false,
    });

    const saved = await this.catRepo.save(copy);

    // Copy grades associations
    if (source.grades && source.grades.length > 0) {
      const gradeIds = source.grades.map((g) => g.id);
      const grades = await this.gradeRepo.findBy({ id: In(gradeIds) });
      // Use query builder to insert into category_grades directly
      for (const grade of grades) {
        await this.gradeRepo
          .createQueryBuilder()
          .relation(Grade, 'categories')
          .of(grade.id)
          .add(saved.id);
      }
    }

    // Copy hierarchy: replicate parent relationships from source
    const sourceParentIds = source.isDefault
      ? await this.getDefaultParentIds(categoryId)
      : await this.getParentIds(categoryId, source.userId || userId);

    if (sourceParentIds.length > 0) {
      await this.syncUserParents(saved.id, userId, sourceParentIds);
    }

    // Copy category-level EAV fields
    const sourceFields = await this.catFieldRepo.find({
      where: { categoryId },
      order: { sortOrder: 'ASC' },
    });
    if (sourceFields.length > 0) {
      const fieldCopies = sourceFields.map((f) =>
        this.catFieldRepo.create({
          categoryId: saved.id,
          fieldKey: f.fieldKey,
          fieldNameFr: f.fieldNameFr,
          fieldNameEn: f.fieldNameEn,
          fieldType: f.fieldType,
          fieldOptions: f.fieldOptions,
          placeholderFr: f.placeholderFr,
          placeholderEn: f.placeholderEn,
          helpTextFr: f.helpTextFr,
          helpTextEn: f.helpTextEn,
          icon: f.icon,
          isRequired: f.isRequired,
          isSearchable: f.isSearchable,
          isFilterable: f.isFilterable,
          sortOrder: f.sortOrder,
        }),
      );
      await this.catFieldRepo.save(fieldCopies);
    }

    // Copy media files if requested
    if (dto.copyMedia) {
      await this.copyMediaFiles(source, saved, userId);
    }

    // Incrémenter le compteur
    await this.userRepo.increment({ id: userId }, 'categoriesCount', 1);

    this.logger.log(
      `Category copied: ${source.name} -> ${saved.name} (id: ${saved.id}) by user ${userId}`,
    );

    return {
      success: true,
      message: 'Catégorie copiée',
      data: {
        id: saved.id,
        name: saved.name,
        slug: saved.slug,
      },
    };
  }

  // ──────────────────────────────────────────────
  // UPDATE GRADES
  // ──────────────────────────────────────────────
  async updateGrades(userId: number, categoryId: number, dto: UpdateCategoryGradesDto) {
    const category = await this.catRepo.findOne({
      where: { id: categoryId },
      relations: ['grades'],
    });

    if (!category) {
      throw new NotFoundException('Catégorie non trouvée');
    }

    // Seul le propriétaire ou un admin peut modifier les grades
    const user = await this.userRepo.findOne({ where: { id: userId } });
    const isAdmin = user?.role === UserRole.ADMIN;
    if (category.userId !== userId && !isAdmin) {
      throw new ForbiddenException('Vous ne pouvez pas modifier cette catégorie');
    }

    if (category.isDefault && !isAdmin) {
      throw new ForbiddenException('Les catégories par défaut ne peuvent pas être modifiées');
    }

    // Validate grade IDs exist
    const grades = dto.gradeIds.length > 0
      ? await this.gradeRepo.findBy({ id: In(dto.gradeIds) })
      : [];

    if (dto.gradeIds.length > 0 && grades.length !== dto.gradeIds.length) {
      throw new BadRequestException('Certains grades sont introuvables');
    }

    // Remove all current grade associations
    const currentGradeIds = category.grades.map((g) => g.id);
    for (const gId of currentGradeIds) {
      await this.gradeRepo
        .createQueryBuilder()
        .relation(Grade, 'categories')
        .of(gId)
        .remove(categoryId);
    }

    // Add new ones
    for (const grade of grades) {
      await this.gradeRepo
        .createQueryBuilder()
        .relation(Grade, 'categories')
        .of(grade.id)
        .add(categoryId);
    }

    this.logger.log(
      `Category grades updated: ${category.name} (id: ${categoryId}) - ${grades.length} grades`,
    );

    return {
      success: true,
      message: 'Grades mis à jour',
      data: {
        gradeIds: grades.map((g) => g.id),
      },
    };
  }

  // ──────────────────────────────────────────────
  // GET ITEMS
  // ──────────────────────────────────────────────
  async getItems(userId: number, categoryId: number, query: QueryCategoryItemsDto) {
    const category = await this.catRepo.findOne({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException('Catégorie non trouvée');
    }

    // Vérifier accès
    if (
      category.userId !== userId &&
      !category.isPublic &&
      !category.isDefault
    ) {
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user || user.role !== UserRole.ADMIN) {
        throw new ForbiddenException('Accès non autorisé à cette catégorie');
      }
    }

    const page = Number(query.page) || 1;
    const limit = Math.min(Number(query.limit) || 50, 100);
    const sort = query.sort || 'createdAt';
    const order = (query.order || 'desc').toUpperCase() as 'ASC' | 'DESC';

    const sortColumn = {
      name: 'item.name',
      createdAt: 'item.createdAt',
      rating: 'item.rating',
      value: 'item.marketValue',
    }[sort] || 'item.createdAt';

    const qb = this.itemRepo
      .createQueryBuilder('item')
      .innerJoin('item.categories', 'cat', 'cat.id = :categoryId', { categoryId })
      .where('item.deletedAt IS NULL')
      .orderBy(sortColumn, order);

    const total = await qb.getCount();
    const items = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      success: true,
      data: {
        items: items.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description,
          rating: item.rating,
          marketValue: item.marketValue,
          createdAt: item.createdAt,
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    };
  }

  // ──────────────────────────────────────────────
  // IMPORT DEFAULT HIERARCHY
  // ──────────────────────────────────────────────
  async importDefaults(userId: number) {
    // Get all default relationships
    const defaults = await this.relDefaultRepo.find();

    if (defaults.length === 0) {
      return {
        success: true,
        message: 'Aucune hiérarchie par défaut à importer',
        data: { imported: 0, skipped: 0, total: 0 },
      };
    }

    let imported = 0;
    let skipped = 0;

    for (const def of defaults) {
      // Check if this relationship already exists for the user
      const existing = await this.relRepo.findOne({
        where: { parentId: def.parentId, childId: def.childId, userId },
      });

      if (existing) {
        skipped++;
        continue;
      }

      const rel = this.relRepo.create({
        parentId: def.parentId,
        childId: def.childId,
        userId,
      });
      await this.relRepo.save(rel);
      imported++;
    }

    this.logger.log(
      `Default hierarchy imported for user ${userId}: ${imported} imported, ${skipped} skipped`,
    );

    return {
      success: true,
      message: 'Hiérarchie par défaut importée',
      data: { imported, skipped, total: defaults.length },
    };
  }

  // ──────────────────────────────────────────────
  // DEFAULT PARENTS (admin)
  // ──────────────────────────────────────────────
  async getDefaultParentsForCategory(userId: number, categoryId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user || user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Réservé aux administrateurs');
    }

    const category = await this.catRepo.findOne({ where: { id: categoryId } });
    if (!category) {
      throw new NotFoundException('Catégorie non trouvée');
    }

    const parentIds = await this.getDefaultParentIds(categoryId);

    return {
      success: true,
      data: {
        categoryId,
        defaultParentIds: parentIds,
      },
    };
  }

  async updateDefaultParents(userId: number, categoryId: number, parentIds: number[]) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user || user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Réservé aux administrateurs');
    }

    const category = await this.catRepo.findOne({ where: { id: categoryId } });
    if (!category) {
      throw new NotFoundException('Catégorie non trouvée');
    }

    await this.syncDefaultParents(categoryId, parentIds);

    // Propagate parent change to all items that have this category
    await this.propagateParentChangeToItems(categoryId);

    this.logger.log(`Default parents updated for category ${category.name} (id: ${categoryId})`);

    return {
      success: true,
      message: 'Parents par défaut mis à jour',
    };
  }

  // ──────────────────────────────────────────────
  // TRANSFER FILES (isDefault toggle)
  // ──────────────────────────────────────────────
  private async transferCategoryFiles(
    category: Category,
    wasDefault: boolean,
    isNowDefault: boolean,
    userId: number,
  ): Promise<void> {
    const catId = String(category.id);

    let srcBase: string;
    let destBase: string;
    let srcUrlPrefix: string;
    let destUrlPrefix: string;

    if (isNowDefault && !wasDefault) {
      // User → Default
      srcBase = path.join(this.storagePath, 'users', String(userId), 'Categories', catId);
      destBase = path.join(this.storagePath, 'default_categories', catId);
      srcUrlPrefix = `/storage/users/${userId}/Categories/${catId}`;
      destUrlPrefix = `/storage/default_categories/${catId}`;
    } else if (!isNowDefault && wasDefault) {
      // Default → User
      srcBase = path.join(this.storagePath, 'default_categories', catId);
      destBase = path.join(this.storagePath, 'users', String(userId), 'Categories', catId);
      srcUrlPrefix = `/storage/default_categories/${catId}`;
      destUrlPrefix = `/storage/users/${userId}/Categories/${catId}`;
    } else {
      return; // No change
    }

    try {
      // Move directory if it exists
      try {
        await fs.access(srcBase);
        await fs.mkdir(destBase, { recursive: true });
        await this.moveDirectory(srcBase, destBase);
      } catch {
        // Source doesn't exist, nothing to move
        this.logger.log(`No files to transfer for category ${catId}`);
      }

      // Update URLs in media tables
      const mediaRepos: Array<{ repo: Repository<any>; fields: string[] }> = [
        { repo: this.catImageRepo, fields: ['url', 'thumbnailUrl'] },
        { repo: this.catVideoRepo, fields: ['url', 'thumbnailUrl'] },
        { repo: this.catAudioRepo, fields: ['url'] },
        { repo: this.catDocRepo, fields: ['url'] },
      ];

      for (const { repo, fields } of mediaRepos) {
        const medias = await repo.find({ where: { categoryId: category.id } });
        for (const media of medias) {
          let updated = false;
          for (const field of fields) {
            if (media[field] && (media[field] as string).startsWith(srcUrlPrefix)) {
              media[field] = (media[field] as string).replace(srcUrlPrefix, destUrlPrefix);
              updated = true;
            }
          }
          if (updated) {
            await repo.save(media);
          }
        }
      }

      // Update icon URL if it's a file path
      if (category.iconType === 'url' && category.icon.startsWith(srcUrlPrefix)) {
        category.icon = category.icon.replace(srcUrlPrefix, destUrlPrefix);
      }

      this.logger.log(
        `Files transferred for category ${catId}: ${wasDefault ? 'default' : 'user'} → ${isNowDefault ? 'default' : 'user'}`,
      );
    } catch (err) {
      this.logger.error(`Error transferring files for category ${catId}: ${err.message}`);
    }
  }

  private async moveDirectory(src: string, dest: string): Promise<void> {
    const entries = await fs.readdir(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        await fs.mkdir(destPath, { recursive: true });
        await this.moveDirectory(srcPath, destPath);
      } else {
        await fs.copyFile(srcPath, destPath);
      }
    }
    // Remove source
    await fs.rm(src, { recursive: true, force: true });
  }

  // ──────────────────────────────────────────────
  // CLEANUP FILES (on delete)
  // ──────────────────────────────────────────────
  private async cleanupCategoryFiles(category: Category): Promise<void> {
    const catId = String(category.id);
    let dirPath: string;

    if (category.isDefault && !category.userId) {
      dirPath = path.join(this.storagePath, 'default_categories', catId);
    } else if (category.userId) {
      dirPath = path.join(this.storagePath, 'users', String(category.userId), 'Categories', catId);
    } else {
      return;
    }

    try {
      await fs.access(dirPath);
      await fs.rm(dirPath, { recursive: true, force: true });
      this.logger.log(`Cleaned up files for category ${catId}: ${dirPath}`);
    } catch {
      // Directory doesn't exist, nothing to clean
    }
  }

  // ──────────────────────────────────────────────
  // COPY MEDIA FILES
  // ──────────────────────────────────────────────
  private async copyMediaFiles(
    source: Category,
    target: Category,
    userId: number,
  ): Promise<void> {
    const mediaTypes = ['images', 'videos', 'audio', 'documents'] as const;

    for (const mediaType of mediaTypes) {
      const repo = this.getMediaRepo(mediaType);
      const items = await repo.find({
        where: { categoryId: source.id },
        order: { displayOrder: 'ASC' },
      });

      if (items.length === 0) continue;

      // Source dir
      let srcDir: string;
      if (source.isDefault && !source.userId) {
        srcDir = path.join(this.storagePath, 'default_categories', String(source.id), mediaType);
      } else {
        srcDir = path.join(this.storagePath, 'users', String(source.userId), 'Categories', String(source.id), mediaType);
      }

      // Dest dir
      const destDir = path.join(
        this.storagePath, 'users', String(userId), 'Categories', String(target.id), mediaType,
      );
      await fs.mkdir(destDir, { recursive: true });

      for (const item of items) {
        try {
          // Extract filename from url
          const filename = path.basename(item.url);
          const srcFile = path.join(srcDir, filename);
          const destFile = path.join(destDir, filename);

          await fs.copyFile(srcFile, destFile);

          const newUrl = `/storage/users/${userId}/Categories/${target.id}/${mediaType}/${filename}`;

          const entityData: any = {
            categoryId: target.id,
            url: newUrl,
            title: item.title,
            filename: item.filename,
            mimeType: item.mimeType,
            size: item.size,
            displayOrder: item.displayOrder,
          };

          if (mediaType === 'images') {
            entityData.thumbnailUrl = newUrl;
            entityData.width = item.width;
            entityData.height = item.height;

            // Copy thumbnail if it exists and is different
            if (item.thumbnailUrl && item.thumbnailUrl !== item.url) {
              const thumbFilename = path.basename(item.thumbnailUrl);
              const srcThumbDir = path.join(srcDir, 'thumbs');
              const destThumbDir = path.join(destDir, 'thumbs');
              try {
                await fs.mkdir(destThumbDir, { recursive: true });
                await fs.copyFile(
                  path.join(srcThumbDir, thumbFilename),
                  path.join(destThumbDir, thumbFilename),
                );
                entityData.thumbnailUrl = `/storage/users/${userId}/Categories/${target.id}/${mediaType}/thumbs/${thumbFilename}`;
              } catch {
                // Thumbnail copy failed, use main URL
              }
            }
          }
          if (mediaType === 'videos') {
            entityData.duration = item.duration;
            entityData.thumbnailUrl = item.thumbnailUrl ? newUrl : null;
          }
          if (mediaType === 'audio') {
            entityData.duration = item.duration;
          }

          const entity = repo.create(entityData);
          await repo.save(entity);
        } catch (err) {
          this.logger.warn(`Failed to copy media file ${item.url}: ${err.message}`);
        }
      }
    }

    this.logger.log(
      `Media files copied from category ${source.id} to ${target.id}`,
    );
  }

  private getMediaRepo(mediaType: string): Repository<any> {
    switch (mediaType) {
      case 'images': return this.catImageRepo;
      case 'videos': return this.catVideoRepo;
      case 'audio': return this.catAudioRepo;
      case 'documents': return this.catDocRepo;
      default: throw new BadRequestException(`Invalid media type: ${mediaType}`);
    }
  }

  // ──────────────────────────────────────────────
  // FORMAT HELPERS
  // ──────────────────────────────────────────────
  private formatCategory(
    cat: Category,
    parentIds: number[],
    childIds: number[],
  ) {
    return {
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      icon: cat.icon,
      iconType: cat.iconType,
      color: cat.color,
      isDefault: cat.isDefault,
      isPublic: cat.isPublic,
      itemsCount: cat.itemsCount,
      primaryTypeId: cat.primaryTypeId,
      primaryType: cat.primaryType
        ? {
            id: cat.primaryType.id,
            key: cat.primaryType.keyName,
            name: cat.primaryType.nameFr,
            icon: cat.primaryType.icon,
            color: cat.primaryType.color,
          }
        : null,
      defaultProviders: cat.defaultProviders || [],
      owner: cat.user
        ? { id: cat.user.id, username: cat.user.username }
        : null,
      parentIds,
      childIds,
      createdAt: cat.createdAt,
    };
  }

  private formatCategoryDetail(
    cat: Category,
    parents: Category[],
    children: Category[],
    recentItems: Item[],
    mediaCounts: { images: number; videos: number; audio: number; documents: number },
  ) {
    return {
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      notes: cat.notes,
      icon: cat.icon,
      iconType: cat.iconType,
      color: cat.color,
      isDefault: cat.isDefault,
      isPublic: cat.isPublic,
      itemsCount: cat.itemsCount,
      primaryTypeId: cat.primaryTypeId,
      primaryType: cat.primaryType
        ? {
            id: cat.primaryType.id,
            key: cat.primaryType.keyName,
            name: cat.primaryType.nameFr,
            icon: cat.primaryType.icon,
            color: cat.primaryType.color,
          }
        : null,
      defaultProviders: cat.defaultProviders || [],
      owner: cat.user
        ? {
            id: cat.user.id,
            username: cat.user.username,
            avatarUrl: cat.user.avatarUrl,
          }
        : null,
      parentIds: parents.map((p) => p.id),
      childIds: children.map((c) => c.id),
      parents: parents.map((p) => ({
        id: p.id,
        name: p.name,
        icon: p.icon,
        color: p.color,
      })),
      children: children.map((c) => ({
        id: c.id,
        name: c.name,
        icon: c.icon,
        color: c.color,
      })),
      grades: cat.grades
        ? cat.grades.map((g) => ({
            id: g.id,
            name: g.name,
            description: g.description,
          }))
        : [],
      mediaCounts,
      recentItems: recentItems.map((item) => ({
        id: item.id,
        name: item.name,
      })),
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt,
    };
  }

  // ──────────────────────────────────────────────
  // CATEGORY FIELDS (admin-only, default categories)
  // ──────────────────────────────────────────────

  /**
   * Vérifier que l'utilisateur est admin et que la catégorie est par défaut.
   */
  private async assertAdminAndDefaultCategory(
    userId: number,
    categoryId: number,
  ): Promise<Category> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user || user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Réservé aux administrateurs');
    }
    const category = await this.catRepo.findOne({ where: { id: categoryId } });
    if (!category) {
      throw new NotFoundException('Catégorie introuvable');
    }
    if (!category.isDefault) {
      throw new ForbiddenException(
        'Les champs personnalisés ne sont disponibles que pour les catégories par défaut',
      );
    }
    return category;
  }

  /**
   * Lister les champs d'une catégorie (public, pas besoin d'être admin).
   */
  async getCategoryFields(categoryId: number) {
    const category = await this.catRepo.findOne({ where: { id: categoryId } });
    if (!category) {
      throw new NotFoundException('Catégorie introuvable');
    }

    const fields = await this.catFieldRepo.find({
      where: { categoryId },
      order: { sortOrder: 'ASC', id: 'ASC' },
    });

    return {
      success: true,
      message: `${fields.length} champ(s) trouvé(s)`,
      data: fields.map((f) => ({
        id: f.id,
        categoryId: f.categoryId,
        key: f.fieldKey,
        name: f.fieldNameFr,
        nameEn: f.fieldNameEn,
        type: f.fieldType,
        options: f.fieldOptions,
        placeholder: f.placeholderFr,
        placeholderEn: f.placeholderEn,
        helpText: f.helpTextFr,
        helpTextEn: f.helpTextEn,
        icon: f.icon,
        isRequired: f.isRequired,
        isSearchable: f.isSearchable,
        isFilterable: f.isFilterable,
        sortOrder: f.sortOrder,
      })),
    };
  }

  /**
   * Créer un champ pour une catégorie (admin).
   */
  async createCategoryField(
    userId: number,
    categoryId: number,
    dto: CreateCategoryFieldDto,
  ) {
    await this.assertAdminAndDefaultCategory(userId, categoryId);

    // Vérifier unicité de la clé dans cette catégorie
    const existing = await this.catFieldRepo.findOne({
      where: { categoryId, fieldKey: dto.fieldKey },
    });
    if (existing) {
      throw new ConflictException(
        `Le champ "${dto.fieldKey}" existe déjà dans cette catégorie`,
      );
    }

    const field = this.catFieldRepo.create({
      categoryId,
      ...dto,
    });
    const saved = await this.catFieldRepo.save(field);
    this.logger.log(
      `Champ "${dto.fieldKey}" créé pour catégorie #${categoryId}`,
    );

    return {
      success: true,
      message: 'Champ créé',
      data: saved,
    };
  }

  /**
   * Modifier un champ d'une catégorie (admin).
   */
  async updateCategoryField(
    userId: number,
    categoryId: number,
    fieldId: number,
    dto: UpdateCategoryFieldDto,
  ) {
    await this.assertAdminAndDefaultCategory(userId, categoryId);

    const field = await this.catFieldRepo.findOne({
      where: { id: fieldId, categoryId },
    });
    if (!field) {
      throw new NotFoundException('Champ introuvable dans cette catégorie');
    }

    Object.assign(field, dto);
    const saved = await this.catFieldRepo.save(field);
    this.logger.log(
      `Champ #${fieldId} mis à jour pour catégorie #${categoryId}`,
    );

    return {
      success: true,
      message: 'Champ mis à jour',
      data: saved,
    };
  }

  /**
   * Supprimer un champ d'une catégorie (admin).
   * Supprime aussi les métadonnées associées (CASCADE).
   */
  async deleteCategoryField(
    userId: number,
    categoryId: number,
    fieldId: number,
  ) {
    await this.assertAdminAndDefaultCategory(userId, categoryId);

    const field = await this.catFieldRepo.findOne({
      where: { id: fieldId, categoryId },
    });
    if (!field) {
      throw new NotFoundException('Champ introuvable dans cette catégorie');
    }

    await this.catFieldRepo.remove(field);
    this.logger.log(
      `Champ #${fieldId} supprimé de catégorie #${categoryId}`,
    );

    return {
      success: true,
      message: 'Champ supprimé',
    };
  }
}
