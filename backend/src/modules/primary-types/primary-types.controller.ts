import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PrimaryTypesService, CreateFieldDto, UpdateFieldDto } from './primary-types.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../database/entities/user.entity';

@ApiTags('primary-types')
@ApiBearerAuth()
@Controller('primary-types')
export class PrimaryTypesController {
  constructor(private readonly primaryTypesService: PrimaryTypesService) {}

  // ──── Public / Read ────

  @Get()
  @ApiOperation({ summary: 'Lister tous les types primaires' })
  @ApiResponse({ status: 200, description: 'Liste des types primaires' })
  async findAll(
    @CurrentUser() user: User,
    @Query('lang') lang?: string,
  ) {
    return this.primaryTypesService.findAll(lang || user.lang || 'fr');
  }

  @Get('field-types')
  @ApiOperation({ summary: 'Types de champs disponibles' })
  getFieldTypes() {
    return this.primaryTypesService.getFieldTypes();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détails d\'un type primaire avec ses champs' })
  @ApiResponse({ status: 200, description: 'Type primaire avec champs' })
  async findOne(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Query('lang') lang?: string,
  ) {
    return this.primaryTypesService.findOne(id, lang || user.lang || 'fr');
  }

  @Get('key/:keyName')
  @ApiOperation({ summary: 'Champs d\'un type par clé' })
  @ApiResponse({ status: 200, description: 'Champs du type' })
  async getFieldsByKey(
    @CurrentUser() user: User,
    @Param('keyName') keyName: string,
    @Query('lang') lang?: string,
  ) {
    return this.primaryTypesService.getFieldsByKey(keyName, lang || user.lang || 'fr');
  }

  // ──── Admin CRUD — Fields ────

  @Get(':id/admin-fields')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: lister tous les champs d\'un type (données brutes)' })
  async getFieldsForAdmin(@Param('id', ParseIntPipe) id: number) {
    return this.primaryTypesService.getFieldsForAdmin(id);
  }

  @Get('fields/:fieldId/admin')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: détails d\'un champ' })
  async getFieldForAdmin(@Param('fieldId', ParseIntPipe) fieldId: number) {
    return this.primaryTypesService.getFieldForAdmin(fieldId);
  }

  @Post('fields')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: créer un champ' })
  async createField(@Body() dto: CreateFieldDto) {
    return this.primaryTypesService.createField(dto);
  }

  @Put('fields/:fieldId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: modifier un champ' })
  async updateField(
    @Param('fieldId', ParseIntPipe) fieldId: number,
    @Body() dto: UpdateFieldDto,
  ) {
    return this.primaryTypesService.updateField(fieldId, dto);
  }

  @Delete('fields/:fieldId')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: supprimer un champ' })
  async deleteField(@Param('fieldId', ParseIntPipe) fieldId: number) {
    return this.primaryTypesService.deleteField(fieldId);
  }

  @Put(':id/reorder-fields')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Admin: réordonner les champs d\'un type' })
  async reorderFields(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { fields: { id: number; sortOrder: number }[] },
  ) {
    return this.primaryTypesService.reorderFields(id, body.fields);
  }
}
