import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  ParseIntPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiParam,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { QueryExploreUsersDto, QueryPublicItemsDto } from './dto/explore.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Obtenir le profil de l\'utilisateur connecté' })
  @ApiResponse({ status: 200, description: 'Profil utilisateur' })
  async getProfile(@CurrentUser() user: User) {
    return this.usersService.getProfile(user.id);
  }

  @Put('me')
  @ApiOperation({ summary: 'Mettre à jour le profil' })
  @ApiResponse({ status: 200, description: 'Profil mis à jour' })
  async updateProfile(
    @CurrentUser() user: User,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.id, dto);
  }

  @Put('me/password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Changer le mot de passe' })
  @ApiResponse({ status: 200, description: 'Mot de passe modifié' })
  @ApiResponse({ status: 401, description: 'Mot de passe actuel incorrect' })
  async changePassword(
    @CurrentUser() user: User,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(user.id, dto);
  }

  @Post('me/avatar')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Uploader un avatar' })
  @ApiResponse({ status: 200, description: 'Avatar mis à jour' })
  async uploadAvatar(
    @CurrentUser() user: User,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 2 * 1024 * 1024 }), // 2 MB
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp|gif)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.usersService.uploadAvatar(user.id, file);
  }

  // ──────────────────────────────────────────────
  // EXPLORE — Public users & collections
  // ──────────────────────────────────────────────

  @Get('explore')
  @ApiOperation({ summary: 'Rechercher des utilisateurs avec collections publiques' })
  @ApiResponse({ status: 200, description: 'Liste des utilisateurs publics' })
  async exploreUsers(
    @Query() query: QueryExploreUsersDto,
  ) {
    return this.usersService.searchPublicUsers(
      query.search,
      Number(query.page) || 1,
      Number(query.limit) || 20,
    );
  }

  @Get(':username')
  @ApiOperation({ summary: 'Voir le profil public d\'un utilisateur' })
  @ApiParam({ name: 'username', description: 'Nom d\'utilisateur' })
  @ApiResponse({ status: 200, description: 'Profil public' })
  @ApiResponse({ status: 403, description: 'Collection privée' })
  @ApiResponse({ status: 404, description: 'Utilisateur non trouvé' })
  async getPublicProfile(
    @Param('username') username: string,
    @CurrentUser() user: User,
  ) {
    return this.usersService.getPublicProfile(username, user.id);
  }

  @Get(':username/categories')
  @ApiOperation({ summary: 'Voir les catégories d\'un utilisateur' })
  @ApiParam({ name: 'username', description: 'Nom d\'utilisateur' })
  @ApiResponse({ status: 200, description: 'Catégories de l\'utilisateur' })
  async getPublicCategories(
    @Param('username') username: string,
    @Query() query: QueryExploreUsersDto,
    @CurrentUser() user: User,
  ) {
    return this.usersService.getPublicCategories(
      username,
      user.id,
      Number(query.page) || 1,
      Number(query.limit) || 50,
      query.search,
    );
  }

  @Get(':username/categories/:categoryId/items')
  @ApiOperation({ summary: 'Voir les articles d\'une catégorie d\'un utilisateur' })
  @ApiParam({ name: 'username', description: 'Nom d\'utilisateur' })
  @ApiParam({ name: 'categoryId', description: 'ID de la catégorie' })
  @ApiResponse({ status: 200, description: 'Articles de la catégorie' })
  async getPublicCategoryItems(
    @Param('username') username: string,
    @Param('categoryId', ParseIntPipe) categoryId: number,
    @Query() query: QueryPublicItemsDto,
    @CurrentUser() user: User,
  ) {
    return this.usersService.getPublicCategoryItems(
      username,
      categoryId,
      user.id,
      Number(query.page) || 1,
      Number(query.limit) || 50,
      query.sort || 'createdAt',
      query.order || 'desc',
      query.search,
    );
  }

  @Get(':username/items')
  @ApiOperation({ summary: 'Voir tous les articles d\'un utilisateur (avec filtres)' })
  @ApiParam({ name: 'username', description: 'Nom d\'utilisateur' })
  @ApiResponse({ status: 200, description: 'Articles de l\'utilisateur' })
  async getPublicItems(
    @Param('username') username: string,
    @Query() query: QueryPublicItemsDto,
    @CurrentUser() user: User,
  ) {
    return this.usersService.getPublicItems(username, user.id, {
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 24,
      search: query.search,
      sort: query.sort,
      order: query.order,
      categoryId: query.categoryId ? Number(query.categoryId) : undefined,
      searchState: query.searchState,
      statusId: query.statusId ? Number(query.statusId) : undefined,
      primaryTypeId: query.primaryTypeId ? Number(query.primaryTypeId) : undefined,
      minRating: query.minRating ? Number(query.minRating) : undefined,
      minValue: query.minValue ? Number(query.minValue) : undefined,
      maxValue: query.maxValue ? Number(query.maxValue) : undefined,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
    });
  }

  @Get(':username/items/:itemId')
  @ApiOperation({ summary: 'Voir le détail d\'un article d\'un utilisateur' })
  @ApiParam({ name: 'username', description: 'Nom d\'utilisateur' })
  @ApiParam({ name: 'itemId', description: 'ID de l\'article' })
  @ApiResponse({ status: 200, description: 'Détail de l\'article' })
  async getPublicItemDetail(
    @Param('username') username: string,
    @Param('itemId', ParseIntPipe) itemId: number,
    @CurrentUser() user: User,
  ) {
    return this.usersService.getPublicItemDetail(username, itemId, user.id);
  }
}
