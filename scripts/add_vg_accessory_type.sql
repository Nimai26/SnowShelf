-- ============================================
-- Script SQL: Ajout du type "Accessoire de Jeu Vidéo" (vg_accessory)
-- Fournisseur par défaut: consolevariations_accessories (ID 38)
-- ============================================

-- 1. Créer le type primaire "vg_accessory"
INSERT INTO primary_type (name, name_fr, name_en, icon, color, webapi_type, sort_order)
VALUES ('vg_accessory', 'Accessoires de Jeu Vidéo', 'Video Game Accessories', '🎮', '#4CAF50', 'video_games', 13);

-- Récupérer l'ID du type créé (devrait être 13)
SET @vg_accessory_id = LAST_INSERT_ID();

-- 2. Associer consolevariations_accessories comme fournisseur par défaut
INSERT INTO primary_type_default_providers (primary_type_id, webapi_id, sort_order)
VALUES (@vg_accessory_id, 38, 0);

-- 3. Créer les champs spécifiques pour vg_accessory
-- Champs importables depuis ConsoleVariations API

INSERT INTO primary_type_fields 
(primary_type_id, field_key, field_name_fr, field_name_en, field_type, field_options, placeholder_fr, placeholder_en, is_required, sort_order, icon, help_text_fr, help_text_en)
VALUES

-- Type d'accessoire (manette, câble, adaptateur, etc.)
(@vg_accessory_id, 'accessory_type', 'Type d''accessoire', 'Accessory Type', 'select', 
 '{"options": ["Manette", "Câble", "Adaptateur", "Chargeur", "Carte mémoire", "Casque", "Volant", "Joystick", "Light Gun", "Caméra", "Microphone", "Extension", "Kit de réparation", "Skin/Coque", "Support", "Autre"]}',
 'Sélectionner le type', 'Select type', 0, 1, 'mdi:controller', 
 'Type d''accessoire (manette, câble, etc.)', 'Accessory type (controller, cable, etc.)'),

-- Plateforme compatible
(@vg_accessory_id, 'platform', 'Plateforme', 'Platform', 'text', NULL,
 'Ex: PlayStation 5, Nintendo Switch', 'Ex: PlayStation 5, Nintendo Switch', 0, 2, 'mdi:gamepad-variant',
 'Plateforme(s) compatible(s)', 'Compatible platform(s)'),

-- Fabricant
(@vg_accessory_id, 'manufacturer', 'Fabricant', 'Manufacturer', 'text', NULL,
 'Ex: Sony, Nintendo, Microsoft', 'Ex: Sony, Nintendo, Microsoft', 0, 3, 'mdi:factory',
 'Fabricant de l''accessoire', 'Accessory manufacturer'),

-- Année de sortie
(@vg_accessory_id, 'year', 'Année de sortie', 'Release Year', 'number', NULL,
 'Ex: 2023', 'Ex: 2023', 0, 4, 'mdi:calendar',
 'Année de commercialisation', 'Year of release'),

-- Pays de sortie
(@vg_accessory_id, 'release_country', 'Pays de sortie', 'Release Country', 'text', NULL,
 'Ex: Japan, USA, Europe', 'Ex: Japan, USA, Europe', 0, 5, 'mdi:earth',
 'Pays ou région de commercialisation', 'Country or region of release'),

-- Code région
(@vg_accessory_id, 'region_code', 'Code région', 'Region Code', 'select',
 '{"options": ["PAL", "NTSC", "NTSC-J", "NTSC-U", "Region Free", "Multi-Region"]}',
 NULL, NULL, 0, 6, 'mdi:map-marker',
 'Code région de l''accessoire', 'Accessory region code'),

-- Couleur
(@vg_accessory_id, 'color', 'Couleur', 'Color', 'text', NULL,
 'Ex: Noir, Blanc, Rouge', 'Ex: Black, White, Red', 0, 7, 'mdi:palette',
 'Couleur principale', 'Main color'),

-- Numéro de modèle
(@vg_accessory_id, 'model_number', 'N° de modèle', 'Model Number', 'text', NULL,
 'Ex: CFI-ZCT1W', 'Ex: CFI-ZCT1W', 0, 8, 'mdi:identifier',
 'Référence ou numéro de modèle', 'Model number or reference'),

-- Connectivité (filaire, sans fil, etc.)
(@vg_accessory_id, 'connectivity', 'Connectivité', 'Connectivity', 'select',
 '{"options": ["Filaire", "Sans fil", "Bluetooth", "USB", "Propriétaire", "Infrarouge", "Hybride"]}',
 NULL, NULL, 0, 9, 'mdi:connection',
 'Type de connexion', 'Connection type'),

-- Officiel ou tiers
(@vg_accessory_id, 'is_official', 'Officiel', 'Official', 'select',
 '{"options": ["Oui", "Non"]}',
 NULL, NULL, 0, 10, 'mdi:check-decagram',
 'Accessoire officiel ou tiers', 'Official or third-party accessory'),

-- Bundle
(@vg_accessory_id, 'is_bundle', 'Bundle', 'Bundle', 'select',
 '{"options": ["Oui", "Non"]}',
 NULL, NULL, 0, 11, 'mdi:package-variant',
 'Fait partie d''un bundle', 'Part of a bundle'),

-- Édition limitée
(@vg_accessory_id, 'limited_edition', 'Édition limitée', 'Limited Edition', 'select',
 '{"options": ["Oui", "Non"]}',
 NULL, NULL, 0, 12, 'mdi:star',
 'Édition spéciale ou limitée', 'Special or limited edition'),

-- Score de rareté
(@vg_accessory_id, 'rarity_score', 'Score de rareté', 'Rarity Score', 'number', NULL,
 'Ex: 75', 'Ex: 75', 0, 13, 'mdi:diamond-stone',
 'Score de rareté (0-100)', 'Rarity score (0-100)'),

-- ========================================
-- Champs d'état (gérés par l'utilisateur)
-- ========================================

-- Testé
(@vg_accessory_id, 'tested', 'Testé', 'Tested', 'select',
 '{"options": ["Oui", "Non"]}',
 NULL, NULL, 0, 20, 'mdi:clipboard-check',
 'L''accessoire a été testé', 'The accessory has been tested'),

-- Fonctionnel
(@vg_accessory_id, 'working', 'Fonctionnel', 'Working', 'select',
 '{"options": ["Oui", "Non"]}',
 NULL, NULL, 0, 21, 'mdi:check-circle',
 'L''accessoire fonctionne correctement', 'The accessory works properly'),

-- Endommagé
(@vg_accessory_id, 'damaged', 'Endommagé', 'Damaged', 'select',
 '{"options": ["Oui", "Non"]}',
 NULL, NULL, 0, 22, 'mdi:alert-circle',
 'L''accessoire présente des dommages', 'The accessory has damage'),

-- Complet
(@vg_accessory_id, 'complete', 'Complet', 'Complete', 'select',
 '{"options": ["Oui", "Non"]}',
 NULL, NULL, 0, 23, 'mdi:package-variant-closed-check',
 'Tous les éléments sont présents (câbles, boîte, etc.)', 'All elements are present (cables, box, etc.)');

-- 4. Vérification
SELECT 'Type primaire créé:' AS info;
SELECT id, name, name_fr, webapi_type, icon FROM primary_type WHERE name = 'vg_accessory';

SELECT 'Fournisseur par défaut:' AS info;
SELECT pt.name, wa.name AS provider_name, wa.Name_UF 
FROM primary_type_default_providers pdp
JOIN primary_type pt ON pt.id = pdp.primary_type_id
JOIN Admin_webApi wa ON wa.id = pdp.webapi_id
WHERE pt.name = 'vg_accessory';

SELECT 'Champs créés:' AS info;
SELECT field_key, field_name_fr, field_type FROM primary_type_fields 
WHERE primary_type_id = (SELECT id FROM primary_type WHERE name = 'vg_accessory')
ORDER BY sort_order;
