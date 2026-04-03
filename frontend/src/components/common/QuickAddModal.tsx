import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Camera, Save, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button, Input, Spinner } from '../ui';
import { CameraCapture } from '../media/CameraCapture';
import { ImageEditor } from '../media/ImageEditor';
import { CategorySelector } from './CategorySelector';
import { itemService } from '../../services/item.service';
import { itemMediaService } from '../../services/media.service';
import { categoryService, primaryTypeService } from '../../services/category.service';
import type { Category, PrimaryType } from '../../types/category.types';

interface QuickAddModalProps {
  open: boolean;
  onClose: () => void;
}

type Step = 'camera' | 'editor' | 'form';

export function QuickAddModal({ open, onClose }: QuickAddModalProps) {
  const { t } = useTranslation('items');
  const navigate = useNavigate();

  // Flow state
  const [step, setStep] = useState<Step>('camera');
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [editorSrc, setEditorSrc] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [categoryIds, setCategoryIds] = useState<number[]>([]);
  const [primaryTypeId, setPrimaryTypeId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Data
  const [categories, setCategories] = useState<Category[]>([]);
  const [primaryTypes, setPrimaryTypes] = useState<PrimaryType[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Load categories & primary types
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoadingData(true);
      try {
        const [catRes, ptRes] = await Promise.all([
          categoryService.getCategories({ filter: 'all', limit: 500 }),
          primaryTypeService.getAll(),
        ]);
        if (!cancelled) {
          setCategories(catRes.data.categories || []);
          setPrimaryTypes(ptRes.data || []);
        }
      } catch {
        toast.error(t('form.loadError', 'Erreur de chargement'));
      } finally {
        if (!cancelled) setLoadingData(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open]);

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setStep('camera');
      setPhotoBlob(null);
      setPhotoPreview(null);
      setEditorSrc(null);
      setName('');
      setCategoryIds([]);
      setPrimaryTypeId(null);
      setSubmitting(false);
    }
  }, [open]);

  // Cleanup blob URLs
  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      if (editorSrc) URL.revokeObjectURL(editorSrc);
    };
  }, [photoPreview, editorSrc]);

  if (!open) return null;

  // ── Handlers ──

  const handleCapture = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    setEditorSrc(url);
    setStep('editor');
  };

  const handleEditorSave = (blob: Blob, _format: string) => {
    setPhotoBlob(blob);
    const url = URL.createObjectURL(blob);
    setPhotoPreview(url);
    setStep('form');
  };

  const handleEditorCancel = () => {
    if (editorSrc) URL.revokeObjectURL(editorSrc);
    setEditorSrc(null);
    setStep('camera');
  };

  const handleCategoryToggle = (catId: number, selected: boolean) => {
    if (selected && !primaryTypeId) {
      const cat = categories.find((c) => c.id === catId);
      if (cat?.primaryTypeId) {
        setPrimaryTypeId(cat.primaryTypeId);
      }
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error(t('form.nameRequired', 'Le nom est requis'));
      return;
    }
    if (categoryIds.length === 0) {
      toast.error(t('form.categoryRequired', 'Sélectionnez au moins une catégorie'));
      return;
    }

    // Determine primaryTypeId from selected categories if not set
    let resolvedPrimaryTypeId = primaryTypeId;
    if (!resolvedPrimaryTypeId) {
      const firstCat = categories.find((c) => categoryIds.includes(c.id));
      resolvedPrimaryTypeId = firstCat?.primaryTypeId ?? primaryTypes[0]?.id ?? 1;
    }

    setSubmitting(true);
    try {
      // 1. Create item
      const result = await itemService.createItem({
        name: name.trim(),
        primaryTypeId: resolvedPrimaryTypeId,
        categoryIds,
      });

      // 2. Upload photo
      if (photoBlob && result.data?.id) {
        const ext = photoBlob.type === 'image/png' ? '.png' : photoBlob.type === 'image/webp' ? '.webp' : '.jpg';
        const file = new File([photoBlob], `photo${ext}`, { type: photoBlob.type });
        await itemMediaService.upload(result.data.id, 'images', [file]);
      }

      toast.success(t('form.created', 'Item créé avec succès'));
      onClose();
      if (result.data?.id) {
        navigate(`/items/${result.data.id}`);
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || t('form.createError', 'Erreur lors de la création'));
    } finally {
      setSubmitting(false);
    }
  };

  // ── Camera step ──
  if (step === 'camera') {
    return (
      <CameraCapture
        onCapture={handleCapture}
        onClose={onClose}
      />
    );
  }

  // ── Editor step ──
  if (step === 'editor' && editorSrc) {
    return (
      <ImageEditor
        src={editorSrc}
        onSave={handleEditorSave}
        onCancel={handleEditorCancel}
        filename="photo.jpg"
      />
    );
  }

  // ── Form step ──
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--color-background)]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setStep('camera')}
            className="rounded-full p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-card)] hover:text-[var(--color-text)] transition"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h2 className="text-lg font-semibold text-[var(--color-text)]">
            {t('quickAdd.title', 'Ajout rapide')}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            {t('form.cancel')}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={submitting || !name.trim() || categoryIds.length === 0}
          >
            <Save className="mr-1.5 h-3.5 w-3.5" />
            {submitting ? t('form.creating') : t('form.create')}
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24 sm:pb-4">
        {loadingData ? (
          <div className="flex items-center justify-center py-12">
            <Spinner />
          </div>
        ) : (
          <div className="mx-auto max-w-lg space-y-5">
            {/* Photo preview */}
            {photoPreview && (
              <div className="relative overflow-hidden rounded-xl border border-[var(--color-border)]">
                <img
                  src={photoPreview}
                  alt="Preview"
                  className="w-full max-h-56 object-cover"
                />
                <button
                  type="button"
                  onClick={() => setStep('camera')}
                  className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-lg bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition hover:bg-black/80"
                >
                  <Camera className="h-3.5 w-3.5" />
                  {t('quickAdd.retake', 'Reprendre')}
                </button>
              </div>
            )}

            {/* Name */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">
                {t('form.name')} *
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('form.namePlaceholder', 'Nom de l\'item')}
                autoFocus
              />
            </div>

            {/* Category selector */}
            <div>
              <CategorySelector
                categories={categories}
                primaryTypes={primaryTypes}
                selectedIds={categoryIds}
                onChange={setCategoryIds}
                onToggle={handleCategoryToggle}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
