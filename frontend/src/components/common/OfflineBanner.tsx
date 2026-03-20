import { useTranslation } from 'react-i18next';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

/**
 * Bannière fine affichée en haut de l'écran lorsque
 * l'utilisateur est hors connexion.
 */
export default function OfflineBanner() {
  const { t } = useTranslation('common');
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="bg-amber-600 text-white text-xs font-medium text-center py-1.5 px-4 flex items-center justify-center gap-2">
      <WifiOff className="h-3.5 w-3.5" />
      {t('offline.banner', 'Vous êtes hors connexion — mode limité')}
    </div>
  );
}
