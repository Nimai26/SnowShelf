import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import CategoryIcon from './CategoryIcon';

interface CategoryOption {
  id: number;
  name: string;
  icon: string;
  iconType?: string;
}

interface CategorySelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: CategoryOption[];
  placeholder?: string;
  className?: string;
}

export default function CategorySelect({
  label,
  value,
  onChange,
  options,
  placeholder = '',
  className = '',
}: CategorySelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selected = options.find((o) => String(o.id) === value);

  return (
    <div ref={ref} className={`relative w-full ${className}`}>
      {label && (
        <label className="mb-1 block text-sm font-medium text-[var(--color-text)]">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] transition focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
      >
        <span className="flex items-center gap-2 truncate">
          {selected ? (
            <>
              <CategoryIcon icon={selected.icon} iconType={selected.iconType as 'emoji' | 'url'} size="sm" />
              {selected.name}
            </>
          ) : (
            <span className="text-[var(--color-text-secondary)]">{placeholder}</span>
          )}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-[var(--color-text-secondary)] transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-lg">
          {/* Empty / placeholder option */}
          <li>
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false); }}
              className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition hover:bg-[var(--color-hover)] ${
                !value ? 'bg-[var(--color-hover)] font-medium' : ''
              }`}
            >
              <span className="text-[var(--color-text-secondary)]">{placeholder}</span>
            </button>
          </li>
          {options.map((opt) => (
            <li key={opt.id}>
              <button
                type="button"
                onClick={() => { onChange(String(opt.id)); setOpen(false); }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-sm transition hover:bg-[var(--color-hover)] ${
                  String(opt.id) === value ? 'bg-[var(--color-hover)] font-medium' : ''
                }`}
              >
                <CategoryIcon icon={opt.icon} iconType={opt.iconType as 'emoji' | 'url'} size="sm" />
                {opt.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
