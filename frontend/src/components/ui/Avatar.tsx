import { cn } from '../../lib/utils';

export function Avatar({
  src,
  alt,
  fallback,
  size = 'md',
  className,
}: {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}) {
  const sizes = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-14 w-14 text-lg',
    xl: 'h-20 w-20 text-2xl',
  };

  const initials = fallback
    ? fallback.slice(0, 2).toUpperCase()
    : alt
      ? alt.slice(0, 2).toUpperCase()
      : '?';

  if (src) {
    return (
      <img
        src={src}
        alt={alt || 'Avatar'}
        className={cn(
          'rounded-full object-cover ring-2 ring-[var(--color-border)]',
          sizes[size],
          className,
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-full bg-[var(--color-primary)] font-bold text-white ring-2 ring-[var(--color-border)]',
        sizes[size],
        className,
      )}
    >
      {initials}
    </div>
  );
}
