-- ============================================
-- Script SQL pour ajouter les champs du type primaire vg_plat (Plateformes de jeux vidéo / Consoles)
-- À exécuter sur la base snowshelf
-- ============================================

-- Vérifier d'abord que le type primaire vg_plat existe et récupérer son ID
-- SELECT id, name FROM primary_type WHERE name = 'vg_plat';
-- L'ID devrait être 12 selon les logs

-- Variable pour l'ID du type primaire (à ajuster si nécessaire)
SET @vg_plat_id = 12;

-- ============================================
-- CHAMPS IMPORTABLES DEPUIS L'API (ConsoleVariations)
-- ============================================

-- Plateforme (ex: PlayStation 5, Nintendo Switch)
INSERT INTO primary_type_fields (primary_type_id, field_key, field_name_fr, field_name_en, field_type, field_options, placeholder_fr, placeholder_en, is_required, sort_order, icon, help_text_fr, help_text_en)
VALUES (@vg_plat_id, 'platform', 'Plateforme', 'Platform', 'text', NULL, 'Ex: PlayStation 5', 'Ex: PlayStation 5', 0, 10, '🎮', 'Nom de la plateforme ou console', 'Platform or console name')
ON DUPLICATE KEY UPDATE field_name_fr = VALUES(field_name_fr), field_name_en = VALUES(field_name_en);

-- Fabricant (ex: Sony, Nintendo, Microsoft)
INSERT INTO primary_type_fields (primary_type_id, field_key, field_name_fr, field_name_en, field_type, field_options, placeholder_fr, placeholder_en, is_required, sort_order, icon, help_text_fr, help_text_en)
VALUES (@vg_plat_id, 'manufacturer', 'Fabricant', 'Manufacturer', 'text', NULL, 'Ex: Sony, Nintendo', 'Ex: Sony, Nintendo', 0, 20, '🏭', 'Fabricant de la console', 'Console manufacturer')
ON DUPLICATE KEY UPDATE field_name_fr = VALUES(field_name_fr), field_name_en = VALUES(field_name_en);

-- Année de sortie
INSERT INTO primary_type_fields (primary_type_id, field_key, field_name_fr, field_name_en, field_type, field_options, placeholder_fr, placeholder_en, is_required, sort_order, icon, help_text_fr, help_text_en)
VALUES (@vg_plat_id, 'year', 'Année de sortie', 'Release Year', 'number', NULL, 'Ex: 2020', 'Ex: 2020', 0, 30, '📅', 'Année de sortie de cette version', 'Release year for this version')
ON DUPLICATE KEY UPDATE field_name_fr = VALUES(field_name_fr), field_name_en = VALUES(field_name_en);

-- Pays de sortie
INSERT INTO primary_type_fields (primary_type_id, field_key, field_name_fr, field_name_en, field_type, field_options, placeholder_fr, placeholder_en, is_required, sort_order, icon, help_text_fr, help_text_en)
VALUES (@vg_plat_id, 'release_country', 'Pays de sortie', 'Release Country', 'text', NULL, 'Ex: France, Japan', 'Ex: France, Japan', 0, 40, '🌍', 'Pays où cette version a été commercialisée', 'Country where this version was released')
ON DUPLICATE KEY UPDATE field_name_fr = VALUES(field_name_fr), field_name_en = VALUES(field_name_en);

-- Code région (PAL, NTSC, Region Free)
INSERT INTO primary_type_fields (primary_type_id, field_key, field_name_fr, field_name_en, field_type, field_options, placeholder_fr, placeholder_en, is_required, sort_order, icon, help_text_fr, help_text_en)
VALUES (@vg_plat_id, 'region_code', 'Code région', 'Region Code', 'select', '{"options": ["PAL", "NTSC", "NTSC-J", "NTSC-U", "Region Free", "Multi-Region"]}', NULL, NULL, 0, 50, '🌐', 'Code région de la console', 'Console region code')
ON DUPLICATE KEY UPDATE field_name_fr = VALUES(field_name_fr), field_name_en = VALUES(field_name_en);

-- Type de sortie (Official, Limited Edition, Bundle, etc.)
INSERT INTO primary_type_fields (primary_type_id, field_key, field_name_fr, field_name_en, field_type, field_options, placeholder_fr, placeholder_en, is_required, sort_order, icon, help_text_fr, help_text_en)
VALUES (@vg_plat_id, 'release_type', 'Type de sortie', 'Release Type', 'select', '{"options": ["Official", "Limited Edition", "Special Edition", "Bundle", "Prototype", "Dev Kit", "Unofficial"]}', NULL, NULL, 0, 60, '📦', 'Type de commercialisation', 'Release type')
ON DUPLICATE KEY UPDATE field_name_fr = VALUES(field_name_fr), field_name_en = VALUES(field_name_en);

-- Couleur
INSERT INTO primary_type_fields (primary_type_id, field_key, field_name_fr, field_name_en, field_type, field_options, placeholder_fr, placeholder_en, is_required, sort_order, icon, help_text_fr, help_text_en)
VALUES (@vg_plat_id, 'color', 'Couleur', 'Color', 'text', NULL, 'Ex: Noir, Blanc', 'Ex: Black, White', 0, 70, '🎨', 'Couleur de la console', 'Console color')
ON DUPLICATE KEY UPDATE field_name_fr = VALUES(field_name_fr), field_name_en = VALUES(field_name_en);

-- Bundle (oui/non)
INSERT INTO primary_type_fields (primary_type_id, field_key, field_name_fr, field_name_en, field_type, field_options, placeholder_fr, placeholder_en, is_required, sort_order, icon, help_text_fr, help_text_en)
VALUES (@vg_plat_id, 'is_bundle', 'Bundle', 'Bundle', 'select', '{"options": ["Oui", "Non"]}', NULL, NULL, 0, 80, '📦', 'Est-ce un pack/bundle avec jeux ou accessoires ?', 'Is this a bundle with games or accessories?')
ON DUPLICATE KEY UPDATE field_name_fr = VALUES(field_name_fr), field_name_en = VALUES(field_name_en);

-- Édition limitée (oui/non)
INSERT INTO primary_type_fields (primary_type_id, field_key, field_name_fr, field_name_en, field_type, field_options, placeholder_fr, placeholder_en, is_required, sort_order, icon, help_text_fr, help_text_en)
VALUES (@vg_plat_id, 'limited_edition', 'Édition limitée', 'Limited Edition', 'select', '{"options": ["Oui", "Non"]}', NULL, NULL, 0, 90, '⭐', 'Est-ce une édition limitée ?', 'Is this a limited edition?')
ON DUPLICATE KEY UPDATE field_name_fr = VALUES(field_name_fr), field_name_en = VALUES(field_name_en);

-- Quantité produite
INSERT INTO primary_type_fields (primary_type_id, field_key, field_name_fr, field_name_en, field_type, field_options, placeholder_fr, placeholder_en, is_required, sort_order, icon, help_text_fr, help_text_en)
VALUES (@vg_plat_id, 'amount_produced', 'Quantité produite', 'Amount Produced', 'number', NULL, 'Ex: 5000', 'Ex: 5000', 0, 100, '🔢', 'Nombre d\'unités produites (si connu)', 'Number of units produced (if known)')
ON DUPLICATE KEY UPDATE field_name_fr = VALUES(field_name_fr), field_name_en = VALUES(field_name_en);

-- Score de rareté
INSERT INTO primary_type_fields (primary_type_id, field_key, field_name_fr, field_name_en, field_type, field_options, placeholder_fr, placeholder_en, is_required, sort_order, icon, help_text_fr, help_text_en)
VALUES (@vg_plat_id, 'rarity_score', 'Score de rareté', 'Rarity Score', 'number', NULL, '1-10', '1-10', 0, 110, '💎', 'Score de rareté (1 = commun, 10 = très rare)', 'Rarity score (1 = common, 10 = very rare)')
ON DUPLICATE KEY UPDATE field_name_fr = VALUES(field_name_fr), field_name_en = VALUES(field_name_en);

-- ============================================
-- CHAMPS DE GESTION DE COLLECTION (sélecteurs)
-- Ces champs sont gérés par l'utilisateur, pas importés
-- ============================================

-- Testé (oui/non)
INSERT INTO primary_type_fields (primary_type_id, field_key, field_name_fr, field_name_en, field_type, field_options, placeholder_fr, placeholder_en, is_required, sort_order, icon, help_text_fr, help_text_en)
VALUES (@vg_plat_id, 'tested', 'Testé', 'Tested', 'select', '{"options": ["Oui", "Non"]}', NULL, NULL, 0, 200, '🔍', 'Avez-vous testé cette console ?', 'Have you tested this console?')
ON DUPLICATE KEY UPDATE field_name_fr = VALUES(field_name_fr), field_name_en = VALUES(field_name_en);

-- Fonctionnel (oui/non)
INSERT INTO primary_type_fields (primary_type_id, field_key, field_name_fr, field_name_en, field_type, field_options, placeholder_fr, placeholder_en, is_required, sort_order, icon, help_text_fr, help_text_en)
VALUES (@vg_plat_id, 'working', 'Fonctionnel', 'Working', 'select', '{"options": ["Oui", "Non"]}', NULL, NULL, 0, 210, '✅', 'La console fonctionne-t-elle ?', 'Is the console working?')
ON DUPLICATE KEY UPDATE field_name_fr = VALUES(field_name_fr), field_name_en = VALUES(field_name_en);

-- Joué (utilisé) (oui/non)
INSERT INTO primary_type_fields (primary_type_id, field_key, field_name_fr, field_name_en, field_type, field_options, placeholder_fr, placeholder_en, is_required, sort_order, icon, help_text_fr, help_text_en)
VALUES (@vg_plat_id, 'played', 'Utilisé', 'Used', 'select', '{"options": ["Oui", "Non"]}', NULL, NULL, 0, 220, '🎮', 'Utilisez-vous cette console ?', 'Do you use this console?')
ON DUPLICATE KEY UPDATE field_name_fr = VALUES(field_name_fr), field_name_en = VALUES(field_name_en);

-- Endommagé (oui/non)
INSERT INTO primary_type_fields (primary_type_id, field_key, field_name_fr, field_name_en, field_type, field_options, placeholder_fr, placeholder_en, is_required, sort_order, icon, help_text_fr, help_text_en)
VALUES (@vg_plat_id, 'damaged', 'Endommagé', 'Damaged', 'select', '{"options": ["Oui", "Non"]}', NULL, NULL, 0, 230, '💔', 'La console est-elle endommagée ?', 'Is the console damaged?')
ON DUPLICATE KEY UPDATE field_name_fr = VALUES(field_name_fr), field_name_en = VALUES(field_name_en);

-- Complet (oui/non) - avec boîte, câbles, manettes d'origine
INSERT INTO primary_type_fields (primary_type_id, field_key, field_name_fr, field_name_en, field_type, field_options, placeholder_fr, placeholder_en, is_required, sort_order, icon, help_text_fr, help_text_en)
VALUES (@vg_plat_id, 'complete', 'Complet', 'Complete', 'select', '{"options": ["Oui", "Non"]}', NULL, NULL, 0, 240, '📦', 'La console est-elle complète (boîte, câbles, manettes) ?', 'Is the console complete (box, cables, controllers)?')
ON DUPLICATE KEY UPDATE field_name_fr = VALUES(field_name_fr), field_name_en = VALUES(field_name_en);

-- ============================================
-- Vérification des champs ajoutés
-- ============================================
-- SELECT * FROM primary_type_fields WHERE primary_type_id = @vg_plat_id ORDER BY sort_order;
