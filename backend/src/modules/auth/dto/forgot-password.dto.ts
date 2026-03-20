import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'john@example.com', description: 'Email du compte' })
  @IsEmail({}, { message: 'Adresse email invalide' })
  email: string;
}
