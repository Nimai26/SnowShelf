// ──────────────────────────────────────────────
// Tako API Types
// ──────────────────────────────────────────────

export type TakoDomainName =
  | 'construction-toys'
  | 'videogames'
  | 'books'
  | 'comics'
  | 'anime-manga'
  | 'media'
  | 'boardgames'
  | 'collectibles'
  | 'tcg'
  | 'music'
  | 'sticker-albums'
  | 'ecommerce';

export interface TakoProvider {
  name: string;
  description: string;
}

export interface TakoDomainInfo {
  name: TakoDomainName;
  displayName: string;
  description: string;
  providers: TakoProvider[];
}

/** Référence média normalisée renvoyée par Tako */
export interface TakoMediaRef {
  url: string;
  proxyUrl?: string;
  title?: string;
  mimeType?: string;
}

export interface TakoSearchResult {
  sourceId: string;
  provider: string;
  type: string;
  title: string;
  subtitle?: string;
  description?: string;
  year?: number;
  imageUrl?: string;
  thumbnailUrl?: string;
  sourceUrl?: string;
  barcode?: string;
  metadata: Record<string, any>;
  /** Images additionnelles (galerie, screenshots, backdrops) */
  extraImages?: TakoMediaRef[];
  /** Vidéos (trailers, clips, vidéos produit) */
  videos?: TakoMediaRef[];
  /** Documents (manuels PDF, notices) */
  documents?: TakoMediaRef[];
}

export interface TakoSearchParams {
  query: string;
  domain: TakoDomainName;
  providers?: string[];
  maxResults?: number;
  lang?: string;
}

export interface TakoSearchResponse {
  success: boolean;
  data: {
    query: string;
    domain: string;
    providers: string[];
    totalResults: number;
    results: TakoSearchResult[];
  };
}

export interface TakoDomainsResponse {
  success: boolean;
  data: {
    domains: TakoDomainInfo[];
  };
}

export interface TakoDetailResponse {
  success: boolean;
  data: TakoSearchResult | null;
}

export interface TakoProxyDownloadResponse {
  success: boolean;
  data: {
    tempPath: string;
    url: string;
    size: number;
    mimeType: string;
  };
}

export interface TakoHealthResponse {
  success: boolean;
  data: {
    status: string;
    version?: string;
    uptime?: number;
  };
}

export interface TakoProvidersForTypeResponse {
  success: boolean;
  data: {
    typeKey: string;
    domains: {
      name: string;
      providers: { name: string; description: string }[];
    }[];
  };
}

// ──────────────────────────────────────────────
// Barcode Lookup
// ──────────────────────────────────────────────

export interface TakoBarcodeLookupParams {
  barcode: string;
  domains?: TakoDomainName[];
}

export interface TakoBarcodeLookupResponse {
  success: boolean;
  data: {
    barcode: string;
    detectedType: string;
    totalResults: number;
    results: TakoSearchResult[];
  };
}

// Icônes par domaine pour l'UI
export const DOMAIN_ICONS: Record<TakoDomainName, string> = {
  'construction-toys': '🧱',
  videogames: '🎮',
  books: '📚',
  comics: '💬',
  'anime-manga': '🎌',
  media: '🎬',
  boardgames: '🎲',
  collectibles: '🏆',
  tcg: '🃏',
  music: '🎵',
  'sticker-albums': '🖼️',
  ecommerce: '🛒',
};
