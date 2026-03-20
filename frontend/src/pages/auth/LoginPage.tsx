import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../stores/authStore';
import { Button, Input, Card, CardContent } from '../../components/ui';

export default function LoginPage() {
  const { t } = useTranslation('auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await login(email, password);
      toast.success(t('login.success', 'Connexion réussie !'));
      navigate('/');
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('login.error', 'Erreur de connexion'));
    }
  };

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md">
        <Card>
          <CardContent className="p-8">
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-[var(--color-text)]">{t('login.title')}</h1>
              <p className="mt-2 text-[var(--color-text-secondary)]">{t('login.subtitle')}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label={t('login.email')}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('login.emailPlaceholder')}
                required
                autoComplete="email"
              />

              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="block text-sm font-medium text-[var(--color-text)]">
                    {t('login.password')}
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-sm text-[var(--color-primary)] hover:underline transition"
                  >
                    {t('login.forgotPassword')}
                  </Link>
                </div>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>

              <Button type="submit" loading={isLoading} className="w-full">
                {t('login.submit')}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-[var(--color-text-secondary)]">
              {t('login.noAccount')}{' '}
              <Link to="/register" className="font-medium text-[var(--color-primary)] hover:underline transition">
                {t('login.createAccount')}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
