import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Domain } from '../../database/entities/domain.entity';
import { TakoProvider } from '../../database/entities/tako-provider.entity';
import { PrimaryType } from '../../database/entities/primary-type.entity';
import { TakoApiConfig } from '../../database/entities/tako-api-config.entity';
import { TakoService } from './tako.service';

// ──────────────────────────────────────────────
//  DTOs
// ──────────────────────────────────────────────

export interface CreatePrimaryTypeDto {
  keyName: string;
  nameFr: string;
  nameEn: string;
  icon: string;
  color?: string;
  sortOrder?: number;
  domainIds?: number[];
}

export interface UpdatePrimaryTypeDto {
  keyName?: string;
  nameFr?: string;
  nameEn?: string;
  icon?: string;
  color?: string;
  sortOrder?: number;
  domainIds?: number[];
}

export interface CreateDomainDto {
  name: string;
  displayName: string;
  icon?: string;
  routePath?: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateDomainDto {
  displayName?: string;
  icon?: string;
  routePath?: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface CreateProviderDto {
  domainId: number;
  key: string;
  displayName: string;
  description?: string;
  detailSegment?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateProviderDto {
  displayName?: string;
  description?: string;
  detailSegment?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateTakoConfigDto {
  apiUrl?: string;
  timeout?: number;
  cacheTtl?: number;
  maxRetries?: number;
  isActive?: boolean;
}

@Injectable()
export class AdminTakoService {
  private readonly logger = new Logger(AdminTakoService.name);

  constructor(
    @InjectRepository(Domain)
    private readonly domainRepo: Repository<Domain>,
    @InjectRepository(TakoProvider)
    private readonly providerRepo: Repository<TakoProvider>,
    @InjectRepository(PrimaryType)
    private readonly ptRepo: Repository<PrimaryType>,
    @InjectRepository(TakoApiConfig)
    private readonly configRepo: Repository<TakoApiConfig>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly takoService: TakoService,
  ) {}

  // ══════════════════════════════════════════════
  //  TAKO API CONFIG
  // ══════════════════════════════════════════════

  async getConfig(): Promise<TakoApiConfig> {
    let config = await this.configRepo.findOne({ where: { id: 1 } });
    if (!config) {
      // Create default config if none exists
      config = this.configRepo.create({
        apiUrl: 'http://localhost:3002',
        timeout: 30000,
        cacheTtl: 3600,
        maxRetries: 3,
        isActive: true,
        healthStatus: 'down',
      });
      config = await this.configRepo.save(config);
    }
    return config;
  }

  async updateConfig(dto: UpdateTakoConfigDto): Promise<TakoApiConfig> {
    let config = await this.getConfig();
    if (dto.apiUrl !== undefined) config.apiUrl = dto.apiUrl;
    if (dto.timeout !== undefined) config.timeout = dto.timeout;
    if (dto.cacheTtl !== undefined) config.cacheTtl = dto.cacheTtl;
    if (dto.maxRetries !== undefined) config.maxRetries = dto.maxRetries;
    if (dto.isActive !== undefined) config.isActive = dto.isActive;
    config = await this.configRepo.save(config);

    // Reload config in TakoService so it takes effect immediately
    await this.takoService.reloadConfig();

    this.logger.log(`Tako API config updated → ${config.apiUrl}`);
    return config;
  }

  async triggerHealthCheck() {
    return this.takoService.healthCheck();
  }

  // ══════════════════════════════════════════════
  //  PRIMARY TYPES CRUD
  // ══════════════════════════════════════════════

  async getAllTypes() {
    const types = await this.ptRepo.find({
      relations: ['domains'],
      order: { sortOrder: 'ASC' },
    });
    return {
      success: true,
      data: types.map((t) => ({
        id: t.id,
        keyName: t.keyName,
        nameFr: t.nameFr,
        nameEn: t.nameEn,
        icon: t.icon,
        color: t.color,
        sortOrder: t.sortOrder,
        domainIds: (t.domains || []).map((d) => d.id),
        domains: (t.domains || []).map((d) => ({
          id: d.id,
          name: d.name,
          displayName: d.displayName,
          icon: d.icon,
        })),
      })),
    };
  }

  async createType(dto: CreatePrimaryTypeDto) {
    // Vérifier unicité de la clé
    const existing = await this.ptRepo.findOne({ where: { keyName: dto.keyName } });
    if (existing) {
      throw new BadRequestException(`La clé '${dto.keyName}' existe déjà`);
    }

    const type = this.ptRepo.create({
      keyName: dto.keyName,
      nameFr: dto.nameFr,
      nameEn: dto.nameEn,
      icon: dto.icon,
      color: dto.color || '#3498db',
      sortOrder: dto.sortOrder ?? 0,
    });

    // Assigner les domaines
    if (dto.domainIds && dto.domainIds.length > 0) {
      type.domains = await this.domainRepo.find({ where: { id: In(dto.domainIds) } });
    } else {
      type.domains = [];
    }

    const saved = await this.ptRepo.save(type);
    await this.invalidateTypeCaches();
    return { success: true, data: saved };
  }

  async updateType(id: number, dto: UpdatePrimaryTypeDto) {
    const type = await this.ptRepo.findOne({ where: { id }, relations: ['domains'] });
    if (!type) throw new NotFoundException('Type primaire non trouvé');

    // Vérifier unicité si keyName change
    if (dto.keyName && dto.keyName !== type.keyName) {
      const existing = await this.ptRepo.findOne({ where: { keyName: dto.keyName } });
      if (existing) throw new BadRequestException(`La clé '${dto.keyName}' existe déjà`);
      type.keyName = dto.keyName;
    }

    if (dto.nameFr !== undefined) type.nameFr = dto.nameFr;
    if (dto.nameEn !== undefined) type.nameEn = dto.nameEn;
    if (dto.icon !== undefined) type.icon = dto.icon;
    if (dto.color !== undefined) type.color = dto.color;
    if (dto.sortOrder !== undefined) type.sortOrder = dto.sortOrder;

    if (dto.domainIds !== undefined) {
      type.domains = dto.domainIds.length > 0
        ? await this.domainRepo.find({ where: { id: In(dto.domainIds) } })
        : [];
    }

    const saved = await this.ptRepo.save(type);
    await this.invalidateTypeCaches(id);
    return { success: true, data: saved };
  }

  async deleteType(id: number) {
    const type = await this.ptRepo.findOne({ where: { id }, relations: ['fields'] });
    if (!type) throw new NotFoundException('Type primaire non trouvé');

    // Prevent deleting "divers" (fallback type)
    if (type.keyName === 'divers') {
      throw new BadRequestException('Le type "Divers" ne peut pas être supprimé');
    }

    await this.ptRepo.remove(type);
    await this.invalidateTypeCaches();
    return { success: true, message: `Type '${type.nameFr}' supprimé` };
  }

  // ══════════════════════════════════════════════
  //  DOMAINS CRUD
  // ══════════════════════════════════════════════

  async getAllDomains() {
    const domains = await this.domainRepo.find({
      relations: ['providers'],
      order: { sortOrder: 'ASC' },
    });
    return {
      success: true,
      data: domains.map((d) => ({
        id: d.id,
        name: d.name,
        displayName: d.displayName,
        icon: d.icon,
        routePath: d.routePath,
        description: d.description,
        isActive: d.isActive,
        sortOrder: d.sortOrder,
        providers: (d.providers || [])
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((p) => ({
            id: p.id,
            key: p.key,
            displayName: p.displayName,
            description: p.description,
            detailSegment: p.detailSegment,
            isActive: p.isActive,
            sortOrder: p.sortOrder,
          })),
      })),
    };
  }

  async createDomain(dto: CreateDomainDto) {
    const existing = await this.domainRepo.findOne({ where: { name: dto.name } });
    if (existing) throw new BadRequestException(`Le domaine '${dto.name}' existe déjà`);

    const domain = this.domainRepo.create({
      name: dto.name,
      displayName: dto.displayName,
      icon: dto.icon || null,
      routePath: dto.routePath || `/api/${dto.name}`,
      description: dto.description || null,
      isActive: dto.isActive !== false,
      sortOrder: dto.sortOrder ?? 0,
    });

    const saved = await this.domainRepo.save(domain);
    await this.invalidateDomainCaches();
    return { success: true, data: saved };
  }

  async updateDomain(id: number, dto: UpdateDomainDto) {
    const domain = await this.domainRepo.findOne({ where: { id } });
    if (!domain) throw new NotFoundException('Domaine non trouvé');

    if (dto.displayName !== undefined) domain.displayName = dto.displayName;
    if (dto.icon !== undefined) domain.icon = dto.icon;
    if (dto.routePath !== undefined) domain.routePath = dto.routePath;
    if (dto.description !== undefined) domain.description = dto.description;
    if (dto.isActive !== undefined) domain.isActive = dto.isActive;
    if (dto.sortOrder !== undefined) domain.sortOrder = dto.sortOrder;

    const saved = await this.domainRepo.save(domain);
    await this.invalidateDomainCaches();
    return { success: true, data: saved };
  }

  async deleteDomain(id: number) {
    const domain = await this.domainRepo.findOne({ where: { id } });
    if (!domain) throw new NotFoundException('Domaine non trouvé');

    await this.domainRepo.remove(domain);
    await this.invalidateDomainCaches();
    return { success: true, message: `Domaine '${domain.displayName}' supprimé` };
  }

  // ══════════════════════════════════════════════
  //  PROVIDERS CRUD
  // ══════════════════════════════════════════════

  async createProvider(dto: CreateProviderDto) {
    const domain = await this.domainRepo.findOne({ where: { id: dto.domainId } });
    if (!domain) throw new NotFoundException('Domaine non trouvé');

    const existing = await this.providerRepo.findOne({ where: { domainId: dto.domainId, key: dto.key } });
    if (existing) throw new BadRequestException(`Le provider '${dto.key}' existe déjà pour ce domaine`);

    const provider = this.providerRepo.create({
      domainId: dto.domainId,
      key: dto.key,
      displayName: dto.displayName,
      description: dto.description || null,
      detailSegment: dto.detailSegment || null,
      isActive: dto.isActive !== false,
      sortOrder: dto.sortOrder ?? 0,
    });

    const saved = await this.providerRepo.save(provider);
    await this.invalidateDomainCaches();
    return { success: true, data: saved };
  }

  async updateProvider(id: number, dto: UpdateProviderDto) {
    const provider = await this.providerRepo.findOne({ where: { id } });
    if (!provider) throw new NotFoundException('Provider non trouvé');

    if (dto.displayName !== undefined) provider.displayName = dto.displayName;
    if (dto.description !== undefined) provider.description = dto.description;
    if (dto.detailSegment !== undefined) provider.detailSegment = dto.detailSegment;
    if (dto.isActive !== undefined) provider.isActive = dto.isActive;
    if (dto.sortOrder !== undefined) provider.sortOrder = dto.sortOrder;

    const saved = await this.providerRepo.save(provider);
    await this.invalidateDomainCaches();
    return { success: true, data: saved };
  }

  async deleteProvider(id: number) {
    const provider = await this.providerRepo.findOne({ where: { id } });
    if (!provider) throw new NotFoundException('Provider non trouvé');

    await this.providerRepo.remove(provider);
    await this.invalidateDomainCaches();
    return { success: true, message: `Provider '${provider.displayName}' supprimé` };
  }

  async toggleProvider(id: number) {
    const provider = await this.providerRepo.findOne({ where: { id } });
    if (!provider) throw new NotFoundException('Provider non trouvé');

    provider.isActive = !provider.isActive;
    const saved = await this.providerRepo.save(provider);
    await this.invalidateDomainCaches();
    return { success: true, data: { id: saved.id, isActive: saved.isActive } };
  }

  // ══════════════════════════════════════════════
  //  CACHE INVALIDATION
  // ══════════════════════════════════════════════

  private async invalidateTypeCaches(typeId?: number) {
    try {
      const keys = [
        'primary_types_all_fr',
        'primary_types_all_en',
        'tako:primary_type_to_domains',
        'tako:domain_to_primary_type',
        'tako:domains',
      ];
      if (typeId) {
        keys.push(`primary_type_${typeId}_fr`, `primary_type_${typeId}_en`);
      }
      for (const key of keys) {
        await this.cacheManager.del(key);
      }
    } catch (e) {
      this.logger.warn('Cache invalidation failed', e);
    }
  }

  private async invalidateDomainCaches() {
    try {
      const keys = [
        'tako:domains',
        'tako:domain_routes',
        'tako:domain_providers',
        'tako:detail_segments',
        'tako:primary_type_to_domains',
        'tako:domain_to_primary_type',
      ];
      for (const key of keys) {
        await this.cacheManager.del(key);
      }
    } catch (e) {
      this.logger.warn('Cache invalidation failed', e);
    }
  }
}
