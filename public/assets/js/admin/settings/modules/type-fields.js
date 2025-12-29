/**
 * SnowShelf - Admin Type Fields Module
 * Gestion des champs par type
 */

import { API_ENDPOINTS } from '/assets/js/admin/core/config.js';
import { showToast, showLoading, escapeHtml, renderIcon } from '/assets/js/admin/core/utils.js';
import { setDeleteTarget, setTypeFieldsData, primaryTypesData } from '/assets/js/admin/core/state.js';
import { initModalCustomDropdown, initFilterDropdown } from '/assets/js/admin/ui/dropdown.js';

const TYPE_FIELDS_API = API_ENDPOINTS.TYPE_FIELDS;

// Éléments DOM
let elements = {};
let onDeleteCallback = null;

// Données locales pour le filtrage
let localTypeFieldsData = [];

// Types de champs disponibles (chargés depuis l'API)
let fieldTypesData = [];

/**
 * Charge les champs par type
 */
export async function loadTypeFields() {
    if (!elements.typeFieldsTableBody) return;

    try {
        // Charger aussi les types de champs disponibles
        await loadFieldTypes();
        
        const response = await fetch(TYPE_FIELDS_API, {
            credentials: 'same-origin'
        });
        const result = await response.json();

        if (result.success) {
            const fields = result.data.fields || [];
            localTypeFieldsData = fields;
            setTypeFieldsData(fields);
            
            // Peupler le dropdown de filtre
            populateTypeFieldsFilterDropdown();
            
            // Rendre le tableau avec le filtre actuel
            renderTypeFieldsFiltered();
        }
    } catch (error) {
        console.error('Load type fields error:', error);
    }
}

/**
 * Peuple le dropdown de filtre avec les types primaires
 */
function populateTypeFieldsFilterDropdown() {
    const menu = document.querySelector('#typeFieldsFilterDropdown .custom-dropdown-menu');
    const select = document.getElementById('typeFieldsFilter');
    if (!menu || !select) return;
    
    // Récupérer les types uniques présents dans les champs
    const usedTypeIds = new Set();
    localTypeFieldsData.forEach(field => {
        if (field.primary_type_id) {
            usedTypeIds.add(field.primary_type_id);
        }
    });
    
    // Filtrer les types primaires pour ne garder que ceux utilisés
    const usedTypes = primaryTypesData.filter(type => usedTypeIds.has(type.id));
    
    // Peupler le select natif
    select.innerHTML = '<option value="">Tous les types</option>';
    usedTypes.forEach(type => {
        select.innerHTML += `<option value="${type.id}">${escapeHtml(type.name_fr || type.name || type.inter_name)}</option>`;
    });
    
    // Construire le HTML des options avec renderIcon pour gérer émojis et MDI
    let html = `
        <div class="custom-dropdown-option selected" data-value="" data-icon="📋">
            <span class="custom-dropdown-option-icon">📋</span>
            <span class="custom-dropdown-option-text">Tous les types</span>
        </div>
    `;
    
    usedTypes.forEach(type => {
        const icon = type.icon || '📋';
        const iconHtml = renderIconForDropdown(icon);
        html += `
            <div class="custom-dropdown-option" data-value="${type.id}" data-icon="${escapeHtml(icon)}">
                <span class="custom-dropdown-option-icon">${iconHtml}</span>
                <span class="custom-dropdown-option-text">${escapeHtml(type.name_fr || type.name || type.inter_name)}</span>
            </div>
        `;
    });
    
    menu.innerHTML = html;
}

/**
 * Charge les types de champs disponibles depuis l'API
 */
async function loadFieldTypes() {
    try {
        const response = await fetch(`${TYPE_FIELDS_API}?field_types=1`, {
            credentials: 'same-origin'
        });
        const result = await response.json();
        
        if (result.success && result.data) {
            fieldTypesData = result.data;
        } else {
            // Fallback avec les types par défaut
            fieldTypesData = [
                { value: 'text', label: 'Texte court', icon: 'form-textbox' },
                { value: 'textarea', label: 'Texte long', icon: 'text' },
                { value: 'number', label: 'Nombre', icon: 'numeric' },
                { value: 'year', label: 'Année', icon: 'calendar' },
                { value: 'date', label: 'Date', icon: 'calendar-range' },
                { value: 'select', label: 'Liste déroulante', icon: 'form-dropdown' },
                { value: 'multiselect', label: 'Sélection multiple', icon: 'format-list-checks' },
                { value: 'url', label: 'URL', icon: 'link' },
                { value: 'rating', label: 'Note / Rating', icon: 'star' },
                { value: 'duration', label: 'Durée', icon: 'timer-outline' },
                { value: 'tracklist', label: 'Liste de pistes (audio)', icon: 'playlist-music' },
                { value: 'image_list', label: 'Liste d\'images avec nom', icon: 'image-multiple' },
                { value: 'array', label: 'Tableau (JSON)', icon: 'code-json' }
            ];
        }
    } catch (error) {
        console.error('Error loading field types:', error);
        // Fallback
        fieldTypesData = [
            { value: 'text', label: 'Texte court', icon: 'form-textbox' }
        ];
    }
}

/**
 * Peuple le dropdown des types de champs
 * @param {string} selectedValue - Valeur sélectionnée
 */
function populateFieldTypeDropdown(selectedValue = 'text') {
    const select = document.getElementById('typeFieldType');
    const menu = document.querySelector('#fieldTypeDropdown .custom-dropdown-menu');
    const trigger = document.querySelector('#fieldTypeDropdown .custom-dropdown-trigger');
    
    if (!select) return;
    
    // Peupler le select natif
    select.innerHTML = '';
    fieldTypesData.forEach(type => {
        const selected = type.value === selectedValue ? 'selected' : '';
        select.innerHTML += `<option value="${type.value}" ${selected}>${escapeHtml(type.label)}</option>`;
    });
    
    // Peupler le custom dropdown menu
    if (menu) {
        let html = '';
        fieldTypesData.forEach(type => {
            const icon = type.icon || 'form-textbox';
            const iconHtml = renderIconForDropdown(icon);
            const isSelected = type.value === selectedValue ? 'selected' : '';
            html += `
                <div class="custom-dropdown-option ${isSelected}" data-value="${type.value}" data-icon="${escapeHtml(icon)}">
                    <span class="custom-dropdown-option-icon">${iconHtml}</span>
                    <span class="custom-dropdown-option-text">${escapeHtml(type.label)}</span>
                </div>
            `;
        });
        menu.innerHTML = html;
    }
    
    // Mettre à jour le trigger
    if (trigger) {
        const selectedType = fieldTypesData.find(t => t.value === selectedValue);
        if (selectedType) {
            const iconEl = trigger.querySelector('.custom-dropdown-icon');
            const textEl = trigger.querySelector('.custom-dropdown-text');
            if (iconEl) iconEl.innerHTML = renderIconForDropdown(selectedType.icon);
            if (textEl) textEl.textContent = selectedType.label;
        }
    }
    
    // Initialiser le custom dropdown
    initModalCustomDropdown('fieldTypeDropdown', 'typeFieldType');
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
 * Rend les champs filtrés selon le dropdown
 */
function renderTypeFieldsFiltered() {
    const filterSelect = document.getElementById('typeFieldsFilter');
    const filterTypeId = filterSelect ? filterSelect.value : '';
    
    let fields = localTypeFieldsData;
    if (filterTypeId) {
        fields = localTypeFieldsData.filter(f => f.primary_type_id == filterTypeId);
    }
    
    renderTypeFields(fields);
}

/**
 * Récupère le nom du type principal par son ID
 * @param {number} typeId - ID du type
 * @returns {string} Nom du type ou 'Inconnu'
 */
function getTypeName(typeId) {
    const type = primaryTypesData.find(t => t.id == typeId);
    return type ? (type.name_fr || type.inter_name) : 'Inconnu';
}

/**
 * Rend les champs par type dans le tableau
 * @param {Array} fields - Liste des champs
 */
function renderTypeFields(fields) {
    if (fields.length === 0) {
        elements.typeFieldsTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center text-muted">Aucun champ trouvé</td>
            </tr>
        `;
        return;
    }

    // Grouper par type
    const grouped = {};
    fields.forEach(field => {
        const typeId = field.primary_type_id;
        if (!grouped[typeId]) {
            grouped[typeId] = [];
        }
        grouped[typeId].push(field);
    });

    let html = '';
    Object.keys(grouped).forEach(typeId => {
        const typeFields = grouped[typeId];
        const typeName = typeFields[0]?.type_name_fr || getTypeName(typeId);
        
        typeFields.forEach((field, index) => {
            const langData = field.lang || {};
            const nameFr = langData.fr?.name || field.field_key;
            
            html += `
                <tr data-field-id="${field.id}">
                    <td class="text-center">
                        <span class="order-badge">${field.sort_order || index + 1}</span>
                    </td>
                    <td><span class="badge badge-type">${escapeHtml(typeName)}</span></td>
                    <td><code>${escapeHtml(field.field_key)}</code></td>
                    <td>${escapeHtml(nameFr)}</td>
                    <td><span class="badge badge-outline">${escapeHtml(field.field_type || 'text')}</span></td>
                    <td class="text-center">
                        <span class="badge badge-info">${field.mappings_count || 0}</span>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn-icon btn-edit" onclick="SettingsPanel.editTypeField(${field.id})" title="Modifier">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                                </svg>
                            </button>
                            <button class="btn-icon btn-delete" onclick="SettingsPanel.deleteTypeField(${field.id}, '${escapeHtml(field.field_key).replace(/'/g, "\\'")}')" title="Supprimer">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
    });

    elements.typeFieldsTableBody.innerHTML = html;
}

/**
 * Ouvre le modal d'ajout de champ de type
 */
export function openAddTypeFieldModal() {
    elements.typeFieldModalTitle.textContent = 'Ajouter un champ';
    elements.typeFieldForm.reset();
    document.getElementById('typeFieldId').value = '';
    document.getElementById('typeFieldRequired').checked = false;
    document.getElementById('typeFieldSortOrder').value = 0;
    
    // Reset du JSON lang avec template par défaut
    const langJsonField = document.getElementById('typeFieldLangJson');
    if (langJsonField) {
        langJsonField.value = JSON.stringify({
            fr: { name: "Nom du champ", placeholder: "Texte indicatif..." },
            en: { name: "Field name", placeholder: "Hint text..." }
        }, null, 2);
    }
    
    // Reset des options
    const optionsField = document.getElementById('typeFieldOptions');
    if (optionsField) optionsField.value = '';
    
    // Masquer le groupe options
    const optionsGroup = document.getElementById('typeFieldOptionsGroup');
    if (optionsGroup) optionsGroup.style.display = 'none';
    
    populateTypeFieldDropdown();
    populateFieldTypeDropdown('text');
    initFieldTypeOptionsToggle();
    elements.typeFieldModal.classList.add('active');
}

/**
 * Ouvre le modal d'édition de champ de type
 * @param {number} id - ID du champ
 */
export async function openEditTypeFieldModal(id) {
    elements.typeFieldModalTitle.textContent = 'Modifier le champ';
    showLoading(true);

    try {
        const response = await fetch(`${TYPE_FIELDS_API}?id=${id}`, {
            credentials: 'same-origin'
        });
        const result = await response.json();

        if (result.success) {
            const field = result.data;
            const langData = field.lang || {};
            
            document.getElementById('typeFieldId').value = field.id;
            document.getElementById('typeFieldKey').value = field.field_key || '';
            document.getElementById('typeFieldRequired').checked = field.is_required == 1;
            document.getElementById('typeFieldSortOrder').value = field.sort_order || 0;
            
            // Remplir le textarea JSON lang
            const langJsonField = document.getElementById('typeFieldLangJson');
            if (langJsonField) {
                const langContent = Object.keys(langData).length > 0 
                    ? langData 
                    : { fr: { name: "" }, en: { name: "" } };
                langJsonField.value = JSON.stringify(langContent, null, 2);
            }
            
            // Remplir les options si présentes
            const optionsField = document.getElementById('typeFieldOptions');
            if (optionsField) {
                optionsField.value = field.field_options 
                    ? (typeof field.field_options === 'object' 
                        ? JSON.stringify(field.field_options, null, 2) 
                        : field.field_options)
                    : '';
            }
            
            populateTypeFieldDropdown(field.primary_type_id);
            populateFieldTypeDropdown(field.field_type || 'text');
            initFieldTypeOptionsToggle();
            
            elements.typeFieldModal.classList.add('active');
        } else {
            showToast(result.message || 'Erreur lors du chargement', 'error');
        }
    } catch (error) {
        console.error('Load type field error:', error);
        showToast('Erreur de connexion', 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Ferme le modal champ de type
 */
export function closeTypeFieldModal() {
    elements.typeFieldModal.classList.remove('active');
}

/**
 * Remplit le dropdown des types principaux (select natif + custom dropdown)
 * @param {number} selectedId - ID du type sélectionné
 */
function populateTypeFieldDropdown(selectedId) {
    const select = document.getElementById('typeFieldTypeId');
    const menu = document.querySelector('#typeFieldTypeDropdown .custom-dropdown-menu');
    const trigger = document.querySelector('#typeFieldTypeDropdown .custom-dropdown-trigger');
    
    if (!select) return;
    
    // Peupler le select natif
    select.innerHTML = '<option value="">-- Sélectionner --</option>';
    primaryTypesData.forEach(type => {
        const selected = type.id == selectedId ? 'selected' : '';
        select.innerHTML += `<option value="${type.id}" ${selected}>${escapeHtml(type.name_fr || type.inter_name)}</option>`;
    });
    
    // Peupler le custom dropdown menu
    if (menu) {
        let html = `
            <div class="custom-dropdown-option ${!selectedId ? 'selected' : ''}" data-value="" data-icon="📋">
                <span class="custom-dropdown-option-icon">📋</span>
                <span class="custom-dropdown-option-text">-- Sélectionner --</span>
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
    
    // Mettre à jour le trigger si un type est sélectionné
    if (trigger && selectedId) {
        const selectedType = primaryTypesData.find(t => t.id == selectedId);
        if (selectedType) {
            const iconEl = trigger.querySelector('.custom-dropdown-icon');
            const textEl = trigger.querySelector('.custom-dropdown-text');
            if (iconEl) iconEl.innerHTML = renderIconForDropdown(selectedType.icon);
            if (textEl) textEl.textContent = selectedType.name_fr || selectedType.inter_name;
        }
    } else if (trigger) {
        // Reset au placeholder
        const iconEl = trigger.querySelector('.custom-dropdown-icon');
        const textEl = trigger.querySelector('.custom-dropdown-text');
        if (iconEl) iconEl.textContent = '📋';
        if (textEl) textEl.textContent = '-- Sélectionner --';
    }
    
    // Initialiser le custom dropdown pour le modal
    initModalCustomDropdown('typeFieldTypeDropdown', 'typeFieldTypeId');
}

/**
 * Initialise le toggle pour afficher/masquer les options selon le type de champ
 */
function initFieldTypeOptionsToggle() {
    const fieldTypeSelect = document.getElementById('typeFieldType');
    const optionsGroup = document.getElementById('typeFieldOptionsGroup');
    
    if (!fieldTypeSelect || !optionsGroup) return;
    
    const toggleOptions = () => {
        const val = fieldTypeSelect.value;
        optionsGroup.style.display = (val === 'select' || val === 'multiselect') ? 'block' : 'none';
    };
    
    // Supprimer l'ancien listener si existant pour éviter les doublons
    fieldTypeSelect.removeEventListener('change', toggleOptions);
    fieldTypeSelect.addEventListener('change', toggleOptions);
    
    // Appliquer l'état initial
    toggleOptions();
}

/**
 * Gère la soumission du formulaire champ de type
 * @param {Event} e - Événement de soumission
 */
export async function handleTypeFieldSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('typeFieldId').value;
    const isNew = !id;
    
    // Récupérer et parser le JSON lang
    const langJsonField = document.getElementById('typeFieldLangJson');
    let langData;
    try {
        langData = JSON.parse(langJsonField.value);
    } catch (parseError) {
        showToast('Le JSON des traductions est invalide', 'error');
        langJsonField.focus();
        return;
    }
    
    // Vérifier que les noms sont présents
    if (!langData.fr?.name) {
        showToast('Le nom français (fr.name) est obligatoire', 'error');
        return;
    }
    
    // Récupérer les options si présentes
    const optionsField = document.getElementById('typeFieldOptions');
    let fieldOptions = null;
    if (optionsField && optionsField.value.trim()) {
        try {
            fieldOptions = JSON.parse(optionsField.value);
        } catch (parseError) {
            showToast('Le JSON des options est invalide', 'error');
            optionsField.focus();
            return;
        }
    }
    
    const data = {
        primary_type_id: parseInt(document.getElementById('typeFieldTypeId').value),
        field_key: document.getElementById('typeFieldKey').value,
        field_type: document.getElementById('typeFieldType').value,
        is_required: document.getElementById('typeFieldRequired').checked,
        sort_order: parseInt(document.getElementById('typeFieldSortOrder').value) || 0,
        lang: langData,
        field_options: fieldOptions
    };
    
    if (!isNew) {
        data.id = parseInt(id);
    }

    if (!data.primary_type_id) {
        showToast('Veuillez sélectionner un type', 'error');
        return;
    }

    const method = isNew ? 'POST' : 'PUT';

    try {
        const response = await fetch(TYPE_FIELDS_API, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            credentials: 'same-origin'
        });

        const result = await response.json();

        if (result.success) {
            showToast(isNew ? 'Champ créé' : 'Champ mis à jour', 'success');
            closeTypeFieldModal();
            loadTypeFields();
        } else {
            showToast(result.message || 'Erreur lors de la sauvegarde', 'error');
        }
    } catch (error) {
        console.error('Save type field error:', error);
        showToast('Erreur de connexion', 'error');
    }
}

/**
 * Prépare la suppression d'un champ de type
 * @param {number} id - ID du champ
 * @param {string} name - Nom pour confirmation
 */
export function prepareDeleteTypeField(id, name) {
    setDeleteTarget({
        type: 'type_field',
        api: TYPE_FIELDS_API,
        id: id,
        name: name
    });
    if (onDeleteCallback) {
        onDeleteCallback(id, name, 'Champ');
    }
}

/**
 * Initialise le module Type Fields
 * @param {Object} domElements - Références aux éléments DOM
 * @param {Function} deleteCallback - Callback pour la confirmation de suppression
 */
export function initTypeFields(domElements, deleteCallback) {
    elements = domElements;
    onDeleteCallback = deleteCallback;
    
    if (elements.addTypeFieldBtn) {
        elements.addTypeFieldBtn.addEventListener('click', openAddTypeFieldModal);
    }
    if (elements.typeFieldModalClose) {
        elements.typeFieldModalClose.addEventListener('click', closeTypeFieldModal);
    }
    if (elements.typeFieldModalCancel) {
        elements.typeFieldModalCancel.addEventListener('click', closeTypeFieldModal);
    }
    if (elements.typeFieldModal) {
        elements.typeFieldModal.querySelector('.modal-backdrop')?.addEventListener('click', closeTypeFieldModal);
    }
    if (elements.typeFieldForm) {
        elements.typeFieldForm.addEventListener('submit', handleTypeFieldSubmit);
    }
    
    // Initialiser le dropdown de filtre
    initFilterDropdown('typeFieldsFilterDropdown', 'typeFieldsFilter', renderTypeFieldsFiltered);
}
