import {
  IsString,
  IsOptional,
  IsBoolean,
  IsArray,
  IsNumber,
  IsIn,
  MaxLength,
  MinLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Jeux vidéo rétro' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiProperty({ description: "ID du type d'objet (obligatoire)", example: 2 })
  @IsNumber()
  primaryTypeId: number;

  @ApiPropertyOptional({ example: 'Ma collection de jeux rétro' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional({ example: 'Notes privées...' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;

  @ApiPropertyOptional({ example: '🎮' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  icon?: string;

  @ApiPropertyOptional({ enum: ['emoji', 'url'], default: 'emoji' })
  @IsOptional()
  @IsIn(['emoji', 'url'])
  iconType?: 'emoji' | 'url';

  @ApiPropertyOptional({ example: '#3498db' })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'La couleur doit être au format #RRGGBB' })
  color?: string;

  @ApiPropertyOptional({ description: 'Providers Tako pré-sélectionnés', example: ['igdb', 'rawg'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  defaultProviders?: string[];

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: 'Admin uniquement: créer comme catégorie par défaut', example: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ description: 'IDs des catégories parentes', example: [1, 2] })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  parentIds?: number[];
}

export class UpdateCategoryDto {
  @ApiPropertyOptional({ example: 'Jeux vidéo rétro' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'Ma collection de jeux rétro' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiPropertyOptional({ example: 'Notes privées...' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  notes?: string;

  @ApiPropertyOptional({ example: '🎮' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  icon?: string;

  @ApiPropertyOptional({ enum: ['emoji', 'url'], default: 'emoji' })
  @IsOptional()
  @IsIn(['emoji', 'url'])
  iconType?: 'emoji' | 'url';

  @ApiPropertyOptional({ example: '#3498db' })
  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'La couleur doit être au format #RRGGBB' })
  color?: string;

  @ApiPropertyOptional({ description: 'Providers Tako pré-sélectionnés', example: ['igdb', 'rawg'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  defaultProviders?: string[];

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: 'Admin uniquement: changer le flag par défaut', example: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;

  @ApiPropertyOptional({ description: 'IDs des catégories parentes', example: [1, 2] })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  parentIds?: number[];
}

export class QueryCategoriesDto {
  @ApiPropertyOptional({ enum: ['all', 'default', 'public', 'mine'], default: 'all' })
  @IsOptional()
  @IsString()
  filter?: 'all' | 'default' | 'public' | 'mine';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  limit?: number;
}

export class CopyCategoryDto {
  @ApiPropertyOptional({ example: 'Ma copie Jeux vidéo' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ description: 'Copier aussi les médias', default: false })
  @IsOptional()
  @IsBoolean()
  copyMedia?: boolean;
}

export class UpdateCategoryGradesDto {
  @ApiProperty({ description: 'IDs des grades à associer', example: [1, 2, 3] })
  @IsArray()
  @IsNumber({}, { each: true })
  gradeIds: number[];
}

export class QueryCategoryItemsDto {
  @ApiPropertyOptional({ enum: ['name', 'createdAt', 'rating', 'value'], default: 'createdAt' })
  @IsOptional()
  @IsString()
  sort?: 'name' | 'createdAt' | 'rating' | 'value';

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsString()
  order?: 'asc' | 'desc';

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  limit?: number;
}

export class UpdateDefaultParentsDto {
  @ApiProperty({ description: 'IDs des catégories parentes par défaut', example: [1, 3] })
  @IsArray()
  @IsNumber({}, { each: true })
  parentIds: number[];
}
