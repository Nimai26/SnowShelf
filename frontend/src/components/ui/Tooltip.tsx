import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '../../lib/utils';

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: TooltipPosition;
  delay?: number;
  className?: string;
  disabled?: boolean;
  /** Duration (ms) before auto-hiding on touch devices. 0 = manual dismiss only. */
  touchDismissDelay?: number;
  /** Minimum long-press duration (ms) to show tooltip on touch. Default: 400 */
  longPressDuration?: number;
  /** Allow wrapping text in the tooltip bubble */
  wrap?: boolean;
  /** Max width for tooltip (default: none) */
  maxWidth?: string;
}

export function Tooltip({
  content,
  children,
  position = 'top',
  delay = 300,
  className,
  disabled = false,
  touchDismissDelay = 2500,
  longPressDuration = 400,
  wrap = false,
  maxWidth,
}: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const longPressActiveRef = useRef(false);

  // ── Hover (desktop) ──
  const show = useCallback(() => {
    if (disabled) return;
    timeoutRef.current = setTimeout(() => setVisible(true), delay);
  }, [delay, disabled]);

  const hide = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setVisible(false);
  }, []);

  // ── Touch (mobile) — long-press to show, auto-dismiss ──
  const handleTouchStart = useCallback(() => {
    if (disabled) return;
    longPressActiveRef.current = false;
    touchTimeoutRef.current = setTimeout(() => {
      longPressActiveRef.current = true;
      setVisible(true);
      // Auto-dismiss after a delay
      if (touchDismissDelay > 0) {
        dismissTimeoutRef.current = setTimeout(() => setVisible(false), touchDismissDelay);
      }
    }, longPressDuration);
  }, [disabled, longPressDuration, touchDismissDelay]);

  const handleTouchEnd = useCallback(() => {
    if (touchTimeoutRef.current) clearTimeout(touchTimeoutRef.current);
    // If a long press was detected, prevent the ensuing click from toggling the button
    if (longPressActiveRef.current) {
      longPressActiveRef.current = false;
    }
  }, []);

  const handleTouchMove = useCallback(() => {
    // Cancel long-press if finger moves
    if (touchTimeoutRef.current) clearTimeout(touchTimeoutRef.current);
  }, []);

  // Dismiss on tap-outside (for touch)
  useEffect(() => {
    if (!visible) return;
    const handleOutsideTouch = (e: TouchEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setVisible(false);
      }
    };
    document.addEventListener('touchstart', handleOutsideTouch, { passive: true });
    return () => document.removeEventListener('touchstart', handleOutsideTouch);
  }, [visible]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (touchTimeoutRef.current) clearTimeout(touchTimeoutRef.current);
      if (dismissTimeoutRef.current) clearTimeout(dismissTimeoutRef.current);
    };
  }, []);

  const positionClasses: Record<TooltipPosition, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses: Record<TooltipPosition, string> = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-[var(--color-surface)] border-x-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-[var(--color-surface)] border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-[var(--color-surface)] border-y-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-[var(--color-surface)] border-y-transparent border-l-transparent',
  };

  return (
    <div
      ref={triggerRef}
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
    >
      {children}
      {visible && content && (
        <div
          role="tooltip"
          style={maxWidth ? { maxWidth } : undefined}
          className={cn(
            'absolute z-50 rounded-lg px-3 py-1.5',
            'bg-[var(--color-surface)] text-[var(--color-text)] text-xs font-medium',
            'shadow-lg border border-[var(--color-border)]',
            'animate-in fade-in duration-150',
            wrap ? 'whitespace-normal' : 'whitespace-nowrap',
            positionClasses[position],
            className,
          )}
        >
          {content}
          <span
            className={cn(
              'absolute border-4',
              arrowClasses[position],
            )}
          />
        </div>
      )}
    </div>
  );
}
