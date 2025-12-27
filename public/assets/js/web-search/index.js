/**
 * SnowShelf - Web Search Modal
 * Point d'entrée - Module ES principal
 * 
 * Expose window.WebSearchModal pour compatibilité avec le code existant
 */

import { config } from './config.js';
import { state, elements, resetState, clearElements } from './state.js';
import { getTranslations } from './utils/helpers.js';
import { loadProviders, loadPrimaryTypes } from './api.js';
import { initializeActiveProviders, updateProvidersList } from './providers.js';
import { buildModalContent } from './ui/modal.js';
import { initModalElements, setupEventListeners } from './ui/events.js';
import { selectGalleryImage } from './ui/gallery.js';

/**
 * Ouvrir le modal de recherche web
 * @param {Object} options - Options d'ouverture
 * @param {number} options.primaryTypeId - ID du type primaire pré-sélectionné
 * @param {boolean} options.allowTypeChange - Autoriser le changement de type
 * @param {Function} options.onImportStart - Callback avant import
 * @param {Function} options.onImport - Callback après import réussi
 * @param {Function} options.onImportEnd - Callback après import (succès ou échec)
 */
async function open(options = {}) {
    //console.log('[WebSearch] Opening modal with options:', options);
    
    // Réinitialiser l'état
    resetState();
    
    // Sauvegarder les options
    state.options = options;
    state.initialQuery = options.query || '';
    state.currentPrimaryTypeId = options.currentPrimaryTypeId || options.primaryTypeId || null;
    state.allowTypeChange = options.allowTypeChange !== false;
    state.onSelect = options.onSelect || null;
    
    // Charger les traductions
    const t = getTranslations();
    
    try {
        // Charger les données en parallèle
        const [providersData, primaryTypes] = await Promise.all([
            loadProviders(),
            loadPrimaryTypes()
        ]);
        
        if (!providersData) {
            console.error('[WebSearch] Failed to load providers data');
            return;
        }
        
        // Extraire les données de providersData
        state.types = providersData.types || {};
        state.typeMapping = providersData.type_mapping || {};  // Mapping webapi_type -> primary_type_id
        state.providers = providersData.providers || [];
        state.defaultProvidersByType = providersData.default_providers_by_type || {};
        state.primaryTypes = primaryTypes;
        
        ////console.log('[WebSearch] Type mapping loaded:', state.typeMapping);
        
        // Déterminer le type webapi à partir du type primaire
        const userInfo = window.userInfo || { isPremium: false, isAdmin: false };
        const canUsePremium = userInfo.isPremium || userInfo.isAdmin || providersData.user_is_premium;
        
        // Déterminer le type webapi sélectionné
        let requestedType = null;
        if (state.currentPrimaryTypeId) {
            const typeIdKey = String(state.currentPrimaryTypeId);
            const typeConfig = state.defaultProvidersByType[typeIdKey];
            if (typeConfig && typeConfig.webapi_type) {
                requestedType = typeConfig.webapi_type;
                //console.log('[WebSearch] Type webapi déduit du type primaire:', requestedType);
            }
        }
        state.selectedType = requestedType || Object.keys(state.types)[0] || 'toys';
        
        // Initialiser les fournisseurs actifs
        state.activeProviders = initializeActiveProviders(canUsePremium);
        
        //console.log('[WebSearch] Providers loaded:', state.providers.length);
        //console.log('[WebSearch] Primary types loaded:', primaryTypes.length);
        
    } catch (error) {
        console.error('[WebSearch] Failed to load data:', error);
        if (typeof showToast === 'function') {
            showToast(t.load_error || 'Erreur de chargement', 'error');
        }
        return;
    }
    
    // Construire le contenu du modal
    const modalContent = buildModalContent();
    
    // Ouvrir le modal via ModalManager
    state.modalId = ModalManager.open({
        template: 'base',
        title: t.title,
        content: modalContent,
        size: 'modal-xl',
        customClass: 'web-search-modal',
        closeOnOverlay: false,
        buttons: [],
        onOpen: (id) => {
            //console.log('[WebSearch] Modal opened:', id);
            initModalElements();
            setupEventListeners();
            
            // Pré-remplir le champ de recherche si une query est fournie
            if (state.initialQuery && elements.searchInput) {
                elements.searchInput.value = state.initialQuery;
            }
            
            // Mettre à jour le dropdown de type pour refléter state.selectedType
            const typeTrigger = document.getElementById('wsTypeTrigger');
            const typeMenu = document.getElementById('wsTypeMenu');
            if (typeTrigger && typeMenu && state.types[state.selectedType]) {
                typeTrigger.querySelector('.ws-type-text').textContent = state.types[state.selectedType];
                typeMenu.querySelectorAll('.ws-type-option').forEach(opt => {
                    opt.classList.toggle('selected', opt.dataset.value === state.selectedType);
                });
            }
            
            // Mettre à jour la liste des fournisseurs
            updateProvidersList();
        },
        onClose: (id) => {
            //console.log('[WebSearch] Modal closed:', id);
            cleanup();
        }
    });
}

/**
 * Fermer le modal de recherche
 */
function close() {
    if (state.detailModalId) {
        ModalManager.close(state.detailModalId);
        state.detailModalId = null;
    }
    
    if (state.modalId) {
        ModalManager.close(state.modalId);
        state.modalId = null;
    }
    
    cleanup();
}

/**
 * Nettoyer l'état et les ressources
 */
function cleanup() {
    // Annuler les requêtes en cours
    if (state.currentAbortController) {
        state.currentAbortController.abort();
        state.currentAbortController = null;
    }
    
    // Fermer la caméra si ouverte
    if (state.cameraStream) {
        state.cameraStream.getTracks().forEach(track => track.stop());
        state.cameraStream = null;
    }
    
    // Nettoyer les éléments
    clearElements();
    
    // Réinitialiser l'état
    resetState();
    
    //console.log('[WebSearch] Cleanup complete');
}

/**
 * Sélectionner une image (fonction exposée pour sélection externe)
 */
function _selectImage(url) {
    selectGalleryImage(url);
}

// Exposer l'API publique
const WebSearchModal = {
    open,
    close,
    _selectImage
};

// Exposer globalement pour compatibilité
if (typeof window !== 'undefined') {
    window.WebSearchModal = WebSearchModal;
}

export { open, close, cleanup, _selectImage };
export default WebSearchModal;
