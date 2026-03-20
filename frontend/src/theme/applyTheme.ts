import { getThemeById } from './themes';
import type { ThemeColors } from './themes';

const CSS_VAR_MAP: Record<keyof ThemeColors, string> = {
  background: '--color-background',
  surface: '--color-surface',
  card: '--color-card',
  border: '--color-border',
  hover: '--color-hover',
  primary: '--color-primary',
  primaryForeground: '--color-primary-foreground',
  text: '--color-text',
  textSecondary: '--color-text-secondary',
  accent: '--color-accent',
};

export function applyTheme(themeId: string) {
  const theme = getThemeById(themeId);
  const root = document.documentElement;

  // Set CSS custom properties
  for (const [key, cssVar] of Object.entries(CSS_VAR_MAP)) {
    root.style.setProperty(cssVar, theme.colors[key as keyof ThemeColors]);
  }

  // Set data attribute for potential CSS selectors
  root.setAttribute('data-theme', theme.id);

  // Persist
  localStorage.setItem('theme', theme.id);
}

export function getStoredTheme(): string {
  return localStorage.getItem('theme') || 'dark';
}

export function initTheme() {
  applyTheme(getStoredTheme());
}
