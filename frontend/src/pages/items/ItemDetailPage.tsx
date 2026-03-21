import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Star,
  Calendar,
  Tag,
  Barcode,
  StickyNote,
  DollarSign,
  TrendingUp,
  Clock,
  MapPin,
  Award,
  Share2,
  Image,
  Video,
  Music,
  FileText,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  ZoomIn,
  ExternalLink as ExternalLinkIcon,
  Copy,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { itemService } from '../../services/item.service';
import { Button, Card, Badge, Spinner, Modal } from '../../components/ui';
import { useWebShare } from '../../hooks/useWebShare';
import type { Item, MediaItem } from '../../types/item.types';
import { StickerChecklist, type ChecklistData } from '../../components/common/StickerChecklist';
import { DocumentViewer } from '../../components/media/DocumentViewer';
import { getMediaUrl } from '../../utils/url';
import CategoryIcon from '../../components/common/CategoryIcon';

// ──────────────────────────────────────────────
// Image Lightbox component
// ──────────────────────────────────────────────
function Lightbox({
  images,
  startIndex,
  onClose,
}: {
  images: MediaItem[];
  startIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(startIndex);
  const img = images[index];

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && index < images.length - 1) setIndex(index + 1);
      if (e.key === 'ArrowLeft' && index > 0) setIndex(index - 1);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [index, images.length, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={onClose}>
      <div className="absolute top-4 right-4 z-50 flex gap-2">
        <a
          href={`${getMediaUrl(img.url)}`}
          download
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="rounded-full bg-white/20 p-2 text-white hover:bg-white/30 transition"
        >
          <Download className="h-5 w-5" />
        </a>
        <button onClick={onClose} className="rounded-full bg-white/20 p-2 text-white hover:bg-white/30 transition">
          <X className="h-5 w-5" />
        </button>
      </div>
      {images.length > 1 && index > 0 && (
        <button
          className="absolute left-4 z-50 rounded-full bg-white/20 p-2 text-white hover:bg-white/30 transition"
          onClick={(e) => { e.stopPropagation(); setIndex(index - 1); }}
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
      )}
      {images.length > 1 && index < images.length - 1 && (
        <button
          className="absolute right-4 z-50 rounded-full bg-white/20 p-2 text-white hover:bg-white/30 transition"
          onClick={(e) => { e.stopPropagation(); setIndex(index + 1); }}
        >
          <ChevronRight className="h-6 w-6" />
        </button>
      )}
      <img
        src={`${getMediaUrl(img.url)}`}
        alt={img.title || img.filename}
        className="max-h-[90vh] max-w-[90vw] object-contain"
        onClick={(e) => e.stopPropagation()}
      />
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-sm text-white">
          {index + 1} / {images.length}
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Main detail page
// ──────────────────────────────────────────────
export default function ItemDetailPage() {
  const { t } = useTranslation('items');
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [copying, setCopying] = useState(false);
  const [copyMedia, setCopyMedia] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [docViewerIndex, setDocViewerIndex] = useState<number | null>(null);
  const { shareItem } = useWebShare();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    itemService
      .getItemById(Number(id))
      .then((res) => setItem(res.data))
      .catch(() => {
        toast.error(t('errors.notFound'));
        navigate('/items');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await itemService.deleteItem(Number(id));
      toast.success(t('success.deleted'));
      navigate('/items');
    } catch {
      toast.error(t('errors.deleteFailed'));
    } finally {
      setDeleting(false);
      setDeleteOpen(false);
    }
  };

  const handleCopy = async () => {
    if (!item) return;
    try {
      setCopying(true);
      const res = await itemService.copyItem(item.id, { copyMedia });
      toast.success(t('success.copied', 'Item dupliqué'));
      navigate(`/items/${res.data.id}`);
    } catch {
      toast.error(t('errors.copyFailed', 'Erreur lors de la duplication'));
    } finally {
      setCopying(false);
      setCopyOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!item) return null;

  const metaEntries = [
    ...Object.entries(item.metadata || {}),
    ...Object.entries(item.categoryMetadata || {}).map(([k, v]) => [`cat:${k}`, v] as [string, any]),
  ].filter(
    ([, val]) => val.value !== null && val.value !== undefined && val.value !== '',
  );

  const images = item.images || [];
  const videos = item.videos || [];
  const audioFiles = item.audio || [];
  const documents = item.documents || [];
  const hasMedia = images.length > 0 || videos.length > 0 || audioFiles.length > 0 || documents.length > 0;
  const heroImage = images[0] || null;

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} o`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox images={images} startIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      )}

      {/* Back link */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 flex items-center gap-1 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('detail.back')}
      </button>

      {/* ═══ HERO: Image + Header ═══ */}
      <Card className="mb-6 overflow-hidden">
        <div className="flex flex-col md:flex-row">
          {/* Hero image or icon */}
          {heroImage ? (
            <div
              className="relative md:w-48 h-44 md:h-auto flex-shrink-0 cursor-pointer bg-[var(--color-hover)] group"
              onClick={() => setLightboxIndex(0)}
            >
              <img
                src={`${getMediaUrl(heroImage.url)}`}
                alt={item.name}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition">
                <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition" />
              </div>
              {images.length > 1 && (
                <div className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
                  +{images.length - 1}
                </div>
              )}
            </div>
          ) : (
            <div className="flex md:w-36 h-28 md:h-auto flex-shrink-0 items-center justify-center bg-[var(--color-hover)]">
              <span className="text-6xl opacity-50">{item.primaryType?.icon || '📦'}</span>
            </div>
          )}

          {/* Header info */}
          <div className="flex flex-1 flex-col justify-between p-6">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {item.primaryType && (
                  <Badge variant="secondary">
                    {item.primaryType.icon} {item.primaryType.name}
                  </Badge>
                )}
                {item.searchState && (
                  <Badge variant={item.searchState === 'owned' ? 'success' : 'warning'}>
                    {item.searchState === 'owned' ? t('detail.owned') : t('detail.looking')}
                  </Badge>
                )}
                {item.status && (
                  <Badge variant="default" className="text-white" style={{ backgroundColor: item.status.color }}>
                    {item.status.icon} {item.status.name}
                  </Badge>
                )}
              </div>

              <h1 className="text-2xl font-bold text-[var(--color-text)] mb-2">{item.name}</h1>

              {/* Rating */}
              {item.rating != null && item.rating > 0 && (
                <div className="flex items-center gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`h-5 w-5 ${s <= item.rating! ? 'fill-yellow-500 text-yellow-500' : 'text-[var(--color-border)]'}`}
                    />
                  ))}
                  <span className="ml-1 text-sm text-[var(--color-text-secondary)]">{item.rating}/5</span>
                </div>
              )}

              {/* Description */}
              {item.description && (
                <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-line line-clamp-4">
                  {item.description}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="mt-4 flex flex-wrap gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  const ok = await shareItem(item.name, item.id);
                  if (ok) toast.success(t('detail.shared', 'Lien copié !'));
                }}
              >
                <Share2 className="mr-1 h-4 w-4" />
                {t('detail.share', 'Partager')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCopyOpen(true)}
                disabled={copying}
                title={t('detail.copyTitle', 'Dupliquer cet item')}
              >
                <Copy className="mr-1 h-4 w-4" />
                {t('detail.copy', 'Dupliquer')}
              </Button>
              <Link to={`/items/${item.id}/edit`}>
                <Button variant="secondary" size="sm">
                  <Edit className="mr-1 h-4 w-4" />
                  {t('detail.edit')}
                </Button>
              </Link>
              <Button variant="danger" size="sm" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="mr-1 h-4 w-4" />
                {t('detail.delete')}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* ═══ MAIN GRID ═══ */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ─── Left column (2 cols) ─── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Metadata (EAV fields) */}
          {metaEntries.length > 0 && (
            <Card className="p-6">
              <h2 className="mb-4 text-lg font-semibold text-[var(--color-text)]">
                {t('detail.metadata')}
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {metaEntries.map(([key, meta]) => {
                  // Checklist fields: render as interactive grid (read-only on detail page)
                  if (meta.type === 'checklist' && meta.value && typeof meta.value === 'object' && !Array.isArray(meta.value)) {
                    return (
                      <div key={key} className="sm:col-span-2">
                        <div className="flex items-center gap-2 mb-2">
                          {meta.icon && <span className="text-lg">{meta.icon}</span>}
                          <p className="text-xs font-medium text-[var(--color-text-secondary)]">{meta.label}</p>
                        </div>
                        <StickerChecklist
                          value={meta.value as ChecklistData}
                          onChange={() => {}}
                          readOnly
                        />
                      </div>
                    );
                  }
                  return (
                  <div key={key} className="flex items-start gap-3 rounded-lg bg-[var(--color-hover)] p-3">
                    {meta.icon && <span className="mt-0.5 text-lg">{meta.icon}</span>}
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-[var(--color-text-secondary)]">{meta.label}</p>
                      <p className="text-sm font-medium text-[var(--color-text)]">
                        {Array.isArray(meta.value)
                          ? meta.value.join(', ')
                          : typeof meta.value === 'boolean'
                            ? meta.value ? '✅ Oui' : '❌ Non'
                            : String(meta.value)}
                      </p>
                    </div>
                  </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* External Links */}
          {item.externalLinks && item.externalLinks.length > 0 && (
            <Card className="p-6">
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-[var(--color-text)]">
                <ExternalLinkIcon className="h-5 w-5" />
                {t('detail.externalLinks', 'Liens externes')}
              </h2>
              <div className="flex flex-wrap gap-2">
                {item.externalLinks.map((link, idx) => (
                  <a
                    key={idx}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-hover)] px-3 py-2 text-sm font-medium text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition"
                  >
                    <ExternalLinkIcon className="h-4 w-4" />
                    {link.label || link.provider}
                  </a>
                ))}
              </div>
            </Card>
          )}

          {/* Notes */}
          {item.notes && (
            <Card className="p-6">
              <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-[var(--color-text)]">
                <StickyNote className="h-5 w-5" />
                {t('detail.notes')}
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] whitespace-pre-line">{item.notes}</p>
            </Card>
          )}

          {/* ═══ MEDIA GALLERY ═══ */}
          {hasMedia && (
            <Card className="p-6">
              <h2 className="mb-4 text-lg font-semibold text-[var(--color-text)]">
                Médias
              </h2>

              {/* Images grid */}
              {images.length > 0 && (
                <div className="mb-6">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)]">
                    <Image className="h-4 w-4" />
                    Images ({images.length})
                  </h3>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {images.map((img, idx) => (
                      <button
                        key={img.id}
                        type="button"
                        onClick={() => setLightboxIndex(idx)}
                        className="group relative aspect-square overflow-hidden rounded-lg bg-[var(--color-hover)]"
                      >
                        <img
                          src={`${getMediaUrl(img.thumbnailUrl || img.url)}`}
                          alt={img.title || img.filename}
                          className="h-full w-full object-cover transition group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition">
                          <ZoomIn className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition" />
                        </div>
                        {img.title && (
                          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                            <p className="text-xs text-white truncate">{img.title}</p>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Videos */}
              {videos.length > 0 && (
                <div className="mb-6">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)]">
                    <Video className="h-4 w-4" />
                    Vidéos ({videos.length})
                  </h3>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {videos.map((vid) => {
                      const isYouTube = vid.url.includes('youtube.com') || vid.url.includes('youtu.be');
                      const isVimeo = vid.url.includes('vimeo.com');
                      const ytMatch = vid.url.match(/(?:v=|youtu\.be\/)([\w-]{11})/);
                      const vimeoMatch = vid.url.match(/vimeo\.com\/(\d+)/);

                      return (
                        <div key={vid.id} className="overflow-hidden rounded-lg bg-[var(--color-hover)]">
                          {isYouTube && ytMatch ? (
                            <iframe
                              src={`https://www.youtube.com/embed/${ytMatch[1]}`}
                              title={vid.title || 'YouTube video'}
                              className="aspect-video w-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          ) : isVimeo && vimeoMatch ? (
                            <iframe
                              src={`https://player.vimeo.com/video/${vimeoMatch[1]}`}
                              title={vid.title || 'Vimeo video'}
                              className="aspect-video w-full"
                              allow="autoplay; fullscreen; picture-in-picture"
                              allowFullScreen
                            />
                          ) : (
                            <video
                              src={`${getMediaUrl(vid.url)}`}
                              controls
                              preload="metadata"
                              className="w-full"
                            />
                          )}
                          {vid.title && (
                            <p className="px-3 py-2 text-sm text-[var(--color-text)]">{vid.title}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Audio */}
              {audioFiles.length > 0 && (
                <div className="mb-6">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)]">
                    <Music className="h-4 w-4" />
                    Audio ({audioFiles.length})
                  </h3>
                  <div className="space-y-2">
                    {audioFiles.map((aud) => (
                      <div key={aud.id} className="flex items-center gap-3 rounded-lg bg-[var(--color-hover)] p-3">
                        <Music className="h-5 w-5 flex-shrink-0 text-[var(--color-primary)]" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--color-text)] truncate">
                            {aud.title || aud.filename}
                          </p>
                          <audio src={`${getMediaUrl(aud.url)}`} controls preload="metadata" className="mt-1 w-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents */}
              {documents.length > 0 && (
                <div>
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--color-text-secondary)]">
                    <FileText className="h-4 w-4" />
                    Documents ({documents.length})
                  </h3>
                  <div className="space-y-2">
                    {documents.map((doc, idx) => (
                      <button
                        key={doc.id}
                        type="button"
                        onClick={() => setDocViewerIndex(idx)}
                        className="flex w-full items-center gap-3 rounded-lg bg-[var(--color-hover)] p-3 hover:bg-[var(--color-border)] transition text-left"
                      >
                        <FileText className="h-5 w-5 flex-shrink-0 text-[var(--color-primary)]" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-[var(--color-text)] truncate">
                            {doc.title || doc.filename}
                          </p>
                          <p className="text-xs text-[var(--color-text-secondary)]">
                            {formatFileSize(doc.size)}
                          </p>
                        </div>
                        <ZoomIn className="h-4 w-4 text-[var(--color-text-secondary)]" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {docViewerIndex !== null && (
                <DocumentViewer
                  documents={documents}
                  startIndex={docViewerIndex}
                  onClose={() => setDocViewerIndex(null)}
                />
              )}
            </Card>
          )}
        </div>

        {/* ─── Sidebar (1 col) ─── */}
        <div className="space-y-6">
          {/* General info */}
          <Card className="p-6 space-y-4">
            <h3 className="text-sm font-semibold text-[var(--color-text)]">
              {t('detail.info')}
            </h3>
            {item.purchasePrice != null && (
              <div className="flex items-center gap-3">
                <DollarSign className="h-5 w-5 text-[var(--color-text-secondary)]" />
                <div>
                  <p className="text-xs text-[var(--color-text-secondary)]">{t('detail.purchasePrice')}</p>
                  <p className="text-sm font-semibold text-[var(--color-text)]">
                    {Number(item.purchasePrice).toFixed(2)} €
                  </p>
                </div>
              </div>
            )}
            {item.marketValue != null && (
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-xs text-[var(--color-text-secondary)]">{t('detail.marketValue')}</p>
                  <p className="text-sm font-semibold text-green-500">
                    {Number(item.marketValue).toFixed(2)} €
                  </p>
                </div>
              </div>
            )}
            {item.dateObtained && (
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-[var(--color-text-secondary)]" />
                <div>
                  <p className="text-xs text-[var(--color-text-secondary)]">{t('detail.dateObtained')}</p>
                  <p className="text-sm font-medium text-[var(--color-text)]">
                    {new Date(item.dateObtained).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
            {item.barcode && (
              <div className="flex items-center gap-3">
                <Barcode className="h-5 w-5 text-[var(--color-text-secondary)]" />
                <div>
                  <p className="text-xs text-[var(--color-text-secondary)]">{t('detail.barcode')}</p>
                  <p className="text-sm font-mono text-[var(--color-text)]">{item.barcode}</p>
                </div>
              </div>
            )}
            {/* Show "no info" placeholder when sidebar card would be empty */}
            {item.purchasePrice == null && item.marketValue == null && !item.dateObtained && !item.barcode && (
              <p className="text-xs text-[var(--color-text-secondary)] italic">
                Aucune information financière
              </p>
            )}
          </Card>

          {/* Categories */}
          {item.categories.length > 0 && (
            <Card className="p-6">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--color-text)]">
                <Tag className="h-4 w-4" />
                {t('detail.categories')}
              </h3>
              <div className="flex flex-wrap gap-2">
                {item.categories.map((cat) => (
                  <Link
                    key={cat.id}
                    to={`/categories/${cat.id}`}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-white transition hover:opacity-80"
                    style={{ backgroundColor: cat.color || '#3498db' }}
                  >
                    <CategoryIcon icon={cat.icon} iconType={cat.iconType} size="sm" /> {cat.name}
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {/* Grades */}
          {item.grades && item.grades.length > 0 && (
            <Card className="p-6">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--color-text)]">
                <Award className="h-4 w-4" />
                Condition
              </h3>
              <div className="flex flex-wrap gap-2">
                {item.grades.map((grade) => (
                  <Badge key={grade.id} variant="secondary">{grade.name}</Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Storage location */}
          {item.storageLocation && (
            <Card className="p-6">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--color-text)]">
                <MapPin className="h-4 w-4" />
                Emplacement
              </h3>
              <p className="text-sm font-medium text-[var(--color-text)]">{item.storageLocation.name}</p>
              {item.storageLocation.description && (
                <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                  {item.storageLocation.description}
                </p>
              )}
            </Card>
          )}

          {/* Dates */}
          <Card className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
              <Clock className="h-3.5 w-3.5" />
              {t('detail.addedOn')} {new Date(item.createdAt).toLocaleDateString()}
            </div>
            {item.updatedAt && (
              <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                <Clock className="h-3.5 w-3.5" />
                {t('detail.updatedOn')} {new Date(item.updatedAt).toLocaleDateString()}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Copy modal */}
      <Modal open={copyOpen} onClose={() => setCopyOpen(false)}>
        <div className="p-6">
          <h3 className="mb-2 text-lg font-semibold text-[var(--color-text)]">{t('copy.title', 'Dupliquer l\'item')}</h3>
          <p className="mb-4 text-sm text-[var(--color-text-secondary)]">{t('copy.confirm', 'Une copie de cet item va être créée.')}</p>
          <label className="mb-6 flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={copyMedia}
              onChange={(e) => setCopyMedia(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary)] accent-[var(--color-primary)]"
            />
            <span className="text-sm text-[var(--color-text)]">{t('copy.includeMedia', 'Copier les médias (images, vidéos, audio, documents)')}</span>
          </label>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setCopyOpen(false)}>
              {t('form.cancel')}
            </Button>
            <Button variant="primary" onClick={handleCopy} disabled={copying}>
              <Copy className="mr-1 h-4 w-4" />
              {copying ? t('copy.copying', 'Duplication...') : t('detail.copy', 'Dupliquer')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete modal */}
      <Modal open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <div className="p-6">
          <h3 className="mb-2 text-lg font-semibold text-[var(--color-text)]">{t('delete.title')}</h3>
          <p className="mb-6 text-sm text-[var(--color-text-secondary)]">{t('delete.confirm')}</p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
              {t('form.cancel')}
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? t('delete.deleting') : t('detail.delete')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
