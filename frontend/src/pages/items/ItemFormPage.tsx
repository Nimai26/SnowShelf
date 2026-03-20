import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Star, Save, ClipboardList, Settings2, ImageIcon, Globe, ExternalLink as ExternalLinkIcon, Plus, Trash2, ScanLine } from 'lucide-react';
import toast from 'react-hot-toast';
import { itemService } from '../../services/item.service';
import { categoryService, primaryTypeService } from '../../services/category.service';
import { statusService, type Status } from '../../services/status.service';
import { gradeService, type Grade } from '../../services/grade.service';
import { storageLocationService, type StorageLocation } from '../../services/storage-location.service';
import { takoService } from '../../services/tako.service';
import { Button, Card, Input, Spinner, Tabs } from '../../components/ui';
import { MediaListManager } from '../../components/media/MediaListManager';
import type { CreateItemPayload, UpdateItemPayload, ExternalLink } from '../../types/item.types';
import type { Category, PrimaryType, PrimaryTypeField } from '../../types/category.types';
import { getMediaUrl, getApiBaseUrl } from '../../utils/url';
import { CategorySelector } from '../../components/common/CategorySelector';
import { TakoSearchModal, type TakoDownloadedMedia } from '../../components/common/TakoSearchModal';
import { ScanAddModal } from '../../components/common/ScanAddModal';
import { TakoImportPreview, type ImportFieldPreview } from '../../components/common/TakoImportPreview';
import type { TakoSearchResult } from '../../types/tako.types';
import { StickerChecklist, type ChecklistData } from '../../components/common/StickerChecklist';

export default function ItemFormPage() {
  const { t } = useTranslation('items');
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [primaryTypes, setPrimaryTypes] = useState<PrimaryType[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [fields, setFields] = useState<PrimaryTypeField[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [storageLocations, setStorageLocations] = useState<StorageLocation[]>([]);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [primaryTypeId, setPrimaryTypeId] = useState<number | ''>('');
  const [categoryIds, setCategoryIds] = useState<number[]>([]);
  const [rating, setRating] = useState<number>(0);
  const [purchasePrice, setPurchasePrice] = useState('');
  const [marketValue, setMarketValue] = useState('');
  const [dateObtained, setDateObtained] = useState('');
  const [searchState, setSearchState] = useState<'owned' | 'looking' | ''>('');
  const [barcode, setBarcode] = useState('');
  const [notes, setNotes] = useState('');
  const [statusId, setStatusId] = useState<number | ''>('');
  const [gradeIds, setGradeIds] = useState<number[]>([]);
  const [storageLocationId, setStorageLocationId] = useState<number | ''>('');
  const [metadata, setMetadata] = useState<Record<string, any>>({});
  const [categoryFields, setCategoryFields] = useState<PrimaryTypeField[]>([]);
  const [categoryMetadata, setCategoryMetadata] = useState<Record<string, any>>({});
  const [externalLinks, setExternalLinks] = useState<ExternalLink[]>([]);
  const [activeTab, setActiveTab] = useState('general');
  const [showTakoSearch, setShowTakoSearch] = useState(false);
  const [takoKeepResults, setTakoKeepResults] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scanInitialQuery, setScanInitialQuery] = useState('');
  const [pendingMedia, setPendingMedia] = useState<TakoDownloadedMedia | null>(null);
  const [domainMapping, setDomainMapping] = useState<Record<string, string>>({});
  const [fieldMappings, setFieldMappings] = useState<Record<string, Record<string, string>>>({});
  const [categoryFieldMappings, setCategoryFieldMappings] = useState<Record<string, Record<string, string>>>({});
  const [primaryTypeToDomains, setPrimaryTypeToDomains] = useState<Record<string, string[]>>({});
  const [pendingImport, setPendingImport] = useState<{
    fields: ImportFieldPreview[];
    values: Record<string, any>;
    computedPrimaryTypeId?: number;
    computedMetadata: Record<string, any>;
    computedCategoryMetadata: Record<string, any>;
    computedExternalLinks: ExternalLink[];
    media: TakoDownloadedMedia;
    coverUrl?: string;
  } | null>(null);

  const formTabs = [
    { id: 'general', label: t('manage:tabs.general', 'Général'), icon: <ClipboardList className="h-4 w-4" /> },
    { id: 'details', label: t('manage:tabs.details', 'Détails'), icon: <Settings2 className="h-4 w-4" /> },
    { id: 'media', label: t('manage:tabs.media', 'Médias'), icon: <ImageIcon className="h-4 w-4" /> },
  ];

  // Load primary types, categories, statuses, grades, storage locations
  useEffect(() => {
    Promise.all([
      primaryTypeService.getAll(),
      categoryService.getCategories({ filter: 'all', limit: 500 }),
      statusService.getAll(),
      gradeService.getAll(),
      storageLocationService.getAll(),
      takoService.getDomainMapping().catch(() => ({ data: { mappings: {}, fieldMappings: {}, categoryFieldMappings: {}, primaryTypeToDomains: {} } })),
    ]).then(([ptRes, catRes, statusRes, gradeRes, locRes, mappingRes]) => {
      setPrimaryTypes(ptRes.data || []);
      setCategories(catRes.data.categories || []);
      setStatuses(statusRes.data || []);
      setGrades(gradeRes.data || []);
      setStorageLocations(locRes.data || []);
      setDomainMapping(mappingRes.data?.mappings || {});
      setFieldMappings(mappingRes.data?.fieldMappings || {});
      setCategoryFieldMappings(mappingRes.data?.categoryFieldMappings || {});
      setPrimaryTypeToDomains(mappingRes.data?.primaryTypeToDomains || {});
    });
  }, []);

  // Load fields when primary type changes
  useEffect(() => {
    if (!primaryTypeId) {
      setFields([]);
      return;
    }
    const pt = primaryTypes.find((p) => p.id === primaryTypeId);
    if (pt) {
      primaryTypeService.getFieldsByKey(pt.key).then((res) => {
        // getFieldsByKey returns data as array directly, getById returns data.fields
        const f = Array.isArray(res.data) ? res.data : (res.data?.fields || []);
        setFields(f);
      });
    }
  }, [primaryTypeId, primaryTypes]);

  // Load category-level fields when selected categories change
  useEffect(() => {
    if (categoryIds.length === 0) {
      setCategoryFields([]);
      return;
    }
    // Fetch fields for all selected categories, merge deduplicated by key
    Promise.all(
      categoryIds.map((catId) =>
        categoryService.getCategoryFields(catId).catch(() => ({ data: [] as PrimaryTypeField[] })),
      ),
    ).then((results) => {
      const seen = new Set<string>();
      const merged: PrimaryTypeField[] = [];
      for (const res of results) {
        for (const f of res.data || []) {
          if (!seen.has(f.key)) {
            seen.add(f.key);
            merged.push(f);
          }
        }
      }
      merged.sort((a, b) => a.sortOrder - b.sortOrder);
      setCategoryFields(merged);
    });
  }, [categoryIds]);

  // Load existing item for edit
  useEffect(() => {
    if (!isEdit || !id) return;
    setLoading(true);
    itemService
      .getItemById(Number(id))
      .then((res) => {
        const item = res.data;
        setName(item.name);
        setDescription(item.description || '');
        setPrimaryTypeId(item.primaryType?.id || '');
        setCategoryIds(item.categories.map((c) => c.id));
        setRating(item.rating || 0);
        setPurchasePrice(item.purchasePrice?.toString() || '');
        setMarketValue(item.marketValue?.toString() || '');
        setDateObtained(item.dateObtained || '');
        setSearchState(item.searchState || '');
        setBarcode(item.barcode || '');
        setNotes(item.notes || '');
        setStatusId(item.status?.id || '');
        setGradeIds(item.grades?.map(g => g.id) || []);
        setStorageLocationId(item.storageLocation?.id || '');
        setExternalLinks(item.externalLinks || []);
        // Extract metadata values
        const meta: Record<string, any> = {};
        for (const [key, val] of Object.entries(item.metadata || {})) {
          meta[key] = val.value;
        }
        setMetadata(meta);
        // Extract category metadata values
        const catMeta: Record<string, any> = {};
        for (const [key, val] of Object.entries(item.categoryMetadata || {})) {
          catMeta[key] = val.value;
        }
        setCategoryMetadata(catMeta);
      })
      .catch(() => {
        toast.error(t('errors.notFound'));
        navigate('/items');
      })
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleMetadataChange = (key: string, value: any) => {
    setMetadata((prev) => ({ ...prev, [key]: value }));
  };

  const handleCategoryMetadataChange = (key: string, value: any) => {
    setCategoryMetadata((prev) => ({ ...prev, [key]: value }));
  };

  const toggleGrade = (gId: number) => {
    setGradeIds((prev) =>
      prev.includes(gId)
        ? prev.filter((id) => id !== gId)
        : [...prev, gId],
    );
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // prepareTakoImport — Calcule les changements et affiche le panneau de preview
  // ══════════════════════════════════════════════════════════════════════════════
  const prepareTakoImport = useCallback(async (result: TakoSearchResult, media: TakoDownloadedMedia) => {
    const meta = result.metadata || {};
    const domain = meta._domain as string;

    // ── 1. Vérification de doublons ──
    if (result.barcode) {
      try {
        const dupCheck = await itemService.checkDuplicate(result.barcode);
        if (dupCheck.data?.isDuplicate) {
          const existing = dupCheck.data.existingItems[0];
          const confirmed = window.confirm(
            `⚠️ Un item similaire existe déjà :\n"${existing.name}" (barcode: ${existing.barcode})\n\nVoulez-vous quand même importer ?`
          );
          if (!confirmed) {
            setShowTakoSearch(false);
            return;
          }
        }
      } catch {
        // Ignore check errors, proceed with import
      }
    }

    const previewFields: ImportFieldPreview[] = [];
    const computedValues: Record<string, any> = {};

    // ── 2. Champs de base → preview fields ──
    if (result.title) {
      previewFields.push({ key: 'name', label: 'Nom', currentValue: name, newValue: result.title, category: 'basic' });
      computedValues.name = result.title;
    }
    if (result.description) {
      previewFields.push({ key: 'description', label: 'Description', currentValue: description, newValue: result.description, category: 'basic' });
      computedValues.description = result.description;
    }
    if (result.barcode) {
      previewFields.push({ key: 'barcode', label: 'Code-barres', currentValue: barcode, newValue: result.barcode, category: 'basic' });
      computedValues.barcode = result.barcode;
    }

    // ── 2b. Prix depuis métadonnées Tako ──
    const rawPrice = meta.price || meta.listPrice;
    if (rawPrice) {
      const priceNum = typeof rawPrice === 'object' ? (rawPrice.amount ?? rawPrice.value) : rawPrice;
      if (priceNum && !isNaN(Number(priceNum))) {
        const priceStr = String(Number(priceNum));
        previewFields.push({ key: 'marketValue', label: 'Valeur marchande', currentValue: marketValue || purchasePrice, newValue: `${priceStr} €`, category: 'basic' });
        computedValues.marketValue = priceStr;
      }
    }

    // ── 3. Auto-sélection PrimaryType selon le domaine ──
    let computedPrimaryTypeId: number | undefined;
    if (domain && domainMapping[domain]) {
      const ptKey = domainMapping[domain];
      let targetKey = ptKey;
      if (domain === 'media' && (meta.mediaType === 'tv' || meta.seasons || meta.number_of_seasons)) {
        targetKey = 'series';
      }
      const matchedPt = primaryTypes.find((pt) => pt.key === targetKey);
      if (matchedPt && !primaryTypeId) {
        computedPrimaryTypeId = matchedPt.id;
        const currentPtName = primaryTypes.find(p => p.id === primaryTypeId)?.name || '';
        previewFields.push({ key: 'primaryTypeId', label: 'Type', currentValue: currentPtName, newValue: matchedPt.name || matchedPt.key, category: 'basic' });
      }
    }

    // ── 4. Mapping métadonnées Tako → fieldKey EAV ──
    const ptKey = domainMapping[domain] || '';
    let effectivePtKey = ptKey;
    // Détection film vs série : mediaType explicite prioritaire, sinon fallback sur metadata
    if (domain === 'media') {
      if (meta.mediaType === 'tv') {
        effectivePtKey = 'series';
      } else if (meta.mediaType === 'movie') {
        effectivePtKey = 'movies';
      } else if (meta.seasons || meta.number_of_seasons || meta.numberOfSeasons) {
        effectivePtKey = 'series';
      }
    }

    // Recharger le mapping à chaud (au cas où il a changé depuis le montage)
    let mapping = fieldMappings[effectivePtKey] || {};
    try {
      const freshMapping = await takoService.getDomainMapping();
      const freshFieldMappings = freshMapping.data?.fieldMappings || {};
      if (freshFieldMappings[effectivePtKey]) {
        mapping = freshFieldMappings[effectivePtKey];
      }
    } catch { /* fallback to cached mapping */ }

    // Charger les définitions des champs pour le type cible
    let targetFields: PrimaryTypeField[] = [];
    if (effectivePtKey) {
      try {
        const fieldRes = await primaryTypeService.getFieldsByKey(effectivePtKey);
        targetFields = Array.isArray(fieldRes.data) ? fieldRes.data : (fieldRes.data?.fields || []);
      } catch { /* ignore */ }
    }
    const fieldLookup = new Map(targetFields.map((f) => [f.key, f]));

    // Mapping codes langue → libellés d'options
    const LANG_MAP: Record<string, string> = {
      fr: 'Français', french: 'Français', français: 'Français',
      en: 'English', english: 'English',
      es: 'Español', spanish: 'Español', español: 'Español',
      de: 'Deutsch', german: 'Deutsch', deutsch: 'Deutsch',
      ja: '日本語', japanese: '日本語', jp: '日本語',
      it: 'Italiano', italian: 'Italiano',
      pt: 'Português', portuguese: 'Português',
      ko: '한국어', korean: '한국어',
      zh: '中文', chinese: '中文',
      ru: 'Русский', russian: 'Русский',
    };

    // Mapping genres anglais (Tako/APIs) → français (options des champs)
    // Note: les clés apparaissant dans plusieurs sections utilisent la DERNIÈRE valeur (JS behavior).
    // On structure pour éviter les doublons tout en couvrant Books + Movies + Games + Music + Board.
    const GENRE_MAP: Record<string, string> = {
      // Books
      fiction: 'Roman', novel: 'Roman', literary: 'Roman', literature: 'Roman',
      'science fiction': 'SF', scifi: 'SF',
      'high fantasy': 'Fantasy', 'urban fantasy': 'Fantasy',
      detective: 'Policier',
      manga: 'Manga', comics: 'Comics', comic: 'Comics', 'graphic novel': 'BD', 'bande dessinée': 'BD',
      'children': 'Jeunesse', 'young adult': 'Jeunesse', juvenile: 'Jeunesse', ya: 'Jeunesse',
      'non-fiction': 'Documentaire', nonfiction: 'Documentaire',
      biography: 'Biographie', autobiography: 'Biographie', memoir: 'Biographie',
      poetry: 'Poésie', poem: 'Poésie',
      // Movies/Series (Tako retourne les genres déjà traduits en français)
      action: 'Action', aventure: 'Action', adventure: 'Action',
      comédie: 'Comédie', comedy: 'Comédie', comedie: 'Comédie',
      drame: 'Drame', drama: 'Drame',
      horreur: 'Horreur', horror: 'Horreur', épouvante: 'Horreur',
      'science-fiction': 'SF', sf: 'SF', 'sci-fi': 'SF',
      fantastique: 'Fantasy', fantasy: 'Fantasy',
      animation: 'Animation',
      documentaire: 'Documentaire', documentary: 'Documentaire',
      thriller: 'Thriller', suspense: 'Thriller',
      romance: 'Romance', romantique: 'Romance',
      guerre: 'Guerre', war: 'Guerre',
      western: 'Western',
      crime: 'Thriller', policier: 'Thriller', mystery: 'Thriller', mystère: 'Thriller',
      familial: 'Autre', famille: 'Autre',
      musique: 'Autre', music: 'Autre',
      histoire: 'Documentaire', history: 'Documentaire',
      téléfilm: 'Autre', 'tv movie': 'Autre',
      // Video Games
      rpg: 'RPG', 'role-playing': 'RPG', sport: 'Sport', sports: 'Sport',
      racing: 'Racing', strategy: 'Strategy', simulation: 'Simulation',
      puzzle: 'Puzzle', platformer: 'Platformer', fighting: 'Fighting',
      'survival horror': 'Horror',
      'open world': 'Open World', indie: 'Autre',
      // Music
      rock: 'Rock', pop: 'Pop', 'hip-hop': 'Hip-Hop', 'hip hop': 'Hip-Hop', rap: 'Hip-Hop',
      jazz: 'Jazz', classical: 'Classique', classique: 'Classique',
      electronic: 'Électro', electro: 'Électro', edm: 'Électro',
      metal: 'Metal', 'heavy metal': 'Metal', 'r&b': 'R&B', rnb: 'R&B', soul: 'R&B',
      country: 'Country', reggae: 'Reggae', world: 'World',
      // Board games
      'deck building': 'Deck Building', 'deck-building': 'Deck Building',
      cooperative: 'Coopératif', coop: 'Coopératif', 'co-op': 'Coopératif',
      family: 'Familial', party: 'Ambiance', wargame: 'Wargame',
    };

    // Mapping plateformes → options du champ SELECT
    const PLATFORM_MAP: Record<string, string> = {
      'pc': 'PC', 'windows': 'PC', 'linux': 'PC', 'macos': 'PC', 'mac': 'PC', 'pc (windows)': 'PC',
      'playstation 5': 'PlayStation 5', 'ps5': 'PlayStation 5',
      'playstation 4': 'PlayStation 4', 'ps4': 'PlayStation 4',
      'playstation 3': 'PlayStation 3', 'ps3': 'PlayStation 3',
      'playstation 2': 'PlayStation 2', 'ps2': 'PlayStation 2',
      'playstation': 'PlayStation', 'ps1': 'PlayStation', 'psx': 'PlayStation', 'psone': 'PlayStation',
      'playstation vita': 'PS Vita', 'ps vita': 'PS Vita', 'vita': 'PS Vita',
      'playstation portable': 'PSP', 'psp': 'PSP',
      'xbox series s/x': 'Xbox Series X|S', 'xbox series x|s': 'Xbox Series X|S', 'xbox series x': 'Xbox Series X|S', 'xbox series s': 'Xbox Series X|S',
      'xbox one': 'Xbox One', 'xbox 360': 'Xbox 360', 'xbox': 'Xbox',
      'nintendo switch': 'Nintendo Switch', 'switch': 'Nintendo Switch',
      'wii u': 'Wii U', 'nintendo wii u': 'Wii U', 'wiiu': 'Wii U',
      'wii': 'Wii', 'nintendo wii': 'Wii',
      'gamecube': 'GameCube', 'nintendo gamecube': 'GameCube', 'game cube': 'GameCube', 'gc': 'GameCube', 'ngc': 'GameCube',
      'nintendo 64': 'Nintendo 64', 'n64': 'Nintendo 64',
      'super nintendo': 'Super Nintendo', 'snes': 'Super Nintendo', 'super nes': 'Super Nintendo', 'super famicom': 'Super Nintendo',
      'nes': 'NES', 'nintendo entertainment system': 'NES', 'famicom': 'NES',
      'nintendo 3ds': 'Nintendo 3DS', '3ds': 'Nintendo 3DS', 'new nintendo 3ds': 'Nintendo 3DS', 'new 3ds': 'Nintendo 3DS',
      'nintendo ds': 'Nintendo DS', 'ds': 'Nintendo DS', 'nds': 'Nintendo DS',
      'game boy advance': 'Game Boy Advance', 'gba': 'Game Boy Advance', 'gameboy advance': 'Game Boy Advance',
      'game boy color': 'Game Boy Color', 'gbc': 'Game Boy Color', 'gameboy color': 'Game Boy Color',
      'game boy': 'Game Boy', 'gb': 'Game Boy', 'gameboy': 'Game Boy',
      'dreamcast': 'Dreamcast', 'sega dreamcast': 'Dreamcast', 'dc': 'Dreamcast',
      'saturn': 'Saturn', 'sega saturn': 'Saturn',
      'mega drive': 'Mega Drive', 'sega mega drive': 'Mega Drive', 'genesis': 'Mega Drive', 'sega genesis': 'Mega Drive',
      'master system': 'Master System', 'sega master system': 'Master System',
      'game gear': 'Game Gear', 'sega game gear': 'Game Gear', 'gamegear': 'Game Gear',
      'neo geo': 'Neo Geo', 'neogeo': 'Neo Geo', 'neo-geo': 'Neo Geo',
      'pc engine': 'PC Engine', 'turbografx-16': 'PC Engine', 'turbografx': 'PC Engine', 'tg-16': 'PC Engine',
      '3do': '3DO',
      'atari jaguar': 'Atari Jaguar', 'jaguar': 'Atari Jaguar',
      'atari 2600': 'Atari 2600', 'atari st': 'Atari ST',
      'commodore 64': 'Commodore 64', 'c64': 'Commodore 64',
      'amiga': 'Amiga',
      'steam deck': 'Steam Deck', 'steamdeck': 'Steam Deck',
      'arcade': 'Arcade',
      'android': 'Mobile', 'ios': 'Mobile', 'mobile': 'Mobile', 'iphone': 'Mobile', 'ipad': 'Mobile',
      'web': 'Autre',
    };

    // Calculer toutes les métadonnées mappées (même logique qu'avant, mais on construit un objet séparé)
    const computedMeta: Record<string, any> = {};

    for (const [takoKey, eavKey] of Object.entries(mapping)) {
      let value = meta[takoKey];
      if (value === undefined || value === null) continue;

      // ── Normaliser les tableaux d'objets en tableau de strings ──
      if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
        value = value.map((v: any) => v.name || v.title || v.label || String(v));
      }

      const targetField = fieldLookup.get(eavKey);

      // Conversion de types (même logique que l'ancien handleTakoImport)
      if (Array.isArray(value)) {
        if (takoKey === 'tracklist') {
          computedMeta[eavKey] = String(value.length);
        } else if (targetField?.type === 'multiselect' && targetField.options?.length) {
          const matched: string[] = [];
          for (const v of value) {
            const vStr = String(v).trim();
            const vLower = vStr.toLowerCase();
            const exact = targetField.options.find((o: string) => o.toLowerCase() === vLower);
            if (exact) { if (!matched.includes(exact)) matched.push(exact); continue; }
            const translated = GENRE_MAP[vLower];
            if (translated && targetField.options.includes(translated)) {
              if (!matched.includes(translated)) matched.push(translated);
              continue;
            }
            const partial = targetField.options.find((o: string) =>
              o.toLowerCase().includes(vLower) || vLower.includes(o.toLowerCase()),
            );
            if (partial && !matched.includes(partial)) { matched.push(partial); }
          }
          computedMeta[eavKey] = matched;
        } else if (targetField?.type === 'select' && targetField.options?.length) {
          let matched: string | null = null;
          for (const v of value) {
            const vStr = String(v).trim();
            const vLower = vStr.toLowerCase();
            const exact = targetField.options.find((o: string) => o.toLowerCase() === vLower);
            if (exact) { matched = exact; break; }
            const platMapped = PLATFORM_MAP[vLower];
            if (platMapped && targetField.options.includes(platMapped)) { matched = platMapped; break; }
            const langMapped = LANG_MAP[vLower];
            if (langMapped && targetField.options.includes(langMapped)) { matched = langMapped; break; }
            const genreMapped = GENRE_MAP[vLower];
            if (genreMapped && targetField.options.includes(genreMapped)) { matched = genreMapped; break; }
            const partial = targetField.options.find((o: string) =>
              o.toLowerCase().includes(vLower) || vLower.includes(o.toLowerCase()),
            );
            if (partial) { matched = partial; break; }
          }
          if (matched) {
            computedMeta[eavKey] = matched;
          } else if (value.length > 0) {
            computedMeta[eavKey] = String(value[0]);
          }
        } else {
          computedMeta[eavKey] = value.join(', ');
        }
      } else if (takoKey === 'publishedDate' || takoKey === 'releaseDate') {
        const yearStr = String(value).substring(0, 4);
        const yearNum = parseInt(yearStr, 10);
        if (!isNaN(yearNum)) computedMeta[eavKey] = String(yearNum);
      } else if (takoKey === 'status' && eavKey === 'completed') {
        const finishedStatuses = ['Finished Airing', 'Complete', 'Ended', 'Released'];
        computedMeta[eavKey] = finishedStatuses.includes(String(value)) ? 'true' : 'false';
      } else if (targetField?.type === 'select' && targetField.options?.length) {
        const valStr = String(value);
        const valLower = valStr.toLowerCase();
        const exact = targetField.options.find((o: string) => o.toLowerCase() === valLower);
        if (exact) {
          computedMeta[eavKey] = exact;
        } else {
          const platMapped = PLATFORM_MAP[valLower];
          if (platMapped && targetField.options.includes(platMapped)) {
            computedMeta[eavKey] = platMapped;
          } else {
            const langMapped = LANG_MAP[valLower];
            if (langMapped && targetField.options.includes(langMapped)) {
              computedMeta[eavKey] = langMapped;
            } else {
              const genreMapped = GENRE_MAP[valLower];
              if (genreMapped && targetField.options.includes(genreMapped)) {
                computedMeta[eavKey] = genreMapped;
              } else {
                computedMeta[eavKey] = valStr;
              }
            }
          }
        }
      } else if (typeof value === 'number') {
        computedMeta[eavKey] = String(value);
      } else {
        computedMeta[eavKey] = String(value);
      }
    }

    // Year → champ 'year' (si pas déjà mappé)
    if (result.year && !computedMeta.year) {
      computedMeta.year = String(result.year);
    }

    // Construire les preview fields pour les métadonnées
    for (const [eavKey, newVal] of Object.entries(computedMeta)) {
      const fieldDef = fieldLookup.get(eavKey);
      const label = fieldDef?.name || eavKey;
      const currentVal = metadata[eavKey];
      const currentStr = Array.isArray(currentVal) ? currentVal.join(', ') : (currentVal ?? '').toString();
      const newStr = Array.isArray(newVal) ? newVal.join(', ') : newVal.toString();
      // N'afficher que si la nouvelle valeur est non-vide
      if (newStr) {
        previewFields.push({
          key: `meta:${eavKey}`,
          label,
          currentValue: currentStr,
          newValue: newStr,
          category: 'metadata',
        });
      }
    }

    // ── 4b. Category-level metadata mapping (keyed by provider slug) ──
    const computedCatMeta: Record<string, any> = {};
    const provider = (meta._provider as string) || '';
    // Use fresh mapping if available, otherwise fall back to cached
    let catMapping = categoryFieldMappings[provider] || {};
    try {
      const freshMapping = await takoService.getDomainMapping();
      const freshCatMappings = freshMapping.data?.categoryFieldMappings || {};
      if (freshCatMappings[provider]) catMapping = freshCatMappings[provider];
    } catch { /* fallback */ }

    if (Object.keys(catMapping).length > 0) {
      // Load category field definitions for the item's categories
      let catFieldDefs: PrimaryTypeField[] = [];
      for (const cid of categoryIds) {
        try {
          const res = await categoryService.getCategoryFields(cid);
          const fields = res.data || [];
          for (const f of fields) {
            if (!catFieldDefs.find((d) => d.key === f.key)) catFieldDefs.push(f);
          }
        } catch { /* ignore */ }
      }
      const catFieldLookup = new Map(catFieldDefs.map((f) => [f.key, f]));

      for (const [takoKey, catKey] of Object.entries(catMapping)) {
        let value = meta[takoKey];
        if (value === undefined || value === null) continue;

        const targetField = catFieldLookup.get(catKey);
        if (!targetField) continue; // skip if no matching category field defined

        // Normalize arrays → join/multiselect
        if (Array.isArray(value)) {
          if (targetField.type === 'multiselect') {
            computedCatMeta[catKey] = value.map((v: any) => typeof v === 'object' ? (v.name || String(v)) : String(v));
          } else {
            computedCatMeta[catKey] = value.map((v: any) => typeof v === 'object' ? (v.name || String(v)) : String(v)).join(', ');
          }
        } else if (typeof value === 'boolean') {
          computedCatMeta[catKey] = value;
        } else if (typeof value === 'number') {
          computedCatMeta[catKey] = String(value);
        } else if (typeof value === 'object' && value !== null) {
          // Keep objects as-is (e.g. checklist data)
          computedCatMeta[catKey] = value;
        } else {
          computedCatMeta[catKey] = String(value);
        }

        // Preview field
        const label = targetField.name || catKey;
        let newStr: string;
        if (Array.isArray(computedCatMeta[catKey])) {
          newStr = computedCatMeta[catKey].join(', ');
        } else if (typeof computedCatMeta[catKey] === 'object' && computedCatMeta[catKey] !== null) {
          const obj = computedCatMeta[catKey];
          newStr = obj.total !== undefined ? `${obj.total} stickers` : JSON.stringify(obj);
        } else {
          newStr = String(computedCatMeta[catKey]);
        }
        const curVal = categoryMetadata[catKey];
        const curStr = curVal !== undefined ? (Array.isArray(curVal) ? curVal.join(', ') : String(curVal)) : '';
        if (newStr) {
          previewFields.push({
            key: `catmeta:${catKey}`,
            label: `${label} (catégorie)`,
            currentValue: curStr,
            newValue: newStr,
            category: 'metadata',
          });
        }
      }
    }

    // ── 5. Liens externes (sourceUrl du provider) ──
    const PROVIDER_LABELS: Record<string, string> = {
      tmdb: 'TMDB', tvdb: 'TVDB', igdb: 'IGDB', rawg: 'RAWG',
      googlebooks: 'Google Books', bgg: 'BoardGameGeek',
      anilist: 'AniList', mal: 'MyAnimeList', musicbrainz: 'MusicBrainz',
      discogs: 'Discogs', amazon: 'Amazon', ebay: 'eBay',
    };
    const computedLinks: ExternalLink[] = [];
    if (result.sourceUrl) {
      const provider = result.metadata?._provider || 'web';
      computedLinks.push({
        provider,
        label: PROVIDER_LABELS[provider] || provider.charAt(0).toUpperCase() + provider.slice(1),
        url: result.sourceUrl,
      });
      const existingLinksStr = externalLinks.map(l => `${l.provider}: ${l.url}`).join(', ') || '';
      const newLinkStr = `${computedLinks[0].label}: ${computedLinks[0].url}`;
      previewFields.push({
        key: 'externalLinks',
        label: 'Liens externes',
        currentValue: existingLinksStr,
        newValue: newLinkStr,
        category: 'links',
      });
    }

    // ── 6. Déterminer la cover URL pour la preview ──
    const coverUrl = media.images.length > 0 ? media.images[0] : undefined;

    // Fermer la recherche Tako et afficher la preview
    setShowTakoSearch(false);
    setPendingImport({
      fields: previewFields,
      values: computedValues,
      computedPrimaryTypeId,
      computedMetadata: computedMeta,
      computedCategoryMetadata: computedCatMeta,
      computedExternalLinks: computedLinks,
      media,
      coverUrl,
    });
  }, [name, description, barcode, purchasePrice, marketValue, metadata, categoryMetadata, categoryIds, primaryTypeId, primaryTypes, domainMapping, fieldMappings, categoryFieldMappings]);

  // ══════════════════════════════════════════════════════════════════════════════
  // confirmTakoImport — Applique uniquement les champs/médias sélectionnés
  // ══════════════════════════════════════════════════════════════════════════════
  const confirmTakoImport = useCallback((
    selectedFieldKeys: string[],
    selectedMedia: { images: number[]; videos: number[]; documents: number[] },
  ) => {
    if (!pendingImport) return;
    const { values, computedPrimaryTypeId, computedMetadata, computedCategoryMetadata, computedExternalLinks, media } = pendingImport;
    const selectedSet = new Set(selectedFieldKeys);

    // ── Appliquer les champs de base sélectionnés ──
    if (selectedSet.has('name') && values.name !== undefined) setName(values.name);
    if (selectedSet.has('description') && values.description !== undefined) setDescription(values.description);
    if (selectedSet.has('barcode') && values.barcode !== undefined) setBarcode(values.barcode);
    if (selectedSet.has('marketValue') && values.marketValue !== undefined) {
      if (!purchasePrice) setMarketValue(values.marketValue);
    }
    if (selectedSet.has('primaryTypeId') && computedPrimaryTypeId && !primaryTypeId) {
      setPrimaryTypeId(computedPrimaryTypeId);
    }

    // ── Appliquer les métadonnées sélectionnées ──
    const newMeta = { ...metadata };
    for (const key of selectedFieldKeys) {
      if (key.startsWith('meta:')) {
        const eavKey = key.substring(5);
        if (computedMetadata[eavKey] !== undefined) {
          newMeta[eavKey] = computedMetadata[eavKey];
        }
      }
    }
    setMetadata(newMeta);

    // ── Appliquer les métadonnées catégorie sélectionnées ──
    const newCatMeta = { ...categoryMetadata };
    for (const key of selectedFieldKeys) {
      if (key.startsWith('catmeta:')) {
        const catKey = key.substring(8);
        if (computedCategoryMetadata[catKey] !== undefined) {
          newCatMeta[catKey] = computedCategoryMetadata[catKey];
        }
      }
    }
    setCategoryMetadata(newCatMeta);

    // ── Appliquer les liens externes sélectionnés ──
    if (selectedSet.has('externalLinks') && computedExternalLinks.length > 0) {
      setExternalLinks((prev) => {
        const newLinks = [...prev];
        for (const link of computedExternalLinks) {
          const existingIdx = newLinks.findIndex(l => l.provider === link.provider);
          if (existingIdx >= 0) {
            newLinks[existingIdx] = link; // remplacer le lien du même provider
          } else {
            newLinks.push(link);
          }
        }
        return newLinks;
      });
    }

    // ── Appliquer les médias sélectionnés ──
    const filteredMedia: TakoDownloadedMedia = {
      images: selectedMedia.images.map((i) => media.images[i]).filter(Boolean),
      videos: selectedMedia.videos.map((i) => media.videos[i]).filter(Boolean),
      documents: selectedMedia.documents.map((i) => media.documents[i]).filter(Boolean),
    };
    const hasMedia = filteredMedia.images.length > 0 || filteredMedia.videos.length > 0 || filteredMedia.documents.length > 0;
    if (hasMedia) {
      setPendingMedia(filteredMedia);
    }

    // ── Toast récapitulatif ──
    const fieldCount = selectedFieldKeys.length;
    const mediaCount = filteredMedia.images.length + filteredMedia.videos.length + filteredMedia.documents.length;
    if (mediaCount > 0) {
      const counts: string[] = [];
      if (filteredMedia.images.length > 0) counts.push(`${filteredMedia.images.length} image(s)`);
      if (filteredMedia.videos.length > 0) counts.push(`${filteredMedia.videos.length} vidéo(s)`);
      if (filteredMedia.documents.length > 0) counts.push(`${filteredMedia.documents.length} document(s)`);
      toast.success(t('manage:tako.importSuccessWithMedia', `${fieldCount} champ(s) + ${counts.join(', ')} importés`, { fields: fieldCount, media: counts.join(', ') }));
    } else if (fieldCount > 0) {
      toast.success(t('manage:tako.importSuccess', `${fieldCount} champ(s) importé(s)`, { count: fieldCount }));
    }

    setPendingImport(null);
  }, [pendingImport, metadata, primaryTypeId, purchasePrice, t]);

  /**
   * Attache tous les médias pending (images, vidéos, documents) à un item.
   * Pour chaque type, utilise attachFromTemp pour les URLs locales temp et upload pour les URLs externes.
   */
  const attachPendingMedia = async (
    mediaService: { attachFromTemp: (...args: any[]) => Promise<any>; upload: (...args: any[]) => Promise<any>; attachFromUrl: (...args: any[]) => Promise<any> },
    itemId: number,
    media: TakoDownloadedMedia,
  ) => {
    const apiUrl = getApiBaseUrl();
    let attached = 0;
    let failed = 0;

    // Helper: detect external video platforms (YouTube, Vimeo)
    const isExternalVideoUrl = (url: string): boolean =>
      url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com');

    // Helper: extract YouTube thumbnail
    const getYouTubeThumbnail = (url: string): string | undefined => {
      const match = url.match(/(?:v=|youtu\.be\/)([\w-]{11})/);
      return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : undefined;
    };

    // Helper: attach a single temp file
    const attachTemp = async (
      type: 'images' | 'videos' | 'documents',
      tempUrl: string,
      title: string,
    ) => {
      try {
        if (tempUrl.startsWith('/storage/temp/')) {
          await mediaService.attachFromTemp(itemId, type, tempUrl, title);
          attached++;
        } else if (tempUrl.startsWith('http') && isExternalVideoUrl(tempUrl)) {
          // External video platform (YouTube, Vimeo) — store URL reference only
          const thumbnailUrl = getYouTubeThumbnail(tempUrl);
          await mediaService.attachFromUrl(itemId, type, tempUrl, title, thumbnailUrl);
          attached++;
        } else if (tempUrl.startsWith('http')) {
          // Other external URL — download as blob then upload
          const resp = await fetch(tempUrl.startsWith('http') ? tempUrl : `${apiUrl}${tempUrl}`);
          if (resp.ok) {
            const blob = await resp.blob();
            const ext = tempUrl.split('.').pop()?.split('?')[0] || (type === 'documents' ? 'pdf' : type === 'videos' ? 'mp4' : 'jpg');
            const file = new File([blob], `tako_${type}_${Date.now()}.${ext}`, { type: blob.type });
            await mediaService.upload(itemId, type, [file], [title]);
            attached++;
          } else { failed++; }
        } else {
          // Relative temp URL
          await mediaService.attachFromTemp(itemId, type, tempUrl, title);
          attached++;
        }
      } catch {
        failed++;
      }
    };

    // Attach images
    for (let i = 0; i < media.images.length; i++) {
      await attachTemp('images', media.images[i], i === 0 ? 'Image importée' : `Image ${i + 1}`);
    }

    // Attach videos — use original title from Tako when available
    for (let i = 0; i < media.videos.length; i++) {
      const v = media.videos[i];
      const url = typeof v === 'string' ? v : v.url;
      const title = (typeof v === 'object' && v.title) ? v.title : `Vidéo ${i + 1}`;
      await attachTemp('videos', url, title);
    }

    // Attach documents — use original title from Tako when available
    for (let i = 0; i < media.documents.length; i++) {
      const d = media.documents[i];
      const url = typeof d === 'string' ? d : d.url;
      const title = (typeof d === 'object' && d.title) ? d.title : `Document ${i + 1}`;
      await attachTemp('documents', url, title);
    }

    if (attached > 0) {
      toast.success(`${attached} média(s) attaché(s)`);
    }
    if (failed > 0) {
      toast(`${failed} média(s) non attaché(s)`, { icon: '⚠️' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error(t('errors.nameRequired'));
      return;
    }
    if (!primaryTypeId) {
      toast.error(t('errors.typeRequired'));
      return;
    }
    if (categoryIds.length === 0) {
      toast.error(t('errors.categoryRequired'));
      return;
    }

    setSubmitting(true);
    try {
      // Build clean metadata (no empty values)
      const cleanMeta: Record<string, any> = {};
      for (const [key, value] of Object.entries(metadata)) {
        if (value !== '' && value !== null && value !== undefined) {
          cleanMeta[key] = value;
        }
      }
      const cleanCatMeta: Record<string, any> = {};
      for (const [key, value] of Object.entries(categoryMetadata)) {
        if (value !== '' && value !== null && value !== undefined) {
          cleanCatMeta[key] = value;
        }
      }

      if (isEdit && id) {
        const payload: UpdateItemPayload = {
          name,
          description: description || undefined,
          categoryIds,
          notes: notes || undefined,
          rating: rating || undefined,
          purchasePrice: purchasePrice ? Number(purchasePrice) : undefined,
          marketValue: marketValue ? Number(marketValue) : undefined,
          dateObtained: dateObtained || undefined,
          searchState: searchState || undefined,
          barcode: barcode || undefined,
          statusId: statusId ? Number(statusId) : undefined,
          storageLocationId: storageLocationId ? Number(storageLocationId) : undefined,
          gradeIds: gradeIds.length > 0 ? gradeIds : undefined,
          metadata: Object.keys(cleanMeta).length > 0 ? cleanMeta : undefined,
          categoryMetadata: Object.keys(cleanCatMeta).length > 0 ? cleanCatMeta : undefined,
          externalLinks: externalLinks.length > 0 ? externalLinks : undefined,
        };
        await itemService.updateItem(Number(id), payload);

        // ── Attacher automatiquement les médias importés depuis Tako (edit) ──
        if (pendingMedia) {
          try {
            const { itemMediaService } = await import('../../services/media.service');
            await attachPendingMedia(itemMediaService, Number(id), pendingMedia);
          } catch {
            toast(t('manage:tako.mediaAttachFailed', "Certains médias n'ont pas pu être attachés"), { icon: '⚠️' });
          }
          setPendingMedia(null);
        }

        toast.success(t('success.updated'));
        navigate(`/items/${id}`);
      } else {
        const payload: CreateItemPayload = {
          name,
          description: description || undefined,
          primaryTypeId: Number(primaryTypeId),
          categoryIds,
          notes: notes || undefined,
          rating: rating || undefined,
          purchasePrice: purchasePrice ? Number(purchasePrice) : undefined,
          marketValue: marketValue ? Number(marketValue) : undefined,
          dateObtained: dateObtained || undefined,
          searchState: searchState || undefined,
          barcode: barcode || undefined,
          statusId: statusId ? Number(statusId) : undefined,
          storageLocationId: storageLocationId ? Number(storageLocationId) : undefined,
          gradeIds: gradeIds.length > 0 ? gradeIds : undefined,
          metadata: Object.keys(cleanMeta).length > 0 ? cleanMeta : undefined,
          categoryMetadata: Object.keys(cleanCatMeta).length > 0 ? cleanCatMeta : undefined,
          externalLinks: externalLinks.length > 0 ? externalLinks : undefined,
        };
        const res = await itemService.createItem(payload);

        // ── Attacher automatiquement les médias importés depuis Tako ──
        if (pendingMedia) {
          try {
            const { itemMediaService } = await import('../../services/media.service');
            await attachPendingMedia(itemMediaService, res.data.id, pendingMedia);
          } catch {
            toast(t('manage:tako.mediaAttachFailed', "Certains médias n'ont pas pu être attachés"), { icon: '⚠️' });
          }
          setPendingMedia(null);
        }

        toast.success(t('success.created'));
        navigate(`/items/${res.data.id}`);
      }
    } catch {
      toast.error(isEdit ? t('errors.updateFailed') : t('errors.createFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  // Memoize Tako modal props to avoid unstable references
  const takoCategory = categories.find((c) => categoryIds.includes(c.id));

  // Resolve effective primaryType key: category's type first, fallback to form-selected type
  const effectivePtKey = takoCategory?.primaryType?.key
    || primaryTypes.find((pt) => pt.id === primaryTypeId)?.key;

  const takoInitialDomain = (() => {
    if (!effectivePtKey) return undefined;
    const domains = primaryTypeToDomains[effectivePtKey];
    return domains?.[0] as any;
  })();

  const takoDefaultProviders = takoCategory?.defaultProviders?.length
    ? takoCategory.defaultProviders
    : undefined;

  const takoRelatedDomains = (() => {
    if (!effectivePtKey) return undefined;
    const domains = primaryTypeToDomains[effectivePtKey];
    return domains?.length ? (domains as any) : undefined;
  })();

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-1 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('detail.back')}
        </button>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[var(--color-text)]">
            {isEdit ? t('editItem') : t('addItem')}
          </h1>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => { setTakoKeepResults(false); setShowTakoSearch(true); }}
            >
              <Globe className="h-4 w-4 mr-2" />
              {t('manage:tako.searchWeb', 'Recherche web')}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowScanner(true)}
            >
              <ScanLine className="h-4 w-4 mr-2" />
              {t('scanner.scan', 'Scanner')}
            </Button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tabs */}
        <Tabs tabs={formTabs} activeTab={activeTab} onChange={setActiveTab} />

        {/* Bandeau médias Tako importés en attente */}
        {pendingMedia && (pendingMedia.images.length > 0 || pendingMedia.videos.length > 0 || pendingMedia.documents.length > 0) && (
          <div className="flex items-center gap-3 rounded-lg border border-blue-300 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800 px-4 py-3">
            {/* Thumbnail de la première image */}
            {pendingMedia.images.length > 0 && (
              <img
                src={`${getMediaUrl(pendingMedia.images[0])}`}
                alt="Import Tako"
                className="h-12 w-12 rounded object-cover"
              />
            )}
            <div className="flex-1 text-sm">
              <p className="font-medium text-blue-800 dark:text-blue-200">
                📦 {t('manage:tako.pendingMedia', 'Médias importés prêts à être attachés')}
              </p>
              <p className="text-blue-600 dark:text-blue-400 text-xs">
                {[
                  pendingMedia.images.length > 0 && `📷 ${pendingMedia.images.length} image(s)`,
                  pendingMedia.videos.length > 0 && `🎬 ${pendingMedia.videos.length} vidéo(s)`,
                  pendingMedia.documents.length > 0 && `📄 ${pendingMedia.documents.length} document(s)`,
                ].filter(Boolean).join(' · ')}
                {' — '}
                {t('manage:tako.pendingMediaHint', 'Seront automatiquement attachés à la sauvegarde')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPendingMedia(null)}
              className="text-blue-400 hover:text-blue-600 text-lg"
            >
              ×
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* TAB 1: Général */}
        {/* ═══════════════════════════════════════════ */}
        {activeTab === 'general' && (
        <>
        {/* Basic info */}
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">
            {t('detail.info')}
          </h2>

          {/* Name */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">
              {t('form.name')} *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('form.namePlaceholder')}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">
              {t('form.description')}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('form.descriptionPlaceholder')}
              rows={3}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
            />
          </div>

          {/* Primary Type */}
          {!isEdit && (
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">
                {t('form.primaryType')} *
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {primaryTypes.map((pt) => (
                  <button
                    key={pt.id}
                    type="button"
                    onClick={() => setPrimaryTypeId(pt.id)}
                    className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-center transition ${
                      primaryTypeId === pt.id
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                        : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50 text-[var(--color-text-secondary)]'
                    }`}
                  >
                    <span className="text-xl">{pt.icon}</span>
                    <span className="text-xs font-medium truncate w-full">{pt.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Categories */}
          <CategorySelector
            categories={categories}
            primaryTypes={primaryTypes}
            selectedIds={categoryIds}
            onChange={setCategoryIds}
            onToggle={(catId, selected) => {
              if (selected && !primaryTypeId) {
                const cat = categories.find((c) => c.id === catId);
                if (cat?.primaryTypeId) setPrimaryTypeId(cat.primaryTypeId);
              }
            }}
          />
        </Card>

        {/* Rating, État, Prix, etc. */}
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">{t('form.detailsSection', 'Informations complémentaires')}</h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Rating */}
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">
                {t('form.rating')}
              </label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(rating === star ? 0 : star)}
                    className="p-0.5 transition"
                  >
                    <Star
                      className={`h-6 w-6 ${
                        star <= rating
                          ? 'fill-yellow-500 text-yellow-500'
                          : 'text-[var(--color-border)]'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Search state */}
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">
                {t('form.searchState')}
              </label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={searchState === 'owned' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setSearchState(searchState === 'owned' ? '' : 'owned')}
                >
                  {t('form.owned')}
                </Button>
                <Button
                  type="button"
                  variant={searchState === 'looking' ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setSearchState(searchState === 'looking' ? '' : 'looking')}
                >
                  {t('form.looking')}
                </Button>
              </div>
            </div>

            {/* Purchase price */}
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">
                {t('form.purchasePrice')} (€)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder="0.00"
              />
            </div>

            {/* Market value */}
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">
                {t('form.marketValue')} (€)
              </label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={marketValue}
                onChange={(e) => setMarketValue(e.target.value)}
                placeholder="0.00"
              />
            </div>

            {/* Date obtained */}
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">
                {t('form.dateObtained')}
              </label>
              <Input
                type="date"
                value={dateObtained}
                onChange={(e) => setDateObtained(e.target.value)}
              />
            </div>

            {/* Barcode */}
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">
                {t('form.barcode')}
              </label>
              <Input
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder={t('form.barcodePlaceholder')}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">
              {t('form.notes')}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('form.notesPlaceholder')}
              rows={2}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
            />
          </div>
        </Card>

        {/* Status, Grades, Storage Location */}
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">{t('form.statusSection', 'Statut & Condition')}</h2>

          {/* Status */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">
              {t('form.status', 'Statut')}
            </label>
            <div className="flex flex-wrap gap-2">
              {statuses.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStatusId(statusId === s.id ? '' : s.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    statusId === s.id
                      ? 'text-white'
                      : 'border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]'
                  }`}
                  style={statusId === s.id ? { backgroundColor: s.color } : undefined}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          {/* Grades */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">
              {t('form.grades', 'Grades / Condition')}
            </label>
            <p className="mb-2 text-xs text-[var(--color-text-secondary)]">
              {t('form.selectGrades', 'Sélectionnez les grades applicables')}
            </p>
            <div className="flex flex-wrap gap-2">
              {grades.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => toggleGrade(g.id)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    gradeIds.includes(g.id)
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]'
                  }`}
                >
                  {g.name}
                </button>
              ))}
            </div>
          </div>

          {/* Storage Location */}
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">
              {t('form.storageLocation', 'Emplacement de stockage')}
            </label>
            <select
              value={storageLocationId}
              onChange={(e) => setStorageLocationId(e.target.value ? Number(e.target.value) : '')}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
            >
              <option value="">— {t('form.noLocation', 'Aucun')} —</option>
              {storageLocations.map((loc) => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>
        </Card>
        </>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* TAB 2: Détails (champs dynamiques EAV par type) */}
        {/* ═══════════════════════════════════════════ */}
        {activeTab === 'details' && (
        <>
        {!primaryTypeId ? (
          <Card className="p-6">
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <Settings2 className="h-12 w-12 text-[var(--color-text-secondary)]" />
              <p className="text-sm font-medium text-[var(--color-text)]">
                {t('form.selectTypeFirst', 'Sélectionnez un type dans l\'onglet Général')}
              </p>
              <p className="text-xs text-[var(--color-text-secondary)]">
                {t('form.selectTypeFirstDesc', 'Les champs spécifiques au type apparaîtront ici une fois le type sélectionné.')}
              </p>
            </div>
          </Card>
        ) : fields.length === 0 ? (
          <Card className="p-6">
            <div className="flex flex-col items-center gap-3 py-12 text-center">
              <Settings2 className="h-12 w-12 text-[var(--color-text-secondary)]" />
              <p className="text-sm font-medium text-[var(--color-text)]">
                {t('form.noFieldsForType', 'Aucun champ spécifique pour ce type')}
              </p>
            </div>
          </Card>
        ) : (
          <Card className="p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-text)]">
                {t('form.typeSpecificFields', 'Champs spécifiques')}
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)]">
                {t('form.typeSpecificFieldsDesc', 'Champs propres au type d\'objet sélectionné')}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {fields.map((field) => (
                <div key={field.id} className={field.type === 'textarea' ? 'sm:col-span-2' : ''}>
                  {field.type !== 'boolean' && (
                    <label className="mb-1 flex items-center gap-1 text-sm font-medium text-[var(--color-text)]">
                      {field.icon && <span>{field.icon}</span>}
                      {field.name}
                      {field.isRequired && <span className="text-red-500">*</span>}
                    </label>
                  )}

                  {field.type === 'textarea' ? (
                    <textarea
                      value={metadata[field.key] || ''}
                      onChange={(e) => handleMetadataChange(field.key, e.target.value)}
                      placeholder={field.placeholder || ''}
                      rows={2}
                      className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                    />
                  ) : field.type === 'select' && field.options ? (
                    <select
                      value={metadata[field.key] || ''}
                      onChange={(e) => handleMetadataChange(field.key, e.target.value)}
                      className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                    >
                      <option value="">{field.placeholder || '—'}</option>
                      {field.options.map((opt: string) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : field.type === 'multiselect' && field.options ? (
                    <div className="flex flex-wrap gap-1.5">
                      {field.options.map((opt: string) => {
                        const raw = metadata[field.key];
                        const currentArr = Array.isArray(raw) ? raw : (typeof raw === 'string' && raw ? raw.split(',').map((s: string) => s.trim()) : []);
                        const selected = currentArr.includes(opt);
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => {
                              const next = selected
                                ? currentArr.filter((v: string) => v !== opt)
                                : [...currentArr, opt];
                              handleMetadataChange(field.key, next);
                            }}
                            className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                              selected
                                ? 'bg-[var(--color-primary)] text-white'
                                : 'border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  ) : field.type === 'boolean' ? (
                    <label className="flex items-center gap-2 cursor-pointer mt-1">
                      <input
                        type="checkbox"
                        checked={metadata[field.key] === true || metadata[field.key] === 'true'}
                        onChange={(e) => handleMetadataChange(field.key, e.target.checked)}
                        className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                      />
                      <span className="text-sm font-medium text-[var(--color-text)]">
                        {field.name}
                      </span>
                    </label>
                  ) : field.type === 'rating' ? (
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() =>
                            handleMetadataChange(
                              field.key,
                              metadata[field.key] === star ? 0 : star,
                            )
                          }
                          className="p-0.5"
                        >
                          <Star
                            className={`h-5 w-5 ${
                              star <= (metadata[field.key] || 0)
                                ? 'fill-yellow-500 text-yellow-500'
                                : 'text-[var(--color-border)]'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <Input
                      type={
                        field.type === 'number' || field.type === 'year' || field.type === 'duration'
                          ? 'number'
                          : field.type === 'date'
                            ? 'date'
                            : field.type === 'url'
                              ? 'url'
                              : 'text'
                      }
                      value={metadata[field.key] || ''}
                      onChange={(e) =>
                        handleMetadataChange(
                          field.key,
                          field.type === 'number' || field.type === 'year' || field.type === 'duration'
                            ? e.target.value ? Number(e.target.value) : ''
                            : e.target.value,
                        )
                      }
                      placeholder={field.placeholder || ''}
                    />
                  )}

                  {field.helpText && (
                    <p className="mt-0.5 text-[11px] text-[var(--color-text-secondary)]">
                      {field.helpText}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* ═══ Champs spécifiques à la catégorie ═══ */}
        {categoryFields.length > 0 && (
          <Card className="p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-text)]">
                {t('form.categoryFields', 'Champs de catégorie')}
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)]">
                {t('form.categoryFieldsDesc', 'Champs propres à la catégorie sélectionnée')}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {categoryFields.map((field) => (
                <div key={`cf-${field.id}`} className={field.type === 'textarea' || field.type === 'checklist' ? 'sm:col-span-2' : ''}>
                  {field.type !== 'boolean' && (
                    <label className="mb-1 flex items-center gap-1 text-sm font-medium text-[var(--color-text)]">
                      {field.icon && <span>{field.icon}</span>}
                      {field.name}
                      {field.isRequired && <span className="text-red-500">*</span>}
                    </label>
                  )}

                  {field.type === 'textarea' ? (
                    <textarea
                      value={categoryMetadata[field.key] || ''}
                      onChange={(e) => handleCategoryMetadataChange(field.key, e.target.value)}
                      placeholder={field.placeholder || ''}
                      rows={2}
                      className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                    />
                  ) : field.type === 'select' && field.options ? (
                    <select
                      value={categoryMetadata[field.key] || ''}
                      onChange={(e) => handleCategoryMetadataChange(field.key, e.target.value)}
                      className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                    >
                      <option value="">{field.placeholder || '—'}</option>
                      {field.options.map((opt: string) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  ) : field.type === 'multiselect' && field.options ? (
                    <div className="flex flex-wrap gap-1.5">
                      {field.options.map((opt: string) => {
                        const raw = categoryMetadata[field.key];
                        const currentArr = Array.isArray(raw) ? raw : (typeof raw === 'string' && raw ? raw.split(',').map((s: string) => s.trim()) : []);
                        const selected = currentArr.includes(opt);
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => {
                              const next = selected
                                ? currentArr.filter((v: string) => v !== opt)
                                : [...currentArr, opt];
                              handleCategoryMetadataChange(field.key, next);
                            }}
                            className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                              selected
                                ? 'bg-[var(--color-primary)] text-white'
                                : 'border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  ) : field.type === 'boolean' ? (
                    <label className="flex items-center gap-2 cursor-pointer mt-1">
                      <input
                        type="checkbox"
                        checked={categoryMetadata[field.key] === true || categoryMetadata[field.key] === 'true'}
                        onChange={(e) => handleCategoryMetadataChange(field.key, e.target.checked)}
                        className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                      />
                      <span className="text-sm font-medium text-[var(--color-text)]">
                        {field.name}
                      </span>
                    </label>
                  ) : field.type === 'rating' ? (
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() =>
                            handleCategoryMetadataChange(
                              field.key,
                              categoryMetadata[field.key] === star ? 0 : star,
                            )
                          }
                          className="p-0.5"
                        >
                          <Star
                            className={`h-5 w-5 ${
                              star <= (categoryMetadata[field.key] || 0)
                                ? 'fill-yellow-500 text-yellow-500'
                                : 'text-[var(--color-border)]'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                  ) : field.type === 'checklist' && categoryMetadata[field.key] ? (
                    <StickerChecklist
                      value={categoryMetadata[field.key] as ChecklistData}
                      onChange={(val) => handleCategoryMetadataChange(field.key, val)}
                    />
                  ) : field.type === 'checklist' ? (
                    <p className="text-sm text-[var(--color-text-secondary)] italic">
                      {t('checklist.empty', 'Importez depuis un provider pour remplir la checklist')}
                    </p>
                  ) : (
                    <Input
                      type={
                        field.type === 'number' || field.type === 'year' || field.type === 'duration'
                          ? 'number'
                          : field.type === 'date'
                            ? 'date'
                            : field.type === 'url'
                              ? 'url'
                              : 'text'
                      }
                      value={categoryMetadata[field.key] || ''}
                      onChange={(e) =>
                        handleCategoryMetadataChange(
                          field.key,
                          field.type === 'number' || field.type === 'year' || field.type === 'duration'
                            ? e.target.value ? Number(e.target.value) : ''
                            : e.target.value,
                        )
                      }
                      placeholder={field.placeholder || ''}
                    />
                  )}

                  {field.helpText && (
                    <p className="mt-0.5 text-[11px] text-[var(--color-text-secondary)]">
                      {field.helpText}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* ═══ Liens externes ═══ */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--color-text)]">
              <ExternalLinkIcon className="h-5 w-5" />
              {t('form.externalLinks', 'Liens externes')}
            </h2>
            <button
              type="button"
              onClick={() => setExternalLinks(prev => [...prev, { provider: '', label: '', url: '' }])}
              className="flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline"
            >
              <Plus className="h-3.5 w-3.5" />
              Ajouter
            </button>
          </div>
          {externalLinks.length === 0 ? (
            <p className="text-sm text-[var(--color-text-secondary)] py-2">
              {t('form.noExternalLinks', 'Aucun lien externe. Importez depuis Tako ou ajoutez manuellement.')}
            </p>
          ) : (
            <div className="space-y-3">
              {externalLinks.map((link, idx) => (
                <div key={idx} className="flex items-center gap-2 rounded-lg bg-[var(--color-hover)] p-3">
                  <ExternalLinkIcon className="h-4 w-4 shrink-0 text-[var(--color-text-secondary)]" />
                  <Input
                    value={link.label}
                    onChange={(e) => {
                      const updated = [...externalLinks];
                      updated[idx] = { ...updated[idx], label: e.target.value };
                      setExternalLinks(updated);
                    }}
                    placeholder="Label (ex: TMDB)"
                    className="w-24 text-xs"
                  />
                  <Input
                    value={link.url}
                    onChange={(e) => {
                      const updated = [...externalLinks];
                      updated[idx] = { ...updated[idx], url: e.target.value };
                      setExternalLinks(updated);
                    }}
                    placeholder="https://..."
                    className="flex-1 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setExternalLinks(prev => prev.filter((_, i) => i !== idx))}
                    className="text-red-400 hover:text-red-600 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>
        </>
        )}

        {/* ═══════════════════════════════════════════ */}
        {/* TAB 3: Médias (edit only) */}
        {/* ═══════════════════════════════════════════ */}
        {activeTab === 'media' && (
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-[var(--color-text)]">
              {t('manage:media.title', 'Médias')}
            </h2>
            {isEdit && id ? (
              <MediaListManager itemId={Number(id)} />
            ) : (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <ImageIcon className="h-12 w-12 text-[var(--color-text-secondary)]" />
                <p className="text-sm font-medium text-[var(--color-text)]">
                  {t('manage:media.saveFirst', 'Sauvegardez l\'item pour ajouter des médias')}
                </p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {t('manage:media.saveFirstDesc', 'L\'onglet médias sera disponible après la création de l\'item.')}
                </p>
              </div>
            )}
          </Card>
        )}

        {/* Submit */}
        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate(-1)}
          >
            {t('form.cancel')}
          </Button>
          <Button type="submit" variant="primary" disabled={submitting}>
            <Save className="mr-2 h-4 w-4" />
            {submitting
              ? isEdit
                ? t('form.saving')
                : t('form.creating')
              : isEdit
                ? t('form.update')
                : t('form.create')}
          </Button>
        </div>
      </form>

      {/* Tako Search Modal */}
      <TakoSearchModal
        open={showTakoSearch}
        onClose={() => { setShowTakoSearch(false); setTakoKeepResults(false); setScanInitialQuery(''); }}
        onImport={prepareTakoImport}
        initialQuery={scanInitialQuery || name}
        initialDomain={takoInitialDomain}
        relatedDomains={takoRelatedDomains}
        defaultProviders={takoDefaultProviders}
        keepResults={takoKeepResults}
      />

      {/* Tako Import Preview */}
      <TakoImportPreview
        open={!!pendingImport}
        onCancel={() => { setPendingImport(null); setTakoKeepResults(true); setShowTakoSearch(true); }}
        onConfirm={confirmTakoImport}
        fields={pendingImport?.fields || []}
        media={pendingImport?.media || { images: [], videos: [], documents: [] }}
        coverUrl={pendingImport?.coverUrl}
      />

      {/* Scanner Modal */}
      <ScanAddModal
        open={showScanner}
        onClose={() => setShowScanner(false)}
        onImport={(result, media) => {
          setShowScanner(false);
          prepareTakoImport(result, media);
        }}
        onSearchText={(text) => {
          setShowScanner(false);
          setScanInitialQuery(text);
          setTakoKeepResults(false);
          setShowTakoSearch(true);
        }}
        categories={categories}
        primaryTypeToDomains={primaryTypeToDomains}
        initialCategoryId={categoryIds.length > 0 ? categoryIds[0] : undefined}
      />
    </div>
  );
}
