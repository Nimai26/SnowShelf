/**
 * SnowShelf - Collection Module
 * metadata/fields.js - Gestion des champs de métadonnées dynamiques
 */

import { getTranslations } from '../state.js';
import { escapeHtml, renderMdiIcon } from '../utils.js';


/**
 * Parse a checklist string into an ordered array of cell keys.
 * Supports numeric ranges ("1 à 228"), prefixed ranges ("LE1 à LE5") and alpha ranges ("A à R").
 * @param {string} checklistStr
 * @returns {string[]} Array of keys like ["1","2",...,"A","B",...]
 */
export function parseChecklistString(checklistStr) {
    if (!checklistStr || typeof checklistStr !== 'string') return [];

    // Normalize separators
    const parts = checklistStr.split(/[,;\+]| et /i).map(p => p.trim()).filter(Boolean);
    const cells = [];

    for (const part of parts) {
        // Match prefixed numeric range like LE1 à LE5 or LE1-LE5
        let m = part.match(/^([A-Za-z]+)?\s*(\d+)\s*(?:[–\-—]|à|to)\s*([A-Za-z]+)?\s*(\d+)$/i);
        if (m) {
            const prefixStart = m[1] || '';
            const start = parseInt(m[2], 10);
            const prefixEnd = m[3] || prefixStart;
            const end = parseInt(m[4], 10);
            if (prefixStart.toUpperCase() === prefixEnd.toUpperCase()) {
                for (let i = start; i <= end; i++) {
                    cells.push(prefixStart + i);
                }
                continue;
            }
        }

        // Match numeric range like 1 à 228
        m = part.match(/^(\d+)\s*(?:[–\-—]|à|to)\s*(\d+)$/i);
        if (m) {
            const start = parseInt(m[1], 10);
            const end = parseInt(m[2], 10);
            for (let i = start; i <= end; i++) cells.push(String(i));
            continue;
        }

        // Match alpha range like A à R
        m = part.match(/^([A-Za-z])\s*(?:[–\-—]|à|to)\s*([A-Za-z])$/i);
        if (m) {
            const a = m[1].toUpperCase();
            const b = m[2].toUpperCase();
            const startCode = a.charCodeAt(0);
            const endCode = b.charCodeAt(0);
            const step = startCode <= endCode ? 1 : -1;
            if (step === 1) {
                for (let c = startCode; c <= endCode; c++) cells.push(String.fromCharCode(c));
            } else {
                for (let c = startCode; c >= endCode; c--) cells.push(String.fromCharCode(c));
            }
            continue;
        }

        // Single numeric or prefixed token or letter
        cells.push(part);
    }

    return cells;
}

/**
 * Normalise les valeurs API vers les valeurs attendues par les champs de formulaire
 * @param {string} fieldKey - Clé du champ
 * @param {*} value - Valeur à normaliser
 * @returns {*} Valeur normalisée
 */
export function normalizeFieldValue(fieldKey, value) {
    if (value === null || value === undefined) return value;
    
    const strValue = String(value).trim();
    
    // Normalisation des classifications d'âge (PEGI, ESRB, etc.)
    if (fieldKey === 'pegi' || fieldKey === 'age_rating' || fieldKey === 'min_age') {
        const ageMatch = strValue.match(/(\d+)/);
        if (ageMatch) {
            const age = parseInt(ageMatch[1]);
            if (age <= 3) return 'PEGI 3';
            if (age <= 7) return 'PEGI 7';
            if (age <= 12) return 'PEGI 12';
            if (age <= 16) return 'PEGI 16';
            return 'PEGI 18';
        }
        const esrbToPegi = {
            'everyone': 'PEGI 3',
            'everyone 10+': 'PEGI 12',
            'e10+': 'PEGI 12',
            'teen': 'PEGI 12',
            't': 'PEGI 12',
            'mature': 'PEGI 16',
            'm': 'PEGI 16',
            'mature 17+': 'PEGI 18',
            'adults only': 'PEGI 18',
            'ao': 'PEGI 18',
        };
        const lowerValue = strValue.toLowerCase();
        if (esrbToPegi[lowerValue]) {
            return esrbToPegi[lowerValue];
        }
    }
    
    // Normalisation des booléens
    if (fieldKey === 'multiplayer' || fieldKey === 'is_multiplayer') {
        const lowerValue = strValue.toLowerCase();
        if (lowerValue === 'oui' || lowerValue === 'yes' || lowerValue === 'true' || lowerValue === '1') {
            return 'Oui';
        }
        if (lowerValue === 'non' || lowerValue === 'no' || lowerValue === 'false' || lowerValue === '0') {
            return 'Non';
        }
    }
    
    // Normalisation du statut des séries
    if (fieldKey === 'status') {
        const statusMapping = {
            'ended': 'Terminée',
            'canceled': 'Annulée',
            'cancelled': 'Annulée',
            'continuing': 'En cours',
            'running': 'En cours',
            'returning series': 'En cours',
            'in production': 'En cours',
            'planned': 'En cours',
            'pilot': 'En cours',
        };
        const lowerValue = strValue.toLowerCase();
        if (statusMapping[lowerValue]) {
            return statusMapping[lowerValue];
        }
    }
    
    return value;
}

/**
 * Charge les champs de métadonnées pour un type donné
 * @param {HTMLElement} modal - Élément modal
 * @param {number|string} typeId - ID du type primaire (null = divers)
 * @param {number|string} itemId - ID de l'item (null = création)
 */
export async function loadMetadataFields(modal, typeId, itemId) {
    const t = getTranslations();
    const notice = modal.querySelector('#detailsTypeNotice');
    const container = modal.querySelector('#detailsFieldsContainer');
    const loading = modal.querySelector('#detailsLoading');
    
    if (!container) return;
    
    // Afficher le chargement
    if (notice) notice.style.display = 'none';
    container.innerHTML = '';
    if (loading) loading.style.display = 'flex';
    
    try {
        // Charger les définitions de champs
        const fieldsUrl = `/api/item-metadata.php?action=fields&type_id=${typeId || ''}`;
        const fieldsResponse = await fetch(fieldsUrl);
        const fieldsData = await fieldsResponse.json();
        
        const fields = fieldsData.data?.fields || [];
        
        if (!fieldsData.success || !fields.length) {
            if (notice) {
                notice.querySelector('.notice-text').textContent = t.details_no_fields || 'Aucun champ spécifique pour ce type.';
                notice.style.display = 'block';
            }
            if (loading) loading.style.display = 'none';
            return;
        }
        
        // Stocker les champs sur la modal
        modal._metadataFields = fields;
        
        // Charger les valeurs si édition
        let values = {};
        if (itemId) {
            const valuesUrl = `/api/item-metadata.php?action=values&item_id=${itemId}`;
            const valuesResponse = await fetch(valuesUrl);
            const valuesData = await valuesResponse.json();
            if (valuesData.success && valuesData.data?.values) {
                const rawValues = valuesData.data.values;
                for (const [key, data] of Object.entries(rawValues)) {
                    values[key] = data.value;
                }
            }
        }
        modal._metadataValues = values;
        
        // Générer le HTML des champs
        const fieldsHtml = renderMetadataFields(fields, values);
        container.innerHTML = fieldsHtml;
        
        // Initialiser les dropdowns custom pour les select/multiselect
        initMetadataDropdowns(container);
        // Initialiser les events pour la grille de stickers si présente
        initStickerGridEvents(container);
        
        // Ajouter un listener sur le champ checklist
        const checklistInput = container.querySelector('[data-field-key="checklist"] input, [data-field-key="checklist"] textarea');
        if (checklistInput) {
            let debounceTimer = null;
            checklistInput.addEventListener('input', () => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    console.log('[Collection] Checklist modifiée, rafraîchissement de la grille');
                    refreshStickerGrid(modal);
                }, 500);
            });
        }
        
        // Mettre à jour le compteur
        const countEl = modal.querySelector('#itemMetadataCount');
        if (countEl) {
            countEl.textContent = Object.keys(values).length;
        }
        
    } catch (error) {
        console.error('[Collection] Error loading metadata fields:', error);
        if (notice) {
            notice.querySelector('.notice-text').textContent = t.details_error || 'Erreur lors du chargement des champs.';
            notice.style.display = 'block';
        }
    } finally {
        if (loading) loading.style.display = 'none';
    }
}

/**
 * Génère le HTML des champs de métadonnées
 * @param {Array} fields - Définitions des champs
 * @param {Object} values - Valeurs actuelles
 * @returns {string} HTML des champs
 */
export function renderMetadataFields(fields, values) {
    const t = getTranslations();
    let html = '<div class="metadata-fields-grid">';
    
    for (const field of fields) {
        const value = values[field.field_key] || '';
        const required = field.is_required ? '<span class="required">*</span>' : '';
        const fieldId = `metadata_${field.field_key}`;
        
        // Special rendering for sticker_grid
        if (field.field_key === 'sticker_grid') {
            let cells = [];
            const rawChecklist = values['checklist'] || values['sticker_checklist'] || '';
            if (rawChecklist) {
                cells = parseChecklistString(rawChecklist);
            }
            if ((!cells || cells.length === 0) && (values['total_stickers'] || values['sticker_count'])) {
                const total = parseInt(values['total_stickers'] || values['sticker_count'], 10);
                if (!isNaN(total) && total > 0) {
                    cells = Array.from({length: total}, (_, i) => String(i + 1));
                }
            }
            if (!cells || cells.length === 0) {
                cells = ['1'];
            }

            html += `<div class="form-group metadata-field" data-field-key="${field.field_key}" data-field-id="${field.id}">`;
            html += `<label for="${fieldId}">${escapeHtml(field.label)} ${required}</label>`;
            html += buildStickerGridHtml(field.id, field.field_key, value, cells);
            html += '</div>';
            continue;
        }

        html += `<div class="form-group metadata-field" data-field-key="${field.field_key}" data-field-id="${field.id}">`;
        html += `<label for="${fieldId}">${escapeHtml(field.label)} ${required}</label>`;
        
        switch (field.field_type) {
            case 'textarea':
                html += `<textarea id="${fieldId}" 
                                  name="metadata[${field.field_key}]" 
                                  class="form-control" 
                                  rows="3"
                                  ${field.is_required ? 'required' : ''}>${escapeHtml(value)}</textarea>`;
                break;
                
            case 'number':
                html += `<input type="number" 
                               id="${fieldId}" 
                               name="metadata[${field.field_key}]" 
                               class="form-control" 
                               value="${escapeHtml(value)}"
                               ${field.is_required ? 'required' : ''}>`;
                break;
                
            case 'year':
                html += `<input type="number" 
                               id="${fieldId}" 
                               name="metadata[${field.field_key}]" 
                               class="form-control" 
                               value="${escapeHtml(value)}"
                               min="1800" 
                               max="${new Date().getFullYear() + 5}"
                               placeholder="YYYY"
                               ${field.is_required ? 'required' : ''}>`;
                break;
                
            case 'date':
                html += `<input type="date" 
                               id="${fieldId}" 
                               name="metadata[${field.field_key}]" 
                               class="form-control" 
                               value="${escapeHtml(value)}"
                               ${field.is_required ? 'required' : ''}>`;
                break;
                
            case 'url':
                html += `<input type="url" 
                               id="${fieldId}" 
                               name="metadata[${field.field_key}]" 
                               class="form-control" 
                               value="${escapeHtml(value)}"
                               placeholder="https://..."
                               ${field.is_required ? 'required' : ''}>`;
                break;
                
            case 'rating':
                html += `<div class="rating-input">
                            <input type="number" 
                                   id="${fieldId}" 
                                   name="metadata[${field.field_key}]" 
                                   class="form-control" 
                                   value="${escapeHtml(value)}"
                                   min="0" 
                                   max="5" 
                                   step="0.5"
                                   placeholder="0-5"
                                   ${field.is_required ? 'required' : ''}>
                            <span class="rating-hint">/5</span>
                        </div>`;
                break;
                
            case 'select':
                html += `<div class="metadata-select-wrapper" data-field-key="${field.field_key}" data-icon="${field.icon || ''}">
                            <select id="${fieldId}" 
                                    name="metadata[${field.field_key}]" 
                                    class="form-select metadata-select-native"
                                    data-options='${JSON.stringify(field.options || [])}'
                                    data-selected-value="${escapeHtml(value)}"
                                    ${field.is_required ? 'required' : ''}>
                                <option value="">-- ${t.select_option || 'Choisir'} --</option>`;
                if (field.options) {
                    for (const opt of field.options) {
                        const optValue = typeof opt === 'object' ? opt.value : opt;
                        const optLabel = typeof opt === 'object' ? opt.label : opt;
                        const selected = value === optValue ? 'selected' : '';
                        html += `<option value="${escapeHtml(optValue)}" ${selected}>${escapeHtml(optLabel)}</option>`;
                    }
                }
                html += `</select></div>`;
                break;
                
            case 'multiselect':
                const selectedValues = Array.isArray(value) ? value : (value ? [value] : []);
                html += `<div class="metadata-multiselect-wrapper" data-field-key="${field.field_key}" data-icon="${field.icon || ''}">
                            <select id="${fieldId}" 
                                    name="metadata[${field.field_key}][]" 
                                    class="form-select metadata-multiselect-native" 
                                    multiple
                                    data-options='${JSON.stringify(field.options || [])}'
                                    ${field.is_required ? 'required' : ''}>`;
                if (field.options) {
                    for (const opt of field.options) {
                        const optValue = typeof opt === 'object' ? opt.value : opt;
                        const optLabel = typeof opt === 'object' ? opt.label : opt;
                        const selected = selectedValues.includes(optValue) ? 'selected' : '';
                        html += `<option value="${escapeHtml(optValue)}" ${selected}>${escapeHtml(optLabel)}</option>`;
                    }
                }
                html += `</select></div>`;
                break;
                
            default: // text
                html += `<input type="text" 
                               id="${fieldId}" 
                               name="metadata[${field.field_key}]" 
                               class="form-control" 
                               value="${escapeHtml(value)}"
                               ${field.is_required ? 'required' : ''}>`;
        }
        
        html += '</div>';
    }
    
    html += '</div>';
    return html;
}

/**
 * Build HTML for the sticker grid field
 * @param {number} fieldId - DB id of the field
 * @param {string} fieldKey - field_key string
 * @param {Array|string|number} value - existing value
 * @param {string[]} cells - ordered list of all cells keys
 */
export function buildStickerGridHtml(fieldId, fieldKey, value, cells) {
    const owned = new Set();
    try {
        if (Array.isArray(value)) {
            value.forEach(v => owned.add(String(v)));
        } else if (typeof value === 'string' && value.trim()) {
            try {
                const parsed = JSON.parse(value);
                if (Array.isArray(parsed)) parsed.forEach(v => owned.add(String(v)));
            } catch (e) {
                value.split(/[;,]/).map(s => s.trim()).filter(Boolean).forEach(v => owned.add(v));
            }
        }
    } catch (e) {
        console.warn('[Collection] buildStickerGridHtml parse value', e);
    }

    const totalCount = cells.length;
    const ownedCount = cells.filter(c => owned.has(String(c))).length;
    const missingCount = totalCount - ownedCount;

    let html = `<div class="metadata-sticker-grid-wrapper">`;
    
    html += `<div class="sticker-grid-header">
        <span class="sticker-count-missing" data-count-missing>${missingCount}</span> manquante(s) / ${totalCount} total
    </div>`;
    
    html += `<div class="sticker-grid" data-field-id="${fieldId}" data-field-key="${escapeHtml(fieldKey)}" data-total="${totalCount}">`;

    cells.forEach(cellKey => {
        const cellKeyStr = String(cellKey);
        const cls = owned.has(cellKeyStr) ? 'sticker-cell owned' : 'sticker-cell missing';
        html += `<button type="button" class="${cls}" data-cell-key="${escapeHtml(cellKeyStr)}" title="${escapeHtml(cellKeyStr)}">${escapeHtml(cellKeyStr)}</button>`;
    });

    html += `</div>`;

    html += `<select name="metadata[${escapeHtml(fieldKey)}][]" multiple style="display:none;" data-sticker-select data-field-id="${fieldId}">`;
    cells.forEach(cellKey => {
        const selected = owned.has(String(cellKey)) ? 'selected' : '';
        html += `<option value="${escapeHtml(String(cellKey))}" ${selected}>${escapeHtml(String(cellKey))}</option>`;
    });

    html += `</select></div>`;
    return html;
}

/**
 * Refresh the sticker grid based on current form field values
 * @param {HTMLElement} modal - The modal element
 */
export function refreshStickerGrid(modal) {
    const container = modal.querySelector('#detailsFieldsContainer');
    if (!container) return;

    const gridWrapper = container.querySelector('.metadata-sticker-grid-wrapper');
    if (!gridWrapper) return;

    const gridEl = gridWrapper.querySelector('.sticker-grid');
    if (!gridEl) return;

    const fieldId = gridEl.dataset.fieldId;
    const fieldKey = gridEl.dataset.fieldKey;
    if (!fieldKey) return;

    // Get current selected values (owned stickers)
    const currentSelect = gridWrapper.querySelector('select[data-sticker-select]');
    const ownedValues = currentSelect ? Array.from(currentSelect.selectedOptions).map(o => o.value) : [];

    let cells = [];
    
    const checklistInput = container.querySelector('[data-field-key="checklist"] input, [data-field-key="checklist"] textarea');
    let checklistValue = checklistInput?.value?.trim() || '';
    
    if (checklistValue === '[object Object]') {
        checklistValue = '';
    }
    
    const pendingChecklist = modal._pendingImportMetadata?.checklist || modal._lastImportedChecklist || '';
    
    let rawChecklist = checklistValue || pendingChecklist;
    
    if (rawChecklist && typeof rawChecklist === 'object') {
        if (Array.isArray(rawChecklist.items) && rawChecklist.items.length > 0) {
            for (const item of rawChecklist.items) {
                const itemStr = String(item);
                if (itemStr.match(/[àto\-–—]/i) && itemStr.length > 1) {
                    const parsedRange = parseChecklistString(itemStr);
                    if (parsedRange.length > 0) {
                        cells.push(...parsedRange);
                    } else {
                        cells.push(itemStr);
                    }
                } else {
                    cells.push(itemStr);
                }
            }
        } else if (rawChecklist.raw) {
            rawChecklist = rawChecklist.raw;
        } else {
            rawChecklist = '';
        }
    }
    
    if (cells.length === 0 && rawChecklist && typeof rawChecklist === 'string' && rawChecklist.includes('à')) {
        cells = parseChecklistString(rawChecklist);
    }
    
    if (cells.length === 0) {
        const totalInput = container.querySelector('[data-field-key="total_stickers"] input');
        const total = parseInt(totalInput?.value, 10);
        if (!isNaN(total) && total > 0) {
            cells = Array.from({length: total}, (_, i) => String(i + 1));
        }
    }
    
    if (cells.length === 0) {
        return;
    }
    
    const currentCells = Array.from(gridEl.querySelectorAll('.sticker-cell')).map(c => c.dataset.cellKey);
    const needsRebuild = cells.length !== currentCells.length || 
                        cells.some((c, i) => c !== currentCells[i]);
    
    if (!needsRebuild) {
        return;
    }

    console.log('[Collection] refreshStickerGrid: rebuilding grid with', cells.length, 'cells');

    const newGridHtml = buildStickerGridHtml(fieldId, fieldKey, ownedValues, cells);
    
    const formGroup = gridWrapper.closest('.metadata-field');
    if (formGroup) {
        const label = formGroup.querySelector('label');
        const labelHtml = label ? label.outerHTML : '';
        formGroup.innerHTML = labelHtml + newGridHtml;
        
        initStickerGridEvents(formGroup);
    }
}

/**
 * Initialize event handlers for sticker grid UI
 * @param {HTMLElement} container - Container element
 */
export function initStickerGridEvents(container) {
    container.querySelectorAll('.metadata-sticker-grid-wrapper').forEach(wrapper => {
        const grid = wrapper.querySelector('.sticker-grid');
        const select = wrapper.querySelector('select[data-sticker-select]');
        if (!grid || !select) return;

        const updateMissingCount = () => {
            const total = parseInt(grid.dataset.total, 10) || grid.querySelectorAll('.sticker-cell').length;
            const ownedCount = select.selectedOptions.length;
            const missingCount = total - ownedCount;
            const counterEl = wrapper.querySelector('[data-count-missing]');
            if (counterEl) {
                counterEl.textContent = missingCount;
            }
        };

        grid.querySelectorAll('.sticker-cell').forEach(btn => {
            btn.addEventListener('click', () => {
                const key = btn.dataset.cellKey;
                const option = Array.from(select.options).find(o => o.value == key);
                if (!option) return;
                const isNowOwned = !btn.classList.contains('owned');
                btn.classList.toggle('owned', isNowOwned);
                btn.classList.toggle('missing', !isNowOwned);
                option.selected = isNowOwned;
                updateMissingCount();
                select.dispatchEvent(new Event('change', { bubbles: true }));
            });
        });

        select.addEventListener('change', () => {
            const selected = new Set(Array.from(select.selectedOptions).map(o => o.value));
            grid.querySelectorAll('.sticker-cell').forEach(btn => {
                const key = btn.dataset.cellKey;
                const isOwned = selected.has(key);
                btn.classList.toggle('owned', isOwned);
                btn.classList.toggle('missing', !isOwned);
            });
            updateMissingCount();
        });
    });
}

/**
 * Initialise les dropdowns custom pour les champs de métadonnées
 * @param {HTMLElement} container - Conteneur des champs
 */
export function initMetadataDropdowns(container) {
    const t = getTranslations();
    
    // Initialiser les select simples
    container.querySelectorAll('.metadata-select-wrapper').forEach(wrapper => {
        const select = wrapper.querySelector('select');
        if (!select) return;
        
        const options = JSON.parse(select.dataset.options || '[]');
        const selectedValue = select.dataset.selectedValue || '';
        const icon = wrapper.dataset.icon || '';
        
        const formattedOptions = [
            { value: '', text: `-- ${t.select_option || 'Choisir'} --`, icon: '' }
        ];
        
        options.forEach(opt => {
            const optValue = typeof opt === 'object' ? opt.value : opt;
            const optLabel = typeof opt === 'object' ? opt.label : opt;
            formattedOptions.push({
                value: optValue,
                text: optLabel,
                icon: icon
            });
        });
        
        createMetadataSelectDropdown(select, formattedOptions, selectedValue);
    });
    
    // Initialiser les multiselect
    container.querySelectorAll('.metadata-multiselect-wrapper').forEach(wrapper => {
        const select = wrapper.querySelector('select');
        if (!select) return;
        
        const options = JSON.parse(select.dataset.options || '[]');
        const icon = wrapper.dataset.icon || '';
        
        const selectedValues = Array.from(select.selectedOptions).map(o => o.value);
        
        createMetadataMultiselectDropdown(select, options, selectedValues, icon);
    });
}

/**
 * Crée un dropdown custom pour un select de métadonnées
 */
function createMetadataSelectDropdown(select, options, selectedValue) {
    const t = getTranslations();
    
    let dropdown = select.parentElement;
    if (!dropdown.classList.contains('custom-dropdown')) {
        dropdown = document.createElement('div');
        dropdown.className = 'custom-dropdown metadata-dropdown';
        select.parentNode.insertBefore(dropdown, select);
        dropdown.appendChild(select);
    }
    
    select.style.display = 'none';
    
    if (dropdown.dataset.menuId) {
        const oldMenu = document.querySelector(`.custom-dropdown-menu[data-dropdown-id="${dropdown.dataset.menuId}"]`);
        if (oldMenu) oldMenu.remove();
    }
    
    const selectedOption = options.find(opt => opt.value == selectedValue) || options[0];
    
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'custom-dropdown-trigger';
    trigger.innerHTML = `
        ${selectedOption?.icon ? `<span class="custom-dropdown-icon">${renderMdiIcon(selectedOption.icon)}</span>` : ''}
        <span class="custom-dropdown-text">${selectedOption?.text || (t.select_option || 'Choisir')}</span>
        <svg class="custom-dropdown-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6,9 12,15 18,9"></polyline>
        </svg>
    `;
    dropdown.insertBefore(trigger, select);
    
    const menu = document.createElement('div');
    menu.className = 'custom-dropdown-menu';
    menu.dataset.dropdownId = 'metadata-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    dropdown.dataset.menuId = menu.dataset.dropdownId;
    document.body.appendChild(menu);
    
    options.forEach(opt => {
        const optionEl = document.createElement('div');
        optionEl.className = 'custom-dropdown-option';
        if (opt.value === '' || opt.value === null) {
            optionEl.classList.add('empty-option');
        }
        if (opt.value == selectedValue || (selectedValue === '' && opt.value === '')) {
            optionEl.classList.add('selected');
        }
        optionEl.dataset.value = opt.value;
        
        optionEl.innerHTML = `
            ${opt.icon ? `<span class="custom-dropdown-option-icon">${renderMdiIcon(opt.icon)}</span>` : ''}
            <span class="custom-dropdown-option-text">${opt.text}</span>
            <svg class="custom-dropdown-option-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="20,6 9,17 4,12"></polyline>
            </svg>
        `;
        
        optionEl.addEventListener('click', () => {
            menu.querySelectorAll('.custom-dropdown-option').forEach(el => el.classList.remove('selected'));
            optionEl.classList.add('selected');
            
            const iconEl = trigger.querySelector('.custom-dropdown-icon');
            const textEl = trigger.querySelector('.custom-dropdown-text');
            
            if (opt.icon) {
                if (iconEl) {
                    iconEl.innerHTML = renderMdiIcon(opt.icon);
                    iconEl.style.display = '';
                } else {
                    const newIconEl = document.createElement('span');
                    newIconEl.className = 'custom-dropdown-icon';
                    newIconEl.innerHTML = renderMdiIcon(opt.icon);
                    trigger.insertBefore(newIconEl, trigger.firstChild);
                }
            } else if (iconEl) {
                iconEl.style.display = 'none';
            }
            
            textEl.textContent = opt.text;
            select.value = opt.value;
            select.dispatchEvent(new Event('change', { bubbles: true }));
            closeDropdown();
        });
        
        menu.appendChild(optionEl);
    });
    
    function positionMenu() {
        const rect = trigger.getBoundingClientRect();
        menu.style.position = 'fixed';
        menu.style.top = (rect.bottom + 4) + 'px';
        menu.style.left = rect.left + 'px';
        menu.style.width = rect.width + 'px';
    }
    
    function closeDropdown() {
        dropdown.classList.remove('open');
        menu.classList.remove('open');
    }
    
    function openDropdown() {
        document.querySelectorAll('.custom-dropdown.open').forEach(d => d.classList.remove('open'));
        document.querySelectorAll('.custom-dropdown-menu.open').forEach(m => m.classList.remove('open'));
        positionMenu();
        dropdown.classList.add('open');
        menu.classList.add('open');
    }
    
    trigger.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropdown.classList.contains('open') ? closeDropdown() : openDropdown();
    });
    
    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target) && !menu.contains(e.target)) {
            closeDropdown();
        }
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && dropdown.classList.contains('open')) {
            closeDropdown();
            e.stopPropagation();
        }
    });
}

/**
 * Crée un dropdown multiselect pour les métadonnées
 */
function createMetadataMultiselectDropdown(select, options, selectedValues, icon) {
    const t = getTranslations();
    
    let dropdown = select.parentElement;
    if (!dropdown.classList.contains('custom-dropdown')) {
        dropdown = document.createElement('div');
        dropdown.className = 'custom-dropdown metadata-dropdown multiselect';
        select.parentNode.insertBefore(dropdown, select);
        dropdown.appendChild(select);
    }
    
    select.style.display = 'none';
    
    if (dropdown.dataset.menuId) {
        const oldMenu = document.querySelector(`.custom-dropdown-menu[data-dropdown-id="${dropdown.dataset.menuId}"]`);
        if (oldMenu) oldMenu.remove();
    }
    
    const getDisplayText = () => {
        const selected = Array.from(select.selectedOptions);
        if (selected.length === 0) return t.select_option || 'Choisir';
        if (selected.length === 1) return selected[0].text;
        return `${selected.length} sélectionné(s)`;
    };
    
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'custom-dropdown-trigger';
    trigger.innerHTML = `
        <span class="custom-dropdown-text">${getDisplayText()}</span>
        <svg class="custom-dropdown-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6,9 12,15 18,9"></polyline>
        </svg>
    `;
    dropdown.insertBefore(trigger, select);
    
    const menu = document.createElement('div');
    menu.className = 'custom-dropdown-menu custom-dropdown-multiselect-menu';
    menu.dataset.dropdownId = 'metadata-multi-' + Date.now();
    dropdown.dataset.menuId = menu.dataset.dropdownId;
    document.body.appendChild(menu);
    
    options.forEach(opt => {
        const optValue = typeof opt === 'object' ? opt.value : opt;
        const optLabel = typeof opt === 'object' ? opt.label : opt;
        const isSelected = selectedValues.includes(optValue);
        
        const optionEl = document.createElement('div');
        optionEl.className = 'custom-dropdown-option custom-dropdown-checkbox-option' + (isSelected ? ' selected' : '');
        optionEl.dataset.value = optValue;
        
        optionEl.innerHTML = `
            <span class="custom-dropdown-checkbox">${isSelected ? '✓' : ''}</span>
            <span class="custom-dropdown-option-text">${escapeHtml(optLabel)}</span>
        `;
        
        optionEl.addEventListener('click', (e) => {
            e.stopPropagation();
            const nativeOption = select.querySelector(`option[value="${optValue}"]`);
            if (nativeOption) {
                nativeOption.selected = !nativeOption.selected;
                optionEl.classList.toggle('selected');
                optionEl.querySelector('.custom-dropdown-checkbox').textContent = nativeOption.selected ? '✓' : '';
                trigger.querySelector('.custom-dropdown-text').textContent = getDisplayText();
            }
        });
        
        menu.appendChild(optionEl);
    });
    
    function positionMenu() {
        const rect = trigger.getBoundingClientRect();
        menu.style.position = 'fixed';
        menu.style.top = (rect.bottom + 4) + 'px';
        menu.style.left = rect.left + 'px';
        menu.style.width = Math.max(rect.width, 200) + 'px';
    }
    
    function closeDropdown() {
        dropdown.classList.remove('open');
        menu.classList.remove('open');
    }
    
    function openDropdown() {
        document.querySelectorAll('.custom-dropdown.open').forEach(d => d.classList.remove('open'));
        document.querySelectorAll('.custom-dropdown-menu.open').forEach(m => m.classList.remove('open'));
        positionMenu();
        dropdown.classList.add('open');
        menu.classList.add('open');
    }
    
    trigger.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropdown.classList.contains('open') ? closeDropdown() : openDropdown();
    });
    
    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target) && !menu.contains(e.target)) {
            closeDropdown();
        }
    });
}

/**
 * Appliquer les métadonnées importées aux champs du formulaire
 * @param {HTMLElement} modal - Élément modal
 * @param {Object} metadata - Objet avec les métadonnées à appliquer
 */
export function applyImportedMetadata(modal, metadata) {
    const container = modal.querySelector('#detailsFieldsContainer');
    if (!container) {
        console.log('[Collection] Container de métadonnées non trouvé');
        return;
    }
    
    let appliedCount = 0;
    let notFoundKeys = [];
    
    Object.entries(metadata).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '') return;
        
        let processedValue = value;
        if (Array.isArray(value)) {
            processedValue = value.join(', ');
        }
        
        // Traitement spécial pour special_stickers
        if (key === 'special_stickers' && typeof value === 'object' && !Array.isArray(value)) {
            const lines = [];
            for (const [type, data] of Object.entries(value)) {
                if (data && typeof data === 'object') {
                    const raw = data.raw || (Array.isArray(data.items) ? data.items.join(', ') : '');
                    const total = data.total || (Array.isArray(data.items) ? data.items.length : 0);
                    if (raw || total) {
                        const typeName = type.charAt(0).toUpperCase() + type.slice(1);
                        lines.push(`${typeName}: ${raw}${total ? ` (${total})` : ''}`);
                    }
                } else if (data) {
                    const typeName = type.charAt(0).toUpperCase() + type.slice(1);
                    lines.push(`${typeName}: ${data}`);
                }
            }
            processedValue = lines.join('\n');
            if (!processedValue) return;
        }
        
        let field = container.querySelector(`[data-field-key="${key}"]`);
        
        if (!field) {
            field = container.querySelector(`#metadata_${key}`);
        }
        
        if (field) {
            const effectiveFieldKey = field.dataset.fieldKey || '';
            
            // Traitement spécial pour checklist
            if (key === 'checklist' || effectiveFieldKey === 'checklist') {
                modal._lastImportedChecklist = processedValue;
                
                const gridWrapper = container.querySelector('.metadata-sticker-grid-wrapper');
                if (gridWrapper) {
                    refreshStickerGrid(modal);
                }
                
                appliedCount++;
                return;
            }
            
            // Traitement pour sticker_grid
            if (effectiveFieldKey === 'sticker_grid') {
                try {
                    if (typeof processedValue === 'object' && processedValue !== null) {
                        if (Array.isArray(processedValue.items) && processedValue.items.length > 0) {
                            const expandedItems = [];
                            for (const item of processedValue.items) {
                                const itemStr = String(item);
                                if (itemStr.match(/[àto\-–—]/i) && itemStr.length > 1) {
                                    const parsedRange = parseChecklistString(itemStr);
                                    if (parsedRange.length > 0) {
                                        expandedItems.push(...parsedRange);
                                    } else {
                                        expandedItems.push(itemStr);
                                    }
                                } else {
                                    expandedItems.push(itemStr);
                                }
                            }
                            processedValue = expandedItems;
                        } else if (processedValue.raw) {
                            const parsedCells = parseChecklistString(processedValue.raw);
                            if (parsedCells && parsedCells.length > 0) {
                                processedValue = parsedCells;
                            }
                        }
                    } else if (typeof processedValue === 'string') {
                        const parsedCells = parseChecklistString(processedValue);
                        if (parsedCells && parsedCells.length > 0) {
                            processedValue = parsedCells;
                        }
                    }
                    
                    if (Array.isArray(processedValue) && processedValue.length > 0) {
                        modal._lastImportedChecklist = processedValue;
                        
                        const gridWrapper = field.querySelector('.sticker-grid-wrapper');
                        if (gridWrapper) {
                            refreshStickerGrid(modal);
                        }
                        
                        appliedCount++;
                        return;
                    }
                } catch (e) {
                    console.warn('[Collection] parseChecklistString failed', e);
                }
            }
            
            const input = field.querySelector('input, textarea, select');
            if (input) {
                if (input.type === 'checkbox') {
                    input.checked = Boolean(processedValue);
                } else if (input.type === 'number') {
                    const numValue = parseFloat(String(processedValue).replace(/[^\d.,]/g, ''));
                    if (!isNaN(numValue)) {
                        input.value = numValue;
                    }
                } else if (input.tagName === 'SELECT') {
                    let valueToSet = normalizeFieldValue(key, processedValue);
                    
                    if (typeof valueToSet === 'boolean') {
                        valueToSet = valueToSet ? 'Oui' : 'Non';
                    } else if (valueToSet === 'true' || valueToSet === '1') {
                        valueToSet = 'Oui';
                    } else if (valueToSet === 'false' || valueToSet === '0') {
                        valueToSet = 'Non';
                    }
                    
                    let finalValue = null;
                    const optionExists = Array.from(input.options).some(opt => opt.value === valueToSet);
                    if (optionExists) {
                        finalValue = valueToSet;
                    } else {
                        const matchingOption = Array.from(input.options).find(opt => 
                            opt.value.toLowerCase() === String(valueToSet).toLowerCase() ||
                            opt.textContent.toLowerCase() === String(valueToSet).toLowerCase()
                        );
                        if (matchingOption) {
                            finalValue = matchingOption.value;
                        }
                    }
                    
                    if (finalValue !== null) {
                        input.value = finalValue;
                        
                        const wrapper = input.closest('.custom-dropdown, .metadata-select-wrapper');
                        if (wrapper) {
                            const menuId = wrapper.dataset.menuId;
                            const menu = menuId ? document.querySelector(`.custom-dropdown-menu[data-dropdown-id="${menuId}"]`) : null;
                            
                            const trigger = wrapper.querySelector('.custom-dropdown-trigger');
                            if (trigger) {
                                const textEl = trigger.querySelector('.custom-dropdown-text');
                                const selectedOpt = Array.from(input.options).find(opt => opt.value === finalValue);
                                if (textEl && selectedOpt) {
                                    textEl.textContent = selectedOpt.textContent;
                                }
                            }
                            
                            if (menu) {
                                menu.querySelectorAll('.custom-dropdown-option').forEach(optEl => {
                                    optEl.classList.toggle('selected', optEl.dataset.value === finalValue);
                                });
                            }
                        }
                    }
                } else {
                    input.value = processedValue;
                }
                appliedCount++;
            }
        } else {
            notFoundKeys.push(key);
        }
    });
    
    if (appliedCount > 0) {
        console.log(`[Collection] ${appliedCount} métadonnée(s) importée(s)`);
    }
    
    if (notFoundKeys.length > 0) {
        console.log(`[Collection] Clés non trouvées dans le formulaire: ${notFoundKeys.join(', ')}`);
    }
}

/**
 * Collecte les valeurs des champs de métadonnées
 * @param {HTMLElement} container - Conteneur des champs
 * @returns {Object} Objet {field_id: value}
 */
export function collectMetadataValues(container) {
    const values = {};
    
    if (!container) return values;
    
    container.querySelectorAll('.metadata-field').forEach(field => {
        const fieldId = field.dataset.fieldId;
        if (!fieldId) return;
        
        // Check for sticker grid (multiselect)
        const stickerSelect = field.querySelector('select[data-sticker-select]');
        if (stickerSelect) {
            const selectedValues = Array.from(stickerSelect.selectedOptions).map(o => o.value);
            values[fieldId] = JSON.stringify(selectedValues);
            return;
        }
        
        // Check for regular multiselect
        const multiSelect = field.querySelector('select[multiple]');
        if (multiSelect) {
            const selectedValues = Array.from(multiSelect.selectedOptions).map(o => o.value);
            values[fieldId] = selectedValues.length > 0 ? JSON.stringify(selectedValues) : '';
            return;
        }
        
        // Regular input/select/textarea
        const input = field.querySelector('input, select, textarea');
        if (input) {
            if (input.type === 'checkbox') {
                values[fieldId] = input.checked ? '1' : '0';
            } else {
                values[fieldId] = input.value;
            }
        }
    });
    
    return values;
}
