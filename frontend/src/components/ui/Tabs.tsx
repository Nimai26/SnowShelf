import * as React from 'react';
import { cn } from '../../lib/utils';

interface TabsProps {
  tabs: { id: string; label: string; icon?: React.ReactNode }[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div className={cn('flex gap-1 overflow-x-auto rounded-lg bg-[var(--color-surface)] p-1', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            'flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-2 text-sm font-medium transition sm:gap-2 sm:px-4',
            activeTab === tab.id
              ? 'bg-[var(--color-card)] text-[var(--color-text)] shadow-sm'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]',
          )}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}
