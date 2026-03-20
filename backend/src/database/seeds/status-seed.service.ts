import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Status } from '../entities/status.entity';

@Injectable()
export class StatusSeedService implements OnModuleInit {
  private readonly logger = new Logger(StatusSeedService.name);

  constructor(
    @InjectRepository(Status)
    private readonly statusRepo: Repository<Status>,
  ) {}

  async onModuleInit() {
    const count = await this.statusRepo.count({ where: { defaut: 1 } });
    if (count > 0) {
      this.logger.log(`Statuts par défaut déjà seedés (${count})`);
      return;
    }

    this.logger.log('🏷️ Seeding default statuses...');

    const defaults: Partial<Status>[] = [
      { name: 'Possédé', description: 'Item en votre possession', color: '#22c55e', icon: 'check-circle', ordre: 1, defaut: 1, userId: null },
      { name: 'Recherché', description: 'Item que vous recherchez', color: '#f59e0b', icon: 'search', ordre: 2, defaut: 1, userId: null },
      { name: 'En transit', description: 'Item en cours de livraison', color: '#3b82f6', icon: 'truck', ordre: 3, defaut: 1, userId: null },
      { name: 'Prêté', description: 'Item prêté à quelqu\'un', color: '#a855f7', icon: 'share-2', ordre: 4, defaut: 1, userId: null },
      { name: 'Vendu', description: 'Item vendu', color: '#ef4444', icon: 'tag', ordre: 5, defaut: 1, userId: null },
      { name: 'Wishlist', description: 'Item souhaité', color: '#ec4899', icon: 'heart', ordre: 6, defaut: 1, userId: null },
    ];

    await this.statusRepo.save(defaults);
    this.logger.log(`✅ ${defaults.length} statuts par défaut créés`);
  }
}
