import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  QueryCategoriesDto,
  CopyCategoryDto,
  UpdateCategoryGradesDto,
  QueryCategoryItemsDto,
  UpdateDefaultParentsDto,
} from './dto/category.dto';
import {
  CreateCategoryFieldDto,
  UpdateCategoryFieldDto,
} from './dto/category-field.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';

@ApiTags('categories')
@ApiBearerAuth()
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer une catégorie' })
  @ApiResponse({ status: 201, description: 'Catégorie créée' })
  async create(
    @CurrentUser() user: User,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.categoriesService.create(user.id, dto);
  }

  @Post('import-defaults')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Importer la hiérarchie par défaut' })
  @ApiResponse({ status: 200, description: 'Hiérarchie importée' })
  async importDefaults(@CurrentUser() user: User) {
    return this.categoriesService.importDefaults(user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les catégories' })
  @ApiResponse({ status: 200, description: 'Liste des catégories' })
  async findAll(
    @CurrentUser() user: User,
    @Query() query: QueryCategoriesDto,
  ) {
    return this.categoriesService.findAll(user.id, query);
  }

  @Get(':id/items')
  @ApiOperation({ summary: "Lister les articles d'une catégorie" })
  @ApiResponse({ status: 200, description: 'Liste des articles' })
  async getItems(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Query() query: QueryCategoryItemsDto,
  ) {
    return this.categoriesService.getItems(user.id, id, query);
  }

  @Get(':id/default-parents')
  @ApiOperation({ summary: "Voir les parents par défaut d'une catégorie (admin)" })
  @ApiResponse({ status: 200, description: 'Parents par défaut' })
  async getDefaultParents(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.categoriesService.getDefaultParentsForCategory(user.id, id);
  }

  @Get(':id')
  @ApiOperation({ summary: "Détails d'une catégorie" })
  @ApiResponse({ status: 200, description: 'Détails de la catégorie' })
  async findOne(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.categoriesService.findOne(user.id, id);
  }

  @Post(':id/copy')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Copier une catégorie' })
  @ApiResponse({ status: 201, description: 'Catégorie copiée' })
  async copy(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CopyCategoryDto,
  ) {
    return this.categoriesService.copy(user.id, id, dto);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Modifier une catégorie' })
  @ApiResponse({ status: 200, description: 'Catégorie modifiée' })
  async update(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(user.id, id, dto);
  }

  @Put(':id/grades')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Modifier les grades d'une catégorie" })
  @ApiResponse({ status: 200, description: 'Grades mis à jour' })
  async updateGrades(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCategoryGradesDto,
  ) {
    return this.categoriesService.updateGrades(user.id, id, dto);
  }

  @Put(':id/default-parents')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Modifier les parents par défaut d'une catégorie (admin)" })
  @ApiResponse({ status: 200, description: 'Parents par défaut mis à jour' })
  async updateDefaultParents(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDefaultParentsDto,
  ) {
    return this.categoriesService.updateDefaultParents(user.id, id, dto.parentIds);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer une catégorie' })
  @ApiResponse({ status: 200, description: 'Catégorie supprimée' })
  async remove(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.categoriesService.remove(user.id, id);
  }

  // ── Category Fields (admin-only) ──

  @Get(':id/fields')
  @ApiOperation({ summary: "Lister les champs d'une catégorie" })
  @ApiResponse({ status: 200, description: 'Liste des champs' })
  async getCategoryFields(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.categoriesService.getCategoryFields(id);
  }

  @Post(':id/fields')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Créer un champ pour une catégorie (admin)" })
  @ApiResponse({ status: 201, description: 'Champ créé' })
  async createCategoryField(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateCategoryFieldDto,
  ) {
    return this.categoriesService.createCategoryField(user.id, id, dto);
  }

  @Put(':id/fields/:fieldId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Modifier un champ d'une catégorie (admin)" })
  @ApiResponse({ status: 200, description: 'Champ modifié' })
  async updateCategoryField(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Param('fieldId', ParseIntPipe) fieldId: number,
    @Body() dto: UpdateCategoryFieldDto,
  ) {
    return this.categoriesService.updateCategoryField(user.id, id, fieldId, dto);
  }

  @Delete(':id/fields/:fieldId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Supprimer un champ d'une catégorie (admin)" })
  @ApiResponse({ status: 200, description: 'Champ supprimé' })
  async deleteCategoryField(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Param('fieldId', ParseIntPipe) fieldId: number,
  ) {
    return this.categoriesService.deleteCategoryField(user.id, id, fieldId);
  }
}
