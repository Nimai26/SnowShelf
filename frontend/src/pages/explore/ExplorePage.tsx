import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Users, Package, FolderOpen } from 'lucide-react';
import { exploreService } from '../../services/explore.service';
import type { PublicUser, Pagination } from '../../services/explore.service';
import { Avatar, Card, CardContent, Spinner, EmptyState, Input } from '../../components/ui';

export default function ExplorePage() {
  const { t } = useTranslation('common');
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const loadUsers = useCallback(async (searchTerm: string, p: number) => {
    setLoading(true);
    try {
      const result = await exploreService.getPublicUsers(
        searchTerm || undefined,
        p,
        20,
      );
      setUsers(result.users);
      setPagination(result.pagination);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers(search, page);
  }, [page]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      loadUsers(search, 1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text)] flex items-center gap-2">
          <Users className="h-6 w-6 text-[var(--color-primary)]" />
          {t('explore.title', 'Explorer')}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          {t('explore.subtitle', 'Découvrez les collections des autres utilisateurs')}
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-secondary)]" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('explore.searchPlaceholder', 'Rechercher un utilisateur...')}
          className="pl-10"
        />
      </div>

      {/* Users list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          icon={Users}
          title={t('explore.noUsers', 'Aucun utilisateur trouvé')}
          description={t('explore.noUsersDesc', 'Aucun utilisateur n\'a encore rendu sa collection publique.')}
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {users.map((u) => (
              <Link
                key={u.id}
                to={`/u/${u.username}`}
                className="block transition hover:scale-[1.01]"
              >
                <Card className="h-full hover:border-[var(--color-primary)]/50 transition">
                  <CardContent className="flex items-center gap-4 py-4">
                    <Avatar
                      src={u.avatarUrl}
                      fallback={u.username}
                      size="lg"
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-[var(--color-text)] truncate">
                        {u.username}
                      </h3>
                      {u.bio && (
                        <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2 mt-0.5">
                          {u.bio}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-4 text-xs text-[var(--color-text-secondary)]">
                        <span className="flex items-center gap-1">
                          <Package className="h-3.5 w-3.5" />
                          {u.itemsCount} {t('explore.items', 'articles')}
                        </span>
                        <span className="flex items-center gap-1">
                          <FolderOpen className="h-3.5 w-3.5" />
                          {u.categoriesCount} {t('explore.categories', 'catégories')}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] disabled:opacity-40 transition"
              >
                {t('actions.previous', 'Précédent')}
              </button>
              <span className="text-sm text-[var(--color-text-secondary)]">
                {page} / {pagination.pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={page >= pagination.pages}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] disabled:opacity-40 transition"
              >
                {t('actions.next', 'Suivant')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
