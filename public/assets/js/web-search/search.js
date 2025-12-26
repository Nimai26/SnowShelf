/**
 * SnowShelf - Web Search Module
 * Logique de recherche
 */

import { state, elements } from './state.js';
import { executeSearchApi } from './api.js';
import { showToast, getTranslation, getTranslations } from './utils/helpers.js';
import { showSearchingState, showEmptyResults, displayResults, updateSearchButtonState } from './ui/results.js';

/**
 * Effectuer une recherche textuelle
 */
export async function performTextSearch() {
    const query = elements.searchInput?.value.trim();
    if (!query) {
        showToast(getTranslation('error_empty_query'), 'warning');
        return;
    }
    
    if (state.activeProviders.size === 0) {
        showToast(getTranslation('error_no_provider'), 'warning');
        return;
    }
    
    const activeProviderNames = state.providers
        .filter(p => state.activeProviders.has(p.id))
        .map(p => p.display_name);
    
    console.log('[WebSearch] === RECHERCHE ===');
    console.log('[WebSearch] Query:', query);
    console.log('[WebSearch] Type sélectionné:', state.selectedType);
    console.log('[WebSearch] Fournisseurs actifs:', activeProviderNames);
    console.log('[WebSearch] IDs fournisseurs:', Array.from(state.activeProviders));
    
    await executeSearch({
        query: query,
        providers: Array.from(state.activeProviders),
    });
}

/**
 * Effectuer une recherche par image
 */
export async function performImageSearch() {
    if (!state.currentImage) {
        showToast(getTranslation('error_no_image'), 'warning');
        return;
    }
    
    // TODO: Implémenter la recherche par image
    showToast(getTranslation('image_search_coming_soon'), 'info');
}

/**
 * Exécuter une recherche
 * @param {Object} params - Paramètres de recherche
 */
export async function executeSearch(params) {
    state.isSearching = true;
    state.searchAbortController = new AbortController();
    
    updateSearchButtonState(true);
    showSearchingState();
    
    try {
        const data = await executeSearchApi(params);
        state.results = data.providers_results;
        displayResults(data);
        
    } catch (error) {
        if (error.name === 'AbortError') {
            showToast(getTranslation('search_cancelled'), 'info');
        } else {
            console.error('[WebSearch] Search error:', error);
            showToast(error.message || getTranslation('error_search'), 'error');
        }
        showEmptyResults();
    } finally {
        state.isSearching = false;
        state.searchAbortController = null;
        updateSearchButtonState(false);
    }
}

/**
 * Annuler la recherche en cours
 */
export function cancelSearch() {
    if (state.searchAbortController) {
        state.searchAbortController.abort();
    }
}
