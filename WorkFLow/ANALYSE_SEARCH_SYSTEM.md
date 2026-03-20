# Analyse approfondie du système de recherche web / import — SnowShelf (Back_up PHP)

> **Date d'analyse** : 24 février 2026  
> **Source** : `/Projets/SnowShelf/.Back_up/` (ancien projet PHP)  
> **Nouveau projet** : `/Projets/SnowShelf/backend/` (NestJS) + `/Projets/SnowShelf/frontend/` (React)

---

## 1. Architecture générale

### 1.1 Diagramme du flux

```
┌──────────────┐     ┌──────────────────┐     ┌──────────────────────┐     ┌────────────────────┐
│  Frontend JS │ ──► │ web-search.php   │ ──► │ Tako_Api (Node.js)   │ ──► │ APIs externes      │
│  (modal)     │     │ (proxy/router)   │     │ (microservice)       │     │ (RAWG, TMDB, etc.) │
└──────────────┘     └──────────────────┘     └──────────────────────┘     └────────────────────┘
       │                     │                         │
       │                     │ clés API (BDD)          │ retourne JSON normalisé
       │                     │ chiffrement AES-256-GCM │ (BASE_SEARCH_SCHEMA)
       ▼                     ▼                         │
┌──────────────┐     ┌──────────────────┐              │
│ Import Modal │     │ Admin_webApi     │              │
│ (sélection)  │     │ item_field_map   │              │
│              │     │ primary_type_*   │              │
└──────┬───────┘     └──────────────────┘              │
       │                                               │
       ▼                                               │
┌──────────────────────────────┐                       │
│ collection/import.js         │◄──────────────────────┘
│ - Appliquer les mappings BDD │
│ - Transformer les valeurs    │
│ - Importer images via proxy  │
│ - Pré-remplir le formulaire  │
└──────────────────────────────┘
```

### 1.2 Composants principaux

| Composant | Fichier(s) | Rôle |
|-----------|-----------|------|
| **API Backend (PHP)** | `public/api/web-search.php` (1360 lignes) | Proxy vers Tako_Api, gestion clés API, normalisation |
| **Frontend - Module principal** | `public/assets/js/web-search/index.js` | Point d'entrée du module ES6 |
| **Frontend - Providers** | `web-search/providers.js` | Gestion des fournisseurs par type |
| **Frontend - Search** | `web-search/search.js` | Logique de recherche textuelle |
| **Frontend - API calls** | `web-search/api.js` | Appels API (providers, search, details) |
| **Frontend - Import** | `web-search/import.js` (515 lignes) | Préparation des données pour import |
| **Frontend - Details** | `web-search/ui/details.js` (1585 lignes) | Modal de détails complets |
| **Frontend - Gallery** | `web-search/ui/gallery.js` | Gestion galerie d'images |
| **Frontend - Instructions** | `web-search/ui/instructions.js` | Manuels PDF |
| **Frontend - Import Collection** | `collection/import.js` (2212 lignes) | Import effectif, mappings BDD, téléchargement |
| **Backend - FieldTransformer** | `core/FieldTransformer.php` (419 lignes) | Transformations valeurs côté serveur |
| **Tako_Api (nouveau)** | `backend/src/modules/tako/tako.service.ts` (~950 lignes) | Microservice proxy vers APIs externes, DETAIL_SEGMENTS, autoTrad, normalisation |

---

## 2. Fournisseurs / Sources de données (Providers)

### 2.1 Table de configuration : `Admin_webApi`

Chaque provider est enregistré dans la table `Admin_webApi` avec :

| Colonne | Description |
|---------|-------------|
| `id` | ID unique |
| `name` | Nom technique (ex: `lego`, `rawg`, `tmdb`) |
| `Name_UF` | Nom d'affichage (ex: "LEGO officiel") |
| `alias` | Alias CSV pour sous-providers (ex: `deezer,musicbrainz` pour `music`) |
| `Type` | Catégorie webapi (ex: `toys`, `books`, `video_games`, `movies`, `music`) |
| `api_key` | Clé API admin |
| `client_id` | Client ID (Twitch/IGDB) |
| `USER_API` | `1` = clé utilisateur requise (premium) |
| `READ_CODE` | `1` = supporte scanning barcode |
| `has_details` | `1` = endpoint de détails disponible |
| `PREMIUM_ONLY` | `1` = réservé premium |
| `Defaut_active` | `1` = activé par défaut |
| `max_results_premium` / `max_results_free` | Limites de résultats |

### 2.2 Providers par domaine/catégorie

#### **Domaine `construction-toys` (Jouets de construction)**
| Provider | Description | Clé API requise | Détails | Barcode |
|----------|-------------|:-:|:-:|:-:|
| `lego` | Site officiel LEGO.com | Non | ✅ | ✅ |
| `rebrickable` | BDD communautaire LEGO | Oui (user) | ✅ | ❌ |
| `brickset` | BDD de sets LEGO | Non | ✅ | ❌ |
| `playmobil` | Site officiel Playmobil | Non | ✅ | ✅ |
| `klickypedia` | Encyclopédie Playmobil | Non | ✅ | ❌ |
| `mega` | Mega Construx / Mega Bloks | Non | ✅ | ❌ |

#### **Domaine `videogames` (Jeux Vidéo)**
| Provider | Description | Clé API requise | Détails | Barcode |
|----------|-------------|:-:|:-:|:-:|
| `igdb` | Internet Game Database (Twitch) | Oui (ClientID:Secret) | ✅ | ❌ |
| `rawg` | RAWG Video Games Database | Oui (user) | ✅ | ❌ |
| `jvc` | JeuxVideo.com (scraping) | Non | ✅ | ❌ |
| `consolevariations` | Console Variations DB | Non | ✅ | ❌ |

#### **Domaine `books` (Livres)**
| Provider | Description | Clé API requise | Détails | Barcode |
|----------|-------------|:-:|:-:|:-:|
| `googlebooks` | Google Books API | Non | ✅ | ✅ |
| `openlibrary` | Open Library (archive.org) | Non | ✅ | ✅ |

#### **Domaine `comics` (BD / Comics)**
| Provider | Description | Clé API requise | Détails | Barcode |
|----------|-------------|:-:|:-:|:-:|
| `comicvine` | Comic Vine Database | Non | ✅ | ❌ |
| `bedetheque` | BDGest / Bédéthèque (scraping) | Non | ✅ | ❌ |

#### **Domaine `anime-manga` (Anime / Manga)**
| Provider | Description | Clé API requise | Détails | Barcode |
|----------|-------------|:-:|:-:|:-:|
| `jikan` | Jikan (MyAnimeList API) | Non | ✅ | ❌ |
| `mangaupdates` | MangaUpdates Database | Non | ✅ | ❌ |

#### **Domaine `media` (Films / Séries)**
| Provider | Description | Clé API requise | Détails | Barcode |
|----------|-------------|:-:|:-:|:-:|
| `tmdb` | The Movie Database | Oui (user) | ✅ | ❌ |
| `tmdb_movies` | TMDB sous-variante Films | hérite `tmdb` | ✅ | ❌ |
| `tmdb_series` | TMDB sous-variante Séries | hérite `tmdb` | ✅ | ❌ |
| `tvdb` | TheTVDB | Oui (user) | ✅ | ❌ |
| `tvdb_movies` / `tvdb_series` | TVDB sous-variantes | hérite `tvdb` | ✅ | ❌ |
| `imdb` / `imdb_movies` / `imdb_series` | IMDb | Non | ✅ | ❌ |

#### **Domaine `boardgames` (Jeux de Société)**
| Provider | Description | Clé API requise | Détails | Barcode |
|----------|-------------|:-:|:-:|:-:|
| `boardgamegeek` | BoardGameGeek (BGG) | Non | ✅ | ❌ |

#### **Domaine `collectibles` (Objets de Collection / Stickers)**
| Provider | Description | Clé API requise | Détails | Barcode |
|----------|-------------|:-:|:-:|:-:|
| `coleka` | Coleka (scraping) | Non | ✅ | ❌ |
| `luluberlu` | Luluberlu (scraping) | Non | ✅ | ❌ |

#### **Domaine `tcg` (Cartes à Collectionner)**
| Provider | Description | Clé API requise | Détails | Barcode |
|----------|-------------|:-:|:-:|:-:|
| `pokemon-tcg` | Pokémon TCG API | Non | ✅ | ❌ |
| `mtg` | Magic: The Gathering (Scryfall) | Non | ✅ | ❌ |
| `yugioh` | Yu-Gi-Oh! API | Non | ✅ | ❌ |
| `lorcana` | Disney Lorcana | Non | ✅ | ❌ |
| `digimon` | Digimon Card Game | Non | ✅ | ❌ |
| `onepiece` | One Piece Card Game | Non | ✅ | ❌ |

#### **Domaine `music` (Musique)**
| Provider | Description | Clé API requise | Détails | Barcode |
|----------|-------------|:-:|:-:|:-:|
| `discogs` | Discogs Music Database | Non | ✅ | ❌ |
| `deezer` | Deezer API | Non | ✅ | ❌ |
| `musicbrainz` | MusicBrainz Database | Non | ✅ | ❌ |
| `itunes` | iTunes Search API | Non | ✅ | ❌ |

#### **Domaine `ecommerce` (E-commerce)**
| Provider | Description | Clé API requise | Détails | Barcode |
|----------|-------------|:-:|:-:|:-:|
| `amazon` | Amazon Product API (scraping) | Non | ✅ | ✅ |

#### **Autres providers spéciaux**
| Provider | Description |
|----------|-------------|
| `barcode` | Recherche par code-barres : `GET /barcode/{code}?lang=xx` |
| `snow_vg_db_plat` | Base locale de plateformes de jeux vidéo (table `Platform`) |

### 2.3 Héritage de clés API (providers enfants → parents)

```php
PROVIDER_PARENT_MAPPING = [
    'tmdb_movies'  => 'tmdb',
    'tmdb_series'  => 'tmdb',
    'tvdb_movies'  => 'tvdb',
    'tvdb_series'  => 'tvdb',
    'imdb_movies'  => 'imdb',
    'imdb_series'  => 'imdb',
];
```

Les providers enfants héritent automatiquement de la clé API de leur parent si aucune clé propre n'est configurée.

---

## 3. Types Primaires et mapping vers les categories webapi

### 3.1 Table `primary_type`

| ID | `name` | Nom FR | `webapi_type` |
|----|--------|--------|---------------|
| 1 | `books` | Livres | `books` |
| 2 | `video_games` | Jeux Vidéo | `video_games` |
| 3 | `music` | Musique | `music` |
| 4 | `movies` | Films | `movies` |
| 5 | `series` | Séries | `series` |
| 6 | `toys_fig` | Figurines | `toys` |
| 7 | `toys_construct` | Jouets Construction | `toys` |
| 8 | `divers` | Divers | (fallback) |
| 9 | `board_games` | Jeux de société | `board_games` |
| 10 | `trading_cards` | Cartes à collectionner | `tcg` |
| 11 | `sticker_albums` | Albums d'images | `sticker-albums` |

### 3.2 Mapping provider → primary type (depuis `primary_type_default_providers`)

La table `primary_type_default_providers` lie chaque `primary_type_id` à ses `webapi_id` par défaut avec un ordre de priorité (`sort_order`).

---

## 4. Champs récupérés par catégorie (Mappings de métadonnées)

### 4.1 Système de mapping hybride

Le système utilise **deux tables** de mapping (gérées dans l'admin) :

1. **`item_field_mappings`** → Champs fixes (identiques pour tous les providers)
2. **`primary_type_key_to_field`** → Métadonnées dynamiques spécifiques au type primaire

#### Champs fixes (`item_field_mappings`) — globaux tous providers

| Champ item | Chemins API (par ordre de priorité) | Transformation |
|------------|-------------------------------------|---------------|
| `name` | `title, name, display_name` | direct |
| `description` | `description, synopsis, overview, summary` | direct |
| `value` | `metadata.price, price` | `parseMonetaryValue()` |
| `code_barre` | `metadata.isbn, metadata.barcode, metadata.ean, barcode` | direct |
| `images` | `images, metadata.images, screenshots, artworks` | `normalizeImageUrls()` |
| `videos` | `videos, metadata.videos` | array |
| `audio` | `audio, metadata.audio` | array |
| `documents` | `documents, metadata.documents, instructions` | array |

### 4.2 Métadonnées par type — `primary_type_key_to_field`

---

#### **TYPE 1 : Livres (`books`)**

| Champ (`field_key`) | Sources API (`api_keys`) | Transformation |
|---------------------|--------------------------|----------------|
| `author` | `metadata.authors`, `authors` | `array_join` (", ") |
| `isbn` | `metadata.isbn`, `metadata.isbn_13`, `metadata.isbn_10`, `isbn` | `none` |
| `publisher` | `metadata.publisher`, `metadata.editors`, `editors` | `first_value` |
| `year` | `metadata.year`, `metadata.releaseDate`, `releaseDate` | `year_extract` |
| `pages` | `metadata.pages`, `pages` | `none` |
| `language` | `metadata.language`, `language` | `none` |
| `genre` | `metadata.genre`, `metadata.genres`, `genres` | `array_join` (", ") |
| `collection` | `metadata.serie`, `metadata.series`, `serie` | `none` |
| `volume` | `metadata.tome`, `metadata.volume`, `tome` | `none` |

**Providers** : Google Books, Open Library

---

#### **TYPE 2 : Jeux Vidéo (`video_games`)**

| Champ (`field_key`) | Sources API (`api_keys`) | Transformation |
|---------------------|--------------------------|----------------|
| `platform` | `metadata.platforms`, `metadata.platform` | `array_join` (", ") |
| `developer` | `metadata.developers`, `metadata.developer` | `array_join` (", ") |
| `publisher` | `metadata.publishers`, `metadata.publisher` | `array_join` (", ") |
| `year` | `metadata.year`, `metadata.release_date` | `year_extract` |
| `genre` | `metadata.genres`, `metadata.genre` | `array_join` (", ") |
| `pegi` | `metadata.pegi`, `metadata.esrb_rating`, `metadata.age_ratings` | `pegi_normalize` |
| `multiplayer` | `metadata.multiplayer`, `metadata.isMultiplayer` | `boolean_fr` (→ Oui/Non) |

**Providers** : RAWG, IGDB, JVC, ConsoleVariations  
**Enrichissement spécial IGDB** : format clé `clientId:clientSecret` dans `X-Api-Key`

---

#### **TYPE 3 : Musique (`music`)**

| Champ (`field_key`) | Sources API (`api_keys`) | Transformation |
|---------------------|--------------------------|----------------|
| `artist` | `metadata.artist`, `metadata.artists` | `array_join` (", ") |
| `album` | `metadata.album` | `none` |
| `year` | `metadata.year`, `metadata.release_date` | `year_extract` |
| `genre` | `metadata.genres`, `metadata.genre` | `array_join` (", ") |
| `tracks` | `metadata.track_count`, `metadata.tracks` | `none` |
| `label` | `metadata.label`, `metadata.publisher` | `none` |
| `tracklist` | (type `tracklist`) | Tableau d'objets `[{title, duration_seconds}]` préservé |

**Providers** : Discogs, Deezer, MusicBrainz, iTunes

---

#### **TYPE 4 : Films (`movies`)**

| Champ (`field_key`) | Sources API (`api_keys`) | Transformation |
|---------------------|--------------------------|----------------|
| `director` | `metadata.director`, `metadata.directors` | `array_join` (", ") |
| `actors` | `metadata.stars`, `metadata.actors`, `metadata.cast` | `array_join` (", ") |
| `year` | `metadata.year`, `metadata.release_date` | `year_extract` |
| `genre` | `metadata.genres`, `metadata.genre` | `array_join` (", ") |
| `duration` | `metadata.runtime`, `metadata.duration` | `duration_format` (min) |
| `language` | `metadata.original_language`, `metadata.language` | `none` |
| `studio` | `metadata.production_companies`, `metadata.studio` | `first_value` |

**Providers** : TMDB (tmdb_movies), TVDB (tvdb_movies), IMDb (imdb_movies)

---

#### **TYPE 5 : Séries (`series`)**

| Champ (`field_key`) | Sources API (`api_keys`) | Transformation |
|---------------------|--------------------------|----------------|
| `creator` | `metadata.director`, `metadata.created_by`, `metadata.directors` | `array_join` (", ") |
| `actors` | `metadata.stars`, `metadata.actors`, `metadata.cast` | `array_join` (", ") |
| `year_start` | `metadata.year`, `metadata.first_air_date` | `year_extract` |
| `year_end` | `metadata.end_year` | `year_extract` |
| `genre` | `metadata.genres`, `metadata.genre` | `array_join` (", ") |
| `season` | `metadata.total_seasons`, `metadata.seasons`, `metadata.number_of_seasons` | `first_value` |
| `episodes` | `metadata.total_episodes`, `metadata.episodes`, `metadata.number_of_episodes` | `first_value` |
| `network` | `metadata.networks`, `metadata.network` | `first_value` |
| `status` | `metadata.status` | `status_mapping` (→ Terminée/En cours/Annulée) |

**Providers** : TMDB (tmdb_series), TVDB (tvdb_series), IMDb (imdb_series)

**Configuration status_mapping** :
```json
{
  "ended": "Terminée",
  "canceled": "Annulée",
  "cancelled": "Annulée",
  "continuing": "En cours",
  "running": "En cours",
  "returning series": "En cours",
  "in production": "En cours",
  "planned": "En cours",
  "pilot": "En cours"
}
```

---

#### **TYPE 7 : Jouets Construction (`toys_construct`)**

> **Tako v2.0.1** : Les noms de champs sont désormais standardisés (camelCase). Les anciens noms (`set_num`, `num_parts`) restent supportés en fallback.

| Champ (`field_key`) | Sources API (`api_keys`) — v2.0.1 en **gras** | Transformation |
|---------------------|------------------------------------------------|----------------|
| `brand` | `metadata.brand` | `none` |
| `set_number` | **`metadata.setNumber`**, `metadata.set_number`, `metadata.sku`, `metadata.setNum` | `none` |
| `pieces` | **`metadata.pieceCount`**, `metadata.pieces`, `metadata.num_parts` | `none` |
| `theme` | `metadata.theme`, `metadata.subtheme`, `metadata.franchise` | `none` |
| `year` | `metadata.year`, `metadata.releaseDate` | `year_extract` |
| `minifigs` | **`metadata.minifigCount`**, `metadata.minifigs`, `metadata.minifigures` | `none` |

**Prix** : Le prix (`metadata.price`) est extrait séparément et pré-remplit le champ `Valeur marchande` de l'item (pas un champ EAV). Tako v2.0.1 renvoie un objet `{ amount, currency, display }` normalisé en nombre.

**Providers** : LEGO, Rebrickable, Brickset, Playmobil, Klickypedia, Mega  
**Spécialité** : Manuels d'instructions (PDF) disponibles pour LEGO, Playmobil, Mega — extraits depuis `item.instructions.manuals[]` (v2.0.1)

---

#### **TYPE 6 : Figurines (`toys_fig`)**

Même catégorie webapi `toys` que `toys_construct`, mais avec des champs orientés figurines :
- `brand`, `reference`/`sku`, `theme`/`franchise`, `year`, `age_range`

**Providers** : Coleka, Luluberlu, Amazon (scraping)

---

#### **TYPE 9 : Jeux de Société (`board_games`)**

Métadonnées extraites par Tako_Api :
| Champ | Sources |
|-------|---------|
| `minPlayers` | `item.minPlayers` |
| `maxPlayers` | `item.maxPlayers` |
| `playingTime` | `item.playingTime` |
| `weight` | `item.weight` (complexité BGG) |
| `categories` | `item.categories` |
| `mechanics` | `item.mechanics` |

**Provider** : BoardGameGeek

---

#### **TYPE 10 : Cartes à Collectionner (`trading_cards`)**

Métadonnées extraites par Tako_Api :
| Champ | Sources |
|-------|---------|
| `rarity` | `item.rarity` |
| `set` / `setName` | `item.set`, `item.setName` |
| `artist` | `item.artist` |
| `types` | `item.types` |
| `hp` | `item.hp` |
| `attacks` | `item.attacks` |

**Providers** : Pokémon TCG, MTG (Scryfall), Yu-Gi-Oh!, Lorcana, Digimon, One Piece

---

#### **TYPE 11 : Albums d'images / Stickers (`sticker_albums`)**

Champs spéciaux gérés via `formatFieldValue()` :
| Champ | Format spécial |
|-------|---------------|
| `checklist` | Objet `{range, total, totalWithSpecials, items}` — parsing de "1 à 128 et H1 à H6" |
| `special_stickers` | Tableau `[{type, type_original, total, items}]` |

**Providers** : Paninimania (via domaine Tako `sticker-albums`)

---

## 5. Format normalisé de recherche (BASE_SEARCH_SCHEMA)

### 5.1 Format Tako v2.0.1 (standardisé)

Depuis Tako v2.0.1, **tous les providers** retournent un format enveloppé :

```typescript
// Réponse brute Tako v2.0.1
interface TakoResponse {
  success: boolean;
  provider: string;    // 'lego', 'rawg', 'tmdb', etc.
  domain: string;      // 'construction-toys', 'videogames', 'media', etc.
  id: string;          // ID original du provider
  data: TakoItemData;  // Données normalisées de l'item
  meta?: object;       // Métadonnées supplémentaires
}
```

**⚠️ TMDB** : Le format est double-wrappé (`data.data` contient l'item réel). Le `normalizeSingleResult()` gère ce cas automatiquement.

Champs plats dans `data` (construction-toys LEGO v2.0.1) :
- `id`, `sourceId`, `source`, `type`, `title`, `titleOriginal`, `description`
- `images: { primary, thumbnail, gallery[] }`
- `urls: { source, detail }`
- `brand`, `theme`, `subtheme`, `setNumber`, `pieceCount`, `minifigCount`
- `price: { amount, value, currency, display }`
- `ageRange: { min, max }`, `releaseDate`, `retirementDate`
- `videos[]`, `instructions: { manuals[] }`, `barcodes`, `sku`

> **Note** : En recherche LEGO, `pieceCount`, `minifigCount` et `price` sont `null`. Ces valeurs ne sont disponibles que via l'endpoint de détail.

### 5.2 Format normalisé SnowShelf (TakoSearchResult)

Notre `normalizeSingleResult()` / `normalizeOneItem()` transforme la réponse Tako en :

```typescript
interface TakoSearchResult {
  type: string;           // 'construct_toy', 'book', 'movie', 'game', 'card', etc.
  source: string;         // 'lego', 'rawg', 'tmdb', 'discogs', etc.
  sourceId: string;       // ID ou slug original du provider
  title: string;          // Nom affiché (traduit si dispo via autoTrad)
  titleOriginal?: string; // Nom original si différent
  imageUrl: string;       // URL image principale (item.images?.primary ou fallback)
  thumbnailUrl: string;   // URL thumbnail (item.images?.thumbnail ou fallback)
  description?: string;
  year?: number;
  sourceUrl?: string;     // Lien source (item.urls?.source ou fallback)
  metadata: Record<string, any>; // Métadonnées extraites par extractMetadata()
  extraImages?: TakoMediaRef[];  // Images additionnelles (gallery)
  videos?: TakoMediaRef[];       // Vidéos (YouTube, MP4)
  documents?: TakoMediaRef[];    // Documents (instructions PDF)
}
```

---

## 6. Endpoints de détails par provider

| Provider | Endpoint Tako_Api | Exemple |
|----------|-------------------|---------|
| `lego` | `/lego/product/{id}` | `/lego/product/42217` |
| `mega` | `/mega/product/{id}` | `/mega/product/GJD25` |
| `rebrickable` | `/rebrickable/set/{id}` | `/rebrickable/set/40658-1` |
| `playmobil` | `/playmobil/product/{id}` | `/playmobil/product/70544` |
| `googlebooks` | `/googlebooks/book/{id}` | `/googlebooks/book/abc123` |
| `openlibrary` | `/openlibrary/book/{id}` | `/openlibrary/book/OL123W` |
| `rawg` | `/rawg/game/{slug}` | `/rawg/game/the-witcher-3` |
| `igdb` | `/igdb/game/{id}` | `/igdb/game/1942` |
| `tmdb` (films) | `/tmdb/movie/{id}` | `/tmdb/movie/550` |
| `tmdb` (séries) | `/tmdb/tv/{id}` | `/tmdb/tv/1396` |
| `tvdb` | `/tvdb/series/{id}` | `/tvdb/series/73255` |
| `imdb` | `/imdb/title/{id}` | `/imdb/title/tt0944947` |
| `discogs`/`deezer`/etc. | `/music/album/{id}` | `/music/album/12345` |
| `barcode` | `/barcode/{code}` | `/barcode/9780141036144` |

---

## 7. Système de transformations

### 7.1 Types de transformations disponibles

| Type | Description | Config attendue |
|------|-------------|----------------|
| `none` / `direct` | Pas de transformation | — |
| `array_join` | Joindre tableau → string | `{"separator": ", "}` |
| `first_value` | Premier élément d'un tableau (extrait `.name` si objet) | — |
| `year_extract` | Extraire l'année (int) d'une date ou string | — |
| `boolean_fr` | `true/false` → `"Oui"/"Non"` | — |
| `pegi_normalize` | Normaliser classifications d'âge → `"PEGI 3/7/12/16/18"` | — |
| `status_mapping` | Mapping clé→valeur (ex: anglais→français) | `{clé: traduction}` |
| `duration_format` | Formater durée (minutes ou heures) | `{"unit":"minutes","suffix":" min"}` |
| `find_by_key` | Trouver dans tableau par condition | `{"match_key":"country","match_value":"FR","return_key":"rating"}` |
| `date` | Convertir en ISO `YYYY-MM-DD` | — |
| `template` | Appliquer un template `"{key1} - {key2}"` | `{"template":"..."}` |
| `array_json` | Garder tableau d'objets en JSON (tracklist) | — |

### 7.2 Table `field_transform_types`

Stocke les types de transformation avec traductions FR/EN et schéma de config JSON.

---

## 8. Flux d'import détaillé

### 8.1 Étapes du flux utilisateur

```
1. L'utilisateur clique "Recherche Web" depuis un item de sa collection
2. Le WebSearchModal s'ouvre avec :
   - Champ de recherche textuel (pré-rempli avec le nom de l'item)
   - Filtre de type (toys, books, video_games, movies, music, etc.)
   - Liste des providers activés pour ce type (checkboxes)
3. L'utilisateur lance la recherche → appel POST web-search.php?action=search
4. Le PHP route vers Tako_Api: GET /{provider}/search?q=...&max=...&lang=...
5. Les résultats normalisés s'affichent en carte avec nom + image + année
6. L'utilisateur clique un résultat → Modal de détails
7. Auto-chargement des détails complets via GET ?action=details&provider=...&product_id=...
8. Le modal affiche :
   - Image principale + galerie d'images (sélection multiple)
   - Nom, description, valeur marchande, code-barres (checkboxes)
   - Section Médias : images (compteur), vidéos, audio
   - Section Manuels/Instructions : PDFs sélectionnables
   - Section Métadonnées du type : champs dynamiques avec valeurs pré-remplies
9. L'utilisateur coche/décoche les champs à importer
10. Clic "Importer" :
    a. Charger les field_mappings et metadata_mappings depuis la BDD
    b. Appliquer les transformations (applyTransform)
    c. Préparer l'objet enrichedResult
    d. Télécharger les images via proxy (downloadViaProxy → PHP → URL externe)
    e. Télécharger les PDF d'instructions via proxy
    f. Fermer les modals, pré-remplir le formulaire d'item
    g. Toast de confirmation
```

### 8.2 Structure de données importées

```javascript
{
    raw: { /* résultat original complet */ },
    primaryTypeId: 7,
    primaryTypeName: 'toys_construct',
    fieldsToImport: {
        name: "Millennium Falcon",
        description: "Star Wars UCS...",
        value: 799.99,
        code_barre: "5702017584898",
        image_url: "https://...",
        images: ["https://img1.jpg", "https://img2.jpg"],
        metadata: {
            brand: "LEGO",
            set_number: "75192",
            pieces: 7541,
            theme: "Star Wars",
            year: 2024,
            age_range: "18+",
            minifigs: 4
        }
    },
    importImage: true,
    importImages: ["https://img1.jpg", "https://img2.jpg"],
    importVideos: [],
    importAudio: [],
    importDocuments: [],
    importInstructions: ["https://lego.com/instructions/75192-1.pdf"]
}
```

### 8.3 Gestion des conflits d'import

Le système détecte les conflits quand un champ a déjà une valeur (`detectImportConflicts`) :
- **Champs texte** : nom, description, code-barres, métadonnées → choix remplacer/ignorer
- **Médias** : images, vidéos, audio, documents → choix ajouter/remplacer
- Les `textarea` supportent l'option "concaténer"

---

## 9. Gestion des images

### 9.1 Déduplication intelligente

Le système déduplique les images par URL normalisée :

| Pattern | Exemple | Clé de comparaison |
|---------|---------|-------------------|
| Amazon | `/images/I/{ID}._{SIZE}.jpg` | `amazon:{ID}` |
| TMDB | `/t/p/w500/{file}.jpg` | `tmdb:{file}` |
| IGDB | `/t_cover_big/{id}.jpg` | `igdb:{id}` |
| Lulu-Berlu | `-image-{ID}-{taille}.jpg` | `luluberlu:{base}:{ID}` |
| Dimension | `image_250x250.webp` vs `image.webp` | `imgbase:{base}` |
| Texte | `image-small.jpg` vs `image-large.jpg` | `generic:{base}` |

Pour chaque groupe de doublons, la **meilleure résolution** est conservée.

### 9.2 Extraction de taille d'image

Le système extrait la taille depuis l'URL pour choisir la meilleure version :
- Amazon: `_SL1500_` → 1500px
- TMDB: `/w780/` → 780px, `/original/` → 10000px
- IGDB: `t_1080p` → 1080px, `t_cover_big` → 264px
- Fichier: `_250x250` → 250px
- Texte: `_large` → 600px, `_original` → 2000px

### 9.3 Téléchargement proxy

Chaîne de fallback pour le téléchargement :
1. **Proxy PHP** (`/api/proxy-download.php`) — mode base64 ou streaming (> 50 Mo)
2. **wsrv.nl** — pour les domaines qui bloquent le proxy serveur
3. **Téléchargement direct** — si CORS le permet

---

## 10. Tako API (microservice externe)

### 10.1 Rôle

**Tako_Api** (anciennement `toys_api`) est un microservice Node.js/Express séparé qui :
- Centralise les appels aux APIs externes
- Normalise les réponses vers `BASE_SEARCH_SCHEMA`
- Gère le cache local
- Gère le scraping (JVC, Coleka, Luluberlu, Bédéthèque, Amazon)
- Gère l'authentification Twitch/IGDB (OAuth2)
- Supporte la localisation (`lang=fr`)
- Supporte l'auto-traduction premium (`autoTrad=1`)

### 10.2 Intégration dans le nouveau backend NestJS ✅ COMPLÈTE

Le module `TakoService` (NestJS, ~1270 lignes) :
- Se connecte à `TAKO_API_URL` (défaut `http://snowshelf_tako_api:3000`)
- Health check périodique (5 min)
- Cache avec `cache-manager` (Redis, TTL configurable)
- Normalisation des résultats vers `TakoSearchResult`
- Proxy download d'images, vidéos et documents
- Retry avec backoff exponentiel (max 3 retries)
- **`DETAIL_SEGMENTS`** : mapping 12 domaines × ~30 providers → segment URL de détail (v2.0.1 : books sans segment, music pluralisés, providers renommés)
- **`DOMAIN_ROUTES`** : mapping domaine → préfixe URL (tous sous `/api/{domain}` — construction-toys uniformisé en v2.0.1)
- **`DOMAIN_PROVIDERS`** : providers v2.0.1 renommés (`boardgamegeek` → `bgg`, `pokemon-tcg` → `pokemon`)
- **`autoTrad=true&lang=fr`** : ajouté automatiquement sur recherche ET détail (sauf JVC, déjà FR)
- **`normalizeSingleResult()`** : gère le double-wrapping TMDB v2.0.1 (`data.data` → unwrap automatique)
- **Slug-first `sourceId`** : priorité au slug sur l'ID numérique pour RAWG et autres providers à slug
- **`DOMAIN_TO_PRIMARY_TYPE`** : mapping automatique domaine Tako → PrimaryType (11 mappings)
- **`TAKO_FIELD_MAPPING`** : mapping métadonnées Tako → fieldKey EAV pour tous les 11 types (v2.0.1)
- **`extractMetadata()`** : extraction spécialisée par domaine (50+ champs) avec support v2.0.1 :
  - **media (TMDB)** : `rating.average` → `voteAverage`, `directors[]` → `director`, `originalLanguage`, `productionCompanies[]`, `numberOfSeasons/Episodes`, `createdBy[]`, `mediaType`
  - **music (Discogs)** : `tracks` → `tracklist`, `labels[]` → `label`, `formats[]` → `format`, `trackCount` → `tracksCount`
  - **boardgames (BGG)** : `players.{min,max}`, `playTime.average`, `stats.{complexity,rating}`
  - **construction-toys** : `setNumber`, `pieceCount`, `minifigCount`, prix objet→nombre
- **`extractMedia()`** : extraction multi-média (images gallery, vidéos YouTube/MP4, instructions PDF) depuis format plat v2.0.1
- **Segment TMDB dynamique** : `getDetail()` accepte un param `type` optionnel pour choisir `movies` ou `series` selon le type du résultat de recherche

### 10.3 Routes Tako_Api par domaine

```typescript
DOMAIN_ROUTES = {
  'construction-toys': '/api/construction-toys',  // v2.0.1 fix: uniformisé avec /api/
  'videogames':        '/api/videogames',
  'books':             '/api/books',
  'comics':            '/api/comics',
  'anime-manga':       '/api/anime-manga',
  'media':             '/api/media',
  'boardgames':        '/api/boardgames',
  'collectibles':      '/api/collectibles',
  'sticker-albums':    '/api/sticker-albums',
  'tcg':               '/api/tcg',
  'music':             '/api/music',
  'ecommerce':         '/api/ecommerce',
};
```

### 10.4 Sécurité des clés API

- Les clés API sont chiffrées avec **AES-256-GCM** avant transmission
- Format: `base64(IV_12bytes + AuthTag_16bytes + Ciphertext)`
- Clé de chiffrement dérivée avec SHA-256 de `API_ENCRYPTION_KEY`
- Headers: `X-Encrypted-Key` / `X-Encrypted-Client-Id`
- IGDB utilise le format combiné `clientId:clientSecret`

---

## 11. Base de données locale de plateformes

### 11.1 Ancien système (v1 PHP)

Le système v1 incluait une **BDD locale de plateformes de jeux vidéo** (`snow_shelf_DB.Platform`) avec :

| Champ | Description |
|-------|-------------|
| `id`, `name` | Identifiant et nom |
| `altername` | Noms alternatifs (JSON) |
| `release_date` | Date de sortie |
| `developer`, `manufacturer` | Développeur, fabricant |
| `cpu`, `memory`, `graphics`, `sound`, `display`, `media` | Spécifications techniques |
| `max_controllers` | Nombre max de manettes |
| `desc_fr`, `desc_en`, `desc_es` | Descriptions multilingues |
| `img` | Images (JSON) |

Cette BDD était interrogée via `searchLocalPlatformDb()` quand le provider `snow_vg_db_plat` était activé.

### 11.2 Nouveau système (v2 NestJS) ✅

Le système v2 utilise un **seed de 41 plateformes** dans `PrimaryTypeSeedService`, stockées comme `fieldOptions` du champ `platform` (type `select`) du PrimaryType `video_games` :

**Plateformes par constructeur** :
| Constructeur | Plateformes |
|-------------|-------------|
| **PC** | PC |
| **Sony** (7) | PlayStation 5, PS4, PS3, PS2, PS1, PS Vita, PSP |
| **Microsoft** (4) | Xbox Series X\|S, Xbox One, Xbox 360, Xbox |
| **Nintendo Consoles** (7) | Switch, Wii U, Wii, GameCube, N64, Super Nintendo, NES |
| **Nintendo Portables** (5) | 3DS, DS, GBA, GBC, Game Boy |
| **Sega** (5) | Dreamcast, Saturn, Mega Drive, Master System, Game Gear |
| **Classiques** (8) | Neo Geo, PC Engine, 3DO, Atari Jaguar, Atari 2600, Atari ST, Commodore 64, Amiga |
| **Modernes** (4) | Steam Deck, Arcade, Mobile, Autre |

**Mapping d'import** : `PLATFORM_MAP` (~70 aliases) dans `ItemFormPage.tsx` pour mapping automatique des noms Tako vers les options du seed.

**Admin** : Page dédiée `/admin/platforms` avec drag-and-drop, groupes visuels, ajout/suppression.

---

## 12. Interface utilisateur de recherche

### 12.1 Structure du modal de recherche

```
┌──────────────────────────────────────────┐
│ Recherche Web                            │
├──────────────────────────────────────────┤
│ [🔍 Rechercher...............] [Chercher] │
│                                          │
│ Type: [Jouets ▼] [Livres] [Jeux Vidéo]  │
│                                          │
│ Fournisseurs:                            │
│ ☑ LEGO officiel  ☑ Rebrickable          │
│ ☐ Brickset       ☑ Playmobil            │
│                                          │
│ ─── Résultats ───                        │
│ ┌──────┐ ┌──────┐ ┌──────┐              │
│ │ img  │ │ img  │ │ img  │              │
│ │ nom  │ │ nom  │ │ nom  │              │
│ │ 2024 │ │ 2023 │ │ 2022 │              │
│ └──────┘ └──────┘ └──────┘              │
└──────────────────────────────────────────┘
```

### 12.2 Structure du modal de détails

```
┌────────────────────────────────────────────────────────────────┐
│ Détails du résultat                                            │
├──────────────────────────────┬─────────────────────────────────┤
│                              │ Importer comme :                │
│    [Image principale]        │ 🏷️ Jouets Construction          │
│                              │                                 │
│    Millennium Falcon         │ ── Informations générales ──    │
│    Description longue...     │ [✓ Tout] [✗ Rien]              │
│                              │ ☑ Nom : Millennium Falcon       │
│    📍 LEGO officiel          │ ☑ Description : Star Wars UCS.. │
│    [🔄 Actualiser][🔗 Source]│ ☑ Valeur : 799,99 €             │
│                              │ ☑ Code-barres : 5702017584898   │
│    ── Galerie ──             │                                 │
│    [img1] [img2] [img3]      │ ── Médias ──                    │
│    3/5 sélectionnées         │ ☑ Images : 5 image(s)           │
│    [Tout sélectionner]       │                                 │
│                              │ ── Manuels d'instructions ──    │
│                              │ ☑ Manuel 1 (PDF) [🔗]           │
│                              │ ☑ Manuel 2 (PDF) [🔗]           │
│                              │ 2/2 sélectionnés                │
│                              │                                 │
│                              │ ── Détails (Jouets Constr.) ──  │
│                              │ ☑ Marque : LEGO                 │
│                              │ ☑ N° set : 75192                │
│                              │ ☑ Pièces : 7541                 │
│                              │ ☑ Thème : Star Wars             │
│                              │ ☑ Année : 2024                  │
│                              │ ☑ Âge : 18+                     │
│                              │ ☑ Minifigurines : 4             │
├──────────────────────────────┴─────────────────────────────────┤
│                              [Annuler] [✅ Importer]            │
└────────────────────────────────────────────────────────────────┘
```

### 12.3 Fonctionnalités UI notables

- **Sélection d'images individuelle** : double-clic sur une miniature pour sélectionner/désélectionner
- **Sélection de manuels** : checkboxes pour chaque PDF disponible
- **Détection automatique du type** : basée sur le `webapi_type` du provider
- **Cache des détails** : clé `{provider}:{detailUrl}`, bouton "Actualiser" si cache
- **Overlay d'import** : spinner avec compteur d'images/documents pendant le téléchargement
- **Bouton "Tout/Rien"** : sélectionner/désélectionner tous les champs d'un coup

---

## 13. Résumé des points clés pour la migration NestJS/React

| Aspect | Ancien (PHP) | Nouveau (NestJS) | Status |
|--------|-------------|-------------------|--------|
| **API Proxy** | `web-search.php` (PHP+cURL) | `TakoService` (NestJS+fetch) | ✅ Complet |
| **Microservice externe** | `toys_api` (Node.js, même code) | `Tako_Api` (identique, Docker) | ✅ Complet |
| **Clés API** | Table `Admin_webApi` + `users_api` | Entity `TakoApiConfig` + env vars Docker | ✅ Complet |
| **Mappings** | `item_field_mappings` + `primary_type_key_to_field` | `TAKO_FIELD_MAPPING` + `DOMAIN_TO_PRIMARY_TYPE` dans TakoService | ✅ Complet |
| **Transformations** | JS client (`applyTransform`) + PHP (`FieldTransformer`) | Frontend `handleTakoImport` + normalisation objets→strings | ✅ Complet |
| **UI Recherche** | JS vanilla modulaire (ES6) | `TakoSearchModal.tsx` (~700 lignes, React) | ✅ Complet |
| **Import** | `collection/import.js` (2212 lignes) | `ItemFormPage.handleTakoImport` + `PLATFORM_MAP` (~70 aliases) | ✅ Complet |
| **Image proxy** | `proxy-download.php` | `TakoService.proxyDownload()` | ✅ Complet |
| **Cache** | Session PHP + reload | `cache-manager` NestJS (Redis TTL) | ✅ Complet |
| **Détail item** | `web-search/ui/details.js` (1585 lignes) | `getDetail()` avec `DETAIL_SEGMENTS` (12 domaines × 30 providers) | ✅ Complet |
| **Traduction** | Non supporté | `autoTrad=true&lang=fr` (sauf JVC) | ✅ Complet |
| **Plateformes** | Table `Platform` locale | Seed 41 plateformes + `PLATFORM_MAP` 70 aliases + Admin page | ✅ Complet |

---

## 14. État d'avancement de la migration (25 février 2026)

### ✅ Fonctionnalités entièrement migrées

- Recherche multi-providers (11 domaines, 32 providers)
- Import avec pré-remplissage formulaire (métadonnées EAV mappées automatiquement)
- Proxy download d'images (via backend NestJS)
- Auto-détection du PrimaryType depuis le domaine Tako
- Détection de doublons (barcode + nom)
- Cache Redis résultats (TTL configurable)
- Descriptions en français via `autoTrad=true&lang=fr` sur Tako
- Normalisation des données complexes (objets→strings pour developers, publishers, etc.)
- `DETAIL_SEGMENTS` pour construction correcte des URLs de détail Tako
- `PLATFORM_MAP` (~70 aliases) pour mapping automatique des plateformes

### ✅ Fonctionnalités migrées post-Sprint 17

- Import multi-média : images additionnelles (gallery), vidéos (YouTube/MP4), documents (instructions PDF)
- `extractMedia()` extrait automatiquement les médias depuis le format plat Tako v2.0.1
- Pré-remplissage du prix (`Valeur marchande`) depuis `metadata.price` (normalisation objet→nombre)
- Adaptation Tako v2.0.1 complète — tous les domaines :
  - **DETAIL_SEGMENTS** : 15 corrections (books sans segment, music/tcg/boardgames/construction-toys/anime-manga/videogames providers et segments mis à jour)
  - **DOMAIN_PROVIDERS** : renommages v2.0.1 (`boardgamegeek` → `bgg`, `pokemon-tcg` → `pokemon`)
  - **extractMetadata media (TMDB)** : `directors[]`, `rating.average`, `originalLanguage`, `productionCompanies[]`, `numberOfSeasons/Episodes`, `createdBy[]`, `mediaType`
  - **extractMetadata music (Discogs)** : `tracks`, `labels[]`, `formats[]`, `trackCount`
  - **extractMetadata boardgames (BGG)** : `players.{min,max}`, `playTime.average`, `stats.{complexity,rating}`
  - **extractMetadata construction-toys** : `setNumber`, `pieceCount`, `minifigCount`, prix `{amount,currency}` → nombre
  - **TAKO_FIELD_MAPPING** mis à jour pour movies, series, board_games, music (nouvelles clés v2.0.1)
  - **Segment TMDB dynamique** : `getDetail(domain, provider, sourceId, type?)` — le frontend passe `result.type` pour distinguer `movies` de `series`
- Double-unwrap TMDB v2.0.1 dans `normalizeSingleResult()`
- `pendingMedia` système dans `ItemFormPage` pour rattacher les médias téléchargés après création/sauvegarde

### ⏳ Fonctionnalités non encore migrées

- Sélection individuelle d'images dans le modal de détails (checkboxes par image)
- Gestion des conflits d'import (remplacer/ignorer/concaténer)
- Déduplication intelligente des images par URL
- Bouton "Actualiser" avec invalidation cache détail
- BarcodeScanner (recherche par code-barres)
- Clés API utilisateur (premium) — pas de table `users_api_keys` migrée

---

*Analyse réalisée le 24 février 2026 — Mise à jour le 27 février 2026 (Tako v2.0.1 — adaptation complète tous domaines)*
