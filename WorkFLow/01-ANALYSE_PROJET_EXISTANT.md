# 📊 ANALYSE DU PROJET EXISTANT - SnowShelf

> **Document de référence** - Analyse complète du projet actuel avant réécriture
> 
> **Date de création** : 20 février 2026
> **Status** : ✅ Complété

---

## 🎯 Vue d'ensemble

**SnowShelf** est une application web de gestion de collections d'objets geek (jeux vidéo, livres, jouets, vinyles, etc.) développée en PHP avec une architecture SPA hybride.

### Objectif du projet actuel
Permettre aux collectionneurs de cataloguer, organiser et gérer leurs collections avec une interface moderne et responsive.

### Public cible
- Collectionneurs geek (jeux vidéo, BD, figurines, etc.)
- Utilisateurs de tous niveaux (interface intuitive)
- Accès multi-plateforme (PC, tablette, smartphone)

---

## 🏗️ Architecture Technique Actuelle

### Stack Backend
- **Langage** : PHP 8.x
- **Base de données** : MariaDB 10.x
- **Hébergement** : Proxmox VM → Debian (environnement de labo 10.20.0.3)
- **Reverse Proxy** : NGINX Proxy Manager (10.0.0.9:81)
- **Chemin développement** : `/Projets/SnowShelf`

### Stack Frontend
- **HTML5 / CSS3** : Flexbox, Grid, Variables CSS
- **JavaScript** : Vanilla JS (pas de framework)
- **Architecture** : SPA hybride (shell PHP + fragments chargés via API)
- **Router** : Custom JS (`router.js`)
- **Modals** : Gestionnaire personnalisé (`ModalManager`)

### Dépendances
- **PHP** : 
  - PHPMailer (envoi emails)
  - php-ffmpeg (génération thumbnails vidéo)
  - Composer (gestion dépendances)
- **Binaires** : FFmpeg statique (`/bin/ffmpeg`)

---

## 📂 Structure de Fichiers

```
SnowShelf/
├── public/                      # Fichiers publics
│   ├── index.php                # Landing page
│   ├── login.php                # Page connexion
│   ├── register.php             # Page inscription
│   ├── verify-email.php         # Vérification email
│   ├── dashboard.php            # Shell SPA principal
│   ├── admin/                   # Panel administration
│   ├── api/                     # Endpoints REST
│   ├── auth/                    # Handlers authentification
│   ├── views/                   # Fragments SPA
│   ├── assets/                  # CSS, JS, Images
│   ├── components/              # Composants réutilisables
│   └── themes/                  # Système de thèmes
├── core/                        # Code métier PHP
├── config/                      # Configuration BDD
├── lang/                        # Fichiers i18n (fr, en)
├── logs/                        # Logs applicatifs
├── storage/                     # Fichiers uploadés
│   ├── users/                   # Médias collections utilisateurs
│   ├── default_categories/      # Médias catégories système
│   └── temp/                    # Images temporaires (ImageEditor)
├── database/                    # Migrations SQL
├── scripts/                     # Scripts utilitaires (cron)
├── docs/                        # Documentation projet
├── vendor/                      # Dépendances Composer
└── .env                         # Variables d'environnement
```

---

## 🗄️ Modèle de Données

### Tables Principales

#### Utilisateurs
- **users** : Comptes utilisateurs (name, email, password, is_admin, is_premium, theme, lang_pref)
- **users_api** : Clés API personnelles utilisateurs
- **user_limits** : Limites par type d'utilisateur

#### Collections
- **categories** : Catégories de collection (user_id, name, icon, visible, is_default)
- **items** : Objets de collection (user_id, name, description, rating, value, date_obtained)
- **item_categories** : Relation many-to-many items ↔ catégories
- **item_img**, **item_videos**, **item_audio**, **item_doc** : Médias associés aux items

#### Métadonnées Dynamiques (Pattern EAV)
- **primary_type** : 11 types primaires (books, video_games, music, movies, series, toys, etc.)
- **primary_type_fields** : Champs de métadonnées par type (author, year, platform, etc.)
- **item_metadata** : Valeurs des métadonnées (value_text, value_number, value_date, value_json)

#### Médias de Catégories (4 tables, structure identique aux items)
- **category_img** : Images de catégories (category_id, title, url, ordre, created_at)
- **category_videos** : Vidéos de catégories (+ thumbnail_url)
- **category_audio** : Audio de catégories
- **category_doc** : Documents de catégories

#### Statuts & Grades
- **statuses** : États de possession (name, description, color, icon, ordre, user_id, defaut) — ex: « Possédé », « Recherché », « En transit », « Prêté »
- **grades** : États physiques personnalisables (name, description, user_id, defaut) — ex: « Comme neuf », « Bon état », « Manque boîte »
- **item_grades** : Liaison many-to-many items ↔ grades (item_id, grade_id)
- **category_grades** : Grades associés à des catégories spécifiques (category_id, grade_id) — les grades proposés dans le formulaire dépendent des catégories sélectionnées

#### Émplacements de stockage
- **storage_locations** : Emplacements physiques (user_id, name, description) — ex: « Étagère salon », « Grenier boîte 3 »

#### Mappings d'import
- **primary_type_key_to_field** : Liens api_keys Tako_Api → champs de métadonnées (field_id, api_keys JSON, transform_type, transform_config, priority, is_active)
- **item_field_mappings** : Mapping global des champs principaux de l'item pour l'import

#### Système
- **upload_config** : Configuration uploads configurable en BDD (category, extensions JSON, max_size_mb, is_active)
- **Admin_Main_Config** : Configuration globale site (API_ENCRYPTION_KEY, etc.)
- **tako_api_config** : Configuration Tako_Api (API unifiée développée en interne)

### Points Clés du Modèle
- **Système flexible** : EAV permet d'ajouter des champs sans modifier la structure
- **Multi-utilisateurs** : Isolation des données par user_id
- **Catégories partagées** : Catégories système (is_default=1) + catégories publiques Premium
- **Hiérarchie utilisateurs** : Free (consultation) → Premium (CRUD) → Admin (full access)
- **Découplage médias** : 4 tables par entité (img, videos, audio, doc) avec structure identique
- **Upload configurable** : Table `upload_config` avec extensions et tailles par catégorie de média
- **Stockage structuré** : Arborescence `/storage/users/{uid}/items/{id}/{mediaType}/` + dossier temp avec nettoyage auto

---

## 🎨 Système de Thèmes

### Caractéristiques
- **43 thèmes disponibles** : Dark, Dracula, Nord, Aquamarine, Plex, Hotline, Hotpink, Space Gray, Overseerr, Maroon, Organizr, Catppuccin (Mocha, Latte, Frappe, Macchiato), OneDark, TrueBlack, Pine Shadow, Ibracorp, Blackberry (Solar, Abyss, Amethyst, Carol, Dreamscape, Flamingo, Hearth, Martian, Pumpkin, Royal, Shadow, Vanta), Infinity Stones (Mind, Soul, Reality, Power, Space, Time), Rose Pine (Rose Pine, Moon, Dawn), SnowShelf spéciaux (Christmas, Santa, Halloween)
- **Variables CSS** : ~40 variables (--main-bg-color, --card-bg, --text, --accent-color, etc.)
- **Support mode sombre/clair** : Tous les thèmes sont sombres actuellement
- **Sélection par utilisateur** : Enregistré en BDD (colonne `theme`)
- **Application** : Via attribut `<html data-theme="dracula">`

### Fichier Principal
`/public/themes/themes.css` (~2000 lignes)

---

## 🌍 Internationalisation (i18n)

### Langues Supportées
- 🇫🇷 **Français** (langue par défaut)
- 🇬🇧 **Anglais**

### Architecture
- **Fichiers** : `/lang/fr.php`, `/lang/en.php`
- **Format** : Arrays PHP multi-niveaux
- **Sections** : common, auth, errors, nav, collections, categories, items, settings, datetime
- **API** : `__('auth.login')`, `_e('auth.password')`, `getLang()`, `renderLangSelector()`
- **Préférence** : Enregistrée en BDD (`lang_pref` dans users)

### Ajout de Langue
1. Copier `/lang/en.php` → `/lang/xx.php`
2. Modifier `_meta` (code, name, flag, direction)
3. Traduire toutes les valeurs
4. Apparition automatique dans le sélecteur

---

## 🔐 Authentification & Sécurité

### Système d'Authentification
- **Connexion** : Par email uniquement (pas par username)
- **Inscription** : Nom d'utilisateur (3-50 chars) + Email + Mot de passe (8+ chars, 1 chiffre, 1 spécial)
- **Vérification email** : Token 64 caractères hex, email obligatoire avant connexion
- **Sessions** : PHP natives avec régénération ID après login
- **Remember me** : Token SHA-256 en BDD, cookie HttpOnly/Secure 30 jours
- **Reset password** : Token 64 chars avec expiration

### Sécurité des Uploads
- **Validation MIME** : Via finfo (détection réelle)
- **Extensions autorisées** : Configurables par catégorie (upload_config)
- **Taille max** : Par catégorie (5MB avatars, 10MB images, 500MB vidéos)
- **Protection serveur** : `.htaccess` bloquant PHP, CGI, etc.
- **Noms fichiers** : Nettoyés, caractères spéciaux supprimés
- **Permissions** : 0644 pour fichiers, 0755 pour dossiers

### Hachage Mots de Passe
- **Algorithme** : bcrypt (PASSWORD_BCRYPT)
- **Cost** : 12
- **Vérification** : password_verify()

### API REST
- **Auth** : Session PHP OU JWT (ApiAuth::check())
- **Permissions** : Vérification proprietaire/admin par endpoint
- **CORS** : Headers appropriés pour SPA

---

## ⚙️ Fonctionnalités Principales

### 1. Gestion des Collections
- **CRUD Items** : Création, lecture, modification, suppression
- **Système d'onglets modulables** : Le formulaire/vue item comporte **3 onglets** :
  - **Général** (📋) : Nom, description, type primaire, notes, rating (0-5 étoiles), statut, catégories (multi-select), prix achat/marché, date acquisition, code-barres, grades (multi-select dynamique selon catégories), emplacement de stockage
  - **Détails** (📝) : Champs de métadonnées dynamiques chargés automatiquement selon le type primaire (PrimaryType) sélectionné. Par ex: « Plateforme » pour les jeux vidéo, « Auteur/ISBN » pour les livres, « Tracklist » pour la musique. Affiche un compteur du nombre de champs remplis.
  - **Médias** (🖼️) : 4 sous-onglets (Images, Vidéos, Audio, Documents) chacun avec un compteur. Upload drag & drop, réordonnancement, édition d'images, capture caméra.
- **Médias multiples** : Images, vidéos (thumbnails auto via ffmpeg), audio (lecteur intégré), documents (visionneuse multi-format)
- **Métadonnées dynamiques** : Champs spécifiques par type (auteur pour livres, plateforme pour jeux, tracklist pour musique, minifigurines pour LEGO, etc.)
- **Statuts personnalisables** : Système de statuts (single-select) avec couleur + icône — par défaut (« Possédé », « Recherché », etc.) + personnels (Premium/Admin)
- **Grades par catégorie** : Système d'états physiques (multi-select) — les grades proposés dépendent dynamiquement des catégories sélectionnées via la table category_grades
- **Emplacements de stockage** : CRUD d'emplacements physiques (dropdown avec création en ligne)
- **Recherche & Filtres** : Texte, catégorie, note, valeur, date, statut
- **Tri** : Nom, date création/modification, valeur, note, prix achat, date acquisition
- **Affichage** : Grille (vignettes avec thumbnail) ou Liste (détaillé)
- **Pagination** : Lazy loading (50 items/page)
- **Recherche web** : Bouton 🌐 sur le champ nom pour lancer une recherche Tako_Api et importer automatiquement métadonnées + images

### 2. Gestion des Catégories
- **Catégories système** : 14 catégories par défaut (jeux vidéo, livres, vinyles, etc.)
- **Catégories utilisateur** : Premium peut créer/modifier
- **Catégories publiques** : Premium peut partager (visible=1)
- **Médias** : 4 types identiques aux items (images, vidéos, audio, documents) via 4 tables dédiées (category_img, category_videos, category_audio, category_doc)
- **Stockage médias** :
  - Catégories par défaut : `/storage/default_categories/{catId}/{mediaType}/`
  - Catégories utilisateur : `/storage/users/{userId}/Categories/{catId}/{mediaType}/`
  - Transfert automatique entre dossiers lors du changement de flag is_default
- **Hiérarchie** : Double système mère-fille :
  - `category_mothers` : Relations par utilisateur (user_id)
  - `category_mothers_default` : Relations par défaut gérées par l'admin
  - Import des liens par défaut vers les liens utilisateur
- **Grades associés** : Chaque catégorie peut avoir des grades spécifiques associés (via `category_grades`), qui déterminent les grades proposés dans le formulaire d'item
- **Copie** : Fonction de duplication complète (catégorie + grades + parents)
- **Icônes** : Emoji OU image uploadée (fichier icon.{ext} à la racine du dossier)

### 3. Recherche Web (Tako_Api)
- **Tako_Api** : API unifiée développée en interne (située à `/Projets/Tako_Api`)
- **32 providers** répartis en **11 domaines** : construction-toys (LEGO, Playmobil, Rebrickable, etc.), books (Google Books, OpenLibrary), comics (ComicVine, Bedetheque), anime-manga (Jikan, MangaUpdates), media (TMDB, TVDB), videogames (IGDB, RAWG, JVC), boardgames (BGG), collectibles (Coleka), tcg (Pokémon, MTG, etc.), music (Discogs, Deezer, MusicBrainz), ecommerce (Amazon)
- **Architecture** : Format de réponse unifié, cache PostgreSQL, traduction automatique intégrée
- **Documentation** : OpenAPI disponible sur `http://localhost:3000/docs`
- **Recherche texte** : Par titre/nom via endpoints `/api/{domain}/search`
- **Recherche image** : OCR + détection code-barres intégré
- **Import automatique** : Métadonnées normalisées → formulaire item

### 4. Outils d'Édition
- **ImageEditor** (1411 lignes, Canvas 2D natif, **aucune dépendance externe**) :
  - **Transformations** : Recadrage libre (8 poignées coins + côtés, grille des tiers, overlay assombri, taille min 50px), rotation 90° gauche/droite (0/90/180/270°), miroir H/V, zoom (molette + pinch 2 doigts mobile, min 0.1x → max 10x), pan (drag souris + drag 1 doigt)
  - **Filtres temps réel** : Luminosité, contraste, saturation (sliders -100 à +100 via CSS `brightness()`, `contrast()`, `saturate()`) + prévisualisation canvas miniature 80×80px
  - **Export** : JPEG/PNG/WebP (qualité 0.92), taille max 5000px, support `devicePixelRatio`
  - **Mobile** : `touch-action: none`, gestion complète `touchstart/touchmove/touchend passive: false`, poignées de crop agrandies sur tactile
  - **Flux** : Ouverture automatique après capture caméra (sauf `skipEditor: true`), bouton éditer sur chaque image existante
  - **Configuration** : `minZoom: 0.1`, `maxZoom: 10`, `zoomStep: 0.1`, `outputQualityJpeg/Webp: 0.92`, `previewSize: 80`, `cropHandleSize: 12`, `minCropSize: 50`
- **CameraCapture** (1278 lignes, WebRTC getUserMedia) :
  - **Flux vidéo** : `navigator.mediaDevices.getUserMedia()` + `enumerateDevices()`, résolution idéale 1920×1080 avec fallback progressif
  - **Contrôles** : Switch caméra (dropdown desktop, bouton simple mobile < 768px), facingMode environment/user, flash/torch hardware (`track.applyConstraints`), zoom hardware natif (`capabilities.zoom`) + fallback CSS `transform: scale()`
  - **Capture** : Canvas snapshot avec animation flash blanche, envoi automatique vers ImageEditor
  - **Mode Scan** : Overlay guidage (barcode/document/auto) avec animation laser pour code-barres
  - **Mobile** : Zoom pincement 2 doigts, aspect ratio 16/10 max-height 50vh
- **BarcodeScanner** (465 lignes) : Détection via API native `BarcodeDetector` (Chrome/Edge) + fallback **QuaggaJS**. Formats: EAN-13, EAN-8, UPC-A/E, Code 128/39, QR Code, Data Matrix. Seuil: 2 détections identiques pour confirmation.
- **DocumentViewer** (1395 lignes) : Visionneuse multi-format avec chargement dynamique de libs :
  - Images: zoom, rotation, plein écran
  - PDF: pdfjs, navigation par page, zoom, mode double page
  - ZIP: jszip (navigation de contenu)
  - EPUB: epubjs (lecture de livres)
  - CBZ/CBR: libarchive (comics)
  - Texte: affichage brut
- **MediaListManager** (1689 lignes) : Module IIFE réutilisable pour items ET catégories.
  - Upload : drag & drop + sélection fichier + import depuis caméra (`addFromBlob`) + import depuis ImageEditor (`addFromImageEditor`) + import depuis proxy (`addFromProxyToken`)
  - Gestion : réordonnancement drag & drop, suppression individuelle/totale avec confirmation, édition titre inline
  - Lecteur audio intégré : play/pause, barre progression cliquable, timer
  - Lazy loading thumbnails via IntersectionObserver (`rootMargin: 50px 0px`)
  - Flux 2 étapes : fichiers en attente (pendingFiles) en mode création → `finalizePendingFiles()` après création entité
  - Bouton 📷 Caméra : ouvre CameraCapture → capture → ImageEditor → upload
  - Bouton ✏️ Éditer sur chaque image : télécharge l'écran → ouvre ImageEditor → re-upload
- **IconEditor** : Sélection emoji OU upload image

### 4b. Système de Thumbnails
- **Génération à la demande** : Via `/api/thumbnail.php`, cache avec hash MD5(path+size)
- **Tailles** : 150, 200, 400, 800 px
- **Vidéos** : Extraction de frame à 1s via ffmpeg (binaire `/bin/ffmpeg`), redimensionnement 200px
- **Cache** : `/storage/thumbnails/{2-char-md5-subdir}/`, nettoyage automatique à la suppression

### 4c. Gestion des Uploads (SecureUpload)
- **Validation MIME** : Via finfo (détection réelle du type)
- **Whitelist** par catégorie : configurable en BDD (table `upload_config`)
- **Blacklist** d'extensions dangereuses : php*, cgi, py, sh, exe, js, svg, etc.
- **Validation images** : getimagesize() pour vérifier les dimensions
- **Protection SVG** : Scan pour `<script>`, `javascript:`, handlers `on*`, `<iframe>`, `<embed>`
- **Nommage** : `sanitizedName_timestamp_uniqueId.ext` (limite 100 chars)
- **Limites** :
  | Catégorie | Extensions | Taille max |
  |-----------|-----------|------------|
  | avatar | jpg, jpeg, png, gif, webp | 5 MB |
  | images | jpg, jpeg, png, gif, webp, svg | 10 MB |
  | audio | mp3, wav, ogg, flac | 50 MB |
  | videos | mp4, webm, avi, mkv, mov | 500 MB |
  | documents | pdf, doc, docx, txt, zip, epub, cbr, cbz | 500 MB |
- **Chemins de stockage** :
  - Items : `/storage/users/{userId}/items/{itemId}/{mediaType}/`
  - Catégories user : `/storage/users/{userId}/Categories/{catId}/{mediaType}/`
  - Catégories par défaut : `/storage/default_categories/{catId}/{mediaType}/`
  - Temp : `/storage/temp/`
  - Proxy : `/storage/temp/proxy/`
- **Flux d'upload** :
  1. Upload direct (item existant) : fichier → validation → dossier final
  2. Upload temporaire (mode création) : temp → finalize_temp après création
  3. Import proxy (web search) : téléchargement via proxy → stockage temp → finalisation

### 4d. Serveur de fichiers (storage.php)
- Headers de cache : ETag + Last-Modified, 24h max-age
- Range requests pour streaming vidéo/audio (chunks 8 KB)
- Fichiers >50 MB : mode streaming (output buffering désactivé)
- Accès : default_categories/ = public, users/{id}/ = authentification requise

### 5. Administration
- **Gestion utilisateurs** : CRUD complet
- **Gestion systèmes de notes** : Grades personnalisés
- **Configuration uploads** : Extensions, tailles max par catégorie
- **Configuration Tako_Api** : URL, port, timeout (les clés API sont gérées exclusivement dans le .env de Tako_Api, aucune authentification n'est requise pour y accéder)
- **Gestion champs métadonnées** : CRUD champs par type primaire
- **Mappings Tako_Api→Champs** : Configuration import automatique depuis les domaines

### 6. Système de Compte
- **Profil** : Avatar, background, bio
- **Préférences** : Thème, langue, newsletter
- **Sécurité** : Changement mot de passe
- **Visibilité** : Collections publiques/privées

---

## 📱 Responsive Design

### Breakpoints
- **Mobile** : < 768px
- **Tablette** : 768px - 1024px
- **Desktop** : > 1024px

### Adaptations Mobile
- **Navigation** : Menu hamburger
- **Modals** : Plein écran sur mobile
- **Filtres** : Slide-in depuis la droite
- **Grille** : 1 colonne mobile, 2-4 colonnes desktop
- **Touch** : Gestes tactiles (pinch zoom, swipe)

### Performance Mobile
- **Lazy loading** : Images chargées à la demande (IntersectionObserver)
- **Cache-busting** : Timestamps sur images
- **Infinite scroll** : Pagination automatique
- **Optimisation** : WebP, compressions adaptées

---

## 🔌 Architecture API REST

### Endpoints Principaux

#### Authentification
- **POST** `/auth/login-handler.php` - Connexion
- **POST** `/auth/register-handler.php` - Inscription
- **GET** `/verify-email.php?token=...` - Validation email

#### Utilisateurs
- **GET** `/api/users.php?me` - Infos utilisateur connecté
- **GET** `/api/users.php?id=X` - Détails utilisateur
- **GET** `/api/users.php` - Liste utilisateurs (admin)
- **POST** `/api/users.php` - Créer utilisateur (admin)
- **PUT** `/api/users.php?id=X` - Modifier utilisateur
- **DELETE** `/api/users.php?id=X` - Supprimer utilisateur
- **POST** `/api/users.php?action=password` - Changer mot de passe
- **POST** `/api/users.php?action=preferences` - Modifier préférences
- **POST** `/api/users.php?action=avatar` - Upload avatar

#### Catégories
- **GET** `/api/categories.php` - Liste catégories accessibles
- **GET** `/api/categories.php?id=X` - Détails catégorie
- **POST** `/api/categories.php` - Créer catégorie (Premium)
- **PUT** `/api/categories.php?id=X` - Modifier catégorie
- **DELETE** `/api/categories.php?id=X` - Supprimer catégorie

#### Items
- **GET** `/api/items.php?page=1&limit=50` - Liste paginée
- **GET** `/api/items.php?id=X` - Détails item
- **POST** `/api/items.php` - Créer item
- **PUT** `/api/items.php?id=X` - Modifier item
- **DELETE** `/api/items.php?id=X` - Supprimer item

#### Métadonnées
- **GET** `/api/item-metadata.php?action=fields&type_id=X` - Champs d'un type
- **GET** `/api/item-metadata.php?action=values&item_id=X` - Valeurs métadonnées
- **POST** `/api/item-metadata.php` - Sauvegarder métadonnées

#### Médias
- **GET** `/api/category-media.php?action=list` - Liste médias
- **POST** `/api/category-media.php?action=upload` - Upload média
- **PUT** `/api/category-media.php?action=update` - Modifier média
- **PUT** `/api/category-media.php?action=reorder` - Réordonner
- **DELETE** `/api/category-media.php?action=delete` - Supprimer média

#### Recherche Web (Tako_Api)
- **GET** `/api/tako/domains` - Liste des domaines disponibles
- **GET** `/api/tako/{domain}/search?q=` - Recherche par domaine
- **GET** `/api/tako/{domain}/details` - Détails via detailUrl
- **POST** `/api/tako/search/image` - Recherche par image (OCR + barcode)

#### Administration
- **GET** `/api/admin/config.php?table=upload_config` - Config uploads
- **GET** `/api/admin/type-fields.php` - Champs métadonnées
- **GET** `/api/admin/field-mappings.php` - Mappings Tako_Api→champs
- **GET** `/api/admin/tako-config.php` - Configuration Tako_Api

### Format Réponses
```json
{
  "success": true,
  "data": { ... },
  "message": "Opération réussie"
}
```

```json
{
  "success": false,
  "error": "Message d'erreur",
  "code": 400
}
```

---

## 🌟 Points Forts du Projet Actuel

### Architecture
✅ **SPA hybride** : Performance PHP + fluidité SPA  
✅ **API REST structurée** : Endpoints cohérents et documentés  
✅ **Modularité** : Composants JS réutilisables (ImageEditor, MediaListManager, etc.)  
✅ **Séparation des responsabilités** : Core PHP, API, Views, Assets  

### UX/UI
✅ **Design moderne** : Glassmorphism, animations fluides  
✅ **43 thèmes** : Personnalisation poussée  
✅ **Responsive complet** : Mobile-first  
✅ **Accessibilité** : Focus trap, keyboard navigation  

### Fonctionnalités
✅ **Métadonnées dynamiques** : Flexibilité via pattern EAV  
✅ **Recherche web intégrée** : Tako_Api avec 32 providers (11 domaines)  
✅ **Édition d'images** : Outils complets (recadrage, rotation, filtres)  
✅ **Capture caméra** : Support desktop/mobile  
✅ **Médias multiples** : Images, vidéos, audio, documents  

### Sécurité
✅ **Uploads sécurisés** : Validation MIME, .htaccess, permissions  
✅ **Authentification robuste** : bcrypt, tokens, sessions  
✅ **Isolation données** : Par utilisateur  

---

## ⚠️ Limitations & Points d'Amélioration

### Architecture
❌ **Pas de véritable framework backend** : Code PHP vanilla peut devenir difficile à maintenir  
❌ **Router SPA basique** : Pas de gestion d'historique avancée  
❌ **Pas de build system** : Pas de minification/bundling JS/CSS  

### Performance
❌ **Pas de cache** : Ni Redis, ni cache applicatif structuré  
❌ **Pas de CDN** : Assets servis directement par serveur  
❌ **Requêtes N+1** : Risque sur chargements de listes avec relations  

### Mobile
❌ **Pas d'application native** : Seulement web responsive  
❌ **Pas de PWA** : Pas de service worker, manifest  
❌ **Pas d'offline** : Nécessite connexion permanente  

> **→ Objectif v2** : PWA installable (manifest, service worker, offline, push) comme stratégie mobile
> principale, avec React Native optionnel si les APIs PWA ne suffisent pas.
> Les composants (ImageEditor, CameraCapture, BarcodeScanner) sont déjà conçus
> mobile-first (touch events, pinch-to-zoom, responsive). La réécriture en React
> doit impérativement conserver cette qualité touch/mobile.
❌ **Pas de documentation Swagger** : Documentation dans markdown seulement  

### Tests
❌ **Pas de tests unitaires** : Aucun test automatisé  
❌ **Pas de tests d'intégration**  
❌ **Pas de CI/CD** : Déploiement manuel  

### Monitoring
❌ **Logs basiques** : Pas d'agrégation centralisée  
❌ **Pas de monitoring** : Pas d'alertes, métriques  
❌ **Pas de backup automatique** : BDD à sauvegarder manuellement  

---

## 📊 Statistiques du Projet

### Code
- **PHP** : ~50 fichiers, ~15K lignes
- **JavaScript** : ~30 fichiers, ~25K lignes
- **CSS** : ~20 fichiers, ~15K lignes
- **Documentation** : 10 fichiers markdown

### Base de Données
- **Tables** : ~30 tables
- **Types primaires** : 11 types avec 116 champs de métadonnées
- **Tako_Api** : API unifiée (32 providers, 11 domaines)

### Thèmes & i18n
- **Thèmes** : 43 thèmes
- **Langues** : 2 langues (FR, EN)
- **Variables CSS** : ~40 variables

---

## 🎯 Conclusion de l'Analyse

### Projet Mature
Le projet actuel est **fonctionnel, complet et déjà en production**. Il dispose d'une architecture solide, d'une interface soignée et de fonctionnalités avancées.

### Réécriture Justifiée
La réécriture est justifiée pour :
1. **Application mobile native** : Expérience utilisateur optimale sur smartphone
2. **Architecture moderne** : Framework backend/frontend pour meilleure maintenabilité
3. **Performance** : Cache, CDN, optimisations avancées
4. **Scalabilité** : Préparer le terrain pour croissance utilisateurs
5. **Tests & CI/CD** : Qualité et fiabilité accrues

### Conserver les Acquis
La réécriture doit **préserver** :
- ✅ Le système de thèmes (43 thèmes)
- ✅ L'i18n (FR/EN extensible)
- ✅ Les métadonnées dynamiques (EAV)
- ✅ La recherche web (Tako_Api avec 32 providers)
- ✅ Les outils d'édition (ImageEditor, CameraCapture, BarcodeScanner, DocumentViewer)
- ✅ La qualité mobile-first (touch events, pinch-to-zoom, responsive complet)
- ✅ Le flux Caméra → ImageEditor → Upload (intégration complète)
- ✅ Le modèle de données (migrations possibles)
- ✅ La hiérarchie utilisateurs (Free/Premium/Admin)
- ✅ Le MediaListManager complet (4 types, 2 étapes upload, lazy loading, lecteur audio, réordonnancement)

### Stratégie Mobile v2
**PWA-first** : L'application web React/Vite sera transformée en PWA installable :
- Service Worker (Workbox) : cache shell + assets + médias
- Manifest : installation sur écran d'accueil (Android + iOS)
- Offline : queue d'opérations + sync en arrière-plan
- APIs natives web : Web Share, camera, vibration, badge, push notifications
- React Native en option si les limitations PWA bloquent des features critiques

### Prochaines Étapes
1. Définir l'architecture cible (backend/frontend/mobile)
2. Choisir la stack technique moderne
3. Planifier la migration des données
4. Établir une roadmap de développement

---

**Ce document sert de base de référence pour les décisions architecturales et techniques de la réécriture du projet SnowShelf.**
