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
import { CategoryMediaService, MediaType } from './category-media.service';
import { UpdateCategoryMediaDto, ReorderCategoryMediaDto } from './dto/category-media.dto';

@ApiTags('Category Media')
@ApiBearerAuth()
@Controller('categories/:categoryId/media')
export class CategoryMediaController {
  constructor(private readonly categoryMediaService: CategoryMediaService) {}

  @Get(':mediaType')
  @ApiOperation({ summary: 'Lister les médias d\'une catégorie par type' })
  async findAll(
    @Param('categoryId', ParseIntPipe) categoryId: number,
    @Param('mediaType') mediaType: string,
    @Req() req: any,
  ) {
    const validType = await this.categoryMediaService.validateMediaType(mediaType);
    return this.categoryMediaService.findAll(categoryId, req.user.id, validType);
  }

  @Post(':mediaType')
  @ApiOperation({ summary: 'Upload de médias pour une catégorie' })
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
    limits: { fileSize: 500 * 1024 * 1024 },
  }))
  async upload(
    @Param('categoryId', ParseIntPipe) categoryId: number,
    @Param('mediaType') mediaType: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('titles') titles: string | string[],
    @Req() req: any,
  ) {
    const validType = await this.categoryMediaService.validateMediaType(mediaType);
    const titlesArr = titles
      ? (Array.isArray(titles) ? titles : [titles])
      : undefined;
    return this.categoryMediaService.upload(categoryId, req.user.id, validType, files, titlesArr);
  }

  @Put(':mediaType/reorder')
  @ApiOperation({ summary: 'Réordonner les médias d\'une catégorie' })
  async reorder(
    @Param('categoryId', ParseIntPipe) categoryId: number,
    @Param('mediaType') mediaType: string,
    @Body() dto: ReorderCategoryMediaDto,
    @Req() req: any,
  ) {
    const validType = await this.categoryMediaService.validateMediaType(mediaType);
    return this.categoryMediaService.reorder(categoryId, req.user.id, validType, dto.order);
  }

  @Put(':mediaType/:mediaId')
  @ApiOperation({ summary: 'Modifier un média de catégorie' })
  async update(
    @Param('categoryId', ParseIntPipe) categoryId: number,
    @Param('mediaType') mediaType: string,
    @Param('mediaId', ParseIntPipe) mediaId: number,
    @Body() dto: UpdateCategoryMediaDto,
    @Req() req: any,
  ) {
    const validType = await this.categoryMediaService.validateMediaType(mediaType);
    return this.categoryMediaService.update(categoryId, req.user.id, validType, mediaId, dto);
  }

  @Delete(':mediaType/:mediaId')
  @ApiOperation({ summary: 'Supprimer un média de catégorie' })
  async remove(
    @Param('categoryId', ParseIntPipe) categoryId: number,
    @Param('mediaType') mediaType: string,
    @Param('mediaId', ParseIntPipe) mediaId: number,
    @Req() req: any,
  ) {
    const validType = await this.categoryMediaService.validateMediaType(mediaType);
    return this.categoryMediaService.remove(categoryId, req.user.id, validType, mediaId);
  }
}
