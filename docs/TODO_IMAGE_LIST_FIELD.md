# TODO : Implémentation du type de champ `image_list`

> **Objectif** : Ajouter un nouveau type de champ pour afficher une liste d'éléments avec image et nom
> **Cas d'usage** : Minifigs LEGO, personnages, accessoires, pièces avec images
> **Date** : 2025-12-29

---

## 📋 Étapes d'implémentation

### Phase 1 : Backend - Déclaration du type ✅
- [x] 1.1 Ajouter `image_list` dans `getFieldTypes()` de `type-fields.php`

### Phase 2 : Backend - Transformation des données
- [ ] 2.1 Ajouter le transform `image_list_extract` dans `FieldTransformer.php`
- [ ] 2.2 Gérer l'extraction depuis les structures JSON complexes (minifigs.items, etc.)

### Phase 3 : Frontend - Formulaire d'édition (fields.js)
- [ ] 3.1 Créer la fonction `buildImageListHtml()` pour le rendu du champ en mode édition
- [ ] 3.2 Gérer l'affichage grille avec images + noms
- [ ] 3.3 Ajouter le CSS pour `.metadata-image-list-grid`

### Phase 4 : Frontend - Vue lecture seule (item-view.js)  
- [ ] 4.1 Ajouter le cas `image_list` dans `buildMetadataViewHtml()`
- [ ] 4.2 Créer la fonction `formatImageListForView()`

### Phase 5 : Stockage des images locales
- [ ] 5.1 Créer le endpoint pour télécharger les images lors de l'import
- [ ] 5.2 Structure : `/storage/users/{uid}/items/{iid}/metadata_images/{field_key}/`
- [ ] 5.3 Mettre à jour les URLs dans le JSON stocké

### Phase 6 : Traductions i18n
- [ ] 6.1 Ajouter les clés dans `fr.php` et `en.php`

### Phase 7 : Tests et validation
- [ ] 7.1 Tester l'import depuis Rebrickable (minifigs)
- [ ] 7.2 Tester l'affichage en mode vue
- [ ] 7.3 Tester l'affichage en mode édition
- [ ] 7.4 Tester la suppression d'item (cleanup images)

---

## 🗄️ Structure de données

### Format JSON stocké dans `item_metadata.meta_value`
```json
[
    {
        "id": "fig-016248",
        "name": "Ant-Man", 
        "quantity": 1,
        "imageUrl": null
    },
    {
        "id": "fig-011410",
        "name": "Captain America",
        "quantity": 1,
        "imageUrl": "/metadata_images/minifigs/fig-011410.jpg"
    }
]
```

### Configuration dans `primary_type_fields.field_options`
```json
{
    "id_key": "id",
    "name_key": "name",
    "image_key": "imageUrl",
    "quantity_key": "quantity",
    "show_quantity": true,
    "placeholder_icon": "account"
}
```

### Mapping dans `primary_type_key_to_field`
```json
{
    "api_keys": ["minifigs.items", "characters", "parts.items"],
    "transform_type": "image_list_extract",
    "transform_config": {
        "items_path": "items",
        "id_key": "id", 
        "name_key": "name",
        "image_key": "imageUrl",
        "quantity_key": "quantity"
    }
}
```

---

## 📁 Fichiers à modifier

| Fichier | Modification |
|---------|--------------|
| `public/api/admin/type-fields.php` | Ajouter type dans `getFieldTypes()` |
| `core/FieldTransformer.php` | Ajouter transform `image_list_extract` |
| `public/assets/js/collection/metadata/fields.js` | Créer `buildImageListHtml()` |
| `public/assets/js/collection/ui/item-view.js` | Ajouter rendu pour `image_list` |
| `public/assets/css/collection.css` | Styles grille images |
| `lang/fr.php` | Traductions |
| `lang/en.php` | Traductions |

---

## ⚠️ Points d'attention

1. **Images null** : Certains éléments n'ont pas d'image → Prévoir placeholder SVG
2. **Thumbnails** : Utiliser `/api/thumbnail.php` pour les images locales
3. **URLs externes** : Garder les URLs externes si pas de téléchargement local
4. **Quantité** : Afficher badge si quantity > 1
5. **Responsive** : Grille adaptative (4 cols desktop, 2 cols mobile)
6. **Suppression item** : Le dossier `metadata_images` sera supprimé avec l'item parent
7. **Performance** : Lazy loading pour les grilles avec beaucoup d'éléments

---

## 🎨 Design prévu

```
┌─────────────────────────────────────────────────────┐
│ Minifigurines (10)                                  │
├─────────────────────────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                │
│ │ IMG  │ │ IMG  │ │ 👤   │ │ IMG  │                │
│ │      │ │      │ │      │ │      │                │
│ └──────┘ └──────┘ └──────┘ └──────┘                │
│ Ant-Man  Cap.Am.  Dr.Str.  Falcon                   │
│                                                     │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                │
│ │ IMG  │ │ 👤   │ │ IMG  │ │ IMG  │                │
│ │      │ │      │ │      │ │      │                │
│ └──────┘ └──────┘ └──────┘ └──────┘                │
│ Iron Man  Spider  S.Witch  Thanos                   │
└─────────────────────────────────────────────────────┘
```

---

## 🚀 Ordre d'implémentation

1. **Type-fields.php** - Déclarer le nouveau type (2 min)
2. **FieldTransformer.php** - Transform des données (15 min)
3. **fields.js** - Rendu édition (30 min)
4. **item-view.js** - Rendu vue (20 min)
5. **CSS** - Styles (15 min)
6. **i18n** - Traductions (5 min)
7. **Tests** - Validation (30 min)

**Temps total estimé : ~2h**
