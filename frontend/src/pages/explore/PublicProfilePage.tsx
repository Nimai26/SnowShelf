import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Calendar,
  Package,
  Mail,
  Lock,
  Search,
  LayoutGrid,
  List,
  Star,
  SlidersHorizontal,
  X,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  UserPlus,
  UserCheck,
  Clock,
  UserMinus,
  Check,
} from 'lucide-react';
import { exploreService } from '../../services/explore.service';
import type { PublicProfile, PublicCategory } from '../../services/explore.service';
import { friendsService, type FriendshipStatusType } from '../../services/friends.service';
import { primaryTypeService } from '../../services/category.service';
import { statusService, type Status } from '../../services/status.service';
import {
  Avatar,
  Card,
  CardContent,
  Spinner,
  EmptyState,
  Badge,
  Button,
  Input,
  Select,
  GridSkeleton,
  ListSkeleton,
} from '../../components/ui';
import { StaggerContainer, StaggerItem } from '../../components/ui/Animations';
import type { ItemCompact } from '../../types/item.types';
import type { PrimaryType } from '../../types/category.types';
import { getMediaUrl } from '../../utils/url';

export default function PublicProfilePage() {
  const { t } = useTranslation('common');
  const { t: tItems } = useTranslation('items');
  const { username } = useParams<{ username: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [categories, setCategories] = useState<PublicCategory[]>([]);
  const [primaryTypes, setPrimaryTypes] = useState<PrimaryType[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [items, setItems] = useState<ItemCompact[]>([]);
  const [loading, setLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [aggregations, setAggregations] = useState({ totalValue: 0, avgRating: 0 });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  // Friendship state
  const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatusType>('none');
  const [friendshipId, setFriendshipId] = useState<number | null>(null);
  const [friendActionLoading, setFriendActionLoading] = useState(false);

  // Query state from URL params
  const currentPage = Number(searchParams.get('page')) || 1;
  const search = searchParams.get('search') || '';
  const categoryId = searchParams.get('categoryId') ? Number(searchParams.get('categoryId')) : undefined;
  const searchState = (searchParams.get('searchState') as 'looking' | 'owned') || undefined;
  const statusId = searchParams.get('statusId') ? Number(searchParams.get('statusId')) : undefined;
  const primaryTypeId = searchParams.get('primaryTypeId') ? Number(searchParams.get('primaryTypeId')) : undefined;
  const minRating = searchParams.get('minRating') || undefined;
  const minValue = searchParams.get('minValue') ? Number(searchParams.get('minValue')) : undefined;
  const maxValue = searchParams.get('maxValue') ? Number(searchParams.get('maxValue')) : undefined;
  const dateFrom = searchParams.get('dateFrom') || undefined;
  const dateTo = searchParams.get('dateTo') || undefined;
  const sort = searchParams.get('sort') || 'createdAt';
  const order = searchParams.get('order') || 'desc';

  // Debounced search
  const [searchInput, setSearchInput] = useState(search);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateParam('search', searchInput || undefined);
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [searchInput]);

  // Load profile + filter data
  useEffect(() => {
    if (!username) return;
    const loadProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const [profileData, catData, ptData, statusData] = await Promise.all([
          exploreService.getPublicProfile(username),
          exploreService.getPublicCategories(username, 1, 100),
          primaryTypeService.getAll().catch(() => ({ data: [] })),
          statusService.getAll().catch(() => ({ data: [] })),
        ]);
        setProfile(profileData);
        setCategories(catData.categories);
        setPrimaryTypes(ptData.data || []);
        setStatuses(statusData.data || []);

        // Load friendship status if not owner
        if (!profileData.isOwner) {
          friendsService.getFriendshipStatus(profileData.id).then((res) => {
            setFriendshipStatus(res.status);
            setFriendshipId(res.friendshipId);
          }).catch(() => { /* ignore */ });
        }
      } catch (err: any) {
        if (err?.response?.status === 403) setError('private');
        else if (err?.response?.status === 404) setError('notFound');
        else setError('generic');
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [username]);

  // Load items
  const loadItems = useCallback(async () => {
    if (!username || error) return;
    setItemsLoading(true);
    try {
      const res = await exploreService.getPublicItems(username, {
        page: currentPage,
        limit: 24,
        search: search || undefined,
        sort: sort as any,
        order: order as any,
        categoryId,
        searchState,
        statusId,
        primaryTypeId,
        minRating: minRating ? Number(minRating) : undefined,
        minValue,
        maxValue,
        dateFrom,
        dateTo,
      });
      setItems(res.items);
      setTotal(res.pagination.total);
      setPages(res.pagination.pages);
      setAggregations(res.aggregations);
    } catch {
      // silent
    } finally {
      setItemsLoading(false);
    }
  }, [username, currentPage, search, categoryId, searchState, statusId, primaryTypeId, minRating, minValue, maxValue, dateFrom, dateTo, sort, order, error]);

  useEffect(() => {
    if (!loading && !error) loadItems();
  }, [loadItems, loading, error]);

  const updateParam = (key: string, value: string | undefined) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    if (key !== 'page') params.delete('page');
    setSearchParams(params, { replace: true });
  };

  const clearFilters = () => {
    setSearchInput('');
    setSearchParams({}, { replace: true });
  };

  const hasActiveFilters = search || categoryId || searchState || statusId || primaryTypeId || minRating || minValue !== undefined || maxValue !== undefined || dateFrom || dateTo;
  const activeFilterCount = [search, categoryId, searchState, statusId, primaryTypeId, minRating, minValue, maxValue, dateFrom, dateTo].filter(v => v !== undefined && v !== '').length;

  const memberDate = profile
    ? new Date(profile.createdAt).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  // ── Friendship actions ──
  const handleSendRequest = async () => {
    if (!profile) return;
    setFriendActionLoading(true);
    try {
      const res = await friendsService.sendRequest(profile.id);
      if (res.status === 'accepted') {
        setFriendshipStatus('friends');
        toast.success(t('friends.nowFriends'));
      } else {
        setFriendshipStatus('request_sent');
        toast.success(t('friends.requestSent'));
      }
      // Reload status to get friendshipId
      const s = await friendsService.getFriendshipStatus(profile.id);
      setFriendshipStatus(s.status);
      setFriendshipId(s.friendshipId);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || t('errors.generic'));
    } finally {
      setFriendActionLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    if (!friendshipId) return;
    setFriendActionLoading(true);
    try {
      await friendsService.acceptRequest(friendshipId);
      setFriendshipStatus('friends');
      toast.success(t('friends.requestAccepted'));
    } catch {
      toast.error(t('errors.generic'));
    } finally {
      setFriendActionLoading(false);
    }
  };

  const handleRemoveFriend = async () => {
    if (!friendshipId) return;
    setFriendActionLoading(true);
    try {
      await friendsService.removeFriendship(friendshipId);
      setFriendshipStatus('none');
      setFriendshipId(null);
      toast.success(t('friends.friendRemoved'));
    } catch {
      toast.error(t('errors.generic'));
    } finally {
      setFriendActionLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!friendshipId) return;
    setFriendActionLoading(true);
    try {
      await friendsService.removeFriendship(friendshipId);
      setFriendshipStatus('none');
      setFriendshipId(null);
      toast.success(t('friends.requestCancelled'));
    } catch {
      toast.error(t('errors.generic'));
    } finally {
      setFriendActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <Link
          to="/explore"
          className="mb-6 inline-flex items-center gap-1 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('explore.backToExplore', 'Retour à l\'exploration')}
        </Link>
        <EmptyState
          icon={error === 'private' ? Lock : undefined}
          title={
            error === 'private'
              ? t('explore.collectionPrivate', 'Collection privée')
              : error === 'notFound'
                ? t('explore.userNotFound', 'Utilisateur introuvable')
                : t('errors.generic')
          }
          description={
            error === 'private'
              ? t('explore.collectionPrivateDesc', 'Cet utilisateur a choisi de garder sa collection privée.')
              : undefined
          }
        />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back link */}
      <Link
        to="/explore"
        className="mb-6 inline-flex items-center gap-1 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('explore.backToExplore', 'Retour à l\'exploration')}
      </Link>

      {/* Profile header */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <Avatar
              src={profile.avatarUrl}
              fallback={profile.username}
              size="xl"
            />
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <h1 className="text-2xl font-bold text-[var(--color-text)]">
                  {profile.username}
                </h1>
                {profile.isOwner && (
                  <Badge variant="secondary">{t('explore.you', 'Vous')}</Badge>
                )}
              </div>
              {profile.email && (
                <p className="mt-1 flex items-center gap-1 text-sm text-[var(--color-text-secondary)] justify-center sm:justify-start">
                  <Mail className="h-3.5 w-3.5" />
                  {profile.email}
                </p>
              )}
              {profile.bio && (
                <p className="mt-2 text-sm text-[var(--color-text)]">
                  {profile.bio}
                </p>
              )}
              <div className="mt-3 flex items-center gap-1 text-xs text-[var(--color-text-secondary)] justify-center sm:justify-start">
                <Calendar className="h-3.5 w-3.5" />
                <span>{t('explore.memberSince', 'Membre depuis')} {memberDate}</span>
              </div>

              {/* Friend action button */}
              {!profile.isOwner && (
                <div className="mt-3 flex items-center gap-2 justify-center sm:justify-start">
                  {friendshipStatus === 'none' && profile.friendRequestPolicy !== 'nobody' && (
                    <Button size="sm" onClick={handleSendRequest} loading={friendActionLoading}>
                      <UserPlus className="h-4 w-4 mr-1" />
                      {t('friends.addFriend')}
                    </Button>
                  )}
                  {friendshipStatus === 'friends' && (
                    <>
                      <Badge variant="default" className="gap-1">
                        <UserCheck className="h-3.5 w-3.5" />
                        {t('friends.isFriend')}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveFriend}
                        loading={friendActionLoading}
                        className="text-red-500 hover:text-red-600"
                      >
                        <UserMinus className="h-4 w-4 mr-1" />
                        {t('friends.remove')}
                      </Button>
                    </>
                  )}
                  {friendshipStatus === 'request_sent' && (
                    <Button variant="secondary" size="sm" onClick={handleCancelRequest} loading={friendActionLoading}>
                      <Clock className="h-4 w-4 mr-1" />
                      {t('friends.requestPending')}
                    </Button>
                  )}
                  {friendshipStatus === 'request_received' && (
                    <Button size="sm" onClick={handleAcceptRequest} loading={friendActionLoading}>
                      <Check className="h-4 w-4 mr-1" />
                      {t('friends.acceptRequest')}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats bar */}
      {total > 0 && (
        <div className="mb-6 grid grid-cols-3 gap-4">
          <Card className="flex items-center gap-3 p-4">
            <Package className="h-8 w-8 text-[var(--color-primary)]" />
            <div>
              <p className="text-2xl font-bold text-[var(--color-text)]">{total}</p>
              <p className="text-xs text-[var(--color-text-secondary)]">{tItems('stats.totalItems')}</p>
            </div>
          </Card>
          <Card className="flex items-center gap-3 p-4">
            <TrendingUp className="h-8 w-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold text-[var(--color-text)]">
                {aggregations.totalValue > 0 ? `${aggregations.totalValue.toFixed(0)} €` : '—'}
              </p>
              <p className="text-xs text-[var(--color-text-secondary)]">{tItems('stats.totalValue')}</p>
            </div>
          </Card>
          <Card className="flex items-center gap-3 p-4">
            <Star className="h-8 w-8 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold text-[var(--color-text)]">
                {aggregations.avgRating > 0 ? `${aggregations.avgRating}/5` : '—'}
              </p>
              <p className="text-xs text-[var(--color-text-secondary)]">{tItems('stats.avgRating')}</p>
            </div>
          </Card>
        </div>
      )}

      {/* Search & filters bar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-secondary)]" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={tItems('searchPlaceholder')}
            className="pl-10"
          />
        </div>

        {/* Search state filter */}
        <div className="flex gap-2">
          <Button
            variant={!searchState ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => updateParam('searchState', undefined)}
          >
            {tItems('filters.all')}
          </Button>
          <Button
            variant={searchState === 'owned' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => updateParam('searchState', 'owned')}
          >
            {tItems('filters.owned')}
          </Button>
          <Button
            variant={searchState === 'looking' ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => updateParam('searchState', 'looking')}
          >
            {tItems('filters.looking')}
          </Button>
        </div>

        {/* View toggle */}
        <div className="flex gap-1 rounded-lg border border-[var(--color-border)] p-0.5">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`rounded p-1.5 transition ${viewMode === 'grid' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'}`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`rounded p-1.5 transition ${viewMode === 'list' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]'}`}
          >
            <List className="h-4 w-4" />
          </button>
        </div>

        {/* Advanced filters toggle */}
        <Button
          variant={showFilters ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setShowFilters((v) => !v)}
        >
          <SlidersHorizontal className="mr-1 h-4 w-4" />
          {tItems('filters.advancedFilters')}
          {activeFilterCount > 0 && (
            <span className="ml-1 rounded-full bg-[var(--color-primary-foreground)] text-[var(--color-primary)] h-5 w-5 flex items-center justify-center text-[10px] font-bold">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* Advanced filters panel */}
      {showFilters && (
        <Card className="mb-6 p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Category */}
            <Select
              label={tItems('filters.category')}
              value={categoryId?.toString() || ''}
              onChange={(e) => updateParam('categoryId', e.target.value || undefined)}
              options={[
                { value: '', label: tItems('filters.allCategories') },
                ...categories.map((cat) => ({
                  value: String(cat.id),
                  label: `${cat.icon} ${cat.name}`,
                })),
              ]}
            />

            {/* Primary Type */}
            <Select
              label={tItems('filters.primaryType', 'Type')}
              value={primaryTypeId?.toString() || ''}
              onChange={(e) => updateParam('primaryTypeId', e.target.value || undefined)}
              options={[
                { value: '', label: tItems('filters.allTypes', 'Tous les types') },
                ...primaryTypes.map((pt) => ({
                  value: String(pt.id),
                  label: `${pt.icon} ${pt.name}`,
                })),
              ]}
            />

            {/* Status */}
            <Select
              label={tItems('filters.status', 'Statut')}
              value={statusId?.toString() || ''}
              onChange={(e) => updateParam('statusId', e.target.value || undefined)}
              options={[
                { value: '', label: tItems('filters.allStatuses', 'Tous les statuts') },
                ...statuses.map((s) => ({
                  value: String(s.id),
                  label: `${s.icon} ${s.name}`,
                })),
              ]}
            />

            {/* Sort + Order */}
            <div className="flex gap-2">
              <div className="flex-1">
                <Select
                  label={tItems('filters.sort')}
                  value={sort}
                  onChange={(e) => updateParam('sort', e.target.value)}
                  options={[
                    { value: 'createdAt', label: tItems('filters.sortDate') },
                    { value: 'name', label: tItems('filters.sortName') },
                    { value: 'value', label: tItems('filters.sortValue') },
                    { value: 'rating', label: tItems('filters.sortRating') },
                    { value: 'purchasePrice', label: tItems('filters.sortPrice', 'Prix') },
                    { value: 'dateObtained', label: tItems('filters.sortDateObtained', 'Date obtention') },
                  ]}
                />
              </div>
              <div className="w-24">
                <Select
                  label={tItems('filters.order', 'Ordre')}
                  value={order}
                  onChange={(e) => updateParam('order', e.target.value)}
                  options={[
                    { value: 'desc', label: '↓' },
                    { value: 'asc', label: '↑' },
                  ]}
                />
              </div>
            </div>
          </div>

          {/* More filters toggle */}
          <button
            type="button"
            onClick={() => setShowMoreFilters((v) => !v)}
            className="mt-3 flex items-center gap-1 text-sm text-[var(--color-primary)] hover:underline"
          >
            {showMoreFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            {showMoreFilters ? tItems('filters.lessFilters', 'Moins de filtres') : tItems('filters.moreFilters', 'Plus de filtres')}
          </button>

          {/* Extra filters */}
          {showMoreFilters && (
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {/* Min Rating */}
              <Select
                label={tItems('filters.minRating', 'Note minimum')}
                value={minRating?.toString() || ''}
                onChange={(e) => updateParam('minRating', e.target.value || undefined)}
                options={[
                  { value: '', label: tItems('filters.allRatings', 'Toutes') },
                  { value: '1', label: '★ 1+' },
                  { value: '2', label: '★★ 2+' },
                  { value: '3', label: '★★★ 3+' },
                  { value: '4', label: '★★★★ 4+' },
                  { value: '5', label: '★★★★★ 5' },
                ]}
              />

              {/* Price range */}
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">
                  {tItems('filters.valueRange', 'Valeur (€)')}
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    placeholder="Min"
                    value={minValue ?? ''}
                    onChange={(e) => updateParam('minValue', e.target.value || undefined)}
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
                  />
                  <input
                    type="number"
                    min="0"
                    placeholder="Max"
                    value={maxValue ?? ''}
                    onChange={(e) => updateParam('maxValue', e.target.value || undefined)}
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
                  />
                </div>
              </div>

              {/* Date range */}
              <div>
                <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">
                  {tItems('filters.dateRange', 'Date obtention')}
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={dateFrom ?? ''}
                    onChange={(e) => updateParam('dateFrom', e.target.value || undefined)}
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
                  />
                  <input
                    type="date"
                    value={dateTo ?? ''}
                    onChange={(e) => updateParam('dateTo', e.target.value || undefined)}
                    className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {hasActiveFilters && (
            <div className="mt-3 flex justify-end">
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-1 h-4 w-4" />
                {tItems('filters.clearFilters')}
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Content */}
      {itemsLoading ? (
        viewMode === 'grid' ? <GridSkeleton count={8} /> : <ListSkeleton count={6} />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Package}
          title={t('explore.noItemsFound', 'Aucun article trouvé')}
          description={hasActiveFilters ? t('explore.tryOtherFilters', 'Essayez d\'autres filtres') : undefined}
        />
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <StaggerContainer className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((item) => (
            <StaggerItem key={item.id}>
            <Link to={`/u/${username}/items/${item.id}`}>
              <Card className="group h-full cursor-pointer overflow-hidden transition hover:shadow-md hover:border-[var(--color-primary)]">
                {item.thumbnailUrl ? (
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-[var(--color-hover)]">
                    <img
                      src={getMediaUrl(item.thumbnailUrl)}
                      alt={item.name}
                      className="absolute inset-0 h-full w-full object-contain p-1"
                      loading="lazy"
                    />
                    {item.rating && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-yellow-400">
                        <Star className="h-3 w-3 fill-current" />
                        <span className="text-xs font-medium">{item.rating}</span>
                      </div>
                    )}
                    <div className="absolute top-2 left-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-sm">
                      {item.primaryType?.icon || '📦'}
                    </div>
                  </div>
                ) : (
                  <div className="relative flex aspect-[4/3] w-full items-center justify-center bg-[var(--color-hover)]">
                    <span className="text-4xl opacity-60">{item.primaryType?.icon || '📦'}</span>
                    {item.rating && (
                      <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-yellow-400">
                        <Star className="h-3 w-3 fill-current" />
                        <span className="text-xs font-medium">{item.rating}</span>
                      </div>
                    )}
                  </div>
                )}
                <div className="p-3">
                  <h3 className="mb-1 text-sm font-semibold text-[var(--color-text)] group-hover:text-[var(--color-primary)] line-clamp-2">
                    {item.name}
                  </h3>
                  {item.description && (
                    <p className="mb-2 text-xs text-[var(--color-text-secondary)] line-clamp-1">
                      {item.description}
                    </p>
                  )}
                  {item.categories.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1">
                      {item.categories.slice(0, 2).map((cat) => (
                        <span
                          key={cat.id}
                          className="inline-flex items-center gap-1 rounded-full bg-[var(--color-hover)] px-2 py-0.5 text-[10px] text-[var(--color-text-secondary)]"
                        >
                          {cat.icon} {cat.name}
                        </span>
                      ))}
                      {item.categories.length > 2 && (
                        <span className="text-[10px] text-[var(--color-text-secondary)]">
                          +{item.categories.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)]">
                    {item.marketValue ? (
                      <span className="text-sm font-semibold text-green-500">
                        {Number(item.marketValue).toFixed(2)} €
                      </span>
                    ) : (
                      <span></span>
                    )}
                    <div className="flex items-center gap-1">
                      {item.status && (
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                          style={{ backgroundColor: item.status.color }}
                        >
                          {item.status.icon} {item.status.name}
                        </span>
                      )}
                      {!item.status && item.searchState && (
                        <Badge variant={item.searchState === 'owned' ? 'success' : 'warning'}>
                          {item.searchState === 'owned' ? tItems('filters.owned') : tItems('filters.looking')}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
            </StaggerItem>
          ))}
        </StaggerContainer>
      ) : (
        /* LIST VIEW */
        <StaggerContainer className="space-y-2">
          {items.map((item) => (
            <StaggerItem key={item.id}>
            <Link to={`/u/${username}/items/${item.id}`}>
              <Card className="group flex cursor-pointer items-center gap-4 p-3 transition hover:shadow-md hover:border-[var(--color-primary)]">
                {item.thumbnailUrl ? (
                  <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-[var(--color-hover)]">
                    <img
                      src={getMediaUrl(item.thumbnailUrl)}
                      alt={item.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ) : (
                  <span className="text-2xl">{item.primaryType?.icon || '📦'}</span>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-[var(--color-text)] group-hover:text-[var(--color-primary)] truncate">
                    {item.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                    <span>{item.primaryType?.name}</span>
                    {item.categories.length > 0 && (
                      <>
                        <span>·</span>
                        <span>{item.categories.map((c) => c.name).join(', ')}</span>
                      </>
                    )}
                  </div>
                </div>
                {item.rating && (
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    <span className="text-sm">{item.rating}</span>
                  </div>
                )}
                {item.marketValue && (
                  <span className="text-sm font-semibold text-green-500">
                    {Number(item.marketValue).toFixed(2)} €
                  </span>
                )}
                {item.status && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                    style={{ backgroundColor: item.status.color }}
                  >
                    {item.status.icon} {item.status.name}
                  </span>
                )}
                {!item.status && item.searchState && (
                  <Badge variant={item.searchState === 'owned' ? 'success' : 'warning'} className="text-xs">
                    {item.searchState === 'owned' ? tItems('filters.owned') : tItems('filters.looking')}
                  </Badge>
                )}
              </Card>
            </Link>
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => updateParam('page', String(currentPage - 1))}
          >
            ←
          </Button>
          <span className="text-sm text-[var(--color-text-secondary)]">
            {currentPage} / {pages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={currentPage >= pages}
            onClick={() => updateParam('page', String(currentPage + 1))}
          >
            →
          </Button>
        </div>
      )}
    </div>
  );
}
