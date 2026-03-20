import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CategoryImage } from '../../database/entities/category-image.entity';
import { CategoryVideo } from '../../database/entities/category-video.entity';
import { CategoryAudio } from '../../database/entities/category-audio.entity';
import { CategoryDocument } from '../../database/entities/category-document.entity';
import { UploadConfig } from '../../database/entities/upload-config.entity';
import { Category } from '../../database/entities/category.entity';
import { v4 as uuidv4 } from 'uuid';
import * as fsp from 'fs/promises';
import * as fs from 'fs';
import * as path from 'path';
import * as sharp from 'sharp';

export type MediaType = 'images' | 'videos' | 'audio' | 'documents';

const UPLOAD_CONFIG_MAP: Record<MediaType, string> = {
  images: 'images',
  videos: 'videos',
  audio: 'audio',
  documents: 'documents',
};

@Injectable()
export class CategoryMediaService {
  private readonly logger = new Logger(CategoryMediaService.name);
  private readonly storagePath = '/app/storage';

  constructor(
    @InjectRepository(CategoryImage)
    private imageRepo: Repository<CategoryImage>,
    @InjectRepository(CategoryVideo)
    private videoRepo: Repository<CategoryVideo>,
    @InjectRepository(CategoryAudio)
    private audioRepo: Repository<CategoryAudio>,
    @InjectRepository(CategoryDocument)
    private documentRepo: Repository<CategoryDocument>,
    @InjectRepository(UploadConfig)
    private uploadConfigRepo: Repository<UploadConfig>,
    @InjectRepository(Category)
    private categoryRepo: Repository<Category>,
  ) {}

  private getRepo(mediaType: MediaType): Repository<any> {
    switch (mediaType) {
      case 'images': return this.imageRepo;
      case 'videos': return this.videoRepo;
      case 'audio': return this.audioRepo;
      case 'documents': return this.documentRepo;
    }
  }

  /**
   * Catégories par défaut (userId=null) => /storage/default_categories/{catId}/{mediaType}/
   * Catégories utilisateur => /storage/users/{userId}/Categories/{catId}/{mediaType}/
   */
  private getMediaDir(category: Category, mediaType: MediaType): string {
    if (category.isDefault && !category.userId) {
      return path.join(this.storagePath, 'default_categories', String(category.id), mediaType);
    }
    return path.join(this.storagePath, 'users', String(category.userId), 'Categories', String(category.id), mediaType);
  }

  private getMediaUrl(category: Category, mediaType: MediaType, filename: string): string {
    if (category.isDefault && !category.userId) {
      return `/storage/default_categories/${category.id}/${mediaType}/${filename}`;
    }
    return `/storage/users/${category.userId}/Categories/${category.id}/${mediaType}/${filename}`;
  }

  private ensureDir(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  private async ensureDirAsync(dirPath: string): Promise<void> {
    await fsp.mkdir(dirPath, { recursive: true });
  }

  /**
   * Génère un thumbnail WebP optimisé pour une image de catégorie.
   */
  private async generateThumbnail(
    sourceBuffer: Buffer,
    dir: string,
    category: Category,
    mediaType: MediaType,
  ): Promise<{ url: string; width: number; height: number } | null> {
    try {
      const thumbDir = path.join(dir, 'thumbs');
      await this.ensureDirAsync(thumbDir);

      const thumbName = `thumb_${uuidv4()}.webp`;
      const thumbPath = path.join(thumbDir, thumbName);

      const result = await (sharp as any)(sourceBuffer)
        .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 75 })
        .toFile(thumbPath);

      let thumbUrl: string;
      if (category.isDefault && !category.userId) {
        thumbUrl = `/storage/default_categories/${category.id}/${mediaType}/thumbs/${thumbName}`;
      } else {
        thumbUrl = `/storage/users/${category.userId}/Categories/${category.id}/${mediaType}/thumbs/${thumbName}`;
      }

      return { url: thumbUrl, width: result.width, height: result.height };
    } catch (err) {
      this.logger.warn(`Category thumbnail generation failed: ${err.message}`);
      return null;
    }
  }

  async validateMediaType(mediaType: string): Promise<MediaType> {
    if (!['images', 'videos', 'audio', 'documents'].includes(mediaType)) {
      throw new BadRequestException(`Type de média invalide: ${mediaType}`);
    }
    return mediaType as MediaType;
  }

  async validateCategoryAccess(categoryId: number, userId: number): Promise<Category> {
    const category = await this.categoryRepo.findOne({
      where: [
        { id: categoryId, userId },
        { id: categoryId, isDefault: true, userId: null as any },
      ],
    });
    if (!category) {
      throw new NotFoundException(`Catégorie #${categoryId} introuvable`);
    }
    return category;
  }

  async getUploadConfig(mediaType: MediaType): Promise<UploadConfig> {
    const config = await this.uploadConfigRepo.findOne({
      where: { category: UPLOAD_CONFIG_MAP[mediaType], isActive: true },
    });
    if (!config) {
      throw new BadRequestException(`Configuration upload pour "${mediaType}" non trouvée`);
    }
    return config;
  }

  validateFile(file: Express.Multer.File, config: UploadConfig): void {
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    if (!config.allowedExtensions.includes(ext)) {
      throw new BadRequestException(
        `Extension "${ext}" non autorisée. Acceptées: ${config.allowedExtensions.join(', ')}`,
      );
    }
    const maxBytes = config.maxSizeMb * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new BadRequestException(
        `Fichier trop volumineux (${(file.size / 1024 / 1024).toFixed(1)} MB). Max: ${config.maxSizeMb} MB`,
      );
    }
  }

  // ==========================================
  // LIST
  // ==========================================
  async findAll(categoryId: number, userId: number, mediaType: MediaType) {
    await this.validateCategoryAccess(categoryId, userId);
    const repo = this.getRepo(mediaType);
    const items = await repo.find({
      where: { categoryId },
      order: { displayOrder: 'ASC', createdAt: 'ASC' },
    });
    return items.map((m: any) => this.serializeMedia(m, mediaType));
  }

  // ==========================================
  // UPLOAD
  // ==========================================
  async upload(
    categoryId: number,
    userId: number,
    mediaType: MediaType,
    files: Express.Multer.File[],
    titles?: string[],
  ) {
    const category = await this.validateCategoryAccess(categoryId, userId);
    const config = await this.getUploadConfig(mediaType);
    const repo = this.getRepo(mediaType);

    const maxOrderResult = await repo
      .createQueryBuilder('m')
      .select('MAX(m.display_order)', 'maxOrder')
      .where('m.category_id = :categoryId', { categoryId })
      .getRawOne();
    let currentOrder = (maxOrderResult?.maxOrder ?? -1) + 1;

    const dir = this.getMediaDir(category, mediaType);
    this.ensureDir(dir);

    const results: any[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      this.validateFile(file, config);

      const ext = path.extname(file.originalname).toLowerCase();
      const uniqueName = `${uuidv4()}${ext}`;
      const filePath = path.join(dir, uniqueName);

      await fsp.writeFile(filePath, file.buffer);

      const url = this.getMediaUrl(category, mediaType, uniqueName);
      const title = titles?.[i] || null;

      const entityData: any = {
        categoryId,
        url,
        title,
        filename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        displayOrder: currentOrder++,
      };

      if (mediaType === 'images') {
        // Generate WebP thumbnail
        const thumb = await this.generateThumbnail(file.buffer, dir, category, mediaType);
        if (thumb) {
          entityData.thumbnailUrl = thumb.url;
          entityData.width = thumb.width;
          entityData.height = thumb.height;
        } else {
          entityData.thumbnailUrl = url;
          // Try to get dimensions from Sharp metadata
          try {
            const metadata = await (sharp as any)(file.buffer).metadata();
            entityData.width = metadata.width || null;
            entityData.height = metadata.height || null;
          } catch {
            entityData.width = null;
            entityData.height = null;
          }
        }
      }

      const entity = repo.create(entityData);
      const saved = await repo.save(entity);
      results.push(this.serializeMedia(saved, mediaType));
    }

    this.logger.log(`📤 ${results.length} ${mediaType} uploadé(s) pour catégorie #${categoryId}`);
    return results;
  }

  // ==========================================
  // UPDATE
  // ==========================================
  async update(
    categoryId: number,
    userId: number,
    mediaType: MediaType,
    mediaId: number,
    data: { title?: string; displayOrder?: number },
  ) {
    await this.validateCategoryAccess(categoryId, userId);
    const repo = this.getRepo(mediaType);

    const media = await repo.findOne({ where: { id: mediaId, categoryId } });
    if (!media) {
      throw new NotFoundException(`Média #${mediaId} introuvable`);
    }

    if (data.title !== undefined) media.title = data.title;
    if (data.displayOrder !== undefined) media.displayOrder = data.displayOrder;

    const saved = await repo.save(media);
    return this.serializeMedia(saved, mediaType);
  }

  // ==========================================
  // REORDER
  // ==========================================
  async reorder(
    categoryId: number,
    userId: number,
    mediaType: MediaType,
    order: number[],
  ) {
    await this.validateCategoryAccess(categoryId, userId);
    const repo = this.getRepo(mediaType);

    for (let i = 0; i < order.length; i++) {
      await repo.update(
        { id: order[i], categoryId },
        { displayOrder: i },
      );
    }

    return this.findAll(categoryId, userId, mediaType);
  }

  // ==========================================
  // DELETE
  // ==========================================
  async remove(
    categoryId: number,
    userId: number,
    mediaType: MediaType,
    mediaId: number,
  ) {
    const category = await this.validateCategoryAccess(categoryId, userId);
    const repo = this.getRepo(mediaType);

    const media = await repo.findOne({ where: { id: mediaId, categoryId } });
    if (!media) {
      throw new NotFoundException(`Média #${mediaId} introuvable`);
    }

    try {
      const filePath = path.join(this.storagePath, media.url.replace('/storage/', ''));
      try {
        await fsp.unlink(filePath);
      } catch {
        // File doesn't exist
      }
      if (mediaType === 'images' && media.thumbnailUrl && media.thumbnailUrl !== media.url) {
        const thumbPath = path.join(this.storagePath, media.thumbnailUrl.replace('/storage/', ''));
        try {
          await fsp.unlink(thumbPath);
        } catch {
          // Thumbnail doesn't exist
        }
      }
    } catch (err) {
      this.logger.warn(`Erreur suppression fichier: ${err.message}`);
    }

    await repo.remove(media);
    return { message: 'Média supprimé' };
  }

  // ==========================================
  // SERIALIZATION
  // ==========================================
  private serializeMedia(media: any, mediaType: MediaType) {
    const base: any = {
      id: media.id,
      url: media.url,
      title: media.title,
      filename: media.filename,
      mimeType: media.mimeType,
      size: media.size,
      displayOrder: media.displayOrder,
      createdAt: media.createdAt,
    };

    if (mediaType === 'images') {
      base.thumbnailUrl = media.thumbnailUrl;
      base.width = media.width;
      base.height = media.height;
    }
    if (mediaType === 'videos') {
      base.thumbnailUrl = media.thumbnailUrl;
      base.duration = media.duration;
    }
    if (mediaType === 'audio') {
      base.duration = media.duration;
    }

    return base;
  }
}
