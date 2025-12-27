/**
 * SnowShelf - Web Search Module
 * Affichage des résultats
 */

import { state, elements } from '../state.js';
import { getTranslation, getTranslations, escapeHtml } from '../utils/helpers.js';
import { buildResultItem } from './modal.js';
import { showResultDetails } from './details.js';

/**
 * Afficher l'état de recherche en cours
 */
export function showSearchingState() {
    if (!elements.resultsContainer) return;
    
    elements.resultsContainer.innerHTML = `
        <div class="web-search-loading">
            <div class="spinner"></div>
            <p>${getTranslation('searching')}</p>
        </div>
    `;
    
    if (elements.resultsCount) {
        elements.resultsCount.textContent = '';
    }
}

/**
 * Afficher l'état sans résultats
 */
export function showEmptyResults() {
    if (!elements.resultsContainer) return;
    
    elements.resultsContainer.innerHTML = `
        <div class="web-search-results-empty">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="M21 21l-4.35-4.35"></path>
            </svg>
            <p>${getTranslation('no_results')}</p>
        </div>
    `;
    
    if (elements.resultsCount) {
        elements.resultsCount.textContent = '';
    }
}

/**
 * Afficher les résultats de recherche
 * Affiche les résultats groupés par provider dans des tiroirs dépliables
 * @param {Object} data - Données de résultats
 */
export function displayResults(data) {
    if (!elements.resultsContainer) return;
    
    const allResults = [];
    data.providers_results.forEach(pr => {
        pr.results.forEach(r => allResults.push(r));
    });
    
    if (allResults.length === 0) {
        showEmptyResults();
        return;
    }
    
    if (elements.resultsCount) {
        elements.resultsCount.textContent = `${data.total_results} ${getTranslation('results_found')}`;
    }
    
    let html = '';
    
    data.providers_results.forEach((providerResult, index) => {
        if (providerResult.results.length === 0) return;
        
        // Premier provider ouvert par défaut
        const isOpen = index === 0;
        
        html += `
            <div class="web-search-provider-accordion ${isOpen ? 'open' : ''}">
                <button type="button" class="provider-accordion-header" aria-expanded="${isOpen}">
                    <div class="provider-accordion-info">
                        <span class="provider-accordion-name">${escapeHtml(providerResult.provider_name)}</span>
                        <span class="provider-accordion-count">${providerResult.results_count} résultat${providerResult.results_count > 1 ? 's' : ''}</span>
                    </div>
                    <svg class="provider-accordion-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </button>
                <div class="provider-accordion-content" ${isOpen ? '' : 'hidden'}>
                    <div class="provider-results-list">
                        ${providerResult.results.map(r => buildResultItem(r)).join('')}
                    </div>
                </div>
            </div>
        `;
    });
    
    elements.resultsContainer.innerHTML = html;
    
    // Ajouter les event listeners pour les tiroirs
    setupAccordionListeners();
}

/**
 * Configure les event listeners pour les accordéons de providers
 */
function setupAccordionListeners() {
    const accordionHeaders = elements.resultsContainer?.querySelectorAll('.provider-accordion-header');
    if (!accordionHeaders) return;
    
    accordionHeaders.forEach(header => {
        header.addEventListener('click', (e) => {
            e.preventDefault();
            const accordion = header.closest('.web-search-provider-accordion');
            if (!accordion) return;
            
            const content = accordion.querySelector('.provider-accordion-content');
            const isOpen = accordion.classList.contains('open');
            
            // Toggle l'état
            accordion.classList.toggle('open');
            header.setAttribute('aria-expanded', !isOpen);
            
            if (isOpen) {
                content.setAttribute('hidden', '');
            } else {
                content.removeAttribute('hidden');
            }
        });
    });
}

/**
 * Sélectionner un résultat
 * @param {string} detailUrl - URL de détail du résultat
 */
export function selectResult(detailUrl) {
    console.log('[WebSearch] selectResult called with detailUrl:', detailUrl);
    //console.log('[WebSearch] state.results:', state.results);
    
    let selectedResult = null;
    
    for (const pr of state.results) {
        //console.log('[WebSearch] Checking provider results:', pr.results.map(r => r.detailUrl));
        const found = pr.results.find(r => r.detailUrl === detailUrl);
        if (found) {
            selectedResult = found;
            break;
        }
    }
    
    //console.log('[WebSearch] selectedResult:', selectedResult);
    
    if (!selectedResult) return;
    
    showResultDetails(selectedResult);
}

/**
 * Mettre à jour l'état des boutons de recherche
 * @param {boolean} isSearching - État de recherche
 */
export function updateSearchButtonState(isSearching) {
    const t = getTranslations();
    
    if (elements.searchBtn) {
        elements.searchBtn.innerHTML = isSearching
            ? `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="6" y="6" width="12" height="12"></rect>
               </svg>
               <span>${t.stop_btn}</span>`
            : `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="M21 21l-4.35-4.35"></path>
               </svg>
               <span>${t.search_btn}</span>`;
        
        elements.searchBtn.classList.toggle('btn-danger', isSearching);
        elements.searchBtn.classList.toggle('btn-primary', !isSearching);
    }
    
    if (elements.imageSearchBtn) {
        elements.imageSearchBtn.innerHTML = isSearching
            ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="6" y="6" width="12" height="12"></rect>
               </svg>
               ${t.stop_btn}`
            : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="M21 21l-4.35-4.35"></path>
               </svg>
               ${t.search_image_btn}`;
    }
}
