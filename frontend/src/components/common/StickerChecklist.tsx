import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface SpecialGroup {
  name: string;
  total: number;
  items: (number | string)[];
}

export interface ChecklistData {
  total: number;
  items: (number | string)[];
  specials: SpecialGroup[];
  owned: (number | string)[];
  ownedSpecials: Record<string, (number | string)[]>;
}

interface StickerChecklistProps {
  value: ChecklistData;
  onChange: (value: ChecklistData) => void;
  readOnly?: boolean;
}

export function StickerChecklist({ value, onChange, readOnly = false }: StickerChecklistProps) {
  const { t } = useTranslation();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    normal: true,
  });

  const ownedSet = new Set(value.owned.map(String));
  const totalOwned = value.owned.length;
  const totalSpecialsOwned = Object.values(value.ownedSpecials).reduce(
    (sum, arr) => sum + arr.length,
    0,
  );
  const grandTotal = value.total + value.specials.reduce((s, g) => s + g.total, 0);
  const grandOwned = totalOwned + totalSpecialsOwned;

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleSticker = (sticker: number | string) => {
    if (readOnly) return;
    const key = String(sticker);
    const next = ownedSet.has(key)
      ? value.owned.filter((s) => String(s) !== key)
      : [...value.owned, sticker];
    onChange({ ...value, owned: next });
  };

  const toggleSpecialSticker = (groupName: string, sticker: number | string) => {
    if (readOnly) return;
    const key = String(sticker);
    const current = value.ownedSpecials[groupName] || [];
    const currentSet = new Set(current.map(String));
    const next = currentSet.has(key)
      ? current.filter((s) => String(s) !== key)
      : [...current, sticker];
    onChange({
      ...value,
      ownedSpecials: { ...value.ownedSpecials, [groupName]: next },
    });
  };

  const progressPercent = grandTotal > 0 ? Math.round((grandOwned / grandTotal) * 100) : 0;

  return (
    <div className="space-y-4 sm:col-span-2">
      {/* Progress summary */}
      <div className="rounded-lg bg-[var(--color-hover)] p-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-[var(--color-text)]">
            {t('checklist.progress', 'Progression')}
          </span>
          <span className="font-semibold text-[var(--color-primary)]">
            {grandOwned} / {grandTotal} ({progressPercent}%)
          </span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--color-border)]">
          <div
            className="h-full rounded-full bg-[var(--color-primary)] transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {totalOwned > 0 && (
          <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
            {t('checklist.normalOwned', 'Images normales')}: {totalOwned}/{value.total}
            {value.specials.length > 0 && (
              <>
                {' · '}
                {t('checklist.specialsOwned', 'Spéciales')}: {totalSpecialsOwned}/
                {value.specials.reduce((s, g) => s + g.total, 0)}
              </>
            )}
          </p>
        )}
      </div>

      {/* Normal stickers */}
      {value.items.length > 0 && (
        <div className="rounded-lg border border-[var(--color-border)] overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection('normal')}
            className="flex w-full items-center justify-between bg-[var(--color-surface)] px-3 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-hover)]"
          >
            <span>
              {t('checklist.normalStickers', 'Images')} ({totalOwned}/{value.total})
            </span>
            {expandedSections.normal ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
          {expandedSections.normal && (
            <div className="grid grid-cols-10 gap-1 p-2 sm:grid-cols-14 md:grid-cols-20">
              {value.items.map((sticker) => {
                const isOwned = ownedSet.has(String(sticker));
                return (
                  <button
                    key={sticker}
                    type="button"
                    onClick={() => toggleSticker(sticker)}
                    disabled={readOnly}
                    className={`flex h-8 w-full items-center justify-center rounded text-xs font-medium transition ${
                      isOwned
                        ? 'bg-[var(--color-primary)] text-white'
                        : 'border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'
                    } ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
                    title={`#${sticker}`}
                  >
                    {sticker}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Special sticker groups */}
      {value.specials.map((group) => {
        const groupOwned = (value.ownedSpecials[group.name] || []);
        const groupOwnedSet = new Set(groupOwned.map(String));
        const sectionKey = `special-${group.name}`;
        return (
          <div key={group.name} className="rounded-lg border border-amber-300/50 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleSection(sectionKey)}
              className="flex w-full items-center justify-between bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:hover:bg-amber-900/30"
            >
              <span>
                ✨ {group.name.charAt(0).toUpperCase() + group.name.slice(1)} ({groupOwned.length}/{group.total})
              </span>
              {expandedSections[sectionKey] ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            {expandedSections[sectionKey] && (
              <div className="grid grid-cols-10 gap-1 p-2 sm:grid-cols-14 md:grid-cols-20">
                {group.items.map((sticker) => {
                  const isOwned = groupOwnedSet.has(String(sticker));
                  return (
                    <button
                      key={sticker}
                      type="button"
                      onClick={() => toggleSpecialSticker(group.name, sticker)}
                      disabled={readOnly}
                      className={`flex h-8 w-full items-center justify-center rounded text-xs font-medium transition ${
                        isOwned
                          ? 'bg-amber-500 text-white'
                          : 'border border-amber-300/50 text-amber-600 hover:border-amber-500 hover:text-amber-700 dark:text-amber-400'
                      } ${readOnly ? 'cursor-default' : 'cursor-pointer'}`}
                      title={`✨ ${group.name} #${sticker}`}
                    >
                      {sticker}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
