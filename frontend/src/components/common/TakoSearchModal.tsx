import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Spinner, Skeleton } from '../ui/Spinner';
import { Badge } from '../ui/Badge';
import { Tooltip } from '../ui/Tooltip';
import {
  Search,
  Globe,
  ExternalLink,
  Download,
  ChevronDown,
  ChevronUp,
  X,
  AlertCircle,
  ImageIcon,
  Calendar,
  Barcode,
  Check,
} from 'lucide-react';
import { takoService } from '../../services/tako.service';
import type {
  TakoDomainInfo,
  TakoDomainName,
  TakoSearchResult,
} from '../../types/tako.types';
import { DOMAIN_ICONS as domainIcons } from '../../types/tako.types';

/**
 * Convertit un code langue ISO 639 en nom lisible via Intl.DisplayNames.
 * Retourne le code en majuscules si la conversion échoue.
 */
function formatLanguageCode(code: string): string {
  try {
    const names = new Intl.DisplayNames(['fr'], { type: 'language' });
    const name = names.of(code.toLowerCase());
    if (name && name !== code.toLowerCase()) {
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
  } catch {
    // fallback
  }
  return code.toUpperCase();
}

/** Médias téléchargés en proxy (URLs temporaires locales) */
export interface TakoDownloadedMediaItem {
  url: string;
  title?: string;
}

export interface TakoDownloadedMedia {
  images: string[];   // URLs locales temp d'images
  videos: TakoDownloadedMediaItem[];   // URLs + titres originaux
  documents: TakoDownloadedMediaItem[]; // URLs + titres originaux
}

interface TakoSearchModalProps {
  open: boolean;
  onClose: () => void;
  /** Called when user selects a result to import */
  onImport: (result: TakoSearchResult, media: TakoDownloadedMedia) => void;
  /** Pre-fill the search query */
  initialQuery?: string;
  /** Pre-select a domain */
  initialDomain?: TakoDomainName;
  /** All domains accessible for the current type (for multi-domain search) */
  relatedDomains?: TakoDomainName[];
  /** When true, keep previous results instead of resetting on open */
  keepResults?: boolean;
  /** Pre-select providers (from category defaults) */
  defaultProviders?: string[];
}

export function TakoSearchModal({
  open,
  onClose,
  onImport,
  initialQuery = '',
  initialDomain,
  relatedDomains,
  defaultProviders,
  keepResults = false,
}: TakoSearchModalProps) {
  const { t } = useTranslation('manage');

  // State
  const [domains, setDomains] = useState<TakoDomainInfo[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<TakoDomainName | ''>('');
  const [selectedProviders, setSelectedProviders] = useState<string[]>([]);
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<TakoSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingDomains, setLoadingDomains] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [importing, setImporting] = useState<string | null>(null);
  const [showProviders, setShowProviders] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  /**
   * Build a flat list of all providers from the related domains (or just the current domain).
   * Each entry includes its domain name so we can group them for multi-domain search.
   * Also includes any defaultProviders that belong to other domains (cross-type providers).
   */
  const getAllRelatedProviders = useCallback(
    (allDomains: TakoDomainInfo[]): { domain: string; name: string; description: string }[] => {
      const targetDomainNames = relatedDomains?.length
        ? relatedDomains
        : selectedDomain
          ? [selectedDomain]
          : [];
      const flat: { domain: string; name: string; description: string }[] = [];
      const addedNames = new Set<string>();
      for (const domainName of targetDomainNames) {
        const domain = allDomains.find((d) => d.name === domainName);
        if (domain) {
          for (const p of domain.providers) {
            flat.push({ domain: domainName, name: p.name, description: p.description });
            addedNames.add(p.name);
          }
        }
      }
      // Include defaultProviders from other domains (cross-type providers)
      if (defaultProviders?.length) {
        for (const provName of defaultProviders) {
          if (addedNames.has(provName)) continue;
          // Find this provider in any domain
          for (const domain of allDomains) {
            const prov = domain.providers.find((p) => p.name === provName);
            if (prov) {
              flat.push({ domain: domain.name, name: prov.name, description: prov.description });
              addedNames.add(provName);
              break;
            }
          }
        }
      }
      return flat;
    },
    [relatedDomains, selectedDomain, defaultProviders],
  );

  // Load domains on mount
  useEffect(() => {
    if (!open) return;
    loadDomains();
  }, [open]);

  // Focus search input when modal opens
  useEffect(() => {
    if (open && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 200);
    }
  }, [open]);

  // Reset state when modal opens (only on open transition, not on every prop change)
  useEffect(() => {
    if (open) {
      if (keepResults && results.length > 0) {
        // Coming back from import cancel — keep results, just clear transient state
        setError(null);
        setImporting(null);
      } else {
        setQuery(initialQuery);
        if (initialDomain) {
          setSelectedDomain(initialDomain);
        }
        // Apply defaultProviders immediately (don't rely on loadDomains which may race)
        if (defaultProviders?.length) {
          setSelectedProviders([...defaultProviders]);
          setShowProviders(true);
        } else {
          setSelectedProviders([]);
          setShowProviders(false);
        }
        setResults([]);
        setError(null);
        setExpandedId(null);
        setImporting(null);
        setHasSearched(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const loadDomains = async () => {
    if (domains.length > 0) {
      // Already loaded — defaultProviders are applied in the reset useEffect
      return;
    }
    setLoadingDomains(true);
    try {
      const response = await takoService.getDomains();
      const loadedDomains = response.data.domains;
      setDomains(loadedDomains);
      const activeDomain = initialDomain || (loadedDomains.length > 0 ? loadedDomains[0].name : '');
      if (!selectedDomain && loadedDomains.length > 0) {
        setSelectedDomain(activeDomain as TakoDomainName);
      }
    } catch (e) {
      setError(t('tako.errorLoadingDomains', 'Impossible de charger les domaines'));
    } finally {
      setLoadingDomains(false);
    }
  };

  const handleSearch = useCallback(async () => {
    if (!query.trim() || !selectedDomain) return;

    setLoading(true);
    setError(null);
    setResults([]);
    setExpandedId(null);
    setHasSearched(true);

    try {
      // Group selected providers by their domain for multi-domain search
      const allProviders = getAllRelatedProviders(domains);
      const providersByDomain = new Map<string, string[]>();

      if (selectedProviders.length > 0) {
        // Map each selected provider to its domain
        for (const provName of selectedProviders) {
          const entry = allProviders.find((p) => p.name === provName);
          const domain = entry?.domain || selectedDomain;
          if (!providersByDomain.has(domain)) {
            providersByDomain.set(domain, []);
          }
          providersByDomain.get(domain)!.push(provName);
        }
      } else {
        // No specific providers selected → search with defaults on the selected domain
        providersByDomain.set(selectedDomain, []);
      }

      // Launch parallel searches across all domains that have selected providers
      const searchPromises = Array.from(providersByDomain.entries()).map(
        async ([domain, providers]) => {
          const response = await takoService.search({
            query: query.trim(),
            domain: domain as TakoDomainName,
            providers: providers.length > 0 ? providers : undefined,
            maxResults: 20,
            lang: 'fr',
          });
          // Tag results with their domain for detail fetching
          return response.data.results.map((r) => ({
            ...r,
            metadata: { ...r.metadata, _domain: domain },
          }));
        },
      );

      const allResults = await Promise.all(searchPromises);
      const merged = allResults.flat();
      setResults(merged);

      if (merged.length === 0) {
        setError(t('tako.noResults', 'Aucun résultat trouvé'));
      }
    } catch (e: any) {
      setError(
        e?.response?.data?.message ||
          t('tako.searchError', 'Erreur lors de la recherche'),
      );
    } finally {
      setLoading(false);
    }
  }, [query, selectedDomain, selectedProviders, domains, getAllRelatedProviders, t]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleImport = async (result: TakoSearchResult) => {
    setImporting(result.sourceId);
    try {
      // ── 1. Fetch full details (search results are lightweight, detail has developers/publishers etc.) ──
      let fullResult = result;
      try {
        const domain = result.metadata?._domain || selectedDomain;
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
        // Fallback to search result if detail fails
      }

      // ── 2. Proxy-download all available media ──
      const downloadedMedia: TakoDownloadedMedia = {
        images: [],
        videos: [],
        documents: [],
      };

      // Helper to proxy-download a file and return temp URL
      const proxyDl = async (url: string, suffix: string): Promise<string | null> => {
        try {
          const dlRes = await takoService.proxyDownload(url, `${fullResult.provider}_${fullResult.sourceId}_${suffix}`);
          return dlRes.data.url;
        } catch {
          return null;
        }
      };

      // 2a. Primary cover image
      const imgUrl = fullResult.imageUrl || result.imageUrl;
      if (imgUrl) {
        const tempUrl = await proxyDl(imgUrl, 'cover');
        if (tempUrl) downloadedMedia.images.push(tempUrl);
      }

      // 2b. Extra images (gallery, screenshots, backdrops) — limit to 10
      if (fullResult.extraImages?.length) {
        const extraToDownload = fullResult.extraImages.slice(0, 10);
        for (let i = 0; i < extraToDownload.length; i++) {
          // Skip if same as cover
          if (extraToDownload[i].url === imgUrl) continue;
          const tempUrl = await proxyDl(extraToDownload[i].url, `img_${i}`);
          if (tempUrl) downloadedMedia.images.push(tempUrl);
        }
      }

      // 2c. Videos — limit to 5, skip YouTube/Vimeo links (not downloadable via proxy)
      if (fullResult.videos?.length) {
        const directVideos = fullResult.videos
          .filter(v => {
            const u = v.proxyUrl || v.url;
            return !u.includes('youtube.com') && !u.includes('youtu.be') && !u.includes('vimeo.com');
          })
          .slice(0, 5);
        for (let i = 0; i < directVideos.length; i++) {
          const tempUrl = await proxyDl(directVideos[i].proxyUrl || directVideos[i].url, `vid_${i}`);
          if (tempUrl) downloadedMedia.videos.push({ url: tempUrl, title: directVideos[i].title });
        }
        // Keep YouTube links as-is (they'll be stored as external URLs)
        const youtubeVideos = fullResult.videos
          .filter(v => {
            const u = v.proxyUrl || v.url;
            return u.includes('youtube.com') || u.includes('youtu.be') || u.includes('vimeo.com');
          })
          .slice(0, 5);
        for (const yt of youtubeVideos) {
          downloadedMedia.videos.push({ url: yt.url, title: yt.title });
        }
      }

      // 2d. Documents (PDFs, manuals) — limit to 10
      if (fullResult.documents?.length) {
        const docsToDownload = fullResult.documents.slice(0, 10);
        for (let i = 0; i < docsToDownload.length; i++) {
          if (i > 0) await new Promise(r => setTimeout(r, 800));
          const tempUrl = await proxyDl(docsToDownload[i].url, `doc_${i}`);
          if (tempUrl) downloadedMedia.documents.push({ url: tempUrl, title: docsToDownload[i].title });
        }
      }

      onImport(fullResult, downloadedMedia);
    } finally {
      setImporting(null);
    }
  };

  const toggleProvider = (provider: string) => {
    setSelectedProviders((prev) =>
      prev.includes(provider)
        ? prev.filter((p) => p !== provider)
        : [...prev, provider],
    );
  };

  // Build provider list: from all related domains if available, otherwise from current domain
  const visibleProviders = getAllRelatedProviders(domains);
  const hasMultipleProviders = visibleProviders.length > 1;
  // Check if providers span multiple domains (for display grouping)
  const providerDomainNames = [...new Set(visibleProviders.map((p) => p.domain))];
  const isMultiDomain = providerDomainNames.length > 1;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('tako.title', 'Recherche web')}
      description={t('tako.description', 'Recherchez des informations via Tako API')}
      className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
    >
      <div className="flex flex-col gap-4 min-h-0">
        {/* ── Barre de recherche ── */}
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              ref={searchInputRef}
              placeholder={t('tako.searchPlaceholder', 'Rechercher...')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              icon={<Search className="h-4 w-4" />}
            />
          </div>
          <Button
            type="button"
            onClick={handleSearch}
            disabled={loading || !query.trim() || !selectedDomain}
          >
            {loading ? (
              <Spinner size="sm" className="text-white" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* ── Sélecteur de domaine (grille de boutons) ── */}
        {loadingDomains ? (
          <div className="flex gap-2 flex-wrap">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-24" />
            ))}
          </div>
        ) : (
          <div className="flex gap-1.5 flex-wrap">
            {domains.map((d) => (
              <button
                key={d.name}
                type="button"
                onClick={() => {
                  if (d.name !== selectedDomain) {
                    setSelectedDomain(d.name);
                    // When changing domain, reset providers unless we have relatedDomains
                    // (in which case the provider filter spans all domains)
                    if (!relatedDomains?.length) {
                      setSelectedProviders([]);
                      setShowProviders(false);
                    }
                  }
                }}
                className={`
                  px-3 py-1.5 rounded-full text-xs font-medium transition-all
                  ${
                    selectedDomain === d.name
                      ? 'bg-[var(--color-primary)] text-white shadow-sm'
                      : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:bg-[var(--color-hover)]'
                  }
                `}
              >
                <span className="mr-1">{domainIcons[d.name]}</span>
                {d.displayName}
              </button>
            ))}
          </div>
        )}

        {/* ── Sélecteur de providers (optionnel) ── */}
        {hasMultipleProviders && (
          <div>
            <button
              type="button"
              onClick={() => setShowProviders(!showProviders)}
              className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition"
            >
              {showProviders ? (
                <ChevronUp className="h-3 w-3" />
              ) : (
                <ChevronDown className="h-3 w-3" />
              )}
              {t('tako.filterProviders', 'Filtrer par provider')}
              {selectedProviders.length > 0 && (
                <Badge variant="default" className="ml-1 text-[10px]">
                  {selectedProviders.length}
                </Badge>
              )}
            </button>
            {showProviders && (
              <div className="mt-2 flex gap-1.5 flex-wrap">
                {isMultiDomain
                  ? /* Group providers by domain with subtle separators */
                    providerDomainNames.map((domainName, idx) => {
                      const domainProviders = visibleProviders.filter((p) => p.domain === domainName);
                      const domainInfo = domains.find((d) => d.name === domainName);
                      return (
                        <div key={domainName} className="flex items-center gap-1.5 flex-wrap">
                          {idx > 0 && (
                            <span className="text-[var(--color-border)] mx-0.5">|</span>
                          )}
                          <span className="text-[10px] text-[var(--color-text-secondary)] opacity-60" title={domainInfo?.displayName || domainName}>
                            {domainIcons[domainName as TakoDomainName] || '📦'}
                          </span>
                          {domainProviders.map((p) => (
                            <Tooltip
                              key={p.name}
                              content={p.description || null}
                              position="bottom"
                              wrap
                              maxWidth="220px"
                              disabled={!p.description}
                            >
                              <button
                                type="button"
                                onClick={() => toggleProvider(p.name)}
                                className={`
                                  px-2.5 py-1 rounded-lg text-xs transition-all
                                  ${
                                    selectedProviders.includes(p.name)
                                      ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)] border border-[var(--color-primary)]'
                                      : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:bg-[var(--color-hover)]'
                                  }
                                `}
                              >
                                {selectedProviders.includes(p.name) && (
                                  <Check className="h-3 w-3 inline mr-1" />
                                )}
                                {p.name}
                              </button>
                            </Tooltip>
                          ))}
                        </div>
                      );
                    })
                  : /* Single domain: flat list */
                    visibleProviders.map((p) => (
                      <Tooltip
                        key={p.name}
                        content={p.description || null}
                        position="bottom"
                        wrap
                        maxWidth="220px"
                        disabled={!p.description}
                      >
                        <button
                          type="button"
                          onClick={() => toggleProvider(p.name)}
                          className={`
                            px-2.5 py-1 rounded-lg text-xs transition-all
                            ${
                              selectedProviders.includes(p.name)
                                ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)] border border-[var(--color-primary)]'
                                : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border)] hover:bg-[var(--color-hover)]'
                            }
                          `}
                        >
                          {selectedProviders.includes(p.name) && (
                            <Check className="h-3 w-3 inline mr-1" />
                          )}
                          {p.name}
                        </button>
                      </Tooltip>
                    ))
                }
                {selectedProviders.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedProviders([])}
                    className="px-2 py-1 rounded-lg text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition"
                  >
                    <X className="h-3 w-3 inline mr-0.5" />
                    {t('tako.clearProviders', 'Tous')}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Résultats ── */}
        <div className="flex-1 min-h-0 overflow-y-auto -mx-6 px-6">
          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Spinner size="lg" />
              <p className="text-sm text-[var(--color-text-secondary)]">
                {t('tako.searching', 'Recherche en cours...')}
              </p>
            </div>
          )}

          {/* Error / No results */}
          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-[var(--color-text-secondary)]">
              <AlertCircle className="h-8 w-8" />
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Initial state */}
          {!loading && !error && !hasSearched && (
            <div className="flex flex-col items-center justify-center py-8 gap-2 text-[var(--color-text-secondary)]">
              <Globe className="h-12 w-12 opacity-30" />
              <p className="text-sm">
                {t('tako.initialHint', 'Sélectionnez un domaine et entrez votre recherche')}
              </p>
            </div>
          )}

          {/* Results list */}
          {!loading && results.length > 0 && (
            <div className="space-y-2 pb-2">
              <p className="text-xs text-[var(--color-text-secondary)] mb-3">
                {results.length} {t('tako.resultsCount', 'résultat(s)')}
              </p>
              {results.map((result) => (
                <TakoResultCard
                  key={`${result.provider}-${result.sourceId}`}
                  result={result}
                  expanded={expandedId === result.sourceId}
                  onToggle={() =>
                    setExpandedId(
                      expandedId === result.sourceId ? null : result.sourceId,
                    )
                  }
                  onImport={() => handleImport(result)}
                  importing={importing === result.sourceId}
                  t={t}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ──────────────────────────────────────────────
// Result Card
// ──────────────────────────────────────────────

interface TakoResultCardProps {
  result: TakoSearchResult;
  expanded: boolean;
  onToggle: () => void;
  onImport: () => void;
  importing: boolean;
  t: any;
}

function TakoResultCard({
  result,
  expanded,
  onToggle,
  onImport,
  importing,
  t,
}: TakoResultCardProps) {
  return (
    <div
      className={`
        rounded-xl border transition-all
        ${
          expanded
            ? 'border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5'
            : 'border-[var(--color-border)] bg-[var(--color-surface)]'
        }
      `}
    >
      {/* Header row — Always visible */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-start gap-3 p-3 text-left"
      >
        {/* Thumbnail */}
        <div className="shrink-0 w-14 h-14 rounded-lg bg-[var(--color-hover)] flex items-center justify-center overflow-hidden">
          {result.thumbnailUrl || result.imageUrl ? (
            <img
              src={result.thumbnailUrl || result.imageUrl}
              alt={result.title}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
                (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
              }}
            />
          ) : null}
          <ImageIcon
            className={`h-6 w-6 text-[var(--color-text-secondary)] opacity-30 ${
              result.thumbnailUrl || result.imageUrl ? 'hidden' : ''
            }`}
          />
        </div>

        {/* Info */}
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
            {result.barcode && (
              <span className="text-[10px] text-[var(--color-text-secondary)] flex items-center gap-0.5">
                <Barcode className="h-3 w-3" />
                {result.barcode}
              </span>
            )}
          </div>
        </div>

        {/* Expand chevron */}
        <div className="shrink-0 mt-1">
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-[var(--color-text-secondary)]" />
          ) : (
            <ChevronDown className="h-4 w-4 text-[var(--color-text-secondary)]" />
          )}
        </div>
      </button>

      {/* Expanded details */}
      {expanded && (
        <div className="px-3 pb-3 border-t border-[var(--color-border)]/50 pt-3">
          <div className="flex gap-4">
            {/* Large image */}
            {result.imageUrl && (
              <div className="shrink-0 w-28 h-36 rounded-lg overflow-hidden bg-[var(--color-hover)]">
                <img
                  src={result.imageUrl}
                  alt={result.title}
                  className="w-full h-full object-contain"
                  loading="lazy"
                />
              </div>
            )}

            {/* Details */}
            <div className="flex-1 min-w-0 space-y-2">
              {/* Description */}
              {result.description && (
                <p className="text-xs text-[var(--color-text-secondary)] line-clamp-4">
                  {result.description}
                </p>
              )}

              {/* Metadata preview */}
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {renderMetadata(result)}
              </div>
            </div>
          </div>

          {/* Actions */}
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

// ──────────────────────────────────────────────
// Metadata renderer (domain-specific)
// ──────────────────────────────────────────────

function renderMetadata(result: TakoSearchResult) {
  const meta = result.metadata;
  if (!meta) return null;

  const items: { label: string; value: string }[] = [];

  // Books
  if (meta.authors?.length) {
    // Handle both string[] and {name,role}[] formats
    const authorNames = meta.authors.map((a: any) => typeof a === 'string' ? a : a?.name || String(a));
    items.push({ label: 'Auteur(s)', value: authorNames.join(', ') });
  }
  if (meta.publisher) {
    items.push({ label: 'Éditeur', value: meta.publisher });
  }
  if (meta.pageCount) {
    items.push({ label: 'Pages', value: String(meta.pageCount) });
  }
  if (meta.isbn13 || meta.isbn10) {
    items.push({ label: 'ISBN', value: meta.isbn13 || meta.isbn10 });
  }
  if (meta.language) {
    items.push({ label: 'Langue', value: formatLanguageCode(meta.language) });
  }

  // Videogames
  if (meta.platforms?.length) {
    items.push({
      label: 'Plates-formes',
      value: (meta.platforms as string[]).slice(0, 5).join(', '),
    });
  }
  if (meta.genres?.length) {
    items.push({
      label: 'Genre(s)',
      value: (meta.genres as string[]).slice(0, 4).join(', '),
    });
  }
  if (meta.metacritic) {
    items.push({ label: 'Metacritic', value: String(meta.metacritic) });
  }
  if (meta.developers?.length) {
    items.push({ label: 'Développeur', value: meta.developers.join(', ') });
  }

  // Construction-toys
  if (meta.setNum) {
    items.push({ label: 'Référence', value: meta.setNum });
  }
  if (meta.numParts || meta.pieces) {
    items.push({
      label: 'Pièces',
      value: String(meta.numParts || meta.pieces),
    });
  }
  if (meta.theme) {
    items.push({ label: 'Thème', value: meta.theme });
  }

  // Music
  if (meta.artist || meta.artists?.length) {
    items.push({
      label: 'Artiste',
      value: meta.artist || meta.artists?.join(', '),
    });
  }
  if (meta.label) {
    items.push({ label: 'Label', value: meta.label });
  }
  if (meta.format) {
    items.push({ label: 'Format', value: meta.format });
  }

  // Media
  if (meta.runtime) {
    items.push({ label: 'Durée', value: `${meta.runtime} min` });
  }
  if (meta.director) {
    items.push({ label: 'Réalisateur', value: meta.director });
  }
  if (meta.voteAverage) {
    items.push({ label: 'Note', value: `${meta.voteAverage}/10` });
  }

  // Anime/Manga
  if (meta.episodes) {
    items.push({ label: 'Épisodes', value: String(meta.episodes) });
  }
  if (meta.chapters) {
    items.push({ label: 'Chapitres', value: String(meta.chapters) });
  }
  if (meta.studios?.length) {
    items.push({ label: 'Studio', value: meta.studios.join(', ') });
  }
  if (meta.score) {
    items.push({ label: 'Score', value: String(meta.score) });
  }

  // Boardgames
  if (meta.minPlayers) {
    items.push({
      label: 'Joueurs',
      value: meta.maxPlayers
        ? `${meta.minPlayers}-${meta.maxPlayers}`
        : String(meta.minPlayers),
    });
  }
  if (meta.playingTime) {
    items.push({ label: 'Durée', value: `${meta.playingTime} min` });
  }

  // TCG
  if (meta.rarity) {
    items.push({ label: 'Rareté', value: meta.rarity });
  }
  if (meta.setName) {
    items.push({ label: 'Set', value: meta.setName });
  }

  // Collectibles
  if (meta.brand) {
    items.push({ label: 'Marque', value: meta.brand });
  }
  if (meta.series) {
    items.push({ label: 'Série', value: meta.series });
  }

  if (items.length === 0) return null;

  return items.slice(0, 8).map((item) => (
    <span
      key={item.label}
      className="text-[10px] text-[var(--color-text-secondary)]"
    >
      <span className="font-medium text-[var(--color-text)]">
        {item.label}:
      </span>{' '}
      {item.value}
    </span>
  ));
}
