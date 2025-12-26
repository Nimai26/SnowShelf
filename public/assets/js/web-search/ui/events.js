/**
 * SnowShelf - Web Search Module
 * Gestion des événements
 */

import { state, elements } from '../state.js';
import { performTextSearch, performImageSearch, cancelSearch } from '../search.js';
import { handleImageFile, openCameraCapture, openBarcodeScanner } from '../camera.js';
import { updateProvidersList } from '../providers.js';
import { selectResult } from './results.js';

/**
 * Initialiser les références aux éléments DOM
 */
export function initModalElements() {
    elements.typeDropdown = document.getElementById('wsTypeDropdown');
    elements.typeTrigger = document.getElementById('wsTypeTrigger');
    elements.typeMenu = document.getElementById('wsTypeMenu');
    elements.providersList = document.getElementById('wsProvidersList');
    elements.searchInput = document.getElementById('wsSearchInput');
    elements.searchBtn = document.getElementById('wsSearchBtn');
    elements.imageDropZone = document.getElementById('wsImageDropZone');
    elements.imageInput = document.getElementById('wsImageInput');
    elements.imagePlaceholder = document.getElementById('wsImagePlaceholder');
    elements.imagePreview = document.getElementById('wsImagePreview');
    elements.imageBrowseBtn = document.getElementById('wsImageBrowseBtn');
    elements.cameraBtn = document.getElementById('wsCameraBtn');
    elements.scanBtn = document.getElementById('wsScanBtn');
    elements.imageSearchBtn = document.getElementById('wsImageSearchBtn');
    elements.useLocalDbToggle = document.getElementById('wsUseLocalDb');
    elements.autoTranslateToggle = document.getElementById('wsAutoTranslate');
    elements.resultsContainer = document.getElementById('wsResultsContainer');
    elements.resultsCount = document.getElementById('wsResultsCount');
}

/**
 * Configurer tous les événements du modal
 */
export function setupEventListeners() {
    // Dropdown de type personnalisé
    setupTypeDropdown();
    
    // Toggles fournisseurs (délégation)
    elements.providersList?.addEventListener('change', (e) => {
        if (e.target.type === 'checkbox') {
            const label = e.target.closest('.web-search-provider');
            const providerId = parseInt(label.dataset.providerId);
            
            if (e.target.checked) {
                state.activeProviders.add(providerId);
                label.classList.add('active');
            } else {
                state.activeProviders.delete(providerId);
                label.classList.remove('active');
            }
        }
    });
    
    // Toggle utiliser BDD locale SnowShelf
    elements.useLocalDbToggle?.addEventListener('change', (e) => {
        state.useLocalDatabase = e.target.checked;
        console.log('[WebSearch] Use local database:', state.useLocalDatabase);
    });
    
    // Toggle auto-traduction (persisté en base)
    elements.autoTranslateToggle?.addEventListener('change', async (e) => {
        state.autoTranslate = e.target.checked;
        console.log('[WebSearch] Auto-translate:', state.autoTranslate);
        
        try {
            const response = await fetch('/api/users.php?action=preferences', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ auto_trad: state.autoTranslate })
            });
            
            if (response.ok) {
                if (window.userInfo) {
                    window.userInfo.autoTrad = state.autoTranslate;
                }
            }
        } catch (error) {
            console.error('[WebSearch] Erreur sauvegarde auto_trad:', error);
        }
    });
    
    // Recherche textuelle
    elements.searchBtn?.addEventListener('click', () => {
        if (state.isSearching) {
            cancelSearch();
        } else {
            performTextSearch();
        }
    });
    
    elements.searchInput?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !state.isSearching) {
            performTextSearch();
        }
    });
    
    // Zone de drop image
    setupImageDropZone();
    
    // Bouton parcourir fichier
    elements.imageBrowseBtn?.addEventListener('click', () => {
        elements.imageInput?.click();
    });
    
    elements.imageInput?.addEventListener('change', (e) => {
        const file = e.target.files?.[0];
        if (file) {
            handleImageFile(file);
        }
    });
    
    // Bouton caméra
    elements.cameraBtn?.addEventListener('click', openCameraCapture);
    
    // Bouton scan
    elements.scanBtn?.addEventListener('click', openBarcodeScanner);
    
    // Recherche par image
    elements.imageSearchBtn?.addEventListener('click', () => {
        if (state.isSearching) {
            cancelSearch();
        } else {
            performImageSearch();
        }
    });
    
    // Sélection de résultat (délégation)
    elements.resultsContainer?.addEventListener('click', (e) => {
        const selectBtn = e.target.closest('.result-select-btn');
        if (selectBtn) {
            const resultEl = selectBtn.closest('.web-search-result');
            const detailUrl = resultEl?.dataset.detailUrl;
            selectResult(detailUrl);
        }
    });
}

/**
 * Configure le dropdown personnalisé pour le type de contenu
 */
export function setupTypeDropdown() {
    const dropdown = elements.typeDropdown;
    const trigger = elements.typeTrigger;
    const menu = elements.typeMenu;
    
    if (!dropdown || !trigger || !menu) return;
    
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = dropdown.classList.contains('open');
        
        if (isOpen) {
            closeTypeDropdown();
        } else {
            openTypeDropdown();
        }
    });
    
    menu.addEventListener('click', (e) => {
        const option = e.target.closest('.ws-type-option');
        if (!option) return;
        
        const value = option.dataset.value;
        const text = option.querySelector('.ws-type-option-text').textContent;
        
        state.selectedType = value;
        trigger.querySelector('.ws-type-text').textContent = text;
        
        menu.querySelectorAll('.ws-type-option').forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');
        
        closeTypeDropdown();
        updateProvidersList();
    });
    
    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target)) {
            closeTypeDropdown();
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && dropdown.classList.contains('open')) {
            closeTypeDropdown();
        }
    });
}

/**
 * Ouvrir le dropdown de type
 */
export function openTypeDropdown() {
    elements.typeDropdown?.classList.add('open');
    elements.typeMenu?.classList.add('open');
}

/**
 * Fermer le dropdown de type
 */
export function closeTypeDropdown() {
    elements.typeDropdown?.classList.remove('open');
    elements.typeMenu?.classList.remove('open');
}

/**
 * Configurer la zone de drop d'image
 */
export function setupImageDropZone() {
    const zone = elements.imageDropZone;
    if (!zone) return;
    
    zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('dragover');
    });
    
    zone.addEventListener('dragleave', () => {
        zone.classList.remove('dragover');
    });
    
    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('dragover');
        
        const file = e.dataTransfer.files?.[0];
        if (file && file.type.startsWith('image/')) {
            handleImageFile(file);
        }
    });
    
    zone.addEventListener('click', () => {
        elements.imageInput?.click();
    });
}
