-- ============================================================================
-- Migration : Peuplement des mappings API pour les types existants
-- Date : 2025-12-18
-- Description : Insère les mappings correspondant au code hard-codé existant
-- À exécuter APRÈS 2025_12_18_metadata_mapping_structure.sql
-- ============================================================================

-- ============================================================================
-- Configuration de transformation pour le mapping de statut
-- ============================================================================

SET @status_config = '{"ended":"Terminée","canceled":"Annulée","cancelled":"Annulée","continuing":"En cours","running":"En cours","returning series":"En cours","in production":"En cours","planned":"En cours","pilot":"En cours"}';

-- ============================================================================
-- MAPPINGS POUR TYPE: series (ID=5)
-- ============================================================================

-- Récupérer les IDs des champs pour series
SET @type_series = 5;

-- creator
INSERT INTO `primary_type_key_to_field` (`field_id`, `api_keys`, `transform_type`, `transform_config`, `priority`)
SELECT id, '["metadata.director", "metadata.created_by", "metadata.directors"]', 'array_join', '{"separator": ", "}', 10
FROM `primary_type_fields` WHERE `primary_type_id` = @type_series AND `field_key` = 'creator';

-- actors
INSERT INTO `primary_type_key_to_field` (`field_id`, `api_keys`, `transform_type`, `transform_config`, `priority`)
SELECT id, '["metadata.stars", "metadata.actors", "metadata.cast"]', 'array_join', '{"separator": ", "}', 10
FROM `primary_type_fields` WHERE `primary_type_id` = @type_series AND `field_key` = 'actors';

-- year_start
INSERT INTO `primary_type_key_to_field` (`field_id`, `api_keys`, `transform_type`, `transform_config`, `priority`)
SELECT id, '["metadata.year", "metadata.first_air_date"]', 'year_extract', NULL, 10
FROM `primary_type_fields` WHERE `primary_type_id` = @type_series AND `field_key` = 'year_start';

-- year_end
INSERT INTO `primary_type_key_to_field` (`field_id`, `api_keys`, `transform_type`, `transform_config`, `priority`)
SELECT id, '["metadata.end_year"]', 'year_extract', NULL, 10
FROM `primary_type_fields` WHERE `primary_type_id` = @type_series AND `field_key` = 'year_end';

-- genre
INSERT INTO `primary_type_key_to_field` (`field_id`, `api_keys`, `transform_type`, `transform_config`, `priority`)
SELECT id, '["metadata.genres", "metadata.genre"]', 'array_join', '{"separator": ", "}', 10
FROM `primary_type_fields` WHERE `primary_type_id` = @type_series AND `field_key` = 'genre';

-- season
INSERT INTO `primary_type_key_to_field` (`field_id`, `api_keys`, `transform_type`, `transform_config`, `priority`)
SELECT id, '["metadata.total_seasons", "metadata.seasons", "metadata.number_of_seasons"]', 'first_value', NULL, 10
FROM `primary_type_fields` WHERE `primary_type_id` = @type_series AND `field_key` = 'season';

-- episodes
INSERT INTO `primary_type_key_to_field` (`field_id`, `api_keys`, `transform_type`, `transform_config`, `priority`)
SELECT id, '["metadata.total_episodes", "metadata.episodes", "metadata.number_of_episodes"]', 'first_value', NULL, 10
FROM `primary_type_fields` WHERE `primary_type_id` = @type_series AND `field_key` = 'episodes';

-- network
INSERT INTO `primary_type_key_to_field` (`field_id`, `api_keys`, `transform_type`, `transform_config`, `priority`)
SELECT id, '["metadata.networks", "metadata.network"]', 'first_value', NULL, 10
FROM `primary_type_fields` WHERE `primary_type_id` = @type_series AND `field_key` = 'network';

-- status
INSERT INTO `primary_type_key_to_field` (`field_id`, `api_keys`, `transform_type`, `transform_config`, `priority`)
SELECT id, '["metadata.status"]', 'status_mapping', @status_config, 10
FROM `primary_type_fields` WHERE `primary_type_id` = @type_series AND `field_key` = 'status';

-- ============================================================================
-- MAPPINGS POUR TYPE: movies (ID=4)
-- ============================================================================

SET @type_movies = 4;

-- director
INSERT INTO `primary_type_key_to_field` (`field_id`, `api_keys`, `transform_type`, `transform_config`, `priority`)
SELECT id, '["metadata.director", "metadata.directors"]', 'array_join', '{"separator": ", "}', 10
FROM `primary_type_fields` WHERE `primary_type_id` = @type_movies AND `field_key` = 'director';

-- actors
INSERT INTO `primary_type_key_to_field` (`field_id`, `api_keys`, `transform_type`, `transform_config`, `priority`)
SELECT id, '["metadata.stars", "metadata.actors", "metadata.cast"]', 'array_join', '{"separator": ", "}', 10
FROM `primary_type_fields` WHERE `primary_type_id` = @type_movies AND `field_key` = 'actors';

-- year
INSERT INTO `primary_type_key_to_field` (`field_id`, `api_keys`, `transform_type`, `transform_config`, `priority`)
SELECT id, '["metadata.year", "metadata.release_date"]', 'year_extract', NULL, 10
FROM `primary_type_fields` WHERE `primary_type_id` = @type_movies AND `field_key` = 'year';

-- genre
INSERT INTO `primary_type_key_to_field` (`field_id`, `api_keys`, `transform_type`, `transform_config`, `priority`)
SELECT id, '["metadata.genres", "metadata.genre"]', 'array_join', '{"separator": ", "}', 10
FROM `primary_type_fields` WHERE `primary_type_id` = @type_movies AND `field_key` = 'genre';

-- duration
INSERT INTO `primary_type_key_to_field` (`field_id`, `api_keys`, `transform_type`, `transform_config`, `priority`)
SELECT id, '["metadata.runtime", "metadata.duration"]', 'duration_format', '{"unit": "minutes", "suffix": ""}', 10
FROM `primary_type_fields` WHERE `primary_type_id` = @type_movies AND `field_key` = 'duration';

-- language
INSERT INTO `primary_type_key_to_field` (`field_id`, `api_keys`, `transform_type`, `transform_config`, `priority`)
SELECT id, '["metadata.original_language", "metadata.language"]', 'none', NULL, 10
FROM `primary_type_fields` WHERE `primary_type_id` = @type_movies AND `field_key` = 'language';

-- studio
INSERT INTO `primary_type_key_to_field` (`field_id`, `api_keys`, `transform_type`, `transform_config`, `priority`)
SELECT id, '["metadata.production_companies", "metadata.studio"]', 'first_value', NULL, 10
FROM `primary_type_fields` WHERE `primary_type_id` = @type_movies AND `field_key` = 'studio';

-- ============================================================================
-- MAPPINGS POUR TYPE: books (ID=1)
-- ============================================================================

SET @type_books = 1;

-- author
INSERT INTO `primary_type_key_to_field` (`field_id`, `api_keys`, `transform_type`, `transform_config`, `priority`)
SELECT id, '["metadata.authors", "authors"]', 'array_join', '{"separator": ", "}', 10
FROM `primary_type_fields` WHERE `primary_type_id` = @type_books AND `field_key` = 'author';

-- isbn
INSERT INTO `primary_type_key_to_field` (`field_id`, `api_keys`, `transform_type`, `transform_config`, `priority`)
SELECT id, '["metadata.isbn", "metadata.isbn_13", "metadata.isbn_10", "isbn"]', 'none', NULL, 10
FROM `primary_type_fields` WHERE `primary_type_id` = @type_books AND `field_key` = 'isbn';

-- publisher
INSERT INTO `primary_type_key_to_field` (`field_id`, `api_keys`, `transform_type`, `transform_config`, `priority`)
SELECT id, '["metadata.publisher", "metadata.editors", "editors"]', 'first_value', NULL, 10
FROM `primary_type_fields` WHERE `primary_type_id` = @type_books AND `field_key` = 'publisher';

-- year
INSERT INTO `primary_type_key_to_field` (`field_id`, `api_keys`, `transform_type`, `transform_config`, `priority`)
SELECT id, '["metadata.year", "metadata.releaseDate", "releaseDate"]', 'year_extract', NULL, 10
FROM `primary_type_fields` WHERE `primary_type_id` = @type_books AND `field_key` = 'year';

-- pages
INSERT INTO `primary_type_key_to_field` (`field_id`, `api_keys`, `transform_type`, `transform_config`, `priority`)
SELECT id, '["metadata.pages", "pages"]', 'none', NULL, 10
FROM `primary_type_fields` WHERE `primary_type_id` = @type_books AND `field_key` = 'pages';

-- language
INSERT INTO `primary_type_key_to_field` (`field_id`, `api_keys`, `transform_type`, `transform_config`, `priority`)
SELECT id, '["metadata.language", "language"]', 'none', NULL, 10
FROM `primary_type_fields` WHERE `primary_type_id` = @type_books AND `field_key` = 'language';

-- genre
INSERT INTO `primary_type_key_to_field` (`field_id`, `api_keys`, `transform_type`, `transform_config`, `priority`)
SELECT id, '["metadata.genre", "metadata.genres", "genres"]', 'array_join', '{"separator": ", "}', 10
FROM `primary_type_fields` WHERE `primary_type_id` = @type_books AND `field_key` = 'genre';

-- collection (série)
INSERT INTO `primary_type_key_to_field` (`field_id`, `api_keys`, `transform_type`, `transform_config`, `priority`)
SELECT id, '["metadata.serie", "metadata.series", "serie"]', 'none', NULL, 10
FROM `primary_type_fields` WHERE `primary_type_id` = @type_books AND `field_key` = 'collection';

-- volume
INSERT INTO `primary_type_key_to_field` (`field_id`, `api_keys`, `transform_type`, `transform_config`, `priority`)
SELECT id, '["metadata.tome", "metadata.volume", "tome"]', 'none', NULL, 10
FROM `primary_type_fields` WHERE `primary_type_id` = @type_books AND `field_key` = 'volume';

-- ============================================================================
-- MAPPINGS POUR TYPE: video_games (ID=2)
-- ============================================================================

SET @type_vg = 2;

-- platform
INSERT INTO `primary_type_key_to_field` (`field_id`, `api_keys`, `transform_type`, `transform_config`, `priority`)
SELECT id, '["metadata.platforms", "metadata.platform"]', 'array_join', '{"separator": ", "}', 10
FROM `primary_type_fields` WHERE `primary_type_id` = @type_vg AND `field_key` = 'platform';

-- developer
INSERT INTO `primary_type_key_to_field` (`field_id`, `api_keys`, `transform_type`, `transform_config`, `priority`)
SELECT id, '["metadata.developers", "metadata.developer"]', 'array_join', '{"separator": ", "}', 10
FROM `primary_type_fields` WHERE `primary_type_id` = @type_vg AND `field_key` = 'developer';

-- publisher
INSERT INTO `primary_type_key_to_field` (`field_id`, `api_keys`, `transform_type`, `transform_config`, `priority`)
SELECT id, '["metadata.publishers", "metadata.publisher"]', 'array_join', '{"separator": ", "}', 10
FROM `primary_type_fields` WHERE `primary_type_id` = @type_vg AND `field_key` = 'publisher';

-- year
INSERT INTO `primary_type_key_to_field` (`field_id`, `api_keys`, `transform_type`, `transform_config`, `priority`)
SELECT id, '["metadata.year", "metadata.release_date"]', 'year_extract', NULL, 10
FROM `primary_type_fields` WHERE `primary_type_id` = @type_vg AND `field_key` = 'year';

-- genre
INSERT INTO `primary_type_key_to_field` (`field_id`, `api_keys`, `transform_type`, `transform_config`, `priority`)
SELECT id, '["metadata.genres", "metadata.genre"]', 'array_join', '{"separator": ", "}', 10
FROM `primary_type_fields` WHERE `primary_type_id` = @type_vg AND `field_key` = 'genre';

-- pegi
INSERT INTO `primary_type_key_to_field` (`field_id`, `api_keys`, `transform_type`, `transform_config`, `priority`)
SELECT id, '["metadata.pegi", "metadata.esrb_rating", "metadata.age_ratings"]', 'pegi_normalize', NULL, 10
FROM `primary_type_fields` WHERE `primary_type_id` = @type_vg AND `field_key` = 'pegi';

-- multiplayer
INSERT INTO `primary_type_key_to_field` (`field_id`, `api_keys`, `transform_type`, `transform_config`, `priority`)
SELECT id, '["metadata.multiplayer", "metadata.isMultiplayer"]', 'boolean_fr', NULL, 10
FROM `primary_type_fields` WHERE `primary_type_id` = @type_vg AND `field_key` = 'multiplayer';

-- ============================================================================
-- MAPPINGS POUR TYPE: music (ID=3)
-- ============================================================================

SET @type_music = 3;

-- artist
INSERT INTO `primary_type_key_to_field` (`field_id`, `api_keys`, `transform_type`, `transform_config`, `priority`)
SELECT id, '["metadata.artist", "metadata.artists"]', 'array_join', '{"separator": ", "}', 10
FROM `primary_type_fields` WHERE `primary_type_id` = @type_music AND `field_key` = 'artist';

-- album
INSERT INTO `primary_type_key_to_field` (`field_id`, `api_keys`, `transform_type`, `transform_config`, `priority`)
SELECT id, '["metadata.album"]', 'none', NULL, 10
FROM `primary_type_fields` WHERE `primary_type_id` = @type_music AND `field_key` = 'album';

-- year
INSERT INTO `primary_type_key_to_field` (`field_id`, `api_keys`, `transform_type`, `transform_config`, `priority`)
SELECT id, '["metadata.year", "metadata.release_date"]', 'year_extract', NULL, 10
FROM `primary_type_fields` WHERE `primary_type_id` = @type_music AND `field_key` = 'year';

-- genre
INSERT INTO `primary_type_key_to_field` (`field_id`, `api_keys`, `transform_type`, `transform_config`, `priority`)
SELECT id, '["metadata.genres", "metadata.genre"]', 'array_join', '{"separator": ", "}', 10
FROM `primary_type_fields` WHERE `primary_type_id` = @type_music AND `field_key` = 'genre';

-- tracks
INSERT INTO `primary_type_key_to_field` (`field_id`, `api_keys`, `transform_type`, `transform_config`, `priority`)
SELECT id, '["metadata.track_count", "metadata.tracks"]', 'none', NULL, 10
FROM `primary_type_fields` WHERE `primary_type_id` = @type_music AND `field_key` = 'tracks';

-- label
INSERT INTO `primary_type_key_to_field` (`field_id`, `api_keys`, `transform_type`, `transform_config`, `priority`)
SELECT id, '["metadata.label", "metadata.publisher"]', 'none', NULL, 10
FROM `primary_type_fields` WHERE `primary_type_id` = @type_music AND `field_key` = 'label';

-- ============================================================================
-- MAPPINGS POUR TYPE: toys_construct (ID=7) - LEGO, etc.
-- ============================================================================

SET @type_toys = 7;

-- brand
INSERT INTO `primary_type_key_to_field` (`field_id`, `api_keys`, `transform_type`, `transform_config`, `priority`)
SELECT id, '["metadata.brand"]', 'none', NULL, 10
FROM `primary_type_fields` WHERE `primary_type_id` = @type_toys AND `field_key` = 'brand';

-- set_number
INSERT INTO `primary_type_key_to_field` (`field_id`, `api_keys`, `transform_type`, `transform_config`, `priority`)
SELECT id, '["metadata.set_number", "metadata.sku", "metadata.setNum"]', 'none', NULL, 10
FROM `primary_type_fields` WHERE `primary_type_id` = @type_toys AND `field_key` = 'set_number';

-- pieces
INSERT INTO `primary_type_key_to_field` (`field_id`, `api_keys`, `transform_type`, `transform_config`, `priority`)
SELECT id, '["metadata.pieces", "metadata.pieceCount", "metadata.num_parts"]', 'none', NULL, 10
FROM `primary_type_fields` WHERE `primary_type_id` = @type_toys AND `field_key` = 'pieces';

-- theme
INSERT INTO `primary_type_key_to_field` (`field_id`, `api_keys`, `transform_type`, `transform_config`, `priority`)
SELECT id, '["metadata.theme", "metadata.franchise"]', 'none', NULL, 10
FROM `primary_type_fields` WHERE `primary_type_id` = @type_toys AND `field_key` = 'theme';

-- year
INSERT INTO `primary_type_key_to_field` (`field_id`, `api_keys`, `transform_type`, `transform_config`, `priority`)
SELECT id, '["metadata.year"]', 'year_extract', NULL, 10
FROM `primary_type_fields` WHERE `primary_type_id` = @type_toys AND `field_key` = 'year';

-- age_range
INSERT INTO `primary_type_key_to_field` (`field_id`, `api_keys`, `transform_type`, `transform_config`, `priority`)
SELECT id, '["metadata.age_range", "metadata.ageRange"]', 'none', NULL, 10
FROM `primary_type_fields` WHERE `primary_type_id` = @type_toys AND `field_key` = 'age_range';

-- minifigs
INSERT INTO `primary_type_key_to_field` (`field_id`, `api_keys`, `transform_type`, `transform_config`, `priority`)
SELECT id, '["metadata.minifigs", "metadata.minifigures"]', 'none', NULL, 10
FROM `primary_type_fields` WHERE `primary_type_id` = @type_toys AND `field_key` = 'minifigs';

-- ============================================================================
-- VÉRIFICATION
-- ============================================================================

-- SELECT ptf.field_key, ptkf.api_keys, ptkf.transform_type 
-- FROM primary_type_key_to_field ptkf
-- JOIN primary_type_fields ptf ON ptkf.field_id = ptf.id
-- ORDER BY ptf.primary_type_id, ptf.sort_order;
