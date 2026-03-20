import { IsOptional, IsString, IsNumberString, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class QueryExploreUsersDto {
  @ApiPropertyOptional({ description: 'Recherche par nom d\'utilisateur' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumberString()
  page?: string;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @IsNumberString()
  limit?: string;
}

export class QueryPublicItemsDto {
  @ApiPropertyOptional({ description: 'Recherche par nom' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsNumberString()
  page?: string;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @IsNumberString()
  limit?: string;

  @ApiPropertyOptional({ enum: ['name', 'createdAt', 'value', 'rating', 'purchasePrice', 'dateObtained'] })
  @IsOptional()
  @IsIn(['name', 'createdAt', 'value', 'rating', 'purchasePrice', 'dateObtained'])
  sort?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'] })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: string;

  @ApiPropertyOptional({ description: 'Filtrer par catégorie' })
  @IsOptional()
  @IsNumberString()
  categoryId?: string;

  @ApiPropertyOptional({ enum: ['looking', 'owned'] })
  @IsOptional()
  @IsIn(['looking', 'owned'])
  searchState?: string;

  @ApiPropertyOptional({ description: 'Filtrer par statut' })
  @IsOptional()
  @IsNumberString()
  statusId?: string;

  @ApiPropertyOptional({ description: 'Filtrer par type primaire' })
  @IsOptional()
  @IsNumberString()
  primaryTypeId?: string;

  @ApiPropertyOptional({ description: 'Note minimum' })
  @IsOptional()
  @IsNumberString()
  minRating?: string;

  @ApiPropertyOptional({ description: 'Valeur minimum' })
  @IsOptional()
  @IsNumberString()
  minValue?: string;

  @ApiPropertyOptional({ description: 'Valeur maximum' })
  @IsOptional()
  @IsNumberString()
  maxValue?: string;

  @ApiPropertyOptional({ description: 'Date obtention depuis' })
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Date obtention jusqu\'à' })
  @IsOptional()
  @IsString()
  dateTo?: string;
}
