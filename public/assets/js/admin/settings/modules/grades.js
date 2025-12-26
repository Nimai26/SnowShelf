/**
 * SnowShelf - Admin Grades Module
 * Gestion des grades utilisateurs (Premium, Free, etc.)
 */

import { API_ENDPOINTS } from '/assets/js/admin/core/config.js';
import { showToast, showLoading, escapeHtml } from '/assets/js/admin/core/utils.js';
import { setDeleteTarget } from '/assets/js/admin/core/state.js';

const GRADES_API = API_ENDPOINTS.GRADES;

// Éléments DOM
let elements = {};
let onDeleteCallback = null;

/**
 * Charge les grades utilisateurs
 */
export async function loadGrades() {
    if (!elements.gradesTableBody) return;

    try {
        const response = await fetch(`${GRADES_API}?admin=1`, {
            credentials: 'same-origin'
        });
        const result = await response.json();

        if (result.success) {
            // Filtrer les grades par défaut (admin)
            renderGrades(result.data.grades?.filter(g => g.defaut) || []);
        }
    } catch (error) {
        console.error('Load grades error:', error);
    }
}

/**
 * Rend les grades dans le tableau
 * @param {Array} grades - Liste des grades
 */
function renderGrades(grades) {
    if (grades.length === 0) {
        elements.gradesTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="table-empty">Aucun grade par défaut configuré.</td>
            </tr>
        `;
        return;
    }

    elements.gradesTableBody.innerHTML = grades.map(grade => `
        <tr data-id="${grade.id}">
            <td class="text-center">${grade.id}</td>
            <td><strong>${escapeHtml(grade.name)}</strong></td>
            <td class="text-muted">${escapeHtml(grade.description || '-')}</td>
            <td class="text-center">
                <span class="badge badge-info">${grade.usage_count || 0}</span>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon btn-edit" onclick="SettingsPanel.editGrade(${grade.id})" title="Modifier">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                        </svg>
                    </button>
                    <button class="btn-icon btn-delete" onclick="SettingsPanel.deleteGrade(${grade.id}, '${escapeHtml(grade.name).replace(/'/g, "\\'")}', ${grade.usage_count || 0})" title="Supprimer">
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
 * Ouvre le modal d'ajout de grade
 */
export function openAddGradeModal() {
    elements.gradeModalTitle.textContent = 'Ajouter un grade';
    elements.gradeForm.reset();
    document.getElementById('gradeId').value = '';
    elements.gradeModal.classList.add('active');
}

/**
 * Ouvre le modal d'édition de grade
 * @param {number} id - ID du grade
 */
export async function openEditGradeModal(id) {
    elements.gradeModalTitle.textContent = 'Modifier le grade';
    showLoading(true);

    try {
        const response = await fetch(`${GRADES_API}?id=${id}`, {
            credentials: 'same-origin'
        });
        const result = await response.json();

        if (result.success) {
            const grade = result.data;
            document.getElementById('gradeId').value = grade.id;
            document.getElementById('gradeName').value = grade.name || '';
            document.getElementById('gradeDescription').value = grade.description || '';
            
            elements.gradeModal.classList.add('active');
        } else {
            showToast(result.message || 'Erreur lors du chargement', 'error');
        }
    } catch (error) {
        console.error('Load grade error:', error);
        showToast('Erreur de connexion', 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Ferme le modal grade
 */
export function closeGradeModal() {
    elements.gradeModal.classList.remove('active');
}

/**
 * Gère la soumission du formulaire grade
 * @param {Event} e - Événement de soumission
 */
export async function handleGradeSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('gradeId').value;
    const isNew = !id;
    
    // Note: L'API grades.php ne supporte que name et description
    const data = {
        name: document.getElementById('gradeName').value,
        description: document.getElementById('gradeDescription')?.value || ''
    };
    
    if (!isNew) {
        data.id = id;
    }

    const method = isNew ? 'POST' : 'PUT';

    try {
        const response = await fetch(GRADES_API, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            credentials: 'same-origin'
        });

        const result = await response.json();

        if (result.success) {
            showToast(isNew ? 'Grade créé' : 'Grade mis à jour', 'success');
            closeGradeModal();
            loadGrades();
        } else {
            showToast(result.message || 'Erreur lors de la sauvegarde', 'error');
        }
    } catch (error) {
        console.error('Save grade error:', error);
        showToast('Erreur de connexion', 'error');
    }
}

/**
 * Prépare la suppression d'un grade
 * @param {number} id - ID du grade
 * @param {string} name - Nom pour confirmation
 * @param {number} usageCount - Nombre d'utilisations
 */
export function prepareDeleteGrade(id, name, usageCount = 0) {
    setDeleteTarget({
        type: 'grade',
        api: GRADES_API,
        id: id,
        name: name,
        usageCount: usageCount
    });
    if (onDeleteCallback) {
        onDeleteCallback(id, name, 'Grade', usageCount);
    }
}

/**
 * Initialise le module Grades
 * @param {Object} domElements - Références aux éléments DOM
 * @param {Function} deleteCallback - Callback pour la confirmation de suppression
 */
export function initGrades(domElements, deleteCallback) {
    elements = domElements;
    onDeleteCallback = deleteCallback;
    
    if (elements.addGradeBtn) {
        elements.addGradeBtn.addEventListener('click', openAddGradeModal);
    }
    if (elements.gradeModalClose) {
        elements.gradeModalClose.addEventListener('click', closeGradeModal);
    }
    if (elements.gradeModalCancel) {
        elements.gradeModalCancel.addEventListener('click', closeGradeModal);
    }
    if (elements.gradeModal) {
        elements.gradeModal.querySelector('.modal-backdrop')?.addEventListener('click', closeGradeModal);
    }
    if (elements.gradeForm) {
        elements.gradeForm.addEventListener('submit', handleGradeSubmit);
    }
}
