/**
 * SnowShelf - Web Search Module
 * Définition des champs par type
 */

// Champs généraux (communs à tous les types)
export const GENERAL_FIELDS = [
    { key: 'name', label: 'Nom suggéré', type: 'text', source: ['title', 'name'] },
    { key: 'description', label: 'Description', type: 'textarea', source: ['description'] },
    { key: 'price', label: 'Valeur marchande', type: 'price', source: ['price', 'metadata.price'] },
    { key: 'barcode', label: 'Code-barres', type: 'text', source: ['barcode', 'identifiers.isbn_13', 'identifiers.isbn_10', 'metadata.barcode', 'metadata.upc', 'metadata.isbn', 'metadata.isbn_13', 'metadata.isbn_10'] },
];

// // Champs spécifiques par type primaire
// export const TYPE_SPECIFIC_FIELDS = {
//     // Livres (Format Harmonisé toys_api)
//     books: [
//         { key: 'author', label: 'Auteur(s)', source: ['metadata.authors', 'authors'] },
//         { key: 'isbn', label: 'ISBN', source: ['metadata.isbn', 'isbn'] },
//         { key: 'publisher', label: 'Éditeur', source: ['metadata.publisher', 'editors'] },
//         { key: 'year', label: 'Année de publication', source: ['metadata.year', 'releaseDate'] },
//         { key: 'pages', label: 'Nombre de pages', source: ['metadata.pages', 'pages'] },
//         { key: 'language', label: 'Langue', source: ['metadata.language', 'language'] },
//         { key: 'genre', label: 'Genre', source: ['metadata.genre', 'metadata.genres', 'genres'] },
//         { key: 'collection', label: 'Série / Collection', source: ['metadata.serie', 'metadata.series', 'serie'] },
//         { key: 'volume', label: 'Tome / Volume', source: ['metadata.tome', 'metadata.volume', 'tome'] },
//         { key: 'original_title', label: 'Titre original', source: ['metadata.original_title', 'originalTitle'] },
//     ],
    
//     // Comics / BD
//     comics: [
//         { key: 'author', label: 'Auteur(s)', source: ['metadata.authors', 'authors'] },
//         { key: 'isbn', label: 'ISBN', source: ['metadata.isbn', 'isbn'] },
//         { key: 'publisher', label: 'Éditeur', source: ['metadata.publisher', 'editors'] },
//         { key: 'year', label: 'Année de publication', source: ['metadata.year', 'releaseDate'] },
//         { key: 'pages', label: 'Nombre de pages', source: ['metadata.pages', 'pages'] },
//         { key: 'language', label: 'Langue', source: ['metadata.language', 'language'] },
//         { key: 'genre', label: 'Genre', source: ['metadata.genre', 'metadata.genres', 'genres'] },
//         { key: 'collection', label: 'Série / Collection', source: ['metadata.serie', 'metadata.series', 'serie'] },
//         { key: 'volume', label: 'Tome / Volume', source: ['metadata.tome', 'metadata.volume', 'tome'] },
//         { key: 'original_title', label: 'Titre original', source: ['metadata.original_title', 'originalTitle'] },
//     ],
    
//     // Jeux vidéo
//     video_games: [
//         { key: 'platform', label: 'Plateforme', source: ['metadata.platforms', 'metadata.platform'] },
//         { key: 'developer', label: 'Développeur', source: ['metadata.developers', 'metadata.developer'] },
//         { key: 'publisher', label: 'Éditeur', source: ['metadata.publishers', 'metadata.publisher'] },
//         { key: 'year', label: 'Année de sortie', source: ['metadata.year', 'metadata.release_date'] },
//         { key: 'genre', label: 'Genre', source: ['metadata.genres', 'metadata.genre'] },
//         { key: 'rating', label: 'Note', source: ['metadata.rating', 'metadata.metacritic', 'metadata.aggregated_rating'] },
//         { key: 'pegi', label: 'Classification âge', source: ['metadata.pegi', 'metadata.esrb_rating', 'metadata.age_ratings'] },
//         { key: 'min_age', label: 'Âge minimum', source: ['metadata.min_age', 'metadata.minAge'] },
//         { key: 'multiplayer', label: 'Multijoueur', source: ['metadata.multiplayer', 'metadata.isMultiplayer'] },
//         { key: 'playtime', label: 'Durée de jeu', source: ['metadata.playtime'] },
//         { key: 'game_modes', label: 'Modes de jeu', source: ['metadata.game_modes'] },
//         { key: 'themes', label: 'Thèmes', source: ['metadata.themes'] },
//         { key: 'franchises', label: 'Franchise', source: ['metadata.franchises'] },
//     ],
    
//     // Plateformes de jeux vidéo / Consoles
//     vg_plat: [
//         { key: 'platform', label: 'Plateforme', source: ['metadata.platform', 'metadata.platform_name'] },
//         { key: 'manufacturer', label: 'Fabricant', source: ['metadata.brand', 'metadata.manufacturer'] },
//         { key: 'year', label: 'Année de sortie', source: ['metadata.year', 'metadata.release_date'] },
//         { key: 'release_country', label: 'Pays de sortie', source: ['metadata.release_country'] },
//         { key: 'region_code', label: 'Code région', source: ['metadata.region_code'] },
//         { key: 'release_type', label: 'Type de sortie', source: ['metadata.release_type'] },
//         { key: 'color', label: 'Couleur', source: ['metadata.color'] },
//         { key: 'is_bundle', label: 'Bundle', source: ['metadata.is_bundle'] },
//         { key: 'limited_edition', label: 'Édition limitée', source: ['metadata.limited_edition'] },
//         { key: 'amount_produced', label: 'Quantité produite', source: ['metadata.amount_produced'] },
//         { key: 'rarity_score', label: 'Score de rareté', source: ['metadata.rarity_score'] },
//     ],
    
//     // Accessoires de jeux vidéo
//     vg_accessory: [
//         { key: 'platform', label: 'Plateforme', source: ['metadata.platform', 'metadata.platform_name'] },
//         { key: 'accessory_type', label: 'Type d\'accessoire', source: ['metadata.accessory_type', 'metadata.type'] },
//         { key: 'manufacturer', label: 'Fabricant', source: ['metadata.brand', 'metadata.manufacturer'] },
//         { key: 'year', label: 'Année de sortie', source: ['metadata.year', 'metadata.release_date'] },
//         { key: 'release_country', label: 'Pays de sortie', source: ['metadata.release_country'] },
//         { key: 'region_code', label: 'Code région', source: ['metadata.region_code'] },
//         { key: 'color', label: 'Couleur', source: ['metadata.color'] },
//         { key: 'is_bundle', label: 'Bundle', source: ['metadata.is_bundle'] },
//         { key: 'limited_edition', label: 'Édition limitée', source: ['metadata.limited_edition'] },
//         { key: 'amount_produced', label: 'Quantité produite', source: ['metadata.amount_produced'] },
//         { key: 'rarity_score', label: 'Score de rareté', source: ['metadata.rarity_score'] },
//     ],
    
//     // Musique
//     music: [
//         { key: 'artist', label: 'Artiste', source: ['metadata.artist', 'metadata.artists'] },
//         { key: 'album', label: 'Album', source: ['metadata.album'] },
//         { key: 'year', label: 'Année', source: ['metadata.year', 'metadata.release_date'] },
//         { key: 'genre', label: 'Genre', source: ['metadata.genres', 'metadata.genre'] },
//         { key: 'tracks', label: 'Nombre de pistes', source: ['metadata.track_count', 'metadata.tracks'] },
//         { key: 'label', label: 'Label', source: ['metadata.label', 'metadata.publisher'] },
//         { key: 'format', label: 'Format', source: ['metadata.format'] },
//     ],
    
//     // Films
//     movies: [
//         { key: 'director', label: 'Réalisateur', source: ['metadata.director', 'metadata.directors'] },
//         { key: 'actors', label: 'Acteurs principaux', source: ['metadata.stars', 'metadata.actors', 'metadata.cast'] },
//         { key: 'year', label: 'Année', source: ['metadata.year', 'metadata.release_date'] },
//         { key: 'genre', label: 'Genre', source: ['metadata.genres', 'metadata.genre'] },
//         { key: 'duration', label: 'Durée', source: ['metadata.runtime', 'metadata.duration'] },
//         { key: 'language', label: 'Langue originale', source: ['metadata.original_language'] },
//         { key: 'studio', label: 'Studio', source: ['metadata.production_companies'] },
//     ],
    
//     // Séries
//     series: [
//         { key: 'creator', label: 'Créateur', source: ['metadata.director', 'metadata.created_by', 'metadata.directors'] },
//         { key: 'actors', label: 'Acteurs principaux', source: ['metadata.stars', 'metadata.actors', 'metadata.cast'] },
//         { key: 'year_start', label: 'Année de début', source: ['metadata.year', 'metadata.first_air_date'] },
//         { key: 'year_end', label: 'Année de fin', source: ['metadata.end_year'] },
//         { key: 'genre', label: 'Genre', source: ['metadata.genres', 'metadata.genre'] },
//         { key: 'season', label: 'Saisons', source: ['metadata.total_seasons', 'metadata.seasons', 'metadata.number_of_seasons'] },
//         { key: 'episodes', label: 'Épisodes', source: ['metadata.total_episodes', 'metadata.episodes', 'metadata.number_of_episodes'] },
//         { key: 'network', label: 'Chaîne', source: ['metadata.networks', 'metadata.network'] },
//         { key: 'status', label: 'Statut', source: ['metadata.status'] },
//     ],
    
//     // Figurines
//     toys_fig: [
//         { key: 'brand', label: 'Marque', source: ['metadata.brand'] },
//         { key: 'year', label: 'Année', source: ['metadata.year'] },
//         { key: 'theme', label: 'Thème / Licence', source: ['metadata.theme', 'metadata.franchise'] },
//         { key: 'scale', label: 'Échelle', source: ['metadata.scale'] },
//         { key: 'material', label: 'Matériau', source: ['metadata.material'] },
//         { key: 'manufacturer', label: 'Fabricant', source: ['metadata.manufacturer'] },
//     ],
    
//     // Jouets de construction
//     toys_construct: [
//         { key: 'brand', label: 'Marque', source: ['metadata.brand'] },
//         { key: 'set_number', label: 'Numéro du set', source: ['metadata.set_number', 'metadata.sku'] },
//         { key: 'pieces', label: 'Nombre de pièces', source: ['metadata.pieces', 'metadata.pieceCount', 'metadata.num_parts'] },
//         { key: 'theme', label: 'Thème', source: ['metadata.theme', 'metadata.franchise'] },
//         { key: 'year', label: 'Année de sortie', source: ['metadata.year'] },
//         { key: 'age_range', label: 'Âge recommandé', source: ['metadata.age_range', 'metadata.ageRange'] },
//         { key: 'minifigs', label: 'Minifigurines', source: ['metadata.minifigs', 'metadata.minifigures'] },
//     ],
    
//     // Jeux de société
//     board_games: [
//         { key: 'publisher', label: 'Éditeur', source: ['metadata.publisher'] },
//         { key: 'year', label: 'Année', source: ['metadata.year'] },
//         { key: 'players', label: 'Nombre de joueurs', source: ['metadata.players', 'metadata.min_players', 'metadata.max_players'] },
//         { key: 'playtime', label: 'Durée de partie', source: ['metadata.playtime', 'metadata.playing_time'] },
//         { key: 'age', label: 'Âge minimum', source: ['metadata.age', 'metadata.min_age'] },
//         { key: 'designer', label: 'Auteur / Designer', source: ['metadata.designer', 'metadata.designers'] },
//         { key: 'category', label: 'Catégorie', source: ['metadata.category', 'metadata.categories'] },
//     ],
    
//     // Divers
//     divers: [
//         { key: 'brand', label: 'Marque', source: ['metadata.brand'] },
//         { key: 'year', label: 'Année', source: ['metadata.year'] },
//         { key: 'category', label: 'Catégorie', source: ['metadata.category'] },
//         { key: 'condition', label: 'État', source: ['metadata.condition'] },
//     ],
    
//     // Cartes à collectionner
//     trading_cards: [
//         { key: 'brand', label: 'Marque / Éditeur', source: ['metadata.brand', 'metadata.publisher'] },
//         { key: 'year', label: 'Année', source: ['metadata.year'] },
//         { key: 'set_name', label: 'Nom du set', source: ['metadata.set_name', 'metadata.expansion'] },
//         { key: 'card_number', label: 'Numéro de carte', source: ['metadata.card_number'] },
//         { key: 'rarity', label: 'Rareté', source: ['metadata.rarity'] },
//         { key: 'language', label: 'Langue', source: ['metadata.language'] },
//     ],
    
//     // Albums d'images / Collectibles
//     sticker_albums: [
//         { key: 'publisher', label: 'Éditeur', source: ['metadata.publisher', 'metadata.editor'] },
//         { key: 'year', label: 'Année', source: ['metadata.year'] },
//         { key: 'theme', label: 'Thème', source: ['metadata.theme', 'metadata.categories'] },
//         { key: 'total_stickers', label: 'Nombre total d\'images', source: ['metadata.total_stickers', 'metadata.sticker_count'] },
//         { key: 'checklist', label: 'Checklist', source: ['metadata.checklist'] },
//         { key: 'special_stickers', label: 'Images spéciales', source: ['metadata.special_stickers'] },
//         { key: 'language', label: 'Langue', source: ['metadata.language'] },
//     ],
    
//     // Alias collectibles -> sticker_albums
//     collectibles: [
//         { key: 'publisher', label: 'Éditeur', source: ['metadata.publisher', 'metadata.editor'] },
//         { key: 'year', label: 'Année', source: ['metadata.year'] },
//         { key: 'theme', label: 'Thème', source: ['metadata.theme', 'metadata.categories'] },
//         { key: 'total_stickers', label: 'Nombre total d\'images', source: ['metadata.total_stickers', 'metadata.sticker_count'] },
//         { key: 'checklist', label: 'Checklist', source: ['metadata.checklist'] },
//         { key: 'special_stickers', label: 'Images spéciales', source: ['metadata.special_stickers'] },
//         { key: 'language', label: 'Langue', source: ['metadata.language'] },
//     ],
// };
