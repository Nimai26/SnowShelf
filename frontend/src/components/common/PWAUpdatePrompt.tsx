import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshCw } from 'lucide-react';

/**
 * Toast / bannière qui apparaît lorsqu'une nouvelle version
 * du Service Worker est disponible. Propose un rechargement.
 */
export default function PWAUpdatePrompt() {
  const { t } = useTranslation('common');
  const [showUpdate, setShowUpdate] = useState(false);

  useEffect(() => {
    // Listen for SW update events from vite-plugin-pwa
    const handleSWUpdate = () => {
      setShowUpdate(true);
    };

    // vite-plugin-pwa dispatches a custom event
    document.addEventListener('swUpdated', handleSWUpdate);

    // Also listen for the SW controllerchange event
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // Controller changed — new SW took over
      });
    }

    return () => {
      document.removeEventListener('swUpdated', handleSWUpdate);
    };
  }, []);

  const handleUpdate = useCallback(() => {
    window.location.reload();
  }, []);

  if (!showUpdate) return null;

  return (
    <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-[60] animate-slide-up">
      <div className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-lg">
        <div className="flex-shrink-0 rounded-lg bg-blue-500/10 p-2">
          <RefreshCw className="h-5 w-5 text-blue-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--color-text)]">
            {t('pwa.updateAvailable', 'Mise à jour disponible')}
          </p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
            {t(
              'pwa.updateDescription',
              'Une nouvelle version de SnowShelf est disponible.',
            )}
          </p>
        </div>
        <button
          onClick={handleUpdate}
          className="flex-shrink-0 rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 transition"
        >
          {t('pwa.reload', 'Recharger')}
        </button>
      </div>
    </div>
  );
}
