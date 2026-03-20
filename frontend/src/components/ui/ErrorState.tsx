import { cn } from '../../lib/utils';
import { AlertTriangle, RefreshCw, type LucideIcon } from 'lucide-react';
import { Button } from './Button';
import { FadeIn } from './Animations';

interface ErrorStateProps {
  icon?: React.ReactNode | LucideIcon;
  title?: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export function ErrorState({
  icon,
  title = 'Une erreur est survenue',
  description = 'Impossible de charger les données. Veuillez réessayer.',
  onRetry,
  retryLabel = 'Réessayer',
  className,
}: ErrorStateProps) {
  const renderIcon = () => {
    if (!icon) return <AlertTriangle className="h-14 w-14" />;
    if (typeof icon === 'function') {
      const IconComponent = icon as LucideIcon;
      return <IconComponent className="h-14 w-14" />;
    }
    return icon;
  };

  return (
    <FadeIn direction="up">
      <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
        <div className="mb-4 text-[var(--color-danger)]">
          {renderIcon()}
        </div>
        <h3 className="text-lg font-semibold text-[var(--color-text)]">{title}</h3>
        <p className="mt-1 max-w-sm text-sm text-[var(--color-text-secondary)]">{description}</p>
        {onRetry && (
          <div className="mt-4">
            <Button variant="secondary" onClick={onRetry}>
              <RefreshCw className="mr-2 h-4 w-4" />
              {retryLabel}
            </Button>
          </div>
        )}
      </div>
    </FadeIn>
  );
}
