# Sprint 20 — Ajout par Scan / Image

> **Date** : 17 mars 2026  
> **Statut** : ✅ Phase 1 implémentée  
> **Priorité** : Haute — Dernière fonctionnalité majeure

---

## Objectif

Permettre l'ajout d'items via :
1. **Scan de code-barres / ISBN** (caméra temps réel) → recherche Tako par barcode
2. **Extraction du nom** depuis barcode → recherche Tako textuelle
3. **OCR depuis photo** → extraction de texte → recherche Tako
4. *(Phase 2)* Recherche par image similaire type Google Lens

---

## Étude de faisabilité

### 1. Scan barcode — Excellente faisabilité (100% gratuit)

**Techno retenue : `barcode-detector`** (MIT, basé sur ZXing-WASM)

| Critère | Détail |
|---------|--------|
| Formats | EAN-13, EAN-8, UPC-A/E, ISBN, Code 128, QR Code (40+ formats) |
| iOS Safari | Oui (via WASM fallback) |
| Android Chrome | Oui (API native BarcodeDetector + fallback WASM) |
| Bundle | 13.8 kB JS + ~966 kB WASM (lazy-loadable, cachable par SW) |
| Composant React | `@yudiel/react-qr-scanner` (MIT, wrapper React) |

**Endpoints Tako barcode existants :**

| Domaine | Provider | Endpoint |
|---------|----------|----------|
| music | Discogs | `GET /api/music/discogs/barcode/:barcode` |
| music | MusicBrainz | `GET /api/music/musicbrainz/barcode/:barcode` |
| books | Google Books | `GET /api/books/googlebooks/search?q=isbn:{isbn}` |
| books | Open Library | `GET /api/books/openlibrary/search?q=isbn:{isbn}` |
| ecommerce | Amazon | `GET /api/ecommerce/amazon/product/:asin` |

### 2. OCR depuis photo — Bonne faisabilité (100% gratuit, client-side)

**Techno retenue Phase 1 : `Tesseract.js` v5** (Apache 2.0, WASM, client-side)

| Critère | Détail |
|---------|--------|
| Bundle | ~2-4 MB (core) + 4-12 MB données langue |
| Vitesse mobile | 2-8 sec selon complexité |
| Précision | Bonne sur texte imprimé net, moyenne sur texte stylisé |
| GPU | Non requis (WASM dans le navigateur) |
| Fallback Phase 2 | PaddleOCR (Docker self-hosted, meilleure précision) |

### 3. Recherche par image (Google Lens-like) — Phase 2

**Pas de solution gratuite et self-hosted viable.**

Options envisagées pour Phase 2 :
- **SerpAPI Google Lens** : 250 req/mois gratuit, excellente précision
- **Bing Visual Search** : 1000 req/mois gratuit, bonne précision  
- **PaddleOCR** (Docker) : OCR avancé self-hosted si Tesseract.js insuffisant
- **CLIP** : non réaliste sans GPU et sans index d'images

### Solutions écartées

| Solution | Raison |
|----------|--------|
| html5-qrcode | Abandonné (dernière publication il y a 3 ans) |
| EasyOCR | Trop lent sur CPU (10-30s), supplanté par PaddleOCR |
| Dynamsoft | Payant (~$1000+/an) |
| CLIP self-hosted | Nécessite GPU + index de millions d'images |
| Algolia Visual | Payant, premium uniquement |

---

## Architecture Phase 1

### Flux utilisateur

```
┌─────────── Page Collection ───────────┐
│                                       │
│  [+ Ajouter]  [📷 Scanner]           │
│                                       │
└───────────────┬───────────────────────┘
                │
        ┌───────▼────────┐
        │  ScanAddModal  │
        │                │
        │  ┌──────────┐  │
        │  │ Onglet 1 │  │  Scan barcode (caméra live)
        │  │  SCAN    │  │  → détection auto → Tako barcode lookup
        │  └──────────┘  │
        │  ┌──────────┐  │
        │  │ Onglet 2 │  │  Capture photo → OCR → texte extrait
        │  │  PHOTO   │  │  → choix domaine → Tako search
        │  └──────────┘  │
        │                │
        │  ┌──────────┐  │
        │  │ Résultats│  │  Liste résultats Tako (même UI que TakoSearchModal)
        │  │          │  │  → sélection → import item
        │  └──────────┘  │
        └────────────────┘
```

### Composants techniques

```
Frontend (React)
├── components/
│   └── media/
│       └── ScanAddModal.tsx        ← Modal principal (onglets Scan/Photo)
│           ├── BarcodeScanner.tsx   ← Caméra live + détection barcode
│           └── PhotoOCR.tsx         ← Capture photo + OCR Tesseract.js
│
├── hooks/
│   └── useBarcodeScanner.ts        ← Hook scan barcode (optionnel)
│
├── services/
│   └── scan.service.ts             ← Appels API barcode lookup
│
Backend (NestJS)
├── modules/tako/
│   ├── tako.controller.ts          ← POST /search/web/barcode (nouveau)
│   ├── tako.service.ts             ← lookupBarcode() (nouveau)
│   └── dto/tako.dto.ts             ← TakoBarcodeLookupDto (nouveau)
```

### Dépendances à installer

```bash
# Frontend
npm install @yudiel/react-qr-scanner   # Scanner barcode React
npm install tesseract.js                # OCR client-side WASM
```

### Backend — Nouvel endpoint

```
POST /api/v1/search/web/barcode
Body: { "barcode": "9782123456789", "domain?": "books" }
Response: { success, data: TakoSearchResult[] }
```

Logique :
1. Détecter le type de barcode (ISBN-13 → books, EAN-13 → multi-domaine)
2. Si `domain` fourni → chercher uniquement dans ce domaine
3. Sinon → chercher dans tous les providers qui supportent le barcode
4. Agréger les résultats et retourner

---

## Phase 2 (futures améliorations)

- [ ] PaddleOCR comme service Docker si Tesseract.js insuffisant
- [ ] SerpAPI / Bing Visual Search comme option "recherche avancée"
- [ ] Classification automatique du domaine via Google Cloud Vision
- [ ] Scan en mode batch (scanner plusieurs items à la suite)
- [ ] Historique des scans récents

---

## Avancement

- [x] Étude de faisabilité complète
- [x] Choix des technologies
- [x] Architecture définie
- [x] Backend : endpoint barcode lookup
- [x] Frontend : composant BarcodeScanner
- [x] Frontend : composant PhotoOCR  
- [x] Frontend : ScanAddModal (intégration)
- [x] Intégration page collection
- [x] Traductions i18n
- [x] Tests et validation
