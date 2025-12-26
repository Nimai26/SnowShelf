/**
 * SnowShelf - Admin Statuses Module
 * Gestion des statuts utilisateurs
 */

import { API_ENDPOINTS } from '/assets/js/admin/core/config.js';
import { showToast, showLoading, escapeHtml, renderIcon, normalizeMdiIcon } from '/assets/js/admin/core/utils.js';
import { setDeleteTarget } from '/assets/js/admin/core/state.js';

const STATUSES_API = API_ENDPOINTS.STATUSES;

// Éléments DOM
let elements = {};
let onDeleteCallback = null;

/**
 * Charge les statuts utilisateurs
 */
export async function loadStatuses() {
    if (!elements.statusesTableBody) return;

    try {
        const response = await fetch(`${STATUSES_API}?admin=1`, {
            credentials: 'same-origin'
        });
        const result = await response.json();

        if (result.success) {
            // Filtrer les statuts par défaut (defaut)
            renderStatuses(result.data.statuses?.filter(s => s.defaut) || []);
        }
    } catch (error) {
        console.error('Load statuses error:', error);
    }
}

/**
 * Rend les statuts dans le tableau
 * @param {Array} statuses - Liste des statuts
 */
function renderStatuses(statuses) {
    if (statuses.length === 0) {
        elements.statusesTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="table-empty">Aucun statut par défaut configuré.</td>
            </tr>
        `;
        return;
    }

    elements.statusesTableBody.innerHTML = statuses.map(status => `
        <tr data-id="${status.id}">
            <td class="text-center">${status.id}</td>
            <td class="text-center">
                <span class="color-badge" style="background-color: ${escapeHtml(status.color || '#6b7280')};"></span>
            </td>
            <td><strong>${escapeHtml(status.name)}</strong></td>
            <td class="text-muted">${escapeHtml(status.description || '-')}</td>
            <td class="text-center">
                ${status.icon ? `<span class="feather-icon" data-feather="${escapeHtml(status.icon)}"></span>` : '-'}
            </td>
            <td class="text-center">
                <span class="badge badge-info">${status.usage_count || 0}</span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon btn-edit" onclick="SettingsPanel.editStatus(${status.id})" title="Modifier">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                        </svg>
                    </button>
                    <button class="btn-icon btn-delete" onclick="SettingsPanel.deleteStatus(${status.id}, '${escapeHtml(status.name).replace(/'/g, "\\'")}', ${status.usage_count || 0})" title="Supprimer">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');

    // Réinitialiser les icônes feather si disponibles
    if (typeof feather !== 'undefined') {
        feather.replace();
    }
}

/**
 * Ouvre le modal d'ajout de statut
 */
export function openAddStatusModal() {
    elements.statusModalTitle.textContent = 'Ajouter un statut';
    elements.statusForm.reset();
    document.getElementById('statusId').value = '';
    document.getElementById('statusColor').value = '#9b59b6';
    document.getElementById('statusOrdre').value = 0;
    updateStatusIconPreview('mdi:tag-outline', '#9b59b6');
    elements.statusModal.classList.add('active');
}

/**
 * Ouvre le modal d'édition de statut
 * @param {number} id - ID du statut
 */
export async function openEditStatusModal(id) {
    elements.statusModalTitle.textContent = 'Modifier le statut';
    showLoading(true);

    try {
        const response = await fetch(`${STATUSES_API}?id=${id}`, {
            credentials: 'same-origin'
        });
        const result = await response.json();

        if (result.success) {
            const status = result.data;
            document.getElementById('statusId').value = status.id;
            document.getElementById('statusName').value = status.name || '';
            document.getElementById('statusDescription').value = status.description || '';
            document.getElementById('statusIcon').value = status.icon || '';
            document.getElementById('statusColor').value = status.color || '#9b59b6';
            document.getElementById('statusOrdre').value = status.ordre || 0;
            
            updateStatusIconPreview(status.icon || 'mdi:tag-outline', status.color || '#9b59b6');
            
            elements.statusModal.classList.add('active');
        } else {
            showToast(result.message || 'Erreur lors du chargement', 'error');
        }
    } catch (error) {
        console.error('Load status error:', error);
        showToast('Erreur de connexion', 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Ferme le modal statut
 */
export function closeStatusModal() {
    elements.statusModal.classList.remove('active');
}

/**
 * Met à jour la prévisualisation de l'icône du statut
 * @param {string} icon - Nom de l'icône
 * @param {string} color - Couleur
 */
export function updateStatusIconPreview(icon, color) {
    const previewContainer = document.getElementById('statusIconPreview');
    if (!previewContainer) return;
    
    previewContainer.innerHTML = renderIcon(icon || 'mdi:tag-outline', 32, color || '#9b59b6');
}

/**
 * Gère la soumission du formulaire statut
 * @param {Event} e - Événement de soumission
 */
export async function handleStatusSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('statusId').value;
    const isNew = !id;
    
    const data = {
        name: document.getElementById('statusName').value,
        description: document.getElementById('statusDescription')?.value || '',
        icon: document.getElementById('statusIcon')?.value || '',
        color: document.getElementById('statusColor')?.value || '#9b59b6',
        ordre: parseInt(document.getElementById('statusOrdre')?.value) || 0
    };
    
    if (!isNew) {
        data.id = id;
    }

    const method = isNew ? 'POST' : 'PUT';

    try {
        const response = await fetch(STATUSES_API, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            credentials: 'same-origin'
        });

        const result = await response.json();

        if (result.success) {
            showToast(isNew ? 'Statut créé' : 'Statut mis à jour', 'success');
            closeStatusModal();
            loadStatuses();
        } else {
            showToast(result.message || 'Erreur lors de la sauvegarde', 'error');
        }
    } catch (error) {
        console.error('Save status error:', error);
        showToast('Erreur de connexion', 'error');
    }
}

/**
 * Prépare la suppression d'un statut
 * @param {number} id - ID du statut
 * @param {string} name - Nom pour confirmation
 * @param {number} usageCount - Nombre d'utilisations
 */
export function prepareDeleteStatus(id, name, usageCount = 0) {
    setDeleteTarget({
        type: 'status',
        api: STATUSES_API,
        id: id,
        name: name,
        usageCount: usageCount
    });
    if (onDeleteCallback) {
        onDeleteCallback(id, name, 'Statut', usageCount);
    }
}

/**
 * Initialise le module Statuses
 * @param {Object} domElements - Références aux éléments DOM
 * @param {Function} deleteCallback - Callback pour la confirmation de suppression
 */
export function initStatuses(domElements, deleteCallback) {
    elements = domElements;
    onDeleteCallback = deleteCallback;
    
    if (elements.addStatusBtn) {
        elements.addStatusBtn.addEventListener('click', openAddStatusModal);
    }
    if (elements.statusModalClose) {
        elements.statusModalClose.addEventListener('click', closeStatusModal);
    }
    if (elements.statusModalCancel) {
        elements.statusModalCancel.addEventListener('click', closeStatusModal);
    }
    if (elements.statusModal) {
        elements.statusModal.querySelector('.modal-backdrop')?.addEventListener('click', closeStatusModal);
    }
    if (elements.statusForm) {
        elements.statusForm.addEventListener('submit', handleStatusSubmit);
    }
    
    // Événements pour la prévisualisation de l'icône
    const iconInput = document.getElementById('statusIcon');
    const colorInput = document.getElementById('statusColor');
    
    if (iconInput) {
        iconInput.addEventListener('input', () => {
            updateStatusIconPreview(iconInput.value, colorInput?.value || '#9b59b6');
        });
    }
    if (colorInput) {
        colorInput.addEventListener('input', () => {
            updateStatusIconPreview(iconInput?.value || '', colorInput.value);
        });
    }
}
