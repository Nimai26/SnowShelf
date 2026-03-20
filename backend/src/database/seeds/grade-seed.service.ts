import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Grade } from '../entities/grade.entity';

@Injectable()
export class GradeSeedService implements OnModuleInit {
  private readonly logger = new Logger(GradeSeedService.name);

  constructor(
    @InjectRepository(Grade)
    private readonly gradeRepo: Repository<Grade>,
  ) {}

  async onModuleInit() {
    const count = await this.gradeRepo.count({ where: { defaut: 1 } });
    if (count > 0) {
      this.logger.log(`Grades par défaut déjà seedés (${count})`);
      return;
    }

    this.logger.log('⭐ Seeding default grades...');

    const defaults: Partial<Grade>[] = [
      { name: 'Comme neuf', description: 'État impeccable, sans trace d\'usure', defaut: 1, userId: null },
      { name: 'Très bon état', description: 'Légères traces d\'usure', defaut: 1, userId: null },
      { name: 'Bon état', description: 'Traces d\'usure normales', defaut: 1, userId: null },
      { name: 'État correct', description: 'Usure visible mais fonctionnel', defaut: 1, userId: null },
      { name: 'Mauvais état', description: 'Usure importante', defaut: 1, userId: null },
      { name: 'Pour pièces', description: 'Non fonctionnel, pour récupération', defaut: 1, userId: null },
      { name: 'Boîte manquante', description: 'Item sans sa boîte d\'origine', defaut: 1, userId: null },
      { name: 'Notice manquante', description: 'Item sans sa notice', defaut: 1, userId: null },
      { name: 'Complet', description: 'Tous les éléments sont présents', defaut: 1, userId: null },
      { name: 'Incomplet', description: 'Il manque des éléments', defaut: 1, userId: null },
      { name: 'Scellé', description: 'Encore dans son emballage d\'origine', defaut: 1, userId: null },
    ];

    await this.gradeRepo.save(defaults);
    this.logger.log(`✅ ${defaults.length} grades par défaut créés`);
  }
}
