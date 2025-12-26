/**
 * SnowShelf - Admin APIs Module
 * Gestion des APIs externes
 */

import { API_ENDPOINTS } from '/assets/js/admin/core/config.js';
import { showToast, showLoading, escapeHtml } from '/assets/js/admin/core/utils.js';
import { closeAllDropdowns, positionDropdownMenu } from '/assets/js/admin/ui/dropdown.js';

const CONFIG_API = API_ENDPOINTS.CONFIG;

// Éléments DOM
let elements = {};

/**
 * Charge la liste des APIs
 */
export async function loadApis() {
    if (!elements.apisTableBody) return;

    try {
        const response = await fetch(`${CONFIG_API}?table=Admin_webApi`, {
            credentials: 'same-origin'
        });
        const result = await response.json();

        if (result.success) {
            renderApis(result.data.items || []);
        }
    } catch (error) {
        console.error('Load APIs error:', error);
    }
}

/**
 * Rend la liste des APIs dans le tableau
 * @param {Array} apis - Liste des APIs
 */
function renderApis(apis) {
    if (apis.length === 0) {
        elements.apisTableBody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9"></path>
                        </svg>
                        <h3>Aucune API configurée</h3>
                        <p>Ajoutez votre première API externe</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    elements.apisTableBody.innerHTML = apis.map(api => `
        <tr data-id="${api.id}">
            <td>${api.id}</td>
            <td>
                <div class="api-name-cell">
                    <strong>${escapeHtml(api.Name_UF)}</strong>
                    <small class="text-muted">${escapeHtml(api.name)}</small>
                </div>
            </td>
            <td><span class="badge badge-type">${api.Type || '-'}</span></td>
            <td>
                <span class="limit-badge premium">P: ${api.max_results_premium}</span>
                <span class="limit-badge free">F: ${api.max_results_free}</span>
            </td>
            <td>
                ${api.USER_API == 1 ? '<span class="feature-badge">USER</span>' : ''}
                ${api.READ_CODE == 1 ? '<span class="feature-badge">BARCODE</span>' : ''}
                ${api.has_details == 1 ? '<span class="feature-badge">DETAILS</span>' : ''}
                ${api.CLIENT_ID_ON == 1 ? '<span class="feature-badge">CLIENT_ID</span>' : ''}
                ${api.PREMIUM_ONLY == 1 ? '<span class="feature-badge premium">PREMIUM</span>' : ''}
            </td>
            <td>
                ${api.Defaut_active == 1 
                    ? '<span class="status-badge status-verified"><span class="status-dot"></span>Actif</span>'
                    : '<span class="status-badge status-pending"><span class="status-dot"></span>Inactif</span>'
                }
            </td>
            <td>
                <div class="actions-cell">
                    <button class="btn-icon" onclick="SettingsPanel.editApi(${api.id})" title="Modifier">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="btn-icon danger" onclick="SettingsPanel.deleteApi(${api.id}, '${escapeHtml(api.Name_UF)}')" title="Supprimer">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Ouvre le modal d'ajout d'API
 */
export function openAddApiModal() {
    elements.apiModalTitle.textContent = 'Ajouter une API';
    elements.apiForm.reset();
    document.getElementById('apiId').value = '';
    document.getElementById('apiDefaultActive').checked = true;
    updateApiTypeDropdown('');
    elements.apiModal.classList.add('active');
}

/**
 * Ouvre le modal d'édition d'API
 * @param {number} id - ID de l'API
 */
export async function openEditApiModal(id) {
    elements.apiModalTitle.textContent = 'Modifier l\'API';
    showLoading(true);

    try {
        const response = await fetch(`${CONFIG_API}?table=Admin_webApi&id=${id}`, {
            credentials: 'same-origin'
        });
        const result = await response.json();

        if (result.success) {
            const api = result.data;
            document.getElementById('apiId').value = api.id;
            document.getElementById('apiName').value = api.name || '';
            document.getElementById('apiNameUF').value = api.Name_UF || '';
            document.getElementById('apiType').value = api.Type || '';
            updateApiTypeDropdown(api.Type || '');
            document.getElementById('apiClientId').value = api.client_id || '';
            document.getElementById('apiKey').value = api.api_key || '';
            document.getElementById('apiMaxPremium').value = api.max_results_premium || 100;
            document.getElementById('apiMaxFree').value = api.max_results_free || 10;
            document.getElementById('apiNotes').value = api.Notes || '';
            document.getElementById('apiDefaultActive').checked = api.Defaut_active == 1;
            document.getElementById('apiUserApi').checked = api.USER_API == 1;
            document.getElementById('apiReadCode').checked = api.READ_CODE == 1;
            document.getElementById('apiHasDetails').checked = api.has_details == 1;
            document.getElementById('apiClientIdOn').checked = api.CLIENT_ID_ON == 1;
            document.getElementById('apiPremiumOnly').checked = api.PREMIUM_ONLY == 1;
            
            elements.apiModal.classList.add('active');
        } else {
            showToast(result.message || 'Erreur lors du chargement', 'error');
        }
    } catch (error) {
        console.error('Load API error:', error);
        showToast('Erreur de connexion', 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Ferme le modal API
 */
export function closeApiModal() {
    elements.apiModal.classList.remove('active');
}

/**
 * Gère la soumission du formulaire API
 * @param {Event} e - Événement de soumission
 */
export async function handleApiSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('apiId').value;
    const isNew = !id;
    
    const data = {
        name: document.getElementById('apiName').value,
        Name_UF: document.getElementById('apiNameUF').value,
        Type: document.getElementById('apiType').value,
        client_id: document.getElementById('apiClientId').value,
        api_key: document.getElementById('apiKey').value,
        max_results_premium: parseInt(document.getElementById('apiMaxPremium').value) || 100,
        max_results_free: parseInt(document.getElementById('apiMaxFree').value) || 10,
        Notes: document.getElementById('apiNotes').value,
        Defaut_active: document.getElementById('apiDefaultActive').checked,
        USER_API: document.getElementById('apiUserApi').checked,
        READ_CODE: document.getElementById('apiReadCode').checked,
        has_details: document.getElementById('apiHasDetails').checked,
        CLIENT_ID_ON: document.getElementById('apiClientIdOn').checked,
        PREMIUM_ONLY: document.getElementById('apiPremiumOnly').checked
    };

    const url = isNew ? `${CONFIG_API}?table=Admin_webApi` : `${CONFIG_API}?table=Admin_webApi&id=${id}`;
    const method = isNew ? 'POST' : 'PUT';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            credentials: 'same-origin'
        });

        const result = await response.json();

        if (result.success) {
            showToast(isNew ? 'API créée' : 'API mise à jour', 'success');
            closeApiModal();
            loadApis();
        } else {
            showToast(result.message || 'Erreur lors de la sauvegarde', 'error');
        }
    } catch (error) {
        console.error('Save API error:', error);
        showToast('Erreur de connexion', 'error');
    }
}

/**
 * Bascule la visibilité de la clé API
 */
export function toggleApiKeyVisibility() {
    const input = document.getElementById('apiKey');
    const btn = document.getElementById('toggleApiKey');
    if (!input || !btn) return;
    
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    
    // Changer l'icône
    if (isPassword) {
        btn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
            </svg>
        `;
    } else {
        btn.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
            </svg>
        `;
    }
}

/**
 * Met à jour le dropdown du type d'API
 * @param {string} value - Valeur à sélectionner
 */
function updateApiTypeDropdown(value) {
    const dropdown = document.getElementById('apiTypeDropdown');
    if (!dropdown) return;

    const trigger = dropdown.querySelector('.custom-dropdown-trigger');
    const menu = dropdown.querySelector('.custom-dropdown-menu');
    const select = dropdown.querySelector('select');
    const options = menu.querySelectorAll('.custom-dropdown-option');

    // Mettre à jour le select natif
    select.value = value || '';

    // Trouver l'option correspondante
    let foundOption = null;
    options.forEach(opt => {
        opt.classList.remove('selected');
        if (opt.dataset.value === (value || '')) {
            opt.classList.add('selected');
            foundOption = opt;
        }
    });

    // Mettre à jour le trigger
    if (foundOption) {
        trigger.querySelector('.custom-dropdown-icon').textContent = foundOption.dataset.icon;
        trigger.querySelector('.custom-dropdown-text').textContent = 
            foundOption.querySelector('.custom-dropdown-option-text').textContent;
    }
}

/**
 * Initialise le dropdown du type d'API
 */
function initApiTypeDropdown() {
    const dropdown = document.getElementById('apiTypeDropdown');
    if (!dropdown) return;

    const trigger = dropdown.querySelector('.custom-dropdown-trigger');
    const menu = dropdown.querySelector('.custom-dropdown-menu');
    const select = dropdown.querySelector('select');
    const options = menu.querySelectorAll('.custom-dropdown-option');

    // Click sur le trigger
    trigger.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const isOpen = dropdown.classList.contains('open');
        closeAllDropdowns();
        
        if (!isOpen) {
            dropdown.classList.add('open');
            menu.classList.add('open');
            positionDropdownMenu(trigger, menu);
        }
    });

    // Click sur une option
    options.forEach(option => {
        option.addEventListener('click', () => {
            const value = option.dataset.value;
            const icon = option.dataset.icon;
            const text = option.querySelector('.custom-dropdown-option-text').textContent;

            // Mettre à jour le select natif
            select.value = value;

            // Mettre à jour le trigger
            trigger.querySelector('.custom-dropdown-icon').textContent = icon;
            trigger.querySelector('.custom-dropdown-text').textContent = text;

            // Mettre à jour la sélection visuelle
            options.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');

            // Fermer le menu
            dropdown.classList.remove('open');
            menu.classList.remove('open');
        });
    });

    // Fermer quand on clique ailleurs
    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target)) {
            dropdown.classList.remove('open');
            menu.classList.remove('open');
        }
    });
}

/**
 * Initialise le module APIs
 * @param {Object} domElements - Références aux éléments DOM
 */
export function initApis(domElements) {
    elements = domElements;
    
    initApiTypeDropdown();
    
    if (elements.addApiBtn) {
        elements.addApiBtn.addEventListener('click', openAddApiModal);
    }
    if (elements.apiModalClose) {
        elements.apiModalClose.addEventListener('click', closeApiModal);
    }
    if (elements.apiModalCancel) {
        elements.apiModalCancel.addEventListener('click', closeApiModal);
    }
    if (elements.apiModal) {
        elements.apiModal.querySelector('.modal-backdrop')?.addEventListener('click', closeApiModal);
    }
    if (elements.apiForm) {
        elements.apiForm.addEventListener('submit', handleApiSubmit);
    }
    if (elements.toggleApiKey) {
        elements.toggleApiKey.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleApiKeyVisibility();
        });
    }
}
