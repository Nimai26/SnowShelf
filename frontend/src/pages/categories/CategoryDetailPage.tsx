import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Globe,
  Lock,
  Package,
  Calendar,
  Copy,
  Star,
  Image,
  Video,
  Music,
  FileText,
} from 'lucide-react';
import { categoryService } from '../../services/category.service';
import type { Category } from '../../types/category.types';
import { useAuthStore } from '../../stores/authStore';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Spinner,
  Modal,
} from '../../components/ui';
import toast from 'react-hot-toast';
import { MediaListManager } from '../../components/media/MediaListManager';
import CategoryIcon from '../../components/common/CategoryIcon';

export default function CategoryDetailPage() {
  const { t } = useTranslation('categories');
  const navigate = useNavigate();
  const { id } = useParams();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin' || user?.isAdmin;

  const [category, setCategory] = useState<Category | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [copying, setCopying] = useState(false);

  useEffect(() => {
    if (id) loadCategory(Number(id));
  }, [id]);

  const loadCategory = async (catId: number) => {
    try {
      setLoading(true);
      const res = await categoryService.getCategoryById(catId);
      setCategory(res.data);
    } catch {
      toast.error(t('errors.loadFailed', 'Catégorie non trouvée'));
      navigate('/categories');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!category) return;
    try {
      setDeleting(true);
      await categoryService.deleteCategory(category.id);
      toast.success(t('deleteSuccess', 'Catégorie supprimée'));
      navigate('/categories');
    } catch {
      toast.error(t('errors.deleteFailed', 'Erreur lors de la suppression'));
    } finally {
      setDeleting(false);
    }
  };

  const handleCopy = async () => {
    if (!category) return;
    try {
      setCopying(true);
      const res = await categoryService.copyCategory(category.id);
      toast.success(t('copySuccess', 'Catégorie copiée'));
      navigate(`/categories/${res.data.id}`);
    } catch {
      toast.error(t('errors.copyFailed', 'Erreur lors de la copie'));
    } finally {
      setCopying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!category) return null;

  const canEdit = !category.isDefault || isAdmin;
  const canDelete = !category.isDefault || isAdmin;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => navigate('/categories')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div
            className="flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
            style={{ backgroundColor: `${category.color}20` }}
          >
            <CategoryIcon icon={category.icon} iconType={category.iconType} size="lg" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--color-text)]">
              {category.name}
            </h1>
            <div className="flex items-center gap-2">
              {category.isPublic ? (
                <span className="flex items-center gap-1 text-xs text-green-500">
                  <Globe className="h-3 w-3" /> {t('public', 'Publique')}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)]">
                  <Lock className="h-3 w-3" /> {t('private', 'Privée')}
                </span>
              )}
              {category.isDefault && (
                <Badge variant="premium">{t('defaultBadge', 'Défaut')}</Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={handleCopy}
            disabled={copying}
            title={t('copyTitle', 'Copier cette catégorie')}
          >
            <Copy className="mr-2 h-4 w-4" />
            {t('copy', 'Copier')}
          </Button>
          {canEdit && (
            <Button
              variant="secondary"
              onClick={() => navigate(`/categories/${category.id}/edit`)}
            >
              <Edit2 className="mr-2 h-4 w-4" />
              {t('edit', 'Modifier')}
            </Button>
          )}
          {canDelete && (
            <Button variant="danger" onClick={() => setShowDelete(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              {t('delete', 'Supprimer')}
            </Button>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Info card */}
        <Card>
          <CardHeader>
            <CardTitle>{t('detail.info', 'Informations')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {category.description && (
              <div>
                <p className="text-xs font-medium uppercase text-[var(--color-text-secondary)]">
                  {t('form.description', 'Description')}
                </p>
                <p className="max-h-40 overflow-y-auto text-sm text-[var(--color-text)] whitespace-pre-line">
                  {category.description}
                </p>
              </div>
            )}
            {category.notes && (
              <div>
                <p className="text-xs font-medium uppercase text-[var(--color-text-secondary)]">
                  {t('form.notes', 'Notes privées')}
                </p>
                <p className="text-sm text-[var(--color-text)]">
                  {category.notes}
                </p>
              </div>
            )}
            {category.owner && (
              <div>
                <p className="text-xs font-medium uppercase text-[var(--color-text-secondary)]">
                  {t('detail.owner', 'Propriétaire')}
                </p>
                <p className="text-sm text-[var(--color-text)]">
                  {category.owner.username}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Stats card */}
        <Card>
          <CardHeader>
            <CardTitle>{t('detail.stats', 'Statistiques')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Package className="h-4 w-4 text-[var(--color-primary)]" />
              <div>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {t('detail.itemsCount', 'Articles')}
                </p>
                <p className="text-lg font-bold text-[var(--color-text)]">
                  {category.itemsCount}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-[var(--color-primary)]" />
              <div>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {t('detail.createdAt', 'Créée le')}
                </p>
                <p className="text-sm text-[var(--color-text)]">
                  {new Date(category.createdAt).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
            {category.mediaCounts && (
              <div className="mt-3 border-t border-[var(--color-border)] pt-3">
                <p className="mb-2 text-xs font-medium uppercase text-[var(--color-text-secondary)]">
                  {t('detail.media', 'Médias')}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Image className="h-3.5 w-3.5 text-blue-500" />
                    <span className="text-[var(--color-text)]">{category.mediaCounts.images}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Video className="h-3.5 w-3.5 text-purple-500" />
                    <span className="text-[var(--color-text)]">{category.mediaCounts.videos}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Music className="h-3.5 w-3.5 text-green-500" />
                    <span className="text-[var(--color-text)]">{category.mediaCounts.audio}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <FileText className="h-3.5 w-3.5 text-orange-500" />
                    <span className="text-[var(--color-text)]">{category.mediaCounts.documents}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Grades */}
      {category.grades && category.grades.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              <Star className="mr-2 inline h-4 w-4" />
              {t('detail.grades', 'Grades')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {category.grades.map((g) => (
                <Badge key={g.id} variant="default">
                  {g.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hierarchy */}
      {((category.parents && category.parents.length > 0) ||
        (category.children && category.children.length > 0)) && (
        <Card>
          <CardHeader>
            <CardTitle>{t('detail.hierarchy', 'Hiérarchie')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {category.parents && category.parents.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium uppercase text-[var(--color-text-secondary)]">
                  {t('detail.parents', 'Catégories parentes')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {category.parents.map((p) => (
                    <Link
                      key={p.id}
                      to={`/categories/${p.id}`}
                      className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm transition-colors hover:bg-[var(--color-bg-secondary)]"
                    >
                      <span>{p.icon}</span>
                      <span className="text-[var(--color-text)]">{p.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {category.children && category.children.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium uppercase text-[var(--color-text-secondary)]">
                  {t('detail.children', 'Sous-catégories')}
                </p>
                <div className="flex flex-wrap gap-2">
                  {category.children.map((c) => (
                    <Link
                      key={c.id}
                      to={`/categories/${c.id}`}
                      className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm transition-colors hover:bg-[var(--color-bg-secondary)]"
                    >
                      <span>{c.icon}</span>
                      <span className="text-[var(--color-text)]">{c.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Media */}
      <Card>
        <CardHeader>
          <CardTitle>
            <Image className="mr-2 inline h-4 w-4" />
            {t('detail.mediaSection', 'Médias de la catégorie')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MediaListManager categoryId={Number(id)} readOnly={!canEdit} />
        </CardContent>
      </Card>

      {/* Recent Items */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('detail.items', 'Articles dans cette catégorie')}</CardTitle>
            {category.itemsCount > 0 && (
              <Link to={`/items?category=${category.id}`}>
                <Button variant="ghost" className="text-xs">
                  {t('detail.viewAllItems', 'Voir tous les articles')} ({category.itemsCount})
                </Button>
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {category.recentItems && category.recentItems.length > 0 ? (
            <div className="space-y-2">
              <p className="mb-3 text-xs font-medium uppercase text-[var(--color-text-secondary)]">
                {t('detail.recentItems', 'Derniers articles ajoutés')}
              </p>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                {category.recentItems.map((item) => (
                  <Link
                    key={item.id}
                    to={`/items/${item.id}`}
                    className="group flex flex-col items-center gap-2 rounded-lg border border-[var(--color-border)] p-2 transition-colors hover:bg-[var(--color-bg-secondary)]"
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded-md bg-[var(--color-bg-secondary)]">
                      <Package className="h-6 w-6 text-[var(--color-text-secondary)]" />
                    </div>
                    <p className="line-clamp-2 text-center text-xs text-[var(--color-text)]">
                      {item.name}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-[var(--color-text-secondary)]">
              <Package className="mx-auto mb-2 h-8 w-8 opacity-50" />
              <p>{t('detail.noItems', 'Aucun article dans cette catégorie')}</p>
              <Link to="/items/add">
                <Button variant="secondary" className="mt-3">
                  {t('detail.addItem', 'Ajouter un article')}
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Modal */}
      <Modal
        open={showDelete}
        onClose={() => setShowDelete(false)}
        title={t('deleteConfirm.title', 'Supprimer la catégorie')}
      >
        <p className="text-[var(--color-text-secondary)]">
          {t('deleteConfirm.message', 'Êtes-vous sûr de vouloir supprimer')} <strong>{category.name}</strong> ?
          {t('deleteConfirm.warning', ' Cette action est irréversible.')}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setShowDelete(false)}>
            {t('cancel', 'Annuler')}
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? t('deleting', 'Suppression...') : t('delete', 'Supprimer')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
