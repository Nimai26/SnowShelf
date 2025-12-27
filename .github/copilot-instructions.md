```instructions
# SnowShelf - Instructions Copilot

## 🔧 Infos Techniques

| Élément | Valeur |
|---------|--------|
| **URL** | https://snowshelf.snowmanprod.fr |
| **Chemin serveur** | /NAS/Data/Websites/SnowShelf |
| **Container Docker** | swag |
| **PHP Docker** | `docker exec swag php -r "CODE"` |
| **DB** | 10.110.1.1:3307 / snowshelf / Nimai / Amiral_Ackbar@38 |

## 📁 Structure Principale

```
/public/dashboard.php       # Shell SPA principal
/public/views/              # Fragments SPA (home, account, categories, collection)
/public/api/                # API REST
/public/admin/              # Panel administration
/public/assets/js/admin/    # Modules ES6 admin
/public/themes/themes.css   # Thèmes CSS (pas dans assets)
/core/                      # Classes PHP
/storage/users/{id}/        # Médias utilisateurs
/lang/                      # Traductions (fr.php, en.php)
```

## 🎨 Thèmes CSS - OBLIGATOIRE

**Fichier** : `/public/themes/themes.css` | **Usage** : `<html data-theme="dracula">`

⚠️ **Toujours utiliser les variables CSS, jamais de couleurs en dur !**

```css
/* Principaux */
--main-bg-color, --card-bg, --text, --text-muted, --border-color
--button-primary, --button-danger, --button-success
--input-bg, --input-border, --success-color, --error-color
/* RGB pour rgba() */
--accent-color → rgba(var(--accent-color), 0.5)
```

## 🌍 i18n

```php
require_once __DIR__ . '/../core/i18n.php';
echo __('section.key');     // Traduction
$lang = getLang();          // fr/en
```

## 👤 Session

```php
$_SESSION['user_id'], $_SESSION['username'], $_SESSION['is_admin'], $_SESSION['is_premium']
// Admin = automatiquement Premium
```

## 🧭 Router SPA

```javascript
SnowShelfRouter.navigateTo('collection');
SnowShelfRouter.getCurrentPage();
// Pages: home, account, collection, categories, scan, wishlist, settings, admin
```

## 🪟 Modals & 🍞 Toasts

```javascript
// Confirmation
if (await ModalManager.confirm('Supprimer ?', { type: 'danger' })) { }
// Toast
showToast('Message', 'success');  // success, error, warning, info
```

## 📦 Composants Principaux

| Composant | Usage |
|-----------|-------|
| `MediaListManager` | Gestion médias (images, vidéos, audio, docs) |
| `ImageEditor` | Édition d'images (crop, rotate) |
| `CameraCapture` | Capture photo/scan |
| `DocumentViewer` | Visionneuse (PDF, images, epub, cbz/cbr) |
| `WebSearchModal` | Recherche web APIs externes |
| `CollectionPage` | Page collection items |
| `SnowShelfCategories` | Page catégories |

## 📋 Métadonnées Items

Pattern EAV : `primary_type`, `primary_type_fields`, `item_metadata`

**11 Types** : books, video_games, music, movies, series, toys_fig, toys_construct, divers, board_games, trading_cards, sticker_albums

```javascript
GET /api/item-metadata.php?action=fields&type_id=2   // Champs
GET /api/item-metadata.php?action=values&item_id=16  // Valeurs
```

## ✅ Règles de Développement

1. **Thèmes** : Variables CSS uniquement (jamais #hex ou rgb())
2. **i18n** : Tout texte via `__('key')`
3. **Notifications** : Toasts feedback, Modals actions
4. **Responsive** : Mobile-first
5. **Commentaires** : En français 🇫🇷
6. **Métadonnées** : Via `primary_type_fields`, jamais colonnes directes

## ⚠️ IMPORT WEB-SEARCH - CRITIQUE

**JAMAIS de chemins d'API codés en dur !** Toute extraction de données doit utiliser les mappings BDD :

| Table | Usage | Exemple |
|-------|-------|---------|
| `item_field_mappings` | Champs fixes (name, description, value, code_barre, images, videos, audio, documents) | `fetchFieldMappings(webapiId)` → `applyMapping(data, mapping)` |
| `primary_type_key_to_field` | Métadonnées type-specific via `api_keys` | `fieldDef.api_keys` → `findValueFromSources(data, sources)` |

**Transforms supportés** : `direct`, `first`, `array`, `join`, `array_join`, `template`, `date`, `none`

**Objets spéciaux** :
- Traduction : `{text: "...", translated: bool}` → extraire `.text`
- Genres : `{genres: [...], genresOriginal: [...]}` → extraire `.genres`

```javascript
// ✅ CORRECT - Mappings BDD
const mappings = await fetchFieldMappings(webapiId);
const value = applyMapping(data, mappings.find(m => m.item_field === 'name'));

// ❌ INTERDIT - Chemins codés en dur
const name = data.title || data.name; // JAMAIS !
const desc = findValueFromSources(data, ['synopsis', 'description']); // JAMAIS !
```

## 📝 Logs

```php
loger('source', 'INFO', 'Message', ['context' => $data]);
```

---
*Docs complètes : /docs/PROJECT_CONTEXT_FULL.md*
```
