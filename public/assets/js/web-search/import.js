/**
 * SnowShelf - Web Search Module
 * Gestion de l'import des données
 * 
 * Ce module prépare les données pour l'import et délègue au module collection/import.js
 * qui utilise les mappings configurés dans la BDD:
 * - item_field_mappings: pour les champs fixes (nom, description, valeur, images, etc.)
 * - primary_type_key_to_field: pour les métadonnées dynamiques selon le type primaire
 */

import { state } from './state.js';
import { findValueFromSources, extractYear } from './utils/data.js';
import { showToast, getTranslations } from './utils/helpers.js';
import { close } from './index.js';

// Import des fonctions du module collection/import.js pour utiliser les mappings BDD
import { 
    prepareImportData, 
    fetchFieldMappings, 
    fetchMetadataMappings,
    extractValueByPath,
    applyMapping,
    applyTransform,
    normalizeFieldValue
} from '../collection/import.js';

/**
 * Filtre les URLs de documents pour ne garder que les URLs valides
 * Exclut les URLs qui:
 * - Ne se terminent pas par une extension de fichier (.pdf, etc.)
 * - Sont vides ou invalides
 * @param {string[]} urls - Liste d'URLs à filtrer
 * @returns {string[]} - URLs valides
 */
function filterValidDocumentUrls(urls) {
    if (!urls || !Array.isArray(urls)) return [];
    
    return urls.filter(url => {
        if (!url || typeof url !== 'string') return false;
        
        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            const hostname = urlObj.hostname.toLowerCase();
            
            // Domaines connus qui servent des documents sans extension dans l'URL
            // Ces URLs retournent des PDFs même sans extension .pdf
            const trustedDocDomains = [
                'bigcontent.io',          // Playmobil instructions
                'playmobil.a.bigcontent.io',
                'contentstack.io',        // Mega Construx instructions
                'assets.contentstack.io',
                'lego.com',               // LEGO instructions
                'brickset.com',
            ];
            
            const isTrustedDomain = trustedDocDomains.some(domain => 
                hostname === domain || hostname.endsWith('.' + domain)
            );
            
            // Si domaine de confiance, accepter l'URL même sans extension
            if (isTrustedDomain) {
                // Vérifier juste qu'il y a un pathname significatif
                const filename = pathname.split('/').pop();
                return filename && filename.length > 3;
            }
            
            // Pour les autres domaines, vérifier l'extension
            const filename = pathname.split('/').pop();
            
            // Le fichier doit avoir un nom (pas juste une extension ou un chemin)
            if (!filename || filename.length < 5) return false;
            
            // Vérifier les extensions valides
            const validExtensions = ['.pdf', '.zip', '.doc', '.docx', '.xls', '.xlsx', '.txt'];
            const hasValidExtension = validExtensions.some(ext => filename.toLowerCase().endsWith(ext));
            
            if (!hasValidExtension) return false;
            
            // Filtrer les URLs qui semblent être des templates ou invalides
            // Ex: "product.bi.additional.info.pdf" (pas de numéro de fichier)
            if (filename === 'product.bi.additional.info.pdf' || filename === 'product.bi.core.pdf') {
                return false;
            }
            
            return true;
        } catch (e) {
            console.warn('[WebSearch] URL de document invalide:', url, e);
            return false;
        }
    });
}

/**
 * Obtenir l'ID du type actuellement détecté
 * @returns {number} - ID du type
 */
export function getSelectedTypeId() {
    const typeDisplay = document.querySelector('.detail-detected-type');
    if (!typeDisplay) return 8; // Fallback sur divers (ID 8)
    return parseInt(typeDisplay.dataset.typeId) || 8;
}

/**
 * Obtenir le nom du type actuellement détecté
 * @returns {string} - Nom du type
 */
export function getSelectedTypeName() {
    const typeId = getSelectedTypeId();
    const type = state.primaryTypes.find(pt => pt.id === typeId);
    return type?.name || 'divers';
}

/**
 * Obtenir le nom du type à partir de l'ID
 * @param {number} typeId - ID du type
 * @returns {string} - Nom du type (inter_name)
 */
export function getTypeNameById(typeId) {
    const type = state.primaryTypes.find(pt => pt.id === typeId);
    return type?.inter_name || 'divers';
}

/**
 * Gérer l'import du résultat sélectionné
 * Utilise les mappings de la BDD via prepareImportData si disponible,
 * sinon utilise le traitement manuel des champs cochés
 * @param {Object} result - Résultat à importer
 */
export async function handleImport(result) {
    const t = getTranslations();
    
    const actualResult = state.currentDetailResult || result;
    
    // Récupérer le type depuis l'affichage (détecté automatiquement)
    const typeDisplay = document.querySelector('.detail-detected-type');
    const primaryTypeId = typeDisplay ? parseInt(typeDisplay.dataset.typeId) : null;
    const primaryType = state.primaryTypes.find(pt => pt.id === primaryTypeId);
    const typeName = primaryType?.name || 'divers';
    
    // Récupérer le webapi_id pour les mappings BDD
    const webapiId = actualResult.webapi_id || null;
    
    // Charger les mappings BDD pour les champs fixes
    let fieldMappings = [];
    if (webapiId) {
        try {
            fieldMappings = await fetchFieldMappings(webapiId);
            console.log('[WebSearch] Field mappings chargés:', fieldMappings);
        } catch (error) {
            console.warn('[WebSearch] Impossible de charger les mappings BDD:', error);
        }
    }
    
    let enrichedResult;
    
    // Si on a un webapi_id et un primaryTypeId, utiliser les mappings BDD
    if (webapiId && primaryTypeId) {
        console.log('[WebSearch] Utilisation des mappings BDD pour import (webapi_id:', webapiId, ', primaryTypeId:', primaryTypeId, ')');
        
        try {
            // Préparer les données via les mappings BDD
            // Les api_keys commencent par "data." (ex: data.isbn, data.identifiers.isbn)
            // IMPORTANT: Le spread doit être AVANT pour que data: ne soit pas écrasé
            const wrappedData = {
                ...actualResult,
                data: actualResult.data || actualResult
            };
            console.log('[WebSearch] Données API pour mappings:', wrappedData);
            console.log('[WebSearch] wrappedData.data existe:', !!wrappedData.data);
            const mappedData = await prepareImportData(wrappedData, webapiId, primaryTypeId);
            console.log('[WebSearch] Résultat mappedData:', mappedData);
            
            // Compléter avec les champs sélectionnés manuellement dans l'UI
            const selectedFields = {};
            const selectedMetadata = {};
            
            // Collecter les field_keys des métadonnées cochées dans l'UI
            const checkedMetadataKeys = new Set();
            document.querySelectorAll('#wsTypeFields .import-field-item').forEach(item => {
                const checkbox = item.querySelector('input[type="checkbox"]');
                if (checkbox && checkbox.checked) {
                    const field = item.dataset.field;
                    if (field && field.startsWith('type_')) {
                        checkedMetadataKeys.add(field.replace('type_', ''));
                    }
                }
            });
            console.log('[WebSearch] Métadonnées cochées:', Array.from(checkedMetadataKeys));
            
            // Parcourir les champs sélectionnés dans l'UI pour enrichir/compléter les mappings
            document.querySelectorAll('#wsImportFields .import-field-item, #wsMediaFields .import-field-item, #wsTypeFields .import-field-item').forEach(item => {
                processImportField(item, actualResult, selectedFields, selectedMetadata, fieldMappings);
            });
            
            // Fusionner : les valeurs mappées sont utilisées SEULEMENT si le checkbox correspondant est coché
            // On vérifie l'état des checkboxes pour les champs fixes
            const isNameChecked = document.querySelector('#wsImportFields .import-field-item[data-field="name"] input[type="checkbox"]')?.checked;
            const isDescChecked = document.querySelector('#wsImportFields .import-field-item[data-field="description"] input[type="checkbox"]')?.checked;
            const isPriceChecked = document.querySelector('#wsImportFields .import-field-item[data-field="value"] input[type="checkbox"]')?.checked;
            const isImagesChecked = document.querySelector('[data-field="images"] input[type="checkbox"]')?.checked;
            
            // Les images sélectionnées par l'utilisateur ont TOUJOURS priorité sur les mappings BDD
            // Déduplication basée sur l'URL complète (Set garantit l'unicité)
            const userSelectedImages = state.selectedImages && state.selectedImages.size > 0 
                ? [...new Set(Array.from(state.selectedImages))] 
                : [];
            
            if (userSelectedImages.length > 0) {
                console.log(`[WebSearch] ${userSelectedImages.length} image(s) sélectionnée(s) (dédupliquées)`);
            }
            
            // Filtrer les métadonnées BDD pour ne garder que celles cochées
            const filteredBddMetadata = {};
            if (mappedData.fieldsToImport.metadata) {
                for (const [key, value] of Object.entries(mappedData.fieldsToImport.metadata)) {
                    if (checkedMetadataKeys.has(key)) {
                        filteredBddMetadata[key] = value;
                    }
                }
            }
            console.log('[WebSearch] Métadonnées BDD filtrées:', filteredBddMetadata);
            
            // Vérifier si code_barre est coché
            const isBarcodeChecked = state.selectedFields.has('code_barre');
            
            enrichedResult = {
                raw: actualResult,
                primaryTypeId: primaryTypeId,
                primaryTypeName: primaryType?.name || null,
                fieldsToImport: {
                    // Valeurs des mappings BDD utilisées seulement si checkbox coché
                    name: isNameChecked ? (mappedData.fieldsToImport.name || selectedFields.name) : null,
                    description: isDescChecked ? (mappedData.fieldsToImport.description || selectedFields.description) : null,
                    value: isPriceChecked ? (mappedData.fieldsToImport.value || selectedFields.value) : null,
                    code_barre: isBarcodeChecked ? (mappedData.fieldsToImport.code_barre || selectedFields.code_barre) : null,
                    image_url: userSelectedImages[0] || selectedFields.image_url,
                    images: userSelectedImages.length > 0 ? userSelectedImages : selectedFields.images,
                    // Métadonnées fusionnées : UI + BDD (filtrées par checkboxes)
                    metadata: {
                        ...selectedMetadata,
                        ...filteredBddMetadata
                    }
                },
                // Images : utiliser les images sélectionnées par l'utilisateur si checkbox coché
                importImage: isImagesChecked && userSelectedImages.length > 0,
                importImages: isImagesChecked ? userSelectedImages : [],
                importVideos: mappedData.importVideos || [],
                importAudio: mappedData.importAudio || [],
                importDocuments: mappedData.importDocuments || [],
                importInstructions: state.selectedInstructions && state.selectedInstructions.size > 0 
                    ? filterValidDocumentUrls(Array.from(state.selectedInstructions))
                    : []
            };
            
            console.log('[WebSearch] state.selectedInstructions:', state.selectedInstructions, 'size:', state.selectedInstructions?.size);
            console.log('[WebSearch] importInstructions résultat:', enrichedResult.importInstructions);
            console.log('[WebSearch] Données importées via mappings BDD:', enrichedResult);
            
        } catch (error) {
            console.error('[WebSearch] Erreur lors de l\'utilisation des mappings BDD, fallback sur traitement manuel:', error);
            // Fallback sur le traitement manuel
            enrichedResult = buildEnrichedResultFromUI(actualResult, primaryTypeId, primaryType, fieldMappings);
        }
    } else {
        // Pas de webapi_id ou primaryTypeId, utiliser le traitement manuel
        console.log('[WebSearch] Utilisation du traitement manuel (pas de webapi_id ou primaryTypeId)');
        enrichedResult = buildEnrichedResultFromUI(actualResult, primaryTypeId, primaryType, fieldMappings);
    }
    
    if (!enrichedResult || (Object.keys(enrichedResult.fieldsToImport).length === 0 && 
        (!enrichedResult.fieldsToImport.metadata || Object.keys(enrichedResult.fieldsToImport.metadata).length === 0))) {
        showToast(t.detail_no_field_selected, 'warning');
        return;
    }
    
    console.log('[WebSearch] Import data:', enrichedResult);
    
    const hasFilesToDownload = enrichedResult.importImages.length > 0 || enrichedResult.importInstructions.length > 0;
    let importOverlay = null;
    
    if (hasFilesToDownload) {
        const detailModalOverlay = document.querySelector(`[data-modal-id="${state.detailModalId}"]`);
        const modalElement = detailModalOverlay?.querySelector('.modal');
        
        if (modalElement) {
            modalElement.style.position = 'relative';
            
            importOverlay = document.createElement('div');
            importOverlay.className = 'web-search-import-overlay';
            importOverlay.innerHTML = `
                <div class="import-spinner-container">
                    <div class="import-spinner"></div>
                    <div class="import-spinner-text">${t.detail_importing || 'Import en cours...'}</div>
                    <div class="import-spinner-details">${enrichedResult.importImages.length} image(s), ${enrichedResult.importInstructions.length} document(s)</div>
                </div>
            `;
            modalElement.appendChild(importOverlay);
            console.log('[WebSearch] Import overlay affiché');
        }
    }
    
    let importResult = null;
    try {
        if (state.onSelect) {
            importResult = await state.onSelect(enrichedResult);
        }
    } catch (error) {
        console.error('[WebSearch] Import error:', error);
        showToast(t.detail_import_error || 'Erreur lors de l\'import', 'error');
    } finally {
        if (importOverlay) {
            importOverlay.remove();
        }
    }
    
    // Si l'import a été annulé, ne pas fermer les modals
    if (importResult && importResult.cancelled) {
        console.log('[WebSearch] Import annulé, modals conservés');
        return;
    }
    
    // Fermer les deux modals seulement si l'import a réussi
    if (state.detailModalId) {
        ModalManager.close(state.detailModalId);
        state.detailModalId = null;
    }
    close();
    
    showToast(t.detail_import_success, 'success');
}

/**
 * Construit le résultat enrichi à partir des champs sélectionnés dans l'UI
 * (Fallback quand les mappings BDD ne sont pas disponibles)
 * @param {Object} actualResult - Résultat avec données
 * @param {number} primaryTypeId - ID du type primaire
 * @param {Object} primaryType - Objet type primaire
 * @param {Array} fieldMappings - Mappings des champs fixes depuis item_field_mappings
 * @returns {Object} Résultat enrichi pour l'import
 */
function buildEnrichedResultFromUI(actualResult, primaryTypeId, primaryType, fieldMappings = []) {
    const selectedFields = {};
    const selectedMetadata = {};
    
    // Parcourir tous les champs sélectionnés
    document.querySelectorAll('#wsImportFields .import-field-item, #wsMediaFields .import-field-item, #wsTypeFields .import-field-item').forEach(item => {
        processImportField(item, actualResult, selectedFields, selectedMetadata, fieldMappings);
    });
    
    // Les images sélectionnées par l'utilisateur ont TOUJOURS priorité
    // Déduplication basée sur l'URL complète (Set garantit l'unicité)
    const isImagesChecked = document.querySelector('[data-field="images"] input[type="checkbox"]')?.checked;
    const userSelectedImages = state.selectedImages && state.selectedImages.size > 0 
        ? [...new Set(Array.from(state.selectedImages))] 
        : [];
    
    return {
        raw: actualResult,
        primaryTypeId: primaryTypeId,
        primaryTypeName: primaryType?.name || null,
        fieldsToImport: {
            ...selectedFields,
            image_url: userSelectedImages[0] || selectedFields.image_url,
            images: userSelectedImages.length > 0 ? userSelectedImages : selectedFields.images,
            metadata: selectedMetadata
        },
        importImage: isImagesChecked && userSelectedImages.length > 0,
        importImages: isImagesChecked ? userSelectedImages : [],
        importInstructions: state.selectedInstructions && state.selectedInstructions.size > 0 
            ? filterValidDocumentUrls(Array.from(state.selectedInstructions))
            : []
    };
}

/**
 * Traiter un champ d'import sélectionné
 * Utilise les mappings BDD stockés dans state pour extraire les valeurs
 * @param {HTMLElement} item - Élément du champ
 * @param {Object} actualResult - Résultat avec données
 * @param {Object} selectedFields - Champs sélectionnés (modifié)
 * @param {Object} selectedMetadata - Métadonnées sélectionnées (modifié)
 * @param {Array} fieldMappings - Mappings des champs fixes depuis item_field_mappings
 */
export function processImportField(item, actualResult, selectedFields, selectedMetadata, fieldMappings = []) {
    const checkbox = item.querySelector('input[type="checkbox"]');
    if (!checkbox || !checkbox.checked) return;
    
    const field = item.dataset.field;
    const category = item.dataset.category || 'general';
    
    if (!field) return;
    
    // Construire un map des mappings par item_field
    const mappingsByField = {};
    for (const mapping of fieldMappings) {
        mappingsByField[mapping.item_field] = mapping;
    }
    
    // Champs généraux - utiliser les mappings BDD
    if (field === 'name' || field === 'description' || field === 'value' || field === 'code_barre') {
        const mapping = mappingsByField[field];
        if (mapping && mapping.api_path) {
            // Utiliser applyMapping pour extraire la valeur selon la config BDD
            const value = applyMapping(actualResult, mapping);
            if (value !== null && value !== undefined) {
                if (field === 'name') {
                    selectedFields.name = value;
                } else if (field === 'description') {
                    selectedFields.description = value;
                } else if (field === 'value') {
                    selectedFields.value = value;
                } else if (field === 'code_barre') {
                    // code_barre va dans selectedFields, pas selectedMetadata
                    selectedFields.code_barre = value;
                }
            }
        }
    }
    
    // Champs médias
    else if (field === 'images') {
        if (state.selectedImages && state.selectedImages.size > 0) {
            selectedFields.images = Array.from(state.selectedImages);
            selectedFields.image_url = selectedFields.images[0];
        } else if (actualResult.image_url) {
            selectedFields.image_url = actualResult.image_url;
            selectedFields.images = [actualResult.image_url];
        }
    } else if (field === 'documents') {
        // Les documents sont gérés via state.selectedInstructions
    }
    
    // Champs spécifiques au type (commencent par type_)
    else if (field.startsWith('type_')) {
        const fieldKey = field.replace('type_', '');
        const typeId = getSelectedTypeId();
        // Récupérer les champs depuis le cache
        const cachedFields = state.primaryTypeFields[typeId];
        // Le cache contient directement un tableau de champs (pas un objet avec .fields)
        const typeFields = Array.isArray(cachedFields) ? cachedFields : (cachedFields?.fields || []);
        const fieldDef = typeFields.find(f => f.field_key === fieldKey);
        
        if (fieldDef) {
            // Pour les champs de type tracklist ou array, préserver le tableau d'objets
            const preserveArray = fieldDef.field_type === 'tracklist' || fieldDef.field_type === 'array';
            let value = null;
            
            // Utiliser les mappings avec transformations si disponibles
            if (fieldDef.mappings && fieldDef.mappings.length > 0) {
                for (const mapping of fieldDef.mappings) {
                    const sources = mapping.api_keys || [];
                    if (sources.length === 0) continue;
                    
                    // Trouver la valeur brute (utiliser extractValueByPath pour supporter [*])
                    let rawValue = null;
                    for (const source of sources) {
                        // Essayer avec et sans préfixe 'data.'
                        rawValue = extractValueByPath(actualResult, source);
                        if (rawValue === undefined && source.startsWith('data.')) {
                            rawValue = extractValueByPath(actualResult, source.substring(5));
                        }
                        if (rawValue === undefined && !source.startsWith('data.')) {
                            rawValue = extractValueByPath(actualResult, 'data.' + source);
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
                            // Transformation par défaut pour les tableaux
                            value = rawValue.map(item => {
                                if (item && typeof item === 'object') {
                                    return item.name || item.label || item.title || JSON.stringify(item);
                                }
                                return String(item);
                            }).filter(v => v).join(', ');
                        } else {
                            value = rawValue;
                        }
                        break;
                    }
                }
            }
            
            // Fallback sur l'ancien comportement
            if (value === null) {
                const sources = fieldDef.api_keys && fieldDef.api_keys.length > 0 
                    ? fieldDef.api_keys 
                    : [fieldKey];
                value = findValueFromSources(actualResult, sources, { preserveArray });
            }
            
            if (value !== null && value !== undefined) {
                // Normaliser les champs de date/année
                if (fieldKey === 'year' || fieldKey === 'year_start' || fieldKey === 'year_end' || 
                    fieldKey.includes('release') || fieldKey.includes('publication')) {
                    const yearValue = extractYear(value);
                    if (yearValue) {
                        value = yearValue;
                    }
                }
                // Appliquer la normalisation du module collection/import.js
                value = normalizeFieldValue(fieldKey, value);
                selectedMetadata[fieldKey] = value;
            }
        }
    }
}
