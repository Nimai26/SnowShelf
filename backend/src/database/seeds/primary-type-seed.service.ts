import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PrimaryType } from '../entities/primary-type.entity';
import { PrimaryTypeField, FieldType } from '../entities/primary-type-field.entity';

@Injectable()
export class PrimaryTypeSeedService implements OnModuleInit {
  private readonly logger = new Logger(PrimaryTypeSeedService.name);

  constructor(
    @InjectRepository(PrimaryType)
    private readonly ptRepo: Repository<PrimaryType>,
    @InjectRepository(PrimaryTypeField)
    private readonly ptfRepo: Repository<PrimaryTypeField>,
  ) {}

  async onModuleInit() {
    const count = await this.ptRepo.count();
    if (count > 0) {
      this.logger.log(`PrimaryTypes déjà seedés (${count} types) — synchronisation des options...`);
      await this.syncFieldOptions();
      return;
    }

    this.logger.log('🎮 Seeding PrimaryTypes...');

    const types = await this.seedTypes();
    await this.seedFields(types);

    this.logger.log(`✅ ${types.length} PrimaryTypes + champs créés`);
  }

  private async seedTypes(): Promise<PrimaryType[]> {
    const data: Partial<PrimaryType>[] = [
      { keyName: 'books', nameFr: 'Livres', nameEn: 'Books', icon: '📚', color: '#e74c3c', sortOrder: 1 },
      { keyName: 'video_games', nameFr: 'Jeux vidéo', nameEn: 'Video Games', icon: '🎮', color: '#3498db', sortOrder: 2 },
      { keyName: 'music', nameFr: 'Musique', nameEn: 'Music', icon: '🎵', color: '#9b59b6', sortOrder: 3 },
      { keyName: 'movies', nameFr: 'Films', nameEn: 'Movies', icon: '🎬', color: '#f39c12', sortOrder: 4 },
      { keyName: 'series', nameFr: 'Séries', nameEn: 'TV Series', icon: '📺', color: '#16a085', sortOrder: 5 },
      { keyName: 'toys_fig', nameFr: 'Figurines', nameEn: 'Figurines', icon: '🧸', color: '#e67e22', sortOrder: 6 },
      { keyName: 'toys_construct', nameFr: 'Jouets construction', nameEn: 'Construction Toys', icon: '🧱', color: '#c0392b', sortOrder: 7 },
      { keyName: 'board_games', nameFr: 'Jeux de société', nameEn: 'Board Games', icon: '🎲', color: '#27ae60', sortOrder: 8 },
      { keyName: 'trading_cards', nameFr: 'Cartes à collectionner', nameEn: 'Trading Cards', icon: '🃏', color: '#2980b9', sortOrder: 9 },
      { keyName: 'sticker_albums', nameFr: "Albums d'images", nameEn: 'Sticker Albums', icon: '🖼️', color: '#8e44ad', sortOrder: 10 },
      { keyName: 'divers', nameFr: 'Divers', nameEn: 'Miscellaneous', icon: '📦', color: '#95a5a6', sortOrder: 11 },
    ];

    const entities = this.ptRepo.create(data);
    return this.ptRepo.save(entities);
  }

  private async seedFields(types: PrimaryType[]): Promise<void> {
    const typeMap = new Map<string, number>();
    types.forEach((t) => typeMap.set(t.keyName, t.id));

    const fieldsData = this.getFieldsSeedData();

    const entities = fieldsData.map((f) => {
      const { typeKey, ...rest } = f;
      return this.ptfRepo.create({
        ...rest,
        primaryTypeId: typeMap.get(typeKey)!,
      });
    });

    await this.ptfRepo.save(entities);
  }

  /**
   * Synchronise les fieldOptions, placeholders, helpTexts des champs existants
   * (utile quand le seed a été enrichi après la première exécution)
   */
  private async syncFieldOptions(): Promise<void> {
    const types = await this.ptRepo.find();
    const typeMap = new Map<string, number>();
    types.forEach((t) => typeMap.set(t.keyName, t.id));

    const fieldsData = this.getFieldsSeedData();
    let updated = 0;

    for (const fd of fieldsData) {
      const ptId = typeMap.get(fd.typeKey);
      if (!ptId) continue;

      const existing = await this.ptfRepo.findOne({
        where: { primaryTypeId: ptId, fieldKey: fd.fieldKey },
      });

      if (existing) {
        let needsUpdate = false;

        // Sync fieldOptions
        if (fd.fieldOptions && !existing.fieldOptions) {
          existing.fieldOptions = fd.fieldOptions;
          needsUpdate = true;
        }
        // Sync placeholders
        if (fd.placeholderFr && !existing.placeholderFr) {
          existing.placeholderFr = fd.placeholderFr;
          needsUpdate = true;
        }
        if (fd.placeholderEn && !existing.placeholderEn) {
          existing.placeholderEn = fd.placeholderEn;
          needsUpdate = true;
        }
        // Sync help texts
        if (fd.helpTextFr && !existing.helpTextFr) {
          existing.helpTextFr = fd.helpTextFr;
          needsUpdate = true;
        }
        if (fd.helpTextEn && !existing.helpTextEn) {
          existing.helpTextEn = fd.helpTextEn;
          needsUpdate = true;
        }

        if (needsUpdate) {
          await this.ptfRepo.save(existing);
          updated++;
        }
      } else {
        // Champ manquant — le créer
        const { typeKey, ...rest } = fd;
        const newField = this.ptfRepo.create({ ...rest, primaryTypeId: ptId });
        await this.ptfRepo.save(newField);
        updated++;
        this.logger.log(`  + Nouveau champ '${fd.fieldKey}' pour '${fd.typeKey}'`);
      }
    }

    if (updated > 0) {
      this.logger.log(`✅ ${updated} champs synchronisés`);
    }
  }

  private getFieldsSeedData(): Array<Partial<PrimaryTypeField> & { typeKey: string }> {
    return [
      // ── BOOKS ──
      { typeKey: 'books', fieldKey: 'author', fieldNameFr: 'Auteur', fieldNameEn: 'Author', fieldType: FieldType.TEXT, icon: '✍️', isRequired: true, sortOrder: 1 },
      { typeKey: 'books', fieldKey: 'publisher', fieldNameFr: 'Éditeur', fieldNameEn: 'Publisher', fieldType: FieldType.TEXT, icon: '🏢', sortOrder: 2 },
      { typeKey: 'books', fieldKey: 'isbn', fieldNameFr: 'ISBN', fieldNameEn: 'ISBN', fieldType: FieldType.TEXT, icon: '🔢', sortOrder: 3 },
      { typeKey: 'books', fieldKey: 'year', fieldNameFr: 'Année', fieldNameEn: 'Year', fieldType: FieldType.YEAR, icon: '📅', sortOrder: 4 },
      { typeKey: 'books', fieldKey: 'pages', fieldNameFr: 'Pages', fieldNameEn: 'Pages', fieldType: FieldType.NUMBER, icon: '📄', sortOrder: 5 },
      { typeKey: 'books', fieldKey: 'genre', fieldNameFr: 'Genre', fieldNameEn: 'Genre', fieldType: FieldType.MULTISELECT, icon: '🎭', fieldOptions: ['Roman', 'SF', 'Fantasy', 'Policier', 'Thriller', 'Manga', 'BD', 'Comics', 'Jeunesse', 'Documentaire', 'Biographie', 'Poésie', 'Autre'], sortOrder: 6 },
      { typeKey: 'books', fieldKey: 'language', fieldNameFr: 'Langue', fieldNameEn: 'Language', fieldType: FieldType.SELECT, icon: '🌍', fieldOptions: ['Français', 'English', 'Español', 'Deutsch', '日本語', 'Autre'], sortOrder: 7 },
      { typeKey: 'books', fieldKey: 'read', fieldNameFr: 'Lu', fieldNameEn: 'Read', fieldType: FieldType.BOOLEAN, icon: '✅', sortOrder: 8 },
      // ── VIDEO GAMES ──
      { typeKey: 'video_games', fieldKey: 'platform', fieldNameFr: 'Plateforme', fieldNameEn: 'Platform', fieldType: FieldType.SELECT, icon: '🎮', fieldOptions: [
        // PC
        'PC',
        // Sony
        'PlayStation 5', 'PlayStation 4', 'PlayStation 3', 'PlayStation 2', 'PlayStation', 'PS Vita', 'PSP',
        // Microsoft
        'Xbox Series X|S', 'Xbox One', 'Xbox 360', 'Xbox',
        // Nintendo - Consoles
        'Nintendo Switch', 'Wii U', 'Wii', 'GameCube', 'Nintendo 64', 'Super Nintendo', 'NES',
        // Nintendo - Portables
        'Nintendo 3DS', 'Nintendo DS', 'Game Boy Advance', 'Game Boy Color', 'Game Boy',
        // Sega
        'Dreamcast', 'Saturn', 'Mega Drive', 'Master System', 'Game Gear',
        // Autres consoles
        'Neo Geo', 'PC Engine', '3DO', 'Atari Jaguar', 'Atari 2600', 'Atari ST',
        'Commodore 64', 'Amiga',
        // Moderne
        'Steam Deck', 'Arcade',
        // Mobile & Autre
        'Mobile', 'Autre',
      ], isRequired: true, sortOrder: 1 },
      { typeKey: 'video_games', fieldKey: 'publisher', fieldNameFr: 'Éditeur', fieldNameEn: 'Publisher', fieldType: FieldType.TEXT, icon: '🏢', sortOrder: 2 },
      { typeKey: 'video_games', fieldKey: 'developer', fieldNameFr: 'Développeur', fieldNameEn: 'Developer', fieldType: FieldType.TEXT, icon: '👨‍💻', sortOrder: 3 },
      { typeKey: 'video_games', fieldKey: 'year', fieldNameFr: 'Année', fieldNameEn: 'Year', fieldType: FieldType.YEAR, icon: '📅', sortOrder: 4 },
      { typeKey: 'video_games', fieldKey: 'genre', fieldNameFr: 'Genre', fieldNameEn: 'Genre', fieldType: FieldType.MULTISELECT, icon: '🎭', fieldOptions: ['Action', 'Adventure', 'RPG', 'FPS', 'Sport', 'Racing', 'Strategy', 'Simulation', 'Puzzle', 'Platformer', 'Fighting', 'Horror', 'Open World', 'Autre'], sortOrder: 5 },
      { typeKey: 'video_games', fieldKey: 'players', fieldNameFr: 'Joueurs', fieldNameEn: 'Players', fieldType: FieldType.TEXT, icon: '👥', sortOrder: 6 },
      { typeKey: 'video_games', fieldKey: 'multiplayer', fieldNameFr: 'Multijoueur', fieldNameEn: 'Multiplayer', fieldType: FieldType.BOOLEAN, icon: '🌐', sortOrder: 7 },
      { typeKey: 'video_games', fieldKey: 'completed', fieldNameFr: 'Terminé', fieldNameEn: 'Completed', fieldType: FieldType.BOOLEAN, icon: '✅', sortOrder: 8 },
      { typeKey: 'video_games', fieldKey: 'playtime', fieldNameFr: 'Temps de jeu', fieldNameEn: 'Playtime', fieldType: FieldType.DURATION, icon: '⏱️', sortOrder: 9 },
      { typeKey: 'video_games', fieldKey: 'region', fieldNameFr: 'Région', fieldNameEn: 'Region', fieldType: FieldType.SELECT, icon: '🌍', fieldOptions: ['EUR', 'USA', 'JAP', 'Autre'], sortOrder: 10 },
      // ── MUSIC ──
      { typeKey: 'music', fieldKey: 'artist', fieldNameFr: 'Artiste', fieldNameEn: 'Artist', fieldType: FieldType.TEXT, icon: '🎤', isRequired: true, sortOrder: 1 },
      { typeKey: 'music', fieldKey: 'album', fieldNameFr: 'Album', fieldNameEn: 'Album', fieldType: FieldType.TEXT, icon: '💿', sortOrder: 2 },
      { typeKey: 'music', fieldKey: 'label', fieldNameFr: 'Label', fieldNameEn: 'Label', fieldType: FieldType.TEXT, icon: '🏷️', sortOrder: 3 },
      { typeKey: 'music', fieldKey: 'year', fieldNameFr: 'Année', fieldNameEn: 'Year', fieldType: FieldType.YEAR, icon: '📅', sortOrder: 4 },
      { typeKey: 'music', fieldKey: 'format', fieldNameFr: 'Format', fieldNameEn: 'Format', fieldType: FieldType.SELECT, icon: '📀', fieldOptions: ['CD', 'Vinyle', 'Cassette', 'Numérique', 'Blu-ray Audio', 'Autre'], sortOrder: 5 },
      { typeKey: 'music', fieldKey: 'genre', fieldNameFr: 'Genre', fieldNameEn: 'Genre', fieldType: FieldType.MULTISELECT, icon: '🎭', fieldOptions: ['Rock', 'Pop', 'Hip-Hop', 'Jazz', 'Classique', 'Électro', 'Metal', 'R&B', 'Country', 'Reggae', 'World', 'Autre'], sortOrder: 6 },
      { typeKey: 'music', fieldKey: 'tracks', fieldNameFr: 'Pistes', fieldNameEn: 'Tracks', fieldType: FieldType.NUMBER, icon: '🎶', sortOrder: 7 },
      // ── MOVIES ──
      { typeKey: 'movies', fieldKey: 'director', fieldNameFr: 'Réalisateur', fieldNameEn: 'Director', fieldType: FieldType.TEXT, icon: '🎬', sortOrder: 1 },
      { typeKey: 'movies', fieldKey: 'studio', fieldNameFr: 'Studio', fieldNameEn: 'Studio', fieldType: FieldType.TEXT, icon: '🏢', sortOrder: 2 },
      { typeKey: 'movies', fieldKey: 'year', fieldNameFr: 'Année', fieldNameEn: 'Year', fieldType: FieldType.YEAR, icon: '📅', sortOrder: 3 },
      { typeKey: 'movies', fieldKey: 'genre', fieldNameFr: 'Genre', fieldNameEn: 'Genre', fieldType: FieldType.MULTISELECT, icon: '🎭', fieldOptions: ['Action', 'Comédie', 'Drame', 'Horreur', 'SF', 'Fantasy', 'Animation', 'Documentaire', 'Thriller', 'Romance', 'Guerre', 'Western', 'Autre'], sortOrder: 4 },
      { typeKey: 'movies', fieldKey: 'format', fieldNameFr: 'Format', fieldNameEn: 'Format', fieldType: FieldType.SELECT, icon: '📀', fieldOptions: ['Blu-ray', 'DVD', 'Blu-ray 4K', 'VHS', 'Numérique', 'Autre'], sortOrder: 5 },
      { typeKey: 'movies', fieldKey: 'duration', fieldNameFr: 'Durée', fieldNameEn: 'Duration', fieldType: FieldType.DURATION, icon: '⏱️', sortOrder: 6 },
      { typeKey: 'movies', fieldKey: 'watched', fieldNameFr: 'Vu', fieldNameEn: 'Watched', fieldType: FieldType.BOOLEAN, icon: '👁️', sortOrder: 7 },
      // ── SERIES ──
      { typeKey: 'series', fieldKey: 'creator', fieldNameFr: 'Créateur', fieldNameEn: 'Creator', fieldType: FieldType.TEXT, icon: '✍️', sortOrder: 1 },
      { typeKey: 'series', fieldKey: 'network', fieldNameFr: 'Chaîne / Plateforme', fieldNameEn: 'Network / Platform', fieldType: FieldType.TEXT, icon: '📡', sortOrder: 2 },
      { typeKey: 'series', fieldKey: 'year', fieldNameFr: 'Année', fieldNameEn: 'Year', fieldType: FieldType.YEAR, icon: '📅', sortOrder: 3 },
      { typeKey: 'series', fieldKey: 'seasons', fieldNameFr: 'Saisons', fieldNameEn: 'Seasons', fieldType: FieldType.NUMBER, icon: '📺', sortOrder: 4 },
      { typeKey: 'series', fieldKey: 'genre', fieldNameFr: 'Genre', fieldNameEn: 'Genre', fieldType: FieldType.MULTISELECT, icon: '🎭', fieldOptions: ['Action', 'Comédie', 'Drame', 'Horreur', 'SF', 'Fantasy', 'Animation', 'Documentaire', 'Thriller', 'Crime', 'Anime', 'Autre'], sortOrder: 5 },
      { typeKey: 'series', fieldKey: 'format', fieldNameFr: 'Format', fieldNameEn: 'Format', fieldType: FieldType.SELECT, icon: '📀', fieldOptions: ['Blu-ray', 'DVD', 'Blu-ray 4K', 'Numérique', 'Autre'], sortOrder: 6 },
      { typeKey: 'series', fieldKey: 'completed', fieldNameFr: 'Série terminée', fieldNameEn: 'Series Completed', fieldType: FieldType.BOOLEAN, icon: '✅', sortOrder: 7 },
      // ── FIGURINES ──
      { typeKey: 'toys_fig', fieldKey: 'brand', fieldNameFr: 'Marque', fieldNameEn: 'Brand', fieldType: FieldType.TEXT, icon: '🏷️', sortOrder: 1 },
      { typeKey: 'toys_fig', fieldKey: 'series', fieldNameFr: 'Série / Licence', fieldNameEn: 'Series / License', fieldType: FieldType.TEXT, icon: '📺', sortOrder: 2 },
      { typeKey: 'toys_fig', fieldKey: 'character', fieldNameFr: 'Personnage', fieldNameEn: 'Character', fieldType: FieldType.TEXT, icon: '🦸', sortOrder: 3 },
      { typeKey: 'toys_fig', fieldKey: 'year', fieldNameFr: 'Année', fieldNameEn: 'Year', fieldType: FieldType.YEAR, icon: '📅', sortOrder: 4 },
      { typeKey: 'toys_fig', fieldKey: 'scale', fieldNameFr: 'Échelle', fieldNameEn: 'Scale', fieldType: FieldType.SELECT, icon: '📏', fieldOptions: ['1/12', '1/10', '1/8', '1/7', '1/6', '1/4', 'Nendoroid', 'Figma', 'Pop!', 'Autre'], sortOrder: 5 },
      { typeKey: 'toys_fig', fieldKey: 'material', fieldNameFr: 'Matériau', fieldNameEn: 'Material', fieldType: FieldType.SELECT, icon: '🧱', fieldOptions: ['PVC', 'ABS', 'Résine', 'Vinyle', 'Métal', 'Bois', 'Autre'], sortOrder: 6 },
      { typeKey: 'toys_fig', fieldKey: 'boxed', fieldNameFr: 'En boîte', fieldNameEn: 'Boxed', fieldType: FieldType.BOOLEAN, icon: '📦', sortOrder: 7 },
      // ── CONSTRUCTION TOYS ──
      { typeKey: 'toys_construct', fieldKey: 'brand', fieldNameFr: 'Marque', fieldNameEn: 'Brand', fieldType: FieldType.SELECT, icon: '🏷️', fieldOptions: ['LEGO', 'Playmobil', 'Mega Construx', 'COBI', 'Meccano', 'Autre'], isRequired: true, sortOrder: 1 },
      { typeKey: 'toys_construct', fieldKey: 'set_number', fieldNameFr: 'Numéro de set', fieldNameEn: 'Set Number', fieldType: FieldType.TEXT, icon: '🔢', sortOrder: 2 },
      { typeKey: 'toys_construct', fieldKey: 'theme', fieldNameFr: 'Thème', fieldNameEn: 'Theme', fieldType: FieldType.TEXT, icon: '📂', sortOrder: 3 },
      { typeKey: 'toys_construct', fieldKey: 'year', fieldNameFr: 'Année', fieldNameEn: 'Year', fieldType: FieldType.YEAR, icon: '📅', sortOrder: 4 },
      { typeKey: 'toys_construct', fieldKey: 'pieces', fieldNameFr: 'Pièces', fieldNameEn: 'Pieces', fieldType: FieldType.NUMBER, icon: '🧩', sortOrder: 5 },
      { typeKey: 'toys_construct', fieldKey: 'minifigs', fieldNameFr: 'Minifigurines', fieldNameEn: 'Minifigures', fieldType: FieldType.NUMBER, icon: '🧑', sortOrder: 6 },
      { typeKey: 'toys_construct', fieldKey: 'built', fieldNameFr: 'Construit', fieldNameEn: 'Built', fieldType: FieldType.BOOLEAN, icon: '🏗️', sortOrder: 7 },
      { typeKey: 'toys_construct', fieldKey: 'complete', fieldNameFr: 'Complet', fieldNameEn: 'Complete', fieldType: FieldType.BOOLEAN, icon: '✅', sortOrder: 8 },
      // ── BOARD GAMES ──
      { typeKey: 'board_games', fieldKey: 'designer', fieldNameFr: 'Auteur', fieldNameEn: 'Designer', fieldType: FieldType.TEXT, icon: '✍️', sortOrder: 1 },
      { typeKey: 'board_games', fieldKey: 'publisher', fieldNameFr: 'Éditeur', fieldNameEn: 'Publisher', fieldType: FieldType.TEXT, icon: '🏢', sortOrder: 2 },
      { typeKey: 'board_games', fieldKey: 'year', fieldNameFr: 'Année', fieldNameEn: 'Year', fieldType: FieldType.YEAR, icon: '📅', sortOrder: 3 },
      { typeKey: 'board_games', fieldKey: 'players_min', fieldNameFr: 'Joueurs min', fieldNameEn: 'Min Players', fieldType: FieldType.NUMBER, icon: '👥', sortOrder: 4 },
      { typeKey: 'board_games', fieldKey: 'players_max', fieldNameFr: 'Joueurs max', fieldNameEn: 'Max Players', fieldType: FieldType.NUMBER, icon: '👥', sortOrder: 5 },
      { typeKey: 'board_games', fieldKey: 'play_time', fieldNameFr: 'Temps de jeu', fieldNameEn: 'Play Time', fieldType: FieldType.DURATION, icon: '⏱️', sortOrder: 6 },
      { typeKey: 'board_games', fieldKey: 'genre', fieldNameFr: 'Genre', fieldNameEn: 'Genre', fieldType: FieldType.MULTISELECT, icon: '🎭', fieldOptions: ['Stratégie', 'Ambiance', 'Coopératif', 'Familial', 'Expert', 'Deck Building', 'Placement', 'Wargame', 'Autre'], sortOrder: 7 },
      { typeKey: 'board_games', fieldKey: 'complete', fieldNameFr: 'Complet', fieldNameEn: 'Complete', fieldType: FieldType.BOOLEAN, icon: '✅', sortOrder: 8 },
      // ── TRADING CARDS ──
      { typeKey: 'trading_cards', fieldKey: 'game', fieldNameFr: 'Jeu', fieldNameEn: 'Game', fieldType: FieldType.SELECT, icon: '🃏', fieldOptions: ['Pokémon', 'Yu-Gi-Oh!', 'Magic: The Gathering', 'Lorcana', 'Dragon Ball', 'One Piece', 'Panini', 'Autre'], isRequired: true, sortOrder: 1 },
      { typeKey: 'trading_cards', fieldKey: 'set_name', fieldNameFr: 'Extension / Set', fieldNameEn: 'Set / Expansion', fieldType: FieldType.TEXT, icon: '📂', sortOrder: 2 },
      { typeKey: 'trading_cards', fieldKey: 'card_number', fieldNameFr: 'Numéro', fieldNameEn: 'Card Number', fieldType: FieldType.TEXT, icon: '🔢', sortOrder: 3 },
      { typeKey: 'trading_cards', fieldKey: 'year', fieldNameFr: 'Année', fieldNameEn: 'Year', fieldType: FieldType.YEAR, icon: '📅', sortOrder: 4 },
      { typeKey: 'trading_cards', fieldKey: 'rarity', fieldNameFr: 'Rareté', fieldNameEn: 'Rarity', fieldType: FieldType.SELECT, icon: '💎', fieldOptions: ['Common', 'Uncommon', 'Rare', 'Ultra Rare', 'Secret Rare', 'Promo', 'Full Art', 'Autre'], sortOrder: 5 },
      { typeKey: 'trading_cards', fieldKey: 'language', fieldNameFr: 'Langue', fieldNameEn: 'Language', fieldType: FieldType.SELECT, icon: '🌍', fieldOptions: ['Français', 'English', 'Japanese', 'Autre'], sortOrder: 6 },
      { typeKey: 'trading_cards', fieldKey: 'graded', fieldNameFr: 'Gradé (PSA/CGC)', fieldNameEn: 'Graded (PSA/CGC)', fieldType: FieldType.BOOLEAN, icon: '🏅', sortOrder: 7 },
      { typeKey: 'trading_cards', fieldKey: 'grade_value', fieldNameFr: 'Note', fieldNameEn: 'Grade', fieldType: FieldType.TEXT, icon: '📊', sortOrder: 8 },
      // ── STICKER ALBUMS ──
      { typeKey: 'sticker_albums', fieldKey: 'publisher', fieldNameFr: 'Éditeur', fieldNameEn: 'Publisher', fieldType: FieldType.SELECT, icon: '🏢', fieldOptions: ['Panini', 'Topps', 'Merlin', 'Autre'], sortOrder: 1 },
      { typeKey: 'sticker_albums', fieldKey: 'theme', fieldNameFr: 'Thème', fieldNameEn: 'Theme', fieldType: FieldType.TEXT, icon: '📂', sortOrder: 2 },
      { typeKey: 'sticker_albums', fieldKey: 'year', fieldNameFr: 'Année', fieldNameEn: 'Year', fieldType: FieldType.YEAR, icon: '📅', sortOrder: 3 },
      { typeKey: 'sticker_albums', fieldKey: 'total_stickers', fieldNameFr: 'Stickers total', fieldNameEn: 'Total Stickers', fieldType: FieldType.NUMBER, icon: '🔢', sortOrder: 4 },
      { typeKey: 'sticker_albums', fieldKey: 'collected', fieldNameFr: 'Collectés', fieldNameEn: 'Collected', fieldType: FieldType.NUMBER, icon: '✅', sortOrder: 5 },
      { typeKey: 'sticker_albums', fieldKey: 'complete', fieldNameFr: 'Complet', fieldNameEn: 'Complete', fieldType: FieldType.BOOLEAN, icon: '🏆', sortOrder: 6 },
      // ── DIVERS ──
      { typeKey: 'divers', fieldKey: 'type', fieldNameFr: 'Type', fieldNameEn: 'Type', fieldType: FieldType.TEXT, icon: '📦', sortOrder: 1 },
      { typeKey: 'divers', fieldKey: 'brand', fieldNameFr: 'Marque', fieldNameEn: 'Brand', fieldType: FieldType.TEXT, icon: '🏷️', sortOrder: 2 },
      { typeKey: 'divers', fieldKey: 'year', fieldNameFr: 'Année', fieldNameEn: 'Year', fieldType: FieldType.YEAR, icon: '📅', sortOrder: 3 },
    ];
  }
}
