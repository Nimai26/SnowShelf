/**
 * SnowShelf - Web Search Module
 * Gestion des fournisseurs
 */

import { state, elements } from './state.js';
import { getTranslation } from './utils/helpers.js';
import { buildProviderItem } from './ui/modal.js';

/**
 * Récupérer le nom d'affichage d'un provider
 * @param {string} providerName - Nom interne du provider
 * @returns {string} - Nom d'affichage
 */
export function getProviderDisplayName(providerName) {
    if (!providerName) return '';
    const provider = state.providers.find(p => p.name === providerName);
    return provider?.display_name || providerName;
}

/**
 * Vérifier si un provider supporte les détails produit
 * @param {string} providerName - Nom interne du provider
 * @returns {boolean} - true si les détails sont disponibles
 */
export function providerHasDetails(providerName) {
    if (!providerName) return false;
    const provider = state.providers.find(p => p.name === providerName);
    return provider ? provider.has_details !== false : true;
}

/**
 * Initialiser les fournisseurs actifs selon le type primaire de l'item
 * @param {boolean} canUsePremium - Si l'utilisateur peut utiliser les fournisseurs premium
 * @returns {Set} - Set des IDs de fournisseurs actifs
 */
export function initializeActiveProviders(canUsePremium) {
    const activeProviders = new Set();
    
    const typeIdKey = String(state.currentPrimaryTypeId);
    if (state.currentPrimaryTypeId && state.defaultProvidersByType[typeIdKey]) {
        const typeConfig = state.defaultProvidersByType[typeIdKey];
        const defaultIds = typeConfig.provider_ids || [];
        
        // //console.log('[WebSearch] Type primaire:', state.currentPrimaryTypeId, 
        //             '- Config trouvée:', typeConfig.name,
        //             '- Fournisseurs par défaut:', defaultIds);
        
        for (const providerId of defaultIds) {
            const provider = state.providers.find(p => p.id === providerId);
            if (provider) {
                if (!provider.premium_only || canUsePremium) {
                    activeProviders.add(providerId);
                }
            }
        }
        
        if (activeProviders.size > 0) {
            return activeProviders;
        }
    }
    
    // Fallback : utiliser les fournisseurs avec default_active = true
    //console.log('[WebSearch] Pas de config type primaire (id:', state.currentPrimaryTypeId, '), utilisation des défauts globaux');
    for (const provider of state.providers) {
        if (provider.default_active && (!provider.premium_only || canUsePremium)) {
            activeProviders.add(provider.id);
        }
    }
    
    return activeProviders;
}

/**
 * Obtenir les fournisseurs par défaut pour le type webapi sélectionné
 * @param {string} webapiType - Type webapi (toys, books, etc.)
 * @param {boolean} canUsePremium - Si l'utilisateur peut utiliser les fournisseurs premium
 * @returns {Set} - Set des IDs de fournisseurs
 */
export function getDefaultProvidersForWebapiType(webapiType, canUsePremium) {
    const activeProviders = new Set();
    
    // Priorité 1 : Si on a un type primaire courant et qu'il correspond au webapi_type
    const currentTypeKey = String(state.currentPrimaryTypeId);
    const currentTypeConfig = state.defaultProvidersByType[currentTypeKey];
    if (currentTypeConfig && currentTypeConfig.webapi_type === webapiType && currentTypeConfig.provider_ids?.length > 0) {
        //console.log('[WebSearch] Utilisation config du type primaire courant:', currentTypeConfig.name);
        for (const providerId of currentTypeConfig.provider_ids) {
            const provider = state.providers.find(p => p.id === providerId);
            if (provider && provider.default_active && (!provider.premium_only || canUsePremium)) {
                activeProviders.add(providerId);
            }
        }
        if (activeProviders.size > 0) {
            return activeProviders;
        }
    }
    
    // Priorité 2 : Chercher un type primaire qui correspond à ce webapi_type
    for (const [ptId, config] of Object.entries(state.defaultProvidersByType)) {
        if (config.webapi_type === webapiType && config.provider_ids?.length > 0) {
            //console.log('[WebSearch] Utilisation config du type:', config.name, 'pour webapi_type:', webapiType);
            for (const providerId of config.provider_ids) {
                const provider = state.providers.find(p => p.id === providerId);
                if (provider && provider.default_active && (!provider.premium_only || canUsePremium)) {
                    activeProviders.add(providerId);
                }
            }
            
            if (activeProviders.size > 0) {
                return activeProviders;
            }
        }
    }
    
    // Fallback : fournisseurs default_active du type
    //console.log('[WebSearch] Fallback sur default_active pour:', webapiType);
    const filteredProviders = state.providers.filter(p => p.type === webapiType);
    for (const provider of filteredProviders) {
        if (provider.default_active && (!provider.premium_only || canUsePremium)) {
            activeProviders.add(provider.id);
        }
    }
    
    return activeProviders;
}

/**
 * Mettre à jour la liste des fournisseurs affichés
 */
export function updateProvidersList() {
    if (!elements.providersList) return;
    
    const filteredProviders = state.providers.filter(p => 
        p.type === state.selectedType && p.default_active
    );
    
    if (filteredProviders.length === 0) {
        elements.providersList.innerHTML = `
            <div class="web-search-no-providers">
                ${getTranslation('no_providers')}
            </div>
        `;
        state.activeProviders.clear();
        return;
    }
    
    const userInfo = window.userInfo || { isPremium: false, isAdmin: false };
    const canUsePremium = userInfo.isPremium || userInfo.isAdmin;
    
    state.activeProviders = getDefaultProvidersForWebapiType(state.selectedType, canUsePremium);
    
    elements.providersList.innerHTML = filteredProviders
        .map(p => buildProviderItem(p))
        .join('');
}
