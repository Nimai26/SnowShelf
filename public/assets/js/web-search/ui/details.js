/**
 * SnowShelf - Web Search Module
 * Modal de détails d'un résultat
 */

import { config } from '../config.js';
import { state } from '../state.js';
import { findValueFromSources, extractYear, getValueFromPath } from '../utils/data.js';
import { escapeHtml, getTranslations, showToast } from '../utils/helpers.js';
import { getProviderDisplayName, providerHasDetails } from '../providers.js';
import { loadProductDetails as loadProductDetailsApi, loadPrimaryTypeFields } from '../api.js';
import { setupGalleryEvents, updateSelectedImagesCount, updateImageImportField, updateSelectAllButtonLabel } from './gallery.js';
import { handleImport } from '../import.js';
import { getImageUrl } from './modal.js';
import { fetchFieldMappings, applyMapping, extractValueByPath, applyTransform } from '../../collection/import.js';

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
    //console.log('[WebSearch] Affichage des détails pour le résultat:', result);
    state.selectedImages = new Set();
    state.selectedInstructions = new Set();
    
    if (result.image) {
        state.selectedImages.add(result.image);
    }
    
    // Utiliser le type primaire courant ou le déduire du type webapi du résultat
    const suggestedTypeId = state.currentPrimaryTypeId || getSuggestedPrimaryTypeId(result.type);
    
    // Charger les champs spécifiques au type (avec cache)
    await loadPrimaryTypeFields(suggestedTypeId);
    
    // Charger les mappings de champs fixes si pas encore en cache
    if (!state.fieldMappings || state.fieldMappings.length === 0) {
        try {
            // Les mappings sont génériques (pas par provider), on utilise webapi_id=1
            state.fieldMappings = await fetchFieldMappings(1);
        } catch (e) {
            console.warn('[WebSearch] Impossible de charger les field mappings');
            state.fieldMappings = [];
        }
    }
    
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
        onOpen: async (id) => {
            setupDetailModalEvents(result);
            
            // Auto-charger les détails si le provider le supporte
            if (providerHasDetails(result.source) && result.detailUrl) {
                await loadProductDetails(result);
            }
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
    
    // Fonction pour valider qu'une URL pointe vers une vraie image
    const isValidImageUrl = (url) => {
        if (!url || typeof url !== 'string') return false;
        const cleanedUrl = url.replace(/\\\//g, '/').trim();
        if (cleanedUrl.endsWith('/')) return false;
        const lastSlashIdx = cleanedUrl.lastIndexOf('/');
        if (lastSlashIdx === -1) return false;
        const filename = cleanedUrl.substring(lastSlashIdx + 1);
        return filename.length > 0 && (filename.includes('.') || filename.length > 10);
    };
    
    // Wrapper le résultat pour que les chemins BDD fonctionnent (data.xxx)
    const wrappedResult = {
        data: result,
        ...result
    };
    
    // Extraire le nom via mapping BDD
    let resultName = 'Sans nom';
    const nameMapping = state.fieldMappings?.find(m => m.item_field === 'name');
    if (nameMapping && nameMapping.api_path) {
        let extractedName = applyMapping(wrappedResult, nameMapping);
        // Gérer les objets de traduction
        if (extractedName && typeof extractedName === 'object' && extractedName.text) {
            extractedName = extractedName.text;
        }
        if (extractedName) {
            resultName = extractedName;
        }
    }
    
    // Extraire la description via mapping BDD
    let descriptionText = '';
    const descMapping = state.fieldMappings?.find(m => m.item_field === 'description');
    if (descMapping && descMapping.api_path) {
        let extractedDesc = applyMapping(wrappedResult, descMapping);
        // Gérer les objets de traduction
        if (extractedDesc && typeof extractedDesc === 'object' && extractedDesc.text) {
            extractedDesc = extractedDesc.text;
        }
        if (extractedDesc) {
            descriptionText = extractedDesc;
        }
    }
    
    // Utiliser le proxy pour les images de certains domaines (seulement si URL valide)
    const imageUrl = isValidImageUrl(result.image) ? getImageUrl(result.image) : null;
    const imageHtml = imageUrl 
        ? `<img src="${imageUrl}" alt="" class="detail-image" onerror="this.style.display='none'">`
        : `<div class="detail-no-image">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
           </div>`;
    
    const descriptionHtml = descriptionText 
        ? `<p class="detail-description">${escapeHtml(descriptionText)}</p>`
        : `<p class="detail-description muted">${t.detail_no_description}</p>`;
    
    // Obtenir le label traduit du type
    const typeLabel = getTypeLabel(selectedType, typeName);
    
    // Les champs généraux seront mis à jour via updateDetailModalContent avec les mappings BDD
    // Pour l'affichage initial, utiliser une version simplifiée
    const generalFieldsHtml = buildInitialGeneralFieldsHtml(result, t);
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
                    <h3 class="detail-title">${escapeHtml(resultName)}</h3>
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
 * Construire les champs généraux pour l'affichage INITIAL (avant chargement des détails)
 * Utilise les mappings BDD chargés dans state.fieldMappings
 * @param {Object} result - Données du résultat
 * @param {Object} t - Traductions
 * @returns {string} HTML des champs généraux
 */
function buildInitialGeneralFieldsHtml(result, t) {
    // Utiliser les mappings BDD déjà chargés dans state
    // Note: Pour l'affichage initial, result n'a pas encore result.data
    // donc on doit wrapper les données pour que les chemins BDD fonctionnent
    const wrappedResult = {
        data: result,
        ...result
    };
    
    return buildGeneralFieldsHtmlWithMappings(wrappedResult, t, state.fieldMappings || []);
}

/**
 * Construire les champs généraux en utilisant les mappings de la BDD
 * @param {Object} result - Données du résultat
 * @param {Object} t - Traductions
 * @param {number|null} webapiId - ID du provider (pour charger les mappings)
 * @returns {Promise<string>} HTML des champs généraux
 */
async function buildGeneralFieldsHtml(result, t, webapiId = null) {
    // Charger les mappings depuis la BDD si webapiId disponible
    let fieldMappings = [];
    if (webapiId) {
        try {
            fieldMappings = await fetchFieldMappings(webapiId);
        } catch (e) {
            console.warn('[WebSearch] Impossible de charger les mappings, utilisation des fallbacks');
        }
    }
    
    return buildGeneralFieldsHtmlWithMappings(result, t, fieldMappings);
}

/**
 * Construire les champs généraux avec des mappings déjà chargés (version sync)
 * @param {Object} result - Données du résultat
 * @param {Object} t - Traductions
 * @param {Array} fieldMappings - Mappings déjà chargés depuis item_field_mappings
 * @returns {string} HTML des champs généraux
 */
function buildGeneralFieldsHtmlWithMappings(result, t, fieldMappings = []) {
    const fields = [];
    
    // Labels des champs fixes
    const fieldLabels = {
        name: t.detail_field_name || 'Nom suggéré',
        description: t.detail_field_description || 'Description',
        value: t.detail_field_price || 'Valeur marchande',
        code_barre: t.detail_field_barcode || 'Code-barres'
    };
    
    // Construire un map pour accès rapide : item_field -> mapping
    const mappingsByField = {};
    for (const mapping of fieldMappings) {
        mappingsByField[mapping.item_field] = mapping;
    }
    
    // Traiter chaque champ fixe
    for (const itemField of ['name', 'description', 'value', 'code_barre']) {
        const mapping = mappingsByField[itemField];
        let value = null;
        
        if (mapping && mapping.api_path) {
            // Utiliser le mapping de la BDD
            value = applyMapping(result, mapping);
        }
        
        // Gérer les objets de traduction {text: "...", translated: bool}
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            value = value.text || null;
        }
        
        // Formater la valeur pour l'affichage
        let displayValue = value;
        if (itemField === 'description' && value && typeof value === 'string' && value.length > 50) {
            displayValue = value.substring(0, 50) + '...';
        }
        
        const hasValue = value !== null && value !== undefined && value !== '';
        
        // Le nom est toujours coché par défaut
        const defaultChecked = itemField === 'name' ? true : hasValue;
        
        fields.push(buildImportFieldItem(itemField, fieldLabels[itemField], displayValue, defaultChecked));
    }
    
    return fields.join('');
}

/**
 * Construire les champs médias
 */
function buildMediaFieldsHtml(result, t) {
    const fields = [];
    
    // Fonction utilitaire pour extraire l'URL d'un élément
    const extractUrl = (item) => {
        if (!item) return null;
        if (typeof item === 'string') return item;
        if (typeof item === 'object' && item.url) return item.url;
        return null;
    };
    
    // Fonction pour valider qu'une URL pointe vers une vraie image
    const isValidImageUrl = (url) => {
        if (!url || typeof url !== 'string') return false;
        const cleanedUrl = url.replace(/\\\//g, '/').trim();
        if (cleanedUrl.endsWith('/')) return false;
        const lastSlashIdx = cleanedUrl.lastIndexOf('/');
        if (lastSlashIdx === -1) return false;
        const filename = cleanedUrl.substring(lastSlashIdx + 1);
        return filename.length > 0 && (filename.includes('.') || filename.length > 10);
    };
    
    // Normaliser les images (même logique que updateDetailModalContent)
    const rawImages = result.images || result.data?.images || {};
    let imageCount = 0;
    
    if (rawImages.primary || rawImages.gallery) {
        // Format {primary, gallery}
        const validPrimary = rawImages.primary && isValidImageUrl(rawImages.primary) ? 1 : 0;
        const validGallery = (rawImages.gallery || []).filter(img => isValidImageUrl(extractUrl(img))).length;
        imageCount = validPrimary + validGallery;
    } else if (rawImages.cover || rawImages.screenshots || rawImages.artworks) {
        // Format RAWG/IGDB: {cover, screenshots, artworks, background}
        const allImages = new Set();
        if (rawImages.cover && isValidImageUrl(rawImages.cover)) allImages.add(rawImages.cover);
        if (rawImages.screenshots) rawImages.screenshots.forEach(img => {
            const url = extractUrl(img);
            if (url && isValidImageUrl(url)) allImages.add(url);
        });
        if (rawImages.artworks) rawImages.artworks.forEach(img => {
            const url = extractUrl(img);
            if (url && isValidImageUrl(url)) allImages.add(url);
        });
        if (rawImages.background && rawImages.background !== rawImages.cover && isValidImageUrl(rawImages.background)) {
            allImages.add(rawImages.background);
        }
        imageCount = allImages.size;
    } else if (Array.isArray(rawImages)) {
        // Format tableau (strings ou objets)
        imageCount = rawImages.filter(img => {
            const url = extractUrl(img);
            return url && isValidImageUrl(url);
        }).length;
    } else if (result.image && isValidImageUrl(result.image)) {
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
    //console.log('[buildInstructionsListHtml] Manuels extraits:', instructions.length);
    
    if (!instructions || instructions.length === 0) {
        return '';
    }
    
    // Initialiser le Set des instructions sélectionnées si nécessaire
    if (!state.selectedInstructions) {
        state.selectedInstructions = new Set();
    }
    
    // Pré-sélectionner toutes les instructions par défaut (si pas encore sélectionnées)
    // Cela permet d'importer automatiquement les manuels disponibles
    if (state.selectedInstructions.size === 0) {
        instructions.forEach(manual => {
            const url = manual.pdfUrl || manual.url || '';
            if (url) state.selectedInstructions.add(url);
        });
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
    // Le cache contient directement un tableau de champs (pas un objet avec .fields)
    const typeFields = Array.isArray(cachedFields) ? cachedFields : (cachedFields?.fields || []);
    
    if (!typeFields || typeFields.length === 0) {
        return `<p class="detail-no-fields">${t.detail_no_type_fields || 'Aucun champ spécifique'}</p>`;
    }
    
    const fields = typeFields.map(field => {
        // Pour les champs de type tracklist ou array, préserver le tableau d'objets
        const preserveArray = field.field_type === 'tracklist' || field.field_type === 'array';
        
        // Utiliser les mappings avec transformations si disponibles
        let value = null;
        
        if (field.mappings && field.mappings.length > 0) {
            // Parcourir les mappings par priorité (déjà triés)
            for (const mapping of field.mappings) {
                const sources = mapping.api_keys || [];
                if (sources.length === 0) continue;
                
                // Trouver la valeur brute avec les sources (utiliser extractValueByPath pour supporter [*])
                let rawValue = null;
                for (const source of sources) {
                    // Essayer avec et sans préfixe 'data.'
                    rawValue = extractValueByPath(result, source);
                    if (rawValue === undefined && source.startsWith('data.')) {
                        rawValue = extractValueByPath(result, source.substring(5));
                    }
                    if (rawValue === undefined && !source.startsWith('data.')) {
                        rawValue = extractValueByPath(result, 'data.' + source);
                    }
                    if (rawValue !== undefined && rawValue !== null && rawValue !== '') {
                        break;
                    }
                }
                
                if (rawValue !== null && rawValue !== undefined && rawValue !== '') {
                    // Appliquer la transformation si définie
                    if (mapping.transform_type && mapping.transform_type !== 'none') {
                        value = applyTransform(rawValue, mapping.transform_type, mapping.transform_config);
                    } else if (!preserveArray && Array.isArray(rawValue)) {
                        // Transformation par défaut pour les tableaux : joindre les noms
                        value = rawValue.map(item => {
                            if (item && typeof item === 'object') {
                                return item.name || item.label || item.title || JSON.stringify(item);
                            }
                            return String(item);
                        }).filter(v => v).join(', ');
                    } else {
                        value = rawValue;
                    }
                    break; // Arrêter dès qu'on a une valeur
                }
            }
        }
        
        // Fallback sur l'ancien comportement si pas de mappings ou valeur non trouvée
        if (value === null) {
            const sources = field.api_keys && field.api_keys.length > 0 
                ? field.api_keys 
                : [field.field_key];
            value = findValueFromSources(result, sources, { preserveArray });
        }
        
        const displayValue = formatFieldValue(field.field_key, value);
        // Vérifier si la valeur existe (inclut les booléens false et les nombres 0)
        const hasValue = value !== null && value !== undefined && value !== '';
        //console.log(`[WebSearch] Champ type spécifique "${field.field_key}" - Valeur:`, value, '=> hasValue:', hasValue);
        return buildImportFieldItem(
            `type_${field.field_key}`, 
            field.label, 
            displayValue, 
            hasValue,
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
    // Gérer les booléens et 0 comme valeurs valides
    const displayValue = (value !== null && value !== undefined && value !== '') ? value : '-';
    
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
    
    // Checklist : nouveau format API avec total, range, items, totalWithSpecials
    if (key === 'checklist' && typeof value === 'object') {
        if (value.range) {
            // Nouveau format avec totalWithSpecials
            const total = value.total || 0;
            const totalWithSpecials = value.totalWithSpecials || total;
            if (totalWithSpecials > total) {
                return `${value.range} (${total} + ${totalWithSpecials - total} spéciales)`;
            }
            return `${value.range} (${total} images)`;
        } else if (value.raw) {
            return value.raw;
        } else if (Array.isArray(value.items)) {
            return `${value.items.length} images`;
        }
        return null;
    }
    
    // Special stickers : nouveau format API = tableau d'objets [{type, type_original, total, items}]
    if (key === 'special_stickers') {
        const parts = [];
        
        // Nouveau format : tableau d'objets
        if (Array.isArray(value)) {
            for (const special of value) {
                if (special && typeof special === 'object') {
                    const label = special.type_original || special.type || 'Spéciales';
                    const count = special.total || (Array.isArray(special.items) ? special.items.length : 0);
                    if (count > 0) {
                        parts.push(`${label}: ${count}`);
                    }
                }
            }
        }
        // Ancien format : objet {type: {items, total, raw}}
        else if (typeof value === 'object') {
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
        }
        
        return parts.length > 0 ? parts.join(', ') : null;
    }
    
    // Tracklist : afficher le nombre de pistes
    if ((key === 'tracklist' || key === 'tracks') && Array.isArray(value)) {
        const trackCount = value.length;
        // Calculer la durée totale si disponible
        let totalSeconds = 0;
        value.forEach(t => {
            if (t.duration_seconds) totalSeconds += t.duration_seconds;
        });
        if (totalSeconds > 0) {
            const mins = Math.floor(totalSeconds / 60);
            return `${trackCount} piste${trackCount > 1 ? 's' : ''} (${mins} min)`;
        }
        return `${trackCount} piste${trackCount > 1 ? 's' : ''}`;
    }
    
    // Image list (minifigs, personnages, etc.) : afficher le nombre d'éléments
    if (key.includes('_list') && Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
        const count = value.length;
        // Calculer le total avec quantités
        let totalQty = 0;
        value.forEach(item => {
            totalQty += (item.quantity || 1);
        });
        const label = key.includes('minifig') ? 'minifigurine' : 'élément';
        const labelPlural = key.includes('minifig') ? 'minifigurines' : 'éléments';
        if (totalQty !== count) {
            return `${totalQty} ${totalQty > 1 ? labelPlural : label} (${count} unique${count > 1 ? 's' : ''})`;
        }
        return `${count} ${count > 1 ? labelPlural : label}`;
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
    
    // Le bouton devient "Actualiser" après le premier chargement (géré dans updateDetailModalContent)
    document.getElementById('wsLoadDetails')?.addEventListener('click', async () => {
        // Toujours forcer le refresh quand on clique sur le bouton (car il devient "Actualiser")
        await loadProductDetails(result, true);
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
    
    // Format Playmobil : objet unique avec url et available
    // Structure: { productId, available, url, format, source }
    const playmobilInstr = result.instructions || result.data?.instructions;
    console.log('[extractInstructions] Vérification format Playmobil:', playmobilInstr);
    if (playmobilInstr && playmobilInstr.available && playmobilInstr.url) {
        console.log('[extractInstructions] Format Playmobil détecté:', playmobilInstr);
        return [{
            id: playmobilInstr.productId || 'manual_1',
            name: `Manuel ${playmobilInstr.format || 'PDF'}`,
            description: `Instructions ${playmobilInstr.source || 'officielles'}`,
            url: playmobilInstr.url,
            pdfUrl: playmobilInstr.url,
            format: playmobilInstr.format || 'PDF'
        }];
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
    //console.log('[setupInstructionsEvents] Manuels extraits:', instructions.length);
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
    console.log('[updateInstructionsSection] Manuels trouvés:', instructions.length, instructions);
    
    // Supprimer l'ancienne section si elle existe
    const existingSection = document.getElementById('wsInstructionsSection');
    if (existingSection) {
        console.log('[updateInstructionsSection] Suppression ancienne section');
        existingSection.remove();
    }
    
    // Si pas de manuels, ne rien afficher
    if (!instructions || instructions.length === 0) {
        console.log('[updateInstructionsSection] Pas de manuels, sortie');
        return;
    }
    
    // Générer le HTML de la nouvelle section
    const instructionsHtml = buildInstructionsListHtml(result, t);
    console.log('[updateInstructionsSection] HTML généré:', instructionsHtml ? 'OK' : 'VIDE');
    
    // Insérer après la section des médias
    const mediaSection = document.getElementById('wsMediaSection');
    console.log('[updateInstructionsSection] mediaSection trouvé:', !!mediaSection);
    if (mediaSection && instructionsHtml) {
        mediaSection.insertAdjacentHTML('afterend', instructionsHtml);
        console.log('[updateInstructionsSection] Section insérée dans le DOM');
        // Réattacher les événements
        setupInstructionsEvents(result);
    } else {
        console.warn('[updateInstructionsSection] Impossible d\'insérer la section:', { mediaSection: !!mediaSection, instructionsHtml: !!instructionsHtml });
    }
}

/**
 * Charger les détails complets d'un produit
 * @param {Object} result - Résultat de recherche
 * @param {boolean} forceRefresh - Si true, ignore le cache et force un rechargement
 */
async function loadProductDetails(result, forceRefresh = false) {
    if (state.isLoadingDetails) return;
    
    const t = getTranslations();
    const detailsBtn = document.getElementById('wsLoadDetails');
    
    const provider = result.source;
    const detailUrl = result.detailUrl;
    
    if (!provider || !detailUrl) {
        showToast(t.detail_load_error || 'Impossible de charger les détails', 'error');
        return;
    }
    
    // Clé unique pour le cache
    const cacheKey = `${provider}:${detailUrl}`;
    
    // Vérifier le cache si pas de forceRefresh
    if (!forceRefresh && state.cachedDetails[cacheKey]) {
        console.log('[WebSearch] Utilisation des données en cache pour:', cacheKey);
        const cachedData = state.cachedDetails[cacheKey];
        state.currentDetailResult = cachedData;
        await updateDetailModalContent(cachedData, true); // true = fromCache
        return;
    }
    
    state.isLoadingDetails = true;
    
    if (detailsBtn) {
        detailsBtn.disabled = true;
        detailsBtn.innerHTML = `
            <span class="spinner-small"></span>
            ${t.detail_loading || 'Chargement...'}
        `;
    }
    
    try {
        const apiResult = await loadProductDetailsApi(provider, detailUrl);
        //console.log('[WebSearch] apiResult complet:', apiResult);
        
        // Vérifier que apiResult existe et contient data
        if (!apiResult) {
            throw new Error('Aucune réponse de l\'API');
        }
        
        // Structure de la réponse:
        // apiResult = { data: responseFromToysApi, webapi_id: 33, provider: "deezer" }
        // responseFromToysApi = { success: true, provider: "music", id: "...", data: {...album avec tracks...}, meta: {...} }
        // Donc les vraies données sont dans apiResult.data.data
        console.log('[WebSearch] apiResult.data:', apiResult.data);
        
        // Extraire les données de l'album (peuvent être à différents niveaux selon la structure)
        let data = apiResult.data;
        // Si la réponse contient un niveau "data" supplémentaire (structure toys_api)
        if (data && typeof data === 'object' && data.data && typeof data.data === 'object') {
            data = data.data;
        }
        
        const webapiId = apiResult.webapi_id; // ID du provider pour les mappings
        
        console.log('[WebSearch] Données extraites:', data);
        console.log('[WebSearch] webapi_id:', webapiId);
        
        if (!data) {
            throw new Error('Données vides dans la réponse');
        }
        
        console.log('[WebSearch] Détails reçus (data):', data);
        //console.log('[WebSearch] Provider webapi_id:', webapiId);
        //console.log('[WebSearch] Images reçues:', data?.images);
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
        
        // Mettre en cache
        state.cachedDetails[cacheKey] = enrichedResult;
        
        state.currentDetailResult = enrichedResult;
        await updateDetailModalContent(enrichedResult, false); // false = pas du cache
        
        showToast(t.detail_loaded_success || 'Détails chargés avec succès', 'success');
        
    } catch (error) {
        console.error('[WebSearch] Erreur chargement détails:', error);
        showToast(error.message || t.detail_load_error || 'Erreur lors du chargement', 'error');
        
        if (detailsBtn) {
            detailsBtn.disabled = false;
            detailsBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="1 4 1 10 7 10"></polyline>
                    <polyline points="23 20 23 14 17 14"></polyline>
                    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
                </svg>
                ${t.detail_retry || 'Réessayer'}
            `;
        }
    } finally {
        state.isLoadingDetails = false;
    }
}

/**
 * Mettre à jour le contenu du modal après chargement des détails
 * @param {Object} result - Résultat enrichi avec webapi_id
 * @param {boolean} fromCache - Si true, les données viennent du cache
 */
async function updateDetailModalContent(result, fromCache = false) {
    const t = getTranslations();
    const webapiId = result.webapi_id || null;
    
    // Mettre à jour le bouton "Charger" -> "Actualiser" avec indicateur cache
    const loadBtn = document.getElementById('wsLoadDetails');
    if (loadBtn) {
        loadBtn.disabled = false;
        if (fromCache) {
            // Données du cache : afficher "Actualiser" avec badge cache
            loadBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="1 4 1 10 7 10"></polyline>
                    <polyline points="23 20 23 14 17 14"></polyline>
                    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
                </svg>
                ${t.detail_refresh || 'Actualiser'}
            `;
            loadBtn.title = t.detail_from_cache || 'Données en cache - Cliquez pour actualiser';
            loadBtn.classList.add('has-cache-indicator');
        } else {
            // Données fraîches : afficher "Actualiser" sans badge
            loadBtn.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="1 4 1 10 7 10"></polyline>
                    <polyline points="23 20 23 14 17 14"></polyline>
                    <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
                </svg>
                ${t.detail_refresh || 'Actualiser'}
            `;
            loadBtn.title = t.detail_refresh_title || 'Recharger les détails depuis l\'API';
            loadBtn.classList.remove('has-cache-indicator');
        }
    }
    
    // Fonction utilitaire pour nettoyer les URLs des échappements JSON
    const cleanUrl = (url) => {
        if (!url || typeof url !== 'string') return null;
        return url.replace(/\\\//g, '/').trim();
    };
    
    /**
     * Normalise une URL d'image pour la comparaison (détection de doublons)
     * Supporte Amazon, TMDB, IGDB et autres patterns
     * @param {string} url - URL à normaliser
     * @returns {string} - Clé de comparaison normalisée
     */
    const normalizeImageUrlForComparison = (url) => {
        if (!url || typeof url !== 'string') return '';
        const cleaned = cleanUrl(url);
        if (!cleaned) return '';
        
        // Pattern Amazon: /images/I/{ID}._{SIZE_PARAMS}.jpg
        const amazonMatch = cleaned.match(/\/images\/I\/([A-Za-z0-9+%-]+)\._[^/]+$/);
        if (amazonMatch) {
            return `amazon:${amazonMatch[1]}`;
        }
        
        // Pattern TMDB: https://image.tmdb.org/t/p/w500/abc123.jpg
        const tmdbMatch = cleaned.match(/image\.tmdb\.org\/t\/p\/[^/]+\/([^/]+)$/);
        if (tmdbMatch) {
            return `tmdb:${tmdbMatch[1]}`;
        }
        
        // Pattern IGDB: https://images.igdb.com/igdb/image/upload/t_cover_big/abc123.jpg
        const igdbMatch = cleaned.match(/images\.igdb\.com\/[^/]+\/[^/]+\/[^/]+\/t_[^/]+\/([^/]+)$/);
        if (igdbMatch) {
            return `igdb:${igdbMatch[1]}`;
        }
        
        // Pattern Lulu-Berlu et sites similaires: image-{ID}-{taille}.jpg
        const luluberluMatch = cleaned.match(/image-(\d+)-(?:mini|petite|moyenne|grande|original)\.(?:jpg|png|webp)/i);
        if (luluberluMatch) {
            const baseNameMatch = cleaned.match(/\/([^/]+)-p-image-\d+/);
            const baseName = baseNameMatch ? baseNameMatch[1].substring(0, 30) : '';
            return `luluberlu:${baseName}:${luluberluMatch[1]}`;
        }
        
        // Pattern générique avec suffixes de taille textuels
        const genericSizeMatch = cleaned.match(/\/([^/]+?)[-_](mini|small|thumb|petite|medium|moyenne|large|grande|big|xl|xxl|original|hd|full)\.(?:jpg|jpeg|png|webp|gif)/i);
        if (genericSizeMatch) {
            return `generic:${genericSizeMatch[1].toLowerCase()}`;
        }
        
        // Pattern générique avec dimensions numériques (ex: image_250x250.webp, image_470x246.webp)
        // Extrait le nom de base avant les dimensions pour regrouper les variantes
        const dimensionSuffixMatch = cleaned.match(/\/([^/]+?)[-_](\d{2,4})x(\d{2,4})\.(?:jpg|jpeg|png|webp|gif)/i);
        if (dimensionSuffixMatch) {
            return `imgbase:${dimensionSuffixMatch[1].toLowerCase()}`;
        }
        
        // Pattern pour images sans dimensions explicites mais même nom de base
        // Ex: image.webp vs image_250x250.webp - on extrait le nom sans extension
        // Ce pattern utilise le même préfixe 'imgbase:' pour grouper avec les images dimensionnées
        const baseNameMatch = cleaned.match(/\/([^/]+?)\.(?:jpg|jpeg|png|webp|gif)$/i);
        if (baseNameMatch) {
            return `imgbase:${baseNameMatch[1].toLowerCase()}`;
        }
        
        // Pour les autres URLs, utiliser l'URL complète nettoyée
        return cleaned.toLowerCase();
    };
    
    /**
     * Extrait la taille d'une URL d'image (tous providers)
     * Supporte: Amazon, TMDB, IGDB, paramètres URL génériques
     * @param {string} url - URL de l'image
     * @returns {number} - Taille en pixels (0 si non trouvée)
     */
    const getImageSize = (url) => {
        if (!url || typeof url !== 'string') return 0;
        
        // === Amazon ===
        const amazonMatch = url.match(/[._](SL|UX|UY|SS|SX|SY)(\d+)[._]/i);
        if (amazonMatch) {
            return parseInt(amazonMatch[2], 10);
        }
        const amazonAltMatch = url.match(/_(?:AC_)?(?:SL|UX|UY|SS|SX|SY)(\d+)_/i);
        if (amazonAltMatch) {
            return parseInt(amazonAltMatch[1], 10);
        }
        
        // === TMDB ===
        const tmdbMatch = url.match(/\/w(\d+)\//i);
        if (tmdbMatch) {
            return parseInt(tmdbMatch[1], 10);
        }
        if (url.includes('/original/')) {
            return 10000;
        }
        
        // === IGDB ===
        const igdbSizes = {
            't_thumb': 90, 't_micro': 35, 't_cover_small': 90, 't_cover_big': 264,
            't_logo_med': 284, 't_screenshot_med': 569, 't_screenshot_big': 889,
            't_screenshot_huge': 1280, 't_720p': 720, 't_1080p': 1080
        };
        for (const [pattern, size] of Object.entries(igdbSizes)) {
            if (url.includes(pattern)) return size;
        }
        
        // === Paramètres URL génériques ===
        const paramMatch = url.match(/[?&](width|w|size|height|h)=(\d+)/i);
        if (paramMatch) {
            return parseInt(paramMatch[2], 10);
        }
        
        // === Dimensions dans le nom de fichier ===
        // Ex: image_250x250.webp, image_470x246.webp
        const dimensionMatch = url.match(/[_-](\d{2,4})x(\d{2,4})\./i);
        if (dimensionMatch) {
            return Math.max(parseInt(dimensionMatch[1], 10), parseInt(dimensionMatch[2], 10));
        }
        
        // === Suffixes de taille textuels (Lulu-Berlu, etc.) ===
        const textSizes = {
            'mini': 50, 'thumb': 80, 'small': 100, 'petite': 100,
            'medium': 300, 'moyenne': 300,
            'large': 600, 'grande': 600, 'big': 600,
            'xl': 800, 'xxl': 1000, 'hd': 1080, 'full': 1200, 'original': 2000
        };
        for (const [suffix, size] of Object.entries(textSizes)) {
            if (url.toLowerCase().includes(`-${suffix}.`) || url.toLowerCase().includes(`_${suffix}.`)) {
                return size;
            }
        }
        
        // === Images sans suffixe de taille ===
        // Si l'URL ne contient pas de suffixe de taille, c'est probablement l'image originale
        // On lui donne une taille élevée par défaut (mais pas maximale pour ne pas écraser les originaux explicites)
        const hasNoSizeSuffix = !url.match(/[_-](\d{2,4})x(\d{2,4})\./i) &&
                                !url.match(/[_-](mini|small|thumb|petite|medium|moyenne|large|grande|big|xl|xxl|original|hd|full)\./i);
        if (hasNoSizeSuffix) {
            // Vérifier si c'est sur un sous-domaine thumbs (ex: thumbs.coleka.com) = thumbnail
            if (url.includes('thumbs.') || url.includes('/thumbs/') || url.includes('/thumbnails/')) {
                return 150; // Probablement une miniature
            }
            // Sinon, c'est probablement une image pleine résolution
            return 1500;
        }
        
        return 0;
    };
    
    /**
     * Déduplique un tableau d'URLs d'images basé sur leur contenu normalisé
     * Pour tous les providers, garde celle avec la meilleure résolution
     * @param {string[]} urls - Tableau d'URLs
     * @returns {string[]} - Tableau d'URLs dédupliquées (meilleure qualité)
     */
    const deduplicateImageUrls = (urls) => {
        const seen = new Map();
        
        for (const url of urls) {
            if (!url) continue;
            const key = normalizeImageUrlForComparison(url);
            if (!key) continue;
            
            const currentSize = getImageSize(url);
            const existing = seen.get(key);
            
            if (!existing) {
                seen.set(key, { url, size: currentSize });
            } else if (currentSize > existing.size) {
                seen.set(key, { url, size: currentSize });
            }
        }
        
        return Array.from(seen.values()).map(item => item.url);
    };
    
    // Fonction pour valider qu'une URL pointe vers une vraie image (pas juste un dossier)
    const isValidImageUrl = (url) => {
        if (!url || typeof url !== 'string') return false;
        // Vérifier que l'URL ne se termine pas par un / (dossier) et contient une extension ou un fichier
        const cleanedUrl = url.replace(/\\\//g, '/').trim();
        if (cleanedUrl.endsWith('/')) return false;
        // Vérifier qu'il y a un nom de fichier après le dernier /
        const lastSlashIdx = cleanedUrl.lastIndexOf('/');
        if (lastSlashIdx === -1) return false;
        const filename = cleanedUrl.substring(lastSlashIdx + 1);
        // Le fichier doit avoir au moins 1 caractère et idéalement une extension
        return filename.length > 0 && (filename.includes('.') || filename.length > 10);
    };
    
    // Fonction pour extraire l'URL d'un élément (string ou objet)
    const extractUrl = (item) => {
        if (!item) return null;
        if (typeof item === 'string') return cleanUrl(item);
        if (typeof item === 'object' && item.url) return cleanUrl(item.url);
        return null;
    };
    
    // Normaliser les images depuis différents formats d'API
    // Format attendu: { primary: string, gallery: string[] }
    let images = { primary: null, gallery: [] };
    
    // Source des images brutes (peut être sur result ou result.data)
    const rawImages = result.images || result.data?.images || {};
    
    // Si déjà au format {primary, gallery}
    if (rawImages.primary || rawImages.gallery) {
        images.primary = cleanUrl(rawImages.primary) || null;
        // Extraire et dédupliquer les URLs de la galerie (inclut détection variantes Amazon)
        const galleryUrls = (rawImages.gallery || []).map(extractUrl).filter(Boolean);
        images.gallery = deduplicateImageUrls(galleryUrls);
    }
    // Format RAWG/IGDB: {cover, screenshots, artworks, background}
    else if (rawImages.cover || rawImages.screenshots || rawImages.artworks) {
        images.primary = cleanUrl(rawImages.cover) || cleanUrl(rawImages.background) || null;
        // Construire la galerie avec toutes les images disponibles
        const allImages = [];
        // D'abord le cover comme première image
        if (rawImages.cover) {
            allImages.push(cleanUrl(rawImages.cover));
        }
        // Puis les screenshots
        if (rawImages.screenshots && rawImages.screenshots.length > 0) {
            allImages.push(...rawImages.screenshots.map(extractUrl).filter(Boolean));
        }
        // Puis les artworks
        if (rawImages.artworks && rawImages.artworks.length > 0) {
            allImages.push(...rawImages.artworks.map(extractUrl).filter(Boolean));
        }
        // Background seulement si différent du cover
        if (rawImages.background && rawImages.background !== rawImages.cover) {
            allImages.push(cleanUrl(rawImages.background));
        }
        // Dédupliquer les images (inclut détection variantes Amazon)
        images.gallery = deduplicateImageUrls(allImages.filter(Boolean));
    }
    // Format tableau d'objets [{url, thumbnail, is_main}, ...] ou tableau de strings
    else if (Array.isArray(rawImages) && rawImages.length > 0) {
        // Extraire les URLs et identifier l'image principale
        const extractedImages = rawImages.map(item => {
            const url = extractUrl(item);
            const isMain = item?.is_main === true;
            return { url, isMain };
        }).filter(img => img.url && isValidImageUrl(img.url));
        
        // Chercher l'image principale marquée is_main
        const mainImage = extractedImages.find(img => img.isMain);
        images.primary = mainImage?.url || extractedImages[0]?.url || null;
        
        // Construire la galerie avec toutes les URLs et dédupliquer (inclut détection variantes Amazon)
        const allUrls = extractedImages.map(img => img.url).filter(Boolean);
        images.gallery = deduplicateImageUrls(allUrls);
    }
    // Fallback sur result.image
    else if (result.image && isValidImageUrl(result.image)) {
        images.primary = cleanUrl(result.image);
    }
    
    const gallery = images.gallery || [];
    
    //console.log('[WebSearch] updateDetailModalContent - result:', result);
    //console.log('[WebSearch] updateDetailModalContent - rawImages:', rawImages);
    //console.log('[WebSearch] updateDetailModalContent - images (normalized):', images);
    //console.log('[WebSearch] updateDetailModalContent - gallery:', gallery);

    // Récupérer le type depuis l'élément affiché ou le déduire du résultat
    const typeDisplay = document.querySelector('.detail-detected-type');
    const selectedTypeId = typeDisplay ? parseInt(typeDisplay.dataset.typeId) : getSuggestedPrimaryTypeId(result.type);
    const selectedType = state.primaryTypes.find(pt => pt.id === selectedTypeId);
    const typeName = selectedType?.name || 'divers';
    
    if (!state.selectedImages) {
        state.selectedImages = new Set();
    }
    
    // Conserver l'image originale si elle n'est pas dans la nouvelle galerie
    const originalImage = result.image || null;
    
    // Vérifier si l'image originale est déjà dans la galerie (comparaison normalisée)
    const originalImageNormalized = originalImage ? normalizeImageUrlForComparison(originalImage) : null;
    const originalImageInGallery = originalImageNormalized 
        ? gallery.some(img => normalizeImageUrlForComparison(img) === originalImageNormalized)
        : false;
    
    // Construire la galerie complète (inclure l'image originale)
    let fullGallery = originalImage ? [originalImage, ...gallery] : [...gallery];
    
    // Dédupliquer la galerie complète (inclut détection variantes Amazon comme _SL500_ vs _AC_SL1500_)
    fullGallery = deduplicateImageUrls(fullGallery);
    
    // Réinitialiser les images sélectionnées et sélectionner TOUTES les images de la galerie
    state.selectedImages.clear();
    
    // Ajouter toutes les images de la galerie complète
    if (fullGallery.length > 0) {
        fullGallery.forEach(img => state.selectedImages.add(img));
    } else if (images.primary) {
        // Si pas de galerie, ajouter au moins l'image principale
        state.selectedImages.add(images.primary);
    }
    
    // Mettre à jour l'image et la galerie seulement si on a des images
    const imageContainer = document.querySelector('.web-search-detail-modal .detail-image-container');
    if (imageContainer && (images.primary || fullGallery.length > 0)) {
        let imageHtml = '';
        //console.log('[WebSearch] Mise à jour de la galerie avec images.primary:', images.primary);
        if (images.primary) {
            imageHtml = `
                <div class="detail-main-image-wrapper">
                    <img src="${images.primary}" alt="" class="detail-image" id="wsMainImage">
                </div>
            `;
        }
        
        // fullGallery est déjà construit plus haut
        
        if (fullGallery.length > 0) {
            const mainImgUrl = images.primary || images.thumbnail || images.box_front || images.box_back || fullGallery[0];
            imageHtml += `
                <div class="detail-image-gallery" id="wsImageGallery">
                    ${fullGallery.map((img, idx) => {
                        const isActive = img === mainImgUrl;
                        const isSelected = state.selectedImages.has(img);
                        const isOriginal = img === originalImage && !originalImageInGallery;
                        return `
                            <div class="detail-thumb-wrapper ${isSelected ? 'selected' : ''} ${isOriginal ? 'original-image' : ''}" data-url="${img}" ${isOriginal ? 'title="Image originale"' : ''}>
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
        
        // Mettre à jour le compteur d'images et le champ d'import
        updateSelectedImagesCount();
        updateImageImportField();
        
        // Gérer le bouton "Tout sélectionner / Tout désélectionner"
        const selectAllBtn = document.getElementById('wsSelectAllImages');
        if (selectAllBtn) {
            // Initialiser le label du bouton
            updateSelectAllButtonLabel();
            
            selectAllBtn.addEventListener('click', () => {
                // Vérifier si toutes les images de la galerie complète sont sélectionnées
                const allGallerySelected = fullGallery.every(img => state.selectedImages.has(img));
                
                if (allGallerySelected) {
                    // Tout désélectionner : vider complètement la sélection
                    state.selectedImages.clear();
                } else {
                    // Tout sélectionner : ajouter toutes les images de la galerie complète
                    fullGallery.forEach(img => state.selectedImages.add(img));
                }
                
                // Mettre à jour l'affichage des thumbnails
                document.querySelectorAll('.detail-thumb-wrapper').forEach(wrapper => {
                    const url = wrapper.dataset.url;
                    wrapper.classList.toggle('selected', state.selectedImages.has(url));
                });
                
                // Mettre à jour le compteur et le label du bouton
                updateSelectedImagesCount();
                updateSelectAllButtonLabel();
                updateImageImportField();
            });
        }
    }
    
    // Les mappings BDD utilisent des chemins depuis la racine de la réponse API (ex: data.synopsis)
    // On passe donc `result` complet et non `result.data`
    
    // Charger les mappings BDD pour extraire nom et description
    let fieldMappings = [];
    if (webapiId) {
        try {
            fieldMappings = await fetchFieldMappings(webapiId);
        } catch (e) {
            console.warn('[WebSearch] Impossible de charger les mappings pour affichage');
        }
    }
    
    // Construire un map pour accès rapide : item_field -> mapping
    const mappingsByField = {};
    for (const mapping of fieldMappings) {
        mappingsByField[mapping.item_field] = mapping;
    }
    
    // Extraire le nom via mapping BDD (passer result complet car les chemins commencent par data.)
    let extractedName = null;
    const nameMapping = mappingsByField['name'];
    if (nameMapping && nameMapping.api_path) {
        extractedName = applyMapping(result, nameMapping);
        // Gérer les objets de traduction {text: "...", translated: bool}
        if (extractedName && typeof extractedName === 'object') {
            extractedName = extractedName.text || null;
        }
    }
    
    // Mettre à jour le titre (seulement si on a une valeur du mapping BDD)
    const titleEl = document.querySelector('.web-search-detail-modal .detail-title');
    if (titleEl && extractedName) {
        titleEl.textContent = extractedName;
    }
    
    // Extraire la description via mapping BDD
    let descriptionText = null;
    const descMapping = mappingsByField['description'];
    if (descMapping && descMapping.api_path) {
        descriptionText = applyMapping(result, descMapping);
        if (descriptionText && typeof descriptionText === 'object') {
            descriptionText = descriptionText.text || null;
        }
    }
    
    const descEl = document.querySelector('.web-search-detail-modal .detail-description');
    if (descEl) {
        if (descriptionText) {
            descEl.textContent = descriptionText;
            descEl.classList.remove('muted');
        } else {
            descEl.textContent = t.detail_no_description;
            descEl.classList.add('muted');
        }
    }
    
    // Mettre à jour les sections
    const generalFieldsContainer = document.getElementById('wsImportFields');
    if (generalFieldsContainer) {
        // Réutiliser les mappings déjà chargés via buildGeneralFieldsHtmlWithMappings
        // Passer result complet car les chemins BDD commencent par data.
        generalFieldsContainer.innerHTML = buildGeneralFieldsHtmlWithMappings(result, t, fieldMappings);
    }
    
    const mediaFieldsContainer = document.getElementById('wsMediaFields');
    if (mediaFieldsContainer) {
        mediaFieldsContainer.innerHTML = buildMediaFieldsHtml(result, t);
    }
    
    // IMPORTANT: Mettre à jour le champ images APRÈS la reconstruction du HTML des médias
    // car buildMediaFieldsHtml utilise les données brutes, pas state.selectedImages
    updateImageImportField();
    
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
    
    // Note: Le bouton est déjà mis à jour en haut de cette fonction
}
