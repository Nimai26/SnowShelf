/**
 * SnowShelf - Collection Module
 * state.js - État global et configuration
 */

// Configuration de l'application
export const CONFIG = {
    API_ENDPOINT: '/api/items.php',
    CATEGORIES_API: '/api/user-categories.php',
    STATUSES_API: '/api/statuses.php',
    PRIMARY_TYPES_API: '/api/primary-types.php',
    GRADES_API: '/api/grades.php',
    STORAGE_LOCATIONS_API: '/api/storage-locations.php',
    ITEMS_PER_PAGE: 50,
    SEARCH_DEBOUNCE: 300,
    SCROLL_THRESHOLD: 200,
    IMAGE_LAZY_THRESHOLD: '100px'
};

// État global de l'application
export const state = {
    items: [],
    page: 1,
    totalItems: 0,
    totalPages: 0,
    hasMore: true,
    loading: false,
    viewMode: localStorage.getItem('collectionViewMode') || 'grid',
    sort: localStorage.getItem('collectionSort') || 'name',
    order: localStorage.getItem('collectionOrder') || 'asc',
    search: '',
    filters: {
        category_id: null,
        min_rating: null,
        min_value: null,
        max_value: null,
        date_from: null,
        date_to: null,
        status_id: null
    },
    categories: [],
    statuses: [],
    primaryTypes: [],
    grades: [],
    storageLocations: [],
    showDefaultStatuses: localStorage.getItem('collectionShowDefaultStatuses') !== 'false'
};

// Cache des éléments DOM
export let elements = {};

/**
 * Met en cache les éléments DOM fréquemment utilisés
 */
export function cacheElements() {
    elements = {
        // Containers
        itemsGrid: document.getElementById('itemsGrid'),
        itemsList: document.getElementById('itemsList'),
        collectionContainer: document.getElementById('collectionContainer'),
        collectionLoading: document.getElementById('collectionLoading'),
        collectionEmpty: document.getElementById('collectionEmpty'),
        collectionNoResults: document.getElementById('collectionNoResults'),
        scrollSentinel: document.getElementById('scrollSentinel'),
        
        // Header
        collectionCount: document.getElementById('collectionCount'),
        btnAddItem: document.getElementById('btnAddItem'),
        btnAddFirstItem: document.getElementById('btnAddFirstItem'),
        
        // Toolbar
        collectionToolbar: document.getElementById('collectionToolbar'),
        searchItems: document.getElementById('searchItems'),
        clearSearch: document.getElementById('clearSearch'),
        sortBtn: document.getElementById('sortBtn'),
        sortMenu: document.getElementById('sortMenu'),
        filterBtn: document.getElementById('filterBtn'),
        filterBadge: document.getElementById('filterBadge'),
        viewGrid: document.getElementById('viewGrid'),
        viewList: document.getElementById('viewList'),
        activeFilters: document.getElementById('activeFilters'),
        
        // Filters panel
        filtersPanel: document.getElementById('filtersPanel'),
        filtersOverlay: document.getElementById('filtersOverlay'),
        closeFilters: document.getElementById('closeFilters'),
        filterCategory: document.getElementById('filterCategory'),
        filterRating: document.getElementById('filterRating'),
        filterRatingValue: document.getElementById('filterRatingValue'),
        filterValueMin: document.getElementById('filterValueMin'),
        filterValueMax: document.getElementById('filterValueMax'),
        filterDateFrom: document.getElementById('filterDateFrom'),
        filterDateTo: document.getElementById('filterDateTo'),
        filterStatus: document.getElementById('filterStatus'),
        resetFilters: document.getElementById('resetFilters'),
        applyFilters: document.getElementById('applyFilters'),
        
        // Misc
        btnScrollTop: document.getElementById('btnScrollTop'),
        btnClearFilters: document.getElementById('btnClearFilters')
    };
}

/**
 * Réinitialise l'état pour un nouveau chargement
 */
export function resetState() {
    state.items = [];
    state.page = 1;
    state.totalItems = 0;
    state.hasMore = true;
    state.loading = false;
}

/**
 * Réinitialise les filtres
 */
export function resetFiltersState() {
    state.filters = {
        category_id: null,
        min_rating: null,
        min_value: null,
        max_value: null,
        date_from: null,
        date_to: null,
        status_id: null
    };
}

/**
 * Obtient les traductions
 * @returns {Object} Objet de traductions
 */
export function getTranslations() {
    return window.collectionTranslations || {};
}
