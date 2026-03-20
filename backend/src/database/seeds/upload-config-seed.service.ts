import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UploadConfig } from '../entities/upload-config.entity';

@Injectable()
export class UploadConfigSeedService implements OnModuleInit {
  private readonly logger = new Logger(UploadConfigSeedService.name);

  constructor(
    @InjectRepository(UploadConfig)
    private uploadConfigRepo: Repository<UploadConfig>,
  ) {}

  async onModuleInit() {
    const count = await this.uploadConfigRepo.count();
    if (count > 0) {
      this.logger.log('Upload config déjà initialisée, skip seed');
      return;
    }

    const configs = [
      {
        category: 'avatar',
        allowedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
        maxSizeMb: 5,
        description: 'Avatars utilisateurs',
      },
      {
        category: 'images',
        allowedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
        maxSizeMb: 10,
        description: "Images d'items et catégories",
      },
      {
        category: 'videos',
        allowedExtensions: ['mp4', 'webm', 'avi', 'mkv', 'mov'],
        maxSizeMb: 500,
        description: "Vidéos d'items et catégories",
      },
      {
        category: 'audio',
        allowedExtensions: ['mp3', 'wav', 'ogg', 'flac'],
        maxSizeMb: 50,
        description: "Fichiers audio d'items et catégories",
      },
      {
        category: 'documents',
        allowedExtensions: ['pdf', 'doc', 'docx', 'txt', 'zip', 'epub', 'cbr', 'cbz'],
        maxSizeMb: 500,
        description: "Documents d'items et catégories",
      },
    ];

    for (const cfg of configs) {
      const entity = this.uploadConfigRepo.create(cfg);
      await this.uploadConfigRepo.save(entity);
    }

    this.logger.log(`✅ ${configs.length} configurations upload créées`);
  }
}
