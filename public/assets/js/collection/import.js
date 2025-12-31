/**
 * SnowShelf - Collection Module
 * import.js - Import de données depuis WebSearch
 * 
 * Ce module utilise les tables de mapping configurées dans l'admin:
 * - item_field_mappings: pour les champs fixes (nom, description, valeur, images, videos, audio, documents)
 * - primary_type_key_to_field: pour les métadonnées dynamiques selon le type primaire
 */

import { getTranslations } from './state.js';
import { showToast } from './ui/feedback.js';
import { truncate } from './utils.js';

// ============================================================================
// CACHE DES MAPPINGS
// ============================================================================

/** Cache des mappings par webapi_id */
const fieldMappingsCache = new Map();

/** Cache des mappings métadonnées par primary_type_id */
const metadataMappingsCache = new Map();

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Parse une valeur monétaire et extrait le nombre
 * Gère les formats: "199,99 €", "€199.99", "$19.99", "199.99", "19,99€", etc.
 * @param {string|number} value - Valeur à parser
 * @returns {number|null} Valeur numérique ou null si non parsable
 */
function parseMonetaryValue(value) {
    if (value === null || value === undefined) return null;
    
    // Si c'est déjà un nombre, le retourner directement
    if (typeof value === 'number') return value;
    
    // Convertir en string
    let str = String(value).trim();
    if (!str) return null;
    
    // Supprimer les symboles de devises courants et espaces
    // EUR: €, USD: $, GBP: £, JPY: ¥, etc.
    str = str.replace(/[€$£¥₹₽₩₪₴₿฿₫₱₸₺₼₾₿\s]/g, '');
    // Supprimer aussi les codes de devise textuels (EUR, USD, etc.)
    str = str.replace(/\b(EUR|USD|GBP|JPY|CNY|CAD|AUD|CHF|SEK|NOK|DKK|PLN|CZK|HUF|RON|BGN|HRK|RUB|TRY|BRL|MXN|INR|KRW|SGD|HKD|TWD|THB|MYR|IDR|PHP|VND|AED|SAR|ZAR|NZD)\b/gi, '');
    str = str.trim();
    
    // Détecter le format: virgule décimale (européen) ou point décimal (US)
    // Format européen: 1.234,56 ou 1234,56
    // Format US: 1,234.56 ou 1234.56
    
    const hasComma = str.includes(',');
    const hasDot = str.includes('.');
    
    if (hasComma && hasDot) {
        // Les deux présents: déterminer lequel est le séparateur décimal
        const lastComma = str.lastIndexOf(',');
        const lastDot = str.lastIndexOf('.');
        
        if (lastComma > lastDot) {
            // Format européen: 1.234,56 -> virgule = décimale
            str = str.replace(/\./g, '').replace(',', '.');
        } else {
            // Format US: 1,234.56 -> point = décimale
            str = str.replace(/,/g, '');
        }
    } else if (hasComma) {
        // Seulement virgule: probablement format européen (décimale)
        // Mais vérifier si c'est un séparateur de milliers (ex: 1,234)
        const parts = str.split(',');
        if (parts.length === 2 && parts[1].length <= 2) {
            // Virgule décimale: 199,99
            str = str.replace(',', '.');
        } else {
            // Virgule comme séparateur de milliers: 1,234 -> 1234
            str = str.replace(/,/g, '');
        }
    }
    // Si seulement point, c'est déjà au bon format
    
    const parsed = parseFloat(str);
    return isNaN(parsed) ? null : parsed;
}

/**
 * Vérifie si une URL pointe vers une vraie image (pas juste un dossier)
 * @param {string} url - URL à valider
 * @returns {boolean} true si l'URL est valide
 */
function isValidImageUrl(url) {
    if (!url || typeof url !== 'string') return false;
    const cleanedUrl = url.replace(/\\\//g, '/').trim();
    // Rejeter les URLs qui se terminent par / (dossiers)
    if (cleanedUrl.endsWith('/')) return false;
    // Vérifier qu'il y a un nom de fichier après le dernier /
    const lastSlashIdx = cleanedUrl.lastIndexOf('/');
    if (lastSlashIdx === -1) return false;
    const filename = cleanedUrl.substring(lastSlashIdx + 1);
    // Le fichier doit avoir au moins 1 caractère et idéalement une extension ou être un ID long
    return filename.length > 0 && (filename.includes('.') || filename.length > 10);
}

/**
 * Nettoie une URL des échappements JSON et espaces, et valide qu'elle pointe vers une image
 * @param {string} url - URL potentiellement avec échappements
 * @returns {string|null} URL nettoyée ou null si invalide
 */
function cleanImageUrl(url) {
    if (!url || typeof url !== 'string') return null;
    const cleaned = url.replace(/\\\//g, '/').trim();
    // Valider que l'URL pointe vers une vraie image
    if (!isValidImageUrl(cleaned)) return null;
    return cleaned || null;
}

/**
 * Normalise une URL d'image pour la comparaison (détection de doublons)
 * Supporte Amazon, TMDB, IGDB et autres patterns
 * @param {string} url - URL à normaliser
 * @returns {string} - Clé de comparaison normalisée
 */
function normalizeImageUrlForComparison(url) {
    if (!url || typeof url !== 'string') return '';
    const cleaned = url.replace(/\\\//g, '/').trim();
    if (!cleaned) return '';
    
    // Pattern Amazon: /images/I/{ID}._{SIZE_PARAMS}.jpg
    const amazonMatch = cleaned.match(/\/images\/I\/([A-Za-z0-9+%-]+)\._[^/]+$/);
    if (amazonMatch) {
        return `amazon:${amazonMatch[1]}`;
    }
    
    // Pattern TMDB: https://image.tmdb.org/t/p/w500/abc123.jpg
    const tmdbMatch = cleaned.match(/image\.tmdb\.org\/t\/p\/[^/]+\/([^/]+)$/);
    if (tmdbMatch) {
        return `tmdb:${tmdbMatch[1]}`;
    }
    
    // Pattern IGDB: https://images.igdb.com/igdb/image/upload/t_cover_big/abc123.jpg
    const igdbMatch = cleaned.match(/images\.igdb\.com\/[^/]+\/[^/]+\/[^/]+\/t_[^/]+\/([^/]+)$/);
    if (igdbMatch) {
        return `igdb:${igdbMatch[1]}`;
    }
    
    // Pattern Lulu-Berlu et sites similaires: image-{ID}-{taille}.jpg
    // Ex: p-image-250137-moyenne.jpg, p-image-250137-grande.jpg
    const luluberluMatch = cleaned.match(/image-(\d+)-(?:mini|petite|moyenne|grande|original)\.(?:jpg|png|webp)/i);
    if (luluberluMatch) {
        // Extraire aussi le nom de base pour éviter collision entre produits différents
        const baseNameMatch = cleaned.match(/\/([^/]+)-p-image-\d+/);
        const baseName = baseNameMatch ? baseNameMatch[1].substring(0, 30) : '';
        return `luluberlu:${baseName}:${luluberluMatch[1]}`;
    }
    
    // Pattern générique avec suffixes de taille: filename-{taille}.jpg
    // Ex: product-small.jpg, product-medium.jpg, product-large.jpg
    const genericSizeMatch = cleaned.match(/\/([^/]+?)[-_](mini|small|thumb|petite|medium|moyenne|large|grande|big|xl|xxl|original|hd|full)\.(?:jpg|jpeg|png|webp|gif)/i);
    if (genericSizeMatch) {
        return `generic:${genericSizeMatch[1].toLowerCase()}`;
    }
    
    // Pattern générique avec dimensions numériques (ex: image_250x250.webp, image_470x246.webp)
    // Extrait le nom de base avant les dimensions pour regrouper les variantes
    const dimensionSuffixMatch = cleaned.match(/\/([^/]+?)[-_](\d{2,4})x(\d{2,4})\.(?:jpg|jpeg|png|webp|gif)/i);
    if (dimensionSuffixMatch) {
        return `imgbase:${dimensionSuffixMatch[1].toLowerCase()}`;
    }
    
    // Pattern pour images sans dimensions explicites mais même nom de base
    // Ex: image.webp vs image_250x250.webp - on extrait le nom sans extension
    // Ce pattern utilise le même préfixe 'imgbase:' pour grouper avec les images dimensionnées
    const baseNameMatch = cleaned.match(/\/([^/]+?)\.(?:jpg|jpeg|png|webp|gif)$/i);
    if (baseNameMatch) {
        return `imgbase:${baseNameMatch[1].toLowerCase()}`;
    }
    
    // Pour les autres URLs, utiliser l'URL complète nettoyée en minuscules
    return cleaned.toLowerCase();
}

/**
 * Extrait la taille d'une URL d'image (tous providers)
 * Supporte: Amazon, TMDB, IGDB, paramètres URL génériques
 * @param {string} url - URL de l'image
 * @returns {number} - Taille en pixels (0 si non trouvée)
 */
function getImageSize(url) {
    if (!url || typeof url !== 'string') return 0;
    
    // === Amazon ===
    // Patterns: _SL500_, _AC_SL1500_, _UX500_, _UY500_, etc.
    const amazonMatch = url.match(/[._](SL|UX|UY|SS|SX|SY)(\d+)[._]/i);
    if (amazonMatch) {
        return parseInt(amazonMatch[2], 10);
    }
    const amazonAltMatch = url.match(/_(?:AC_)?(?:SL|UX|UY|SS|SX|SY)(\d+)_/i);
    if (amazonAltMatch) {
        return parseInt(amazonAltMatch[1], 10);
    }
    
    // === TMDB ===
    // Patterns: /w500/, /w780/, /w1280/, /original/ (considéré comme très grand)
    const tmdbMatch = url.match(/\/w(\d+)\//i);
    if (tmdbMatch) {
        return parseInt(tmdbMatch[1], 10);
    }
    if (url.includes('/original/')) {
        return 10000; // Original = meilleure qualité
    }
    
    // === IGDB ===
    // Patterns: t_thumb (90), t_cover_small (90), t_cover_big (264), t_720p (720), t_1080p (1080)
    const igdbSizes = {
        't_thumb': 90,
        't_micro': 35,
        't_cover_small': 90,
        't_cover_big': 264,
        't_logo_med': 284,
        't_screenshot_med': 569,
        't_screenshot_big': 889,
        't_screenshot_huge': 1280,
        't_720p': 720,
        't_1080p': 1080
    };
    for (const [pattern, size] of Object.entries(igdbSizes)) {
        if (url.includes(pattern)) {
            return size;
        }
    }
    
    // === Paramètres URL génériques ===
    // Patterns: ?width=500, ?w=500, ?size=500, &width=500, etc.
    const paramMatch = url.match(/[?&](width|w|size|height|h)=(\d+)/i);
    if (paramMatch) {
        return parseInt(paramMatch[2], 10);
    }
    
    // === Dimensions dans le nom de fichier ===
    // Patterns: image_1920x1080.jpg, image-800x600.png, image_250x250.webp
    const dimensionMatch = url.match(/[_-](\d{2,4})x(\d{2,4})\./i);
    if (dimensionMatch) {
        // Retourner la plus grande dimension
        return Math.max(parseInt(dimensionMatch[1], 10), parseInt(dimensionMatch[2], 10));
    }
    
    // === Suffixes de taille textuels (Lulu-Berlu, etc.) ===
    // Patterns: -mini, -petite, -moyenne, -grande, -original
    const textSizes = {
        'mini': 50, 'thumb': 80, 'small': 100, 'petite': 100,
        'medium': 300, 'moyenne': 300,
        'large': 600, 'grande': 600, 'big': 600,
        'xl': 800, 'xxl': 1000, 'hd': 1080, 'full': 1200, 'original': 2000
    };
    for (const [suffix, size] of Object.entries(textSizes)) {
        if (url.toLowerCase().includes(`-${suffix}.`) || url.toLowerCase().includes(`_${suffix}.`)) {
            return size;
        }
    }
    
    // === Images sans suffixe de taille ===
    // Si l'URL ne contient pas de suffixe de taille, c'est probablement l'image originale
    const hasNoSizeSuffix = !url.match(/[_-](\d{2,4})x(\d{2,4})\./i) &&
                            !url.match(/[_-](mini|small|thumb|petite|medium|moyenne|large|grande|big|xl|xxl|original|hd|full)\./i);
    if (hasNoSizeSuffix) {
        // Vérifier si c'est sur un sous-domaine thumbs (ex: thumbs.coleka.com) = thumbnail
        if (url.includes('thumbs.') || url.includes('/thumbs/') || url.includes('/thumbnails/')) {
            return 150; // Probablement une miniature
        }
        // Sinon, c'est probablement une image pleine résolution
        return 1500;
    }
    
    return 0;
}

/**
 * Déduplique un tableau d'URLs d'images basé sur leur contenu normalisé
 * Pour tous les providers, garde celle avec la meilleure résolution
 * @param {string[]} urls - Tableau d'URLs
 * @returns {string[]} - Tableau d'URLs dédupliquées (meilleure qualité)
 */
function deduplicateImageUrls(urls) {
    const seen = new Map(); // normalizedKey → {url, size}
    
    for (const url of urls) {
        if (!url) continue;
        const key = normalizeImageUrlForComparison(url);
        if (!key) continue;
        
        const currentSize = getImageSize(url);
        const existing = seen.get(key);
        
        if (!existing) {
            // Première occurrence
            seen.set(key, { url, size: currentSize });
        } else if (currentSize > existing.size) {
            // Meilleure résolution trouvée, remplacer
            seen.set(key, { url, size: currentSize });
        }
        // Sinon, garder l'existante (même taille ou plus grande)
    }
    
    // Retourner les URLs dans l'ordre d'insertion (Map conserve l'ordre)
    return Array.from(seen.values()).map(item => item.url);
}

/**
 * Extrait l'année d'une date ou retourne l'année si c'est déjà une année
 * @param {string|number} value - Valeur contenant une date ou une année
 * @returns {number|null} - Année en nombre ou null
 */
function extractYear(value) {
    if (!value) return null;
    
    const strValue = String(value).trim();
    
    // Année seule (4 chiffres)
    if (/^\d{4}$/.test(strValue)) {
        return parseInt(strValue, 10);
    }
    
    // Format ISO (YYYY-MM-DD)
    const isoMatch = strValue.match(/^(\d{4})-\d{2}-\d{2}/);
    if (isoMatch) {
        return parseInt(isoMatch[1], 10);
    }
    
    // Format DD/MM/YYYY ou DD-MM-YYYY
    const dmyMatch = strValue.match(/\d{1,2}[\/\-]\d{1,2}[\/\-](\d{4})/);
    if (dmyMatch) {
        return parseInt(dmyMatch[1], 10);
    }
    
    // Chercher 4 chiffres consécutifs qui ressemblent à une année (19xx ou 20xx)
    const yearMatch = strValue.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) {
        return parseInt(yearMatch[0], 10);
    }
    
    return null;
}

/**
 * Normalise les URLs d'images depuis différents formats d'API
 * Gère les formats suivants :
 * - Tableau d'URLs : ["url1", "url2"]
 * - Objet images : {cover: "url", screenshots: [...], artworks: [...], background: "url"}
 * - URL simple : "url"
 * - Tableau d'objets avec URL : [{url: "...", is_main: true}, ...]
 * 
 * @param {*} value - Valeur brute depuis l'API
 * @returns {string[]} Tableau d'URLs normalisées et dédupliquées
 */
function normalizeImageUrls(value) {
    if (!value) return [];
    
    let urls = [];
    
    // Si c'est déjà un tableau
    if (Array.isArray(value)) {
        // Filtrer et extraire les URLs - peut contenir des strings ou objets
        urls = value.map(item => {
            if (typeof item === 'string') return cleanImageUrl(item);
            if (item && typeof item === 'object' && item.url) return cleanImageUrl(item.url);
            return null;
        }).filter(url => url && typeof url === 'string');
    }
    // Si c'est une string simple
    else if (typeof value === 'string') {
        const cleaned = cleanImageUrl(value);
        return cleaned ? [cleaned] : [];
    }
    // Si c'est un objet avec des propriétés images (format RAWG/IGDB/JVC)
    else if (typeof value === 'object' && value !== null) {
        // Cover principal
        const cover = cleanImageUrl(value.cover);
        if (cover) urls.push(cover);
        
        // Primary (format normalisé)
        const primary = cleanImageUrl(value.primary);
        if (primary) urls.push(primary);
        
        // Gallery (format normalisé)
        if (Array.isArray(value.gallery)) {
            value.gallery.forEach(item => {
                const url = typeof item === 'string' ? cleanImageUrl(item) : cleanImageUrl(item?.url);
                if (url) urls.push(url);
            });
        }
        // Screenshots
        if (Array.isArray(value.screenshots)) {
            value.screenshots.forEach(item => {
                const url = typeof item === 'string' ? cleanImageUrl(item) : cleanImageUrl(item?.url);
                if (url) urls.push(url);
            });
        }
        // Artworks
        if (Array.isArray(value.artworks)) {
            value.artworks.forEach(item => {
                const url = typeof item === 'string' ? cleanImageUrl(item) : cleanImageUrl(item?.url);
                if (url) urls.push(url);
            });
        }
        // Background
        const bg = cleanImageUrl(value.background);
        if (bg) urls.push(bg);
    }
    
    // Dédupliquer avec détection des variantes Amazon
    return deduplicateImageUrls(urls);
}

// ============================================================================
// RÉCUPÉRATION DES MAPPINGS DEPUIS L'API
// ============================================================================

/**
 * Récupère les mappings de champs fixes pour un provider (webapi_id)
 * @param {number} webapiId - ID du provider
 * @returns {Promise<Array>} Liste des mappings
 */
export async function fetchFieldMappings(webapiId) {
    if (!webapiId) return [];
    
    // Vérifier le cache
    if (fieldMappingsCache.has(webapiId)) {
        return fieldMappingsCache.get(webapiId);
    }
    
    try {
        const response = await fetch(`/api/field-mappings.php?webapi_id=${webapiId}`);
        const result = await response.json();
        
        if (result.success && result.data?.field_mappings) {
            const mappings = result.data.field_mappings;
            fieldMappingsCache.set(webapiId, mappings);
            return mappings;
        }
        
        return [];
    } catch (error) {
        console.error('[Import] Erreur récupération field mappings:', error);
        return [];
    }
}

/**
 * Récupère les mappings de métadonnées pour un type primaire
 * @param {number} primaryTypeId - ID du type primaire
 * @returns {Promise<Array>} Liste des mappings
 */
export async function fetchMetadataMappings(primaryTypeId) {
    if (!primaryTypeId) return [];
    
    // Vérifier le cache
    if (metadataMappingsCache.has(primaryTypeId)) {
        return metadataMappingsCache.get(primaryTypeId);
    }
    
    try {
        const response = await fetch(`/api/field-mappings.php?primary_type_id=${primaryTypeId}`);
        const result = await response.json();
        
        if (result.success && result.data?.metadata_mappings) {
            metadataMappingsCache.set(primaryTypeId, result.data.metadata_mappings);
            return result.data.metadata_mappings;
        }
        
        return [];
    } catch (error) {
        console.error('[Import] Erreur récupération metadata mappings:', error);
        return [];
    }
}

/**
 * Vide le cache des mappings
 */
export function clearMappingsCache() {
    fieldMappingsCache.clear();
    metadataMappingsCache.clear();
}

// ============================================================================
// APPLICATION DES TRANSFORMATIONS
// ============================================================================

/**
 * Extrait une valeur depuis une réponse API en suivant un chemin d'accès
 * Supporte les formats:
 * - Simple: "title"
 * - Imbriqué: "metadata.publisher"
 * - Tableau avec wildcard: "screenshots[*].url"
 * - Tableau avec index: "covers[0].url"
 * 
 * @param {Object} data - Données source (réponse API)
 * @param {string} path - Chemin d'accès (ex: "metadata.publisher")
 * @returns {*} Valeur extraite ou undefined
 */
export function extractValueByPath(data, path) {
    if (!data || !path) return undefined;
    
    // Gérer les chemins avec wildcards (array[*].prop)
    const wildcardMatch = path.match(/^(.+?)\[\*\]\.?(.*)$/);
    if (wildcardMatch) {
        const [, arrayPath, remainingPath] = wildcardMatch;
        const array = extractValueByPath(data, arrayPath);
        
        if (!Array.isArray(array)) return undefined;
        
        if (remainingPath) {
            // Extraire la propriété de chaque élément
            return array.map(item => extractValueByPath(item, remainingPath)).filter(v => v !== undefined);
        }
        return array;
    }
    
    // Gérer les chemins avec index (array[0].prop)
    const indexMatch = path.match(/^(.+?)\[(\d+)\]\.?(.*)$/);
    if (indexMatch) {
        const [, arrayPath, index, remainingPath] = indexMatch;
        const array = extractValueByPath(data, arrayPath);
        
        if (!Array.isArray(array)) return undefined;
        
        const item = array[parseInt(index)];
        if (item === undefined) return undefined;
        
        if (remainingPath) {
            return extractValueByPath(item, remainingPath);
        }
        return item;
    }
    
    // Chemin simple ou imbriqué (dot notation)
    const parts = path.split('.');
    let current = data;
    
    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        if (current === null || current === undefined) return undefined;
        
        // Si current est un tableau et qu'on cherche une propriété,
        // extraire cette propriété de chaque élément (équivalent implicite à [*])
        if (Array.isArray(current)) {
            const remainingPath = parts.slice(i).join('.');
            return current
                .map(item => extractValueByPath(item, remainingPath))
                .filter(v => v !== undefined && v !== null);
        }
        
        if (typeof current !== 'object') return undefined;
        current = current[part];
    }
    
    return current;
}

/**
 * Applique une transformation à une valeur extraite
 * @param {*} value - Valeur extraite
 * @param {string} transformType - Type de transformation
 * @param {Object|null} transformConfig - Configuration de la transformation
 * @returns {*} Valeur transformée
 */
export function applyTransform(value, transformType, transformConfig = null) {
    if (value === undefined || value === null) return undefined;
    
    // Pour les transformations qui attendent un tableau (join, first, array, array_join),
    // extraire automatiquement le tableau depuis les objets complexes
    const needsArrayExtraction = ['join', 'first', 'array', 'array_join'].includes(transformType);
    
    // Gérer les objets complexes
    if (typeof value === 'object' && !Array.isArray(value)) {
        // Toujours extraire .text des objets de traduction {text: "...", translated: bool}
        if (value.text !== undefined && typeof value.text === 'string') {
            value = value.text;
        }
        // Pour les transformations tableau uniquement : extraire les tableaux imbriqués
        else if (needsArrayExtraction) {
            // Objet de genres avec sous-tableau .genres
            if (Array.isArray(value.genres)) {
                value = value.genres;
            }
            // Chercher la première propriété qui est un tableau
            else {
                const arrayKey = Object.keys(value).find(k => Array.isArray(value[k]));
                if (arrayKey) {
                    value = value[arrayKey];
                }
            }
        }
    }
    
    switch (transformType) {
        case 'direct':
            // Retourner la valeur telle quelle
            return value;
        
        case 'first':
            // Prendre le premier élément d'un tableau
            if (Array.isArray(value)) {
                return value[0];
            }
            return value;
        
        case 'array':
            // S'assurer que c'est un tableau
            if (Array.isArray(value)) {
                return value;
            }
            return [value];
        
        case 'array_json':
            // Garder le tableau d'objets tel quel pour stockage JSON (tracklist, etc.)
            if (Array.isArray(value)) {
                return JSON.stringify(value);
            }
            if (typeof value === 'object') {
                return JSON.stringify([value]);
            }
            return value;
        
        case 'join':
        case 'array_join':
            // Joindre les éléments d'un tableau avec un séparateur
            if (Array.isArray(value)) {
                const separator = transformConfig?.separator || ', ';
                return value.join(separator);
            }
            return value;
        
        case 'template':
            // Appliquer un template avec des variables
            if (transformConfig?.template) {
                let result = transformConfig.template;
                
                // Si value est un objet, remplacer les variables
                if (typeof value === 'object' && !Array.isArray(value)) {
                    for (const [key, val] of Object.entries(value)) {
                        result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), val ?? '');
                    }
                } else {
                    // Remplacer {value} par la valeur directe
                    result = result.replace(/\{value\}/g, value);
                }
                
                return result;
            }
            return value;
        
        case 'date':
            // Convertir en format date ISO (YYYY-MM-DD)
            return convertToDateFormat(value);
        
        case 'find_by_key':
            // Trouver un élément dans un tableau selon une condition
            // Config: { match_key: "country", match_value: "FR", return_key: "rating" }
            // Exemple: certifications[{country: "FR", rating: "TP"}] -> "TP"
            if (Array.isArray(value) && transformConfig) {
                const { match_key, match_value, return_key } = transformConfig;
                if (!match_key || match_value === undefined) {
                    return value;
                }
                // Chercher l'élément correspondant
                const found = value.find(item => {
                    if (typeof item === 'object' && item !== null) {
                        return String(item[match_key]).toLowerCase() === String(match_value).toLowerCase();
                    }
                    return false;
                });
                if (found) {
                    // Si return_key est spécifié, retourner cette propriété
                    if (return_key) {
                        return found[return_key] ?? null;
                    }
                    // Sinon retourner l'objet entier
                    return found;
                }
                return null;
            }
            return value;
        
        case 'year_extract':
        case 'YEAR_EXTRACT':
            // Extraire l'année d'une date, OU convertir une année en date complète (01/01/année)
            // Si c'est juste une année (4 chiffres), on la convertit en date
            const yearOnly = String(value).match(/^(\d{4})$/);
            if (yearOnly) {
                // C'est juste une année, la convertir en date (1er janvier)
                return `${yearOnly[1]}-01-01`;
            }
            // Sinon extraire l'année d'une date complète et la convertir en date
            const extractedYear = extractYear(value);
            if (extractedYear) {
                return `${extractedYear}-01-01`;
            }
            return value;
        
        case 'first_value':
            // Prendre la première valeur (comme 'first' mais avec gestion des objets {name: ...})
            if (Array.isArray(value)) {
                if (value.length === 0) return null;
                const first = value[0];
                // Si c'est un objet avec 'name', extraire le name
                if (first && typeof first === 'object' && first.name) {
                    return first.name;
                }
                return first;
            }
            return value;
        
        case 'boolean_fr':
            // Convertir booléen en Oui/Non français
            const trueValues = [true, 1, '1', 'true', 'yes', 'oui', 'on'];
            const checkValue = typeof value === 'string' ? value.toLowerCase().trim() : value;
            return trueValues.includes(checkValue) ? 'Oui' : 'Non';
        
        case 'pegi_normalize':
            // Normaliser les classifications d'âge vers PEGI
            if (!value) return null;
            const strVal = String(value).toLowerCase().trim();
            
            // Si c'est déjà au format PEGI
            const pegiMatch = strVal.match(/pegi\s*(\d+)/i);
            if (pegiMatch) return 'PEGI ' + pegiMatch[1];
            
            // Extraire un âge numérique
            const ageMatch = strVal.match(/(\d+)/);
            if (ageMatch) {
                const age = parseInt(ageMatch[1]);
                if (age <= 3) return 'PEGI 3';
                if (age <= 7) return 'PEGI 7';
                if (age <= 12) return 'PEGI 12';
                if (age <= 16) return 'PEGI 16';
                return 'PEGI 18';
            }
            
            // Mappings ESRB -> PEGI
            const esrbToPegi = {
                'everyone': 'PEGI 3', 'e': 'PEGI 3',
                'everyone 10+': 'PEGI 12', 'e10+': 'PEGI 12', 'e10': 'PEGI 12',
                'teen': 'PEGI 12', 't': 'PEGI 12',
                'mature': 'PEGI 16', 'm': 'PEGI 16',
                'mature 17+': 'PEGI 18', 'adults only': 'PEGI 18', 'ao': 'PEGI 18'
            };
            return esrbToPegi[strVal] || null;
        
        case 'duration_format':
            // Formater une durée
            if (!value) return null;
            const unit = transformConfig?.unit || 'minutes';
            const suffix = transformConfig?.suffix || '';
            
            let duration;
            if (typeof value === 'number') {
                duration = value;
            } else {
                const durationMatch = String(value).match(/(\d+)/);
                if (!durationMatch) return value;
                duration = parseInt(durationMatch[1]);
            }
            
            // Convertir en heures si demandé
            if (unit === 'hours' && duration > 0) {
                const hours = Math.floor(duration / 60);
                const minutes = duration % 60;
                return hours > 0 ? `${hours}h${minutes > 0 ? String(minutes).padStart(2, '0') : ''}` : `${minutes}min`;
            }
            
            return duration + suffix;
        
        case 'status_mapping':
            // Mapping de statut (anglais -> français)
            if (!value || typeof value !== 'string' || !transformConfig) return value;
            const lowerStatus = value.toLowerCase().trim();
            
            // Chercher dans les mappings (clés en minuscules)
            for (const [key, translation] of Object.entries(transformConfig)) {
                if (key.toLowerCase() === lowerStatus) {
                    return translation;
                }
            }
            return value;
        
        default:
            return value;
    }
}

/**
 * Convertit une valeur en format date ISO (YYYY-MM-DD)
 * Gère les formats : YYYY, YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY, timestamps, etc.
 * @param {*} value - Valeur à convertir
 * @returns {string|null} Date au format YYYY-MM-DD ou null
 */
function convertToDateFormat(value) {
    if (!value) return null;
    
    const strValue = String(value).trim();
    
    // Déjà au format ISO
    if (/^\d{4}-\d{2}-\d{2}$/.test(strValue)) {
        return strValue;
    }
    
    // Juste une année (YYYY) -> convertir en 01/01/YYYY
    if (/^\d{4}$/.test(strValue)) {
        return `${strValue}-01-01`;
    }
    
    // Format DD/MM/YYYY ou DD-MM-YYYY
    const dmyMatch = strValue.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
    if (dmyMatch) {
        const [, day, month, year] = dmyMatch;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Format YYYY/MM/DD ou YYYY-MM-DD (avec séparateurs variés)
    const ymdMatch = strValue.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
    if (ymdMatch) {
        const [, year, month, day] = ymdMatch;
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    // Timestamp Unix (nombre de secondes ou millisecondes)
    if (/^\d{10,13}$/.test(strValue)) {
        const timestamp = strValue.length > 10 ? parseInt(strValue) : parseInt(strValue) * 1000;
        const date = new Date(timestamp);
        if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
        }
    }
    
    // Essayer de parser comme Date JavaScript
    const date = new Date(strValue);
    if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
    }
    
    return null;
}

/**
 * Applique un mapping complet pour extraire une valeur
 * Supporte les chemins multiples séparés par virgule (essaye chaque chemin jusqu'à trouver une valeur)
 * @param {Object} data - Données source
 * @param {Object} mapping - Configuration du mapping
 * @returns {*} Valeur extraite et transformée
 */
export function applyMapping(data, mapping) {
    const { api_path, transform_type = 'direct', transform_config = null } = mapping;
    
    // Gérer les chemins multiples séparés par virgule
    const paths = api_path.split(',').map(p => p.trim()).filter(p => p);
    
    let rawValue = undefined;
    
    // Essayer chaque chemin jusqu'à trouver une valeur
    for (const path of paths) {
        rawValue = extractValueByPath(data, path);
        if (rawValue !== undefined && rawValue !== null && rawValue !== '') {
            //console.log(`[applyMapping] Chemin "${path}" a trouvé:`, rawValue);
            break;
        }
    }
    
    // Appliquer la transformation
    return applyTransform(rawValue, transform_type, transform_config);
}

/**
 * Prépare les données d'import à partir d'une réponse API en utilisant les mappings
 * @param {Object} apiResponse - Réponse de l'API de recherche
 * @param {number} webapiId - ID du provider
 * @param {number} primaryTypeId - ID du type primaire
 * @returns {Promise<Object>} Données formatées pour l'import
 */
export async function prepareImportData(apiResponse, webapiId, primaryTypeId) {
    // Récupérer les mappings
    const [fieldMappings, metadataMappings] = await Promise.all([
        fetchFieldMappings(webapiId),
        fetchMetadataMappings(primaryTypeId)
    ]);
    
    console.log('[prepareImportData] fieldMappings récupérés:', fieldMappings);
    
    const result = {
        fieldsToImport: {
            name: null,
            description: null,
            value: null,
            code_barre: null,
            image_url: null,  // Pour compatibilité avec l'ancien format
            metadata: {}
        },
        importImage: false,
        importImages: [],
        importVideos: [],
        importAudio: [],
        importDocuments: [],
        importInstructions: []  // Pour les manuels d'instructions
    };
    
    // Appliquer les mappings de champs fixes
    console.log('[prepareImportData] Traitement champs fixes, count:', fieldMappings.length);
    for (const mapping of fieldMappings) {
        console.log(`[prepareImportData] Mapping champ fixe "${mapping.item_field}", api_path:`, mapping.api_path);
        const value = applyMapping(apiResponse, mapping);
        console.log(`[prepareImportData] Champ "${mapping.item_field}" -> valeur:`, value);
        
        if (value === undefined || value === null) continue;
        
        switch (mapping.item_field) {
            case 'name':
                result.fieldsToImport.name = value;
                break;
            case 'description':
                result.fieldsToImport.description = value;
                break;
            case 'value':
                result.fieldsToImport.value = value;
                console.log('[prepareImportData] ✅ Champ value assigné:', value);
                break;
            case 'code_barre':
                result.fieldsToImport.code_barre = value;
                break;
            case 'images':
                // Normaliser les images - peut être un tableau d'URLs, un objet {cover, screenshots, ...}, ou une URL simple
                result.importImages = normalizeImageUrls(value);
                break;
            case 'videos':
                result.importVideos = Array.isArray(value) ? value : [value];
                break;
            case 'audio':
                result.importAudio = Array.isArray(value) ? value : [value];
                break;
            case 'documents':
                result.importDocuments = Array.isArray(value) ? value : [value];
                break;
        }
    }
    
    // Appliquer les mappings de métadonnées
    console.log('[prepareImportData] Traitement métadonnées, count:', metadataMappings?.length);
    for (const mapping of metadataMappings) {
        if (!mapping.is_active) continue;
        
        // Les api_keys peuvent être un tableau de chemins alternatifs
        const apiKeys = Array.isArray(mapping.api_keys) ? mapping.api_keys : [mapping.api_keys];
        console.log(`[prepareImportData] Mapping ${mapping.field_key}, api_keys:`, apiKeys);
        
        let value = undefined;
        for (const apiKey of apiKeys) {
            value = extractValueByPath(apiResponse, apiKey);
            console.log(`[prepareImportData] Chemin "${apiKey}" -> valeur:`, value);
            if (value !== undefined) {
                // Appliquer la transformation
                value = applyTransform(value, mapping.transform_type, mapping.transform_config);
                break; // Utiliser la première valeur trouvée
            }
        }
        
        if (value !== undefined) {
            // Normaliser la valeur
            value = normalizeFieldValue(mapping.field_key, value);
            result.fieldsToImport.metadata[mapping.field_key] = value;
            console.log(`[prepareImportData] Métadonnée ${mapping.field_key} =`, value);
        }
    }
    
    // Remplir les champs de compatibilité pour les images
    if (result.importImages.length > 0) {
        result.fieldsToImport.image_url = result.importImages[0];
        result.importImage = true;
    }
    
    return result;
}

// ============================================================================
// TÉLÉCHARGEMENT DE FICHIERS
// ============================================================================

/**
 * Télécharge un fichier externe via le proxy serveur (contourne CORS)
 * @param {string} url - URL du fichier à télécharger
 * @param {string} type - Type de fichier ('image' ou 'document')
 * @returns {Promise<{blob: Blob, filename: string, mimeType: string}|null>}
 */
export async function downloadViaProxy(url, type = 'image') {
    try {
        // Validation: si url est un tableau, prendre le premier élément
        if (Array.isArray(url)) {
            if (url.length === 0) return null;
            url = url[0];
        }
        
        // Validation: s'assurer que c'est une string
        if (typeof url !== 'string' || !url) {
            console.error('[Collection] downloadViaProxy: URL invalide', url);
            return null;
        }
        
        // Nettoyer l'URL des caractères JSON échappés (\/ -> /)
        let cleanUrl = url.replace(/\\\//g, '/');
        
        // Encoder correctement les caractères spéciaux dans le chemin de l'URL
        // (espaces, accents, etc.) tout en préservant la structure de l'URL
        try {
            const urlObj = new URL(cleanUrl);
            // Encoder uniquement le pathname (pas le protocole/domaine)
            urlObj.pathname = urlObj.pathname.split('/').map(segment => {
                // Décoder d'abord si déjà encodé, puis ré-encoder proprement
                try {
                    return encodeURIComponent(decodeURIComponent(segment));
                } catch (decodeErr) {
                    return encodeURIComponent(segment);
                }
            }).join('/');
            cleanUrl = urlObj.toString();
        } catch (urlErr) {
            console.warn('[Collection] Impossible de parser l\'URL, utilisation telle quelle:', urlErr);
        }
        
        console.log(`[Collection] Téléchargement via proxy (${type}):`, cleanUrl);
        
        const response = await fetch('/api/proxy-download.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ url: cleanUrl, type })
        });
        
        // Gérer les différents codes d'erreur HTTP
        if (!response.ok) {
            // Récupérer le texte brut pour analyser la réponse
            const responseText = await response.text();
            
            // Essayer de parser en JSON
            try {
                const errorData = JSON.parse(responseText);
                throw new Error(errorData.error || `HTTP ${response.status}`);
            } catch (jsonErr) {
                // Si ce n'est pas du JSON (ex: page HTML de SWAG pour 502)
                if (response.status === 413) {
                    throw new Error('Fichier trop volumineux pour être téléchargé');
                } else if (response.status === 502) {
                    throw new Error('Le fichier est trop volumineux ou le serveur distant ne répond pas');
                } else if (response.status === 404) {
                    throw new Error('Fichier non trouvé');
                }
                throw new Error(`Erreur HTTP ${response.status}`);
            }
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Erreur proxy');
        }
        
        // ====================================================================
        // MODE STREAMING (gros fichiers > 50 Mo)
        // Le serveur a téléchargé le fichier et le garde en temporaire
        // On retourne les infos sans charger le fichier en mémoire navigateur
        // ====================================================================
        if (result.mode === 'streaming') {
            console.log(`[Collection] Mode streaming - fichier disponible sur serveur (${Math.round(result.size / 1024 / 1024)} Mo)`);
            
            // Pour les gros fichiers, on retourne un objet spécial avec le token
            // Le MediaManager devra utiliser ce token pour référencer le fichier
            return {
                isStreaming: true,
                token: result.token,
                filename: result.filename,
                mimeType: result.mimeType,
                size: result.size
            };
        }
        
        // ====================================================================
        // MODE BASE64 (petits fichiers < 50 Mo)
        // Le serveur retourne le fichier encodé en base64
        // ====================================================================
        const byteCharacters = atob(result.data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: result.mimeType });
        
        return {
            blob,
            filename: result.filename,
            mimeType: result.mimeType
        };
        
    } catch (error) {
        console.error('[Collection] Erreur proxy download:', error.message);
        return null;
    }
}

/**
 * Télécharge une image directement côté client (fallback si proxy échoue)
 * Certains sites (ComicVine via Cloudflare) bloquent les requêtes serveur mais pas navigateur
 * @param {string} url - URL de l'image
 * @returns {Promise<{blob: Blob, filename: string, mimeType: string}|null>}
 */
export async function downloadImageDirect(url) {
    try {
        // Validation: si url est un tableau, prendre le premier élément
        if (Array.isArray(url)) {
            if (url.length === 0) return null;
            url = url[0];
        }
        
        // Validation: s'assurer que c'est une string
        if (typeof url !== 'string' || !url) {
            console.error('[Collection] downloadImageDirect: URL invalide', url);
            return null;
        }
        
        const cleanUrl = url.replace(/\\\//g, '/');
        console.log('[Collection] Téléchargement direct (fallback):', cleanUrl);
        
        const response = await fetch(cleanUrl, {
            mode: 'cors',
            credentials: 'omit'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const blob = await response.blob();
        
        // Extraire le nom de fichier depuis l'URL
        const urlPath = new URL(cleanUrl).pathname;
        let filename = urlPath.split('/').pop() || 'image';
        
        // Si le filename n'a pas d'extension, en ajouter une basée sur le type MIME
        if (!filename.includes('.') || filename.split('.').pop().length > 5) {
            const mimeToExt = {
                'image/jpeg': 'jpg',
                'image/png': 'png',
                'image/gif': 'gif',
                'image/webp': 'webp',
                'image/svg+xml': 'svg',
                'image/bmp': 'bmp'
            };
            const ext = mimeToExt[blob.type] || 'jpg';
            filename = filename + '.' + ext;
        }
        
        return {
            blob,
            filename: filename,
            mimeType: blob.type || 'image/jpeg'
        };
    } catch (error) {
        console.error('[Collection] Erreur téléchargement direct:', error);
        return null;
    }
}

/**
 * Vérifie si une URL nécessite le proxy wsrv.nl (serveurs bloquant les requêtes serveur-à-serveur)
 * NOTE: ComicVine fonctionne maintenant avec le proxy PHP amélioré (headers Referer)
 * @param {string} url - URL à vérifier
 * @returns {boolean} true si wsrv.nl devrait être utilisé
 */
function needsWsrvProxy(url) {
    if (!url || typeof url !== 'string') return false;
    
    // Liste des domaines nécessitant wsrv.nl (bloquent les requêtes proxy classiques)
    // NOTE: ComicVine retiré car le proxy PHP fonctionne avec les bons headers
    const wsrvDomains = [
        // Ajouter ici les domaines qui bloquent vraiment le proxy PHP
    ];
    
    if (wsrvDomains.length === 0) return false;
    
    try {
        const urlObj = new URL(url);
        return wsrvDomains.some(domain => urlObj.hostname.includes(domain));
    } catch {
        return false;
    }
}

/**
 * Télécharge une image via le service wsrv.nl (contourne les blocages de hotlinking)
 * @param {string} url - URL de l'image originale
 * @returns {Promise<{blob: Blob, filename: string, mimeType: string}|null>}
 */
async function downloadViaWsrv(url) {
    try {
        // Validation
        if (!url || typeof url !== 'string') {
            console.error('[Collection] downloadViaWsrv: URL invalide', url);
            return null;
        }
        
        const cleanUrl = url.replace(/\\\//g, '/');
        
        // Construire l'URL wsrv.nl
        const wsrvUrl = `https://wsrv.nl/?url=${encodeURIComponent(cleanUrl)}`;
        console.log('[Collection] Téléchargement via wsrv.nl:', wsrvUrl);
        
        const response = await fetch(wsrvUrl, {
            mode: 'cors',
            credentials: 'omit'
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const blob = await response.blob();
        
        // Vérifier que c'est bien une image
        if (!blob.type.startsWith('image/')) {
            console.warn('[Collection] wsrv.nl n\'a pas retourné une image:', blob.type);
            return null;
        }
        
        // Extraire le nom de fichier depuis l'URL originale
        const urlPath = new URL(cleanUrl).pathname;
        let filename = urlPath.split('/').pop() || 'image';
        
        // Si le filename n'a pas d'extension, en ajouter une basée sur le type MIME
        if (!filename.includes('.') || filename.split('.').pop().length > 5) {
            const mimeToExt = {
                'image/jpeg': 'jpg',
                'image/png': 'png',
                'image/gif': 'gif',
                'image/webp': 'webp',
                'image/svg+xml': 'svg',
                'image/bmp': 'bmp'
            };
            const ext = mimeToExt[blob.type] || 'jpg';
            filename = filename + '.' + ext;
        }
        
        console.log('[Collection] Image téléchargée via wsrv.nl:', filename, blob.size, 'bytes');
        
        return {
            blob,
            filename: filename,
            mimeType: blob.type || 'image/jpeg'
        };
    } catch (error) {
        console.error('[Collection] Erreur téléchargement wsrv.nl:', error);
        return null;
    }
}

/**
 * Importe une image depuis une URL externe
 * @param {HTMLElement} modal - Élément modal
 * @param {string} imageUrl - URL de l'image à importer
 * @returns {Promise<boolean>} true si succès, false si échec
 */
export async function importImageFromUrl(modal, imageUrl) {
    // Utiliser mediaManagers.images (pluriel) pour les images
    const mediaManagers = modal._mediaManagers;
    const mediaManager = mediaManagers?.images;
    if (!mediaManager) {
        console.warn('[Collection] MediaManager images non initialisé pour import');
        return false;
    }
    
    let downloaded = null;
    
    // Pour certains domaines (ComicVine), utiliser directement wsrv.nl car le proxy classique échoue
    if (needsWsrvProxy(imageUrl)) {
        console.log('[Collection] Domaine nécessitant wsrv.nl détecté, utilisation directe...');
        downloaded = await downloadViaWsrv(imageUrl);
    }
    
    // Sinon, essayer d'abord le proxy serveur
    if (!downloaded) {
        downloaded = await downloadViaProxy(imageUrl, 'image');
    }
    
    // Si le proxy échoue, essayer wsrv.nl comme fallback (pour les domaines qui bloquent)
    if (!downloaded && needsWsrvProxy(imageUrl)) {
        console.log('[Collection] Proxy échoué, tentative via wsrv.nl...');
        downloaded = await downloadViaWsrv(imageUrl);
    }
    
    // En dernier recours, essayer le téléchargement direct (ne fonctionnera que si CORS est permis)
    if (!downloaded) {
        console.log('[Collection] Proxy échoué, tentative de téléchargement direct...');
        downloaded = await downloadImageDirect(imageUrl);
    }
    
    if (!downloaded) {
        console.error('[Collection] Échec du téléchargement via proxy, wsrv.nl ET direct pour:', imageUrl);
        return false;
    }
    
    try {
        const { blob, filename, mimeType } = downloaded;
        
        // Créer un File object
        const file = new File([blob], filename, { type: mimeType });
        
        // Ajouter au MediaManager
        if (typeof mediaManager.addFile === 'function') {
            mediaManager.addFile(file);
            console.log('[Collection] Image importée depuis URL:', filename);
            return true;
        } else if (typeof mediaManager.addFromBlob === 'function') {
            mediaManager.addFromBlob(blob, filename);
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('[Collection] Erreur import image depuis URL:', error);
        return false;
    }
}

/**
 * Importe un document (PDF, manuel d'instructions) depuis une URL externe
 * @param {HTMLElement} modal - Élément modal
 * @param {string} documentUrl - URL du document à importer
 * @param {string} docType - Type de document ('instruction', 'manual', etc.)
 * @returns {Promise<boolean>} true si succès, false si échec
 */
export async function importDocumentFromUrl(modal, documentUrl, docType = 'document') {
    const mediaManagers = modal._mediaManagers;
    const mediaManager = mediaManagers?.documents;
    if (!mediaManager) {
        console.warn('[Collection] MediaManager documents non initialisé pour import');
        return false;
    }
    
    try {
        console.log('[Collection] Téléchargement du document:', documentUrl);
        
        const downloaded = await downloadViaProxy(documentUrl, 'document');
        
        if (!downloaded) {
            console.warn('[Collection] Échec du téléchargement du document:', documentUrl);
            return false;
        }
        
        // Mode streaming : le fichier est déjà sur le serveur, utiliser le token
        if (downloaded.isStreaming) {
            console.log('[Collection] Document volumineux - utilisation du mode streaming');
            
            // Utiliser addFromProxyToken si disponible, sinon fallback
            if (typeof mediaManager.addFromProxyToken === 'function') {
                await mediaManager.addFromProxyToken(downloaded.token, downloaded.filename, downloaded.mimeType, downloaded.size);
                console.log('[Collection] Document streaming importé:', downloaded.filename);
                return true;
            } else {
                // Fallback : télécharger le fichier (peut échouer pour les très gros fichiers)
                console.warn('[Collection] addFromProxyToken non disponible, téléchargement du blob...');
                const response = await fetch(`/api/proxy-download.php?token=${downloaded.token}`);
                if (!response.ok) {
                    throw new Error(`Erreur récupération: HTTP ${response.status}`);
                }
                const blob = await response.blob();
                const file = new File([blob], downloaded.filename, { type: downloaded.mimeType });
                if (typeof mediaManager.addFile === 'function') {
                    mediaManager.addFile(file);
                    return true;
                }
            }
            return false;
        }
        
        // Mode normal : on a un blob
        const { blob, filename, mimeType } = downloaded;
        
        // Créer un File object
        const file = new File([blob], filename, { type: mimeType });
        
        // Ajouter au MediaManager documents
        if (typeof mediaManager.addFile === 'function') {
            mediaManager.addFile(file);
            console.log('[Collection] Document importé depuis URL:', filename);
            return true;
        } else if (typeof mediaManager.addFromBlob === 'function') {
            mediaManager.addFromBlob(blob, filename);
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('[Collection] Erreur import document depuis URL:', error);
        return false;
    }
}

/**
 * Détecte les conflits d'import (champs non vides qui seront affectés)
 * @param {HTMLElement} modal - Élément modal
 * @param {Object} result - Résultat WebSearch à importer
 * @returns {Object} Conflits détectés avec infos pour chaque champ
 */
export function detectImportConflicts(modal, result) {
    const conflicts = {
        fields: [],      // Champs texte (nom, description, code-barres, métadonnées)
        media: []        // Médias (images, vidéos, audio, documents)
    };
    
    const fieldsToImport = result.fieldsToImport || {};
    const metadata = fieldsToImport.metadata || {};
    const t = getTranslations();
    
    // ========================================================================
    // CHAMPS TEXTE
    // ========================================================================
    
    // Vérifier le nom
    const itemNameInput = modal.querySelector('#itemName');
    if (fieldsToImport.name) {
        const currentValue = itemNameInput?.value.trim() || '';
        conflicts.fields.push({
            key: 'name',
            label: t.import_field_name || t.field_name || 'Nom',
            currentValue: currentValue,
            newValue: fieldsToImport.name,
            isEmpty: !currentValue,
            canAppend: false  // Le nom ne peut pas être concaténé
        });
    }
    
    // Vérifier la description
    const descriptionField = modal.querySelector('#itemDescription');
    if (fieldsToImport.description) {
        const currentValue = descriptionField?.value.trim() || '';
        conflicts.fields.push({
            key: 'description',
            label: t.import_field_description || t.field_description || 'Description',
            currentValue: currentValue,
            newValue: fieldsToImport.description,
            isEmpty: !currentValue,
            canAppend: true  // La description peut être concaténée
        });
    }
    
    // Vérifier le code-barres
    const barcodeField = modal.querySelector('#itemBarcode');
    const newBarcode = metadata.barcode || metadata.isbn || metadata.upc;
    if (newBarcode) {
        const currentValue = barcodeField?.value.trim() || '';
        conflicts.fields.push({
            key: 'barcode',
            label: t.import_field_barcode || t.field_barcode || 'Code-barres',
            currentValue: currentValue,
            newValue: newBarcode,
            isEmpty: !currentValue,
            canAppend: false
        });
    }
    
    // Vérifier la valeur marchande
    const marketValueField = modal.querySelector('#itemMarketValue');
    if (fieldsToImport.value) {
        const currentValue = marketValueField?.value.trim() || '';
        conflicts.fields.push({
            key: 'value',
            label: t.import_field_value || t.field_market_value || 'Valeur marchande',
            currentValue: currentValue,
            newValue: String(fieldsToImport.value),
            isEmpty: !currentValue,
            canAppend: false  // La valeur ne peut pas être concaténée
        });
    }
    
    // Vérifier les métadonnées dynamiques
    const container = modal.querySelector('#detailsFieldsContainer');
    if (container && Object.keys(metadata).length > 0) {
        Object.entries(metadata).forEach(([key, newValue]) => {
            // Ignorer les valeurs vides (null, undefined, string vide, tableau vide)
            if (newValue === null || newValue === undefined || newValue === '') return;
            if (Array.isArray(newValue) && newValue.length === 0) return;
            if (['barcode', 'isbn', 'upc'].includes(key)) return; // Déjà vérifié
            
            // Chercher le champ dans le formulaire
            let field = container.querySelector(`[data-field-key="${key}"]`);
            if (!field) {
                field = container.querySelector(`#metadata_${key}`);
            }
            
            if (field) {
                const input = field.querySelector('input, textarea, select');
                if (input) {
                    const label = field.querySelector('label')?.textContent || key;
                    const currentValue = input.value?.trim() || '';
                    const isTextarea = input.tagName === 'TEXTAREA';
                    
                    conflicts.fields.push({
                        key: key,
                        label: label,
                        currentValue: currentValue,
                        newValue: Array.isArray(newValue) ? newValue.join(', ') : String(newValue),
                        isEmpty: !currentValue,
                        canAppend: isTextarea  // Seuls les textarea peuvent être concaténés
                    });
                }
            }
        });
    }
    
    // ========================================================================
    // MÉDIAS
    // ========================================================================
    
    const mediaManagers = modal._mediaManagers || {};
    
    // Images
    const imageCount = result.importImages?.length || (result.importImage ? 1 : 0);
    if (imageCount > 0) {
        const existingImages = mediaManagers.images?.getFileCount?.() || 0;
        conflicts.media.push({
            key: 'images',
            label: t.import_field_images || 'Images',
            existingCount: existingImages,
            newCount: imageCount,
            isEmpty: existingImages === 0,
            canAppend: true
        });
    }
    
    // Vidéos
    if (result.importVideos?.length > 0) {
        const existingVideos = mediaManagers.videos?.getFileCount?.() || 0;
        conflicts.media.push({
            key: 'videos',
            label: t.import_field_videos || 'Vidéos',
            existingCount: existingVideos,
            newCount: result.importVideos.length,
            isEmpty: existingVideos === 0,
            canAppend: true
        });
    }
    
    // Audio
    if (result.importAudio?.length > 0) {
        const existingAudio = mediaManagers.audio?.getFileCount?.() || 0;
        conflicts.media.push({
            key: 'audio',
            label: t.import_field_audio || 'Audio',
            existingCount: existingAudio,
            newCount: result.importAudio.length,
            isEmpty: existingAudio === 0,
            canAppend: true
        });
    }
    
    // Documents / Instructions
    const docCount = (result.importDocuments?.length || 0) + (result.importInstructions?.length || 0);
    if (docCount > 0) {
        const existingDocs = mediaManagers.documents?.getFileCount?.() || 0;
        conflicts.media.push({
            key: 'documents',
            label: t.import_field_documents || 'Documents',
            existingCount: existingDocs,
            newCount: docCount,
            isEmpty: existingDocs === 0,
            canAppend: true
        });
    }
    
    return conflicts;
}

/**
 * Génère le HTML du modal de confirmation d'import avec toggles
 * @param {Object} conflicts - Conflits détectés
 * @returns {string} HTML du contenu du modal
 */
export function buildImportConfirmationHtml(conflicts) {
    const t = getTranslations();
    
    // Filtrer les conflits qui ont des valeurs existantes
    const nonEmptyFields = conflicts.fields.filter(f => !f.isEmpty);
    const nonEmptyMedia = conflicts.media.filter(m => !m.isEmpty);
    
    // Si aucun conflit, pas besoin de modal
    if (nonEmptyFields.length === 0 && nonEmptyMedia.length === 0) {
        return null;
    }
    
    let html = `<div class="import-confirmation">`;
    
    // Message d'introduction
    html += `<p class="import-intro">${t.import_conflict_intro || 'Certains champs contiennent déjà des données. Choisissez comment les traiter :'}</p>`;
    
    // ========================================================================
    // Section Champs texte
    // ========================================================================
    if (nonEmptyFields.length > 0) {
        html += `<div class="import-section">
            <h4 class="import-section-title">
                <i class="fas fa-font"></i> ${t.import_section_fields || 'Champs'}
            </h4>
            <div class="import-conflicts-list">`;
        
        for (const field of nonEmptyFields) {
            const canAppend = field.canAppend;
            
            html += `
            <div class="import-conflict-item" data-key="${field.key}" data-type="field">
                <div class="import-conflict-header">
                    <span class="import-conflict-label">${field.label}</span>
                </div>
                <div class="import-conflict-values">
                    <div class="import-value-current">
                        <span class="import-value-label">${t.import_current || 'Actuel'} :</span>
                        <span class="import-value-text">${truncate(field.currentValue, 50)}</span>
                    </div>
                    <div class="import-value-new">
                        <span class="import-value-label">${t.import_new || 'Nouveau'} :</span>
                        <span class="import-value-text">${truncate(field.newValue, 50)}</span>
                    </div>
                </div>
                <div class="import-conflict-actions">
                    <label class="import-toggle">
                        <input type="radio" name="import_${field.key}" value="skip" checked>
                        <span class="import-toggle-label">${t.import_action_skip || 'Ignorer'}</span>
                    </label>
                    <label class="import-toggle">
                        <input type="radio" name="import_${field.key}" value="replace">
                        <span class="import-toggle-label">${t.import_action_replace || 'Remplacer'}</span>
                    </label>
                    ${canAppend ? `
                    <label class="import-toggle">
                        <input type="radio" name="import_${field.key}" value="append">
                        <span class="import-toggle-label">${t.import_action_append || 'Ajouter'}</span>
                    </label>` : ''}
                </div>
            </div>`;
        }
        
        html += `</div></div>`;
    }
    
    // ========================================================================
    // Section Médias
    // ========================================================================
    if (nonEmptyMedia.length > 0) {
        html += `<div class="import-section">
            <h4 class="import-section-title">
                <i class="fas fa-photo-video"></i> ${t.import_section_media || 'Médias'}
            </h4>
            <div class="import-conflicts-list">`;
        
        for (const media of nonEmptyMedia) {
            html += `
            <div class="import-conflict-item" data-key="${media.key}" data-type="media">
                <div class="import-conflict-header">
                    <span class="import-conflict-label">${media.label}</span>
                    <span class="import-conflict-count">
                        ${media.existingCount} ${t.import_existing || 'existant(s)'} + ${media.newCount} ${t.import_to_add || 'à importer'}
                    </span>
                </div>
                <div class="import-conflict-actions">
                    <label class="import-toggle">
                        <input type="radio" name="import_${media.key}" value="skip" checked>
                        <span class="import-toggle-label">${t.import_action_skip || 'Ignorer'}</span>
                    </label>
                    <label class="import-toggle">
                        <input type="radio" name="import_${media.key}" value="replace">
                        <span class="import-toggle-label">${t.import_action_replace || 'Remplacer'}</span>
                    </label>
                    <label class="import-toggle">
                        <input type="radio" name="import_${media.key}" value="append">
                        <span class="import-toggle-label">${t.import_action_append || 'Ajouter'}</span>
                    </label>
                </div>
            </div>`;
        }
        
        html += `</div></div>`;
    }
    
    // Champs vides (info)
    const emptyFields = conflicts.fields.filter(f => f.isEmpty);
    const emptyMedia = conflicts.media.filter(m => m.isEmpty);
    if (emptyFields.length > 0 || emptyMedia.length > 0) {
        const emptyLabels = [...emptyFields.map(f => f.label), ...emptyMedia.map(m => m.label)];
        html += `<p class="import-info">
            <i class="fas fa-info-circle"></i> 
            ${t.import_will_fill || 'Seront automatiquement remplis'} : ${emptyLabels.join(', ')}
        </p>`;
    }
    
    html += `</div>`;
    
    return html;
}

/**
 * Récupère les choix de l'utilisateur depuis le modal de confirmation
 * @param {HTMLElement} modalContent - Contenu du modal
 * @returns {Object} Choix par clé {key: 'skip'|'replace'|'append'}
 */
export function getImportChoices(modalContent) {
    const choices = {};
    const radios = modalContent.querySelectorAll('input[type="radio"]:checked');
    
    radios.forEach(radio => {
        const name = radio.name.replace('import_', '');
        choices[name] = radio.value;
    });
    
    return choices;
}

/**
 * @deprecated Utilisez detectImportConflicts à la place
 * Détecte les champs qui contiennent déjà une valeur et qui vont être remplacés
 * @param {HTMLElement} modal - Élément modal
 * @param {Object} result - Résultat WebSearch à importer
 * @returns {Array<{key: string, label: string, oldValue: string, newValue: string}>}
 */
export function detectFieldsToReplace(modal, result) {
    const fieldsToReplace = [];
    const fieldsToImport = result.fieldsToImport || {};
    const metadata = fieldsToImport.metadata || {};
    const t = getTranslations();
    
    // Vérifier le nom
    const itemNameInput = modal.querySelector('#itemName');
    if (fieldsToImport.name && itemNameInput?.value.trim()) {
        fieldsToReplace.push({
            key: 'name',
            label: t.import_field_name || t.field_name || 'Nom',
            oldValue: truncate(itemNameInput.value, 30),
            newValue: truncate(fieldsToImport.name, 30)
        });
    }
    
    // Vérifier la description
    const descriptionField = modal.querySelector('#itemDescription');
    if (fieldsToImport.description && descriptionField?.value.trim()) {
        fieldsToReplace.push({
            key: 'description',
            label: t.import_field_description || t.field_description || 'Description',
            oldValue: truncate(descriptionField.value, 30),
            newValue: truncate(fieldsToImport.description, 30)
        });
    }
    
    // Vérifier le code-barres
    const barcodeField = modal.querySelector('#itemBarcode');
    const newBarcode = metadata.barcode || metadata.isbn || metadata.upc;
    if (newBarcode && barcodeField?.value.trim()) {
        fieldsToReplace.push({
            key: 'barcode',
            label: t.import_field_barcode || t.field_barcode || 'Code-barres',
            oldValue: truncate(barcodeField.value, 30),
            newValue: truncate(newBarcode, 30)
        });
    }
    
    // Vérifier les métadonnées (champs dynamiques)
    const container = modal.querySelector('#detailsFieldsContainer');
    if (container && Object.keys(metadata).length > 0) {
        Object.entries(metadata).forEach(([key, newValue]) => {
            if (newValue === null || newValue === undefined || newValue === '') return;
            if (['barcode', 'isbn', 'upc'].includes(key)) return; // Déjà vérifié
            
            // Chercher le champ dans le formulaire
            let field = container.querySelector(`[data-field-key="${key}"]`);
            if (!field) {
                field = container.querySelector(`#metadata_${key}`);
            }
            
            if (field) {
                const input = field.querySelector('input, textarea, select');
                if (input && input.value?.trim()) {
                    const label = field.querySelector('label')?.textContent || key;
                    fieldsToReplace.push({
                        key: key,
                        label: label,
                        oldValue: truncate(input.value, 30),
                        newValue: truncate(Array.isArray(newValue) ? newValue.join(', ') : String(newValue), 30)
                    });
                }
            }
        });
    }
    
    return fieldsToReplace;
}

/**
 * Applique l'import WebSearch après confirmation
 * @param {HTMLElement} modal - Élément modal
 * @param {Object} result - Résultat WebSearch à importer
 * @param {Function} applyImportedMetadata - Fonction pour appliquer les métadonnées
 * @param {Function} refreshStickerGrid - Fonction pour rafraîchir la grille de stickers
 * @param {Object} importChoices - Choix de l'utilisateur pour chaque champ en conflit
 */
export async function applyWebSearchImport(modal, result, applyImportedMetadata, refreshStickerGrid, importChoices = {}) {
    const fieldsToImport = result.fieldsToImport;
    const itemNameInput = modal.querySelector('#itemName');
    const t = getTranslations();
    
    // Helper pour déterminer l'action à effectuer
    const shouldImport = (key, isEmpty) => {
        // Si vide, toujours importer (remplacer)
        if (isEmpty) return 'replace';
        // Sinon, utiliser le choix de l'utilisateur (défaut: skip pour les conflits)
        return importChoices[key] || 'skip';
    };
    
    // Détecter les conflits pour savoir ce qui est vide ou non
    const conflicts = detectImportConflicts(modal, result);
    const fieldConflicts = {};
    const mediaConflicts = {};
    conflicts.fields.forEach(f => fieldConflicts[f.key] = f);
    conflicts.media.forEach(m => mediaConflicts[m.key] = m);
    
    // ========================================================================
    // CHAMPS TEXTE
    // ========================================================================
    
    // Remplir le nom
    if (fieldsToImport.name && itemNameInput) {
        const conflict = fieldConflicts['name'];
        const action = shouldImport('name', conflict?.isEmpty ?? true);
        
        if (action === 'replace') {
            itemNameInput.value = fieldsToImport.name;
        }
        // 'skip' ou 'append' non applicable pour le nom
    }
    
    // Remplir la description
    const descriptionField = modal.querySelector('#itemDescription');
    if (fieldsToImport.description && descriptionField) {
        const conflict = fieldConflicts['description'];
        const action = shouldImport('description', conflict?.isEmpty ?? true);
        
        if (action === 'replace') {
            descriptionField.value = fieldsToImport.description;
        } else if (action === 'append') {
            const separator = descriptionField.value.trim() ? '\n\n' : '';
            descriptionField.value = descriptionField.value + separator + fieldsToImport.description;
        }
        // 'skip' = ne rien faire
    }
    
    // Remplir le barcode
    const barcodeField = modal.querySelector('#itemBarcode');
    const barcode = fieldsToImport.code_barre ||
                   fieldsToImport.metadata?.barcode || 
                   fieldsToImport.metadata?.isbn ||
                   fieldsToImport.metadata?.upc;
    if (barcode && barcodeField) {
        const conflict = fieldConflicts['barcode'];
        const action = shouldImport('barcode', conflict?.isEmpty ?? true);
        
        if (action === 'replace') {
            barcodeField.value = barcode;
        }
    }
    
    // Remplir la valeur marchande (market_value)
    const marketValueField = modal.querySelector('#itemMarketValue');
    if (fieldsToImport.value && marketValueField) {
        const conflict = fieldConflicts['value'];
        const action = shouldImport('value', conflict?.isEmpty ?? true);
        
        if (action === 'replace') {
            // Nettoyer la valeur pour extraire uniquement le nombre
            // Gère les formats: "199,99 €", "€199.99", "199.99", "$19.99", etc.
            const cleanedValue = parseMonetaryValue(fieldsToImport.value);
            if (cleanedValue !== null) {
                marketValueField.value = cleanedValue;
                console.log('[Collection] Valeur marchande importée:', cleanedValue, '(original:', fieldsToImport.value, ')');
            } else {
                console.warn('[Collection] Impossible de parser la valeur marchande:', fieldsToImport.value);
            }
        }
    }
    
    // ========================================================================
    // MÉDIAS
    // ========================================================================
    
    const mediaManagers = modal._mediaManagers || {};
    
    // Importer les images
    let imagesImported = 0;
    let imagesAttempted = 0;
    let imageUrls = result.importImages?.length > 0 
        ? result.importImages 
        : (fieldsToImport.image_url && result.importImage ? [fieldsToImport.image_url] : []);
    
    // Dédupliquer les URLs d'images (inclut détection variantes Amazon)
    imageUrls = deduplicateImageUrls(imageUrls);
    
    if (imageUrls.length > 0) {
        const conflict = mediaConflicts['images'];
        const action = shouldImport('images', conflict?.isEmpty ?? true);
        
        if (action !== 'skip') {
            // Si remplacer, vider les images existantes d'abord
            if (action === 'replace' && mediaManagers.images?.clear) {
                await mediaManagers.images.clear();
            }
            
            imagesAttempted = imageUrls.length;
            for (const imageUrl of imageUrls) {
                const success = await importImageFromUrl(modal, imageUrl);
                if (success) imagesImported++;
            }
        }
    }
    
    // Afficher un message récapitulatif pour les images si certaines ont échoué
    if (imagesAttempted > 0 && imagesImported === 0) {
        console.warn('[Collection] Aucune image n\'a pu être importée (source protégée contre le hotlinking)');
        showToast(t.warning_images_protected || 'Images non importées (source protégée)', 'warning');
    } else if (imagesAttempted > 0 && imagesImported < imagesAttempted) {
        console.warn(`[Collection] ${imagesImported}/${imagesAttempted} images importées`);
        showToast(`${imagesImported}/${imagesAttempted} images importées`, 'info');
    }
    
    // Importer les vidéos
    if (result.importVideos?.length > 0) {
        const conflict = mediaConflicts['videos'];
        const action = shouldImport('videos', conflict?.isEmpty ?? true);
        
        if (action !== 'skip') {
            if (action === 'replace' && mediaManagers.videos?.clear) {
                await mediaManagers.videos.clear();
            }
            // TODO: implémenter importVideoFromUrl si nécessaire
        }
    }
    
    // Importer l'audio
    if (result.importAudio?.length > 0) {
        const conflict = mediaConflicts['audio'];
        const action = shouldImport('audio', conflict?.isEmpty ?? true);
        
        if (action !== 'skip') {
            if (action === 'replace' && mediaManagers.audio?.clear) {
                await mediaManagers.audio.clear();
            }
            // TODO: implémenter importAudioFromUrl si nécessaire
        }
    }
    
    // Importer les documents/instructions
    const allDocUrls = [...(result.importDocuments || []), ...(result.importInstructions || [])];
    if (allDocUrls.length > 0) {
        const conflict = mediaConflicts['documents'];
        const action = shouldImport('documents', conflict?.isEmpty ?? true);
        
        if (action !== 'skip') {
            if (action === 'replace' && mediaManagers.documents?.clear) {
                await mediaManagers.documents.clear();
            }
            
            let docsImported = 0;
            for (const docUrl of allDocUrls) {
                const success = await importDocumentFromUrl(modal, docUrl, 'instruction');
                if (success) docsImported++;
            }
            
            if (docsImported === 0 && allDocUrls.length > 0) {
                showToast(t.warning_docs_failed || 'Documents non importés', 'warning');
            } else if (docsImported < allDocUrls.length) {
                const msg = (t.warning_docs_partial || '{imported}/{total} document(s) importé(s)')
                    .replace('{imported}', docsImported)
                    .replace('{total}', allDocUrls.length);
                showToast(msg, 'info');
            }
        }
    }
    
    // ========================================================================
    // MÉTADONNÉES DYNAMIQUES
    // ========================================================================
    
    // Préparer les métadonnées à importer en tenant compte des choix
    if (fieldsToImport.metadata && Object.keys(fieldsToImport.metadata).length > 0) {
        const filteredMetadata = {};
        
        for (const [key, value] of Object.entries(fieldsToImport.metadata)) {
            // Note: On ne filtre plus 'isbn', 'upc' etc. car ils doivent apparaître
            // dans les métadonnées type-specific (onglet Détails) en plus du champ barcode
            // Seul 'barcode' est ignoré car il n'existe pas comme champ de métadonnées
            if (key === 'barcode') continue;
            
            const conflict = fieldConflicts[key];
            const action = shouldImport(key, conflict?.isEmpty ?? true);
            
            if (action === 'replace') {
                filteredMetadata[key] = value;
            } else if (action === 'append' && conflict && !conflict.isEmpty) {
                // Concaténer les valeurs (pour les champs texte)
                filteredMetadata[key] = conflict.currentValue + '\n\n' + value;
            }
            // 'skip' = ne pas inclure dans filteredMetadata
        }
        
        if (Object.keys(filteredMetadata).length > 0) {
            modal._pendingImportMetadata = filteredMetadata;
            
            // Conserver la checklist brute pour régénérer la grille
            if (filteredMetadata.checklist) {
                modal._lastImportedChecklist = filteredMetadata.checklist;
            }
            
            // Attendre que les champs de métadonnées soient chargés
            const checkAndApply = (attempts = 0) => {
                const container = modal.querySelector('#detailsFieldsContainer');
                const hasFields = container && container.children.length > 0;
                
                if (hasFields) {
                    applyImportedMetadata(modal, modal._pendingImportMetadata);
                    // Après avoir appliqué les valeurs, rafraîchir la grille de stickers
                    if (refreshStickerGrid) {
                        setTimeout(() => refreshStickerGrid(modal), 100);
                    }
                    delete modal._pendingImportMetadata;
                } else if (attempts < 10) {
                    setTimeout(() => checkAndApply(attempts + 1), 200);
                } else {
                    console.warn('[Collection] Timeout: champs de métadonnées non chargés');
                }
            };
            
            setTimeout(() => checkAndApply(0), 300);
        }
    }
    
    // ========================================================================
    // MISE À JOUR DES COMPTEURS D'ONGLETS
    // ========================================================================
    
    // Mettre à jour le compteur total des médias
    updateMediaTabCount(modal);
    
    // Mettre à jour le compteur de métadonnées (après délai pour s'assurer que les champs sont remplis)
    setTimeout(() => updateMetadataTabCount(modal), 500);
}

/**
 * Met à jour le compteur de l'onglet Médias
 * @param {HTMLElement} modal - Élément modal
 */
export function updateMediaTabCount(modal) {
    const mediaManagers = modal._mediaManagers || {};
    let total = 0;
    
    // Compter les fichiers de chaque type
    for (const type of ['images', 'videos', 'audio', 'documents']) {
        const manager = mediaManagers[type];
        if (manager && typeof manager.getFileCount === 'function') {
            total += manager.getFileCount();
        }
    }
    
    // Mettre à jour le compteur dans l'onglet
    const countEl = modal.querySelector('#itemTotalMediaCount');
    if (countEl) {
        countEl.textContent = total;
    }
}

/**
 * Met à jour le compteur de l'onglet Détails (métadonnées)
 * @param {HTMLElement} modal - Élément modal
 */
export function updateMetadataTabCount(modal) {
    const container = modal.querySelector('#detailsFieldsContainer');
    if (!container) return;
    
    // Compter les champs qui ont une valeur non-vide
    let count = 0;
    const fields = container.querySelectorAll('[data-field-key]');
    
    fields.forEach(field => {
        const input = field.querySelector('input, textarea, select');
        if (input) {
            const value = input.value?.trim();
            if (value && value !== '' && value !== '0') {
                count++;
            }
        }
    });
    
    const countEl = modal.querySelector('#itemMetadataCount');
    if (countEl) {
        countEl.textContent = count;
    }
}

/**
 * Normalise les valeurs API vers les valeurs attendues par les champs de formulaire
 * @param {string} fieldKey - Clé du champ
 * @param {*} value - Valeur à normaliser
 * @returns {*} Valeur normalisée
 */
export function normalizeFieldValue(fieldKey, value) {
    if (value === null || value === undefined) return value;
    
    // Ne pas normaliser les tableaux (tracklist, etc.) - les retourner tels quels
    if (Array.isArray(value)) {
        return value;
    }
    
    // Ne pas normaliser les objets complexes
    if (typeof value === 'object' && value !== null) {
        return value;
    }
    
    const strValue = String(value).trim();
    
    // Normalisation des classifications d'âge (PEGI, ESRB, etc.)
    if (fieldKey === 'pegi' || fieldKey === 'age_rating' || fieldKey === 'min_age') {
        // Essayer d'extraire un nombre d'âge
        const ageMatch = strValue.match(/(\d+)/);
        if (ageMatch) {
            const age = parseInt(ageMatch[1]);
            // Mapper vers les valeurs PEGI standard (avec préfixe "PEGI ")
            if (age <= 3) return 'PEGI 3';
            if (age <= 7) return 'PEGI 7';
            if (age <= 12) return 'PEGI 12';
            if (age <= 16) return 'PEGI 16';
            return 'PEGI 18';
        }
        // Mappings ESRB -> PEGI approximatif
        const esrbToPegi = {
            'everyone': 'PEGI 3',
            'everyone 10+': 'PEGI 12',
            'e10+': 'PEGI 12',
            'teen': 'PEGI 12',
            't': 'PEGI 12',
            'mature': 'PEGI 16',
            'm': 'PEGI 16',
            'mature 17+': 'PEGI 18',
            'adults only': 'PEGI 18',
            'ao': 'PEGI 18',
        };
        const lowerValue = strValue.toLowerCase();
        if (esrbToPegi[lowerValue]) {
            return esrbToPegi[lowerValue];
        }
    }
    
    // Normalisation des booléens (multiplayer, etc.)
    if (fieldKey === 'multiplayer' || fieldKey === 'is_multiplayer') {
        const lowerValue = strValue.toLowerCase();
        if (lowerValue === 'oui' || lowerValue === 'yes' || lowerValue === 'true' || lowerValue === '1') {
            return 'Oui';
        }
        if (lowerValue === 'non' || lowerValue === 'no' || lowerValue === 'false' || lowerValue === '0') {
            return 'Non';
        }
    }
    
    // Normalisation du statut des séries (anglais -> français)
    if (fieldKey === 'status') {
        const statusMapping = {
            'ended': 'Terminée',
            'canceled': 'Annulée',
            'cancelled': 'Annulée',
            'continuing': 'En cours',
            'running': 'En cours',
            'returning series': 'En cours',
            'in production': 'En cours',
            'planned': 'En cours',
            'pilot': 'En cours',
        };
        const lowerValue = strValue.toLowerCase();
        if (statusMapping[lowerValue]) {
            return statusMapping[lowerValue];
        }
    }
    
    return value;
}
