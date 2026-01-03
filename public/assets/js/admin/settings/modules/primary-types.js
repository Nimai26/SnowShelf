/**
 * SnowShelf - Admin Primary Types Module
 * Gestion des types principaux et leurs fournisseurs par défaut
 */

import { API_ENDPOINTS } from '/assets/js/admin/core/config.js';
import { showToast, showLoading, escapeHtml, normalizeMdiIcon, renderIcon } from '/assets/js/admin/core/utils.js';
import { setPrimaryTypesData } from '/assets/js/admin/core/state.js';

const PRIMARY_TYPES_API = API_ENDPOINTS.PRIMARY_TYPES;

// Éléments DOM
let elements = {};

// Données chargées
let primaryTypesData = {
    primary_types: [],
    providers: [],
    api_types: []
};

/**
 * Charge les types principaux et leurs fournisseurs
 */
export async function loadPrimaryTypes() {
    if (!elements.primaryTypesContainer) return;
    
    try {
        elements.primaryTypesContainer.innerHTML = '<div class="loading-placeholder">Chargement...</div>';
        
        const response = await fetch(PRIMARY_TYPES_API, {
            credentials: 'same-origin'
        });
        const result = await response.json();
        
        if (result.success) {
            primaryTypesData = result.data;
            setPrimaryTypesData(result.data.primary_types || []);
            renderPrimaryTypes();
        } else {
            throw new Error(result.error || 'Erreur lors du chargement');
        }
    } catch (error) {
        console.error('[AdminSettings] Error loading primary types:', error);
        elements.primaryTypesContainer.innerHTML = `
            <div class="error-message">
                <p>Erreur lors du chargement des types primaires</p>
                <button class="btn btn-secondary" onclick="location.reload()">Réessayer</button>
            </div>
        `;
    }
}

/**
 * Rend l'interface des types principaux avec cartes
 */
function renderPrimaryTypes() {
    const { primary_types: primaryTypes, providers, api_types: apiTypes } = primaryTypesData;
    
    if (!primaryTypes || primaryTypes.length === 0) {
        elements.primaryTypesContainer.innerHTML = `
            <div class="empty-state">
                <h3>Aucun type principal configuré</h3>
                <p>Les types principaux sont créés dans la base de données</p>
            </div>
        `;
        return;
    }
    
    // Bouton d'ajout
    let html = `
        <div class="primary-types-header">
            <button class="btn btn-primary" id="addPrimaryTypeBtn">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Ajouter un type
            </button>
        </div>
    `;
    
    html += '<div class="primary-types-grid">';
    
    for (const type of primaryTypes) {
        // Construire les options du dropdown custom des types API
        const currentApiType = type.webapi_type || '';
        const currentApiTypeLabel = currentApiType || '-- Aucun --';
        
        let apiTypeOptionsHtml = `
            <div class="custom-dropdown-option ${!currentApiType ? 'selected' : ''}" data-value="" data-icon="🚫">
                <span class="custom-dropdown-option-icon">🚫</span>
                <span class="custom-dropdown-option-text">-- Aucun --</span>
            </div>
        `;
        (apiTypes || []).forEach(apiType => {
            const isSelected = currentApiType === apiType ? 'selected' : '';
            const icon = getApiTypeIcon(apiType);
            apiTypeOptionsHtml += `
                <div class="custom-dropdown-option ${isSelected}" data-value="${escapeHtml(apiType)}" data-icon="${icon}">
                    <span class="custom-dropdown-option-icon">${icon}</span>
                    <span class="custom-dropdown-option-text">${escapeHtml(apiType)}</span>
                </div>
            `;
        });
        
        // Filtrer les fournisseurs selon le type API sélectionné
        const availableProviders = type.webapi_type 
            ? providers.filter(p => p.Type === type.webapi_type)
            : [];
        
        // Construire les checkboxes des fournisseurs
        let providersHtml = '';
        if (availableProviders.length > 0) {
            providersHtml = availableProviders.map(provider => {
                const checked = (type.default_provider_ids || []).includes(parseInt(provider.id)) ? 'checked' : '';
                const premiumBadge = provider.PREMIUM_ONLY == 1 
                    ? '<span class="badge badge-premium" title="Premium">P</span>' 
                    : '';
                return `
                    <label class="provider-checkbox">
                        <input type="checkbox" 
                               value="${provider.id}" 
                               ${checked}
                               data-provider-id="${provider.id}">
                        <span class="provider-name">${escapeHtml(provider.Name_UF)}</span>
                        ${premiumBadge}
                    </label>
                `;
            }).join('');
        } else {
            providersHtml = '<p class="no-providers-hint">Sélectionnez un type d\'API pour voir les fournisseurs</p>';
        }
        
        const currentIcon = currentApiType ? getApiTypeIcon(currentApiType) : '🚫';
        
        html += `
            <div class="primary-type-card" data-type-id="${type.id}" data-icon="${escapeHtml(type.icon || '')}" data-color="${escapeHtml(type.color || '#666666')}" data-inter-name="${escapeHtml(type.inter_name || '')}">
                <div class="primary-type-header">
                    <div class="type-icon" style="background-color: ${type.color || '#666'}">
                        ${renderIcon(type.icon || 'mdi:folder', 24)}
                    </div>
                    <div class="type-info">
                        <h4>${escapeHtml(type.name_fr || type.name || '')}</h4>
                        <span class="type-inter-name">${escapeHtml(type.inter_name || '')}</span>
                    </div>
                </div>
                
                <div class="primary-type-body">
                    <div class="form-group">
                        <label>Type d'API associé</label>
                        <div class="custom-dropdown webapi-type-dropdown" id="webapiTypeDropdown_${type.id}" data-type-id="${type.id}">
                            <select class="custom-dropdown-select webapi-type-select" data-type-id="${type.id}">
                                <option value="">-- Aucun --</option>
                                ${(apiTypes || []).map(apiType => `<option value="${escapeHtml(apiType)}" ${type.webapi_type === apiType ? 'selected' : ''}>${escapeHtml(apiType)}</option>`).join('')}
                            </select>
                            <button type="button" class="custom-dropdown-trigger">
                                <span class="custom-dropdown-icon">${currentIcon}</span>
                                <span class="custom-dropdown-text">${escapeHtml(currentApiTypeLabel)}</span>
                                <svg class="custom-dropdown-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </button>
                            <div class="custom-dropdown-menu">
                                ${apiTypeOptionsHtml}
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-group providers-group">
                        <label>Fournisseurs par défaut</label>
                        <div class="providers-list" data-type-id="${type.id}">
                            ${providersHtml}
                        </div>
                    </div>
                </div>
                
                <div class="primary-type-footer">
                    <button class="btn btn-secondary btn-sm duplicate-type-btn" data-type-id="${type.id}" title="Dupliquer ce type">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                        Dupliquer
                    </button>
                    <button class="btn btn-primary btn-sm save-type-btn" data-type-id="${type.id}">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                            <polyline points="17 21 17 13 7 13 7 21"></polyline>
                            <polyline points="7 3 7 8 15 8"></polyline>
                        </svg>
                        Sauvegarder
                    </button>
                </div>
            </div>
        `;
    }
    
    html += '</div>';
    elements.primaryTypesContainer.innerHTML = html;
    
    // Attacher les événements
    bindPrimaryTypesEvents();
}

/**
 * Retourne une icône pour un type d'API
 * @param {string} apiType - Type d'API
 * @returns {string} Icône
 */
function getApiTypeIcon(apiType) {
    const icons = {
        'books': '📚',
        'video_games': '🎮',
        'movies': '🎬',
        'music': '🎵',
        'toys': '🧸',
        'generic': '📦'
    };
    return icons[apiType] || '📋';
}

/**
 * Attache les événements aux éléments des types primaires
 */
function bindPrimaryTypesEvents() {
    // Bouton d'ajout de type primaire
    const addBtn = document.getElementById('addPrimaryTypeBtn');
    if (addBtn) {
        addBtn.addEventListener('click', openAddPrimaryTypeModal);
    }
    
    // Initialiser les dropdowns custom pour les types API
    document.querySelectorAll('.webapi-type-dropdown').forEach(dropdown => {
        initWebapiTypeDropdown(dropdown);
    });
    
    // Fermer les dropdowns au clic extérieur (une seule fois)
    if (!window._primaryTypesDropdownClickHandler) {
        window._primaryTypesDropdownClickHandler = (e) => {
            if (!e.target.closest('.webapi-type-dropdown')) {
                document.querySelectorAll('.webapi-type-dropdown .custom-dropdown-menu.open').forEach(menu => {
                    menu.classList.remove('open');
                });
            }
        };
        document.addEventListener('click', window._primaryTypesDropdownClickHandler);
    }
    
    // Boutons de sauvegarde
    document.querySelectorAll('.save-type-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const typeId = parseInt(e.target.dataset.typeId || e.target.closest('.save-type-btn').dataset.typeId);
            savePrimaryType(typeId);
        });
    });
    
    // Boutons de duplication
    document.querySelectorAll('.duplicate-type-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const typeId = parseInt(e.target.dataset.typeId || e.target.closest('.duplicate-type-btn').dataset.typeId);
            openDuplicateTypeModal(typeId);
        });
    });
}

/**
 * Initialise un dropdown custom pour le type API
 * @param {HTMLElement} dropdown - Élément dropdown
 */
function initWebapiTypeDropdown(dropdown) {
    const trigger = dropdown.querySelector('.custom-dropdown-trigger');
    const menu = dropdown.querySelector('.custom-dropdown-menu');
    const select = dropdown.querySelector('.custom-dropdown-select');
    const typeId = parseInt(dropdown.dataset.typeId);
    
    if (!trigger || !menu || !select) return;
    
    // Ouvrir/fermer le menu
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = menu.classList.contains('open');
        
        // Fermer tous les autres dropdowns
        document.querySelectorAll('.custom-dropdown-menu.open').forEach(m => {
            m.classList.remove('open');
        });
        
        if (!isOpen) {
            // Positionner le menu
            const rect = trigger.getBoundingClientRect();
            menu.style.position = 'fixed';
            menu.style.top = `${rect.bottom + 2}px`;
            menu.style.left = `${rect.left}px`;
            menu.style.width = `${rect.width}px`;
            menu.style.zIndex = '99999';
            menu.classList.add('open');
        }
    });
    
    // Sélectionner une option
    menu.querySelectorAll('.custom-dropdown-option').forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation();
            const value = option.dataset.value;
            const icon = option.dataset.icon || '📋';
            const text = option.querySelector('.custom-dropdown-option-text')?.textContent || value;
            
            // Mettre à jour le select caché
            select.value = value;
            
            // Mettre à jour l'affichage du trigger
            trigger.querySelector('.custom-dropdown-icon').textContent = icon;
            trigger.querySelector('.custom-dropdown-text').textContent = text;
            
            // Mettre à jour les classes selected
            menu.querySelectorAll('.custom-dropdown-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            option.classList.add('selected');
            
            // Fermer le menu
            menu.classList.remove('open');
            
            // Déclencher le changement de fournisseurs
            updateProvidersForType(typeId, value);
        });
    });
}

/**
 * Met à jour la liste des fournisseurs pour un type selon le type API sélectionné
 * @param {number} typeId - ID du type primaire
 * @param {string} webapiType - Type d'API sélectionné
 */
function updateProvidersForType(typeId, webapiType) {
    const providersList = document.querySelector(`.providers-list[data-type-id="${typeId}"]`);
    if (!providersList) return;
    
    const { providers } = primaryTypesData;
    
    // Filtrer les fournisseurs selon le type API
    const availableProviders = webapiType 
        ? providers.filter(p => p.Type === webapiType)
        : [];
    
    if (availableProviders.length === 0) {
        providersList.innerHTML = '<p class="no-providers-hint">Aucun fournisseur disponible pour ce type</p>';
        return;
    }
    
    // Récupérer les fournisseurs actuellement cochés
    const currentType = primaryTypesData.primary_types.find(t => t.id === typeId);
    const currentProviderIds = currentType?.default_provider_ids || [];
    
    providersList.innerHTML = availableProviders.map(provider => {
        const checked = currentProviderIds.includes(parseInt(provider.id)) ? 'checked' : '';
        const premiumBadge = provider.PREMIUM_ONLY == 1 
            ? '<span class="badge badge-premium" title="Premium">P</span>' 
            : '';
        return `
            <label class="provider-checkbox">
                <input type="checkbox" 
                       value="${provider.id}" 
                       ${checked}
                       data-provider-id="${provider.id}">
                <span class="provider-name">${escapeHtml(provider.Name_UF)}</span>
                ${premiumBadge}
            </label>
        `;
    }).join('');
}

/**
 * Sauvegarde un type primaire
 * @param {number} typeId - ID du type primaire
 */
async function savePrimaryType(typeId) {
    const card = document.querySelector(`.primary-type-card[data-type-id="${typeId}"]`);
    if (!card) return;
    
    const webapiTypeSelect = card.querySelector('.webapi-type-select');
    const webapiType = webapiTypeSelect?.value || null;
    
    // Récupérer les fournisseurs cochés
    const providerCheckboxes = card.querySelectorAll('.providers-list input[type="checkbox"]:checked');
    const defaultProviderIds = Array.from(providerCheckboxes).map(cb => parseInt(cb.value));
    
    const saveBtn = card.querySelector('.save-type-btn');
    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<span class="spinner-small"></span> Sauvegarde...';
    saveBtn.disabled = true;
    
    try {
        const response = await fetch(PRIMARY_TYPES_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                primary_type_id: typeId,
                webapi_type: webapiType,
                default_provider_ids: defaultProviderIds
            }),
            credentials: 'same-origin'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Configuration sauvegardée', 'success');
            
            // Mettre à jour les données locales
            const typeIndex = primaryTypesData.primary_types.findIndex(t => t.id === typeId);
            if (typeIndex !== -1) {
                primaryTypesData.primary_types[typeIndex].webapi_type = webapiType;
                primaryTypesData.primary_types[typeIndex].default_provider_ids = defaultProviderIds;
            }
        } else {
            showToast(result.error || 'Erreur lors de la sauvegarde', 'error');
        }
    } catch (error) {
        console.error('Save primary type error:', error);
        showToast('Erreur de connexion', 'error');
    } finally {
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
    }
}

// Variable pour stocker le ModalManager
let ModalManager = null;

/**
 * Ouvre le modal d'ajout de type primaire
 */
function openAddPrimaryTypeModal() {
    if (!ModalManager) {
        showToast('ModalManager non disponible', 'error');
        return;
    }
    
    const { api_types: apiTypes } = primaryTypesData;
    
    const apiTypeOptions = (apiTypes || []).map(apiType => 
        `<option value="${escapeHtml(apiType)}">${escapeHtml(apiType)}</option>`
    ).join('');
    
    const defaultNameJson = '{\n  "fr": "",\n  "en": ""\n}';
    
    const content = `
        <form id="addPrimaryTypeForm" class="form-grid">
            <div class="form-group">
                <label for="newTypeNameJson">Nom (JSON) <span class="required">*</span></label>
                <textarea id="newTypeNameJson" class="form-control code-input" rows="4" required>${escapeHtml(defaultNameJson)}</textarea>
                <small class="form-hint">Format : <code>{"fr": "Livres", "en": "Books"}</code></small>
            </div>
            <div class="form-group">
                <label for="newTypeInterName">Nom interne (code)</label>
                <input type="text" id="newTypeInterName" class="form-control" 
                       placeholder="video_games" maxlength="50"
                       pattern="^[a-z][a-z0-9_]*$">
                <small class="form-hint">Minuscules, chiffres et _ uniquement. Ex: <code>video_games</code>, <code>sticker_albums</code></small>
            </div>
            <div class="form-row">
                <div class="form-group col-6">
                    <label for="newTypeIcon">Icône MDI</label>
                    <input type="text" id="newTypeIcon" class="form-control" 
                           value="mdi-folder" placeholder="mdi-folder ou mdi:folder">
                    <small class="form-hint"><a href="https://pictogrammers.com/library/mdi/" target="_blank">Liste des icônes MDI</a></small>
                </div>
                <div class="form-group col-6">
                    <label for="newTypeColor">Couleur</label>
                    <input type="color" id="newTypeColor" class="form-control form-control-color" 
                           value="#666666">
                </div>
            </div>
            <div class="form-group">
                <label for="newTypeApiType">Type d'API associé</label>
                <select id="newTypeApiType" class="form-control">
                    <option value="">-- Aucun --</option>
                    ${apiTypeOptions}
                </select>
            </div>
        </form>
    `;
    
    ModalManager.open({
        title: 'Ajouter un type primaire',
        content: content,
        size: 'modal-md',
        buttons: [
            { text: 'Annuler', action: 'close', class: 'btn-secondary' },
            { text: 'Créer', action: 'create', class: 'btn-primary' }
        ],
        onAction: async (action, modalId) => {
            if (action === 'create') {
                await createPrimaryType(modalId);
            }
        }
    });
}

/**
 * Crée un nouveau type primaire
 * @param {string} modalId - ID du modal
 */
async function createPrimaryType(modalId) {
    const nameJsonStr = document.getElementById('newTypeNameJson')?.value.trim();
    const icon = document.getElementById('newTypeIcon')?.value.trim() || 'mdi-folder';
    const color = document.getElementById('newTypeColor')?.value || '#666666';
    const webapiType = document.getElementById('newTypeApiType')?.value || null;
    const interName = document.getElementById('newTypeInterName')?.value.trim() || '';
    
    // Parser et valider le JSON
    let nameJson;
    try {
        nameJson = JSON.parse(nameJsonStr);
    } catch (e) {
        showToast('Format JSON invalide', 'error');
        return;
    }
    
    // Validation
    if (!nameJson.fr || !nameJson.en) {
        showToast('Les noms français (fr) et anglais (en) sont obligatoires', 'error');
        return;
    }
    
    // Validation inter_name
    if (interName && !/^[a-z][a-z0-9_]{0,49}$/.test(interName)) {
        showToast('Nom interne invalide : minuscules, chiffres et _ uniquement', 'error');
        return;
    }
    
    try {
        const response = await fetch(PRIMARY_TYPES_API, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name_json: nameJson,
                inter_name: interName,
                icon,
                color,
                webapi_type: webapiType
            }),
            credentials: 'same-origin'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Type primaire créé avec succès', 'success');
            ModalManager.close(modalId);
            // Recharger les données
            await loadPrimaryTypes();
        } else {
            showToast(result.error || 'Erreur lors de la création', 'error');
        }
    } catch (error) {
        console.error('Create primary type error:', error);
        showToast('Erreur de connexion', 'error');
    }
}

/**
 * Ouvre le modal de duplication d'un type primaire
 * @param {number} sourceTypeId - ID du type à dupliquer
 */
function openDuplicateTypeModal(sourceTypeId) {
    if (!ModalManager) {
        showToast('ModalManager non disponible', 'error');
        return;
    }
    
    // Trouver le type source
    const sourceType = primaryTypesData.primary_types.find(t => t.id === sourceTypeId);
    if (!sourceType) {
        showToast('Type source introuvable', 'error');
        return;
    }
    
    // Préparer les noms par défaut (Copie de X)
    const defaultNameFr = `Copie de ${sourceType.name_fr || sourceType.name || ''}`;
    const defaultNameEn = `Copy of ${sourceType.name_en || sourceType.name || ''}`;
    const defaultNameJson = `{\n  "fr": "${escapeHtml(defaultNameFr)}",\n  "en": "${escapeHtml(defaultNameEn)}"\n}`;
    
    const content = `
        <form id="duplicateTypeForm" class="form-grid">
            <div class="duplicate-info-box">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                <div>
                    <strong>Duplication de : ${escapeHtml(sourceType.name_fr || sourceType.name || '')}</strong>
                    <p>Cette action copiera : les paramètres du type, les champs de détails et les mappings API.</p>
                </div>
            </div>
            
            <div class="form-group">
                <label for="duplicateTypeNameJson">Nouveau nom (JSON) <span class="required">*</span></label>
                <textarea id="duplicateTypeNameJson" class="form-control code-input" rows="4" required>${defaultNameJson}</textarea>
                <small class="form-hint">Format : <code>{"fr": "Nom FR", "en": "Name EN"}</code></small>
            </div>
            
            <div class="form-group">
                <label for="duplicateTypeInterName">Nom interne (code)</label>
                <input type="text" id="duplicateTypeInterName" class="form-control" 
                       placeholder="${sourceType.inter_name ? sourceType.inter_name + '_copy' : 'nouveau_type'}" maxlength="50"
                       pattern="^[a-z][a-z0-9_]*$">
                <small class="form-hint">Minuscules, chiffres et _ uniquement. Laissez vide pour aucun.</small>
            </div>
        </form>
    `;
    
    ModalManager.open({
        title: 'Dupliquer un type',
        content: content,
        size: 'modal-md',
        buttons: [
            { text: 'Annuler', action: 'close', class: 'btn-secondary' },
            { text: 'Dupliquer', action: 'duplicate', class: 'btn-primary' }
        ],
        onAction: async (action, modalId) => {
            if (action === 'duplicate') {
                await duplicatePrimaryType(sourceTypeId, modalId);
            }
        }
    });
}

/**
 * Duplique un type primaire
 * @param {number} sourceTypeId - ID du type source
 * @param {string} modalId - ID du modal
 */
async function duplicatePrimaryType(sourceTypeId, modalId) {
    const nameJsonStr = document.getElementById('duplicateTypeNameJson')?.value.trim();
    const interName = document.getElementById('duplicateTypeInterName')?.value.trim() || '';
    
    // Parser et valider le JSON
    let nameJson;
    try {
        nameJson = JSON.parse(nameJsonStr);
    } catch (e) {
        showToast('Format JSON invalide', 'error');
        return;
    }
    
    // Validation
    if (!nameJson.fr || !nameJson.en) {
        showToast('Les noms français (fr) et anglais (en) sont obligatoires', 'error');
        return;
    }
    
    // Validation inter_name
    if (interName && !/^[a-z][a-z0-9_]{0,49}$/.test(interName)) {
        showToast('Nom interne invalide : minuscules, chiffres et _ uniquement', 'error');
        return;
    }
    
    try {
        const response = await fetch(PRIMARY_TYPES_API, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'duplicate',
                source_id: sourceTypeId,
                name_json: nameJson,
                inter_name: interName
            }),
            credentials: 'same-origin'
        });
        
        const result = await response.json();
        
        if (result.success) {
            const copied = result.data.copied || {};
            showToast(`Type dupliqué ! (${copied.fields || 0} champs, ${copied.mappings || 0} mappings copiés)`, 'success');
            ModalManager.close(modalId);
            // Recharger les données
            await loadPrimaryTypes();
        } else {
            showToast(result.error || 'Erreur lors de la duplication', 'error');
        }
    } catch (error) {
        console.error('Duplicate primary type error:', error);
        showToast('Erreur de connexion', 'error');
    }
}

/**
 * Initialise le module Primary Types
 * @param {Object} domElements - Références aux éléments DOM
 * @param {Object} modalManager - Instance du ModalManager (optionnel)
 */
export function initPrimaryTypes(domElements, modalManager = null) {
    elements = domElements;
    if (modalManager) {
        ModalManager = modalManager;
    }
}
