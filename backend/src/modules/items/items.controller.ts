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
import { ItemsService } from './items.service';
import { CreateItemDto, UpdateItemDto, QueryItemsDto, CopyItemDto } from './dto/item.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';

@ApiTags('items')
@ApiBearerAuth()
@Controller('items')
export class ItemsController {
  constructor(private readonly itemsService: ItemsService) {}

  @Get('check-duplicate')
  @ApiOperation({ summary: 'Vérifier si un item similaire existe déjà (par barcode ou nom)' })
  @ApiResponse({ status: 200, description: 'Résultat de vérification de doublon' })
  async checkDuplicate(
    @CurrentUser() user: User,
    @Query('barcode') barcode?: string,
    @Query('name') name?: string,
  ) {
    return this.itemsService.checkDuplicate(user.id, barcode, name);
  }  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un item' })
  @ApiResponse({ status: 201, description: 'Item créé' })
  async create(
    @CurrentUser() user: User,
    @Body() dto: CreateItemDto,
  ) {
    return this.itemsService.create(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister les items' })
  @ApiResponse({ status: 200, description: 'Liste des items' })
  async findAll(
    @CurrentUser() user: User,
    @Query() query: QueryItemsDto,
    @Query('lang') lang?: string,
  ) {
    return this.itemsService.findAll(user.id, query, lang || 'fr');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détails d\'un item' })
  @ApiResponse({ status: 200, description: 'Détails de l\'item' })
  async findOne(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Query('lang') lang?: string,
  ) {
    return this.itemsService.findOne(user.id, id, lang || 'fr');
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Modifier un item' })
  @ApiResponse({ status: 200, description: 'Item modifié' })
  async update(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateItemDto,
  ) {
    return this.itemsService.update(user.id, id, dto);
  }

  @Post(':id/copy')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Dupliquer un item' })
  @ApiResponse({ status: 201, description: 'Item dupliqué' })
  async copy(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CopyItemDto,
  ) {
    return this.itemsService.copy(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer un item' })
  @ApiResponse({ status: 200, description: 'Item supprimé' })
  async remove(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.itemsService.remove(user.id, id);
  }
}
