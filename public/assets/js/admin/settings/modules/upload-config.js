/**
 * SnowShelf - Admin Upload Config Module
 * Gestion des configurations d'upload par catégorie
 */

import { API_ENDPOINTS } from '/assets/js/admin/core/config.js';
import { showToast, showLoading, escapeHtml } from '/assets/js/admin/core/utils.js';
import { setDeleteTarget } from '/assets/js/admin/core/state.js';

const CONFIG_API = API_ENDPOINTS.CONFIG;

// Éléments DOM
let elements = {};
let onDeleteCallback = null;

/**
 * Charge les configurations d'upload
 */
export async function loadUploadConfigs() {
    if (!elements.uploadConfigTableBody) return;

    try {
        const response = await fetch(`${CONFIG_API}?table=upload_config`, {
            credentials: 'same-origin'
        });
        const result = await response.json();

        if (result.success) {
            renderUploadConfigTable(result.data.items || []);
        }
    } catch (error) {
        console.error('Load upload configs error:', error);
    }
}

/**
 * Rend le tableau des configurations d'upload
 * @param {Array} configs - Liste des configurations
 */
function renderUploadConfigTable(configs) {
    if (!elements.uploadConfigTableBody) return;

    if (!configs || configs.length === 0) {
        elements.uploadConfigTableBody.innerHTML = `
            <tr>
                <td colspan="6" class="table-empty">Aucune configuration d'upload définie.</td>
            </tr>
        `;
        return;
    }

    elements.uploadConfigTableBody.innerHTML = configs.map(config => {
        // Parser les extensions si c'est une chaîne JSON
        let extensions = config.extensions;
        if (typeof extensions === 'string') {
            try {
                extensions = JSON.parse(extensions);
            } catch (e) {
                extensions = [];
            }
        }
        const extensionsStr = Array.isArray(extensions) ? extensions.join(', ') : '';
        
        return `
            <tr data-id="${config.id}">
                <td class="text-center">
                    <span class="badge ${config.is_active ? 'badge-success' : 'badge-secondary'}">${config.is_active ? 'Actif' : 'Inactif'}</span>
                </td>
                <td><strong>${escapeHtml(config.category)}</strong></td>
                <td class="text-muted extensions-cell" title="${escapeHtml(extensionsStr)}">${escapeHtml(extensionsStr)}</td>
                <td class="text-center"><span class="badge badge-info">${config.max_size_mb} MB</span></td>
                <td class="text-muted">${escapeHtml(config.description || '-')}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon btn-edit" onclick="SettingsPanel.editUploadConfig(${config.id})" title="Modifier">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                            </svg>
                        </button>
                        <button class="btn-icon btn-delete" onclick="SettingsPanel.deleteUploadConfig(${config.id}, '${escapeHtml(config.category).replace(/'/g, "\\'")}')" title="Supprimer">
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
 * Ouvre le modal d'ajout de configuration upload
 */
export function openAddUploadConfigModal() {
    elements.uploadConfigModalTitle.textContent = "Ajouter une catégorie d'upload";
    elements.uploadConfigForm.reset();
    document.getElementById('uploadConfigId').value = '';
    document.getElementById('uploadCategory').readOnly = false;
    document.getElementById('uploadIsActive').checked = true;
    elements.uploadConfigModal.classList.add('active');
}

/**
 * Ouvre le modal d'édition de configuration upload
 * @param {number} id - ID de la configuration
 */
export async function openEditUploadConfigModal(id) {
    elements.uploadConfigModalTitle.textContent = "Modifier la configuration d'upload";
    showLoading(true);

    try {
        const response = await fetch(`${CONFIG_API}?table=upload_config&id=${id}`, {
            credentials: 'same-origin'
        });
        const result = await response.json();

        if (result.success) {
            const config = result.data;
            
            // Parser les extensions si nécessaire
            let extensions = config.extensions;
            if (typeof extensions === 'string') {
                try {
                    extensions = JSON.parse(extensions);
                } catch (e) {
                    extensions = [];
                }
            }
            
            document.getElementById('uploadConfigId').value = config.id;
            document.getElementById('uploadCategory').value = config.category || '';
            document.getElementById('uploadCategory').readOnly = true; // La catégorie ne peut pas être modifiée
            document.getElementById('uploadExtensions').value = Array.isArray(extensions) ? extensions.join(', ') : '';
            document.getElementById('uploadMaxSize').value = config.max_size_mb || 5;
            document.getElementById('uploadDescription').value = config.description || '';
            document.getElementById('uploadIsActive').checked = config.is_active == 1;
            
            elements.uploadConfigModal.classList.add('active');
        } else {
            showToast(result.message || 'Erreur lors du chargement', 'error');
        }
    } catch (error) {
        console.error('Load upload config error:', error);
        showToast('Erreur de connexion', 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Ferme le modal upload config
 */
export function closeUploadConfigModal() {
    elements.uploadConfigModal.classList.remove('active');
}

/**
 * Gère la soumission du formulaire upload config
 * @param {Event} e - Événement de soumission
 */
export async function handleUploadConfigSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('uploadConfigId').value;
    const isNew = !id;
    
    // Parser les extensions en tableau
    const extensionsRaw = document.getElementById('uploadExtensions').value;
    const extensions = extensionsRaw.split(',').map(ext => ext.trim().toLowerCase()).filter(ext => ext);
    
    const data = {
        category: document.getElementById('uploadCategory').value,
        extensions: extensions,
        max_size_mb: parseInt(document.getElementById('uploadMaxSize').value) || 5,
        description: document.getElementById('uploadDescription').value,
        is_active: document.getElementById('uploadIsActive').checked
    };

    const url = isNew ? `${CONFIG_API}?table=upload_config` : `${CONFIG_API}?table=upload_config&id=${id}`;
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
            showToast(isNew ? 'Configuration créée' : 'Configuration mise à jour', 'success');
            closeUploadConfigModal();
            loadUploadConfigs();
        } else {
            showToast(result.message || 'Erreur lors de la sauvegarde', 'error');
        }
    } catch (error) {
        console.error('Save upload config error:', error);
        showToast('Erreur de connexion', 'error');
    }
}

/**
 * Prépare la suppression d'une configuration upload
 * @param {number} id - ID de la configuration
 * @param {string} category - Nom de la catégorie pour confirmation
 */
export function prepareDeleteUploadConfig(id, category) {
    setDeleteTarget({
        type: 'config',
        table: 'upload_config',
        id: id,
        name: category
    });
    if (onDeleteCallback) {
        onDeleteCallback(id, category, 'Configuration upload');
    }
}

/**
 * Initialise le module Upload Config
 * @param {Object} domElements - Références aux éléments DOM
 * @param {Function} deleteCallback - Callback pour la confirmation de suppression
 */
export function initUploadConfig(domElements, deleteCallback) {
    elements = domElements;
    onDeleteCallback = deleteCallback;
    
    if (elements.addUploadConfigBtn) {
        elements.addUploadConfigBtn.addEventListener('click', openAddUploadConfigModal);
    }
    if (elements.uploadConfigModalClose) {
        elements.uploadConfigModalClose.addEventListener('click', closeUploadConfigModal);
    }
    if (elements.uploadConfigModalCancel) {
        elements.uploadConfigModalCancel.addEventListener('click', closeUploadConfigModal);
    }
    if (elements.uploadConfigModal) {
        elements.uploadConfigModal.querySelector('.modal-backdrop')?.addEventListener('click', closeUploadConfigModal);
    }
    if (elements.uploadConfigForm) {
        elements.uploadConfigForm.addEventListener('submit', handleUploadConfigSubmit);
    }
}
