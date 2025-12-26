/**
 * SnowShelf - Admin Field Mappings Module
 * Gestion des mappings de champs (globalaux)
 */

import { API_ENDPOINTS } from '/assets/js/admin/core/config.js';
import { showToast, showLoading, escapeHtml, renderIcon } from '/assets/js/admin/core/utils.js';
import { setDeleteTarget, setFieldMappingsData, setTransformTypesData, setPrimaryTypesData, setTypeFieldsData, primaryTypesData, typeFieldsData, transformTypesData } from '/assets/js/admin/core/state.js';
import { initFilterDropdown, initModalCustomDropdown } from '/assets/js/admin/ui/dropdown.js';

const FIELD_MAPPINGS_API = API_ENDPOINTS.FIELD_MAPPINGS;

// Éléments DOM
let elements = {};
let onDeleteCallback = null;

// Données locales pour le filtrage
let localFieldMappingsData = [];

/**
 * Charge les mappings de champs
 */
export async function loadFieldMappings() {
    if (!elements.fieldMappingsTableBody) return;

    try {
        const response = await fetch(FIELD_MAPPINGS_API, {
            credentials: 'same-origin'
        });
        const result = await response.json();

        if (result.success) {
            const mappings = result.data.mappings || [];
            localFieldMappingsData = mappings;
            setFieldMappingsData(mappings);
            
            // Stocker les types primaires et champs depuis l'API
            if (result.data.primary_types && result.data.primary_types.length > 0) {
                setPrimaryTypesData(result.data.primary_types);
            }
            if (result.data.fields && result.data.fields.length > 0) {
                setTypeFieldsData(result.data.fields);
            }
            
            // Stocker les transformations si présentes
            if (result.data.transforms) {
                setTransformTypesData(result.data.transforms);
            }
            
            // Peupler les dropdowns de filtre
            populateFieldMappingsFilterDropdowns();
            
            // Rendre le tableau avec les filtres actuels
            renderFieldMappingsFiltered();
        }
    } catch (error) {
        console.error('Load field mappings error:', error);
    }
}

/**
 * Peuple les dropdowns de filtre avec les types et champs
 * Préserve les valeurs de filtre actuelles
 */
function populateFieldMappingsFilterDropdowns() {
    // Sauvegarder les valeurs actuelles des filtres
    const typeSelect = document.getElementById('mappingsTypeFilter');
    const fieldSelect = document.getElementById('mappingsFieldFilter');
    const currentTypeFilter = typeSelect ? typeSelect.value : '';
    const currentFieldFilter = fieldSelect ? fieldSelect.value : '';
    
    // Dropdown de filtre par type
    const typeMenu = document.querySelector('#mappingsTypeFilterDropdown .custom-dropdown-menu');
    if (typeMenu && typeSelect) {
        // Récupérer les types uniques présents dans les mappings
        const usedTypeIds = new Set();
        localFieldMappingsData.forEach(mapping => {
            usedTypeIds.add(mapping.primary_type_id || 0);
        });
        
        // Peupler le select natif
        typeSelect.innerHTML = '<option value="">Tous les types</option>';
        if (usedTypeIds.has(0)) {
            typeSelect.innerHTML += '<option value="0">Global</option>';
        }
        primaryTypesData.filter(type => usedTypeIds.has(type.id)).forEach(type => {
            typeSelect.innerHTML += `<option value="${type.id}">${escapeHtml(type.name_fr || type.name || type.inter_name)}</option>`;
        });
        
        // Restaurer la valeur du filtre si elle existe toujours
        if (currentTypeFilter && typeSelect.querySelector(`option[value="${currentTypeFilter}"]`)) {
            typeSelect.value = currentTypeFilter;
        }
        
        let html = `
            <div class="custom-dropdown-option ${currentTypeFilter === '' ? 'selected' : ''}" data-value="" data-icon="📋">
                <span class="custom-dropdown-option-icon">📋</span>
                <span class="custom-dropdown-option-text">Tous les types</span>
            </div>
        `;
        
        // Ajouter l'option "Global" si utilisée
        if (usedTypeIds.has(0)) {
            html += `
                <div class="custom-dropdown-option ${currentTypeFilter === '0' ? 'selected' : ''}" data-value="0" data-icon="🌐">
                    <span class="custom-dropdown-option-icon">🌐</span>
                    <span class="custom-dropdown-option-text">Global</span>
                </div>
            `;
        }
        
        // Ajouter les types primaires utilisés
        primaryTypesData.filter(type => usedTypeIds.has(type.id)).forEach(type => {
            const icon = type.icon || '📋';
            const iconHtml = renderIconForDropdown(icon);
            html += `
                <div class="custom-dropdown-option ${currentTypeFilter == type.id ? 'selected' : ''}" data-value="${type.id}" data-icon="${escapeHtml(icon)}">
                    <span class="custom-dropdown-option-icon">${iconHtml}</span>
                    <span class="custom-dropdown-option-text">${escapeHtml(type.name_fr || type.name || type.inter_name)}</span>
                </div>
            `;
        });
        
        typeMenu.innerHTML = html;
        
        // Mettre à jour le texte du trigger si un filtre est sélectionné
        const typeTrigger = document.querySelector('#mappingsTypeFilterDropdown .custom-dropdown-trigger-text');
        if (typeTrigger && currentTypeFilter) {
            const selectedOption = typeMenu.querySelector(`.custom-dropdown-option[data-value="${currentTypeFilter}"]`);
            if (selectedOption) {
                typeTrigger.textContent = selectedOption.querySelector('.custom-dropdown-option-text').textContent;
            }
        }
    }
    
    // Dropdown de filtre par champ
    const fieldMenu = document.querySelector('#mappingsFieldFilterDropdown .custom-dropdown-menu');
    if (fieldMenu && fieldSelect) {
        const fieldsMap = new Map();
        localFieldMappingsData.forEach(mapping => {
            if (mapping.field_id && !fieldsMap.has(mapping.field_id)) {
                fieldsMap.set(mapping.field_id, {
                    id: mapping.field_id,
                    name: getFieldName(mapping.field_id)
                });
            }
        });
        
        // Peupler le select natif
        fieldSelect.innerHTML = '<option value="">Tous les champs</option>';
        fieldsMap.forEach(field => {
            fieldSelect.innerHTML += `<option value="${field.id}">${escapeHtml(field.name)}</option>`;
        });
        
        // Restaurer la valeur du filtre si elle existe toujours
        if (currentFieldFilter && fieldSelect.querySelector(`option[value="${currentFieldFilter}"]`)) {
            fieldSelect.value = currentFieldFilter;
        }
        
        let html = `
            <div class="custom-dropdown-option ${currentFieldFilter === '' ? 'selected' : ''}" data-value="" data-icon="🏷️">
                <span class="custom-dropdown-option-icon">🏷️</span>
                <span class="custom-dropdown-option-text">Tous les champs</span>
            </div>
        `;
        
        fieldsMap.forEach(field => {
            html += `
                <div class="custom-dropdown-option ${currentFieldFilter == field.id ? 'selected' : ''}" data-value="${field.id}" data-icon="🏷️">
                    <span class="custom-dropdown-option-icon">🏷️</span>
                    <span class="custom-dropdown-option-text">${escapeHtml(field.name)}</span>
                </div>
            `;
        });
        
        fieldMenu.innerHTML = html;
        
        // Mettre à jour le texte du trigger si un filtre est sélectionné
        const fieldTrigger = document.querySelector('#mappingsFieldFilterDropdown .custom-dropdown-trigger-text');
        if (fieldTrigger && currentFieldFilter) {
            const selectedOption = fieldMenu.querySelector(`.custom-dropdown-option[data-value="${currentFieldFilter}"]`);
            if (selectedOption) {
                fieldTrigger.textContent = selectedOption.querySelector('.custom-dropdown-option-text').textContent;
            }
        }
    }
}

/**
 * Rend une icône pour les dropdowns (simplifié)
 * @param {string} icon - Icône (emoji ou mdi)
 * @returns {string} HTML de l'icône
 */
function renderIconForDropdown(icon) {
    if (!icon) return '📋';
    // Si c'est une icône MDI
    if (icon.startsWith('mdi') || icon.includes(':')) {
        let mdiClass = icon;
        if (icon.includes(':')) {
            mdiClass = icon.replace(':', '-');
        }
        if (!mdiClass.startsWith('mdi-')) {
            mdiClass = 'mdi-' + mdiClass;
        }
        return `<i class="mdi ${mdiClass}"></i>`;
    }
    // C'est un émoji
    return icon;
}

/**
 * Rend les mappings filtrés selon les dropdowns
 */
function renderFieldMappingsFiltered() {
    const typeFilter = document.getElementById('mappingsTypeFilter');
    const fieldFilter = document.getElementById('mappingsFieldFilter');
    
    const filterTypeId = typeFilter ? typeFilter.value : '';
    const filterFieldId = fieldFilter ? fieldFilter.value : '';
    
    let mappings = localFieldMappingsData;
    
    if (filterTypeId) {
        mappings = mappings.filter(m => (m.primary_type_id || 0) == filterTypeId);
    }
    
    if (filterFieldId) {
        mappings = mappings.filter(m => m.field_id == filterFieldId);
    }
    
    renderFieldMappings(mappings);
}

/**
 * Récupère le nom du type principal par son ID
 * @param {number} typeId - ID du type
 * @returns {string} Nom du type ou 'Global'
 */
function getTypeName(typeId) {
    if (!typeId) return 'Global';
    const type = primaryTypesData.find(t => t.id == typeId);
    return type ? (type.name_fr || type.inter_name) : 'Inconnu';
}

/**
 * Récupère le nom du champ de type par son ID
 * @param {number} fieldId - ID du champ
 * @returns {string} Nom du champ ou 'Inconnu'
 */
function getFieldName(fieldId) {
    const field = typeFieldsData.find(f => f.id == fieldId);
    return field ? field.field_key : 'Inconnu';
}

/**
 * Rend les mappings de champs dans le tableau
 * @param {Array} mappings - Liste des mappings
 */
function renderFieldMappings(mappings) {
    if (mappings.length === 0) {
        elements.fieldMappingsTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted">Aucun mapping trouvé</td>
            </tr>
        `;
        return;
    }

    elements.fieldMappingsTableBody.innerHTML = mappings.map(mapping => {
        const apiKeys = Array.isArray(mapping.api_keys) ? mapping.api_keys.join(', ') : (mapping.api_keys || '-');
        const fieldLang = mapping.field_lang || {};
        const fieldName = fieldLang.fr?.name || mapping.field_key || getFieldName(mapping.field_id);
        
        return `
            <tr data-mapping-id="${mapping.id}">
                <td><span class="badge badge-type">${escapeHtml(mapping.type_name_fr || getTypeName(mapping.primary_type_id))}</span></td>
                <td><code>${escapeHtml(fieldName)}</code></td>
                <td><code class="api-keys">${escapeHtml(apiKeys)}</code></td>
                <td><span class="badge badge-outline">${escapeHtml(mapping.transform_type || 'none')}</span></td>
                <td class="text-center">
                    ${mapping.is_active 
                        ? '<span class="status-badge status-verified"><span class="status-dot"></span>Actif</span>'
                        : '<span class="status-badge status-pending"><span class="status-dot"></span>Inactif</span>'
                    }
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon btn-edit" onclick="SettingsPanel.editFieldMapping(${mapping.id})" title="Modifier">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                            </svg>
                        </button>
                        <button class="btn-icon btn-delete" onclick="SettingsPanel.deleteFieldMapping(${mapping.id}, '${escapeHtml(apiKeys).replace(/'/g, "\\'")}')" title="Supprimer">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Ouvre le modal d'ajout de mapping
 */
export async function openAddFieldMappingModal() {
    console.log('[FieldMappings] Opening add modal');
    elements.fieldMappingModalTitle.textContent = 'Ajouter un mapping';
    showLoading(true);
    
    try {
        // Réinitialiser le formulaire
        elements.fieldMappingForm.reset();
        document.getElementById('fieldMappingId').value = '';
        
        // Réinitialiser les champs spécifiques
        document.getElementById('fieldMappingApiKeys').value = '';
        document.getElementById('fieldMappingPriority').value = '0';
        document.getElementById('fieldMappingActive').checked = true;
        
        const transformConfigEl = document.getElementById('fieldMappingTransformConfig');
        if (transformConfigEl) transformConfigEl.value = '';
        
        // Si les données de référence ne sont pas encore chargées, les charger d'abord
        if (primaryTypesData.length === 0 || typeFieldsData.length === 0) {
            const refResponse = await fetch(FIELD_MAPPINGS_API, {
                credentials: 'same-origin'
            });
            const refResult = await refResponse.json();
            if (refResult.success && refResult.data) {
                if (refResult.data.primary_types) {
                    setPrimaryTypesData(refResult.data.primary_types);
                }
                if (refResult.data.fields) {
                    setTypeFieldsData(refResult.data.fields);
                }
                if (refResult.data.transforms) {
                    setTransformTypesData(refResult.data.transforms);
                }
            }
        }
        
        // Peupler les dropdowns (sans valeurs sélectionnées pour un ajout)
        populateMappingTypeDropdown(null);
        populateMappingFieldDropdown(null, null);
        populateTransformTypeDropdown('none');
        
        // Initialiser les listeners
        initTypeFieldFilter();
        initTransformConfigToggle();
        
        // Masquer le champ config pour un nouveau mapping
        toggleTransformConfigField('none');
        
        // Afficher le modal
        elements.fieldMappingModal.classList.add('active');
        
    } catch (error) {
        console.error('[FieldMappings] Error opening add modal:', error);
        showToast('Erreur lors de l\'ouverture du modal', 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Ouvre le modal d'édition de mapping
 * @param {number} id - ID du mapping
 */
export async function openEditFieldMappingModal(id) {
    console.log('[FieldMappings] Opening edit modal for id:', id);
    elements.fieldMappingModalTitle.textContent = 'Modifier le mapping';
    showLoading(true);

    try {
        // Si les données de référence ne sont pas encore chargées, les charger d'abord
        if (primaryTypesData.length === 0 || typeFieldsData.length === 0) {
            const refResponse = await fetch(FIELD_MAPPINGS_API, {
                credentials: 'same-origin'
            });
            const refResult = await refResponse.json();
            if (refResult.success && refResult.data) {
                if (refResult.data.primary_types) {
                    setPrimaryTypesData(refResult.data.primary_types);
                }
                if (refResult.data.fields) {
                    setTypeFieldsData(refResult.data.fields);
                }
                if (refResult.data.transforms) {
                    setTransformTypesData(refResult.data.transforms);
                }
            }
        }
        
        const response = await fetch(`${FIELD_MAPPINGS_API}?id=${id}`, {
            credentials: 'same-origin'
        });
        const result = await response.json();

        if (result.success) {
            const mapping = result.data;
            
            // Réinitialiser le formulaire
            elements.fieldMappingForm.reset();
            
            // Définir l'ID
            document.getElementById('fieldMappingId').value = mapping.id;
            
            // Peupler les dropdowns avec les valeurs sélectionnées
            populateMappingTypeDropdown(mapping.primary_type_id);
            populateMappingFieldDropdown(mapping.field_id, mapping.primary_type_id);
            populateTransformTypeDropdown(mapping.transform_type);
            
            // Définir les valeurs des autres champs APRÈS les dropdowns
            const apiKeysValue = Array.isArray(mapping.api_keys) ? mapping.api_keys.join(', ') : (mapping.api_keys || '');
            document.getElementById('fieldMappingApiKeys').value = apiKeysValue;
            document.getElementById('fieldMappingPriority').value = mapping.priority || 0;
            document.getElementById('fieldMappingActive').checked = mapping.is_active == 1;
            
            // Gérer le transform_config
            const transformConfigEl = document.getElementById('fieldMappingTransformConfig');
            if (transformConfigEl) {
                if (mapping.transform_config && typeof mapping.transform_config === 'object') {
                    transformConfigEl.value = JSON.stringify(mapping.transform_config, null, 2);
                } else if (mapping.transform_config) {
                    transformConfigEl.value = mapping.transform_config;
                } else {
                    transformConfigEl.value = '';
                }
            }
            
            // Afficher/masquer le champ config selon le type de transformation
            toggleTransformConfigField(mapping.transform_type);
            
            // Initialiser les listeners
            initTypeFieldFilter();
            initTransformConfigToggle();
            
            // Afficher le modal
            elements.fieldMappingModal.classList.add('active');
        } else {
            showToast(result.message || 'Erreur lors du chargement', 'error');
        }
    } catch (error) {
        console.error('[FieldMappings] Load error:', error);
        showToast('Erreur de connexion', 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Ferme le modal mapping
 */
export function closeFieldMappingModal() {
    elements.fieldMappingModal.classList.remove('active');
}

/**
 * Remplit le dropdown des types pour mapping (select natif + custom dropdown)
 * @param {number} selectedId - ID du type sélectionné
 */
function populateMappingTypeDropdown(selectedId) {
    const select = document.getElementById('fieldMappingTypeId');
    const menu = document.querySelector('#fieldMappingTypeDropdown .custom-dropdown-menu');
    const trigger = document.querySelector('#fieldMappingTypeDropdown .custom-dropdown-trigger');
    
    if (!select) return;
    
    // Peupler le select natif
    const globalSelected = !selectedId ? 'selected' : '';
    select.innerHTML = `<option value="" ${globalSelected}>Global (tous types)</option>`;
    primaryTypesData.forEach(type => {
        const selected = type.id == selectedId ? 'selected' : '';
        select.innerHTML += `<option value="${type.id}" ${selected}>${escapeHtml(type.name_fr || type.inter_name)}</option>`;
    });
    
    // Peupler le custom dropdown menu
    if (menu) {
        let html = `
            <div class="custom-dropdown-option ${!selectedId ? 'selected' : ''}" data-value="" data-icon="🌐">
                <span class="custom-dropdown-option-icon">🌐</span>
                <span class="custom-dropdown-option-text">Global (tous types)</span>
            </div>
        `;
        
        primaryTypesData.forEach(type => {
            const icon = type.icon || '📋';
            const iconHtml = renderIconForDropdown(icon);
            const isSelected = type.id == selectedId ? 'selected' : '';
            html += `
                <div class="custom-dropdown-option ${isSelected}" data-value="${type.id}" data-icon="${escapeHtml(icon)}">
                    <span class="custom-dropdown-option-icon">${iconHtml}</span>
                    <span class="custom-dropdown-option-text">${escapeHtml(type.name_fr || type.inter_name)}</span>
                </div>
            `;
        });
        
        menu.innerHTML = html;
    }
    
    // Mettre à jour le trigger
    if (trigger) {
        const iconEl = trigger.querySelector('.custom-dropdown-icon');
        const textEl = trigger.querySelector('.custom-dropdown-text');
        if (selectedId) {
            const selectedType = primaryTypesData.find(t => t.id == selectedId);
            if (selectedType) {
                if (iconEl) iconEl.innerHTML = renderIconForDropdown(selectedType.icon);
                if (textEl) textEl.textContent = selectedType.name_fr || selectedType.inter_name;
            }
            // Définir explicitement la valeur du select
            select.value = selectedId;
        } else {
            if (iconEl) iconEl.textContent = '🌐';
            if (textEl) textEl.textContent = 'Global (tous types)';
            select.value = '';
        }
    }
    
    // Initialiser le custom dropdown
    initModalCustomDropdown('fieldMappingTypeDropdown', 'fieldMappingTypeId');
}

/**
 * Remplit le dropdown des champs pour mapping (select natif + custom dropdown)
 * @param {number} selectedId - ID du champ sélectionné
 * @param {number} filterTypeId - ID du type primaire pour filtrer (optionnel)
 */
function populateMappingFieldDropdown(selectedId, filterTypeId = null) {
    const select = document.getElementById('fieldMappingFieldId');
    const menu = document.querySelector('#fieldMappingFieldDropdown .custom-dropdown-menu');
    const trigger = document.querySelector('#fieldMappingFieldDropdown .custom-dropdown-trigger');
    
    if (!select) return;
    
    // Filtrer les champs par type si un type est sélectionné
    let fieldsToShow = typeFieldsData;
    if (filterTypeId) {
        fieldsToShow = typeFieldsData.filter(f => f.primary_type_id == filterTypeId);
    }
    
    // Peupler le select natif
    select.innerHTML = '<option value="">-- Sélectionner un champ --</option>';
    if (fieldsToShow.length === 0) {
        select.innerHTML = '<option value="">-- Aucun champ disponible --</option>';
    } else {
        fieldsToShow.forEach(field => {
            const selected = field.id == selectedId ? 'selected' : '';
            const langData = field.lang || {};
            const label = langData.fr?.name || field.field_key;
            const typeName = !filterTypeId ? ` [${getTypeName(field.primary_type_id)}]` : '';
            select.innerHTML += `<option value="${field.id}" ${selected}>${escapeHtml(label)} (${field.field_key})${typeName}</option>`;
        });
    }
    
    // Peupler le custom dropdown menu
    if (menu) {
        let html = `
            <div class="custom-dropdown-option ${!selectedId ? 'selected' : ''}" data-value="" data-icon="🏷️">
                <span class="custom-dropdown-option-icon">🏷️</span>
                <span class="custom-dropdown-option-text">${fieldsToShow.length === 0 ? '-- Aucun champ disponible --' : '-- Sélectionner un champ --'}</span>
            </div>
        `;
        
        fieldsToShow.forEach(field => {
            const langData = field.lang || {};
            const label = langData.fr?.name || field.field_key;
            const typeName = !filterTypeId ? ` [${getTypeName(field.primary_type_id)}]` : '';
            const isSelected = field.id == selectedId ? 'selected' : '';
            html += `
                <div class="custom-dropdown-option ${isSelected}" data-value="${field.id}" data-icon="🏷️">
                    <span class="custom-dropdown-option-icon">🏷️</span>
                    <span class="custom-dropdown-option-text">${escapeHtml(label)} (${field.field_key})${typeName}</span>
                </div>
            `;
        });
        
        menu.innerHTML = html;
    }
    
    // Mettre à jour le trigger
    if (trigger) {
        const iconEl = trigger.querySelector('.custom-dropdown-icon');
        const textEl = trigger.querySelector('.custom-dropdown-text');
        if (selectedId) {
            const selectedField = typeFieldsData.find(f => f.id == selectedId);
            if (selectedField) {
                const langData = selectedField.lang || {};
                const label = langData.fr?.name || selectedField.field_key;
                if (iconEl) iconEl.textContent = '🏷️';
                if (textEl) textEl.textContent = `${label} (${selectedField.field_key})`;
            }
            // Définir explicitement la valeur du select
            select.value = selectedId;
        } else {
            if (iconEl) iconEl.textContent = '🏷️';
            if (textEl) textEl.textContent = fieldsToShow.length === 0 ? '-- Aucun champ disponible --' : '-- Sélectionner un champ --';
            select.value = '';
        }
    }
    
    // Initialiser le custom dropdown
    initModalCustomDropdown('fieldMappingFieldDropdown', 'fieldMappingFieldId');
}

/**
 * Initialise le filtre de champs par type (avec mise à jour du custom dropdown)
 */
function initTypeFieldFilter() {
    const typeSelect = document.getElementById('fieldMappingTypeId');
    const typeDropdown = document.getElementById('fieldMappingTypeDropdown');
    if (!typeSelect) return;
    
    // Supprimer l'ancien listener pour éviter les doublons
    typeSelect.removeEventListener('change', handleTypeChange);
    typeSelect.addEventListener('change', handleTypeChange);
    
    // Ajouter aussi un listener sur le menu custom dropdown pour les clics directs
    const typeMenu = typeDropdown?.querySelector('.custom-dropdown-menu');
    if (typeMenu) {
        // Utiliser un MutationObserver pour détecter quand la valeur change
        // ou simplement réattacher le listener après chaque clic sur une option
        typeMenu.addEventListener('click', (e) => {
            const option = e.target.closest('.custom-dropdown-option');
            if (option) {
                // Le select sera mis à jour par initModalCustomDropdown, 
                // puis l'event change sera déclenché
                // Utiliser setTimeout pour s'assurer que la valeur du select est mise à jour
                setTimeout(() => {
                    handleTypeChange();
                }, 10);
            }
        });
    }
}

/**
 * Gère le changement de type pour filtrer les champs
 */
function handleTypeChange() {
    const typeSelect = document.getElementById('fieldMappingTypeId');
    const selectedTypeId = typeSelect.value ? parseInt(typeSelect.value) : null;
    populateMappingFieldDropdown(null, selectedTypeId);
}

/**
 * Affiche/masque le champ de configuration selon le type de transformation
 * @param {string} transformType - Type de transformation sélectionné
 */
function toggleTransformConfigField(transformType) {
    const configGroup = document.getElementById('transformConfigGroup');
    const configHint = document.getElementById('transformConfigHint');
    if (!configGroup) return;
    
    // Transformations qui nécessitent une configuration
    const transformsWithConfig = {
        'array_join': { hint: 'Ex: {"separator": ", "}', placeholder: '{"separator": ", "}' },
        'status_mapping': { hint: 'Ex: {"new": "Neuf", "used": "Occasion"}', placeholder: '{"mapping": {...}}' },
        'custom': { hint: 'Configuration personnalisée JSON', placeholder: '{}' },
        'split': { hint: 'Ex: {"delimiter": ","}', placeholder: '{"delimiter": ","}' }
    };
    
    if (transformType && transformsWithConfig[transformType]) {
        configGroup.style.display = 'block';
        const config = transformsWithConfig[transformType];
        if (configHint) configHint.textContent = config.hint;
        const textarea = document.getElementById('fieldMappingTransformConfig');
        if (textarea && !textarea.value) {
            textarea.placeholder = config.placeholder;
        }
    } else {
        configGroup.style.display = 'none';
    }
}

/**
 * Initialise le listener pour afficher/masquer le champ config
 */
function initTransformConfigToggle() {
    const transformSelect = document.getElementById('fieldMappingTransformType');
    const transformDropdown = document.getElementById('fieldMappingTransformDropdown');
    if (!transformSelect) return;
    
    // Listener sur le select natif
    transformSelect.removeEventListener('change', handleTransformChange);
    transformSelect.addEventListener('change', handleTransformChange);
    
    // Listener sur le custom dropdown
    const transformMenu = transformDropdown?.querySelector('.custom-dropdown-menu');
    if (transformMenu) {
        transformMenu.addEventListener('click', (e) => {
            const option = e.target.closest('.custom-dropdown-option');
            if (option) {
                setTimeout(() => {
                    handleTransformChange();
                }, 10);
            }
        });
    }
}

/**
 * Gère le changement de transformation
 */
function handleTransformChange() {
    const transformSelect = document.getElementById('fieldMappingTransformType');
    const selectedTransform = transformSelect.value || 'none';
    toggleTransformConfigField(selectedTransform);
}

// Icons par défaut pour les transformations
const TRANSFORM_ICONS = {
    'none': '⚙️',
    'string': '📝',
    'number': '🔢',
    'date': '📅',
    'array': '📋',
    'json': '{ }',
    'first_element': '1️⃣',
    'join': '🔗',
    'split': '✂️',
    'lowercase': 'abc',
    'uppercase': 'ABC',
    'trim': '✨',
    'custom': '🛠️',
    'default': '⚙️'
};

/**
 * Remplit le dropdown des types de transformation (select natif + custom dropdown)
 * @param {string} selectedType - Type sélectionné
 */
function populateTransformTypeDropdown(selectedType) {
    const select = document.getElementById('fieldMappingTransformType');
    const menu = document.querySelector('#fieldMappingTransformDropdown .custom-dropdown-menu');
    const trigger = document.querySelector('#fieldMappingTransformDropdown .custom-dropdown-trigger');
    
    if (!select) return;
    
    // Utiliser les transformations de l'API si disponibles, sinon fallback
    let transformTypes = [];
    
    if (transformTypesData && transformTypesData.length > 0) {
        // Construire depuis les données de l'API
        // L'API retourne: { name: type_key, lang: {...}, description: ... }
        transformTypes = transformTypesData.map(t => ({
            value: t.name || t.type_key,
            label: t.description || (t.lang?.fr?.name) || t.name || t.type_key,
            icon: TRANSFORM_ICONS[t.name] || TRANSFORM_ICONS[t.type_key] || TRANSFORM_ICONS['default']
        }));
    } else {
        // Fallback sur les valeurs par défaut
        transformTypes = [
            { value: 'none', label: 'Aucune transformation', icon: '⚙️' },
            { value: 'string', label: 'Texte', icon: '📝' },
            { value: 'number', label: 'Nombre', icon: '🔢' },
            { value: 'date', label: 'Date', icon: '📅' },
            { value: 'array', label: 'Tableau', icon: '📋' },
            { value: 'json', label: 'JSON', icon: '{ }' },
            { value: 'first_element', label: 'Premier élément', icon: '1️⃣' },
            { value: 'join', label: 'Joindre', icon: '🔗' },
            { value: 'split', label: 'Séparer', icon: '✂️' },
            { value: 'lowercase', label: 'Minuscules', icon: 'abc' },
            { value: 'uppercase', label: 'Majuscules', icon: 'ABC' },
            { value: 'trim', label: 'Trim', icon: '✨' },
            { value: 'custom', label: 'Personnalisé', icon: '🛠️' }
        ];
    }
    
    // S'assurer qu'il y a une option "none" au début
    if (!transformTypes.find(t => t.value === 'none' || t.value === '')) {
        transformTypes.unshift({ value: 'none', label: 'Aucune transformation', icon: '⚙️' });
    }
    
    const effectiveSelected = selectedType || 'none';
    
    // Peupler le select natif
    select.innerHTML = '';
    transformTypes.forEach(tt => {
        const selected = tt.value === effectiveSelected ? 'selected' : '';
        select.innerHTML += `<option value="${tt.value}" ${selected}>${tt.label}</option>`;
    });
    
    // Peupler le custom dropdown menu
    if (menu) {
        let html = '';
        transformTypes.forEach(tt => {
            const isSelected = tt.value === effectiveSelected ? 'selected' : '';
            html += `
                <div class="custom-dropdown-option ${isSelected}" data-value="${tt.value}" data-icon="${tt.icon}">
                    <span class="custom-dropdown-option-icon">${tt.icon}</span>
                    <span class="custom-dropdown-option-text">${escapeHtml(tt.label)}</span>
                </div>
            `;
        });
        menu.innerHTML = html;
    }
    
    // Mettre à jour le trigger
    if (trigger) {
        const selectedTransform = transformTypes.find(t => t.value === effectiveSelected) || transformTypes[0];
        const iconEl = trigger.querySelector('.custom-dropdown-icon');
        const textEl = trigger.querySelector('.custom-dropdown-text');
        if (iconEl) iconEl.textContent = selectedTransform.icon;
        if (textEl) textEl.textContent = selectedTransform.label;
    }
    
    // Définir explicitement la valeur du select
    select.value = effectiveSelected;
    
    // Initialiser le custom dropdown
    initModalCustomDropdown('fieldMappingTransformDropdown', 'fieldMappingTransformType');
}

/**
 * Gère la soumission du formulaire mapping
 * @param {Event} e - Événement de soumission
 */
export async function handleFieldMappingSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('fieldMappingId').value;
    const isNew = !id;
    
    const apiKeysRaw = document.getElementById('fieldMappingApiKeys').value;
    const apiKeys = apiKeysRaw.split(',').map(k => k.trim()).filter(k => k);
    
    // Récupérer et parser le transform_config
    let transformConfig = null;
    const transformConfigRaw = document.getElementById('fieldMappingTransformConfig')?.value;
    if (transformConfigRaw && transformConfigRaw.trim()) {
        try {
            transformConfig = JSON.parse(transformConfigRaw);
        } catch (err) {
            showToast('Configuration de transformation invalide (JSON attendu)', 'error');
            return;
        }
    }
    
    const data = {
        field_id: parseInt(document.getElementById('fieldMappingFieldId').value),
        api_keys: apiKeys,
        transform_type: document.getElementById('fieldMappingTransformType').value || 'none',
        transform_config: transformConfig,
        priority: parseInt(document.getElementById('fieldMappingPriority')?.value) || 0,
        is_active: document.getElementById('fieldMappingActive')?.checked ?? true
    };
    
    if (!isNew) {
        data.id = parseInt(id);
    }
    
    if (!data.field_id) {
        showToast('Veuillez sélectionner un champ', 'error');
        return;
    }

    const method = isNew ? 'POST' : 'PUT';

    try {
        const response = await fetch(FIELD_MAPPINGS_API, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            credentials: 'same-origin'
        });

        const result = await response.json();

        if (result.success) {
            showToast(isNew ? 'Mapping créé' : 'Mapping mis à jour', 'success');
            closeFieldMappingModal();
            loadFieldMappings();
        } else {
            showToast(result.message || 'Erreur lors de la sauvegarde', 'error');
        }
    } catch (error) {
        console.error('Save field mapping error:', error);
        showToast('Erreur de connexion', 'error');
    }
}

/**
 * Prépare la suppression d'un mapping
 * @param {number} id - ID du mapping
 * @param {string} name - Nom pour confirmation
 */
export function prepareDeleteFieldMapping(id, name) {
    setDeleteTarget({
        type: 'field_mapping',
        api: FIELD_MAPPINGS_API,
        id: id,
        name: name
    });
    if (onDeleteCallback) {
        onDeleteCallback(id, name, 'Mapping');
    }
}

/**
 * Initialise le module Field Mappings
 * @param {Object} domElements - Références aux éléments DOM
 * @param {Function} deleteCallback - Callback pour la confirmation de suppression
 */
export function initFieldMappings(domElements, deleteCallback) {
    elements = domElements;
    onDeleteCallback = deleteCallback;
    
    if (elements.addFieldMappingBtn) {
        elements.addFieldMappingBtn.addEventListener('click', openAddFieldMappingModal);
    }
    if (elements.fieldMappingModalClose) {
        elements.fieldMappingModalClose.addEventListener('click', closeFieldMappingModal);
    }
    if (elements.fieldMappingModalCancel) {
        elements.fieldMappingModalCancel.addEventListener('click', closeFieldMappingModal);
    }
    if (elements.fieldMappingModal) {
        elements.fieldMappingModal.querySelector('.modal-backdrop')?.addEventListener('click', closeFieldMappingModal);
    }
    if (elements.fieldMappingForm) {
        elements.fieldMappingForm.addEventListener('submit', handleFieldMappingSubmit);
    }
    
    // Initialiser les dropdowns de filtre
    initFilterDropdown('mappingsTypeFilterDropdown', 'mappingsTypeFilter', renderFieldMappingsFiltered);
    initFilterDropdown('mappingsFieldFilterDropdown', 'mappingsFieldFilter', renderFieldMappingsFiltered);
}
