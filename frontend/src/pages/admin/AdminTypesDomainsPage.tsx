import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft,
  Plus,
  Pencil,
  Trash2,
  Save,
  AlertTriangle,
  Globe,
  Layers,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Spinner } from '../../components/ui/Spinner';
import { Badge } from '../../components/ui/Badge';
// Switch component available if needed
import { adminService } from '../../services/admin.service';
import type {
  AdminPrimaryType,
  AdminDomain,
  CreatePrimaryTypePayload,
  UpdatePrimaryTypePayload,
  CreateProviderPayload,
} from '../../types/admin.types';
import toast from 'react-hot-toast';

// ── Emoji picker ──
const TYPE_ICONS = ['📚', '🎮', '🎵', '🎬', '📺', '🧸', '🧱', '🎲', '🃏', '🖼️', '📦', '🎤', '🧩', '💎', '🏆', '🎭', '🔧', '🎨', '🧲', '🌍', '🪁', '🛹', '⚽', '🎸'];
// DOMAIN_ICONS available for future use
// const DOMAIN_ICONS = ['🎮', '📚', '💬', '🎌', '🎬', '🎵', '🎲', '🧱', '🧸', '🃏', '🖼️', '🛒', '🎤', '🧩', '🌍', '🔧'];

type Tab = 'types' | 'domains';

export default function AdminTypesDomainsPage() {
  const { t } = useTranslation('admin');
  const [tab, setTab] = useState<Tab>('types');
  const [loading, setLoading] = useState(true);

  // Data
  const [types, setTypes] = useState<AdminPrimaryType[]>([]);
  const [domains, setDomains] = useState<AdminDomain[]>([]);

  // Type modal
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<AdminPrimaryType | null>(null);
  const [typeForm, setTypeForm] = useState<CreatePrimaryTypePayload>({
    keyName: '', nameFr: '', nameEn: '', icon: '📦', color: '#3498db', sortOrder: 0, domainIds: [],
  });
  const [saving, setSaving] = useState(false);

  // Delete modal
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<{ type: 'type' | 'domain' | 'provider'; id: number; name: string } | null>(null);

  // Domain expanded
  const [expandedDomainId, setExpandedDomainId] = useState<number | null>(null);

  // Provider modal
  const [providerModalOpen, setProviderModalOpen] = useState(false);
  const [providerForm, setProviderForm] = useState<CreateProviderPayload>({
    domainId: 0, key: '', displayName: '', description: '', detailSegment: '', sortOrder: 0,
  });
  const [, setProviderDomainId] = useState<number>(0);

  // ─── Load data ───
  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [typesData, domainsData] = await Promise.all([
        adminService.getAdminTypes(),
        adminService.getAdminDomains(),
      ]);
      setTypes(typesData);
      setDomains(domainsData);
    } catch (err: any) {
      toast.error(err.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  // ─── Type helpers ───
  const autoKey = (name: string) =>
    name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

  const openCreateType = () => {
    setEditingType(null);
    const maxSort = types.reduce((m, t) => Math.max(m, t.sortOrder), 0);
    setTypeForm({ keyName: '', nameFr: '', nameEn: '', icon: '📦', color: '#3498db', sortOrder: maxSort + 1, domainIds: [] });
    setTypeModalOpen(true);
  };

  const openEditType = (type: AdminPrimaryType) => {
    setEditingType(type);
    setTypeForm({
      keyName: type.keyName,
      nameFr: type.nameFr,
      nameEn: type.nameEn,
      icon: type.icon,
      color: type.color,
      sortOrder: type.sortOrder,
      domainIds: type.domainIds,
    });
    setTypeModalOpen(true);
  };

  const handleSaveType = async () => {
    if (!typeForm.keyName || !typeForm.nameFr || !typeForm.icon) return;
    setSaving(true);
    try {
      if (editingType) {
        await adminService.updateAdminType(editingType.id, typeForm as UpdatePrimaryTypePayload);
        toast.success(t('tako.typeSaved'));
      } else {
        await adminService.createAdminType(typeForm);
        toast.success(t('tako.typeCreated'));
      }
      setTypeModalOpen(false);
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  // ─── Provider helpers ───
  const openAddProvider = (domainId: number) => {
    setProviderDomainId(domainId);
    const domain = domains.find((d) => d.id === domainId);
    const maxSort = (domain?.providers || []).reduce((m, p) => Math.max(m, p.sortOrder), 0);
    setProviderForm({ domainId, key: '', displayName: '', description: '', detailSegment: '', sortOrder: maxSort + 1 });
    setProviderModalOpen(true);
  };

  const handleSaveProvider = async () => {
    if (!providerForm.key || !providerForm.displayName) return;
    setSaving(true);
    try {
      await adminService.createAdminProvider(providerForm);
      toast.success(t('tako.providerCreated'));
      setProviderModalOpen(false);
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleProvider = async (providerId: number) => {
    try {
      await adminService.toggleAdminProvider(providerId);
      await loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // ─── Delete helpers ───
  const confirmDelete = async () => {
    if (!deletingItem) return;
    try {
      if (deletingItem.type === 'type') {
        await adminService.deleteAdminType(deletingItem.id);
      } else if (deletingItem.type === 'domain') {
        await adminService.deleteAdminDomain(deletingItem.id);
      } else if (deletingItem.type === 'provider') {
        await adminService.deleteAdminProvider(deletingItem.id);
      }
      toast.success(t('tako.deleted'));
      setDeleteModalOpen(false);
      setDeletingItem(null);
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Erreur');
    }
  };

  // ─── Domain toggle ───
  const toggleDomain = (id: number) => {
    setExpandedDomainId(expandedDomainId === id ? null : id);
  };

  // ─── Domain checkbox for type modal ───
  const toggleDomainForType = (domainId: number) => {
    setTypeForm((prev) => {
      const ids = prev.domainIds || [];
      return {
        ...prev,
        domainIds: ids.includes(domainId)
          ? ids.filter((id) => id !== domainId)
          : [...ids, domainId],
      };
    });
  };

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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link to="/admin" className="p-2 rounded-lg hover:bg-[var(--color-bg-secondary)] transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
              {t('tako.title')}
            </h1>
            <p className="text-sm text-[var(--color-text-tertiary)]">
              {t('tako.subtitle')}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[var(--color-border)] pb-2">
        <button
          onClick={() => setTab('types')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
            tab === 'types'
              ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          <Layers className="w-4 h-4" />
          {t('tako.tabTypes')} ({types.length})
        </button>
        <button
          onClick={() => setTab('domains')}
          className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
            tab === 'domains'
              ? 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] border-b-2 border-[var(--color-primary)]'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          <Globe className="w-4 h-4" />
          {t('tako.tabDomains')} ({domains.length})
        </button>
      </div>

      {/* ═══ TYPES TAB ═══ */}
      {tab === 'types' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={openCreateType}>
              <Plus className="w-4 h-4 mr-1" /> {t('tako.addType')}
            </Button>
          </div>

          <div className="grid gap-3">
            {types.map((type) => (
              <Card key={type.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{type.icon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[var(--color-text-primary)]">
                            {type.nameFr}
                          </span>
                          <code className="text-xs bg-[var(--color-bg-tertiary)] px-2 py-0.5 rounded text-[var(--color-text-tertiary)]">
                            {type.keyName}
                          </code>
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: type.color }}
                            title={type.color}
                          />
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {type.domains.length > 0 ? (
                            type.domains.map((d) => (
                              <Badge key={d.id} variant="secondary" className="text-xs">
                                {d.icon || '🌐'} {d.displayName}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-[var(--color-text-tertiary)]">
                              {t('tako.noDomains')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEditType(type)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      {type.keyName !== 'divers' && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => {
                            setDeletingItem({ type: 'type', id: type.id, name: type.nameFr });
                            setDeleteModalOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ═══ DOMAINS TAB ═══ */}
      {tab === 'domains' && (
        <div className="space-y-3">
          {domains.map((domain) => {
            const isExpanded = expandedDomainId === domain.id;
            return (
              <Card key={domain.id}>
                <CardContent className="p-0">
                  {/* Domain header */}
                  <button
                    onClick={() => toggleDomain(domain.id)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--color-bg-secondary)] transition-colors rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{domain.icon || '🌐'}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[var(--color-text-primary)]">
                            {domain.displayName}
                          </span>
                          <code className="text-xs bg-[var(--color-bg-tertiary)] px-2 py-0.5 rounded">
                            {domain.name}
                          </code>
                          {!domain.isActive && (
                            <Badge variant="danger" className="text-xs">{t('tako.inactive')}</Badge>
                          )}
                        </div>
                        <p className="text-xs text-[var(--color-text-tertiary)]">
                          {domain.providers.length} provider(s) — {domain.routePath}
                        </p>
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>

                  {/* Expanded providers */}
                  {isExpanded && (
                    <div className="border-t border-[var(--color-border)] px-4 pb-4 pt-2 space-y-2">
                      {domain.providers.length === 0 ? (
                        <p className="text-sm text-[var(--color-text-tertiary)] py-2">
                          {t('tako.noProviders')}
                        </p>
                      ) : (
                        domain.providers.map((provider) => (
                          <div
                            key={provider.id}
                            className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                              provider.isActive
                                ? 'border-[var(--color-border)] bg-[var(--color-bg-primary)]'
                                : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10 opacity-60'
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm text-[var(--color-text-primary)]">
                                  {provider.displayName}
                                </span>
                                <code className="text-xs bg-[var(--color-bg-tertiary)] px-1.5 py-0.5 rounded">
                                  {provider.key}
                                </code>
                                {provider.detailSegment && (
                                  <span className="text-xs text-[var(--color-text-tertiary)]">
                                    /{provider.detailSegment}/
                                  </span>
                                )}
                              </div>
                              {provider.description && (
                                <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5 truncate">
                                  {provider.description}
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 ml-2">
                              <button
                                onClick={() => handleToggleProvider(provider.id)}
                                className="p-1.5 rounded hover:bg-[var(--color-bg-tertiary)] transition-colors"
                                title={provider.isActive ? t('tako.disable') : t('tako.enable')}
                              >
                                {provider.isActive ? (
                                  <ToggleRight className="w-5 h-5 text-green-500" />
                                ) : (
                                  <ToggleLeft className="w-5 h-5 text-[var(--color-text-tertiary)]" />
                                )}
                              </button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  setDeletingItem({ type: 'provider', id: provider.id, name: provider.displayName });
                                  setDeleteModalOpen(true);
                                }}
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                      <Button
                        size="sm"
                        variant="secondary"
                        className="mt-2"
                        onClick={() => openAddProvider(domain.id)}
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" /> {t('tako.addProvider')}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ═══ TYPE CREATE/EDIT MODAL ═══ */}
      <Modal open={typeModalOpen} onClose={() => setTypeModalOpen(false)}>
        <div className="p-6 max-h-[85vh] overflow-y-auto">
          <h2 className="text-lg font-semibold mb-4 text-[var(--color-text-primary)]">
            {editingType ? t('tako.editType') : t('tako.addType')}
          </h2>

          <div className="space-y-4">
            {/* Names */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t('tako.form.nameFr')}
                value={typeForm.nameFr}
                onChange={(e) => {
                  const val = e.target.value;
                  setTypeForm((prev) => ({
                    ...prev,
                    nameFr: val,
                    keyName: editingType ? prev.keyName : autoKey(val),
                  }));
                }}
              />
              <Input
                label={t('tako.form.nameEn')}
                value={typeForm.nameEn}
                onChange={(e) => setTypeForm((prev) => ({ ...prev, nameEn: e.target.value }))}
              />
            </div>

            {/* Key */}
            <Input
              label={t('tako.form.key')}
              value={typeForm.keyName}
              onChange={(e) => setTypeForm((prev) => ({
                ...prev,
                keyName: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
              }))}
              disabled={!!editingType}
            />

            {/* Icon + Color */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  {t('tako.form.icon')}
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-2xl w-10 h-10 flex items-center justify-center rounded-lg bg-[var(--color-bg-secondary)]">
                    {typeForm.icon}
                  </span>
                  <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                    {TYPE_ICONS.map((ic) => (
                      <button
                        key={ic}
                        type="button"
                        onClick={() => setTypeForm((prev) => ({ ...prev, icon: ic }))}
                        className={`text-lg p-1 rounded hover:bg-[var(--color-bg-tertiary)] ${typeForm.icon === ic ? 'ring-2 ring-[var(--color-primary)]' : ''}`}
                      >
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                  {t('tako.form.color')}
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={typeForm.color}
                    onChange={(e) => setTypeForm((prev) => ({ ...prev, color: e.target.value }))}
                    className="w-10 h-10 rounded border-0 cursor-pointer"
                  />
                  <Input
                    value={typeForm.color}
                    onChange={(e) => setTypeForm((prev) => ({ ...prev, color: e.target.value }))}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Domains assignment */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                {t('tako.form.domains')}
              </label>
              <div className="flex flex-wrap gap-2">
                {domains.map((d) => {
                  const isSelected = (typeForm.domainIds || []).includes(d.id);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleDomainForType(d.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                        isSelected
                          ? 'ring-2 ring-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                          : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'
                      }`}
                    >
                      <span>{d.icon || '🌐'}</span>
                      <span>{d.displayName}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                {t('tako.form.domainsHint')}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[var(--color-border)]">
            <Button variant="secondary" onClick={() => setTypeModalOpen(false)}>
              {t('tako.form.cancel')}
            </Button>
            <Button onClick={handleSaveType} loading={saving} disabled={!typeForm.keyName || !typeForm.nameFr}>
              <Save className="w-4 h-4 mr-1" />
              {editingType ? t('tako.form.update') : t('tako.form.create')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ═══ PROVIDER CREATE MODAL ═══ */}
      <Modal open={providerModalOpen} onClose={() => setProviderModalOpen(false)}>
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4 text-[var(--color-text-primary)]">
            {t('tako.addProvider')}
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t('tako.form.providerKey')}
                value={providerForm.key}
                placeholder="ex: googlebooks"
                onChange={(e) => setProviderForm((prev) => ({
                  ...prev,
                  key: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''),
                }))}
              />
              <Input
                label={t('tako.form.providerName')}
                value={providerForm.displayName}
                placeholder="ex: Google Books"
                onChange={(e) => setProviderForm((prev) => ({ ...prev, displayName: e.target.value }))}
              />
            </div>
            <Input
              label={t('tako.form.providerDesc')}
              value={providerForm.description}
              onChange={(e) => setProviderForm((prev) => ({ ...prev, description: e.target.value }))}
            />
            <Input
              label={t('tako.form.detailSegment')}
              value={providerForm.detailSegment}
              placeholder={`ex: game, book, issue... (${t('tako.form.optional')})`}
              onChange={(e) => setProviderForm((prev) => ({ ...prev, detailSegment: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-[var(--color-border)]">
            <Button variant="secondary" onClick={() => setProviderModalOpen(false)}>
              {t('tako.form.cancel')}
            </Button>
            <Button onClick={handleSaveProvider} loading={saving} disabled={!providerForm.key || !providerForm.displayName}>
              <Plus className="w-4 h-4 mr-1" /> {t('tako.form.create')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ═══ DELETE CONFIRMATION ═══ */}
      <Modal open={deleteModalOpen} onClose={() => setDeleteModalOpen(false)}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              {t('tako.deleteTitle')}
            </h2>
          </div>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6">
            {t('tako.deleteConfirm', { name: deletingItem?.name })}
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => { setDeleteModalOpen(false); setDeletingItem(null); }}>
              {t('tako.form.cancel')}
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              <Trash2 className="w-4 h-4 mr-1" /> {t('tako.form.delete')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
