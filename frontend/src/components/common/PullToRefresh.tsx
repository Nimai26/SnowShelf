import { ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  enabled?: boolean;
  className?: string;
}

/**
 * Composant wrapper pour le pull-to-refresh sur mobile.
 * Affiche un indicateur de chargement rotatif lors du pull.
 */
export default function PullToRefresh({
  onRefresh,
  children,
  enabled = true,
  className = '',
}: PullToRefreshProps) {
  const { containerRef, refreshing, pullDistance } = usePullToRefresh({
    onRefresh,
    enabled,
  });

  const showIndicator = pullDistance > 10 || refreshing;
  const progress = Math.min(pullDistance / 80, 1);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Pull indicator */}
      {showIndicator && (
        <div
          className="absolute left-1/2 -translate-x-1/2 z-10 transition-opacity duration-200"
          style={{
            top: Math.min(pullDistance - 20, 40),
            opacity: refreshing ? 1 : progress,
          }}
        >
          <div className="flex items-center justify-center rounded-full bg-[var(--color-card)] shadow-lg p-2 border border-[var(--color-border)]">
            <RefreshCw
              className={`h-5 w-5 text-[var(--color-primary)] ${refreshing ? 'animate-spin' : ''}`}
              style={{
                transform: refreshing
                  ? undefined
                  : `rotate(${progress * 360}deg)`,
              }}
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div
        style={{
          transform:
            pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined,
          transition: pullDistance === 0 ? 'transform 0.2s ease' : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}
