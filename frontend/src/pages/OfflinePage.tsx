import { useTranslation } from 'react-i18next';
import { WifiOff, RefreshCw } from 'lucide-react';
import logoImg from '../../assets/images/logo.png';

/**
 * Page affichée lorsque l'utilisateur est hors connexion
 * et tente d'accéder à une ressource non cachée.
 */
export default function OfflinePage() {
  const { t } = useTranslation('common');

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <img src={logoImg} alt="SnowShelf" className="h-16 w-16 mb-6 opacity-50" />

      <div className="rounded-full bg-[var(--color-hover)] p-4 mb-4">
        <WifiOff className="h-10 w-10 text-[var(--color-text-secondary)]" />
      </div>

      <h1 className="text-xl font-bold text-[var(--color-text)] mb-2">
        {t('offline.title', 'Hors connexion')}
      </h1>

      <p className="text-[var(--color-text-secondary)] max-w-md mb-6">
        {t(
          'offline.description',
          'Vous êtes actuellement hors connexion. Certaines fonctionnalités peuvent ne pas être disponibles. Vérifiez votre connexion internet et réessayez.',
        )}
      </p>

      <button
        onClick={handleRetry}
        className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary)] px-6 py-2.5 text-sm font-medium text-white hover:opacity-90 transition"
      >
        <RefreshCw className="h-4 w-4" />
        {t('offline.retry', 'Réessayer')}
      </button>

      <p className="text-xs text-[var(--color-text-secondary)] mt-8">
        {t(
          'offline.cachedHint',
          'Les pages et données déjà consultées restent disponibles.',
        )}
      </p>
    </div>
  );
}
