/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19  Distrib 10.11.14-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: 10.110.1.1    Database: snowshelf
-- ------------------------------------------------------
-- Server version	11.4.8-MariaDB-log

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `primary_type_fields`
--

DROP TABLE IF EXISTS `primary_type_fields`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `primary_type_fields` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `primary_type_id` int(11) NOT NULL,
  `field_key` varchar(50) NOT NULL,
  `field_name_fr` varchar(100) NOT NULL,
  `field_name_en` varchar(100) NOT NULL,
  `field_type` enum('text','textarea','number','date','select','multiselect','url','year','rating','duration') DEFAULT 'text',
  `field_options` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`field_options`)),
  `placeholder_fr` varchar(255) DEFAULT NULL,
  `placeholder_en` varchar(255) DEFAULT NULL,
  `is_required` tinyint(1) DEFAULT 0,
  `sort_order` int(11) DEFAULT 0,
  `icon` varchar(50) DEFAULT NULL,
  `help_text_fr` varchar(255) DEFAULT NULL,
  `help_text_en` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_field` (`primary_type_id`,`field_key`),
  CONSTRAINT `primary_type_fields_ibfk_1` FOREIGN KEY (`primary_type_id`) REFERENCES `primary_type` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=181 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `primary_type_fields`
--

LOCK TABLES `primary_type_fields` WRITE;
/*!40000 ALTER TABLE `primary_type_fields` DISABLE KEYS */;
INSERT INTO `primary_type_fields` VALUES
(1,8,'brand','Marque','Brand','text',NULL,'Ex: Sony, Nintendo...','Ex: Sony, Nintendo...',0,1,'🏭',NULL,NULL,'2025-12-08 18:32:35'),
(2,8,'model','Modèle','Model','text',NULL,'Référence ou modèle','Reference or model',0,2,'📋',NULL,NULL,'2025-12-08 18:32:35'),
(3,8,'year','Année','Year','year',NULL,'YYYY','YYYY',0,3,'📅',NULL,NULL,'2025-12-08 18:32:35'),
(4,8,'origin_country','Pays d\'origine','Country of origin','text',NULL,'Ex: Japon, USA...','Ex: Japan, USA...',0,4,'🌍',NULL,NULL,'2025-12-08 18:32:35'),
(5,8,'material','Matériau','Material','text',NULL,'Ex: Plastique, Métal...','Ex: Plastic, Metal...',0,5,'🧱',NULL,NULL,'2025-12-08 18:32:35'),
(6,8,'dimensions','Dimensions','Dimensions','text',NULL,'L x l x H cm','L x W x H cm',0,6,'📐',NULL,NULL,'2025-12-08 18:32:35'),
(7,8,'weight','Poids','Weight','text',NULL,'Ex: 500g, 1.2kg','Ex: 500g, 1.2kg',0,7,'⚖️',NULL,NULL,'2025-12-08 18:32:35'),
(8,8,'serial_number','Numéro de série','Serial number','text',NULL,'S/N ou référence unique','S/N or unique reference',0,8,'🔢',NULL,NULL,'2025-12-08 18:32:35'),
(9,1,'author','Auteur','Author','text',NULL,'Nom de l\'auteur','Author name',0,1,'✍️',NULL,NULL,'2025-12-08 18:32:35'),
(10,1,'isbn','ISBN','ISBN','text',NULL,'ISBN-10 ou ISBN-13','ISBN-10 or ISBN-13',0,2,'📖',NULL,NULL,'2025-12-08 18:32:35'),
(11,1,'publisher','Éditeur','Publisher','text',NULL,'Maison d\'édition','Publishing house',0,3,'🏢',NULL,NULL,'2025-12-08 18:32:35'),
(12,1,'year','Année de publication','Publication year','year',NULL,'YYYY','YYYY',0,4,'📅',NULL,NULL,'2025-12-08 18:32:35'),
(13,1,'pages','Nombre de pages','Number of pages','number',NULL,'Ex: 350','Ex: 350',0,5,'📄',NULL,NULL,'2025-12-08 18:32:35'),
(14,1,'language','Langue','Language','text',NULL,'Ex: Français, Anglais','Ex: French, English',0,6,'🌐',NULL,NULL,'2025-12-08 18:32:35'),
(15,1,'genre','Genre','Genre','text',NULL,'Ex: Fantasy, Policier','Ex: Fantasy, Crime',0,7,'🏷️',NULL,NULL,'2025-12-08 18:32:35'),
(16,1,'series','Série/Collection','Series/Collection','text',NULL,'Nom de la série','Series name',0,8,'📚',NULL,NULL,'2025-12-08 18:32:35'),
(17,1,'volume','Tome/Volume','Volume','number',NULL,'Ex: 1, 2, 3...','Ex: 1, 2, 3...',0,9,'🔢',NULL,NULL,'2025-12-08 18:32:35'),
(18,1,'format','Format','Format','select','[\"Broch\\u00e9\",\"Reli\\u00e9\",\"Poche\",\"Ebook\",\"Audio\"]',NULL,NULL,0,10,'📏',NULL,NULL,'2025-12-08 18:32:35'),
(19,2,'platform','Plateforme','Platform','text',NULL,'Ex: PS5, Switch, PC','Ex: PS5, Switch, PC',0,1,'🎮',NULL,NULL,'2025-12-08 18:32:35'),
(20,2,'developer','Développeur','Developer','text',NULL,'Studio de développement','Development studio',0,2,'💻',NULL,NULL,'2025-12-08 18:32:35'),
(21,2,'publisher','Éditeur','Publisher','text',NULL,'Éditeur du jeu','Game publisher',0,3,'🏢',NULL,NULL,'2025-12-08 18:32:35'),
(22,2,'year','Année de sortie','Release year','year',NULL,'YYYY','YYYY',0,4,'📅',NULL,NULL,'2025-12-08 18:32:35'),
(23,2,'genre','Genre','Genre','text',NULL,'Ex: RPG, Action, FPS','Ex: RPG, Action, FPS',0,5,'��️',NULL,NULL,'2025-12-08 18:32:35'),
(24,2,'pegi','Classification PEGI','PEGI Rating','select','[\"PEGI 3\",\"PEGI 7\",\"PEGI 12\",\"PEGI 16\",\"PEGI 18\"]',NULL,NULL,0,6,'🔞',NULL,NULL,'2025-12-08 18:32:35'),
(25,2,'region','Région','Region','select','[\"PAL\",\"NTSC-U\",\"NTSC-J\",\"Region Free\"]',NULL,NULL,0,7,'🌍',NULL,NULL,'2025-12-08 18:32:35'),
(26,2,'multiplayer','Multijoueur','Multiplayer','select','[\"Non\",\"Local\",\"En ligne\",\"Local + En ligne\"]',NULL,NULL,0,8,'👥',NULL,NULL,'2025-12-08 18:32:35'),
(27,2,'language','Langue','Language','text',NULL,'Langues disponibles','Available languages',0,9,'🌐',NULL,NULL,'2025-12-08 18:32:35'),
(28,2,'edition','Édition','Edition','text',NULL,'Ex: Collector, GOTY','Ex: Collector, GOTY',0,10,'⭐',NULL,NULL,'2025-12-08 18:32:35'),
(29,3,'artist','Artiste','Artist','text',NULL,'Nom de l\'artiste/groupe','Artist/band name',0,1,'🎤',NULL,NULL,'2025-12-08 18:32:35'),
(30,3,'album','Album','Album','text',NULL,'Titre de l\'album','Album title',0,2,'💿',NULL,NULL,'2025-12-08 18:32:35'),
(31,3,'label','Label','Label','text',NULL,'Maison de disques','Record label',0,3,'🏢',NULL,NULL,'2025-12-08 18:32:35'),
(32,3,'year','Année de sortie','Release year','year',NULL,'YYYY','YYYY',0,4,'��',NULL,NULL,'2025-12-08 18:32:35'),
(33,3,'genre','Genre','Genre','text',NULL,'Ex: Rock, Jazz, Classique','Ex: Rock, Jazz, Classical',0,5,'🏷️',NULL,NULL,'2025-12-08 18:32:35'),
(34,3,'format','Format','Format','select','[\"CD\",\"Vinyle 33T\",\"Vinyle 45T\",\"Cassette\",\"Num\\u00e9rique\",\"Blu-ray Audio\"]',NULL,NULL,0,6,'📀',NULL,NULL,'2025-12-08 18:32:35'),
(35,3,'tracks','Nombre de pistes','Number of tracks','number',NULL,'Ex: 12','Ex: 12',0,7,'🎵',NULL,NULL,'2025-12-08 18:32:35'),
(36,3,'duration','Durée totale','Total duration','text',NULL,'Ex: 45:30','Ex: 45:30',0,8,'⏱️',NULL,NULL,'2025-12-08 18:32:35'),
(37,3,'edition','Édition','Edition','text',NULL,'Ex: Deluxe, Remaster','Ex: Deluxe, Remaster',0,9,'⭐',NULL,NULL,'2025-12-08 18:32:35'),
(38,4,'director','Réalisateur','Director','text',NULL,'Nom du réalisateur','Director name',0,1,'🎬',NULL,NULL,'2025-12-08 18:33:21'),
(39,4,'actors','Acteurs principaux','Main actors','textarea',NULL,'Acteurs séparés par des virgules','Actors separated by commas',0,2,'🎭',NULL,NULL,'2025-12-08 18:33:21'),
(40,4,'year','Année de sortie','Release year','year',NULL,'YYYY','YYYY',0,3,'📅',NULL,NULL,'2025-12-08 18:33:21'),
(41,4,'duration','Durée','Duration','number',NULL,'Durée en minutes','Duration in minutes',0,4,'⏱️','En minutes','In minutes','2025-12-08 18:33:21'),
(42,4,'genre','Genre','Genre','text',NULL,'Ex: Action, Comédie','Ex: Action, Comedy',0,5,'🏷️',NULL,NULL,'2025-12-08 18:33:21'),
(43,4,'language','Langue originale','Original language','text',NULL,'Ex: Anglais','Ex: English',0,6,'🌐',NULL,NULL,'2025-12-08 18:33:21'),
(44,4,'subtitles','Sous-titres','Subtitles','text',NULL,'Langues disponibles','Available languages',0,7,'💬',NULL,NULL,'2025-12-08 18:33:21'),
(45,4,'format','Format','Format','select','[\"DVD\",\"Blu-ray\",\"Blu-ray 4K\",\"VHS\",\"Laserdisc\",\"Super 8\",\"Num\\u00e9rique\",\"Steelbook\"]',NULL,NULL,0,8,'📀',NULL,NULL,'2025-12-08 18:33:21'),
(46,4,'studio','Studio','Studio','text',NULL,'Studio de production','Production studio',0,9,'🏢',NULL,NULL,'2025-12-08 18:33:21'),
(47,4,'rating','Classification','Rating','select','[\"Tous publics\",\"-10\",\"-12\",\"-16\",\"-18\"]',NULL,NULL,0,10,'��',NULL,NULL,'2025-12-08 18:33:21'),
(48,5,'creator','Créateur','Creator','text',NULL,'Créateur de la série','Series creator',0,1,'✍️',NULL,NULL,'2025-12-08 18:33:21'),
(49,5,'actors','Acteurs principaux','Main actors','textarea',NULL,'Acteurs séparés par des virgules','Actors separated by commas',0,2,'🎭',NULL,NULL,'2025-12-08 18:33:21'),
(50,5,'season','Saison','Season','number',NULL,'Numéro de saison','Season number',0,3,'📺',NULL,NULL,'2025-12-08 18:33:21'),
(51,5,'episodes','Nombre d\'épisodes','Number of episodes','number',NULL,'Épisodes dans cette saison','Episodes in this season',0,4,'🔢',NULL,NULL,'2025-12-08 18:33:21'),
(52,5,'year_start','Année de début','Start year','year',NULL,'YYYY','YYYY',0,5,'📅',NULL,NULL,'2025-12-08 18:33:21'),
(53,5,'year_end','Année de fin','End year','year',NULL,'YYYY (vide si en cours)','YYYY (empty if ongoing)',0,6,'🏁',NULL,NULL,'2025-12-08 18:33:21'),
(54,5,'genre','Genre','Genre','text',NULL,'Ex: Drame, Comédie','Ex: Drama, Comedy',0,7,'🏷️',NULL,NULL,'2025-12-08 18:33:21'),
(55,5,'network','Chaîne/Plateforme','Network/Platform','text',NULL,'Ex: Netflix, HBO','Ex: Netflix, HBO',0,8,'📡',NULL,NULL,'2025-12-08 18:33:21'),
(56,5,'format','Format','Format','select','[\"DVD\",\"Blu-ray\",\"Blu-ray 4K\",\"VHS\",\"Laserdisc\",\"Super 8\",\"Num\\u00e9rique\"]',NULL,NULL,0,9,'📀',NULL,NULL,'2025-12-08 18:33:21'),
(57,5,'status','Statut','Status','select','[\"En cours\",\"Termin\\u00e9e\",\"Annul\\u00e9e\"]',NULL,NULL,0,10,'📊',NULL,NULL,'2025-12-08 18:33:21'),
(58,6,'manufacturer','Fabricant','Manufacturer','text',NULL,'Ex: Bandai, Hasbro','Ex: Bandai, Hasbro',0,1,'🏭',NULL,NULL,'2025-12-08 18:33:21'),
(59,6,'scale','Échelle','Scale','text',NULL,'Ex: 1/6, 1/12','Ex: 1/6, 1/12',0,2,'📏',NULL,NULL,'2025-12-08 18:33:21'),
(60,6,'material','Matériau','Material','select','[\"PVC\",\"ABS\",\"Die-cast\",\"R\\u00e9sine\",\"Vinyle\",\"Mixte\"]',NULL,NULL,0,3,'🧱',NULL,NULL,'2025-12-08 18:33:21'),
(61,6,'license','Licence','License','text',NULL,'Ex: Marvel, Star Wars','Ex: Marvel, Star Wars',0,4,'©️',NULL,NULL,'2025-12-08 18:33:21'),
(62,6,'character','Personnage','Character','text',NULL,'Nom du personnage','Character name',0,5,'🦸',NULL,NULL,'2025-12-08 18:33:21'),
(63,6,'series','Série/Gamme','Series/Line','text',NULL,'Ex: S.H.Figuarts, Hot Toys','Ex: S.H.Figuarts, Hot Toys',0,6,'📦',NULL,NULL,'2025-12-08 18:33:21'),
(64,6,'year','Année de sortie','Release year','year',NULL,'YYYY','YYYY',0,7,'📅',NULL,NULL,'2025-12-08 18:33:21'),
(65,6,'height','Hauteur','Height','text',NULL,'Ex: 15cm, 30cm','Ex: 15cm, 30cm',0,8,'📐',NULL,NULL,'2025-12-08 18:33:21'),
(66,6,'articulations','Points d\'articulation','Articulation points','number',NULL,'Nombre d\'articulations','Number of joints',0,9,'🔄',NULL,NULL,'2025-12-08 18:33:21'),
(67,6,'accessories','Accessoires','Accessories','textarea',NULL,'Liste des accessoires','List of accessories',0,10,'🎁',NULL,NULL,'2025-12-08 18:33:21'),
(68,6,'edition','Édition','Edition','text',NULL,'Ex: Limited, Exclusive','Ex: Limited, Exclusive',0,11,'⭐',NULL,NULL,'2025-12-08 18:33:21'),
(69,7,'brand','Marque','Brand','text',NULL,'Ex: LEGO, Mega Construx','Ex: LEGO, Mega Construx',0,1,'🏭',NULL,NULL,'2025-12-08 18:33:21'),
(70,7,'set_number','Numéro du set','Set number','text',NULL,'Référence officielle','Official reference',0,2,'🔢',NULL,NULL,'2025-12-08 18:33:21'),
(71,7,'pieces','Nombre de pièces','Number of pieces','number',NULL,'Ex: 2500','Ex: 2500',0,3,'🧱',NULL,NULL,'2025-12-08 18:33:21'),
(72,7,'theme','Thème','Theme','text',NULL,'Ex: Star Wars, City','Ex: Star Wars, City',0,4,'🏷️',NULL,NULL,'2025-12-08 18:33:21'),
(73,7,'year','Année de sortie','Release year','year',NULL,'YYYY','YYYY',0,5,'📅',NULL,NULL,'2025-12-08 18:33:21'),
(74,7,'age','Âge recommandé','Recommended age','text',NULL,'Ex: 16+, 8-12','Ex: 16+, 8-12',0,6,'👶',NULL,NULL,'2025-12-08 18:33:21'),
(75,7,'minifigs','Minifigurines','Minifigures','number',NULL,'Nombre inclus','Number included',0,7,'🧍',NULL,NULL,'2025-12-08 18:33:21'),
(76,7,'dimensions','Dimensions monté','Built dimensions','text',NULL,'L x l x H cm','L x W x H cm',0,8,'📐',NULL,NULL,'2025-12-08 18:33:21'),
(77,7,'instructions','Instructions','Instructions','select','[\"Incluses\",\"T\\u00e9l\\u00e9chargeables\",\"Manquantes\"]',NULL,NULL,0,9,'📋',NULL,NULL,'2025-12-08 18:33:21'),
(78,7,'box_condition','État de la boîte','Box condition','select','[\"Scell\\u00e9e\",\"Ouverte - Compl\\u00e8te\",\"Ouverte - Incompl\\u00e8te\",\"Sans bo\\u00eete\"]',NULL,NULL,0,10,'📦',NULL,NULL,'2025-12-08 18:33:21'),
(79,9,'publisher','Éditeur','Publisher','text',NULL,'Ex: Asmodee, Ravensburger','Ex: Asmodee, Ravensburger',0,1,'🏢',NULL,NULL,'2025-12-08 18:33:49'),
(80,9,'designer','Auteur du jeu','Game designer','text',NULL,'Créateur(s) du jeu','Game creator(s)',0,2,'✍️',NULL,NULL,'2025-12-08 18:33:49'),
(81,9,'players_min','Joueurs min','Min players','number',NULL,'Ex: 2','Ex: 2',0,3,'👤',NULL,NULL,'2025-12-08 18:33:49'),
(82,9,'players_max','Joueurs max','Max players','number',NULL,'Ex: 6','Ex: 6',0,4,'👥',NULL,NULL,'2025-12-08 18:33:49'),
(83,9,'duration','Durée de partie','Game duration','text',NULL,'Ex: 30-60 min','Ex: 30-60 min',0,5,'⏱️',NULL,NULL,'2025-12-08 18:33:49'),
(84,9,'age','Âge minimum','Minimum age','text',NULL,'Ex: 10+','Ex: 10+',0,6,'👶',NULL,NULL,'2025-12-08 18:33:49'),
(85,9,'year','Année de sortie','Release year','year',NULL,'YYYY','YYYY',0,7,'📅',NULL,NULL,'2025-12-08 18:33:49'),
(86,9,'genre','Type de jeu','Game type','text',NULL,'Ex: Stratégie, Coopératif','Ex: Strategy, Cooperative',0,8,'🏷️',NULL,NULL,'2025-12-08 18:33:49'),
(87,9,'language','Langue','Language','text',NULL,'Langue de cette édition','Language of this edition',0,9,'🌐',NULL,NULL,'2025-12-08 18:33:49'),
(88,9,'components','Composants','Components','textarea',NULL,'Liste des composants','List of components',0,10,'🎲',NULL,NULL,'2025-12-08 18:33:49'),
(89,9,'expansion','Extension de','Expansion of','text',NULL,'Jeu de base requis','Base game required',0,11,'➕','Laissez vide si jeu de base','Leave empty if base game','2025-12-08 18:33:49'),
(90,10,'game','Jeu/Licence','Game/License','text',NULL,'Ex: Pokémon, Magic, Yu-Gi-Oh','Ex: Pokémon, Magic, Yu-Gi-Oh',0,1,'🃏',NULL,NULL,'2025-12-08 18:33:49'),
(91,10,'set_name','Set/Extension','Set/Expansion','text',NULL,'Nom de l\'extension','Expansion name',0,2,'📦',NULL,NULL,'2025-12-08 18:33:49'),
(92,10,'card_number','Numéro de carte','Card number','text',NULL,'Ex: 25/102, SWSH001','Ex: 25/102, SWSH001',0,3,'🔢',NULL,NULL,'2025-12-08 18:33:49'),
(93,10,'rarity','Rareté','Rarity','select','[\"Commune\",\"Peu commune\",\"Rare\",\"Tr\\u00e8s rare\",\"Ultra rare\",\"Secr\\u00e8te\",\"Promo\"]',NULL,NULL,0,4,'💎',NULL,NULL,'2025-12-08 18:33:49'),
(94,10,'language','Langue','Language','text',NULL,'Ex: Français, Japonais','Ex: French, Japanese',0,5,'🌐',NULL,NULL,'2025-12-08 18:33:49'),
(95,10,'year','Année de sortie','Release year','year',NULL,'YYYY','YYYY',0,6,'📅',NULL,NULL,'2025-12-08 18:33:49'),
(96,10,'finish','Finition','Finish','select','[\"Normal\",\"Holo\",\"Reverse Holo\",\"Full Art\",\"Foil\",\"Secret Rare\"]',NULL,NULL,0,7,'✨',NULL,NULL,'2025-12-08 18:33:49'),
(97,10,'condition','État de la carte','Card condition','select','[\"Mint (M)\",\"Near Mint (NM)\",\"Excellent (EX)\",\"Good (GD)\",\"Light Played (LP)\",\"Played (PL)\",\"Poor (P)\"]',NULL,NULL,0,8,'📋',NULL,NULL,'2025-12-08 18:33:49'),
(98,10,'graded','Gradée','Graded','select','[\"Non\",\"PSA\",\"BGS\",\"CGC\",\"Autre\"]',NULL,NULL,0,9,'🏆',NULL,NULL,'2025-12-08 18:33:49'),
(99,10,'grade_score','Note du grade','Grade score','text',NULL,'Ex: PSA 10, BGS 9.5','Ex: PSA 10, BGS 9.5',0,10,'📊',NULL,NULL,'2025-12-08 18:33:50'),
(100,10,'first_edition','Première édition','First edition','select','[\"Non\",\"Oui\"]',NULL,NULL,0,11,'1️⃣',NULL,NULL,'2025-12-08 18:33:50'),
(101,1,'is_read','Lu','Read','select','[\"Oui\",\"Non\"]',NULL,NULL,0,11,'📖',NULL,NULL,'2025-12-08 19:14:48'),
(102,2,'is_tested','Testé','Tested','select','[\"Oui\",\"Non\"]',NULL,NULL,0,11,'🔧',NULL,NULL,'2025-12-08 19:14:48'),
(103,2,'is_functional','Fonctionnel','Functional','select','[\"Oui\",\"Non\"]',NULL,NULL,0,12,'✅',NULL,NULL,'2025-12-08 19:14:48'),
(104,2,'is_played','Joué','Played','select','[\"Oui\",\"Non\"]',NULL,NULL,0,13,'🎮',NULL,NULL,'2025-12-08 19:14:48'),
(105,2,'is_completed','Terminé','Completed','select','[\"Oui\",\"Non\"]',NULL,NULL,0,14,'🏆',NULL,NULL,'2025-12-08 19:14:48'),
(106,2,'max_players','Nombre de joueurs max','Max players','number',NULL,'Ex: 4','Ex: 4',0,15,'👥',NULL,NULL,'2025-12-08 19:14:48'),
(107,4,'is_watched','Vu','Watched','select','[\"Oui\",\"Non\"]',NULL,NULL,0,11,'👁️',NULL,NULL,'2025-12-08 19:14:48'),
(108,4,'is_tested','Testé','Tested','select','[\"Oui\",\"Non\"]',NULL,NULL,0,12,'🔧',NULL,NULL,'2025-12-08 19:14:48'),
(109,4,'is_functional','Fonctionnel','Functional','select','[\"Oui\",\"Non\"]',NULL,NULL,0,13,'✅',NULL,NULL,'2025-12-08 19:14:48'),
(110,5,'watch_status','Statut de visionnage','Watch status','select','[\"Non vu\",\"En cours\",\"Termin\\u00e9\",\"Abandonn\\u00e9\"]',NULL,NULL,0,11,'👁️',NULL,NULL,'2025-12-08 19:14:48'),
(111,5,'is_tested','Testé','Tested','select','[\"Oui\",\"Non\"]',NULL,NULL,0,12,'🔧',NULL,NULL,'2025-12-08 19:14:48'),
(112,5,'is_functional','Fonctionnel','Functional','select','[\"Oui\",\"Non\"]',NULL,NULL,0,13,'✅',NULL,NULL,'2025-12-08 19:14:48'),
(113,7,'is_assembled','Monté','Assembled','select','[\"Oui\",\"Non\"]',NULL,NULL,0,11,'🔨',NULL,NULL,'2025-12-08 19:14:48'),
(114,7,'is_complete','Complet','Complete','select','[\"Oui\",\"Non\"]',NULL,NULL,0,12,'📦',NULL,NULL,'2025-12-08 19:14:48'),
(115,7,'is_damaged','Endommagé','Damaged','select','[\"Oui\",\"Non\"]',NULL,NULL,0,13,'💔',NULL,NULL,'2025-12-08 19:14:48'),
(116,9,'is_complete','Complet','Complete','select','[\"Oui\",\"Non\"]',NULL,NULL,0,12,'📦',NULL,NULL,'2025-12-08 19:14:48'),
(117,9,'is_damaged','Endommagé','Damaged','select','[\"Oui\",\"Non\"]',NULL,NULL,0,13,'💔',NULL,NULL,'2025-12-08 19:14:48'),
(118,9,'is_played','Joué','Played','select','[\"Oui\",\"Non\"]',NULL,NULL,0,14,'🎲',NULL,NULL,'2025-12-08 19:14:48'),
(119,9,'max_players','Nombre de joueurs max','Max players','number',NULL,'Ex: 6','Ex: 6',0,15,'👥',NULL,NULL,'2025-12-08 19:14:48'),
(120,11,'publisher','Éditeur','Publisher','text',NULL,'Ex: Panini, Topps...','Ex: Panini, Topps...',0,1,'🏢',NULL,NULL,'2025-12-08 19:15:17'),
(121,11,'year','Année','Year','year',NULL,'YYYY','YYYY',0,2,'📅',NULL,NULL,'2025-12-08 19:15:17'),
(122,11,'theme','Thème','Theme','text',NULL,'Ex: Football, Pokémon...','Ex: Football, Pokémon...',0,3,'��',NULL,NULL,'2025-12-08 19:15:17'),
(123,11,'total_stickers','Nombre total d\'images','Total stickers','number',NULL,'Ex: 300','Ex: 300',0,4,'🔢',NULL,NULL,'2025-12-08 19:15:17'),
(126,11,'is_complete','Complet','Complete','select','[\"Oui\",\"Non\"]',NULL,NULL,0,7,'🏆',NULL,NULL,'2025-12-08 19:15:17'),
(128,11,'language','Langue','Language','text',NULL,'Ex: Français, Anglais...','Ex: French, English...',0,9,'🌍',NULL,NULL,'2025-12-08 19:15:17'),
(130,11,'sticker_grid','Grille stickers','Stickers grid','multiselect',NULL,NULL,NULL,0,998,NULL,NULL,NULL,'2025-12-10 21:29:23'),
(131,11,'checklist','Checklist','Checklist','text',NULL,NULL,NULL,0,25,'mdi-format-list-numbered',NULL,NULL,'2025-12-10 22:04:06'),
(132,12,'platform','Plateforme','Platform','text',NULL,'Ex: PlayStation 5','Ex: PlayStation 5',0,10,'🎮','Nom de la plateforme ou console','Platform or console name','2025-12-13 22:13:26'),
(133,12,'manufacturer','Fabricant','Manufacturer','text',NULL,'Ex: Sony, Nintendo','Ex: Sony, Nintendo',0,20,'🏭','Fabricant de la console','Console manufacturer','2025-12-13 22:13:26'),
(134,12,'year','Année de sortie','Release Year','number',NULL,'Ex: 2020','Ex: 2020',0,30,'📅','Année de sortie de cette version','Release year for this version','2025-12-13 22:13:26'),
(135,12,'release_country','Pays de sortie','Release Country','text',NULL,'Ex: France, Japan','Ex: France, Japan',0,40,'🌍','Pays où cette version a été commercialisée','Country where this version was released','2025-12-13 22:13:26'),
(136,12,'region_code','Code région','Region Code','select','{\"options\": [\"PAL\", \"NTSC\", \"NTSC-J\", \"NTSC-U\", \"Region Free\", \"Multi-Region\"]}',NULL,NULL,0,50,'🌐','Code région de la console','Console region code','2025-12-13 22:13:26'),
(137,12,'release_type','Type de sortie','Release Type','select','{\"options\": [\"Official\", \"Limited Edition\", \"Special Edition\", \"Bundle\", \"Prototype\", \"Dev Kit\", \"Unofficial\"]}',NULL,NULL,0,60,'📦','Type de commercialisation','Release type','2025-12-13 22:13:26'),
(138,12,'color','Couleur','Color','text',NULL,'Ex: Noir, Blanc','Ex: Black, White',0,70,'🎨','Couleur de la console','Console color','2025-12-13 22:13:26'),
(139,12,'is_bundle','Bundle','Bundle','select','{\"options\": [\"Oui\", \"Non\"]}',NULL,NULL,0,80,'📦','Est-ce un pack/bundle avec jeux ou accessoires ?','Is this a bundle with games or accessories?','2025-12-13 22:13:26'),
(140,12,'limited_edition','Édition limitée','Limited Edition','select','{\"options\": [\"Oui\", \"Non\"]}',NULL,NULL,0,90,'⭐','Est-ce une édition limitée ?','Is this a limited edition?','2025-12-13 22:13:26'),
(141,12,'amount_produced','Quantité produite','Amount Produced','number',NULL,'Ex: 5000','Ex: 5000',0,100,'🔢','Nombre d\'unités produites (si connu)','Number of units produced (if known)','2025-12-13 22:13:26'),
(142,12,'rarity_score','Score de rareté','Rarity Score','number',NULL,'1-10','1-10',0,110,'💎','Score de rareté (1 = commun, 10 = très rare)','Rarity score (1 = common, 10 = very rare)','2025-12-13 22:13:26'),
(143,12,'tested','Testé','Tested','select','{\"options\": [\"Oui\", \"Non\"]}',NULL,NULL,0,200,'🔍','Avez-vous testé cette console ?','Have you tested this console?','2025-12-13 22:13:26'),
(144,12,'working','Fonctionnel','Working','select','{\"options\": [\"Oui\", \"Non\"]}',NULL,NULL,0,210,'✅','La console fonctionne-t-elle ?','Is the console working?','2025-12-13 22:13:26'),
(145,12,'played','Utilisé','Used','select','{\"options\": [\"Oui\", \"Non\"]}',NULL,NULL,0,220,'🎮','Utilisez-vous cette console ?','Do you use this console?','2025-12-13 22:13:26'),
(146,12,'damaged','Endommagé','Damaged','select','{\"options\": [\"Oui\", \"Non\"]}',NULL,NULL,0,230,'💔','La console est-elle endommagée ?','Is the console damaged?','2025-12-13 22:13:26'),
(147,12,'complete','Complet','Complete','select','{\"options\": [\"Oui\", \"Non\"]}',NULL,NULL,0,240,'📦','La console est-elle complète (boîte, câbles, manettes) ?','Is the console complete (box, cables, controllers)?','2025-12-13 22:13:27'),
(163,14,'accessory_type','Type d\'accessoire','Accessory Type','select','{\"options\": [\"Manette\", \"Câble\", \"Adaptateur\", \"Chargeur\", \"Carte mémoire\", \"Casque\", \"Volant\", \"Joystick\", \"Light Gun\", \"Caméra\", \"Microphone\", \"Extension\", \"Kit de réparation\", \"Skin/Coque\", \"Support\", \"Autre\"]}','Sélectionner le type','Select type',0,1,'mdi:controller','Type d\'accessoire (manette, câble, etc.)','Accessory type (controller, cable, etc.)','2025-12-13 22:42:25'),
(164,14,'platform','Plateforme','Platform','text',NULL,'Ex: PlayStation 5, Nintendo Switch','Ex: PlayStation 5, Nintendo Switch',0,2,'mdi:gamepad-variant','Plateforme(s) compatible(s)','Compatible platform(s)','2025-12-13 22:42:25'),
(165,14,'manufacturer','Fabricant','Manufacturer','text',NULL,'Ex: Sony, Nintendo, Microsoft','Ex: Sony, Nintendo, Microsoft',0,3,'mdi:factory','Fabricant de l\'accessoire','Accessory manufacturer','2025-12-13 22:42:25'),
(166,14,'year','Année de sortie','Release Year','number',NULL,'Ex: 2023','Ex: 2023',0,4,'mdi:calendar','Année de commercialisation','Year of release','2025-12-13 22:42:25'),
(167,14,'release_country','Pays de sortie','Release Country','text',NULL,'Ex: Japan, USA, Europe','Ex: Japan, USA, Europe',0,5,'mdi:earth','Pays ou région de commercialisation','Country or region of release','2025-12-13 22:42:25'),
(168,14,'region_code','Code région','Region Code','select','{\"options\": [\"PAL\", \"NTSC\", \"NTSC-J\", \"NTSC-U\", \"Region Free\", \"Multi-Region\"]}',NULL,NULL,0,6,'mdi:map-marker','Code région de l\'accessoire','Accessory region code','2025-12-13 22:42:25'),
(169,14,'color','Couleur','Color','text',NULL,'Ex: Noir, Blanc, Rouge','Ex: Black, White, Red',0,7,'mdi:palette','Couleur principale','Main color','2025-12-13 22:42:25'),
(170,14,'model_number','N° de modèle','Model Number','text',NULL,'Ex: CFI-ZCT1W','Ex: CFI-ZCT1W',0,8,'mdi:identifier','Référence ou numéro de modèle','Model number or reference','2025-12-13 22:42:25'),
(171,14,'connectivity','Connectivité','Connectivity','select','{\"options\": [\"Filaire\", \"Sans fil\", \"Bluetooth\", \"USB\", \"Propriétaire\", \"Infrarouge\", \"Hybride\"]}',NULL,NULL,0,9,'mdi:connection','Type de connexion','Connection type','2025-12-13 22:42:25'),
(172,14,'is_official','Officiel','Official','select','{\"options\": [\"Oui\", \"Non\"]}',NULL,NULL,0,10,'mdi:check-decagram','Accessoire officiel ou tiers','Official or third-party accessory','2025-12-13 22:42:25'),
(173,14,'is_bundle','Bundle','Bundle','select','{\"options\": [\"Oui\", \"Non\"]}',NULL,NULL,0,11,'mdi:package-variant','Fait partie d\'un bundle','Part of a bundle','2025-12-13 22:42:25'),
(174,14,'limited_edition','Édition limitée','Limited Edition','select','{\"options\": [\"Oui\", \"Non\"]}',NULL,NULL,0,12,'mdi:star','Édition spéciale ou limitée','Special or limited edition','2025-12-13 22:42:25'),
(175,14,'rarity_score','Score de rareté','Rarity Score','number',NULL,'Ex: 75','Ex: 75',0,13,'mdi:diamond-stone','Score de rareté (0-100)','Rarity score (0-100)','2025-12-13 22:42:25'),
(176,14,'tested','Testé','Tested','select','{\"options\": [\"Oui\", \"Non\"]}',NULL,NULL,0,20,'mdi:clipboard-check','L\'accessoire a été testé','The accessory has been tested','2025-12-13 22:42:25'),
(177,14,'working','Fonctionnel','Working','select','{\"options\": [\"Oui\", \"Non\"]}',NULL,NULL,0,21,'mdi:check-circle','L\'accessoire fonctionne correctement','The accessory works properly','2025-12-13 22:42:25'),
(178,14,'damaged','Endommagé','Damaged','select','{\"options\": [\"Oui\", \"Non\"]}',NULL,NULL,0,22,'mdi:alert-circle','L\'accessoire présente des dommages','The accessory has damage','2025-12-13 22:42:25'),
(179,14,'complete','Complet','Complete','select','{\"options\": [\"Oui\", \"Non\"]}',NULL,NULL,0,23,'mdi:package-variant-closed-check','Tous les éléments sont présents (câbles, boîte, etc.)','All elements are present (cables, box, etc.)','2025-12-13 22:42:25'),
(180,11,'special_stickers','Images spéciales','Special stickers','textarea',NULL,'Ex: Métallisées: A-X, Holographiques: 1-10','Ex: Metallic: A-X, Holographic: 1-10',0,5,'sparkles','Types d\'images spéciales (métallisées, holographiques, etc.)','Special sticker types (metallic, holographic, etc.)','2025-12-15 23:51:11');
/*!40000 ALTER TABLE `primary_type_fields` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-18  0:18:33
