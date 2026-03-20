import { IsOptional, IsString, IsInt, IsArray, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCategoryMediaDto {
  @ApiPropertyOptional({ description: 'Titre du média' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Ordre d\'affichage' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  displayOrder?: number;
}

export class ReorderCategoryMediaDto {
  @ApiProperty({ description: 'Tableau des IDs dans le nouvel ordre', type: [Number] })
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  order: number[];
}
