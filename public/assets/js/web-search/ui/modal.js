/**
 * SnowShelf - Web Search Module
 * Construction du modal principal
 */

import { state } from '../state.js';
import { config } from '../config.js';
import { getTranslations, getTranslation, escapeHtml } from '../utils/helpers.js';
import { extractYear } from '../utils/data.js';
import { getProviderDisplayName } from '../providers.js';

/**
 * Retourne l'URL de l'image telle quelle
 * Note: Les images sont chargées directement par le navigateur.
 * Certains CDN (archive.org, ComicVine) peuvent bloquer les requêtes,
 * dans ce cas le placeholder s'affichera via onerror.
 * @param {string} url - URL originale de l'image
 * @returns {string} - URL de l'image
 */
export function getImageUrl(url) {
    return url || '';
}

/**
 * Construire le contenu HTML du modal principal
 * @returns {string} - HTML du modal
 */
export function buildModalContent() {
    const t = getTranslations();
    const userInfo = window.userInfo || { isPremium: false, isAdmin: false };
    const canUsePremium = userInfo.isPremium || userInfo.isAdmin;
    
    const selectedTypeLabel = state.types[state.selectedType] || state.types['all'];
    
    return `
        <div class="web-search-container">
            <!-- Colonne gauche : Paramètres de recherche -->
            <div class="web-search-left">
                <!-- Sélection du type -->
                <div class="web-search-section">
                    <label class="web-search-label">${t.type_label}</label>
                    <div class="ws-type-dropdown" id="wsTypeDropdown">
                        <button type="button" class="ws-type-trigger" id="wsTypeTrigger">
                            <span class="ws-type-text">${selectedTypeLabel}</span>
                            <svg class="ws-type-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="6,9 12,15 18,9"></polyline>
                            </svg>
                        </button>
                        <div class="ws-type-menu" id="wsTypeMenu">
                            ${Object.entries(state.types).map(([key, label]) => 
                                `<div class="ws-type-option ${key === state.selectedType ? 'selected' : ''}" data-value="${key}">
                                    <span class="ws-type-option-text">${label}</span>
                                    <svg class="ws-type-option-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                                        <polyline points="20,6 9,17 4,12"></polyline>
                                    </svg>
                                </div>`
                            ).join('')}
                        </div>
                    </div>
                </div>
                
                <!-- Liste des fournisseurs -->
                <div class="web-search-section">
                    <label class="web-search-label">${t.providers_label}</label>
                    <div id="wsProvidersList" class="web-search-providers">
                        <!-- Rempli dynamiquement -->
                    </div>
                </div>
                
                <!-- Recherche textuelle -->
                <div class="web-search-section">
                    <label class="web-search-label">${t.text_search_label}</label>
                    <div class="web-search-input-group">
                        <input type="text" id="wsSearchInput" class="form-control" 
                               placeholder="${t.text_search_placeholder}">
                        <button type="button" id="wsSearchBtn" class="btn btn-primary">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="11" cy="11" r="8"></circle>
                                <path d="M21 21l-4.35-4.35"></path>
                            </svg>
                            <span>${t.search_btn}</span>
                        </button>
                    </div>
                </div>
                
                <!-- Recherche par image -->
                <div class="web-search-section">
                    <label class="web-search-label">${t.image_search_label}</label>
                    <div class="web-search-image-zone" id="wsImageDropZone">
                        <input type="file" id="wsImageInput" accept="image/*" hidden>
                        <div class="web-search-image-placeholder" id="wsImagePlaceholder">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                <polyline points="21 15 16 10 5 21"></polyline>
                            </svg>
                            <span>${t.image_drop_hint}</span>
                        </div>
                        <img id="wsImagePreview" class="web-search-image-preview" hidden>
                    </div>
                    <div class="web-search-image-actions">
                        <button type="button" id="wsImageBrowseBtn" class="btn btn-sm btn-secondary">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="17 8 12 3 7 8"></polyline>
                                <line x1="12" y1="3" x2="12" y2="15"></line>
                            </svg>
                            ${t.browse_file}
                        </button>
                        <button type="button" id="wsCameraBtn" class="btn btn-sm btn-secondary" title="${t.camera_btn_title || 'Prendre une photo pour reconnaissance'}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                <circle cx="12" cy="13" r="4"></circle>
                            </svg>
                            ${t.camera_btn}
                        </button>
                        <button type="button" id="wsScanBtn" class="btn btn-sm btn-secondary" title="${t.scan_btn_title || 'Scanner un code-barres'}">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="4" width="3" height="16"></rect>
                                <rect x="8" y="4" width="1" height="16"></rect>
                                <rect x="11" y="4" width="2" height="16"></rect>
                                <rect x="15" y="4" width="1" height="16"></rect>
                                <rect x="18" y="4" width="3" height="16"></rect>
                            </svg>
                            ${t.scan_btn}
                        </button>
                        <button type="button" id="wsImageSearchBtn" class="btn btn-sm btn-primary" disabled>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="11" cy="11" r="8"></circle>
                                <path d="M21 21l-4.35-4.35"></path>
                            </svg>
                            ${t.search_image_btn}
                        </button>
                    </div>
                </div>
                
                <!-- Option utiliser la BDD SnowShelf -->
                <div class="web-search-section web-search-option">
                    <label class="web-search-toggle">
                        <span class="toggle-label">
                            ${t.use_local_db_label}
                            <span class="toggle-info" title="${t.use_local_db_tooltip}">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <path d="M12 16v-4"></path>
                                    <path d="M12 8h.01"></path>
                                </svg>
                            </span>
                        </span>
                        <div class="toggle-switch">
                            <input type="checkbox" id="wsUseLocalDb" ${state.useLocalDatabase ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </div>
                    </label>
                </div>
                
                <!-- Option auto-traduction (Premium) -->
                <div class="web-search-section web-search-option">
                    <label class="web-search-toggle ${!canUsePremium ? 'disabled' : ''}" ${!canUsePremium ? `title="${t.auto_translate_premium_hint}"` : ''}>
                        <span class="toggle-label">
                            ${t.auto_translate_label}
                            <span class="toggle-info" title="${t.auto_translate_tooltip}">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <path d="M12 16v-4"></path>
                                    <path d="M12 8h.01"></path>
                                </svg>
                            </span>
                            ${!canUsePremium ? '<span class="premium-badge">Premium</span>' : ''}
                        </span>
                        <div class="toggle-switch">
                            <input type="checkbox" id="wsAutoTranslate" ${!canUsePremium ? 'disabled' : ''} ${state.autoTranslate ? 'checked' : ''}>
                            <span class="toggle-slider"></span>
                        </div>
                    </label>
                </div>
            </div>
            
            <!-- Colonne droite : Résultats -->
            <div class="web-search-right">
                <div class="web-search-results-header">
                    <h3>${t.results_title}</h3>
                    <span id="wsResultsCount" class="web-search-results-count"></span>
                </div>
                <div id="wsResultsContainer" class="web-search-results">
                    <div class="web-search-results-empty">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <circle cx="11" cy="11" r="8"></circle>
                            <path d="M21 21l-4.35-4.35"></path>
                        </svg>
                        <p>${t.no_results_yet}</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Construire l'élément d'un fournisseur
 * @param {Object} provider - Fournisseur
 * @returns {string} - HTML du fournisseur
 */
export function buildProviderItem(provider) {
    const userInfo = window.userInfo || { isPremium: false, isAdmin: false };
    const canUsePremium = userInfo.isPremium || userInfo.isAdmin;
    const isPremiumLocked = provider.premium_only && !canUsePremium;
    
    const isActive = isPremiumLocked ? false : state.activeProviders.has(provider.id);
    
    const premiumBadge = provider.premium_only 
        ? `<span class="provider-badge premium">${isPremiumLocked ? '🔒 ' : ''}Premium</span>` 
        : '';
    const barcodeBadge = provider.supports_barcode 
        ? `<span class="provider-badge barcode" title="${getTranslation('supports_barcode')}">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 5v14"></path><path d="M8 5v14"></path><path d="M12 5v14"></path>
                <path d="M17 5v14"></path><path d="M21 5v14"></path>
            </svg>
           </span>` 
        : '';
    
    const disabledClass = isPremiumLocked ? 'disabled' : '';
    const disabledAttr = isPremiumLocked ? 'disabled' : '';
    const lockedTitle = isPremiumLocked ? `title="${getTranslation('premium_only_provider')}"` : '';
    
    return `
        <label class="web-search-provider ${isActive ? 'active' : ''} ${disabledClass}" data-provider-id="${provider.id}" ${lockedTitle}>
            <input type="checkbox" ${isActive ? 'checked' : ''} ${disabledAttr}>
            <span class="provider-name">${provider.display_name}</span>
            <span class="provider-badges">
                ${premiumBadge}
                ${barcodeBadge}
            </span>
        </label>
    `;
}

/**
 * Construire l'élément d'un résultat
 * @param {Object} result - Résultat de recherche
 * @returns {string} - HTML du résultat
 */
export function buildResultItem(result) {
    // const metadata = result.metadata || {};
    const yearValue = result.year;
    const year = yearValue ? `<span class="result-year">${extractYear(yearValue) || yearValue}</span>` : '';
    
    // Utiliser le proxy pour les images de certains domaines
    const imageUrl = getImageUrl(result.image || result.thumbnail);
    
    return `
        <div class="web-search-result" data-detail-url="${result.detailUrl}">
            <div class="result-image">
                ${imageUrl 
                    ? `<img src="${imageUrl}" alt="" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'result-no-image\\'><svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'24\\' height=\\'24\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'currentColor\\' stroke-width=\\'1.5\\'><rect x=\\'3\\' y=\\'3\\' width=\\'18\\' height=\\'18\\' rx=\\'2\\' ry=\\'2\\'></rect><circle cx=\\'8.5\\' cy=\\'8.5\\' r=\\'1.5\\'></circle><polyline points=\\'21 15 16 10 5 21\\'></polyline></svg></div>'">` 
                    : `<div class="result-no-image">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                            <polyline points="21 15 16 10 5 21"></polyline>
                        </svg>
                       </div>`
                }
            </div>
            <div class="result-info">
                <h4 class="result-title">${escapeHtml(result.name)}</h4>
                <p class="result-description">${escapeHtml(result.description || '')}</p>
                <div class="result-meta">
                    ${year}
                    <span class="result-provider">${escapeHtml(getProviderDisplayName(result.source))}</span>
                </div>
            </div>
            <div class="result-actions">
                <button type="button" class="btn btn-sm btn-primary result-select-btn" title="${getTranslation('select_result')}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                </button>
                <a href="${result.src_url}" target="_blank" class="btn btn-sm btn-secondary" title="${getTranslation('view_source')}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                </a>
            </div>
        </div>
    `;
}
