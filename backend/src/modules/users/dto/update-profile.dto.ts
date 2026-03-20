import { IsOptional, IsString, MaxLength, IsIn, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'dracula', description: 'Thème UI' })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  theme?: string;

  @ApiPropertyOptional({ example: 'fr', description: 'Langue préférée', enum: ['fr', 'en'] })
  @IsOptional()
  @IsIn(['fr', 'en'])
  lang?: string;

  @ApiPropertyOptional({ example: false, description: 'Inscription newsletter' })
  @IsOptional()
  @IsBoolean()
  newsletter?: boolean;

  @ApiPropertyOptional({ example: 'Collectionneur passionné', description: 'Biographie' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;

  @ApiPropertyOptional({ example: 'private', enum: ['private', 'public', 'friends'] })
  @IsOptional()
  @IsIn(['private', 'public', 'friends'])
  collectionsVisibility?: string;

  @ApiPropertyOptional({ example: false, description: 'Montrer l\'email publiquement' })
  @IsOptional()
  @IsBoolean()
  showEmail?: boolean;

  @ApiPropertyOptional({ example: 'everyone', enum: ['everyone', 'nobody'] })
  @IsOptional()
  @IsIn(['everyone', 'nobody'])
  friendRequestPolicy?: string;
}
