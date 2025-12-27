/**
 * SnowShelf - Web Search Module
 * Appels API
 */

import { config } from './config.js';
import { state } from './state.js';
import { showToast, getTranslation } from './utils/helpers.js';

/**
 * Charger la liste des fournisseurs
 * @returns {Promise<Object|null>} - Données des fournisseurs { types, providers, default_providers_by_type, user_is_premium, user_is_admin } ou null
 */
export async function loadProviders() {
    try {
        const response = await fetch(`${config.apiEndpoint}?action=providers`);
        const data = await response.json();
        
        if (!data.success) {
            showToast(data.error || getTranslation('error_loading'), 'error');
            return null;
        }
        
        // Retourne { types, providers, default_providers_by_type, user_is_premium, user_is_admin }
        return data.data;
    } catch (error) {
        console.error('[WebSearch] Error loading providers:', error);
        showToast(getTranslation('error_loading'), 'error');
        return null;
    }
}

/**
 * Charger la liste des types primaires
 * @returns {Promise<Array>} - Liste des types primaires
 */
export async function loadPrimaryTypes() {
    try {
        const response = await fetch(`${config.metadataApiEndpoint}?action=types`);
        const data = await response.json();
        
        if (!data.success) {
            console.error('[WebSearch] Error loading primary types:', data.error);
            return [];
        }
        
        return data.data || [];
    } catch (error) {
        console.error('[WebSearch] Error loading primary types:', error);
        return [];
    }
}

/**
 * Charger les champs d'un type primaire (avec cache)
 * @param {number} typeId - ID du type primaire
 * @returns {Promise<Array>} - Liste des champs
 */
export async function loadPrimaryTypeFields(typeId) {
    // Vérifier le cache
    if (state.primaryTypeFields[typeId]) {
        return state.primaryTypeFields[typeId];
    }
    
    try {
        const response = await fetch(`${config.metadataApiEndpoint}?action=fields&type_id=${typeId}`);
        const data = await response.json();
        
        if (!data.success) {
            console.error('[WebSearch] Error loading type fields:', data.error);
            return [];
        }
        
        // Mettre en cache
        state.primaryTypeFields[typeId] = data.data || [];
        return state.primaryTypeFields[typeId];
    } catch (error) {
        console.error('[WebSearch] Error loading type fields:', error);
        return [];
    }
}

/**
 * Charger les détails d'un produit
 * @param {string} provider - Nom du fournisseur
 * @param {string} detailUrl - URL API de détail du produit
 * @returns {Promise<Object|null>} - { data: détails, webapi_id: ID } ou null
 */
export async function loadProductDetails(provider, detailUrl) {
    // Ajouter refresh=true si on n'utilise pas la BDD locale
    const refreshParam = !state.useLocalDatabase ? '&refresh=true' : '';
    const apiUrl = `${config.apiEndpoint}?action=details&provider=${encodeURIComponent(provider)}&product_id=${encodeURIComponent(detailUrl)}${refreshParam}`;
    console.log('[WebSearch] Appel API détails:', apiUrl);
    
    try {
        const response = await fetch(apiUrl);
        
        // Vérifier le content-type pour s'assurer qu'on reçoit du JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            console.error('[WebSearch] Réponse non-JSON reçue:', contentType);
            throw new Error('Erreur serveur - réponse non-JSON');
        }
        
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.error || 'Erreur lors du chargement');
        }
        
        console.log('[WebSearch] Détails chargés:', result);
        // Retourner aussi le webapi_id pour les mappings
        return {
            data: result.data,
            webapi_id: result.webapi_id || null,
            provider: result.provider || provider
        };
    } catch (error) {
        console.error('[WebSearch] Erreur lors du chargement des détails:', error);
        throw error;
    }
}

/**
 * Exécuter une recherche
 * @param {Object} params - Paramètres de recherche
 * @returns {Promise<Object>} - Résultats de la recherche
 */
export async function executeSearchApi(params) {
    // Ajouter refresh=true si on n'utilise pas la BDD locale
    if (!state.useLocalDatabase) {
        params.refresh = true;
    }
    
    console.log('[WebSearch] Envoi requête API:', config.apiEndpoint + '?action=search');
    console.log('[WebSearch] Paramètres:', JSON.stringify(params, null, 2));
    
    const response = await fetch(`${config.apiEndpoint}?action=search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
        signal: state.searchAbortController?.signal,
    });
    
    const data = await response.json();
    
    console.log('[WebSearch] Réponse HTTP:', response.status);
    console.log('[WebSearch] Réponse API:', JSON.stringify(data, null, 2));
    
    if (!data.success) {
        throw new Error(data.error || getTranslation('error_search'));
    }
    
    // Log détaillé des résultats par fournisseur
    if (data.data?.providers_results) {
        console.log('[WebSearch] === RÉSULTATS PAR FOURNISSEUR ===');
        data.data.providers_results.forEach(pr => {
            console.log(`[WebSearch] ${pr.provider_name} (${pr.provider_type}): ${pr.results_count} résultats`);
        });
        console.log('[WebSearch] Total:', data.data.total_results, 'résultats');
    }
    
    return data.data;
}
