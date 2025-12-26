/**
 * SnowShelf - Admin Item Field Mappings Module
 * Gestion globale des mappings de champs fixes (sans dépendance au provider)
 */

import { API_ENDPOINTS, ITEM_FIXED_FIELDS, TRANSFORM_TYPES } from '/assets/js/admin/core/config.js';
import { showToast, escapeHtml } from '/assets/js/admin/core/utils.js';

const CONFIG_API = API_ENDPOINTS.CONFIG;

/**
 * Charge les mappings existants
 * @returns {Promise<Array>} Liste des mappings
 */
export async function loadMappings() {
    try {
        const response = await fetch('../api/admin/item-field-mappings.php');
        const result = await response.json();
        if (result.success) {
            return result.mappings || [];
        }
    } catch (error) {
        console.error('[ItemFieldMappings] Load error:', error);
    }
    return [];
}

/**
 * Ouvre le modal de configuration des mappings de champs fixes globaux
 * @param {Object} ModalManager - Instance du gestionnaire de modal
 */
export async function openItemFieldMappingsModal(ModalManager) {
    // Charger les mappings existants
    const existingMappings = await loadMappings();
    
    // Créer un map des mappings existants par champ
    const mappingsByField = {};
    existingMappings.forEach(m => {
        mappingsByField[m.item_field] = m;
    });
    
    // Construire les lignes du tableau
    const generalFields = ITEM_FIXED_FIELDS.filter(f => f.tab === 'general');
    const mediaFields = ITEM_FIXED_FIELDS.filter(f => f.tab === 'medias');
    
    const buildFieldRow = (field) => {
        const mapping = mappingsByField[field.key] || {};
        const transformOptions = TRANSFORM_TYPES.map(t => 
            `<option value="${t.value}" ${mapping.transform_type === t.value ? 'selected' : ''}>${escapeHtml(t.label)}</option>`
        ).join('');
        
        // Gérer le transform_config (peut être un objet ou une chaîne JSON)
        let configValue = '';
        if (mapping.transform_config) {
            if (typeof mapping.transform_config === 'object') {
                configValue = JSON.stringify(mapping.transform_config);
            } else {
                configValue = mapping.transform_config;
            }
        }
        
        return `
            <tr data-field="${field.key}">
                <td class="field-label-cell">
                    <span class="field-icon">${field.icon}</span>
                    <span class="field-name">${escapeHtml(field.label)}</span>
                    ${field.isArray ? '<span class="badge badge-small">array</span>' : ''}
                </td>
                <td>
                    <input type="text" class="form-control api-path-input" 
                           name="api_path_${field.key}" 
                           value="${escapeHtml(mapping.api_path || '')}"
                           placeholder="${field.isArray ? 'ex: path1, path2, path3' : 'ex: title, metadata.name'}">
                </td>
                <td>
                    <select class="form-control transform-select" name="transform_${field.key}">
                        ${transformOptions}
                    </select>
                </td>
                <td>
                    <input type="text" class="form-control transform-config-input" 
                           name="config_${field.key}" 
                           value="${escapeHtml(configValue)}"
                           placeholder="${field.key === 'images' ? 'ex: {"template": "..."}' : ''}">
                </td>
            </tr>
        `;
    };
    
    const content = `
        <div class="item-field-mappings-container">
            <p class="modal-description">
                Configurez les chemins API pour extraire les données vers les champs fixes des items.
                <br><small>Ces mappings sont utilisés pour tous les providers API.</small>
            </p>
            
            <h4 class="section-subtitle">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="3" y1="9" x2="21" y2="9"></line>
                    <line x1="9" y1="21" x2="9" y2="9"></line>
                </svg>
                Onglet Général
            </h4>
            <table class="mappings-table">
                <thead>
                    <tr>
                        <th style="width: 140px;">Champ</th>
                        <th>Chemins API (séparés par virgule)</th>
                        <th style="width: 120px;">Transformation</th>
                        <th style="width: 180px;">Config</th>
                    </tr>
                </thead>
                <tbody>
                    ${generalFields.map(buildFieldRow).join('')}
                </tbody>
            </table>
            
            <h4 class="section-subtitle">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                    <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
                Onglet Médias
            </h4>
            <table class="mappings-table">
                <thead>
                    <tr>
                        <th style="width: 140px;">Champ</th>
                        <th>Chemins API (séparés par virgule)</th>
                        <th style="width: 120px;">Transformation</th>
                        <th style="width: 180px;">Config</th>
                    </tr>
                </thead>
                <tbody>
                    ${mediaFields.map(buildFieldRow).join('')}
                </tbody>
            </table>
            
            <div class="help-box">
                <strong>Chemins API :</strong>
                <p>Listez plusieurs chemins séparés par des virgules. Le système utilisera le premier chemin qui retourne une valeur.</p>
                <ul>
                    <li><code>title, name, display_name</code> - Essaye title, puis name, puis display_name</li>
                    <li><code>metadata.publisher, publisher</code> - Champs imbriqués</li>
                    <li><code>screenshots[*].url</code> - Tous les éléments d'un tableau</li>
                </ul>
                <strong>Transformations :</strong>
                <ul>
                    <li><strong>Direct</strong> : Valeur telle quelle</li>
                    <li><strong>Array</strong> : Extraire un tableau</li>
                    <li><strong>Premier</strong> : Prendre le premier élément</li>
                    <li><strong>Joindre</strong> : Concaténer (config: <code>{"separator": ", "}</code>)</li>
                    <li><strong>Template</strong> : URL avec variables</li>
                </ul>
            </div>
        </div>
    `;
    
    ModalManager.open({
        title: 'Configuration des champs fixes',
        content: content,
        size: 'modal-xl',
        buttons: [
            { text: 'Annuler', action: 'close', class: 'btn-secondary' },
            { text: 'Enregistrer', action: 'confirm', class: 'btn-primary' }
        ],
        onConfirm: async (modalId) => {
            // Collecter tous les mappings
            const mappings = [];
            
            ITEM_FIXED_FIELDS.forEach(field => {
                const apiPath = document.querySelector(`input[name="api_path_${field.key}"]`)?.value?.trim();
                const transformType = document.querySelector(`select[name="transform_${field.key}"]`)?.value || 'direct';
                const configStr = document.querySelector(`input[name="config_${field.key}"]`)?.value?.trim();
                
                if (apiPath) {
                    let transformConfig = null;
                    if (configStr) {
                        try {
                            transformConfig = JSON.parse(configStr);
                        } catch (e) {
                            // Si ce n'est pas du JSON valide, stocker comme chaîne
                            transformConfig = configStr;
                        }
                    }
                    
                    mappings.push({
                        item_field: field.key,
                        api_path: apiPath,
                        transform_type: transformType,
                        transform_config: transformConfig
                    });
                }
            });
            
            try {
                const response = await fetch('../api/admin/item-field-mappings.php', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mappings })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    showToast(`${result.count} mapping(s) enregistré(s)`, 'success');
                    ModalManager.close(modalId);
                } else {
                    showToast(result.error || 'Erreur', 'error');
                    return false;
                }
            } catch (error) {
                console.error('[ItemFieldMappings] Save error:', error);
                showToast('Erreur de sauvegarde', 'error');
                return false;
            }
        }
    });
}

/**
 * Initialise le module Item Field Mappings
 * @param {Object} elements - Références aux éléments DOM
 * @param {Object} ModalManager - Instance du gestionnaire de modal
 */
export function initItemFieldMappings(elements, ModalManager) {
    // Attacher l'événement au bouton
    if (elements.itemFieldMappingsBtn) {
        elements.itemFieldMappingsBtn.addEventListener('click', () => {
            openItemFieldMappingsModal(ModalManager);
        });
    }
}
