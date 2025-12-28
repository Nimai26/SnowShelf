/**
 * Module de formulaire d'édition/création d'un item de collection
 * @module collection/ui/item-form
 */

import { getTranslations, state, CONFIG } from '../state.js';
import { escapeHtml, formatCurrency, formatDate } from '../utils.js';
import { showToast, showError } from './feedback.js';
import { deleteItem as apiDeleteItem, loadItemDetails } from '../api.js';
import { populateStatusSelect, openManageStatusesModal } from '../dropdowns/status.js';
import { populatePrimaryTypeSelect } from '../dropdowns/primary-type.js';
import { createCategoriesSelector } from '../dropdowns/categories.js';
import { populateGradesSelectByCategories } from '../dropdowns/grades.js';
import { populateStorageLocationSelect } from '../dropdowns/storage.js';
import { 
    loadMetadataFields, 
    collectMetadataValues, 
    applyImportedMetadata, 
    refreshStickerGrid,
    normalizeFieldValue
} from '../metadata/fields.js';

// Import des fonctions d'import depuis le module dédié
import {
    detectFieldsToReplace as detectFieldsToReplaceImport,
    detectImportConflicts,
    buildImportConfirmationHtml,
    getImportChoices,
    applyWebSearchImport as applyWebSearchImportModule,
    importImageFromUrl,
    importDocumentFromUrl,
    updateMediaTabCount,
    updateMetadataTabCount
} from '../import.js';

// Ré-export pour compatibilité avec index.js
export { detectFieldsToReplaceImport as detectFieldsToReplace };
export { applyWebSearchImportModule as applyWebSearchImport };

/**
 * Met à jour le compteur total de l'onglet Médias
 * @param {HTMLElement} modal - Élément modal
 */
function updateTotalMediaCount(modal) {
    const mediaManagers = modal._mediaManagers || {};
    let total = 0;
    
    for (const type of ['images', 'videos', 'audio', 'documents']) {
        const manager = mediaManagers[type];
        if (manager && typeof manager.getFileCount === 'function') {
            total += manager.getFileCount();
        }
    }
    
    const countEl = modal.querySelector('#itemTotalMediaCount');
    if (countEl) {
        countEl.textContent = total;
    }
}

/**
 * Construit le HTML du formulaire d'édition/création d'item
 * @param {Object|null} item - Item à éditer (null si création)
 * @returns {string} HTML du formulaire
 */
export function buildItemFormHtml(item) {
    const t = getTranslations();
    const isEdit = item !== null;
    
    // Valeurs par défaut
    const name = item?.name || '';
    const description = item?.description || '';
    const note = item?.note || '';
    const barcode = item?.code_barre || '';
    const rating = item?.rating || '';
    const purchasePrice = item?.purchase_price || '';
    const marketValue = item?.market_value || '';
    const acquisitionDate = item?.acquisition_date || '';
    const statusId = item?.status_id || '';
    const primaryTypeId = item?.id_primary_cat || '';
    const storageLocationId = item?.storage_location_id || '';
    const grades = item?.grades || [];
    
    // Compteurs médias
    const mediaCounters = {
        images: item?.images?.length || 0,
        videos: item?.videos?.length || 0,
        audios: item?.audios?.length || 0,
        documents: item?.documents?.length || 0
    };

    // Compter les métadonnées existantes
    const metadataCount = item?.metadata ? Object.keys(item.metadata).length : 0;

    return `
        <form id="itemForm" class="item-form">
            <!-- Onglets principaux du formulaire -->
            <div class="form-main-tabs">
                <button type="button" class="form-main-tab active" data-tab="general">
                    <span class="tab-icon">📋</span>
                    <span class="tab-label">${t.tab_general || 'Général'}</span>
                </button>
                <button type="button" class="form-main-tab" data-tab="details">
                    <span class="tab-icon">📝</span>
                    <span class="tab-label">${t.tab_details || 'Détails'}</span>
                    <span class="tab-count" id="itemMetadataCount">${metadataCount}</span>
                </button>
                <button type="button" class="form-main-tab" data-tab="media">
                    <span class="tab-icon">🖼️</span>
                    <span class="tab-label">${t.tab_media || 'Médias'}</span>
                    <span class="tab-count" id="itemTotalMediaCount">${mediaCounters.images + mediaCounters.videos + mediaCounters.audios + mediaCounters.documents}</span>
                </button>
            </div>

            <!-- Panneau Général -->
            <div class="form-main-panel active" data-tab="general">
            <!-- Nom -->
            <div class="form-group">
                <label for="itemName">${t.field_name} <span class="required">*</span></label>
                <div class="input-with-action">
                    <input type="text" 
                           id="itemName" 
                           name="name" 
                           class="form-control" 
                           value="${escapeHtml(name)}"
                           placeholder="${t.field_name_placeholder}"
                           required>
                    <button type="button" id="btnWebSearch" class="btn btn-icon btn-secondary" title="${t.web_search_btn || 'Recherche Web'}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="2" y1="12" x2="22" y2="12"></line>
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                        </svg>
                    </button>
                </div>
            </div>

            <!-- Description -->
            <div class="form-group">
                <label for="itemDescription">${t.field_description}</label>
                <textarea id="itemDescription" 
                          name="description" 
                          class="form-control" 
                          rows="3"
                          placeholder="${t.field_description_placeholder}">${escapeHtml(description)}</textarea>
            </div>

            <!-- Type primaire + Notes personnelles -->
            <div class="form-row">
                <div class="form-group col-6">
                    <label for="itemPrimaryType">${t.field_primary_type || 'Type de contenu'}</label>
                    <select id="itemPrimaryType" name="id_primary_cat" class="form-select">
                        <option value="">${t.no_primary_type || 'Non défini'}</option>
                        <!-- Rempli dynamiquement -->
                    </select>
                </div>
                <div class="form-group col-6">
                    <label for="itemNotes">${t.field_notes}</label>
                    <textarea id="itemNotes" 
                              name="note" 
                              class="form-control" 
                              rows="2"
                              placeholder="${t.field_notes_placeholder}">${escapeHtml(note)}</textarea>
                </div>
            </div>

            <!-- Ligne Note + Statut -->
            <div class="form-row">
                <div class="form-group col-6">
                    <label for="itemRating">${t.field_rating}</label>
                    <div class="rating-input">
                        <input type="number" 
                               id="itemRating" 
                               name="rating" 
                               class="form-control" 
                               value="${rating}"
                               min="0" 
                               max="5" 
                               step="0.5"
                               placeholder="0-5">
                        <span class="rating-hint">${t.field_rating_hint}</span>
                    </div>
                </div>
                <div class="form-group col-6">
                    <label for="itemStatus">${t.field_status}</label>
                    <div class="status-select-wrapper">
                        <select id="itemStatus" name="status_id" class="form-select">
                            <option value="">${t.no_status}</option>
                            <!-- Rempli dynamiquement -->
                        </select>
                        <div class="status-actions">
                            <label class="toggle-inline" title="${t.status_show_defaults}">
                                <input type="checkbox" id="toggleDefaultStatuses" checked>
                                <span class="toggle-label">${t.status_show_defaults}</span>
                            </label>
                            <button type="button" class="btn btn-sm btn-secondary" id="btnManageStatuses" title="${t.status_manage}">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="12" cy="12" r="3"></circle>
                                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Catégories -->
            <div class="form-group">
                <label for="itemCategories">${t.field_categories}</label>
                <div class="categories-select-wrapper">
                    <select id="itemCategories" 
                            name="category_ids" 
                            class="form-select" 
                            multiple 
                            style="display: none;">
                        <!-- Select natif caché, utilisé pour la soumission du formulaire -->
                    </select>
                    <!-- Le composant custom sera inséré ici -->
                </div>
                <div class="categories-actions">
                    <label class="toggle-inline">
                        <input type="checkbox" id="toggleDefaultCategories" checked>
                        <span class="toggle-label">${t.show_default_categories || 'Afficher les catégories par défaut'}</span>
                    </label>
                    <label class="toggle-inline">
                        <input type="checkbox" id="toggleAutoSelectParents" checked>
                        <span class="toggle-label">${t.auto_select_parents || 'Sélectionner les parents automatiquement'}</span>
                    </label>
                </div>
            </div>

            <!-- Ligne Prix -->
            <div class="form-row">
                <div class="form-group col-6">
                    <label for="itemPurchasePrice">${t.field_purchase_price}</label>
                    <input type="number" 
                           id="itemPurchasePrice" 
                           name="purchase_price" 
                           class="form-control" 
                           value="${purchasePrice}"
                           min="0" 
                           step="0.01"
                           placeholder="0.00">
                </div>
                <div class="form-group col-6">
                    <label for="itemMarketValue">${t.field_market_value}</label>
                    <input type="number" 
                           id="itemMarketValue" 
                           name="market_value" 
                           class="form-control" 
                           value="${marketValue}"
                           min="0" 
                           step="0.01"
                           placeholder="0.00">
                </div>
            </div>

            <!-- Ligne Date + Code-barres -->
            <div class="form-row">
                <div class="form-group col-6">
                    <label for="itemAcquisitionDate">${t.field_acquisition_date}</label>
                    <input type="date" 
                           id="itemAcquisitionDate" 
                           name="acquisition_date" 
                           class="form-control"
                           value="${acquisitionDate}">
                </div>
                <div class="form-group col-6">
                    <label for="itemBarcode">${t.field_barcode}</label>
                    <input type="text" 
                           id="itemBarcode" 
                           name="code_barre" 
                           class="form-control" 
                           value="${escapeHtml(barcode)}"
                           placeholder="${t.field_barcode_placeholder}">
                </div>
            </div>

            <!-- Ligne Grades + Lieu de stockage -->
            <div class="form-row">
                <div class="form-group col-6">
                    <label for="itemGrades">${t.field_grades || 'État physique'}</label>
                    <select id="itemGrades" name="grade_ids" class="form-select" multiple style="display: none;">
                        <!-- Rempli dynamiquement -->
                    </select>
                    <!-- Le composant custom sera inséré ici -->
                </div>
                <div class="form-group col-6">
                    <label for="itemStorageLocation">${t.field_storage_location || 'Emplacement de stockage'}</label>
                    <select id="itemStorageLocation" name="storage_location_id" class="form-select">
                        <option value="">${t.no_storage_location || 'Non défini'}</option>
                        <!-- Rempli dynamiquement -->
                    </select>
                </div>
            </div>
            </div><!-- Fin panneau Général -->

            <!-- Panneau Détails (champs spécifiques au type) -->
            <div class="form-main-panel" data-tab="details">
                <div class="details-type-notice" id="detailsTypeNotice">
                    <p class="notice-text">${t.details_select_type || 'Sélectionnez un type de contenu dans l\'onglet "Général" pour voir les champs spécifiques.'}</p>
                </div>
                <div class="details-fields-container" id="detailsFieldsContainer">
                    <!-- Champs dynamiques générés par JavaScript -->
                </div>
                <div class="details-loading" id="detailsLoading" style="display: none;">
                    <div class="loading-spinner"></div>
                    <span>${t.loading || 'Chargement...'}</span>
                </div>
            </div><!-- Fin panneau Détails -->

            <!-- Panneau Médias -->
            <div class="form-main-panel" data-tab="media">
            <!-- Section Médias -->
            <div class="form-section form-section-media">
                
                <!-- Onglets médias -->
                <div class="media-tabs">
                    <button type="button" class="media-tab active" data-media-type="images">
                        <span class="tab-icon">🖼️</span>
                        <span class="tab-label">${t.media_tab_images || 'Images'}</span>
                        <span class="tab-count" id="itemMediaCountImages">${mediaCounters.images}</span>
                    </button>
                    <button type="button" class="media-tab" data-media-type="videos">
                        <span class="tab-icon">🎬</span>
                        <span class="tab-label">${t.media_tab_videos || 'Vidéos'}</span>
                        <span class="tab-count" id="itemMediaCountVideos">${mediaCounters.videos}</span>
                    </button>
                    <button type="button" class="media-tab" data-media-type="audio">
                        <span class="tab-icon">🎵</span>
                        <span class="tab-label">${t.media_tab_audio || 'Audio'}</span>
                        <span class="tab-count" id="itemMediaCountAudio">${mediaCounters.audios}</span>
                    </button>
                    <button type="button" class="media-tab" data-media-type="documents">
                        <span class="tab-icon">📄</span>
                        <span class="tab-label">${t.media_tab_documents || 'Documents'}</span>
                        <span class="tab-count" id="itemMediaCountDocuments">${mediaCounters.documents}</span>
                    </button>
                </div>
                
                <!-- Panneaux médias -->
                <div class="media-panels">
                    <div class="media-panel active" data-media-type="images" id="itemMediaPanelImages">
                        <p class="media-panel-hint">
                            <span class="hint-icon">💡</span>
                            ${t.media_hint_images || 'Ajoutez des photos. Formats acceptés : JPG, PNG, GIF, WebP.'}
                        </p>
                        <!-- Bouton caméra pour les images -->
                        <div class="media-panel-actions" id="itemMediaPanelImagesActions">
                            <button type="button" class="btn btn-secondary btn-camera-capture" id="btnItemCameraCapture" title="${t.take_photo || 'Prendre une photo'}">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                    <circle cx="12" cy="13" r="4"></circle>
                                </svg>
                                <span>${t.take_photo || 'Prendre une photo'}</span>
                            </button>
                        </div>
                        <div class="media-panel-content" id="itemMediaContentImages"></div>
                    </div>
                    <div class="media-panel" data-media-type="videos" id="itemMediaPanelVideos">
                        <p class="media-panel-hint">
                            <span class="hint-icon">💡</span>
                            ${t.media_hint_videos || 'Ajoutez des vidéos. Formats acceptés : MP4, WebM, AVI, MKV.'}
                        </p>
                        <div class="media-panel-content" id="itemMediaContentVideos"></div>
                    </div>
                    <div class="media-panel" data-media-type="audio" id="itemMediaPanelAudio">
                        <p class="media-panel-hint">
                            <span class="hint-icon">💡</span>
                            ${t.media_hint_audio || 'Ajoutez des fichiers audio. Formats acceptés : MP3, WAV, OGG, FLAC.'}
                        </p>
                        <div class="media-panel-content" id="itemMediaContentAudio"></div>
                    </div>
                    <div class="media-panel" data-media-type="documents" id="itemMediaPanelDocuments">
                        <p class="media-panel-hint">
                            <span class="hint-icon">💡</span>
                            ${t.media_hint_documents || 'Ajoutez des documents. Formats acceptés : PDF, DOC, XLS, TXT, ZIP.'}
                        </p>
                        <div class="media-panel-content" id="itemMediaContentDocuments"></div>
                    </div>
                </div>
            </div>
            </div><!-- Fin panneau Médias -->
        </form>
    `;
}

/**
 * Initialise le formulaire après ouverture de la modal
 * @param {string} modalId - ID du modal
 * @param {Object|null} item - Item à éditer (null si création)
 */
export function initItemForm(modalId, item) {
    const t = getTranslations();
    
    // Le modal est identifié par data-modal-id, pas par id
    const modal = document.querySelector(`[data-modal-id="${modalId}"]`);

    if (!modal) return;

    // Déterminer si on est en mode édition
    const isEdit = item !== null;

    // Initialisation du sélecteur de type primaire
    const primaryTypeSelect = modal.querySelector('#itemPrimaryType');
    if (primaryTypeSelect) {
        populatePrimaryTypeSelect(primaryTypeSelect, item?.id_primary_cat || null);
    }

    // Initialisation du sélecteur de catégories
    const categoriesSelect = modal.querySelector('#itemCategories');
    const toggleDefaultCategories = modal.querySelector('#toggleDefaultCategories');
    const toggleAutoSelectParents = modal.querySelector('#toggleAutoSelectParents');
    
    if (categoriesSelect) {
        createCategoriesSelector(categoriesSelect, item?.categories || [], {
            showDefaults: toggleDefaultCategories?.checked !== false,
            autoSelectParents: toggleAutoSelectParents?.checked !== false
        });
    }
    
    // Initialisation du sélecteur de statuts
    const statusSelect = modal.querySelector('#itemStatus');
    const toggleDefaultStatuses = modal.querySelector('#toggleDefaultStatuses');
    const btnManageStatuses = modal.querySelector('#btnManageStatuses');
    
    if (statusSelect) {
        // Peupler le select avec les statuts
        populateStatusSelect(statusSelect, item?.status_id || null, toggleDefaultStatuses?.checked !== false);
        
        // Gestion du toggle pour afficher/masquer les statuts par défaut
        if (toggleDefaultStatuses) {
            toggleDefaultStatuses.addEventListener('change', () => {
                const currentValue = statusSelect.value;
                populateStatusSelect(statusSelect, currentValue ? parseInt(currentValue) : null, toggleDefaultStatuses.checked);
            });
        }
        
        // Gestion du bouton pour gérer ses propres statuts
        if (btnManageStatuses) {
            btnManageStatuses.addEventListener('click', () => {
                openManageStatusesModal(modalId, statusSelect, toggleDefaultStatuses);
            });
        }
    }
    
    // Initialisation du sélecteur de grades
    const gradesSelect = modal.querySelector('#itemGrades');
    if (gradesSelect) {
        // Charger les grades initiaux selon les catégories de l'item
        const initialCategoryIds = item?.categories?.map(c => c.id || c.category_id) || [];
        populateGradesSelectByCategories(gradesSelect, item?.grades || [], initialCategoryIds);
        
        // Écouter les changements de catégories pour mettre à jour les grades
        if (categoriesSelect) {
            categoriesSelect.addEventListener('change', () => {
                // Récupérer les catégories sélectionnées
                const selectedCategoryIds = Array.from(categoriesSelect.selectedOptions).map(opt => parseInt(opt.value));
                // Conserver les grades déjà sélectionnés
                const currentGrades = Array.from(gradesSelect.selectedOptions).map(opt => ({ grade_id: parseInt(opt.value) }));
                // Recharger les grades disponibles selon les nouvelles catégories
                populateGradesSelectByCategories(gradesSelect, currentGrades, selectedCategoryIds);
            });
        }
    }
    
    // Initialisation du sélecteur de lieu de stockage
    const storageSelect = modal.querySelector('#itemStorageLocation');
    if (storageSelect) {
        populateStorageLocationSelect(storageSelect, item?.storage_location_id || null);
    }
    
    // Initialisation des MediaListManager pour chaque type de média
    const mediaManagers = {};
    const mediaTypes = ['images', 'videos', 'audio', 'documents'];
    
    mediaTypes.forEach(mediaType => {
        const capitalizedType = mediaType.charAt(0).toUpperCase() + mediaType.slice(1);
        const contentContainer = modal.querySelector(`#itemMediaContent${capitalizedType}`);
        
        if (contentContainer && typeof MediaListManager !== 'undefined') {
            try {
                mediaManagers[mediaType] = MediaListManager.create({
                    container: contentContainer,
                    type: mediaType,
                    apiEndpoint: '/api/item-media.php',
                    entityType: 'item',
                    entityId: isEdit ? item.id : null,
                    userId: window.collectionUserId,
                    isDefault: false,
                    readonly: false,
                    onFilesChange: (data) => {
                        // Mettre à jour le compteur de l'onglet individuel
                        const count = data.files.length + data.pendingFiles.length;
                        const countEl = modal.querySelector(`#itemMediaCount${capitalizedType}`);
                        if (countEl) {
                            countEl.textContent = count;
                        }
                        // Mettre à jour le compteur total de l'onglet Médias
                        updateTotalMediaCount(modal);
                    },
                    onError: (message) => {
                        showToast(message, 'error');
                    }
                });
                
                // Charger les médias existants si édition
                if (isEdit && item.id) {
                    mediaManagers[mediaType].loadFiles();
                }
            } catch (err) {
                console.error(`[Collection] Error creating MediaListManager for ${mediaType}:`, err);
            }
        }
    });
    
    // Stocker les managers sur la modal pour y accéder dans handleItemSubmit
    modal._mediaManagers = mediaManagers;
    
    // Gestion du bouton caméra pour les images
    const btnCameraCapture = modal.querySelector('#btnItemCameraCapture');
    
    if (btnCameraCapture && typeof CameraCapture !== 'undefined') {
        btnCameraCapture.addEventListener('click', () => {
            CameraCapture.open({
                caller: modalId,
                targetField: 'item-images',
                facingMode: 'environment',
                skipEditor: false,
                onCapture: async (result) => {
                    if (mediaManagers.images) {
                        await mediaManagers.images.addFromImageEditor(result);
                    }
                },
                onCancel: () => {}
            });
        });
    } else if (btnCameraCapture) {
        btnCameraCapture.style.display = 'none';
    }
    
    // Gestion des onglets médias
    const mediaTabs = modal.querySelectorAll('.media-tab');
    const mediaPanels = modal.querySelectorAll('.media-panel');
    
    mediaTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            const targetType = tab.dataset.mediaType;
            
            // Désactiver tous les onglets et panneaux
            mediaTabs.forEach(t => t.classList.remove('active'));
            mediaPanels.forEach(p => p.classList.remove('active'));
            
            // Activer l'onglet et le panneau ciblés
            tab.classList.add('active');
            const targetPanel = modal.querySelector(`.media-panel[data-media-type="${targetType}"]`);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
        });
    });

    // Gestion des onglets principaux du formulaire
    const mainTabs = modal.querySelectorAll('.form-main-tab');
    const mainPanels = modal.querySelectorAll('.form-main-panel');
    
    mainTabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTab = tab.dataset.tab;
            
            // Désactiver tous les onglets et panneaux
            mainTabs.forEach(t => t.classList.remove('active'));
            mainPanels.forEach(p => p.classList.remove('active'));
            
            // Activer l'onglet et le panneau ciblés
            tab.classList.add('active');
            const targetPanel = modal.querySelector(`.form-main-panel[data-tab="${targetTab}"]`);
            if (targetPanel) {
                targetPanel.classList.add('active');
            }
        });
    });

    // Gestion du changement de type primaire pour les métadonnées
    const primaryTypeSelectForMeta = modal.querySelector('#itemPrimaryType');
    if (primaryTypeSelectForMeta) {
        // Charger les champs au changement de type
        primaryTypeSelectForMeta.addEventListener('change', () => {
            loadMetadataFields(modal, primaryTypeSelectForMeta.value, null);
        });
        
        // Charger les métadonnées initiales si édition
        if (isEdit && item?.id) {
            loadMetadataFields(modal, item.id_primary_cat, item.id);
        } else if (primaryTypeSelectForMeta.value) {
            loadMetadataFields(modal, primaryTypeSelectForMeta.value, null);
        }
    }
    
    // Stocker les données de métadonnées sur la modal
    modal._metadataFields = [];
    modal._metadataValues = {};
    
    // Gestion du bouton de recherche web
    const btnWebSearch = modal.querySelector('#btnWebSearch');
    const itemNameInput = modal.querySelector('#itemName');
    
    if (btnWebSearch && typeof WebSearchModal !== 'undefined') {
        btnWebSearch.addEventListener('click', () => {
            const itemName = itemNameInput?.value.trim() || '';
            const primaryTypeSelect = modal.querySelector('#itemPrimaryType');
            const currentPrimaryTypeId = primaryTypeSelect?.value ? parseInt(primaryTypeSelect.value) : null;
            
            WebSearchModal.open({
                query: itemName,
                currentPrimaryTypeId: currentPrimaryTypeId,
                onSelect: async (result) => {
                    console.log('[Collection] Résultat WebSearch reçu:', result);
                    
                    // Nouveau format enrichi avec fieldsToImport
                    if (result.fieldsToImport) {
                        // Détecter les conflits (champs non-vides)
                        const conflicts = detectImportConflicts(modal, result);
                        
                        // Filtrer pour ne garder que les vrais conflits (champs non-vides)
                        const realFieldConflicts = conflicts.fields.filter(f => !f.isEmpty);
                        const realMediaConflicts = conflicts.media.filter(m => !m.isEmpty);
                        
                        // S'il y a des conflits réels, afficher le modal de confirmation avec toggles
                        if (realFieldConflicts.length > 0 || realMediaConflicts.length > 0) {
                            const confirmHtml = buildImportConfirmationHtml(conflicts, result);
                            
                            // Utiliser une promesse custom pour récupérer les choix avant fermeture
                            const userResponse = await new Promise((resolve) => {
                                ModalManager.open({
                                    template: 'confirm',
                                    message: confirmHtml,
                                    title: t.import_confirm_title || 'Confirmer l\'import',
                                    type: 'info',
                                    confirmText: t.import_confirm_yes || 'Importer',
                                    cancelText: t.import_confirm_cancel || 'Annuler',
                                    customClass: 'import-confirmation-modal',
                                    onConfirm: () => {
                                        // Récupérer les choix AVANT la fermeture du modal
                                        const confirmOverlay = document.querySelector('.import-confirmation-modal');
                                        if (confirmOverlay) {
                                            const choices = getImportChoices(confirmOverlay);
                                            resolve({ confirmed: true, choices });
                                        } else {
                                            resolve({ confirmed: true, choices: {} });
                                        }
                                    },
                                    onCancel: () => resolve({ confirmed: false, choices: {} }),
                                    onClose: (id, reason) => {
                                        if (reason === 'escape' || reason === 'overlay') {
                                            resolve({ confirmed: false, choices: {} });
                                        }
                                    }
                                });
                            });
                            
                            if (!userResponse.confirmed) {
                                console.log('[Collection] Import annulé par l\'utilisateur');
                                showToast(t.import_cancelled || 'Import annulé', 'info');
                                return;
                            }
                            
                            // Procéder à l'import avec les choix
                            await applyWebSearchImportModule(modal, result, applyImportedMetadata, refreshStickerGrid, userResponse.choices);
                        } else {
                            // Pas de conflits, importer directement
                            await applyWebSearchImportModule(modal, result, applyImportedMetadata, refreshStickerGrid, {});
                        }
                        
                    } else {
                        // Ancien format de compatibilité (result.title, result.description directement)
                        if (result.title && itemNameInput) {
                            itemNameInput.value = result.title;
                        }
                        
                        const descriptionField = modal.querySelector('#itemDescription');
                        if (result.description && descriptionField) {
                            descriptionField.value = result.description;
                        }
                        
                        const barcodeField = modal.querySelector('#itemBarcode');
                        if (result.metadata?.barcode && barcodeField) {
                            barcodeField.value = result.metadata.barcode;
                        }
                    }
                }
            });
        });
    }
}

/**
 * Gère la soumission du formulaire d'item
 * @param {string} modalId - ID du modal
 * @param {Object|null} existingItem - Item existant (null si création)
 * @param {Object} modalData - Référence à l'objet data du modal
 */
export async function handleItemSubmit(modalId, existingItem, modalData = null) {
    const t = getTranslations();
    // CONFIG est déjà importé depuis state.js
    
    const modal = document.querySelector(`[data-modal-id="${modalId}"]`);
    if (!modal) {
        console.error('[Collection] Modal not found for submit:', modalId);
        return;
    }

    const form = modal.querySelector('#itemForm');
    if (!form) {
        console.error('[Collection] Form not found in modal');
        return;
    }

    // Validation basique
    const name = form.querySelector('#itemName').value.trim();
    if (!name) {
        showError(t.field_name + ' ' + (t.name_required || 'is required'));
        return;
    }

    // Récupérer les valeurs du formulaire
    const statusValue = form.querySelector('#itemStatus').value;
    const primaryTypeValue = form.querySelector('#itemPrimaryType').value;
    
    // Récupérer storage_location
    const storageLocationEl = form.querySelector('#itemStorageLocation');
    let storageLocationValue = null;
    if (storageLocationEl) {
        if (storageLocationEl.tagName === 'SELECT') {
            storageLocationValue = storageLocationEl.value ? parseInt(storageLocationEl.value) : null;
        } else {
            storageLocationValue = storageLocationEl.value.trim() || null;
        }
    }
    
    // Récupérer les grades sélectionnés
    const gradesSelect = form.querySelector('#itemGrades');
    const selectedGradeIds = gradesSelect ? 
        Array.from(gradesSelect.selectedOptions).map(opt => parseInt(opt.value)) : [];
    
    const formData = {
        name: name,
        description: form.querySelector('#itemDescription').value.trim(),
        note: form.querySelector('#itemNotes').value.trim(),
        rating: parseFloat(form.querySelector('#itemRating').value) || null,
        status_id: statusValue ? parseInt(statusValue) : null,
        id_primary_cat: primaryTypeValue ? parseInt(primaryTypeValue) : null,
        purchase_price: parseFloat(form.querySelector('#itemPurchasePrice').value) || null,
        market_value: parseFloat(form.querySelector('#itemMarketValue').value) || null,
        acquisition_date: form.querySelector('#itemAcquisitionDate').value || null,
        code_barre: form.querySelector('#itemBarcode').value.trim(),
        category_ids: Array.from(form.querySelector('#itemCategories').selectedOptions).map(opt => parseInt(opt.value)),
        storage_location_id: storageLocationValue,
        grade_ids: selectedGradeIds
    };

    // Si édition, ajouter l'ID
    if (existingItem) {
        formData.id = existingItem.id;
    }

    try {
        const response = await fetch(CONFIG.API_ENDPOINT, {
            method: existingItem ? 'PUT' : 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (data.success) {
            const itemId = existingItem ? existingItem.id : data.data?.id;
            const mediaManagers = modal._mediaManagers;
            
            // Finaliser les médias pending pour chaque type
            if (itemId && mediaManagers) {
                for (const [mediaType, manager] of Object.entries(mediaManagers)) {
                    const pendingFiles = manager.getPendingFiles();
                    if (pendingFiles && pendingFiles.length > 0) {
                        try {
                            manager.setEntityId(itemId);
                            await manager.finalizePendingFiles();
                        } catch (mediaErr) {
                            console.error(`[Collection] Erreur finalisation médias ${mediaType}:`, mediaErr);
                        }
                    }
                }
            }
            
            // Sauvegarder les métadonnées
            if (itemId) {
                const metadataValues = collectMetadataValues(modal);
                if (Object.keys(metadataValues).length > 0 || existingItem) {
                    try {
                        const typeId = primaryTypeValue ? parseInt(primaryTypeValue) : null;
                        const metadataResponse = await fetch('/api/item-metadata.php', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            credentials: 'include',
                            body: JSON.stringify({
                                item_id: itemId,
                                type_id: typeId,
                                metadata: metadataValues
                            })
                        });
                        
                        const metadataData = await metadataResponse.json();
                        if (!metadataData.success) {
                            console.warn('[Collection] Erreur sauvegarde métadonnées:', metadataData.error);
                        }
                    } catch (metaErr) {
                        console.error('[Collection] Erreur sauvegarde métadonnées:', metaErr);
                    }
                }
            }
            
            showToast(existingItem ? t.updated_success : t.created_success, 'success');
            
            // Mettre à jour les données de la modal pour refléter le nouvel item
            if (!existingItem && data.data?.id && modalData) {
                modalData.item = { id: data.data.id, name: name };
                modalData.isEdit = true;
                console.log('[Collection] Item créé, modal mis à jour pour édition:', modalData.item.id);
            }
            
            // Rafraîchir la liste via événement custom
            document.dispatchEvent(new CustomEvent('collection:itemSaved', { 
                detail: { item: data.data, isNew: !existingItem }
            }));
        } else {
            showError(data.error || t.error_save);
        }
    } catch (error) {
        console.error('[Collection] Erreur sauvegarde item:', error);
        showError(t.error_save);
    }
}

/**
 * Ouvre la modal d'ajout d'un nouvel item
 */
export function openAddItemModal() {
    openItemEditModal(null);
}

/**
 * Ouvre la modal d'édition (création ou modification) d'un item
 * @param {Object|null} item - Item à éditer (null si création)
 */
export function openItemEditModal(item = null) {
    const t = getTranslations();
    const isEdit = item !== null;
    
    // Construire le formulaire
    const formHtml = buildItemFormHtml(item);

    // Boutons de la modal
    const buttons = [];
    
    // Bouton supprimer uniquement en mode édition
    if (isEdit) {
        buttons.push({ 
            text: t.delete, 
            action: 'delete-item', 
            class: 'btn-danger'
        });
    }
    
    buttons.push({ text: t.cancel, action: 'close', class: 'btn-secondary' });
    buttons.push({ 
        text: t.save, 
        action: 'save-item', 
        class: 'btn-primary'
    });

    const modalId = ModalManager.open({
        template: 'base',
        title: isEdit ? t.modal_edit_title : t.modal_add_title,
        content: formHtml,
        size: 'modal-lg',
        customClass: 'modal-item-edit',
        buttons: buttons,
        data: { item: item, isEdit: isEdit },
        onAction: async (action, id, data) => {
            if (action === 'save-item') {
                await handleItemSubmit(id, data.item, data);
            } else if (action === 'delete-item' && data.item) {
                const confirmed = await ModalManager.confirm(t.delete_confirm_message, {
                    title: t.delete_confirm_title,
                    type: 'danger',
                    confirmText: t.delete,
                    cancelText: t.cancel
                });
                if (confirmed) {
                    await apiDeleteItem(data.item.id);
                    ModalManager.close(id);
                    // Notifier la suppression pour rafraîchir la liste
                    document.dispatchEvent(new CustomEvent('collection:itemDeleted', { 
                        detail: { itemId: data.item.id } 
                    }));
                    showToast(t.deleted_success || 'Item supprimé', 'success');
                }
            }
        },
        onOpen: (id, overlay) => {
            // Initialiser le formulaire après ouverture
            initItemForm(id, item);
        }
    });
}
