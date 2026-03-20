import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Shield,
  ShieldCheck,
  Crown,
  User as UserIcon,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { adminService } from '../../services/admin.service';
import type { AdminUser, AdminUsersPaginated } from '../../types/admin.types';
import {
  Card,
  CardContent,
  Button,
  Input,
  Badge,
  Spinner,
  EmptyState,
  Modal,
  Select,
} from '../../components/ui';
import toast from 'react-hot-toast';

const ROLES = ['free', 'premium', 'admin'] as const;

const ROLE_ICONS: Record<string, React.ReactNode> = {
  free: <UserIcon className="w-3 h-3" />,
  premium: <Crown className="w-3 h-3 text-amber-500" />,
  admin: <ShieldCheck className="w-3 h-3 text-red-500" />,
};

export default function AdminUsersPage() {
  const { t } = useTranslation('admin');
  const [data, setData] = useState<AdminUsersPaginated | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [roleChangeTarget, setRoleChangeTarget] = useState<AdminUser | null>(null);
  const [newRole, setNewRole] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const result = await adminService.getUsers({
        page,
        limit: 20,
        search: search || undefined,
        role: roleFilter || undefined,
        sort: 'createdAt',
        order: 'DESC',
      });
      setData(result);
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  async function handleChangeRole() {
    if (!roleChangeTarget || !newRole) return;
    try {
      setProcessing(true);
      await adminService.changeUserRole(roleChangeTarget.id, newRole);
      toast.success(t('users.roleChanged'));
      setRoleChangeTarget(null);
      setNewRole('');
      fetchUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error');
    } finally {
      setProcessing(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      setProcessing(true);
      await adminService.deleteUser(deleteTarget.id);
      toast.success(t('users.deleted'));
      setDeleteTarget(null);
      fetchUsers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error');
    } finally {
      setProcessing(false);
    }
  }

  const roleOptions = [
    { value: '', label: t('users.allRoles') },
    { value: 'free', label: 'Free' },
    { value: 'premium', label: 'Premium' },
    { value: 'admin', label: 'Admin' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/admin" className="text-muted-foreground hover:text-foreground">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold">{t('users.title')}</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            placeholder={t('users.search')}
            className="pl-9"
          />
        </div>
        <Select
          options={roleOptions}
          value={roleFilter}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {/* Users list */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : !data || data.users.length === 0 ? (
        <EmptyState
          icon={<UserIcon className="w-10 h-10" />}
          title={t('users.noUsers')}
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-3 px-2 font-medium">Utilisateur</th>
                  <th className="py-3 px-2 font-medium">{t('users.role')}</th>
                  <th className="py-3 px-2 font-medium">{t('users.email')}</th>
                  <th className="py-3 px-2 font-medium text-center">{t('users.items')}</th>
                  <th className="py-3 px-2 font-medium text-center">{t('users.categories')}</th>
                  <th className="py-3 px-2 font-medium text-right">{t('users.value')}</th>
                  <th className="py-3 px-2 font-medium">{t('users.joined')}</th>
                  <th className="py-3 px-2 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((user) => (
                  <tr key={user.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold overflow-hidden">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            user.username.charAt(0).toUpperCase()
                          )}
                        </div>
                        <span className="font-medium">{user.username}</span>
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                        {ROLE_ICONS[user.role]}
                        {user.role}
                      </Badge>
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex items-center gap-1">
                        <span className="truncate max-w-[180px]">{user.email}</span>
                        {user.emailVerified ? (
                          <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center">{user.itemsCount}</td>
                    <td className="py-3 px-2 text-center">{user.categoriesCount}</td>
                    <td className="py-3 px-2 text-right">
                      {user.totalValue ? `${Number(user.totalValue).toFixed(2)} €` : '-'}
                    </td>
                    <td className="py-3 px-2 text-xs text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-2 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            setRoleChangeTarget(user);
                            setNewRole(user.role);
                          }}
                          title={t('users.changeRole')}
                        >
                          <Shield className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-600"
                          onClick={() => setDeleteTarget(user)}
                          title={t('users.deleteUser')}
                        >
                          <Trash2 className="w-4 h-4" />
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
            {data.users.map((user) => (
              <Card key={user.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold overflow-hidden">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          user.username.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{user.username}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      {ROLE_ICONS[user.role]}
                      {user.role}
                    </Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <p className="text-muted-foreground">{t('users.items')}</p>
                      <p className="font-semibold">{user.itemsCount}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t('users.categories')}</p>
                      <p className="font-semibold">{user.categoriesCount}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t('users.value')}</p>
                      <p className="font-semibold">
                        {user.totalValue ? `${Number(user.totalValue).toFixed(0)}€` : '-'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-8 px-2 text-xs"
                      onClick={() => {
                        setRoleChangeTarget(user);
                        setNewRole(user.role);
                      }}
                    >
                      <Shield className="w-3.5 h-3.5 mr-1" />
                      {t('users.changeRole')}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-8 px-2 text-xs text-red-500"
                      onClick={() => setDeleteTarget(user)}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      {t('users.deleteUser')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {data.pagination.pages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-2">
              <Button
                type="button"
                variant="ghost"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {page} / {data.pagination.pages}
              </span>
              <Button
                type="button"
                variant="ghost"
                disabled={page >= data.pagination.pages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}
        </>
      )}

      {/* Role change modal */}
      <Modal
        open={!!roleChangeTarget}
        onClose={() => setRoleChangeTarget(null)}
        title={t('users.changeRole')}
      >
        {roleChangeTarget && (
          <div className="space-y-4">
            <p className="text-sm">
              {roleChangeTarget.username} — {roleChangeTarget.email}
            </p>
            <Select
              options={ROLES.map((r) => ({ value: r, label: r.charAt(0).toUpperCase() + r.slice(1) }))}
              value={newRole}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewRole(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setRoleChangeTarget(null)}>
                Annuler
              </Button>
              <Button
                type="button"
                variant="primary"
                disabled={processing || newRole === roleChangeTarget.role}
                onClick={handleChangeRole}
              >
                {processing ? '...' : 'Confirmer'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={t('users.deleteUser')}
      >
        {deleteTarget && (
          <div className="space-y-4">
            <p className="text-sm">{t('users.confirmDelete')}</p>
            <p className="text-sm font-semibold">
              {deleteTarget.username} — {deleteTarget.email}
            </p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setDeleteTarget(null)}>
                Annuler
              </Button>
              <Button
                type="button"
                variant="danger"
                disabled={processing}
                onClick={handleDelete}
              >
                {processing ? '...' : t('users.deleteUser')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
