import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../database/entities/user.entity';
import {
  AdminTakoService,
  CreatePrimaryTypeDto,
  UpdatePrimaryTypeDto,
  CreateDomainDto,
  UpdateDomainDto,
  CreateProviderDto,
  UpdateProviderDto,
  UpdateTakoConfigDto,
} from './admin-tako.service';

@ApiTags('admin-tako')
@ApiBearerAuth()
@Roles(UserRole.ADMIN)
@Controller('admin/tako')
export class AdminTakoController {
  constructor(private readonly adminTakoService: AdminTakoService) {}

  // ══════════════════════════════════════════════
  //  TAKO API CONFIG
  // ══════════════════════════════════════════════

  @Get('config')
  @ApiOperation({ summary: 'Admin: Lire la configuration Tako API' })
  async getConfig() {
    return this.adminTakoService.getConfig();
  }

  @Put('config')
  @ApiOperation({ summary: 'Admin: Modifier la configuration Tako API' })
  async updateConfig(@Body() dto: UpdateTakoConfigDto) {
    return this.adminTakoService.updateConfig(dto);
  }

  @Post('config/health-check')
  @ApiOperation({ summary: 'Admin: Lancer un health check Tako API' })
  async triggerHealthCheck() {
    return this.adminTakoService.triggerHealthCheck();
  }

  // ══════════════════════════════════════════════
  //  PRIMARY TYPES
  // ══════════════════════════════════════════════

  @Get('types')
  @ApiOperation({ summary: 'Admin: Lister tous les types avec leurs domaines' })
  async getAllTypes() {
    return this.adminTakoService.getAllTypes();
  }

  @Post('types')
  @ApiOperation({ summary: 'Admin: Créer un type primaire' })
  async createType(@Body() dto: CreatePrimaryTypeDto) {
    return this.adminTakoService.createType(dto);
  }

  @Put('types/:id')
  @ApiOperation({ summary: 'Admin: Modifier un type primaire' })
  async updateType(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePrimaryTypeDto,
  ) {
    return this.adminTakoService.updateType(id, dto);
  }

  @Delete('types/:id')
  @ApiOperation({ summary: 'Admin: Supprimer un type primaire' })
  async deleteType(@Param('id', ParseIntPipe) id: number) {
    return this.adminTakoService.deleteType(id);
  }

  // ══════════════════════════════════════════════
  //  DOMAINS
  // ══════════════════════════════════════════════

  @Get('domains')
  @ApiOperation({ summary: 'Admin: Lister tous les domaines Tako avec providers' })
  async getAllDomains() {
    return this.adminTakoService.getAllDomains();
  }

  @Post('domains')
  @ApiOperation({ summary: 'Admin: Créer un domaine Tako' })
  async createDomain(@Body() dto: CreateDomainDto) {
    return this.adminTakoService.createDomain(dto);
  }

  @Put('domains/:id')
  @ApiOperation({ summary: 'Admin: Modifier un domaine Tako' })
  async updateDomain(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDomainDto,
  ) {
    return this.adminTakoService.updateDomain(id, dto);
  }

  @Delete('domains/:id')
  @ApiOperation({ summary: 'Admin: Supprimer un domaine Tako' })
  async deleteDomain(@Param('id', ParseIntPipe) id: number) {
    return this.adminTakoService.deleteDomain(id);
  }

  // ══════════════════════════════════════════════
  //  PROVIDERS
  // ══════════════════════════════════════════════

  @Post('providers')
  @ApiOperation({ summary: 'Admin: Créer un provider' })
  async createProvider(@Body() dto: CreateProviderDto) {
    return this.adminTakoService.createProvider(dto);
  }

  @Put('providers/:id')
  @ApiOperation({ summary: 'Admin: Modifier un provider' })
  async updateProvider(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProviderDto,
  ) {
    return this.adminTakoService.updateProvider(id, dto);
  }

  @Delete('providers/:id')
  @ApiOperation({ summary: 'Admin: Supprimer un provider' })
  async deleteProvider(@Param('id', ParseIntPipe) id: number) {
    return this.adminTakoService.deleteProvider(id);
  }

  @Patch('providers/:id/toggle')
  @ApiOperation({ summary: 'Admin: Activer/désactiver un provider' })
  async toggleProvider(@Param('id', ParseIntPipe) id: number) {
    return this.adminTakoService.toggleProvider(id);
  }
}
