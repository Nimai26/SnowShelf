import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  FolderOpen,
  Edit2,
  Trash2,
  Globe,
  Lock,
  ChevronRight,
  Copy,
} from 'lucide-react';
import PullToRefresh from '../../components/common/PullToRefresh';
import { categoryService } from '../../services/category.service';
import { useAuthStore } from '../../stores/authStore';
import type { Category, CategoryQueryParams } from '../../types/category.types';
import {
  Card,
  CardContent,
  Button,
  Input,
  Badge,
  EmptyState,
  Modal,
  CategoryCardSkeleton,
} from '../../components/ui';
import { StaggerContainer, StaggerItem } from '../../components/ui/Animations';
import toast from 'react-hot-toast';
import CategoryIcon from '../../components/common/CategoryIcon';

export default function CategoriesPage() {
  const { t } = useTranslation('categories');
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'admin' || user?.isAdmin;

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<CategoryQueryParams['filter']>('all');
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const filters: { key: CategoryQueryParams['filter']; label: string }[] = [
    { key: 'all', label: t('filters.all', 'Toutes') },
    { key: 'mine', label: t('filters.mine', 'Mes catégories') },
    { key: 'default', label: t('filters.default', 'Par défaut') },
    { key: 'public', label: t('filters.public', 'Publiques') },
  ];

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await categoryService.getCategories({
        filter,
        search: search || undefined,
        limit: 100,
      });
      setCategories(res.data.categories);
    } catch {
      toast.error(t('errors.loadFailed', 'Erreur lors du chargement des catégories'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [filter]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchCategories();
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await categoryService.deleteCategory(deleteTarget.id);
      toast.success(t('deleteSuccess', 'Catégorie supprimée'));
      setDeleteTarget(null);
      fetchCategories();
    } catch {
      toast.error(t('errors.deleteFailed', 'Erreur lors de la suppression'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <PullToRefresh onRefresh={fetchCategories}>
    <div className="space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">
            <FolderOpen className="mr-2 inline h-6 w-6" />
            {t('title', 'Catégories')}
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {t('subtitle', 'Organisez vos collections par catégories')}
          </p>
        </div>
        <Link to="/categories/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t('create', 'Nouvelle catégorie')}
          </Button>
        </Link>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex gap-1 rounded-lg bg-[var(--color-bg-secondary)] p-1">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === f.key
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-secondary)]" />
          <Input
            placeholder={t('searchPlaceholder', 'Rechercher une catégorie...')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CategoryCardSkeleton key={i} />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <EmptyState
          title={t('empty.title', 'Aucune catégorie')}
          description={t('empty.description', 'Créez votre première catégorie pour organiser votre collection')}
        />
      ) : (
        <StaggerContainer className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <StaggerItem key={cat.id}>
            <Card
              key={cat.id}
              className="group cursor-pointer transition-all hover:shadow-md hover:ring-1 hover:ring-[var(--color-primary)]/30"
              onClick={() => navigate(`/categories/${cat.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg text-xl"
                      style={{ backgroundColor: `${cat.color}20` }}
                    >
                      <CategoryIcon icon={cat.icon} iconType={cat.iconType} size="lg" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-[var(--color-text)]">
                        {cat.name}
                      </h3>
                      {cat.description && (
                        <p className="mt-0.5 line-clamp-1 text-xs text-[var(--color-text-secondary)]">
                          {cat.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[var(--color-text-secondary)] opacity-0 transition-opacity group-hover:opacity-100" />
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="text-xs">
                      {cat.itemsCount} {t('items', 'articles')}
                    </Badge>
                    {cat.isPublic ? (
                      <Globe className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Lock className="h-3.5 w-3.5 text-[var(--color-text-secondary)]" />
                    )}
                    {cat.isDefault && (
                      <Badge variant="premium" className="text-xs">
                        {t('defaultBadge', 'Défaut')}
                      </Badge>
                    )}
                  </div>

                  {!cat.isDefault && (
                    <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          categoryService.copyCategory(cat.id).then(() => {
                            toast.success(t('copySuccess', 'Catégorie copiée'));
                            fetchCategories();
                          }).catch(() => {
                            toast.error(t('errors.copyFailed', 'Erreur lors de la copie'));
                          });
                        }}
                        className="rounded p-1 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-primary)]"
                        title={t('copy', 'Copier')}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/categories/${cat.id}/edit`);
                        }}
                        className="rounded p-1 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-primary)]"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(cat);
                        }}
                        className="rounded p-1 text-[var(--color-text-secondary)] hover:bg-red-500/10 hover:text-red-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                  {cat.isDefault && (
                    <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          categoryService.copyCategory(cat.id).then(() => {
                            toast.success(t('copySuccess', 'Catégorie copiée'));
                            fetchCategories();
                          }).catch(() => {
                            toast.error(t('errors.copyFailed', 'Erreur lors de la copie'));
                          });
                        }}
                        className="rounded p-1 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-primary)]"
                        title={t('copy', 'Copier')}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      {isAdmin && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/categories/${cat.id}/edit`);
                            }}
                            className="rounded p-1 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] hover:text-amber-500"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(cat);
                            }}
                            className="rounded p-1 text-[var(--color-text-secondary)] hover:bg-red-500/10 hover:text-red-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}

      {/* Delete confirmation modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={t('deleteConfirm.title', 'Supprimer la catégorie')}
      >
        <p className="text-[var(--color-text-secondary)]">
          {t('deleteConfirm.message', 'Êtes-vous sûr de vouloir supprimer')} <strong>{deleteTarget?.name}</strong> ?
          {t('deleteConfirm.warning', ' Cette action est irréversible.')}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
            {t('cancel', 'Annuler')}
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={deleting}>
            {deleting ? t('deleting', 'Suppression...') : t('delete', 'Supprimer')}
          </Button>
        </div>
      </Modal>
    </div>
    </PullToRefresh>
  );
}
