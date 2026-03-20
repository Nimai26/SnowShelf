import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Palette, Shield, Bell, Lock, Check, Smartphone } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { userService } from '../../services/user.service';
import { applyTheme } from '../../theme/applyTheme';
import { themes, themeGroups } from '../../theme/themes';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Input,
  Select,
  Switch,
  Tabs,
  Skeleton,
} from '../../components/ui';
import type { UserProfile, UpdateProfileData } from '../../services/user.service';
import { usePushNotifications } from '../../hooks/usePushNotifications';

export default function SettingsPage() {
  const { t, i18n } = useTranslation(['settings', 'common']);
  const { user, setUser } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('appearance');

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Bio edit
  const [bio, setBio] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await userService.getProfile();
      setProfile(data);
      setBio(data.bio || '');
    } catch {
      toast.error(t('common:errors.generic'));
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (updates: UpdateProfileData) => {
    setSaving(true);
    try {
      const updated = await userService.updateProfile(updates);
      setProfile(updated);
      if (user) {
        setUser({
          ...user,
          ...updates,
        });
      }
      toast.success(t('settings:saved'));
    } catch {
      toast.error(t('settings:saveError'));
    } finally {
      setSaving(false);
    }
  };

  const handleThemeChange = (themeId: string) => {
    applyTheme(themeId);
    saveSettings({ theme: themeId });
  };

  const handleLangChange = (lang: string) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('lang', lang);
    saveSettings({ lang });
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error(t('settings:security.confirmPassword'));
      return;
    }
    setChangingPassword(true);
    try {
      await userService.changePassword(currentPassword, newPassword);
      toast.success(t('settings:security.passwordChanged'));
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('common:errors.generic'));
    } finally {
      setChangingPassword(false);
    }
  };

  const tabItems = [
    { id: 'appearance', label: t('settings:appearance.title'), icon: <Palette className="h-4 w-4" /> },
    { id: 'privacy', label: t('settings:privacy.title'), icon: <Shield className="h-4 w-4" /> },
    { id: 'notifications', label: t('settings:notifications.title'), icon: <Bell className="h-4 w-4" /> },
    { id: 'security', label: t('settings:security.title'), icon: <Lock className="h-4 w-4" /> },
  ];

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 p-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-2xl font-bold text-[var(--color-text)]">{t('settings:title')}</h1>

      <Tabs tabs={tabItems} activeTab={activeTab} onChange={setActiveTab} />

      {/* ── APPARENCE ── */}
      {activeTab === 'appearance' && (
        <div className="space-y-6">
          {/* Bio */}
          <Card>
            <CardHeader>
              <CardTitle>{t('settings:profile.bio')}</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder={t('settings:profile.bioPlaceholder')}
                className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] resize-none"
                rows={3}
                maxLength={500}
              />
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-[var(--color-text-secondary)]">{bio.length}/500</span>
                <Button
                  size="sm"
                  loading={saving}
                  onClick={() => saveSettings({ bio })}
                >
                  {t('common:actions.save')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Langue */}
          <Card>
            <CardHeader>
              <CardTitle>{t('settings:appearance.language')}</CardTitle>
              <CardDescription>{t('settings:appearance.languageDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={profile.lang}
                onChange={(e) => handleLangChange(e.target.value)}
                options={[
                  { value: 'fr', label: '🇫🇷 Français' },
                  { value: 'en', label: '🇬🇧 English' },
                ]}
              />
            </CardContent>
          </Card>

          {/* Thème */}
          <Card>
            <CardHeader>
              <CardTitle>{t('settings:appearance.theme')}</CardTitle>
              <CardDescription>{t('settings:appearance.themeDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {themeGroups.map((group) => (
                  <div key={group}>
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
                      {group}
                    </h4>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                      {themes
                        .filter((th) => th.group === group)
                        .map((th) => {
                          const isActive = profile.theme === th.id;
                          return (
                            <button
                              key={th.id}
                              onClick={() => handleThemeChange(th.id)}
                              className={`relative flex flex-col items-center gap-1 rounded-lg border-2 px-2 py-3 text-xs transition ${
                                isActive
                                  ? 'border-[var(--color-primary)] ring-1 ring-[var(--color-primary)]'
                                  : 'border-[var(--color-border)] hover:border-[var(--color-text-secondary)]'
                              }`}
                            >
                              {/* Preview */}
                              <div className="flex gap-0.5">
                                <div
                                  className="h-6 w-4 rounded-l"
                                  style={{ backgroundColor: th.colors.background }}
                                />
                                <div
                                  className="h-6 w-4"
                                  style={{ backgroundColor: th.colors.surface }}
                                />
                                <div
                                  className="h-6 w-4 rounded-r"
                                  style={{ backgroundColor: th.colors.primary }}
                                />
                              </div>
                              <span className="truncate text-[var(--color-text)]" title={th.name}>
                                {th.name}
                              </span>
                              {isActive && (
                                <Check className="absolute right-1 top-1 h-3.5 w-3.5 text-[var(--color-primary)]" />
                              )}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── CONFIDENTIALITÉ ── */}
      {activeTab === 'privacy' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings:privacy.collectionsVisibility')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={profile.collectionsVisibility}
                onChange={(e) => saveSettings({ collectionsVisibility: e.target.value })}
                options={[
                  { value: 'private', label: t('settings:privacy.collectionsVisibilityOptions.private') },
                  { value: 'friends', label: t('settings:privacy.collectionsVisibilityOptions.friends') },
                  { value: 'public', label: t('settings:privacy.collectionsVisibilityOptions.public') },
                ]}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <Switch
                checked={profile.showEmail}
                onChange={(val) => saveSettings({ showEmail: val })}
                label={t('settings:privacy.showEmail')}
                description={t('settings:privacy.showEmailDescription')}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('settings:privacy.friendRequestPolicy')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={profile.friendRequestPolicy || 'everyone'}
                onChange={(e) => saveSettings({ friendRequestPolicy: e.target.value })}
                options={[
                  { value: 'everyone', label: t('settings:privacy.friendRequestPolicyOptions.everyone') },
                  { value: 'nobody', label: t('settings:privacy.friendRequestPolicyOptions.nobody') },
                ]}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── NOTIFICATIONS ── */}
      {activeTab === 'notifications' && (
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <Switch
                checked={profile.newsletter}
                onChange={(val) => saveSettings({ newsletter: val })}
                label={t('settings:notifications.newsletter')}
                description={t('settings:notifications.newsletterDescription')}
              />
            </CardContent>
          </Card>

          <PushNotificationSettings />
        </div>
      )}

      {/* ── SÉCURITÉ ── */}
      {activeTab === 'security' && (
        <Card>
          <CardHeader>
            <CardTitle>{t('settings:security.changePassword')}</CardTitle>
            <CardDescription>{t('settings:security.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <Input
                label={t('settings:security.currentPassword')}
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
              <Input
                label={t('settings:security.newPassword')}
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <Input
                label={t('settings:security.confirmPassword')}
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                error={
                  confirmPassword && newPassword !== confirmPassword
                    ? t('settings:security.confirmPassword')
                    : undefined
                }
              />
              <Button type="submit" loading={changingPassword}>
                {t('settings:security.changePassword')}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Push Notification Settings sub-component
// ──────────────────────────────────────────────

function PushNotificationSettings() {
  const { t } = useTranslation(['settings', 'common']);
  const {
    isSupported,
    permission,
    isSubscribed,
    loading,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  if (!isSupported) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-[var(--color-text-secondary)]">
            <Smartphone className="h-5 w-5" />
            <p className="text-sm">
              {t(
                'settings:notifications.pushNotSupported',
                'Les notifications push ne sont pas supportées par ce navigateur.',
              )}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          {t('settings:notifications.pushTitle', 'Notifications push')}
        </CardTitle>
        <CardDescription>
          {t(
            'settings:notifications.pushDescription',
            'Recevez des notifications même lorsque l\'application est fermée.',
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Switch
            checked={isSubscribed}
            onChange={async (val) => {
              if (val) {
                const success = await subscribe();
                if (success) {
                  toast.success(
                    t(
                      'settings:notifications.pushEnabled',
                      'Notifications push activées',
                    ),
                  );
                } else if (permission === 'denied') {
                  toast.error(
                    t(
                      'settings:notifications.pushDenied',
                      'Permission refusée. Vérifiez les paramètres de votre navigateur.',
                    ),
                  );
                }
              } else {
                await unsubscribe();
                toast.success(
                  t(
                    'settings:notifications.pushDisabled',
                    'Notifications push désactivées',
                  ),
                );
              }
            }}
            disabled={loading || permission === 'denied'}
            label={t(
              'settings:notifications.pushLabel',
              'Activer les notifications push',
            )}
            description={
              permission === 'denied'
                ? t(
                    'settings:notifications.pushBlockedHint',
                    'Les notifications sont bloquées par votre navigateur.',
                  )
                : t(
                    'settings:notifications.pushHint',
                    'Soyez notifié des mises à jour et événements importants.',
                  )
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
