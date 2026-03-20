import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsEnum,
  IsDateString,
  IsObject,
  IsBoolean,
  Min,
  Max,
  MaxLength,
  MinLength,
  ArrayMinSize,
  ValidateNested,
  IsUrl,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';

// ──────────────────────────────────────────────
// COPY
// ──────────────────────────────────────────────

export class CopyItemDto {
  @ApiPropertyOptional({ example: 'Mon item (copie)', description: 'Nom personnalisé pour la copie' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ example: false, description: 'Copier les médias (images, vidéos, audio, documents)' })
  @IsOptional()
  @IsBoolean()
  copyMedia?: boolean;
}

// ──────────────────────────────────────────────
// SUB-DTO for External Links
// ──────────────────────────────────────────────

export class ExternalLinkDto {
  @IsString()
  provider: string;

  @IsString()
  label: string;

  @IsString()
  url: string;
}

// ──────────────────────────────────────────────
// CREATE
// ──────────────────────────────────────────────

export class CreateItemDto {
  @ApiProperty({ example: 'The Legend of Zelda: Breath of the Wild' })
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ example: 'Version physique complète' })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  description?: string;

  @ApiProperty({ example: 2, description: 'ID du PrimaryType' })
  @IsNumber()
  @Type(() => Number)
  primaryTypeId: number;

  @ApiProperty({ example: [1, 3], description: 'IDs des catégories' })
  @IsArray()
  @IsNumber({}, { each: true })
  @ArrayMinSize(1)
  @Type(() => Number)
  categoryIds: number[];

  @ApiPropertyOptional({ example: 'Notes privées sur cet item' })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  notes?: string;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  rating?: number;

  @ApiPropertyOptional({ example: 59.99 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  purchasePrice?: number;

  @ApiPropertyOptional({ example: 45.99 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  marketValue?: number;

  @ApiPropertyOptional({ example: '2023-03-15' })
  @IsOptional()
  @IsDateString()
  dateObtained?: string;

  @ApiPropertyOptional({ enum: ['looking', 'owned'], example: 'owned' })
  @IsOptional()
  @IsEnum(['looking', 'owned'])
  searchState?: 'looking' | 'owned';

  @ApiPropertyOptional({ example: '045496590116' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  barcode?: string;

  @ApiPropertyOptional({ example: 1, description: 'ID du statut' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  statusId?: number;

  @ApiPropertyOptional({ example: 1, description: 'ID de l\'emplacement de stockage' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  storageLocationId?: number;

  @ApiPropertyOptional({ example: [1, 9], description: 'IDs des grades' })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  gradeIds?: number[];

  @ApiPropertyOptional({
    description: 'Métadonnées dynamiques (clé → valeur)',
    example: { platform: 'Nintendo Switch', publisher: 'Nintendo', year: 2017 },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Métadonnées de catégorie (clé → valeur)',
    example: { color: 'Ambre', cost: 3 },
  })
  @IsOptional()
  @IsObject()
  categoryMetadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Liens externes (sources: TMDB, TVDB, Amazon...)',
    example: [{ provider: 'tmdb', label: 'TMDB', url: 'https://themoviedb.org/movie/27205' }],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExternalLinkDto)
  externalLinks?: ExternalLinkDto[];}

// ──────────────────────────────────────────────
// UPDATE
// ──────────────────────────────────────────────

export class UpdateItemDto {
  @ApiPropertyOptional({ example: 'The Legend of Zelda: Breath of the Wild' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({ example: 'Version physique complète' })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  description?: string;

  @ApiPropertyOptional({ example: [1, 3] })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @ArrayMinSize(1)
  @Type(() => Number)
  categoryIds?: number[];

  @ApiPropertyOptional({ example: 'Notes privées' })
  @IsOptional()
  @IsString()
  @MaxLength(10000)
  notes?: string;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  @Type(() => Number)
  rating?: number;

  @ApiPropertyOptional({ example: 59.99 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  purchasePrice?: number;

  @ApiPropertyOptional({ example: 45.99 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  marketValue?: number;

  @ApiPropertyOptional({ example: '2023-03-15' })
  @IsOptional()
  @IsDateString()
  dateObtained?: string;

  @ApiPropertyOptional({ enum: ['looking', 'owned'] })
  @IsOptional()
  @IsEnum(['looking', 'owned'])
  searchState?: 'looking' | 'owned';

  @ApiPropertyOptional({ example: '045496590116' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  barcode?: string;

  @ApiPropertyOptional({ example: 1, description: 'ID du statut' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  statusId?: number;

  @ApiPropertyOptional({ example: 1, description: 'ID de l\'emplacement de stockage' })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  storageLocationId?: number;

  @ApiPropertyOptional({ example: [1, 9], description: 'IDs des grades' })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  @Type(() => Number)
  gradeIds?: number[];

  @ApiPropertyOptional({
    description: 'Métadonnées dynamiques (clé → valeur)',
    example: { platform: 'Nintendo Switch' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Métadonnées de catégorie (clé → valeur)',
    example: { color: 'Ambre', cost: 3 },
  })
  @IsOptional()
  @IsObject()
  categoryMetadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Liens externes (sources: TMDB, TVDB, Amazon...)',
    example: [{ provider: 'tmdb', label: 'TMDB', url: 'https://themoviedb.org/movie/27205' }],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExternalLinkDto)
  externalLinks?: ExternalLinkDto[];
}

// ──────────────────────────────────────────────
// QUERY
// ──────────────────────────────────────────────

export class QueryItemsDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  categoryId?: number;

  @ApiPropertyOptional({ example: 'zelda' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(5)
  minRating?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minValue?: number;

  @ApiPropertyOptional({ example: 1000 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxValue?: number;

  @ApiPropertyOptional({ example: '2020-01-01' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ enum: ['looking', 'owned'] })
  @IsOptional()
  @IsEnum(['looking', 'owned'])
  searchState?: 'looking' | 'owned';

  @ApiPropertyOptional({ example: 1, description: 'Filtrer par statut' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  statusId?: number;

  @ApiPropertyOptional({ example: 2, description: 'Filtrer par PrimaryType' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  primaryTypeId?: number;

  @ApiPropertyOptional({ example: 1, description: 'Filtrer par emplacement de stockage' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  storageLocationId?: number;

  @ApiPropertyOptional({ example: '045496590116', description: 'Recherche par code-barres' })
  @IsOptional()
  @IsString()
  barcode?: string;

  @ApiPropertyOptional({ example: [1, 3], description: 'Filtrer par IDs de grades (OR)' })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') return value.split(',').map(Number);
    if (Array.isArray(value)) return value.map(Number);
    return [Number(value)];
  })
  @IsArray()
  @IsNumber({}, { each: true })
  gradeIds?: number[];

  @ApiPropertyOptional({ enum: ['name', 'createdAt', 'value', 'rating', 'purchasePrice', 'dateObtained'], default: 'createdAt' })
  @IsOptional()
  @IsEnum(['name', 'createdAt', 'value', 'rating', 'purchasePrice', 'dateObtained'])
  sort?: 'name' | 'createdAt' | 'value' | 'rating' | 'purchasePrice' | 'dateObtained';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  order?: 'asc' | 'desc';

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number;
}
