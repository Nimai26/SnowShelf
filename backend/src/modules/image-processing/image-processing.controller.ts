import {
  Controller,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImageProcessingService, ProcessImageOptions } from './image-processing.service';

@Controller('media')
export class ImageProcessingController {
  constructor(private readonly imageProcessingService: ImageProcessingService) {}

  /**
   * POST /api/v1/media/image-temp
   * Upload an image to temp storage (for editing before final save).
   */
  @Post('image-temp')
  @UseInterceptors(
    FileInterceptor('image', {
      limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
      fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowed.includes(file.mimetype)) {
          return cb(
            new BadRequestException(
              `Type MIME non autorisé: ${file.mimetype}. Formats acceptés: JPEG, PNG, WebP, GIF`,
            ),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async uploadTempImage(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('Aucune image fournie');
    }

    const userId = req.user.id;
    const result = await this.imageProcessingService.storeTempImage(
      userId,
      file.buffer,
      file.originalname,
    );

    return {
      success: true,
      data: result,
    };
  }

  /**
   * POST /api/v1/media/image-process
   * Process an image with transformations (crop, rotate, filters, format).
   * Accepts either a temp URL or a direct file upload.
   */
  @Post('image-process')
  @UseInterceptors(
    FileInterceptor('image', {
      limits: { fileSize: 50 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file) return cb(null, true);
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!allowed.includes(file.mimetype)) {
          return cb(
            new BadRequestException(`Type MIME non autorisé: ${file.mimetype}`),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  async processImage(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
    @Req() req: any,
  ) {
    const userId = req.user.id;

    // Parse options from body
    const options: ProcessImageOptions = {};

    if (body.rotate) options.rotate = parseInt(body.rotate, 10);
    if (body.flipH === 'true' || body.flipH === true) options.flipH = true;
    if (body.flipV === 'true' || body.flipV === true) options.flipV = true;
    if (body.brightness) options.brightness = parseFloat(body.brightness);
    if (body.contrast) options.contrast = parseFloat(body.contrast);
    if (body.saturation) options.saturation = parseFloat(body.saturation);
    if (body.format) options.format = body.format;
    if (body.quality) options.quality = parseInt(body.quality, 10);
    if (body.maxWidth) options.maxWidth = parseInt(body.maxWidth, 10);
    if (body.maxHeight) options.maxHeight = parseInt(body.maxHeight, 10);

    if (body.crop) {
      try {
        const crop = typeof body.crop === 'string' ? JSON.parse(body.crop) : body.crop;
        options.crop = {
          x: parseFloat(crop.x),
          y: parseFloat(crop.y),
          width: parseFloat(crop.width),
          height: parseFloat(crop.height),
        };
      } catch {
        throw new BadRequestException('Format de recadrage invalide');
      }
    }

    // Option A: Process from temp URL
    if (body.tempUrl && !file) {
      const result = await this.imageProcessingService.processTempImage(
        userId,
        body.tempUrl,
        options,
      );
      return { success: true, data: result };
    }

    // Option B: Process uploaded file directly
    if (file) {
      const result = await this.imageProcessingService.processImage(
        file.buffer,
        options,
      );

      // Store result in temp
      const stored = await this.imageProcessingService.storeTempImage(
        userId,
        result.buffer,
        `processed.${options.format || 'jpg'}`,
      );

      return {
        success: true,
        data: {
          url: stored.url,
          metadata: result.metadata,
        },
      };
    }

    throw new BadRequestException('Fournir une image ou un tempUrl');
  }
}
