import { Injectable, Logger, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrimaryType } from '../../database/entities/primary-type.entity';
import { PrimaryTypeField, FieldType } from '../../database/entities/primary-type-field.entity';

const CACHE_TTL_SECONDS = 3600; // 1 heure — données quasi-statiques

@Injectable()
export class PrimaryTypesService {
  private readonly logger = new Logger(PrimaryTypesService.name);

  constructor(
    @InjectRepository(PrimaryType)
    private readonly ptRepo: Repository<PrimaryType>,
    @InjectRepository(PrimaryTypeField)
    private readonly ptfRepo: Repository<PrimaryTypeField>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  // ──────────────────────────────────────────────
  // GET ALL TYPES
  // ──────────────────────────────────────────────
  async findAll(lang: string = 'fr') {
    const cacheKey = `primary_types_all_${lang}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const types = await this.ptRepo.find({
      order: { sortOrder: 'ASC' },
    });

    const result = {
      success: true,
      data: types.map((t) => ({
        id: t.id,
        key: t.keyName,
        name: lang === 'en' ? t.nameEn : t.nameFr,
        nameFr: t.nameFr,
        nameEn: t.nameEn,
        icon: t.icon,
        color: t.color,
        sortOrder: t.sortOrder,
      })),
    };

    await this.cacheManager.set(cacheKey, result, CACHE_TTL_SECONDS);
    return result;
  }

  // ──────────────────────────────────────────────
  // GET ONE TYPE WITH FIELDS
  // ──────────────────────────────────────────────
  async findOne(id: number, lang: string = 'fr') {
    const cacheKey = `primary_type_${id}_${lang}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const type = await this.ptRepo.findOne({
      where: { id },
      relations: ['fields'],
    });

    if (!type) {
      throw new NotFoundException('Type primaire non trouvé');
    }

    // Trier les champs
    const sortedFields = (type.fields || []).sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );

    const result = {
      success: true,
      data: {
        id: type.id,
        key: type.keyName,
        name: lang === 'en' ? type.nameEn : type.nameFr,
        nameFr: type.nameFr,
        nameEn: type.nameEn,
        icon: type.icon,
        color: type.color,
        sortOrder: type.sortOrder,
        fields: sortedFields.map((f) => ({
          id: f.id,
          key: f.fieldKey,
          name: lang === 'en' ? f.fieldNameEn : f.fieldNameFr,
          nameFr: f.fieldNameFr,
          nameEn: f.fieldNameEn,
          type: f.fieldType,
          options: f.fieldOptions,
          placeholder: lang === 'en' ? f.placeholderEn : f.placeholderFr,
          helpText: lang === 'en' ? f.helpTextEn : f.helpTextFr,
          icon: f.icon,
          isRequired: f.isRequired,
          isSearchable: f.isSearchable,
          isFilterable: f.isFilterable,
          sortOrder: f.sortOrder,
        })),
      },
    };

    await this.cacheManager.set(cacheKey, result, CACHE_TTL_SECONDS);
    return result;
  }

  // ──────────────────────────────────────────────
  // GET FIELDS BY TYPE KEY
  // ──────────────────────────────────────────────
  async getFieldsByKey(keyName: string, lang: string = 'fr') {
    const cacheKey = `primary_type_fields_${keyName}_${lang}`;
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const type = await this.ptRepo.findOne({
      where: { keyName },
      relations: ['fields'],
    });

    if (!type) {
      throw new NotFoundException(`Type primaire '${keyName}' non trouvé`);
    }

    const sortedFields = (type.fields || []).sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );

    const result = {
      success: true,
      data: sortedFields.map((f) => ({
        id: f.id,
        key: f.fieldKey,
        name: lang === 'en' ? f.fieldNameEn : f.fieldNameFr,
        type: f.fieldType,
        options: f.fieldOptions,
        placeholder: lang === 'en' ? f.placeholderEn : f.placeholderFr,
        icon: f.icon,
        isRequired: f.isRequired,
        sortOrder: f.sortOrder,
      })),
    };

    await this.cacheManager.set(cacheKey, result, CACHE_TTL_SECONDS);
    return result;
  }

  // ══════════════════════════════════════════════
  //  ADMIN CRUD — PrimaryType Fields
  // ══════════════════════════════════════════════

  /**
   * List all fields for a given type (admin — raw data with all locale columns)
   */
  async getFieldsForAdmin(primaryTypeId: number) {
    const type = await this.ptRepo.findOne({ where: { id: primaryTypeId } });
    if (!type) throw new NotFoundException('Type primaire non trouvé');

    const fields = await this.ptfRepo.find({
      where: { primaryTypeId },
      order: { sortOrder: 'ASC' },
    });

    return {
      success: true,
      data: {
        type: { id: type.id, key: type.keyName, nameFr: type.nameFr, nameEn: type.nameEn, icon: type.icon },
        fields: fields.map((f) => this.mapFieldForAdmin(f)),
      },
    };
  }

  /**
   * Get a single field by ID (admin)
   */
  async getFieldForAdmin(fieldId: number) {
    const field = await this.ptfRepo.findOne({ where: { id: fieldId }, relations: ['primaryType'] });
    if (!field) throw new NotFoundException('Champ non trouvé');
    return { success: true, data: this.mapFieldForAdmin(field) };
  }

  /**
   * Create a new field
   */
  async createField(dto: CreateFieldDto) {
    // Vérifier que le type existe
    const type = await this.ptRepo.findOne({ where: { id: dto.primaryTypeId } });
    if (!type) throw new NotFoundException('Type primaire non trouvé');

    // Vérifier l'unicité de la clé
    const existing = await this.ptfRepo.findOne({
      where: { primaryTypeId: dto.primaryTypeId, fieldKey: dto.fieldKey },
    });
    if (existing) {
      throw new BadRequestException(`La clé '${dto.fieldKey}' existe déjà pour ce type`);
    }

    // Auto-calculer sortOrder si non fourni
    if (dto.sortOrder === undefined || dto.sortOrder === null) {
      const maxResult = await this.ptfRepo
        .createQueryBuilder('f')
        .select('MAX(f.sortOrder)', 'max')
        .where('f.primaryTypeId = :ptId', { ptId: dto.primaryTypeId })
        .getRawOne();
      dto.sortOrder = (maxResult?.max || 0) + 1;
    }

    const field = this.ptfRepo.create({
      primaryTypeId: dto.primaryTypeId,
      fieldKey: dto.fieldKey,
      fieldNameFr: dto.fieldNameFr,
      fieldNameEn: dto.fieldNameEn || dto.fieldNameFr,
      fieldType: dto.fieldType || FieldType.TEXT,
      fieldOptions: dto.fieldOptions || null,
      placeholderFr: dto.placeholderFr || null,
      placeholderEn: dto.placeholderEn || null,
      helpTextFr: dto.helpTextFr || null,
      helpTextEn: dto.helpTextEn || null,
      icon: dto.icon || null,
      isRequired: dto.isRequired || false,
      isSearchable: dto.isSearchable !== undefined ? dto.isSearchable : true,
      isFilterable: dto.isFilterable !== undefined ? dto.isFilterable : true,
      sortOrder: dto.sortOrder,
    });

    const saved = await this.ptfRepo.save(field);
    await this.invalidateCache(dto.primaryTypeId);
    return { success: true, data: this.mapFieldForAdmin(saved) };
  }

  /**
   * Update an existing field
   */
  async updateField(fieldId: number, dto: UpdateFieldDto) {
    const field = await this.ptfRepo.findOne({ where: { id: fieldId } });
    if (!field) throw new NotFoundException('Champ non trouvé');

    // Si fieldKey change, vérifier l'unicité
    if (dto.fieldKey && dto.fieldKey !== field.fieldKey) {
      const existing = await this.ptfRepo.findOne({
        where: { primaryTypeId: field.primaryTypeId, fieldKey: dto.fieldKey },
      });
      if (existing) {
        throw new BadRequestException(`La clé '${dto.fieldKey}' existe déjà pour ce type`);
      }
    }

    // Appliquer les modifications
    if (dto.fieldKey !== undefined) field.fieldKey = dto.fieldKey;
    if (dto.fieldNameFr !== undefined) field.fieldNameFr = dto.fieldNameFr;
    if (dto.fieldNameEn !== undefined) field.fieldNameEn = dto.fieldNameEn;
    if (dto.fieldType !== undefined) field.fieldType = dto.fieldType;
    if (dto.fieldOptions !== undefined) field.fieldOptions = dto.fieldOptions;
    if (dto.placeholderFr !== undefined) field.placeholderFr = dto.placeholderFr;
    if (dto.placeholderEn !== undefined) field.placeholderEn = dto.placeholderEn;
    if (dto.helpTextFr !== undefined) field.helpTextFr = dto.helpTextFr;
    if (dto.helpTextEn !== undefined) field.helpTextEn = dto.helpTextEn;
    if (dto.icon !== undefined) field.icon = dto.icon;
    if (dto.isRequired !== undefined) field.isRequired = dto.isRequired;
    if (dto.isSearchable !== undefined) field.isSearchable = dto.isSearchable;
    if (dto.isFilterable !== undefined) field.isFilterable = dto.isFilterable;
    if (dto.sortOrder !== undefined) field.sortOrder = dto.sortOrder;

    const saved = await this.ptfRepo.save(field);
    await this.invalidateCache(field.primaryTypeId);
    return { success: true, data: this.mapFieldForAdmin(saved) };
  }

  /**
   * Delete a field (and all associated metadata)
   */
  async deleteField(fieldId: number) {
    const field = await this.ptfRepo.findOne({ where: { id: fieldId } });
    if (!field) throw new NotFoundException('Champ non trouvé');

    const ptId = field.primaryTypeId;
    await this.ptfRepo.remove(field);
    await this.invalidateCache(ptId);
    return { success: true, message: 'Champ supprimé' };
  }

  /**
   * Reorder fields for a type
   */
  async reorderFields(primaryTypeId: number, fieldOrders: { id: number; sortOrder: number }[]) {
    const type = await this.ptRepo.findOne({ where: { id: primaryTypeId } });
    if (!type) throw new NotFoundException('Type primaire non trouvé');

    for (const fo of fieldOrders) {
      await this.ptfRepo.update(fo.id, { sortOrder: fo.sortOrder });
    }

    await this.invalidateCache(primaryTypeId);
    return { success: true, message: 'Ordre mis à jour' };
  }

  /**
   * Get available field types enum
   */
  getFieldTypes() {
    return {
      success: true,
      data: Object.values(FieldType).map((ft) => ({
        value: ft,
        label: FIELD_TYPE_LABELS[ft] || ft,
      })),
    };
  }

  // ──────────────────────────────────────────────
  //  Private helpers
  // ──────────────────────────────────────────────

  private mapFieldForAdmin(f: PrimaryTypeField) {
    return {
      id: f.id,
      primaryTypeId: f.primaryTypeId,
      fieldKey: f.fieldKey,
      fieldNameFr: f.fieldNameFr,
      fieldNameEn: f.fieldNameEn,
      fieldType: f.fieldType,
      fieldOptions: f.fieldOptions,
      placeholderFr: f.placeholderFr,
      placeholderEn: f.placeholderEn,
      helpTextFr: f.helpTextFr,
      helpTextEn: f.helpTextEn,
      icon: f.icon,
      isRequired: f.isRequired,
      isSearchable: f.isSearchable,
      isFilterable: f.isFilterable,
      sortOrder: f.sortOrder,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
    };
  }

  private async invalidateCache(primaryTypeId?: number) {
    // Invalider tous les caches liés
    try {
      const keys = ['primary_types_all_fr', 'primary_types_all_en'];
      if (primaryTypeId) {
        keys.push(`primary_type_${primaryTypeId}_fr`, `primary_type_${primaryTypeId}_en`);
        // Trouver le keyName pour invalider le cache par clé
        const type = await this.ptRepo.findOne({ where: { id: primaryTypeId } });
        if (type) {
          keys.push(`primary_type_fields_${type.keyName}_fr`, `primary_type_fields_${type.keyName}_en`);
        }
      }
      for (const key of keys) {
        await this.cacheManager.del(key);
      }
    } catch (e) {
      this.logger.warn('Cache invalidation failed', e);
    }
  }
}

// DTO types
export interface CreateFieldDto {
  primaryTypeId: number;
  fieldKey: string;
  fieldNameFr: string;
  fieldNameEn?: string;
  fieldType?: FieldType;
  fieldOptions?: any;
  placeholderFr?: string;
  placeholderEn?: string;
  helpTextFr?: string;
  helpTextEn?: string;
  icon?: string;
  isRequired?: boolean;
  isSearchable?: boolean;
  isFilterable?: boolean;
  sortOrder?: number;
}

export interface UpdateFieldDto {
  fieldKey?: string;
  fieldNameFr?: string;
  fieldNameEn?: string;
  fieldType?: FieldType;
  fieldOptions?: any;
  placeholderFr?: string;
  placeholderEn?: string;
  helpTextFr?: string;
  helpTextEn?: string;
  icon?: string;
  isRequired?: boolean;
  isSearchable?: boolean;
  isFilterable?: boolean;
  sortOrder?: number;
}

const FIELD_TYPE_LABELS: Record<string, string> = {
  text: 'Texte court',
  textarea: 'Texte long',
  number: 'Nombre',
  year: 'Année',
  date: 'Date',
  select: 'Liste déroulante',
  multiselect: 'Sélection multiple',
  url: 'URL',
  rating: 'Note (étoiles)',
  duration: 'Durée (minutes)',
  boolean: 'Oui / Non',
};
