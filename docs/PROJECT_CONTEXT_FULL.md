# SnowShelf - Contexte du Projet

> **Ce fichier sert de mémoire pour le développement du projet. À consulter à chaque session de travail.**

---

## 🎯 Vision du Projet

**SnowShelf** est une application web de gestion de collections d'objets geek, conçue pour offrir une expérience complète, agréable et esthétique aux collectionneurs.

---

## 📱 Principes de Design

- **100% Responsive** : Le site doit fonctionner parfaitement sur PC, tablette et smartphone
- **Mobile-first** : Penser d'abord à l'expérience mobile, puis l'adapter au desktop
- **UX prioritaire** : Interface intuitive et agréable à utiliser
- **Esthétique soignée** : Design moderne et attrayant

---

## 🎮 Types de Collections Supportées

Liste non exhaustive des catégories d'objets à gérer :

| Catégorie | Description |
|-----------|-------------|
| 🎮 Jeux vidéo | Tous supports confondus |
| 🎲 Jeux de société | Jeux de plateau, cartes, etc. |
| 🕹️ Consoles & Systèmes | Consoles de jeux, ordinateurs rétro, etc. |
| 🧸 Jouets | Anciens et récents (figurines, LEGO, etc.) |
| 📚 Livres | Romans, BD, mangas, artbooks, etc. |
| 🃏 Cartes à collectionner | Pokemon, Magic, Yu-Gi-Oh, etc. |
| 📼 VHS | Cassettes vidéo |
| 📀 DVD | Films et séries |
| 💿 Blu-ray | Films et séries HD |
| 💽 LaserDisc | Format vintage |
| 🎵 Vinyles | Disques vinyle |
| 💿 CD Audio | Musique sur CD |
| 📼 K7 Audio | Cassettes audio |
| 🖼️ Albums d'images | Type Panini et similaires |

---

## 🌍 Internationalisation (i18n)

### Langues supportées au lancement :
- 🇫🇷 **Français** (fr) - Langue par défaut
- 🇬🇧 **Anglais** (en)

### Architecture i18n :

**Fichiers du système :**
```
/core/i18n.php       # Classe I18n + fonctions helpers
/lang/fr.php         # Traductions françaises
/lang/en.php         # Traductions anglaises
/lang/{code}.php     # Nouvelles langues (à créer)
```

**Usage dans les pages PHP :**
```php
// Charger le système (une seule fois, en haut du fichier)
require_once __DIR__ . '/../core/i18n.php';

// Récupérer une traduction
echo __('auth.login');              // "Connexion" ou "Login"
echo __('auth.username');           // "Nom d'utilisateur" ou "Username"

// Avec paramètres
echo __('collections.item_count', ['count' => 5]);  // "5 objets"

// Afficher directement (echo)
_e('auth.login');

// Récupérer la langue actuelle
$lang = getLang();  // "fr" ou "en"

// Générer le sélecteur de langue HTML
echo renderLangSelector('ma-classe-css');
```

**Structure des fichiers de langue :**
```php
// /lang/xx.php
return [
    '_meta' => [
        'code' => 'xx',
        'name' => 'Nom de la langue',
        'flag' => '🏳️',
        'direction' => 'ltr',  // ou 'rtl' pour arabe/hébreu
    ],
    'auth' => [
        'login' => 'Traduction...',
        'password' => 'Traduction...',
    ],
    // ... autres sections
];
```

**Ajouter une nouvelle langue :**
1. Copier `/lang/en.php` vers `/lang/xx.php`
2. Modifier `_meta` avec les infos de la langue
3. Traduire toutes les valeurs
4. La langue apparaît automatiquement dans le sélecteur

**Sections de traduction disponibles :**
- `common` : Termes génériques (Enregistrer, Annuler, etc.)
- `auth` : Authentification (Connexion, Mot de passe, etc.)
- `errors` : Messages d'erreur
- `success` : Messages de succès
- `nav` : Navigation/menu
- `collections` : Gestion des collections
- `categories` : Noms des catégories d'objets
- `items` : Champs des objets
- `profile` : Profil utilisateur
- `settings` : Paramètres
- `datetime` : Dates et heures

---

## 🎨 Système de Thèmes

- Architecture permettant le changement facile de thèmes visuels
- Variables CSS / système de design tokens
- Support du mode sombre/clair
- Fichier principal : `themes/themes.css`

### Thèmes disponibles (inspirés de theme.park)

#### Thèmes par défaut :
| Thème | data-theme | Description |
|-------|------------|-------------|
| Dark | `dark` | Thème sombre par défaut |
| Dracula | `dracula` | Palette violet/rose |
| Nord | `nord` | Palette arctique bleue |
| Aquamarine | `aquamarine` | Tons bleu-vert océan |
| Plex | `plex` | Style orange/noir Plex |
| Hotline | `hotline` | Néon rétro rose/bleu |
| Hotpink | `hotpink` | Rose vif cyberpunk |
| Space Gray | `space-gray` | Gris spatial élégant |
| Overseerr | `overseerr` | Violet/indigo moderne |
| Maroon | `maroon` | Bordeaux élégant |
| Organizr | `organizr` | Bleu cyan moderne |

#### Thèmes Community :
| Thème | data-theme | Description |
|-------|------------|-------------|
| Catppuccin Mocha | `catppuccin-mocha` | Palette douce moderne |
| OneDark | `onedark` | Atom One Dark |
| True Black | `trueblack` | Noir pur AMOLED |
| Pine Shadow | `pine-shadow` | Sombre + accent doré |
| Ibracorp | `ibracorp` | Rouge corail sur sombre |
| Blackberry Solar | `blackberry-solar` | Orange doré sur sombre |

#### Thèmes Infinity Stones :
| Thème | data-theme | Couleur |
|-------|------------|---------|
| Mind | `infinity-mind` | Jaune doré |
| Soul | `infinity-soul` | Orange |
| Reality | `infinity-reality` | Rouge |
| Power | `infinity-power` | Violet/Magenta |
| Space | `infinity-space` | Bleu profond |
| Time | `infinity-time` | Vert émeraude |

**Usage** : `<html data-theme="dracula">`

### Variables CSS des Thèmes - RÉFÉRENCE COMPLÈTE

**IMPORTANT** : Toujours utiliser ces variables dans le CSS pour la compatibilité avec les thèmes !

```css
/* === ARRIÈRE-PLANS === */
--main-bg-color         /* Fond principal de la page (peut être gradient) */
--modal-bg-color        /* Fond des modales */
--modal-header-color    /* Fond du header des modales */
--modal-footer-color    /* Fond du footer des modales */
--dropdown-bg           /* Fond des menus déroulants */
--card-bg               /* Fond des cartes (souvent semi-transparent) */
--sidebar-bg            /* Fond de la barre latérale */
--navbar-bg             /* Fond de la barre de navigation */

/* === BOUTONS === */
--button-color          /* Couleur bouton par défaut */
--button-color-hover    /* Couleur bouton hover */
--button-text           /* Texte des boutons */
--button-text-hover     /* Texte bouton hover */
--button-primary        /* Bouton principal */
--button-primary-hover  /* Bouton principal hover */
--button-success        /* Bouton succès (vert) */
--button-danger         /* Bouton danger (rouge) */
--button-warning        /* Bouton attention (orange) */

/* === ACCENT === */
--accent-color          /* Couleur d'accent (format RGB: 170, 170, 170) */
--accent-color-hover    /* Accent hover */
--accent-rgb            /* Alias de accent-color */
/* Usage: rgba(var(--accent-color), 0.5) */

/* === LIENS === */
--link-color            /* Couleur des liens */
--link-color-hover      /* Liens hover */

/* === LABELS/BADGES === */
--label-text-color      /* Texte dans les labels colorés */
--badge-bg              /* Fond des badges */

/* === TEXTES === */
--text                  /* Texte principal */
--text-hover            /* Texte hover */
--text-muted            /* Texte secondaire/atténué */
--text-heading          /* Titres */

/* === BORDURES/OMBRES === */
--border-color          /* Couleur des bordures */
--border-radius         /* Rayon des coins (8px par défaut) */
--box-shadow            /* Ombre standard */
--box-shadow-hover      /* Ombre au hover */

/* === ÉTATS === */
--success-color         /* Vert (succès) */
--error-color           /* Rouge (erreur) */
--warning-color         /* Orange (attention) */
--info-color            /* Bleu (info) */

/* === FORMULAIRES === */
--input-bg              /* Fond des inputs */
--input-border          /* Bordure des inputs */
--input-focus-border    /* Bordure focus */
--input-text            /* Texte dans les inputs */
--placeholder-color     /* Placeholder */

/* === SCROLLBAR === */
--scrollbar-bg          /* Fond scrollbar */
--scrollbar-thumb       /* Poignée scrollbar */
--scrollbar-thumb-hover /* Poignée hover */
```

### Emplacement du fichier de thèmes
```
/public/themes/themes.css
```

### Inclusion dans les pages PHP
```html
<link rel="stylesheet" href="themes/themes.css">
<link rel="stylesheet" href="assets/css/page-specific.css">
```

---

## 🖥️ Infrastructure Technique

### Environnement d'hébergement :
```
Proxmox (Hyperviseur)
  └── VM Debian
        └── SWAG (Reverse Proxy / SSL)
              └── SnowShelf
```

### URL de production :
```
https://snowshelf.snowmanprod.fr
```

### Chemin du projet sur le serveur :
```
/NAS/Data/Websites/SnowShelf
```

---

## 🗄️ Base de Données

### Configuration MariaDB :
```env
DB_HOST=10.110.1.1
DB_PORT=3307
DB_NAME=snowshelf
DB_USER=Nimai
DB_PASS=Amiral_Ackbar@38
DB_CHARSET=utf8mb4
```

### Accès CLI (pour l'assistant) :
```bash
# Commande pour accéder à la base de données
mariadb -h 10.110.1.1 -P 3307 -u Nimai -p'Amiral_Ackbar@38' snowshelf

# Exemples de requêtes
mariadb -h 10.110.1.1 -P 3307 -u Nimai -p'Amiral_Ackbar@38' snowshelf -e "DESCRIBE users;"
mariadb -h 10.110.1.1 -P 3307 -u Nimai -p'Amiral_Ackbar@38' snowshelf -e "SELECT * FROM users LIMIT 5;"
```

### Exécution de code PHP (pour l'assistant) :
```bash
# ⚠️ CHEMIN IMPORTANT : Dans le conteneur SWAG, le projet est monté dans /Websites/
# Chemin hôte : /NAS/Data/Websites/SnowShelf/
# Chemin conteneur : /Websites/SnowShelf/

# Exécuter du code PHP via le conteneur Docker SWAG
docker exec swag php -r "echo 'Hello World';"

# Générer un hash bcrypt
docker exec swag php -r "echo password_hash('mot_de_passe', PASSWORD_BCRYPT, ['cost' => 12]);"

# Vérifier un hash bcrypt
docker exec swag php -r "var_dump(password_verify('mot_de_passe', '\$hash'));"

# Exécuter un fichier PHP (utiliser le chemin conteneur !)
docker exec swag php /Websites/SnowShelf/scripts/mon_script.php

# Voir les logs PHP
docker exec swag tail -50 /config/log/php/error.log
```

### Tables principales de la base de données :

| Table | Description |
|-------|-------------|
| `users` | Utilisateurs du système |
| `categories` | Catégories de collection |
| `items` | Objets de collection |
| `item_img` | Images des items |
| `item_categories` | Relation items ↔ catégories |
| `item_grades` | Notes/grades des items |
| `item_videos` | Vidéos des items |
| `item_audio` | Audio des items |
| `item_doc` | Documents des items |
| `item_metadata` | Métadonnées dynamiques des items (EAV) |
| `primary_type` | Types primaires d'items (11 types) |
| `primary_type_fields` | Champs de métadonnées par type |
| `grades` | Systèmes de notation personnalisés |
| `storage_locations` | Emplacements de stockage |
| `upload_config` | Configuration des uploads (extensions, tailles) |
| `Admin_Main_Config` | Configuration principale du site |
| `Admin_webApi` | APIs externes configurées (recherche web) |
| `users_api` | Clés API personnelles des utilisateurs |
| `user_limits` | Limites par type d'utilisateur |

### Structure des tables de métadonnées dynamiques :

**Table `primary_type`** - Types primaires d'items
| Colonne | Type | Description |
|---------|------|-------------|
| `id` | int(11) | Clé primaire |
| `name` | varchar(50) | Clé technique unique (books, video_games...) |
| `icon` | varchar(10) | Emoji du type |
| `color` | varchar(7) | Couleur hex (#RRGGBB) |

**11 types disponibles** : books, video_games, music, movies, series, toys_fig, toys_construct, divers, board_games, trading_cards, sticker_albums

**Table `primary_type_fields`** - Champs par type
| Colonne | Type | Description |
|---------|------|-------------|
| `id` | int(11) | Clé primaire |
| `primary_type_id` | int(11) | FK vers primary_type |
| `field_key` | varchar(50) | Clé technique (author, year...) |
| `field_name_fr` | varchar(100) | Label en français |
| `field_name_en` | varchar(100) | Label en anglais |
| `field_type` | enum | text, textarea, number, year, date, select, multiselect, url, rating, duration |
| `field_options` | json | Options pour select/multiselect |
| `placeholder_fr` | varchar(200) | Placeholder français |
| `placeholder_en` | varchar(200) | Placeholder anglais |
| `help_text_fr` | text | Texte d'aide français |
| `help_text_en` | text | Texte d'aide anglais |
| `icon` | varchar(10) | Emoji du champ |
| `is_required` | tinyint(1) | Champ obligatoire |
| `sort_order` | int(11) | Ordre d'affichage |

**Table `item_metadata`** - Valeurs des métadonnées (Pattern EAV)
| Colonne | Type | Description |
|---------|------|-------------|
| `id` | int(11) | Clé primaire |
| `item_id` | int(11) | FK vers items |
| `field_id` | int(11) | FK vers primary_type_fields |
| `value_text` | text | Valeur texte |
| `value_number` | decimal(15,2) | Valeur numérique |
| `value_date` | date | Valeur date |
| `value_json` | json | Valeur JSON (multiselect) |
| `created_at` | timestamp | Date création |
| `updated_at` | timestamp | Date modification |

### Structure de la table `Admin_webApi` :
| Colonne | Type | Description |
|---------|------|-------------|
| `id` | int(11) | Clé primaire auto-increment |
| `name` | varchar(191) | Identifiant technique unique |
| `Name_UF` | varchar(255) | Nom d'affichage |
| `api_key` | text | Clé API (si requise) |
| `client_id` | varchar(255) | Client ID (si requis) |
| `Type` | varchar(255) | Type de contenu (video_games, books, toys, movies, music, generic) |
| `max_results_premium` | int(11) | Limite résultats utilisateurs premium (défaut: 100) |
| `max_results_free` | int(11) | Limite résultats utilisateurs free (défaut: 10) |
| `Notes` | text | Notes/documentation |
| `Defaut_active` | tinyint(1) | Actif par défaut (1=oui) |
| `USER_API` | tinyint(1) | Requiert clé API utilisateur (1=oui) |
| `READ_CODE` | tinyint(1) | Supporte lecture code-barres (1=oui) |
| `PREMIUM_ONLY` | tinyint(1) | Réservé aux utilisateurs Premium/Admin (1=oui) |
| `created_at` | timestamp | Date création |
| `updated_at` | timestamp | Date modification |

### Structure de la table `items` :
| Colonne | Type | Description |
|---------|------|-------------|
| `id` | int(11) | Clé primaire auto-increment |
| `user_id` | int(11) | FK vers users |
| `name` | varchar(255) | Nom de l'item |
| `description` | text | Description |
| `note` | text | Notes personnelles |
| `storage_location_id` | int(11) | FK vers storage_locations |
| `rating` | decimal(3,1) | Note (0-5) |
| `purchase_price` | decimal(10,2) | Prix d'achat |
| `market_value` | decimal(10,2) | Valeur marchande |
| `acquisition_date` | date | Date d'acquisition |
| `search_state` | tinyint(1) | État recherche (0=non, 1=en cours, 2=trouvé) |
| `code_barre` | varchar(50) | Code-barres |
| `created_at` | timestamp | Date création |
| `updated_at` | timestamp | Date modification |

### Structure de la table `item_img` :
| Colonne | Type | Description |
|---------|------|-------------|
| `id` | int(11) | Clé primaire |
| `item_id` | int(11) | FK vers items |
| `url` | varchar(255) | Chemin de l'image |
| `title` | varchar(255) | Titre de l'image |
| `format` | varchar(20) | Format (jpg, png, etc.) |
| `size` | int(11) | Taille en octets |
| `ordre` | int(11) | Ordre d'affichage |
| `filename_original` | varchar(255) | Nom fichier original |
| `mime` | varchar(50) | Type MIME |
| `created_at` | timestamp | Date création |

### Structure de la table `users` :
| Colonne | Type | Description |
|---------|------|-------------|
| `id` | int(11) | Clé primaire auto-increment |
| `name` | varchar(100) | Nom d'utilisateur (unique) |
| `email` | varchar(255) | Email (unique) |
| `password` | varchar(255) | Hash bcrypt du mot de passe |
| `avatar_url` | varchar(255) | URL de l'avatar |
| `background` | varchar(255) | Image de fond du profil |
| `is_admin` | tinyint(1) | Administrateur (0/1) - **⚠️ Admin = Premium automatique** |
| `is_premium` | tinyint(1) | Compte premium (0/1) |
| `premium_until` | date | Date fin premium |
| `email_verified` | tinyint(1) | Email vérifié (0/1) |
| `email_token` | varchar(255) | Token de vérification |
| `reset_token` | varchar(64) | Token reset mot de passe |
| `reset_token_expire` | datetime | Expiration token reset |
| `remember_token` | varchar(255) | Token "Se souvenir de moi" |
| `remember_expires` | datetime | Expiration remember token |
| `last_login` | datetime | Dernière connexion |
| `newsletter` | tinyint(1) | Inscrit newsletter |
| `Visi_collec` | int(11) | Visibilité collections |
| `Desc_Collec` | text | Description collections |
| `show_mail` | tinyint(1) | Afficher email public |
| `theme` | varchar(32) | Thème choisi (défaut: default) |
| `lang_pref` | varchar(5) | Langue préférée (défaut: fr) |
| `created_at` | timestamp | Date création |
| `updated_at` | timestamp | Date modification |

### Structure de la table `upload_config` :
| Colonne | Type | Description |
|---------|------|-------------|
| `id` | int(11) | Clé primaire |
| `category` | varchar(50) | Catégorie d'upload (unique) |
| `extensions` | JSON | Extensions autorisées |
| `max_size_mb` | int(11) | Taille maximale en MB |
| `description` | varchar(255) | Description de la catégorie |
| `is_active` | tinyint(1) | Catégorie active |
| `created_at` | timestamp | Date création |
| `updated_at` | timestamp | Date modification |

**Catégories par défaut :**
| Catégorie | Extensions | Taille max |
|-----------|------------|------------|
| `avatar` | jpg, jpeg, png, gif, webp | 5 MB |
| `images` | jpg, jpeg, png, gif, webp, svg | 10 MB |
| `audio` | mp3, wav, ogg, flac | 50 MB |
| `videos` | mp4, webm, avi, mkv, mov | 500 MB |
| `documents` | pdf, doc, docx, txt, zip | 50 MB |

---

## 🔌 API REST

### ⚠️ IMPORTANT : Utiliser l'API pour les opérations utilisateur

**Toutes les opérations sur les utilisateurs doivent passer par l'API `/api/users.php`**

### Architecture API :
```
/core/
├── ApiAuth.php        # Authentification (session + JWT)
├── UserService.php    # Service CRUD utilisateurs
├── UploadConfig.php   # Configuration uploads depuis BDD
└── ...

/public/api/
├── users.php          # API utilisateurs
├── categories.php     # API catégories
├── items.php          # API items de collection
├── item-metadata.php  # API métadonnées dynamiques des items
├── user-categories.php # API catégories accessibles (pour filtres)
├── category-media.php # API médias des catégories
├── grades.php         # API systèmes de notes
├── storage.php        # API emplacements de stockage
├── image-temp.php     # API images temporaires (ImageEditor)
├── web-search.php     # API recherche web (fournisseurs externes)
├── user-api-keys.php  # API clés API utilisateur
└── pages.php          # API fragments SPA
```

### Endpoints API Items (`/api/items.php`) :

| Méthode | Endpoint | Description | Accès |
|---------|----------|-------------|-------|
| `GET` | `?page=1&limit=50&sort=name&order=asc` | Liste paginée | Authentifié |
| `GET` | `?id=X` | Détails complets d'un item | Proprio |
| `POST` | body JSON | Créer un item | Authentifié |
| `PUT` | body JSON avec id | Modifier un item | Proprio |
| `DELETE` | `?id=X` | Supprimer un item | Proprio |

**Filtres disponibles :**
- `search` - Recherche texte (nom, description, code-barres)
- `category_id` - Filtrer par catégorie
- `status_id` - Filtrer par statut
- `min_rating` - Note minimum
- `min_value`, `max_value` - Plage de valeur marchande
- `date_from`, `date_to` - Période d'acquisition
- `search_state` - État de recherche (0=non recherché, 1=en recherche, 2=trouvé)

### Endpoints API Métadonnées Items (`/api/item-metadata.php`) :

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `?action=fields&type_id=X` | Liste des champs pour un type primaire |
| `GET` | `?action=values&item_id=X` | Valeurs des métadonnées d'un item |
| `POST` | body JSON | Sauvegarder les métadonnées |

**Format POST :**
```json
{
  "item_id": 16,
  "type_id": 7,
  "metadata": {
    "69": "LEGO",      // field_id: valeur
    "71": 7541,
    "73": 2017
  }
}
```

**Réponse GET ?action=values :**
```json
{
  "success": true,
  "data": {
    "item_id": 16,
    "type_id": 7,
    "values": {
      "brand": { "field_id": 69, "label": "Marque", "icon": "🏭", "type": "text", "value": "LEGO" },
      "pieces": { "field_id": 71, "label": "Nombre de pièces", "icon": "🧩", "type": "number", "value": 7541 }
    }
  }
}
```

### Endpoints API Utilisateurs :

| Méthode | Endpoint | Description | Accès |
|---------|----------|-------------|-------|
| `GET` | `/api/users.php?me` | Infos utilisateur connecté | Authentifié |
| `GET` | `/api/users.php?id=X` | Infos d'un utilisateur | Proprio/Admin |
| `GET` | `/api/users.php?id=X&fields=a,b,c` | Champs spécifiques | Proprio/Admin |
| `GET` | `/api/users.php` | Liste utilisateurs | Admin |
| `POST` | `/api/users.php` | Créer utilisateur | Admin |
| `POST` | `/api/users.php?action=password` | Changer mot de passe | Authentifié |
| `POST` | `/api/users.php?action=preferences` | Modifier préférences | Authentifié |
| `POST` | `/api/users.php?action=avatar` | Upload avatar | Authentifié |
| `POST` | `/api/users.php?action=background` | Upload background | Authentifié |
| `PUT` | `/api/users.php?id=X` | Modifier utilisateur | Proprio/Admin |
| `DELETE` | `/api/users.php?id=X` | Supprimer utilisateur | Proprio/Admin |

### Exemple d'utilisation (JavaScript) :
```javascript
// Récupérer les infos de l'utilisateur connecté
fetch('/api/users.php?me')
  .then(r => r.json())
  .then(data => console.log(data));

// Modifier les préférences
fetch('/api/users.php?action=preferences', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ theme: 'nord', lang_pref: 'en' })
});

// Modifier un utilisateur (admin)
fetch('/api/users.php?id=5', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ is_premium: 1 })
});
```

### Infos de session PHP disponibles :
```php
$_SESSION['user_id']    // ID utilisateur
$_SESSION['username']   // Nom (colonne 'name')
$_SESSION['email']      // Email
$_SESSION['is_admin']   // bool - Administrateur
$_SESSION['is_premium'] // bool - Premium (⚠️ true aussi si is_admin = true)
$_SESSION['theme']      // Thème choisi
$_SESSION['lang_pref']  // Langue préférée
$_SESSION['login_time'] // Timestamp connexion
```

### ⚠️ Règle importante : Admin = Premium

**Un utilisateur administrateur (`is_admin = 1`) est automatiquement considéré comme premium.**

**Contrainte SQL en base de données :**
```sql
CONSTRAINT `chk_admin_implies_premium` CHECK (`is_admin` = 0 OR `is_premium` = 1)
```
Cette contrainte garantit au niveau BDD qu'un admin a toujours `is_premium = 1`.

**Logique applicative :**
- `ApiAuth::isPremium()` - Vérifie `is_admin || is_premium`
- `SessionHelper::isPremium()` - Vérifie `$_SESSION['is_admin'] || $_SESSION['is_premium']`
- `login-handler.php` - Définit `$_SESSION['is_premium'] = is_admin || is_premium`

---

## 🔐 Système d'Authentification

### Architecture des fichiers :

```
/public/
├── login.php              # Page de connexion
├── register.php           # Page d'inscription
├── verify-email.php       # Page de vérification email
├── forgot-password.php    # Récupération mot de passe (à créer)
├── auth/
│   ├── login-handler.php      # Traitement connexion
│   └── register-handler.php   # Traitement inscription
└── assets/
    ├── css/
    │   ├── login.css      # Styles connexion
    │   └── register.css   # Styles inscription
    └── js/
        ├── login.js       # JS connexion
        └── register.js    # Validation inscription

/core/
├── Mailer.php             # Classe d'envoi d'emails
└── PHPMailer/             # Bibliothèque PHPMailer
    ├── PHPMailer.php
    ├── SMTP.php
    ├── Exception.php
    └── ...
```

### Règles d'inscription :

| Champ | Règles de validation |
|-------|---------------------|
| **Nom d'utilisateur** | 3-50 caractères, alphanumérique + underscore, unique |
| **Email** | Format valide, unique dans la BDD |
| **Mot de passe** | Minimum 8 caractères, au moins 1 chiffre, au moins 1 caractère spécial |

### Flux d'inscription :

```
1. Utilisateur remplit le formulaire → register.php
2. Validation côté client → register.js
3. Soumission POST → register-handler.php
4. Validation côté serveur :
   - Format du nom d'utilisateur
   - Format et unicité de l'email
   - Force du mot de passe
5. Création du compte :
   - Hachage du mot de passe (bcrypt, cost 12)
   - Génération du token de vérification (64 caractères hex)
   - email_verified = 0
6. Envoi email de vérification → Mailer.php
7. Utilisateur clique sur le lien → verify-email.php
8. Activation du compte (email_verified = 1)
9. Redirection vers login avec message succès
```

### Connexion :

**Important** : La connexion se fait **uniquement par email** (pas par nom d'utilisateur).

```
1. Utilisateur entre email + mot de passe → login.php
2. Soumission POST → login-handler.php
3. Vérifications :
   - Compte existe avec cet email
   - Compte actif (is_active = 1)
   - Email vérifié (email_verified = 1)
   - Mot de passe correct (password_verify)
4. Création de session
5. Option "Se souvenir de moi" (token 30 jours)
6. Redirection vers dashboard
```

### Configuration SMTP :

```env
# Dans .env
MAIL_HOST=mail.snowmanprod.fr
MAIL_PORT=587
MAIL_USERNAME=secu@snowmanprod.fr
MAIL_PASSWORD=************
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=no-reply@snowmanprod.fr
MAIL_FROM_NAME=SnowShelf
```

### Sécurité :

| Mesure | Implémentation |
|--------|----------------|
| Hachage mot de passe | bcrypt avec cost 12 |
| Token vérification | 64 caractères hexadécimaux (32 bytes random) |
| Session | Régénération ID après login |
| Remember me | Token SHA-256 en BDD, cookie HttpOnly/Secure |
| Protection CSRF | À implémenter via tokens de formulaire |

---

## 📧 Système d'Emails (Mailer)

### Usage :

```php
require_once __DIR__ . '/../core/Mailer.php';

$mailer = new Mailer();

// Email de vérification
$success = $mailer->sendVerificationEmail(
    'user@example.com',           // Destinataire
    'Username',                   // Nom de l'utilisateur
    'abc123def456...',            // Token de vérification
    'fr'                          // Langue (fr/en)
);

// Email de réinitialisation (à implémenter)
$success = $mailer->sendPasswordResetEmail(
    'user@example.com',
    'Username',
    'reset_token_here',
    'fr'
);
```

### Templates email :

Les emails utilisent un template HTML responsive avec :
- Design glassmorphism cohérent avec l'application
- Bouton d'action visible
- Support multi-langue (FR/EN)
- Fallback texte pour clients email basiques

---

## 📋 Système de Logging (Logger)

### Architecture :
```
/core/logger.php         # Système de logging centralisé
/logs/                   # Dossier des fichiers de log (même niveau que core)
  ├── identify.log       # Logs du module identify
  ├── auth.log           # Logs authentification
  ├── api.log            # Logs des APIs
  └── {source}.log       # Un fichier par source
```

### Usage :
```php
// Inclure le logger
require_once __DIR__ . '/../core/logger.php';

// Fonction principale
loger('source', 'NIVEAU', 'Message', ['contexte' => 'optionnel']);

// Exemples par niveau :
loger('identify', 'DEBUG', 'Requête reçue', ['params' => $_GET]);
loger('auth', 'INFO', 'Connexion réussie', ['user_id' => 123]);
loger('api', 'WARNING', 'Rate limit proche', ['requests' => 95]);
loger('database', 'ERROR', 'Connexion échouée', ['error' => $e->getMessage()]);
loger('security', 'CRITICAL', 'Tentative intrusion', ['ip' => $_SERVER['REMOTE_ADDR']]);
```

### Niveaux de log disponibles :
| Niveau | Priorité | Usage |
|--------|----------|-------|
| `DEBUG` | 0 | Débogage détaillé (dev uniquement) |
| `INFO` | 1 | Informations générales |
| `WARNING` | 2 | Avertissements (alias: WARN) |
| `ERROR` | 3 | Erreurs récupérables |
| `CRITICAL` | 4 | Erreurs fatales |

### Fonctions raccourcies :
```php
log_debug('source', 'Message', $context);
log_info('source', 'Message', $context);
log_warning('source', 'Message', $context);
log_error('source', 'Message', $context);
log_critical('source', 'Message', $context);
```

### Usage orienté objet :
```php
$logger = new Logger('mon_module');
$logger->info('Opération effectuée', ['id' => 42]);
$logger->error('Échec de l\'opération', ['reason' => 'timeout']);
```

### Format des logs :
```
[2025-12-01 14:30:25.123] [INFO    ] Message de log | {"contexte":"données"}
```

### Configuration (variables d'environnement) :
```env
SNOWSHELF_LOG_LEVEL=DEBUG      # Niveau minimum à logger (défaut: DEBUG)
SNOWSHELF_LOG_MAX_SIZE=10485760  # Taille max avant rotation (défaut: 10MB)
SNOWSHELF_LOG_MAX_FILES=5      # Nombre de fichiers de rotation (défaut: 5)
```

### Sécurité :
- Les données sensibles sont automatiquement masquées (password, token, api_key, etc.)
- Les chaînes longues (>1000 caractères) sont tronquées
- Le nom de source est nettoyé pour éviter les injections de chemin

### Rotation des logs :
- Automatique quand un fichier dépasse `SNOWSHELF_LOG_MAX_SIZE`
- Fichiers renommés : `source.log` → `source.log.1` → `source.log.2`...
- Les plus anciens sont supprimés après `SNOWSHELF_LOG_MAX_FILES` rotations

---

## 📁 Structure du Projet

```
/NAS/Data/Websites/SnowShelf/
├── public/                    # Fichiers accessibles publiquement
│   ├── index.php              # Point d'entrée / Landing page
│   ├── dashboard.php          # Shell SPA principal (après connexion)
│   ├── login.php              # Page de connexion
│   ├── register.php           # Page d'inscription
│   ├── verify-email.php       # Vérification email
│   ├── admin/                 # Panel d'administration
│   │   └── index.php          # Dashboard admin
│   ├── api/                   # Endpoints API REST
│   │   ├── users.php          # API utilisateurs
│   │   ├── categories.php     # API catégories
│   │   ├── grades.php         # API systèmes de notation
│   │   ├── storage.php        # API emplacements de stockage
│   │   ├── image-temp.php     # API images temporaires (ImageEditor)
│   │   ├── pages.php          # API fragments SPA
│   │   └── admin/             # APIs administration
│   │       ├── config.php     # Configuration système
│   │       ├── type-fields.php     # CRUD champs métadonnées
│   │       └── field-mappings.php  # CRUD mappings API→champs
│   ├── views/                 # Fragments SPA
│   │   ├── home.php           # Vue accueil
│   │   ├── account.php        # Vue paramètres compte
│   │   └── categories.php     # Vue catégories
│   ├── auth/                  # Handlers authentification
│   │   ├── login-handler.php
│   │   └── register-handler.php
│   ├── assets/                # Ressources statiques
│   │   ├── css/               # Styles par page
│   │   │   ├── image-editor.css  # Styles ImageEditor
│   │   │   ├── admin.css         # Styles admin
│   │   │   └── ...
│   │   ├── js/                # Scripts
│   │   │   ├── router.js         # Routeur SPA
│   │   │   ├── modal-manager.js  # Gestionnaire modals
│   │   │   ├── image-editor.js   # Éditeur d'images
│   │   │   ├── icon-editor.js    # Sélecteur d'icônes
│   │   │   ├── categories.js     # Gestion catégories
│   │   │   ├── account.js        # Paramètres compte
│   │   │   ├── admin/            # Modules ES6 admin
│   │   │   │   ├── main.js       # Point d'entrée
│   │   │   │   ├── core/         # État, API, utilitaires
│   │   │   │   ├── ui/           # Dropdowns, modals
│   │   │   │   └── settings/     # Modules par onglet
│   │   │   └── ...
│   │   └── images/
│   │       └── users/{id}/    # Avatars utilisateurs (accès direct)
│   └── themes/
│       └── themes.css         # Système de thèmes
├── core/                      # Code source PHP core
│   ├── ApiAuth.php            # Authentification API
│   ├── i18n.php               # Internationalisation
│   ├── logger.php             # Système de logging
│   ├── Mailer.php             # Envoi d'emails
│   ├── SecureUpload.php       # Gestion sécurisée des uploads
│   ├── UploadConfig.php       # Configuration uploads depuis BDD
│   ├── SessionHelper.php      # Helpers session
│   ├── SiteConfig.php         # Configuration globale
│   ├── UserService.php        # Service CRUD utilisateurs
│   └── PHPMailer/             # Bibliothèque PHPMailer
├── config/                    # Configuration
│   └── database.php           # Connexion BDD
├── lang/                      # Fichiers de traduction
│   ├── fr.php                 # Traductions françaises
│   └── en.php                 # Traductions anglaises
├── logs/                      # Fichiers de log (créé automatiquement)
│   └── {source}.log           # Un fichier par module
├── scripts/                   # Scripts utilitaires
│   └── cleanup-temp.php       # Nettoyage images temporaires (cron)
├── storage/                   # Fichiers uploadés des collections
│   ├── users/                 # Médias des objets/catégories utilisateurs
│   ├── default_categories/    # Médias des catégories par défaut
│   └── temp/                  # Images temporaires (ImageEditor)
├── docs/                      # Documentation
│   ├── PROJECT_CONTEXT_FULL.md
│   └── IMAGE_EDITOR.md        # Doc ImageEditor
├── .github/
│   └── copilot-instructions.md
├── vendor/                    # Dépendances Composer
└── .env                       # Variables d'environnement (non versionné)
```

### 📂 Stockage des fichiers utilisateurs

#### Avatars et backgrounds (accès public direct)
```
public/assets/images/users/{id_user}/
├── avatar.jpg              # Photo de profil
└── background.jpg          # Image de fond profil (optionnel)
```
**Note** : Ces fichiers sont servis directement par le serveur web pour de meilleures performances.

#### Images temporaires (storage/temp/)
```
storage/temp/
├── .htaccess               # Sécurité (bloque PHP, autorise images)
└── {uuid}_{timestamp}.webp # Images temporaires de l'ImageEditor
```
**Note** : Nettoyées automatiquement après 1 heure via `scripts/cleanup-temp.php`.

#### Médias des collections (storage/users/)

Chaque utilisateur dispose de son propre espace pour les médias de sa collection :

```
storage/users/
└── {id_user}/                    # Dossier unique par utilisateur
    ├── Objets/                   # Médias associés aux objets de collection
    │   └── {id_objet}/           # Dossier par objet
    │       ├── images/           # Photos de l'objet
    │       ├── audio/            # Fichiers audio (musique, enregistrements)
    │       ├── videos/           # Vidéos de l'objet
    │       └── documents/        # Documents (manuels, factures, certificats)
    │
    └── Categories/               # Médias associés aux catégories personnalisées
        └── {id_categorie}/       # Dossier par catégorie
            ├── images/           # Images de la catégorie
            ├── audio/            # Fichiers audio
            ├── videos/           # Vidéos
            └── documents/        # Documents
```

### 📂 Structure des catégories par défaut (storage/default_categories/)

Catégories prédéfinies par le système, disponibles pour tous les utilisateurs :

```
storage/default_categories/
└── {id_categorie}/               # Dossier par catégorie par défaut
    ├── images/                   # Images de la catégorie (icônes, bannières)
    ├── audio/                    # Fichiers audio
    ├── videos/                   # Vidéos de présentation
    └── documents/                # Documentation, guides
```

**Notes sur les catégories par défaut :**
- Catégories fournies par le système (jeux vidéo, livres, vinyles, etc.)
- Non modifiables par les utilisateurs
- Servent de base que les utilisateurs peuvent personnaliser dans leur espace

**Notes sur le stockage :**
- Les IDs utilisateurs et objets correspondent aux IDs en base de données
- Permet une gestion fine des droits d'accès par utilisateur
- Facilite les sauvegardes et exports individuels
- Structure prévisible pour les opérations de maintenance

### 🔒 Sécurité des Uploads

**Mesures de protection mises en place :**

#### Fichiers .htaccess
Présents dans `storage/` et `public/assets/images/users/` pour :
- ❌ Désactiver l'exécution PHP (`php_flag engine off`)
- ❌ Bloquer les extensions dangereuses (php, phtml, cgi, py, sh, exe...)
- ❌ Désactiver le listing des répertoires (`Options -Indexes -ExecCGI`)
- ✅ Autoriser uniquement les types de fichiers sûrs

#### Fichiers index.php
Dans chaque dossier pour empêcher le listing si .htaccess échoue.

#### Classe SecureUpload (`/core/SecureUpload.php`)
Gestion sécurisée des uploads :
```php
require_once __DIR__ . '/../core/SecureUpload.php';

// Upload d'un avatar
$result = SecureUpload::upload(
    $_FILES['avatar'],          // Fichier
    'avatar',                   // Catégorie (avatar, images, audio, videos, documents)
    '/path/to/destination',     // Dossier destination
    'custom_name'               // Nom personnalisé (optionnel)
);

if ($result['success']) {
    echo $result['path'];       // Chemin du fichier uploadé
    echo $result['filename'];   // Nom du fichier
} else {
    echo $result['error'];      // Message d'erreur
}

// Création des dossiers utilisateur
SecureUpload::createUserDirectories($userId, '/path/to/storage');

// Création des dossiers pour un objet
SecureUpload::createObjectDirectories($userId, $objectId, '/path/to/storage');

// Suppression sécurisée
SecureUpload::delete('/path/to/file.jpg', '/allowed/base/dir');
```

**Configuration dynamique via `UploadConfig` :**

Les limites d'upload sont gérées dynamiquement depuis la table `upload_config` :

```php
require_once __DIR__ . '/../core/UploadConfig.php';

// Récupérer la config d'une catégorie
$config = UploadConfig::getConfig('images');
// Retourne: ['extensions' => ['jpg', 'png', ...], 'maxSize' => bytes, 'mimeTypes' => [...]]

// Récupérer toutes les configs actives
$allConfigs = UploadConfig::getAllConfigs();

// La classe SecureUpload utilise automatiquement UploadConfig
// avec fallback vers des valeurs par défaut si la BDD est indisponible
```

**Types de fichiers autorisés par catégorie (configurable via admin) :**

| Catégorie | Extensions | Taille max |
|-----------|------------|------------|
| `avatar` | jpg, jpeg, png, gif, webp | 5 MB |
| `images` | jpg, jpeg, png, gif, webp, svg | 10 MB |
| `audio` | mp3, wav, ogg, flac | 50 MB |
| `videos` | mp4, webm, avi, mkv, mov | 500 MB |
| `documents` | pdf, doc, docx, txt, zip | 50 MB |

**Validations effectuées :**
- ✅ Vérification du type MIME réel (finfo)
- ✅ Validation de l'extension
- ✅ Vérification de la taille
- ✅ Validation des images (getimagesize)
- ✅ Scan des SVG pour JavaScript malveillant
- ✅ Noms de fichiers nettoyés (caractères spéciaux supprimés)
- ✅ Protection contre la traversée de répertoire
- ✅ Permissions fichiers à 0644

---

## 🖼️ ImageEditor - Éditeur d'Images

### Description

Module JavaScript complet pour l'édition et le recadrage d'images. Utilisé pour les avatars, backgrounds et icônes.

**Fichiers :**
```
/public/assets/js/image-editor.js    # Module JavaScript principal
/public/assets/css/image-editor.css  # Styles responsives
/public/api/image-temp.php           # API stockage temporaire
/storage/temp/                        # Dossier images temporaires
/scripts/cleanup-temp.php            # Script cron nettoyage (à exécuter toutes les heures)
```

### Fonctionnalités

- 📏 Recadrage avec ratio d'aspect configurable (1:1, 16:9, 4:3, libre)
- 🔄 Rotation (90°, libre)
- 🔍 Zoom avec molette souris
- ↔️ Flip horizontal/vertical
- 📱 Support tactile complet (pinch-to-zoom, gestures)
- 💾 Sauvegarde temporaire côté serveur
- 🎨 Interface avec thèmes CSS

### Usage

```javascript
// Import automatique via dashboard.php

// Créer une instance
const editor = new ImageEditor({
    aspectRatio: 1,              // Ratio (1 = carré, 16/9, 4/3, null = libre)
    outputFormat: 'image/webp',  // Format de sortie
    outputQuality: 0.9,          // Qualité (0-1)
    maxOutputSize: 1024,         // Taille max en pixels
    onSave: async (blob, metadata) => {
        // Traiter l'image recadrée
        const formData = new FormData();
        formData.append('file', blob, 'image.webp');
        await fetch('/api/upload', { method: 'POST', body: formData });
    },
    onCancel: () => console.log('Annulé')
});

// Ouvrir avec une image
editor.open('/path/to/image.jpg');
// ou
editor.open(fileInput.files[0]);

// Fermer programmatiquement
editor.close();
```

### Traductions requises

Ajouter dans `/lang/fr.php` et `/lang/en.php` :
```php
'image_editor' => [
    'title' => 'Éditeur d\'image',
    'crop' => 'Recadrer',
    'rotate' => 'Pivoter',
    'flip' => 'Retourner',
    // ... voir /docs/IMAGE_EDITOR.md pour la liste complète
]
```

---

## 🎭 IconEditor - Sélecteur d'Icônes

### Description

Module JavaScript pour sélectionner une icône : emoji ou fichier image uploadé.

**Fichiers :**
```
/public/assets/js/icon-editor.js     # Module JavaScript
```

### Usage

```javascript
// Ouvrir le sélecteur
IconEditor.open({
    currentIcon: '📁',           // Icône actuelle (emoji ou chemin)
    onSave: (icon) => {
        // icon = emoji string ou chemin vers fichier uploadé
        console.log('Nouvelle icône:', icon);
    },
    onCancel: () => console.log('Annulé')
});
```

---

## 📷 CameraCapture - Capture Photo

### Description

Module JavaScript pour capturer une photo via la caméra de l'appareil (PC ou smartphone).
La photo capturée peut être envoyée directement à ImageEditor pour modification.

**Fichiers :**
```
/public/assets/js/camera-capture.js   # Module JavaScript (~920 lignes)
/public/assets/css/camera-capture.css # Styles (~520 lignes)
```

### Fonctionnalités

- 📷 **Accès caméra** : Demande de permission utilisateur
- 🔄 **Sélection caméra** : 
  - Mobile : Bouton switch avant/arrière
  - Desktop : Liste déroulante avec vrais noms des caméras
- 🔍 **Zoom** : Molette, pincement tactile, slider, boutons +/-
- ⚡ **Flash** : On/off si supporté par le hardware
- 🖼️ **Intégration ImageEditor** : Édition automatique après capture
- 📱 **Responsive** : Interface adaptée PC et smartphone
- 🎨 **Theming** : Compatible avec tous les thèmes CSS

### Détection des types de caméras

Le module détecte automatiquement le type de caméra depuis le label :
- **Avant / Front** : Caméra selfie
- **Arrière / Back** : Caméra principale
- **Grand angle / Wide** : Objectif grand angle
- **Ultra grand angle / Ultra wide** : Objectif ultra large
- **Téléobjectif / Telephoto** : Objectif zoom

### Usage

```javascript
CameraCapture.open({
    caller: 'modal-parent-id',    // Modal appelant (optionnel)
    targetField: 'avatar',        // Champ de destination (pour info)
    facingMode: 'environment',    // 'environment' (arrière) ou 'user' (avant)
    skipEditor: false,            // true = retour direct sans ImageEditor
    onCapture: (result) => {
        // Si skipEditor=true: result.blob, result.filename
        // Si skipEditor=false: result.blob, result.tempPath (via ImageEditor)
        console.log('Photo capturée:', result);
    },
    onCancel: () => {
        console.log('Capture annulée');
    },
    editorOptions: {              // Options passées à ImageEditor
        outputFormat: 'image/jpeg'
    }
});
```

### Intégration avec MediaListManager

```javascript
// Dans le modal catégories (categories.js)
btnCamera.addEventListener('click', () => {
    CameraCapture.open({
        facingMode: 'environment',
        onCapture: (result) => {
            // Ajouter l'image à la liste via ImageEditor result
            mediaManagers['images'].addFromImageEditor(result);
        }
    });
});
```

### Traductions requises

```php
'camera' => [
    'title' => 'Prendre une photo',
    'initializing' => 'Initialisation de la caméra...',
    'error_camera' => 'Impossible d\'accéder à la caméra',
    'error_permission' => 'Accès à la caméra refusé...',
    'take_photo' => 'Prendre une photo',
    'switch_camera' => 'Changer de caméra',
    'select_camera' => 'Caméra :',
    'camera' => 'Caméra',
    'front_camera' => 'Avant',
    'back_camera' => 'Arrière',
    'wide_camera' => 'Grand angle',
    'ultra_camera' => 'Ultra grand angle',
    'tele_camera' => 'Téléobjectif',
    'flash' => 'Flash',
    // ... voir /lang/fr.php pour la liste complète
]
```

---

## 🔍 WebSearchModal - Recherche Web

### Description

Module JavaScript pour rechercher des informations sur le web via différents fournisseurs d'API (jeux vidéo, livres, jouets, films, musique). Permet d'importer automatiquement les données dans les formulaires d'items.

**Fichiers :**
```
/public/assets/js/web-search.js     # Module JavaScript (~930 lignes)
/public/assets/css/web-search.css   # Styles (~710 lignes)
/public/api/web-search.php          # API REST (~300 lignes)
```

### Fonctionnalités

- 🔍 **Recherche textuelle** : Recherche par nom/titre
- 📷 **Recherche image** : OCR et détection de code-barres
- 📋 **Multi-fournisseurs** : Sélection des sources de recherche
- 🔒 **Gestion Premium** : Certains fournisseurs réservés aux utilisateurs Premium
- 📱 **Responsive** : Layout 2 colonnes (PC) / empilé (mobile)

### Usage

```javascript
// Ouvrir le modal de recherche
WebSearchModal.open({
    query: 'Final Fantasy VII',      // Texte pré-rempli (optionnel)
    type: 'video_games',             // Type pré-sélectionné
    onSelect: (result) => {
        // result.title, result.description, result.image_url
        // result.metadata.year, result.metadata.rating
        // result.source_url, result.provider
        console.log('Résultat sélectionné:', result);
    }
});

// Fermer le modal
WebSearchModal.close();
```

### Types disponibles

| Type | Description |
|------|-------------|
| `video_games` | Jeux vidéo (RAWG, IGDB, JeuxVideo.com) |
| `books` | Livres, BD, Manga (Google Books, OpenLibrary, MangaDex, Bédéthèque) |
| `toys` | Jouets, LEGO (LEGO, Rebrickable, Coleka) |
| `movies` | Films, Séries, Anime (TMDB, TVDB, IMDB, Jikan) |
| `music` | Musique (MusicBrainz, Deezer, iTunes) |
| `generic` | Générique (Barcode Lookup, Paninimania) |

### API REST

```
GET  /api/web-search.php?action=providers              # Liste tous les fournisseurs
GET  /api/web-search.php?action=providers&type=books   # Fournisseurs filtrés par type
POST /api/web-search.php  action=search                # Recherche textuelle
POST /api/web-search.php  action=search_image          # Recherche par image
```

### Gestion Premium

```javascript
// Exposé dans dashboard.php
window.userInfo = {
    isPremium: true/false,
    isAdmin: true/false
};

// Les fournisseurs avec PREMIUM_ONLY=1 sont :
// - Grisés et désactivés pour les utilisateurs free
// - Affichés avec un badge 🔒 Premium
// - Exclus de la sélection par défaut
```

---

## 📂 MediaListManager - Gestionnaire de Médias

### Description

Composant JavaScript réutilisable pour gérer les listes de médias (images, vidéos, audio, documents) associés à une entité. Il offre un système complet de drag & drop, réordonnancement, prévisualisation et édition d'images.

**Fichiers :**
```
/public/assets/js/media-list-manager.js   # Module JavaScript principal
/public/assets/css/media-list-manager.css # Styles du composant
/public/api/category-media.php            # API REST pour les médias de catégories
/public/api/image-temp.php                # API pour les images temporaires (édition)
```

### Fonctionnalités

- 📥 **Upload** : Drag & drop ou sélection de fichiers
- 🔀 **Réordonnancement** : Drag & drop pour réorganiser l'ordre
- 🖼️ **Prévisualisation** : Visualisation des médias uploadés
- ✏️ **Édition d'images** : Intégration avec ImageEditor (recadrage, rotation)
- 🎬 **Thumbnails vidéo** : Génération automatique via FFmpeg
- 📝 **Métadonnées** : Titre modifiable pour chaque média
- 🗑️ **Suppression** : Avec confirmation
- 📊 **Compteurs** : Mise à jour automatique des compteurs d'onglets

### Usage

```javascript
// Initialisation
const manager = MediaListManager.create({
    container: document.getElementById('media-container'),
    type: 'images',           // images, videos, audio, documents
    apiEndpoint: '/api/category-media.php',
    entityType: 'category',
    entityId: 123,            // null = mode création (fichiers temporaires)
    userId: window.userId,
    isDefault: false,         // true = catégorie système (admin only)
    onFilesChange: (data) => {
        // data.files = fichiers actuels
        // data.pendingFiles = fichiers en attente (mode création)
        console.log('Nombre de fichiers:', data.files.length);
    },
    onError: (msg) => showToast(msg, 'error')
});

// Charger les fichiers existants
manager.loadFiles();

// Après création d'une entité, finaliser les fichiers temporaires
const newEntityId = await createCategory(formData);
await manager.finalizePendingFiles(newEntityId);
```

### Structure de l'API (`category-media.php`)

| Méthode | Action | Description |
|---------|--------|-------------|
| `GET` | `list` | Liste des médias d'une catégorie |
| `POST` | `upload` | Upload d'un nouveau média |
| `PUT` | `update` | Modifier titre/ordre |
| `PUT` | `update_from_temp` | Remplacer par une image éditée |
| `PUT` | `reorder` | Réordonner les médias |
| `DELETE` | `delete` | Supprimer un média |

### Tables associées

Chaque type de média a sa propre table :
- `category_img` : Images
- `category_videos` : Vidéos
- `category_audio` : Audio
- `category_doc` : Documents

**Structure commune :**
```sql
CREATE TABLE category_img (
    id INT PRIMARY KEY AUTO_INCREMENT,
    category_id INT NOT NULL,
    url VARCHAR(512) NOT NULL,           -- Chemin relatif depuis storage/
    title VARCHAR(255),                   -- Titre optionnel
    ordre INT DEFAULT 0,                  -- Ordre d'affichage
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Pour les vidéos uniquement :
-- thumbnail_url VARCHAR(512) NULL       -- Thumbnail généré par FFmpeg
```

### FFmpeg - Thumbnails vidéo

Les thumbnails sont générés automatiquement lors de l'upload de vidéos :

```php
// Binaire statique dans /bin/ffmpeg (pas d'installation requise)
$ffmpegBin = realpath(__DIR__ . '/../../bin/ffmpeg');
exec("{$ffmpegBin} -i {$video} -ss 00:00:01 -vframes 1 -q:v 5 {$thumb} 2>&1");
```

### Variables CSS utilisées

Le composant utilise les variables du système de thèmes :
```css
/* Fonds et bordures */
--card-bg, --border-color, --input-bg, --input-border

/* Textes */
--text, --text-muted

/* États */
--success-color, --error-color, --warning-color

/* Overlays (spécifiques aux médias) */
--overlay-bg: 0, 0, 0        /* RGB pour rgba() */
--overlay-text: #ffffff
--viewer-bg: 0, 0, 0
--shadow-color: 0, 0, 0
```

### Traductions requises

```php
'media_list' => [
    'dropzone_hint' => 'Glissez des fichiers ou cliquez pour sélectionner',
    'no_files' => 'Aucun fichier',
    'edit_title' => 'Modifier le titre',
    'delete_confirm' => 'Supprimer ce fichier ?',
    // ... voir /lang/fr.php pour la liste complète
]
```

---

## ⚙️ Administration - Paramètres Uploads

### Description

Interface d'administration permettant de gérer dynamiquement les configurations d'upload par catégorie.

**Fichiers :**
```
/public/admin/index.php              # Panel admin (onglet upload-config)
/public/assets/js/admin-settings.js  # JavaScript (fonctions Upload Config)
/public/api/admin/config.php         # API (table upload_config)
/core/UploadConfig.php               # Classe de récupération config
```

### Fonctionnalités

- 📋 Liste toutes les catégories d'upload avec leurs paramètres
- ✏️ Modifier les extensions autorisées par catégorie
- 📏 Définir la taille maximale en MB
- ✅ Activer/désactiver des catégories
- ➕ Ajouter de nouvelles catégories d'upload
- 🗑️ Supprimer des catégories (les uploads existants ne sont pas affectés)

### Structure de la table `upload_config`

```sql
CREATE TABLE upload_config (
    id INT PRIMARY KEY AUTO_INCREMENT,
    category VARCHAR(50) UNIQUE NOT NULL,     -- Identifiant unique (avatar, images, etc.)
    extensions JSON NOT NULL,                  -- ["jpg", "png", "gif", ...]
    max_size_mb INT NOT NULL DEFAULT 10,       -- Taille max en MB
    description VARCHAR(255),                  -- Description pour les admins
    is_active BOOLEAN DEFAULT TRUE,            -- Catégorie active ou non
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### API Admin

L'API `/api/admin/config.php` supporte la table `upload_config` avec :

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `?table=upload_config` | Liste toutes les configs |
| `GET` | `?table=upload_config&id=X` | Détails d'une config |
| `POST` | `?table=upload_config` | Créer une catégorie |
| `PUT` | `?table=upload_config&id=X` | Modifier une config |
| `DELETE` | `?table=upload_config&id=X` | Supprimer une catégorie |

**Validation :**
- Champ `category` unique (validation avant INSERT/UPDATE)
- Champ `extensions` automatiquement encodé en JSON
- Champs requis : `category`, `extensions`, `max_size_mb`

### JavaScript (admin-settings.js)

```javascript
// Fonctions disponibles via window.SettingsPanel
SettingsPanel.editUploadConfig(id)       // Ouvrir le modal d'édition
SettingsPanel.deleteUploadConfig(id, category)  // Supprimer avec confirmation
```

---

## 🪟 Système de Modals

### Architecture

Le système de modals est basé sur `ModalManager`, une classe JavaScript qui gère :
- L'empilement de modals (un modal peut ouvrir un autre modal au-dessus)
- Le focus trap (accessibilité)
- Les animations d'entrée/sortie
- Les callbacks de fermeture

**Fichiers :**
```
/public/assets/js/modal-manager.js   # Gestionnaire de modals
/public/assets/css/modal.css         # Styles des modals
```

### Usage de base

```javascript
// Modal simple
ModalManager.open({
    title: 'Mon titre',
    content: '<p>Contenu HTML du modal</p>',
    buttons: [
        { text: 'Annuler', action: 'close', class: 'btn-secondary' },
        { text: 'Valider', action: 'confirm', class: 'btn-primary' }
    ],
    onConfirm: (id) => {
        console.log('Confirmé !');
    }
});

// Modal de confirmation (avec Promise)
const confirmed = await ModalManager.confirm('Êtes-vous sûr ?', {
    title: 'Confirmation',
    type: 'warning',  // 'info', 'success', 'warning', 'danger', 'question'
    confirmText: 'Oui, supprimer',
    cancelText: 'Non, annuler'
});
if (confirmed) {
    // L'utilisateur a confirmé
}

// Modal d'alerte
await ModalManager.alert('Opération réussie !', {
    type: 'success',
    title: 'Succès'
});

// Modal de chargement
const loadingId = ModalManager.loading('Traitement en cours...');
// ... faire quelque chose
ModalManager.close(loadingId);

// Modal avec formulaire
ModalManager.open({
    template: 'form',
    title: 'Nouveau utilisateur',
    content: `
        <div class="form-group">
            <label class="required">Nom</label>
            <input type="text" name="name" required>
        </div>
        <div class="form-group">
            <label class="required">Email</label>
            <input type="email" name="email" required>
        </div>
    `,
    onSubmit: async (formData, id) => {
        const response = await fetch('/api/users.php', {
            method: 'POST',
            body: formData
        });
        return response.ok; // false = ne pas fermer le modal
    }
});
```

### Options disponibles

| Option | Type | Description |
|--------|------|-------------|
| `template` | string | 'base', 'confirm', 'alert', 'loading', 'form' |
| `title` | string | Titre du modal |
| `content` | string | Contenu HTML |
| `message` | string | Message (pour confirm/alert) |
| `type` | string | 'info', 'success', 'warning', 'danger', 'question' |
| `size` | string | 'modal-sm', 'modal-lg', 'modal-xl', 'modal-fullscreen' |
| `caller` | string | Identifiant de l'appelant |
| `data` | object | Données additionnelles |
| `buttons` | array | Tableau de boutons personnalisés |
| `closeOnOverlay` | boolean | Fermer en cliquant sur l'overlay (défaut: true) |
| `closeOnEscape` | boolean | Fermer avec Échap (défaut: true) |
| `onOpen` | function | Callback à l'ouverture |
| `onClose` | function | Callback à la fermeture (reçoit reason) |
| `onConfirm` | function | Callback de confirmation |
| `onCancel` | function | Callback d'annulation |
| `onSubmit` | function | Callback de soumission (pour form) |

### Empilement de modals

```javascript
// Premier modal
const modal1 = ModalManager.open({
    title: 'Modal 1',
    content: '<button onclick="openSecondModal()">Ouvrir modal 2</button>'
});

function openSecondModal() {
    // Le modal 1 devient inactif automatiquement
    ModalManager.open({
        title: 'Modal 2',
        content: 'Je suis au-dessus du modal 1',
        onClose: () => {
            // Le modal 1 redevient actif automatiquement
        }
    });
}
```

### Layout du Footer

Les boutons du footer sont automatiquement répartis :
- **À gauche** : Boutons `btn-danger` (Supprimer, etc.)
- **À droite** : Tous les autres boutons (Annuler, Copier, Enregistrer)

```javascript
buttons: [
    { text: 'Supprimer', action: 'delete', class: 'btn-danger' },  // → Gauche
    { text: 'Copier', action: 'copy', class: 'btn-secondary' },    // → Droite
    { text: 'Annuler', action: 'close', class: 'btn-secondary' },  // → Droite
    { text: 'Enregistrer', action: 'confirm', class: 'btn-primary' } // → Droite
]
```

**Classes CSS du footer :**
- `.footer-left` : Conteneur des boutons danger
- `.footer-right` : Conteneur des autres boutons

### API complète

```javascript
ModalManager.open(options)      // Ouvre un modal, retourne l'ID
ModalManager.close(id)          // Ferme un modal spécifique
ModalManager.closeAll()         // Ferme tous les modals
ModalManager.update(id, updates) // Met à jour le contenu
ModalManager.getData(id)        // Récupère les données d'un modal
ModalManager.isOpen(id)         // Vérifie si un modal est ouvert
ModalManager.count()            // Nombre de modals ouverts
ModalManager.confirm(msg, opts) // Raccourci confirmation (Promise)
ModalManager.alert(msg, opts)   // Raccourci alerte (Promise)
ModalManager.loading(msg)       // Raccourci chargement
```

---

## 📂 Système de Gestion des Catégories

### Architecture

Le système de catégories permet de gérer les types d'objets de collection avec différents niveaux d'accès selon le statut de l'utilisateur.

**Fichiers :**
```
/public/api/categories.php       # API REST des catégories
/public/views/categories.php     # Vue SPA
/public/assets/css/categories.css # Styles
/public/assets/js/categories.js  # Logique JavaScript
```

### Niveaux d'accès

| Utilisateur | Catégories par défaut | Catégories publiques | Ses catégories | Création |
|-------------|----------------------|---------------------|----------------|----------|
| **Free** | ✅ Consultation | ❌ | ❌ | ❌ |
| **Premium** | ✅ Consultation | ✅ Consultation | ✅ CRUD | ✅ |
| **Admin** | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ |

### API Endpoints

| Méthode | Endpoint | Description | Accès |
|---------|----------|-------------|-------|
| `GET` | `/api/categories.php` | Liste des catégories accessibles | Authentifié |
| `GET` | `/api/categories.php?id=X` | Détails d'une catégorie | Authentifié |
| `POST` | `/api/categories.php` | Créer une catégorie | Premium/Admin |
| `PUT` | `/api/categories.php?id=X` | Modifier une catégorie | Proprio/Admin |
| `DELETE` | `/api/categories.php?id=X` | Supprimer une catégorie | Proprio/Admin |

**Paramètres GET (liste) :**
- `search` : Recherche dans le nom et la description
- `filter` : 'all', 'default', 'public', 'mine'
- `show_default` : 1/0 - Inclure les catégories par défaut
- `show_public` : 1/0 - Inclure les catégories publiques

### Table `categories`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | int(11) | Clé primaire |
| `name` | varchar(100) | Nom (unique par user) |
| `description` | text | Description publique |
| `Notes` | text | Notes privées |
| `user_id` | int(11) | Propriétaire actuel (NULL = système/par défaut) |
| `original_creator` | int(11) | Créateur original (FK → users, SET NULL on delete) |
| `is_default` | tinyint(1) | Catégorie système |
| `icon` | varchar(255) | Emoji ou icône |
| `visible` | tinyint(1) | Publique pour les Premium |
| `created_at` | timestamp | Date de création |

**Contraintes :**
- `chk_default_implies_visible` : Une catégorie par défaut (`is_default = 1`) est toujours visible (`visible = 1`)

### Usage JavaScript

```javascript
// Le module s'initialise automatiquement via le router
// Pour recharger manuellement :
SnowShelfCategories.reload();

// Les données sont disponibles dans window.CategoriesPageData
console.log(CategoriesPageData.isPremium);  // true/false
console.log(CategoriesPageData.canCreate);  // true/false
```

### Interface utilisateur

- **Bannière Premium** : Affichée pour les utilisateurs Free, les invite à passer Premium
- **Barre d'outils** : Recherche, filtres par type, toggles d'affichage
- **Grille de cartes** : Chaque catégorie est une carte avec icône, badges, actions
- **Modal de création/édition** : Formulaire complet avec prévisualisation de l'icône

### Catégories par défaut (système)

14 catégories prédéfinies sont disponibles pour tous :
- 🎮 Jeux vidéo
- 🎲 Jeux de société
- 🕹️ Consoles & Systèmes
- 🧸 Jouets
- 📚 Livres
- 🃏 Cartes à collectionner
- 📼 VHS
- 📀 DVD
- 💿 Blu-ray
- 💽 LaserDisc
- 🎵 Vinyles
- 💿 CD Audio
- 📼 K7 Audio
- 🖼️ Albums d'images

---

## 📦 Système de Gestion de la Collection (Items)

### Architecture

| Fichier | Rôle |
|---------|------|
| `/public/views/collection.php` | Vue principale SPA |
| `/public/api/items.php` | API REST CRUD complète |
| `/public/api/user-categories.php` | API catégories pour filtre |
| `/public/assets/css/collection.css` | Styles responsives |
| `/public/assets/js/collection.js` | Logique et lazy loading |

### Fonctionnalités principales

- **Affichage** : Mode grille (vignettes) ou liste (détails)
- **Recherche** : Recherche dans nom, description, notes
- **Tri** : Par nom, date création/modification, valeur, note
- **Filtres avancés** : Catégorie, note min, valeur min/max, dates, état recherche
- **Performance** : 
  - Lazy loading des images via IntersectionObserver
  - Infinite scroll (50 items par page)
  - Cache-busting des images (`?v={timestamp}`)
- **Persistance** : Mode d'affichage et tri sauvegardés en localStorage

### API `/api/items.php`

| Méthode | Paramètres | Description |
|---------|------------|-------------|
| `GET` | `?page=&limit=&sort=&order=` | Liste paginée |
| `GET` | `?id=X` | Détails complets d'un item |
| `POST` | FormData | Créer un nouvel item |
| `PUT` | FormData + `?id=X` | Modifier un item |
| `DELETE` | `?id=X` | Supprimer un item |

**Filtres disponibles :**
- `search` : Recherche textuelle
- `category_id` : Filtrer par catégorie
- `min_rating` : Note minimale (1-5)
- `min_value` / `max_value` : Plage de valeur
- `date_from` / `date_to` : Plage de dates
- `search_state` : État de recherche (looking, owned, both, null)

### Usage JavaScript

```javascript
// API publique - Initialisation automatique si .collection-page présent
CollectionPage.init();      // Initialiser manuellement
CollectionPage.destroy();   // Nettoyer (appelé par router onUnload)
CollectionPage.refresh();   // Recharger les données
CollectionPage.setViewMode('grid');  // 'grid' ou 'list'
CollectionPage.openItemModal(itemId);  // Ouvrir modal édition
CollectionPage.openAddItemModal();     // Ouvrir modal création
```

### Tables de base de données

#### Table `items`
| Colonne | Type | Description |
|---------|------|-------------|
| `id` | int | Clé primaire |
| `user_id` | int | Propriétaire (FK → users) |
| `name` | varchar(255) | Nom de l'item |
| `description` | text | Description |
| `Notes` | text | Notes personnelles |
| `date_add` | datetime | Date d'ajout |
| `date_modified` | datetime | Dernière modification |
| `date_obtained` | date | Date d'obtention |
| `value` | decimal(10,2) | Valeur estimée |
| `buy_price` | decimal(10,2) | Prix d'achat |
| `rating` | tinyint | Note (1-5) |
| `search_state` | enum | 'looking', 'owned', NULL |

#### Table `item_img`
| Colonne | Type | Description |
|---------|------|-------------|
| `id` | int | Clé primaire |
| `item_id` | int | FK → items |
| `filename` | varchar(255) | Nom du fichier |
| `position` | int | Ordre d'affichage |
| `created_at` | timestamp | Date d'upload |

#### Tables associées
- `item_categories` : Association items ↔ catégories
- `item_grades` : Notes d'état (cosmétique, complétude, fonctionnement)
- `item_videos` : Vidéos associées
- `item_audio` : Audio associé
- `item_doc` : Documents associés

### Interface utilisateur

- **Barre d'outils sticky** : Recherche, tri, mode d'affichage, filtres
- **Panneau de filtres** : Slide-in depuis la droite (mobile) ou dropdown (desktop)
- **Grille responsive** : Cards avec image, nom, valeur, note en étoiles
- **Mode liste** : Lignes avec plus d'informations visibles
- **États vides** : Messages différents selon contexte (pas d'items, filtres sans résultat)

---

## 🔧 Stack Technique

- **Backend** : PHP 8.x (via Docker SWAG)
- **Base de données** : MariaDB 10.x
- **Frontend** : HTML5, CSS3 (Flexbox/Grid), JavaScript vanilla
- **Framework CSS** : Custom (système de thèmes maison)
- **Framework JS** : Aucun (vanilla JS avec architecture SPA légère)
- **Architecture** : SPA hybride (shell PHP + fragments via API)

---

## 📝 Notes de Développement

### Conventions de code :
- **Langue des commentaires** : 🇫🇷 Français exclusivement
- **Logs temporaires** : 🇫🇷 Français exclusivement
- **Noms de variables/fonctions** : Anglais (convention standard)

### ⚠️ Règles de compatibilité thèmes (IMPORTANT) :

**Toujours utiliser les variables CSS du système de thèmes** pour garantir la compatibilité avec tous les thèmes :

```css
/* ✅ CORRECT - Utilise les variables du thème */
.element {
  background: var(--card-bg);
  color: var(--text);
  border: 1px solid var(--border-color);
}

/* ❌ INCORRECT - Couleurs en dur */
.element {
  background: #333;
  color: #fff;
  border: 1px solid #555;
}
```

**Variables CSS principales à utiliser :**
| Variable | Usage |
|----------|-------|
| `--main-bg-color` | Fond principal de page |
| `--card-bg` | Fond des cartes/modales (avec transparence 0.7) |
| `--text` | Texte principal |
| `--text-muted` | Texte secondaire |
| `--text-heading` | Titres |
| `--border-color` | Bordures |
| `--button-color` | Boutons standards |
| `--button-primary` | Boutons primaires |
| `--accent-color` | Couleur d'accent (RGB) |
| `--link-color` | Liens |
| `--input-bg` | Fond des champs |
| `--input-border` | Bordure des champs |
| `--success-color` | Succès |
| `--error-color` | Erreur |
| `--warning-color` | Avertissement |
| `--overlay-bg` | Overlay sur médias (RGB) |
| `--overlay-text` | Texte sur overlay |
| `--viewer-bg` | Fond du viewer (RGB) |
| `--shadow-color` | Ombres (RGB) |

**Fichier de thèmes :** `public/themes/themes.css` (23 thèmes disponibles)

### Priorités :
1. ~~Structure de base du projet~~ ✅
2. ~~Système d'authentification~~ ✅
3. Modèle de données pour les collections (en cours)
4. Interface de gestion des collections
5. Système de recherche et filtrage
6. Import/Export de données
7. API pour intégrations futures

### Points d'attention :
- Performances sur mobile (images optimisées, lazy loading)
- Accessibilité (WCAG)
- SEO-friendly
- Sécurité (XSS, CSRF, SQL Injection)

---

## 📅 Historique des Sessions

| Date | Travail effectué |
|------|------------------|
| 2025-01-XX | Création du fichier de contexte projet |
| 2025-01-XX | Système de thèmes (23 thèmes), page de login avec glassmorphism |
| 2025-01-XX | Système i18n complet (FR/EN), correction transparence thèmes |
| 2025-01-XX | Système d'inscription complet : register.php, vérification email, connexion par email uniquement |
| 2025-12-01 | Dashboard utilisateur, gestion compte (avatar, thème, mot de passe) |
| 2025-12-01 | Panel d'administration complet (gestion utilisateurs CRUD) |
| 2025-12-02 | Architecture SPA (router.js, views/, api/pages.php) |
| 2025-12-02 | Sécurité uploads : .htaccess, SecureUpload.php, protection dossiers |
| 2025-12-02 | Système de modals (ModalManager.js) avec empilement et accessibilité |
| 2025-12-02 | Système de gestion des catégories (API, vue, logique Free/Premium/Admin) |
| 2025-12-02 | Amélioration UX modals : header/footer pleine largeur, boutons groupés (danger à gauche), icônes SVG |
| 2025-12-03 | IconEditor : sélecteur emoji/upload pour icônes de catégories |
| 2025-12-03 | ImageEditor : éditeur d'images complet (recadrage, rotation, zoom, tactile) |
| 2025-12-03 | API image-temp.php + storage/temp/ pour images temporaires |
| 2025-12-03 | UploadConfig : configuration dynamique des uploads depuis table BDD |
| 2025-12-03 | Migration de tous les uploads vers UploadConfig (SecureUpload, users.php, categories.php, admin/config.php) |
| 2025-12-03 | Admin Upload Config : nouvel onglet dans Paramètres pour gérer les catégories d'upload (extensions, tailles, activation) |
| 2025-12-03 | MediaListManager : composant réutilisable pour gérer les médias (images, vidéos, audio, docs) avec drag & drop, réordonnancement |
| 2025-12-03 | Intégration FFmpeg statique (/bin/ffmpeg) pour génération de thumbnails vidéo |
| 2025-12-03 | API category-media.php : CRUD complet pour médias de catégories avec gestion fichiers temporaires |
| 2025-12-03 | Nouvelles variables CSS thèmes : --overlay-bg, --overlay-text, --viewer-bg, --shadow-color |
| 2025-12-03 | Documentation : MEDIA_LIST_MANAGER.md, CHANGELOG.md, mise à jour copilot-instructions.md |
| 2025-12-03 | CameraCapture : nouveau modal pour capture photo via caméra (zoom, flash, sélection caméra, intégration ImageEditor) |
| 2025-12-03 | CameraCapture améliorations : liste déroulante avec noms des caméras sur desktop, détection types (avant/arrière/grand angle/téléobjectif) |
| 2025-12-03 | CameraCapture corrections : fix erreur currentState null, fix affichage sélecteur (overflow), intégration complète dans modals catégories |
| 2025-12-06 | WebSearchModal : nouveau module de recherche web avec multi-fournisseurs (toys, books, video_games, movies, music, generic) |
| 2025-12-06 | Boutons ajout rapide dans header : #quickAddBtn et #quickAddCategoryBtn avec navigation SPA |
| 2025-12-06 | Bouton d'édition rapide sur items de la page collection |
| 2025-12-07 | Table Admin_webApi : 22 fournisseurs configurés (LEGO, RAWG, TMDB, Google Books, etc.) |
| 2025-12-07 | Admin APIs : custom dropdown thémé pour type de contenu, toggle PREMIUM_ONLY |
| 2025-12-07 | Gestion Premium fournisseurs : badge 🔒, désactivation pour users free, window.userInfo exposé |

---

*Dernière mise à jour : 7 décembre 2025*

