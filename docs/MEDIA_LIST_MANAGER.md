# MediaListManager - Documentation

> Gestionnaire de listes de médias réutilisable pour SnowShelf.

## 🎯 Vue d'ensemble

Le `MediaListManager` est un module JavaScript permettant de gérer des listes de fichiers médias avec :
- Upload par drag & drop ou clic
- Prévisualisation (images, vidéos avec badge, icônes pour audio/documents)
- Réorganisation par glisser-déposer
- Édition d'images via ImageEditor intégré
- Lecteur audio intégré
- Suppression individuelle ou globale
- Support des fichiers temporaires (mode création)

## 📦 Fichiers

| Fichier | Description |
|---------|-------------|
| `/public/assets/js/media-list-manager.js` | Module JavaScript principal |
| `/public/assets/css/media-list-manager.css` | Styles (utilise les thèmes) |
| `/public/api/category-media.php` | API CRUD pour médias de catégories |

## 🚀 Utilisation

### Création d'une instance

```javascript
const manager = MediaListManager.create({
    container: document.getElementById('my-container'),
    type: 'images',                    // images, videos, audio, documents
    apiEndpoint: '/api/category-media.php',
    entityType: 'category',
    entityId: 123,                     // null pour mode création
    userId: window.userId,
    isDefault: false,                  // true pour catégories système
    readonly: false,
    onFilesChange: (data) => {
        // data = { type, files, pendingFiles }
        console.log('Fichiers:', data.files.length);
    },
    onError: (message) => {
        showToast(message, 'error');
    }
});

// Charger les fichiers existants
manager.loadFiles();
```

### Mode création (fichiers temporaires)

```javascript
// Sans entityId, les fichiers sont stockés temporairement
const manager = MediaListManager.create({
    container: myContainer,
    type: 'images',
    entityId: null,  // Mode création
    // ...
});

// Après création de l'entité, finaliser les fichiers
await manager.finalizePendingFiles(newEntityId);
```

### Récupérer une instance existante

```javascript
const manager = MediaListManager.getInstance('manager-id');
if (manager) {
    manager.loadFiles();
}
```

## ⚙️ Options

| Option | Type | Description |
|--------|------|-------------|
| `container` | `HTMLElement` | **Requis.** Élément conteneur |
| `type` | `string` | **Requis.** Type de média : `images`, `videos`, `audio`, `documents` |
| `apiEndpoint` | `string` | URL de l'API (défaut: `/api/category-media.php`) |
| `entityType` | `string` | Type d'entité : `category`, `item` |
| `entityId` | `number\|null` | ID de l'entité (null = mode création) |
| `userId` | `number` | ID de l'utilisateur |
| `isDefault` | `boolean` | Catégorie par défaut du système |
| `readonly` | `boolean` | Mode lecture seule |
| `onFilesChange` | `Function` | Callback sur changement |
| `onError` | `Function` | Callback sur erreur |

## 📤 Callbacks

### onFilesChange
```javascript
onFilesChange: (data) => {
    // data.type - Type de média
    // data.files - Fichiers existants [{id, filename, path, thumbnailPath, order}]
    // data.pendingFiles - Fichiers en attente [{tempId, tempPath, filename}]
}
```

### onError
```javascript
onError: (message) => {
    showToast(message, 'error');
}
```

## 🎨 Types de médias

### Images
- Extensions : jpg, jpeg, png, gif, webp, svg, bmp
- Éditeur ImageEditor intégré au drop/upload
- Prévisualisation en miniature

### Vidéos
- Extensions : mp4, webm, avi, mkv, mov
- Génération de thumbnail automatique (FFmpeg)
- Badge play sur la miniature

### Audio
- Extensions : mp3, wav, ogg, flac, m4a
- Lecteur audio intégré avec contrôles
- Icône audio pour chaque fichier

### Documents
- Extensions : pdf, doc, docx, txt, zip, epub
- Icône document
- Téléchargement au clic

## 🎨 Personnalisation CSS

Le module utilise les variables CSS du thème :

```css
/* Couleurs principales */
--accent-color          /* Accent (RGB) */
--border-color          /* Bordures */
--card-bg               /* Fond des cartes */
--text, --text-muted    /* Textes */

/* Overlays (badges, boutons sur médias) */
--overlay-bg            /* Fond semi-transparent */
--overlay-text          /* Texte sur overlay */

/* États */
--error-color           /* Bouton supprimer */
--success-color         /* État lecture audio */
```

## 📱 Responsive

- Zone de drop compacte et cliquable
- Grille adaptative pour les miniatures
- Contrôles tactiles optimisés
- Lecteur audio responsive

## 🔒 API Backend

### Endpoints

| Méthode | Action | Description |
|---------|--------|-------------|
| `GET` | - | Liste des médias d'une entité |
| `POST` | `upload` | Upload direct |
| `POST` | `add_from_temp` | Ajouter depuis stockage temp |
| `POST` | `finalize_temp` | Finaliser fichiers temporaires |
| `PUT` | `reorder` | Réorganiser l'ordre |
| `PUT` | `update_from_temp` | Remplacer un média |
| `DELETE` | - | Supprimer un média |
| `DELETE` | `delete_all` | Supprimer tous les médias |

### Structure de réponse

```json
{
    "success": true,
    "data": {
        "id": 123,
        "filename": "image.jpg",
        "path": "/storage/users/1/Categories/1/images/image.jpg",
        "thumbnailPath": "/storage/users/1/Categories/1/images/image.jpg",
        "order": 0
    }
}
```

## 🗄️ Tables de base de données

| Table | Description |
|-------|-------------|
| `category_img` | Images des catégories |
| `category_videos` | Vidéos des catégories |
| `category_audio` | Audio des catégories |
| `category_doc` | Documents des catégories |

### Structure commune

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | int | Clé primaire |
| `category_id` | int | FK vers categories |
| `url` | varchar | Chemin relatif au storage |
| `title` | varchar | Nom du fichier |
| `ordre` | int | Ordre d'affichage |
| `created_at` | timestamp | Date création |

### Colonnes spécifiques

- **Videos** : `thumbnail_url`, `duration`, `format`, `size`
- **Audio** : `duration`, `format`, `size`
- **Documents** : `format`, `size`, `filename_original`, `mime`

## 🐛 Débogage

```javascript
// Récupérer toutes les instances
MediaListManager.getAllInstances();

// Accéder aux fichiers
const manager = MediaListManager.getInstance('id');
console.log(manager.files);
console.log(manager.pendingFiles);
```

---

*Dernière mise à jour : Décembre 2025*
