import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Save,
  AlertTriangle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import { Switch } from '../../components/ui/Switch';
import { adminService } from '../../services/admin.service';
import type { PrimaryType } from '../../types/category.types';
import type { AdminField, FieldTypeOption, CreateFieldPayload, UpdateFieldPayload } from '../../types/admin.types';

// ─── Emoji Picker léger ───
const COMMON_ICONS = ['📝', '✍️', '🏢', '🔢', '📅', '📄', '🎭', '🌍', '✅', '⭐', '🎮', '👨‍💻', '👥', '🌐', '⏱️', '🎤', '💿', '🏷️', '📀', '🎶', '🎬', '📡', '📺', '🦸', '📏', '🧱', '📦', '🧩', '🧑', '🏗️', '🃏', '📂', '💎', '🏅', '📊', '🏆', '📻'];

export default function AdminFieldsPage() {
  const { t } = useTranslation('admin');

  // State
  const [types, setTypes] = useState<PrimaryType[]>([]);
  const [fieldTypes, setFieldTypes] = useState<FieldTypeOption[]>([]);
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const [fields, setFields] = useState<AdminField[]>([]);
  const [loading, setLoading] = useState(true);
  const [fieldsLoading, setFieldsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<AdminField | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingField, setDeletingField] = useState<AdminField | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [form, setForm] = useState<CreateFieldPayload>({
    primaryTypeId: 0,
    fieldKey: '',
    fieldNameFr: '',
    fieldNameEn: '',
    fieldType: 'text',
    fieldOptions: null,
    placeholderFr: '',
    placeholderEn: '',
    helpTextFr: '',
    helpTextEn: '',
    icon: '',
    isRequired: false,
    isSearchable: true,
    isFilterable: true,
  });
  const [optionsText, setOptionsText] = useState('');

  // Drag state
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [hasReorderChanges, setHasReorderChanges] = useState(false);

  // ─── Load initial data ───
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [typesData, fieldTypesData] = await Promise.all([
        adminService.getPrimaryTypes(),
        adminService.getFieldTypes(),
      ]);
      setTypes(typesData);
      setFieldTypes(fieldTypesData);
      if (typesData.length > 0) {
        setSelectedTypeId(typesData[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  // ─── Load fields when type changes ───
  useEffect(() => {
    if (selectedTypeId) {
      loadFields(selectedTypeId);
    }
  }, [selectedTypeId]);

  const loadFields = async (typeId: number) => {
    try {
      setFieldsLoading(true);
      setHasReorderChanges(false);
      const data = await adminService.getFieldsForAdmin(typeId);
      setFields(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setFieldsLoading(false);
    }
  };

  // ─── Field form helpers ───
  const selectedType = types.find((t) => t.id === selectedTypeId);

  const resetForm = (typeId?: number) => {
    setForm({
      primaryTypeId: typeId || selectedTypeId || 0,
      fieldKey: '',
      fieldNameFr: '',
      fieldNameEn: '',
      fieldType: 'text',
      fieldOptions: null,
      placeholderFr: '',
      placeholderEn: '',
      helpTextFr: '',
      helpTextEn: '',
      icon: '',
      isRequired: false,
      isSearchable: true,
      isFilterable: true,
    });
    setOptionsText('');
    setEditingField(null);
  };

  const openCreateModal = () => {
    resetForm(selectedTypeId!);
    setModalOpen(true);
  };

  const openEditModal = (field: AdminField) => {
    setEditingField(field);
    setForm({
      primaryTypeId: field.primaryTypeId,
      fieldKey: field.fieldKey,
      fieldNameFr: field.fieldNameFr,
      fieldNameEn: field.fieldNameEn || '',
      fieldType: field.fieldType,
      fieldOptions: field.fieldOptions,
      placeholderFr: field.placeholderFr || '',
      placeholderEn: field.placeholderEn || '',
      helpTextFr: field.helpTextFr || '',
      helpTextEn: field.helpTextEn || '',
      icon: field.icon || '',
      isRequired: field.isRequired,
      isSearchable: field.isSearchable,
      isFilterable: field.isFilterable,
    });
    setOptionsText(field.fieldOptions ? field.fieldOptions.join('\n') : '');
    setModalOpen(true);
  };

  const needsOptions = (type: string) => type === 'select' || type === 'multiselect';

  // Auto-generate key from French name
  const autoKey = (name: string) =>
    name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');

  // ─── CRUD operations ───
  const handleSave = async () => {
    if (!form.fieldKey || !form.fieldNameFr) return;
    setSaving(true);
    try {
      const payload: any = { ...form };
      if (needsOptions(form.fieldType || 'text')) {
        payload.fieldOptions = optionsText
          .split('\n')
          .map((s: string) => s.trim())
          .filter(Boolean);
      } else {
        payload.fieldOptions = null;
      }

      if (editingField) {
        const { primaryTypeId: _, ...updatePayload } = payload;
        await adminService.updateField(editingField.id, updatePayload as UpdateFieldPayload);
      } else {
        await adminService.createField(payload as CreateFieldPayload);
      }

      setModalOpen(false);
      if (selectedTypeId) loadFields(selectedTypeId);
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingField) return;
    try {
      await adminService.deleteField(deletingField.id);
      setDeleteModalOpen(false);
      setDeletingField(null);
      if (selectedTypeId) loadFields(selectedTypeId);
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Erreur');
    }
  };

  // ─── Drag-and-drop reorder ───
  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;

    const reordered = [...fields];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(index, 0, moved);
    setFields(reordered);
    setDragIndex(index);
    setHasReorderChanges(true);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
  };

  const saveReorder = async () => {
    if (!selectedTypeId) return;
    try {
      const fieldOrders = fields.map((f, i) => ({ id: f.id, sortOrder: i + 1 }));
      await adminService.reorderFields(selectedTypeId, fieldOrders);
      setHasReorderChanges(false);
      loadFields(selectedTypeId);
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Erreur');
    }
  };

  // ─── Field type badge ───
  const getFieldTypeBadge = (type: string) => {
    const ft = fieldTypes.find((f) => f.value === type);
    const label = ft?.label || type;
    const variant =
      type === 'select' || type === 'multiselect'
        ? 'secondary'
        : type === 'boolean'
          ? 'success'
          : type === 'number' || type === 'year'
            ? 'warning'
            : 'default';
    return <Badge variant={variant}>{label}</Badge>;
  };

  // ─── Loading ───
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/admin"
            className="p-2 rounded-lg hover:bg-[var(--color-bg-secondary)] transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
              {t('fields.title')}
            </h1>
            <p className="text-sm text-[var(--color-text-tertiary)]">
              {t('fields.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Type Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <label className="text-sm font-medium text-[var(--color-text-secondary)] whitespace-nowrap">
              {t('fields.selectType')}
            </label>
            <div className="flex flex-wrap gap-2 w-full">
              {types.map((type) => (
                <button
                  key={type.id}
                  onClick={() => setSelectedTypeId(type.id)}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
                    ${
                      selectedTypeId === type.id
                        ? 'ring-2 ring-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                        : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'
                    }
                  `}
                >
                  <span>{type.icon}</span>
                  <span className="hidden sm:inline">{type.name}</span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fields List */}
      {selectedType && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{selectedType.icon}</span>
              <CardTitle>
                {selectedType.name} — {t('fields.fieldsCount', { count: fields.length })}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {hasReorderChanges && (
                <Button size="sm" variant="secondary" onClick={saveReorder}>
                  <Save className="w-4 h-4 mr-1" />
                  {t('fields.saveOrder')}
                </Button>
              )}
              <Button size="sm" onClick={openCreateModal}>
                <Plus className="w-4 h-4 mr-1" />
                {t('fields.addField')}
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            {fieldsLoading ? (
              <div className="flex justify-center py-8">
                <Spinner />
              </div>
            ) : fields.length === 0 ? (
              <EmptyState
                icon={<span className="text-4xl">📝</span>}
                title={t('fields.noFields')}
                description={t('fields.noFieldsDesc')}
                action={
                  <Button size="sm" onClick={openCreateModal}>
                    <Plus className="w-4 h-4 mr-1" />
                    {t('fields.addField')}
                  </Button>
                }
              />
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[var(--color-border)]">
                        <th className="w-8"></th>
                        <th className="text-left p-3 font-medium text-[var(--color-text-tertiary)]">{t('fields.col.icon')}</th>
                        <th className="text-left p-3 font-medium text-[var(--color-text-tertiary)]">{t('fields.col.key')}</th>
                        <th className="text-left p-3 font-medium text-[var(--color-text-tertiary)]">{t('fields.col.nameFr')}</th>
                        <th className="text-left p-3 font-medium text-[var(--color-text-tertiary)]">{t('fields.col.nameEn')}</th>
                        <th className="text-left p-3 font-medium text-[var(--color-text-tertiary)]">{t('fields.col.type')}</th>
                        <th className="text-left p-3 font-medium text-[var(--color-text-tertiary)]">{t('fields.col.options')}</th>
                        <th className="text-left p-3 font-medium text-[var(--color-text-tertiary)]">{t('fields.col.required')}</th>
                        <th className="text-right p-3 font-medium text-[var(--color-text-tertiary)]">{t('fields.col.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fields.map((field, index) => (
                        <tr
                          key={field.id}
                          draggable
                          onDragStart={() => handleDragStart(index)}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDragEnd={handleDragEnd}
                          className={`
                            border-b border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors
                            ${dragIndex === index ? 'opacity-50 bg-[var(--color-primary)]/5' : ''}
                          `}
                        >
                          <td className="p-2 cursor-grab">
                            <GripVertical className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                          </td>
                          <td className="p-3 text-lg">{field.icon || '—'}</td>
                          <td className="p-3">
                            <code className="text-xs bg-[var(--color-bg-tertiary)] px-2 py-1 rounded">
                              {field.fieldKey}
                            </code>
                          </td>
                          <td className="p-3 font-medium text-[var(--color-text-primary)]">
                            {field.fieldNameFr}
                          </td>
                          <td className="p-3 text-[var(--color-text-secondary)]">
                            {field.fieldNameEn}
                          </td>
                          <td className="p-3">{getFieldTypeBadge(field.fieldType)}</td>
                          <td className="p-3 text-[var(--color-text-tertiary)] text-xs max-w-[200px] truncate">
                            {field.fieldOptions ? field.fieldOptions.join(', ') : '—'}
                          </td>
                          <td className="p-3 text-center">
                            {field.isRequired ? (
                              <Badge variant="danger">Oui</Badge>
                            ) : (
                              <span className="text-[var(--color-text-tertiary)]">—</span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => openEditModal(field)}
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  setDeletingField(field);
                                  setDeleteModalOpen(true);
                                }}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden space-y-3">
                  {fields.map((field, index) => (
                    <div
                      key={field.id}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      className={`
                        p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)]
                        ${dragIndex === index ? 'opacity-50' : ''}
                      `}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-4 h-4 text-[var(--color-text-tertiary)] cursor-grab" />
                          <span className="text-lg">{field.icon || '📝'}</span>
                          <span className="font-medium text-[var(--color-text-primary)]">
                            {field.fieldNameFr}
                          </span>
                          {field.isRequired && <Badge variant="danger">!</Badge>}
                        </div>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => openEditModal(field)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setDeletingField(field);
                              setDeleteModalOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                        <code className="text-xs bg-[var(--color-bg-tertiary)] px-2 py-0.5 rounded">
                          {field.fieldKey}
                        </code>
                        {getFieldTypeBadge(field.fieldType)}
                      </div>
                      {field.fieldOptions && (
                        <p className="mt-1 text-xs text-[var(--color-text-tertiary)] truncate">
                          {field.fieldOptions.join(', ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ─── Create / Edit Modal ─── */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <div className="p-6 max-h-[85vh] overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4 text-[var(--color-text-primary)]">
            {editingField ? t('fields.editField') : t('fields.addField')}
          </h2>

          <div className="space-y-4">
            {/* Nom FR → auto key */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t('fields.form.nameFr')}
                value={form.fieldNameFr}
                onChange={(e) => {
                  const val = e.target.value;
                  setForm((prev) => ({
                    ...prev,
                    fieldNameFr: val,
                    fieldKey: editingField ? prev.fieldKey : autoKey(val),
                  }));
                }}
              />
              <Input
                label={t('fields.form.nameEn')}
                value={form.fieldNameEn || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, fieldNameEn: e.target.value }))}
              />
            </div>

            {/* Key */}
            <Input
              label={t('fields.form.key')}
              value={form.fieldKey}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  fieldKey: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
                }))
              }
            />

            {/* Type + Icon */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label={t('fields.form.fieldType')}
                value={form.fieldType || 'text'}
                onChange={(e) => setForm((prev) => ({ ...prev, fieldType: e.target.value }))}
                options={fieldTypes.map((ft) => ({ value: ft.value, label: ft.label }))}
              />
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  {t('fields.form.icon')}
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-2xl w-10 h-10 flex items-center justify-center rounded-lg bg-[var(--color-bg-secondary)]">
                    {form.icon || '📝'}
                  </span>
                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                    {COMMON_ICONS.map((ic) => (
                      <button
                        key={ic}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, icon: ic }))}
                        className={`text-lg p-1 rounded hover:bg-[var(--color-bg-tertiary)] ${form.icon === ic ? 'ring-2 ring-[var(--color-primary)]' : ''}`}
                      >
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Options (select/multiselect) */}
            {needsOptions(form.fieldType || 'text') && (
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  {t('fields.form.options')}
                </label>
                <textarea
                  className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] text-sm min-h-[100px] focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                  value={optionsText}
                  onChange={(e) => setOptionsText(e.target.value)}
                  placeholder={t('fields.form.optionsPlaceholder')}
                />
                <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                  {t('fields.form.optionsHint')}
                </p>
              </div>
            )}

            {/* Placeholders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t('fields.form.placeholderFr')}
                value={form.placeholderFr || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, placeholderFr: e.target.value }))}
              />
              <Input
                label={t('fields.form.placeholderEn')}
                value={form.placeholderEn || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, placeholderEn: e.target.value }))}
              />
            </div>

            {/* Help texts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t('fields.form.helpTextFr')}
                value={form.helpTextFr || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, helpTextFr: e.target.value }))}
              />
              <Input
                label={t('fields.form.helpTextEn')}
                value={form.helpTextEn || ''}
                onChange={(e) => setForm((prev) => ({ ...prev, helpTextEn: e.target.value }))}
              />
            </div>

            {/* Flags */}
            <div className="flex flex-wrap gap-6 pt-2">
              <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                <Switch
                  checked={form.isRequired || false}
                  onChange={(val) => setForm((prev) => ({ ...prev, isRequired: val }))}
                />
                {t('fields.form.isRequired')}
              </label>
              <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                <Switch
                  checked={form.isSearchable !== false}
                  onChange={(val) => setForm((prev) => ({ ...prev, isSearchable: val }))}
                />
                {t('fields.form.isSearchable')}
              </label>
              <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                <Switch
                  checked={form.isFilterable !== false}
                  onChange={(val) => setForm((prev) => ({ ...prev, isFilterable: val }))}
                />
                {t('fields.form.isFilterable')}
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[var(--color-border)]">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              {t('fields.form.cancel')}
            </Button>
            <Button
              onClick={handleSave}
              loading={saving}
              disabled={!form.fieldKey || !form.fieldNameFr}
            >
              <Save className="w-4 h-4 mr-1" />
              {editingField ? t('fields.form.update') : t('fields.form.create')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─── Delete Confirmation ─── */}
      <Modal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              {t('fields.deleteTitle')}
            </h2>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6">
            {t('fields.deleteConfirm', { name: deletingField?.fieldNameFr })}
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setDeleteModalOpen(false)}>
              {t('fields.form.cancel')}
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-1" />
              {t('fields.form.delete')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
