# WebSearchModal - Plan d'action Import

> **Date création** : 8 décembre 2025
> **Dernière mise à jour** : 8 décembre 2025
> **Statut** : ✅ TERMINÉ - Toutes les phases implémentées (incluant Phase 8)

## 📋 Résumé

Ajout d'une fonctionnalité d'import des résultats de recherche web vers les items de collection, avec sélection du type primaire et des champs à importer.

---

## 🔄 Flux utilisateur cible

```
1. [Collection] Clic "Recherche Web" sur un item
        ↓
2. [WebSearchModal] Recherche → Résultats
        ↓
3. [Résultat] Clic sur un résultat
        ↓
4. [Modal Détails] Affiche infos complètes
        ↓
5. [Charger détails] Bouton pour récupérer plus d'infos (PHASE 8)
        ↓
6. [Type primaire] Dropdown pré-rempli (modifiable)
        ↓
7. [Sélection] Checkboxes des champs + [Tout/Rien]
        ↓
8. [Confirmer] "Importer la sélection"
        ↓
9. [Collection] Formulaire pré-rempli avec les données
```

---

## 📊 Mapping Types Provider → Primary Types

| Type Provider | Primary Type suggéré | ID |
|---------------|---------------------|-----|
| `toys` | toys_fig ou toys_construct | 6 ou 7 |
| `books` | books | 1 |
| `video_games` | video_games | 2 |
| `movies` | movies | 4 |
| `music` | music | 3 |
| `generic` | divers | 8 |

---

## ✅ Phases de développement

### Phase 1 : Modal de détails étendu ✅ TERMINÉ
- [x] Créer fonction `showResultDetails(result)` dans `web-search.js`
- [x] Modal empilé (via ModalManager) avec :
  - Image grande taille
  - Titre + description complète
  - Grille de toutes les métadonnées
  - Lien source externe
  - Section import
- [x] Modifier `selectResult()` pour appeler `showResultDetails()` au lieu de fermer directement
- [x] Ajouter styles CSS pour le modal détails

**Fichiers modifiés** : `web-search.js`, `web-search.css`

---

### Phase 2 : Sélection du type primaire ✅ TERMINÉ
- [x] Ajouter dropdown `primary_type` dans le modal détails
- [x] Charger la liste des types via nouvelle API `?action=types`
- [x] Pré-remplir selon :
  1. Type de l'item existant (si édition) via `options.currentPrimaryTypeId`
  2. Mapping type provider → type primaire
- [x] Afficher le nom traduit du type

**Fichiers modifiés** : `web-search.js`, `item-metadata.php`

---

### Phase 3 : Sélection des champs à importer ✅ TERMINÉ
- [x] Créer fonction `buildDetailModalContent()` avec liste de checkboxes
- [x] Liste de checkboxes avec :
  - Champs de base : nom, description, image
  - Métadonnées du résultat mappées
- [x] Boutons raccourcis : `[✓ Tout]` `[✗ Rien]`
- [x] Preview des valeurs à côté de chaque checkbox
- [x] Styles pour la liste de sélection

**Fichiers modifiés** : `web-search.js`, `web-search.css`

---

### Phase 4 : Mapping métadonnées ✅ TERMINÉ
- [x] Créer constante `METADATA_MAPPING` dans `web-search.js`
- [x] Mapper les clés provider vers les `field_key` de `primary_type_fields`
- [x] Stocker le mapping dans l'attribut `data-mapped`

**Mapping implémenté** :
```javascript
const METADATA_MAPPING = {
    // Communs
    'year': 'year',
    'rating': 'rating',
    'price': 'price',
    
    // Books
    'authors': 'author',
    'isbn': 'isbn',
    'pages': 'pages',
    'publisher': 'publisher',
    
    // Video Games
    'platforms': 'platform',
    'developer': 'developer',
    
    // Toys
    'pieces': 'pieces',
    'brand': 'brand',
    'sku': 'reference',
    
    // Movies/Series
    'runtime': 'duration',
    'director': 'director',
    'episodes': 'episodes',
    
    // Music
    'artist': 'artist',
    'album': 'album',
    'track_count': 'tracks',
};
```

**Fichiers modifiés** : `web-search.js`

---

### Phase 5 : Retour des données enrichies ✅ TERMINÉ
- [x] Modifier le callback `onSelect` pour retourner un objet enrichi
- [x] Ajouter bouton "Importer" dans le modal détails
- [x] Fermer les 2 modals après import
- [x] Toast de confirmation

**Format de retour** :
```javascript
{
    raw: { /* résultat original */ },
    primaryTypeId: 7,
    primaryTypeName: 'toys_construct',
    fieldsToImport: {
        name: "...",
        description: "...",
        image_url: "...",
        metadata: { /* champs sélectionnés */ }
    },
    importImage: true
}
```

**Fichiers modifiés** : `web-search.js`

---

### Phase 6 : Intégration Collection ✅ TERMINÉ
- [x] Modifier `collection.js` pour traiter le nouveau format de `onSelect`
- [x] Pré-remplir les champs du formulaire item avec les données importées
- [x] Charger l'image depuis l'URL si sélectionnée (fonction `importImageFromUrl`)
- [x] Pré-remplir les métadonnées dynamiques selon le type primaire (fonction `applyImportedMetadata`)
- [x] Changement automatique du type primaire

**Fichiers modifiés** : `collection.js`

**Nouvelles fonctions** :
- `importImageFromUrl(modal, imageUrl)` - Télécharge et ajoute l'image au MediaManager
- `applyImportedMetadata(modal, metadata)` - Applique les métadonnées aux champs dynamiques

---

### Phase 7 : Traductions ✅ TERMINÉ
- [x] Ajouter clés `web_search.detail_*` dans `fr.php`
- [x] Ajouter clés `web_search.detail_*` dans `en.php`

**Fichiers modifiés** : `lang/fr.php`, `lang/en.php`

---

### Phase 8 : Chargement détails complets ✅ TERMINÉ
- [x] Créer endpoint `?action=details` dans `web-search.php`
- [x] Mapping endpoints détails par provider (lego, rawg, googlebooks, tmdb, etc.)
- [x] Fonction `handleGetDetails()` pour appel toys_api
- [x] Fonction `normalizeDetailedItem()` pour normaliser les réponses enrichies
- [x] Ajouter bouton "Plus de détails" dans le modal JavaScript
- [x] Fonction `loadProductDetails()` pour appeler l'API
- [x] Fonction `updateDetailModalContent()` pour rafraîchir le modal
- [x] Gestion état du bouton (loading, success)
- [x] Traductions FR/EN pour les nouveaux textes

**Nouvelles clés de traduction** :
- `detail_load_more` - Libellé bouton
- `detail_load_more_title` - Tooltip bouton
- `detail_loading` - Pendant le chargement
- `detail_loaded` - Après chargement réussi
- `detail_loaded_success` - Toast de succès
- `detail_load_error` - Toast d'erreur

**Fichiers modifiés** : `web-search.php`, `web-search.js`, `web-search.css`, `dashboard.php`, `lang/fr.php`, `lang/en.php`

**Endpoints détails supportés** :
| Provider | Endpoint toys_api |
|----------|------------------|
| lego | `/lego/product/{id}` |
| mega | `/mega/product/{id}` |
| rebrickable | `/rebrickable/set/{id}` |
| googlebooks | `/googlebooks/book/{id}` |
| openlibrary | `/openlibrary/book/{id}` |
| rawg | `/rawg/game/{slug}` |
| igdb | `/igdb/game/{id}` |
| tmdb_movie | `/tmdb/movie/{id}` |
| tmdb_tv | `/tmdb/tv/{id}` |
| tvdb | `/tvdb/series/{id}` |
| imdb | `/imdb/title/{id}` |
| music | `/music/album/{id}` |

---

## 📁 Fichiers concernés

| Fichier | Modifications |
|---------|---------------|
| `/public/assets/js/web-search.js` | Phases 1-5 |
| `/public/assets/css/web-search.css` | Phases 1-3 |
| `/public/assets/js/collection.js` | Phase 6 |
| `/lang/fr.php` | Phase 7 |
| `/lang/en.php` | Phase 7 |

---

## 📝 Notes techniques

### Format résultat actuel (de l'API)
```javascript
{
    id: "lego_12345",
    title: "Millennium Falcon",
    description: "Star Wars UCS",
    image_url: "https://...",
    source_url: "https://lego.com/...",
    provider: "lego",
    type: "toys",
    metadata: {
        year: 2024,
        price: "799.99€",
        pieces: 7541,
        rating: 4.8
    }
}
```

### Primary Types disponibles
| ID | name | name_fr |
|----|------|---------|
| 1 | books | Livres |
| 2 | video_games | Jeux Vidéo |
| 3 | music | Musique |
| 4 | movies | Films |
| 5 | series | Séries |
| 6 | toys_fig | Figurines |
| 7 | toys_construct | Jouets Construction |
| 8 | divers | Divers |
| 9 | board_games | Jeux de société |
| 10 | trading_cards | Cartes à collectionner |
| 11 | sticker_albums | Albums d'images |

### Options d'ouverture du modal (à étendre)
```javascript
WebSearchModal.open({
    query: 'Nom de l\'item',
    type: 'video_games',
    currentPrimaryTypeId: 7,  // NOUVEAU : type actuel de l'item
    onSelect: (result) => { }
});
```

---

## 🔧 Commandes utiles

```bash
# Vérifier les champs d'un type primaire
mysql -h 10.110.1.1 -P 3307 -u Nimai -pAmiral_Ackbar@38 snowshelf -e \
"SELECT field_key, field_label_fr, field_type FROM primary_type_fields WHERE primary_type_id = 7;"

# Vérifier le format des résultats API
# Ouvrir la console JS et lancer une recherche, observer state.results
```

---

*Dernière mise à jour : 8 décembre 2025*
