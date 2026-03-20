import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Camera, Calendar, Package, FolderOpen, Crown } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { userService } from '../../services/user.service';
import { Avatar, Badge, Card, CardContent, Skeleton } from '../../components/ui';
import type { UserProfile } from '../../services/user.service';

export default function ProfilePage() {
  const { t } = useTranslation(['settings', 'common']);
  const { user, setUser } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await userService.getProfile();
      setProfile(data);
    } catch {
      toast.error(t('common:errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Le fichier ne doit pas dépasser 2 Mo');
      return;
    }

    setUploading(true);
    try {
      const { avatarUrl } = await userService.uploadAvatar(file);
      setProfile((prev) => prev ? { ...prev, avatarUrl } : null);
      if (user) setUser({ ...user, avatarUrl });
      toast.success('Avatar mis à jour');
    } catch {
      toast.error(t('common:errors.generic'));
    } finally {
      setUploading(false);
    }
  };

  const roleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="danger">{t('common:roles.admin')}</Badge>;
      case 'premium':
        return <Badge variant="premium"><Crown className="h-3 w-3 mr-1" />{t('common:roles.premium')}</Badge>;
      default:
        return <Badge variant="secondary">{t('common:roles.free')}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 p-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!profile) return null;

  const memberDate = new Date(profile.createdAt).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      {/* Header profil */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            {/* Avatar */}
            <div className="relative">
              <Avatar
                src={profile.avatarUrl}
                fallback={profile.username}
                size="xl"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute -bottom-1 -right-1 rounded-full bg-[var(--color-primary)] p-1.5 text-white shadow transition hover:opacity-90 disabled:opacity-50"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>

            {/* Infos */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <h1 className="text-2xl font-bold text-[var(--color-text)]">
                  {profile.username}
                </h1>
                {roleBadge(profile.role)}
              </div>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                {profile.email}
              </p>
              {profile.bio && (
                <p className="mt-2 text-sm text-[var(--color-text)]">
                  {profile.bio}
                </p>
              )}
              <div className="mt-3 flex items-center gap-1 text-xs text-[var(--color-text-secondary)] justify-center sm:justify-start">
                <Calendar className="h-3.5 w-3.5" />
                <span>{t('settings:profile.memberSince')} {memberDate}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex flex-col items-center py-6">
            <Package className="mb-2 h-6 w-6 text-[var(--color-primary)]" />
            <span className="text-2xl font-bold text-[var(--color-text)]">
              {profile.itemsCount}
            </span>
            <span className="text-xs text-[var(--color-text-secondary)]">Items</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center py-6">
            <FolderOpen className="mb-2 h-6 w-6 text-[var(--color-primary)]" />
            <span className="text-2xl font-bold text-[var(--color-text)]">
              {profile.categoriesCount}
            </span>
            <span className="text-xs text-[var(--color-text-secondary)]">Catégories</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center py-6">
            <Crown className="mb-2 h-6 w-6 text-[var(--color-accent)]" />
            <span className="text-2xl font-bold text-[var(--color-text)]">
              {profile.totalValue ? `${profile.totalValue}€` : '—'}
            </span>
            <span className="text-xs text-[var(--color-text-secondary)]">Valeur totale</span>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
