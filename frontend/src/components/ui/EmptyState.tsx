import { isValidElement } from 'react';
import { cn } from '../../lib/utils';
import { PackageOpen, type LucideIcon } from 'lucide-react';
import { FadeIn } from './Animations';

interface EmptyStateProps {
  icon?: React.ReactNode | LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  const renderIcon = () => {
    if (!icon) return <PackageOpen className="h-16 w-16" />;
    if (isValidElement(icon)) return icon;
    // Function component or forwardRef component
    const IconComponent = icon as LucideIcon;
    return <IconComponent className="h-16 w-16" />;
  };

  return (
    <FadeIn direction="up" delay={0.1}>
      <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
        <div className="mb-4 text-[var(--color-text-secondary)]">
          {renderIcon()}
        </div>
        <h3 className="text-lg font-semibold text-[var(--color-text)]">{title}</h3>
        {description && (
          <p className="mt-1 max-w-sm text-sm text-[var(--color-text-secondary)]">{description}</p>
        )}
        {action && <div className="mt-4">{action}</div>}
      </div>
    </FadeIn>
  );
}
