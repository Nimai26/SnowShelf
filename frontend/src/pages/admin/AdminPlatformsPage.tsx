import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Save,
  Gamepad2,
  X,
} from 'lucide-react';
import { adminService } from '../../services/admin.service';
import type { AdminField } from '../../types/admin.types';
import type { PrimaryType } from '../../types/category.types';
import { Card, CardContent, Button, Input, Spinner, Badge } from '../../components/ui';
import toast from 'react-hot-toast';

// ── Regroupement visuel des plateformes par constructeur ──
const PLATFORM_GROUPS: Record<string, string[]> = {
  'PC': ['PC'],
  'Sony': ['PlayStation 5', 'PlayStation 4', 'PlayStation 3', 'PlayStation 2', 'PlayStation', 'PS Vita', 'PSP'],
  'Microsoft': ['Xbox Series X|S', 'Xbox One', 'Xbox 360', 'Xbox'],
  'Nintendo': ['Nintendo Switch', 'Wii U', 'Wii', 'GameCube', 'Nintendo 64', 'Super Nintendo', 'NES', 'Nintendo 3DS', 'Nintendo DS', 'Game Boy Advance', 'Game Boy Color', 'Game Boy'],
  'Sega': ['Dreamcast', 'Saturn', 'Mega Drive', 'Master System', 'Game Gear'],
  'Autres': ['Neo Geo', 'PC Engine', '3DO', 'Atari Jaguar', 'Atari 2600', 'Atari ST', 'Commodore 64', 'Amiga', 'Steam Deck', 'Arcade', 'Mobile', 'Autre'],
};

function getGroupForPlatform(name: string): string {
  for (const [group, platforms] of Object.entries(PLATFORM_GROUPS)) {
    if (platforms.includes(name)) return group;
  }
  return 'Autres';
}

function groupPlatforms(platforms: string[]): { group: string; items: string[] }[] {
  const grouped: Record<string, string[]> = {};
  for (const p of platforms) {
    const g = getGroupForPlatform(p);
    if (!grouped[g]) grouped[g] = [];
    grouped[g].push(p);
  }
  // Garder l'ordre des groupes défini
  const orderedGroups = Object.keys(PLATFORM_GROUPS);
  const result: { group: string; items: string[] }[] = [];
  for (const g of orderedGroups) {
    if (grouped[g]?.length) {
      result.push({ group: g, items: grouped[g] });
    }
  }
  // Plateformes non classées
  for (const g of Object.keys(grouped)) {
    if (!orderedGroups.includes(g)) {
      result.push({ group: g, items: grouped[g] });
    }
  }
  return result;
}

export default function AdminPlatformsPage() {
  const { t } = useTranslation('admin');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [field, setField] = useState<AdminField | null>(null);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [originalPlatforms, setOriginalPlatforms] = useState<string[]>([]);
  const [newPlatform, setNewPlatform] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Drag state
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const hasChanges = JSON.stringify(platforms) !== JSON.stringify(originalPlatforms);

  useEffect(() => {
    loadPlatformField();
  }, []);

  async function loadPlatformField() {
    try {
      setLoading(true);
      const types: PrimaryType[] = await adminService.getPrimaryTypes();
      const vgType = types.find((t) => t.key === 'video_games');
      if (!vgType) {
        toast.error(t('platforms.noVideoGamesType'));
        return;
      }
      const fields: AdminField[] = await adminService.getFieldsForAdmin(vgType.id);
      const platformField = fields.find((f) => f.fieldKey === 'platform');
      if (!platformField) {
        toast.error(t('platforms.noPlatformField'));
        return;
      }
      setField(platformField);
      const opts = platformField.fieldOptions || [];
      setPlatforms([...opts]);
      setOriginalPlatforms([...opts]);
    } catch {
      toast.error(t('platforms.loadError'));
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!field) return;
    try {
      setSaving(true);
      await adminService.updateField(field.id, { fieldOptions: platforms });
      setOriginalPlatforms([...platforms]);
      toast.success(t('platforms.saved'));
    } catch {
      toast.error(t('platforms.saveError'));
    } finally {
      setSaving(false);
    }
  }

  function handleAddPlatform() {
    const name = newPlatform.trim();
    if (!name) return;
    if (platforms.some((p) => p.toLowerCase() === name.toLowerCase())) {
      toast.error(t('platforms.duplicate'));
      return;
    }
    setPlatforms([...platforms, name]);
    setNewPlatform('');
    inputRef.current?.focus();
  }

  function handleRemove(index: number) {
    setPlatforms(platforms.filter((_, i) => i !== index));
  }

  // ── Drag & Drop ──
  function handleDragStart(index: number) {
    setDragIndex(index);
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    setDragOverIndex(index);
  }

  function handleDrop(targetIndex: number) {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }
    const updated = [...platforms];
    const [moved] = updated.splice(dragIndex, 1);
    updated.splice(targetIndex, 0, moved);
    setPlatforms(updated);
    setDragIndex(null);
    setDragOverIndex(null);
  }

  function handleDragEnd() {
    setDragIndex(null);
    setDragOverIndex(null);
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Spinner />
      </div>
    );
  }

  if (!field) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6">
        <p className="text-[var(--color-text-secondary)]">{t('platforms.noPlatformField')}</p>
      </div>
    );
  }

  const grouped = groupPlatforms(platforms);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/admin"
            className="p-2 rounded-lg hover:bg-[var(--color-hover)] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Gamepad2 className="w-6 h-6 text-[var(--color-primary)]" />
          <div>
            <h1 className="text-2xl font-bold">{t('platforms.title')}</h1>
            <p className="text-sm text-[var(--color-text-secondary)]">
              {t('platforms.subtitle', { count: platforms.length })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Badge variant="secondary" className="animate-pulse">
              {t('platforms.unsaved')}
            </Badge>
          )}
          <Button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            {saving ? t('platforms.saving') : t('platforms.save')}
          </Button>
        </div>
      </div>

      {/* Grouped platforms – vue lecture / réordonnement */}
      {grouped.map(({ group, items }) => (
        <Card key={group}>
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">
              {group}
            </h3>
            <div className="space-y-1">
              {items.map((platform) => {
                const globalIndex = platforms.indexOf(platform);
                const isDragging = dragIndex === globalIndex;
                const isDragOver = dragOverIndex === globalIndex;
                return (
                  <div
                    key={platform}
                    draggable
                    onDragStart={() => handleDragStart(globalIndex)}
                    onDragOver={(e) => handleDragOver(e, globalIndex)}
                    onDrop={() => handleDrop(globalIndex)}
                    onDragEnd={handleDragEnd}
                    className={`
                      flex items-center justify-between px-3 py-2 rounded-lg
                      transition-all cursor-grab active:cursor-grabbing
                      ${isDragging ? 'opacity-30 scale-95' : ''}
                      ${isDragOver ? 'bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30' : 'hover:bg-[var(--color-hover)]'}
                      ${!isDragOver ? 'border border-transparent' : ''}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <GripVertical className="w-4 h-4 text-[var(--color-text-secondary)] flex-shrink-0" />
                      <span className="text-sm font-medium">🎮</span>
                      <span className="text-sm">{platform}</span>
                    </div>
                    <button
                      onClick={() => handleRemove(globalIndex)}
                      className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-[var(--color-text-secondary)] hover:text-red-500 transition-colors"
                      title={t('platforms.remove')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Add platform */}
      <Card>
        <CardContent className="p-4">
          {showAddForm ? (
            <div className="flex items-center gap-2">
              <Input
                ref={inputRef}
                value={newPlatform}
                onChange={(e) => setNewPlatform(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddPlatform();
                  if (e.key === 'Escape') {
                    setShowAddForm(false);
                    setNewPlatform('');
                  }
                }}
                placeholder={t('platforms.addPlaceholder')}
                className="flex-1"
                autoFocus
              />
              <Button onClick={handleAddPlatform} disabled={!newPlatform.trim()}>
                <Plus className="w-4 h-4" />
              </Button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewPlatform('');
                }}
                className="p-2 rounded-lg hover:bg-[var(--color-hover)] text-[var(--color-text-secondary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setShowAddForm(true);
                setTimeout(() => inputRef.current?.focus(), 50);
              }}
              className="flex items-center gap-2 w-full py-2 text-[var(--color-primary)] hover:text-[var(--color-primary)]/80 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="text-sm font-medium">{t('platforms.add')}</span>
            </button>
          )}
        </CardContent>
      </Card>

      {/* Info */}
      <p className="text-xs text-[var(--color-text-secondary)] text-center">
        {t('platforms.info')}
      </p>
    </div>
  );
}
