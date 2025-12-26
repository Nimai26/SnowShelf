/**
 * SnowShelf - Admin Utilities
 * Fonctions utilitaires partagées entre les modules admin
 */

/**
 * Échappe les caractères HTML
 * @param {string} text - Texte à échapper
 * @returns {string} - Texte échappé
 */
export function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Formate une date pour l'affichage
 * @param {string} dateString - Date au format ISO
 * @returns {string} - Date formatée
 */
export function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

/**
 * Normalise une icône MDI pour le format CSS
 * Supporte: "mdi:icon-name", "mdi-icon-name", "icon-name"
 * @param {string} icon - L'icône à normaliser
 * @returns {string} - La classe CSS MDI (ex: "mdi-folder")
 */
export function normalizeMdiIcon(icon) {
    if (!icon) return 'mdi-folder';
    
    // Si c'est un émoji (ne commence pas par 'mdi' et ne contient pas ':'), retourner null
    if (!icon.startsWith('mdi') && !icon.includes(':')) {
        return null;
    }
    
    // Format Iconify "mdi:icon-name" -> "mdi-icon-name"
    if (icon.includes(':')) {
        icon = icon.replace(':', '-');
    }
    
    // S'assurer que ça commence par "mdi-"
    if (!icon.startsWith('mdi-')) {
        icon = 'mdi-' + icon;
    }
    
    return icon;
}

/**
 * Rend une icône (émoji ou MDI) en HTML
 * @param {string} icon - L'icône (émoji ou format mdi:xxx / mdi-xxx)
 * @param {string|number} classNameOrSize - Classe CSS optionnelle ou taille
 * @param {string} color - Couleur optionnelle
 * @returns {string} - HTML de l'icône
 */
export function renderIcon(icon, classNameOrSize = '', color = '') {
    if (!icon) return '<span class="">📋</span>';
    
    // Déterminer si le 2ème paramètre est une classe ou une taille
    let className = '';
    let style = '';
    
    if (typeof classNameOrSize === 'number') {
        style = `font-size: ${classNameOrSize}px;`;
    } else if (typeof classNameOrSize === 'string') {
        className = classNameOrSize;
    }
    
    if (color) {
        style += ` color: ${color};`;
    }
    
    const styleAttr = style ? ` style="${style.trim()}"` : '';
    
    // Vérifier si c'est une icône MDI (commence par "mdi" ou contient ":")
    if (icon.startsWith('mdi') || icon.includes(':')) {
        const mdiClass = normalizeMdiIcon(icon);
        return `<i class="mdi ${mdiClass} ${className}"${styleAttr}></i>`;
    }
    
    // C'est un émoji
    return `<span class="${className}"${styleAttr}>${icon}</span>`;
}

/**
 * Affiche un toast de notification
 * @param {string} message - Message à afficher
 * @param {string} type - Type: 'success', 'error', 'warning', 'info'
 */
export function showToast(message, type = 'info') {
    // Utiliser la fonction globale si disponible
    if (typeof window.showToast === 'function') {
        window.showToast(message, type);
        return;
    }
    
    const container = document.getElementById('toastContainer');
    if (!container) {
        console.warn('[Admin] Toast container not found, message:', message);
        return;
    }

    const icons = {
        success: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
        error: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
        warning: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
        info: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${icons[type] || icons.info}</span>
        <span class="toast-message">${escapeHtml(message)}</span>
        <button class="toast-close">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
    `;

    toast.querySelector('.toast-close').addEventListener('click', () => removeToast(toast));
    container.appendChild(toast);
    setTimeout(() => removeToast(toast), 5000);
}

/**
 * Supprime un toast avec animation
 * @param {HTMLElement} toast - Élément toast à supprimer
 */
export function removeToast(toast) {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
}

/**
 * Affiche ou masque l'indicateur de chargement
 * @param {boolean} show - true pour afficher, false pour masquer
 * @param {string} loadingId - ID de l'élément de chargement
 */
export function showLoading(show, loadingId = 'settingsLoading') {
    const loadingEl = document.getElementById(loadingId);
    if (loadingEl) {
        loadingEl.classList.toggle('active', show);
    }
}

/**
 * Marque l'élément de navigation actif dans la sidebar
 */
export function markActiveNavItem() {
    const urlParams = new URLSearchParams(window.location.search);
    const currentSection = urlParams.get('section') || 'users';
    
    // Retirer toutes les classes active
    document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Ajouter la classe active à l'élément correspondant
    const activeLink = document.querySelector(`.sidebar-nav .nav-link[href="?section=${currentSection}"]`);
    if (activeLink) {
        activeLink.closest('.nav-item').classList.add('active');
    }
}
