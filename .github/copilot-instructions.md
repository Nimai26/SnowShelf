```instructions
# SnowShelf - Contexte Projet

> **FICHIER CRITIQUE** - À lire au début de chaque session de travail

## 🔧 Infos Techniques Essentielles

| Élément | Valeur |
|---------|--------|
| **URL** | https://snowshelf.snowmanprod.fr |
| **Chemin serveur** | /NAS/Data/Websites/SnowShelf |
| **Point de montage Docker swag** | /Websites/SnowShelf |
| **Container Docker** | swag |
| **PHP via Docker** | `docker exec swag php -r "CODE"` |
| **DB Host** | 10.110.1.1:3307 |
| **DB Name** | snowshelf |
| **DB User/Pass** | Nimai / Amiral_Ackbar@38 |

## 🎨 Thèmes CSS - OBLIGATOIRE

**Fichier** : `/public/themes/themes.css` | **Usage** : `<html data-theme="dracula">`

### Variables à TOUJOURS utiliser (jamais de couleurs en dur !)
```css
/* Fonds */
--main-bg-color, --card-bg, --modal-bg-color, --dropdown-bg, --sidebar-bg

/* Textes */
--text, --text-muted, --text-heading

/* Boutons */
--button-primary, --button-danger, --button-success, --button-text

/* Formulaires */
--input-bg, --input-border, --border-color

/* États */
--success-color, --error-color, --warning-color

/* Couleurs RGB (pour rgba()) */
--accent-color → rgba(var(--accent-color), 0.5)
--warning-color-rgb → rgba(var(--warning-color-rgb), 0.3)

/* Overlays (badges, boutons sur médias) */
--overlay-bg, --overlay-text, --viewer-bg, --shadow-color
```

## 🌍 i18n - Traductions

```php
require_once __DIR__ . '/../core/i18n.php';
echo __('section.key');              // Récupérer traduction
$lang = getLang();                   // Langue actuelle (fr/en)
```

## 👤 Session Utilisateur

```php
$_SESSION['user_id'], $_SESSION['username'], $_SESSION['is_admin'], $_SESSION['is_premium']
$_SESSION['theme'], $_SESSION['lang_pref']  // Admin = automatiquement Premium
```

## 📁 Structure Clés

```
/public/dashboard.php       # Shell SPA principal
/public/views/              # Fragments SPA (home.php, account.php, categories.php, collection.php)
/public/api/                # API REST (users.php, items.php, category-media.php, pages.php)
/public/admin/              # Panel administration
/public/assets/js/admin/    # Modules ES6 admin (voir section dédiée)
/public/assets/images/users/{id}/ # Avatars (accès direct)
/public/themes/themes.css   # ⚠️ THÈMES (pas dans assets)
/core/                      # Classes PHP (i18n, ApiAuth, SecureUpload, UploadConfig)
/storage/users/{id}/        # Médias collections utilisateurs (items)
/storage/default_categories/{id}/ # Médias catégories système
/storage/temp/              # Fichiers temporaires (ImageEditor)
/bin/                       # Binaires (ffmpeg, ffprobe)
```

## 🛠️ Architecture Admin ES6

```
/public/assets/js/admin/
├── main.js                 # Point d'entrée principal
├── core/
│   ├── state.js            # État partagé (primaryTypesData, typeFieldsData, transformTypesData)
│   ├── api.js              # Fonctions fetch API avec gestion d'erreurs
│   └── utils.js            # Utilitaires (formatDate, getIcon, debounce)
├── ui/
│   ├── dropdown.js         # Dropdowns custom avec protection double-init
│   └── modals.js           # Gestion des modals (open, close, reset)
└── settings/
    ├── index.js            # Point d'entrée onglet Settings
    └── modules/
        ├── apis.js         # Gestion APIs externes
        ├── grades.js       # Systèmes de notation
        ├── type-fields.js  # Champs de métadonnées par type
        ├── field-mappings.js # Mappings API → champs
        ├── databases/      # Gestion bases de données
        └── users/          # Gestion utilisateurs
```

**Imports absolus** (depuis la racine `/assets/js/admin/`) :
```javascript
import { primaryTypesData, setPrimaryTypesData } from '/assets/js/admin/core/state.js';
import { apiRequest } from '/assets/js/admin/core/api.js';
import { initModalCustomDropdown } from '/assets/js/admin/ui/dropdown.js';
```

**Patterns clés** :
- `initModalCustomDropdown(modal, selector)` : Initialise dropdown dans un modal (protection double-init intégrée)
- État partagé via `state.js` avec setters (`setPrimaryTypesData()`)
- Chargement référence data avant ouverture modals (async/await)

## 🧭 Router SPA

```javascript
// API publique - SnowShelfRouter
SnowShelfRouter.navigateTo('collection');  // Navigation SPA
SnowShelfRouter.getCurrentPage();          // Page actuelle ('home', 'collection', 'categories', etc.)
SnowShelfRouter.reload();                  // Recharger la page actuelle

// Pages disponibles : home, account, collection, categories, scan, wishlist, settings, admin
// onLoad : appelé après chargement du HTML (init modules)
// onUnload : appelé avant changement de page (cleanup)
```

## 🪟 Modals vs 🍞 Toasts

**Modals** (`ModalManager`) : Actions nécessitant confirmation ou saisie
```javascript
// Confirmation (retourne Promise<boolean>)
if (await ModalManager.confirm('Supprimer ?', { type: 'danger' })) { /* ... */ }

// Alerte
await ModalManager.alert('Info importante', { type: 'info' });

// Modal personnalisé avec empilement possible
ModalManager.open({ title: 'Titre', content: '<p>HTML</p>', onConfirm: (id) => {} });

// Boutons : btn-danger à gauche, autres à droite (automatique)
buttons: [
    { text: 'Supprimer', action: 'delete', class: 'btn-danger' },
    { text: 'Annuler', action: 'close', class: 'btn-secondary' },
    { text: 'Valider', action: 'confirm', class: 'btn-primary' }
]
```

**Toasts** : Notifications non-bloquantes (succès, erreur, info)
```javascript
showToast('Message', 'success');  // success, error, warning, info
```

## 🔒 Sécurité Uploads

```php
require_once __DIR__ . '/../core/SecureUpload.php';
$result = SecureUpload::upload($_FILES['file'], 'images', $destDir);
// Config dynamique depuis table upload_config (via UploadConfig.php)
// Catégories: avatar(5MB), images(10MB), audio(50MB), videos(500MB), documents(50MB)
```

## 🖼️ ImageEditor - Édition d'images

```javascript
ImageEditor.open({
    image: file,  // File, Blob ou URL
    onSave: (result) => {
        // result.tempPath, result.blob, result.width, result.height
    },
    onCancel: () => {}
});
```

## 📷 CameraCapture - Capture photo

```javascript
CameraCapture.open({
    caller: 'modal-id',        // Modal appelant (optionnel)
    targetField: 'avatar',     // Champ de destination (optionnel)
    facingMode: 'environment', // 'environment' (arrière) ou 'user' (avant)
    skipEditor: false,         // true = retour direct sans ImageEditor
    mode: 'default',           // 'default' ou 'scan' pour OCR/barcode
    scanType: 'auto',          // 'barcode', 'document' ou 'auto' (si mode='scan')
    onCapture: (result) => {
        // result.blob, result.tempPath (si via ImageEditor)
    },
    onCancel: () => {}
});

// Mode scan pour WebSearchModal (recherche par image)
CameraCapture.open({
    mode: 'scan',
    scanType: 'auto',          // Détection automatique barcode/texte
    onCapture: (result) => {
        // result.blob directement (skipEditor automatique)
    }
});

// Intégration avec MediaListManager (après capture via ImageEditor)
mediaManager.addFromImageEditor(result);
```

**Comportement PC vs Mobile :**
- Desktop (>768px) : Liste déroulante avec noms des caméras
- Mobile (≤768px) : Bouton switch avant/arrière

**Mode Scan :**
- `mode: 'scan'` active l'overlay de guidage avec coins animés
- `scanType: 'barcode'` affiche un frame étroit avec laser animé
- `scanType: 'document'` affiche un frame large pour texte/documents
- `scanType: 'auto'` détecte automatiquement le type
- Sélecteur de type dans la toolbar pour changer en cours de capture

## 📄 DocumentViewer - Visionneuse de documents

```javascript
// Ouvrir un fichier (URL ou Blob)
DocumentViewer.open('/path/to/file.pdf', 'document.pdf');
DocumentViewer.open(blob, 'archive.zip', { onClose: () => {} });

// Vérifier si format supporté pour prévisualisation
if (DocumentViewer.isSupported('file.cbr')) { ... }

// Fermer manuellement
DocumentViewer.close();
```

**Formats supportés :**
- Images : jpg, jpeg, png, gif, webp, svg, bmp (zoom, rotation)
- PDF : pdf (navigation pages via PDF.js)
- Texte : txt (affichage mono-espacé)
- Archives : zip (extraction via JSZip)
- eBooks : epub (table des matières via Epub.js)
- Comics : cbz (JSZip), cbr (Libarchive.js) - modes page simple/double

**Librairies (dans `/public/assets/libs/`) :**
- pdfjs/ - PDF.js 4.0.379
- jszip/ - JSZip 3.10.1
- epubjs/ - Epub.js 0.3.93
- unrar/ - Libarchive.js 2.0.2 (avec WASM)

## 🔍 WebSearchModal - Recherche Web

```javascript
// Ouvrir le modal de recherche web
WebSearchModal.open({
    query: 'Nom de l\'item',           // Texte pré-rempli (optionnel)
    type: 'video_games',               // Type pré-sélectionné (optionnel)
    onSelect: (result) => {            // Callback quand résultat sélectionné
        // result.title, result.description, result.image_url
        // result.metadata.year, result.metadata.rating
        // result.source_url, result.provider
    }
});

// Fermer le modal
WebSearchModal.close();
```

**Types disponibles** : `video_games`, `books`, `toys`, `movies`, `music`, `generic`

**API REST** (`/api/web-search.php`) :
- `GET ?action=providers` - Liste des fournisseurs
- `GET ?action=providers&type=video_games` - Fournisseurs filtrés par type
- `POST action=search` - Lancer une recherche textuelle
- `POST action=search_image` - Recherche par image (OCR/barcode)

**Table BDD** : `Admin_webApi`
```sql
-- Colonnes principales
id, name, Name_UF, Type, Defaut_active, USER_API, READ_CODE, PREMIUM_ONLY
max_results_premium, max_results_free, api_key, client_id, Notes
```

**Gestion Premium** :
- `PREMIUM_ONLY = 1` : Fournisseur réservé aux utilisateurs Premium/Admin
- Les fournisseurs premium sont grisés et désactivés pour les utilisateurs free
- `window.userInfo = { isPremium: bool, isAdmin: bool }` exposé dans dashboard.php

**Clés API Utilisateur** :
- `USER_API = 1` : Fournisseur nécessitant une clé API personnelle
- Clés stockées dans `users_api` (user_id, webapi_id, api_key, Cliend_ID_Token)
- `web-search.php` récupère automatiquement la clé utilisateur si `USER_API=1`

**Chiffrement API toys_api** :
- Clé de chiffrement dans `Admin_Main_Config.API_ENCRYPTION_KEY`
- Utilise AES-256-GCM avec IV aléatoire
- Header `X-Encrypted-Key` au lieu de `X-Api-Key` quand chiffrement actif

## 🔑 Clés API Utilisateur

```javascript
// Test d'une clé API
fetch('/api/user-api-keys.php?action=test', {
    method: 'POST',
    body: JSON.stringify({ webapi_id: 26, api_key: 'xxx' })
});

// Sauvegarder une clé
fetch('/api/user-api-keys.php', {
    method: 'POST',
    body: JSON.stringify({ webapi_id: 27, api_key: 'xxx', client_id: 'yyy' })
});
```

**API REST** (`/api/user-api-keys.php`) :
- `GET` - Liste des fournisseurs nécessitant une clé + clés utilisateur existantes
- `POST ?action=test` - Tester une clé API (retourne `{valid: bool}`)
- `POST` - Sauvegarder/mettre à jour une clé
- `DELETE ?webapi_id=X` - Supprimer une clé

**Table BDD** : `users_api`
```sql
id, user_id, webapi_id, api_key, Cliend_ID_Token
```

**Fournisseurs USER_API=1** : Rebrickable(16), Google Books(20), RAWG(26), IGDB(27), TMDB(29), TheTVDB(30)

**Validations spécifiques** :
- IGDB : OAuth2 Twitch (`client_credentials` grant)
- TheTVDB : Login API (`/login` endpoint)
- Autres : Requête test vers endpoint de base

## 📂 MediaListManager - Gestion des médias

```javascript
const manager = MediaListManager.create({
    container: element,
    type: 'images',  // images, videos, audio, documents
    apiEndpoint: '/api/category-media.php',
    entityType: 'category',
    entityId: 123,   // null = mode création (fichiers temporaires)
    userId: window.userId,
    isDefault: false,
    onFilesChange: (data) => { /* data.files, data.pendingFiles */ },
    onError: (msg) => showToast(msg, 'error')
});
manager.loadFiles();

// Après création d'entité, finaliser les fichiers temporaires
await manager.finalizePendingFiles(newEntityId);
```

## 📦 CollectionPage - Page Collection

```javascript
// API publique - Initialisation automatique si .collection-page présent
CollectionPage.init();      // Initialiser manuellement (appelé par router)
CollectionPage.destroy();   // Nettoyer (appelé par router onUnload)
CollectionPage.refresh();   // Recharger les données
CollectionPage.setViewMode('grid');  // 'grid' ou 'list'
CollectionPage.openItemModal(itemId);       // Ouvrir modal consultation
CollectionPage.openItemModal(itemId, true); // Ouvrir modal édition directe
CollectionPage.openAddItemModal();          // Ouvrir modal création

// Flag pour ajout rapide depuis header
window.pendingQuickAdd = true;  // Vérifié dans init()
```

## 📋 Métadonnées Dynamiques (Items)

**Pattern EAV** avec tables `primary_type`, `primary_type_fields`, `item_metadata`

**11 Types primaires** : books, video_games, music, movies, series, toys_fig, toys_construct, divers, board_games, trading_cards, sticker_albums

```javascript
// API - Récupérer les champs d'un type
GET /api/item-metadata.php?action=fields&type_id=2

// API - Récupérer les valeurs d'un item
GET /api/item-metadata.php?action=values&item_id=16

// API - Sauvegarder les métadonnées
POST /api/item-metadata.php
{ item_id: 16, type_id: 7, metadata: { "69": "LEGO", "71": 7541 } }
```

**Types de champs** : text, textarea, number, year, date, select, multiselect, url, rating, duration

**Affichage consultation** : Accordéon replié "Détails" avec grille 2 colonnes
**Affichage édition** : Onglet "Détails" avec champs dynamiques

**Traductions types** : `__('primary_types.video_games')` → "Jeux vidéo"

**API REST Items** (`/api/items.php`) :
- `GET ?page=1&limit=50&sort=name&order=asc` - Liste paginée
- `GET ?id=X` - Détails complet d'un item
- `POST` - Créer un item
- `PUT` - Modifier un item
- `DELETE ?id=X` - Supprimer un item

**Filtres disponibles** : `search`, `category_id`, `status_id`, `min_rating`, `min_value`, `max_value`, `date_from`, `date_to`, `search_state`

**Composants custom** :
- `createStatusDropdown()` - Dropdown thémable pour statuts
- `createCategoriesSelector()` - Multi-select avec checkboxes pour catégories

## 📂 CategoriesPage - Page Catégories

```javascript
// API publique
SnowShelfCategories.init();       // Initialiser (appelé par router)
SnowShelfCategories.reload();     // Recharger les catégories
SnowShelfCategories.openAddModal(); // Ouvrir modal création

// Flag pour ajout rapide depuis header
window.pendingQuickAddCategory = true;  // Vérifié dans init()

// Données de page (définies dans PHP)
window.CategoriesPageData = {
    userId: int,
    isPremium: bool,
    isAdmin: bool,
    translations: {...}
};
```

## 🗂️ Relations Catégories Parentes

```sql
-- Catégories utilisateur
SELECT id_mere FROM category_mothers WHERE id_fille = ? AND user_id = ?

-- Catégories système
SELECT id_mere FROM category_mothers_default WHERE id_fille = ?
```

```javascript
// L'API user-categories.php retourne parent_ids pour chaque catégorie
{ id: 3, name: "Consoles", parent_ids: [1] }  // Parent: Jeux vidéo (id=1)
```

## 🎬 FFmpeg - Thumbnails vidéo

```php
// Binaire statique dans /bin/ffmpeg
$ffmpegBin = realpath(__DIR__ . '/../../bin/ffmpeg');
exec("{$ffmpegBin} -i {$video} -ss 00:00:01 -vframes 1 {$thumb}");
```

## ✅ Règles de Développement

1. **Thèmes** : UNIQUEMENT variables CSS (jamais #hex ou rgb())
2. **i18n** : Tout texte via `__('key')`
3. **Notifications** : Toasts pour feedback, Modals pour actions
4. **Responsive** : Mobile-first obligatoire
5. **Commentaires** : En français 🇫🇷
6. **Métadonnées** : Nouveaux champs via `primary_type_fields`, jamais en colonnes directes

## 📝 Logs

```php
loger('source', 'INFO', 'Message', ['context' => $data]);
```

---
*Docs complètes : /docs/PROJECT_CONTEXT_FULL.md, MEDIA_LIST_MANAGER.md, IMAGE_EDITOR.md*
*Historique : /docs/CHANGELOG.md*
```
