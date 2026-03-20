import { IsEmail, IsString, MinLength, MaxLength, Matches, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'john_doe', description: 'Nom d\'utilisateur (3-50 caractères, alphanumérique + underscore)' })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9_]+$/, { message: 'Le nom d\'utilisateur ne peut contenir que des lettres, chiffres et underscores' })
  username: string;

  @ApiProperty({ example: 'john@example.com', description: 'Adresse email valide' })
  @IsEmail({}, { message: 'Adresse email invalide' })
  email: string;

  @ApiProperty({ example: 'MyP@ssw0rd', description: 'Mot de passe (min 8 chars, 1 majuscule, 1 minuscule, 1 chiffre, 1 spécial)' })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#+\-_=])[A-Za-z\d@$!%*?&#+\-_=]{8,}$/, {
    message: 'Le mot de passe doit contenir au moins 1 majuscule, 1 minuscule, 1 chiffre et 1 caractère spécial',
  })
  password: string;

  @ApiPropertyOptional({ example: 'fr', description: 'Langue préférée', enum: ['fr', 'en'] })
  @IsOptional()
  @IsIn(['fr', 'en'])
  lang?: string;
}
