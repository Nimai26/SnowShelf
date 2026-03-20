import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { StatusesService } from './statuses.service';
import { CreateStatusDto, UpdateStatusDto } from './dto/status.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';

@ApiTags('statuses')
@ApiBearerAuth()
@Controller('statuses')
export class StatusesController {
  constructor(private readonly statusesService: StatusesService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les statuts accessibles' })
  @ApiResponse({ status: 200, description: 'Liste des statuts' })
  async findAll(@CurrentUser() user: User) {
    return this.statusesService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détails d\'un statut' })
  @ApiResponse({ status: 200, description: 'Détails du statut' })
  async findOne(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.statusesService.findOne(user.id, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un statut personnalisé (Premium/Admin)' })
  @ApiResponse({ status: 201, description: 'Statut créé' })
  async create(@CurrentUser() user: User, @Body() dto: CreateStatusDto) {
    return this.statusesService.create(user.id, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Modifier un statut personnel' })
  @ApiResponse({ status: 200, description: 'Statut modifié' })
  async update(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.statusesService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer un statut personnel' })
  @ApiResponse({ status: 200, description: 'Statut supprimé' })
  async remove(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.statusesService.remove(user.id, id);
  }
}
