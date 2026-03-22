import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Check,
  CheckSquare,
  Square,
  Image,
  Video,
  FileText,
  ArrowRight,
  Download,
  ExternalLink,
} from 'lucide-react';
import { Modal, Button } from '../ui';
import type { TakoDownloadedMedia } from './TakoSearchModal';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface ImportFieldPreview {
  key: string;
  label: string;
  currentValue: string;
  newValue: string;
  category: 'basic' | 'metadata' | 'links';
}

interface TakoImportPreviewProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: (
    selectedFieldKeys: string[],
    selectedMedia: { images: number[]; videos: number[]; documents: number[] },
  ) => void;
  fields: ImportFieldPreview[];
  media: TakoDownloadedMedia;
  coverUrl: string | undefined; // URL de la cover pour la preview
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────
import { getMediaUrl } from '../../utils/url';

function truncate(str: string, max: number): string {
  if (!str) return '';
  return str.length > max ? str.substring(0, max) + '…' : str;
}

// ──────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────

/** Header de section avec toggle Tout/Rien */
function SectionHeader({
  title,
  icon,
  count,
  selectedCount,
  onSelectAll,
  onSelectNone,
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  selectedCount: number;
  onSelectAll: () => void;
  onSelectNone: () => void;
}) {
  if (count === 0) return null;
  return (
    <div className="flex items-center justify-between py-2 border-b border-[var(--color-border)]">
      <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text)]">
        {icon}
        <span>{title}</span>
        <span className="text-xs font-normal text-[var(--color-text-secondary)]">
          ({selectedCount}/{count})
        </span>
      </div>
      <div className="flex gap-1">
        <button
          type="button"
          onClick={onSelectAll}
          className="px-2 py-0.5 text-xs rounded bg-[var(--color-primary)]/10 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/20 transition"
        >
          Tout
        </button>
        <button
          type="button"
          onClick={onSelectNone}
          className="px-2 py-0.5 text-xs rounded bg-[var(--color-hover)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)] transition"
        >
          Rien
        </button>
      </div>
    </div>
  );
}

/** Ligne de champ avec checkbox */
function FieldRow({
  field,
  selected,
  onToggle,
}: {
  field: ImportFieldPreview;
  selected: boolean;
  onToggle: () => void;
}) {
  const hasExisting = field.currentValue !== '' && field.currentValue !== undefined;

  return (
    <label
      className="flex items-start gap-3 py-1.5 px-1 rounded cursor-pointer hover:bg-[var(--color-hover)] transition group"
      onClick={(e) => {
        e.preventDefault();
        onToggle();
      }}
    >
      {/* Checkbox */}
      <div className="mt-0.5 shrink-0">
        {selected ? (
          <CheckSquare className="h-4 w-4 text-[var(--color-primary)]" />
        ) : (
          <Square className="h-4 w-4 text-[var(--color-text-secondary)]" />
        )}
      </div>

      {/* Field content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[var(--color-text-secondary)]">{field.label}</span>
          {hasExisting && (
            <span className="text-[10px] px-1.5 py-0 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              remplace
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5">
          {hasExisting && (
            <>
              <span className="text-xs text-[var(--color-text-secondary)] line-through truncate max-w-[40%]">
                {truncate(field.currentValue, 50)}
              </span>
              <ArrowRight className="h-3 w-3 shrink-0 text-[var(--color-text-secondary)]" />
            </>
          )}
          <span className="text-xs text-[var(--color-text)] truncate">
            {truncate(field.newValue, 80)}
          </span>
        </div>
      </div>
    </label>
  );
}

// ──────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────

export function TakoImportPreview({
  open,
  onCancel,
  onConfirm,
  fields,
  media,
  coverUrl,
}: TakoImportPreviewProps) {
  const { t } = useTranslation('manage');

  // ── Field selections ──
  const [selectedFields, setSelectedFields] = useState<Set<string>>(() => new Set(fields.map((f) => f.key)));

  // ── Media selections ──
  const [selectedImages, setSelectedImages] = useState<Set<number>>(() => new Set(media.images.map((_, i) => i)));
  const [selectedVideos, setSelectedVideos] = useState<Set<number>>(() => new Set(media.videos.map((_, i) => i)));
  const [selectedDocs, setSelectedDocs] = useState<Set<number>>(() => new Set(media.documents.map((_, i) => i)));

  // Reset selections when fields/media change
  React.useEffect(() => {
    setSelectedFields(new Set(fields.map((f) => f.key)));
  }, [fields]);
  React.useEffect(() => {
    setSelectedImages(new Set(media.images.map((_, i) => i)));
    setSelectedVideos(new Set(media.videos.map((_, i) => i)));
    setSelectedDocs(new Set(media.documents.map((_, i) => i)));
  }, [media]);

  // ── Computed groups ──
  const basicFields = useMemo(() => fields.filter((f) => f.category === 'basic'), [fields]);
  const metaFields = useMemo(() => fields.filter((f) => f.category === 'metadata'), [fields]);
  const linkFields = useMemo(() => fields.filter((f) => f.category === 'links'), [fields]);

  // ── Toggle helpers ──
  const toggleField = (key: string) => {
    setSelectedFields((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const toggleImage = (i: number) => {
    setSelectedImages((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const toggleVideo = (i: number) => {
    setSelectedVideos((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const toggleDoc = (i: number) => {
    setSelectedDocs((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const selectAllFields = (category: 'basic' | 'metadata' | 'links') => {
    const source = category === 'basic' ? basicFields : category === 'metadata' ? metaFields : linkFields;
    const keys = source.map((f) => f.key);
    setSelectedFields((prev) => {
      const next = new Set(prev);
      keys.forEach((k) => next.add(k));
      return next;
    });
  };
  const selectNoneFields = (category: 'basic' | 'metadata' | 'links') => {
    const source = category === 'basic' ? basicFields : category === 'metadata' ? metaFields : linkFields;
    const keys = source.map((f) => f.key);
    setSelectedFields((prev) => {
      const next = new Set(prev);
      keys.forEach((k) => next.delete(k));
      return next;
    });
  };

  // ── Counts ──
  const selectedBasicCount = basicFields.filter((f) => selectedFields.has(f.key)).length;
  const selectedMetaCount = metaFields.filter((f) => selectedFields.has(f.key)).length;
  const selectedLinkCount = linkFields.filter((f) => selectedFields.has(f.key)).length;
  const totalSelected =
    selectedFields.size + selectedImages.size + selectedVideos.size + selectedDocs.size;

  // ── Confirm ──
  const handleConfirm = () => {
    onConfirm(
      Array.from(selectedFields),
      {
        images: Array.from(selectedImages).sort((a, b) => a - b),
        videos: Array.from(selectedVideos).sort((a, b) => a - b),
        documents: Array.from(selectedDocs).sort((a, b) => a - b),
      },
    );
  };

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={t('tako.importPreview.title', "Prévisualisation de l'import")}
      description={t('tako.importPreview.description', 'Sélectionnez les données et médias à importer')}
      className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col"
    >
      <div className="flex flex-col gap-2 min-h-0 overflow-y-auto pr-1 -mr-1 max-h-[60vh]">
        {/* ════════════════════════════════════════════ */}
        {/* COVER PREVIEW (miniature)                   */}
        {/* ════════════════════════════════════════════ */}
        {coverUrl && (
          <div className="flex items-center gap-3 pb-2 border-b border-[var(--color-border)]">
            <img
              src={getMediaUrl(coverUrl)}
              alt="Cover"
              className="w-12 h-16 object-cover rounded shadow-sm"
            />
            <div className="text-xs text-[var(--color-text-secondary)]">
              {fields.find(f => f.key === 'name')?.newValue || 'Import Tako'}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════ */}
        {/* INFORMATIONS DE BASE                        */}
        {/* ════════════════════════════════════════════ */}
        {basicFields.length > 0 && (
          <div>
            <SectionHeader
              title={t('tako.importPreview.basicInfo', 'Informations de base')}
              icon={<ClipboardIcon />}
              count={basicFields.length}
              selectedCount={selectedBasicCount}
              onSelectAll={() => selectAllFields('basic')}
              onSelectNone={() => selectNoneFields('basic')}
            />
            <div className="mt-1">
              {basicFields.map((f) => (
                <FieldRow key={f.key} field={f} selected={selectedFields.has(f.key)} onToggle={() => toggleField(f.key)} />
              ))}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════ */}
        {/* MÉTADONNÉES                                 */}
        {/* ════════════════════════════════════════════ */}
        {metaFields.length > 0 && (
          <div>
            <SectionHeader
              title={t('tako.importPreview.metadata', 'Métadonnées')}
              icon={<MetadataIcon />}
              count={metaFields.length}
              selectedCount={selectedMetaCount}
              onSelectAll={() => selectAllFields('metadata')}
              onSelectNone={() => selectNoneFields('metadata')}
            />
            <div className="mt-1">
              {metaFields.map((f) => (
                <FieldRow key={f.key} field={f} selected={selectedFields.has(f.key)} onToggle={() => toggleField(f.key)} />
              ))}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════ */}
        {/* LIENS EXTERNES                              */}
        {/* ════════════════════════════════════════════ */}
        {linkFields.length > 0 && (
          <div>
            <SectionHeader
              title={t('tako.importPreview.links', 'Liens externes')}
              icon={<ExternalLink className="h-4 w-4" />}
              count={linkFields.length}
              selectedCount={selectedLinkCount}
              onSelectAll={() => selectAllFields('links')}
              onSelectNone={() => selectNoneFields('links')}
            />
            <div className="mt-1">
              {linkFields.map((f) => (
                <FieldRow key={f.key} field={f} selected={selectedFields.has(f.key)} onToggle={() => toggleField(f.key)} />
              ))}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════ */}
        {/* IMAGES                                      */}
        {/* ════════════════════════════════════════════ */}
        {media.images.length > 0 && (
          <div>
            <SectionHeader
              title={t('tako.importPreview.images', 'Images')}
              icon={<Image className="h-4 w-4" />}
              count={media.images.length}
              selectedCount={selectedImages.size}
              onSelectAll={() => setSelectedImages(new Set(media.images.map((_, i) => i)))}
              onSelectNone={() => setSelectedImages(new Set())}
            />
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-2">
              {media.images.map((imgUrl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleImage(i)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImages.has(i)
                      ? 'border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]/50'
                      : 'border-transparent opacity-40 grayscale'
                  }`}
                >
                  <img
                    src={getMediaUrl(imgUrl)}
                    alt={`Image ${i + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {selectedImages.has(i) && (
                    <div className="absolute top-1 right-1 bg-[var(--color-primary)] rounded-full p-0.5">
                      <Check className="h-3 w-3 text-white" />
                    </div>
                  )}
                  {i === 0 && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[10px] text-center text-white py-0.5">
                      Cover
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════ */}
        {/* VIDÉOS                                      */}
        {/* ════════════════════════════════════════════ */}
        {media.videos.length > 0 && (
          <div>
            <SectionHeader
              title={t('tako.importPreview.videos', 'Vidéos')}
              icon={<Video className="h-4 w-4" />}
              count={media.videos.length}
              selectedCount={selectedVideos.size}
              onSelectAll={() => setSelectedVideos(new Set(media.videos.map((_, i) => i)))}
              onSelectNone={() => setSelectedVideos(new Set())}
            />
            <div className="flex flex-col gap-1 mt-1">
              {media.videos.map((vid, i) => {
                const v = typeof vid === 'string' ? { url: vid } : vid;
                const isYT = v.url.includes('youtube.com') || v.url.includes('youtu.be') || v.url.includes('vimeo.com');
                return (
                  <label
                    key={i}
                    className="flex items-center gap-3 py-1.5 px-1 rounded cursor-pointer hover:bg-[var(--color-hover)] transition"
                    onClick={(e) => { e.preventDefault(); toggleVideo(i); }}
                  >
                    {selectedVideos.has(i) ? (
                      <CheckSquare className="h-4 w-4 text-[var(--color-primary)] shrink-0" />
                    ) : (
                      <Square className="h-4 w-4 text-[var(--color-text-secondary)] shrink-0" />
                    )}
                    <Video className="h-4 w-4 text-[var(--color-text-secondary)] shrink-0" />
                    <span className="text-xs text-[var(--color-text)] truncate">
                      {v.title || `Vidéo ${i + 1}`}
                    </span>
                    {isYT && (
                      <span className="text-[10px] px-1.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 shrink-0">
                        Lien externe
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════ */}
        {/* DOCUMENTS                                   */}
        {/* ════════════════════════════════════════════ */}
        {media.documents.length > 0 && (
          <div>
            <SectionHeader
              title={t('tako.importPreview.documents', 'Documents')}
              icon={<FileText className="h-4 w-4" />}
              count={media.documents.length}
              selectedCount={selectedDocs.size}
              onSelectAll={() => setSelectedDocs(new Set(media.documents.map((_, i) => i)))}
              onSelectNone={() => setSelectedDocs(new Set())}
            />
            <div className="flex flex-col gap-1 mt-1">
              {media.documents.map((doc, i) => {
                const d = typeof doc === 'string' ? { url: doc } : doc;
                return (
                  <label
                    key={i}
                    className="flex items-center gap-3 py-1.5 px-1 rounded cursor-pointer hover:bg-[var(--color-hover)] transition"
                    onClick={(e) => { e.preventDefault(); toggleDoc(i); }}
                  >
                    {selectedDocs.has(i) ? (
                      <CheckSquare className="h-4 w-4 text-[var(--color-primary)] shrink-0" />
                    ) : (
                      <Square className="h-4 w-4 text-[var(--color-text-secondary)] shrink-0" />
                    )}
                    <FileText className="h-4 w-4 text-[var(--color-text-secondary)] shrink-0" />
                    <span className="text-xs text-[var(--color-text)] truncate">
                      {d.title || `Document ${i + 1}`}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {fields.length === 0 && media.images.length === 0 && media.videos.length === 0 && media.documents.length === 0 && (
          <p className="text-sm text-[var(--color-text-secondary)] text-center py-8">
            Aucune donnée à importer.
          </p>
        )}
      </div>

      {/* ════════════════════════════════════════════ */}
      {/* Actions                                     */}
      {/* ════════════════════════════════════════════ */}
      <div className="flex items-center justify-between pt-4 mt-2 border-t border-[var(--color-border)]">
        <span className="text-xs text-[var(--color-text-secondary)]">
          {totalSelected} élément(s) sélectionné(s)
        </span>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" onClick={onCancel}>
            Annuler
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={totalSelected === 0}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Importer la sélection
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ── Inline icons for section headers ──
function ClipboardIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}

function MetadataIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  );
}
