import {
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsEnum,
  IsUrl,
  Min,
  Max,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// ──────────────────────────────────────────────
// SEARCH
// ──────────────────────────────────────────────

const VALID_DOMAINS = [
  'construction-toys',
  'videogames',
  'books',
  'comics',
  'anime-manga',
  'media',
  'boardgames',
  'collectibles',
  'tcg',
  'music',
  'ecommerce',
  'sticker-albums',
] as const;

export type TakoDomain = typeof VALID_DOMAINS[number];

export class TakoSearchDto {
  @ApiProperty({ example: 'Harry Potter', description: 'Terme de recherche' })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  query: string;

  @ApiProperty({
    enum: VALID_DOMAINS,
    example: 'books',
    description: 'Domaine de recherche',
  })
  @IsString()
  @IsEnum(VALID_DOMAINS)
  domain: TakoDomain;

  @ApiPropertyOptional({
    example: ['googlebooks', 'openlibrary'],
    description: 'Providers spécifiques (optionnel, recherche tous par défaut)',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  providers?: string[];

  @ApiPropertyOptional({ example: 20, description: 'Nombre max de résultats par provider' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  maxResults?: number;

  @ApiPropertyOptional({ example: 'fr', description: 'Langue des résultats' })
  @IsOptional()
  @IsString()
  @MaxLength(5)
  lang?: string;
}

// ──────────────────────────────────────────────
// PROXY DOWNLOAD
// ──────────────────────────────────────────────

export class ProxyDownloadDto {
  @ApiProperty({
    example: 'https://books.google.com/books/content?id=xxx&img=1',
    description: 'URL de l\'image à télécharger',
  })
  @IsString()
  @IsUrl()
  url: string;

  @ApiPropertyOptional({
    example: 'cover.jpg',
    description: 'Nom de fichier souhaité',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  filename?: string;
}

// ──────────────────────────────────────────────
// BARCODE LOOKUP
// ──────────────────────────────────────────────

export class TakoBarcodeLookupDto {
  @ApiProperty({
    example: '9782123456789',
    description: 'Code-barres, ISBN ou EAN à rechercher',
  })
  @IsString()
  @MinLength(4)
  @MaxLength(50)
  barcode: string;

  @ApiPropertyOptional({
    type: [String],
    enum: VALID_DOMAINS,
    example: ['books', 'comics'],
    description: 'Domaines de recherche autorisés (optionnel, auto-détecté si absent)',
  })
  @IsOptional()
  @IsArray()
  @IsEnum(VALID_DOMAINS, { each: true })
  domains?: TakoDomain[];
}

// ──────────────────────────────────────────────
// RESPONSE TYPES (non-validated, for documentation)
// ──────────────────────────────────────────────

/**
 * Référence média normalisée renvoyée par Tako.
 */
export interface TakoMediaRef {
  /** URL du fichier média */
  url: string;
  /** Titre / description */
  title?: string;
  /** Type MIME si connu */
  mimeType?: string;
}

/**
 * Résultat normalisé d'une recherche Tako_Api.
 * Les champs varient selon le domaine/provider.
 */
export interface TakoSearchResult {
  /** ID unique chez le provider (ex: "rawg-53205") */
  sourceId: string;
  /** Provider source (ex: "googlebooks", "rawg", "rebrickable") */
  provider: string;
  /** Type d'objet (ex: "book", "game", "set") */
  type: string;
  /** Titre principal */
  title: string;
  /** Sous-titre ou description courte */
  subtitle?: string;
  /** Description longue */
  description?: string;
  /** Année de publication/sortie */
  year?: number;
  /** URL de l'image de couverture */
  imageUrl?: string;
  /** URL de la vignette */
  thumbnailUrl?: string;
  /** URL source (lien vers le provider) */
  sourceUrl?: string;
  /** Code-barres (ISBN, EAN, UPC) */
  barcode?: string;
  /** Métadonnées additionnelles spécifiques au domaine */
  metadata: Record<string, any>;

  // ── Médias supplémentaires (galerie, vidéos, documents) ──

  /** Images additionnelles (galerie, screenshots, artworks, backdrops) */
  extraImages?: TakoMediaRef[];
  /** Vidéos (trailers, clips, vidéos produit) */
  videos?: TakoMediaRef[];
  /** Documents (manuels d'instructions PDF, notices, etc.) */
  documents?: TakoMediaRef[];
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

export interface TakoDomainInfo {
  name: string;
  displayName: string;
  description: string;
  providers: {
    name: string;
    description: string;
  }[];
}

export interface TakoDomainsResponse {
  success: boolean;
  data: {
    domains: TakoDomainInfo[];
  };
}
