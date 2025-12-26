/**
 * SnowShelf - Admin Users Module
 * Gestion des utilisateurs
 */

import { showToast, escapeHtml, formatDate, markActiveNavItem } from '/assets/js/admin/core/utils.js';
import { initFilterDropdown } from '/assets/js/admin/ui/dropdown.js';

// API relative au document courant (admin/index.php -> ../api/users.php)
const API_BASE = '../api/users.php';

/**
 * Affiche ou masque l'indicateur de chargement
 * @param {boolean} show - true pour afficher, false pour masquer
 */
function showLoading(show) {
    const loadingEl = document.getElementById('loadingOverlay');
    if (loadingEl) {
        loadingEl.classList.toggle('active', show);
    }
}

// État local du module
let currentPage = 1;
let currentSearch = '';
let currentSort = 'id';
let currentFilter = '';
let totalPages = 1;
let editingUserId = null;
let deleteUserId = null;

// Références aux éléments DOM
let elements = {};

/**
 * Initialise les références aux éléments DOM
 */
function initElements() {
    elements = {
        usersTableBody: document.getElementById('usersTableBody'),
        searchInput: document.getElementById('searchUsers'),
        filterRole: document.getElementById('filterRole'),
        sortBy: document.getElementById('sortBy'),
        pagination: document.getElementById('usersPagination'),
        loadingOverlay: document.getElementById('loadingOverlay'),
        addUserBtn: document.getElementById('addUserBtn'),
        // Modal
        userModal: document.getElementById('userModal'),
        modalTitle: document.getElementById('modalTitle'),
        userForm: document.getElementById('userForm'),
        modalClose: document.getElementById('modalClose'),
        modalCancel: document.getElementById('modalCancel'),
        userId: document.getElementById('userId'),
        userName: document.getElementById('userName'),
        userEmail: document.getElementById('userEmail'),
        userIsAdmin: document.getElementById('userIsAdmin'),
        userIsPremium: document.getElementById('userIsPremium'),
        userEmailVerified: document.getElementById('userEmailVerified'),
        userPassword: document.getElementById('userPassword'),
        passwordGroup: document.getElementById('passwordGroup'),
        // Delete Modal
        deleteModal: document.getElementById('deleteModal'),
        deleteMessage: document.getElementById('deleteMessage'),
        deleteModalClose: document.getElementById('deleteModalClose'),
        deleteCancel: document.getElementById('deleteCancel'),
        deleteConfirm: document.getElementById('deleteConfirm'),
        // Toast
        toastContainer: document.getElementById('toastContainer')
    };
}

/**
 * Charge la liste des utilisateurs
 */
export async function loadUsers() {
    console.log('[Users] loadUsers called');
    showLoading(true);

    try {
        const params = new URLSearchParams({
            page: currentPage,
            limit: 15,
            order_by: currentSort,
            order_dir: 'ASC'
        });

        if (currentSearch) {
            params.append('search', currentSearch);
        }

        const response = await fetch(`${API_BASE}?${params}`, {
            credentials: 'same-origin'
        });

        const result = await response.json();

        if (result.success) {
            let users = result.data.users;
            
            // Client-side filter by role
            if (currentFilter) {
                users = users.filter(user => {
                    if (currentFilter === 'admin') return user.is_admin == 1;
                    if (currentFilter === 'premium') return user.is_premium == 1 && user.is_admin == 0;
                    if (currentFilter === 'member') return user.is_premium == 0 && user.is_admin == 0;
                    return true;
                });
            }

            renderUsers(users);
            renderPagination(result.data.pagination);
        } else {
            showToast(result.message || 'Erreur lors du chargement', 'error');
        }
    } catch (error) {
        console.error('[Users] Load error:', error);
        showToast('Erreur de connexion au serveur', 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Sauvegarde un utilisateur (création ou mise à jour)
 * @param {Object} data - Données de l'utilisateur
 */
async function saveUser(data) {
    const isNew = !data.id;
    const url = isNew ? API_BASE : `${API_BASE}?id=${data.id}`;
    const method = isNew ? 'POST' : 'PUT';

    const payload = {
        name: data.name,
        email: data.email,
        is_admin: data.is_admin ? 1 : 0,
        is_premium: data.is_premium ? 1 : 0,
        email_verified: data.email_verified ? 1 : 0
    };

    if (isNew && data.password) {
        payload.password = data.password;
    }

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            credentials: 'same-origin'
        });

        const result = await response.json();

        if (result.success) {
            showToast(isNew ? 'Utilisateur créé' : 'Utilisateur mis à jour', 'success');
            closeModal();
            loadUsers();
        } else {
            showToast(result.message || 'Erreur lors de la sauvegarde', 'error');
        }
    } catch (error) {
        console.error('[Users] Save error:', error);
        showToast('Erreur de connexion au serveur', 'error');
    }
}

/**
 * Supprime un utilisateur
 * @param {number} userId - ID de l'utilisateur
 */
async function deleteUser(userId) {
    try {
        const response = await fetch(`${API_BASE}?id=${userId}`, {
            method: 'DELETE',
            credentials: 'same-origin'
        });

        const result = await response.json();

        if (result.success) {
            showToast('Utilisateur supprimé', 'success');
            closeDeleteModal();
            loadUsers();
        } else {
            showToast(result.message || 'Erreur lors de la suppression', 'error');
        }
    } catch (error) {
        console.error('[Users] Delete error:', error);
        showToast('Erreur de connexion au serveur', 'error');
    }
}

/**
 * Rend la liste des utilisateurs dans le tableau
 * @param {Array} users - Liste des utilisateurs
 */
function renderUsers(users) {
    if (!elements.usersTableBody) return;

    if (users.length === 0) {
        elements.usersTableBody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                        </svg>
                        <h3>Aucun utilisateur trouvé</h3>
                        <p>Essayez de modifier vos critères de recherche</p>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    const cacheBuster = Date.now();
    elements.usersTableBody.innerHTML = users.map(user => `
        <tr data-id="${user.id}">
            <td class="col-id">${user.id}</td>
            <td class="col-user">
                <div class="user-cell">
                    <div class="user-avatar">
                        ${user.avatar_url 
                            ? `<img src="../${escapeHtml(user.avatar_url)}?v=${cacheBuster}" alt="${escapeHtml(user.name)}" onerror="this.parentElement.innerHTML='${user.name.charAt(0).toUpperCase()}'">`
                            : user.name.charAt(0).toUpperCase()
                        }
                    </div>
                    <div class="user-cell-info">
                        <span class="user-cell-name">${escapeHtml(user.name)}</span>
                    </div>
                </div>
            </td>
            <td class="col-email">
                <span class="email-cell">${escapeHtml(user.email)}</span>
            </td>
            <td class="col-role">
                <div class="role-badges">
                    ${user.is_admin == 1 ? '<span class="badge badge-admin">Admin</span>' : ''}
                    ${user.is_premium == 1 && user.is_admin != 1 ? '<span class="badge badge-premium">Premium</span>' : ''}
                    ${user.is_admin != 1 && user.is_premium != 1 ? '<span class="badge badge-member">Membre</span>' : ''}
                </div>
            </td>
            <td class="col-status">
                ${user.email_verified == 1 
                    ? '<span class="status-badge status-verified"><span class="status-dot"></span>Vérifié</span>'
                    : '<span class="status-badge status-pending"><span class="status-dot"></span>En attente</span>'
                }
            </td>
            <td class="col-date">
                <span class="date-cell">${formatDate(user.created_at)}</span>
            </td>
            <td class="col-actions">
                <div class="actions-cell">
                    <button class="btn-icon" onclick="AdminPanel.editUser(${user.id})" title="Modifier">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button class="btn-icon danger" onclick="AdminPanel.confirmDeleteUser(${user.id}, '${escapeHtml(user.name)}')" title="Supprimer">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * Rend la pagination
 * @param {Object} pagination - Données de pagination
 */
function renderPagination(pagination) {
    if (!elements.pagination) return;

    totalPages = pagination.pages;
    const { page, total, limit } = pagination;

    if (totalPages <= 1) {
        elements.pagination.innerHTML = '';
        return;
    }

    let html = '';

    // Previous button
    html += `
        <button class="pagination-btn" onclick="AdminPanel.goToPage(${page - 1})" ${page <= 1 ? 'disabled' : ''}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
        </button>
    `;

    // Page buttons
    const maxButtons = 5;
    let startPage = Math.max(1, page - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    if (endPage - startPage < maxButtons - 1) {
        startPage = Math.max(1, endPage - maxButtons + 1);
    }

    if (startPage > 1) {
        html += `<button class="pagination-btn" onclick="AdminPanel.goToPage(1)">1</button>`;
        if (startPage > 2) {
            html += `<span class="pagination-info">...</span>`;
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        html += `
            <button class="pagination-btn ${i === page ? 'active' : ''}" onclick="AdminPanel.goToPage(${i})">${i}</button>
        `;
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            html += `<span class="pagination-info">...</span>`;
        }
        html += `<button class="pagination-btn" onclick="AdminPanel.goToPage(${totalPages})">${totalPages}</button>`;
    }

    // Next button
    html += `
        <button class="pagination-btn" onclick="AdminPanel.goToPage(${page + 1})" ${page >= totalPages ? 'disabled' : ''}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
        </button>
    `;

    // Info
    const from = (page - 1) * limit + 1;
    const to = Math.min(page * limit, total);
    html += `<span class="pagination-info">${from}-${to} sur ${total}</span>`;

    elements.pagination.innerHTML = html;
}

/**
 * Ouvre le modal d'ajout d'utilisateur
 */
function openAddModal() {
    editingUserId = null;
    elements.modalTitle.textContent = 'Ajouter un utilisateur';
    elements.userForm.reset();
    elements.userId.value = '';
    elements.passwordGroup.style.display = 'block';
    elements.userPassword.required = true;
    elements.userIsPremium.disabled = false;
    elements.userModal.classList.add('active');
}

/**
 * Ouvre le modal d'édition d'utilisateur
 * @param {number} userId - ID de l'utilisateur
 */
export async function openEditModal(userId) {
    editingUserId = userId;
    elements.modalTitle.textContent = 'Modifier l\'utilisateur';
    elements.passwordGroup.style.display = 'none';
    elements.userPassword.required = false;
    
    showLoading(true);

    try {
        const response = await fetch(`${API_BASE}?id=${userId}&fields=id,name,email,is_admin,is_premium,email_verified`, {
            credentials: 'same-origin'
        });

        const result = await response.json();

        if (result.success) {
            const user = result.data;
            elements.userId.value = user.id;
            elements.userName.value = user.name;
            elements.userEmail.value = user.email;
            elements.userIsAdmin.checked = user.is_admin == 1;
            elements.userIsPremium.checked = user.is_premium == 1;
            elements.userEmailVerified.checked = user.email_verified == 1;
            
            // Disable premium if admin
            elements.userIsPremium.disabled = user.is_admin == 1;
            
            elements.userModal.classList.add('active');
        } else {
            showToast(result.message || 'Erreur lors du chargement', 'error');
        }
    } catch (error) {
        console.error('[Users] Load user error:', error);
        showToast('Erreur de connexion au serveur', 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Ferme le modal utilisateur
 */
function closeModal() {
    elements.userModal.classList.remove('active');
    elements.userForm.reset();
    editingUserId = null;
}

/**
 * Gère la soumission du formulaire utilisateur
 * @param {Event} e - Événement de soumission
 */
function handleFormSubmit(e) {
    e.preventDefault();

    const data = {
        id: elements.userId.value || null,
        name: elements.userName.value,
        email: elements.userEmail.value,
        is_admin: elements.userIsAdmin.checked,
        is_premium: elements.userIsPremium.checked,
        email_verified: elements.userEmailVerified.checked
    };

    if (!data.id && elements.userPassword.value) {
        data.password = elements.userPassword.value;
    }

    saveUser(data);
}

/**
 * Ouvre le modal de confirmation de suppression
 * @param {number} userId - ID de l'utilisateur
 * @param {string} userName - Nom de l'utilisateur
 */
export function openDeleteModal(userId, userName) {
    deleteUserId = userId;
    elements.deleteMessage.textContent = `Êtes-vous sûr de vouloir supprimer l'utilisateur "${userName}" ? Cette action est irréversible.`;
    elements.deleteModal.classList.add('active');
}

/**
 * Ferme le modal de suppression
 */
function closeDeleteModal() {
    elements.deleteModal.classList.remove('active');
    deleteUserId = null;
}

/**
 * Confirme la suppression
 */
function confirmDelete() {
    if (deleteUserId) {
        deleteUser(deleteUserId);
    }
}

/**
 * Change de page
 * @param {number} page - Numéro de page
 */
export function goToPage(page) {
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    loadUsers();
}

/**
 * Attache les événements
 */
function bindEvents() {
    // Search
    if (elements.searchInput) {
        let searchTimeout;
        elements.searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                currentSearch = e.target.value;
                currentPage = 1;
                loadUsers();
            }, 300);
        });
    }

    // Note: Les événements filter et sort sont gérés par initDropdowns()

    // Add User
    if (elements.addUserBtn) {
        elements.addUserBtn.addEventListener('click', openAddModal);
    }

    // Modal Close
    if (elements.modalClose) {
        elements.modalClose.addEventListener('click', closeModal);
    }
    if (elements.modalCancel) {
        elements.modalCancel.addEventListener('click', closeModal);
    }
    if (elements.userModal) {
        elements.userModal.querySelector('.modal-backdrop')?.addEventListener('click', closeModal);
    }

    // Form Submit
    if (elements.userForm) {
        elements.userForm.addEventListener('submit', handleFormSubmit);
    }

    // Admin toggle affects premium
    if (elements.userIsAdmin) {
        elements.userIsAdmin.addEventListener('change', (e) => {
            if (e.target.checked) {
                elements.userIsPremium.checked = true;
                elements.userIsPremium.disabled = true;
            } else {
                elements.userIsPremium.disabled = false;
            }
        });
    }

    // Delete Modal
    if (elements.deleteModalClose) {
        elements.deleteModalClose.addEventListener('click', closeDeleteModal);
    }
    if (elements.deleteCancel) {
        elements.deleteCancel.addEventListener('click', closeDeleteModal);
    }
    if (elements.deleteModal) {
        elements.deleteModal.querySelector('.modal-backdrop')?.addEventListener('click', closeDeleteModal);
    }
    if (elements.deleteConfirm) {
        elements.deleteConfirm.addEventListener('click', confirmDelete);
    }
}

/**
 * Initialise les custom dropdowns de la toolbar
 */
function initDropdowns() {
    // Dropdown filtre par rôle
    initFilterDropdown('filterRoleDropdown', 'filterRole', () => {
        currentFilter = elements.filterRole.value;
        currentPage = 1;
        loadUsers();
    });
    
    // Dropdown tri
    initFilterDropdown('sortByDropdown', 'sortBy', () => {
        currentSort = elements.sortBy.value;
        currentPage = 1;
        loadUsers();
    });
}

/**
 * Initialise le module Users
 * @param {Object} modalManager - Instance du ModalManager (non utilisé, pour compatibilité)
 */
export function init(modalManager) {
    initElements();
    
    if (!elements.usersTableBody) {
        console.log('[Users] Not on users section');
        return;
    }
    
    markActiveNavItem();
    initDropdowns();
    loadUsers();
    bindEvents();
    
    console.log('[Users] Initialized');
}

/**
 * API publique exposée globalement
 */
window.AdminPanel = {
    editUser: openEditModal,
    confirmDeleteUser: openDeleteModal,
    goToPage: goToPage
};

// Export par défaut
export default {
    init,
    loadUsers,
    openEditModal,
    openDeleteModal,
    goToPage
};
