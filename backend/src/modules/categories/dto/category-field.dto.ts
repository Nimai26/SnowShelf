import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsEnum,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FieldType } from '../../../database/entities/primary-type-field.entity';

export class CreateCategoryFieldDto {
  @ApiProperty({ example: 'color', description: 'Clé unique du champ' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  fieldKey: string;

  @ApiProperty({ example: 'Couleur' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  fieldNameFr: string;

  @ApiProperty({ example: 'Color' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  fieldNameEn: string;

  @ApiProperty({ enum: FieldType, example: FieldType.SELECT })
  @IsEnum(FieldType)
  fieldType: FieldType;

  @ApiPropertyOptional({ description: 'Options pour select/multiselect', example: ['Rouge', 'Bleu'] })
  @IsOptional()
  fieldOptions?: any;

  @ApiPropertyOptional({ example: 'Sélectionner une couleur' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  placeholderFr?: string;

  @ApiPropertyOptional({ example: 'Select a color' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  placeholderEn?: string;

  @ApiPropertyOptional({ example: "Couleur de l'encre de la carte" })
  @IsOptional()
  @IsString()
  helpTextFr?: string;

  @ApiPropertyOptional({ example: 'Card ink color' })
  @IsOptional()
  @IsString()
  helpTextEn?: string;

  @ApiPropertyOptional({ example: '🎨' })
  @IsOptional()
  @IsString()
  @MaxLength(10)
  icon?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isSearchable?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isFilterable?: boolean;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}

export class UpdateCategoryFieldDto {
  @ApiPropertyOptional({ example: 'Couleur' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  fieldNameFr?: string;

  @ApiPropertyOptional({ example: 'Color' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  fieldNameEn?: string;

  @ApiPropertyOptional({ enum: FieldType })
  @IsOptional()
  @IsEnum(FieldType)
  fieldType?: FieldType;

  @ApiPropertyOptional()
  @IsOptional()
  fieldOptions?: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  placeholderFr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  placeholderEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  helpTextFr?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  helpTextEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(10)
  icon?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isSearchable?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isFilterable?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  sortOrder?: number;
}
