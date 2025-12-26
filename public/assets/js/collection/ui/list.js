/**
 * SnowShelf - Collection Module
 * ui/list.js - Rendu de la liste d'items (grille et liste)
 */

import { CONFIG, state, elements, getTranslations } from '../state.js';
import { escapeHtml, formatCurrency } from '../utils.js';

// Observer pour le lazy loading des images
let imageObserver = null;

/**
 * Met à jour l'interface utilisateur après chargement des items
 * @param {Function} hasActiveFilters - Fonction pour vérifier si des filtres sont actifs
 * @param {Function} updateActiveFiltersUI - Fonction pour mettre à jour l'UI des filtres
 */
export function updateUI(hasActiveFilters, updateActiveFiltersUI) {
    // Compteur
    if (elements.collectionCount) {
        elements.collectionCount.textContent = state.totalItems;
    }
    
    // Déterminer quel état afficher
    const hasFiltersOrSearch = state.search || hasActiveFilters();
    
    if (state.items.length === 0) {
        if (hasFiltersOrSearch) {
            // Pas de résultats avec filtres
            import('./feedback.js').then(({ showNoResults }) => showNoResults());
        } else {
            // Collection vide
            import('./feedback.js').then(({ showEmpty }) => showEmpty());
        }
    } else {
        import('./feedback.js').then(({ hideAllStates }) => {
            hideAllStates();
            renderItems();
        });
    }
    
    // Mise à jour filtres actifs
    if (updateActiveFiltersUI) {
        updateActiveFiltersUI();
    }
}

/**
 * Rend les items dans la vue appropriée (grille ou liste)
 */
export function renderItems() {
    const container = state.viewMode === 'grid' ? elements.itemsGrid : elements.itemsList;
    if (!container) return;
    
    // En mode append, ne pas vider le container
    if (state.page === 1) {
        container.innerHTML = '';
    }
    
    // Calculer l'index de départ pour le stagger
    const startIndex = state.page === 1 ? 0 : (state.page - 1) * CONFIG.ITEMS_PER_PAGE;
    
    // Créer les éléments pour les nouveaux items seulement
    const newItems = state.page === 1 ? state.items : state.items.slice(startIndex);
    
    const fragment = document.createDocumentFragment();
    
    newItems.forEach((item, index) => {
        const element = state.viewMode === 'grid' 
            ? createItemCard(item, startIndex + index) 
            : createItemRow(item, startIndex + index);
        fragment.appendChild(element);
    });
    
    container.appendChild(fragment);
    
    // Observer les images pour lazy loading
    observeImages();
}

/**
 * Crée une carte d'item pour la vue grille
 * @param {Object} item - Données de l'item
 * @param {number} index - Index pour l'animation
 * @returns {HTMLElement} Élément carte
 */
export function createItemCard(item, index) {
    const t = getTranslations();
    const card = document.createElement('div');
    card.className = 'item-card';
    card.dataset.itemId = item.id;
    card.style.animationDelay = `${(index % 20) * 0.03}s`;
    
    const thumbnailHtml = item.thumbnail_url
        ? `<img class="lazy-image" data-src="${escapeHtml(item.thumbnail_url)}" alt="${escapeHtml(item.name)}">`
        : `<div class="no-image">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
            <span>${t.no_image || 'Pas d\'image'}</span>
           </div>`;
    
    const ratingHtml = item.rating
        ? `<div class="item-rating-badge">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            ${item.rating.toFixed(1)}
           </div>`
        : '';
    
    const categoriesHtml = item.categories?.slice(0, 2).map(cat => 
        `<span class="item-category-tag">${escapeHtml(cat.name)}</span>`
    ).join('') || '';
    
    const valueHtml = item.market_value
        ? `<div class="item-card-value"><strong>${formatCurrency(item.market_value)}</strong></div>`
        : '';
    
    card.innerHTML = `
        <div class="item-card-thumbnail">
            ${thumbnailHtml}
            ${ratingHtml}
            <button class="item-edit-btn" title="${t.edit || 'Modifier'}">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
            </button>
        </div>
        <div class="item-card-info">
            <h3 class="item-card-name" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</h3>
            <div class="item-card-categories">${categoriesHtml}</div>
            ${valueHtml}
        </div>
    `;
    
    return card;
}

/**
 * Crée une ligne d'item pour la vue liste
 * @param {Object} item - Données de l'item
 * @param {number} index - Index pour l'animation
 * @returns {HTMLElement} Élément ligne
 */
export function createItemRow(item, index) {
    const t = getTranslations();
    const row = document.createElement('div');
    row.className = 'item-row';
    row.dataset.itemId = item.id;
    row.style.animationDelay = `${(index % 20) * 0.02}s`;
    
    const thumbnailHtml = item.thumbnail_url
        ? `<img class="lazy-image" data-src="${escapeHtml(item.thumbnail_url)}" alt="${escapeHtml(item.name)}">`
        : `<div class="no-image">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
           </div>`;
    
    const ratingHtml = item.rating
        ? `<span class="item-row-rating">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            ${item.rating.toFixed(1)}
           </span>`
        : '';
    
    const valueHtml = item.market_value
        ? `<span class="item-row-value">${formatCurrency(item.market_value)}</span>`
        : '';
    
    const categoriesHtml = item.categories?.slice(0, 3).map(cat => 
        `<span class="item-category-tag">${escapeHtml(cat.name)}</span>`
    ).join('') || '';
    
    row.innerHTML = `
        <div class="item-row-thumbnail">${thumbnailHtml}</div>
        <div class="item-row-info">
            <h3 class="item-row-name" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</h3>
            <div class="item-row-meta">
                ${ratingHtml}
                ${valueHtml}
            </div>
        </div>
        <div class="item-row-categories">${categoriesHtml}</div>
        <button class="item-edit-btn" title="${t.edit || 'Modifier'}">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
        </button>
    `;
    
    return row;
}

/**
 * Attache les événements de clic aux items
 * @param {Function} openItemModal - Fonction pour ouvrir la modal d'un item
 */
export function attachItemClickEvents(openItemModal) {
    const containers = [elements.itemsGrid, elements.itemsList].filter(Boolean);
    
    containers.forEach(container => {
        container.addEventListener('click', (e) => {
            const card = e.target.closest('.item-card, .item-row');
            if (!card) return;
            
            const itemId = card.dataset.itemId;
            if (!itemId) return;
            
            // Clic sur bouton édition
            if (e.target.closest('.item-edit-btn')) {
                e.stopPropagation();
                openItemModal(parseInt(itemId), true); // true = mode édition
                return;
            }
            
            // Clic sur la carte/ligne
            openItemModal(parseInt(itemId));
        });
    });
}

/**
 * Change le mode de vue (grille ou liste)
 * @param {string} mode - 'grid' ou 'list'
 */
export function setViewMode(mode) {
    state.viewMode = mode;
    localStorage.setItem('collectionViewMode', mode);
    
    if (elements.viewGrid) {
        elements.viewGrid.classList.toggle('active', mode === 'grid');
    }
    if (elements.viewList) {
        elements.viewList.classList.toggle('active', mode === 'list');
    }
    
    if (state.items.length > 0) {
        // Re-render les items dans le bon mode
        state.page = 1;
        if (elements.itemsGrid) elements.itemsGrid.innerHTML = '';
        if (elements.itemsList) elements.itemsList.innerHTML = '';
        renderItems();
        import('./feedback.js').then(({ hideAllStates }) => hideAllStates());
    }
}

// ============================================
// Lazy Loading des images
// ============================================

/**
 * Observe les images pour le lazy loading
 */
export function observeImages() {
    if (!imageObserver) {
        imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    loadImage(img);
                    imageObserver.unobserve(img);
                }
            });
        }, {
            rootMargin: CONFIG.IMAGE_LAZY_THRESHOLD
        });
    }

    document.querySelectorAll('.lazy-image:not(.loaded)').forEach(img => {
        imageObserver.observe(img);
    });
}

/**
 * Charge une image en lazy loading
 * @param {HTMLImageElement} img - Élément image à charger
 */
function loadImage(img) {
    const src = img.dataset.src;
    if (!src) return;
    
    const tempImg = new Image();
    tempImg.onload = () => {
        img.src = src;
        img.classList.add('loaded');
    };
    tempImg.onerror = () => {
        // Afficher placeholder en cas d'erreur
        img.parentElement.innerHTML = `
            <div class="no-image">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="3" y1="3" x2="21" y2="21"></line>
                </svg>
            </div>
        `;
    };
    tempImg.src = src;
}

/**
 * Détruit l'observer d'images
 */
export function destroyImageObserver() {
    if (imageObserver) {
        imageObserver.disconnect();
        imageObserver = null;
    }
}
