import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from '../../database/entities/user.entity';

@Injectable()
export class AdminSeedService implements OnModuleInit {
  private readonly logger = new Logger(AdminSeedService.name);

  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    await this.seedAdminUser();
  }

  private async seedAdminUser() {
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
    const adminUsername = this.configService.get<string>('ADMIN_USERNAME');
    const adminPassword = this.configService.get<string>('ADMIN_PASSWORD');

    // Si les variables ne sont pas définies, ne rien faire
    if (!adminEmail || !adminUsername || !adminPassword) {
      this.logger.log('ℹ️  Pas de variables ADMIN_EMAIL/ADMIN_USERNAME/ADMIN_PASSWORD — skip seed admin');
      return;
    }

    // Vérifier si un admin existe déjà avec cet email
    const existingAdmin = await this.usersRepository.findOne({
      where: { email: adminEmail.toLowerCase() },
    });

    if (existingAdmin) {
      // Mettre à jour le rôle si ce n'est pas encore admin
      if (existingAdmin.role !== UserRole.ADMIN) {
        await this.usersRepository.update(existingAdmin.id, { role: UserRole.ADMIN });
        this.logger.log(`👑 Utilisateur ${existingAdmin.email} promu admin`);
      } else {
        this.logger.log(`✅ Admin ${existingAdmin.email} existe déjà`);
      }
      return;
    }

    // Créer l'admin
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    const admin = this.usersRepository.create({
      username: adminUsername,
      email: adminEmail.toLowerCase(),
      passwordHash,
      role: UserRole.ADMIN,
      emailVerified: true,
      lang: 'fr',
    });

    await this.usersRepository.save(admin);
    this.logger.log(`👑 Compte admin créé: ${adminEmail}`);
  }
}
