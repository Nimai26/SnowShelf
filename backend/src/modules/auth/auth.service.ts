import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { User, UserRole } from '../../database/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly BCRYPT_ROUNDS = 12;

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService,
    private readonly mailService: MailService,
  ) {}

  // ──────────────────────────────────────────────
  // REGISTER
  // ──────────────────────────────────────────────
  async register(dto: RegisterDto) {
    // Vérifier unicité email
    const existingEmail = await this.usersRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });
    if (existingEmail) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    // Vérifier unicité username
    const existingUsername = await this.usersRepository.findOne({
      where: { username: dto.username },
    });
    if (existingUsername) {
      throw new ConflictException('Ce nom d\'utilisateur est déjà pris');
    }

    // Hasher le mot de passe
    const passwordHash = await bcrypt.hash(dto.password, this.BCRYPT_ROUNDS);

    // Générer le token de vérification email
    const emailToken = crypto.randomBytes(32).toString('hex');
    const emailTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    // Créer l'utilisateur
    const user = this.usersRepository.create({
      username: dto.username,
      email: dto.email.toLowerCase(),
      passwordHash,
      lang: dto.lang || 'fr',
      emailToken,
      emailTokenExpires,
      role: UserRole.FREE,
    });

    const savedUser = await this.usersRepository.save(user);

    // Envoyer email de vérification
    this.logger.log(`Nouvel utilisateur inscrit: ${savedUser.email}`);
    await this.mailService.sendVerificationEmail(savedUser.email, savedUser.username, emailToken);

    // Notification de bienvenue
    await this.notificationsService.sendWelcome(savedUser.id, savedUser.username);

    return {
      success: true,
      message: 'Inscription réussie. Vérifiez votre email pour activer votre compte.',
      data: {
        userId: savedUser.id,
        email: savedUser.email,
      },
    };
  }

  // ──────────────────────────────────────────────
  // LOGIN
  // ──────────────────────────────────────────────
  async login(dto: LoginDto) {
    // Trouver l'utilisateur
    const user = await this.usersRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    // Vérifier que l'email est vérifié
    // NOTE: En dev, on autorise la connexion même sans vérification
    if (!user.emailVerified && this.configService.get('NODE_ENV') === 'production') {
      throw new UnauthorizedException('Veuillez vérifier votre email avant de vous connecter');
    }

    // Générer les tokens
    const tokens = await this.generateTokens(user);

    // Stocker le hash du refresh token
    const refreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    await this.usersRepository.update(user.id, {
      refreshTokenHash,
      lastLoginAt: new Date(),
    });

    return {
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: this.sanitizeUser(user),
      },
    };
  }

  // ──────────────────────────────────────────────
  // REFRESH TOKEN
  // ──────────────────────────────────────────────
  async refreshTokens(userId: number, refreshToken: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
    });

    if (!user || !user.refreshTokenHash) {
      throw new UnauthorizedException('Accès refusé');
    }

    // Vérifier que le refresh token correspond
    const isTokenValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!isTokenValid) {
      throw new UnauthorizedException('Refresh token invalide');
    }

    // Générer de nouveaux tokens
    const tokens = await this.generateTokens(user);

    // Mettre à jour le hash du refresh token (rotation)
    const newRefreshTokenHash = await bcrypt.hash(tokens.refreshToken, 10);
    await this.usersRepository.update(user.id, {
      refreshTokenHash: newRefreshTokenHash,
    });

    return {
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    };
  }

  // ──────────────────────────────────────────────
  // LOGOUT
  // ──────────────────────────────────────────────
  async logout(userId: number) {
    await this.usersRepository.update(userId, {
      refreshTokenHash: null,
    });

    return {
      success: true,
      message: 'Déconnexion réussie',
    };
  }

  // ──────────────────────────────────────────────
  // VERIFY EMAIL
  // ──────────────────────────────────────────────
  async verifyEmail(token: string) {
    const user = await this.usersRepository.findOne({
      where: { emailToken: token },
    });

    if (!user) {
      throw new BadRequestException('Token de vérification invalide');
    }

    if (user.emailTokenExpires && user.emailTokenExpires < new Date()) {
      throw new BadRequestException('Token de vérification expiré');
    }

    await this.usersRepository.update(user.id, {
      emailVerified: true,
      emailToken: null,
      emailTokenExpires: null,
    });

    return {
      success: true,
      message: 'Email vérifié avec succès. Vous pouvez maintenant vous connecter.',
    };
  }

  // ──────────────────────────────────────────────
  // RESEND VERIFICATION EMAIL
  // ──────────────────────────────────────────────
  async resendVerification(email: string) {
    const user = await this.usersRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    // Toujours retourner succès pour ne pas révéler si l'email existe
    if (!user || user.emailVerified) {
      return {
        success: true,
        message: 'Si cette adresse existe et n\'est pas encore vérifiée, un email a été envoyé.',
      };
    }

    // Générer un nouveau token
    const emailToken = crypto.randomBytes(32).toString('hex');
    const emailTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await this.usersRepository.update(user.id, {
      emailToken,
      emailTokenExpires,
    });

    await this.mailService.sendVerificationEmail(user.email, user.username, emailToken);

    return {
      success: true,
      message: 'Si cette adresse existe et n\'est pas encore vérifiée, un email a été envoyé.',
    };
  }

  // ──────────────────────────────────────────────
  // FORGOT PASSWORD
  // ──────────────────────────────────────────────
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersRepository.findOne({
      where: { email: dto.email.toLowerCase() },
    });

    // Toujours retourner succès pour ne pas révéler si l'email existe
    if (!user) {
      return {
        success: true,
        message: 'Si cette adresse existe, un email de réinitialisation a été envoyé.',
      };
    }

    // Générer le token de reset
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // 1h

    await this.usersRepository.update(user.id, {
      resetToken,
      resetTokenExpires,
    });

    // Envoyer email de réinitialisation
    this.logger.log(`Reset password demandé pour ${user.email}`);
    await this.mailService.sendResetPasswordEmail(user.email, user.username, resetToken);

    return {
      success: true,
      message: 'Si cette adresse existe, un email de réinitialisation a été envoyé.',
    };
  }

  // ──────────────────────────────────────────────
  // RESET PASSWORD
  // ──────────────────────────────────────────────
  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.usersRepository.findOne({
      where: { resetToken: dto.token },
    });

    if (!user) {
      throw new BadRequestException('Token de réinitialisation invalide');
    }

    if (user.resetTokenExpires && user.resetTokenExpires < new Date()) {
      throw new BadRequestException('Token de réinitialisation expiré');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, this.BCRYPT_ROUNDS);

    await this.usersRepository.update(user.id, {
      passwordHash,
      resetToken: null,
      resetTokenExpires: null,
      refreshTokenHash: null, // Invalider toutes les sessions
    });

    return {
      success: true,
      message: 'Mot de passe réinitialisé avec succès.',
    };
  }

  // ──────────────────────────────────────────────
  // HELPERS
  // ──────────────────────────────────────────────
  private async generateTokens(user: User) {
    const jti = crypto.randomUUID();

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: user.id, email: user.email, role: user.role },
        {
          secret: this.configService.get<string>('JWT_SECRET'),
          expiresIn: this.configService.get<string>('JWT_EXPIRATION') || '15m',
        },
      ),
      this.jwtService.signAsync(
        { sub: user.id, jti },
        {
          secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d',
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: User) {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl,
      backgroundUrl: user.backgroundUrl,
      theme: user.theme,
      lang: user.lang,
      itemsCount: user.itemsCount,
      categoriesCount: user.categoriesCount,
      createdAt: user.createdAt,
    };
  }
}
