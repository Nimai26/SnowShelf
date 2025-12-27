/**
 * SnowShelf - Web Search Module
 * Utilitaires de manipulation de données
 */

/**
 * Permet de trouver une valeur dans un objet à partir d'un chemin (ex: "metadata.price")
 * @param {Object} obj - Objet source
 * @param {string} path - Chemin vers la valeur (ex: "metadata.price")
 * @returns {*} - Valeur trouvée ou null
 */
export function getValueFromPath(obj, path) {
    if (!obj || !path) return null;
    const parts = path.split('.');
    let value = obj;
    for (const part of parts) {
        if (value === null || value === undefined) return null;
        value = value[part];
    }
    // Retourner null si la valeur est un objet complexe (sauf string)
    // EXCEPTION: les objets checklist avec {raw, total, items} doivent être conservés
    // EXCEPTION: les objets special_stickers (ont des sous-objets avec raw/items)
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        // Garder les objets checklist (ont une propriété 'raw' ou 'items')
        if (value.raw !== undefined || value.items !== undefined) {
            return value;
        }
        // Garder les objets special_stickers (clés sont les types de stickers spéciaux)
        const keys = Object.keys(value);
        if (keys.length > 0 && keys.some(k => {
            const sub = value[k];
            return sub && typeof sub === 'object' && (sub.raw !== undefined || sub.items !== undefined);
        })) {
            return value;
        }
        return null;
    }
    return value;
}

/**
 * Cherche une valeur dans les sources possibles
 * Essaie automatiquement les chemins avec et sans préfixe 'data.' pour plus de flexibilité
 * @param {Object} result - Objet contenant les données
 * @param {string[]} sources - Liste des chemins à tester
 * @returns {*} - Première valeur trouvée ou null
 */
export function findValueFromSources(result, sources) {
    if (!sources || !Array.isArray(sources)) return null;
    
    // Étendre les sources pour inclure les variantes avec/sans préfixe 'data.'
    const expandedSources = [];
    for (const source of sources) {
        expandedSources.push(source);
        // Si le chemin commence par 'data.', ajouter aussi la version sans préfixe
        if (source.startsWith('data.')) {
            expandedSources.push(source.substring(5)); // Enlever 'data.'
        }
        // Si le chemin ne commence pas par 'data.', ajouter aussi la version avec préfixe
        else if (!source.includes('.') || !source.startsWith('data')) {
            expandedSources.push('data.' + source);
        }
    }
    
    for (const source of expandedSources) {
        const value = getValueFromPath(result, source);
        if (value !== null && value !== undefined && value !== '') {
            // Si c'est un array, traiter chaque élément
            if (Array.isArray(value)) {
                const stringValues = value.map(item => {
                    // Si l'élément est un objet avec une propriété 'name', l'extraire
                    if (item && typeof item === 'object' && item.name) {
                        return item.name;
                    }
                    // Si l'élément est un objet avec une propriété 'label', l'extraire
                    if (item && typeof item === 'object' && item.label) {
                        return item.label;
                    }
                    // Si c'est une string ou autre primitive, la garder
                    if (typeof item === 'string' || typeof item === 'number') {
                        return String(item);
                    }
                    // Sinon ignorer (objets complexes sans name/label)
                    return null;
                }).filter(v => v !== null && v !== '');
                
                return stringValues.length > 0 ? stringValues.join(', ') : null;
            }
            return value;
        }
    }
    return null;
}

/**
 * Normalise une valeur de date en format ISO (YYYY-MM-DD)
 * Gère les formats: YYYY-MM-DD, YYYY/MM/DD, DD-MM-YYYY, DD/MM/YYYY, YYYYMMDD, YYYY, etc.
 * @param {string|number} value - Valeur à normaliser
 * @returns {string|null} - Date au format YYYY-MM-DD ou null
 */
export function normalizeDate(value) {
    if (!value) return null;
    
    const strValue = String(value).trim();
    
    // Déjà au format ISO YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(strValue)) {
        return strValue;
    }
    
    // Format YYYY/MM/DD
    if (/^\d{4}\/\d{2}\/\d{2}$/.test(strValue)) {
        return strValue.replace(/\//g, '-');
    }
    
    // Format YYYYMMDD (sans séparateurs)
    if (/^\d{8}$/.test(strValue)) {
        return `${strValue.slice(0, 4)}-${strValue.slice(4, 6)}-${strValue.slice(6, 8)}`;
    }
    
    // Format DD-MM-YYYY ou DD/MM/YYYY
    const dmyMatch = strValue.match(/^(\d{2})[-\/](\d{2})[-\/](\d{4})$/);
    if (dmyMatch) {
        return `${dmyMatch[3]}-${dmyMatch[2]}-${dmyMatch[1]}`;
    }
    
    // Année seule (YYYY) -> premier janvier de cette année
    if (/^\d{4}$/.test(strValue)) {
        return `${strValue}-01-01`;
    }
    
    // Format avec mois en texte
    const monthNames = {
        'january': '01', 'jan': '01',
        'february': '02', 'feb': '02',
        'march': '03', 'mar': '03',
        'april': '04', 'apr': '04',
        'may': '05',
        'june': '06', 'jun': '06',
        'july': '07', 'jul': '07',
        'august': '08', 'aug': '08',
        'september': '09', 'sep': '09', 'sept': '09',
        'october': '10', 'oct': '10',
        'november': '11', 'nov': '11',
        'december': '12', 'dec': '12',
        // Français
        'janvier': '01', 'janv': '01',
        'février': '02', 'févr': '02', 'fevrier': '02',
        'mars': '03',
        'avril': '04', 'avr': '04',
        'mai': '05',
        'juin': '06',
        'juillet': '07', 'juil': '07',
        'août': '08', 'aout': '08',
        'septembre': '09',
        'octobre': '10',
        'novembre': '11',
        'décembre': '12', 'decembre': '12'
    };
    
    // "Month DD, YYYY" ou "DD Month YYYY"
    const textDateMatch = strValue.toLowerCase().match(/(\d{1,2})?\s*([a-zéûà]+)\s*(\d{1,2})?,?\s*(\d{4})/);
    if (textDateMatch) {
        const month = monthNames[textDateMatch[2]];
        if (month) {
            const day = (textDateMatch[1] || textDateMatch[3] || '01').padStart(2, '0');
            return `${textDateMatch[4]}-${month}-${day}`;
        }
    }
    
    // Essayer de parser avec Date natif en dernier recours
    try {
        const date = new Date(strValue);
        if (!isNaN(date.getTime())) {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            if (year >= 1800 && year <= 2100) {
                return `${year}-${month}-${day}`;
            }
        }
    } catch (e) {
        // Ignorer les erreurs de parsing
    }
    
    return null;
}

/**
 * Extrait l'année d'une valeur de date
 * @param {string|number} value - Valeur contenant une date ou une année
 * @returns {number|null} - Année en nombre ou null
 */
export function extractYear(value) {
    if (!value) return null;
    
    const strValue = String(value).trim();
    
    // Année seule (4 chiffres)
    if (/^\d{4}$/.test(strValue)) {
        return parseInt(strValue, 10);
    }
    
    // Essayer de normaliser la date d'abord
    const normalizedDate = normalizeDate(strValue);
    if (normalizedDate) {
        const year = parseInt(normalizedDate.slice(0, 4), 10);
        if (year >= 1800 && year <= 2100) {
            return year;
        }
    }
    
    // Chercher 4 chiffres consécutifs qui ressemblent à une année
    const yearMatch = strValue.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) {
        return parseInt(yearMatch[0], 10);
    }
    
    return null;
}
