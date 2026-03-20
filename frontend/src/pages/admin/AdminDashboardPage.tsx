import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Users,
  Package,
  FolderOpen,
  DollarSign,
  TrendingUp,
  UserPlus,
  Bell,
  ChevronRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { adminService } from '../../services/admin.service';
import type { DashboardStats, RecentActivity } from '../../types/admin.types';
import { Card, CardContent, CardHeader, CardTitle, Spinner, Badge } from '../../components/ui';
import toast from 'react-hot-toast';

const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981'];

export default function AdminDashboardPage() {
  const { t } = useTranslation('admin');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<RecentActivity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [s, a] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getRecentActivity(10),
      ]);
      setStats(s);
      setActivity(a);
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }

  if (loading || !stats) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spinner />
      </div>
    );
  }

  const statCards = [
    {
      label: t('dashboard.totalUsers'),
      value: stats.users.total,
      icon: Users,
      color: 'text-blue-500',
      bg: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      label: t('dashboard.totalItems'),
      value: stats.items.total,
      icon: Package,
      color: 'text-purple-500',
      bg: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      label: t('dashboard.totalCategories'),
      value: stats.categories.total,
      icon: FolderOpen,
      color: 'text-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-900/20',
    },
    {
      label: t('dashboard.totalValue'),
      value: `${stats.items.totalValue.toFixed(2)} €`,
      icon: DollarSign,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('dashboard.title')}</h1>
        <div className="flex gap-2">
          <Link to="/admin/types-domains">
            <Badge variant="secondary" className="cursor-pointer">
              {t('nav.typesDomains')} <ChevronRight className="w-3 h-3 ml-1 inline" />
            </Badge>
          </Link>
          <Link to="/admin/platforms">
            <Badge variant="secondary" className="cursor-pointer">
              {t('nav.platforms')} <ChevronRight className="w-3 h-3 ml-1 inline" />
            </Badge>
          </Link>
          <Link to="/admin/fields">
            <Badge variant="secondary" className="cursor-pointer">
              {t('nav.fields')} <ChevronRight className="w-3 h-3 ml-1 inline" />
            </Badge>
          </Link>
          <Link to="/admin/users">
            <Badge variant="secondary" className="cursor-pointer">
              {t('nav.users')} <ChevronRight className="w-3 h-3 ml-1 inline" />
            </Badge>
          </Link>
          <Link to="/admin/tako-config">
            <Badge variant="secondary" className="cursor-pointer">
              {t('nav.takoConfig')} <ChevronRight className="w-3 h-3 ml-1 inline" />
            </Badge>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${s.bg}`}>
                  <s.icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-xl font-bold">{s.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* New users this month + User roles pie */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
              <UserPlus className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('dashboard.newThisMonth')}</p>
              <p className="text-3xl font-bold">{stats.users.newThisMonth}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-medium">{t('dashboard.itemsByType')}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {stats.items.byType.length > 0 ? (
              <div className="flex items-center gap-6">
                <div className="w-32 h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.items.byType}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={25}
                        outerRadius={50}
                      >
                        {stats.items.byType.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-3">
                  {stats.items.byType.map((t, i) => (
                    <div key={t.name} className="flex items-center gap-2 text-sm">
                      <span
                        className="w-3 h-3 rounded-full inline-block"
                        style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                      <span>{t.icon} {t.name}</span>
                      <span className="font-semibold">{t.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t('dashboard.noData')}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Trends charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Registrations trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              {t('dashboard.registrationsTrend')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {stats.trends.registrations.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={stats.trends.registrations}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(d: string) => d.slice(5)}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.15}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">{t('dashboard.noData')}</p>
            )}
          </CardContent>
        </Card>

        {/* Items trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="w-4 h-4" />
              {t('dashboard.itemsTrend')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {stats.trends.items.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stats.trends.items}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(d: string) => d.slice(5)}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">{t('dashboard.noData')}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      {activity && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Recent users */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <UserPlus className="w-4 h-4" />
                {t('dashboard.recentUsers')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2">
              {activity.recentUsers.length > 0 ? (
                activity.recentUsers.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div>
                      <p className="font-medium text-sm">{u.username}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">{t('dashboard.noData')}</p>
              )}
            </CardContent>
          </Card>

          {/* Recent items */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Package className="w-4 h-4" />
                {t('dashboard.recentItems')}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-2">
              {activity.recentItems.length > 0 ? (
                activity.recentItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div>
                      <p className="font-medium text-sm">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {item.user.username}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">{t('dashboard.noData')}</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Broadcast notification (mini-form) */}
      <BroadcastCard />
    </div>
  );
}

// ──────────────────────────────────────
// Broadcast sub-component
// ──────────────────────────────────────

function BroadcastCard() {
  const { t } = useTranslation('admin');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (!title.trim() || !message.trim()) return;
    try {
      setSending(true);
      const result = await adminService.sendBroadcast(title, message);
      toast.success(t('broadcast.sent', { count: result.sent }));
      setTitle('');
      setMessage('');
    } catch {
      toast.error('Error');
    } finally {
      setSending(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Bell className="w-4 h-4" />
          {t('broadcast.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3">
        <input
          type="text"
          placeholder={t('broadcast.placeholder.title')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-md border px-3 py-2 text-sm bg-transparent"
        />
        <textarea
          placeholder={t('broadcast.placeholder.message')}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          className="w-full rounded-md border px-3 py-2 text-sm bg-transparent resize-none"
        />
        <button
          type="button"
          disabled={sending || !title.trim() || !message.trim()}
          onClick={handleSend}
          className="px-4 py-2 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {sending ? '...' : t('broadcast.send')}
        </button>
      </CardContent>
    </Card>
  );
}
