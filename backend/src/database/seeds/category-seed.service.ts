import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';

@Injectable()
export class CategorySeedService implements OnModuleInit {
  private readonly logger = new Logger(CategorySeedService.name);

  constructor(
    @InjectRepository(Category)
    private readonly catRepo: Repository<Category>,
  ) {}

  async onModuleInit() {
    const count = await this.catRepo.count({ where: { isDefault: true } });
    if (count > 0) {
      this.logger.log(`Catégories par défaut déjà seedées (${count})`);
      return;
    }

    this.logger.log('📁 Seeding default categories...');

    const defaults: Partial<Category>[] = [
      {
        name: 'Livres',
        slug: 'livres',
        description: 'Livres, mangas, BD, romans, guides...',
        icon: '📚',
        color: '#e74c3c',
        isDefault: true,
        isPublic: true,
        userId: null,
      },
      {
        name: 'Jeux vidéo',
        slug: 'jeux-video',
        description: 'Jeux vidéo toutes plateformes',
        icon: '🎮',
        color: '#3498db',
        isDefault: true,
        isPublic: true,
        userId: null,
      },
      {
        name: 'Musique',
        slug: 'musique',
        description: 'Vinyles, CD, cassettes, éditions collector',
        icon: '🎵',
        color: '#9b59b6',
        isDefault: true,
        isPublic: true,
        userId: null,
      },
      {
        name: 'Films',
        slug: 'films',
        description: 'Films en DVD, Blu-ray, 4K, collectors',
        icon: '🎬',
        color: '#f39c12',
        isDefault: true,
        isPublic: true,
        userId: null,
      },
      {
        name: 'Séries',
        slug: 'series',
        description: 'Séries TV et animées, coffrets',
        icon: '📺',
        color: '#16a085',
        isDefault: true,
        isPublic: true,
        userId: null,
      },
      {
        name: 'Figurines',
        slug: 'figurines',
        description: 'Figurines, statues, Funko Pop, Nendoroid...',
        icon: '🧸',
        color: '#e67e22',
        isDefault: true,
        isPublic: true,
        userId: null,
      },
      {
        name: 'Jouets construction',
        slug: 'jouets-construction',
        description: 'LEGO, Playmobil, Mega Construx...',
        icon: '🧱',
        color: '#c0392b',
        isDefault: true,
        isPublic: true,
        userId: null,
      },
      {
        name: 'Jeux de société',
        slug: 'jeux-de-societe',
        description: 'Jeux de plateau, jeux de rôle, puzzles',
        icon: '🎲',
        color: '#27ae60',
        isDefault: true,
        isPublic: true,
        userId: null,
      },
      {
        name: 'Cartes à collectionner',
        slug: 'cartes-a-collectionner',
        description: 'Pokémon, Magic, Yu-Gi-Oh!, Lorcana...',
        icon: '🃏',
        color: '#2980b9',
        isDefault: true,
        isPublic: true,
        userId: null,
      },
      {
        name: "Albums d'images",
        slug: 'albums-d-images',
        description: "Albums Panini, stickers, chromos",
        icon: '🖼️',
        color: '#8e44ad',
        isDefault: true,
        isPublic: true,
        userId: null,
      },
      {
        name: 'Divers',
        slug: 'divers',
        description: 'Objets ne rentrant dans aucune autre catégorie',
        icon: '📦',
        color: '#95a5a6',
        isDefault: true,
        isPublic: true,
        userId: null,
      },
      {
        name: 'Consoles & Systèmes',
        slug: 'consoles-systemes',
        description: 'Consoles de jeux vidéo, accessoires, systèmes rétro et modernes',
        icon: '🕹️',
        color: '#1abc9c',
        isDefault: true,
        isPublic: true,
        userId: null,
      },
      {
        name: 'VHS & LaserDisc',
        slug: 'vhs-laserdisc',
        description: 'Cassettes vidéo VHS, Beta, LaserDisc',
        icon: '📼',
        color: '#d35400',
        isDefault: true,
        isPublic: true,
        userId: null,
      },
      {
        name: 'Vinyles',
        slug: 'vinyles',
        description: 'Disques vinyles 33 tours, 45 tours, éditions limitées',
        icon: '💿',
        color: '#7d3c98',
        isDefault: true,
        isPublic: true,
        userId: null,
      },
      {
        name: 'CD Audio',
        slug: 'cd-audio',
        description: 'Compact discs, albums, singles, éditions collector',
        icon: '💽',
        color: '#2e86c1',
        isDefault: true,
        isPublic: true,
        userId: null,
      },
    ];

    const entities = this.catRepo.create(defaults);
    await this.catRepo.save(entities);

    this.logger.log(`✅ ${entities.length} catégories par défaut créées`);
  }
}
