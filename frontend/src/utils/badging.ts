/**
 * Utilitaire pour l'API Badging (badge sur l'icône PWA).
 * Permet d'afficher un compteur de notifications sur l'icône de l'app.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/Badging_API
 */

/** Vérifie si l'API Badging est supportée */
export function isBadgingSupported(): boolean {
  return 'setAppBadge' in navigator;
}

/**
 * Définit le badge de l'application avec un compteur.
 * @param count - Nombre à afficher (0 efface le badge)
 */
export async function setAppBadge(count: number): Promise<void> {
  if (!isBadgingSupported()) return;

  try {
    if (count <= 0) {
      await (navigator as any).clearAppBadge();
    } else {
      await (navigator as any).setAppBadge(count);
    }
  } catch {
    // Silently ignore — may fail in unsupported contexts
  }
}

/**
 * Efface le badge de l'application.
 */
export async function clearAppBadge(): Promise<void> {
  if (!isBadgingSupported()) return;

  try {
    await (navigator as any).clearAppBadge();
  } catch {
    // Silently ignore
  }
}
