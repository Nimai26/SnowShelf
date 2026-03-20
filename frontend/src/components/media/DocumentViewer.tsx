import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import type { MediaItem } from '../../types/item.types';
import { getMediaUrl } from '../../utils/url';

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

type DocKind = 'image' | 'pdf' | 'other';

function getDocKind(doc: MediaItem): DocKind {
  const mime = (doc.mimeType || '').toLowerCase();
  if (mime.startsWith('image/')) return 'image';
  if (mime === 'application/pdf') return 'pdf';
  // Fallback: check filename extension
  const ext = (doc.filename || doc.url || '').split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg'].includes(ext || ''))
    return 'image';
  if (ext === 'pdf') return 'pdf';
  return 'other';
}

function formatSize(bytes: number): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

// ──────────────────────────────────────────────
// Props
// ──────────────────────────────────────────────

interface DocumentViewerProps {
  documents: MediaItem[];
  startIndex: number;
  onClose: () => void;
}

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────

export function DocumentViewer({ documents, startIndex, onClose }: DocumentViewerProps) {
  const [index, setIndex] = useState(startIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Touch swipe state
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isSwiping = useRef(false);

  const doc = documents[index];
  const kind = getDocKind(doc);
  const url = getMediaUrl(doc.url);
  const canPrev = index > 0;
  const canNext = index < documents.length - 1;

  // Reset zoom/rotation on doc change
  useEffect(() => {
    setZoom(1);
    setRotation(0);
  }, [index]);

  // ── Keyboard navigation ──
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (canPrev) setIndex((i) => i - 1);
          break;
        case 'ArrowRight':
          if (canNext) setIndex((i) => i + 1);
          break;
        case '+':
        case '=':
          setZoom((z) => Math.min(z + 0.25, 4));
          break;
        case '-':
          setZoom((z) => Math.max(z - 0.25, 0.5));
          break;
        case 'r':
          setRotation((r) => r + 90);
          break;
      }
    };
    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [canPrev, canNext, onClose]);

  // ── Touch swipe ──
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isSwiping.current = false;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (e.changedTouches.length !== 1) return;
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      const dy = e.changedTouches[0].clientY - touchStartY.current;
      // Only trigger if horizontal swipe is dominant and > 60px
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        if (dx < 0 && canNext) setIndex((i) => i + 1);
        if (dx > 0 && canPrev) setIndex((i) => i - 1);
      }
    },
    [canPrev, canNext],
  );

  // ── Fullscreen toggle ──
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false));
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // ── Render document content based on type ──
  const renderContent = () => {
    if (kind === 'image') {
      return (
        <div className="flex-1 relative overflow-hidden p-4 min-h-0">
          <img
            src={url}
            alt={doc.title || doc.filename}
            className="absolute inset-0 w-full h-full object-contain transition-transform duration-200 select-none"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
            }}
            draggable={false}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      );
    }

    if (kind === 'pdf') {
      return (
        <div className="flex-1 min-h-0 p-2 sm:p-4">
          <iframe
            src={`${url}#toolbar=1&navpanes=0`}
            title={doc.title || doc.filename}
            className="w-full h-full rounded-lg border border-[var(--color-border)]"
            style={{ minHeight: '60vh' }}
          />
        </div>
      );
    }

    // Other file types — download prompt
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-8">
        <div className="rounded-2xl bg-[var(--color-hover)] p-8">
          <FileText className="h-16 w-16 text-[var(--color-text-secondary)]" />
        </div>
        <div className="text-center">
          <p className="text-lg font-medium text-[var(--color-text)]">
            {doc.title || doc.filename}
          </p>
          {doc.size > 0 && (
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              {formatSize(doc.size)}
            </p>
          )}
          <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
            Aperçu non disponible pour ce type de fichier
          </p>
        </div>
        <a
          href={url}
          download
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-6 py-3 text-sm font-medium text-[var(--color-primary-foreground)] hover:opacity-90 transition"
        >
          <Download className="h-4 w-4" />
          Télécharger
        </a>
      </div>
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex flex-col bg-[var(--color-background)]"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* ── Top bar ── */}
        <div className="flex items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-3 border-b border-[var(--color-border)] bg-[var(--color-card)]/80 backdrop-blur-sm">
          {/* Left: title & info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--color-text)] truncate">
              {doc.title || doc.filename}
            </p>
            <p className="text-xs text-[var(--color-text-secondary)]">
              {documents.length > 1 && `${index + 1}/${documents.length} · `}
              {doc.mimeType}
              {doc.size > 0 && ` · ${formatSize(doc.size)}`}
            </p>
          </div>

          {/* Right: toolbar */}
          <div className="flex items-center gap-1">
            {/* Image-specific controls */}
            {kind === 'image' && (
              <>
                <ToolbarButton
                  icon={<ZoomOut className="h-4 w-4" />}
                  onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
                  title="Dézoomer (–)"
                  disabled={zoom <= 0.5}
                />
                <span className="text-xs text-[var(--color-text-secondary)] min-w-[3rem] text-center hidden sm:block">
                  {Math.round(zoom * 100)}%
                </span>
                <ToolbarButton
                  icon={<ZoomIn className="h-4 w-4" />}
                  onClick={() => setZoom((z) => Math.min(z + 0.25, 4))}
                  title="Zoomer (+)"
                  disabled={zoom >= 4}
                />
                <ToolbarButton
                  icon={<RotateCw className="h-4 w-4" />}
                  onClick={() => setRotation((r) => r + 90)}
                  title="Rotation (R)"
                />
                <div className="w-px h-5 bg-[var(--color-border)] mx-1 hidden sm:block" />
              </>
            )}

            <ToolbarButton
              icon={isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              onClick={toggleFullscreen}
              title="Plein écran"
            />
            <a
              href={url}
              download
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text)] transition"
              title="Télécharger"
            >
              <Download className="h-4 w-4" />
            </a>
            <ToolbarButton
              icon={<X className="h-4 w-4" />}
              onClick={onClose}
              title="Fermer (Echap)"
            />
          </div>
        </div>

        {/* ── Content area ── */}
        {renderContent()}

        {/* ── Bottom navigation (multi-doc) ── */}
        {documents.length > 1 && (
          <div className="flex items-center justify-center gap-3 px-3 py-2 sm:py-3 border-t border-[var(--color-border)] bg-[var(--color-card)]/80 backdrop-blur-sm">
            <button
              type="button"
              onClick={() => canPrev && setIndex((i) => i - 1)}
              disabled={!canPrev}
              className="rounded-xl p-2 text-[var(--color-text)] hover:bg-[var(--color-hover)] transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            {/* Dot indicators for small sets, text for larger */}
            {documents.length <= 10 ? (
              <div className="flex items-center gap-1.5">
                {documents.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setIndex(i)}
                    className={`h-2 rounded-full transition-all ${
                      i === index
                        ? 'w-6 bg-[var(--color-primary)]'
                        : 'w-2 bg-[var(--color-text-secondary)]/40 hover:bg-[var(--color-text-secondary)]'
                    }`}
                  />
                ))}
              </div>
            ) : (
              <span className="text-sm text-[var(--color-text-secondary)] min-w-[4rem] text-center">
                {index + 1} / {documents.length}
              </span>
            )}

            <button
              type="button"
              onClick={() => canNext && setIndex((i) => i + 1)}
              disabled={!canNext}
              className="rounded-xl p-2 text-[var(--color-text)] hover:bg-[var(--color-hover)] transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

// ──────────────────────────────────────────────
// Toolbar button sub-component
// ──────────────────────────────────────────────

function ToolbarButton({
  icon,
  onClick,
  title,
  disabled,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  title: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="rounded-lg p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text)] transition disabled:opacity-30 disabled:cursor-not-allowed"
    >
      {icon}
    </button>
  );
}
