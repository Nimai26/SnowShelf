# 📖 DOCUMENTATION API REST COMPLÈTE - SnowShelf v2

> **Document de référence** - Spécification OpenAPI 3.0 de l'API
> 
> **Date de création** : 20 février 2026
> **Base URL** : `http://10.20.0.3:4000/api/v1` (dev) 
> **Status** : ✅ Spec complète

---

## 🔐 Authent

ication

### Headers Requis

```http
Authorization: Bearer {access_token}
Content-Type: application/json
Accept-Language: fr-FR
```

### Token JWT

```json
{
  "sub": 123,
  "email": "user@example.com",
  "role": "premium",
  "iat": 1708425600,
  "exp": 1708426500
}
```

---

## 📚 Endpoints par Module

### 🔐 Auth Module

#### POST /auth/register
Inscription d'un nouvel utilisateur.

**Request:**
```json
{
  "username": "monuser",
  "email": "user@example.com",
  "password": "SecurePass123!",
  "lang": "fr"
}
```

**Response 201:**
```json
{
  "success": true,
  "message": "Un email de vérification a été envoyé",
  "data": {
    "userId": 123,
    "email": "user@example.com"
  }
}
```

#### POST /auth/login
Connexion utilisateur.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 123,
      "username": "monuser",
      "email": "user@example.com",
      "role": "free",
      "avatar": null,
      "theme": "dark",
      "lang": "fr"
    }
  }
}
```

#### POST /auth/refresh
Rafraîchir le token d'accès.

**Request:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### GET /auth/verify-email?token={token}
Vérifier l'email d'un utilisateur.

**Response 200:**
```json
{
  "success": true,
  "message": "Email vérifié avec succès"
}
```

#### POST /auth/logout
Déconnecter l'utilisateur (invalider le refresh token).

**Headers:** `Authorization: Bearer {accessToken}`

**Response 200:**
```json
{
  "success": true,
  "message": "Déconnecté avec succès"
}
```

---

### 👤 Users Module

#### GET /users/me
Récupérer les informations de l'utilisateur connecté.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "username": "monuser",
    "email": "user@example.com",
    "role": "premium",
    "isPremium": true,
    "isAdmin": false,
    "avatar": "https://cdn.snowshelf.fr/avatars/123.webp",
    "background": null,
    "theme": "nord",
    "lang": "fr",
    "itemsCount": 458,
    "categoriesCount": 12,
    "createdAt": "2025-01-15T10:30:00Z"
  }
}
```

#### PUT /users/me
Mettre à jour le profil.

**Request:**
```json
{
  "theme": "dracula",
  "lang": "en",
  "newsletter": true
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Profil mis à jour"
}
```

#### POST /users/me/avatar
Upload avatar (multipart/form-data).

**Response 200:**
```json
{
  "success": true,
  "data": {
    "avatarUrl": "https://cdn.snowshelf.fr/avatars/123.webp"
  }
}
```

#### PUT /users/me/password
Changer le mot de passe.

**Request:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass456!"
}
```

---

### 📂 Categories Module

#### GET /categories
Lister les catégories accessibles.

**Query Params:**
- `filter`: `all` | `default` | `public` | `mine` (default: `all`)
- `search`: string (optionnel)
- `page`: number (default: 1)
- `limit`: number (default: 50)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "id": 1,
        "name": "Jeux vidéo",
        "description": "Collection de jeux vidéo",
        "icon": "🎮",
        "color": "#3498db",
        "isDefault": true,
        "isPublic": true,
        "itemsCount": 234,
        "owner": null,
        "createdAt": "2025-01-01T00:00:00Z"
      },
      {
        "id": 42,
        "name": "Figurines Anime",
        "description": "Ma collection perso",
        "icon": "https://cdn.snowshelf.fr/icons/42.webp",
        "color": "#e74c3c",
        "isDefault": false,
        "isPublic": false,
        "itemsCount": 67,
        "owner": {
          "id": 123,
          "username": "monuser"
        },
        "createdAt": "2025-06-15T14:20:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 15,
      "pages": 1
    }
  }
}
```

#### GET /categories/:id
Détails d'une catégorie.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 42,
    "name": "Figurines Anime",
    "description": "Ma collection de figurines",
    "notes": "Notes privées...",
    "icon": "https://cdn.snowshelf.fr/icons/42.webp",
    "color": "#e74c3c",
    "isDefault": false,
    "isPublic": false,
    "itemsCount": 67,
    "owner": {
      "id": 123,
      "username": "monuser",
      "avatar": "https://cdn.snowshelf.fr/avatars/123.webp"
    },
    "media": {
      "images": [
        {
          "id": 1,
          "url": "/storage/users/123/Categories/42/images/img_001.webp",
          "thumbnailUrl": "/storage/thumbnails/ab/abc123.webp",
          "title": "Bannière",
          "displayOrder": 0
        }
      ],
      "videos": [],
      "audio": [],
      "documents": []
    },
    "grades": [
      { "id": 1, "name": "Comme neuf" },
      { "id": 9, "name": "Complet" },
      { "id": 10, "name": "Incomplet" }
    ],
    "mothers": [
      { "id": 6, "name": "Figurines", "icon": "🧸", "color": "#e67e22" }
    ],
    "children": [],
    "items": {
      "recent": [
        {
          "id": 1001,
          "name": "Nendoroid Hatsune Miku",
          "thumbnail": "/storage/users/123/items/1001/images/thumb.webp",
          "rating": 5,
          "createdAt": "2025-06-20T09:15:00Z"
        }
      ],
      "total": 67
    },
    "createdAt": "2025-06-15T14:20:00Z",
    "updatedAt": "2025-06-20T09:15:00Z"
  }
}
```

#### POST /categories
Créer une catégorie (Premium/Admin). Le champ `primaryTypeId` est **obligatoire** — il détermine le type d'objet et les providers Tako disponibles.

**Request:**
```json
{
  "name": "Vinyles Jazz",
  "description": "Collection de vinyles jazz",
  "icon": "🎵",
  "color": "#9b59b6",
  "primaryTypeId": 3,
  "defaultProviders": ["discogs"],
  "isPublic": false,
  "parentIds": [3]
}
```

> **`primaryTypeId`** : ID du type d'objet (ex: 1=Livres, 2=Jeux vidéo, 3=Musique...). Détermine les domaines Tako accessibles. Obligatoire à la création, immuable ensuite.
> 
> **`defaultProviders`** : Tableau de noms de providers Tako pré-sélectionnés (ex: `["discogs","deezer"]`). Optionnel. Les providers disponibles dépendent du type choisi.
>
> **Admin uniquement** : Les administrateurs peuvent créer des catégories par défaut en ajoutant `"isDefault": true`. La catégorie sera automatiquement publique et sans `user_id`.

**Response 201:**
```json
{
  "success": true,
  "message": "Catégorie créée",
  "data": {
    "id": 43,
    "name": "Vinyles Jazz",
    "slug": "vinyles-jazz"
  }
}
```

#### PUT /categories/:id
Modifier une catégorie (propriétaire, ou admin pour catégories par défaut).

> **Admin** : Les administrateurs peuvent modifier toutes les catégories par défaut (`isDefault: true`), y compris nom, description, icône, couleur, notes, et le flag `isDefault` lui-même. Ils peuvent aussi promouvoir une catégorie utilisateur en catégorie par défaut (les fichiers médias sont alors transférés vers `/storage/default_categories/`).

**Request:**
```json
{
  "name": "Nouveau nom",
  "description": "Nouvelle description",
  "icon": "🎮",
  "color": "#e74c3c",
  "parentIds": [1, 3]
}
```

#### DELETE /categories/:id
Supprimer une catégorie (propriétaire, ou admin pour catégories par défaut).

#### POST /categories/:id/copy
Copier une catégorie (crée une copie personnelle d'une catégorie, Premium/Admin).

**Request:**
```json
{
  "name": "Ma copie Jeux vidéo",
  "copyMedia": false
}
```

> **Comportement** : Copie le nom (ou celui fourni), description, notes, icône, couleur, et optionnellement les médias. La nouvelle catégorie appartient à l'utilisateur (`isDefault: false`, `isPublic: false`). Le champ `originalCreatorId` est renseigné avec le propriétaire de la catégorie source. La hiérarchie (parents) n'est pas copiée.

**Response 201:**
```json
{
  "success": true,
  "message": "Catégorie copiée",
  "data": {
    "id": 44,
    "name": "Ma copie Jeux vidéo",
    "slug": "ma-copie-jeux-video"
  }
}
```

#### PUT /categories/:id/grades
Associer des grades à une catégorie (propriétaire, ou admin pour défaut).

> **Fonctionnement** : Remplace intégralement la liste des grades associés à la catégorie (via `category_grades`). Les grades associés déterminent les grades proposés dans le formulaire d'item lorsque cette catégorie est sélectionnée.

**Request:**
```json
{
  "gradeIds": [1, 2, 3, 7, 8, 9, 10]
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Grades mis à jour",
  "data": {
    "categoryId": 1,
    "grades": [
      { "id": 1, "name": "Comme neuf" },
      { "id": 2, "name": "Très bon état" },
      { "id": 3, "name": "Bon état" }
    ]
  }
}
```

#### GET /categories/:id/items
Lister les items d'une catégorie.

**Query Params:**
- `sort`: `name` | `createdAt` | `rating` | `value` (default: `createdAt`)
- `order`: `asc` | `desc` (default: `desc`)
- `page`: number (default: 1)
- `limit`: number (default: 50)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1001,
        "name": "The Legend of Zelda: BotW",
        "primaryType": { "key": "video_games", "icon": "🎮" },
        "rating": 5,
        "marketValue": 45.99,
        "thumbnail": "/storage/users/4/items/1001/images/thumb.webp",
        "status": { "id": 1, "name": "Possédé", "color": "#22c55e" },
        "createdAt": "2025-03-15T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 234,
      "pages": 5
    }
  }
}
```

#### POST /categories/import-defaults
Importer la hiérarchie par défaut dans la hiérarchie personnelle de l'utilisateur.

> **Comportement** : Copie toutes les relations de `category_relationships_default` dans `category_relationships` pour l'utilisateur connecté. Les relations existantes ne sont pas dupliquées (INSERT IGNORE / ON CONFLICT DO NOTHING). Accessible aux utilisateurs Premium et Admin.

**Response 200:**
```json
{
  "success": true,
  "message": "Hiérarchie par défaut importée",
  "data": {
    "imported": 5,
    "skipped": 2,
    "total": 7
  }
}
```

#### GET /categories/:id/default-parents
Récupérer les liens par défaut d'une catégorie (admin uniquement).

**Response 200:**
```json
{
  "success": true,
  "data": {
    "categoryId": 1,
    "defaultParentIds": [3, 5]
  }
}
```

#### PUT /categories/:id/default-parents
Gérer les liens par défaut d'une catégorie (admin uniquement).

**Request:**
```json
{
  "parentIds": [3, 5]
}
```

> **Note** : Lors du changement du flag `is_default` sur une catégorie (PUT /categories/:id), les fichiers médias sont automatiquement transférés entre `/storage/users/{userId}/Categories/{catId}/` et `/storage/default_categories/{catId}/`. Les URLs dans `category_images`, `category_videos`, `category_audio`, `category_documents` sont mises à jour en conséquence.

---

### 📦 Items Module ✅ IMPLÉMENTÉ (Sprint 4 - 22/02/2026)

#### GET /items
Lister les items de collection.

**Query Params:**
- `categoryId`: number (optionnel)
- `search`: string (optionnel)
- `minRating`: 1-5 (optionnel)
- `minValue`: number (optionnel)
- `maxValue`: number (optionnel)
- `dateFrom`: ISO date (optionnel)
- `dateTo`: ISO date (optionnel)
- `statusId`: number (optionnel, filtrer par statut)
- `sort`: `name` | `createdAt` | `value` | `rating` | `purchasePrice` | `dateObtained` (default: `createdAt`)
- `order`: `asc` | `desc` (default: `desc`)
- `page`: number (default: 1)
- `limit`: number (default: 50)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1001,
        "name": "The Legend of Zelda: Breath of the Wild",
        "description": "Jeu Switch complet",
        "primaryType": "video_games",
        "rating": 5,
        "value": 45.99,
        "dateObtained": "2023-03-15",
        "thumbnail": "https://cdn.snowshelf.fr/items/1001/thumb.webp",
        "status": {
          "id": 1,
          "name": "Possédé",
          "color": "#22c55e",
          "icon": "check-circle"
        },
        "categories": [
          { "id": 1, "name": "Jeux vidéo", "icon": "🎮" }
        ],
        "metadata": {
          "platform": "Nintendo Switch",
          "publisher": "Nintendo",
          "year": 2017,
          "genre": ["Action", "Adventure"],
          "condition": "Très bon état"
        },
        "createdAt": "2025-03-15T10:00:00Z",
        "updatedAt": "2025-03-15T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 458,
      "pages": 10
    },
    "aggregations": {
      "totalValue": 12450.50,
      "avgRating": 4.2,
      "byCategory": [
        { "categoryId": 1, "count": 234 },
        { "categoryId": 2, "count": 145 }
      ]
    }
  }
}
```

#### GET /items/:id
Détails complets d'un item.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": 1001,
    "name": "The Legend of Zelda: Breath of the Wild",
    "description": "Version physique complète avec la boîte et la cartouche en très bon état.",
    "notes": "Acheté lors de la sortie, fini à 100%",
    "primaryType": {
      "id": 2,
      "key": "video_games",
      "name": "Jeux vidéo",
      "icon": "🎮"
    },
    "rating": 5,
    "purchasePrice": 59.99,
    "marketValue": 45.99,
    "dateObtained": "2017-03-03",
    "statusId": 1,
    "barcode": "045496590116",
    "categories": [
      {
        "id": 1,
        "name": "Jeux vidéo",
        "icon": "🎮",
        "color": "#3498db"
      },
      {
        "id": 15,
        "name": "Nintendo Switch",
        "icon": "🕹️",
        "color": "#e74c3c"
      }
    ],
    "metadata": {
      "platform": { "fieldId": 8, "label": "Plateforme", "value": "Nintendo Switch", "icon": "🎮" },
      "publisher": { "fieldId": 10, "label": "Éditeur", "value": "Nintendo", "icon": "🏢" },
      "developer": { "fieldId": 11, "label": "Développeur", "value": "Nintendo EPD", "icon": "👨‍💻" },
      "year": { "fieldId": 9, "label": "Année", "value": 2017, "icon": "📅" },
      "genre": { "fieldId": 12, "label": "Genre", "value": ["Action", "Adventure", "Open World"], "icon": "🎭" },
      "players": { "fieldId": 13, "label": "Joueurs", "value": "1", "icon": "👥" },
      "multiplayer": { "fieldId": 14, "label": "Multijoueur", "value": false, "icon": "🌐" },
      "completed": { "fieldId": 15, "label": "Terminé", "value": true, "icon": "✅" },
      "playtime": { "fieldId": 16, "label": "Temps de jeu", "value": "150h", "icon": "⏱️" },
      "region": { "fieldId": 17, "label": "Région", "value": "EUR", "icon": "🌍" },
      "condition": { "fieldId": 18, "label": "État", "value": "Comme neuf", "icon": "⭐" }
    },
    "media": {
      "images": [
        {
          "id": 1,
          "url": "https://cdn.snowshelf.fr/items/1001/img_001.webp",
          "thumbnail": "https://cdn.snowshelf.fr/items/1001/img_001_thumb.webp",
          "title": "Boîte recto",
          "order": 0
        },
        {
          "id": 2,
          "url": "https://cdn.snowshelf.fr/items/1001/img_002.webp",
          "thumbnail": "https://cdn.snowshelf.fr/items/1001/img_002_thumb.webp",
          "title": "Boîte verso",
          "order": 1
        }
      ],
      "videos": [],
      "audio": [],
      "documents": [
        {
          "id": 1,
          "url": "https://cdn.snowshelf.fr/items/1001/facture.pdf",
          "title": "Facture d'achat",
          "type": "application/pdf",
          "size": 245678
        }
      ]
    },
    "storage": {
      "id": 5,
      "name": "Étagère salon",
      "location": "Salon - Meuble TV"
    },
    "status": {
      "id": 1,
      "name": "Possédé",
      "color": "#22c55e",
      "icon": "check-circle"
    },
    "grades": [
      { "id": 1, "name": "Comme neuf" },
      { "id": 9, "name": "Complet" }
    ],
    "owner": {
      "id": 123,
      "username": "monuser",
      "avatar": "https://cdn.snowshelf.fr/avatars/123.webp"
    },
    "createdAt": "2017-03-05T18:30:00Z",
    "updatedAt": "2025-06-20T14:22:00Z"
  }
}
```

#### POST /items
Créer un item (Premium uniquement).

**Request (multipart/form-data):**
```
name: string (required)
description: string
primaryTypeId: number (required)
categoryIds: number[] (at least one)
rating: number (1-5)
purchasePrice: number
marketValue: number
dateObtained: date (ISO 8601)
statusId: number
barcode: string
storageLocationId: number
gradeIds: number[] (grades associés, chargés dynamiquement selon catégories)
notes: string
metadata: JSON object
images[]: File[] (max 10, 10MB each)
videos[]: File[] (max 5, 500MB each)
documents[]: File[] (max 10, 50MB each)
```

**Response 201:**
```json
{
  "success": true,
  "message": "Item créé",
  "data": {
    "id": 1002,
    "name": "Super Mario Odyssey",
    "slug": "super-mario-odyssey"
  }
}
```

#### PUT /items/:id
Modifier un item (proprio ou admin).

#### DELETE /items/:id
Supprimer un item (proprio ou admin).

**Response 200:**
```json
{
  "success": true,
  "message": "Item supprimé"
}
```

---

### 🔍 Search Module ✅ IMPLÉMENTÉ (Sprint 6 - 23/02/2026)

> **Architecture** : FULLTEXT MariaDB + Cache Redis + Historique Redis
> - Index FULLTEXT auto-provisionné sur items(name, description)
> - Cache résultats (2 min) + suggestions (30 sec)
> - Historique par utilisateur (max 20, TTL 30 jours)

#### GET /search
Recherche globale (items + catégories).

**Query Params:**
- `q`: string (required, min 2 chars)
- `scope`: string (optionnel, valeurs: `all` | `items` | `categories`, défaut: `all`)
- `page`: number (optionnel, défaut: 1)
- `limit`: number (optionnel, défaut: 20)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "query": "zelda",
    "scope": "all",
    "items": [
      {
        "id": 1,
        "name": "The Legend of Zelda: Breath of the Wild",
        "description": "...",
        "type": "item",
        "primaryType": { "key": "video_games", "name": "Jeux vidéo", "icon": "🎮" },
        "rating": 5,
        "marketValue": 59.99,
        "searchState": "owned",
        "status": { "id": 1, "name": "Possédé", "color": "#22c55e", "icon": "✅" },
        "categories": [{ "id": 1, "name": "Nintendo", "icon": "🎮" }],
        "createdAt": "2026-02-22T10:00:00Z"
      }
    ],
    "categories": [
      {
        "id": 5,
        "name": "Jeux Zelda",
        "description": "...",
        "type": "category",
        "icon": "⚔️",
        "color": "#10b981",
        "itemsCount": 12
      }
    ],
    "itemsTotal": 5,
    "categoriesTotal": 1,
    "pagination": { "page": 1, "limit": 20 }
  }
}
```

#### GET /search/suggestions
Autocomplétion temps réel.

**Query Params:**
- `q`: string (required, min 1 char)
- `limit`: number (optionnel, défaut: 6)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "items": [
      { "id": 1, "name": "The Legend of Zelda: BotW", "icon": "🎮", "type": "item" }
    ],
    "categories": [
      { "id": 5, "name": "Jeux Zelda", "icon": "⚔️", "type": "category" }
    ],
    "history": ["zelda", "final fantasy"]
  }
}
```

#### GET /search/history
Historique de recherche de l'utilisateur (stocké dans Redis).

**Response 200:**
```json
{
  "success": true,
  "data": ["zelda", "mario", "pokemon"]
}
```

#### DELETE /search/history
Effacer tout l'historique de recherche.

**Response 200:**
```json
{
  "success": true,
  "message": "Historique effacé"
}
```

#### DELETE /search/history/entry
Supprimer une entrée spécifique de l'historique.

**Query Params:**
- `q`: string (required) — terme à supprimer

**Response 200:**
```json
{
  "success": true,
  "message": "Entrée supprimée"
}
```

#### GET /items (filtres avancés ajoutés Sprint 6)
Paramètres de filtrage supplémentaires :
- `primaryTypeId`: number — filtrer par type d'objet
- `storageLocationId`: number — filtrer par emplacement
- `statusId`: number — filtrer par statut
- `barcode`: string — correspondance exacte code-barres
- `gradeIds`: string (ex: "1,2,3") — filtrer par grades (OR)
- `minRating`: number — note minimum (1-5)
- `minValue`: number — valeur marchande minimum
- `maxValue`: number — valeur marchande maximum
- `dateFrom`: string (YYYY-MM-DD) — date obtention min
- `dateTo`: string (YYYY-MM-DD) — date obtention max

#### POST /search/web ✅ IMPLÉMENTÉ
Recherche via Tako_Api (32 providers, 11 domaines). Normalise les résultats de tous les providers dans un format unifié.

**Request:**
```json
{
  "query": "Final Fantasy VII Remake",
  "domain": "videogames",
  "providers": ["rawg", "igdb"],
  "maxResults": 10,
  "lang": "fr"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "query": "Final Fantasy VII Remake",
    "domain": "videogames",
    "providers": ["rawg", "igdb"],
    "totalResults": 42,
    "results": [
      {
        "sourceId": "58751",
        "provider": "rawg",
        "type": "game",
        "title": "Final Fantasy VII Remake",
        "subtitle": null,
        "description": "...",
        "year": 2020,
        "imageUrl": "https://media.rawg.io/...",
        "thumbnailUrl": "https://media.rawg.io/...",
        "sourceUrl": null,
        "barcode": null,
        "metadata": {
          "_provider": "rawg",
          "_domain": "videogames",
          "platforms": ["PlayStation 4", "PC"],
          "genres": ["RPG", "Action"],
          "tags": ["Singleplayer", "JRPG"],
          "stores": ["Steam", "PlayStation Store"],
          "metacritic": 87,
          "releaseDate": "2020-04-10"
        }
      }
    ]
  }
}
```

#### GET /search/web/domains ✅ IMPLÉMENTÉ
Liste des domaines Tako_Api disponibles avec leurs providers.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "domains": [
      {
        "name": "construction-toys",
        "displayName": "Jouets de construction",
        "description": "LEGO, Playmobil, Mega",
        "providers": [
          { "name": "lego", "description": "LEGO.com Official" },
          { "name": "rebrickable", "description": "Rebrickable Database" },
          { "name": "brickset", "description": "Brickset Database" },
          { "name": "playmobil", "description": "Playmobil Official" },
          { "name": "klickypedia", "description": "Klickypedia (Playmobil)" },
          { "name": "mega", "description": "Mega Construx / Bloks" }
        ]
      },
      {
        "name": "videogames",
        "displayName": "Jeux video",
        "description": "Jeux video PC, Console",
        "providers": [
          { "name": "rawg", "description": "RAWG Video Games Database" },
          { "name": "igdb", "description": "IGDB (Twitch)" },
          { "name": "jvc", "description": "JeuxVideo.com" },
          { "name": "consolevariations", "description": "Console Variations DB" }
        ]
      },
      {
        "name": "books",
        "displayName": "Livres",
        "description": "Livres et romans",
        "providers": [
          { "name": "googlebooks", "description": "Google Books API" },
          { "name": "openlibrary", "description": "Open Library (archive.org)" }
        ]
      }
    ]
  }
}
```

#### GET /search/web/detail/:domain/:provider/:sourceId ✅ IMPLÉMENTÉ
Récupère le détail d'un item spécifique depuis Tako_Api.

> **Sprint 17** : L'URL de détail est construite avec un segment intermédiaire via `DETAIL_SEGMENTS` (ex: `/api/videogames/rawg/game/kingdom-hearts`). Le paramètre `?autoTrad=true&lang=fr` est ajouté automatiquement (sauf JVC, déjà en français) pour obtenir les descriptions traduites.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "sourceId": "kingdom-hearts",
    "provider": "rawg",
    "type": "game",
    "title": "Kingdom Hearts",
    "description": "Kingdom Hearts est l'histoire de Sora, un garçon de 14 ans...",
    "year": 2002,
    "imageUrl": "https://media.rawg.io/...",
    "metadata": {
      "developers": [{"name": "Square"}],
      "publishers": [{"name": "Sony Computer Entertainment"}, {"name": "Square"}],
      "platforms": [{"name": "PlayStation 2"}],
      "genres": [{"name": "Action"}, {"name": "RPG"}]
    }
  }
}
```

#### GET /search/web/health ✅ IMPLÉMENTÉ
Vérifie la santé de Tako_Api.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "version": "1.0.0",
    "uptime": 74495.25,
    "timestamp": "2026-02-23T00:19:26.153Z"
  }
}
```

#### POST /search/web/proxy-download ✅ IMPLÉMENTÉ
Télécharge une image externe via le backend (proxy pour CORS). Stockage temporaire dans /storage/temp/.

**Request:**
```json
{
  "url": "https://books.google.com/books/content?id=nvijsUyJYR4C&printsec=frontcover&img=1&zoom=1",
  "filename": "harry-potter-cover.jpg"
}
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "filename": "tako_4_1708646400000_abc123.jpg",
    "path": "/storage/temp/tako_4_1708646400000_abc123.jpg",
    "size": 45230,
    "mimeType": "image/jpeg"
  }
}
```

> **Note** : L'endpoint POST /search/web/image (recherche par image OCR) est prévu mais non encore implémenté.

#### GET /items/check-duplicate 🆕 Sprint 15
Vérifie si un item similaire existe déjà dans la collection de l'utilisateur (par barcode ou sourceId Tako).

**Query parameters:**
- `barcode` (string, optionnel) — Code-barre à vérifier
- `sourceId` (string, optionnel) — Identifiant source Tako
- `provider` (string, optionnel) — Provider Tako (en combinaison avec sourceId)

**Response 200:**
```json
{
  "success": true,
  "data": {
    "isDuplicate": true,
    "existingItems": [
      {
        "id": 42,
        "name": "Harry Potter à l'école des Sorciers",
        "barcode": "9781781101032",
        "primaryTypeName": "books",
        "createdAt": "2025-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

**Response 200 (pas de doublon):**
```json
{
  "success": true,
  "data": {
    "isDuplicate": false,
    "existingItems": []
  }
}
```

#### GET /search/web/domain-mapping 🆕 Sprint 15
Retourne le mapping domaine Tako → PrimaryType pour l'auto-sélection du type lors de l'import.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "mappings": {
      "books": "books",
      "videogames": "video_games",
      "music": "music",
      "media": "movies",
      "construction-toys": "toys_construct",
      "collectibles": "toys_fig",
      "boardgames": "board_games",
      "tcg": "trading_cards",
      "comics": "books",
      "anime-manga": "series",
      "ecommerce": "divers"
    },
    "fieldMappings": {
      "books": {
        "authors": "author",
        "pageCount": "pages",
        "isbn13": "isbn",
        "isbn10": "isbn",
        "publishedDate": "year",
        "language": "language",
        "genres": "genre"
      },
      "video_games": {
        "platforms": "platform",
        "genres": "genre",
        "developers": "developer",
        "publishers": "publisher",
        "releaseDate": "year"
      },
      "music": {
        "artists": "artist",
        "artist": "artist",
        "label": "label",
        "format": "format",
        "genre": "genre",
        "tracklist": "tracks"
      },
      "movies": {
        "director": "director",
        "runtime": "duration",
        "genres": "genre"
      },
      "series": {
        "creator": "creator",
        "genres": "genre",
        "seasons": "seasons"
      },
      "toys_construct": {
        "setNum": "set_number",
        "pieces": "pieces",
        "numParts": "pieces",
        "theme": "theme",
        "minifigs": "minifigs"
      },
      "board_games": {
        "minPlayers": "players_min",
        "maxPlayers": "players_max",
        "playingTime": "play_time",
        "categories": "genre",
        "designers": "designer"
      },
      "trading_cards": {
        "rarity": "rarity",
        "setName": "set_name",
        "cardNumber": "card_number"
      },
      "toys_fig": {
        "brand": "brand",
        "series": "series",
        "material": "material"
      }
    }
  }
}
```

> **Note** : Le mapping est aussi utilisé côté frontend pour mapper automatiquement les métadonnées Tako vers les `fieldKey` EAV du PrimaryType correspondant lors de l'import.
```

---

### 🏷️ Statuses Module

Statuts de possession des items (système + personnalisés Premium/Admin).

#### GET /statuses
Liste tous les statuts accessibles (système + personnels de l'utilisateur).

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Possédé",
      "description": "Item en votre possession",
      "color": "#22c55e",
      "icon": "check-circle",
      "ordre": 1,
      "defaut": true
    },
    {
      "id": 2,
      "name": "Recherché",
      "description": "Item que vous recherchez",
      "color": "#f59e0b",
      "icon": "search",
      "ordre": 2,
      "defaut": true
    }
  ]
}
```

#### POST /statuses
Créer un statut personnalisé (Premium/Admin).

**Request:**
```json
{
  "name": "En réparation",
  "description": "Item envoyé en réparation",
  "color": "#f97316",
  "icon": "wrench"
}
```

#### GET /statuses/:id
Récupérer un statut par ID.

#### PUT /statuses/:id
Modifier un statut personnel.

#### DELETE /statuses/:id
Supprimer un statut personnel (les items avec ce statut passent à `status_id = NULL`).

---

### ⭐ Grades Module

États physiques / conditions (système + personnalisés Premium/Admin).

#### GET /grades
Liste tous les grades accessibles (système + personnels).

**Response 200:**
```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "Comme neuf", "description": "État impeccable, sans trace d'usure", "defaut": true },
    { "id": 7, "name": "Boîte manquante", "description": "Item sans sa boîte d'origine", "defaut": true },
    { "id": 12, "name": "Dédicacé", "description": "Item signé par l'auteur", "defaut": false }
  ]
}
```

#### GET /grades/by-categories?categoryIds=1,5,8
Récupère les grades associés à un ensemble de catégories (union via `category_grades`). Utilisé dynamiquement par le formulaire d'item.

**Response 200:**
```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "Comme neuf" },
    { "id": 7, "name": "Boîte manquante" },
    { "id": 8, "name": "Notice manquante" },
    { "id": 9, "name": "Complet" },
    { "id": 10, "name": "Incomplet" }
  ]
}
```

#### POST /grades
Créer un grade personnalisé (Premium/Admin).

#### GET /grades/:id
Récupérer un grade par ID.

#### PUT /grades/:id
Modifier un grade personnel.

#### DELETE /grades/:id
Supprimer un grade personnel (les liaisons `item_grades` sont supprimées en cascade).

---

### 📍 Storage Locations Module

Emplacements physiques de stockage.

#### GET /storage-locations
Liste les emplacements de l'utilisateur connecté.

**Response 200:**
```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "Étagère salon", "description": "Meuble TV, étagère du haut", "items_count": 23 },
    { "id": 2, "name": "Grenier boîte 3", "description": "Carton marron", "items_count": 45 }
  ]
}
```

#### POST /storage-locations
Créer un emplacement.

**Request:**
```json
{
  "name": "Bureau - Tiroir 2",
  "description": "Tiroir du bas"
}
```

#### GET /storage-locations/:id
Récupérer un emplacement par ID.

#### PUT /storage-locations/:id
Modifier un emplacement.

#### DELETE /storage-locations/:id
Supprimer un emplacement (les items passent à `storage_location_id = NULL`).

---

### 🖼️ Item Media Module

Gestion des médias attachés aux items (4 types : images, videos, audio, documents).

#### GET /items/:itemId/media/:mediaType
Liste les médias d'un item par type.

**Params:** `mediaType` = `images` | `videos` | `audio` | `documents`

**Response 200:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "url": "/storage/users/123/items/1001/images/photo_001.webp",
      "thumbnail_url": "/storage/thumbnails/ab/abc123.webp",
      "title": "Boîte recto",
      "display_order": 0
    }
  ]
}
```

#### POST /items/:itemId/media/:mediaType
Upload un ou plusieurs fichiers média pour un item.

**Request (multipart/form-data):**
```
files[]: File[] (required)
titles[]: string[] (optionnel, un par fichier)
```

**Response 201:**
```json
{
  "success": true,
  "data": [
    { "id": 42, "url": "...", "title": "Photo 1", "display_order": 0 }
  ]
}
```

#### PUT /items/:itemId/media/:mediaType/:mediaId
Modifier le titre ou l'ordre d'un média.

**Request:**
```json
{
  "title": "Nouveau titre",
  "display_order": 3
}
```

#### PUT /items/:itemId/media/:mediaType/reorder
Réordonner tous les médias d'un type.

**Request:**
```json
{
  "order": [3, 1, 5, 2, 4]
}
```

#### DELETE /items/:itemId/media/:mediaType/:mediaId
Supprimer un média (fichier + enregistrement BDD).

#### POST /items/:itemId/media/temp
Upload temporaire (mode création d'item, avant que l'item ait un ID).

**Request (multipart/form-data):**
```
file: File (required)
mediaType: 'images' | 'videos' | 'audio' | 'documents'
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "tempId": "tmp_abc123",
    "url": "/storage/temp/tmp_abc123.webp"
  }
}
```

#### POST /items/:itemId/media/finalize-temp
Finaliser les fichiers temporaires après création de l'item.

**Request:**
```json
{
  "tempIds": ["tmp_abc123", "tmp_def456"]
}
```

---

### 🖼️ Category Media Module

Même structure que Item Media, pour les catégories.

#### GET /categories/:categoryId/media/:mediaType
Liste les médias d'une catégorie par type.

#### POST /categories/:categoryId/media/:mediaType
Upload fichiers média pour une catégorie.

#### PUT /categories/:categoryId/media/:mediaType/:mediaId
Modifier un média de catégorie.

#### PUT /categories/:categoryId/media/:mediaType/reorder
Réordonner les médias d'une catégorie.

#### DELETE /categories/:categoryId/media/:mediaType/:mediaId
Supprimer un média de catégorie.

> **Note** : Les chemins de stockage diffèrent selon `is_default` :
> - Catégorie par défaut : `/storage/default_categories/{catId}/{mediaType}/`
> - Catégorie utilisateur : `/storage/users/{userId}/Categories/{catId}/{mediaType}/`

---

### 🖼️ Thumbnails Module

> **Note** : Pas d'endpoint dédié `/thumbnails`. Les thumbnails WebP sont générés
> automatiquement par `ImageProcessingService` lors de l'upload dans les modules
> `ItemMedia` et `CategoryMedia`. Les fichiers thumbnail sont servis par le module `FileServing`.

---

### 📁 File Serving Module ✅ Implémenté

Sert les fichiers statiques stockés dans `storage/`.

#### GET /files/users/:userId/*
Sert un fichier utilisateur (items, catégories).

#### GET /files/default_categories/*
Sert un fichier de catégorie par défaut.

**Response:** Fichier avec headers de cache appropriés.

---

### 📦 Primary Types Module ✅ Implémenté

Types primaires d'items (Book, VideoGame, BoardGame, Movie, etc.). Définissent les métadonnées EAV associées.

#### GET /primary-types
Liste tous les types primaires avec leurs champs de métadonnées.

#### GET /primary-types/field-types ✅ Sprint 16
Liste les types de champs disponibles (text, textarea, number, year, date, select, multiselect, url, rating, duration, boolean).

**Response 200:**
```json
{
  "success": true,
  "data": [
    { "value": "text", "label": "Texte court" },
    { "value": "select", "label": "Liste déroulante" }
  ]
}
```

#### GET /primary-types/:id
Récupérer un type primaire par ID avec ses champs.

#### GET /primary-types/key/:keyName
Récupérer les champs d'un type par sa clé (utilisé par le formulaire d'item).

---

#### Admin CRUD — Champs par type ✅ Sprint 16

> Routes protégées `@Roles('admin')`.

#### GET /primary-types/:id/admin-fields
Liste complète des champs d'un type (données brutes, toutes colonnes).

**Response 200:**
```json
{
  "success": true,
  "data": {
    "type": { "id": 1, "key": "books", "nameFr": "Livres", "nameEn": "Books", "icon": "📚" },
    "fields": [
      {
        "id": 1,
        "primaryTypeId": 1,
        "fieldKey": "author",
        "fieldNameFr": "Auteur",
        "fieldNameEn": "Author",
        "fieldType": "text",
        "fieldOptions": null,
        "placeholderFr": null,
        "placeholderEn": null,
        "helpTextFr": null,
        "helpTextEn": null,
        "icon": "✍️",
        "isRequired": true,
        "isSearchable": true,
        "isFilterable": true,
        "sortOrder": 1,
        "createdAt": "2026-02-22T03:40:06.038Z",
        "updatedAt": "2026-02-22T03:40:06.038Z"
      }
    ]
  }
}
```

#### GET /primary-types/fields/:fieldId/admin
Détails d'un champ unique.

#### POST /primary-types/fields
Créer un nouveau champ.

**Request:**
```json
{
  "primaryTypeId": 1,
  "fieldKey": "isbn",
  "fieldNameFr": "ISBN",
  "fieldNameEn": "ISBN",
  "fieldType": "text",
  "fieldOptions": null,
  "icon": "🔢",
  "isRequired": false,
  "isSearchable": true,
  "isFilterable": true
}
```

#### PUT /primary-types/fields/:fieldId
Modifier un champ existant (tous les champs optionnels).

#### DELETE /primary-types/fields/:fieldId
Supprimer un champ (et ses métadonnées associées dans les items).

#### PUT /primary-types/:id/reorder-fields
Réordonner les champs d'un type.

**Request:**
```json
{
  "fields": [
    { "id": 1, "sortOrder": 1 },
    { "id": 3, "sortOrder": 2 },
    { "id": 2, "sortOrder": 3 }
  ]
}
```

---

### 🔍 Proxy Downloads Module ✅ Implémenté

> **Note** : Le proxy download est disponible via **POST /search/web/proxy-download** dans le TakoModule.
> Voir la section "Search Module" ci-dessus pour la documentation complète de cet endpoint.
```

---

### ✏️ Image Processing Module ✅ Implémenté

Traitement d'images côté serveur via **Sharp 0.34.5**. Principalement utilisé comme fallback ; le traitement principal se fait côté client (Canvas 2D natif dans `ImageEditor`).

#### POST /media/image-temp
Stocke temporairement une image pour édition (sortie de l'ImageEditor client ou capture caméra).

**Request (multipart/form-data):**
```
image: File (required) — image JPEG, PNG, WebP ou GIF (max 50 MB)
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "tempPath": "/app/storage/temp/temp_4_1708560000_a3f2b1c8d9e0f1a2.jpg",
    "url": "/storage/temp/temp_4_1708560000_a3f2b1c8d9e0f1a2.jpg",
    "metadata": {
      "width": 1920,
      "height": 1080,
      "format": "jpeg",
      "size": 345678
    }
  }
}
```

> **Sécurité** : Validation MIME via Sharp metadata (pas de sniffing extension). Nommage `temp_{userId}_{timestamp}_{random16hex}.{ext}`. Nettoyage automatique fichiers > 1h via `setInterval` (30 min). Accès restreint : `filename.startsWith('temp_' + userId + '_')`.

#### POST /media/image-process
Traitement d'image côté serveur : crop, rotate, flip, brightness/contrast/saturation, resize, format conversion.

Accepte soit un fichier direct (`image` multipart), soit un `tempUrl` renvoyé par `/media/image-temp`.

**Request (multipart/form-data ou body mixte):**
```
image: File (optionnel) — si traitement direct sans passer par temp
tempUrl: string (optionnel) — URL d'une image temporaire existante
rotate: number (0, 90, 180, 270)
flipH: boolean
flipV: boolean
crop: JSON string — {"x": 100, "y": 50, "width": 800, "height": 600}
brightness: number (-100 à +100)
contrast: number (-100 à +100)
saturation: number (-100 à +100)
format: "jpeg" | "png" | "webp" (défaut: jpeg)
quality: number (1-100, défaut: 92)
maxWidth: number (défaut: 5000)
maxHeight: number (défaut: 5000)
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "url": "/storage/temp/temp_4_1708560123_d4e5f6a7b8c9d0e1.webp",
    "metadata": {
      "width": 1200,
      "height": 900,
      "format": "webp",
      "size": 189432
    }
  }
}
```

> **Pipeline Sharp** : rotate → flip/flop → extract (crop) → modulate (brightness/saturation) → linear (contrast) → resize (fit:inside, withoutEnlargement) → format output (mozjpeg, png compressionLevel:6, webp). Resize limité à 5000px max, sans agrandissement.

---

### 📤 Media Module (legacy — NON IMPLÉMENTÉ)

> **Note** : Ce module legacy n'existe pas dans le code actuel.
> Les médias sont gérés via les modules **ItemMedia** et **CategoryMedia** dédiés ci-dessus.
> Il n'y a pas de CDN (`cdn.snowshelf.fr`), les fichiers sont servis localement via `FileServing`.

---

### ⚙️ Admin Module

#### GET /admin/users
Liste utilisateurs (admin uniquement).

**Query Params:**
- `search`: string
- `role`: `free` | `premium` | `admin`
- `page`: number
- `limit`: number

**Response 200:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": 123,
        "username": "monuser",
        "email": "user@example.com",
        "role": "premium",
        "emailVerified": true,
        "itemsCount": 458,
        "categoriesCount": 12,
        "lastLogin": "2026-02-19T18:45:00Z",
        "createdAt": "2025-01-15T10:30:00Z"
      }
    ],
    "pagination": { /* ... */ }
  }
}
```

#### PUT /admin/users/:id/role
Modifier le rôle d'un utilisateur.

**Request:**
```json
{
  "role": "premium",
  "premiumUntil": "2027-02-20"
}
```

#### GET /admin/stats
Statistiques globales.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "users": {
      "total": 1523,
      "free": 1245,
      "premium": 265,
      "admin": 13,
      "newThisMonth": 42
    },
    "items": {
      "total": 145678,
      "byType": {
        "video_games": 45234,
        "books": 32145,
        "music": 18932
      }
    },
    "storage": {
      "totalSize": "245.6 GB",
      "images": "180.2 GB",
      "videos": "45.8 GB",
      "documents": "19.6 GB"
    }
  }
}
```

---

## � Notifications Module

### Endpoints

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/notifications` | Liste paginée des notifications |
| `GET` | `/notifications/unread-count` | Nombre de notifications non lues |
| `PUT` | `/notifications/:id/read` | Marquer une notification comme lue |
| `PUT` | `/notifications/read-all` | Marquer toutes comme lues |
| `DELETE` | `/notifications/:id` | Supprimer une notification |

### `GET /notifications`

Récupère la liste des notifications de l'utilisateur connecté.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page courante |
| `limit` | number | 20 | Notifications par page |

**Response 200:**
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": 1,
        "type": "system",
        "title": "Bienvenue sur SnowShelf !",
        "message": "Votre compte a été créé avec succès.",
        "isRead": false,
        "createdAt": "2026-02-23T10:00:00Z"
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 5, "pages": 1 }
  }
}
```

### `GET /notifications/unread-count`

**Response 200:**
```json
{
  "success": true,
  "data": { "count": 3 }
}
```

---

## 📲 Push Notifications Module

### Endpoints

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| `GET` | `/notifications/push/vapid-key` | Clé publique VAPID |
| `POST` | `/notifications/push/subscribe` | Enregistrer une souscription push |
| `POST` | `/notifications/push/unsubscribe` | Supprimer une souscription push |
| `GET` | `/notifications/push/status` | Statut des souscriptions push |

### `GET /notifications/push/vapid-key`

Retourne la clé publique VAPID pour l'inscription push côté client.

**Response 200:**
```json
{
  "success": true,
  "data": { "publicKey": "BCENATwS0xZxvfrcDiPfRz..." }
}
```

### `POST /notifications/push/subscribe`

Enregistre ou met à jour une souscription Web Push. Déduplique via hash SHA256 de l'endpoint.

**Request Body:**
```json
{
  "subscription": {
    "endpoint": "https://fcm.googleapis.com/fcm/send/...",
    "keys": {
      "p256dh": "BNcRd...",
      "auth": "tBHI..."
    }
  }
}
```

**Response 201:**
```json
{
  "success": true,
  "data": { "id": 42, "message": "Push subscription registered" }
}
```

### `POST /notifications/push/unsubscribe`

Désactive une souscription push existante.

**Request Body:**
```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/..."
}
```

**Response 200:**
```json
{
  "success": true,
  "data": { "message": "Push subscription removed" }
}
```

### `GET /notifications/push/status`

**Response 200:**
```json
{
  "success": true,
  "data": { "subscriptionCount": 2, "pushEnabled": true }
}
```

---

## �📊 Codes de Statut HTTP

| Code | Signification |
|------|---------------|
| 200 | OK - Succès |
| 201 | Created - Ressource créée |
| 204 | No Content - Succès sans contenu |
| 400 | Bad Request - Données invalides |
| 401 | Unauthorized - Non authentifié |
| 403 | Forbidden - Pas les permissions |
| 404 | Not Found - Ressource introuvable |
| 409 | Conflict - Conflit (ex: email existe déjà) |
| 422 | Unprocessable Entity - Validation échouée |
| 429 | Too Many Requests - Rate limit dépassé |
| 500 | Internal Server Error - Erreur serveur |
| 503 | Service Unavailable - Service indisponible |

---

## ⚠️ Format des Erreurs

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Les données fournies sont invalides",
    "details": [
      {
        "field": "email",
        "message": "Format d'email invalide"
      },
      {
        "field": "password",
        "message": "Le mot de passe doit contenir au moins 8 caractères"
      }
    ]
  },
  "timestamp": "2026-02-20T10:30:00Z",
  "path": "/auth/register"
}
```

### Codes d'Erreur

| Code | Description |
|------|-------------|
| `VALIDATION_ERROR` | Données invalides |
| `AUTH_INVALID_CREDENTIALS` | Email ou mot de passe incorrect |
| `AUTH_TOKEN_EXPIRED` | Token JWT expiré |
| `AUTH_TOKEN_INVALID` | Token JWT invalide |
| `AUTH_INSUFFICIENT_PERMISSIONS` | Permissions insuffisantes |
| `RESOURCE_NOT_FOUND` | Ressource introuvable |
| `RESOURCE_ALREADY_EXISTS` | Ressource existe déjà |
| `UPLOAD_FILE_TOO_LARGE` | Fichier trop volumineux |
| `UPLOAD_UNSUPPORTED_FORMAT` | Format non supporté |
| `UPLOAD_SECURITY_VIOLATION` | Fichier potentiellement dangereux détecté |
| `RATE_LIMIT_EXCEEDED` | Trop de requêtes |
| `INTERNAL_SERVER_ERROR` | Erreur serveur |

---

## 🔄 Pagination

Toutes les listes utilisent la même structure de pagination :

**Request:**
```
GET /items?page=2&limit=50
```

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [ /* ... */ ],
    "pagination": {
      "page": 2,
      "limit": 50,
      "total": 458,
      "pages": 10,
      "hasNext": true,
      "hasPrev": true,
      "nextPage": 3,
      "prevPage": 1
    }
  }
}
```

---

## 🔀 Rate Limiting

| Endpoint | Limite |
|----------|--------|
| `/auth/login` | 5 req/min |
| `/auth/register` | 3 req/hour |
| `/search/web` | Free: 10 req/hour, Premium: 100 req/hour |
| Autres endpoints | 100 req/min |

**Headers de réponse:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1708426200
```

---

## 🌐 Versioning

L'API utilise un versioning par URL : `/api/v1/`

**Migration v1 → v2:**
- Breaking changes documentés
- v1 maintenue 6 mois après release v2
- Header `Deprecation` sur endpoints obsolètes

---

## 📝 Webhooks (Future)

```json
{
  "event": "item.created",
  "timestamp": "2026-02-20T10:30:00Z",
  "data": {
    "itemId": 1002,
    "userId": 123,
    "name": "Super Mario Odyssey"
  }
}
```

**Events disponibles:**
- `item.created`
- `item.updated`
- `item.deleted`
- `user.upgraded_to_premium`

---

## 👑 Module Admin (Sprint 11)

> Toutes les routes de ce module sont protégées par `@Roles(UserRole.ADMIN)`.  
> Seuls les utilisateurs avec `role = 'admin'` y ont accès.

### Dashboard

#### GET `/admin/dashboard`

Statistiques globales pour le panneau d'administration.

**Réponse (200) :**
```json
{
  "users": {
    "total": 42,
    "free": 35,
    "premium": 6,
    "admin": 1,
    "newThisMonth": 8
  },
  "items": {
    "total": 1250,
    "byType": [
      { "name": "Jeu Vidéo", "icon": "🎮", "count": 450 },
      { "name": "Livre", "icon": "📚", "count": 320 }
    ],
    "totalValue": 15680.50
  },
  "categories": {
    "total": 85
  },
  "trends": {
    "registrations": [
      { "date": "2026-02-01", "count": 3 }
    ],
    "items": [
      { "date": "2026-02-01", "count": 12 }
    ]
  }
}
```

#### GET `/admin/activity`

Activité récente (derniers items + derniers utilisateurs).

| Query param | Type   | Défaut | Description          |
|-------------|--------|--------|----------------------|
| `limit`     | number | 20     | Nombre d'éléments    |

**Réponse (200) :**
```json
{
  "recentItems": [
    {
      "id": 42,
      "name": "Super Mario Odyssey",
      "createdAt": "2026-02-24T10:00:00Z",
      "user": { "id": 1, "username": "admin", "avatarUrl": null }
    }
  ],
  "recentUsers": [
    {
      "id": 5,
      "username": "john",
      "email": "john@example.com",
      "avatarUrl": null,
      "createdAt": "2026-02-23T14:30:00Z"
    }
  ]
}
```

### Gestion des utilisateurs

#### GET `/admin/users`

Liste paginée des utilisateurs avec filtres.

| Query param | Type   | Défaut    | Description                     |
|-------------|--------|-----------|---------------------------------|
| `page`      | number | 1         | Page courante                   |
| `limit`     | number | 20        | Éléments par page               |
| `search`    | string | -         | Recherche par username ou email |
| `role`      | string | -         | Filtre par rôle (free/premium/admin) |
| `sort`      | string | createdAt | Tri (createdAt, username, itemsCount) |
| `order`     | string | DESC      | Ordre (ASC, DESC)               |

**Réponse (200) :**
```json
{
  "users": [
    {
      "id": 1,
      "username": "admin",
      "email": "admin@snowshelf.fr",
      "role": "admin",
      "emailVerified": true,
      "itemsCount": 25,
      "categoriesCount": 8,
      "totalValue": 1250.00,
      "lastLoginAt": "2026-02-24T10:00:00Z",
      "createdAt": "2026-02-01T00:00:00Z",
      "avatarUrl": null
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "pages": 3
  }
}
```

#### PUT `/admin/users/:id/role`

Changer le rôle d'un utilisateur. L'admin ne peut pas changer son propre rôle.

**Body :**
```json
{
  "role": "premium"
}
```

**Réponse (200) :**
```json
{
  "id": 5,
  "username": "john",
  "role": "premium"
}
```

**Erreurs :**
- `403` — Cannot change your own role
- `404` — User not found

#### DELETE `/admin/users/:id`

Supprimer un compte utilisateur. L'admin ne peut pas supprimer son propre compte ni un autre admin.

**Réponse (200) :**
```json
{
  "deleted": true,
  "username": "john"
}
```

**Erreurs :**
- `403` — Cannot delete your own account / Cannot delete an admin user
- `404` — User not found

### Notifications système

#### POST `/admin/notifications/broadcast`

Envoyer une notification système à tous les utilisateurs.

**Body :**
```json
{
  "title": "Maintenance prévue",
  "message": "Le service sera indisponible le 25 février de 02h à 04h."
}
```

**Réponse (200) :**
```json
{
  "sent": 42
}
```

---

**Cette spécification sert de contrat API entre frontend, mobile et backend.**

---

### 👫 Friends Module

> Tous les endpoints nécessitent authentification JWT.

#### GET `/friends`

Liste des amis de l’utilisateur connecté (paginée).

**Query** : `?page=1&limit=50`

**Réponse (200) :**
```json
{
  "success": true,
  "data": {
    "friends": [
      {
        "friendshipId": 1,
        "id": 2,
        "username": "john",
        "avatarUrl": null,
        "bio": "Collectionneur",
        "itemsCount": 42,
        "collectionsVisibility": "public",
        "since": "2026-03-20T10:00:00.000Z"
      }
    ],
    "pagination": { "page": 1, "limit": 50, "total": 1, "pages": 1 }
  }
}
```

---

#### GET `/friends/requests/received`

Demandes d’ami reçues en attente.

**Réponse (200) :**
```json
{
  "success": true,
  "data": [
    {
      "friendshipId": 5,
      "id": 3,
      "username": "alice",
      "avatarUrl": null,
      "bio": null,
      "sentAt": "2026-03-20T09:00:00.000Z"
    }
  ]
}
```

---

#### GET `/friends/requests/sent`

Demandes d’ami envoyées en attente. Même format que received.

---

#### GET `/friends/pending-count`

Nombre de demandes reçues en attente (pour badge).

**Réponse (200) :**
```json
{ "success": true, "data": { "count": 3 } }
```

---

#### GET `/friends/status/:userId`

Statut de la relation avec un utilisateur cible.

**Réponse (200) :**
```json
{
  "success": true,
  "data": {
    "status": "none",
    "friendshipId": null
  }
}
```

Valeurs possibles de `status` : `self`, `none`, `friends`, `request_sent`, `request_received`, `blocked_by_you`, `blocked`.

---

#### POST `/friends/request/:userId`

Envoyer une demande d’ami par ID utilisateur.

**Réponse (200) :**
```json
{ "success": true, "data": { "status": "pending" } }
```

---

#### POST `/friends/request-by-email`

Envoyer une demande d’ami par email. Message générique protégeant la vie privée (anti-énumération).

**Body :**
```json
{ "email": "ami@example.com" }
```

**Réponse (200) :**
```json
{ "success": true, "data": { "result": "sent", "username": "john" } }
```

Valeurs possibles de `result` : `sent`, `accepted`, `already_friends`, `already_sent`, `not_found` (email inconnu OU refuse les demandes — même message).

---

#### POST `/friends/accept/:friendshipId`

Accepter une demande (seul l’addressee peut accepter).

---

#### POST `/friends/decline/:friendshipId`

Refuser une demande (seul l’addressee peut refuser).

---

#### POST `/friends/block/:userId`

Bloquer un utilisateur.

---

#### DELETE `/friends/:friendshipId`

Retirer un ami, annuler une demande, ou débloquer.
