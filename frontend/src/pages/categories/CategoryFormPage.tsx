import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Shield, Image, Check, ChevronDown, ChevronUp, Plus, Trash2, Edit3, Settings2, Upload, X } from 'lucide-react';
import { categoryService, primaryTypeService } from '../../services/category.service';
import { takoService } from '../../services/tako.service';
import { useAuthStore } from '../../stores/authStore';
import type { Category, CreateCategoryPayload, PrimaryType, PrimaryTypeField } from '../../types/category.types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
} from '../../components/ui';
import toast from 'react-hot-toast';
import { MediaListManager } from '../../components/media/MediaListManager';
import CategoryIcon from '../../components/common/CategoryIcon';

const PRESET_ICONS = [
  '📁', '📂', '🎮', '📚', '🎵', '🎬', '📺', '🧸', '🧱',
  '🎲', '🃏', '🖼️', '📦', '💿', '🎤', '🎨', '🏆', '⚽',
  '🚗', '🛸', '🎯', '🔧', '💎', '👑', '🌟', '🎁', '🎪',
  '🏠', '🎸', '📷', '🧩', '🎭', '💻', '📱', '⌚', '🔑',
];

const PRESET_COLORS = [
  '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
  '#1abc9c', '#e67e22', '#c0392b', '#2980b9', '#27ae60',
  '#8e44ad', '#16a085', '#d35400', '#f1c40f', '#34495e',
  '#95a5a6',
];

interface AvailableProvider {
  domain: string;
  name: string;
  description: string;
}

export default function CategoryFormPage() {
  const { t } = useTranslation('categories');
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = Boolean(id);
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin' || user?.isAdmin;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [primaryTypes, setPrimaryTypes] = useState<PrimaryType[]>([]);
  const [availableProviders, setAvailableProviders] = useState<AvailableProvider[]>([]);
  const [loadingProviders, setLoadingProviders] = useState(false);
  const [showAllProviders, setShowAllProviders] = useState(false);
  const [typeProviders, setTypeProviders] = useState<AvailableProvider[]>([]);
  const [allProviders, setAllProviders] = useState<AvailableProvider[]>([]);
  // Track whether the user has explicitly modified the providers selection
  const [providersModified, setProvidersModified] = useState(false);

  // Category fields management (admin, default categories only)
  const [categoryFields, setCategoryFields] = useState<PrimaryTypeField[]>([]);
  const [editingField, setEditingField] = useState<PrimaryTypeField | null>(null);
  const [showFieldForm, setShowFieldForm] = useState(false);
  const [fieldForm, setFieldForm] = useState({
    fieldKey: '', fieldNameFr: '', fieldNameEn: '', fieldType: 'text' as string,
    fieldOptions: '' , icon: '', placeholderFr: '', sortOrder: 0,
    isRequired: false, isSearchable: true, isFilterable: true,
  });

  const FIELD_TYPES = [
    { value: 'text', label: 'Texte' },
    { value: 'textarea', label: 'Texte long' },
    { value: 'number', label: 'Nombre' },
    { value: 'year', label: 'Année' },
    { value: 'date', label: 'Date' },
    { value: 'select', label: 'Liste déroulante' },
    { value: 'multiselect', label: 'Choix multiples' },
    { value: 'url', label: 'URL' },
    { value: 'rating', label: 'Note' },
    { value: 'duration', label: 'Durée' },
    { value: 'boolean', label: 'Oui/Non' },
  ];

  const resetFieldForm = () => {
    setFieldForm({
      fieldKey: '', fieldNameFr: '', fieldNameEn: '', fieldType: 'text',
      fieldOptions: '', icon: '', placeholderFr: '', sortOrder: 0,
      isRequired: false, isSearchable: true, isFilterable: true,
    });
    setEditingField(null);
    setShowFieldForm(false);
  };

  const loadCategoryFields = async (catId: number) => {
    try {
      const res = await categoryService.getCategoryFields(catId);
      setCategoryFields(res.data || []);
    } catch { /* ignore */ }
  };

  const handleSaveField = async () => {
    if (!id) return;
    const catId = Number(id);
    const payload: Record<string, any> = {
      fieldKey: fieldForm.fieldKey,
      fieldNameFr: fieldForm.fieldNameFr,
      fieldNameEn: fieldForm.fieldNameEn || fieldForm.fieldNameFr,
      fieldType: fieldForm.fieldType,
      icon: fieldForm.icon || undefined,
      placeholderFr: fieldForm.placeholderFr || undefined,
      sortOrder: fieldForm.sortOrder,
      isRequired: fieldForm.isRequired,
      isSearchable: fieldForm.isSearchable,
      isFilterable: fieldForm.isFilterable,
    };
    if (fieldForm.fieldOptions.trim()) {
      payload.fieldOptions = fieldForm.fieldOptions.split(',').map((s: string) => s.trim()).filter(Boolean);
    }
    try {
      if (editingField) {
        await categoryService.updateCategoryField(catId, editingField.id, payload);
        toast.success('Champ mis à jour');
      } else {
        await categoryService.createCategoryField(catId, payload);
        toast.success('Champ créé');
      }
      resetFieldForm();
      loadCategoryFields(catId);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erreur');
    }
  };

  const handleDeleteField = async (fieldId: number) => {
    if (!id || !confirm('Supprimer ce champ et toutes les métadonnées associées ?')) return;
    try {
      await categoryService.deleteCategoryField(Number(id), fieldId);
      toast.success('Champ supprimé');
      loadCategoryFields(Number(id));
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const startEditField = (f: PrimaryTypeField) => {
    setEditingField(f);
    setFieldForm({
      fieldKey: f.key,
      fieldNameFr: f.name,
      fieldNameEn: f.nameEn || f.name,
      fieldType: f.type,
      fieldOptions: (f.options || []).join(', '),
      icon: f.icon || '',
      placeholderFr: f.placeholder || '',
      sortOrder: f.sortOrder,
      isRequired: f.isRequired,
      isSearchable: f.isSearchable ?? true,
      isFilterable: f.isFilterable ?? true,
    });
    setShowFieldForm(true);
  };

  const [form, setForm] = useState<CreateCategoryPayload>({
    name: '',
    primaryTypeId: 0,
    description: '',
    notes: '',
    icon: '📁',
    iconType: 'emoji',
    color: '#3498db',
    defaultProviders: [],
    isPublic: false,
    isDefault: false,
    parentIds: [],
  });

  const [showImageUpload, setShowImageUpload] = useState(false);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreviewUrl, setIconPreviewUrl] = useState<string | null>(null);
  const [draggingIcon, setDraggingIcon] = useState(false);
  const iconInputRef = useRef<HTMLInputElement>(null);

  // Load existing category for edit mode + all categories for parent selector
  useEffect(() => {
    loadInitialData();
    if (isEditing && id) {
      loadCategory(Number(id));
    }
  }, [id]);

  // Load providers when primaryTypeId changes OR when primaryTypes become available
  useEffect(() => {
    if (form.primaryTypeId && primaryTypes.length > 0) {
      loadProvidersForType(form.primaryTypeId);
    } else if (!form.primaryTypeId) {
      setAvailableProviders([]);
      setTypeProviders([]);
    }
  }, [form.primaryTypeId, primaryTypes.length]);

  // Switch between type-only and all providers
  useEffect(() => {
    if (showAllProviders) {
      if (allProviders.length > 0) {
        setAvailableProviders(allProviders);
      } else {
        loadAllProviders();
      }
    } else {
      setAvailableProviders(typeProviders);
    }
  }, [showAllProviders, typeProviders, allProviders]);

  // Load category fields when editing a default category
  useEffect(() => {
    if (isEditing && id && form.isDefault) {
      loadCategoryFields(Number(id));
    }
  }, [isEditing, id, form.isDefault]);

  const loadInitialData = async () => {
    try {
      const [catRes, ptRes] = await Promise.all([
        categoryService.getCategories({ limit: 100 }),
        primaryTypeService.getAll(),
      ]);
      setAllCategories(catRes.data.categories);
      setPrimaryTypes(ptRes.data || []);
    } catch {
      // Non-blocking
    }
  };

  const loadProvidersForType = async (typeId: number) => {
    const pt = primaryTypes.find((p) => p.id === typeId);
    if (!pt) return;
    setLoadingProviders(true);
    try {
      const res = await takoService.getProvidersForType(pt.key);
      const flat: AvailableProvider[] = [];
      const seen = new Set<string>();
      for (const domain of res.data.domains) {
        for (const provider of domain.providers) {
          if (!seen.has(provider.name)) {
            seen.add(provider.name);
            flat.push({ domain: domain.name, name: provider.name, description: provider.description });
          }
        }
      }
      setTypeProviders(flat);
      if (!showAllProviders) setAvailableProviders(flat);
    } catch {
      setTypeProviders([]);
      if (!showAllProviders) setAvailableProviders([]);
    } finally {
      setLoadingProviders(false);
    }
  };

  const loadAllProviders = async () => {
    setLoadingProviders(true);
    try {
      const res = await takoService.getDomains();
      const flat: AvailableProvider[] = [];
      for (const domain of res.data.domains) {
        for (const provider of domain.providers) {
          flat.push({ domain: domain.name, name: provider.name, description: provider.description });
        }
      }
      setAllProviders(flat);
      setAvailableProviders(flat);
    } catch {
      setAllProviders([]);
    } finally {
      setLoadingProviders(false);
    }
  };

  const loadCategory = async (catId: number) => {
    try {
      setLoading(true);
      const res = await categoryService.getCategoryById(catId);
      const cat = res.data;
      setForm({
        name: cat.name,
        primaryTypeId: cat.primaryTypeId || 0,
        description: cat.description || '',
        notes: cat.notes || '',
        icon: cat.icon,
        iconType: cat.iconType || 'emoji',
        color: cat.color,
        defaultProviders: cat.defaultProviders || [],
        isPublic: cat.isPublic,
        isDefault: cat.isDefault,
        parentIds: cat.parentIds || [],
      });
      if (cat.iconType === 'url') setShowImageUpload(true);
      // Reset the modified flag — we just loaded DB state
      setProvidersModified(false);
    } catch {
      toast.error(t('errors.loadFailed', 'Erreur lors du chargement'));
      navigate('/categories');
    } finally {
      setLoading(false);
    }
  };

  const handleIconFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error(t('errors.invalidImageType', 'Type de fichier non supporté'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('errors.fileTooLarge', 'Fichier trop volumineux (max 5 Mo)'));
      return;
    }
    setIconFile(file);
    const url = URL.createObjectURL(file);
    setIconPreviewUrl(url);
    setForm((prev) => ({ ...prev, icon: 'pending-upload', iconType: 'url' }));
  }, [t]);

  const handleRemoveIconFile = useCallback(() => {
    if (iconPreviewUrl) URL.revokeObjectURL(iconPreviewUrl);
    setIconFile(null);
    setIconPreviewUrl(null);
    setForm((prev) => ({ ...prev, icon: '📁', iconType: 'emoji' }));
    setShowImageUpload(false);
  }, [iconPreviewUrl]);

  const handleIconDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDraggingIcon(false);
    const file = e.dataTransfer.files[0];
    if (file) handleIconFileSelect(file);
  }, [handleIconFileSelect]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error(t('errors.nameRequired', 'Le nom est obligatoire'));
      return;
    }

    if (!form.primaryTypeId) {
      toast.error(t('errors.typeRequired', "Le type d'objet est obligatoire"));
      return;
    }

    try {
      setSaving(true);
      let categoryId: number | undefined;

      if (isEditing && id) {
        categoryId = Number(id);
        const { primaryTypeId, ...updatePayload } = form;
        // Only send defaultProviders if the user explicitly modified them
        if (!providersModified) {
          delete updatePayload.defaultProviders;
        }
        // Don't send icon='pending-upload' — the upload endpoint handles it
        if (iconFile && updatePayload.icon === 'pending-upload') {
          delete updatePayload.icon;
          delete updatePayload.iconType;
        }
        await categoryService.updateCategory(categoryId, updatePayload);
      } else {
        const createPayload = { ...form };
        if (iconFile && createPayload.icon === 'pending-upload') {
          createPayload.icon = '📁';
          createPayload.iconType = 'emoji';
        }
        const res = await categoryService.createCategory(createPayload);
        categoryId = res.data?.id;
      }

      // Upload icon file if selected
      if (iconFile && categoryId) {
        try {
          await categoryService.uploadIcon(categoryId, iconFile);
        } catch {
          toast.error(t('errors.iconUploadFailed', "L'icône n'a pas pu être envoyée"));
        }
      }

      toast.success(isEditing
        ? t('updateSuccess', 'Catégorie mise à jour')
        : t('createSuccess', 'Catégorie créée')
      );
      navigate('/categories');
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || t('errors.saveFailed', 'Erreur lors de la sauvegarde');
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => navigate('/categories')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold text-[var(--color-text)]">
          {isEditing ? t('editTitle', 'Modifier la catégorie') : t('createTitle', 'Nouvelle catégorie')}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic info */}
        <Card>
          <CardHeader>
            <CardTitle>{t('form.basicInfo', 'Informations')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">
                {t('form.name', 'Nom')} <span className="text-red-500">*</span>
              </label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder={t('form.namePlaceholder', 'Ex: Jeux vidéo rétro')}
                maxLength={100}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">
                {t('form.description', 'Description')}
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder={t('form.descriptionPlaceholder', 'Décrivez cette catégorie...')}
                rows={3}
                maxLength={5000}
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-sm text-[var(--color-text)] placeholder-[var(--color-text-secondary)] focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">
                {t('form.notes', 'Notes privées')}
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder={t('form.notesPlaceholder', 'Notes visibles uniquement par vous...')}
                rows={2}
                maxLength={5000}
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-sm text-[var(--color-text)] placeholder-[var(--color-text-secondary)] focus:border-[var(--color-primary)] focus:outline-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Type d'objet & Providers */}
        <Card>
          <CardHeader>
            <CardTitle>{t('form.objectType', "Type d'objet")} <span className="text-red-500">*</span></CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Type selector grid */}
            <div>
              <p className="mb-2 text-xs text-[var(--color-text-secondary)]">
                {t('form.objectTypeHint', "Détermine les sources de recherche web disponibles pour cette catégorie")}
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {primaryTypes.map((pt) => (
                  <button
                    key={pt.id}
                    type="button"
                    disabled={isEditing && form.primaryTypeId !== 0 && form.primaryTypeId !== pt.id}
                    onClick={() => {
                      if (form.primaryTypeId === pt.id) return; // Already selected, don't reset
                      setForm({ ...form, primaryTypeId: pt.id, defaultProviders: [] });
                      setProvidersModified(true); // Type changed → providers reset is intentional
                    }}
                    className={`flex flex-col items-center gap-1 rounded-lg border p-2.5 text-center transition-all ${
                      form.primaryTypeId === pt.id
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 ring-1 ring-[var(--color-primary)]'
                        : isEditing && form.primaryTypeId !== 0
                          ? 'border-[var(--color-border)] opacity-40 cursor-not-allowed'
                          : 'border-[var(--color-border)] hover:border-[var(--color-text-secondary)] hover:bg-[var(--color-hover)]'
                    }`}
                  >
                    <span className="text-xl">{pt.icon}</span>
                    <span className="text-[11px] font-medium text-[var(--color-text)] leading-tight">{pt.name}</span>
                  </button>
                ))}
              </div>
              {isEditing && form.primaryTypeId !== 0 && (
                <p className="mt-2 text-xs text-amber-500">
                  {t('form.typeImmutable', "Le type ne peut pas être modifié après la création")}
                </p>
              )}
            </div>

            {/* Providers */}
            {form.primaryTypeId !== 0 && (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-medium text-[var(--color-text)]">
                    {t('form.defaultProviders', 'Providers par défaut')}
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowAllProviders(!showAllProviders)}
                    className="flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline"
                  >
                    {showAllProviders ? (
                      <><ChevronUp className="h-3 w-3" />{t('form.showTypeProviders', 'Type uniquement')}</>
                    ) : (
                      <><ChevronDown className="h-3 w-3" />{t('form.showAllProviders', 'Tous les providers')}</>
                    )}
                  </button>
                </div>
                <p className="mb-2 text-xs text-[var(--color-text-secondary)]">
                  {showAllProviders
                    ? t('form.allProvidersHint', 'Tous les providers disponibles, groupés par domaine')
                    : t('form.defaultProvidersHint', 'Sélectionnez les sources de recherche pré-activées pour cette catégorie')}
                </p>
                {loadingProviders ? (
                  <div className="flex gap-2">
                    <div className="h-9 w-24 animate-pulse rounded-lg bg-[var(--color-hover)]" />
                    <div className="h-9 w-28 animate-pulse rounded-lg bg-[var(--color-hover)]" />
                  </div>
                ) : availableProviders.length > 0 ? (
                  <div className="space-y-3">
                    {/* Group by domain when showing all */}
                    {showAllProviders ? (
                      Object.entries(
                        availableProviders.reduce<Record<string, AvailableProvider[]>>((acc, p) => {
                          (acc[p.domain] = acc[p.domain] || []).push(p);
                          return acc;
                        }, {})
                      ).map(([domain, providers]) => {
                        const typeDomainNames = new Set(typeProviders.map(tp => tp.domain));
                        const isTypeDomain = typeDomainNames.has(domain);
                        return (
                          <div key={domain}>
                            <p className={`mb-1.5 text-xs font-semibold uppercase tracking-wide ${
                              isTypeDomain ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)]'
                            }`}>
                              {domain}
                              {isTypeDomain && ' ★'}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {providers.map((p) => {
                                const isSelected = form.defaultProviders?.includes(p.name) ?? false;
                                return (
                                  <button
                                    key={`${p.domain}-${p.name}`}
                                    type="button"
                                    onClick={() => {
                                      const current = form.defaultProviders || [];
                                      const next = isSelected
                                        ? current.filter((n) => n !== p.name)
                                        : [...current, p.name];
                                      setForm({ ...form, defaultProviders: next });
                                      setProvidersModified(true);
                                    }}
                                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                                      isSelected
                                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                                        : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-secondary)]'
                                    }`}
                                    title={p.description}
                                  >
                                    {isSelected && <Check className="h-3 w-3" />}
                                    {p.name}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {availableProviders.map((p) => {
                          const isSelected = form.defaultProviders?.includes(p.name) ?? false;
                          return (
                            <button
                              key={`${p.domain}-${p.name}`}
                              type="button"
                              onClick={() => {
                                const current = form.defaultProviders || [];
                                const next = isSelected
                                  ? current.filter((n) => n !== p.name)
                                  : [...current, p.name];
                                setForm({ ...form, defaultProviders: next });
                                setProvidersModified(true);
                              }}
                              className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
                                isSelected
                                  ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                                  : 'border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-secondary)]'
                              }`}
                              title={p.description}
                            >
                              {isSelected && <Check className="h-3 w-3" />}
                              {p.name}
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {(form.defaultProviders?.length ?? 0) > 0 && (
                      <button
                        type="button"
                        onClick={() => { setForm({ ...form, defaultProviders: [] }); setProvidersModified(true); }}
                        className="px-2 py-2 rounded-lg text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition"
                      >
                        {t('form.clearProviders', 'Tout désélectionner')}
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-[var(--color-text-secondary)] italic">
                    {t('form.noProviders', 'Aucun provider disponible pour ce type')}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Icon & Color */}
        <Card>
          <CardHeader>
            <CardTitle>{t('form.appearance', 'Apparence')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Icon selector */}
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">
                {t('form.icon', 'Icône')}
              </label>

              {/* Emoji presets */}
              {!showImageUpload && (
                <div className="flex flex-wrap gap-2">
                  {PRESET_ICONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setForm({ ...form, icon: emoji, iconType: 'emoji' })}
                      className={`flex h-10 w-10 items-center justify-center rounded-lg text-xl transition-all ${
                        form.iconType === 'emoji' && form.icon === emoji
                          ? 'ring-2 ring-[var(--color-primary)] bg-[var(--color-primary)]/10 scale-110'
                          : 'bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-secondary)]/80'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {/* Image upload (drag & drop) */}
              {showImageUpload && (
                <div className="space-y-2">
                  <input
                    ref={iconInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleIconFileSelect(file);
                      e.target.value = '';
                    }}
                  />

                  {/* Preview or drop zone */}
                  {iconPreviewUrl || (form.iconType === 'url' && form.icon && form.icon !== 'pending-upload') ? (
                    <div className="relative inline-block">
                      <div className="flex h-24 w-24 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] overflow-hidden">
                        <img
                          src={iconPreviewUrl || form.icon}
                          alt="icon"
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveIconFile}
                        className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow hover:bg-red-600 transition"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => iconInputRef.current?.click()}
                        className="mt-2 text-xs text-[var(--color-primary)] hover:underline"
                      >
                        {t('form.changeImage', 'Changer l\'image')}
                      </button>
                    </div>
                  ) : (
                    <div
                      onDragOver={(e) => { e.preventDefault(); setDraggingIcon(true); }}
                      onDragLeave={() => setDraggingIcon(false)}
                      onDrop={handleIconDrop}
                      onClick={() => iconInputRef.current?.click()}
                      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors ${
                        draggingIcon
                          ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                          : 'border-[var(--color-border)] hover:border-[var(--color-text-secondary)] hover:bg-[var(--color-hover)]'
                      }`}
                    >
                      <Upload className={`h-8 w-8 ${draggingIcon ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)]'}`} />
                      <p className="text-sm text-[var(--color-text-secondary)]">
                        {t('form.dropIconHere', 'Glissez une image ici ou cliquez pour sélectionner')}
                      </p>
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        JPEG, PNG, WebP, GIF — max 5 Mo
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Toggle between emoji and image upload */}
              <button
                type="button"
                onClick={() => {
                  if (showImageUpload) {
                    handleRemoveIconFile();
                  } else {
                    setShowImageUpload(true);
                  }
                }}
                className="mt-2 flex items-center gap-1.5 text-xs text-[var(--color-primary)] hover:underline"
              >
                {showImageUpload ? (
                  <><span className="text-sm">🎭</span> {t('form.useEmoji', 'Utiliser un emoji')}</>
                ) : (
                  <><Upload className="h-3 w-3" /> {t('form.useImage', 'Utiliser une image')}</>
                )}
              </button>
            </div>

            {/* Color selector */}
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">
                {t('form.color', 'Couleur')}
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setForm({ ...form, color: c })}
                    className={`h-8 w-8 rounded-full transition-all ${
                      form.color === c
                        ? 'ring-2 ring-offset-2 ring-[var(--color-primary)] scale-110'
                        : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) => setForm({ ...form, color: e.target.value })}
                  className="h-8 w-8 cursor-pointer rounded border-0"
                />
                <span className="text-xs text-[var(--color-text-secondary)]">
                  {form.color}
                </span>
              </div>
            </div>

            {/* Preview */}
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--color-text)]">
                {t('form.preview', 'Aperçu')}
              </label>
              <div className="inline-flex items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${form.color}20` }}
                >
                  <CategoryIcon icon={iconPreviewUrl || form.icon || '📁'} iconType={form.iconType} size="lg" />
                </div>
                <div>
                  <p className="font-semibold text-[var(--color-text)]">
                    {form.name || t('form.previewName', 'Nom de la catégorie')}
                  </p>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    {form.description || t('form.previewDesc', 'Description')}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Visibility */}
        <Card>
          <CardHeader>
            <CardTitle>{t('form.visibility', 'Visibilité')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setForm({ ...form, isPublic: false })}
                className={`flex flex-1 items-center gap-3 rounded-lg border p-3 transition-colors ${
                  !form.isPublic
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                    : 'border-[var(--color-border)] hover:border-[var(--color-text-secondary)]'
                }`}
              >
                <span className="text-lg">🔒</span>
                <div className="text-left">
                  <p className="text-sm font-medium text-[var(--color-text)]">
                    {t('form.private', 'Privée')}
                  </p>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    {t('form.privateDesc', 'Visible uniquement par vous')}
                  </p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setForm({ ...form, isPublic: true })}
                className={`flex flex-1 items-center gap-3 rounded-lg border p-3 transition-colors ${
                  form.isPublic
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                    : 'border-[var(--color-border)] hover:border-[var(--color-text-secondary)]'
                }`}
              >
                <span className="text-lg">🌍</span>
                <div className="text-left">
                  <p className="text-sm font-medium text-[var(--color-text)]">
                    {t('form.public', 'Publique')}
                  </p>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    {t('form.publicDesc', 'Tous les utilisateurs peuvent la voir')}
                  </p>
                </div>
              </button>
            </div>

            {/* Admin: Default toggle */}
            {isAdmin && (
              <div
                onClick={() => setForm({ ...form, isDefault: !form.isDefault })}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                  form.isDefault
                    ? 'border-amber-500 bg-amber-500/5'
                    : 'border-[var(--color-border)] hover:border-[var(--color-text-secondary)]'
                }`}
              >
                <Shield className="h-5 w-5 text-amber-500" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-[var(--color-text)]">
                    {t('form.isDefault', 'Catégorie par défaut')}
                  </p>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    {t('form.isDefaultDesc', 'Cette catégorie sera proposée à tous les nouveaux utilisateurs')}
                  </p>
                </div>
                <span className="text-xs font-medium text-amber-500">
                  {t('form.adminOnly', 'Admin uniquement')}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Parent category selector */}
        <Card>
          <CardHeader>
            <CardTitle>{t('form.parentCategory', 'Catégorie parente')}</CardTitle>
          </CardHeader>
          <CardContent>
            <select
              value={form.parentIds?.[0] || ''}
              onChange={(e) => {
                const val = e.target.value;
                setForm({
                  ...form,
                  parentIds: val ? [Number(val)] : [],
                });
              }}
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
            >
              <option value="">
                {t('form.noParent', 'Aucune (catégorie racine)')}
              </option>
              {allCategories
                .filter((c) => c.id !== Number(id))
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.iconType === 'url' ? c.name : `${c.icon} ${c.name}`}
                  </option>
                ))}
            </select>
          </CardContent>
        </Card>

        {/* Media (edit mode only) */}
        {isEditing && id && (
          <Card>
            <CardHeader>
              <CardTitle>
                <Image className="mr-2 inline h-4 w-4" />
                {t('form.media', 'Médias')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MediaListManager categoryId={Number(id)} />
            </CardContent>
          </Card>
        )}

        {/* Category Fields (admin, default, edit mode only) */}
        {isAdmin && isEditing && id && form.isDefault && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>
                  <Settings2 className="mr-2 inline h-4 w-4" />
                  Champs personnalisés
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => { resetFieldForm(); setShowFieldForm(true); }}
                >
                  <Plus className="mr-1 h-3 w-3" /> Ajouter
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Existing fields list */}
              {categoryFields.length === 0 && !showFieldForm && (
                <p className="text-sm text-muted-foreground">Aucun champ personnalisé défini.</p>
              )}
              {categoryFields.length > 0 && (
                <div className="space-y-2">
                  {categoryFields.map((f) => (
                    <div key={f.id} className="flex items-center justify-between rounded-md border p-3">
                      <div>
                        <span className="font-medium">{f.name}</span>
                        <span className="ml-2 text-xs text-muted-foreground">({f.key})</span>
                        <span className="ml-2 rounded bg-muted px-1.5 py-0.5 text-xs">{f.type}</span>
                        {f.isRequired && <span className="ml-1 text-xs text-red-500">*</span>}
                      </div>
                      <div className="flex gap-1">
                        <Button type="button" size="sm" variant="ghost" onClick={() => startEditField(f)}>
                          <Edit3 className="h-3 w-3" />
                        </Button>
                        <Button type="button" size="sm" variant="ghost" className="text-destructive" onClick={() => handleDeleteField(f.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Field add/edit form */}
              {showFieldForm && (
                <div className="rounded-md border bg-muted/30 p-4 space-y-3">
                  <h4 className="text-sm font-semibold">{editingField ? 'Modifier le champ' : 'Nouveau champ'}</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium">Clé technique *</label>
                      <input
                        className="mt-1 w-full rounded-md border px-3 py-1.5 text-sm"
                        value={fieldForm.fieldKey}
                        onChange={(e) => setFieldForm({ ...fieldForm, fieldKey: e.target.value })}
                        placeholder="ex: color"
                        disabled={!!editingField}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium">Type *</label>
                      <select
                        className="mt-1 w-full rounded-md border px-3 py-1.5 text-sm"
                        value={fieldForm.fieldType}
                        onChange={(e) => setFieldForm({ ...fieldForm, fieldType: e.target.value })}
                      >
                        {FIELD_TYPES.map((ft) => (
                          <option key={ft.value} value={ft.value}>{ft.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium">Nom FR *</label>
                      <input
                        className="mt-1 w-full rounded-md border px-3 py-1.5 text-sm"
                        value={fieldForm.fieldNameFr}
                        onChange={(e) => setFieldForm({ ...fieldForm, fieldNameFr: e.target.value })}
                        placeholder="ex: Couleur"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium">Nom EN</label>
                      <input
                        className="mt-1 w-full rounded-md border px-3 py-1.5 text-sm"
                        value={fieldForm.fieldNameEn}
                        onChange={(e) => setFieldForm({ ...fieldForm, fieldNameEn: e.target.value })}
                        placeholder="ex: Color"
                      />
                    </div>
                  </div>
                  {(fieldForm.fieldType === 'select' || fieldForm.fieldType === 'multiselect') && (
                    <div>
                      <label className="text-xs font-medium">Options (séparées par des virgules)</label>
                      <input
                        className="mt-1 w-full rounded-md border px-3 py-1.5 text-sm"
                        value={fieldForm.fieldOptions}
                        onChange={(e) => setFieldForm({ ...fieldForm, fieldOptions: e.target.value })}
                        placeholder="ex: Ambre, Amethyst, Emerald"
                      />
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-medium">Icône</label>
                      <input
                        className="mt-1 w-full rounded-md border px-3 py-1.5 text-sm"
                        value={fieldForm.icon}
                        onChange={(e) => setFieldForm({ ...fieldForm, icon: e.target.value })}
                        placeholder="ex: palette"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium">Placeholder</label>
                      <input
                        className="mt-1 w-full rounded-md border px-3 py-1.5 text-sm"
                        value={fieldForm.placeholderFr}
                        onChange={(e) => setFieldForm({ ...fieldForm, placeholderFr: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium">Ordre</label>
                      <input
                        type="number"
                        className="mt-1 w-full rounded-md border px-3 py-1.5 text-sm"
                        value={fieldForm.sortOrder}
                        onChange={(e) => setFieldForm({ ...fieldForm, sortOrder: Number(e.target.value) })}
                      />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1.5 text-xs">
                      <input type="checkbox" checked={fieldForm.isRequired} onChange={(e) => setFieldForm({ ...fieldForm, isRequired: e.target.checked })} />
                      Requis
                    </label>
                    <label className="flex items-center gap-1.5 text-xs">
                      <input type="checkbox" checked={fieldForm.isSearchable} onChange={(e) => setFieldForm({ ...fieldForm, isSearchable: e.target.checked })} />
                      Recherchable
                    </label>
                    <label className="flex items-center gap-1.5 text-xs">
                      <input type="checkbox" checked={fieldForm.isFilterable} onChange={(e) => setFieldForm({ ...fieldForm, isFilterable: e.target.checked })} />
                      Filtrable
                    </label>
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" size="sm" onClick={handleSaveField} disabled={!fieldForm.fieldKey || !fieldForm.fieldNameFr}>
                      <Save className="mr-1 h-3 w-3" />
                      {editingField ? 'Mettre à jour' : 'Créer'}
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={resetFieldForm}>
                      Annuler
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Submit */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={() => navigate('/categories')}
          >
            {t('cancel', 'Annuler')}
          </Button>
          <Button type="submit" disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving
              ? t('saving', 'Enregistrement...')
              : isEditing
                ? t('save', 'Enregistrer')
                : t('create', 'Créer')}
          </Button>
        </div>
      </form>
    </div>
  );
}
