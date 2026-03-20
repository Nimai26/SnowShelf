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
import { StorageLocationsService } from './storage-locations.service';
import { CreateStorageLocationDto, UpdateStorageLocationDto } from './dto/storage-location.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../database/entities/user.entity';

@ApiTags('storage-locations')
@ApiBearerAuth()
@Controller('storage-locations')
export class StorageLocationsController {
  constructor(private readonly locService: StorageLocationsService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les emplacements de stockage' })
  @ApiResponse({ status: 200, description: 'Liste des emplacements' })
  async findAll(@CurrentUser() user: User) {
    return this.locService.findAll(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détails d\'un emplacement' })
  @ApiResponse({ status: 200, description: 'Détails de l\'emplacement' })
  async findOne(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.locService.findOne(user.id, id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un emplacement de stockage' })
  @ApiResponse({ status: 201, description: 'Emplacement créé' })
  async create(@CurrentUser() user: User, @Body() dto: CreateStorageLocationDto) {
    return this.locService.create(user.id, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Modifier un emplacement' })
  @ApiResponse({ status: 200, description: 'Emplacement modifié' })
  async update(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateStorageLocationDto,
  ) {
    return this.locService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer un emplacement' })
  @ApiResponse({ status: 200, description: 'Emplacement supprimé' })
  async remove(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number) {
    return this.locService.remove(user.id, id);
  }
}
