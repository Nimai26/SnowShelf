import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';
import { User, CollectionsVisibility } from '../../database/entities/user.entity';
import { Category } from '../../database/entities/category.entity';
import { Item } from '../../database/entities/item.entity';
import { Friendship, FriendshipStatus } from '../../database/entities/friendship.entity';
import { FieldType } from '../../database/entities/primary-type-field.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private readonly BCRYPT_ROUNDS = 12;

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Category)
    private readonly catRepo: Repository<Category>,
    @InjectRepository(Item)
    private readonly itemRepo: Repository<Item>,
    @InjectRepository(Friendship)
    private readonly friendshipRepo: Repository<Friendship>,
  ) {}

  // ──────────────────────────────────────────────
  // GET PROFILE
  // ──────────────────────────────────────────────
  async getProfile(userId: number) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    return {
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        isPremium: user.role === 'premium' || user.role === 'admin',
        isAdmin: user.role === 'admin',
        avatarUrl: user.avatarUrl,
        backgroundUrl: user.backgroundUrl,
        bio: user.bio,
        theme: user.theme,
        lang: user.lang,
        newsletter: user.newsletter,
        collectionsVisibility: user.collectionsVisibility,
        showEmail: user.showEmail,
        friendRequestPolicy: user.friendRequestPolicy,
        itemsCount: user.itemsCount,
        categoriesCount: user.categoriesCount,
        totalValue: user.totalValue,
        createdAt: user.createdAt,
      },
    };
  }

  // ──────────────────────────────────────────────
  // UPDATE PROFILE
  // ──────────────────────────────────────────────
  async updateProfile(userId: number, dto: UpdateProfileDto) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Mettre à jour uniquement les champs fournis
    const updateData: Partial<User> = {};
    if (dto.theme !== undefined) updateData.theme = dto.theme;
    if (dto.lang !== undefined) updateData.lang = dto.lang;
    if (dto.newsletter !== undefined) updateData.newsletter = dto.newsletter;
    if (dto.bio !== undefined) updateData.bio = dto.bio;
    if (dto.collectionsVisibility !== undefined) {
      updateData.collectionsVisibility = dto.collectionsVisibility as any;
    }
    if (dto.showEmail !== undefined) updateData.showEmail = dto.showEmail;
    if (dto.friendRequestPolicy !== undefined) {
      updateData.friendRequestPolicy = dto.friendRequestPolicy as any;
    }

    await this.usersRepository.update(userId, updateData);

    return this.getProfile(userId);
  }

  // ──────────────────────────────────────────────
  // CHANGE PASSWORD
  // ──────────────────────────────────────────────
  async changePassword(userId: number, dto: ChangePasswordDto) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: ['id', 'passwordHash'],
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Vérifier le mot de passe actuel
    const isCurrentValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      throw new UnauthorizedException('Mot de passe actuel incorrect');
    }

    // Hasher et sauvegarder le nouveau mot de passe
    const newPasswordHash = await bcrypt.hash(dto.newPassword, this.BCRYPT_ROUNDS);
    await this.usersRepository.update(userId, {
      passwordHash: newPasswordHash,
      refreshTokenHash: null, // Invalider les sessions existantes
    });

    return {
      success: true,
      message: 'Mot de passe modifié avec succès',
    };
  }

  // ──────────────────────────────────────────────
  // FIND BY ID (usage interne)
  // ──────────────────────────────────────────────
  async findById(userId: number): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id: userId } });
  }

  // ──────────────────────────────────────────────
  // UPLOAD AVATAR
  // ──────────────────────────────────────────────
  async uploadAvatar(userId: number, file: Express.Multer.File) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Créer le dossier avatars s'il n'existe pas
    const avatarsDir = path.join(process.cwd(), 'storage', 'avatars');
    if (!fs.existsSync(avatarsDir)) {
      fs.mkdirSync(avatarsDir, { recursive: true });
    }

    // Supprimer l'ancien avatar si existant
    if (user.avatarUrl) {
      const oldPath = path.join(process.cwd(), 'storage', user.avatarUrl.replace('/storage/', ''));
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // Sauvegarder le fichier
    const ext = path.extname(file.originalname) || '.jpg';
    const filename = `avatar-${userId}-${Date.now()}${ext}`;
    const filePath = path.join(avatarsDir, filename);
    fs.writeFileSync(filePath, file.buffer);

    // Mettre à jour l'URL en BDD
    const avatarUrl = `/storage/avatars/${filename}`;
    await this.usersRepository.update(userId, { avatarUrl });

    this.logger.log(`Avatar uploaded for user ${userId}: ${filename}`);

    return {
      success: true,
      data: { avatarUrl },
    };
  }

  // ──────────────────────────────────────────────
  // EXPLORE — Search public users
  // ──────────────────────────────────────────────
  async searchPublicUsers(search?: string, page = 1, limit = 20) {
    limit = Math.min(limit, 50);

    const qb = this.usersRepository
      .createQueryBuilder('u')
      .select([
        'u.id',
        'u.username',
        'u.avatarUrl',
        'u.bio',
        'u.itemsCount',
        'u.categoriesCount',
        'u.createdAt',
      ])
      .where('u.collectionsVisibility = :visibility', {
        visibility: CollectionsVisibility.PUBLIC,
      });

    if (search) {
      qb.andWhere('u.username LIKE :search', {
        search: `%${search}%`,
      });
    }

    qb.orderBy('u.itemsCount', 'DESC');

    const total = await qb.getCount();
    const users = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      success: true,
      data: {
        users: users.map((u) => ({
          id: u.id,
          username: u.username,
          avatarUrl: u.avatarUrl,
          bio: u.bio,
          itemsCount: u.itemsCount,
          categoriesCount: u.categoriesCount,
          createdAt: u.createdAt,
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
  // EXPLORE — Get public profile
  // ──────────────────────────────────────────────
  async getPublicProfile(username: string, requesterId: number) {
    const user = await this.usersRepository.findOne({
      where: { username },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Owner can always see their own profile
    if (user.id !== requesterId) {
      await this.checkVisibility(user, requesterId);
    }

    return {
      success: true,
      data: {
        id: user.id,
        username: user.username,
        avatarUrl: user.avatarUrl,
        backgroundUrl: user.backgroundUrl,
        bio: user.bio,
        email: user.showEmail ? user.email : null,
        itemsCount: user.itemsCount,
        categoriesCount: user.categoriesCount,
        collectionsVisibility: user.collectionsVisibility,
        friendRequestPolicy: user.friendRequestPolicy,
        isOwner: user.id === requesterId,
        createdAt: user.createdAt,
      },
    };
  }

  // ──────────────────────────────────────────────
  // EXPLORE — Get public categories
  // ──────────────────────────────────────────────
  async getPublicCategories(
    username: string,
    requesterId: number,
    page = 1,
    limit = 50,
    search?: string,
  ) {
    const user = await this.usersRepository.findOne({
      where: { username },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    if (user.id !== requesterId) {
      await this.checkVisibility(user, requesterId);
    }

    limit = Math.min(limit, 100);

    // Find categories that contain items owned by this user
    // (includes default/public categories, not just user-owned ones)
    const qb = this.catRepo
      .createQueryBuilder('cat')
      .leftJoinAndSelect('cat.primaryType', 'pt')
      .innerJoin('item_categories', 'ic', 'ic.category_id = cat.id')
      .innerJoin('items', 'item', 'item.id = ic.item_id AND item.user_id = :userId AND item.deleted_at IS NULL', { userId: user.id })
      .where('cat.deletedAt IS NULL')
      .groupBy('cat.id')
      .addGroupBy('pt.id')
      .addSelect('COUNT(DISTINCT item.id)', 'userItemsCount');

    if (search) {
      qb.andWhere('cat.name LIKE :search', {
        search: `%${search}%`,
      });
    }

    qb.orderBy('cat.name', 'ASC');

    const rawAndEntities = await qb.getRawAndEntities();

    const total = rawAndEntities.entities.length;
    const start = (page - 1) * limit;
    const paged = rawAndEntities.entities.slice(start, start + limit);
    const pagedRaw = rawAndEntities.raw.slice(start, start + limit);

    return {
      success: true,
      data: {
        categories: paged.map((cat, i) => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          description: cat.description,
          icon: cat.icon,
          iconType: cat.iconType,
          color: cat.color,
          itemsCount: Number(pagedRaw[i]?.userItemsCount || 0),
          primaryType: cat.primaryType
            ? {
                id: cat.primaryType.id,
                key: cat.primaryType.keyName,
                name: cat.primaryType.nameFr,
                icon: cat.primaryType.icon,
                color: cat.primaryType.color,
              }
            : null,
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
  // EXPLORE — Get public items of a category
  // ──────────────────────────────────────────────
  async getPublicCategoryItems(
    username: string,
    categoryId: number,
    requesterId: number,
    page = 1,
    limit = 50,
    sort = 'createdAt',
    order = 'desc',
    search?: string,
  ) {
    const user = await this.usersRepository.findOne({
      where: { username },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    if (user.id !== requesterId) {
      await this.checkVisibility(user, requesterId);
    }

    // Verify category exists (can be user-owned, default, or public)
    const category = await this.catRepo.findOne({
      where: { id: categoryId },
    });

    if (!category || category.deletedAt) {
      throw new NotFoundException('Catégorie non trouvée');
    }

    limit = Math.min(limit, 100);

    const qb = this.itemRepo
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.primaryType', 'pt')
      .leftJoinAndSelect('item.categories', 'cat')
      .leftJoinAndSelect('item.status', 'status')
      .leftJoinAndSelect('item.images', 'img')
      .where('item.userId = :userId', { userId: user.id })
      .andWhere('item.deletedAt IS NULL')
      .andWhere('cat.id = :categoryId', { categoryId });

    if (search) {
      qb.andWhere(
        '(item.name LIKE :search OR item.description LIKE :search)',
        { search: `%${search}%` },
      );
    }

    const sortMap: Record<string, string> = {
      name: 'item.name',
      createdAt: 'item.createdAt',
      value: 'item.marketValue',
      rating: 'item.rating',
    };
    qb.orderBy(
      sortMap[sort] || 'item.createdAt',
      order.toUpperCase() as 'ASC' | 'DESC',
    );

    const total = await qb.getCount();
    const items = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      success: true,
      data: {
        category: {
          id: category.id,
          name: category.name,
          icon: category.icon,
          color: category.color,
        },
        items: items.map((item) => {
          const sortedImages = (item.images || []).sort(
            (a, b) => a.displayOrder - b.displayOrder,
          );
          const firstImage = sortedImages[0] || null;
          return {
            id: item.id,
            name: item.name,
            description: item.description,
            primaryType: item.primaryType
              ? {
                  key: item.primaryType.keyName,
                  name: item.primaryType.nameFr,
                  icon: item.primaryType.icon,
                }
              : null,
            rating: item.rating,
            marketValue: item.marketValue != null ? Number(item.marketValue) : null,
            status: item.status
              ? {
                  id: item.status.id,
                  name: item.status.name,
                  color: item.status.color,
                  icon: item.status.icon,
                }
              : null,
            thumbnailUrl: firstImage?.thumbnailUrl || null,
            imageUrl: firstImage?.url || null,
            createdAt: item.createdAt,
          };
        }),
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
  // EXPLORE — Get public items (with full filters)
  // ──────────────────────────────────────────────
  async getPublicItems(
    username: string,
    requesterId: number,
    query: {
      page?: number;
      limit?: number;
      search?: string;
      sort?: string;
      order?: string;
      categoryId?: number;
      searchState?: string;
      statusId?: number;
      primaryTypeId?: number;
      minRating?: number;
      minValue?: number;
      maxValue?: number;
      dateFrom?: string;
      dateTo?: string;
    },
  ) {
    const user = await this.usersRepository.findOne({ where: { username } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    if (user.id !== requesterId) await this.checkVisibility(user, requesterId);

    const page = query.page || 1;
    const limit = Math.min(query.limit || 24, 100);
    const sort = query.sort || 'createdAt';
    const order = (query.order || 'desc').toUpperCase() as 'ASC' | 'DESC';

    const qb = this.itemRepo
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.primaryType', 'pt')
      .leftJoinAndSelect('item.categories', 'cat')
      .leftJoinAndSelect('item.status', 'status')
      .leftJoinAndSelect('item.images', 'img')
      .where('item.userId = :userId', { userId: user.id })
      .andWhere('item.deletedAt IS NULL');

    if (query.categoryId) {
      qb.andWhere('cat.id = :categoryId', { categoryId: query.categoryId });
    }
    if (query.search) {
      qb.andWhere(
        '(item.name LIKE :searchLike OR item.description LIKE :searchLike)',
        { searchLike: `%${query.search}%` },
      );
    }
    if (query.searchState) {
      qb.andWhere('item.searchState = :searchState', { searchState: query.searchState });
    }
    if (query.statusId) {
      qb.andWhere('item.statusId = :statusId', { statusId: query.statusId });
    }
    if (query.primaryTypeId) {
      qb.andWhere('item.primaryTypeId = :primaryTypeId', { primaryTypeId: query.primaryTypeId });
    }
    if (query.minRating) {
      qb.andWhere('item.rating >= :minRating', { minRating: query.minRating });
    }
    if (query.minValue != null) {
      qb.andWhere('item.marketValue >= :minValue', { minValue: query.minValue });
    }
    if (query.maxValue != null) {
      qb.andWhere('item.marketValue <= :maxValue', { maxValue: query.maxValue });
    }
    if (query.dateFrom) {
      qb.andWhere('item.dateObtained >= :dateFrom', { dateFrom: query.dateFrom });
    }
    if (query.dateTo) {
      qb.andWhere('item.dateObtained <= :dateTo', { dateTo: query.dateTo });
    }

    const sortMap: Record<string, string> = {
      name: 'item.name',
      createdAt: 'item.createdAt',
      value: 'item.marketValue',
      rating: 'item.rating',
      purchasePrice: 'item.purchasePrice',
      dateObtained: 'item.dateObtained',
    };
    qb.orderBy(sortMap[sort] || 'item.createdAt', order);

    // Aggregations scoped to this user
    const agg = await this.itemRepo
      .createQueryBuilder('item')
      .select('SUM(item.marketValue)', 'total')
      .addSelect('AVG(item.rating)', 'avgRating')
      .where('item.userId = :userId', { userId: user.id })
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
        items: items.map((item) => {
          const sortedImages = (item.images || []).sort(
            (a, b) => a.displayOrder - b.displayOrder,
          );
          const firstImage = sortedImages[0] || null;
          return {
            id: item.id,
            name: item.name,
            description: item.description,
            primaryType: item.primaryType
              ? {
                  key: item.primaryType.keyName,
                  name: item.primaryType.nameFr,
                  icon: item.primaryType.icon,
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
            })),
            status: item.status
              ? {
                  id: item.status.id,
                  name: item.status.name,
                  color: item.status.color,
                  icon: item.status.icon,
                }
              : null,
            thumbnailUrl: firstImage?.thumbnailUrl || null,
            imageUrl: firstImage?.url || null,
            createdAt: item.createdAt,
          };
        }),
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        aggregations: {
          totalValue: agg?.total ? Number(agg.total) : 0,
          avgRating: agg?.avgRating ? Number(Number(agg.avgRating).toFixed(1)) : 0,
        },
      },
    };
  }

  // ──────────────────────────────────────────────
  // EXPLORE — Get public item detail
  // ──────────────────────────────────────────────
  async getPublicItemDetail(
    username: string,
    itemId: number,
    requesterId: number,
    lang = 'fr',
  ) {
    const user = await this.usersRepository.findOne({ where: { username } });
    if (!user) throw new NotFoundException('Utilisateur non trouvé');
    if (user.id !== requesterId) await this.checkVisibility(user, requesterId);

    const item = await this.itemRepo.findOne({
      where: { id: itemId },
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
      throw new NotFoundException('Article introuvable');
    }

    // Verify item belongs to the profile user
    if (item.userId !== user.id) {
      throw new NotFoundException('Article introuvable');
    }

    return {
      success: true,
      data: this.serializePublicItem(item, lang),
    };
  }

  private serializePublicItem(item: Item, lang = 'fr') {
    const pt = item.primaryType;
    const categories = (item.categories || []).map((c) => ({
      id: c.id,
      name: c.name,
      icon: c.icon,
      color: c.color,
    }));

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
      metadata[key] = { fieldId: field.id, label, value, type: field.fieldType, icon: field.icon };
    }

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
        case FieldType.CHECKLIST:
          value = meta.valueJson;
          break;
        default:
          value = meta.valueText;
      }
      categoryMetadata[key] = { fieldId: field.id, label, value, type: field.fieldType, icon: field.icon };
    }

    return {
      id: item.id,
      name: item.name,
      description: item.description,
      notes: item.notes,
      primaryType: pt
        ? { id: pt.id, key: pt.keyName, name: lang === 'en' ? pt.nameEn : pt.nameFr, icon: pt.icon }
        : null,
      rating: item.rating,
      purchasePrice: item.purchasePrice != null ? Number(item.purchasePrice) : null,
      marketValue: item.marketValue != null ? Number(item.marketValue) : null,
      dateObtained: item.dateObtained,
      searchState: item.searchState,
      barcode: item.barcode,
      status: item.status
        ? { id: item.status.id, name: item.status.name, color: item.status.color, icon: item.status.icon }
        : null,
      storageLocation: item.storageLocation
        ? { id: item.storageLocation.id, name: item.storageLocation.name, description: item.storageLocation.description }
        : null,
      grades: (item.grades || []).map((g) => ({ id: g.id, name: g.name })),
      categories,
      metadata,
      categoryMetadata,
      owner: item.user
        ? { id: item.user.id, username: item.user.username, avatarUrl: item.user.avatarUrl }
        : null,
      images: (item.images || []).sort((a, b) => a.displayOrder - b.displayOrder).map((img) => ({
        id: img.id, url: img.url, thumbnailUrl: img.thumbnailUrl, title: img.title,
        filename: img.filename, mimeType: img.mimeType, size: img.size,
        width: img.width, height: img.height, displayOrder: img.displayOrder, createdAt: img.createdAt,
      })),
      videos: (item.videos || []).sort((a, b) => a.displayOrder - b.displayOrder).map((v) => ({
        id: v.id, url: v.url, title: v.title, filename: v.filename, mimeType: v.mimeType,
        size: v.size, duration: v.duration, displayOrder: v.displayOrder, createdAt: v.createdAt,
      })),
      audio: (item.audio || []).sort((a, b) => a.displayOrder - b.displayOrder).map((a) => ({
        id: a.id, url: a.url, title: a.title, filename: a.filename, mimeType: a.mimeType,
        size: a.size, duration: a.duration, displayOrder: a.displayOrder, createdAt: a.createdAt,
      })),
      documents: (item.documents || []).sort((a, b) => a.displayOrder - b.displayOrder).map((d) => ({
        id: d.id, url: d.url, title: d.title, filename: d.filename, mimeType: d.mimeType,
        size: d.size, displayOrder: d.displayOrder, createdAt: d.createdAt,
      })),
      externalLinks: item.externalLinks || [],
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  // ──────────────────────────────────────────────
  // VISIBILITY CHECK HELPER
  // ──────────────────────────────────────────────
  private async checkVisibility(user: User, requesterId?: number): Promise<void> {
    if (user.collectionsVisibility === CollectionsVisibility.PRIVATE) {
      throw new ForbiddenException('Cette collection est privée');
    }
    if (user.collectionsVisibility === CollectionsVisibility.FRIENDS) {
      if (!requesterId) {
        throw new ForbiddenException('Cette collection est réservée aux amis');
      }
      const areFriends = await this.friendshipRepo.count({
        where: [
          { requesterId, addresseeId: user.id, status: FriendshipStatus.ACCEPTED },
          { requesterId: user.id, addresseeId: requesterId, status: FriendshipStatus.ACCEPTED },
        ],
      });
      if (!areFriends) {
        throw new ForbiddenException('Cette collection est réservée aux amis');
      }
    }
    // PUBLIC → allowed
  }
}
