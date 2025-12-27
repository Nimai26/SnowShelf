/**
 * SnowShelf - Collection Module
 * index.js - Point d'entrée principal
 * 
 * Ce module coordonne tous les sous-modules de la collection.
 * Il expose l'API publique window.CollectionPage et gère l'initialisation.
 */

import { CONFIG, state, elements, cacheElements, getTranslations } from './state.js';
import { escapeHtml, formatCurrency, formatDate, renderMdiIcon, debounce } from './utils.js';
import * as api from './api.js';
import * as filters from './filters.js';

// UI Modules
import { 
    showLoading, hideLoading, showEmpty, showNoResults, hideAllStates,
    showLoadMoreIndicator, hideLoadMoreIndicator, showToast, showError, handleScroll, scrollToTop
} from './ui/feedback.js';
import { 
    updateUI, renderItems, setViewMode, attachItemClickEvents, 
    observeImages, destroyImageObserver 
} from './ui/list.js';
import {
    buildStarsHtml, buildMetadataViewHtml, buildItemViewHtml,
    openItemModal as openItemModalView
} from './ui/item-view.js';
import {
    buildItemFormHtml, initItemForm, detectFieldsToReplace, applyWebSearchImport,
    handleItemSubmit, openAddItemModal as openAddItemModalForm, 
    openItemEditModal as openItemEditModalForm
} from './ui/item-form.js';

// Dropdown Modules
import { createCustomDropdown, destroyAllDropdowns } from './dropdowns/base.js';
import { populatePrimaryTypeSelect } from './dropdowns/primary-type.js';
import { populateStatusSelect, openManageStatusesModal } from './dropdowns/status.js';
import { createCategoriesSelector } from './dropdowns/categories.js';
import { populateGradesSelectByCategories } from './dropdowns/grades.js';
import { populateStorageLocationSelect } from './dropdowns/storage.js';

// Metadata Modules
import { loadMetadataFields, renderMetadataFields, refreshStickerGrid } from './metadata/fields.js';

// Observers
let scrollObserver = null;

// ============================================
// Initialisation
// ============================================

/**
 * Initialise le module Collection
 */
function init() {
    cacheElements();
    setupEventListeners();
    setupIntersectionObserver();
    
    // Charger les données initiales
    api.loadCategories().then(() => {
        filters.populateCategoryFilter();
    });
    api.loadStatuses();
    
    // Configurer la vue
    setViewMode(state.viewMode);
    filters.updateSortUI();
    
    // Charger les items
    loadItemsWithUI();
    
    // Attacher les événements de clic sur les items
    attachItemClickEvents(openItemModal);
    
    // Exposer les fonctions de modals aux modules UI
    setupModalCallbacks();
    
    // Vérifier si un ajout rapide est en attente (depuis le bouton header)
    if (window.pendingQuickAdd) {
        window.pendingQuickAdd = false;
        openAddItemModal();
    }
}

/**
 * Configure les callbacks pour les modals
 * Permet aux modules UI d'accéder aux fonctions nécessaires
 */
function setupModalCallbacks() {
    // Exposer les fonctions utilitaires aux modules item-form et item-view
    window._collectionCallbacks = {
        // API
        loadItemDetails: api.loadItemDetails,
        deleteItem: api.deleteItem,
        
        // UI
        showToast,
        showError,
        resetAndLoad,
        
        // Dropdowns
        createCustomDropdown,
        populatePrimaryTypeSelect,
        populateStatusSelect,
        openManageStatusesModal,
        createCategoriesSelector,
        populateGradesSelectByCategories,
        populateStorageLocationSelect,
        
        // Metadata
        loadMetadataFields,
        renderMetadataFields,
        refreshStickerGrid,
        
        // Utils
        escapeHtml,
        formatCurrency,
        formatDate
    };
}

/**
 * Configure les écouteurs d'événements
 */
function setupEventListeners() {
    // Recherche avec debounce
    let searchTimeout;
    elements.searchItems?.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        const value = e.target.value;
        if (elements.clearSearch) {
            elements.clearSearch.style.display = value ? 'flex' : 'none';
        }
        
        searchTimeout = setTimeout(() => {
            state.search = value;
            resetAndLoad();
        }, CONFIG.SEARCH_DEBOUNCE);
    });

    elements.clearSearch?.addEventListener('click', () => {
        if (elements.searchItems) elements.searchItems.value = '';
        if (elements.clearSearch) elements.clearSearch.style.display = 'none';
        state.search = '';
        resetAndLoad();
    });

    // Tri
    elements.sortBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        elements.sortMenu?.classList.toggle('show');
    });

    elements.sortMenu?.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', () => {
            const newSort = item.dataset.sort;
            const newOrder = item.dataset.order;
            
            if (newSort !== state.sort || newOrder !== state.order) {
                state.sort = newSort;
                state.order = newOrder;
                localStorage.setItem('collectionSort', state.sort);
                localStorage.setItem('collectionOrder', state.order);
                filters.updateSortUI();
                resetAndLoad();
            }
            
            elements.sortMenu?.classList.remove('show');
        });
    });

    // Fermeture dropdown au clic extérieur
    document.addEventListener('click', (e) => {
        if (!elements.sortBtn?.contains(e.target) && !elements.sortMenu?.contains(e.target)) {
            elements.sortMenu?.classList.remove('show');
        }
    });

    // Vue grille/liste
    elements.viewGrid?.addEventListener('click', () => setViewMode('grid'));
    elements.viewList?.addEventListener('click', () => setViewMode('list'));

    // Filtres
    elements.filterBtn?.addEventListener('click', () => {
        filters.openFiltersPanel();
        // Peupler le filtre de statuts
        filters.populateStatusFilter(createCustomDropdown, applyFilters);
    });
    elements.closeFilters?.addEventListener('click', filters.closeFiltersPanel);
    elements.filtersOverlay?.addEventListener('click', filters.closeFiltersPanel);
    elements.resetFilters?.addEventListener('click', filters.resetFiltersUI);
    elements.applyFilters?.addEventListener('click', applyFilters);
    elements.btnClearFilters?.addEventListener('click', () => {
        filters.resetFiltersUI();
        applyFilters();
    });

    // Slider note
    elements.filterRating?.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        if (elements.filterRatingValue) {
            elements.filterRatingValue.textContent = value > 0 ? `${value}+` : '0+';
        }
    });

    // Ajout d'item
    elements.btnAddItem?.addEventListener('click', openAddItemModal);
    elements.btnAddFirstItem?.addEventListener('click', openAddItemModal);

    // Écouter l'événement de sauvegarde d'item pour rafraîchir la liste
    document.addEventListener('collection:itemSaved', () => {
        resetAndLoad();
    });

    // Écouter l'événement de suppression d'item pour rafraîchir la liste
    document.addEventListener('collection:itemDeleted', () => {
        resetAndLoad();
    });

    // Scroll pour toolbar sticky et bouton retour haut
    window.addEventListener('scroll', handleScroll, { passive: true });

    // Bouton retour en haut
    elements.btnScrollTop?.addEventListener('click', scrollToTop);
}

/**
 * Configure l'IntersectionObserver pour l'infinite scroll
 */
function setupIntersectionObserver() {
    if (!elements.scrollSentinel) return;

    scrollObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && state.hasMore && !state.loading) {
                loadMore();
            }
        });
    }, {
        rootMargin: `${CONFIG.SCROLL_THRESHOLD}px`
    });

    scrollObserver.observe(elements.scrollSentinel);
}

// ============================================
// Chargement des données
// ============================================

/**
 * Charge les items avec gestion de l'UI
 * @param {boolean} append - Ajouter aux items existants
 */
async function loadItemsWithUI(append = false) {
    if (state.loading) return;
    
    state.loading = true;
    
    if (!append) {
        showLoading();
    } else {
        showLoadMoreIndicator();
    }

    try {
        await api.loadItems(append);
        updateUI(filters.hasActiveFilters, () => filters.updateActiveFiltersUI(resetAndLoad));
    } catch (error) {
        console.error('Erreur chargement items:', error);
        const t = getTranslations();
        showError(t.error_loading || 'Erreur lors du chargement');
    } finally {
        state.loading = false;
        hideLoading();
        hideLoadMoreIndicator();
    }
}

/**
 * Charge plus d'items (pagination)
 */
function loadMore() {
    if (state.hasMore && !state.loading) {
        state.page++;
        loadItemsWithUI(true);
    }
}

/**
 * Réinitialise et recharge les items
 */
function resetAndLoad() {
    state.page = 1;
    state.items = [];
    state.hasMore = true;
    
    // Vider les deux conteneurs pour forcer un re-rendu complet
    if (elements.itemsGrid) elements.itemsGrid.innerHTML = '';
    if (elements.itemsList) elements.itemsList.innerHTML = '';
    
    loadItemsWithUI();
}

/**
 * Applique les filtres et recharge
 */
function applyFilters() {
    filters.applyFiltersFromUI();
    filters.closeFiltersPanel();
    resetAndLoad();
}

// ============================================
// Modals - Wrappers pour les modules UI
// ============================================

/**
 * Ouvre la modal d'ajout d'un nouvel item
 */
function openAddItemModal() {
    openAddItemModalForm();
}

/**
 * Ouvre la modal de visualisation/édition d'un item
 * @param {number} itemId - ID de l'item
 * @param {boolean} editMode - Mode édition directe
 */
async function openItemModal(itemId, editMode = false) {
    await openItemModalView(itemId, editMode, openItemEditModal);
}

/**
 * Ouvre la modal d'édition d'un item
 * @param {Object|null} item - Item à éditer ou null pour création
 */
function openItemEditModal(item = null) {
    openItemEditModalForm(item);
}

// ============================================
// Nettoyage
// ============================================

/**
 * Nettoie les ressources lors du changement de page
 */
function destroy() {
    // Détruire les observers
    if (scrollObserver) {
        scrollObserver.disconnect();
        scrollObserver = null;
    }
    destroyImageObserver();
    
    // Détruire les dropdowns custom
    destroyAllDropdowns();
    
    // Nettoyer les callbacks
    delete window._collectionCallbacks;
    
    // Réinitialiser l'état
    state.items = [];
    state.page = 1;
    state.totalItems = 0;
    state.hasMore = true;
    state.loading = false;
}

// ============================================
// API Publique
// ============================================

window.CollectionPage = {
    init,
    refresh: resetAndLoad,
    getState: () => ({ ...state }),
    setViewMode,
    openItemModal,
    openAddItemModal,
    openItemEditModal,
    destroy,
    
    // Utilitaires exposés pour compatibilité
    showToast,
    showError,
    
    // Dropdowns pour usage externe
    createCustomDropdown,
    populatePrimaryTypeSelect,
    populateStatusSelect,
    createCategoriesSelector,
    populateGradesSelectByCategories,
    populateStorageLocationSelect
};

// ============================================
// Auto-initialisation
// ============================================

function autoInit() {
    // Vérifier si on est sur la page collection
    if (document.querySelector('.collection-page')) {
        init();
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoInit);
} else {
    autoInit();
}

// Exports pour les autres modules
export {
    // Initialisation
    init,
    destroy,
    
    // Chargement
    resetAndLoad,
    loadItemsWithUI,
    applyFilters,
    
    // Modals
    openItemModal,
    openAddItemModal,
    openItemEditModal,
    
    // UI
    showToast,
    showError,
    setViewMode,
    
    // Dropdowns
    createCustomDropdown,
    populatePrimaryTypeSelect,
    populateStatusSelect,
    openManageStatusesModal,
    createCategoriesSelector,
    populateGradesSelectByCategories,
    populateStorageLocationSelect,
    
    // Metadata
    loadMetadataFields,
    renderMetadataFields,
    refreshStickerGrid,
    
    // Utils
    escapeHtml,
    formatCurrency,
    formatDate
};
