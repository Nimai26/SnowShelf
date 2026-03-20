import { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Spinner } from '../ui/Spinner';
import { Badge } from '../ui/Badge';
import { Tabs } from '../ui/Tabs';
import {
  ScanLine,
  Camera,
  Download,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  AlertCircle,
  ImageIcon,
  Calendar,
  Barcode as BarcodeIcon,
  Check,
} from 'lucide-react';
import { BarcodeScanner } from './BarcodeScanner';
import { PhotoOCR } from './PhotoOCR';
import { takoService } from '../../services/tako.service';
import type { TakoSearchResult, TakoDomainName } from '../../types/tako.types';
import type { TakoDownloadedMedia } from './TakoSearchModal';
import type { Category } from '../../types/category.types';

/** Domains that support barcode/ISBN/EAN lookup */
const BARCODE_DOMAINS = new Set<string>([
  'books', 'comics', 'music', 'boardgames', 'videogames', 'ecommerce',
]);

interface ScanAddModalProps {
  open: boolean;
  onClose: () => void;
  onImport: (result: TakoSearchResult, media: TakoDownloadedMedia) => void;
  /** When OCR text is extracted, redirect to TakoSearchModal with this text */
  onSearchText?: (text: string) => void;
  /** Available categories */
  categories?: Category[];
  /** Map: primaryTypeKey → domain names */
  primaryTypeToDomains?: Record<string, string[]>;
  /** Pre-selected category id (from form) */
  initialCategoryId?: number;
}

export function ScanAddModal({
  open,
  onClose,
  onImport,
  onSearchText,
  categories,
  primaryTypeToDomains,
  initialCategoryId,
}: ScanAddModalProps) {
  const { t } = useTranslation('items');
  const [activeTab, setActiveTab] = useState('barcode');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    initialCategoryId ?? null,
  );
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TakoSearchResult[]>([]);
  const [detectedBarcode, setDetectedBarcode] = useState<string | null>(null);
  const [detectedType, setDetectedType] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [importing, setImporting] = useState<string | null>(null);

  // Compute domains for selected category
  const selectedDomains = useMemo((): TakoDomainName[] | undefined => {
    if (!selectedCategoryId || !categories?.length || !primaryTypeToDomains) return undefined;
    const cat = categories.find((c) => c.id === selectedCategoryId);
    if (!cat?.primaryType?.key) return undefined;
    const domains = primaryTypeToDomains[cat.primaryType.key];
    return domains?.length ? (domains as TakoDomainName[]) : undefined;
  }, [selectedCategoryId, categories, primaryTypeToDomains]);

  // Check if a category supports barcode scanning
  const isBarcodeCompatible = useCallback(
    (cat: Category): boolean => {
      if (!cat.primaryType?.key || !primaryTypeToDomains) return false;
      const domains = primaryTypeToDomains[cat.primaryType.key] || [];
      return domains.some((d) => BARCODE_DOMAINS.has(d));
    },
    [primaryTypeToDomains],
  );

  const tabs = [
    { id: 'barcode', label: t('scanner.tabBarcode', 'Code-barres'), icon: <ScanLine className="h-4 w-4" /> },
    { id: 'photo', label: t('scanner.tabPhoto', 'Photo / OCR'), icon: <Camera className="h-4 w-4" /> },
  ];

  const handleBarcodeDetected = useCallback(async (barcode: string, _format: string) => {
    setDetectedBarcode(barcode);
    setError(null);
    setLoading(true);
    setResults([]);

    try {
      const response = await takoService.lookupBarcode({
        barcode,
        domains: selectedDomains,
      });
      setDetectedType(response.data.detectedType);
      setResults(response.data.results);

      if (response.data.results.length === 0) {
        setError(t('scanner.noResultsForBarcode', 'Aucun résultat trouvé pour ce code-barres'));
      }
    } catch (err) {
      setError(t('scanner.lookupError', 'Erreur lors de la recherche du code-barres'));
    } finally {
      setLoading(false);
    }
  }, [t, selectedDomains]);

  const handleTextExtracted = useCallback((text: string) => {
    if (onSearchText) {
      onClose();
      onSearchText(text);
    }
  }, [onClose, onSearchText]);

  const handleImport = useCallback(async (result: TakoSearchResult) => {
    setImporting(result.sourceId);
    try {
      // Fetch full details
      let fullResult = result;
      try {
        const domain = result.metadata?._domain as string || 'ecommerce';
        const detailRes = await takoService.getDetail(
          domain,
          result.provider,
          result.sourceId,
          result.type,
        );
        if (detailRes.data) {
          fullResult = detailRes.data;
        }
      } catch {
        // Fallback to search result
      }

      // Proxy-download media
      const downloadedMedia: TakoDownloadedMedia = {
        images: [],
        videos: [],
        documents: [],
      };

      const proxyDl = async (url: string, suffix: string): Promise<string | null> => {
        try {
          const dlRes = await takoService.proxyDownload(url, `${fullResult.provider}_${fullResult.sourceId}_${suffix}`);
          return dlRes.data.url;
        } catch {
          return null;
        }
      };

      // Cover image
      const imgUrl = fullResult.imageUrl || result.imageUrl;
      if (imgUrl) {
        const tempUrl = await proxyDl(imgUrl, 'cover');
        if (tempUrl) downloadedMedia.images.push(tempUrl);
      }

      // Extra images (limit 10)
      if (fullResult.extraImages?.length) {
        for (let i = 0; i < Math.min(fullResult.extraImages.length, 10); i++) {
          if (fullResult.extraImages[i].url === imgUrl) continue;
          const tempUrl = await proxyDl(fullResult.extraImages[i].url, `img_${i}`);
          if (tempUrl) downloadedMedia.images.push(tempUrl);
        }
      }

      // Videos (limit 5, skip YouTube/Vimeo)
      if (fullResult.videos?.length) {
        const directVideos = fullResult.videos
          .filter(v => !v.url.includes('youtube.com') && !v.url.includes('youtu.be') && !v.url.includes('vimeo.com'))
          .slice(0, 5);
        for (let i = 0; i < directVideos.length; i++) {
          const tempUrl = await proxyDl(directVideos[i].url, `vid_${i}`);
          if (tempUrl) downloadedMedia.videos.push({ url: tempUrl, title: directVideos[i].title });
        }
        const youtubeVideos = fullResult.videos
          .filter(v => v.url.includes('youtube.com') || v.url.includes('youtu.be') || v.url.includes('vimeo.com'))
          .slice(0, 5);
        for (const yt of youtubeVideos) {
          downloadedMedia.videos.push({ url: yt.url, title: yt.title });
        }
      }

      // Documents (limit 10)
      if (fullResult.documents?.length) {
        for (let i = 0; i < Math.min(fullResult.documents.length, 10); i++) {
          if (i > 0) await new Promise(r => setTimeout(r, 800));
          const tempUrl = await proxyDl(fullResult.documents[i].url, `doc_${i}`);
          if (tempUrl) downloadedMedia.documents.push({ url: tempUrl, title: fullResult.documents[i].title });
        }
      }

      onImport(fullResult, downloadedMedia);
    } finally {
      setImporting(null);
    }
  }, [onImport]);

  const resetScan = useCallback(() => {
    setDetectedBarcode(null);
    setDetectedType(null);
    setResults([]);
    setError(null);
    setExpandedId(null);
  }, []);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
    resetScan();
  }, [resetScan]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('scanner.title', 'Scanner / Photo')}
      description={t('scanner.description', 'Scannez un code-barres ou prenez une photo pour identifier un objet')}
      className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
    >
      <div className="flex flex-col gap-4 min-h-0">
        {/* Category selector */}
        {categories && categories.length > 0 && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-[var(--color-text-secondary)]">
              {t('scanner.selectCategory', 'Catégorie cible')}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {/* "All categories" chip */}
              <button
                type="button"
                onClick={() => { setSelectedCategoryId(null); resetScan(); }}
                className={`
                  inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                  border transition-all
                  ${selectedCategoryId === null
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-secondary)]'
                  }
                `}
              >
                {selectedCategoryId === null && <Check className="h-3 w-3" />}
                {t('scanner.allCategories', 'Toutes')}
              </button>
              {categories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                const barcodeOk = isBarcodeCompatible(cat);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => { setSelectedCategoryId(cat.id); resetScan(); }}
                    className={`
                      inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
                      border transition-all
                      ${isSelected
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                        : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-secondary)]'
                      }
                    `}
                    title={barcodeOk
                      ? t('scanner.barcodeSupported', 'Compatible code-barres / ISBN')
                      : t('scanner.barcodeNotSupported', 'Recherche texte uniquement')
                    }
                  >
                    {isSelected && <Check className="h-3 w-3" />}
                    {cat.iconType === 'emoji' && <span>{cat.icon}</span>}
                    <span>{cat.name}</span>
                    {barcodeOk && (
                      <BarcodeIcon className="h-3 w-3 opacity-50" />
                    )}
                  </button>
                );
              })}
            </div>
            {/* Hint about barcode compatibility */}
            {activeTab === 'barcode' && selectedCategoryId && !isBarcodeCompatible(
              categories.find((c) => c.id === selectedCategoryId)!,
            ) && (
              <p className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {t('scanner.categoryNotBarcodeHint', 'Cette catégorie n\'est pas optimisée pour la recherche par code-barres. Les résultats pourraient être limités.')}
              </p>
            )}
          </div>
        )}

        <Tabs tabs={tabs} activeTab={activeTab} onChange={handleTabChange} />

        <div className="flex-1 min-h-0 overflow-y-auto -mx-6 px-6">
          {/* ── Barcode Tab ── */}
          {activeTab === 'barcode' && (
            <div className="space-y-4">
              {!detectedBarcode && !loading && (
                <BarcodeScanner
                  onDetected={handleBarcodeDetected}
                  onError={(msg) => setError(msg)}
                />
              )}

              {/* Detected barcode info */}
              {detectedBarcode && (
                <div className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text)]">
                      <BarcodeIcon className="h-4 w-4 inline mr-2" />
                      {detectedBarcode}
                    </p>
                    {detectedType && (
                      <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                        {t('scanner.barcodeType', 'Type')}: {detectedType.toUpperCase()}
                      </p>
                    )}
                  </div>
                  <Button type="button" variant="secondary" size="sm" onClick={resetScan}>
                    {t('scanner.scanAgain', 'Re-scanner')}
                  </Button>
                </div>
              )}

              {/* Loading */}
              {loading && (
                <div className="flex flex-col items-center justify-center py-8 gap-2">
                  <Spinner size="lg" />
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {t('scanner.searching', 'Recherche en cours...')}
                  </p>
                </div>
              )}

              {/* Results */}
              {!loading && results.length > 0 && (
                <div className="space-y-2 pb-2">
                  <p className="text-xs text-[var(--color-text-secondary)] mb-3">
                    {results.length} {t('scanner.resultsCount', 'résultat(s)')}
                  </p>
                  {results.map((result) => (
                    <ScanResultCard
                      key={`${result.provider}-${result.sourceId}`}
                      result={result}
                      expanded={expandedId === `${result.provider}-${result.sourceId}`}
                      onToggle={() =>
                        setExpandedId(
                          expandedId === `${result.provider}-${result.sourceId}`
                            ? null
                            : `${result.provider}-${result.sourceId}`,
                        )
                      }
                      onImport={() => handleImport(result)}
                      importing={importing === result.sourceId}
                      t={t}
                    />
                  ))}
                </div>
              )}

              {/* Error / no results after search */}
              {!loading && error && (
                <div className="flex flex-col items-center justify-center py-6 gap-2 text-[var(--color-text-secondary)]">
                  <AlertCircle className="h-8 w-8" />
                  <p className="text-sm text-center">{error}</p>
                  {detectedBarcode && onSearchText && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => handleTextExtracted(detectedBarcode)}
                      className="mt-2"
                    >
                      {t('scanner.searchAsText', 'Rechercher comme texte')}
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Photo OCR Tab ── */}
          {activeTab === 'photo' && (
            <PhotoOCR
              onTextExtracted={handleTextExtracted}
              onError={(msg) => setError(msg)}
            />
          )}
        </div>
      </div>
    </Modal>
  );
}

// ──────────────────────────────────────────────
// Result Card (simplified version of TakoResultCard)
// ──────────────────────────────────────────────

interface ScanResultCardProps {
  result: TakoSearchResult;
  expanded: boolean;
  onToggle: () => void;
  onImport: () => void;
  importing: boolean;
  t: any;
}

function ScanResultCard({
  result,
  expanded,
  onToggle,
  onImport,
  importing,
  t,
}: ScanResultCardProps) {
  return (
    <div
      className={`
        rounded-xl border transition-all
        ${expanded
          ? 'border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5'
          : 'border-[var(--color-border)] bg-[var(--color-surface)]'
        }
      `}
    >
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-start gap-3 p-3 text-left"
      >
        <div className="shrink-0 w-14 h-14 rounded-lg bg-[var(--color-hover)] flex items-center justify-center overflow-hidden">
          {result.thumbnailUrl || result.imageUrl ? (
            <img
              src={result.thumbnailUrl || result.imageUrl}
              alt={result.title}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <ImageIcon className="h-6 w-6 text-[var(--color-text-secondary)] opacity-30" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-[var(--color-text)] truncate">
            {result.title}
          </h4>
          {result.subtitle && (
            <p className="text-xs text-[var(--color-text-secondary)] truncate mt-0.5">
              {result.subtitle}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <Badge variant="secondary" className="text-[10px]">
              {result.provider}
            </Badge>
            {result.year && (
              <span className="text-[10px] text-[var(--color-text-secondary)] flex items-center gap-0.5">
                <Calendar className="h-3 w-3" />
                {result.year}
              </span>
            )}
          </div>
        </div>

        <div className="shrink-0 mt-1">
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-[var(--color-text-secondary)]" />
          ) : (
            <ChevronDown className="h-4 w-4 text-[var(--color-text-secondary)]" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 border-t border-[var(--color-border)]/50 pt-3">
          <div className="flex gap-4">
            {result.imageUrl && (
              <div className="shrink-0 w-24 h-32 rounded-lg overflow-hidden bg-[var(--color-hover)]">
                <img
                  src={result.imageUrl}
                  alt={result.title}
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              </div>
            )}
            <div className="flex-1 min-w-0 space-y-2">
              {result.description && (
                <p className="text-xs text-[var(--color-text-secondary)] line-clamp-3">
                  {result.description}
                </p>
              )}
              {result.barcode && (
                <p className="text-xs text-[var(--color-text-secondary)]">
                  <BarcodeIcon className="h-3 w-3 inline mr-1" />
                  {result.barcode}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--color-border)]/50">
            <div className="flex gap-2">
              {result.sourceUrl && (
                <a
                  href={result.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                  {t('tako.viewSource', 'Voir la source')}
                </a>
              )}
            </div>
            <Button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onImport();
              }}
              disabled={importing}
              size="sm"
            >
              {importing ? (
                <Spinner size="sm" className="text-white" />
              ) : (
                <>
                  <Download className="h-3.5 w-3.5 mr-1" />
                  {t('tako.import', 'Importer')}
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
