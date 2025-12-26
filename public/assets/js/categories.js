/**
 * SnowShelf - Gestion des catégories
 * Module JavaScript pour la page des catégories
 */

window.SnowShelfCategories = (function() {
    'use strict';

    // ========================================
    // Configuration
    // ========================================
    const config = {
        apiEndpoint: 'api/categories.php',
        debounceDelay: 300
    };

    // État du module
    let state = {
        categories: [],
        filter: 'all',
        search: '',
        showDefault: true,
        showPublic: true,
        isLoading: false
    };

    // Références DOM
    let elements = {};

    // Timer pour le debounce de recherche
    let searchTimeout = null;

    // ========================================
    // Initialisation
    // ========================================
    function init() {
        // Vérifier que les données de la page sont disponibles
        if (!window.CategoriesPageData) {
            return;
        }

        // Vérifier que les éléments DOM sont présents
        if (!document.getElementById('categoriesGrid')) {
            return;
        }

        // Récupérer les éléments DOM
        elements = {
            grid: document.getElementById('categoriesGrid'),
            emptyState: document.getElementById('emptyState'),
            emptyTitle: document.getElementById('emptyTitle'),
            emptyMessage: document.getElementById('emptyMessage'),
            searchInput: document.getElementById('searchCategories'),
            filterTabs: document.querySelectorAll('.filter-tab'),
            showDefault: document.getElementById('showDefault'),
            showPublic: document.getElementById('showPublic'),
            btnAdd: document.getElementById('btnAddCategory'),
            cardTemplate: document.getElementById('categoryCardTemplate')
        };

        // Attacher les événements
        bindEvents();

        // Charger les catégories
        loadCategories();
        
        // Vérifier si un ajout rapide est en attente (depuis le bouton header)
        if (window.pendingQuickAddCategory) {
            window.pendingQuickAddCategory = false;
            // Ouvrir le modal directement - les données CategoriesPageData sont déjà disponibles
            openCategoryModal();
        }
    }

    // ========================================
    // Événements
    // ========================================
    function bindEvents() {
        // Recherche avec debounce
        if (elements.searchInput) {
            elements.searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    state.search = e.target.value.trim();
                    loadCategories();
                }, config.debounceDelay);
            });
        }

        // Filtres par onglets
        elements.filterTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                elements.filterTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                state.filter = tab.dataset.filter;
                loadCategories();
            });
        });

        // Toggles pour afficher/masquer
        if (elements.showDefault) {
            elements.showDefault.addEventListener('change', (e) => {
                state.showDefault = e.target.checked;
                loadCategories();
            });
        }

        if (elements.showPublic) {
            elements.showPublic.addEventListener('change', (e) => {
                state.showPublic = e.target.checked;
                loadCategories();
            });
        }

        // Bouton ajouter
        if (elements.btnAdd) {
            elements.btnAdd.addEventListener('click', () => openCategoryModal());
        }
    }

    // ========================================
    // Chargement des données
    // ========================================
    async function loadCategories() {
        if (state.isLoading) return;
        state.isLoading = true;

        showLoading();

        try {
            const params = new URLSearchParams({
                filter: state.filter,
                show_default: state.showDefault ? '1' : '0',
                show_public: state.showPublic ? '1' : '0'
            });

            if (state.search) {
                params.append('search', state.search);
            }

            const response = await fetch(`${config.apiEndpoint}?${params}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();

            if (data.success) {
                state.categories = data.data.categories;
                renderCategories();
            } else {
                showError(data.error?.message || 'Erreur de chargement');
            }
        } catch (error) {
            console.error('[Categories] Erreur:', error);
            showError('Erreur de connexion au serveur');
        } finally {
            state.isLoading = false;
        }
    }

    // ========================================
    // Rendu des catégories
    // ========================================
    function renderCategories() {
        if (!elements.grid) return;

        // Vider la grille
        elements.grid.innerHTML = '';

        if (state.categories.length === 0) {
            showEmptyState();
            return;
        }

        // Masquer l'état vide
        if (elements.emptyState) {
            elements.emptyState.style.display = 'none';
        }

        // Créer les cartes
        state.categories.forEach(category => {
            const card = createCategoryCard(category);
            elements.grid.appendChild(card);
        });
    }

    function createCategoryCard(category) {
        const t = window.CategoriesPageData.translations;
        
        const card = document.createElement('div');
        card.className = 'category-card';
        // Classe "readonly" uniquement pour les utilisateurs Free
        // Les Premium/Admin peuvent importer ou modifier
        if (!window.CategoriesPageData.isPremium && !window.CategoriesPageData.isAdmin) {
            card.classList.add('readonly');
        }
        card.dataset.id = category.id;

        // Header avec icône et badges
        const header = document.createElement('div');
        header.className = 'category-header';

        // Icône (emoji ou image)
        const iconContainer = createCategoryIconElement(category.icon, category.name);
        header.appendChild(iconContainer);

        const badges = document.createElement('div');
        badges.className = 'category-badges';

        // Badge de type de catégorie
        if (category.is_default) {
            badges.innerHTML += `<span class="category-badge default">${t.default_badge}</span>`;
        } else if (category.visible) {
            badges.innerHTML += `<span class="category-badge public">${t.public_badge}</span>`;
        } else if (category.is_owner) {
            badges.innerHTML += `<span class="category-badge private">${t.private_badge}</span>`;
        }

        // Badge "Consultation seule" uniquement pour les utilisateurs Free
        // Les Premium peuvent importer, les Admin peuvent tout modifier
        const isFreeUser = !window.CategoriesPageData.isPremium && !window.CategoriesPageData.isAdmin;
        if (isFreeUser) {
            badges.innerHTML += `<span class="category-badge readonly-badge">${t.readonly}</span>`;
        }

        header.appendChild(badges);
        card.appendChild(header);

        // Body avec nom, description et méta
        const body = document.createElement('div');
        body.className = 'category-body';

        const name = document.createElement('h3');
        name.className = 'category-name';
        name.textContent = category.name;
        body.appendChild(name);

        if (category.description) {
            const desc = document.createElement('p');
            desc.className = 'category-description';
            desc.textContent = category.description;
            body.appendChild(desc);
        }

        const meta = document.createElement('div');
        meta.className = 'category-meta';

        // Propriétaire (si pas une catégorie par défaut)
        if (!category.is_default && category.owner_name) {
            meta.innerHTML += `
                <span class="category-owner">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    ${escapeHtml(category.owner_name)}
                </span>
            `;
        }

        // Nombre d'objets
        const itemsText = category.items_count === 0 
            ? t.no_items 
            : `${category.items_count} objet${category.items_count > 1 ? 's' : ''}`;
        meta.innerHTML += `
            <span class="category-items-count">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                </svg>
                ${itemsText}
            </span>
        `;

        body.appendChild(meta);
        card.appendChild(body);

        // Actions
        const actions = document.createElement('div');
        actions.className = 'category-actions';

        // Logique des boutons selon le type d'utilisateur :
        // - Free : "Voir" seulement
        // - Premium non proprio : "Voir / Importer"
        // - Premium proprio : "Voir" + "Éditer" (+ Supprimer)
        // - Admin : Toujours "Voir" + "Éditer" (+ Supprimer) - jamais "Importer"
        const isAdmin = window.CategoriesPageData.isAdmin;
        const isPremiumOnly = window.CategoriesPageData.isPremium && !isAdmin;
        
        // Déterminer le texte du bouton Voir
        // "Voir / Importer" uniquement pour Premium non-admin sur catégorie non possédée
        const showImportText = isPremiumOnly && !category.is_owner;
        const viewButtonText = showImportText ? (t.view_import || 'Voir / Importer') : t.view;
        
        // Toujours afficher le bouton Voir
        actions.innerHTML += `
            <button class="btn btn-ghost btn-view" title="${viewButtonText}">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                </svg>
                ${viewButtonText}
            </button>
        `;

        if (category.can_edit) {
            actions.innerHTML += `
                <button class="btn btn-ghost btn-edit" title="${t.edit}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    ${t.edit}
                </button>
            `;
        }

        if (category.can_delete) {
            actions.innerHTML += `
                <button class="btn btn-ghost btn-danger btn-delete" title="${t.delete}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            `;
        }

        card.appendChild(actions);

        // Événements sur les boutons
        card.querySelector('.btn-view')?.addEventListener('click', () => viewCategory(category));
        card.querySelector('.btn-edit')?.addEventListener('click', () => openCategoryModal(category));
        card.querySelector('.btn-delete')?.addEventListener('click', () => deleteCategory(category));

        return card;
    }

    // ========================================
    // États d'affichage
    // ========================================
    function showLoading() {
        if (elements.grid) {
            elements.grid.innerHTML = `
                <div class="loading-state">
                    <div class="spinner"></div>
                    <p>${window.CategoriesPageData.translations.loading}</p>
                </div>
            `;
        }
        if (elements.emptyState) {
            elements.emptyState.style.display = 'none';
        }
    }

    function showEmptyState() {
        const t = window.CategoriesPageData.translations;
        
        if (elements.grid) {
            elements.grid.innerHTML = '';
        }
        
        if (elements.emptyState) {
            elements.emptyTitle.textContent = state.search 
                ? t.empty_title 
                : t.empty_no_categories;
            elements.emptyMessage.textContent = state.search 
                ? t.empty_message 
                : '';
            elements.emptyState.style.display = 'flex';
        }
    }

    function showError(message) {
        if (elements.grid) {
            elements.grid.innerHTML = `
                <div class="empty-state" style="color: var(--error-color)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                    </svg>
                    <h3>Erreur</h3>
                    <p>${escapeHtml(message)}</p>
                </div>
            `;
        }
    }

    // ========================================
    // Actions sur les catégories
    // ========================================
    function viewCategory(category) {
        openViewModal(category);
    }

    async function deleteCategory(category) {
        const t = window.CategoriesPageData.translations;
        
        const confirmed = await ModalManager.confirm(t.confirm_delete_message, {
            title: t.confirm_delete,
            type: 'danger',
            confirmText: window.CategoriesPageData.translations.delete || 'Supprimer',
            cancelText: window.CategoriesPageData.translations.cancel || 'Annuler'
        });

        if (!confirmed) return;

        try {
            const response = await fetch(`${config.apiEndpoint}?id=${category.id}`, {
                method: 'DELETE'
            });
            
            const data = await response.json();

            if (data.success) {
                showToast(t.deleted_success, 'success');
                loadCategories();
            } else {
                showToast(data.error?.message || 'Erreur lors de la suppression', 'error');
            }
        } catch (error) {
            console.error('[Categories] Erreur suppression:', error);
            showToast('Erreur de connexion', 'error');
        }
    }

    // ========================================
    // Chargement des détails complets d'une catégorie
    // ========================================
    async function loadCategoryDetails(categoryId) {
        try {
            const response = await fetch(`${config.apiEndpoint}?id=${categoryId}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            if (data.success) {
                return data.data;
            }
            throw new Error(data.error?.message || 'Erreur');
        } catch (error) {
            console.error('[Categories] Erreur chargement détails:', error);
            return null;
        }
    }

    // ========================================
    // Recherche de catégories pour l'autocomplétion
    // ========================================
    async function searchCategories(query, excludeIds = []) {
        try {
            const params = new URLSearchParams({
                action: 'search',
                q: query,
                exclude: excludeIds.join(',')
            });
            const response = await fetch(`${config.apiEndpoint}?${params}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            return data.success ? (data.data.categories || []) : [];
        } catch (error) {
            console.error('[Categories] Erreur recherche:', error);
            return [];
        }
    }

    // ========================================
    // Récupération des grades disponibles
    // ========================================
    async function getAvailableGrades() {
        try {
            // Utiliser la nouvelle API dédiée aux grades
            const response = await fetch('/api/grades.php');
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            return data.success ? (data.data.grades || []) : [];
        } catch (error) {
            console.error('[Categories] Erreur grades:', error);
            return [];
        }
    }

    // ========================================
    // Modal de visualisation (lecture seule)
    // ========================================
    async function openViewModal(category) {
        const t = window.CategoriesPageData.translations;
        
        // Charger les détails complets
        const fullCategory = await loadCategoryDetails(category.id);
        if (!fullCategory) {
            showToast('Erreur lors du chargement des détails', 'error');
            return;
        }
        
        // Fusionner avec les données de base
        const cat = { ...category, ...fullCategory };
        
        // Déterminer le type de visibilité
        let visibilityText, visibilityClass;
        if (cat.is_default) {
            visibilityText = t.visibility_default;
            visibilityClass = 'visibility-default';
        } else if (cat.visible) {
            visibilityText = t.visibility_public;
            visibilityClass = 'visibility-public';
        } else {
            visibilityText = t.visibility_private;
            visibilityClass = 'visibility-private';
        }
        
        // Formater la date
        const createdDate = cat.created_at 
            ? new Date(cat.created_at).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            })
            : '-';
        
        // Texte pour le nombre d'objets
        const itemsText = cat.items_count === 0 
            ? t.no_items 
            : `${cat.items_count} objet${cat.items_count > 1 ? 's' : ''}`;

        // Génération des tags enfants (sous-catégories)
        const childrenHtml = (cat.children && cat.children.length > 0)
            ? cat.children.map(child => `
                <span class="category-tag" data-id="${child.id}">
                    <span class="tag-icon">${renderCategoryIcon(child.icon, child.name, 'tag-icon-inner')}</span>
                    <span class="tag-name">${escapeHtml(child.name)}</span>
                </span>
            `).join('')
            : `<span class="text-muted">${t.no_children || 'Aucune sous-catégorie'}</span>`;

        // Génération des tags parents (catégories parentes)
        const parentsHtml = (cat.mothers && cat.mothers.length > 0)
            ? cat.mothers.map(mother => `
                <span class="category-tag parent-tag" data-id="${mother.id}">
                    <span class="tag-icon">${renderCategoryIcon(mother.icon, mother.name, 'tag-icon-inner')}</span>
                    <span class="tag-name">${escapeHtml(mother.name)}</span>
                </span>
            `).join('')
            : `<span class="text-muted">${t.no_parents || 'Aucune catégorie parente'}</span>`;

        // Génération des grades
        const enabledGrades = (cat.grades || []).filter(g => g.enabled);
        const gradesHtml = enabledGrades.length > 0
            ? enabledGrades.map(grade => `
                <div class="condition-item enabled">
                    <span class="condition-name">${escapeHtml(grade.name)}</span>
                    ${grade.description ? `<span class="condition-desc">${escapeHtml(grade.description)}</span>` : ''}
                </div>
            `).join('')
            : `<span class="text-muted">${t.no_grades}</span>`;

        // Compteurs média
        const mediaCounters = cat.media_counts || { images: 0, videos: 0, audios: 0, documents: 0 };
        
        // Générer l'icône (emoji ou image)
        const iconHtml = renderCategoryIcon(cat.icon, cat.name);
        
        const viewHtml = `
            <div class="category-view-modal">
                <div class="category-view-header">
                    <div class="category-view-icon">${iconHtml}</div>
                    <div class="category-view-title-section">
                        <h2 class="category-view-name">${escapeHtml(cat.name)}</h2>
                        <div class="category-view-badges">
                            ${cat.is_default ? `<span class="category-badge default">${t.default_badge}</span>` : ''}
                            ${!cat.is_default && cat.visible ? `<span class="category-badge public">${t.public_badge}</span>` : ''}
                            ${!cat.is_default && !cat.visible && cat.is_owner ? `<span class="category-badge private">${t.private_badge}</span>` : ''}
                            ${!cat.can_edit ? `<span class="category-badge readonly-badge">${t.readonly}</span>` : ''}
                        </div>
                    </div>
                </div>
                
                <div class="category-view-body">
                    <!-- ID de la catégorie (admin uniquement) -->
                    ${window.CategoriesPageData.isAdmin ? `
                    <div class="category-view-section category-id-section">
                        <label>${t.field_id || 'ID'}</label>
                        <span class="category-id-value">#${cat.id}</span>
                    </div>
                    ` : ''}

                    <div class="category-view-section">
                        <label>${t.field_description}</label>
                        <p class="category-view-text ${!cat.description ? 'text-muted' : ''}">
                            ${cat.description ? escapeHtml(cat.description) : t.no_description}
                        </p>
                    </div>
                    
                    ${cat.is_owner || window.CategoriesPageData.isAdmin ? `
                    <div class="category-view-section">
                        <label>${t.field_notes}</label>
                        <p class="category-view-text ${!cat.Notes ? 'text-muted' : ''}">
                            ${cat.Notes ? escapeHtml(cat.Notes) : t.no_notes}
                        </p>
                    </div>
                    ` : ''}
                    
                    <div class="category-view-grid">
                        <div class="category-view-info">
                            <label>${t.field_visibility}</label>
                            <span class="category-visibility ${visibilityClass}">${visibilityText}</span>
                        </div>
                        
                        <div class="category-view-info">
                            <label>${t.field_items_count}</label>
                            <span>${itemsText}</span>
                        </div>
                        
                        ${!cat.is_default && cat.owner_name ? `
                        <div class="category-view-info">
                            <label>${t.field_owner}</label>
                            <span>${escapeHtml(cat.owner_name)}</span>
                        </div>
                        ` : ''}
                        
                        ${cat.creator_name ? `
                        <div class="category-view-info">
                            <label>${t.field_original_creator}</label>
                            <span>${escapeHtml(cat.creator_name)}</span>
                        </div>
                        ` : ''}
                        
                        <div class="category-view-info">
                            <label>${t.field_created_at}</label>
                            <span>${createdDate}</span>
                        </div>
                    </div>

                    <!-- Section Hiérarchie -->
                    <div class="category-view-section category-hierarchy-section">
                        <h4 class="section-title">${t.section_hierarchy || 'Hiérarchie'}</h4>
                        
                        <div class="hierarchy-group">
                            <label>${t.field_parents || 'Catégories parentes'}</label>
                            <div class="category-tags-list">
                                ${parentsHtml}
                            </div>
                        </div>
                        
                        <div class="hierarchy-group">
                            <label>${t.field_children || 'Sous-catégories'}</label>
                            <div class="category-tags-list">
                                ${childrenHtml}
                            </div>
                        </div>
                    </div>

                    <!-- Section Grades -->
                    <div class="category-view-section category-conditions-section">
                        <h4 class="section-title">${t.section_grades}</h4>
                        <div class="conditions-list view-mode">
                            ${gradesHtml}
                        </div>
                    </div>

                    <!-- Section Médias -->
                    <div class="category-view-section category-media-section">
                        <h4 class="section-title">${t.section_media}</h4>
                        <div class="media-counters">
                            <div class="media-counter">
                                <span class="media-icon">🖼️</span>
                                <span class="media-label">${t.images_count.replace('%d', mediaCounters.images)}</span>
                            </div>
                            <div class="media-counter">
                                <span class="media-icon">🎬</span>
                                <span class="media-label">${t.videos_count.replace('%d', mediaCounters.videos)}</span>
                            </div>
                            <div class="media-counter">
                                <span class="media-icon">🎵</span>
                                <span class="media-label">${t.audios_count.replace('%d', mediaCounters.audios)}</span>
                            </div>
                            <div class="media-counter">
                                <span class="media-icon">📄</span>
                                <span class="media-label">${t.documents_count.replace('%d', mediaCounters.documents)}</span>
                            </div>
                        </div>
                        <p class="media-coming-soon text-muted">${t.media_coming_soon}</p>
                    </div>
                </div>
            </div>
        `;
        
        // Boutons selon les permissions
        const buttons = [];
        
        // Bouton Copier/Importer (pour premium et admin)
        // "Importer" si ce n'est pas sa catégorie, "Copier" si c'est la sienne
        if (window.CategoriesPageData.isPremium || window.CategoriesPageData.isAdmin) {
            const copyButtonText = cat.is_owner ? t.copy : (t.import || 'Importer');
            buttons.push({ 
                text: copyButtonText, 
                action: 'copy-category', 
                class: 'btn-secondary'
            });
        }
        
        buttons.push({ text: t.close, action: 'close', class: 'btn-secondary' });
        
        if (cat.can_edit) {
            buttons.push({ 
                text: t.edit, 
                action: 'edit-category', 
                class: 'btn-primary'
            });
        }
        
        let modalId = null;
        modalId = ModalManager.open({
            template: 'base',
            title: t.form_title_view,
            content: viewHtml,
            size: 'modal-lg',
            customClass: 'modal-category',
            buttons: buttons,
            data: { category: cat },
            onAction: async (action, id, data) => {
                if (action === 'edit-category') {
                    ModalManager.close(id);
                    openCategoryModal(data.category);
                } else if (action === 'copy-category') {
                    await copyCategory(data.category.id);
                    ModalManager.close(id);
                }
            }
        });
    }

    // ========================================
    // Copie d'une catégorie
    // ========================================
    async function copyCategory(categoryId) {
        const t = window.CategoriesPageData.translations;
        try {
            const response = await fetch(`${config.apiEndpoint}?action=copy&id=${categoryId}`, {
                method: 'POST'
            });
            const data = await response.json();
            if (data.success) {
                showToast(t.copy_success, 'success');
                loadCategories();
            } else {
                showToast(data.error?.message || 'Erreur lors de la copie', 'error');
            }
        } catch (error) {
            console.error('[Categories] Erreur copie:', error);
            showToast('Erreur de connexion', 'error');
        }
    }

    // ========================================
    // Gestion des grades personnalisés (Premium/Admin)
    // ========================================
    
    // Modal de création/édition d'un grade
    async function openGradeModal(grade = null, parentOverlay = null) {
        const t = window.CategoriesPageData.translations;
        const isEdit = grade !== null;
        
        const formHtml = `
            <form class="grade-form" id="gradeForm">
                <div class="form-group">
                    <label class="required" for="gradeName">${t.grades_name || 'Nom du grade'}</label>
                    <input type="text" 
                           id="gradeName" 
                           name="name" 
                           placeholder="${t.grades_name_placeholder || 'Ex: Comme neuf, Édition collector...'}"
                           value="${isEdit ? escapeHtml(grade.name) : ''}"
                           required
                           autocomplete="off"
                           maxlength="50">
                </div>
                <div class="form-group">
                    <label for="gradeDescription">${t.grades_description || 'Description (optionnelle)'}</label>
                    <textarea id="gradeDescription" 
                              name="description" 
                              placeholder="${t.grades_description_placeholder || 'Brève description de ce grade'}"
                              rows="2"
                              maxlength="255">${isEdit ? escapeHtml(grade.description || '') : ''}</textarea>
                </div>
            </form>
        `;
        
        ModalManager.open({
            template: 'base',
            title: isEdit ? (t.grades_edit || 'Modifier le grade') : (t.grades_create_new || 'Nouveau grade'),
            content: formHtml,
            size: 'modal-sm',
            customClass: 'modal-grade',
            buttons: [
                { text: t.cancel || 'Annuler', action: 'close', class: 'btn-secondary' },
                { text: t.save || 'Enregistrer', action: 'confirm', class: 'btn-primary' }
            ],
            onConfirm: async (id) => {
                const form = document.getElementById('gradeForm');
                const formData = new FormData(form);
                
                const gradeData = {
                    name: formData.get('name')?.trim(),
                    description: formData.get('description')?.trim() || null
                };
                
                if (!gradeData.name) {
                    showToast(t.error_name_required || 'Le nom est requis', 'error');
                    return false;
                }
                
                try {
                    const url = '/api/grades.php' + (isEdit ? `?id=${grade.id}` : '');
                    const response = await fetch(url, {
                        method: isEdit ? 'PUT' : 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(gradeData)
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        showToast(isEdit ? (t.grades_updated || 'Grade modifié') : (t.grades_created || 'Grade créé'), 'success');
                        ModalManager.close(id);
                        
                        // Rafraîchir la liste des grades dans la modal parente
                        if (parentOverlay) {
                            await refreshGradesList(parentOverlay);
                        }
                    } else {
                        showToast(data.error?.message || 'Erreur', 'error');
                        return false;
                    }
                } catch (error) {
                    console.error('[Categories] Erreur grade:', error);
                    showToast('Erreur de connexion', 'error');
                    return false;
                }
            }
        });
    }
    
    // Suppression d'un grade
    async function deleteGrade(gradeId, parentOverlay = null) {
        const t = window.CategoriesPageData.translations;
        
        // D'abord, vérifier combien d'items utilisent ce grade
        try {
            const response = await fetch(`/api/grades.php?id=${gradeId}`);
            const data = await response.json();
            
            if (!data.success) {
                showToast(data.error?.message || 'Erreur', 'error');
                return;
            }
            
            const grade = data.data;
            const usageCount = grade.usage_count || 0;
            
            // Message de confirmation adapté
            let confirmMessage = t.grades_confirm_delete_message || 'Ce grade sera retiré de tous les objets qui l\'utilisent. Les objets conserveront leurs autres données.';
            if (usageCount > 0) {
                const warningMsg = (t.grades_in_use_warning || 'Attention : ce grade est utilisé sur %d objet(s). Ils perdront ce grade.')
                    .replace('%d', usageCount);
                confirmMessage = warningMsg + '\n\n' + confirmMessage;
            }
            
            const confirmed = await ModalManager.confirm(confirmMessage, {
                title: t.grades_confirm_delete || 'Supprimer ce grade ?',
                type: 'danger',
                confirmText: t.delete || 'Supprimer',
                cancelText: t.cancel || 'Annuler'
            });
            
            if (!confirmed) return;
            
            const deleteResponse = await fetch(`/api/grades.php?id=${gradeId}`, {
                method: 'DELETE'
            });
            
            const deleteData = await deleteResponse.json();
            
            if (deleteData.success) {
                showToast(t.grades_deleted || 'Grade supprimé', 'success');
                
                // Rafraîchir la liste des grades dans la modal parente
                if (parentOverlay) {
                    await refreshGradesList(parentOverlay);
                }
            } else {
                showToast(deleteData.error?.message || 'Erreur', 'error');
            }
        } catch (error) {
            console.error('[Categories] Erreur suppression grade:', error);
            showToast('Erreur de connexion', 'error');
        }
    }
    
    // Rafraîchir la liste des grades dans une modal
    async function refreshGradesList(overlay) {
        const t = window.CategoriesPageData.translations;
        const isPremiumOrAdmin = window.CategoriesPageData.isPremium || window.CategoriesPageData.isAdmin;
        
        // Recharger les grades depuis l'API
        const availableGrades = await getAvailableGrades();
        const customGrades = availableGrades.filter(g => !g.defaut);
        
        // Récupérer les grades actuellement cochés
        const enabledGradeIds = new Set();
        overlay.querySelectorAll('#gradesList .condition-item input[type="checkbox"]:checked').forEach(cb => {
            const item = cb.closest('.condition-item');
            if (item) enabledGradeIds.add(parseInt(item.dataset.id));
        });
        
        // Regénérer le HTML des grades personnalisés
        const customGradesItemsHtml = customGrades.map(grade => {
            const isEnabled = enabledGradeIds.has(grade.id);
            return `
                <div class="condition-item ${isEnabled ? 'enabled' : ''}" data-id="${grade.id}" data-default="false">
                    <label class="condition-toggle">
                        <input type="checkbox" name="grade_${grade.id}" ${isEnabled ? 'checked' : ''}>
                        <span class="condition-name">${escapeHtml(grade.name)}</span>
                    </label>
                    ${grade.description ? `<span class="condition-desc">${escapeHtml(grade.description)}</span>` : ''}
                    ${isPremiumOrAdmin && grade.can_edit ? `
                        <div class="grade-actions">
                            <button type="button" class="btn-icon btn-grade-edit" data-grade-id="${grade.id}" title="${t.grades_edit || 'Modifier'}">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                                </svg>
                            </button>
                            <button type="button" class="btn-icon btn-grade-delete" data-grade-id="${grade.id}" title="${t.grades_delete || 'Supprimer'}">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
        
        // Mettre à jour le DOM
        const customGradesList = overlay.querySelector('#customGradesList');
        if (customGradesList) {
            if (customGradesItemsHtml) {
                customGradesList.innerHTML = customGradesItemsHtml;
            } else {
                customGradesList.innerHTML = `<span class="text-muted grades-none-custom">${t.grades_none_custom || 'Vous n\'avez pas encore créé de grades personnalisés.'}</span>`;
            }
        }
    }

    // ========================================
    // Modal de création/édition
    // ========================================
    async function openCategoryModal(category = null) {
        const t = window.CategoriesPageData.translations;
        const isEdit = category !== null;
        
        // Si édition, charger les détails complets
        let cat = category;
        let availableGrades = [];
        
        if (isEdit) {
            const fullCategory = await loadCategoryDetails(category.id);
            if (fullCategory) {
                cat = { ...category, ...fullCategory };
            }
        }
        
        // Charger les grades disponibles
        availableGrades = await getAvailableGrades();
        
        // Vérifier si des liens par défaut sont disponibles
        const hasDefaultParents = cat?.has_default_parents || false;
        const defaultParents = cat?.default_parents || [];

        // Génération du HTML pour les parents existants (tous éditables - ce sont tous des liens utilisateur)
        const existingParentsHtml = (cat?.mothers || []).map(mother => {
            return `
                <span class="category-tag editable" data-id="${mother.id}">
                    <span class="tag-icon">${renderCategoryIcon(mother.icon, mother.name, 'tag-icon-inner')}</span>
                    <span class="tag-name">${escapeHtml(mother.name)}</span>
                    <button type="button" class="tag-remove" title="${t.remove_parent || 'Retirer'}">×</button>
                </span>
            `;
        }).join('');

        // Génération du HTML pour les enfants (LECTURE SEULE - liens utilisateur)
        const childrenHtml = (cat?.children && cat.children.length > 0)
            ? cat.children.map(child => {
                return `
                    <span class="category-tag child-tag readonly" data-id="${child.id}">
                        <span class="tag-icon">${renderCategoryIcon(child.icon, child.name, 'tag-icon-inner')}</span>
                        <span class="tag-name">${escapeHtml(child.name)}</span>
                    </span>
                `;
            }).join('')
            : `<span class="text-muted">${t.no_children || 'Aucune sous-catégorie'}</span>`;
        
        // Génération du HTML pour les liens par défaut disponibles (si existants)
        const defaultParentsHtml = hasDefaultParents 
            ? defaultParents.map(parent => `
                <span class="category-tag default-suggestion" data-id="${parent.id}">
                    <span class="tag-icon">${renderCategoryIcon(parent.icon, parent.name, 'tag-icon-inner')}</span>
                    <span class="tag-name">${escapeHtml(parent.name)}</span>
                </span>
            `).join('')
            : '';
        
        // Section admin pour gérer les liens par défaut (visible uniquement pour admin sur catégorie par défaut)
        const isAdmin = window.CategoriesPageData.isAdmin;
        const isDefaultCategory = cat?.is_default || false;
        const showAdminDefaultLinks = isAdmin && isEdit && isDefaultCategory;
        
        // HTML pour la liste des liens par défaut (admin)
        const adminDefaultParentsHtml = showAdminDefaultLinks 
            ? defaultParents.map(parent => `
                <span class="category-tag admin-default editable" data-id="${parent.id}">
                    <span class="tag-icon">${renderCategoryIcon(parent.icon, parent.name, 'tag-icon-inner')}</span>
                    <span class="tag-name">${escapeHtml(parent.name)}</span>
                    <button type="button" class="tag-remove" title="${t.remove_parent || 'Retirer'}">×</button>
                </span>
            `).join('')
            : '';

        // Génération du HTML pour les grades (séparation défaut vs personnalisés)
        const defaultGrades = availableGrades.filter(g => g.defaut);
        const customGrades = availableGrades.filter(g => !g.defaut);
        const isPremiumOrAdmin = window.CategoriesPageData.isPremium || window.CategoriesPageData.isAdmin;
        
        // HTML pour les grades par défaut
        const defaultGradesItemsHtml = defaultGrades.map(grade => {
            const isEnabled = cat?.grades?.some(g => g.id === grade.id && g.enabled);
            return `
                <div class="condition-item ${isEnabled ? 'enabled' : ''}" data-id="${grade.id}" data-default="true">
                    <label class="condition-toggle">
                        <input type="checkbox" name="grade_${grade.id}" ${isEnabled ? 'checked' : ''}>
                        <span class="condition-name">${escapeHtml(grade.name)}</span>
                    </label>
                    ${grade.description ? `<span class="condition-desc">${escapeHtml(grade.description)}</span>` : ''}
                </div>
            `;
        }).join('');
        
        // HTML pour les grades personnalisés
        const customGradesItemsHtml = customGrades.map(grade => {
            const isEnabled = cat?.grades?.some(g => g.id === grade.id && g.enabled);
            return `
                <div class="condition-item ${isEnabled ? 'enabled' : ''}" data-id="${grade.id}" data-default="false">
                    <label class="condition-toggle">
                        <input type="checkbox" name="grade_${grade.id}" ${isEnabled ? 'checked' : ''}>
                        <span class="condition-name">${escapeHtml(grade.name)}</span>
                    </label>
                    ${grade.description ? `<span class="condition-desc">${escapeHtml(grade.description)}</span>` : ''}
                    ${isPremiumOrAdmin && grade.can_edit ? `
                        <div class="grade-actions">
                            <button type="button" class="btn-icon btn-grade-edit" data-grade-id="${grade.id}" title="${t.grades_edit || 'Modifier'}">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                                </svg>
                            </button>
                            <button type="button" class="btn-icon btn-grade-delete" data-grade-id="${grade.id}" title="${t.grades_delete || 'Supprimer'}">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
        
        // Génération HTML complète de la section grades
        const gradesHtml = `
            <!-- Toggle pour afficher/masquer les grades par défaut -->
            <div class="grades-toggle-section">
                <label class="grades-toggle">
                    <input type="checkbox" id="showDefaultGrades" checked>
                    <span class="toggle-slider"></span>
                    <span class="toggle-label">${t.grades_show_default || 'Afficher les grades par défaut'}</span>
                </label>
            </div>
            
            <!-- Section Grades par défaut -->
            <div class="grades-section grades-default-section" id="defaultGradesSection">
                <h5 class="grades-section-title">${t.grades_default_section || 'Grades par défaut'}</h5>
                <div class="conditions-list">
                    ${defaultGradesItemsHtml || `<span class="text-muted">${t.no_grades}</span>`}
                </div>
            </div>
            
            <!-- Section Grades personnalisés -->
            <div class="grades-section grades-custom-section">
                <h5 class="grades-section-title">${t.grades_custom_section || 'Mes grades personnalisés'}</h5>
                ${isPremiumOrAdmin ? `
                    <div class="conditions-list" id="customGradesList">
                        ${customGradesItemsHtml || `<span class="text-muted grades-none-custom">${t.grades_none_custom || 'Vous n\'avez pas encore créé de grades personnalisés.'}</span>`}
                    </div>
                    <button type="button" class="btn btn-sm btn-outline-primary btn-create-grade" id="btnCreateGrade">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        ${t.grades_create || 'Créer un grade'}
                    </button>
                ` : `
                    <div class="grades-premium-message">
                        <div class="premium-icon">👑</div>
                        <h6>${t.grades_premium_only || 'Fonctionnalité Premium'}</h6>
                        <p>${t.grades_premium_message || 'Passez en Premium pour créer vos propres grades personnalisés et personnaliser le suivi de l\'état de votre collection !'}</p>
                    </div>
                `}
            </div>
        `;

        // Compteurs média
        const mediaCounters = cat?.media_counts || { images: 0, videos: 0, audios: 0, documents: 0 };

        const formHtml = `
            <form class="category-form category-form-wide" id="categoryForm">
                <!-- En-tête avec ID et créateur (admin uniquement pour ID, créateur toujours visible) -->
                ${isEdit && (window.CategoriesPageData.isAdmin || cat.creator_name) ? `
                <div class="form-header-row">
                    ${window.CategoriesPageData.isAdmin ? `<span class="form-id-badge">ID #${cat.id}</span>` : ''}
                    ${cat.creator_name ? `<span class="form-creator-badge">${t.field_original_creator} ${escapeHtml(cat.creator_name)}</span>` : ''}
                </div>
                ` : ''}

                <!-- Grille principale à deux colonnes -->
                <div class="form-grid-2col">
                    <!-- COLONNE GAUCHE : Infos de base -->
                    <div class="form-column">
                        <div class="form-group">
                            <label class="required" for="catName">${t.field_name}</label>
                            <input type="text" 
                                   id="catName" 
                                   name="name" 
                                   placeholder="${t.field_name_placeholder}"
                                   value="${isEdit ? escapeHtml(cat.name) : ''}"
                                   required
                                   autocomplete="off">
                        </div>
                        
                        <div class="form-group">
                            <label for="catDescription">${t.field_description}</label>
                            <textarea id="catDescription" 
                                      name="description" 
                                      placeholder="${t.field_description_placeholder}"
                                      rows="3">${isEdit ? escapeHtml(cat.description || '') : ''}</textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="catNotes">${t.field_notes}</label>
                            <textarea id="catNotes" 
                                      name="notes" 
                                      placeholder="${t.field_notes_placeholder}"
                                      rows="3">${isEdit && cat.Notes ? escapeHtml(cat.Notes) : ''}</textarea>
                        </div>
                        
                        ${showAdminDefaultLinks ? `
                        <!-- Section Admin : Liens par défaut de cette catégorie -->
                        <div class="form-group admin-default-links-section">
                            <label>
                                <span class="admin-badge">👑</span>
                                ${t.admin_default_links_title || 'Liens par défaut'}
                            </label>
                            <p class="form-hint">${t.admin_default_links_hint || 'Ces liens seront proposés par défaut à tous les utilisateurs.'}</p>
                            <div class="category-tags-container compact" id="adminDefaultParentsContainer">
                                <div class="category-tags-list" id="adminDefaultParentsList">
                                    ${adminDefaultParentsHtml || `<span class="text-muted">${t.no_default_links || 'Aucun lien par défaut'}</span>`}
                                </div>
                                <div class="autocomplete-wrapper">
                                    <input type="text" 
                                           id="adminDefaultParentsSearch" 
                                           class="autocomplete-input"
                                           placeholder="${t.search_default_parent || 'Ajouter...'}"
                                           autocomplete="off">
                                    <div class="autocomplete-results" id="adminDefaultParentsResults"></div>
                                </div>
                            </div>
                            <input type="hidden" id="adminDefaultParentIds" name="default_parent_ids" value="${defaultParents.map(p => p.id).join(',')}">
                        </div>
                        ` : ''}
                    </div>

                    <!-- COLONNE DROITE : Icône, visibilité, hiérarchie -->
                    <div class="form-column">
                        <div class="form-group">
                            <label>${t.field_icon}</label>
                            <div class="icon-upload-zone" id="iconUploadZone" tabindex="0" role="button" aria-label="${t.field_icon_upload || 'Cliquer ou déposer une image'}">
                                <input type="file" 
                                       id="catIconFile" 
                                       name="icon_file" 
                                       accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml,image/avif"
                                       class="icon-file-input">
                                <input type="hidden" id="catIcon" name="icon" value="${isEdit ? escapeHtml(cat.icon || '') : ''}">
                                <div class="icon-preview-large" id="iconPreview">
                                    ${isEdit && cat.icon ? renderCategoryIcon(cat.icon, cat.name, 'icon-preview-img') : '<span class="icon-preview-placeholder">📁</span>'}
                                </div>
                                <div class="icon-upload-overlay">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                        <polyline points="17 8 12 3 7 8"></polyline>
                                        <line x1="12" y1="3" x2="12" y2="15"></line>
                                    </svg>
                                </div>
                            </div>
                            <p class="form-hint">${t.field_icon_hint}</p>
                        </div>
                        
                        <div class="form-group">
                            <label>${t.field_visible}</label>
                            <div class="checkbox-card">
                                <input type="checkbox" 
                                       id="catVisible" 
                                       name="visible"
                                       ${isEdit && cat.visible ? 'checked' : ''}>
                                <div class="checkbox-card-content">
                                    <span class="checkbox-card-title">${t.field_visible}</span>
                                    <small>${t.field_visible_hint}</small>
                                </div>
                            </div>
                        </div>

                        ${window.CategoriesPageData.isAdmin ? `
                        <!-- Section Admin : Catégorie par défaut -->
                        <div class="form-group admin-default-section">
                            <label>
                                <span class="admin-badge">👑</span>
                                ${t.field_is_default || 'Catégorie système'}
                            </label>
                            <div class="checkbox-card ${isEdit && cat.is_default ? 'checkbox-card-warning' : ''}">
                                <input type="checkbox" 
                                       id="catIsDefault" 
                                       name="is_default"
                                       ${isEdit && cat.is_default ? 'checked' : ''}>
                                <div class="checkbox-card-content">
                                    <span class="checkbox-card-title">${t.is_default_label || 'Catégorie par défaut'}</span>
                                    <small>${t.is_default_hint || 'Accessible à tous les utilisateurs. Les fichiers seront transférés automatiquement.'}</small>
                                </div>
                            </div>
                            ${isEdit && cat.user_id ? `
                            <p class="form-hint form-hint-warning">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                    <line x1="12" y1="9" x2="12" y2="13"></line>
                                    <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                </svg>
                                ${t.is_default_warning || 'Attention : Rendre cette catégorie "par défaut" la détachera de son propriétaire actuel.'}
                            </p>
                            ` : ''}
                        </div>
                        ` : ''}

                        <!-- Sous-catégories (lecture seule) -->
                        <div class="form-group">
                            <label>${t.field_children || 'Sous-catégories'}</label>
                            <div class="category-tags-list readonly-tags">
                                ${childrenHtml}
                            </div>
                            <p class="form-hint">${t.children_readonly_hint || 'Les sous-catégories sont gérées via le champ "catégories parentes" de ces catégories.'}</p>
                        </div>
                    </div>
                </div>

                <!-- Sections pleine largeur -->
                <div class="form-sections-row">
                    <!-- Section Catégories parentes (ÉDITABLE) -->
                    <div class="form-section">
                        <h4 class="section-title">${t.section_parents || t.field_parents || 'Catégories parentes'}</h4>
                        <p class="form-hint section-hint">${t.field_parents_hint || 'Catégories qui seront automatiquement ajoutées lorsque cette catégorie est sélectionnée.'}</p>
                        
                        ${hasDefaultParents ? `
                        <!-- Section liens par défaut disponibles -->
                        <div class="default-links-section" id="defaultLinksSection">
                            <div class="default-links-header">
                                <label class="toggle-label">
                                    <input type="checkbox" id="showDefaultSuggestions">
                                    <span>${t.show_default_suggestions || 'Afficher les suggestions par défaut'}</span>
                                </label>
                            </div>
                            <div class="default-links-content" id="defaultLinksContent" style="display: none;">
                                <p class="default-links-hint">${t.default_links_hint || 'Ces liens sont suggérés par défaut. Cliquez pour les importer.'}</p>
                                <div class="default-links-tags">
                                    ${defaultParentsHtml}
                                </div>
                                <button type="button" class="btn btn-secondary btn-sm" id="importAllDefaults">
                                    ${t.import_all_defaults || 'Importer tous les liens par défaut'}
                                </button>
                            </div>
                        </div>
                        ` : ''}
                        
                        <div class="category-tags-container" id="parentsTagsContainer">
                            <div class="category-tags-list" id="parentsTagsList">
                                ${existingParentsHtml}
                            </div>
                            <div class="autocomplete-wrapper">
                                <input type="text" 
                                       id="parentsSearch" 
                                       class="autocomplete-input"
                                       placeholder="${t.parents_placeholder || 'Rechercher une catégorie parente...'}"
                                       autocomplete="off">
                                <div class="autocomplete-results" id="parentsResults"></div>
                            </div>
                        </div>
                        <input type="hidden" id="parentIds" name="parent_ids" value="${(cat?.mothers || []).map(m => m.id).join(',')}">
                    </div>

                    <!-- Section Grades -->
                    <div class="form-section">
                        <h4 class="section-title">${t.section_grades}</h4>
                        <div class="conditions-list edit-mode" id="gradesList">
                            ${gradesHtml}
                        </div>
                    </div>
                </div>

                <!-- Section Médias (pleine largeur) -->
                <div class="form-section form-section-media">
                    <h4 class="section-title">${t.section_media}</h4>
                    
                    <!-- Onglets médias -->
                    <div class="media-tabs">
                        <button type="button" class="media-tab active" data-media-type="images">
                            <span class="tab-icon">🖼️</span>
                            <span class="tab-label">${t.media_tab_images || 'Images'}</span>
                            <span class="tab-count" id="mediaCountImages">${mediaCounters.images || 0}</span>
                        </button>
                        <button type="button" class="media-tab" data-media-type="videos">
                            <span class="tab-icon">🎬</span>
                            <span class="tab-label">${t.media_tab_videos || 'Vidéos'}</span>
                            <span class="tab-count" id="mediaCountVideos">${mediaCounters.videos || 0}</span>
                        </button>
                        <button type="button" class="media-tab" data-media-type="audio">
                            <span class="tab-icon">🎵</span>
                            <span class="tab-label">${t.media_tab_audio || 'Audio'}</span>
                            <span class="tab-count" id="mediaCountAudio">${mediaCounters.audios || 0}</span>
                        </button>
                        <button type="button" class="media-tab" data-media-type="documents">
                            <span class="tab-icon">📄</span>
                            <span class="tab-label">${t.media_tab_documents || 'Documents'}</span>
                            <span class="tab-count" id="mediaCountDocuments">${mediaCounters.documents || 0}</span>
                        </button>
                    </div>
                    
                    <!-- Panneaux médias -->
                    <div class="media-panels">
                        <div class="media-panel active" data-media-type="images" id="mediaPanelImages">
                            <p class="media-panel-hint">
                                <span class="hint-icon">💡</span>
                                ${t.media_hint_images || 'Ajoutez des photos de votre collection. Formats acceptés : JPG, PNG, GIF, WebP. Les images seront recadrées automatiquement.'}
                            </p>
                            <!-- Bouton caméra pour les images -->
                            <div class="media-panel-actions" id="mediaPanelImagesActions">
                                <button type="button" class="btn btn-secondary btn-camera-capture" id="btnCameraCapture" title="${t.take_photo || 'Prendre une photo'}">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                        <circle cx="12" cy="13" r="4"></circle>
                                    </svg>
                                    <span>${t.take_photo || 'Prendre une photo'}</span>
                                </button>
                            </div>
                            <div class="media-panel-content"></div>
                        </div>
                        <div class="media-panel" data-media-type="videos" id="mediaPanelVideos">
                            <p class="media-panel-hint">
                                <span class="hint-icon">💡</span>
                                ${t.media_hint_videos || 'Ajoutez des vidéos (unboxing, présentations...). Formats acceptés : MP4, WebM, AVI, MKV. Une miniature sera générée automatiquement.'}
                            </p>
                            <div class="media-panel-content"></div>
                        </div>
                        <div class="media-panel" data-media-type="audio" id="mediaPanelAudio">
                            <p class="media-panel-hint">
                                <span class="hint-icon">💡</span>
                                ${t.media_hint_audio || 'Ajoutez des fichiers audio (musiques, effets sonores, commentaires...). Formats acceptés : MP3, WAV, OGG, FLAC. Lecture directe dans l\'interface.'}
                            </p>
                            <div class="media-panel-content"></div>
                        </div>
                        <div class="media-panel" data-media-type="documents" id="mediaPanelDocuments">
                            <p class="media-panel-hint">
                                <span class="hint-icon">💡</span>
                                ${t.media_hint_documents || 'Ajoutez des documents (manuels, factures, certificats...). Formats acceptés : PDF, DOC, XLS, TXT, ZIP. Téléchargeables depuis l\'interface.'}
                            </p>
                            <div class="media-panel-content"></div>
                        </div>
                    </div>
                </div>
            </form>
        `;

        // Boutons selon les permissions
        const buttons = [];
        
        // Bouton Supprimer (si édition et droits de suppression)
        if (isEdit && cat.can_delete) {
            buttons.push({ 
                text: t.delete, 
                action: 'delete-category', 
                class: 'btn-danger'
            });
        }
        
        // Bouton Copier (pour premium et admin, seulement en édition)
        if (isEdit && (window.CategoriesPageData.isPremium || window.CategoriesPageData.isAdmin)) {
            buttons.push({ 
                text: t.copy, 
                action: 'copy-category', 
                class: 'btn-secondary'
            });
        }
        
        buttons.push({ text: t.cancel, action: 'close', class: 'btn-secondary' });
        buttons.push({ text: t.save, action: 'confirm', class: 'btn-primary' });

        let modalId = null;
        let searchTimeout = null;
        
        modalId = ModalManager.open({
            template: 'base',
            title: isEdit ? t.form_title_edit : t.form_title_add,
            content: formHtml,
            size: 'modal-lg',
            customClass: 'modal-category',
            buttons: buttons,
            data: { category: cat, isEdit: isEdit },
            onOpen: (id, overlay) => {
                // Variable pour stocker le Blob de l'icône éditée
                let pendingIconBlob = null;
                
                // Gestion de l'upload d'icône
                const iconUploadZone = overlay.querySelector('#iconUploadZone');
                const iconFileInput = overlay.querySelector('#catIconFile');
                const iconHiddenInput = overlay.querySelector('#catIcon');
                const iconPreview = overlay.querySelector('#iconPreview');
                
                // Fonction pour ouvrir l'éditeur d'icône
                function openIconEditor(file) {
                    // Valider le type de fichier
                    const validTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml', 'image/avif'];
                    if (!validTypes.includes(file.type)) {
                        showToast(t.error_invalid_image || 'Format d\'image invalide', 'error');
                        return;
                    }
                    
                    // Valider la taille (max 6MB)
                    if (file.size > 6 * 1024 * 1024) {
                        showToast(t.error_file_too_large || 'Fichier trop volumineux (max 6 Mo)', 'error');
                        return;
                    }
                    
                    // Ouvrir l'éditeur d'icône
                    IconEditor.open({
                        image: file,
                        caller: id,
                        translations: {
                            title: t.icon_editor_title || 'Éditeur d\'icône',
                            rotate_left: t.icon_editor_rotate_left || 'Rotation gauche',
                            rotate_right: t.icon_editor_rotate_right || 'Rotation droite',
                            flip_horizontal: t.icon_editor_flip_horizontal || 'Miroir horizontal',
                            flip_vertical: t.icon_editor_flip_vertical || 'Miroir vertical',
                            zoom_in: t.icon_editor_zoom_in || 'Zoom +',
                            zoom_out: t.icon_editor_zoom_out || 'Zoom -',
                            reset: t.icon_editor_reset || 'Réinitialiser',
                            cancel: t.icon_editor_cancel || 'Annuler',
                            save: t.icon_editor_save || 'Enregistrer',
                            preview: t.icon_editor_preview || 'Aperçu',
                            drag_hint: t.icon_editor_drag_hint || 'Glissez pour déplacer',
                            zoom_hint: t.icon_editor_zoom_hint || 'Molette ou pincement pour zoomer',
                            loading: t.icon_editor_loading || 'Chargement...',
                            error_load: t.icon_editor_error_load || 'Erreur de chargement',
                            error_save: t.icon_editor_error_save || 'Erreur de sauvegarde',
                        },
                        onSave: (blob) => {
                            // Stocker le Blob pour l'envoi
                            pendingIconBlob = blob;
                            
                            // Mettre à jour la preview
                            const url = URL.createObjectURL(blob);
                            iconPreview.innerHTML = `<img src="${url}" alt="Preview" class="icon-preview-img">`;
                            
                            // Marquer qu'un nouveau fichier a été sélectionné
                            iconHiddenInput.value = '__NEW_FILE__';
                            
                            // Stocker le blob sur la zone pour l'envoi du formulaire
                            iconUploadZone.dataset.pendingBlob = 'true';
                        },
                        onCancel: () => {
                            // Ne rien faire
                        }
                    });
                }
                
                // Exposer pendingIconBlob et openIconEditor pour le formulaire
                overlay._iconEditorState = {
                    getPendingBlob: () => pendingIconBlob,
                    clearPendingBlob: () => { pendingIconBlob = null; }
                };
                
                if (iconUploadZone && iconFileInput) {
                    // Clic sur la zone = ouvrir le sélecteur de fichier
                    iconUploadZone.addEventListener('click', (e) => {
                        if (e.target !== iconFileInput) {
                            iconFileInput.click();
                        }
                    });
                    
                    // Gestion clavier (accessibilité)
                    iconUploadZone.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            iconFileInput.click();
                        }
                    });
                    
                    // Changement de fichier -> Ouvrir l'éditeur
                    iconFileInput.addEventListener('change', (e) => {
                        const file = e.target.files[0];
                        if (file) {
                            openIconEditor(file);
                        }
                    });
                    
                    // Drag & Drop
                    iconUploadZone.addEventListener('dragover', (e) => {
                        e.preventDefault();
                        iconUploadZone.classList.add('drag-over');
                    });
                    
                    iconUploadZone.addEventListener('dragleave', (e) => {
                        e.preventDefault();
                        iconUploadZone.classList.remove('drag-over');
                    });
                    
                    iconUploadZone.addEventListener('drop', (e) => {
                        e.preventDefault();
                        iconUploadZone.classList.remove('drag-over');
                        const file = e.dataTransfer.files[0];
                        if (file && file.type.startsWith('image/')) {
                            // Ouvrir l'éditeur d'icône
                            openIconEditor(file);
                        } else {
                            showToast(t.error_invalid_image || 'Format d\'image invalide', 'error');
                        }
                    });
                }
                
                // Gestion de l'autocomplétion pour les catégories parentes
                const parentsSearch = overlay.querySelector('#parentsSearch');
                const parentsResults = overlay.querySelector('#parentsResults');
                const parentsTagsList = overlay.querySelector('#parentsTagsList');
                const parentIdsInput = overlay.querySelector('#parentIds');
                
                if (parentsSearch) {
                    // Recherche avec debounce
                    parentsSearch.addEventListener('input', (e) => {
                        clearTimeout(searchTimeout);
                        const query = e.target.value.trim();
                        
                        if (query.length < 2) {
                            parentsResults.innerHTML = '';
                            parentsResults.classList.remove('visible');
                            return;
                        }
                        
                        searchTimeout = setTimeout(async () => {
                            const currentIds = parentIdsInput.value.split(',').filter(Boolean);
                            // Exclure aussi l'ID de la catégorie actuelle (on ne peut pas être son propre parent)
                            if (isEdit && cat.id) currentIds.push(cat.id.toString());
                            
                            const results = await searchCategories(query, currentIds);
                            
                            if (results.length > 0) {
                                parentsResults.innerHTML = results.map(r => `
                                    <div class="autocomplete-item" data-id="${r.id}" data-name="${escapeHtml(r.name)}" data-icon="${escapeHtml(r.icon || '📁')}">
                                        <span class="autocomplete-icon">${renderCategoryIcon(r.icon, r.name, 'autocomplete-icon-inner')}</span>
                                        <span class="autocomplete-name">${escapeHtml(r.name)}</span>
                                    </div>
                                `).join('');
                                parentsResults.classList.add('visible');
                            } else {
                                parentsResults.innerHTML = `<div class="autocomplete-empty">${t.no_results || 'Aucun résultat'}</div>`;
                                parentsResults.classList.add('visible');
                            }
                        }, 300);
                    });
                    
                    // Sélection d'un résultat
                    parentsResults.addEventListener('click', (e) => {
                        const item = e.target.closest('.autocomplete-item');
                        if (!item) return;
                        
                        const id = item.dataset.id;
                        const name = item.dataset.name;
                        const icon = item.dataset.icon;
                        
                        // Ajouter le tag
                        const tag = document.createElement('span');
                        tag.className = 'category-tag editable';
                        tag.dataset.id = id;
                        tag.innerHTML = `
                            <span class="tag-icon">${renderCategoryIcon(icon, name, 'tag-icon-inner')}</span>
                            <span class="tag-name">${escapeHtml(name)}</span>
                            <button type="button" class="tag-remove" title="${t.remove_parent || 'Retirer'}">×</button>
                        `;
                        parentsTagsList.appendChild(tag);
                        
                        // Mettre à jour les IDs
                        const currentIds = parentIdsInput.value.split(',').filter(Boolean);
                        currentIds.push(id);
                        parentIdsInput.value = currentIds.join(',');
                        
                        // Reset
                        parentsSearch.value = '';
                        parentsResults.innerHTML = '';
                        parentsResults.classList.remove('visible');
                    });
                    
                    // Fermer les résultats si clic ailleurs
                    document.addEventListener('click', (e) => {
                        if (!e.target.closest('.autocomplete-wrapper')) {
                            parentsResults.classList.remove('visible');
                        }
                    });
                }
                
                // Suppression des tags parents
                parentsTagsList?.addEventListener('click', (e) => {
                    const removeBtn = e.target.closest('.tag-remove');
                    if (!removeBtn) return;
                    
                    const tag = removeBtn.closest('.category-tag');
                    const idToRemove = tag.dataset.id;
                    
                    // Supprimer le tag
                    tag.remove();
                    
                    // Mettre à jour les IDs
                    const currentIds = parentIdsInput.value.split(',').filter(Boolean);
                    parentIdsInput.value = currentIds.filter(id => id !== idToRemove).join(',');
                });
                
                // Gestion du toggle pour les liens par défaut
                const showDefaultSuggestions = overlay.querySelector('#showDefaultSuggestions');
                const defaultLinksContent = overlay.querySelector('#defaultLinksContent');
                const importAllDefaults = overlay.querySelector('#importAllDefaults');
                const defaultLinksTags = overlay.querySelector('.default-links-tags');
                
                if (showDefaultSuggestions && defaultLinksContent) {
                    showDefaultSuggestions.addEventListener('change', (e) => {
                        defaultLinksContent.style.display = e.target.checked ? 'block' : 'none';
                    });
                }
                
                // Fonction helper pour ajouter un parent
                const addParentTag = (id, name, icon) => {
                    // Vérifier si déjà présent
                    const currentIds = parentIdsInput.value.split(',').filter(Boolean);
                    if (currentIds.includes(id.toString())) return false;
                    
                    // Ajouter le tag
                    const tag = document.createElement('span');
                    tag.className = 'category-tag editable';
                    tag.dataset.id = id;
                    tag.innerHTML = `
                        <span class="tag-icon">${renderCategoryIcon(icon, name, 'tag-icon-inner')}</span>
                        <span class="tag-name">${escapeHtml(name)}</span>
                        <button type="button" class="tag-remove" title="${t.remove_parent || 'Retirer'}">×</button>
                    `;
                    parentsTagsList.appendChild(tag);
                    
                    // Mettre à jour les IDs
                    currentIds.push(id.toString());
                    parentIdsInput.value = currentIds.join(',');
                    return true;
                };
                
                // Import d'un lien par défaut individuel (clic sur suggestion)
                if (defaultLinksTags) {
                    defaultLinksTags.addEventListener('click', (e) => {
                        const suggestionTag = e.target.closest('.default-suggestion');
                        if (!suggestionTag) return;
                        
                        const id = suggestionTag.dataset.id;
                        const name = suggestionTag.querySelector('.tag-name')?.textContent || '';
                        const iconEl = suggestionTag.querySelector('.tag-icon-inner');
                        const icon = iconEl?.src || iconEl?.textContent || '📁';
                        
                        if (addParentTag(id, name, icon)) {
                            // Masquer la suggestion importée
                            suggestionTag.classList.add('imported');
                            showToast(t.link_imported || 'Lien importé', 'success');
                        } else {
                            showToast(t.link_already_exists || 'Ce lien existe déjà', 'info');
                        }
                    });
                }
                
                // Import de tous les liens par défaut
                if (importAllDefaults) {
                    importAllDefaults.addEventListener('click', async () => {
                        if (!isEdit || !cat?.id) return;
                        
                        try {
                            const response = await fetch(`${config.apiEndpoint}?id=${cat.id}&action=import-defaults`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' }
                            });
                            const result = await response.json();
                            
                            if (result.success) {
                                // Mettre à jour l'affichage avec les nouveaux parents
                                const newParents = result.data.parents || [];
                                parentsTagsList.innerHTML = '';
                                parentIdsInput.value = '';
                                
                                newParents.forEach(parent => {
                                    addParentTag(parent.id, parent.name, parent.icon);
                                });
                                
                                // Masquer toutes les suggestions
                                defaultLinksTags?.querySelectorAll('.default-suggestion').forEach(tag => {
                                    tag.classList.add('imported');
                                });
                                
                                showToast(t.defaults_imported?.replace('%d', result.data.imported) || `${result.data.imported} lien(s) importé(s)`, 'success');
                            } else {
                                showToast(result.error?.message || 'Erreur', 'error');
                            }
                        } catch (err) {
                            console.error('Erreur import défauts:', err);
                            showToast(t.error_import || 'Erreur lors de l\'import', 'error');
                        }
                    });
                }
                
                // ==========================================
                // Section Admin : Gestion des liens par défaut
                // ==========================================
                const adminDefaultParentsSearch = overlay.querySelector('#adminDefaultParentsSearch');
                const adminDefaultParentsResults = overlay.querySelector('#adminDefaultParentsResults');
                const adminDefaultParentsList = overlay.querySelector('#adminDefaultParentsList');
                const adminDefaultParentIdsInput = overlay.querySelector('#adminDefaultParentIds');
                
                if (adminDefaultParentsSearch) {
                    // Recherche avec debounce pour les liens par défaut
                    let adminSearchTimeout = null;
                    adminDefaultParentsSearch.addEventListener('input', (e) => {
                        clearTimeout(adminSearchTimeout);
                        const query = e.target.value.trim();
                        
                        if (query.length < 2) {
                            adminDefaultParentsResults.innerHTML = '';
                            adminDefaultParentsResults.classList.remove('visible');
                            return;
                        }
                        
                        adminSearchTimeout = setTimeout(async () => {
                            const currentIds = adminDefaultParentIdsInput.value.split(',').filter(Boolean);
                            if (isEdit && cat.id) currentIds.push(cat.id.toString());
                            
                            const results = await searchCategories(query, currentIds);
                            
                            if (results.length > 0) {
                                adminDefaultParentsResults.innerHTML = results.map(r => `
                                    <div class="autocomplete-item" data-id="${r.id}" data-name="${escapeHtml(r.name)}" data-icon="${escapeHtml(r.icon || '📁')}">
                                        <span class="autocomplete-icon">${renderCategoryIcon(r.icon, r.name, 'autocomplete-icon-inner')}</span>
                                        <span class="autocomplete-name">${escapeHtml(r.name)}</span>
                                    </div>
                                `).join('');
                                adminDefaultParentsResults.classList.add('visible');
                            } else {
                                adminDefaultParentsResults.innerHTML = `<div class="autocomplete-empty">${t.no_results || 'Aucun résultat'}</div>`;
                                adminDefaultParentsResults.classList.add('visible');
                            }
                        }, 300);
                    });
                    
                    // Sélection d'un résultat admin
                    adminDefaultParentsResults.addEventListener('click', (e) => {
                        const item = e.target.closest('.autocomplete-item');
                        if (!item) return;
                        
                        const id = item.dataset.id;
                        const name = item.dataset.name;
                        const icon = item.dataset.icon;
                        
                        // Vérifier le placeholder et le retirer
                        const placeholder = adminDefaultParentsList.querySelector('.text-muted');
                        if (placeholder) placeholder.remove();
                        
                        // Ajouter le tag
                        const tag = document.createElement('span');
                        tag.className = 'category-tag admin-default editable';
                        tag.dataset.id = id;
                        tag.innerHTML = `
                            <span class="tag-icon">${renderCategoryIcon(icon, name, 'tag-icon-inner')}</span>
                            <span class="tag-name">${escapeHtml(name)}</span>
                            <button type="button" class="tag-remove" title="${t.remove_parent || 'Retirer'}">×</button>
                        `;
                        adminDefaultParentsList.appendChild(tag);
                        
                        // Mettre à jour les IDs
                        const currentIds = adminDefaultParentIdsInput.value.split(',').filter(Boolean);
                        currentIds.push(id);
                        adminDefaultParentIdsInput.value = currentIds.join(',');
                        
                        // Reset
                        adminDefaultParentsSearch.value = '';
                        adminDefaultParentsResults.innerHTML = '';
                        adminDefaultParentsResults.classList.remove('visible');
                    });
                    
                    // Fermer résultats si clic ailleurs
                    document.addEventListener('click', (e) => {
                        if (!e.target.closest('#adminDefaultParentsContainer')) {
                            adminDefaultParentsResults?.classList.remove('visible');
                        }
                    });
                }
                
                // Suppression des tags admin default
                adminDefaultParentsList?.addEventListener('click', (e) => {
                    const removeBtn = e.target.closest('.tag-remove');
                    if (!removeBtn) return;
                    
                    const tag = removeBtn.closest('.category-tag');
                    const idToRemove = tag.dataset.id;
                    
                    tag.remove();
                    
                    const currentIds = adminDefaultParentIdsInput.value.split(',').filter(Boolean);
                    adminDefaultParentIdsInput.value = currentIds.filter(id => id !== idToRemove).join(',');
                    
                    // Remettre le placeholder si vide
                    if (adminDefaultParentsList.children.length === 0) {
                        adminDefaultParentsList.innerHTML = `<span class="text-muted">${t.no_default_links || 'Aucun lien par défaut configuré'}</span>`;
                    }
                });
                
                // Gestion des toggles de grades
                const gradesList = overlay.querySelector('#gradesList');
                gradesList?.addEventListener('change', (e) => {
                    const checkbox = e.target;
                    if (checkbox.type !== 'checkbox') return;
                    
                    const item = checkbox.closest('.condition-item');
                    if (checkbox.checked) {
                        item.classList.add('enabled');
                    } else {
                        item.classList.remove('enabled');
                    }
                });
                
                // Toggle pour afficher/masquer les grades par défaut
                const showDefaultGradesToggle = overlay.querySelector('#showDefaultGrades');
                const defaultGradesSection = overlay.querySelector('#defaultGradesSection');
                if (showDefaultGradesToggle && defaultGradesSection) {
                    showDefaultGradesToggle.addEventListener('change', (e) => {
                        if (e.target.checked) {
                            defaultGradesSection.style.display = '';
                        } else {
                            defaultGradesSection.style.display = 'none';
                        }
                    });
                }
                
                // Gestion du bouton créer grade (Premium/Admin)
                const btnCreateGrade = overlay.querySelector('#btnCreateGrade');
                if (btnCreateGrade) {
                    btnCreateGrade.addEventListener('click', () => openGradeModal(null, overlay));
                }
                
                // Gestion des boutons éditer/supprimer grade
                const customGradesList = overlay.querySelector('#customGradesList');
                if (customGradesList) {
                    customGradesList.addEventListener('click', async (e) => {
                        const editBtn = e.target.closest('.btn-grade-edit');
                        const deleteBtn = e.target.closest('.btn-grade-delete');
                        
                        if (editBtn) {
                            const gradeId = parseInt(editBtn.dataset.gradeId);
                            const gradeItem = editBtn.closest('.condition-item');
                            const gradeName = gradeItem.querySelector('.condition-name').textContent;
                            const gradeDesc = gradeItem.querySelector('.condition-desc')?.textContent || '';
                            openGradeModal({ id: gradeId, name: gradeName, description: gradeDesc }, overlay);
                        }
                        
                        if (deleteBtn) {
                            const gradeId = parseInt(deleteBtn.dataset.gradeId);
                            await deleteGrade(gradeId, overlay);
                        }
                    });
                }
                
                // ==========================================
                // Section Médias : Initialisation MediaListManager
                // ==========================================
                const mediaManagers = {};
                const mediaTypes = ['images', 'videos', 'audio', 'documents'];
                
                // Initialiser les gestionnaires de médias pour chaque type
                mediaTypes.forEach(mediaType => {
                    const panel = overlay.querySelector(`#mediaPanel${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)}`);
                    const contentContainer = panel?.querySelector('.media-panel-content');
                    if (contentContainer && typeof MediaListManager !== 'undefined') {
                        mediaManagers[mediaType] = MediaListManager.create({
                            container: contentContainer,
                            type: mediaType,
                            apiEndpoint: '/api/category-media.php',
                            entityType: 'category',
                            entityId: isEdit ? cat.id : null,
                            userId: window.CategoriesPageData.userId,
                            isDefault: isEdit ? cat.is_default : false,
                            readonly: false,
                            onFilesChange: (data) => {
                                // Mettre à jour le compteur de l'onglet
                                // data = { type, files, pendingFiles }
                                const count = data.files.length + data.pendingFiles.length;
                                const capitalizedType = mediaType.charAt(0).toUpperCase() + mediaType.slice(1);
                                const countEl = overlay.querySelector(`#mediaCount${capitalizedType}`);
                                if (countEl) {
                                    countEl.textContent = count;
                                }
                            },
                            onError: (message) => {
                                showToast(message, 'error');
                            }
                        });
                        
                        // Charger les médias existants si édition
                        if (isEdit && cat.id) {
                            mediaManagers[mediaType].loadFiles();
                        }
                    }
                });
                
                // Stocker les managers sur l'overlay pour y accéder dans onConfirm
                overlay._mediaManagers = mediaManagers;
                
                // Gestion du bouton caméra pour les images
                const btnCameraCapture = overlay.querySelector('#btnCameraCapture');
                if (btnCameraCapture && typeof CameraCapture !== 'undefined') {
                    btnCameraCapture.addEventListener('click', () => {
                        CameraCapture.open({
                            caller: modalId,
                            targetField: 'category-images',
                            facingMode: 'environment', // Caméra arrière par défaut
                            skipEditor: false,         // Passer par l'éditeur d'images
                            onCapture: async (result) => {
                                // Ajouter l'image au MediaListManager des images
                                if (mediaManagers.images) {
                                    await mediaManagers.images.addFromImageEditor(result);
                                }
                            },
                            onCancel: () => {
                                // Ne rien faire
                            }
                        });
                    });
                } else if (btnCameraCapture) {
                    // Cacher le bouton si CameraCapture n'est pas disponible
                    btnCameraCapture.style.display = 'none';
                }
                
                // Gestion des onglets médias
                const mediaTabs = overlay.querySelectorAll('.media-tab');
                const mediaPanels = overlay.querySelectorAll('.media-panel');
                
                mediaTabs.forEach(tab => {
                    tab.addEventListener('click', () => {
                        const targetType = tab.dataset.mediaType;
                        
                        // Désactiver tous les onglets et panneaux
                        mediaTabs.forEach(t => t.classList.remove('active'));
                        mediaPanels.forEach(p => p.classList.remove('active'));
                        
                        // Activer l'onglet et le panneau ciblés
                        tab.classList.add('active');
                        const targetPanel = overlay.querySelector(`.media-panel[data-media-type="${targetType}"]`);
                        if (targetPanel) {
                            targetPanel.classList.add('active');
                        }
                    });
                });
            },
            onAction: async (action, id, data) => {
                if (action === 'delete-category') {
                    const confirmed = await ModalManager.confirm(t.confirm_delete_message, {
                        title: t.confirm_delete,
                        type: 'danger',
                        confirmText: t.delete,
                        cancelText: t.cancel
                    });
                    
                    if (confirmed) {
                        try {
                            const response = await fetch(`${config.apiEndpoint}?id=${data.category.id}`, {
                                method: 'DELETE'
                            });
                            const result = await response.json();
                            if (result.success) {
                                showToast(t.deleted_success, 'success');
                                ModalManager.close(id);
                                loadCategories();
                            } else {
                                showToast(result.error?.message || 'Erreur', 'error');
                            }
                        } catch (error) {
                            showToast('Erreur de connexion', 'error');
                        }
                    }
                } else if (action === 'copy-category') {
                    await copyCategory(data.category.id);
                    ModalManager.close(id);
                }
            },
            onConfirm: async (id, modalData) => {
                const form = document.getElementById('categoryForm');
                const formData = new FormData(form);
                const overlay = document.querySelector(`[data-modal-id="${id}"]`);
                
                // Récupérer les IDs des catégories parentes
                const parentIds = document.getElementById('parentIds').value
                    .split(',')
                    .filter(Boolean)
                    .map(id => parseInt(id));
                
                // Récupérer les grades actifs
                const enabledGrades = [];
                document.querySelectorAll('#gradesList .condition-item input[type="checkbox"]:checked').forEach(cb => {
                    const item = cb.closest('.condition-item');
                    if (item) enabledGrades.push(parseInt(item.dataset.id));
                });
                
                // Vérifier si un nouveau fichier d'icône a été édité
                const iconHiddenInput = document.getElementById('catIcon');
                const iconEditorState = overlay?._iconEditorState;
                const pendingIconBlob = iconEditorState?.getPendingBlob();
                const hasNewIconFile = pendingIconBlob !== null;
                
                const categoryData = {
                    name: formData.get('name')?.trim(),
                    description: formData.get('description')?.trim(),
                    notes: formData.get('notes')?.trim(),
                    visible: formData.has('visible'),
                    parent_ids: parentIds,
                    grades: enabledGrades
                };
                
                // Gestion de l'icône
                if (hasNewIconFile) {
                    // Nouveau fichier édité - sera traité côté serveur
                    categoryData.icon = '__NEW_FILE__';
                } else if (iconHiddenInput && iconHiddenInput.value && iconHiddenInput.value !== '__NEW_FILE__') {
                    // Garder l'icône existante
                    categoryData.icon = iconHiddenInput.value;
                }
                // Si pas d'icône définie, le serveur mettra une valeur par défaut
                
                // Ajouter is_default si admin
                if (window.CategoriesPageData.isAdmin) {
                    categoryData.is_default = formData.has('is_default');
                    
                    // Récupérer les liens par défaut admin (si présents)
                    const adminDefaultIdsInput = document.getElementById('adminDefaultParentIds');
                    if (adminDefaultIdsInput && adminDefaultIdsInput.value) {
                        categoryData.default_parent_ids = adminDefaultIdsInput.value
                            .split(',')
                            .filter(Boolean)
                            .map(id => parseInt(id));
                    }
                }

                if (!categoryData.name) {
                    showToast(t.error_name_required, 'error');
                    return false;
                }

                try {
                    const url = modalData.isEdit 
                        ? `${config.apiEndpoint}?id=${modalData.category.id}` 
                        : config.apiEndpoint;
                    
                    let response;
                    
                    if (hasNewIconFile && pendingIconBlob) {
                        // Utiliser FormData pour l'upload du Blob édité
                        const uploadData = new FormData();
                        uploadData.append('icon_file', pendingIconBlob, 'icon.png');
                        uploadData.append('data', JSON.stringify(categoryData));
                        
                        response = await fetch(url, {
                            method: modalData.isEdit ? 'POST' : 'POST', // FormData ne supporte pas PUT
                            headers: modalData.isEdit ? { 'X-HTTP-Method-Override': 'PUT' } : {},
                            body: uploadData
                        });
                    } else {
                        // Pas de fichier, utiliser JSON classique
                        response = await fetch(url, {
                            method: modalData.isEdit ? 'PUT' : 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(categoryData)
                        });
                    }

                    const result = await response.json();

                    if (result.success) {
                        // Si création, associer les médias pending à la nouvelle catégorie
                        const categoryId = modalData.isEdit ? modalData.category.id : result.data?.id;
                        const mediaManagers = overlay?._mediaManagers;
                        
                        if (categoryId && mediaManagers) {
                            // Traiter les fichiers pending pour chaque type de média
                            for (const [mediaType, manager] of Object.entries(mediaManagers)) {
                                const pendingFiles = manager.getPendingFiles();
                                if (pendingFiles && pendingFiles.length > 0) {
                                    try {
                                        // Définir l'ID de la catégorie avant de finaliser
                                        manager.setEntityId(categoryId);
                                        await manager.finalizePendingFiles();
                                    } catch (mediaErr) {
                                        console.error(`Erreur commit médias ${mediaType}:`, mediaErr);
                                        // On continue même si certains médias échouent
                                    }
                                }
                            }
                        }
                        
                        showToast(modalData.isEdit ? t.updated_success : t.created_success, 'success');
                        loadCategories();
                        return true;
                    } else {
                        showToast(result.error?.message || 'Erreur', 'error');
                        return false;
                    }
                } catch (error) {
                    console.error('[Categories] Erreur sauvegarde:', error);
                    showToast('Erreur de connexion', 'error');
                    return false;
                }
            }
        });
    }

    // ========================================
    // Utilitaires
    // ========================================
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Génère le HTML pour afficher une icône de catégorie
     * Supporte les emojis (texte) et les images (URL storage/)
     * 
     * @param {string} icon - Emoji ou chemin vers l'image
     * @param {string} altText - Texte alternatif pour l'image
     * @param {string} className - Classe CSS additionnelle
     * @returns {string} HTML de l'icône
     */
    function renderCategoryIcon(icon, altText = '', className = '') {
        if (!icon) {
            // Icône par défaut (emoji dossier)
            return `<span class="category-icon-emoji ${className}">📁</span>`;
        }
        
        // Vérifier si c'est une URL d'image (commence par storage/ ou /storage/)
        if (icon.startsWith('storage/') || icon.startsWith('/storage/')) {
            // C'est une image - ajouter le slash initial si nécessaire et le cache-buster
            const imgSrc = icon.startsWith('/') ? icon : '/' + icon;
            const cacheBuster = Date.now(); // Simple cache-buster basé sur le timestamp
            return `<img src="${escapeHtml(imgSrc)}?v=${cacheBuster}" alt="${escapeHtml(altText)}" class="category-icon-img ${className}" loading="lazy" onerror="this.outerHTML='<span class=\\'category-icon-emoji ${className}\\'>📁</span>'">`;
        }
        
        // C'est un emoji ou du texte
        return `<span class="category-icon-emoji ${className}">${escapeHtml(icon)}</span>`;
    }

    /**
     * Crée un élément DOM pour l'icône de catégorie
     * 
     * @param {string} icon - Emoji ou chemin vers l'image
     * @param {string} altText - Texte alternatif
     * @returns {HTMLElement} Élément DOM de l'icône
     */
    function createCategoryIconElement(icon, altText = '') {
        const container = document.createElement('span');
        container.className = 'category-icon';
        container.innerHTML = renderCategoryIcon(icon, altText);
        return container;
    }

    function showToast(message, type = 'info') {
        if (typeof window.showToast === 'function') {
            window.showToast(message, type);
        } else {
            console.log(`[Toast ${type}] ${message}`);
        }
    }

    // ========================================
    // API publique
    // ========================================
    return {
        init: init,
        reload: loadCategories,
        openAddModal: function() { openCategoryModal(); }
    };

})();

// Ne pas initialiser automatiquement - le router s'en charge via onLoad
// L'initialisation se fait uniquement quand CategoriesPageData est disponible
