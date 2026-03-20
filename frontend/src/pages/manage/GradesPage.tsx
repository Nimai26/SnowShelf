import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Award, Edit2, Trash2, Shield } from 'lucide-react';
import { gradeService, type Grade, type CreateGradePayload } from '../../services/grade.service';
import { categoryService } from '../../services/category.service';
import type { Category } from '../../types/category.types';
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

export default function GradesPage() {
  const { t } = useTranslation('manage');
  const [grades, setGrades] = useState<Grade[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Grade | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Grade | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryIds, setCategoryIds] = useState<number[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [gradesRes, catsRes] = await Promise.all([
        gradeService.getAll(),
        categoryService.getCategories({ filter: 'all', limit: 100 }),
      ]);
      setGrades(gradesRes.data);
      setCategories(catsRes.data.categories);
    } catch {
      toast.error(t('grades.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const openCreate = () => {
    setEditTarget(null);
    setName('');
    setDescription('');
    setCategoryIds([]);
    setFormOpen(true);
  };

  const openEdit = (grade: Grade) => {
    if (grade.isSystem) return;
    setEditTarget(grade);
    setName(grade.name);
    setDescription(grade.description || '');
    setCategoryIds(grade.categories?.map(c => c.id) || []);
    setFormOpen(true);
  };

  const toggleCategory = (catId: number) => {
    setCategoryIds(prev =>
      prev.includes(catId) ? prev.filter(id => id !== catId) : [...prev, catId]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const payload: CreateGradePayload = {
        name,
        description: description || undefined,
        categoryIds: categoryIds.length > 0 ? categoryIds : undefined,
      };
      if (editTarget) {
        await gradeService.update(editTarget.id, payload);
        toast.success(t('grades.updateSuccess'));
      } else {
        await gradeService.create(payload);
        toast.success(t('grades.createSuccess'));
      }
      setFormOpen(false);
      fetchData();
    } catch {
      toast.error(t('grades.errors.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await gradeService.delete(deleteTarget.id);
      toast.success(t('grades.deleteSuccess'));
      setDeleteTarget(null);
      fetchData();
    } catch {
      toast.error(t('grades.errors.deleteFailed'));
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
            <Award className="mr-2 inline h-6 w-6" />
            {t('grades.title')}
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">{t('grades.subtitle')}</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          {t('grades.create')}
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {grades.map((grade) => (
            <Card key={grade.id} className="group transition-all hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-[var(--color-text)]">{grade.name}</h3>
                    {grade.description && (
                      <p className="text-xs text-[var(--color-text-secondary)] line-clamp-1">
                        {grade.description}
                      </p>
                    )}
                    {grade.categories && grade.categories.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {grade.categories.map(cat => (
                          <Badge key={cat.id} variant="secondary" className="text-[10px]">
                            {cat.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {grade.isSystem ? (
                      <Badge variant="secondary" className="text-xs">
                        <Shield className="mr-1 h-3 w-3" />
                        {t('grades.system')}
                      </Badge>
                    ) : (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(grade)}
                          className="rounded p-1 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-primary)]"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(grade)}
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
        title={editTarget ? editTarget.name : t('grades.create')}
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">
              {t('grades.form.name')} *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('grades.form.namePlaceholder')}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">
              {t('grades.form.description')}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('grades.form.descriptionPlaceholder')}
              rows={2}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">
              {t('grades.form.categories')}
            </label>
            <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => toggleCategory(cat.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    categoryIds.includes(cat.id)
                      ? 'text-white'
                      : 'border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]'
                  }`}
                  style={categoryIds.includes(cat.id) ? { backgroundColor: cat.color } : undefined}
                >
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>
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
        <p className="text-[var(--color-text-secondary)]">{t('grades.deleteConfirm')}</p>
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
