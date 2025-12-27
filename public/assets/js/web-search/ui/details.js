/**
 * SnowShelf - Web Search Module
 * Modal de détails d'un résultat
 */

import { config } from '../config.js';
import { state } from '../state.js';
import { findValueFromSources, extractYear } from '../utils/data.js';
import { escapeHtml, getTranslations, showToast } from '../utils/helpers.js';
import { getProviderDisplayName, providerHasDetails } from '../providers.js';
import { loadProductDetails as loadProductDetailsApi, loadPrimaryTypeFields } from '../api.js';
import { setupGalleryEvents, updateSelectedImagesCount, updateImageImportField } from './gallery.js';
import { handleImport } from '../import.js';
import { getImageUrl } from './modal.js';

/**
 * Obtenir le primary_type_id suggéré pour un type webapi
 * Utilise le mapping dynamique chargé depuis l'API, avec fallback sur 8 (divers)
 * @param {string} webapiType - Type webapi (toys, books, etc.)
 * @returns {number} - ID du type primaire
 */
function getSuggestedPrimaryTypeId(webapiType) {
    // Utiliser le mapping dynamique depuis l'API
    if (state.typeMapping && state.typeMapping[webapiType]) {
        return state.typeMapping[webapiType];
    }
    // Fallback sur 8 (divers)
    return 8;
}

/**
 * Obtenir le label traduit d'un type primaire
 * @param {Object|null} primaryType - Objet type primaire (avec id, name, name_fr)
 * @param {string} fallbackName - Nom de fallback si primaryType est null
 * @returns {string} - Label traduit du type
 */
function getTypeLabel(primaryType, fallbackName = 'divers') {
    const typeName = primaryType?.name || fallbackName;
    let label = primaryType?.name_fr || typeName;
    
    // Essayer la traduction dynamique
    if (typeof window.__ === 'function') {
        const translationKey = `primary_types.${typeName}`;
        const translated = window.__(translationKey);
        if (translated && translated !== translationKey && !translated.startsWith('primary_types.')) {
            label = translated;
        }
    }
    
    return label;
}

/**
 * Afficher le modal de détails d'un résultat
 * @param {Object} result - Résultat à afficher
 */
export async function showResultDetails(result) {
    const t = getTranslations();
    
    state.selectedImages = new Set();
    state.selectedInstructions = new Set();
    
    if (result.image) {
        state.selectedImages.add(result.image);
    }
    
    // Utiliser le type primaire courant ou le déduire du type webapi du résultat
    const suggestedTypeId = state.currentPrimaryTypeId || getSuggestedPrimaryTypeId(result.type);
    
    // Charger les champs spécifiques au type (avec cache)
    await loadPrimaryTypeFields(suggestedTypeId);
    
    const modalContent = buildDetailModalContent(result, suggestedTypeId);
    
    state.detailModalId = ModalManager.open({
        template: 'base',
        title: t.detail_title,
        content: modalContent,
        size: 'modal-lg',
        customClass: 'web-search-detail-modal',
        buttons: [
            { text: t.detail_cancel_btn, action: 'close', class: 'btn-secondary' },
            { text: t.detail_import_btn, action: 'import', class: 'btn-primary' }
        ],
        onOpen: (id) => {
            setupDetailModalEvents(result);
        },
        onAction: async (action, id) => {
            if (action === 'import') {
                await handleImport(result);
            }
        }
    });
}

/**
 * Construire le contenu HTML du modal de détails
 * @param {Object} result - Résultat
 * @param {number} selectedTypeId - ID du type sélectionné
 * @returns {string} - HTML du modal
 */
export function buildDetailModalContent(result, selectedTypeId) {
    const t = getTranslations();
    const selectedType = state.primaryTypes.find(pt => pt.id === selectedTypeId);
    const typeName = selectedType?.name || 'divers';
    
    // Utiliser le proxy pour les images de certains domaines
    const imageUrl = getImageUrl(result.image);
    const imageHtml = imageUrl 
        ? `<img src="${imageUrl}" alt="" class="detail-image" onerror="this.style.display='none'">`
        : `<div class="detail-no-image">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
           </div>`;
    
    const descriptionHtml = result.description 
        ? `<p class="detail-description">${escapeHtml(result.description)}</p>`
        : `<p class="detail-description muted">${t.detail_no_description}</p>`;
    
    // Obtenir le label traduit du type
    const typeLabel = getTypeLabel(selectedType, typeName);
    
    const generalFieldsHtml = buildGeneralFieldsHtml(result, t);
    const mediaFieldsHtml = buildMediaFieldsHtml(result, t);
    const typeFieldsHtml = buildTypeSpecificFieldsHtml(result, selectedTypeId, t);
    
    return `
        <div class="web-search-detail-container">
            <!-- Partie gauche : Aperçu du résultat -->
            <div class="detail-info">
                <div class="detail-image-container">
                    ${imageHtml}
                </div>
                <div class="detail-content">
                    <h3 class="detail-title">${escapeHtml(result.name)}</h3>
                    ${descriptionHtml}
                    
                    <div class="detail-source">
                        <span class="detail-provider">${escapeHtml(getProviderDisplayName(result.source))}</span>
                        <div class="detail-source-actions">
                            ${providerHasDetails(result.source) ? `
                            <button type="button" class="btn btn-sm btn-secondary" id="wsLoadDetails" title="${t.detail_load_more_title}">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="1 4 1 10 7 10"></polyline>
                                    <polyline points="23 20 23 14 17 14"></polyline>
                                    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
                                </svg>
                                ${t.detail_load_more}
                            </button>
                            ` : ''}
                            ${result.source_url ? `
                                <a href="${result.source_url}" target="_blank" rel="noopener" class="btn btn-sm btn-secondary">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                        <polyline points="15 3 21 3 21 9"></polyline>
                                        <line x1="10" y1="14" x2="21" y2="3"></line>
                                    </svg>
                                    ${t.detail_view_source}
                                </a>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Partie droite : Champs à importer -->
            <div class="detail-import">
                <div class="detail-import-section detail-type-display">
                    <h4>${t.detail_import_as}</h4>
                    <span class="detail-detected-type" data-type-id="${selectedTypeId}">${escapeHtml(typeLabel)}</span>
                </div>
                
                <div class="detail-import-section">
                    <div class="detail-import-header">
                        <h4>${t.detail_general_fields || 'Informations générales'}</h4>
                        <div class="detail-import-actions">
                            <button type="button" class="btn btn-xs btn-secondary" id="wsSelectAll">${t.detail_select_all}</button>
                            <button type="button" class="btn btn-xs btn-secondary" id="wsSelectNone">${t.detail_select_none}</button>
                        </div>
                    </div>
                    <div class="import-fields-list" id="wsImportFields">
                        ${generalFieldsHtml}
                    </div>
                </div>
                
                <div class="detail-import-section" id="wsMediaSection">
                    <h4>${t.detail_media_fields || 'Médias'}</h4>
                    <div class="import-fields-list" id="wsMediaFields">
                        ${mediaFieldsHtml}
                    </div>
                </div>
                
                <!-- La section manuels sera ajoutée ici après chargement des détails -->
                
                <div class="detail-import-section" id="wsTypeFieldsSection">
                    <h4>${t.detail_type_fields || 'Détails'} <span class="detail-type-name">(${selectedType?.name_fr || typeName})</span></h4>
                    <div class="import-fields-list" id="wsTypeFields">
                        ${typeFieldsHtml}
                    </div>
                </div>
            </div>
        </div>
    `;
}

/**
 * Construire les champs généraux
 */
function buildGeneralFieldsHtml(result, t) {
    const fields = [];
    
    const name = findValueFromSources(result, ['name']);
    fields.push(buildImportFieldItem('name', t.detail_field_name || 'Nom suggéré', name, true));
    
    const description = findValueFromSources(result, ['description']);
    fields.push(buildImportFieldItem('description', t.detail_field_description || 'Description', 
        description ? (description.length > 50 ? description.substring(0, 50) + '...' : description) : null,
        !!description));
    
    const price = findValueFromSources(result, ['pricing.price']);
    fields.push(buildImportFieldItem('price', t.detail_field_price || 'Valeur marchande', price, !!price));
    
    const barcode = findValueFromSources(result, [
        'barcode', 'upc', 'isbn', 
        'isbn_13', 'isbn_10', 'ean'
    ]);
    fields.push(buildImportFieldItem('barcode', t.detail_field_barcode || 'Code-barres', barcode, !!barcode));
    
    return fields.join('');
}

/**
 * Construire les champs médias
 */
function buildMediaFieldsHtml(result, t) {
    const fields = [];
    
    // Normaliser les images (même logique que updateDetailModalContent)
    const rawImages = result.images || result.data?.images || {};
    let imageCount = 0;
    
    if (rawImages.primary || rawImages.gallery) {
        // Format {primary, gallery}
        imageCount = (rawImages.primary ? 1 : 0) + (rawImages.gallery?.length || 0);
    } else if (rawImages.cover || rawImages.screenshots || rawImages.artworks) {
        // Format RAWG/IGDB: {cover, screenshots, artworks, background}
        const allImages = new Set();
        if (rawImages.cover) allImages.add(rawImages.cover);
        if (rawImages.screenshots) rawImages.screenshots.forEach(img => allImages.add(img));
        if (rawImages.artworks) rawImages.artworks.forEach(img => allImages.add(img));
        if (rawImages.background && rawImages.background !== rawImages.cover) allImages.add(rawImages.background);
        imageCount = allImages.size;
    } else if (Array.isArray(rawImages)) {
        // Format tableau simple
        imageCount = rawImages.length;
    } else if (result.image) {
        // Image unique
        imageCount = 1;
    }
    
    fields.push(buildImportFieldItem('images', t.detail_field_images || 'Images', 
        imageCount > 0 ? `${imageCount} image(s)` : null, 
        imageCount > 0, 'media'));
    
    const videos = result.videos || result.metadata?.videos || [];
    if (videos.length > 0) {
        fields.push(buildImportFieldItem('videos', t.detail_field_videos || 'Vidéos', 
            `${videos.length} vidéo(s)`, true, 'media'));
    }
    
    const audio = result.audio || result.metadata?.audio || [];
    if (audio.length > 0) {
        fields.push(buildImportFieldItem('audio', t.detail_field_audio || 'Audio', 
            `${audio.length} fichier(s)`, true, 'media'));
    }
    
    // Les manuels sont maintenant gérés dans une section séparée avec sélection
    
    return fields.length > 0 ? fields.join('') : `<p class="detail-no-media">${t.detail_no_media || 'Aucun média disponible'}</p>`;
}

/**
 * Construire la section des manuels avec sélection
 * @param {Object} result - Résultat de recherche
 * @param {Object} t - Traductions
 * @returns {string} - HTML de la section ou chaîne vide si pas de manuels
 */
function buildInstructionsListHtml(result, t) {
    const instructions = extractInstructions(result);
    console.log('[buildInstructionsListHtml] Manuels extraits:', instructions.length);
    
    if (!instructions || instructions.length === 0) {
        return '';
    }
    
    // Initialiser le Set des instructions sélectionnées si nécessaire
    if (!state.selectedInstructions) {
        state.selectedInstructions = new Set();
    }
    
    const instructionItems = instructions.map((manual, idx) => {
        const manualUrl = manual.pdfUrl || manual.url || '';
        const manualId = manual.id || `manual_${idx}`;
        const manualDesc = manual.description || manual.name || `Manuel ${idx + 1}`;
        const isSelected = state.selectedInstructions.has(manualUrl);
        
        return `
            <label class="detail-instruction-item ${isSelected ? 'selected' : ''}" data-url="${escapeHtml(manualUrl)}" data-id="${escapeHtml(manualId)}">
                <input type="checkbox" class="detail-instruction-checkbox" ${isSelected ? 'checked' : ''}>
                <span class="detail-instruction-name">${escapeHtml(manualDesc)}</span>
                ${manualUrl ? `<a href="${escapeHtml(manualUrl)}" target="_blank" class="detail-instruction-link" title="${t.detail_view_pdf || 'Voir le PDF'}" onclick="event.stopPropagation()">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                </a>` : ''}
            </label>
        `;
    }).join('');
    
    return `
        <div class="detail-import-section detail-instructions-section" id="wsInstructionsSection">
            <div class="detail-import-header">
                <h4>${t.detail_instructions_title || 'Manuels d\'instructions'}</h4>
                <div class="detail-import-actions">
                    <button type="button" class="btn btn-xs btn-secondary" id="wsSelectAllInstructions">
                        ${t.detail_select_all || 'Tout sélectionner'}
                    </button>
                    <span class="detail-instructions-count">
                        <span id="wsInstructionsSelectedCount">${state.selectedInstructions.size}</span> / ${instructions.length}
                    </span>
                </div>
            </div>
            <div class="detail-instructions-list" id="wsInstructionsList">
                ${instructionItems}
            </div>
        </div>
    `;
}

/**
 * Construire les champs spécifiques au type
 * Utilise les champs dynamiques chargés depuis primary_type_fields avec leurs api_keys de mapping
 * @param {Object} result - Résultat de la recherche
 * @param {number} typeId - ID du type primaire
 * @param {Object} t - Traductions
 * @returns {string} - HTML des champs
 */
export function buildTypeSpecificFieldsHtml(result, typeId, t) {
    // Récupérer les champs depuis le cache (chargés par loadPrimaryTypeFields)
    const cachedFields = state.primaryTypeFields[typeId];
    const typeFields = cachedFields?.fields || [];
    
    console.log('[WebSearch] Champs spécifiques pour le type ID', typeId, ':', typeFields);
    
    if (!typeFields || typeFields.length === 0) {
        return `<p class="detail-no-fields">${t.detail_no_type_fields || 'Aucun champ spécifique'}</p>`;
    }
    
    const fields = typeFields.map(field => {
        console.log('[WebSearch] Traitement du champ spécifique:', field);
        // Utiliser api_keys du mapping pour trouver la valeur
        const sources = field.api_keys && field.api_keys.length > 0 
            ? field.api_keys 
            : [field.field_key]; // Fallback sur le field_key

        console.log('[WebSearch] Recherche de la valeur pour le champ spécifique:', field.field_key, 'avec sources:', sources);    
        const value = findValueFromSources(result, sources);
        const displayValue = formatFieldValue(field.field_key, value);
        console.log(`[WebSearch] Champ type spécifique "${field.field_key}" - Sources:`, sources, '=> Valeur:', value);
        return buildImportFieldItem(
            `type_${field.field_key}`, 
            field.label, 
            displayValue, 
            !!value,
            'type'
        );
    });
    
    return fields.join('');
}

/**
 * Construire un élément de champ à importer
 */
function buildImportFieldItem(key, label, value, hasValue, category = 'general') {
    const disabledClass = !hasValue ? 'disabled' : '';
    const checkedAttr = hasValue ? 'checked' : 'disabled';
    const displayValue = value || '-';
    
    return `
        <label class="import-field-item ${disabledClass}" data-field="${escapeHtml(key)}" data-category="${category}">
            <input type="checkbox" ${checkedAttr}>
            <span class="import-field-label">${escapeHtml(label)}</span>
            <span class="import-field-value" title="${escapeHtml(String(displayValue))}">${escapeHtml(String(displayValue))}</span>
        </label>
    `;
}

/**
 * Formater une valeur de champ pour l'affichage
 */
function formatFieldValue(key, value) {
    if (value === null || value === undefined) return null;
    
    if (key === 'checklist' && typeof value === 'object') {
        if (value.raw) {
            return value.raw;
        } else if (Array.isArray(value.items)) {
            return `${value.items.length} images`;
        }
        return null;
    }
    
    if (key === 'special_stickers' && typeof value === 'object') {
        const parts = [];
        for (const [type, data] of Object.entries(value)) {
            if (data && typeof data === 'object') {
                const count = data.total || (Array.isArray(data.items) ? data.items.length : 0);
                if (count > 0) {
                    parts.push(`${type}: ${count}`);
                }
            } else if (data) {
                parts.push(`${type}: ${data}`);
            }
        }
        return parts.length > 0 ? parts.join(', ') : null;
    }
    
    if (key === 'year' || key === 'year_start' || key === 'year_end' || 
        key.includes('release') || key.includes('publication')) {
        const yearValue = extractYear(value);
        if (yearValue) {
            return String(yearValue);
        }
    }
    
    const strValue = String(value);
    if (strValue.length > 40) {
        return strValue.substring(0, 40) + '...';
    }
    
    return strValue;
}

/**
 * Configurer les événements du modal de détails
 */
export function setupDetailModalEvents(result) {
    state.currentDetailResult = result;
    
    document.getElementById('wsLoadDetails')?.addEventListener('click', async () => {
        await loadProductDetails(result);
    });
    
    document.getElementById('wsSelectAll')?.addEventListener('click', () => {
        document.querySelectorAll('#wsImportFields input[type="checkbox"]:not(:disabled), #wsMediaFields input[type="checkbox"]:not(:disabled), #wsTypeFields input[type="checkbox"]:not(:disabled)').forEach(cb => {
            cb.checked = true;
        });
    });
    
    document.getElementById('wsSelectNone')?.addEventListener('click', () => {
        document.querySelectorAll('#wsImportFields input[type="checkbox"]:not(:disabled), #wsMediaFields input[type="checkbox"]:not(:disabled), #wsTypeFields input[type="checkbox"]:not(:disabled)').forEach(cb => {
            cb.checked = false;
        });
    });
    
    // Les événements pour les manuels sont configurés après le chargement des détails
}

/**
 * Extraire les manuels d'un résultat de recherche
 * Les manuels peuvent être dans différents chemins selon la structure de données
 * @param {Object} result - Résultat de recherche
 * @returns {Array} - Tableau des manuels
 */
function extractInstructions(result) {
    // Chercher dans result.instructions (propagé via ...data)
    if (result.instructions?.manuals && Array.isArray(result.instructions.manuals)) {
        console.log('[extractInstructions] Trouvé dans result.instructions.manuals');
        return result.instructions.manuals;
    }
    // Chercher dans result.data.instructions (structure originale)
    if (result.data?.instructions?.manuals && Array.isArray(result.data.instructions.manuals)) {
        console.log('[extractInstructions] Trouvé dans result.data.instructions.manuals');
        return result.data.instructions.manuals;
    }
    if (result.data?.metadata?.instructions && Array.isArray(result.data.metadata.instructions)) {
        console.log('[extractInstructions] Trouvé dans result.data.metadata.instructions');
        return result.data.metadata.instructions;
    }
    if (result.metadata?.instructions && Array.isArray(result.metadata.instructions)) {
        console.log('[extractInstructions] Trouvé dans result.metadata.instructions');
        return result.metadata.instructions;
    }
    console.log('[extractInstructions] Aucun manuel trouvé. result.instructions:', result.instructions, 'result.data?.instructions:', result.data?.instructions);
    return [];
}

/**
 * Configurer les événements pour la section des manuels
 * @param {Object} result - Résultat de recherche
 */
function setupInstructionsEvents(result) {
    const instructions = extractInstructions(result);
    console.log('[setupInstructionsEvents] Manuels extraits:', instructions.length);
    if (instructions.length === 0) return;
    
    const t = getTranslations();
    
    // Bouton "Tout sélectionner" pour les manuels
    const selectAllBtn = document.getElementById('wsSelectAllInstructions');
    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', () => {
            const checkboxes = document.querySelectorAll('.detail-instruction-checkbox');
            const allSelected = state.selectedInstructions.size === instructions.length;
            
            if (allSelected) {
                state.selectedInstructions.clear();
                checkboxes.forEach(cb => {
                    cb.checked = false;
                    cb.closest('.detail-instruction-item')?.classList.remove('selected');
                });
                selectAllBtn.textContent = t.detail_select_all || 'Tout sélectionner';
            } else {
                instructions.forEach(manual => {
                    const url = manual.pdfUrl || manual.url || '';
                    if (url) state.selectedInstructions.add(url);
                });
                checkboxes.forEach(cb => {
                    cb.checked = true;
                    cb.closest('.detail-instruction-item')?.classList.add('selected');
                });
                selectAllBtn.textContent = t.detail_deselect_all || 'Tout désélectionner';
            }
            updateInstructionsSelectedCount();
        });
    }
    
    // Événements sur chaque checkbox de manuel
    document.querySelectorAll('.detail-instruction-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const item = this.closest('.detail-instruction-item');
            if (item) {
                const url = item.dataset.url;
                if (this.checked) {
                    state.selectedInstructions.add(url);
                    item.classList.add('selected');
                } else {
                    state.selectedInstructions.delete(url);
                    item.classList.remove('selected');
                }
                updateInstructionsSelectedCount();
                updateInstructionsSelectAllButton(instructions, t);
            }
        });
    });
}

/**
 * Mettre à jour le compteur de manuels sélectionnés
 */
function updateInstructionsSelectedCount() {
    const countEl = document.getElementById('wsInstructionsSelectedCount');
    if (countEl && state.selectedInstructions) {
        countEl.textContent = state.selectedInstructions.size;
    }
}

/**
 * Mettre à jour le bouton "Tout sélectionner" des manuels
 * @param {Array} instructions - Liste des manuels
 * @param {Object} t - Traductions
 */
function updateInstructionsSelectAllButton(instructions, t) {
    const btn = document.getElementById('wsSelectAllInstructions');
    if (btn && instructions) {
        const allSelected = state.selectedInstructions.size === instructions.length;
        btn.textContent = allSelected ? (t.detail_deselect_all || 'Tout désélectionner') : (t.detail_select_all || 'Tout sélectionner');
    }
}

/**
 * Mettre à jour ou créer la section des manuels après le chargement des détails
 * @param {Object} result - Résultat enrichi
 * @param {Object} t - Traductions
 */
function updateInstructionsSection(result, t) {
    const instructions = extractInstructions(result);
    console.log('[updateInstructionsSection] Manuels trouvés:', instructions.length);
    
    // Supprimer l'ancienne section si elle existe
    const existingSection = document.getElementById('wsInstructionsSection');
    if (existingSection) {
        existingSection.remove();
    }
    
    // Si pas de manuels, ne rien afficher
    if (!instructions || instructions.length === 0) {
        return;
    }
    
    // Générer le HTML de la nouvelle section
    const instructionsHtml = buildInstructionsListHtml(result, t);
    
    // Insérer après la section des médias
    const mediaSection = document.getElementById('wsMediaSection');
    if (mediaSection && instructionsHtml) {
        mediaSection.insertAdjacentHTML('afterend', instructionsHtml);
        // Réattacher les événements
        setupInstructionsEvents(result);
    }
}

/**
 * Charger les détails complets d'un produit
 */
async function loadProductDetails(result) {
    if (state.isLoadingDetails) return;
    
    const t = getTranslations();
    const loadBtn = document.getElementById('wsLoadDetails');
    
    const provider = result.source;
    const detailUrl = result.detailUrl;
    
    if (!provider || !detailUrl) {
        showToast(t.detail_load_error || 'Impossible de charger les détails', 'error');
        return;
    }
    
    state.isLoadingDetails = true;
    
    if (loadBtn) {
        loadBtn.disabled = true;
        loadBtn.innerHTML = `
            <span class="spinner-small"></span>
            ${t.detail_loading || 'Chargement...'}
        `;
    }
    
    try {
        const apiResult = await loadProductDetailsApi(provider, detailUrl);
        console.log('[WebSearch] apiResult complet:', apiResult);
        
        // Vérifier que apiResult existe et contient data
        if (!apiResult) {
            throw new Error('Aucune réponse de l\'API');
        }
        
        // Les données sont dans apiResult.data.data (double niveau data)
        const data = apiResult.data?.data || apiResult.data; // Les données brutes de l'API
        const webapiId = apiResult.webapi_id; // ID du provider pour les mappings
        
        if (!data) {
            throw new Error('Données vides dans la réponse');
        }
        
        console.log('[WebSearch] Détails reçus (data):', data);
        console.log('[WebSearch] Provider webapi_id:', webapiId);
        console.log('[WebSearch] Images reçues:', data?.images);
        console.log('[WebSearch] Instructions reçues:', data?.instructions);
        
        const enrichedResult = {
            ...result,
            ...data,
            metadata: {
                ...result.metadata,
                ...(data.metadata || {}),
            },
            source: result.source,
            webapi_id: webapiId, // Stocker pour l'import
            data: data, // Conserver les données brutes pour les mappings
        };
        
        console.log('[WebSearch] enrichedResult.instructions:', enrichedResult.instructions);
        console.log('[WebSearch] enrichedResult.data.instructions:', enrichedResult.data?.instructions);
        
        state.currentDetailResult = enrichedResult;
        updateDetailModalContent(enrichedResult);
        
        showToast(t.detail_loaded_success || 'Détails chargés avec succès', 'success');
        
    } catch (error) {
        console.error('[WebSearch] Erreur chargement détails:', error);
        showToast(error.message || t.detail_load_error || 'Erreur lors du chargement', 'error');
        
        if (loadBtn) {
            loadBtn.disabled = false;
            loadBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="1 4 1 10 7 10"></polyline>
                    <polyline points="23 20 23 14 17 14"></polyline>
                    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
                </svg>
                ${t.detail_load_more || 'Charger plus'}
            `;
        }
    } finally {
        state.isLoadingDetails = false;
    }
}

/**
 * Mettre à jour le contenu du modal après chargement des détails
 */
function updateDetailModalContent(result) {
    const t = getTranslations();
    
    // Normaliser les images depuis différents formats d'API
    // Format attendu: { primary: string, gallery: string[] }
    let images = { primary: null, gallery: [] };
    
    // Source des images brutes (peut être sur result ou result.data)
    const rawImages = result.images || result.data?.images || {};
    
    // Si déjà au format {primary, gallery}
    if (rawImages.primary || rawImages.gallery) {
        images.primary = rawImages.primary || null;
        images.gallery = rawImages.gallery || [];
    }
    // Format RAWG/IGDB: {cover, screenshots, artworks, background}
    else if (rawImages.cover || rawImages.screenshots || rawImages.artworks) {
        images.primary = rawImages.cover || rawImages.background || null;
        // Construire la galerie avec toutes les images disponibles
        const allImages = [];
        // D'abord le cover comme première image
        if (rawImages.cover) {
            allImages.push(rawImages.cover);
        }
        // Puis les screenshots
        if (rawImages.screenshots && rawImages.screenshots.length > 0) {
            allImages.push(...rawImages.screenshots);
        }
        // Puis les artworks
        if (rawImages.artworks && rawImages.artworks.length > 0) {
            allImages.push(...rawImages.artworks);
        }
        // Background seulement si différent du cover
        if (rawImages.background && rawImages.background !== rawImages.cover) {
            allImages.push(rawImages.background);
        }
        images.gallery = allImages.filter(Boolean);
    }
    // Format simple: tableau d'URLs
    else if (Array.isArray(rawImages) && rawImages.length > 0) {
        images.primary = rawImages[0];
        images.gallery = rawImages.slice(1);
    }
    // Fallback sur result.image
    else if (result.image) {
        images.primary = result.image;
    }
    
    const gallery = images.gallery || [];
    
    console.log('[WebSearch] updateDetailModalContent - result:', result);
    console.log('[WebSearch] updateDetailModalContent - rawImages:', rawImages);
    console.log('[WebSearch] updateDetailModalContent - images (normalized):', images);
    console.log('[WebSearch] updateDetailModalContent - gallery:', gallery);

    // Récupérer le type depuis l'élément affiché ou le déduire du résultat
    const typeDisplay = document.querySelector('.detail-detected-type');
    const selectedTypeId = typeDisplay ? parseInt(typeDisplay.dataset.typeId) : getSuggestedPrimaryTypeId(result.type);
    const selectedType = state.primaryTypes.find(pt => pt.id === selectedTypeId);
    const typeName = selectedType?.name || 'divers';
    
    if (!state.selectedImages) {
        state.selectedImages = new Set();
    }
    if (images.primary) {
        state.selectedImages.add(images.primary);
    }
    
    // Mettre à jour l'image et la galerie seulement si on a des images
    const imageContainer = document.querySelector('.web-search-detail-modal .detail-image-container');
    if (imageContainer && (images.primary || gallery.length > 0)) {
        let imageHtml = '';
        console.log('[WebSearch] Mise à jour de la galerie avec images.primary:', images.primary);
        if (images.primary) {
            imageHtml = `
                <div class="detail-main-image-wrapper">
                    <img src="${images.primary}" alt="" class="detail-image" id="wsMainImage">
                </div>
            `;
        }
        
        if (gallery.length > 0) {
            const mainImgUrl = images.primary || images.thumbnail || images.box_front || images.box_back || gallery[0];
            imageHtml += `
                <div class="detail-image-gallery" id="wsImageGallery">
                    ${gallery.map((img, idx) => {
                        const isActive = img === mainImgUrl;
                        const isSelected = state.selectedImages.has(img);
                        return `
                            <div class="detail-thumb-wrapper ${isSelected ? 'selected' : ''}" data-url="${img}">
                                <img src="${img}" alt="" class="detail-thumb ${isActive ? 'active' : ''}" 
                                     data-full="${img}">
                                <span class="detail-thumb-check">✓</span>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div class="detail-images-info">
                    <span class="detail-images-hint">${t.detail_images_hint || 'Clic = voir, Double-clic = sélectionner'}</span>
                    <div class="detail-images-actions">
                        <button type="button" class="btn btn-xs btn-outline" id="wsSelectAllImages">${t.detail_select_all_images || 'Tout sélectionner'}</button>
                        <span class="detail-images-count" id="wsSelectedImagesCount">${state.selectedImages.size} ${t.detail_images_selected || 'sélectionnée(s)'}</span>
                    </div>
                </div>
            `;
        }
        
        if (imageHtml) {
            imageContainer.innerHTML = imageHtml;
        }
        
        setupGalleryEvents();
        
        const selectAllBtn = document.getElementById('wsSelectAllImages');
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', () => {
                const allSelected = state.selectedImages.size === gallery.length;
                if (allSelected) {
                    state.selectedImages.clear();
                    if (result.image) {
                        state.selectedImages.add(result.image);
                    }
                    selectAllBtn.textContent = t.detail_select_all_images || 'Tout sélectionner';
                } else {
                    gallery.forEach(img => state.selectedImages.add(img));
                    selectAllBtn.textContent = t.detail_deselect_all_images || 'Tout désélectionner';
                }
                document.querySelectorAll('.detail-thumb-wrapper').forEach(wrapper => {
                    const url = wrapper.dataset.url;
                    wrapper.classList.toggle('selected', state.selectedImages.has(url));
                });
                updateSelectedImagesCount();
                updateImageImportField();
            });
        }
    }
    
    // Récupérer les données (depuis result directement ou result.data)
    const donnee = result.data || result;
    
    // Mettre à jour le titre et la description
    const titleEl = document.querySelector('.web-search-detail-modal .detail-title');
    if (titleEl && donnee.name) {
        titleEl.textContent = donnee.name;
    }
    
    const descEl = document.querySelector('.web-search-detail-modal .detail-description');
    if (descEl) {
        if (donnee.description) {
            descEl.textContent = donnee.description;
            descEl.classList.remove('muted');
        } else {
            descEl.textContent = t.detail_no_description;
            descEl.classList.add('muted');
        }
    }
    
    // Mettre à jour les sections
    const generalFieldsContainer = document.getElementById('wsImportFields');
    if (generalFieldsContainer) {
        generalFieldsContainer.innerHTML = buildGeneralFieldsHtml(donnee, t);
    }
    
    const mediaFieldsContainer = document.getElementById('wsMediaFields');
    if (mediaFieldsContainer) {
        mediaFieldsContainer.innerHTML = buildMediaFieldsHtml(result, t);
    }
    
    const typeFieldsContainer = document.getElementById('wsTypeFields');
    if (typeFieldsContainer) {
        typeFieldsContainer.innerHTML = buildTypeSpecificFieldsHtml(result, selectedTypeId, t);
    }
    
    const typeNameLabel = document.querySelector('.detail-type-name');
    if (typeNameLabel) {
        typeNameLabel.textContent = `(${selectedType?.name_fr || typeName})`;
    }
    
    // Mettre à jour la section des manuels (ou l'ajouter si elle n'existe pas)
    updateInstructionsSection(result, t);
    
    // Mettre à jour le bouton de chargement
    const loadBtn = document.getElementById('wsLoadDetails');
    if (loadBtn) {
        loadBtn.disabled = true;
        loadBtn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
            ${t.detail_loaded || 'Détails chargés'}
        `;
        loadBtn.classList.add('btn-success');
        loadBtn.classList.remove('btn-secondary');
    }
}
