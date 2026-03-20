/**
 * Centralized URL utilities for SnowShelf frontend.
 * Handles API base URL detection and media URL construction.
 */

/** Whether we're behind a reverse proxy (HTTPS or snowshelf.fr domain). */
const isProxied =
  window.location.protocol === 'https:' ||
  window.location.hostname.includes('snowshelf.fr');

/**
 * Get the API base URL.
 * In production (behind proxy), returns '' for relative paths.
 * In development, returns VITE_API_URL.
 */
export function getApiBaseUrl(): string {
  return isProxied ? '' : (import.meta.env.VITE_API_URL || '');
}

/**
 * Construct a full URL for media files (images, documents, videos, etc.).
 * Handles both external URLs (http/https) and local storage paths.
 */
export function getMediaUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${getApiBaseUrl()}${url}`;
}
