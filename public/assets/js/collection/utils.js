/**
 * SnowShelf - Collection Module
 * utils.js - Fonctions utilitaires
 */

/**
 * Échappe les caractères HTML pour éviter les injections XSS
 * @param {string} text - Texte à échapper
 * @returns {string} Texte échappé
 */
export function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Formate un nombre en devise
 * @param {number} value - Valeur à formater
 * @param {string} currency - Code devise (EUR par défaut)
 * @returns {string} Valeur formatée
 */
export function formatCurrency(value, currency = 'EUR') {
    return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
    }).format(value);
}

/**
 * Formate une date ISO en format français
 * @param {string} dateStr - Date au format ISO
 * @returns {string} Date formatée
 */
export function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

/**
 * Rend une icône MDI en HTML
 * Supporte: "mdi:icon-name", "mdi-icon-name", emojis, texte simple
 * @param {string} icon - L'icône à rendre
 * @returns {string} Le HTML de l'icône
 */
export function renderMdiIcon(icon) {
    if (!icon) return '';
    
    // Si c'est un emoji ou caractère unicode, retourner tel quel
    if (/^[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(icon)) {
        return icon;
    }
    
    // Si c'est au format MDI (mdi: ou mdi-)
    if (icon.startsWith('mdi:') || icon.startsWith('mdi-')) {
        // Normaliser: "mdi:icon-name" -> "mdi-icon-name"
        let mdiClass = icon.replace(':', '-');
        // S'assurer que ça commence par "mdi-"
        if (!mdiClass.startsWith('mdi-')) {
            mdiClass = 'mdi-' + mdiClass;
        }
        return `<span class="mdi ${mdiClass}"></span>`;
    }
    
    // Sinon retourner tel quel (texte simple)
    return icon;
}

/**
 * Debounce une fonction
 * @param {Function} func - Fonction à debouncer
 * @param {number} wait - Délai en ms
 * @returns {Function} Fonction debouncée
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Tronque un texte à une longueur maximale
 * @param {string} text - Texte à tronquer
 * @param {number} maxLength - Longueur maximale
 * @returns {string} Texte tronqué
 */
export function truncate(text, maxLength = 50) {
    if (!text) return '';
    const str = String(text);
    return str.length > maxLength ? str.substring(0, maxLength) + '...' : str;
}

/**
 * Vérifie si une valeur est vide (null, undefined, chaîne vide)
 * @param {*} value - Valeur à vérifier
 * @returns {boolean} True si vide
 */
export function isEmpty(value) {
    return value === null || value === undefined || value === '';
}

/**
 * Clone profondément un objet
 * @param {Object} obj - Objet à cloner
 * @returns {Object} Clone de l'objet
 */
export function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Obtient la langue courante de l'interface
 * @returns {string} Code langue (fr, en, etc.)
 */
export function getCurrentLang() {
    return document.documentElement.lang || 'fr';
}

/**
 * Parse un nom multi-langue (JSON ou string) et retourne la valeur dans la langue courante
 * @param {string|object} name - Nom au format JSON {"fr":"...", "en":"..."} ou string simple
 * @param {string} fallbackLang - Langue de fallback si la courante n'existe pas
 * @returns {string} Nom dans la langue appropriée
 */
export function parseLocalizedName(name, fallbackLang = 'en') {
    if (!name) return '';
    
    // Si c'est déjà un string simple (pas JSON), le retourner
    if (typeof name === 'string') {
        // Vérifier si c'est du JSON
        if (!name.startsWith('{')) {
            return name;
        }
        
        try {
            name = JSON.parse(name);
        } catch (e) {
            // Pas du JSON valide, retourner tel quel
            return name;
        }
    }
    
    // C'est un objet avec les traductions
    if (typeof name === 'object') {
        const lang = getCurrentLang();
        // Essayer la langue courante
        if (name[lang]) return name[lang];
        // Fallback sur la langue par défaut
        if (name[fallbackLang]) return name[fallbackLang];
        // Fallback sur la première valeur disponible
        const firstKey = Object.keys(name)[0];
        if (firstKey) return name[firstKey];
    }
    
    return String(name);
}
