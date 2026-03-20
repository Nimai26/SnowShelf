/**
 * Utilitaire pour le retour haptique sur mobile.
 * Utilise l'API Vibration si disponible.
 */

type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'selection';

const patterns: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [10, 50, 10],
  error: [50, 30, 50, 30, 50],
  selection: 5,
};

/**
 * Vérifie si l'API Vibration est supportée
 */
export function isHapticSupported(): boolean {
  return 'vibrate' in navigator;
}

/**
 * Déclenche un retour haptique
 * @param pattern - Type de vibration: light, medium, heavy, success, error, selection
 */
export function hapticFeedback(pattern: HapticPattern = 'light'): void {
  if (!isHapticSupported()) return;

  try {
    navigator.vibrate(patterns[pattern]);
  } catch {
    // Silently ignore if vibration fails
  }
}

/**
 * Déclenche un retour haptique lors du tap
 */
export function hapticTap(): void {
  hapticFeedback('light');
}

/**
 * Déclenche un retour haptique lors de la sélection
 */
export function hapticSelect(): void {
  hapticFeedback('selection');
}

/**
 * Déclenche un retour haptique de succès
 */
export function hapticSuccess(): void {
  hapticFeedback('success');
}

/**
 * Déclenche un retour haptique d'erreur
 */
export function hapticError(): void {
  hapticFeedback('error');
}
