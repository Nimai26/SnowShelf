import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, MapPin, Edit2, Trash2, Package } from 'lucide-react';
import { storageLocationService, type StorageLocation } from '../../services/storage-location.service';
import {
  Card,
  CardContent,
  Button,
  Input,
  Badge,
  Spinner,
  EmptyState,
  Modal,
} from '../../components/ui';
import toast from 'react-hot-toast';

export default function StorageLocationsPage() {
  const { t } = useTranslation('manage');
  const [locations, setLocations] = useState<StorageLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<StorageLocation | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StorageLocation | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const res = await storageLocationService.getAll();
      setLocations(res.data);
    } catch {
      toast.error(t('storageLocations.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLocations(); }, []);

  const openCreate = () => {
    setEditTarget(null);
    setName('');
    setDescription('');
    setFormOpen(true);
  };

  const openEdit = (loc: StorageLocation) => {
    setEditTarget(loc);
    setName(loc.name);
    setDescription(loc.description || '');
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editTarget) {
        await storageLocationService.update(editTarget.id, { name, description: description || undefined });
        toast.success(t('storageLocations.updateSuccess'));
      } else {
        await storageLocationService.create({ name, description: description || undefined });
        toast.success(t('storageLocations.createSuccess'));
      }
      setFormOpen(false);
      fetchLocations();
    } catch {
      toast.error(t('storageLocations.errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await storageLocationService.delete(deleteTarget.id);
      toast.success(t('storageLocations.deleteSuccess'));
      setDeleteTarget(null);
      fetchLocations();
    } catch {
      toast.error(t('storageLocations.errors.deleteFailed'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">
            <MapPin className="mr-2 inline h-6 w-6" />
            {t('storageLocations.title')}
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">{t('storageLocations.subtitle')}</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t('storageLocations.create')}
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : locations.length === 0 ? (
        <EmptyState
          title={t('storageLocations.empty')}
          description={t('storageLocations.emptyDesc')}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {locations.map((loc) => (
            <Card key={loc.id} className="group transition-all hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--color-text)]">{loc.name}</h3>
                      {loc.description && (
                        <p className="text-xs text-[var(--color-text-secondary)] line-clamp-1">{loc.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => openEdit(loc)}
                      className="rounded p-1 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-primary)]"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(loc)}
                      className="rounded p-1 text-[var(--color-text-secondary)] hover:bg-red-500/10 hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-3">
                  <Badge variant="default" className="text-xs">
                    <Package className="mr-1 h-3 w-3" />
                    {t('storageLocations.itemsCount', { count: loc.itemsCount })}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editTarget ? editTarget.name : t('storageLocations.create')}
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">
              {t('storageLocations.form.name')} *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('storageLocations.form.namePlaceholder')}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">
              {t('storageLocations.form.description')}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('storageLocations.form.descriptionPlaceholder')}
              rows={2}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setFormOpen(false)}>Annuler</Button>
            <Button onClick={handleSave} disabled={saving || !name.trim()}>
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Supprimer">
        <p className="text-[var(--color-text-secondary)]">{t('storageLocations.deleteConfirm')}</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Annuler</Button>
          <Button variant="danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Suppression...' : 'Supprimer'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
