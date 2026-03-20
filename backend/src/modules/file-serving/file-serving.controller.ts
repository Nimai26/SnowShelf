import {
  Controller,
  Get,
  Param,
  Res,
  Req,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response, Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

@ApiTags('File Serving')
@Controller('storage')
export class FileServingController {
  private readonly storagePath = '/app/storage';

  /**
   * Fichiers publics : default_categories
   */
  @Public()
  @Get('default_categories/*')
  @ApiOperation({ summary: 'Servir fichiers catégories par défaut (public)' })
  async serveDefaultCategory(@Param() params: any, @Res() res: Response, @Req() req: Request) {
    // NestJS stores wildcard params as '0' or 'path'
    const filePath = params[0] || params['0'];
    const fullPath = path.join(this.storagePath, 'default_categories', filePath);
    return this.sendFile(fullPath, res, req);
  }

  /**
   * Fichiers utilisateur : nécessite authentification
   */
  @Get('users/:userId/*')
  @ApiOperation({ summary: 'Servir fichiers utilisateur (auth requise)' })
  async serveUserFile(
    @Param('userId') userId: string,
    @Param() params: any,
    @Res() res: Response,
    @Req() req: any,
  ) {
    // Vérifier que l'utilisateur accède à ses propres fichiers
    if (String(req.user.id) !== userId && req.user.role !== 'admin') {
      throw new ForbiddenException('Accès non autorisé à ces fichiers');
    }

    const filePath = params[0] || params['0'];
    const fullPath = path.join(this.storagePath, 'users', userId, filePath);
    return this.sendFile(fullPath, res, req);
  }

  private sendFile(fullPath: string, res: Response, req: Request) {
    // Sanitize path to prevent directory traversal
    const resolved = path.resolve(fullPath);
    if (!resolved.startsWith(this.storagePath)) {
      throw new ForbiddenException('Chemin non autorisé');
    }

    if (!fs.existsSync(resolved)) {
      throw new NotFoundException('Fichier introuvable');
    }

    const stat = fs.statSync(resolved);
    const etag = crypto.createHash('md5').update(`${stat.size}-${stat.mtimeMs}`).digest('hex');
    const lastModified = stat.mtime.toUTCString();

    // Check ETag
    if (req.headers['if-none-match'] === etag) {
      res.status(304).end();
      return;
    }

    // Check Last-Modified
    if (req.headers['if-modified-since'] === lastModified) {
      res.status(304).end();
      return;
    }

    // Determine content type
    const ext = path.extname(resolved).toLowerCase();
    const contentType = this.getContentType(ext);

    // Set cache headers
    res.set({
      'Content-Type': contentType,
      'Content-Length': stat.size,
      'ETag': etag,
      'Last-Modified': lastModified,
      'Cache-Control': 'public, max-age=86400', // 24h
    });

    // Streaming for large files (>50MB)
    if (stat.size > 50 * 1024 * 1024) {
      const range = req.headers.range;
      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
        const chunkSize = end - start + 1;

        res.status(206);
        res.set({
          'Content-Range': `bytes ${start}-${end}/${stat.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunkSize,
        });

        const stream = fs.createReadStream(resolved, { start, end, highWaterMark: 8 * 1024 });
        stream.pipe(res);
        return;
      }
    }

    // Accept-Ranges for videos/audio
    if (['video', 'audio'].some(t => contentType.startsWith(t))) {
      res.set('Accept-Ranges', 'bytes');

      const range = req.headers.range;
      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
        const chunkSize = end - start + 1;

        res.status(206);
        res.set({
          'Content-Range': `bytes ${start}-${end}/${stat.size}`,
          'Content-Length': chunkSize,
        });

        const stream = fs.createReadStream(resolved, { start, end });
        stream.pipe(res);
        return;
      }
    }

    // Regular file serving
    const stream = fs.createReadStream(resolved);
    stream.pipe(res);
  }

  private getContentType(ext: string): string {
    const types: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.avi': 'video/x-msvideo',
      '.mkv': 'video/x-matroska',
      '.mov': 'video/quicktime',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
      '.flac': 'audio/flac',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain',
      '.zip': 'application/zip',
      '.epub': 'application/epub+zip',
      '.cbr': 'application/x-cbr',
      '.cbz': 'application/x-cbz',
    };
    return types[ext] || 'application/octet-stream';
  }
}
