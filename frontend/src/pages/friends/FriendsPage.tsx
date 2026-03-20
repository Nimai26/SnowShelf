import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import {
  Users,
  UserPlus,
  Clock,
  Send,
  Check,
  X,
  UserMinus,
  Mail,
} from 'lucide-react';
import { friendsService, type FriendUser } from '../../services/friends.service';
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  Tabs,
  Skeleton,
} from '../../components/ui';
import { FadeIn, StaggerContainer, StaggerItem } from '../../components/ui/Animations';

export default function FriendsPage() {
  const { t } = useTranslation('common');
  const [activeTab, setActiveTab] = useState('friends');
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [received, setReceived] = useState<FriendUser[]>([]);
  const [sent, setSent] = useState<FriendUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [emailInput, setEmailInput] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [friendsRes, receivedRes, sentRes] = await Promise.all([
        friendsService.getFriends(),
        friendsService.getReceivedRequests(),
        friendsService.getSentRequests(),
      ]);
      setFriends(friendsRes.friends);
      setReceived(receivedRes);
      setSent(sentRes);
      setPendingCount(receivedRes.length);
    } catch {
      toast.error(t('errors.generic'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAccept = async (friendshipId: number) => {
    try {
      await friendsService.acceptRequest(friendshipId);
      toast.success(t('friends.requestAccepted'));
      loadData();
    } catch {
      toast.error(t('errors.generic'));
    }
  };

  const handleDecline = async (friendshipId: number) => {
    try {
      await friendsService.declineRequest(friendshipId);
      toast.success(t('friends.requestDeclined'));
      loadData();
    } catch {
      toast.error(t('errors.generic'));
    }
  };

  const handleRemove = async (friendshipId: number) => {
    try {
      await friendsService.removeFriendship(friendshipId);
      toast.success(t('friends.friendRemoved'));
      loadData();
    } catch {
      toast.error(t('errors.generic'));
    }
  };

  const handleCancelRequest = async (friendshipId: number) => {
    try {
      await friendsService.removeFriendship(friendshipId);
      toast.success(t('friends.requestCancelled'));
      loadData();
    } catch {
      toast.error(t('errors.generic'));
    }
  };

  const handleSendByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = emailInput.trim().toLowerCase();
    if (!email) return;
    setEmailLoading(true);
    try {
      const res = await friendsService.sendRequestByEmail(email);
      switch (res.result) {
        case 'sent':
          toast.success(t('friends.byEmail.sent', { username: res.username }));
          setEmailInput('');
          loadData();
          break;
        case 'accepted':
          toast.success(t('friends.byEmail.accepted', { username: res.username }));
          setEmailInput('');
          loadData();
          break;
        case 'already_friends':
          toast.success(t('friends.byEmail.alreadyFriends', { username: res.username }));
          break;
        case 'already_sent':
          toast(t('friends.byEmail.alreadySent', { username: res.username }), { icon: 'ℹ️' });
          break;
        case 'not_found':
        default:
          toast.error(t('friends.byEmail.notFound'));
          break;
      }
    } catch {
      toast.error(t('errors.generic'));
    } finally {
      setEmailLoading(false);
    }
  };

  const tabItems = [
    {
      id: 'friends',
      label: `${t('friends.tabs.friends')} (${friends.length})`,
      icon: <Users className="h-4 w-4" />,
    },
    {
      id: 'received',
      label: `${t('friends.tabs.received')}${pendingCount > 0 ? ` (${pendingCount})` : ''}`,
      icon: <UserPlus className="h-4 w-4" />,
    },
    {
      id: 'sent',
      label: `${t('friends.tabs.sent')} (${sent.length})`,
      icon: <Send className="h-4 w-4" />,
    },
  ];

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 p-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-12 w-full" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center gap-3">
        <Users className="h-7 w-7 text-[var(--color-primary)]" />
        <h1 className="text-2xl font-bold text-[var(--color-text)]">{t('friends.title')}</h1>
      </div>

      {/* ── ADD BY EMAIL ── */}
      <Card>
        <CardContent className="py-4">
          <form onSubmit={handleSendByEmail} className="flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">
                {t('friends.byEmail.label')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-secondary)]" />
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder={t('friends.byEmail.placeholder')}
                  className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] pl-10 pr-4 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:border-transparent"
                  required
                />
              </div>
            </div>
            <Button type="submit" disabled={emailLoading || !emailInput.trim()}>
              <Send className="h-4 w-4 mr-1" />
              {t('friends.byEmail.send')}
            </Button>
          </form>
          <p className="text-xs text-[var(--color-text-secondary)] mt-2">
            {t('friends.byEmail.hint')}
          </p>
        </CardContent>
      </Card>

      <Tabs tabs={tabItems} activeTab={activeTab} onChange={setActiveTab} />

      {/* ── FRIENDS LIST ── */}
      {activeTab === 'friends' && (
        <FadeIn>
          {friends.length === 0 ? (
            <EmptyState
              icon={Users}
              title={t('friends.noFriends')}
              description={t('friends.noFriendsDesc')}
            />
          ) : (
            <StaggerContainer className="space-y-3">
              {friends.map((friend) => (
                <StaggerItem key={friend.friendshipId}>
                  <Card>
                    <CardContent className="flex items-center gap-4 py-4">
                      <Link to={`/u/${friend.username}`}>
                        <Avatar src={friend.avatarUrl} fallback={friend.username} size="md" />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/u/${friend.username}`}
                          className="font-semibold text-[var(--color-text)] hover:text-[var(--color-primary)] transition"
                        >
                          {friend.username}
                        </Link>
                        {friend.bio && (
                          <p className="text-sm text-[var(--color-text-secondary)] truncate">
                            {friend.bio}
                          </p>
                        )}
                        <div className="flex items-center gap-3 mt-1">
                          {friend.itemsCount != null && (
                            <span className="text-xs text-[var(--color-text-secondary)]">
                              {friend.itemsCount} {t('friends.items')}
                            </span>
                          )}
                          {friend.since && (
                            <span className="text-xs text-[var(--color-text-secondary)]">
                              <Clock className="inline h-3 w-3 mr-0.5" />
                              {t('friends.since')} {new Date(friend.since).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemove(friend.friendshipId)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                      >
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </FadeIn>
      )}

      {/* ── RECEIVED REQUESTS ── */}
      {activeTab === 'received' && (
        <FadeIn>
          {received.length === 0 ? (
            <EmptyState
              icon={UserPlus}
              title={t('friends.noReceivedRequests')}
              description={t('friends.noReceivedRequestsDesc')}
            />
          ) : (
            <StaggerContainer className="space-y-3">
              {received.map((req) => (
                <StaggerItem key={req.friendshipId}>
                  <Card>
                    <CardContent className="flex items-center gap-4 py-4">
                      <Link to={`/u/${req.username}`}>
                        <Avatar src={req.avatarUrl} fallback={req.username} size="md" />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/u/${req.username}`}
                          className="font-semibold text-[var(--color-text)] hover:text-[var(--color-primary)] transition"
                        >
                          {req.username}
                        </Link>
                        {req.bio && (
                          <p className="text-sm text-[var(--color-text-secondary)] truncate">
                            {req.bio}
                          </p>
                        )}
                        {req.sentAt && (
                          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                            <Clock className="inline h-3 w-3 mr-0.5" />
                            {new Date(req.sentAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleAccept(req.friendshipId)}>
                          <Check className="h-4 w-4 mr-1" />
                          {t('friends.accept')}
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleDecline(req.friendshipId)}
                        >
                          <X className="h-4 w-4 mr-1" />
                          {t('friends.decline')}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </FadeIn>
      )}

      {/* ── SENT REQUESTS ── */}
      {activeTab === 'sent' && (
        <FadeIn>
          {sent.length === 0 ? (
            <EmptyState
              icon={Send}
              title={t('friends.noSentRequests')}
              description={t('friends.noSentRequestsDesc')}
            />
          ) : (
            <StaggerContainer className="space-y-3">
              {sent.map((req) => (
                <StaggerItem key={req.friendshipId}>
                  <Card>
                    <CardContent className="flex items-center gap-4 py-4">
                      <Link to={`/u/${req.username}`}>
                        <Avatar src={req.avatarUrl} fallback={req.username} size="md" />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link
                          to={`/u/${req.username}`}
                          className="font-semibold text-[var(--color-text)] hover:text-[var(--color-primary)] transition"
                        >
                          {req.username}
                        </Link>
                        {req.bio && (
                          <p className="text-sm text-[var(--color-text-secondary)] truncate">
                            {req.bio}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary">
                            <Clock className="h-3 w-3 mr-1" />
                            {t('friends.pending')}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleCancelRequest(req.friendshipId)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        {t('friends.cancel')}
                      </Button>
                    </CardContent>
                  </Card>
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </FadeIn>
      )}
    </div>
  );
}
