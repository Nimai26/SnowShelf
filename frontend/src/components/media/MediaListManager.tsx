import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Image,
  Video,
  Music,
  FileText,
  Upload,
  Trash2,
  GripVertical,
  X,
  Eye,
  Edit3,
  Check,
  Plus,
  Camera,
  Pencil,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Tabs, Button, Modal, Spinner } from '../ui';
import type { MediaItem, MediaType } from '../../types/item.types';
import { itemMediaService } from '../../services/media.service';
import { categoryMediaService } from '../../services/media.service';
import { ImageEditor } from './ImageEditor';
import { CameraCapture } from './CameraCapture';

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface MediaServiceInterface {
  getAll: (entityId: number, mediaType: MediaType) => Promise<MediaItem[]>;
  upload: (entityId: number, mediaType: MediaType, files: File[], titles?: string[]) => Promise<MediaItem[]>;
  update: (entityId: number, mediaType: MediaType, mediaId: number, data: { title?: string; displayOrder?: number }) => Promise<MediaItem>;
  reorder: (entityId: number, mediaType: MediaType, order: number[]) => Promise<MediaItem[]>;
  delete: (entityId: number, mediaType: MediaType, mediaId: number) => Promise<{ message: string }>;
}

interface MediaListManagerProps {
  itemId?: number;
  categoryId?: number;
  initialMedia?: {
    images: MediaItem[];
    videos: MediaItem[];
    audio: MediaItem[];
    documents: MediaItem[];
  };
  readOnly?: boolean;
}

interface MediaTabConfig {
  id: MediaType;
  label: string;
  icon: React.ReactNode;
  accept: string;
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

import { getMediaUrl } from '../../utils/url';

function isExternalVideoUrl(url: string): boolean {
  return url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com');
}

function getYouTubeEmbedUrl(url: string): string | null {
  const match = url.match(/(?:v=|youtu\.be\/)([\w-]{11})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

function getYouTubeThumbnailUrl(url: string): string | null {
  const match = url.match(/(?:v=|youtu\.be\/)([\w-]{11})/);
  return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null;
}

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────

export function MediaListManager({ itemId, categoryId, initialMedia, readOnly = false }: MediaListManagerProps) {
  const { t } = useTranslation('manage');

  // Determine entity id and media service based on props
  const entityId = itemId ?? categoryId!;
  const mediaService: MediaServiceInterface = categoryId ? categoryMediaService : itemMediaService;

  const MEDIA_TABS: MediaTabConfig[] = [
    { id: 'images', label: t('media.images'), icon: <Image className="h-4 w-4" />, accept: 'image/*' },
    { id: 'videos', label: t('media.videos'), icon: <Video className="h-4 w-4" />, accept: 'video/*' },
    { id: 'audio', label: t('media.audio'), icon: <Music className="h-4 w-4" />, accept: 'audio/*' },
    { id: 'documents', label: t('media.documents'), icon: <FileText className="h-4 w-4" />, accept: '.pdf,.doc,.docx,.txt,.zip,.epub,.cbr,.cbz' },
  ];

  const [activeTab, setActiveTab] = useState<MediaType>('images');
  const [media, setMedia] = useState<Record<MediaType, MediaItem[]>>(
    initialMedia || { images: [], videos: [], audio: [], documents: [] },
  );
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<MediaItem | null>(null);
  const [previewItem, setPreviewItem] = useState<MediaItem | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [editorSrc, setEditorSrc] = useState<string | null>(null);
  const [editorFilename, setEditorFilename] = useState<string>('');
  const [editingMediaItem, setEditingMediaItem] = useState<MediaItem | null>(null);
  const [importQueue, setImportQueue] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentMedia = media[activeTab];
  const currentTab = MEDIA_TABS.find((tab) => tab.id === activeTab)!;

  // Cleanup Object URLs on unmount
  useEffect(() => {
    return () => {
      if (editorSrc) URL.revokeObjectURL(editorSrc);
    };
  }, [editorSrc]);

  // ──────────── Load media ────────────

  const loadMedia = useCallback(
    async (mediaType: MediaType) => {
      try {
        const items = await mediaService.getAll(entityId, mediaType);
        setMedia((prev) => ({ ...prev, [mediaType]: items }));
      } catch {
        // silently fail
      }
    },
    [entityId, mediaService],
  );

  // Charger TOUS les types au montage (pour les compteurs d'onglets)
  useEffect(() => {
    const allTypes: MediaType[] = ['images', 'videos', 'audio', 'documents'];
    allTypes.forEach((type) => loadMedia(type));
  }, [loadMedia]);

  // Recharger l'onglet actif quand il change
  useEffect(() => {
    loadMedia(activeTab);
  }, [activeTab, loadMedia]);

  // ──────────── Upload ────────────

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);

    // Reset input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';

    // For images, route through the editor one by one
    if (activeTab === 'images') {
      setImportQueue(fileArray);
      openNextFromQueue(fileArray);
      return;
    }

    // Non-image media: direct upload
    setUploading(true);
    try {
      const uploaded = await mediaService.upload(entityId, activeTab, fileArray);
      setMedia((prev) => ({
        ...prev,
        [activeTab]: [...prev[activeTab], ...uploaded].sort(
          (a, b) => a.displayOrder - b.displayOrder,
        ),
      }));
      toast.success(t('media.uploadSuccess', { count: fileArray.length }));
    } catch {
      toast.error(t('media.errors.uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  // ──────────── Import queue (edit before upload) ────────────

  const openNextFromQueue = (queue: File[]) => {
    if (queue.length === 0) return;
    const file = queue[0];
    const url = URL.createObjectURL(file);
    setEditorSrc(url);
    setEditorFilename(file.name);
    setEditingMediaItem(null);
  };

  const handleImportEditorSave = async (blob: Blob, format: string) => {
    const ext = format === 'image/png' ? '.png' : format === 'image/webp' ? '.webp' : '.jpg';
    const file = new File([blob], editorFilename.replace(/\.[^.]+$/, ext) || `image${ext}`, {
      type: format,
    });

    if (editorSrc) URL.revokeObjectURL(editorSrc);
    setEditorSrc(null);

    // Upload immediately
    setUploading(true);
    try {
      const uploaded = await mediaService.upload(entityId, 'images', [file]);
      setMedia((prev) => ({
        ...prev,
        images: [...prev.images, ...uploaded].sort((a, b) => a.displayOrder - b.displayOrder),
      }));
      toast.success(t('media.uploadSuccess', { count: 1 }));
    } catch {
      toast.error(t('media.errors.uploadFailed'));
    } finally {
      setUploading(false);
    }

    // Process next file in queue
    const remaining = importQueue.slice(1);
    setImportQueue(remaining);
    if (remaining.length > 0) {
      setTimeout(() => openNextFromQueue(remaining), 300);
    }
  };

  const handleImportEditorCancel = () => {
    if (editorSrc) URL.revokeObjectURL(editorSrc);
    setEditorSrc(null);

    // Skip this file, move to next
    const remaining = importQueue.slice(1);
    setImportQueue(remaining);
    if (remaining.length > 0) {
      setTimeout(() => openNextFromQueue(remaining), 300);
    }
  };

  // ──────────── Edit title ────────────

  const startEdit = (item: MediaItem) => {
    setEditingId(item.id);
    setEditTitle(item.title || '');
  };

  const saveEdit = async () => {
    if (editingId === null) return;
    try {
      const updated = await mediaService.update(entityId, activeTab, editingId, {
        title: editTitle || undefined,
      });
      setMedia((prev) => ({
        ...prev,
        [activeTab]: prev[activeTab].map((m) => (m.id === editingId ? updated : m)),
      }));
      setEditingId(null);
    } catch {
      toast.error(t('media.errors.uploadFailed'));
    }
  };

  // ──────────── Delete ────────────

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await mediaService.delete(entityId, activeTab, deleteTarget.id);
      setMedia((prev) => ({
        ...prev,
        [activeTab]: prev[activeTab].filter((m) => m.id !== deleteTarget.id),
      }));
      toast.success(t('media.deleteSuccess'));
    } catch {
      toast.error(t('media.errors.deleteFailed'));
    } finally {
      setDeleteTarget(null);
    }
  };

  // ──────────── Drag & Drop reorder ────────────

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = async (index: number) => {
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }

    const items = [...currentMedia];
    const [movedItem] = items.splice(dragIndex, 1);
    items.splice(index, 0, movedItem);

    setMedia((prev) => ({ ...prev, [activeTab]: items }));
    setDragIndex(null);
    setDragOverIndex(null);

    try {
      await mediaService.reorder(
        entityId,
        activeTab,
        items.map((m) => m.id),
      );
    } catch {
      loadMedia(activeTab);
    }
  };

  // ──────────── Camera capture flow ────────────

  const handleCameraCapture = (blob: Blob) => {
    setShowCamera(false);
    const url = URL.createObjectURL(blob);
    setEditorSrc(url);
    setEditorFilename('photo.jpg');
    setEditingMediaItem(null);
  };

  // ──────────── Editor save flow ────────────

  const handleEditorSave = async (blob: Blob, format: string) => {
    // If we're processing the import queue (not editing an existing media)
    if (!editingMediaItem && importQueue.length > 0) {
      await handleImportEditorSave(blob, format);
      return;
    }

    const ext = format === 'image/png' ? '.png' : format === 'image/webp' ? '.webp' : '.jpg';
    const file = new File([blob], editorFilename.replace(/\.[^.]+$/, ext) || `photo${ext}`, {
      type: format,
    });

    // Clean up editor
    if (editorSrc) URL.revokeObjectURL(editorSrc);
    setEditorSrc(null);

    setUploading(true);
    try {
      if (editingMediaItem) {
        // Re-upload edited image: delete old, upload new
        await mediaService.delete(entityId, 'images', editingMediaItem.id);
        const uploaded = await mediaService.upload(entityId, 'images', [file]);
        setMedia((prev) => ({
          ...prev,
          images: prev.images
            .filter((m) => m.id !== editingMediaItem.id)
            .concat(uploaded)
            .sort((a, b) => a.displayOrder - b.displayOrder),
        }));
        toast.success(t('media.editor.editSuccess', 'Image modifiée'));
      } else {
        // New upload (camera capture)
        const uploaded = await mediaService.upload(entityId, 'images', [file]);
        setMedia((prev) => ({
          ...prev,
          images: [...prev.images, ...uploaded].sort((a, b) => a.displayOrder - b.displayOrder),
        }));
        toast.success(t('media.uploadSuccess', { count: 1 }));
      }
    } catch {
      toast.error(t('media.errors.uploadFailed'));
    } finally {
      setUploading(false);
      setEditingMediaItem(null);
    }
  };

  const handleEditorCancel = () => {
    // If we're processing the import queue
    if (!editingMediaItem && importQueue.length > 0) {
      handleImportEditorCancel();
      return;
    }

    if (editorSrc) URL.revokeObjectURL(editorSrc);
    setEditorSrc(null);
    setEditingMediaItem(null);
  };

  // ──────────── Edit existing image ────────────

  const handleEditImage = (item: MediaItem) => {
    const url = getMediaUrl(item.url);
    setEditorSrc(url);
    setEditorFilename(item.filename || item.title || 'image.jpg');
    setEditingMediaItem(item);
  };

  // ──────────── Drop zone for new uploads ────────────

  const handleDropZone = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (readOnly) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const input = fileInputRef.current;
      if (input) {
        const dt = new DataTransfer();
        Array.from(files).forEach((f) => dt.items.add(f));
        input.files = dt.files;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  };

  // ──────────── Tabs with counts ────────────

  const tabDefs = MEDIA_TABS.map((tab) => ({
    id: tab.id,
    label: `${tab.label} (${media[tab.id].length})`,
    icon: tab.icon,
  }));

  // ──────────── Render media item ────────────

  const renderMediaCard = (item: MediaItem, index: number) => {
    const isEditing = editingId === item.id;

    return (
      <div
        key={item.id}
        draggable={!readOnly && !isEditing}
        onDragStart={() => handleDragStart(index)}
        onDragOver={(e) => handleDragOver(e, index)}
        onDrop={() => handleDrop(index)}
        onDragEnd={() => {
          setDragIndex(null);
          setDragOverIndex(null);
        }}
        className={`group relative rounded-lg border bg-[var(--color-card)] transition ${
          dragOverIndex === index ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20' : 'border-[var(--color-border)]'
        } ${dragIndex === index ? 'opacity-50' : ''}`}
      >
        {/* Thumbnail / preview area */}
        <div className="relative aspect-square overflow-hidden rounded-t-lg bg-[var(--color-surface)]">
          {activeTab === 'images' && (
            <img
              src={getMediaUrl(item.thumbnailUrl || item.url)}
              alt={item.title || item.filename}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          )}
          {activeTab === 'videos' && (
            <div className="flex h-full items-center justify-center">
              {item.thumbnailUrl || isExternalVideoUrl(item.url) ? (
                <img
                  src={item.thumbnailUrl ? getMediaUrl(item.thumbnailUrl) : (getYouTubeThumbnailUrl(item.url) || '')}
                  alt={item.title || 'Video'}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <Video className="h-12 w-12 text-[var(--color-text-secondary)]" />
              )}
            </div>
          )}
          {activeTab === 'audio' && (
            <div className="flex h-full items-center justify-center">
              <Music className="h-12 w-12 text-[var(--color-text-secondary)]" />
            </div>
          )}
          {activeTab === 'documents' && (
            <div className="flex h-full items-center justify-center">
              <FileText className="h-12 w-12 text-[var(--color-text-secondary)]" />
            </div>
          )}

          {/* Overlay actions */}
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/40 opacity-0 transition group-hover:opacity-100">
            <button
              type="button"
              onClick={() => setPreviewItem(item)}
              className="rounded-full bg-white/90 p-2 text-gray-800 transition hover:bg-white"
            >
              <Eye className="h-4 w-4" />
            </button>
            {!readOnly && activeTab === 'images' && (
              <button
                type="button"
                onClick={() => handleEditImage(item)}
                className="rounded-full bg-blue-500/90 p-2 text-white transition hover:bg-blue-600"
                title={t('media.editor.editImage', 'Éditer l\'image')}
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
            {!readOnly && (
              <button
                type="button"
                onClick={() => setDeleteTarget(item)}
                className="rounded-full bg-red-500/90 p-2 text-white transition hover:bg-red-600"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Drag handle */}
          {!readOnly && (
            <div className="absolute left-1 top-1 cursor-grab rounded bg-black/30 p-1 opacity-0 transition group-hover:opacity-100">
              <GripVertical className="h-3 w-3 text-white" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-2">
          {isEditing ? (
            <div className="space-y-1">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder={item.filename}
                className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-xs text-[var(--color-text)]"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveEdit();
                  if (e.key === 'Escape') setEditingId(null);
                }}
                onBlur={(e) => {
                  // Ne pas fermer si on clique sur les boutons Valider/Annuler
                  const related = e.relatedTarget as HTMLElement | null;
                  if (related?.closest('[data-edit-actions]')) return;
                  setEditingId(null);
                }}
              />
              <div className="flex items-center justify-end gap-1" data-edit-actions>
                <button type="button" onClick={saveEdit} className="rounded p-0.5 text-green-500 hover:bg-green-500/10 hover:text-green-600">
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button type="button" onClick={() => setEditingId(null)} className="rounded p-0.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-text-secondary)]/10 hover:text-[var(--color-text)]">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <p className="flex-1 truncate text-xs font-medium text-[var(--color-text)]">
                {item.title || item.filename}
              </p>
              {!readOnly && (
                <button type="button" onClick={() => startEdit(item)} className="opacity-0 transition group-hover:opacity-100 text-[var(--color-text-secondary)] hover:text-[var(--color-text)]">
                  <Edit3 className="h-3 w-3" />
                </button>
              )}
            </div>
          )}
          <p className="text-[10px] text-[var(--color-text-secondary)]">{formatFileSize(item.size)}</p>
        </div>
      </div>
    );
  };

  // ──────────── Main render ────────────

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <Tabs tabs={tabDefs} activeTab={activeTab} onChange={(id) => setActiveTab(id as MediaType)} />

      {/* Upload area */}
      {!readOnly && (
        <div
          onDrop={handleDropZone}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
          className="rounded-lg border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center transition hover:border-[var(--color-primary)]"
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={currentTab.accept}
            onChange={handleUpload}
            className="hidden"
            id={`media-upload-${activeTab}`}
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Spinner />
              <p className="text-sm text-[var(--color-text-secondary)]">{t('media.uploading')}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <label
                htmlFor={`media-upload-${activeTab}`}
                className="flex cursor-pointer flex-col items-center gap-2"
              >
                <div className="rounded-full bg-[var(--color-primary)]/10 p-3">
                  <Upload className="h-6 w-6 text-[var(--color-primary)]" />
                </div>
                <p className="text-sm font-medium text-[var(--color-text)]">{t('media.dragDrop')}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {currentTab.accept}
                </p>
              </label>
              {activeTab === 'images' && (
                <button
                  type="button"
                  onClick={() => setShowCamera(true)}
                  className="mt-2 flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-2 text-sm font-medium text-[var(--color-text)] transition hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5"
                >
                  <Camera className="h-4 w-4 text-[var(--color-primary)]" />
                  {t('media.camera.capture', 'Prendre une photo')}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Media grid */}
      {currentMedia.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {currentMedia.map((item, index) => renderMediaCard(item, index))}
          {!readOnly && (
            <label
              htmlFor={`media-upload-${activeTab}`}
              className="flex aspect-square cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface)] transition hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5"
            >
              <Plus className="h-8 w-8 text-[var(--color-text-secondary)]" />
            </label>
          )}
        </div>
      ) : (
        !readOnly && (
          <div className="py-8 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-surface)]">
              {currentTab.icon}
            </div>
            <p className="text-sm font-medium text-[var(--color-text)]">{t('media.noMedia')}</p>
            <p className="text-xs text-[var(--color-text-secondary)]">{t('media.noMediaDesc')}</p>
          </div>
        )
      )}

      {/* Preview modal */}
      <Modal
        open={!!previewItem}
        onClose={() => setPreviewItem(null)}
        title={previewItem?.title || previewItem?.filename || ''}
      >
        {previewItem && (
          <div className="space-y-4">
            {activeTab === 'images' && (
              <img
                src={getMediaUrl(previewItem.url)}
                alt={previewItem.title || previewItem.filename}
                className="max-h-[70vh] w-full rounded-lg object-contain"
              />
            )}
            {activeTab === 'videos' && (
              isExternalVideoUrl(previewItem.url) ? (
                <iframe
                  src={getYouTubeEmbedUrl(previewItem.url) || previewItem.url}
                  title={previewItem.title || 'Video'}
                  className="aspect-video max-h-[70vh] w-full rounded-lg"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={getMediaUrl(previewItem.url)}
                  controls
                  className="max-h-[70vh] w-full rounded-lg"
                />
              )
            )}
            {activeTab === 'audio' && (
              <div className="flex flex-col items-center gap-4 py-8">
                <Music className="h-16 w-16 text-[var(--color-primary)]" />
                <audio src={getMediaUrl(previewItem.url)} controls className="w-full" />
              </div>
            )}
            {activeTab === 'documents' && (
              <div className="flex flex-col items-center gap-4 py-8">
                <FileText className="h-16 w-16 text-[var(--color-primary)]" />
                <a
                  href={getMediaUrl(previewItem.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-[var(--color-primary)] hover:underline"
                >
                  {previewItem.filename}
                </a>
              </div>
            )}
            <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
              <span>{formatFileSize(previewItem.size)}</span>
              <span>{previewItem.mimeType}</span>
              {previewItem.width && previewItem.height && (
                <span>{previewItem.width} × {previewItem.height}</span>
              )}
              {previewItem.duration && (
                <span>{Math.floor(previewItem.duration / 60)}:{String(Math.floor(previewItem.duration % 60)).padStart(2, '0')}</span>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={t('media.deleteConfirm')}
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            {deleteTarget?.title || deleteTarget?.filename}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Annuler
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Supprimer
            </Button>
          </div>
        </div>
      </Modal>

      {/* Camera overlay */}
      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
        />
      )}

      {/* Image editor overlay */}
      {editorSrc && (
        <ImageEditor
          src={editorSrc}
          filename={editorFilename}
          onSave={handleEditorSave}
          onCancel={handleEditorCancel}
        />
      )}
    </div>
  );
}
