import {
  Injectable,
  Logger,
  Inject,
  OnModuleInit,
  OnModuleDestroy,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { TakoApiConfig } from '../../database/entities/tako-api-config.entity';
import { TakoApiDomainMapping } from '../../database/entities/tako-api-domain-mapping.entity';
import { Domain } from '../../database/entities/domain.entity';
import { TakoProvider } from '../../database/entities/tako-provider.entity';
import { PrimaryType } from '../../database/entities/primary-type.entity';
import {
  TakoSearchDto,
  TakoSearchResult,
  TakoDomainInfo,
  TakoDomain,
} from './dto/tako.dto';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * Mapping des routes Tako_Api par domaine.
 * Certains domaines ont un préfixe différent (construction-toys n'a pas /api/).
 */
/**
 * Segment intermédiaire pour les routes de détail Tako.
 * L'URL de détail est : {domainRoute}/{provider}/{detailSegment}/{sourceId}
 * Si absent, pas de segment intermédiaire : {domainRoute}/{provider}/{sourceId}
 */
const DETAIL_SEGMENTS: Record<string, Record<string, string>> = {
  videogames: {
    rawg: 'game',
    igdb: 'game',
    jvc: 'game',
    consolevariations: 'item',       // v2.0.1 (was 'console')
    'amazon-videogames': 'product',  // v2.2.0
  },
  books: {
    // v2.0.1: no intermediate segment — direct /{provider}/{id}
    'amazon-books': 'product',       // v2.2.0
  },
  comics: {
    comicvine: 'issue',
    bedetheque: 'album',
    'amazon-comics': 'product',      // v2.2.0
  },
  'anime-manga': {
    jikan: 'anime',
    mangaupdates: 'series',          // v2.0.1 (was 'manga')
    'amazon-manga': 'product',       // v2.2.0
  },
  media: {
    tmdb: 'movies',
    tvdb: 'series',
    'amazon-media': 'product',       // v2.2.0
  },
  boardgames: {
    bgg: 'game',                     // v2.0.1 provider renamed (was 'boardgamegeek')
    'amazon-boardgames': 'product',  // v2.2.0
  },
  music: {
    discogs: 'releases',             // v2.0.1 (was 'release')
    deezer: 'albums',                // v2.0.1 (was 'album')
    musicbrainz: 'albums',           // v2.0.1 (was 'release')
    itunes: 'albums',                // v2.0.1 (was 'album')
    'amazon-music': 'product',       // v2.2.0
  },
  tcg: {
    pokemon: 'card',                 // v2.6.1: source changée → TCGdex (api.tcgdex.net)
    mtg: 'card',
    yugioh: 'card',
    lorcana: 'card',
    digimon: 'card',
    onepiece: 'card',
  },
  'construction-toys': {
    rebrickable: 'sets',             // v2.0.1 (was 'set')
    brickset: 'sets',                // v2.0.1 (was 'set')
    // v2.0.1: playmobil, klickypedia, mega → no segment (direct /{provider}/{id})
    // lego: no segment either → /construction-toys/lego/:id
    'amazon-toys': 'product',        // v2.2.0
  },
  collectibles: {
    coleka: 'item',
    luluberlu: 'item',
    transformerland: 'item',
    'amazon-collectibles': 'product',
  },
  ecommerce: {
    amazon: 'product',
  },
};

const DOMAIN_ROUTES: Record<string, string> = {
  'construction-toys': '/api/construction-toys',  // v2.0.1 fix: uniformisé avec /api/ comme tous les autres
  videogames: '/api/videogames',
  books: '/api/books',
  comics: '/api/comics',
  'anime-manga': '/api/anime-manga',
  media: '/api/media',
  boardgames: '/api/boardgames',
  collectibles: '/api/collectibles',
  tcg: '/api/tcg',
  music: '/api/music',
  'sticker-albums': '/api/sticker-albums',
  ecommerce: '/api/ecommerce',
};

/**
 * Mapping des providers connus par domaine.
 * Utilisé pour lister les providers disponibles et construire les URLs.
 */
const DOMAIN_PROVIDERS: Record<string, { name: string; description: string }[]> = {
  'construction-toys': [
    { name: 'lego', description: 'Site officiel LEGO.com' },
    { name: 'rebrickable', description: 'Base de données LEGO communautaire' },
    { name: 'brickset', description: 'Base de données de sets LEGO' },
    { name: 'playmobil', description: 'Site officiel Playmobil' },
    { name: 'klickypedia', description: 'Encyclopédie Playmobil' },
    { name: 'mega', description: 'Mega Construx / Mega Bloks' },
    { name: 'amazon-toys', description: 'Amazon (jouets construction)' },
  ],
  videogames: [
    { name: 'igdb', description: 'Internet Game Database (Twitch API)' },
    { name: 'rawg', description: 'RAWG Video Games Database' },
    { name: 'jvc', description: 'JeuxVideo.com (scraping)' },
    { name: 'consolevariations', description: 'Console Variations Database' },
    { name: 'amazon-videogames', description: 'Amazon (jeux vidéo)' },
  ],
  books: [
    { name: 'googlebooks', description: 'Google Books API' },
    { name: 'openlibrary', description: 'Open Library (archive.org)' },
    { name: 'amazon-books', description: 'Amazon (livres)' },
  ],
  comics: [
    { name: 'comicvine', description: 'Comic Vine Database' },
    { name: 'bedetheque', description: 'BDGest / Bédéthèque (scraping)' },
    { name: 'amazon-comics', description: 'Amazon (BD & comics)' },
  ],
  'anime-manga': [
    { name: 'jikan', description: 'Jikan (MyAnimeList API)' },
    { name: 'mangaupdates', description: 'MangaUpdates Database' },
    { name: 'amazon-manga', description: 'Amazon (anime & manga)' },
  ],
  media: [
    { name: 'tmdb', description: 'The Movie Database' },
    { name: 'tvdb', description: 'TheTVDB' },
    { name: 'amazon-media', description: 'Amazon (films & séries)' },
  ],
  boardgames: [
    { name: 'bgg', description: 'BoardGameGeek (BGG)' },  // v2.0.1 (was boardgamegeek)
    { name: 'amazon-boardgames', description: 'Amazon (jeux de société)' },
  ],
  collectibles: [
    { name: 'coleka', description: 'Coleka - Objets de collection (scraping)' },
    { name: 'luluberlu', description: 'Luluberlu (scraping)' },
    { name: 'transformerland', description: 'Transformerland Database' },
    { name: 'amazon-collectibles', description: 'Amazon (figurines & objets)' },
  ],
  'sticker-albums': [
    { name: 'paninimania', description: 'Paninimania - Albums Panini (scraping)' },
  ],
  tcg: [
    { name: 'pokemon', description: 'Pokémon TCG (TCGdex)' },  // v2.6.1: source changée → TCGdex (api.tcgdex.net)
    { name: 'mtg', description: 'Magic: The Gathering (Scryfall)' },
    { name: 'yugioh', description: 'Yu-Gi-Oh! API' },
    { name: 'lorcana', description: 'Disney Lorcana' },
    { name: 'digimon', description: 'Digimon Card Game' },
    { name: 'onepiece', description: 'One Piece Card Game' },
  ],
  music: [
    { name: 'discogs', description: 'Discogs Music Database' },
    { name: 'deezer', description: 'Deezer API' },
    { name: 'musicbrainz', description: 'MusicBrainz Database' },
    { name: 'itunes', description: 'iTunes Search API' },
    { name: 'amazon-music', description: 'Amazon (musique)' },
  ],
  ecommerce: [
    { name: 'amazon', description: 'Amazon Product API (scraping)' },
  ],
};

/**
 * Mapping domaine Tako → PrimaryType key_name (pour auto‑sélection du type).
 * Permet de pré‑remplir le PrimaryType lors de l'import d'un résultat Tako.
 */
export const DOMAIN_TO_PRIMARY_TYPE: Record<string, string> = {
  books: 'books',
  videogames: 'video_games',
  music: 'music',
  media: 'movies',          // Par défaut films ; le frontend différencie movie/tv
  'construction-toys': 'toys_construct',
  collectibles: 'toys_fig',
  boardgames: 'board_games',
  tcg: 'trading_cards',
  comics: 'books',           // BD → même type "books"
  'anime-manga': 'series',   // Anime/Manga → séries
  'sticker-albums': 'sticker_albums',  // Paninimania
  ecommerce: 'divers',
};

/**
 * Mapping inverse : PrimaryType key_name → domaines Tako accessibles.
 * Un type peut accéder à plusieurs domaines (ex: books → books + comics).
 */
export const PRIMARY_TYPE_TO_DOMAINS: Record<string, string[]> = {
  books: ['books', 'comics', 'anime-manga'],
  video_games: ['videogames'],
  music: ['music'],
  movies: ['media'],
  series: ['media', 'anime-manga'],
  toys_fig: ['collectibles'],
  toys_construct: ['construction-toys'],
  board_games: ['boardgames'],
  trading_cards: ['tcg'],
  sticker_albums: ['sticker-albums'],  // Paninimania
  divers: ['books', 'comics', 'videogames', 'music', 'media', 'anime-manga', 'construction-toys', 'collectibles', 'boardgames', 'tcg', 'sticker-albums', 'ecommerce'],  // Tous les domaines
};

/**
 * Mapping clés métadonnées Tako → fieldKey EAV du PrimaryTypeField.
 * Chaque domaine a son propre jeu de correspondances.
 * La clé externe est le primaryType key_name (pas le domaine Tako).
 */
export const TAKO_FIELD_MAPPING: Record<string, Record<string, string>> = {
  books: {
    authors: 'author',        // array → join(', ')
    publisher: 'publisher',
    pageCount: 'pages',       // number → string
    isbn13: 'isbn',
    isbn10: 'isbn',
    publishedDate: 'year',    // "2015-06-23" → "2015"
    language: 'language',
    categories: 'genre',      // array → join(', ')
    genres: 'genre',
  },
  video_games: {
    platforms: 'platform',    // array → join(', ')
    genres: 'genre',          // array → join(', ')
    developers: 'developer',  // array → join(', ')
    publishers: 'publisher',  // array → join(', ')
    releaseDate: 'year',      // "2020-04-10" → "2020"
    metacritic: 'metacritic',
  },
  music: {
    artist: 'artist',
    artists: 'artist',        // array → join(', ')
    label: 'label',           // v2.0.1: labels[] normalized to string
    format: 'format',         // v2.0.1: formats[] normalized to string
    genre: 'genre',
    tracklist: 'tracks',      // array → count → string
    tracksCount: 'tracks',    // v2.0.1: trackCount
    country: 'country',
  },
  movies: {
    director: 'director',     // v2.6.1: extractMetadata normalizes directors[] → director
    runtime: 'duration',      // number en minutes → string
    genres: 'genre',          // array → multiselect matching
    productionCompanies: 'studio', // normalized from studios (v2.6.1) or productionCompanies
    studios: 'studio',        // v2.6.1 alias (direct from API)
    originalLanguage: 'language',
  },
  series: {
    genres: 'genre',          // array → multiselect matching
    seasons: 'seasons',       // v2.6.1: seasonCount → seasons (via extractMetadata)
    seasonCount: 'seasons',   // v2.6.1 alias (direct from API)
    networks: 'network',      // array of objects → join(', ')
    creator: 'creator',       // v2.6.1: creators → creator (via extractMetadata)
    creators: 'creator',      // v2.6.1 alias (direct from API)
    status: 'completed',      // "Ended" → "true"
  },
  toys_construct: {
    // v2.0.10 standardized field names
    set_number: 'set_number',
    pieces: 'pieces',
    minifigs: 'minifigs',
    figureCount: 'minifigs',      // Klickypedia figurines = minifigs
    theme: 'theme',
    subtheme: 'theme',
    brand: 'brand',
    format: 'format',
    tags: 'tags',
    ageRange: 'age_range',
    // backward compat (pre-v2.0.10 field names)
    setNum: 'set_number',
    set_num: 'set_number',
    setNumber: 'set_number',
    productCode: 'set_number',
    numParts: 'pieces',
    num_parts: 'pieces',
    pieceCount: 'pieces',
    minifigCount: 'minifigs',
    // price is NOT an EAV field – handled separately via marketValue in frontend
    // category excluded — inconsistent across providers (box format vs product line)
  },
  board_games: {
    minPlayers: 'players_min',
    maxPlayers: 'players_max',
    playingTime: 'play_time',
    categories: 'genre',      // array → join(', ')
    mechanics: 'genre',       // fallback
    designers: 'designer',    // array → join(', ')
    weight: 'complexity',     // v2.0.1: stats.complexity → weight
    average: 'rating',        // v2.0.1: stats.rating → average
  },
  trading_cards: {
    game: 'game',              // derived from provider in extractMetadata
    rarity: 'rarity',
    setName: 'set_name',
    cardNumber: 'card_number',
    releaseDate: 'year',       // set.releaseDate → year
  },
  toys_fig: {
    brand: 'brand',
    series: 'series',
    material: 'material',
    dimensions: 'scale',
    manufacturer: 'brand',
  },
  sticker_albums: {
    editor: 'publisher',
  },
  divers: {
    brand: 'brand',
    type: 'type',
  },
};

/**
 * Category-level field mapping: maps Tako metadata keys → category field keys.
 * Keyed by provider slug (e.g. 'lorcana', 'pokemon').
 */
export const TAKO_CATEGORY_FIELD_MAPPING: Record<string, Record<string, string>> = {
  lorcana: {
    artist: 'artist',
    color: 'color',
    cost: 'cost',
    strength: 'strength',
    willpower: 'willpower',
    lore: 'lore',
    inkwell: 'inkwell',
    story: 'story',
    version: 'version',
    subtypes: 'subtypes',
    foilTypes: 'foil_types',
    abilities: 'abilities',
    flavorText: 'flavor_text',
  },
  pokemon: {
    supertype: 'supertype',
    subtypes: 'subtypes',
    types: 'element_types',
    hp: 'hp',
    stage: 'stage',
    evolvesFrom: 'evolves_from',
    attacks: 'attacks',
    abilities: 'abilities',
    weaknesses: 'weaknesses',
    resistances: 'resistances',
    retreatCost: 'retreat_cost',
    regulationMark: 'regulation_mark',
    nationalPokedexNumbers: 'pokedex_number',
    rules: 'rules',
  },
  mtg: {
    manaCost: 'mana_cost',
    cmc: 'cmc',
    typeLine: 'type_line',
    oracleText: 'oracle_text',
    power: 'power',
    toughness: 'toughness',
    loyalty: 'loyalty',
    colors: 'colors',
    colorIdentity: 'color_identity',
    layout: 'layout',
    keywords: 'keywords',
    foil: 'foil',
    promo: 'promo',
    reprint: 'reprint',
  },
  yugioh: {
    cardType: 'card_type',
    attribute: 'attribute',
    race: 'race',
    level: 'level',
    atk: 'atk',
    def: 'def',
    archetype: 'archetype',
    linkval: 'link_value',
    linkmarkers: 'link_markers',
    scale: 'pendulum_scale',
    pendulumEffect: 'pendulum_effect',
  },
  dbs: {
    cardType: 'card_type',
    color: 'color',
    power: 'power',
    energyCost: 'energy_cost',
    comboCost: 'combo_cost',
    comboPower: 'combo_power',
    character: 'character',
    specialTrait: 'traits',
    era: 'era',
    skills: 'keywords',
    skillDescription: 'skill_text',
  },
  onepiece: {
    cardType: 'card_type',
    color: 'color',
    attribute: 'attribute',
    cost: 'cost',
    power: 'power',
    counter: 'counter',
    life: 'life',
    effect: 'effect',
    trigger: 'trigger_effect',
    types: 'tags',
  },
  carddass: {
    cardNumber: 'card_number',
    rarity: 'rarity',
    rarityColor: 'rarity_color',
    license: 'license',
    collection: 'collection',
    series: 'series',
    originalSite: 'original_site',
  },
  digimon: {
    cardType: 'card_type',
    color: 'color',
    color2: 'color2',
    stage: 'digi_stage',
    level: 'level',
    dp: 'dp',
    playCost: 'play_cost',
    evolutionCost: 'digivolve_cost_1',
    digivolveCost1: 'digivolve_cost_1',
    digivolveCost2: 'digivolve_cost_2',
    evolutionColor: 'evolution_color',
    evolutionLevel: 'evolution_level',
    attribute: 'attribute',
    digiType: 'digi_type',
    mainEffect: 'main_effect',
    sourceEffect: 'inherited_effect',
    inheritedEffect: 'inherited_effect',
    securityEffect: 'security_effect',
    xrosRequirement: 'xros_requirement',
    tcgplayerId: 'tcgplayer_id',
    setName: 'set_name',
    artist: 'artist',
  },
  comicvine: {
    issueNumber: 'issue_number',
    serie: 'serie',
    coverDate: 'cover_date',
    artist: 'artist',
    colorist: 'colorist',
    characters: 'characters',
  },
  bedetheque: {
    tome: 'issue_number',
    serie: 'serie',
    releaseDate: 'cover_date',
    artist: 'artist',
    colorist: 'colorist',
    format: 'format',
    origin: 'origin',
  },
  mangaupdates: {
    serie: 'serie',
    artist: 'artist',
    status: 'status',
    demographic: 'demographic',
    titleOriginal: 'original_title',
    format: 'format',
  },
  'jikan-anime': {
    serie: 'serie',
    artist: 'artist',
    status: 'status',
    demographic: 'demographic',
    titleOriginal: 'original_title',
    format: 'format',
  },
  'jikan-manga': {
    serie: 'serie',
    artist: 'artist',
    status: 'status',
    demographic: 'demographic',
    titleOriginal: 'original_title',
    format: 'format',
  },
  nautiljon: {
    serie: 'serie',
    artist: 'artist',
    status: 'status',
    demographic: 'demographic',
    titleOriginal: 'original_title',
    format: 'format',
    origin: 'origin',
    issueNumber: 'issue_number',
  },
  paninimania: {
    editor: 'editor',
    theme: 'theme',
    releaseDate: 'release_date',
    totalStickers: 'total_stickers',
    totalWithSpecials: 'total_with_specials',
    copyright: 'copyright',
    stickerChecklist: 'sticker_checklist',
  },
  luluberlu: {
    license: 'license',
    manufacturer: 'manufacturer',
    collection: 'collection',
    condition: 'condition',
    dimensions: 'dimensions',
  },
  coleka: {
    license: 'license',
    manufacturer: 'manufacturer',
    series: 'collection',
    collection: 'collection',
    condition: 'condition',
    dimensions: 'dimensions',
  },
  transformerland: {
    license: 'license',
    manufacturer: 'manufacturer',
    collection: 'collection',
    condition: 'condition',
  },
  'amazon-collectibles': {
    manufacturer: 'manufacturer',
    condition: 'condition',
  },
};

@Injectable()
export class TakoService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TakoService.name);
  private apiUrl: string;
  private timeout: number;
  private cacheTtl: number;
  private maxRetries: number;
  private isActive: boolean;
  private healthCheckInterval: ReturnType<typeof setInterval>;

  constructor(
    @InjectRepository(TakoApiConfig)
    private readonly configRepo: Repository<TakoApiConfig>,
    @InjectRepository(TakoApiDomainMapping)
    private readonly mappingRepo: Repository<TakoApiDomainMapping>,
    @InjectRepository(Domain)
    private readonly domainRepo: Repository<Domain>,
    @InjectRepository(TakoProvider)
    private readonly providerRepo: Repository<TakoProvider>,
    @InjectRepository(PrimaryType)
    private readonly ptRepo: Repository<PrimaryType>,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly configService: ConfigService,
  ) {
    // Defaults from env
    this.apiUrl =
      this.configService.get('TAKO_API_URL') ||
      'http://tako_api:3000';
    this.timeout =
      parseInt(this.configService.get('TAKO_API_TIMEOUT') || '30000', 10);
    this.cacheTtl = 3600;
    this.maxRetries = 3;
    this.isActive = true;
  }

  async onModuleInit() {
    await this.loadConfig();
    // Health check every 5 minutes
    this.healthCheckInterval = setInterval(
      () => this.healthCheck(),
      5 * 60 * 1000,
    );
    this.logger.log(
      `Tako_Api client initialized → ${this.apiUrl} (timeout: ${this.timeout}ms, cache: ${this.cacheTtl}s)`,
    );
  }

  onModuleDestroy() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }

  // ──────────────────────────────────────────────
  // CONFIG
  // ──────────────────────────────────────────────

  private async loadConfig() {
    try {
      const config = await this.configRepo.findOne({ where: { id: 1 } });
      if (config) {
        this.apiUrl = config.apiUrl;
        this.timeout = config.timeout;
        this.cacheTtl = config.cacheTtl;
        this.maxRetries = config.maxRetries;
        this.isActive = config.isActive;
      }
    } catch (e) {
      this.logger.warn('Could not load Tako_Api config from DB, using defaults');
    }
  }

  /** Public method to reload config after admin updates */
  async reloadConfig() {
    await this.loadConfig();
    this.logger.log(`Tako config reloaded → ${this.apiUrl} (active: ${this.isActive})`);
  }

  // ──────────────────────────────────────────────
  // HEALTH CHECK
  // ──────────────────────────────────────────────

  async healthCheck(): Promise<{
    status: string;
    version?: string;
    uptime?: number;
  }> {
    try {
      const response = await this.httpGet('/health');
      const status = response.status || 'unknown';

      // Update DB
      await this.configRepo.update(1, {
        lastHealthCheck: new Date(),
        healthStatus: status === 'ok' ? 'healthy' : 'degraded',
      });

      return response;
    } catch (e) {
      this.logger.error(`Tako_Api health check failed: ${e.message}`);
      try {
        await this.configRepo.update(1, {
          lastHealthCheck: new Date(),
          healthStatus: 'down',
        });
      } catch {}
      return { status: 'down' };
    }
  }

  // ──────────────────────────────────────────────
  // DYNAMIC LOOKUPS (DB-backed with Redis cache)
  // ──────────────────────────────────────────────

  /**
   * Translates a SnowShelf provider key to the actual Tako_Api provider name.
   * Domain-specific keys like 'amazon-videogames' → 'amazon' for API calls.
   * Non-amazon keys are returned as-is.
   */
  private getApiProviderName(key: string): string {
    if (key.startsWith('amazon-')) return 'amazon';
    if (key.startsWith('jikan-')) return 'jikan';
    return key;
  }

  /** Loads { domainName: routePath } from DB (with cache). Falls back to hardcoded DOMAIN_ROUTES. */
  private async getDomainRouteMap(): Promise<Record<string, string>> {
    const cacheKey = 'tako:domain_routes';
    const cached = await this.cacheManager.get<Record<string, string>>(cacheKey);
    if (cached) return cached;

    const domains = await this.domainRepo.find({ where: { isActive: true } });
    const map: Record<string, string> = {};
    for (const d of domains) {
      if (d.routePath) {
        map[d.name] = d.routePath;
      } else {
        // Fallback to hardcoded if DB entry has no routePath
        map[d.name] = DOMAIN_ROUTES[d.name] || `/api/${d.name}`;
      }
    }
    // Also include any hardcoded domains not yet in DB (safety net)
    for (const [name, route] of Object.entries(DOMAIN_ROUTES)) {
      if (!map[name]) map[name] = route;
    }
    await this.cacheManager.set(cacheKey, map, this.cacheTtl);
    return map;
  }

  /** Loads providers per domain from DB (with cache). Falls back to hardcoded DOMAIN_PROVIDERS. */
  private async getDomainProviderMap(): Promise<Record<string, { name: string; description: string }[]>> {
    const cacheKey = 'tako:domain_providers';
    const cached = await this.cacheManager.get<Record<string, { name: string; description: string }[]>>(cacheKey);
    if (cached) return cached;

    const domains = await this.domainRepo.find({
      where: { isActive: true },
      relations: ['providers'],
    });

    const map: Record<string, { name: string; description: string }[]> = {};
    for (const d of domains) {
      const activeProviders = (d.providers || [])
        .filter((p) => p.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder);
      if (activeProviders.length > 0) {
        map[d.name] = activeProviders.map((p) => ({ name: p.key, description: p.description || '' }));
      } else {
        // Fallback to hardcoded
        map[d.name] = DOMAIN_PROVIDERS[d.name] || [];
      }
    }
    // Safety net: include hardcoded domains not yet in DB
    for (const [name, providers] of Object.entries(DOMAIN_PROVIDERS)) {
      if (!map[name]) map[name] = providers;
    }
    await this.cacheManager.set(cacheKey, map, this.cacheTtl);
    return map;
  }

  /** Loads detail segments per domain/provider from DB (with cache). Falls back to hardcoded DETAIL_SEGMENTS. */
  private async getDetailSegmentMap(): Promise<Record<string, Record<string, string>>> {
    const cacheKey = 'tako:detail_segments';
    const cached = await this.cacheManager.get<Record<string, Record<string, string>>>(cacheKey);
    if (cached) return cached;

    const providers = await this.providerRepo.find({
      relations: ['domain'],
      where: { isActive: true },
    });

    const map: Record<string, Record<string, string>> = {};
    for (const p of providers) {
      if (p.detailSegment && p.domain) {
        if (!map[p.domain.name]) map[p.domain.name] = {};
        map[p.domain.name][p.key] = p.detailSegment;
      }
    }
    // Merge hardcoded as fallback
    for (const [domain, segments] of Object.entries(DETAIL_SEGMENTS)) {
      if (!map[domain]) map[domain] = {};
      for (const [provider, segment] of Object.entries(segments)) {
        if (!map[domain][provider]) map[domain][provider] = segment;
      }
    }
    await this.cacheManager.set(cacheKey, map, this.cacheTtl);
    return map;
  }

  /** PrimaryType keyName → domain names[], loaded from DB junction table. */
  async getPrimaryTypeToDomainMap(): Promise<Record<string, string[]>> {
    const cacheKey = 'tako:primary_type_to_domains';
    const cached = await this.cacheManager.get<Record<string, string[]>>(cacheKey);
    if (cached) return cached;

    const types = await this.ptRepo.find({ relations: ['domains'] });
    const map: Record<string, string[]> = {};
    for (const t of types) {
      const domainNames = (t.domains || [])
        .filter((d) => d.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((d) => d.name);
      if (domainNames.length > 0) {
        map[t.keyName] = domainNames;
      } else {
        // Fallback to hardcoded
        map[t.keyName] = PRIMARY_TYPE_TO_DOMAINS[t.keyName] || [];
      }
    }
    await this.cacheManager.set(cacheKey, map, this.cacheTtl);
    return map;
  }

  /** Domain name → PrimaryType keyName, derived from the inverse of PrimaryType→Domains. */
  async getDomainToPrimaryTypeMap(): Promise<Record<string, string>> {
    const cacheKey = 'tako:domain_to_primary_type';
    const cached = await this.cacheManager.get<Record<string, string>>(cacheKey);
    if (cached) return cached;

    const typeToDomains = await this.getPrimaryTypeToDomainMap();
    const map: Record<string, string> = {};
    for (const [typeKey, domainNames] of Object.entries(typeToDomains)) {
      for (const domainName of domainNames) {
        if (!map[domainName]) {
          // First type claiming this domain wins
          map[domainName] = typeKey;
        } else if (map[domainName] === 'divers' && typeKey !== 'divers') {
          // More specific type overrides generic "divers"
          map[domainName] = typeKey;
        }
        // Otherwise keep existing (first non-divers type wins)
      }
    }
    await this.cacheManager.set(cacheKey, map, this.cacheTtl);
    return map;
  }

  // ──────────────────────────────────────────────
  // DOMAINS
  // ──────────────────────────────────────────────

  async getDomains(): Promise<TakoDomainInfo[]> {
    const cacheKey = 'tako:domains';
    const cached = await this.cacheManager.get<TakoDomainInfo[]>(cacheKey);
    if (cached) return cached;

    // Load from DB with providers relation
    const dbDomains = await this.domainRepo.find({
      where: { isActive: true },
      relations: ['providers'],
      order: { sortOrder: 'ASC' },
    });

    const domains: TakoDomainInfo[] = dbDomains.map((d) => ({
      name: d.name,
      displayName: d.displayName,
      description: d.description || '',
      providers: (d.providers || [])
        .filter((p) => p.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((p) => ({ name: p.key, description: p.description || '' })),
    }));

    await this.cacheManager.set(cacheKey, domains, this.cacheTtl);
    return domains;
  }

  // ──────────────────────────────────────────────
  // PROVIDERS PAR TYPE D'OBJET
  // ──────────────────────────────────────────────

  async getProvidersForPrimaryType(typeKey: string): Promise<{
    typeKey: string;
    domains: { name: string; providers: { name: string; description: string }[] }[];
  }> {
    const typeToDomains = await this.getPrimaryTypeToDomainMap();
    const providerMap = await this.getDomainProviderMap();
    const domainNames = typeToDomains[typeKey] || [];
    const domains = domainNames.map((domainName) => ({
      name: domainName,
      providers: providerMap[domainName] || [],
    }));
    return { typeKey, domains };
  }

  // ──────────────────────────────────────────────
  // BARCODE LOOKUP
  // ──────────────────────────────────────────────

  /**
   * Look up a barcode (ISBN, EAN, UPC) across relevant Tako domains.
   * Auto-detects the barcode type and searches appropriate providers.
   */
  async lookupBarcode(barcode: string, domains?: string[]): Promise<{
    barcode: string;
    detectedType: string;
    totalResults: number;
    results: TakoSearchResult[];
  }> {
    if (!this.isActive) {
      throw new HttpException(
        'Tako_Api is currently disabled',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const cleanBarcode = barcode.replace(/[\s-]/g, '');
    const detectedType = this.detectBarcodeType(cleanBarcode);

    // Check cache
    const cacheKey = `tako:barcode:${cleanBarcode}:${domains?.sort().join(',') || 'auto'}`;
    const cached = await this.cacheManager.get<any>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit: ${cacheKey}`);
      return cached;
    }

    // Determine which domains to search based on barcode type and user preference
    const searchPlan = this.buildBarcodSearchPlan(cleanBarcode, detectedType, domains);

    const allResults: TakoSearchResult[] = [];

    const promises = searchPlan.map(async (plan) => {
      try {
        const results = await this.search({
          query: plan.query,
          domain: plan.domain,
          providers: plan.providers,
          maxResults: 10,
          lang: 'fr',
        });
        allResults.push(...results.results);
      } catch (e) {
        this.logger.warn(`Barcode lookup failed for ${plan.domain}: ${e.message}`);
      }
    });

    await Promise.all(promises);

    // Deduplicate by sourceId+provider
    const seen = new Set<string>();
    const uniqueResults = allResults.filter((r) => {
      const key = `${r.provider}:${r.sourceId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const result = {
      barcode: cleanBarcode,
      detectedType,
      totalResults: uniqueResults.length,
      results: uniqueResults,
    };

    await this.cacheManager.set(cacheKey, result, this.cacheTtl);
    return result;
  }

  /**
   * Detect the type of barcode from its value.
   */
  private detectBarcodeType(barcode: string): string {
    if (/^97[89]\d{10}$/.test(barcode)) return 'isbn13';
    if (/^97[89]\d{7}[\dX]$/.test(barcode)) return 'isbn13';
    if (/^\d{9}[\dX]$/.test(barcode)) return 'isbn10';
    if (/^\d{13}$/.test(barcode)) return 'ean13';
    if (/^\d{12}$/.test(barcode)) return 'upc';
    if (/^\d{8}$/.test(barcode)) return 'ean8';
    return 'unknown';
  }

  /**
   * Build a search plan for barcode lookup.
   * Returns an array of {domain, query, providers?} to search in parallel.
   */
  private buildBarcodSearchPlan(
    barcode: string,
    detectedType: string,
    allowedDomains?: string[],
  ): { domain: TakoDomain; query: string; providers?: string[] }[] {
    const plans: { domain: TakoDomain; query: string; providers?: string[] }[] = [];
    const allowed = allowedDomains?.length ? new Set(allowedDomains) : null;

    const addPlan = (domain: TakoDomain, query: string) => {
      if (!allowed || allowed.has(domain)) {
        plans.push({ domain, query });
      }
    };

    // ISBN → books (Google Books & OpenLibrary support isbn: prefix)
    if (detectedType === 'isbn13' || detectedType === 'isbn10') {
      addPlan('books', `isbn:${barcode}`);
      // Also try comics (may be a manga/BD ISBN)
      addPlan('comics', barcode);
    }

    // EAN-13/UPC → could be music (Discogs, MusicBrainz support barcode search)
    if (detectedType === 'ean13' || detectedType === 'upc') {
      addPlan('music', barcode);
      addPlan('boardgames', barcode);
      addPlan('videogames', barcode);
    }

    // Generic fallback: try ecommerce (Amazon) with barcode
    addPlan('ecommerce', barcode);

    // If allowedDomains were too restrictive and nothing matched, search all allowed domains
    if (plans.length === 0 && allowed) {
      for (const d of allowed) {
        plans.push({ domain: d as TakoDomain, query: barcode });
      }
    }

    return plans;
  }

  // ──────────────────────────────────────────────
  // SEARCH
  // ──────────────────────────────────────────────

  async search(dto: TakoSearchDto): Promise<{
    query: string;
    domain: string;
    providers: string[];
    totalResults: number;
    results: TakoSearchResult[];
  }> {
    if (!this.isActive) {
      throw new HttpException(
        'Tako_Api is currently disabled',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    const { query, domain, providers, maxResults = 20, lang = 'fr' } = dto;
    const routeMap = await this.getDomainRouteMap();
    const domainRoute = routeMap[domain];

    if (!domainRoute) {
      throw new HttpException(
        `Unknown domain: ${domain}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Determine which providers to search
    const providerMap = await this.getDomainProviderMap();
    const availableProviders = providerMap[domain] || [];
    const targetProviders = providers && providers.length > 0
      ? providers.filter((p) =>
          availableProviders.some((ap) => ap.name === p),
        )
      : availableProviders.map((p) => p.name);

    if (targetProviders.length === 0) {
      throw new HttpException(
        `No valid providers found for domain "${domain}"`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Check cache first
    const cacheKey = `tako:search:${domain}:${targetProviders.sort().join(',')}:${query}:${maxResults}:${lang}`;
    const cached = await this.cacheManager.get<any>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit: ${cacheKey}`);
      return cached;
    }

    // Search each provider in parallel
    const allResults: TakoSearchResult[] = [];
    const searchedProviders: string[] = [];

    const promises = targetProviders.map(async (provider) => {
      try {
        // Translate SnowShelf key → Tako API provider name (e.g. 'amazon-media' → 'amazon')
        const apiProvider = this.getApiProviderName(provider);
        // JVC is already in French, no need for autoTrad
        const tradParams = apiProvider === 'jvc' ? '' : '&autoTrad=true&lang=fr';
        // Domain-specific search paths (more relevant for collection management)
        let searchPaths = ['search'];
        if (domain === 'comics' && apiProvider === 'comicvine') searchPaths = ['search/issues'];
        if (domain === 'comics' && apiProvider === 'bedetheque') searchPaths = ['search/albums'];
        // Jikan virtual providers: jikan-anime → search/anime, jikan-manga → search/manga
        if (provider === 'jikan-anime') searchPaths = ['search/anime'];
        if (provider === 'jikan-manga') searchPaths = ['search/manga'];
        // Nautiljon: search at volume level, not series
        if (apiProvider === 'nautiljon') searchPaths = ['search/volumes'];

        let items: TakoSearchResult[] = [];
        for (const searchPath of searchPaths) {
          const url = `${domainRoute}/${apiProvider}/${searchPath}?q=${encodeURIComponent(query)}&limit=${maxResults}${tradParams}`;
          const raw = await this.httpGet(url);
          items.push(...this.normalizeResults(raw, domain, provider));
        }

        // TCGdex (pokemon) is natively multilingual: lang=fr only matches French names.
        // Fallback to lang=en if no results, so English names (e.g. "Charizard") also work.
        if (items.length === 0 && apiProvider === 'pokemon' && domain === 'tcg') {
          const fallbackUrl = `${domainRoute}/${apiProvider}/search?q=${encodeURIComponent(query)}&limit=${maxResults}&lang=en`;
          const fallbackRaw = await this.httpGet(fallbackUrl);
          items = this.normalizeResults(fallbackRaw, domain, provider);
        }

        allResults.push(...items);
        searchedProviders.push(provider);
      } catch (e) {
        this.logger.warn(
          `Tako search failed for ${domain}/${provider}: ${e.message}`,
        );
        // Don't fail the whole search if one provider errors
      }
    });

    await Promise.all(promises);

    const result = {
      query,
      domain,
      providers: searchedProviders,
      totalResults: allResults.length,
      results: allResults,
    };

    // Cache the results
    await this.cacheManager.set(cacheKey, result, this.cacheTtl);

    return result;
  }

  // ──────────────────────────────────────────────
  // DETAIL (get full details of a single item)
  // ──────────────────────────────────────────────

  async getDetail(
    domain: string,
    provider: string,
    sourceId: string,
    type?: string,
  ): Promise<TakoSearchResult | null> {
    const routeMap = await this.getDomainRouteMap();
    const domainRoute = routeMap[domain];
    if (!domainRoute) return null;

    const cacheKey = `tako:detail:${domain}:${provider}:${sourceId}:${type || ''}`;
    const cached = await this.cacheManager.get<TakoSearchResult>(cacheKey);
    if (cached) return cached;

    try {
      // Translate SnowShelf key → Tako API provider name (e.g. 'amazon-media' → 'amazon')
      const apiProvider = this.getApiProviderName(provider);
      // Build URL with optional detail segment: /api/{domain}/{provider}/{segment}/{sourceId}
      // For media providers (TMDB, TVDB), segment depends on type (movies vs series)
      const segmentMap = await this.getDetailSegmentMap();
      let segment = segmentMap[domain]?.[provider];
      if (domain === 'media' && (provider === 'tmdb' || provider === 'tvdb') && type) {
        segment = type === 'series' ? 'series' : 'movies';
      }
      // Jikan virtual providers: detail segment from DB (jikan-anime→anime, jikan-manga→manga)
      // No extra override needed — segmentMap already has the correct value per provider
      const encodedSourceId = encodeURIComponent(sourceId);
      const basePath = segment
        ? `${domainRoute}/${apiProvider}/${segment}/${encodedSourceId}`
        : `${domainRoute}/${apiProvider}/${encodedSourceId}`;
      // JVC is already in French, no need for autoTrad
      const tradParams = apiProvider === 'jvc' ? '' : '?autoTrad=true&lang=fr';
      const url = `${basePath}${tradParams}`;
      this.logger.debug(`Tako detail URL: ${url}`);
      const raw = await this.httpGet(url);
      const result = this.normalizeSingleResult(raw, domain, provider);
      if (result) {
        await this.cacheManager.set(cacheKey, result, this.cacheTtl);
      }
      return result;
    } catch (e) {
      this.logger.warn(
        `Tako detail failed for ${domain}/${provider}/${sourceId}: ${e.message}`,
      );
      return null;
    }
  }

  // ──────────────────────────────────────────────
  // PROXY DOWNLOAD (download and store an external file)
  // ──────────────────────────────────────────────

  async proxyDownload(
    url: string,
    userId: number,
    filename?: string,
  ): Promise<{
    tempPath: string;
    url: string;
    size: number;
    mimeType: string;
  }> {
    // Resolve relative Tako URLs (e.g. /api/tcg/onepiece/image/:cardId)
    url = this.resolveUrl(url);

    // Validate URL
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      throw new HttpException('Invalid URL', HttpStatus.BAD_REQUEST);
    }

    // SSRF Protection: block private/internal IPs
    const hostname = parsed.hostname;
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname === '0.0.0.0' ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('172.') ||
      hostname.startsWith('169.254.') ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal')
    ) {
      // Allow Tako API URL (internal but trusted)
      const takoHost = new URL(this.apiUrl).hostname;
      if (hostname !== takoHost) {
        throw new HttpException('URL target not allowed', HttpStatus.FORBIDDEN);
      }
    }

    try {
      let response: Response | null = null;
      const maxRetries = 5;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        response = await fetch(url, {
          headers: {
            'User-Agent': 'SnowShelf/2.0',
            Accept: '*/*',
          },
          signal: AbortSignal.timeout(60_000),
        });

        // Retry on 429 (rate limit) with exponential backoff
        if (response.status === 429 && attempt < maxRetries) {
          const retryAfter = parseInt(response.headers.get('retry-after') || '0', 10);
          const delay = retryAfter > 0
            ? retryAfter * 1000
            : Math.min((attempt + 1) * 3000, 15000);
          this.logger.warn(`Rate limited (429) on ${url}, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        break;
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const contentLength = parseInt(response.headers.get('content-length') || '0', 10);
      const MAX_DOWNLOAD_SIZE = 1024 * 1024 * 1024; // 1 GB
      if (contentLength > MAX_DOWNLOAD_SIZE) {
        throw new HttpException(
          `File too large: ${contentLength} bytes (max ${MAX_DOWNLOAD_SIZE})`,
          HttpStatus.BAD_REQUEST,
        );
      }

      const contentType = response.headers.get('content-type') || 'application/octet-stream';

      // Accept images, videos, audio, PDFs, and common document types
      const allowedPrefixes = ['image/', 'video/', 'audio/', 'application/pdf', 'application/octet-stream', 'binary/octet-stream', 'application/msword', 'application/vnd.'];
      const isAllowed = allowedPrefixes.some(prefix => contentType.startsWith(prefix));
      if (!isAllowed) {
        throw new HttpException(
          `Unsupported content type: ${contentType}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      let ext = this.mimeToExt(contentType);
      // If mime didn't resolve to a specific extension, try extracting from URL
      if (ext === 'bin') {
        const urlExt = url.split('?')[0].split('/').pop()?.split('.').pop()?.toLowerCase();
        if (urlExt && urlExt.length <= 5 && /^[a-z0-9]+$/.test(urlExt)) {
          ext = urlExt;
        }
      }
      const finalFilename = `temp_${userId}_${Date.now()}_${uuidv4().slice(0, 16)}.${ext}`;

      const tempDir = '/app/storage/temp';
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const filePath = path.join(tempDir, finalFilename);

      // Stream large files to disk instead of buffering in memory
      const fileStream = fs.createWriteStream(filePath);
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      let totalSize = 0;
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          totalSize += value.length;
          if (totalSize > MAX_DOWNLOAD_SIZE) {
            fileStream.destroy();
            fs.unlinkSync(filePath);
            throw new HttpException(
              `File too large: exceeded ${MAX_DOWNLOAD_SIZE} bytes`,
              HttpStatus.BAD_REQUEST,
            );
          }
          fileStream.write(value);
        }
      } finally {
        fileStream.end();
      }
      await new Promise<void>((resolve, reject) => {
        fileStream.on('finish', resolve);
        fileStream.on('error', reject);
      });

      return {
        tempPath: filePath,
        url: `/storage/temp/${finalFilename}`,
        size: totalSize,
        mimeType: contentType,
      };
    } catch (e) {
      if (e instanceof HttpException) throw e;
      this.logger.error(`Proxy download failed for ${url}: ${e.message}`);
      throw new HttpException(
        'Failed to download file from URL',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * Resolve a potentially-relative Tako URL to an absolute URL.
   * If the URL starts with '/', it is treated as a Tako API path
   * and prefixed with this.apiUrl.
   */
  private resolveUrl(url: string): string {
    if (url.startsWith('/')) {
      return `${this.apiUrl}${url}`;
    }
    // Only encode spaces in URLs (Transformerland returns unencoded filenames).
    // Do NOT use full encodeURIComponent — some CDNs (e.g. geekdo/BGG) reject
    // over-encoded path characters like %3D or %3A.
    return url.replace(/ /g, '%20');
  }

  private guessMimeType(url: string): string {
    const ext = url.split('?')[0].split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'application/pdf';
    if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
    if (ext === 'png') return 'image/png';
    if (ext === 'webp') return 'image/webp';
    if (ext === 'gif') return 'image/gif';
    return 'application/pdf';
  }

  // ──────────────────────────────────────────────
  // HTTP CLIENT
  // ──────────────────────────────────────────────

  private async httpGet(endpoint: string, retries = 0): Promise<any> {
    const url = `${this.apiUrl}${endpoint}`;
    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'SnowShelf/2.0',
        },
        signal: AbortSignal.timeout(this.timeout),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (e) {
      if (retries < this.maxRetries) {
        this.logger.debug(
          `Retry ${retries + 1}/${this.maxRetries} for ${endpoint}`,
        );
        await new Promise((r) => setTimeout(r, 1000 * (retries + 1)));
        return this.httpGet(endpoint, retries + 1);
      }
      throw e;
    }
  }

  // ──────────────────────────────────────────────
  // NORMALIZATION — Converts provider-specific formats to unified format
  // ──────────────────────────────────────────────

  private normalizeResults(
    raw: any,
    domain: string,
    provider: string,
  ): TakoSearchResult[] {
    // Tako_Api can return data in `data[]` or `results[]` depending on provider
    const items = raw.data || raw.results || [];
    if (!Array.isArray(items)) return [];

    return items
      .map((item: any) => this.normalizeOneItem(item, domain, provider))
      .filter(Boolean) as TakoSearchResult[];
  }

  private normalizeSingleResult(
    raw: any,
    domain: string,
    provider: string,
  ): TakoSearchResult | null {
    // v2.6.1 unified: { success, provider, domain, id, data: { ...item with details{}... }, meta: {...} }
    // Legacy: { data: { ... } } or { ... } directly
    // Some providers (TMDB) used to double-wrap: { data: { success, data: {...} } }
    let item = raw.data || raw;
    if (item && typeof item === 'object' && 'success' in item && item.data && typeof item.data === 'object' && !Array.isArray(item.data)) {
      item = item.data;
    }
    if (!item || typeof item !== 'object') return null;
    return this.normalizeOneItem(item, domain, provider);
  }

  private normalizeOneItem(
    item: any,
    domain: string,
    provider: string,
  ): TakoSearchResult | null {
    if (!item) return null;

    // ─── v2.6.1: Flatten item.details{} into top level for uniform field access ───
    // Unified format: common fields at root + domain-specific in details{}
    // Merge so existing field accesses work with both old and new format.
    // details{} fields override root for domain-specific keys (genres, cast, etc.)
    if (item.details && typeof item.details === 'object') {
      item = { ...item, ...item.details };
    }

    // Common fields extraction
    // Prefer sourceId/id first; fall back to slug (RAWG uses slug in detail URLs)
    // IMPORTANT: slug must NOT override sourceId — Playmobil returns slug="school-bus"
    // but detail endpoint requires numeric sourceId="70983"
    const sourceId = String(
      item.sourceId || item.id || item.set_num || item.slug || '',
    );
    const title =
      item.title || item.name || item.set_name || '';

    if (!sourceId || !title) return null;

    // Image URL — v2.6.1 unified: images.primary ; fallback to legacy provider-specific fields
    const rawImageUrl =
      item.images?.primary ||         // v2.6.1 unified
      item.src_image_url ||
      item.cover ||
      item.image_url ||
      item.poster ||
      item.imageUrl ||
      item.cover_url ||
      item.covers?.large ||
      item.covers?.medium ||
      item.thumbnail ||
      item.posterOriginal ||
      null;

    const rawThumbnailUrl =
      item.images?.thumbnail ||       // v2.6.1 unified
      item.coverThumb ||
      item.thumbnail_url ||
      item.thumbnailUrl ||
      item.covers?.small ||
      item.covers?.medium ||
      rawImageUrl;

    // Resolve relative Tako URLs (e.g. One Piece image proxy)
    const imageUrl = rawImageUrl ? this.resolveUrl(rawImageUrl) : null;
    const thumbnailUrl = rawThumbnailUrl ? this.resolveUrl(rawThumbnailUrl) : rawImageUrl;

    // Source URL — v2.6.1 unified: urls.source / urls.detail
    const sourceUrl =
      item.urls?.source ||            // v2.6.1 unified
      item.src_url ||
      item.sourceUrl ||
      item.url ||
      item.set_url ||
      null;

    // Year extraction
    const year = this.extractYear(item);

    // Barcode
    const barcode =
      item.isbn13 || item.isbn10 || item.isbn || item.barcode || item.ean || null;

    // Type
    const type =
      item.type || this.inferType(domain);

    // Build normalized metadata
    const metadata = this.extractMetadata(item, domain, provider);

    // ── Extract extra media (multi-images, videos, documents) ──
    const { extraImages, videos, documents } = this.extractMedia(item, domain, provider);

    return {
      sourceId,
      provider,  // Always use our SnowShelf key (e.g. 'amazon-media'), not Tako's raw provider name
      type,
      title,
      subtitle: item.subtitle || item.tagline || undefined,
      description:
        item.description ||
        item.synopsis ||
        item.overview ||
        item.summary ||
        undefined,
      year,
      imageUrl,
      thumbnailUrl,
      sourceUrl,
      barcode,
      metadata,
      extraImages: extraImages.length > 0 ? extraImages : undefined,
      videos: videos.length > 0 ? videos : undefined,
      documents: documents.length > 0 ? documents : undefined,
    };
  }

  /**
   * Extract extra media (multi-images, videos, documents) from Tako raw data.
   * Data structure varies per provider.
   */
  private extractMedia(
    item: any,
    domain: string,
    provider: string,
  ): {
    extraImages: { url: string; title?: string; mimeType?: string }[];
    videos: { url: string; title?: string; mimeType?: string }[];
    documents: { url: string; title?: string; mimeType?: string }[];
  } {
    const extraImages: { url: string; title?: string; mimeType?: string }[] = [];
    const videos: { url: string; title?: string; mimeType?: string }[] = [];
    const documents: { url: string; title?: string; mimeType?: string }[] = [];

    // ── IMAGES ──

    // images.gallery[] — may contain strings (LEGO) or objects {url, caption, isMain} (TCGdex, Lorcana…)
    if (item.images?.gallery && Array.isArray(item.images.gallery)) {
      for (const entry of item.images.gallery) {
        if (typeof entry === 'string') {
          extraImages.push({ url: entry });
        } else if (entry?.url) {
          extraImages.push({ url: entry.url, title: entry.caption || entry.title });
        }
      }
    }

    // TMDB-style: backdrop, backdropOriginal (additional poster-like images)
    if (item.backdrop && typeof item.backdrop === 'string') {
      extraImages.push({ url: item.backdrop, title: 'Backdrop' });
    }
    if (item.backdropOriginal && typeof item.backdropOriginal === 'string' && item.backdropOriginal !== item.backdrop) {
      extraImages.push({ url: item.backdropOriginal, title: 'Backdrop Original' });
    }

    // RAWG-style: backgroundAdditional (extra background image)
    if (item.backgroundAdditional && typeof item.backgroundAdditional === 'string') {
      extraImages.push({ url: item.backgroundAdditional, title: 'Background' });
    }

    // Generic: screenshots[] (array of URL strings or {url} objects)
    if (Array.isArray(item.screenshots)) {
      for (const s of item.screenshots) {
        const url = typeof s === 'string' ? s : s?.url || s?.image;
        if (url) extraImages.push({ url });
      }
    }
    // Generic: short_screenshots[] (RAWG lightweight)
    if (Array.isArray(item.short_screenshots)) {
      for (const s of item.short_screenshots) {
        const url = typeof s === 'string' ? s : s?.image || s?.url;
        if (url) extraImages.push({ url });
      }
    }
    // Generic: artworks[]
    if (Array.isArray(item.artworks)) {
      for (const a of item.artworks) {
        const url = typeof a === 'string' ? a : a?.url || a?.image;
        if (url) extraImages.push({ url, title: 'Artwork' });
      }
    }
    // Generic gallery[] at root level (some providers)
    if (Array.isArray(item.gallery)) {
      for (const g of item.gallery) {
        const url = typeof g === 'string' ? g : g?.url || g?.image;
        if (url) extraImages.push({ url });
      }
    }

    // ── VIDEOS ──

    // Videos — v2.6.1: item.videos comes from details{} after flatten
    // Also check item.details?.videos for legacy double-source (dedup handles overlap)
    const videoSources = [
      ...(Array.isArray(item.videos) ? item.videos : []),
      ...(Array.isArray(item.details?.videos) ? item.details.videos : []),
    ];
    if (videoSources.length > 0) {
      for (const v of videoSources) {
        if (typeof v === 'string') {
          videos.push({ url: v, mimeType: v.endsWith('.mp4') ? 'video/mp4' : undefined });
        } else if (v?.url) {
          videos.push({ url: v.url, title: v.name || v.title || v.type });
        } else if (v?.key) {
          // TMDB provides {key, site, type} → construct YouTube URL
          const site = (v.site || '').toLowerCase();
          if (site === 'youtube') {
            videos.push({
              url: `https://www.youtube.com/watch?v=${v.key}`,
              title: v.name || v.type,
            });
          } else if (site === 'vimeo') {
            videos.push({
              url: `https://vimeo.com/${v.key}`,
              title: v.name || v.type,
            });
          }
        }
      }
    }

    // RAWG-style: clip (single video clip)
    if (item.clip) {
      const clipUrl = typeof item.clip === 'string' ? item.clip : item.clip?.clip || item.clip?.video;
      if (clipUrl) {
        videos.push({ url: clipUrl, title: 'Clip' });
      }
    }

    // Generic: trailers[], movies[]
    for (const fieldName of ['trailers', 'movies']) {
      if (Array.isArray(item[fieldName])) {
        for (const v of item[fieldName]) {
          if (typeof v === 'string') {
            videos.push({ url: v });
          } else if (v?.url) {
            videos.push({ url: v.url, title: v.name || v.title });
          }
        }
      }
    }

    // ── DOCUMENTS (instructions / manuals / PDFs) ──

    // LEGO-style: instructions.manuals[] with pdfUrl
    // v2.0.1: flat at item.instructions.manuals[] (not in details)
    const instructionsObj = item.instructions || item.details?.instructions;
    if (instructionsObj?.manuals && Array.isArray(instructionsObj.manuals)) {
      for (const m of instructionsObj.manuals) {
        if (m?.pdfUrl) {
          documents.push({
            url: m.pdfUrl,
            title: m.description || `Manuel ${m.id || ''}`.trim(),
            mimeType: 'application/pdf',
          });
        }
      }
    }

    // Generic: instructions[] (Rebrickable-style)
    if (Array.isArray(item.instructions)) {
      for (const instr of item.instructions) {
        const url = typeof instr === 'string' ? instr : instr?.url || instr?.pdfUrl;
        if (url) {
          documents.push({
            url,
            title: typeof instr === 'object' ? (instr.description || instr.name || 'Instructions') : 'Instructions',
            mimeType: this.guessMimeType(url),
          });
        }
      }
    }

    // Transformerland-style: specs[] (array of URL strings or {url} objects)
    if (Array.isArray(item.specs)) {
      for (const spec of item.specs) {
        const url = typeof spec === 'string' ? spec : spec?.url;
        if (url) {
          documents.push({
            url,
            title: typeof spec === 'object' ? (spec.description || spec.name || 'Fiche technique') : 'Fiche technique',
            mimeType: this.guessMimeType(url),
          });
        }
      }
    }

    // BGG-style: files[] (array of {id, filename, description, url, language, size, ...})
    if (Array.isArray(item.files)) {
      for (const f of item.files) {
        if (f?.url) {
          documents.push({
            url: f.url,
            title: f.title || f.filename || f.description || 'Document',
            mimeType: f.mimeType || (f.filename ? this.guessMimeType(f.filename) : undefined),
          });
        }
      }
    }

    // Generic: documents[], manuals[]
    for (const fieldName of ['documents', 'manuals']) {
      if (Array.isArray(item[fieldName])) {
        for (const d of item[fieldName]) {
          const url = typeof d === 'string' ? d : d?.url || d?.pdfUrl || d?.fileUrl;
          if (url) {
            documents.push({
              url,
              title: typeof d === 'object' ? (d.description || d.name || d.title || fieldName) : fieldName,
            });
          }
        }
      }
    }

    // Deduplicate by URL
    const dedup = <T extends { url: string }>(arr: T[]): T[] => {
      const seen = new Set<string>();
      return arr.filter((item) => {
        if (seen.has(item.url)) return false;
        seen.add(item.url);
        return true;
      });
    };

    // Resolve relative Tako URLs (e.g. One Piece image proxy)
    const resolve = <T extends { url: string }>(arr: T[]): T[] =>
      arr.map((entry) => ({ ...entry, url: this.resolveUrl(entry.url) }));

    return {
      extraImages: resolve(dedup(extraImages)),
      videos: resolve(dedup(videos)),
      documents: resolve(dedup(documents)),
    };
  }

  private extractYear(item: any): number | undefined {
    if (item.year && typeof item.year === 'number') return item.year;
    if (item.releaseDate) {
      const y = parseInt(String(item.releaseDate).substring(0, 4), 10);
      if (!isNaN(y)) return y;
    }
    if (item.publishedDate) {
      const y = parseInt(String(item.publishedDate).substring(0, 4), 10);
      if (!isNaN(y)) return y;
    }
    if (item.release_date) {
      const y = parseInt(String(item.release_date).substring(0, 4), 10);
      if (!isNaN(y)) return y;
    }
    // TCGdex: year not at top-level, fallback to set.releaseDate
    if (item.set?.releaseDate) {
      const y = parseInt(String(item.set.releaseDate).substring(0, 4), 10);
      if (!isNaN(y)) return y;
    }
    return undefined;
  }

  private inferType(domain: string): string {
    const map: Record<string, string> = {
      'construction-toys': 'set',
      videogames: 'game',
      books: 'book',
      comics: 'comic',
      'anime-manga': 'anime',
      media: 'media',
      boardgames: 'boardgame',
      collectibles: 'collectible',
      tcg: 'card',
      music: 'album',
      ecommerce: 'product',
      'sticker-albums': 'sticker_album',
    };
    return map[domain] || 'item';
  }

  private extractMetadata(
    item: any,
    domain: string,
    provider: string,
  ): Record<string, any> {
    const meta: Record<string, any> = {
      _provider: provider,
      _domain: domain,
    };

    // Domain-specific metadata extraction
    switch (domain) {
      case 'books':
        if (item.authors) {
          // Normalize authors: Tako v2.0.1+ may return [{name, role}] objects
          meta.authors = Array.isArray(item.authors)
            ? item.authors.map((a: any) => (typeof a === 'string' ? a : a?.name || String(a)))
            : item.authors;
        }
        if (item.publisher) meta.publisher = item.publisher;
        if (item.pageCount) meta.pageCount = item.pageCount;
        if (item.language) meta.language = item.language;
        if (item.isbn13) meta.isbn13 = item.isbn13;
        if (item.isbn10) meta.isbn10 = item.isbn10;
        if (item.categories) meta.categories = item.categories;
        if (item.publishedDate) meta.publishedDate = item.publishedDate;
        if (item.series) meta.series = item.series;
        if (item.edition) meta.edition = item.edition;
        if (item.format) meta.format = item.format;
        if (item.genres) meta.genres = item.genres;
        break;

      case 'videogames':
        if (item.platforms) meta.platforms = item.platforms;
        if (item.genres) meta.genres = item.genres;
        if (item.tags) meta.tags = item.tags;
        if (item.metacritic) meta.metacritic = item.metacritic;
        if (item.esrbRating) meta.esrbRating = item.esrbRating;
        if (item.ageRatings) meta.ageRatings = item.ageRatings;       // v2.6.1 IGDB
        if (item.stores) meta.stores = item.stores;
        if (item.releaseDate) meta.releaseDate = item.releaseDate;
        if (item.release_date) meta.releaseDate = item.release_date;
        if (item.developers) meta.developers = item.developers;
        if (item.publishers) meta.publishers = item.publishers;
        if (item.rating) meta.rating = item.rating;
        if (item.aggregatedRating) meta.aggregatedRating = item.aggregatedRating; // v2.6.1 IGDB
        if (item.playtime) meta.playtime = item.playtime;
        if (item.multiplayer) meta.multiplayer = item.multiplayer;
        if (item.themes) meta.themes = item.themes;                   // v2.6.1 IGDB
        if (item.gameModes) meta.gameModes = item.gameModes;           // v2.6.1 IGDB
        break;

      case 'construction-toys':
        // v2.0.10 standardized fields across all 6 providers
        if (item.set_number) meta.set_number = item.set_number;
        if (item.setNumber) meta.set_number = meta.set_number || item.setNumber;
        if (item.set_num) meta.set_number = meta.set_number || item.set_num;
        if (item.productCode) meta.set_number = meta.set_number || item.productCode;
        if (item.pieces != null) meta.pieces = item.pieces;
        if (item.pieceCount != null) meta.pieces = meta.pieces ?? item.pieceCount;
        if (item.num_parts) meta.pieces = meta.pieces ?? item.num_parts;
        if (item.minifigs != null) meta.minifigs = item.minifigs;
        if (item.minifigCount != null) meta.minifigs = meta.minifigs ?? item.minifigCount;
        if (item.figureCount != null) meta.figureCount = item.figureCount;
        if (item.theme) meta.theme = item.theme;
        if (item.subtheme) meta.subtheme = item.subtheme;
        if (item.brand) meta.brand = item.brand;
        if (item.category) meta.category = item.category;
        if (item.format) meta.format = item.format;
        if (item.tags && Array.isArray(item.tags) && item.tags.length > 0) meta.tags = item.tags;
        // v2.0.10: ageRange is { min, max } — flatten to "X+" or "X-Y"
        if (item.ageRange) {
          const ar = item.ageRange;
          meta.ageRange = ar.max ? `${ar.min}-${ar.max}` : `${ar.min}+`;
        }
        // Price handling (not EAV — used for marketValue in frontend)
        if (item.price) {
          meta.price = typeof item.price === 'object' ? (item.price.amount ?? item.price.value) : item.price;
        }
        if (item.listPrice) {
          meta.listPrice = typeof item.listPrice === 'object' ? (item.listPrice.amount ?? item.listPrice.value) : item.listPrice;
        }
        if (item.availability) meta.availability = item.availability;
        if (item.dimensions) meta.dimensions = item.dimensions;
        if (item.weight) meta.weight = item.weight;
        if (item.releaseDate) meta.releaseDate = item.releaseDate;
        if (item.retirementDate) meta.retirementDate = item.retirementDate;
        if (item.barcodes) meta.barcodes = item.barcodes;
        if (item.ean) meta.ean = item.ean;
        if (item.discontinued != null) meta.discontinued = item.discontinued;
        break;

      case 'media':
        if (item.genres) meta.genres = item.genres;
        if (item.runtime) meta.runtime = item.runtime;
        // v2.6.1: rating: { average, voteCount } (was votes in v2.0.1)
        if (item.rating) {
          meta.voteAverage = typeof item.rating === 'object' ? item.rating.average : item.rating;
          if (typeof item.rating === 'object') {
            meta.voteCount = item.rating.voteCount || item.rating.votes;
          }
        } else if (item.vote_average) {
          meta.voteAverage = item.vote_average;
        }
        // v2.6.1: directors[] (array of { id, name, image }) — image was profile in v2.0.1
        if (item.directors) {
          meta.director = Array.isArray(item.directors)
            ? item.directors.map((d: any) => typeof d === 'object' ? d.name : d)
            : item.directors;
        } else if (item.director) {
          meta.director = item.director;
        }
        // Cast — full objects for rich display, names for mapping
        if (item.cast) meta.cast = item.cast;
        // Crew — full objects (writers, producers, etc.)
        if (item.crew) meta.crew = item.crew;
        // v2.0.1: original_language → originalLanguage
        if (item.originalLanguage) meta.originalLanguage = item.originalLanguage;
        else if (item.original_language) meta.originalLanguage = item.original_language;
        // Spoken languages
        if (item.spokenLanguages) meta.spokenLanguages = item.spokenLanguages;
        // v2.6.1: studios (renamed from productionCompanies / production_companies)
        if (item.studios) {
          meta.productionCompanies = Array.isArray(item.studios)
            ? item.studios.map((c: any) => typeof c === 'object' ? c.name : c)
            : item.studios;
        } else if (item.productionCompanies) {
          meta.productionCompanies = Array.isArray(item.productionCompanies)
            ? item.productionCompanies.map((c: any) => typeof c === 'object' ? c.name : c)
            : item.productionCompanies;
        } else if (item.production_companies) {
          meta.productionCompanies = item.production_companies;
        }
        // Production countries
        if (item.productionCountries) {
          meta.productionCountries = Array.isArray(item.productionCountries)
            ? item.productionCountries.map((c: any) => typeof c === 'object' ? c.name : c)
            : item.productionCountries;
        }
        if (item.status) meta.status = item.status;
        // Tagline & original title
        if (item.tagline) meta.tagline = item.tagline;
        if (item.originalTitle) meta.originalTitle = item.originalTitle;
        // Release date
        if (item.releaseDate) meta.releaseDate = item.releaseDate;
        // Popularity
        if (item.popularity) meta.popularity = item.popularity;
        // Collection (belongs to)
        if (item.collection) meta.collection = item.collection;
        // Keywords
        if (item.keywords && Array.isArray(item.keywords)) {
          meta.keywords = item.keywords.map((k: any) => typeof k === 'object' ? k.name : k);
        }
        // v2.6.1: contentRatings (renamed from certifications)
        const ratings = item.contentRatings || item.certifications;
        if (ratings && Array.isArray(ratings)) {
          meta.certifications = ratings;
          // Extract FR certification for convenience
          const frCert = ratings.find((c: any) => c.country === 'FR' || c.iso_3166_1 === 'FR');
          if (frCert) meta.certification = frCert.certification || frCert.rating;
        }
        // External IDs (imdb, etc.)
        if (item.externalIds) meta.externalIds = item.externalIds;
        // Recommendations & Similar
        if (item.recommendations) meta.recommendations = item.recommendations;
        if (item.similar) meta.similar = item.similar;
        // Videos (trailers, teasers)
        if (item.videos) meta.videos = item.videos;
        // v2.6.1: seasonCount (was numberOfSeasons / number_of_seasons)
        if (item.seasonCount) meta.seasons = item.seasonCount;
        else if (item.numberOfSeasons) meta.seasons = item.numberOfSeasons;
        else if (item.seasons) meta.seasons = item.seasons;
        else if (item.number_of_seasons) meta.seasons = item.number_of_seasons;
        // v2.6.1: episodeCount (was numberOfEpisodes / number_of_episodes)
        if (item.episodeCount) meta.episodes = item.episodeCount;
        else if (item.numberOfEpisodes) meta.episodes = item.numberOfEpisodes;
        else if (item.episodes) meta.episodes = item.episodes;
        else if (item.number_of_episodes) meta.episodes = item.number_of_episodes;
        // v2.0.1: networks (array of { id, name, logo, country })
        if (item.networks) {
          meta.networks = Array.isArray(item.networks)
            ? item.networks.map((n: any) => typeof n === 'object' ? n.name : n)
            : item.networks;
        }
        // v2.6.1: creators (was createdBy / created_by) — array of { id, name, image }
        if (item.creators) {
          meta.creator = Array.isArray(item.creators)
            ? item.creators.map((c: any) => typeof c === 'object' ? c.name : c)
            : item.creators;
        } else if (item.createdBy) {
          meta.creator = Array.isArray(item.createdBy)
            ? item.createdBy.map((c: any) => typeof c === 'object' ? c.name : c)
            : item.createdBy;
        } else if (item.created_by) {
          meta.creator = item.created_by;
        }
        // v2.0.1: media_type → mediaType
        if (item.mediaType) meta.mediaType = item.mediaType;
        else if (item.media_type) meta.mediaType = item.media_type;
        if (item.budget) meta.budget = item.budget;
        if (item.revenue) meta.revenue = item.revenue;
        break;

      case 'music':
        if (item.artist) meta.artist = item.artist;
        if (item.artists) meta.artists = item.artists;
        if (item.genre) meta.genre = item.genre;
        if (item.genres) meta.genres = item.genres;
        // v2.0.1: label → labels (array of { name, catalogNumber })
        if (item.labels) {
          meta.label = Array.isArray(item.labels)
            ? item.labels.map((l: any) => typeof l === 'object' ? l.name : l).join(', ')
            : item.labels;
        } else if (item.label) {
          meta.label = item.label;
        }
        // v2.0.1: format → formats (array of { name, qty, descriptions })
        if (item.formats) {
          meta.format = Array.isArray(item.formats)
            ? item.formats.map((f: any) => typeof f === 'object' ? f.name : f).join(', ')
            : item.formats;
        } else if (item.format) {
          meta.format = item.format;
        }
        // v2.0.1: tracklist → tracks (array of { position, title, duration, durationSeconds })
        if (item.tracks) meta.tracklist = item.tracks;
        else if (item.tracklist) meta.tracklist = item.tracklist;
        if (item.country) meta.country = item.country;
        if (item.styles) meta.styles = item.styles;
        if (item.duration) meta.duration = item.duration;
        // v2.0.1: nb_tracks/tracks_count → trackCount
        if (item.trackCount) meta.tracksCount = item.trackCount;
        else if (item.nb_tracks || item.tracks_count) meta.tracksCount = item.nb_tracks || item.tracks_count;
        if (item.releaseDate) meta.releaseDate = item.releaseDate;
        break;

      case 'comics': {
        if (item.publisher) meta.publisher = item.publisher;
        if (item.issueNumber) meta.issueNumber = item.issueNumber;
        if (item.volume) meta.volume = item.volume;
        if (item.series) meta.series = item.series;
        if (item.genres) meta.genres = item.genres;
        if (item.pageCount || item.page_count) meta.pageCount = item.pageCount || item.page_count;
        // Cover date / release date
        if (item.coverDate) meta.coverDate = item.coverDate;
        if (item.releaseDate) meta.releaseDate = item.releaseDate;
        // Format & origin (bedetheque)
        if (item.format) meta.format = item.format;
        if (item.origin) meta.origin = item.origin;
        if (item.language) meta.language = item.language;
        if (item.isbn) meta.isbn = item.isbn;
        // Serie / tome (bedetheque)
        if (item.serie) meta.serie = item.serie;
        if (item.tome) meta.tome = item.tome;
        // ComicVine: extract roles from creators[{id, name, role}]
        if (item.creators && Array.isArray(item.creators)) {
          const writers: string[] = [];
          const artists: string[] = [];
          const colorists: string[] = [];
          for (const c of item.creators) {
            const roles = (c.role || '').toLowerCase().split(',').map((r: string) => r.trim());
            if (roles.includes('writer')) writers.push(c.name);
            if (roles.some((r: string) => ['artist', 'penciller', 'penciler'].includes(r))) artists.push(c.name);
            if (roles.includes('colorist')) colorists.push(c.name);
          }
          if (writers.length) meta.authors = writers;
          if (artists.length) meta.artist = artists.join(', ');
          if (colorists.length) meta.colorist = colorists.join(', ');
        }
        // Bedetheque: extract roles from authors[{name, role}]
        if (item.authors && Array.isArray(item.authors)) {
          const writers: string[] = [];
          const artists: string[] = [];
          const colorists: string[] = [];
          for (const a of item.authors) {
            const role = (typeof a === 'string') ? '' : (a.role || '').toLowerCase();
            const name = typeof a === 'string' ? a : a?.name || String(a);
            if (role.includes('scénariste') || role.includes('writer')) writers.push(name);
            else if (role.includes('dessinateur') || role.includes('artist')) artists.push(name);
            else if (role.includes('coloriste') || role.includes('colorist')) colorists.push(name);
            else if (!role) writers.push(name); // fallback: no role = author
          }
          if (writers.length && !meta.authors) meta.authors = writers;
          if (artists.length && !meta.artist) meta.artist = artists.join(', ');
          if (colorists.length && !meta.colorist) meta.colorist = colorists.join(', ');
        }
        // ComicVine: volume name → serie
        if (!meta.serie && item.volume && typeof item.volume === 'object' && item.volume.name) {
          meta.serie = item.volume.name;
        }
        // Characters (comicvine)
        if (item.characters && Array.isArray(item.characters)) {
          meta.characters = item.characters.map((c: any) => typeof c === 'object' ? c.name : c).join(', ');
        }
        // Teams (comicvine)
        if (item.teams && Array.isArray(item.teams)) {
          meta.teams = item.teams.map((t: any) => typeof t === 'object' ? t.name : t).join(', ');
        }
        // Story arcs (comicvine)
        if (item.storyArcs && Array.isArray(item.storyArcs) && item.storyArcs.length > 0) {
          meta.storyArcs = item.storyArcs.map((a: any) => typeof a === 'object' ? a.name : a).join(', ');
        }
        break;
      }

      case 'anime-manga':
        if (item.episodes) meta.episodes = item.episodes;
        if (item.chapters || item.latestChapter) meta.chapters = item.chapters || item.latestChapter;
        if (item.volumes || item.totalVolumes) meta.volumes = item.volumes || item.totalVolumes;
        if (item.status) meta.status = item.status;
        if (item.genres) meta.genres = item.genres;
        if (item.themes) meta.themes = item.themes;
        if (item.studios) meta.studios = item.studios;
        if (item.score) meta.score = item.score;
        if (item.season) meta.season = item.season;
        if (item.aired) meta.aired = item.aired;
        if (item.published) meta.published = item.published;
        if (item.duration) meta.duration = item.duration;
        if (item.rating) meta.rating = item.rating;
        if (item.source) meta.source = item.source;
        if (item.format) meta.format = item.format;
        if (item.titleOriginal) meta.titleOriginal = item.titleOriginal;
        // nautiljon volumes: seriesTitleOriginal overrides titleOriginal (item-level is series original)
        if (item.seriesTitleOriginal) meta.titleOriginal = item.seriesTitleOriginal;
        // nautiljon volumes: volumeLabel/volumeNumber → issue number (Tome)
        if (item.volumeLabel) meta.issueNumber = item.volumeLabel;
        else if (item.volumeNumber) meta.issueNumber = item.volumeNumber;

        // authors: Jikan [{name,url}], mangaupdates [{name,type}], nautiljon [string]
        if (Array.isArray(item.authors)) {
          const getName = (a: any) => typeof a === 'string' ? a : a.name;
          const writers = item.authors.filter((a: any) => typeof a === 'object' && /author|writer/i.test(a.type || '')).map(getName);
          const artists = item.authors.filter((a: any) => typeof a === 'object' && /artist/i.test(a.type || '')).map(getName);
          if (writers.length) meta.writer = writers.join(', ');
          if (artists.length) meta.artist = artists.join(', ');
          // Fallback: no type info (Jikan, nautiljon) → use all as artist (mangaka)
          if (!meta.artist && !meta.writer) {
            meta.artist = item.authors.map(getName).join(', ');
          }
        }

        // publishers: mangaupdates has [{name,type}], nautiljon has {fr,jp}
        if (item.publishers) {
          if (Array.isArray(item.publishers)) {
            const original = item.publishers.find((p: any) => /original/i.test(p.type || ''));
            if (original) meta.publisher = original.name;
          } else if (typeof item.publishers === 'object') {
            // nautiljon: {fr: 'Kana', jp: 'Shueisha'}
            if (item.publishers.fr) meta.publisher = item.publishers.fr;
            if (item.publishers.jp) meta.publisherOriginal = item.publishers.jp;
          }
        }
        // serializations (Jikan: magazine)
        if (Array.isArray(item.serializations) && item.serializations.length > 0) {
          meta.serialization = item.serializations.map((s: any) => s.name).join(', ');
        }

        // serie: use seriesTitle for volume-level results (nautiljon), else title
        if (provider === 'mangaupdates' || provider.startsWith('jikan') || provider === 'nautiljon') {
          meta.serie = item.seriesTitle || item.title || item.name || '';
        }

        // origin (nautiljon: Japon, Corée du Sud, etc.)
        if (item.origin) meta.origin = item.origin;

        // demographics: Jikan has demographics[{id,name}], mangaupdates has it in genres
        const DEMO_MAP: Record<string, string> = {
          shounen: 'Shōnen', shonen: 'Shōnen', seinen: 'Seinen', shoujo: 'Shōjo', shojo: 'Shōjo', josei: 'Josei', kodomo: 'Kodomo',
        };
        if (Array.isArray(item.demographics) && item.demographics.length > 0) {
          const demoName = (item.demographics[0].name || '').toLowerCase();
          if (DEMO_MAP[demoName]) meta.demographic = DEMO_MAP[demoName];
        }
        // nautiljon: format IS the demographic (Shonen, Seinen, etc.)
        if (!meta.demographic && item.format && provider === 'nautiljon') {
          const fmt = item.format.toLowerCase();
          if (DEMO_MAP[fmt]) meta.demographic = DEMO_MAP[fmt];
        }
        // Fallback: extract demographic from genres
        if (!meta.demographic && Array.isArray(item.genres)) {
          const demoGenre = item.genres.find((g: any) => {
            const id = (typeof g.id === 'string' ? g.id : g.name || '').toLowerCase();
            return DEMO_MAP[id] !== undefined;
          });
          if (demoGenre) {
            const id = (typeof demoGenre.id === 'string' ? demoGenre.id : demoGenre.name || '').toLowerCase();
            meta.demographic = DEMO_MAP[id];
          }
        }
        break;

      case 'boardgames':
        // v2.0.1: minPlayers/maxPlayers → players: { min, max }
        if (item.players) {
          if (item.players.min) meta.minPlayers = item.players.min;
          if (item.players.max) meta.maxPlayers = item.players.max;
        } else {
          if (item.minPlayers || item.minplayers) meta.minPlayers = item.minPlayers || item.minplayers;
          if (item.maxPlayers || item.maxplayers) meta.maxPlayers = item.maxPlayers || item.maxplayers;
        }
        // v2.0.1: playingTime → playTime: { min, max, average }
        if (item.playTime) {
          meta.playingTime = item.playTime.average || item.playTime.min;
        } else if (item.playingTime || item.playingtime) {
          meta.playingTime = item.playingTime || item.playingtime;
        }
        // v2.0.1: weight → stats.complexity, average → stats.rating
        if (item.stats) {
          if (item.stats.complexity != null) meta.weight = item.stats.complexity;
          if (item.stats.rating != null) meta.average = item.stats.rating;
        } else {
          if (item.weight) meta.weight = item.weight;
          if (item.average) meta.average = item.average;
        }
        if (item.categories) meta.categories = item.categories;
        if (item.mechanics) meta.mechanics = item.mechanics;
        if (item.designers) meta.designers = item.designers;
        if (item.publishers) meta.publishers = item.publishers;
        if (item.minAge || item.minage) meta.minAge = item.minAge || item.minage;
        break;

      case 'tcg': {
        // ── Derive game name from provider ──
        const TCG_PROVIDER_GAME: Record<string, string> = {
          pokemon: 'Pokémon', mtg: 'Magic: The Gathering',
          yugioh: 'Yu-Gi-Oh!', lorcana: 'Lorcana',
          digimon: 'Digimon', onepiece: 'One Piece',
          dbs: 'Dragon Ball',
        };
        const gameName = TCG_PROVIDER_GAME[provider] || provider;
        meta.game = gameName;

        // ── Flatten set object {name, code, series, releaseDate} → strings ──
        if (item.set && typeof item.set === 'object') {
          if (item.set.name) meta.setName = item.set.name;
          if (item.set.code) meta.setCode = item.set.code;
          if (item.set.series) meta.setSeries = item.set.series;
          if (item.set.releaseDate) meta.releaseDate = item.set.releaseDate;
        } else if (typeof item.set === 'string') {
          meta.setName = item.set;
        }
        // Fallback: setName / set_name direct fields
        if (!meta.setName && (item.setName || item.set_name)) {
          meta.setName = item.setName || item.set_name;
        }

        // ── Common TCG fields ──
        if (item.rarity) meta.rarity = item.rarity;
        if (item.artist || item.illustrator) meta.artist = item.artist || item.illustrator;
        if (item.cardNumber || item.number) meta.cardNumber = item.cardNumber || item.number;
        if (item.flavorText) meta.flavorText = item.flavorText;
        if (item.hp) meta.hp = item.hp;
        if (item.types) meta.types = item.types;
        if (item.supertype) meta.supertype = item.supertype;
        if (item.subtypes) meta.subtypes = item.subtypes;
        if (item.attacks) meta.attacks = item.attacks;
        if (item.abilities && item.abilities.length) meta.abilities = item.abilities;
        if (item.evolvesFrom) meta.evolvesFrom = item.evolvesFrom;
        if (item.weaknesses) meta.weaknesses = item.weaknesses;
        if (item.resistances) meta.resistances = item.resistances;
        if (item.legalities) meta.legalities = item.legalities;
        if (item.prices) meta.prices = item.prices;
        // TCGdex-specific fields (Pokemon)
        if (item.stage) meta.stage = item.stage;
        if (item.retreatCost) meta.retreatCost = item.retreatCost;
        if (item.rules && item.rules.length) meta.rules = item.rules;
        if (item.regulationMark) meta.regulationMark = item.regulationMark;
        if (item.nationalPokedexNumbers && item.nationalPokedexNumbers.length) meta.nationalPokedexNumbers = item.nationalPokedexNumbers;
        if (item.collection) meta.collection = item.collection;
        // Lorcana-specific fields
        if (item.story || item.franchise) meta.story = item.story || item.franchise;
        if (item.foilTypes) meta.foilTypes = item.foilTypes;
        if (item.color) meta.color = item.color;
        if (item.cost != null) meta.cost = item.cost;
        if (item.inkwell != null) meta.inkwell = item.inkwell;
        if (item.strength != null) meta.strength = item.strength;
        if (item.willpower != null) meta.willpower = item.willpower;
        if (item.lore != null) meta.lore = item.lore;
        if (item.version) meta.version = item.version;
        if (item.fullName) meta.fullName = item.fullName;
        if (item.code) meta.code = item.code;
        // MTG-specific fields (Scryfall)
        if (item.manaCost || item.mana_cost) meta.manaCost = item.manaCost || item.mana_cost;
        if (item.cmc != null) meta.cmc = item.cmc;
        if (item.typeLine || item.type_line) meta.typeLine = item.typeLine || item.type_line;
        if (item.oracleText || item.oracle_text) meta.oracleText = item.oracleText || item.oracle_text;
        if (item.power) meta.power = item.power;
        if (item.toughness) meta.toughness = item.toughness;
        if (item.loyalty) meta.loyalty = item.loyalty;
        if (item.colors) meta.colors = item.colors;
        if (item.colorIdentity || item.color_identity) meta.colorIdentity = item.colorIdentity || item.color_identity;
        if (item.layout) meta.layout = item.layout;
        if (item.keywords && item.keywords.length) meta.keywords = item.keywords;
        if (item.foil != null) meta.foil = item.foil;
        if (item.promo != null) meta.promo = item.promo;
        if (item.reprint != null) meta.reprint = item.reprint;
        // Yu-Gi-Oh!-specific fields (YGOProDeck)
        if (item.cardType || item.frameType) meta.cardType = item.cardType || item.frameType;
        if (item.race) meta.race = item.race;
        if (item.archetype) meta.archetype = item.archetype;
        if (item.atk != null) meta.atk = item.atk;
        if (item.def != null) meta.def = item.def;
        if (item.level != null) meta.level = item.level;
        if (item.attribute) meta.attribute = item.attribute;
        if (item.linkval != null || item.linkValue != null) meta.linkval = item.linkval ?? item.linkValue;
        if (item.linkmarkers || item.linkMarkers) meta.linkmarkers = item.linkmarkers || item.linkMarkers;
        if (item.scale != null || item.pendulumScale != null) meta.scale = item.scale ?? item.pendulumScale;
        if (item.pendulumEffect || item.pend_desc) meta.pendulumEffect = item.pendulumEffect || item.pend_desc;
        // DBS-specific fields
        if (item.energyCost || item.energy) meta.energyCost = item.energyCost || item.energy;
        if (item.comboCost) meta.comboCost = item.comboCost;
        if (item.comboPower) meta.comboPower = item.comboPower;
        if (item.character) meta.character = item.character;
        if (item.specialTrait || item.traits) meta.specialTrait = item.specialTrait || item.traits;
        if (item.era || item.saga) meta.era = item.era || item.saga;
        if (item.skills) meta.skills = item.skills;
        if (item.skillDescription || item.skillText) meta.skillDescription = item.skillDescription || item.skillText;
        // One Piece-specific fields
        if (item.counter != null) meta.counter = item.counter;
        if (item.life != null) meta.life = item.life;
        if (item.effect) meta.effect = item.effect;
        if (item.trigger || item.triggerEffect) meta.trigger = item.trigger || item.triggerEffect;
        // Digimon-specific fields
        if (item.dp != null) meta.dp = item.dp;
        if (item.playCost != null || item.play_cost != null) meta.playCost = item.playCost ?? item.play_cost;
        if (item.evolutionCost != null) meta.evolutionCost = item.evolutionCost;
        if (item.digivolveCost1 != null || item.digivolutionCost1 != null) meta.digivolveCost1 = item.digivolveCost1 ?? item.digivolutionCost1;
        if (item.digivolveCost2 != null || item.digivolutionCost2 != null) meta.digivolveCost2 = item.digivolveCost2 ?? item.digivolutionCost2;
        if (item.evolutionColor) meta.evolutionColor = item.evolutionColor;
        if (item.evolutionLevel != null) meta.evolutionLevel = item.evolutionLevel;
        if (item.digiType || item.digi_type) meta.digiType = item.digiType || item.digi_type;
        if (item.mainEffect || item.main_effect) meta.mainEffect = item.mainEffect || item.main_effect;
        if (item.sourceEffect || item.inheritedEffect || item.inheritableEffect) meta.sourceEffect = item.sourceEffect || item.inheritedEffect || item.inheritableEffect;
        if (item.securityEffect || item.security_effect) meta.securityEffect = item.securityEffect || item.security_effect;
        if (item.color2) meta.color2 = item.color2;
        if (item.xrosRequirement) meta.xrosRequirement = item.xrosRequirement;
        if (item.tcgplayerId) meta.tcgplayerId = item.tcgplayerId;
        if (item.setName || item.set_name) meta.setName = item.setName || item.set_name;
        if (item.artist) meta.artist = item.artist;
        // Set extras (logo, symbol, total)
        if (item.setLogo) meta.setLogo = item.setLogo;
        if (item.setSymbol) meta.setSymbol = item.setSymbol;
        if (item.setTotal) meta.setTotal = item.setTotal;
        // External links (all TCG providers)
        if (item.externalLinks && typeof item.externalLinks === 'object') meta.externalLinks = item.externalLinks;
        break;
      }

      case 'collectibles':
        if (item.brand) meta.brand = item.brand;
        if (item.series) meta.series = item.series;
        if (item.material) meta.material = item.material;
        if (item.dimensions) meta.dimensions = item.dimensions;
        if (item.manufacturer) meta.manufacturer = item.manufacturer;
        if (item.condition) meta.condition = item.condition;
        if (item.scale) meta.scale = item.scale;
        if (item.character) meta.character = item.character;
        if (item.license) meta.license = item.license;
        if (item.collection) meta.collection = item.collection;
        if (item.originalSite) meta.originalSite = item.originalSite;
        // Coleka: collectionHierarchy → license (franchise from hierarchy[1])
        if (Array.isArray(item.collectionHierarchy) && item.collectionHierarchy.length > 1 && !meta.license) {
          meta.license = item.collectionHierarchy[1];
        }
        // Pricing → price (used for marketValue in frontend) + priceEstimate (display)
        if (item.pricing && item.pricing.price != null) {
          meta.price = item.pricing.price;
          meta.priceEstimate = `${item.pricing.price} ${item.pricing.currency || 'EUR'}`;
        } else if (item.price != null && typeof item.price === 'number') {
          meta.price = item.price;
          meta.priceEstimate = `${item.price} ${item.currency || 'EUR'}`;
        }
        // Carddass-specific fields
        if (item.cardNumber) meta.cardNumber = item.cardNumber;
        if (item.rarity) meta.rarity = item.rarity;
        if (item.rarityColor) meta.rarityColor = item.rarityColor;
        break;

      case 'ecommerce':
        if (item.brand) meta.brand = item.brand;
        if (item.price) meta.price = item.price;
        if (item.category) meta.category = item.category;
        if (item.condition) meta.condition = item.condition;
        break;

      case 'sticker-albums':
        if (item.editor) meta.editor = item.editor;
        if (item.copyright) meta.copyright = item.copyright;
        if (item.releaseDate) meta.releaseDate = item.releaseDate;
        // Categories → theme (multiselect)
        if (item.categories && Array.isArray(item.categories)) {
          meta.theme = item.categories;
        }
        // Checklist data
        if (item.checklist && typeof item.checklist === 'object') {
          if (item.checklist.total != null) meta.totalStickers = item.checklist.total;
          if (item.checklist.totalWithSpecials != null) meta.totalWithSpecials = item.checklist.totalWithSpecials;
          // Build the sticker checklist structure for the checklist field
          const checklist: any = {
            total: item.checklist.total || 0,
            items: item.checklist.items || [],
            specials: [],
            owned: [],
            ownedSpecials: {},
          };
          if (item.specialStickers && Array.isArray(item.specialStickers)) {
            checklist.specials = item.specialStickers.map((s: any) => ({
              name: s.name,
              total: s.total,
              items: s.list || s.items || [],
            }));
            // Initialize empty owned arrays for each special type
            for (const s of checklist.specials) {
              checklist.ownedSpecials[s.name] = [];
            }
          }
          meta.stickerChecklist = checklist;
        }
        break;
    }

    // ── Amazon-common fields (applies to all amazon-* providers across all domains) ──
    // Tako API nests Amazon-specific fields inside item.details {}
    if (provider.startsWith('amazon')) {
      const d = item.details && typeof item.details === 'object' ? item.details : item;
      // Price (used for marketValue in frontend)
      if (d.price != null && !meta.price) {
        meta.price = typeof d.price === 'object' ? (d.price.amount ?? d.price.value) : d.price;
      }
      if (d.priceFormatted && !meta.priceFormatted) meta.priceFormatted = d.priceFormatted;
      if (d.listPrice && !meta.listPrice) {
        meta.listPrice = typeof d.listPrice === 'object' ? (d.listPrice.amount ?? d.listPrice.value) : d.listPrice;
      }
      if (d.currency) meta.currency = d.currency;
      // Rating
      if (d.rating != null && !meta.rating && !meta.voteAverage) {
        meta.rating = typeof d.rating === 'object' ? d.rating.average : d.rating;
      }
      if (d.ratingMax) meta.ratingMax = d.ratingMax;
      if (d.reviewCount) meta.reviewCount = d.reviewCount;
      // Brand
      if (d.brand && !meta.brand) meta.brand = d.brand;
      // Amazon-specific identifiers
      if (d.asin) meta.asin = d.asin;
      if (d.isPrime != null) meta.isPrime = d.isPrime;
      if (d.marketplace) meta.marketplace = d.marketplace;
      if (d.marketplaceName) meta.marketplaceName = d.marketplaceName;
      if (d.availability) meta.availability = d.availability;
    }

    return meta;
  }

  private mimeToExt(mime: string): string {
    const map: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
      'image/svg+xml': 'svg',
      'video/mp4': 'mp4',
      'video/webm': 'webm',
      'video/quicktime': 'mov',
      'video/x-msvideo': 'avi',
      'audio/mpeg': 'mp3',
      'audio/ogg': 'ogg',
      'audio/wav': 'wav',
      'audio/flac': 'flac',
      'application/pdf': 'pdf',
      'application/msword': 'doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/vnd.ms-excel': 'xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
      'application/octet-stream': 'bin',
      'binary/octet-stream': 'bin',
    };
    if (map[mime]) return map[mime];
    // Fallback: try to extract from URL in the call context, otherwise use 'bin'
    return 'bin';
  }
}
