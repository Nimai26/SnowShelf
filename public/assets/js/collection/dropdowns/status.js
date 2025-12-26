/**
 * SnowShelf - Collection Module
 * dropdowns/status.js - Sélecteur de statut avec gestion
 */

import { state, getTranslations } from '../state.js';
import { escapeHtml, renderMdiIcon } from '../utils.js';
import { createStatus, updateStatus, deleteStatusApi } from '../api.js';
import { showToast, showError } from '../ui/feedback.js';
import { createCustomDropdown } from './base.js';

/**
 * Popule le select des statuts
 * @param {HTMLSelectElement} select - Le select à peupler
 * @param {string|number|null} selectedStatusId - ID du statut sélectionné
 * @param {boolean} showDefaults - Afficher les statuts par défaut
 */
export function populateStatusSelect(select, selectedStatusId, showDefaults = true) {
    const t = getTranslations();
    
    // Construire la liste des options pour le dropdown custom
    const options = [];
    
    // Option vide
    options.push({
        value: '',
        text: t.no_status || 'Non défini',
        color: null,
        group: '__default__'
    });
    
    // Séparer les statuts personnels et par défaut
    const personalStatuses = state.statuses.filter(s => !s.defaut);
    const defaultStatuses = state.statuses.filter(s => s.defaut);
    
    // Statuts personnels
    if (personalStatuses.length > 0) {
        personalStatuses.forEach(status => {
            options.push({
                value: status.id,
                text: status.name,
                color: status.color || '#6b7280',
                group: t.status_section_personal || 'Mes statuts'
            });
        });
    }
    
    // Statuts par défaut (si toggle activé)
    if (showDefaults && defaultStatuses.length > 0) {
        defaultStatuses.forEach(status => {
            options.push({
                value: status.id,
                text: status.name,
                color: status.color || '#6b7280',
                group: t.status_section_defaults || 'Statuts par défaut'
            });
        });
    }
    
    // Mettre aussi à jour le select natif pour la compatibilité formulaire
    select.innerHTML = '';
    const emptyOpt = document.createElement('option');
    emptyOpt.value = '';
    emptyOpt.textContent = t.no_status || 'Non défini';
    select.appendChild(emptyOpt);
    
    if (personalStatuses.length > 0) {
        const group = document.createElement('optgroup');
        group.label = t.status_section_personal || 'Mes statuts';
        personalStatuses.forEach(status => {
            const opt = document.createElement('option');
            opt.value = status.id;
            opt.textContent = status.name;
            if (selectedStatusId !== null && status.id == selectedStatusId) opt.selected = true;
            group.appendChild(opt);
        });
        select.appendChild(group);
    }
    
    if (showDefaults && defaultStatuses.length > 0) {
        const group = document.createElement('optgroup');
        group.label = t.status_section_defaults || 'Statuts par défaut';
        defaultStatuses.forEach(status => {
            const opt = document.createElement('option');
            opt.value = status.id;
            opt.textContent = status.name;
            if (selectedStatusId !== null && status.id == selectedStatusId) opt.selected = true;
            group.appendChild(opt);
        });
        select.appendChild(group);
    }
    
    if (selectedStatusId !== null) {
        select.value = selectedStatusId;
    }
    
    // Créer le dropdown personnalisé
    createCustomDropdown(select, options, selectedStatusId);
}

/**
 * Ouvre le modal de gestion des statuts personnels
 * @param {string} parentModalId - ID du modal parent
 * @param {HTMLSelectElement} statusSelect - Select des statuts à rafraîchir
 * @param {HTMLInputElement} toggleCheckbox - Checkbox du toggle des statuts par défaut
 */
export function openManageStatusesModal(parentModalId, statusSelect, toggleCheckbox) {
    const t = getTranslations();
    
    const buildStatusesListHtml = () => {
        const personalStatuses = state.statuses.filter(s => !s.defaut);
        
        if (personalStatuses.length === 0) {
            return `<p class="text-muted text-center">${t.no_personal_statuses || 'Aucun statut personnel'}</p>`;
        }
        
        return `
            <ul class="statuses-manage-list">
                ${personalStatuses.map(status => `
                    <li class="status-manage-item" data-status-id="${status.id}">
                        <span class="status-color-badge" style="background-color: ${status.color || '#6b7280'}"></span>
                        <span class="status-name">${escapeHtml(status.name)}</span>
                        <div class="status-actions-btns">
                            <button type="button" class="btn btn-sm btn-icon btn-edit-status" data-id="${status.id}" title="${t.edit || 'Modifier'}">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                </svg>
                            </button>
                            <button type="button" class="btn btn-sm btn-icon btn-danger btn-delete-status" data-id="${status.id}" title="${t.delete || 'Supprimer'}">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                            </button>
                        </div>
                    </li>
                `).join('')}
            </ul>
        `;
    };
    
    const modalContent = `
        <div class="statuses-manage-container">
            <div class="statuses-manage-header">
                <button type="button" class="btn btn-primary btn-add-status" id="btnAddNewStatus">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    ${t.status_add || 'Ajouter un statut'}
                </button>
            </div>
            <div class="statuses-manage-list-container" id="statusesManageList">
                ${buildStatusesListHtml()}
            </div>
        </div>
    `;
    
    const manageModalId = ModalManager.open({
        template: 'base',
        title: t.status_manage || 'Gérer mes statuts',
        content: modalContent,
        size: 'modal-md',
        customClass: 'modal-manage-statuses',
        buttons: [
            { text: t.close || 'Fermer', action: 'close', class: 'btn-secondary' }
        ],
        onOpen: (id, overlay) => {
            const modal = document.querySelector(`[data-modal-id="${id}"]`);
            
            // Bouton ajouter
            modal.querySelector('#btnAddNewStatus')?.addEventListener('click', () => {
                openStatusEditModal(null, id, statusSelect, toggleCheckbox);
            });
            
            // Délégation d'événements pour éditer/supprimer
            modal.querySelector('#statusesManageList')?.addEventListener('click', async (e) => {
                const editBtn = e.target.closest('.btn-edit-status');
                const deleteBtn = e.target.closest('.btn-delete-status');
                
                if (editBtn) {
                    const statusId = parseInt(editBtn.dataset.id);
                    const status = state.statuses.find(s => s.id === statusId);
                    if (status) {
                        openStatusEditModal(status, id, statusSelect, toggleCheckbox);
                    }
                }
                
                if (deleteBtn) {
                    const statusId = parseInt(deleteBtn.dataset.id);
                    const status = state.statuses.find(s => s.id === statusId);
                    if (status) {
                        const confirmed = await ModalManager.confirm(
                            (t.status_delete_confirm || 'Supprimer le statut "{name}" ?').replace('{name}', status.name),
                            {
                                title: t.confirm_delete || 'Confirmer la suppression',
                                type: 'danger',
                                confirmText: t.delete || 'Supprimer',
                                cancelText: t.cancel || 'Annuler'
                            }
                        );
                        
                        if (confirmed) {
                            await deleteStatus(statusId, id, statusSelect, toggleCheckbox);
                        }
                    }
                }
            });
        }
    });
    
    // Stocker une référence pour rafraîchir la liste
    window._statusesManageModalId = manageModalId;
}

/**
 * Ouvre le modal d'édition/création d'un statut
 * @param {Object|null} status - Statut à modifier (null pour création)
 * @param {string} manageModalId - ID du modal de gestion
 * @param {HTMLSelectElement} statusSelect - Select des statuts
 * @param {HTMLInputElement} toggleCheckbox - Checkbox du toggle
 */
export function openStatusEditModal(status, manageModalId, statusSelect, toggleCheckbox) {
    const t = getTranslations();
    const isEdit = status !== null;
    
    const content = `
        <form id="statusEditForm">
            <div class="form-group">
                <label for="statusName">${t.field_name || 'Nom'} <span class="required">*</span></label>
                <input type="text" id="statusName" class="form-control" required 
                       value="${isEdit ? escapeHtml(status.name) : ''}"
                       placeholder="${t.status_name_placeholder || 'Ex: En cours de lecture'}">
            </div>
            <div class="form-group">
                <label for="statusColor">${t.field_color || 'Couleur'}</label>
                <div class="color-picker-wrapper">
                    <input type="color" id="statusColor" class="form-control color-input" 
                           value="${isEdit && status.color ? status.color : '#6b7280'}">
                    <span class="color-preview" style="background-color: ${isEdit && status.color ? status.color : '#6b7280'}"></span>
                </div>
            </div>
        </form>
    `;
    
    ModalManager.open({
        template: 'base',
        title: isEdit ? (t.status_edit || 'Modifier le statut') : (t.status_add || 'Ajouter un statut'),
        content: content,
        size: 'modal-sm',
        buttons: [
            { text: t.cancel || 'Annuler', action: 'close', class: 'btn-secondary' },
            { text: t.save || 'Enregistrer', action: 'save', class: 'btn-primary' }
        ],
        onOpen: (id, overlay) => {
            const modal = document.querySelector(`[data-modal-id="${id}"]`);
            const colorInput = modal.querySelector('#statusColor');
            const colorPreview = modal.querySelector('.color-preview');
            
            colorInput?.addEventListener('input', () => {
                colorPreview.style.backgroundColor = colorInput.value;
            });
        },
        onAction: async (action, id) => {
            if (action === 'save') {
                const modal = document.querySelector(`[data-modal-id="${id}"]`);
                const name = modal.querySelector('#statusName').value.trim();
                const color = modal.querySelector('#statusColor').value;
                
                if (!name) {
                    showError(t.name_required || 'Le nom est requis');
                    return false;
                }
                
                try {
                    let result;
                    if (isEdit) {
                        result = await updateStatus(status.id, name, color);
                    } else {
                        result = await createStatus(name, color);
                    }
                    
                    if (result.success) {
                        // Mettre à jour le state local
                        if (isEdit) {
                            const idx = state.statuses.findIndex(s => s.id === status.id);
                            if (idx !== -1) {
                                state.statuses[idx] = { ...state.statuses[idx], name, color };
                            }
                        } else {
                            state.statuses.push(result.status);
                        }
                        
                        // Rafraîchir le select
                        const showDefaults = toggleCheckbox?.checked ?? true;
                        populateStatusSelect(statusSelect, statusSelect.value, showDefaults);
                        
                        // Rafraîchir la liste dans le modal de gestion
                        refreshStatusesManageList(manageModalId);
                        
                        showToast(isEdit ? (t.status_updated || 'Statut modifié') : (t.status_created || 'Statut créé'), 'success');
                        ModalManager.close(id);
                    } else {
                        showError(result.error || 'Erreur lors de l\'enregistrement');
                        return false;
                    }
                } catch (error) {
                    console.error('Erreur sauvegarde statut:', error);
                    showError(t.error_generic || 'Une erreur est survenue');
                    return false;
                }
            }
        }
    });
}

/**
 * Supprime un statut
 * @param {number} statusId - ID du statut à supprimer
 * @param {string} manageModalId - ID du modal de gestion
 * @param {HTMLSelectElement} statusSelect - Select des statuts
 * @param {HTMLInputElement} toggleCheckbox - Checkbox du toggle
 */
export async function deleteStatus(statusId, manageModalId, statusSelect, toggleCheckbox) {
    const t = getTranslations();
    
    try {
        const result = await deleteStatusApi(statusId);
        
        if (result.success) {
            // Supprimer du state local
            state.statuses = state.statuses.filter(s => s.id !== statusId);
            
            // Rafraîchir le select
            const showDefaults = toggleCheckbox?.checked ?? true;
            const currentValue = statusSelect.value == statusId ? '' : statusSelect.value;
            populateStatusSelect(statusSelect, currentValue, showDefaults);
            
            // Rafraîchir la liste dans le modal de gestion
            refreshStatusesManageList(manageModalId);
            
            showToast(t.status_deleted || 'Statut supprimé', 'success');
        } else {
            showError(result.error || 'Erreur lors de la suppression');
        }
    } catch (error) {
        console.error('Erreur suppression statut:', error);
        showError(t.error_generic || 'Une erreur est survenue');
    }
}

/**
 * Rafraîchit la liste des statuts dans le modal de gestion
 * @param {string} manageModalId - ID du modal de gestion
 */
function refreshStatusesManageList(manageModalId) {
    const t = getTranslations();
    const modal = document.querySelector(`[data-modal-id="${manageModalId}"]`);
    const listContainer = modal?.querySelector('#statusesManageList');
    
    if (!listContainer) return;
    
    const personalStatuses = state.statuses.filter(s => !s.defaut);
    
    if (personalStatuses.length === 0) {
        listContainer.innerHTML = `<p class="text-muted text-center">${t.no_personal_statuses || 'Aucun statut personnel'}</p>`;
        return;
    }
    
    listContainer.innerHTML = `
        <ul class="statuses-manage-list">
            ${personalStatuses.map(status => `
                <li class="status-manage-item" data-status-id="${status.id}">
                    <span class="status-color-badge" style="background-color: ${status.color || '#6b7280'}"></span>
                    <span class="status-name">${escapeHtml(status.name)}</span>
                    <div class="status-actions-btns">
                        <button type="button" class="btn btn-sm btn-icon btn-edit-status" data-id="${status.id}" title="${t.edit || 'Modifier'}">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button type="button" class="btn btn-sm btn-icon btn-danger btn-delete-status" data-id="${status.id}" title="${t.delete || 'Supprimer'}">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    </div>
                </li>
            `).join('')}
        </ul>
    `;
}
