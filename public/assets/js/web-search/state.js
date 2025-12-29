/**
 * SnowShelf - Web Search Module
 * État global du module
 */

// État du module (singleton mutable)
export const state = {
    types: {},
    typeMapping: {},  // Mapping webapi_type -> primary_type_id (chargé depuis l'API)
    providers: [],
    defaultProvidersByType: {},
    isLoadingDetails: false,
    currentDetailResult: null,
    selectedType: 'toys',
    activeProviders: new Set(),
    isSearching: false,
    searchAbortController: null,
    results: [],
    currentModalId: null,
    detailModalId: null,
    onSelect: null,
    initialQuery: '',
    currentPrimaryTypeId: null,
    primaryTypes: [],
    primaryTypeFields: {},
    fieldMappings: [], // Mappings de champs fixes (chargés une fois depuis item_field_mappings)
    selectedImages: new Set(),
    selectedInstructions: new Map(), // Map<url, {url, name}>
    autoTranslate: window.userInfo?.autoTrad ?? false,
    useLocalDatabase: true, // Utiliser la BDD locale SnowShelf (si false, refresh=true sera envoyé)
    currentImage: null,
    cachedDetails: {}, // Cache des détails par clé unique (provider:detailUrl)
};

// Références DOM (mises à jour à chaque ouverture)
export const elements = {};

/**
 * Réinitialiser les références DOM
 */
export function clearElements() {
    Object.keys(elements).forEach(key => delete elements[key]);
}

/**
 * Réinitialiser l'état pour une nouvelle session
 */
export function resetState() {
    state.results = [];
    state.isSearching = false;
    state.searchAbortController = null;
    state.currentModalId = null;
    state.detailModalId = null;
    state.currentImage = null;
    state.selectedImages = new Set();
    state.selectedInstructions = new Map(); // Map<url, {url, name}>
    state.currentDetailResult = null;
    state.isLoadingDetails = false;
    state.initialQuery = '';
    state.onSelect = null;
    state.currentPrimaryTypeId = null;
    state.cachedDetails = {}; // Vider le cache des détails
}
