import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { PrimaryType } from '../entities/primary-type.entity';

@Injectable()
export class CategorySeedService implements OnModuleInit {
  private readonly logger = new Logger(CategorySeedService.name);

  constructor(
    @InjectRepository(Category)
    private readonly catRepo: Repository<Category>,
    @InjectRepository(PrimaryType)
    private readonly primaryTypeRepo: Repository<PrimaryType>,
  ) {}

  async onModuleInit() {
    const count = await this.catRepo.count({ where: { isDefault: true } });
    if (count > 0) {
      this.logger.log(`Catégories par défaut déjà seedées (${count})`);
      return;
    }

    this.logger.log('📁 Seeding default categories...');

    // Récupérer les primary types pour mapper par key_name
    const types = await this.primaryTypeRepo.find();
    const typeMap = new Map(types.map(t => [t.keyName, t.id]));

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
        primaryTypeId: typeMap.get('books') ?? null,
        defaultProviders: ['googlebooks', 'openlibrary', 'comicvine', 'bedetheque'],
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
        primaryTypeId: typeMap.get('video_games') ?? null,
        defaultProviders: ['igdb', 'rawg', 'jvc', 'consolevariations'],
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
        primaryTypeId: typeMap.get('music') ?? null,
        defaultProviders: ['discogs', 'deezer', 'musicbrainz', 'itunes'],
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
        primaryTypeId: typeMap.get('movies') ?? null,
        defaultProviders: ['tmdb', 'tvdb', 'amazon-media'],
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
        primaryTypeId: typeMap.get('series') ?? null,
        defaultProviders: ['tmdb', 'tvdb'],
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
        primaryTypeId: typeMap.get('toys_fig') ?? null,
        defaultProviders: ['coleka', 'luluberlu', 'transformerland', 'amazon-collectibles'],
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
        primaryTypeId: typeMap.get('toys_construct') ?? null,
        defaultProviders: ['lego', 'playmobil', 'mega', 'klickypedia', 'kreo'],
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
        primaryTypeId: typeMap.get('board_games') ?? null,
        defaultProviders: ['bgg'],
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
        primaryTypeId: typeMap.get('trading_cards') ?? null,
        defaultProviders: ['pokemon', 'mtg', 'yugioh', 'lorcana', 'digimon', 'onepiece'],
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
        primaryTypeId: typeMap.get('sticker_albums') ?? null,
        defaultProviders: ['paninimania'],
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
        primaryTypeId: typeMap.get('divers') ?? null,
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
        primaryTypeId: typeMap.get('video_games') ?? null,
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
        primaryTypeId: typeMap.get('movies') ?? null,
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
        primaryTypeId: typeMap.get('music') ?? null,
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
        primaryTypeId: typeMap.get('music') ?? null,
      },
      {
        name: 'Disney Lorcana',
        slug: 'disney-lorcana',
        description: `Disney Lorcana est un jeu de cartes à collectionner (TCG) édité par Ravensburger en collaboration avec The Walt Disney Company, lancé en août 2023. Premier TCG de Ravensburger, il représente le plus gros investissement jamais réalisé par l'éditeur allemand.

**Univers et histoire** — Le jeu se déroule dans le monde magique de Lorcana, où des personnages appelés « Illumineurs » utilisent de l'encre magique pour invoquer des « Reflets » (Glimmers), des êtres inspirés des personnages Disney. Le Grand Illuminarium, au cœur des Contrées d'Encre, sert de répertoire à toutes les histoires jamais racontées. Trois types de Reflets existent : les Nés de l'Histoire (Storyborn), les Nés du Rêve (Dreamborn) et les Nés du Déluge (Floodborn).

**Gameplay** — Chaque joueur construit un deck d'au moins 60 cartes parmi quatre types : Personnages, Objets, Actions et Lieux. Six couleurs d'encre (Ambre, Améthyste, Émeraude, Rubis, Saphir, Acier) offrent des stratégies variées. Le premier joueur à accumuler 20 points de Savoir (Lore) remporte la partie. Les mécaniques incluent le Shift (évolution de personnages), les cartes à double encre, et le mode Pack Rush.

**Extensions** — Depuis "The First Chapter" (août 2023), le jeu compte plus de 12 extensions dont Rise of the Floodborn, Into the Inklands, Ursula's Return, Shimmering Skies, Azurite Sea, Archazia's Island, et bien d'autres. Chaque set introduit de nouveaux personnages Disney et des mécaniques innovantes.

**Raretés** — Les cartes se déclinent en 8 niveaux de rareté : Commune, Peu commune, Rare, Super Rare, Légendaire, Épique, Enchantée et Iconique (les deux dernières introduites avec le set Fabled).

**Compétition** — Un circuit compétitif existe avec les Disney Lorcana Challenges organisés dans le monde entier, des championnats régionaux (Europe, Amérique du Nord, Océanie) et un Championnat du Monde inauguré en juin 2025 à Walt Disney World.`,
        icon: '✨',
        color: '#1a1a6e',
        isDefault: true,
        isPublic: true,
        userId: null,
        primaryTypeId: typeMap.get('trading_cards') ?? null,
        defaultProviders: ['lorcana'],
      },
    ];

    const entities = this.catRepo.create(defaults);
    await this.catRepo.save(entities);

    this.logger.log(`✅ ${entities.length} catégories par défaut créées`);
  }
}
