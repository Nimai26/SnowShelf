import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  OnModuleDestroy,
} from '@nestjs/common';
import * as sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface ProcessImageOptions {
  rotate?: number;         // 0, 90, 180, 270
  flipH?: boolean;         // mirror horizontal
  flipV?: boolean;         // mirror vertical
  crop?: {                 // crop region
    x: number;
    y: number;
    width: number;
    height: number;
  };
  brightness?: number;     // -100 to +100
  contrast?: number;       // -100 to +100
  saturation?: number;     // -100 to +100
  format?: 'jpeg' | 'png' | 'webp';
  quality?: number;        // 1-100 (for jpeg/webp)
  maxWidth?: number;       // max output width
  maxHeight?: number;      // max output height
}

@Injectable()
export class ImageProcessingService implements OnModuleDestroy {
  private readonly logger = new Logger(ImageProcessingService.name);
  private readonly storagePath = '/app/storage';
  private readonly tempDir = path.join(this.storagePath, 'temp');
  private cleanupInterval: ReturnType<typeof setInterval>;

  constructor() {
    // Ensure temp directory exists
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
    // Start cleanup interval (every 30 minutes)
    this.cleanupInterval = setInterval(() => this.cleanupTemp(), 30 * 60 * 1000);
  }

  onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  /**
   * Store a raw image in temporary storage.
   * Returns the temp file path relative to storage root.
   */
  async storeTempImage(
    userId: number,
    buffer: Buffer,
    originalName: string,
  ): Promise<{ tempPath: string; url: string; metadata: any }> {
    // Validate with Sharp
    let metadata: sharp.Metadata;
    try {
      metadata = await sharp(buffer).metadata();
    } catch {
      throw new BadRequestException('Fichier image invalide');
    }

    if (!metadata.format || !['jpeg', 'png', 'webp', 'gif', 'tiff'].includes(metadata.format)) {
      throw new BadRequestException(`Format image non supporté: ${metadata.format}`);
    }

    const ext = this.getExtension(metadata.format);
    const random = crypto.randomBytes(8).toString('hex');
    const filename = `temp_${userId}_${Date.now()}_${random}${ext}`;
    const filePath = path.join(this.tempDir, filename);

    fs.writeFileSync(filePath, buffer);
    this.logger.log(`📸 Image temporaire stockée: ${filename} (${metadata.width}×${metadata.height})`);

    return {
      tempPath: filePath,
      url: `/storage/temp/${filename}`,
      metadata: {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: buffer.length,
      },
    };
  }

  /**
   * Process an image with transformations (crop, rotate, filters, resize).
   * Can accept a buffer or a file path.
   */
  async processImage(
    input: Buffer | string,
    options: ProcessImageOptions,
  ): Promise<{ buffer: Buffer; metadata: { width: number; height: number; format: string; size: number } }> {
    let pipeline = sharp(input);

    // 1. Rotation
    if (options.rotate && [90, 180, 270].includes(options.rotate)) {
      pipeline = pipeline.rotate(options.rotate);
    }

    // 2. Flip
    if (options.flipV) {
      pipeline = pipeline.flip();
    }
    if (options.flipH) {
      pipeline = pipeline.flop();
    }

    // 3. Crop (extract region)
    if (options.crop) {
      const { x, y, width, height } = options.crop;
      if (width < 10 || height < 10) {
        throw new BadRequestException('Zone de recadrage trop petite (min 10px)');
      }
      pipeline = pipeline.extract({
        left: Math.round(x),
        top: Math.round(y),
        width: Math.round(width),
        height: Math.round(height),
      });
    }

    // 4. Brightness / Contrast / Saturation (via modulate + linear)
    if (options.brightness !== undefined || options.saturation !== undefined) {
      const modulate: { brightness?: number; saturation?: number } = {};
      if (options.brightness !== undefined) {
        // brightness: -100..+100 → Sharp modulate brightness: 0..2 (1 = neutral)
        modulate.brightness = 1 + options.brightness / 100;
      }
      if (options.saturation !== undefined) {
        // saturation: -100..+100 → Sharp modulate saturation: 0..2 (1 = neutral)
        modulate.saturation = 1 + options.saturation / 100;
      }
      pipeline = pipeline.modulate(modulate);
    }

    if (options.contrast !== undefined && options.contrast !== 0) {
      // contrast: -100..+100 → linear(a, b) where a = factor, b = offset
      const factor = 1 + options.contrast / 100;
      // Adjust with pivot at 128 (midpoint)
      const offset = 128 * (1 - factor);
      pipeline = pipeline.linear(factor, offset);
    }

    // 5. Resize (max dimensions)
    const maxW = options.maxWidth || 5000;
    const maxH = options.maxHeight || 5000;
    pipeline = pipeline.resize(maxW, maxH, {
      fit: 'inside',
      withoutEnlargement: true,
    });

    // 6. Output format
    const format = options.format || 'jpeg';
    const quality = options.quality || 92;

    switch (format) {
      case 'jpeg':
        pipeline = pipeline.jpeg({ quality, mozjpeg: true });
        break;
      case 'png':
        pipeline = pipeline.png({ compressionLevel: 6 });
        break;
      case 'webp':
        pipeline = pipeline.webp({ quality });
        break;
    }

    const outputBuffer = await pipeline.toBuffer();
    const outputMeta = await sharp(outputBuffer).metadata();

    return {
      buffer: outputBuffer,
      metadata: {
        width: outputMeta.width || 0,
        height: outputMeta.height || 0,
        format,
        size: outputBuffer.length,
      },
    };
  }

  /**
   * Process a temp image and store the result back in temp.
   */
  async processTempImage(
    userId: number,
    tempUrl: string,
    options: ProcessImageOptions,
  ): Promise<{ url: string; metadata: any }> {
    // Resolve temp file path
    const filename = path.basename(tempUrl);
    const filePath = path.join(this.tempDir, filename);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Image temporaire introuvable');
    }

    // Validate ownership
    if (!filename.startsWith(`temp_${userId}_`)) {
      throw new BadRequestException('Accès non autorisé à cette image');
    }

    const result = await this.processImage(filePath, options);

    // Write processed image to new temp file
    const ext = this.getExtension(options.format || 'jpeg');
    const random = crypto.randomBytes(8).toString('hex');
    const newFilename = `temp_${userId}_${Date.now()}_${random}${ext}`;
    const newFilePath = path.join(this.tempDir, newFilename);

    fs.writeFileSync(newFilePath, result.buffer);

    // Remove old temp file
    try { fs.unlinkSync(filePath); } catch { /* ignore */ }

    return {
      url: `/storage/temp/${newFilename}`,
      metadata: result.metadata,
    };
  }

  /**
   * Cleanup temp files older than 1 hour.
   */
  private cleanupTemp(): void {
    try {
      if (!fs.existsSync(this.tempDir)) return;
      const files = fs.readdirSync(this.tempDir);
      const now = Date.now();
      const maxAge = 60 * 60 * 1000; // 1 hour
      let cleaned = 0;

      for (const file of files) {
        if (!file.startsWith('temp_')) continue;
        const filePath = path.join(this.tempDir, file);
        const stat = fs.statSync(filePath);
        if (now - stat.mtimeMs > maxAge) {
          fs.unlinkSync(filePath);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        this.logger.log(`🧹 Nettoyage temp: ${cleaned} fichier(s) supprimé(s)`);
      }
    } catch (err) {
      this.logger.warn(`Erreur nettoyage temp: ${err.message}`);
    }
  }

  private getExtension(format: string): string {
    switch (format) {
      case 'jpeg': return '.jpg';
      case 'png': return '.png';
      case 'webp': return '.webp';
      case 'gif': return '.gif';
      case 'tiff': return '.tiff';
      default: return '.jpg';
    }
  }
}
