-- ============================================================================
-- Migration : Système de Mapping Métadonnées Dynamique
-- Date : 2025-12-18
-- Description : Création de la nouvelle structure pour les mappings API
-- ============================================================================

-- Désactiver les vérifications FK temporairement
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================================
-- ÉTAPE 1 : Créer la nouvelle table primary_type_key_to_field
-- ============================================================================

CREATE TABLE IF NOT EXISTS `primary_type_key_to_field` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `field_id` INT NOT NULL COMMENT 'FK vers primary_type_fields.id',
    `api_keys` JSON NOT NULL COMMENT 'Liste des clés API à chercher ["metadata.stars", "metadata.actors"]',
    `transform_type` VARCHAR(50) DEFAULT NULL COMMENT 'Type de transformation à appliquer',
    `transform_config` JSON DEFAULT NULL COMMENT 'Configuration de la transformation',
    `priority` INT DEFAULT 0 COMMENT 'Ordre de priorité (plus haut = prioritaire)',
    `is_active` TINYINT(1) DEFAULT 1 COMMENT 'Mapping actif ou non',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    CONSTRAINT `fk_mapping_field` FOREIGN KEY (`field_id`) 
        REFERENCES `primary_type_fields`(`id`) ON DELETE CASCADE,
    
    INDEX `idx_field_id` (`field_id`),
    INDEX `idx_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Mappings entre clés API et champs de métadonnées';

-- ============================================================================
-- ÉTAPE 2 : Ajouter la colonne lang (JSON) à primary_type_fields
-- ============================================================================

ALTER TABLE `primary_type_fields` 
ADD COLUMN `lang` JSON DEFAULT NULL COMMENT 'Traductions {"fr":{"name":"","placeholder":"","help":""},"en":{...}}' 
AFTER `icon`;

-- ============================================================================
-- ÉTAPE 3 : Migrer les données i18n existantes vers le format JSON
-- ============================================================================

UPDATE `primary_type_fields` 
SET `lang` = JSON_OBJECT(
    'fr', JSON_OBJECT(
        'name', COALESCE(field_name_fr, ''),
        'placeholder', COALESCE(placeholder_fr, ''),
        'help', COALESCE(help_text_fr, '')
    ),
    'en', JSON_OBJECT(
        'name', COALESCE(field_name_en, ''),
        'placeholder', COALESCE(placeholder_en, ''),
        'help', COALESCE(help_text_en, '')
    )
);

-- ============================================================================
-- ÉTAPE 4 : Supprimer les anciennes colonnes i18n
-- ============================================================================

ALTER TABLE `primary_type_fields`
DROP COLUMN `field_name_fr`,
DROP COLUMN `field_name_en`,
DROP COLUMN `placeholder_fr`,
DROP COLUMN `placeholder_en`,
DROP COLUMN `help_text_fr`,
DROP COLUMN `help_text_en`;

-- ============================================================================
-- ÉTAPE 5 : Créer la table des types de transformation
-- ============================================================================

CREATE TABLE IF NOT EXISTS `field_transform_types` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `type_key` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Clé technique du transform',
    `lang` JSON NOT NULL COMMENT 'Traductions {"fr":{"name":"","description":""},"en":{...}}',
    `config_schema` JSON DEFAULT NULL COMMENT 'Schéma JSON de la config attendue',
    `is_system` TINYINT(1) DEFAULT 0 COMMENT 'Transform système (non supprimable)',
    `sort_order` INT DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Types de transformation disponibles';

-- Insérer les types de transformation de base
INSERT INTO `field_transform_types` (`type_key`, `lang`, `config_schema`, `is_system`, `sort_order`) VALUES
('none', '{"fr":{"name":"Aucune","description":"Pas de transformation"},"en":{"name":"None","description":"No transformation"}}', NULL, 1, 0),
('status_mapping', '{"fr":{"name":"Mapping statut","description":"Convertit les statuts anglais en français"},"en":{"name":"Status mapping","description":"Converts English status to French"}}', '{"type":"object","properties":{"mappings":{"type":"object","description":"Clé=valeur anglaise, Valeur=traduction"}}}', 1, 10),
('year_extract', '{"fr":{"name":"Extraction année","description":"Extrait l\'année d\'une date ou chaîne"},"en":{"name":"Year extract","description":"Extracts year from date or string"}}', NULL, 1, 20),
('array_join', '{"fr":{"name":"Joindre tableau","description":"Convertit un tableau en chaîne avec séparateur"},"en":{"name":"Join array","description":"Converts array to string with separator"}}', '{"type":"object","properties":{"separator":{"type":"string","default":", "}}}', 1, 30),
('first_value', '{"fr":{"name":"Première valeur","description":"Prend la première valeur d\'un tableau"},"en":{"name":"First value","description":"Takes first value from array"}}', NULL, 1, 40),
('boolean_fr', '{"fr":{"name":"Booléen français","description":"Convertit true/false en Oui/Non"},"en":{"name":"French boolean","description":"Converts true/false to Oui/Non"}}', NULL, 1, 50),
('pegi_normalize', '{"fr":{"name":"Normaliser PEGI","description":"Normalise les classifications d\'âge vers PEGI"},"en":{"name":"Normalize PEGI","description":"Normalizes age ratings to PEGI"}}', NULL, 1, 60),
('duration_format', '{"fr":{"name":"Format durée","description":"Formate une durée en minutes"},"en":{"name":"Duration format","description":"Formats duration in minutes"}}', '{"type":"object","properties":{"unit":{"type":"string","enum":["minutes","hours"],"default":"minutes"},"suffix":{"type":"string","default":" min"}}}', 1, 70);

-- Réactiver les vérifications FK
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- VÉRIFICATION
-- ============================================================================

-- Afficher la structure finale
-- DESCRIBE primary_type_fields;
-- DESCRIBE primary_type_key_to_field;
-- DESCRIBE field_transform_types;
-- SELECT * FROM field_transform_types;
