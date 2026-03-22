import * as React from 'react';
import { cn } from '../../lib/utils';
import { X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
}

export function Modal({ open, onClose, children, className, title, description }: ModalProps) {
  // Fermer avec Escape
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) {
      document.addEventListener('keydown', handleKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Modal container — centré via flex */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pb-20 sm:pb-4 pointer-events-none"
          >
            <div
              className={cn(
                'w-full max-w-lg max-h-full flex flex-col pointer-events-auto',
                'rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-xl',
                className,
              )}
            >
            {/* Header */}
            <div className="flex items-start justify-between mb-4 shrink-0">
              <div>
                {title && (
                  <h2 className="text-lg font-semibold text-[var(--color-text)]">{title}</h2>
                )}
                {description && (
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1 text-[var(--color-text-secondary)] hover:bg-[var(--color-hover)] hover:text-[var(--color-text)] transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {/* Content */}
            <div className="min-h-0 flex-1 overflow-y-auto">
              {children}
            </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
