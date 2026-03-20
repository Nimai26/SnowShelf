import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ItemImage } from '../../database/entities/item-image.entity';
import { ItemVideo } from '../../database/entities/item-video.entity';
import { ItemAudio } from '../../database/entities/item-audio.entity';
import { ItemDocument } from '../../database/entities/item-document.entity';
import { UploadConfig } from '../../database/entities/upload-config.entity';
import { Item } from '../../database/entities/item.entity';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as fsp from 'fs/promises';
import * as path from 'path';
import * as sharp from 'sharp';

export type MediaType = 'images' | 'videos' | 'audio' | 'documents';

const MEDIA_TYPE_MAP: Record<MediaType, string> = {
  images: 'images',
  videos: 'videos',
  audio: 'audio',
  documents: 'documents',
};

const UPLOAD_CONFIG_MAP: Record<MediaType, string> = {
  images: 'images',
  videos: 'videos',
  audio: 'audio',
  documents: 'documents',
};

@Injectable()
export class ItemMediaService {
  private readonly logger = new Logger(ItemMediaService.name);
  private readonly storagePath = '/app/storage';

  constructor(
    @InjectRepository(ItemImage)
    private imageRepo: Repository<ItemImage>,
    @InjectRepository(ItemVideo)
    private videoRepo: Repository<ItemVideo>,
    @InjectRepository(ItemAudio)
    private audioRepo: Repository<ItemAudio>,
    @InjectRepository(ItemDocument)
    private documentRepo: Repository<ItemDocument>,
    @InjectRepository(UploadConfig)
    private uploadConfigRepo: Repository<UploadConfig>,
    @InjectRepository(Item)
    private itemRepo: Repository<Item>,
  ) {}

  private getRepo(mediaType: MediaType): Repository<any> {
    switch (mediaType) {
      case 'images': return this.imageRepo;
      case 'videos': return this.videoRepo;
      case 'audio': return this.audioRepo;
      case 'documents': return this.documentRepo;
    }
  }

  private getMediaDir(userId: number, itemId: number, mediaType: MediaType): string {
    return path.join(this.storagePath, 'users', String(userId), 'items', String(itemId), mediaType);
  }

  private getMediaUrl(userId: number, itemId: number, mediaType: MediaType, filename: string): string {
    return `/storage/users/${userId}/items/${itemId}/${mediaType}/${filename}`;
  }

  private ensureDir(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Génère un thumbnail WebP optimisé pour une image.
   * Retourne l'URL du thumbnail ou null en cas d'erreur.
   */
  private async generateThumbnail(
    sourceBuffer: Buffer,
    dir: string,
    userId: number,
    itemId: number,
  ): Promise<{ url: string; width: number; height: number } | null> {
    try {
      const thumbDir = path.join(dir, 'thumbs');
      this.ensureDir(thumbDir);

      const thumbName = `thumb_${uuidv4()}.webp`;
      const thumbPath = path.join(thumbDir, thumbName);

      const result = await (sharp as any)(sourceBuffer)
        .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: 75 })
        .toFile(thumbPath);

      const thumbUrl = `/storage/users/${userId}/items/${itemId}/images/thumbs/${thumbName}`;
      return { url: thumbUrl, width: result.width, height: result.height };
    } catch (err) {
      this.logger.warn(`Thumbnail generation failed: ${err.message}`);
      return null;
    }
  }

  async validateMediaType(mediaType: string): Promise<MediaType> {
    if (!['images', 'videos', 'audio', 'documents'].includes(mediaType)) {
      throw new BadRequestException(`Type de média invalide: ${mediaType}. Valeurs acceptées: images, videos, audio, documents`);
    }
    return mediaType as MediaType;
  }

  async validateItemAccess(itemId: number, userId: number): Promise<Item> {
    const item = await this.itemRepo.findOne({ where: { id: itemId, userId } });
    if (!item) {
      throw new NotFoundException(`Item #${itemId} introuvable`);
    }
    return item;
  }

  async getUploadConfig(mediaType: MediaType): Promise<UploadConfig> {
    const configKey = UPLOAD_CONFIG_MAP[mediaType];
    const config = await this.uploadConfigRepo.findOne({ where: { category: configKey, isActive: true } });
    if (!config) {
      throw new BadRequestException(`Configuration upload pour "${mediaType}" non trouvée ou inactive`);
    }
    return config;
  }

  validateFile(file: Express.Multer.File, config: UploadConfig): void {
    // Check file extension
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    if (!config.allowedExtensions.includes(ext)) {
      throw new BadRequestException(
        `Extension "${ext}" non autorisée. Extensions acceptées: ${config.allowedExtensions.join(', ')}`,
      );
    }

    // Check file size
    const maxBytes = config.maxSizeMb * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new BadRequestException(
        `Fichier trop volumineux (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum: ${config.maxSizeMb} MB`,
      );
    }
  }

  // ==========================================
  // LIST
  // ==========================================
  async findAll(itemId: number, userId: number, mediaType: MediaType) {
    await this.validateItemAccess(itemId, userId);
    const repo = this.getRepo(mediaType);
    
    const items = await repo.find({
      where: { itemId },
      order: { displayOrder: 'ASC', createdAt: 'ASC' },
    });

    return items.map((m: any) => this.serializeMedia(m, mediaType));
  }

  // ==========================================
  // UPLOAD
  // ==========================================
  async upload(
    itemId: number,
    userId: number,
    mediaType: MediaType,
    files: Express.Multer.File[],
    titles?: string[],
  ) {
    const item = await this.validateItemAccess(itemId, userId);
    const config = await this.getUploadConfig(mediaType);
    const repo = this.getRepo(mediaType);

    // Get current max display order
    const maxOrderResult = await repo
      .createQueryBuilder('m')
      .select('MAX(m.display_order)', 'maxOrder')
      .where('m.item_id = :itemId', { itemId })
      .getRawOne();
    let currentOrder = (maxOrderResult?.maxOrder ?? -1) + 1;

    const dir = this.getMediaDir(userId, itemId, mediaType);
    this.ensureDir(dir);

    const results: any[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      this.validateFile(file, config);

      const ext = path.extname(file.originalname).toLowerCase();
      const uniqueName = `${uuidv4()}${ext}`;
      const filePath = path.join(dir, uniqueName);

      // Write file to storage (async)
      await fsp.writeFile(filePath, file.buffer);

      const url = this.getMediaUrl(userId, itemId, mediaType, uniqueName);
      const title = titles?.[i] || null;

      const entityData: any = {
        itemId,
        url,
        title,
        filename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        displayOrder: currentOrder++,
      };

      // Generate WebP thumbnail for images
      if (mediaType === 'images') {
        const thumb = await this.generateThumbnail(file.buffer, dir, userId, itemId);
        if (thumb) {
          entityData.thumbnailUrl = thumb.url;
          entityData.width = thumb.width;
          entityData.height = thumb.height;
        } else {
          entityData.thumbnailUrl = url;
        }
      }

      const entity = repo.create(entityData);
      const saved = await repo.save(entity);
      results.push(this.serializeMedia(saved, mediaType));
    }

    this.logger.log(`📤 ${results.length} ${mediaType} uploadé(s) pour item #${itemId}`);
    return results;
  }

  // ==========================================
  // UPDATE
  // ==========================================
  async update(
    itemId: number,
    userId: number,
    mediaType: MediaType,
    mediaId: number,
    data: { title?: string; displayOrder?: number },
  ) {
    await this.validateItemAccess(itemId, userId);
    const repo = this.getRepo(mediaType);

    const media = await repo.findOne({ where: { id: mediaId, itemId } });
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
    itemId: number,
    userId: number,
    mediaType: MediaType,
    order: number[],
  ) {
    await this.validateItemAccess(itemId, userId);
    const repo = this.getRepo(mediaType);

    // Batch reorder with transaction
    await repo.manager.transaction(async (manager) => {
      const batchRepo = manager.getRepository(repo.target);
      const updates = order.map((id, i) =>
        batchRepo.update({ id, itemId }, { displayOrder: i }),
      );
      await Promise.all(updates);
    });

    return this.findAll(itemId, userId, mediaType);
  }

  // ==========================================
  // DELETE
  // ==========================================
  async remove(
    itemId: number,
    userId: number,
    mediaType: MediaType,
    mediaId: number,
  ) {
    await this.validateItemAccess(itemId, userId);
    const repo = this.getRepo(mediaType);

    const media = await repo.findOne({ where: { id: mediaId, itemId } });
    if (!media) {
      throw new NotFoundException(`Média #${mediaId} introuvable`);
    }

    // Delete physical file
    try {
      const filePath = path.join(this.storagePath, media.url.replace('/storage/', ''));
      if (fs.existsSync(filePath)) {
        await fsp.unlink(filePath);
        this.logger.log(`🗑️ Fichier supprimé: ${filePath}`);
      }

      // Delete thumbnail if different from url (images)
      if (mediaType === 'images' && media.thumbnailUrl && media.thumbnailUrl !== media.url) {
        const thumbPath = path.join(this.storagePath, media.thumbnailUrl.replace('/storage/', ''));
        if (fs.existsSync(thumbPath)) {
          await fsp.unlink(thumbPath);
        }
      }
    } catch (err) {
      this.logger.warn(`Erreur suppression fichier: ${err.message}`);
    }

    await repo.remove(media);
    return { message: 'Média supprimé' };
  }

  // ==========================================
  // ATTACH FROM TEMP (for Tako imports)
  // ==========================================
  async attachFromTemp(
    itemId: number,
    userId: number,
    mediaType: MediaType,
    tempUrl: string,
    title?: string,
  ) {
    const item = await this.validateItemAccess(itemId, userId);

    // Resolve the temp file path from URL like /storage/temp/temp_4_xxx.jpg
    const tempRelativePath = tempUrl.replace(/^\/storage\//, '');
    const tempFilePath = path.join(this.storagePath, tempRelativePath);

    if (!fs.existsSync(tempFilePath)) {
      throw new NotFoundException(`Fichier temporaire introuvable: ${tempUrl}`);
    }

    const fileBuffer = await fsp.readFile(tempFilePath);
    const ext = path.extname(tempFilePath).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
      '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime',
      '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav',
    };
    const mimeType = mimeMap[ext] || 'application/octet-stream';

    const repo = this.getRepo(mediaType);

    // Get current max display order
    const maxOrderResult = await repo
      .createQueryBuilder('m')
      .select('MAX(m.display_order)', 'maxOrder')
      .where('m.item_id = :itemId', { itemId })
      .getRawOne();
    const currentOrder = (maxOrderResult?.maxOrder ?? -1) + 1;

    const dir = this.getMediaDir(userId, itemId, mediaType);
    this.ensureDir(dir);

    const uniqueName = `${uuidv4()}${ext}`;
    const destPath = path.join(dir, uniqueName);

    // Move file to permanent storage
    await fsp.copyFile(tempFilePath, destPath);

    const url = this.getMediaUrl(userId, itemId, mediaType, uniqueName);

    const entityData: any = {
      itemId,
      url,
      title: title || null,
      filename: `import${ext}`,
      mimeType,
      size: fileBuffer.length,
      displayOrder: currentOrder,
    };

    // Generate thumbnail for images
    if (mediaType === 'images') {
      const thumb = await this.generateThumbnail(fileBuffer, dir, userId, itemId);
      if (thumb) {
        entityData.thumbnailUrl = thumb.url;
        entityData.width = thumb.width;
        entityData.height = thumb.height;
      } else {
        entityData.thumbnailUrl = url;
      }
    }

    const entity = repo.create(entityData);
    const saved = await repo.save(entity);

    // Delete temp file
    try {
      await fsp.unlink(tempFilePath);
      this.logger.log(`🗑️ Fichier temporaire supprimé: ${tempFilePath}`);
    } catch {}

    this.logger.log(`📤 Média attaché depuis temp pour item #${itemId}`);
    return this.serializeMedia(saved, mediaType);
  }

  // ==========================================
  // ATTACH FROM URL (for external platforms: YouTube, Vimeo, etc.)
  // ==========================================
  async attachFromUrl(
    itemId: number,
    userId: number,
    mediaType: MediaType,
    url: string,
    title?: string,
    thumbnailUrl?: string,
  ) {
    await this.validateItemAccess(itemId, userId);

    if (!url || !url.startsWith('http')) {
      throw new BadRequestException('URL invalide');
    }

    const repo = this.getRepo(mediaType);

    // Get current max display order
    const maxOrderResult = await repo
      .createQueryBuilder('m')
      .select('MAX(m.display_order)', 'maxOrder')
      .where('m.item_id = :itemId', { itemId })
      .getRawOne();
    const currentOrder = (maxOrderResult?.maxOrder ?? -1) + 1;

    // Determine mime type based on platform
    let mimeType = 'video/mp4';
    let filename = 'external_video';
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      mimeType = 'video/youtube';
      filename = 'youtube_video';
    } else if (url.includes('vimeo.com')) {
      mimeType = 'video/vimeo';
      filename = 'vimeo_video';
    }

    const entityData: any = {
      itemId,
      url,
      thumbnailUrl: thumbnailUrl || null,
      title: title || null,
      filename,
      mimeType,
      size: 0,
      displayOrder: currentOrder,
    };

    const entity = repo.create(entityData);
    const saved = await repo.save(entity);

    this.logger.log(`🔗 Média externe enregistré pour item #${itemId}: ${url}`);
    return this.serializeMedia(saved, mediaType);
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
