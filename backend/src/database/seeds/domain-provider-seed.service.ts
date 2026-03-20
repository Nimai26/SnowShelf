import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Domain } from '../entities/domain.entity';
import { TakoProvider } from '../entities/tako-provider.entity';
import { PrimaryType } from '../entities/primary-type.entity';

/**
 * Seed service qui migre les constantes hardcodées
 * (DOMAIN_ROUTES, DOMAIN_PROVIDERS, PRIMARY_TYPE_TO_DOMAINS, DETAIL_SEGMENTS)
 * vers les tables domains, tako_providers et primary_type_domains.
 * S'exécute une seule fois (quand la table domains est vide).
 */
@Injectable()
export class DomainProviderSeedService implements OnModuleInit {
  private readonly logger = new Logger(DomainProviderSeedService.name);

  constructor(
    @InjectRepository(Domain)
    private readonly domainRepo: Repository<Domain>,
    @InjectRepository(TakoProvider)
    private readonly providerRepo: Repository<TakoProvider>,
    @InjectRepository(PrimaryType)
    private readonly ptRepo: Repository<PrimaryType>,
  ) {}

  async onModuleInit() {
    // Attendre un peu que les tables soient synchronisées
    await new Promise((r) => setTimeout(r, 500));

    const domainCount = await this.domainRepo.count();
    if (domainCount > 0) {
      this.logger.log(`Domains déjà seedés (${domainCount}) — vérification & sync...`);
      await this.syncDomainFields();
      await this.syncProviders();
      await this.syncTypeDomainMappings();
      return;
    }

    this.logger.log('🌐 Seeding Domains, Providers & Type-Domain mappings...');
    await this.seedDomains();
    await this.seedProviders();
    await this.syncTypeDomainMappings();
    this.logger.log('✅ Domains + Providers + Type-Domain mappings seedés');
  }

  // ──────────────────────────────────────────────
  //  DOMAIN SEED DATA
  // ──────────────────────────────────────────────

  private getDomainSeedData(): Partial<Domain>[] {
    return [
      { name: 'videogames', displayName: 'Jeux vidéo', icon: '🎮', routePath: '/api/videogames', sortOrder: 1, description: 'Jeux vidéo (IGDB, RAWG, etc.)' },
      { name: 'books', displayName: 'Livres', icon: '📚', routePath: '/api/books', sortOrder: 2, description: 'Livres (Google Books, Open Library)' },
      { name: 'comics', displayName: 'BD & Comics', icon: '💬', routePath: '/api/comics', sortOrder: 3, description: 'Bandes dessinées et comics (Comic Vine, Bédéthèque)' },
      { name: 'anime-manga', displayName: 'Anime & Manga', icon: '🎌', routePath: '/api/anime-manga', sortOrder: 4, description: 'Anime et manga (Jikan, MangaUpdates)' },
      { name: 'media', displayName: 'Films & Séries', icon: '🎬', routePath: '/api/media', sortOrder: 5, description: 'Films et séries TV (TMDB, TVDB)' },
      { name: 'music', displayName: 'Musique', icon: '🎵', routePath: '/api/music', sortOrder: 6, description: 'Musique (Discogs, Deezer, MusicBrainz)' },
      { name: 'boardgames', displayName: 'Jeux de société', icon: '🎲', routePath: '/api/boardgames', sortOrder: 7, description: 'Jeux de société (BoardGameGeek)' },
      { name: 'construction-toys', displayName: 'Jouets construction', icon: '🧱', routePath: '/api/construction-toys', sortOrder: 8, description: 'LEGO, Playmobil, Mega (Rebrickable, Brickset)' },
      { name: 'collectibles', displayName: 'Figurines & Objets', icon: '🧸', routePath: '/api/collectibles', sortOrder: 9, description: 'Figurines et objets de collection (Coleka, Luluberlu)' },
      { name: 'tcg', displayName: 'Cartes à collectionner', icon: '🃏', routePath: '/api/tcg', sortOrder: 10, description: 'Cartes TCG (Pokémon, MTG, Yu-Gi-Oh!)' },
      { name: 'sticker-albums', displayName: "Albums d'images", icon: '🖼️', routePath: '/api/sticker-albums', sortOrder: 11, description: 'Albums Panini et stickers' },
      { name: 'ecommerce', displayName: 'E-commerce', icon: '🛒', routePath: '/api/ecommerce', sortOrder: 12, description: 'Produits e-commerce (Amazon)' },
    ];
  }

  // ──────────────────────────────────────────────
  //  PROVIDER SEED DATA (includes detail segments)
  // ──────────────────────────────────────────────

  private getProviderSeedData(): { domainName: string; key: string; displayName: string; description: string; detailSegment: string | null; sortOrder: number }[] {
    return [
      // videogames
      { domainName: 'videogames', key: 'igdb', displayName: 'IGDB', description: 'Internet Game Database (Twitch API)', detailSegment: 'game', sortOrder: 1 },
      { domainName: 'videogames', key: 'rawg', displayName: 'RAWG', description: 'RAWG Video Games Database', detailSegment: 'game', sortOrder: 2 },
      { domainName: 'videogames', key: 'jvc', displayName: 'JVC', description: 'JeuxVideo.com (scraping)', detailSegment: null, sortOrder: 3 },
      { domainName: 'videogames', key: 'consolevariations', displayName: 'Console Variations', description: 'Console Variations Database', detailSegment: 'item', sortOrder: 4 },
      { domainName: 'videogames', key: 'amazon-videogames', displayName: 'Amazon VideoGames', description: 'Amazon (jeux vidéo)', detailSegment: 'product', sortOrder: 5 },
      // books
      { domainName: 'books', key: 'googlebooks', displayName: 'Google Books', description: 'Google Books API', detailSegment: null, sortOrder: 1 },
      { domainName: 'books', key: 'openlibrary', displayName: 'Open Library', description: 'Open Library (archive.org)', detailSegment: null, sortOrder: 2 },
      { domainName: 'books', key: 'amazon-books', displayName: 'Amazon Books', description: 'Amazon (livres)', detailSegment: 'product', sortOrder: 3 },
      // comics
      { domainName: 'comics', key: 'comicvine', displayName: 'Comic Vine', description: 'Comic Vine Database', detailSegment: 'issue', sortOrder: 1 },
      { domainName: 'comics', key: 'bedetheque', displayName: 'Bédéthèque', description: 'BDGest / Bédéthèque (scraping)', detailSegment: 'album', sortOrder: 2 },
      { domainName: 'comics', key: 'amazon-comics', displayName: 'Amazon Comics', description: 'Amazon (BD & comics)', detailSegment: 'product', sortOrder: 3 },
      // anime-manga
      { domainName: 'anime-manga', key: 'jikan-anime', displayName: 'Jikan Anime', description: 'Jikan - Recherche anime (MyAnimeList)', detailSegment: 'anime', sortOrder: 1 },
      { domainName: 'anime-manga', key: 'jikan-manga', displayName: 'Jikan Manga', description: 'Jikan - Recherche manga (MyAnimeList)', detailSegment: 'manga', sortOrder: 2 },
      { domainName: 'anime-manga', key: 'mangaupdates', displayName: 'MangaUpdates', description: 'MangaUpdates Database', detailSegment: 'series', sortOrder: 3 },
      { domainName: 'anime-manga', key: 'nautiljon', displayName: 'Nautiljon', description: 'Nautiljon - Base de données manga/anime française', detailSegment: 'series', sortOrder: 4 },
      { domainName: 'anime-manga', key: 'amazon-manga', displayName: 'Amazon Manga', description: 'Amazon (anime & manga)', detailSegment: 'product', sortOrder: 5 },
      // media
      { domainName: 'media', key: 'tmdb', displayName: 'TMDB', description: 'The Movie Database', detailSegment: 'movies', sortOrder: 1 },
      { domainName: 'media', key: 'tvdb', displayName: 'TVDB', description: 'TheTVDB', detailSegment: 'series', sortOrder: 2 },
      { domainName: 'media', key: 'amazon-media', displayName: 'Amazon Media', description: 'Amazon (films & séries)', detailSegment: 'product', sortOrder: 3 },
      // music
      { domainName: 'music', key: 'discogs', displayName: 'Discogs', description: 'Discogs Music Database', detailSegment: 'releases', sortOrder: 1 },
      { domainName: 'music', key: 'deezer', displayName: 'Deezer', description: 'Deezer API', detailSegment: 'albums', sortOrder: 2 },
      { domainName: 'music', key: 'musicbrainz', displayName: 'MusicBrainz', description: 'MusicBrainz Database', detailSegment: 'albums', sortOrder: 3 },
      { domainName: 'music', key: 'itunes', displayName: 'iTunes', description: 'iTunes Search API', detailSegment: 'albums', sortOrder: 4 },
      { domainName: 'music', key: 'amazon-music', displayName: 'Amazon Music', description: 'Amazon (musique)', detailSegment: 'product', sortOrder: 5 },
      // boardgames
      { domainName: 'boardgames', key: 'bgg', displayName: 'BGG', description: 'BoardGameGeek (BGG)', detailSegment: 'game', sortOrder: 1 },
      { domainName: 'boardgames', key: 'amazon-boardgames', displayName: 'Amazon BoardGames', description: 'Amazon (jeux de société)', detailSegment: 'product', sortOrder: 2 },
      // construction-toys
      { domainName: 'construction-toys', key: 'lego', displayName: 'LEGO', description: 'Site officiel LEGO.com', detailSegment: null, sortOrder: 1 },
      { domainName: 'construction-toys', key: 'rebrickable', displayName: 'Rebrickable', description: 'Base de données LEGO communautaire', detailSegment: 'sets', sortOrder: 2 },
      { domainName: 'construction-toys', key: 'brickset', displayName: 'Brickset', description: 'Base de données de sets LEGO', detailSegment: 'sets', sortOrder: 3 },
      { domainName: 'construction-toys', key: 'playmobil', displayName: 'Playmobil', description: 'Site officiel Playmobil', detailSegment: null, sortOrder: 4 },
      { domainName: 'construction-toys', key: 'klickypedia', displayName: 'Klickypedia', description: 'Encyclopédie Playmobil', detailSegment: null, sortOrder: 5 },
      { domainName: 'construction-toys', key: 'mega', displayName: 'Mega', description: 'Mega Construx / Mega Bloks', detailSegment: null, sortOrder: 6 },
      { domainName: 'construction-toys', key: 'amazon-toys', displayName: 'Amazon Toys', description: 'Amazon (jouets construction)', detailSegment: 'product', sortOrder: 7 },
      // collectibles
      { domainName: 'collectibles', key: 'coleka', displayName: 'Coleka', description: 'Coleka - Objets de collection (scraping)', detailSegment: 'item', sortOrder: 1 },
      { domainName: 'collectibles', key: 'luluberlu', displayName: 'Luluberlu', description: 'Luluberlu (scraping)', detailSegment: 'item', sortOrder: 2 },
      { domainName: 'collectibles', key: 'transformerland', displayName: 'Transformerland', description: 'Transformerland Database', detailSegment: null, sortOrder: 3 },
      { domainName: 'collectibles', key: 'amazon-collectibles', displayName: 'Amazon Collectibles', description: 'Amazon (figurines & objets)', detailSegment: 'product', sortOrder: 4 },
      // tcg
      { domainName: 'tcg', key: 'pokemon', displayName: 'Pokémon TCG', description: 'Pokémon TCG API', detailSegment: 'card', sortOrder: 1 },
      { domainName: 'tcg', key: 'mtg', displayName: 'MTG', description: 'Magic: The Gathering (Scryfall)', detailSegment: 'card', sortOrder: 2 },
      { domainName: 'tcg', key: 'yugioh', displayName: 'Yu-Gi-Oh!', description: 'Yu-Gi-Oh! API', detailSegment: 'card', sortOrder: 3 },
      { domainName: 'tcg', key: 'lorcana', displayName: 'Lorcana', description: 'Disney Lorcana', detailSegment: 'card', sortOrder: 4 },
      { domainName: 'tcg', key: 'digimon', displayName: 'Digimon', description: 'Digimon Card Game', detailSegment: 'card', sortOrder: 5 },
      { domainName: 'tcg', key: 'onepiece', displayName: 'One Piece', description: 'One Piece Card Game', detailSegment: 'card', sortOrder: 6 },
      // sticker-albums
      { domainName: 'sticker-albums', key: 'paninimania', displayName: 'Paninimania', description: 'Paninimania - Albums Panini (scraping)', detailSegment: 'album', sortOrder: 1 },
      // ecommerce
      { domainName: 'ecommerce', key: 'amazon', displayName: 'Amazon', description: 'Amazon Product API (scraping)', detailSegment: 'product', sortOrder: 1 },
    ];
  }

  // ──────────────────────────────────────────────
  //  PRIMARY_TYPE → DOMAINS MAPPING
  // ──────────────────────────────────────────────

  private getTypeDomainMappings(): Record<string, string[]> {
    return {
      books: ['books', 'comics', 'anime-manga'],
      video_games: ['videogames'],
      music: ['music'],
      movies: ['media'],
      series: ['media', 'anime-manga'],
      toys_fig: ['collectibles'],
      toys_construct: ['construction-toys'],
      board_games: ['boardgames'],
      trading_cards: ['tcg'],
      sticker_albums: ['sticker-albums'],
      divers: ['books', 'comics', 'videogames', 'music', 'media', 'anime-manga', 'construction-toys', 'collectibles', 'boardgames', 'tcg', 'sticker-albums', 'ecommerce'],
    };
  }

  // ──────────────────────────────────────────────
  //  SEED METHODS
  // ──────────────────────────────────────────────

  private async seedDomains(): Promise<void> {
    const data = this.getDomainSeedData();
    for (const d of data) {
      const existing = await this.domainRepo.findOne({ where: { name: d.name! } });
      if (!existing) {
        await this.domainRepo.save(this.domainRepo.create(d));
      }
    }
    this.logger.log(`  → ${data.length} domaines seedés`);
  }

  private async seedProviders(): Promise<void> {
    const data = this.getProviderSeedData();
    const domains = await this.domainRepo.find();
    const domainMap = new Map(domains.map((d) => [d.name, d.id]));

    for (const p of data) {
      const domainId = domainMap.get(p.domainName);
      if (!domainId) {
        this.logger.warn(`  ⚠ Domaine '${p.domainName}' non trouvé, skip provider '${p.key}'`);
        continue;
      }
      const existing = await this.providerRepo.findOne({ where: { domainId, key: p.key } });
      if (!existing) {
        await this.providerRepo.save(this.providerRepo.create({
          domainId,
          key: p.key,
          displayName: p.displayName,
          description: p.description,
          detailSegment: p.detailSegment,
          sortOrder: p.sortOrder,
        }));
      }
    }
    this.logger.log(`  → ${data.length} providers seedés`);
  }

  /**
   * Synchronise les liens PrimaryType ↔ Domain.
   * Tourne à chaque démarrage pour tenir compte des nouveaux types ou domaines.
   */
  async syncTypeDomainMappings(): Promise<void> {
    const mappings = this.getTypeDomainMappings();
    const domains = await this.domainRepo.find();
    const domainMap = new Map(domains.map((d) => [d.name, d]));

    const types = await this.ptRepo.find({ relations: ['domains'] });
    let updated = 0;

    for (const type of types) {
      const expectedDomainNames = mappings[type.keyName];
      if (!expectedDomainNames) continue;

      const expectedDomains = expectedDomainNames
        .map((name) => domainMap.get(name))
        .filter(Boolean) as Domain[];

      const currentDomainIds = new Set((type.domains || []).map((d) => d.id));
      const expectedDomainIds = new Set(expectedDomains.map((d) => d.id));

      const isSame =
        currentDomainIds.size === expectedDomainIds.size &&
        [...currentDomainIds].every((id) => expectedDomainIds.has(id));

      if (!isSame) {
        type.domains = expectedDomains;
        await this.ptRepo.save(type);
        updated++;
      }
    }

    if (updated > 0) {
      this.logger.log(`  → ${updated} type-domain mappings mis à jour`);
    }
  }

  /**
   * Vérifie que les providers existants sont bien tous en DB.
   * Ajoute les manquants (utile si on ajoute un provider dans le code et reboot).
   */
  private async syncProviders(): Promise<void> {
    const data = this.getProviderSeedData();
    const domains = await this.domainRepo.find();
    const domainMap = new Map(domains.map((d) => [d.name, d.id]));
    let added = 0;

    for (const p of data) {
      const domainId = domainMap.get(p.domainName);
      if (!domainId) continue;
      const existing = await this.providerRepo.findOne({ where: { domainId, key: p.key } });
      if (!existing) {
        await this.providerRepo.save(this.providerRepo.create({
          domainId,
          key: p.key,
          displayName: p.displayName,
          description: p.description,
          detailSegment: p.detailSegment,
          sortOrder: p.sortOrder,
        }));
        added++;
      }
    }

    if (added > 0) {
      this.logger.log(`  → ${added} providers manquants ajoutés`);
    }
  }

  /**
   * Met à jour les champs icon, routePath, sortOrder et displayName
   * des domaines existants s'ils sont vides / différents du seed.
   * Crée aussi les domaines manquants.
   */
  private async syncDomainFields(): Promise<void> {
    const seedData = this.getDomainSeedData();
    const seedMap = new Map(seedData.map((d) => [d.name!, d]));
    const existing = await this.domainRepo.find();
    const existingNames = new Set(existing.map((d) => d.name));
    let updated = 0;
    let created = 0;

    // Update existing
    for (const domain of existing) {
      const seed = seedMap.get(domain.name);
      if (!seed) continue;

      let changed = false;
      if (!domain.routePath && seed.routePath) { domain.routePath = seed.routePath; changed = true; }
      if (!domain.icon && seed.icon) { domain.icon = seed.icon; changed = true; }
      if (domain.sortOrder === 0 && seed.sortOrder) { domain.sortOrder = seed.sortOrder; changed = true; }
      if (seed.displayName && domain.displayName !== seed.displayName) {
        domain.displayName = seed.displayName;
        changed = true;
      }

      if (changed) {
        await this.domainRepo.save(domain);
        updated++;
      }
    }

    // Create missing domains
    for (const seed of seedData) {
      if (!existingNames.has(seed.name!)) {
        await this.domainRepo.save(this.domainRepo.create(seed));
        created++;
        this.logger.log(`  → Domaine '${seed.name}' créé`);
      }
    }

    if (updated > 0) {
      this.logger.log(`  → ${updated} domaines mis à jour (routePath/icon/sortOrder)`);
    }
    if (created > 0) {
      this.logger.log(`  → ${created} domaines manquants ajoutés`);
    }
  }
}
