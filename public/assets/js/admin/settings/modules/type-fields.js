/**
 * SnowShelf - Admin Type Fields Module
 * Gestion des champs par type avec mappings API intégrés
 */

import { API_ENDPOINTS } from '/assets/js/admin/core/config.js';
import { showToast, showLoading, escapeHtml, renderIcon } from '/assets/js/admin/core/utils.js';
import { setDeleteTarget, setTypeFieldsData, primaryTypesData, transformTypesData, setTransformTypesData } from '/assets/js/admin/core/state.js';
import { initModalCustomDropdown, initFilterDropdown } from '/assets/js/admin/ui/dropdown.js';

const TYPE_FIELDS_API = API_ENDPOINTS.TYPE_FIELDS;
const FIELD_MAPPINGS_API = API_ENDPOINTS.FIELD_MAPPINGS;

// Éléments DOM
let elements = {};
let onDeleteCallback = null;

// Données locales pour le filtrage
let localTypeFieldsData = [];

// Types de champs disponibles (chargés depuis l'API)
let fieldTypesData = [];

// Mappings du champ en cours d'édition
let currentFieldMappings = [];
let mappingsToDelete = [];

/**
 * Charge les champs par type
 */
export async function loadTypeFields() {
    if (!elements.typeFieldsTableBody) return;

    try {
        // Charger les types de champs disponibles et les transforms en parallèle
        await Promise.all([
            loadFieldTypes(),
            loadTransformTypes()
        ]);
        
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
 * Charge les types de transformation depuis l'API
 */
async function loadTransformTypes() {
    // Ne charger que si pas déjà chargés
    if (transformTypesData && transformTypesData.length > 0) return;
    
    try {
        const response = await fetch(`${FIELD_MAPPINGS_API}?transforms=1`, {
            credentials: 'same-origin'
        });
        const result = await response.json();
        
        if (result.success && result.data) {
            setTransformTypesData(result.data);
        }
    } catch (error) {
        console.error('Load transform types error:', error);
    }
}

/**
 * Peuple le dropdown de filtre avec les types primaires
 */
function populateTypeFieldsFilterDropdown() {
    const dropdown = document.getElementById('typeFieldsFilterDropdown');
    const menu = dropdown?.querySelector('.custom-dropdown-menu');
    const select = document.getElementById('typeFieldsFilter');
    const trigger = dropdown?.querySelector('.custom-dropdown-trigger');
    if (!menu || !select) return;
    
    // Sauvegarder la valeur actuelle du filtre AVANT de reconstruire
    const currentFilterValue = select.value;
    
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
    
    // Restaurer la valeur du select natif
    select.value = currentFilterValue;
    
    // Trouver les infos du type sélectionné pour le trigger
    let selectedTypeName = 'Tous les types';
    let selectedIcon = '📋';
    if (currentFilterValue) {
        const selectedType = usedTypes.find(t => t.id == currentFilterValue);
        if (selectedType) {
            selectedTypeName = selectedType.name_fr || selectedType.name || selectedType.inter_name;
            selectedIcon = selectedType.icon || '📋';
        }
    }
    
    // Construire le HTML des options avec renderIcon pour gérer émojis et MDI
    // Appliquer la classe 'selected' à l'option correspondant au filtre actuel
    let html = `
        <div class="custom-dropdown-option${currentFilterValue === '' ? ' selected' : ''}" data-value="" data-icon="📋">
            <span class="custom-dropdown-option-icon">📋</span>
            <span class="custom-dropdown-option-text">Tous les types</span>
        </div>
    `;
    
    usedTypes.forEach(type => {
        const icon = type.icon || '📋';
        const iconHtml = renderIconForDropdown(icon);
        const isSelected = type.id == currentFilterValue;
        html += `
            <div class="custom-dropdown-option${isSelected ? ' selected' : ''}" data-value="${type.id}" data-icon="${escapeHtml(icon)}">
                <span class="custom-dropdown-option-icon">${iconHtml}</span>
                <span class="custom-dropdown-option-text">${escapeHtml(type.name_fr || type.name || type.inter_name)}</span>
            </div>
        `;
    });
    
    menu.innerHTML = html;
    
    // Mettre à jour le trigger avec l'option sélectionnée
    if (trigger) {
        const triggerIcon = trigger.querySelector('.custom-dropdown-icon');
        const triggerText = trigger.querySelector('.custom-dropdown-text');
        if (triggerText) {
            triggerText.textContent = selectedTypeName;
        }
        if (triggerIcon) {
            triggerIcon.outerHTML = `<span class="custom-dropdown-icon">${renderIconForDropdown(selectedIcon)}</span>`;
        }
    }
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
    
    // Si c'est un emoji ou caractère unicode, retourner tel quel
    if (/^[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(icon)) {
        return icon;
    }
    
    // C'est une icône MDI - normaliser le nom
    let mdiClass = icon;
    if (icon.includes(':')) {
        mdiClass = icon.replace(':', '-');
    }
    if (!mdiClass.startsWith('mdi-')) {
        mdiClass = 'mdi-' + mdiClass;
    }
    return `<i class="mdi ${mdiClass}"></i>`;
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
    
    // Reset des mappings
    currentFieldMappings = [];
    mappingsToDelete = [];
    renderMappingsList();
    
    populateTypeFieldDropdown();
    populateFieldTypeDropdown('text');
    initFieldTypeOptionsToggle();
    initMappingsEvents();
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
        // Charger le champ et ses mappings en parallèle
        const [fieldResponse, mappingsResponse] = await Promise.all([
            fetch(`${TYPE_FIELDS_API}?id=${id}`, { credentials: 'same-origin' }),
            fetch(`${FIELD_MAPPINGS_API}?field_id=${id}`, { credentials: 'same-origin' })
        ]);
        
        const fieldResult = await fieldResponse.json();
        const mappingsResult = await mappingsResponse.json();

        if (fieldResult.success) {
            const field = fieldResult.data;
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
            
            // Charger les mappings du champ
            currentFieldMappings = [];
            mappingsToDelete = [];
            if (mappingsResult.success && mappingsResult.data?.mappings) {
                currentFieldMappings = mappingsResult.data.mappings.map(m => ({
                    id: m.id,
                    api_keys: Array.isArray(m.api_keys) ? m.api_keys.join(', ') : (m.api_keys || ''),
                    transform_type: m.transform_type || 'direct',
                    transform_config: m.transform_config,
                    priority: m.priority || 0,
                    is_active: m.is_active == 1
                }));
                
                // Charger les types de transformation si pas déjà fait
                if (mappingsResult.data.transforms) {
                    setTransformTypesData(mappingsResult.data.transforms);
                }
            }
            renderMappingsList();
            
            populateTypeFieldDropdown(field.primary_type_id);
            populateFieldTypeDropdown(field.field_type || 'text');
            initFieldTypeOptionsToggle();
            initMappingsEvents();
            
            elements.typeFieldModal.classList.add('active');
        } else {
            showToast(fieldResult.message || 'Erreur lors du chargement', 'error');
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
    
    // Collecter les mappings depuis l'UI
    const mappingsData = collectMappingsFromUI();
    
    const data = {
        primary_type_id: parseInt(document.getElementById('typeFieldTypeId').value),
        field_key: document.getElementById('typeFieldKey').value,
        field_type: document.getElementById('typeFieldType').value,
        is_required: document.getElementById('typeFieldRequired').checked,
        sort_order: parseInt(document.getElementById('typeFieldSortOrder').value) || 0,
        lang: langData,
        field_options: fieldOptions,
        mappings: mappingsData,
        mappings_to_delete: mappingsToDelete
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
            const mappingsMsg = result.data?.mappings_saved ? ` (${result.data.mappings_saved} mapping(s))` : '';
            showToast(isNew ? `Champ créé${mappingsMsg}` : `Champ mis à jour${mappingsMsg}`, 'success');
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
 * Icônes pour les types de transformation
 */
const TRANSFORM_ICONS = {
    'direct': '➡️',
    'first': '1️⃣',
    'first_value': '1️⃣',
    'array': '📋',
    'join': '🔗',
    'array_join': '🔗',
    'template': '📝',
    'date': '📅',
    'find_by_key': '🔍',
    'status_mapping': '🏷️',
    'year_extract': '📆',
    'boolean_fr': '✅',
    'pegi_normalize': '🎮',
    'duration_format': '⏱️',
    'image_list_extract': '🖼️',
    'none': '⚙️',
    'default': '⚙️'
};

/**
 * Rend la liste des mappings dans le modal
 */
function renderMappingsList() {
    const container = document.getElementById('typeFieldMappingsList');
    if (!container) return;
    
    if (currentFieldMappings.length === 0) {
        container.innerHTML = `
            <div class="mappings-empty">
                <span class="text-muted">Aucun mapping API configuré</span>
            </div>
        `;
        return;
    }
    
    // Récupérer les types de transformation disponibles
    let transforms = [];
    if (transformTypesData && transformTypesData.length > 0) {
        // Construire depuis les données de l'API
        // L'API retourne: { type_key, lang: { fr: { name: ... }, en: { name: ... } }, config_schema, ... }
        transforms = transformTypesData.map(t => {
            const key = t.type_key || t.name;
            return {
                value: key,
                label: t.lang?.fr?.name || t.lang?.en?.name || key,
                icon: TRANSFORM_ICONS[key] || TRANSFORM_ICONS['default'],
                hasConfig: !!t.config_schema,
                configSchema: t.config_schema
            };
        });
    } else {
        // Fallback sur les valeurs par défaut avec hasConfig
        transforms = [
            { value: 'direct', label: 'Direct', icon: '➡️', hasConfig: false },
            { value: 'first', label: 'Premier élément', icon: '1️⃣', hasConfig: false },
            { value: 'array', label: 'Tableau', icon: '📋', hasConfig: false },
            { value: 'join', label: 'Joindre', icon: '🔗', hasConfig: false },
            { value: 'array_join', label: 'Array Join', icon: '🔗', hasConfig: true, configSchema: '{"separator": ", "}' },
            { value: 'template', label: 'Template', icon: '📝', hasConfig: true, configSchema: '{"template": "..."}' },
            { value: 'date', label: 'Date', icon: '📅', hasConfig: true, configSchema: '{"format": "Y-m-d"}' },
            { value: 'find_by_key', label: 'Find by Key', icon: '🔍', hasConfig: true, configSchema: '{"match_key": "...", "match_value": "...", "return_key": "..."}' },
            { value: 'none', label: 'Aucune transformation', icon: '⚙️', hasConfig: false }
        ];
    }
    
    container.innerHTML = currentFieldMappings.map((mapping, index) => {
        const currentTransform = transforms.find(t => t.value === mapping.transform_type) || transforms[0];
        
        // Générer les options du menu dropdown
        const dropdownOptions = transforms.map(t => `
            <div class="custom-dropdown-item ${t.value === mapping.transform_type ? 'selected' : ''}" 
                 data-value="${escapeHtml(t.value)}">
                <span class="dropdown-icon">${t.icon || '⚙️'}</span>
                <span>${escapeHtml(t.label)}</span>
            </div>
        `).join('');
        
        return `
        <div class="mapping-item" data-index="${index}">
            <div class="mapping-row mapping-row-main">
                <div class="mapping-field mapping-field-keys">
                    <label>Clés API <span class="text-muted">(séparées par virgule)</span></label>
                    <input type="text" class="mapping-api-keys" value="${escapeHtml(mapping.api_keys || '')}" 
                           placeholder="ex: title, name, data.attributes.name">
                </div>
                <div class="mapping-field mapping-field-actions">
                    <label>&nbsp;</label>
                    <button type="button" class="btn-icon btn-delete btn-remove-mapping" title="Supprimer">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="mapping-row mapping-row-options">
                <div class="mapping-field mapping-field-transform">
                    <label>Transform</label>
                    <div class="custom-dropdown mapping-transform-dropdown" data-index="${index}">
                        <input type="hidden" class="mapping-transform-type" value="${escapeHtml(mapping.transform_type || 'direct')}">
                        <button type="button" class="custom-dropdown-trigger">
                            <span class="dropdown-icon">${currentTransform.icon || '⚙️'}</span>
                            <span class="dropdown-text">${escapeHtml(currentTransform.label)}</span>
                            <svg class="dropdown-arrow" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </button>
                        <div class="custom-dropdown-menu">
                            ${dropdownOptions}
                        </div>
                    </div>
                </div>
                <div class="mapping-field mapping-field-priority">
                    <label>Priorité</label>
                    <input type="number" class="mapping-priority" value="${mapping.priority || 0}" min="0">
                </div>
                <div class="mapping-field mapping-field-active">
                    <label>Actif</label>
                    <input type="checkbox" class="mapping-is-active" ${mapping.is_active !== false ? 'checked' : ''}>
                </div>
            </div>
            ${(() => {
                const transformDef = transforms.find(t => t.value === mapping.transform_type);
                if (transformDef?.hasConfig) {
                    // Générer un exemple basé sur le schema de config
                    let exampleHint = '';
                    if (transformDef.configSchema) {
                        try {
                            const schema = typeof transformDef.configSchema === 'string' 
                                ? JSON.parse(transformDef.configSchema) 
                                : transformDef.configSchema;
                            const example = {};
                            if (schema.properties) {
                                for (const [key, val] of Object.entries(schema.properties)) {
                                    example[key] = val.default || (val.type === 'string' ? '...' : val.type);
                                }
                            } else {
                                // Format simplifié comme find_by_key
                                for (const [key, val] of Object.entries(schema)) {
                                    example[key] = val === 'string' ? '...' : val;
                                }
                            }
                            exampleHint = JSON.stringify(example);
                        } catch(e) { exampleHint = '{}'; }
                    }
                    
                    // Formater la config existante
                    let configValue = '';
                    if (mapping.transform_config) {
                        if (typeof mapping.transform_config === 'object') {
                            configValue = JSON.stringify(mapping.transform_config, null, 2);
                        } else if (typeof mapping.transform_config === 'string') {
                            // Essayer de parser et reformater
                            try {
                                configValue = JSON.stringify(JSON.parse(mapping.transform_config), null, 2);
                            } catch(e) {
                                configValue = mapping.transform_config;
                            }
                        }
                    }
                    
                    return `
                        <div class="mapping-row mapping-config-row">
                            <div class="mapping-field mapping-field-config">
                                <label>Configuration de transformation</label>
                                <textarea class="mapping-transform-config" rows="5" 
                                          placeholder='{}'>${escapeHtml(configValue)}</textarea>
                                <small class="form-hint">Ex: ${escapeHtml(exampleHint)}</small>
                            </div>
                        </div>
                    `;
                }
                return '';
            })()}
            ${mapping.id ? `<input type="hidden" class="mapping-id" value="${mapping.id}">` : ''}
        </div>
    `}).join('');
    
    // Attacher les événements aux items
    attachMappingItemEvents();
}

/**
 * Attache les événements aux éléments de mapping
 */
function attachMappingItemEvents() {
    const container = document.getElementById('typeFieldMappingsList');
    if (!container) return;
    
    // Boutons de suppression
    container.querySelectorAll('.btn-remove-mapping').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const item = e.target.closest('.mapping-item');
            const index = parseInt(item.dataset.index);
            removeMappingItem(index);
        });
    });
    
    // Initialiser les custom dropdowns de transformation
    container.querySelectorAll('.mapping-transform-dropdown').forEach(dropdown => {
        const trigger = dropdown.querySelector('.custom-dropdown-trigger');
        const menu = dropdown.querySelector('.custom-dropdown-menu');
        const hiddenInput = dropdown.querySelector('.mapping-transform-type');
        const index = parseInt(dropdown.dataset.index);
        
        // Ouvrir/fermer le dropdown
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Fermer les autres dropdowns
            container.querySelectorAll('.mapping-transform-dropdown.open').forEach(d => {
                if (d !== dropdown) {
                    d.classList.remove('open');
                    d.querySelector('.custom-dropdown-menu').style.cssText = '';
                }
            });
            
            const isOpen = dropdown.classList.contains('open');
            
            if (!isOpen) {
                // Positionner le menu en fixed pour éviter les problèmes d'overflow
                const rect = trigger.getBoundingClientRect();
                const menuHeight = 180; // max-height du menu
                const viewportHeight = window.innerHeight;
                const spaceBelow = viewportHeight - rect.bottom;
                const spaceAbove = rect.top;
                
                menu.style.position = 'fixed';
                menu.style.left = rect.left + 'px';
                menu.style.width = rect.width + 'px';
                menu.style.display = 'block';
                menu.style.maxHeight = '180px';
                
                // Ouvrir vers le haut si pas assez de place en bas
                if (spaceBelow < menuHeight && spaceAbove > spaceBelow) {
                    menu.style.bottom = (viewportHeight - rect.top + 2) + 'px';
                    menu.style.top = 'auto';
                    dropdown.classList.add('dropdown-up');
                } else {
                    menu.style.top = (rect.bottom + 2) + 'px';
                    menu.style.bottom = 'auto';
                    dropdown.classList.remove('dropdown-up');
                }
                
                dropdown.classList.add('open');
            } else {
                menu.style.cssText = '';
                dropdown.classList.remove('open');
                dropdown.classList.remove('dropdown-up');
            }
        });
        
        // Sélectionner une option
        menu.querySelectorAll('.custom-dropdown-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                const value = item.dataset.value;
                const icon = item.querySelector('.dropdown-icon')?.textContent || '⚙️';
                const label = item.querySelector('span:last-child')?.textContent || value;
                
                // Mettre à jour le trigger
                trigger.querySelector('.dropdown-icon').textContent = icon;
                trigger.querySelector('.dropdown-text').textContent = label;
                
                // Mettre à jour la valeur cachée
                hiddenInput.value = value;
                
                // Mettre à jour les classes selected
                menu.querySelectorAll('.custom-dropdown-item').forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');
                
                // Mettre à jour le mapping en mémoire
                if (currentFieldMappings[index]) {
                    currentFieldMappings[index].transform_type = value;
                }
                
                // Fermer le dropdown
                dropdown.classList.remove('open');
                dropdown.classList.remove('dropdown-up');
                menu.style.cssText = '';
                
                // Re-rendre pour afficher/masquer le champ config si nécessaire
                // Vérifier si le nouveau type a une config
                const newTransform = transformTypesData?.find(t => t.type_key === value);
                const hasConfig = newTransform?.config_schema;
                const mappingItem = dropdown.closest('.mapping-item');
                const configRow = mappingItem.querySelector('.mapping-config-row');
                
                if (hasConfig && !configRow) {
                    // Ajouter le champ config - re-render complet
                    renderMappingsList();
                } else if (!hasConfig && configRow) {
                    // Supprimer le champ config
                    configRow.remove();
                }
            });
        });
    });
    
    // Fermer les dropdowns au clic ailleurs
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.mapping-transform-dropdown')) {
            container.querySelectorAll('.mapping-transform-dropdown.open').forEach(d => {
                d.classList.remove('open');
                d.classList.remove('dropdown-up');
                d.querySelector('.custom-dropdown-menu').style.cssText = '';
            });
        }
    });
}

/**
 * Initialise les événements pour la section mappings
 */
function initMappingsEvents() {
    const addBtn = document.getElementById('addTypeFieldMappingBtn');
    if (addBtn) {
        // Retirer les anciens listeners
        const newBtn = addBtn.cloneNode(true);
        addBtn.parentNode.replaceChild(newBtn, addBtn);
        
        newBtn.addEventListener('click', () => {
            addMappingItem();
        });
    }
}

/**
 * Ajoute un nouveau mapping à la liste
 */
function addMappingItem() {
    currentFieldMappings.push({
        id: null,
        api_keys: '',
        transform_type: 'direct',
        transform_config: null,
        priority: currentFieldMappings.length,
        is_active: true
    });
    renderMappingsList();
    
    // Focus sur le nouveau champ
    setTimeout(() => {
        const container = document.getElementById('typeFieldMappingsList');
        const lastItem = container.querySelector('.mapping-item:last-child .mapping-api-keys');
        if (lastItem) lastItem.focus();
    }, 50);
}

/**
 * Supprime un mapping de la liste
 * @param {number} index - Index du mapping à supprimer
 */
function removeMappingItem(index) {
    const mapping = currentFieldMappings[index];
    
    // Si le mapping a un ID (existe en BDD), l'ajouter à la liste de suppression
    if (mapping && mapping.id) {
        mappingsToDelete.push(mapping.id);
    }
    
    currentFieldMappings.splice(index, 1);
    renderMappingsList();
}

/**
 * Collecte les données des mappings depuis l'UI
 * @returns {Array} Liste des mappings
 */
function collectMappingsFromUI() {
    const container = document.getElementById('typeFieldMappingsList');
    if (!container) return [];
    
    const mappings = [];
    container.querySelectorAll('.mapping-item').forEach((item, index) => {
        const idField = item.querySelector('.mapping-id');
        const apiKeysField = item.querySelector('.mapping-api-keys');
        const transformTypeField = item.querySelector('.mapping-transform-type');
        const transformConfigField = item.querySelector('.mapping-transform-config');
        const priorityField = item.querySelector('.mapping-priority');
        const isActiveField = item.querySelector('.mapping-is-active');
        
        const apiKeysValue = apiKeysField?.value?.trim() || '';
        
        // Ne pas inclure les mappings sans clés API
        if (!apiKeysValue) return;
        
        // Parser les clés API (séparées par virgules)
        const apiKeys = apiKeysValue.split(',').map(k => k.trim()).filter(k => k);
        
        // Parser la config JSON si présente
        let transformConfig = null;
        if (transformConfigField?.value?.trim()) {
            try {
                transformConfig = JSON.parse(transformConfigField.value);
            } catch (e) {
                transformConfig = transformConfigField.value;
            }
        }
        
        mappings.push({
            id: idField?.value ? parseInt(idField.value) : null,
            api_keys: apiKeys,
            transform_type: transformTypeField?.value || 'direct',
            transform_config: transformConfig,
            priority: parseInt(priorityField?.value) || index,
            is_active: isActiveField?.checked ?? true
        });
    });
    
    return mappings;
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
