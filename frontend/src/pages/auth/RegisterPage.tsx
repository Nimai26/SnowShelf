import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { Mail } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { Button, Input, Card, CardContent } from '../../components/ui';

export default function RegisterPage() {
  const { t } = useTranslation('auth');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { register, isLoading, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (password !== confirmPassword) {
      toast.error(t('register.passwordMismatch', 'Les mots de passe ne correspondent pas'));
      return;
    }

    try {
      const message = await register(username, email, password);
      setSuccessMessage(message);
      toast.success(t('register.success', 'Inscription réussie !'));
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('register.error', "Erreur d'inscription"));
    }
  };

  if (successMessage) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Mail className="mx-auto mb-4 h-12 w-12 text-[var(--color-primary)]" />
            <h2 className="mb-2 text-2xl font-bold text-[var(--color-text)]">{t('register.successTitle')}</h2>
            <p className="mb-4 text-[var(--color-text-secondary)]">{successMessage}</p>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {t('register.redirecting', 'Redirection vers la page de connexion...')}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md">
        <Card>
          <CardContent className="p-8">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-[var(--color-text)]">{t('register.title')}</h1>
              <p className="mt-2 text-[var(--color-text-secondary)]">{t('register.subtitle')}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label={t('register.username')}
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t('register.usernamePlaceholder')}
                minLength={3}
                maxLength={50}
                pattern="^[a-zA-Z0-9_]+$"
                title={t('register.usernameTitle', 'Lettres, chiffres et underscores uniquement')}
                required
                autoComplete="username"
              />

              <Input
                label={t('register.email')}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('register.emailPlaceholder')}
                required
                autoComplete="email"
              />

              <Input
                label={t('register.password')}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('register.passwordPlaceholder')}
                minLength={8}
                required
                autoComplete="new-password"
              />

              <Input
                label={t('register.confirmPassword')}
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                minLength={8}
                required
                autoComplete="new-password"
                error={
                  confirmPassword && password !== confirmPassword
                    ? t('register.passwordMismatch', 'Les mots de passe ne correspondent pas')
                    : undefined
                }
              />

              <Button
                type="submit"
                loading={isLoading}
                disabled={!!confirmPassword && password !== confirmPassword}
                className="w-full"
              >
                {t('register.submit')}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-[var(--color-text-secondary)]">
              {t('register.hasAccount')}{' '}
              <Link to="/login" className="font-medium text-[var(--color-primary)] hover:underline transition">
                {t('register.login')}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
