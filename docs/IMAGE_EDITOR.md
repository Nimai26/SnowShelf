# ImageEditor - Documentation

> Éditeur d'images complet pour SnowShelf avec recadrage, filtres et transformations.

## 🎯 Vue d'ensemble

L'`ImageEditor` est un modal global permettant d'éditer une image avant son enregistrement. Il offre :
- Rotation (90° gauche/droite)
- Miroir (horizontal/vertical)
- Zoom (molette, boutons, pincement tactile)
- Recadrage libre avec poignées redimensionnables
- Filtres : luminosité, contraste, saturation
- Prévisualisation en temps réel
- Support mobile complet

## 📦 Fichiers

| Fichier | Description |
|---------|-------------|
| `/public/assets/js/image-editor.js` | Module JavaScript principal |
| `/public/assets/css/image-editor.css` | Styles (utilise les thèmes) |
| `/public/api/image-temp.php` | API de sauvegarde temporaire |
| `/storage/temp/` | Dossier des fichiers temporaires |
| `/scripts/cleanup-temp.php` | Script de nettoyage (cron) |

## 🚀 Utilisation

### Ouverture basique

```javascript
ImageEditor.open({
    image: file,  // File, Blob ou URL string
    onSave: (result) => {
        console.log('Chemin temporaire :', result.tempPath);
        console.log('Blob :', result.blob);
        console.log('Dimensions :', result.width, 'x', result.height);
    },
    onCancel: () => {
        console.log('Édition annulée');
    }
});
```

### Depuis un input file

```javascript
document.getElementById('imageInput').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    ImageEditor.open({
        image: file,
        onSave: async (result) => {
            // Le fichier est déjà uploadé vers /storage/temp/
            // Utiliser result.tempPath pour le déplacer vers sa destination finale
            
            const response = await fetch('/api/items.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'update_image',
                    temp_path: result.tempPath
                })
            });
        }
    });
});
```

### Depuis une URL existante

```javascript
ImageEditor.open({
    image: '/storage/users/42/cover.jpg',
    outputFormat: 'image/webp',  // Forcer le format de sortie
    onSave: (result) => {
        // Utiliser result.tempPath
    }
});
```

## ⚙️ Options

| Option | Type | Description |
|--------|------|-------------|
| `image` | `string\|File\|Blob` | **Requis.** Source de l'image |
| `caller` | `string` | Identifiant du modal appelant (optionnel) |
| `targetField` | `string` | Nom du champ cible (info seulement) |
| `outputFormat` | `string` | Format forcé : `image/png`, `image/jpeg`, `image/webp`. Si null, conserve le format original |
| `onSave` | `Function` | Callback appelé après sauvegarde |
| `onCancel` | `Function` | Callback appelé si annulation |
| `translations` | `Object` | Traductions personnalisées |

## 📤 Résultat de `onSave`

```javascript
{
    blob: Blob,           // Blob de l'image finale
    tempPath: string,     // Chemin relatif : '/storage/temp/temp_1_1234567890_abc123.jpg'
    filename: string,     // Nom du fichier : 'temp_1_1234567890_abc123.jpg'
    width: number,        // Largeur en pixels
    height: number,       // Hauteur en pixels
    format: string        // Type MIME : 'image/jpeg'
}
```

## 📱 Comportement mobile

- **1 doigt** : Déplacement de l'image
- **2 doigts** : Zoom (pincement)
- **Mode recadrage** : Bouton toggle pour activer/désactiver
- En mode recadrage, le déplacement agit sur la zone de recadrage

## 🎨 Thèmes

Le CSS utilise les variables du système de thèmes :
- `--accent-color` (RGB) pour les accents
- `--card-bg`, `--modal-bg-color` pour les fonds
- `--text`, `--text-muted` pour les textes
- `--border-color` pour les bordures

## 🗑️ Nettoyage automatique

Les fichiers temporaires sont automatiquement supprimés :
1. **À chaque upload** : Les anciens fichiers de l'utilisateur (> 1h)
2. **Via cron** : Script `/scripts/cleanup-temp.php`

### Configuration cron recommandée :

```bash
# Toutes les heures
0 * * * * docker exec swag php /Websites/SnowShelf/scripts/cleanup-temp.php

# Ou directement si PHP accessible
0 * * * * /usr/bin/php /NAS/Data/Websites/SnowShelf/scripts/cleanup-temp.php
```

## 🔒 Sécurité

- Authentification requise (session PHP)
- Validation MIME stricte (jpeg, png, gif, webp)
- Vérification `getimagesize()` 
- Limite de taille : 10 MB
- Noms de fichiers sécurisés avec timestamp et token aléatoire
- `.htaccess` bloquant l'exécution PHP dans `/storage/temp/`

## 🌐 i18n

Les traductions sont gérées via le système i18n de SnowShelf.

### Clés utilisées :

```php
// Dans lang/fr.php et lang/en.php
'image_editor' => [
    'title' => 'Éditeur d\'image',
    'rotate_left' => 'Rotation gauche (90°)',
    'rotate_right' => 'Rotation droite (90°)',
    'flip_horizontal' => 'Miroir horizontal',
    'flip_vertical' => 'Miroir vertical',
    'zoom_in' => 'Zoom avant',
    'zoom_out' => 'Zoom arrière',
    'reset' => 'Réinitialiser',
    'crop' => 'Recadrer',
    'crop_mode' => 'Mode recadrage',
    'brightness' => 'Luminosité',
    'contrast' => 'Contraste',
    'saturation' => 'Saturation',
    'preview' => 'Aperçu',
    'drag_hint' => 'Glissez pour déplacer',
    'zoom_hint' => 'Molette ou pincement pour zoomer',
    'error_load' => 'Erreur de chargement de l\'image',
    'error_save' => 'Erreur lors de la sauvegarde',
    'processing' => 'Traitement en cours...',
],
```

## 📝 Intégration avec le modal de catégorie

```javascript
// Exemple dans le modal de création/édition de catégorie
function openCategoryImageEditor(currentImageUrl) {
    ImageEditor.open({
        image: currentImageUrl || document.getElementById('categoryImageInput').files[0],
        onSave: (result) => {
            // Mettre à jour l'aperçu
            document.getElementById('categoryImagePreview').src = result.tempPath;
            // Stocker le chemin pour l'envoi final
            document.getElementById('categoryImageTempPath').value = result.tempPath;
        }
    });
}
```

## 🐛 Débogage

```javascript
// Accéder à la configuration
console.log(ImageEditor.config);
// { minZoom: 0.1, maxZoom: 10, maxOutputSize: 5000, ... }

// Fermer programmatiquement
ImageEditor.close();
```

---

*Dernière mise à jour : Janvier 2025*
