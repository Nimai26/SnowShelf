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
            
            // Vérifier que le pathname se termine par un nom de fichier avec extension
            // Ex: /path/to/file.pdf est valide, /path/to/product.bi.additional.info.pdf sans nom est invalide
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
    
    let enrichedResult;
    
    // Si on a un webapi_id et un primaryTypeId, utiliser les mappings BDD
    if (webapiId && primaryTypeId) {
        console.log('[WebSearch] Utilisation des mappings BDD pour import (webapi_id:', webapiId, ', primaryTypeId:', primaryTypeId, ')');
        
        try {
            // Préparer les données via les mappings BDD
            const apiData = actualResult.data || actualResult;
            const mappedData = await prepareImportData(apiData, webapiId, primaryTypeId);
            
            // Compléter avec les champs sélectionnés manuellement dans l'UI
            const selectedFields = {};
            const selectedMetadata = {};
            
            // Parcourir les champs sélectionnés dans l'UI pour enrichir/compléter les mappings
            document.querySelectorAll('#wsImportFields .import-field-item, #wsMediaFields .import-field-item, #wsTypeFields .import-field-item').forEach(item => {
                processImportField(item, actualResult, selectedFields, selectedMetadata);
            });
            
            // Fusionner : priorité aux valeurs mappées, complétées par les valeurs UI
            enrichedResult = {
                raw: actualResult,
                primaryTypeId: primaryTypeId,
                primaryTypeName: primaryType?.name || null,
                fieldsToImport: {
                    // Valeurs des mappings BDD en priorité
                    name: mappedData.fieldsToImport.name || selectedFields.name,
                    description: mappedData.fieldsToImport.description || selectedFields.description,
                    value: mappedData.fieldsToImport.value || selectedFields.value,
                    image_url: selectedFields.image_url,
                    images: selectedFields.images,
                    // Métadonnées fusionnées (BDD + UI)
                    metadata: {
                        ...selectedMetadata,
                        ...mappedData.fieldsToImport.metadata
                    }
                },
                importImage: !!(selectedFields.image_url || (selectedFields.images && selectedFields.images.length > 0)),
                importImages: mappedData.importImages.length > 0 
                    ? mappedData.importImages 
                    : (selectedFields.images || (selectedFields.image_url ? [selectedFields.image_url] : [])),
                importVideos: mappedData.importVideos || [],
                importAudio: mappedData.importAudio || [],
                importDocuments: mappedData.importDocuments || [],
                importInstructions: state.selectedInstructions && state.selectedInstructions.size > 0 
                    ? filterValidDocumentUrls(Array.from(state.selectedInstructions))
                    : []
            };
            
            console.log('[WebSearch] Données importées via mappings BDD:', enrichedResult);
            
        } catch (error) {
            console.error('[WebSearch] Erreur lors de l\'utilisation des mappings BDD, fallback sur traitement manuel:', error);
            // Fallback sur le traitement manuel
            enrichedResult = buildEnrichedResultFromUI(actualResult, primaryTypeId, primaryType);
        }
    } else {
        // Pas de webapi_id ou primaryTypeId, utiliser le traitement manuel
        console.log('[WebSearch] Utilisation du traitement manuel (pas de webapi_id ou primaryTypeId)');
        enrichedResult = buildEnrichedResultFromUI(actualResult, primaryTypeId, primaryType);
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
    
    try {
        if (state.onSelect) {
            await state.onSelect(enrichedResult);
        }
    } catch (error) {
        console.error('[WebSearch] Import error:', error);
        showToast(t.detail_import_error || 'Erreur lors de l\'import', 'error');
    } finally {
        if (importOverlay) {
            importOverlay.remove();
        }
    }
    
    // Fermer les deux modals
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
 * @returns {Object} Résultat enrichi pour l'import
 */
function buildEnrichedResultFromUI(actualResult, primaryTypeId, primaryType) {
    const selectedFields = {};
    const selectedMetadata = {};
    
    // Parcourir tous les champs sélectionnés
    document.querySelectorAll('#wsImportFields .import-field-item, #wsMediaFields .import-field-item, #wsTypeFields .import-field-item').forEach(item => {
        processImportField(item, actualResult, selectedFields, selectedMetadata);
    });
    
    return {
        raw: actualResult,
        primaryTypeId: primaryTypeId,
        primaryTypeName: primaryType?.name || null,
        fieldsToImport: {
            ...selectedFields,
            metadata: selectedMetadata
        },
        importImage: !!(selectedFields.image_url || (selectedFields.images && selectedFields.images.length > 0)),
        importImages: selectedFields.images || (selectedFields.image_url ? [selectedFields.image_url] : []),
        importInstructions: state.selectedInstructions && state.selectedInstructions.size > 0 
            ? filterValidDocumentUrls(Array.from(state.selectedInstructions))
            : []
    };
}

/**
 * Traiter un champ d'import sélectionné
 * @param {HTMLElement} item - Élément du champ
 * @param {Object} actualResult - Résultat avec données
 * @param {Object} selectedFields - Champs sélectionnés (modifié)
 * @param {Object} selectedMetadata - Métadonnées sélectionnées (modifié)
 */
export function processImportField(item, actualResult, selectedFields, selectedMetadata) {
    const checkbox = item.querySelector('input[type="checkbox"]');
    if (!checkbox || !checkbox.checked) return;
    
    const field = item.dataset.field;
    const category = item.dataset.category || 'general';
    
    if (!field) return;
    
    // Champs généraux
    if (field === 'name') {
        // Essayer plusieurs chemins possibles pour le nom
        selectedFields.name = findValueFromSources(actualResult, ['title', 'name']) || actualResult.title || actualResult.name;
    } else if (field === 'description') {
        selectedFields.description = findValueFromSources(actualResult, ['description']) || actualResult.description;
    } else if (field === 'price') {
        const price = findValueFromSources(actualResult, ['metadata.price', 'price', 'pricing.price']);
        if (price) selectedMetadata.price = price;
    } else if (field === 'barcode') {
        const barcode = findValueFromSources(actualResult, ['metadata.barcode', 'metadata.upc', 'metadata.isbn', 'metadata.isbn_13', 'metadata.isbn_10', 'barcode', 'upc', 'isbn', 'ean']);
        if (barcode) selectedMetadata.barcode = barcode;
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
        const typeFields = cachedFields?.fields || [];
        const fieldDef = typeFields.find(f => f.field_key === fieldKey);
        
        if (fieldDef) {
            // Utiliser api_keys du mapping pour trouver la valeur
            const sources = fieldDef.api_keys && fieldDef.api_keys.length > 0 
                ? fieldDef.api_keys 
                : [fieldKey]; // Fallback sur le field_key
            let value = findValueFromSources(actualResult, sources);
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
