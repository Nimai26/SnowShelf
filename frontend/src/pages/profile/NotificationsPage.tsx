import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Bell, Check, CheckCheck, Trash2 } from 'lucide-react';
import { userService } from '../../services/user.service';
import { useNotificationStore } from '../../stores/notificationStore';
import { setAppBadge } from '../../utils/badging';
import {
  Button,
  Card,
  CardContent,
  EmptyState,
  Skeleton,
  Badge,
} from '../../components/ui';
import type { Notification } from '../../services/user.service';

export default function NotificationsPage() {
  const { t } = useTranslation('common');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { setUnreadCount: setStoreUnreadCount } = useNotificationStore();

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await userService.getNotifications();
      setNotifications(data);
    } catch {
      toast.error(t('errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id: number) => {
    try {
      await userService.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      toast.error(t('errors.generic'));
    }
  };

  const markAllRead = async () => {
    try {
      await userService.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success(t('notifications.allRead', 'Toutes les notifications marquées comme lues'));
    } catch {
      toast.error(t('errors.generic'));
    }
  };

  const deleteNotif = async (id: number) => {
    try {
      await userService.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      toast.error(t('errors.generic'));
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Update PWA app badge and store with unread count
  useEffect(() => {
    setAppBadge(unreadCount);
    setStoreUnreadCount(unreadCount);
  }, [unreadCount]);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 p-6">
        <Skeleton className="h-10 w-48" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[var(--color-text)]">
            {t('nav.notifications', 'Notifications')}
          </h1>
          {unreadCount > 0 && (
            <Badge variant="danger">{unreadCount}</Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="ghost" size="sm" onClick={markAllRead}>
            <CheckCheck className="mr-1.5 h-4 w-4" />
            {t('notifications.markAllRead', 'Tout marquer comme lu')}
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-12 w-12" />}
          title={t('notifications.empty', 'Aucune notification')}
          description={t('notifications.emptyDesc', 'Vous n\'avez pas encore de notifications')}
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <Card
              key={notif.id}
              className={`transition ${!notif.isRead ? 'border-l-4 border-l-[var(--color-primary)]' : 'opacity-75'}`}
            >
              <CardContent className="flex items-start gap-3 py-4">
                <div className="flex-1">
                  <p className={`text-sm ${!notif.isRead ? 'font-semibold' : ''} text-[var(--color-text)]`}>
                    {notif.title}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--color-text-secondary)]">
                    {notif.message}
                  </p>
                  <p className="mt-1 text-[10px] text-[var(--color-text-secondary)]">
                    {new Date(notif.createdAt).toLocaleDateString(undefined, {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div className="flex gap-1">
                  {!notif.isRead && (
                    <button
                      onClick={() => markRead(notif.id)}
                      title={t('notifications.markRead', 'Marquer comme lu')}
                      className="rounded p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-primary)] transition"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotif(notif.id)}
                    title={t('actions.delete')}
                    className="rounded p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] hover:text-red-400 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
