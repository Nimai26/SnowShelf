/**
 * SnowShelf - Admin Limits Module
 * Gestion des limites utilisateurs
 */

import { API_ENDPOINTS } from '/assets/js/admin/core/config.js';
import { showToast, showLoading, escapeHtml, renderIcon } from '/assets/js/admin/core/utils.js';
import { setDeleteTarget } from '/assets/js/admin/core/state.js';

const CONFIG_API = API_ENDPOINTS.CONFIG;

// Éléments DOM
let elements = {};
let onDeleteCallback = null;

/**
 * Charge les limites utilisateurs
 */
export async function loadLimits() {
    if (!elements.limitsTableBody) return;

    try {
        const response = await fetch(`${CONFIG_API}?table=user_limits`, {
            credentials: 'same-origin'
        });
        const result = await response.json();

        if (result.success) {
            renderLimits(result.data.items || []);
        }
    } catch (error) {
        console.error('Load limits error:', error);
    }
}

/**
 * Rend les limites dans le tableau
 * @param {Array} limits - Liste des limites
 */
function renderLimits(limits) {
    if (limits.length === 0) {
        elements.limitsTableBody.innerHTML = `
            <tr>
                <td colspan="4">
                    <div class="empty-state">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                        </svg>
                        <h3>Aucune limite configurée</h3>
                        <p>Définissez les limites pour les utilisateurs</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    elements.limitsTableBody.innerHTML = limits.map(limit => `
        <tr data-id="${limit.id}">
            <td>${limit.id}</td>
            <td><span class="limit-value">${limit.free_limit}</span></td>
            <td><span class="limit-value premium">${limit.premium_limit ?? '∞'}</span></td>
            <td>
                <div class="actions-cell">
                    <button class="btn-icon" onclick="SettingsPanel.editLimit(${limit.id})" title="Modifier">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="btn-icon danger" onclick="SettingsPanel.deleteLimit(${limit.id})" title="Supprimer">
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
 * Ouvre le modal d'ajout de limite
 */
export function openAddLimitModal() {
    elements.limitModalTitle.textContent = 'Ajouter une limite';
    elements.limitForm.reset();
    document.getElementById('limitId').value = '';
    document.getElementById('limitPremium').value = 100;
    document.getElementById('limitFree').value = 10;
    elements.limitModal.classList.add('active');
}

/**
 * Ouvre le modal d'édition de limite
 * @param {number} id - ID de la limite
 */
export async function openEditLimitModal(id) {
    elements.limitModalTitle.textContent = 'Modifier la limite';
    showLoading(true);

    try {
        const response = await fetch(`${CONFIG_API}?table=user_limits&id=${id}`, {
            credentials: 'same-origin'
        });
        const result = await response.json();

        if (result.success) {
            const limit = result.data;
            document.getElementById('limitId').value = limit.id;
            document.getElementById('limitFree').value = limit.free_limit || 10;
            document.getElementById('limitPremium').value = limit.premium_limit || 100;
            
            elements.limitModal.classList.add('active');
        } else {
            showToast(result.message || 'Erreur lors du chargement', 'error');
        }
    } catch (error) {
        console.error('Load limit error:', error);
        showToast('Erreur de connexion', 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Ferme le modal limite
 */
export function closeLimitModal() {
    elements.limitModal.classList.remove('active');
}

/**
 * Gère la soumission du formulaire limite
 * @param {Event} e - Événement de soumission
 */
export async function handleLimitSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('limitId').value;
    const isNew = !id;
    
    const data = {
        free_limit: parseInt(document.getElementById('limitFree').value) || 10,
        premium_limit: parseInt(document.getElementById('limitPremium').value) || 100
    };

    const url = isNew ? `${CONFIG_API}?table=user_limits` : `${CONFIG_API}?table=user_limits&id=${id}`;
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
            showToast(isNew ? 'Limite créée' : 'Limite mise à jour', 'success');
            closeLimitModal();
            loadLimits();
        } else {
            showToast(result.message || 'Erreur lors de la sauvegarde', 'error');
        }
    } catch (error) {
        console.error('Save limit error:', error);
        showToast('Erreur de connexion', 'error');
    }
}

/**
 * Prépare la suppression d'une limite
 * @param {number} id - ID de la limite
 * @param {string} name - Nom pour confirmation
 */
export function prepareDeleteLimit(id) {
    setDeleteTarget({
        type: 'config',
        table: 'user_limits',
        id: id,
        name: `Limite #${id}`
    });
    if (onDeleteCallback) {
        onDeleteCallback(id, `Limite #${id}`, 'Limite');
    }
}

/**
 * Initialise le module Limits
 * @param {Object} domElements - Références aux éléments DOM
 * @param {Function} deleteCallback - Callback pour la confirmation de suppression
 */
export function initLimits(domElements, deleteCallback) {
    elements = domElements;
    onDeleteCallback = deleteCallback;
    
    if (elements.addLimitBtn) {
        elements.addLimitBtn.addEventListener('click', openAddLimitModal);
    }
    if (elements.limitModalClose) {
        elements.limitModalClose.addEventListener('click', closeLimitModal);
    }
    if (elements.limitModalCancel) {
        elements.limitModalCancel.addEventListener('click', closeLimitModal);
    }
    if (elements.limitModal) {
        elements.limitModal.querySelector('.modal-backdrop')?.addEventListener('click', closeLimitModal);
    }
    if (elements.limitForm) {
        elements.limitForm.addEventListener('submit', handleLimitSubmit);
    }
}
