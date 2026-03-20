import { useCallback } from 'react';

interface ShareData {
  title?: string;
  text?: string;
  url?: string;
}

/**
 * Hook pour partager du contenu via l'API Web Share (mobile) ou fallback clipboard.
 *
 * Utilise navigator.share() sur mobile et navigator.clipboard sur desktop.
 */
export function useWebShare() {
  const isSupported = typeof navigator !== 'undefined' && 'share' in navigator;

  /**
   * Partage du contenu. Sur mobile, ouvre le panneau de partage natif.
   * Sur desktop, copie l'URL dans le clipboard.
   * @returns true si le partage a réussi, false sinon
   */
  const share = useCallback(
    async (data: ShareData): Promise<boolean> => {
      // Try native Web Share API first (mobile)
      if (isSupported) {
        try {
          await navigator.share(data);
          return true;
        } catch (err) {
          // AbortError = user cancelled — not an error
          if (err instanceof Error && err.name === 'AbortError') {
            return false;
          }
          // Fall through to clipboard fallback
        }
      }

      // Fallback: copy URL to clipboard
      const textToCopy = data.url || data.text || data.title || '';
      if (textToCopy && navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(textToCopy);
          return true;
        } catch {
          return false;
        }
      }

      return false;
    },
    [isSupported],
  );

  /**
   * Partage un item de la collection
   */
  const shareItem = useCallback(
    (itemName: string, itemId: number) => {
      return share({
        title: `${itemName} — SnowShelf`,
        text: `Découvrez "${itemName}" dans ma collection SnowShelf`,
        url: `${window.location.origin}/items/${itemId}`,
      });
    },
    [share],
  );

  /**
   * Partage une catégorie
   */
  const shareCategory = useCallback(
    (categoryName: string, categoryId: number) => {
      return share({
        title: `${categoryName} — SnowShelf`,
        text: `Découvrez la catégorie "${categoryName}" sur SnowShelf`,
        url: `${window.location.origin}/categories/${categoryId}`,
      });
    },
    [share],
  );

  return {
    /** L'API Web Share est-elle supportée nativement ? */
    isNativeShareSupported: isSupported,
    /** Partage générique */
    share,
    /** Partage un item */
    shareItem,
    /** Partage une catégorie */
    shareCategory,
  };
}
