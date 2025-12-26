# SnowShelf - Historique des Modifications

> Journal des modifications et évolutions du projet.

---

## 📅 Décembre 2025

### � Refactoring Admin ES6 & Audit Complet (23 décembre 2025)

**Refactoring complet** du code JavaScript admin en modules ES6 avec audit qualité.

#### Modules créés (`/public/assets/js/admin/`)

| Module | Description |
|--------|-------------|
| `core/state.js` | État partagé (primaryTypesData, typeFieldsData, transformTypesData) |
| `core/api.js` | Fonctions fetch API avec gestion d'erreurs |
| `core/utils.js` | Utilitaires (formatDate, getIcon, debounce) |
| `ui/dropdown.js` | Gestion des dropdowns custom avec protection double-init |
| `ui/modals.js` | Gestion des modals (open, close, reset) |
| `settings/index.js` | Point d'entrée onglet Settings |
| `settings/modules/*.js` | Modules par fonctionnalité (apis, grades, type-fields, field-mappings, databases, users) |

#### Corrections appliquées
- Protection contre double-initialisation des dropdowns dans modals
- Chargement des données de référence (types, champs) avant ouverture des modals
- Alignement des patterns ADD/EDIT pour tous les modals
- Suppression des imports inutilisés
- Ajout du champ `transform_config` avec visibilité conditionnelle

#### Audit thématique CSS
- Correction des couleurs en dur dans `admin.css`
- Utilisation de `var(--button-text)`, `var(--warning-color)`, `var(--warning-color-rgb)`
- Fallbacks CSS appropriés pour compatibilité thèmes

---

### �📋 Système de Métadonnées Dynamiques (8 décembre 2025)

**Nouveau système** de métadonnées dynamiques par type primaire pour les items de collection.

#### Architecture (Pattern EAV - Entity-Attribute-Value)

**Tables BDD créées :**
```sql
-- Types primaires
CREATE TABLE primary_type (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) UNIQUE,      -- Clé (books, video_games, etc.)
    icon VARCHAR(10),             -- Emoji
    color VARCHAR(7)              -- Couleur hex
);

-- Champs par type
CREATE TABLE primary_type_fields (
    id INT PRIMARY KEY AUTO_INCREMENT,
    primary_type_id INT,
    field_key VARCHAR(50),        -- Clé technique
    field_name_fr VARCHAR(100),   -- Label français
    field_name_en VARCHAR(100),   -- Label anglais
    field_type ENUM('text','textarea','number','year','date','select','multiselect','url','rating','duration'),
    field_options JSON,           -- Options pour select/multiselect
    placeholder_fr VARCHAR(200),
    placeholder_en VARCHAR(200),
    help_text_fr TEXT,
    help_text_en TEXT,
    icon VARCHAR(10),
    is_required BOOLEAN DEFAULT FALSE,
    sort_order INT DEFAULT 0
);

-- Valeurs des métadonnées
CREATE TABLE item_metadata (
    id INT PRIMARY KEY AUTO_INCREMENT,
    item_id INT,
    field_id INT,
    value_text TEXT,
    value_number DECIMAL(15,2),
    value_date DATE,
    value_json JSON,
    UNIQUE KEY (item_id, field_id)
);
```

#### 11 Types Primaires
| ID | Clé | Nom | Icône | Nb Champs |
|----|-----|-----|-------|----------|
| 1 | books | Livres | 📚 | 11 |
| 2 | video_games | Jeux vidéo | 🎮 | 15 |
| 3 | music | Musique | 🎵 | 9 |
| 4 | movies | Films | 🎬 | 13 |
| 5 | series | Séries | 📺 | 13 |
| 6 | toys_fig | Figurines | 🧸 | 11 |
| 7 | toys_construct | Jouets construction | 🧱 | 13 |
| 8 | divers | Divers | 📦 | 8 |
| 9 | board_games | Jeux de société | 🎲 | 15 |
| 10 | trading_cards | Cartes à collectionner | 🃏 | 11 |
| 11 | sticker_albums | Albums d'images | 🖼️ | 10 |

#### Fichiers créés
- `/public/api/item-metadata.php` - API REST pour champs et valeurs

#### Fichiers modifiés
- `/public/assets/js/collection.js` :
  - `openItemModal()` - Chargement métadonnées via API
  - `buildItemViewHtml()` - Affichage badge type + métadonnées
  - `buildMetadataViewHtml()` - Rendu grille métadonnées en accordéon
  - `renderMetadataFields()` - Génération formulaire dynamique
  - `collectMetadataValues()` - Collecte valeurs pour sauvegarde
  - `handleItemSubmit()` - Sauvegarde métadonnées via API
  - `createMetadataSelectDropdown()` - Dropdown custom pour select
  - `createMetadataMultiselectDropdown()` - Multiselect avec checkboxes
- `/public/assets/css/collection.css` - Styles métadonnées + accordéon
- `/public/api/items.php` - Retourne `primary_type` avec nom traduit
- `/lang/fr.php` & `/lang/en.php` - Traductions `primary_types.*`

#### API item-metadata.php
```javascript
// Récupérer les champs d'un type
GET /api/item-metadata.php?action=fields&type_id=2
// Réponse: { success: true, data: { type_id: 2, fields: [...] } }

// Récupérer les valeurs d'un item
GET /api/item-metadata.php?action=values&item_id=16
// Réponse: { success: true, data: { item_id: 16, values: {...} } }

// Sauvegarder les métadonnées
POST /api/item-metadata.php
{ item_id: 16, type_id: 7, metadata: { "69": "LEGO", "71": 7541 } }
```

#### Fonctionnalités
- ✅ Champs dynamiques selon le type primaire
- ✅ Support multilingue (labels FR/EN)
- ✅ Types de champs variés (text, number, select, multiselect, etc.)
- ✅ Dropdowns custom stylés (thème compatible)
- ✅ Affichage en accordéon replié dans modal consultation
- ✅ Badge type primaire avec icône et couleur
- ✅ Onglet "Détails" dans formulaire d'édition
- ✅ Sauvegarde automatique avec l'item

---

### 🔐 Chiffrement API pour toys_api (9 décembre 2025)

**Nouveau système** de chiffrement AES-256-GCM pour sécuriser les communications avec l'API toys.

#### Fichiers modifiés
- `/public/api/web-search.php` - Ajout `encryptApiKey()` et header `X-Encrypted-Key`
- `/public/admin/index.php` - Champ "Clé de chiffrement API" dans config générale
- `/public/assets/js/admin-settings.js` - Chargement/sauvegarde `API_ENCRYPTION_KEY`
- `/public/api/admin/config.php` - Nouveau champ autorisé `API_ENCRYPTION_KEY`
- `/lang/fr.php` & `/lang/en.php` - Traductions `admin.api_encryption_key`

#### Table BDD modifiée
```sql
ALTER TABLE Admin_Main_Config ADD COLUMN API_ENCRYPTION_KEY varchar(255);
```

#### Fonctionnement
- Si `API_ENCRYPTION_KEY` est défini, la clé est chiffrée en AES-256-GCM
- Le header `X-Encrypted-Key` remplace `X-Api-Key` pour toys_api
- Format: `base64(iv):base64(encrypted):base64(tag)`
- Compatible avec le déchiffrement côté toys_api

```php
function encryptApiKey($apiKey, $encryptionKey) {
    $iv = random_bytes(12);
    $encrypted = openssl_encrypt($apiKey, 'aes-256-gcm', $encryptionKey, OPENSSL_RAW_DATA, $iv, $tag);
    return base64_encode($iv) . ':' . base64_encode($encrypted) . ':' . base64_encode($tag);
}
```

---

### 🔑 Gestion des Clés API Utilisateur (8-9 décembre 2025)

**Nouvel onglet** dans les paramètres du compte pour gérer les clés API personnelles.

#### Fichiers créés
- `/public/api/user-api-keys.php` - API REST CRUD + test pour clés utilisateur

#### Fichiers modifiés
- `/public/views/account.php` - Onglet "Mes clés API" avec liste des fournisseurs
- `/public/assets/js/account.js` - `loadApiKeys()`, `handleApiKeySubmit()`, `handleApiKeyTest()`
- `/public/assets/css/account.css` - Styles `.api-keys-list`, `.api-provider-item`
- `/public/api/web-search.php` - Utilisation des clés utilisateur quand `USER_API=1`
- `/lang/fr.php` & `/lang/en.php` - Traductions `account.api_keys.*`

#### Table BDD utilisée
```sql
-- users_api (existante)
id, user_id, webapi_id, api_key, Cliend_ID_Token
```

#### Fonctionnalités
- ✅ Liste des fournisseurs nécessitant une clé API personnelle
- ✅ Champ API Key + Client ID (si `CLIENT_ID_ON=1`)
- ✅ Bouton "Tester" avec indicateur visuel (✓/✗)
- ✅ Test automatique avant sauvegarde avec confirmation si échec
- ✅ Support OAuth2 (IGDB via Twitch), login (TheTVDB)
- ✅ Intégration automatique dans web-search.php

#### Fournisseurs supportés (USER_API=1)
| ID | Fournisseur | Type | Client ID |
|----|-------------|------|-----------|
| 16 | Rebrickable | toys | Non |
| 20 | Google Books | books | Non |
| 26 | RAWG | video_games | Non |
| 27 | IGDB | video_games | Oui (Twitch) |
| 29 | TMDB | movies | Non |
| 30 | TheTVDB | movies | Non |

#### Utilisation
```javascript
// Test d'une clé API
fetch('/api/user-api-keys.php?action=test', {
    method: 'POST',
    body: JSON.stringify({ webapi_id: 26, api_key: 'xxx' })
});
```

---

### 🐛 Correction Filtre Type Recherche Web (9 décembre 2025)

**Fix** du bug où les fournisseurs d'autres types étaient envoyés lors d'une recherche.

#### Problème
`activeProviders` n'était pas recalculé quand le type de contenu changeait, envoyant des fournisseurs incorrects.

#### Solution
```javascript
// Dans updateProvidersList()
activeProviders = Object.fromEntries(
    Object.entries(activeProviders).filter(([id]) => 
        providers.some(p => p.id == id && p.type === selectedType)
    )
);
```

#### Fichier modifié
- `/public/assets/js/web-search.js` - Filtrage `activeProviders` par type sélectionné

---

### 📷 Mode Scan pour CameraCapture (8 décembre 2025)

**Nouveau mode** ajouté au module CameraCapture pour optimiser la capture de codes-barres et de texte pour l'OCR.

#### Fichiers modifiés
- `/public/assets/js/camera-capture.js` - Mode scan avec overlay de guidage
- `/public/assets/css/camera-capture.css` - Styles overlay, coins animés, laser
- `/public/assets/js/web-search.js` - Utilise `mode: 'scan'` pour le bouton caméra
- `/lang/fr.php` & `/lang/en.php` - Traductions `camera.scan_*`

#### Fonctionnalités
- ✅ Mode `scan` activé via `CameraCapture.open({ mode: 'scan' })`
- ✅ Overlay visuel avec coins de guidage et frame de scan
- ✅ Sélecteur de type de scan : barcode, document, auto
- ✅ Animation laser pour le mode code-barres
- ✅ Hints contextuels selon le type sélectionné
- ✅ `skipEditor: true` automatique en mode scan
- ✅ Titre du modal adapté ("Scanner" au lieu de "Prendre une photo")
- ✅ Intégré au WebSearchModal pour la recherche par image

#### Utilisation
```javascript
CameraCapture.open({
    mode: 'scan',        // Active le mode scan
    scanType: 'auto',    // 'barcode', 'document' ou 'auto'
    facingMode: 'environment',
    onCapture: (result) => {
        // result.blob contient l'image capturée
    }
});
```

#### Types de scan
| Type | Overlay | Utilisation |
|------|---------|-------------|
| `barcode` | Frame étroit + laser animé | Codes-barres EAN, UPC, QR |
| `document` | Frame large + coins | Texte, documents OCR |
| `auto` | Frame standard + coins | Détection automatique |

---

### 🔍 Système de Recherche Web (6-7 décembre 2025)

**Nouveau module** permettant de rechercher des informations sur le web via différents fournisseurs d'API.

#### Fichiers créés
- `/public/api/web-search.php` - API REST pour fournisseurs et recherche
- `/public/assets/js/web-search.js` - Module modal `WebSearchModal`
- `/public/assets/css/web-search.css` - Styles layout 2 colonnes responsive

#### Fichiers modifiés
- `/public/dashboard.php` - Inclusion CSS + JS + traductions + `window.userInfo`
- `/public/assets/js/collection.js` - Bouton recherche web dans formulaire item
- `/public/assets/css/collection.css` - Styles `.input-with-action`
- `/public/views/collection.php` - Traduction `web_search_btn`
- `/lang/fr.php` & `/lang/en.php` - Section `web_search.*` (60+ clés)

#### Table BDD `Admin_webApi`
| Colonne | Description |
|---------|-------------|
| `Type` | video_games, books, toys, movies, music, generic |
| `USER_API` | Requiert une clé API utilisateur |
| `READ_CODE` | Supporte les codes-barres |
| `PREMIUM_ONLY` | Réservé aux utilisateurs Premium/Admin |
| `max_results_premium/free` | Limites de résultats |

#### Fournisseurs configurés (22 au total)
- **toys** (6) : LEGO, Mega Construx, Rebrickable*, Coleka, Lulu-Berlu, Transformerland
- **books** (6) : Google Books*, OpenLibrary, Comic Vine*, MangaDex, Bédéthèque, Jikan Manga
- **video_games** (3) : RAWG*, IGDB*, JeuxVideo.com
- **movies** (4) : TMDB*, TheTVDB*, IMDB, Jikan Anime
- **music** (1) : Music (Multi)
- **generic** (2) : Barcode Lookup, Paninimania

\* = Requiert une clé API utilisateur

#### Fonctionnalités
- ✅ Modal XL avec layout 2 colonnes (paramètres / résultats)
- ✅ Sélection du type de contenu (custom dropdown thémé)
- ✅ Liste des fournisseurs avec checkboxes d'activation
- ✅ Badges Premium 🔒 et Code-barre sur fournisseurs
- ✅ Fournisseurs Premium grisés/désactivés pour utilisateurs free
- ✅ Recherche textuelle avec bouton stop/cancel
- ✅ Zone de drop image (drag & drop + browse + caméra)
- ✅ Affichage des résultats groupés par fournisseur
- ✅ Import automatique des données vers formulaire item
- ✅ Responsive mobile (colonnes empilées)
- ✅ AbortController pour interrompre les recherches

#### Utilisation
```javascript
WebSearchModal.open({
    query: 'Final Fantasy VII',
    type: 'video_games',
    onSelect: (result) => {
        console.log(result.title, result.description);
    }
});
```

---

### 🛠️ Admin - Gestion APIs Web (7 décembre 2025)

**Améliorations du panel d'administration** pour la gestion des APIs externes.

#### Fichiers modifiés
- `/public/admin/index.php` - Modal édition API avec custom dropdown et toggle PREMIUM_ONLY
- `/public/assets/js/admin-settings.js` - Gestion dropdown + chargement/sauvegarde PREMIUM_ONLY
- `/public/assets/css/admin.css` - Styles custom dropdown + badge `.feature-badge.premium`
- `/public/api/admin/config.php` - Ajout PREMIUM_ONLY dans les champs autorisés
- `/lang/fr.php` & `/lang/en.php` - Traductions `api_premium_only`, `select_type`

#### Fonctionnalités
- ✅ Dropdown "Type de contenu" avec style thémé (remplace select natif)
- ✅ Toggle "Réservé Premium" pour limiter l'accès aux fournisseurs
- ✅ Badge PREMIUM doré dans le tableau des APIs
- ✅ Types disponibles : toys, books, movies, video_games, music, generic

---

### 🚀 Boutons Ajout Rapide Header (6 décembre 2025)

**Nouveaux boutons** dans la navbar pour ajouter rapidement des items et catégories depuis n'importe quelle page.

#### Fichiers modifiés
- `/public/dashboard.php` - Ajout des boutons `#quickAddBtn` et `#quickAddCategoryBtn`
- `/public/assets/js/dashboard.js` - Handlers `initQuickAdd()` et `initQuickAddCategory()`
- `/public/assets/js/collection.js` - Vérification `pendingQuickAdd` dans `init()`
- `/public/assets/js/categories.js` - Vérification `pendingQuickAddCategory` + exposition `openAddModal()`
- `/lang/fr.php` & `/lang/en.php` - Traductions `quick_add` et `quick_add_category`

#### Fonctionnement
- Utilise `SnowShelfRouter.getCurrentPage()` pour détecter la page actuelle
- Si déjà sur la bonne page : ouvre directement le modal
- Sinon : met un flag `window.pendingQuickAdd` et navigue, le modal s'ouvre après chargement

---

### 🖊️ Bouton Édition sur Items (5-6 décembre 2025)

**Bouton d'édition rapide** sur chaque item de la page collection.

#### Fichiers modifiés
- `/public/assets/js/collection.js` - Bouton dans `createItemCard()` et `createItemRow()`
- `/public/assets/css/collection.css` - Styles `.item-edit-btn` avec animation au survol

#### Fonctionnement
- Icône crayon apparaît au survol de la carte/ligne
- Clic ouvre directement le modal en mode édition (`openItemModal(id, true)`)
- Clic sur la carte elle-même ouvre en mode consultation

---

### 🏷️ Sélecteur de Catégories Multi-select (5 décembre 2025)

**Nouveau composant** dropdown avec checkboxes pour sélectionner plusieurs catégories sur un item.

#### Fichiers modifiés
- `/public/assets/js/collection.js` - Fonction `createCategoriesSelector()`
- `/public/assets/css/collection.css` - Styles `.categories-dropdown-*`
- `/public/api/user-categories.php` - Ajout `parent_ids` depuis tables de relations

#### Fonctionnalités
- ✅ Checkboxes pour multi-sélection
- ✅ Toggle "Afficher catégories par défaut"
- ✅ Toggle "Sélectionner automatiquement les parents"
- ✅ Groupes visuels (Mes catégories / Par défaut)
- ✅ Icônes catégories (images ou emoji fallback)

#### Tables BDD utilisées
- `category_mothers` - Relations parent (id_fille, id_mere, user_id)
- `category_mothers_default` - Relations parent catégories système

---

### 🎨 Dropdown Personnalisé Statuts (5 décembre 2025)

**Remplacement** du `<select>` natif par un dropdown custom thémable pour les statuts d'items.

#### Fichiers modifiés
- `/public/assets/js/collection.js` - Fonction `createStatusDropdown()`
- `/public/assets/css/collection.css` - Styles `.status-dropdown-*`

#### Fonctionnalités
- ✅ Affichage couleur + nom du statut
- ✅ Menu attaché au body (`position: fixed`) pour éviter overflow
- ✅ Fond opaque avec `var(--sidebar-bg)`
- ✅ Séparation visuelle statuts personnels / par défaut
- ✅ Toggle pour afficher/masquer les statuts par défaut

---

### 🔧 Correction Bug Recherche API (5 décembre 2025)

**Fix** de l'erreur 500 lors de la recherche dans la collection.

#### Problème
PDO n'accepte pas le même placeholder (`:search`) utilisé plusieurs fois dans une requête avec `execute()`.

#### Solution
```php
// Avant (erreur)
$whereConditions[] = '(i.name LIKE :search OR i.description LIKE :search)';
$params[':search'] = '%' . $search . '%';

// Après (corrigé)
$whereConditions[] = '(i.name LIKE :search_name OR i.description LIKE :search_desc)';
$params[':search_name'] = $searchPattern;
$params[':search_desc'] = $searchPattern;
```

---

### 📦 Page Collection - Affichage des items (5 décembre 2025)

**Nouvelle page** pour afficher et gérer les items de la collection utilisateur.

#### Fichiers créés
- `/public/views/collection.php` - Vue principale avec toolbar sticky et filtres
- `/public/api/items.php` - API REST CRUD pour les items (~610 lignes)
- `/public/api/user-categories.php` - API pour récupérer les catégories accessibles
- `/public/assets/css/collection.css` - Styles responsives avec theming (~550 lignes)
- `/public/assets/js/collection.js` - Module JavaScript avec lazy loading (~930 lignes)

#### Fonctionnalités
- ✅ **Vue grille** : Cartes avec vignette, note, catégories, valeur
- ✅ **Vue liste** : Lignes compactes avec infos essentielles
- ✅ **Lazy loading** des images (IntersectionObserver)
- ✅ **Infinite scroll** pour chargement paginé (50 items/page)
- ✅ **Recherche** avec debounce (300ms)
- ✅ **Tri** : Nom A-Z/Z-A, récent/ancien, note, valeur
- ✅ **Filtres avancés** (panel slide) :
  - Catégorie
  - Note minimum (slider 0-5)
  - Plage de valeur marchande
  - Période d'acquisition
  - État de recherche (non recherché/en recherche/trouvé)
- ✅ **Tags filtres actifs** avec suppression individuelle
- ✅ **Cache-busting** images (`?v=timestamp`)
- ✅ **Bouton retour en haut** (apparaît au scroll)
- ✅ **Persistance** vue/tri dans localStorage
- ✅ **États** : Loading, vide, aucun résultat
- ✅ Responsive mobile-first
- ✅ Support complet i18n (fr/en)
- ✅ Compatible avec tous les thèmes CSS

#### API Items (`/api/items.php`)
| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `?page=1&limit=50` | Liste paginée avec filtres |
| GET | `?id=X` | Détails complets (images, catégories, grades, médias) |
| POST | body JSON | Création d'un item |
| PUT | body JSON | Modification d'un item |
| DELETE | `?id=X` | Suppression d'un item |

#### Router SPA
- ✅ Ajout `onLoad` pour initialiser `CollectionPage.init()`
- ✅ Ajout `onUnload` pour nettoyer `CollectionPage.destroy()`

#### Traductions ajoutées
- Section `collection.*` complète (50+ clés) en fr/en
- Section `api.*` pour les erreurs API

#### Tables BDD utilisées
- `items` - Items principaux (id, user_id, name, description, rating, market_value, etc.)
- `item_img` - Images des items
- `item_categories` - Relation items ↔ catégories
- `item_grades`, `item_videos`, `item_audio`, `item_doc` - Médias associés

#### Usage
```javascript
// API publique
CollectionPage.init();         // Initialisation manuelle
CollectionPage.destroy();      // Nettoyage (observers)
CollectionPage.refresh();      // Recharger les données
CollectionPage.setViewMode('grid');  // 'grid' ou 'list'
CollectionPage.openItemModal(itemId);  // TODO: à implémenter
CollectionPage.openAddItemModal();     // TODO: à implémenter
```

#### À implémenter
- ⏳ Modal d'ajout/édition d'item
- ⏳ Upload d'images pour les items
- ⏳ Grades et médias dans l'édition

---

### 📄 DocumentViewer - Visionneuse de documents multi-format (4 décembre 2025)

**Nouveau module** pour visualiser différents types de documents directement dans le navigateur.

#### Fichiers créés
- `/public/assets/js/document-viewer.js` - Module JavaScript principal (~1370 lignes)
- `/public/assets/css/document-viewer.css` - Styles responsives avec theming (~450 lignes)

#### Librairies téléchargées
- `/public/assets/libs/pdfjs/` - PDF.js 4.0.379 (~1.3MB total)
- `/public/assets/libs/jszip/` - JSZip 3.10.1 (~96KB)
- `/public/assets/libs/epubjs/` - Epub.js 0.3.93 (~219KB)
- `/public/assets/libs/unrar/` - Libarchive.js 2.0.2 (~1MB avec WASM)

#### Formats supportés
| Type | Extensions | Méthode |
|------|------------|---------|
| Images | jpg, jpeg, png, gif, webp, svg, bmp | Native `<img>` avec zoom/rotation |
| PDF | pdf | PDF.js avec navigation pages |
| Texte | txt | Native fetch |
| Archives | zip | JSZip avec extraction individuelle |
| eBooks | epub | Epub.js avec sommaire |
| Comics | cbz | JSZip pour images |
| Comics | cbr | Libarchive.js (RAR via WASM) |
| Téléchargement | doc, docx, odt, ods, odp, odg | Dialogue téléchargement |

#### Fonctionnalités
- ✅ **Images** : Zoom (molette/pincement), pan, rotation, téléchargement
- ✅ **PDF** : Navigation pages, zoom, saisie numéro de page
- ✅ **Texte** : Affichage mono-espacé avec scroll
- ✅ **Archives** : Arborescence fichiers, extraction individuelle ou complète
- ✅ **EPUB** : Table des matières, navigation chapitres, sidebar
- ✅ **Comics** : Mode page simple ET double page (manga), navigation clavier/swipe
- ✅ Chargement différé des librairies (lazy loading)
- ✅ Interface plein écran type ImageEditor
- ✅ Navigation clavier (flèches, Escape)
- ✅ Support tactile (swipe pour comics/epub)
- ✅ Support complet i18n (fr/en)
- ✅ Compatible avec tous les thèmes CSS

#### Usage
```javascript
// Ouvrir un fichier
DocumentViewer.open('/path/to/file.pdf', 'document.pdf');
DocumentViewer.open(blob, 'archive.zip');

// Avec options
DocumentViewer.open(url, 'comic.cbr', {
    onClose: () => console.log('Fermé')
});

// Vérifier le support
if (DocumentViewer.isSupported('file.pdf')) { ... }

// Fermer
DocumentViewer.close();
```

---

### 📷 CameraCapture - Capture photo avec caméra (3 décembre 2025)

**Nouveau module** pour la capture de photos via la caméra de l'appareil.

#### Fichiers créés
- `/public/assets/js/camera-capture.js` - Module JavaScript principal (~920 lignes)
- `/public/assets/css/camera-capture.css` - Styles responsives avec theming (~520 lignes)

#### Fonctionnalités
- ✅ Accès à la caméra avec permissions utilisateur
- ✅ Sélection de caméra : bouton switch sur mobile, liste déroulante avec noms sur desktop
- ✅ Zoom : molette, pincement tactile, slider et boutons +/-
- ✅ Flash : on/off (si supporté par le hardware)
- ✅ Bouton de capture central avec animation flash
- ✅ Intégration automatique avec ImageEditor après capture
- ✅ Option `skipEditor` pour retour direct sans édition
- ✅ Gestion des erreurs (permissions, caméra non trouvée)
- ✅ Interface responsive PC et smartphone
- ✅ Support complet i18n (fr/en)
- ✅ Compatible avec tous les thèmes CSS

#### Améliorations (3 décembre 2025 - soir)
- ✅ Sélecteur de caméra avec vrais noms des périphériques sur desktop
- ✅ Détection intelligente du type de caméra (avant, arrière, grand angle, téléobjectif)
- ✅ Rafraîchissement des labels après permission (les noms sont masqués avant)
- ✅ Fix : erreur `currentState null` après capture (sauvegarde de l'état avant fermeture)
- ✅ Fix : zone vidéo ajustée (max-height: 50vh) pour afficher tous les contrôles

#### Intégration Catégories
- ✅ Bouton 📷 dans l'onglet Images des modals catégories
- ✅ Méthode `MediaListManager.addFromImageEditor()` pour ajout externe
- ✅ Flux complet : Caméra → ImageEditor → MediaListManager

#### Usage
```javascript
CameraCapture.open({
    caller: 'modal-parent',
    targetField: 'avatar',
    facingMode: 'environment',  // 'user' pour caméra avant
    skipEditor: false,
    onCapture: (result) => {
        // result.blob, result.tempPath (si via ImageEditor)
    },
    onCancel: () => {}
});
```

---

### 🆕 MediaListManager - Gestionnaire de médias (3 décembre 2025)

**Nouveau module** pour la gestion des médias dans les modals de catégories.

#### Fichiers créés
- `/public/assets/js/media-list-manager.js` - Module JavaScript principal (1361 lignes)
- `/public/assets/css/media-list-manager.css` - Styles responsives avec theming
- `/public/api/category-media.php` - API CRUD pour les médias de catégories
- `/docs/MEDIA_LIST_MANAGER.md` - Documentation complète

#### Fonctionnalités
- ✅ Upload par drag & drop avec zone visible et cliquable
- ✅ Intégration ImageEditor pour édition d'images au drop
- ✅ Prévisualisation : miniatures images/vidéos, icônes audio/documents
- ✅ Réorganisation par glisser-déposer (drag handle)
- ✅ Lecteur audio intégré avec contrôles
- ✅ Mode création avec fichiers temporaires (pending files)
- ✅ Finalisation des fichiers après création d'entité
- ✅ Suppression individuelle et globale
- ✅ Compteurs dans les onglets médias
- ✅ Support complet des thèmes CSS

#### Tables de base de données
- `category_img` - Images des catégories
- `category_videos` - Vidéos avec thumbnails
- `category_audio` - Fichiers audio
- `category_doc` - Documents

---

### 🎬 FFmpeg - Intégration binaire statique (3 décembre 2025)

**Objectif** : Génération de thumbnails vidéo sans installation système.

#### Fichiers créés
- `/bin/ffmpeg` - Binaire statique FFmpeg 7.0.2 (76 MB)
- `/bin/ffprobe` - Binaire statique FFprobe (76 MB)
- `/bin/setup-ffmpeg.sh` - Script de téléchargement/installation
- `/bin/.gitignore` - Exclusion des binaires du versioning

#### Utilisation
```php
// Chemin du binaire dans category-media.php
$ffmpegBin = realpath(__DIR__ . '/../../bin/ffmpeg');

// Extraction thumbnail à 1 seconde
$cmd = "{$ffmpegBin} -i {$videoPath} -ss 00:00:01 -vframes 1 -q:v 2 {$thumbPath}";
```

---

### 🖼️ ImageEditor - Améliorations (3 décembre 2025)

#### Corrections de bugs
- ✅ Fix double ouverture du modal après sauvegarde
- ✅ Ajout flag `isSaving` pour éviter les clics multiples
- ✅ Fermeture du modal même en cas d'erreur d'upload
- ✅ Reset du flag dans `resetState()`

#### Fichiers modifiés
- `/public/assets/js/image-editor.js`

---

### 🪟 ModalManager - Corrections accessibilité (3 décembre 2025)

#### Corrections
- ✅ Fix avertissement `aria-hidden` sur élément avec focus
- ✅ Correction `togglePreviousModal()` - mauvais index après suppression
- ✅ Ajout paramètre `afterRemoval` pour calcul correct de l'index

#### Fichiers modifiés
- `/public/assets/js/modal-manager.js`

---

### 🎨 Thèmes CSS - Nouvelles variables (3 décembre 2025)

#### Variables ajoutées dans `themes.css`
```css
--overlay-bg: rgba(0, 0, 0, 0.6);   /* Fond overlays (badges, boutons) */
--overlay-text: #fff;               /* Texte sur overlays */
--viewer-bg: #000;                  /* Fond viewer médias */
--shadow-color: 0, 0, 0;            /* Couleur ombres (RGB) */
```

#### Fichiers corrigés pour le theming
- `/public/assets/css/media-list-manager.css` - Toutes couleurs en variables

---

### 🔧 Corrections API (3 décembre 2025)

#### image-temp.php
- ✅ Fix typo `loger.php` → `logger.php`
- ✅ Fix `GLOB_BRACE` non disponible sur Alpine Linux
- ✅ Remplacement par boucle sur extensions individuelles

#### UploadConfig.php
- ✅ Fix connexion BDD - utilisation de `getDbConnection()` au lieu de tableau config
- ✅ Support des constantes `DB_*` en fallback

#### category-media.php
- ✅ Fix chemins `../../core/database.php` → `../../config/database.php`
- ✅ Fix ApiAuth - utilisation instance au lieu de statique
- ✅ Fix colonnes SQL : `filename→title`, `path→url`, `order→ordre`, `thumbnail_path→thumbnail_url`
- ✅ Fix `thumbnail_url` uniquement pour vidéos dans UPDATE
- ✅ Ajout préfixe `/storage` aux chemins retournés

---

### 🌍 Traductions ajoutées (3 décembre 2025)

#### Section `media.*` (fr.php / en.php)
```php
'media' => [
    'images' => 'Images',
    'videos' => 'Vidéos',
    'audio' => 'Audio',
    'documents' => 'Documents',
    'add_files' => 'Ajouter',
    'delete_all' => 'Tout supprimer',
    'drag_drop' => 'Glissez-déposez ou cliquez ici',
    'no_files' => 'Aucun fichier',
    'confirm_delete' => 'Supprimer ce fichier ?',
    'confirm_delete_all' => 'Supprimer tous les fichiers ?',
    'error_upload' => 'Erreur lors de l\'upload',
    'error_delete' => 'Erreur lors de la suppression',
    'error_type' => 'Type de fichier non autorisé',
    'uploading' => 'Upload en cours...',
]
```

#### Onglets médias catégories
- `media_tab_images`, `media_tab_videos`, `media_tab_audio`, `media_tab_documents`
- `media_hint_images`, `media_hint_videos`, `media_hint_audio`, `media_hint_documents`

---

### 📂 Intégration dans Categories (3 décembre 2025)

#### categories.js
- ✅ Ajout interface à onglets pour les médias (images, vidéos, audio, documents)
- ✅ Initialisation MediaListManager pour chaque type
- ✅ Mise à jour des compteurs d'onglets en temps réel
- ✅ Finalisation des fichiers pending à la sauvegarde
- ✅ Hints d'aide pour chaque panneau média

#### categories.css
- ✅ Styles pour `.media-tabs`, `.media-tab`
- ✅ Styles pour `.media-panels`, `.media-panel`
- ✅ Styles pour `.media-panel-hint`
- ✅ Responsive mobile

#### dashboard.php
- ✅ Inclusion CSS `media-list-manager.css`
- ✅ Inclusion JS `media-list-manager.js`
- ✅ Ajout traductions `media.*` dans l'objet translations

---

## 📅 Sessions précédentes

### Panel Administration (Novembre-Décembre 2025)
- Interface d'administration complète
- Gestion des uploads (extensions, tailles)
- Gestion des APIs externes
- Gestion des systèmes de notation
- Configuration du site

### Système de Catégories (Novembre 2025)
- CRUD complet des catégories
- Catégories par défaut vs personnalisées
- Modal de création/édition
- IconEditor pour sélection d'icônes

### ImageEditor (Novembre 2025)
- Éditeur d'images complet
- Recadrage, rotation, filtres
- Support mobile avec gestures
- Sauvegarde temporaire

### ModalManager (Novembre 2025)
- Système de modals empilables
- Confirm, Alert, Loading
- Accessibilité ARIA
- Animations

### Authentification (Octobre-Novembre 2025)
- Inscription avec vérification email
- Connexion avec "Se souvenir de moi"
- Gestion des sessions
- API utilisateurs

---

*Ce fichier est mis à jour à chaque session de développement.*
