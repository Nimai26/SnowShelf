import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseInterceptors,
  UploadedFiles,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags, ApiConsumes, ApiBody, ApiOperation } from '@nestjs/swagger';
import { ItemMediaService, MediaType } from './item-media.service';
import { UpdateMediaDto, ReorderMediaDto } from './dto/item-media.dto';

@ApiTags('Item Media')
@ApiBearerAuth()
@Controller('items/:itemId/media')
export class ItemMediaController {
  constructor(private readonly itemMediaService: ItemMediaService) {}

  @Get(':mediaType')
  @ApiOperation({ summary: 'Lister les médias d\'un item par type' })
  async findAll(
    @Param('itemId', ParseIntPipe) itemId: number,
    @Param('mediaType') mediaType: string,
    @Req() req: any,
  ) {
    const validType = await this.itemMediaService.validateMediaType(mediaType);
    return this.itemMediaService.findAll(itemId, req.user.id, validType);
  }

  @Post(':mediaType/from-temp')
  @ApiOperation({ summary: 'Attacher un fichier temporaire comme média d\'un item' })
  async attachFromTemp(
    @Param('itemId', ParseIntPipe) itemId: number,
    @Param('mediaType') mediaType: string,
    @Body() body: { tempUrl: string; title?: string },
    @Req() req: any,
  ) {
    const validType = await this.itemMediaService.validateMediaType(mediaType);
    return this.itemMediaService.attachFromTemp(itemId, req.user.id, validType, body.tempUrl, body.title);
  }

  @Post(':mediaType/from-url')
  @ApiOperation({ summary: 'Enregistrer une URL externe (YouTube, Vimeo, etc.) comme média d\'un item' })
  async attachFromUrl(
    @Param('itemId', ParseIntPipe) itemId: number,
    @Param('mediaType') mediaType: string,
    @Body() body: { url: string; title?: string; thumbnailUrl?: string },
    @Req() req: any,
  ) {
    const validType = await this.itemMediaService.validateMediaType(mediaType);
    return this.itemMediaService.attachFromUrl(itemId, req.user.id, validType, body.url, body.title, body.thumbnailUrl);
  }

  @Post(':mediaType')
  @ApiOperation({ summary: 'Upload de médias pour un item' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        'files': { type: 'array', items: { type: 'string', format: 'binary' } },
        'titles': { type: 'array', items: { type: 'string' } },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('files', 20, {
    limits: { fileSize: 500 * 1024 * 1024 }, // 500MB max per file (actual limit from upload_config)
  }))
  async upload(
    @Param('itemId', ParseIntPipe) itemId: number,
    @Param('mediaType') mediaType: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('titles') titles: string | string[],
    @Req() req: any,
  ) {
    const validType = await this.itemMediaService.validateMediaType(mediaType);
    const titlesArr = titles
      ? (Array.isArray(titles) ? titles : [titles])
      : undefined;
    return this.itemMediaService.upload(itemId, req.user.id, validType, files, titlesArr);
  }

  @Put(':mediaType/reorder')
  @ApiOperation({ summary: 'Réordonner les médias d\'un item' })
  async reorder(
    @Param('itemId', ParseIntPipe) itemId: number,
    @Param('mediaType') mediaType: string,
    @Body() dto: ReorderMediaDto,
    @Req() req: any,
  ) {
    const validType = await this.itemMediaService.validateMediaType(mediaType);
    return this.itemMediaService.reorder(itemId, req.user.id, validType, dto.order);
  }

  @Put(':mediaType/:mediaId')
  @ApiOperation({ summary: 'Modifier un média (titre, ordre)' })
  async update(
    @Param('itemId', ParseIntPipe) itemId: number,
    @Param('mediaType') mediaType: string,
    @Param('mediaId', ParseIntPipe) mediaId: number,
    @Body() dto: UpdateMediaDto,
    @Req() req: any,
  ) {
    const validType = await this.itemMediaService.validateMediaType(mediaType);
    return this.itemMediaService.update(itemId, req.user.id, validType, mediaId, dto);
  }

  @Delete(':mediaType/:mediaId')
  @ApiOperation({ summary: 'Supprimer un média' })
  async remove(
    @Param('itemId', ParseIntPipe) itemId: number,
    @Param('mediaType') mediaType: string,
    @Param('mediaId', ParseIntPipe) mediaId: number,
    @Req() req: any,
  ) {
    const validType = await this.itemMediaService.validateMediaType(mediaType);
    return this.itemMediaService.remove(itemId, req.user.id, validType, mediaId);
  }
}
