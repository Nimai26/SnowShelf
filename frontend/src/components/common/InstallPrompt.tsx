import { useTranslation } from 'react-i18next';
import { Download, X } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

/**
 * Bannière d'installation PWA — non intrusive, positionnée en bas.
 * Apparaît automatiquement lorsque le navigateur émet beforeinstallprompt.
 */
export default function InstallPrompt() {
  const { t } = useTranslation('common');
  const { isInstallable, install, dismiss } = usePWAInstall();

  if (!isInstallable) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50 animate-slide-up">
      <div className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-lg">
        <div className="flex-shrink-0 rounded-lg bg-[var(--color-primary)]/10 p-2">
          <Download className="h-5 w-5 text-[var(--color-primary)]" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--color-text)]">
            {t('pwa.installTitle', 'Installer SnowShelf')}
          </p>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
            {t(
              'pwa.installDescription',
              'Accédez rapidement à vos collections depuis votre écran d\'accueil.',
            )}
          </p>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={install}
            className="rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 transition"
          >
            {t('pwa.install', 'Installer')}
          </button>
          <button
            onClick={dismiss}
            className="rounded-lg p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] transition"
            aria-label={t('common:close', 'Fermer')}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
