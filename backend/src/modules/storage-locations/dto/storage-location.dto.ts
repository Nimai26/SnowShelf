import {
  IsString,
  IsOptional,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStorageLocationDto {
  @ApiProperty({ example: 'Étagère salon' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'Meuble TV, étagère du haut' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;
}

export class UpdateStorageLocationDto {
  @ApiPropertyOptional({ example: 'Étagère salon' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({ example: 'Meuble TV, étagère du haut' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;
}
