import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Tag, Edit2, Trash2, Shield } from 'lucide-react';
import { statusService, type Status } from '../../services/status.service';
import {
  Card,
  CardContent,
  Button,
  Input,
  Badge,
  Spinner,
  Modal,
} from '../../components/ui';
import toast from 'react-hot-toast';

const PRESET_COLORS = [
  '#22c55e', '#f59e0b', '#3b82f6', '#a855f7', '#ef4444',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
  '#06b6d4', '#6b7280',
];

const PRESET_ICONS = [
  'check-circle', 'search', 'truck', 'share-2', 'tag', 'heart',
  'star', 'archive', 'package', 'gift', 'alert-circle', 'clock',
];

export default function StatusesPage() {
  const { t } = useTranslation('manage');
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Status | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Status | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#6b7280');
  const [icon, setIcon] = useState('tag');

  const fetchStatuses = async () => {
    try {
      setLoading(true);
      const res = await statusService.getAll();
      setStatuses(res.data);
    } catch {
      toast.error(t('statuses.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStatuses(); }, []);

  const openCreate = () => {
    setEditTarget(null);
    setName('');
    setDescription('');
    setColor('#6b7280');
    setIcon('tag');
    setFormOpen(true);
  };

  const openEdit = (status: Status) => {
    if (status.isSystem) {
      toast.error(t('statuses.errors.systemEdit'));
      return;
    }
    setEditTarget(status);
    setName(status.name);
    setDescription(status.description || '');
    setColor(status.color);
    setIcon(status.icon);
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editTarget) {
        await statusService.update(editTarget.id, { name, description, color, icon });
        toast.success(t('statuses.updateSuccess'));
      } else {
        await statusService.create({ name, description, color, icon });
        toast.success(t('statuses.createSuccess'));
      }
      setFormOpen(false);
      fetchStatuses();
    } catch {
      toast.error(t('statuses.errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await statusService.delete(deleteTarget.id);
      toast.success(t('statuses.deleteSuccess'));
      setDeleteTarget(null);
      fetchStatuses();
    } catch {
      toast.error(t('statuses.errors.deleteFailed'));
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
            <Tag className="mr-2 inline h-6 w-6" />
            {t('statuses.title')}
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">{t('statuses.subtitle')}</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t('statuses.create')}
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {statuses.map((status) => (
            <Card key={status.id} className="group transition-all hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg text-white text-sm font-bold"
                      style={{ backgroundColor: status.color }}
                    >
                      {status.icon.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-[var(--color-text)]">{status.name}</h3>
                      {status.description && (
                        <p className="text-xs text-[var(--color-text-secondary)] line-clamp-1">{status.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {status.isSystem ? (
                      <Badge variant="secondary" className="text-xs">
                        <Shield className="mr-1 h-3 w-3" />
                        {t('statuses.system')}
                      </Badge>
                    ) : (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(status)}
                          className="rounded p-1 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-primary)]"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(status)}
                          className="rounded p-1 text-[var(--color-text-secondary)] hover:bg-red-500/10 hover:text-red-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
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
        title={editTarget ? t('statuses.form.name') : t('statuses.create')}
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">
              {t('statuses.form.name')} *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('statuses.form.namePlaceholder')}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">
              {t('statuses.form.description')}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('statuses.form.descriptionPlaceholder')}
              rows={2}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">
              {t('statuses.form.color')}
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-8 w-8 rounded-full border-2 transition ${
                    color === c ? 'border-[var(--color-text)] scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">
              {t('statuses.form.icon')}
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_ICONS.map((i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIcon(i)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    icon === i
                      ? 'bg-[var(--color-primary)] text-white'
                      : 'border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]'
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setFormOpen(false)}>
              {t('statuses.form.name') && 'Annuler'}
            </Button>
            <Button onClick={handleSave} disabled={saving || !name.trim()}>
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Supprimer">
        <p className="text-[var(--color-text-secondary)]">{t('statuses.deleteConfirm')}</p>
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
