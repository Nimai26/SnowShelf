/**
 * SnowShelf - Collection Module
 * ui/feedback.js - États UI, toasts, loading, scroll
 */

import { state, elements, getTranslations } from '../state.js';

/**
 * Affiche l'indicateur de chargement principal
 */
export function showLoading() {
    if (!elements.collectionLoading) return;
    elements.collectionLoading.style.display = 'flex';
    elements.collectionEmpty.style.display = 'none';
    elements.collectionNoResults.style.display = 'none';
    elements.itemsGrid.style.display = 'none';
    elements.itemsList.style.display = 'none';
}

/**
 * Masque l'indicateur de chargement principal
 */
export function hideLoading() {
    if (!elements.collectionLoading) return;
    elements.collectionLoading.style.display = 'none';
}

/**
 * Affiche l'état "collection vide"
 */
export function showEmpty() {
    if (!elements.collectionEmpty) return;
    elements.collectionEmpty.style.display = 'flex';
    elements.collectionNoResults.style.display = 'none';
    elements.itemsGrid.style.display = 'none';
    elements.itemsList.style.display = 'none';
}

/**
 * Affiche l'état "aucun résultat"
 */
export function showNoResults() {
    if (!elements.collectionNoResults) return;
    elements.collectionNoResults.style.display = 'flex';
    elements.collectionEmpty.style.display = 'none';
    elements.itemsGrid.style.display = 'none';
    elements.itemsList.style.display = 'none';
}

/**
 * Masque tous les états et affiche la vue appropriée
 */
export function hideAllStates() {
    if (elements.collectionEmpty) elements.collectionEmpty.style.display = 'none';
    if (elements.collectionNoResults) elements.collectionNoResults.style.display = 'none';
    
    if (state.viewMode === 'grid') {
        if (elements.itemsGrid) elements.itemsGrid.style.display = 'grid';
        if (elements.itemsList) elements.itemsList.style.display = 'none';
    } else {
        if (elements.itemsGrid) elements.itemsGrid.style.display = 'none';
        if (elements.itemsList) elements.itemsList.style.display = 'flex';
    }
}

/**
 * Affiche l'indicateur de chargement "plus d'items"
 */
export function showLoadMoreIndicator() {
    if (!elements.scrollSentinel) return;
    
    if (!document.querySelector('.load-more-indicator')) {
        const t = getTranslations();
        const indicator = document.createElement('div');
        indicator.className = 'load-more-indicator';
        indicator.innerHTML = `
            <div class="loading-spinner"></div>
            <span>${t.loading || 'Chargement...'}</span>
        `;
        elements.scrollSentinel.parentNode.insertBefore(indicator, elements.scrollSentinel);
    }
}

/**
 * Masque l'indicateur de chargement "plus d'items"
 */
export function hideLoadMoreIndicator() {
    document.querySelector('.load-more-indicator')?.remove();
}

/**
 * Affiche un toast de notification
 * @param {string} message - Message à afficher
 * @param {string} type - Type de toast (info, success, error, warning)
 */
export function showToast(message, type = 'info') {
    // Utiliser le toast global si disponible
    if (typeof window.showToast === 'function') {
        window.showToast(message, type);
        return;
    }
    
    // Fallback : créer un toast simple
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-size: 14px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        background: ${type === 'success' ? 'var(--success-color, #22c55e)' : 
                     type === 'error' ? 'var(--error-color, #ef4444)' : 
                     type === 'warning' ? 'var(--warning-color, #f59e0b)' : 
                     'var(--info-color, #3b82f6)'};
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

/**
 * Affiche un toast d'erreur
 * @param {string} message - Message d'erreur
 */
export function showError(message) {
    showToast(message, 'error');
}

/**
 * Gère le scroll de la page (toolbar sticky, bouton retour en haut)
 */
export function handleScroll() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    
    // Toolbar sticky shadow
    elements.collectionToolbar?.classList.toggle('scrolled', scrollTop > 50);
    
    // Bouton retour en haut
    elements.btnScrollTop?.classList.toggle('show', scrollTop > 400);
}

/**
 * Scroll vers le haut de la page
 */
export function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}
