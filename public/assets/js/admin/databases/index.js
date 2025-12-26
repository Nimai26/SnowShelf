/**
 * SnowShelf - Admin Databases Module
 * Gestion des bases de données internes (VG_DB Platforms, etc.)
 */

import { showToast, showLoading, escapeHtml, formatDate, markActiveNavItem } from '/assets/js/admin/core/utils.js';

const DATABASES_API = '../api/admin/databases.php';
const PLATFORM_IMAGES_API = '/api/admin/platform-images.php';

// État local du module
let currentPage = 1;
let totalPages = 1;
let searchTimeout = null;
let manufacturers = [];
let fetchAbortController = null;
let isFetching = false;
let ModalManager = null;

// Références aux éléments DOM
let elements = {};

/**
 * Initialise les références aux éléments DOM
 */
function initElements() {
    elements = {
        // Tabs
        settingsTabs: document.querySelectorAll('#databasesSection .settings-tab'),
        settingsPanels: document.querySelectorAll('#databasesSection .settings-panel'),
        
        // Stats
        statTotal: document.getElementById('statTotal'),
        statWithLocalImages: document.getElementById('statWithLocalImages'),
        statWithExternalImages: document.getElementById('statWithExternalImages'),
        statWithoutImages: document.getElementById('statWithoutImages'),
        
        // Filters
        searchPlatforms: document.getElementById('searchPlatforms'),
        filterManufacturer: document.getElementById('filterManufacturer'),
        filterImages: document.getElementById('filterImages'),
        
        // Table
        platformsTableBody: document.getElementById('platformsTableBody'),
        platformsPagination: document.getElementById('platformsPagination'),
        
        // Buttons
        addPlatformBtn: document.getElementById('addPlatformBtn'),
        fetchAllImagesBtn: document.getElementById('fetchAllImagesBtn'),
        cancelFetchBtn: document.getElementById('cancelFetchBtn'),
        
        // Progress
        fetchProgressContainer: document.getElementById('fetchProgressContainer'),
        
        // Loading
        databasesLoading: document.getElementById('databasesLoading'),
        
        // Toast
        toastContainer: document.getElementById('toastContainer')
    };
}

/**
 * Change d'onglet
 * @param {string} tabId - ID de l'onglet
 */
function switchTab(tabId) {
    elements.settingsTabs.forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabId);
    });
    
    elements.settingsPanels.forEach(panel => {
        panel.classList.toggle('active', panel.id === `panel-${tabId}`);
    });
}

/**
 * Charge les statistiques
 */
export async function loadStats() {
    try {
        const response = await fetch(`${DATABASES_API}?table=platforms&action=stats`, {
            credentials: 'same-origin'
        });
        const result = await response.json();

        if (result.success) {
            const data = result.data;
            if (elements.statTotal) elements.statTotal.textContent = data.total || 0;
            if (elements.statWithLocalImages) elements.statWithLocalImages.textContent = data.with_console_images || 0;
            if (elements.statWithExternalImages) elements.statWithExternalImages.textContent = data.with_logo_images || 0;
            if (elements.statWithoutImages) elements.statWithoutImages.textContent = data.without_images || 0;
        }
    } catch (error) {
        console.error('[Databases] Load stats error:', error);
    }
}

/**
 * Charge les fabricants
 */
export async function loadManufacturers() {
    try {
        const response = await fetch(`${DATABASES_API}?table=platforms&action=manufacturers`, {
            credentials: 'same-origin'
        });
        const result = await response.json();

        if (result.success && elements.filterManufacturer) {
            manufacturers = result.data;
            
            // Garder la première option
            const firstOption = elements.filterManufacturer.options[0];
            elements.filterManufacturer.innerHTML = '';
            elements.filterManufacturer.appendChild(firstOption);
            
            // Ajouter les fabricants
            manufacturers.forEach(manufacturer => {
                const option = document.createElement('option');
                option.value = manufacturer;
                option.textContent = manufacturer;
                elements.filterManufacturer.appendChild(option);
            });
        }
    } catch (error) {
        console.error('[Databases] Load manufacturers error:', error);
    }
}

/**
 * Charge les plateformes
 */
export async function loadPlatforms() {
    showDatabasesLoading(true);
    
    try {
        const params = new URLSearchParams({
            table: 'platforms',
            action: 'list',
            page: currentPage,
            limit: 50
        });
        
        if (elements.searchPlatforms?.value) {
            params.append('search', elements.searchPlatforms.value);
        }
        
        if (elements.filterManufacturer?.value) {
            params.append('manufacturer', elements.filterManufacturer.value);
        }
        
        if (elements.filterImages?.value) {
            params.append('has_images', elements.filterImages.value);
        }
        
        const response = await fetch(`${DATABASES_API}?${params}`, {
            credentials: 'same-origin'
        });
        const result = await response.json();

        if (result.success) {
            renderPlatforms(result.data);
            renderPagination(result.pagination);
        } else {
            showToast(result.error || 'Erreur lors du chargement', 'error');
        }
    } catch (error) {
        console.error('[Databases] Load platforms error:', error);
        showToast('Erreur de connexion', 'error');
    } finally {
        showDatabasesLoading(false);
    }
}

/**
 * Affiche/cache l'indicateur de chargement
 * @param {boolean} show - Afficher ou non
 */
function showDatabasesLoading(show) {
    if (elements.databasesLoading) {
        elements.databasesLoading.classList.toggle('active', show);
    }
}

/**
 * Rend les plateformes dans le tableau
 * @param {Array} platforms - Liste des plateformes
 */
function renderPlatforms(platforms) {
    if (!elements.platformsTableBody) return;
    
    if (platforms.length === 0) {
        elements.platformsTableBody.innerHTML = `
            <tr>
                <td colspan="7" class="empty-state">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                        <line x1="8" y1="21" x2="16" y2="21"></line>
                        <line x1="12" y1="17" x2="12" y2="21"></line>
                    </svg>
                    <p>Aucune plateforme trouvée</p>
                </td>
            </tr>
        `;
        return;
    }

    elements.platformsTableBody.innerHTML = platforms.map(platform => {
        const hasLogo = !!platform.img_logo;
        const hasConsole = !!platform.img_console;
        const totalImages = platform.images_count || ((hasLogo ? 1 : 0) + (hasConsole ? 1 : 0));
        
        let imageHtml = '';
        if (platform.primary_image) {
            imageHtml = `<img src="${escapeHtml(platform.primary_image)}" alt="${escapeHtml(platform.name)}" class="platform-thumb" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'no-image\\'>?</div>'">`;
        } else {
            imageHtml = '<div class="no-image">?</div>';
        }
        
        return `
            <tr data-id="${platform.id}">
                <td class="col-id">${platform.id}</td>
                <td class="col-image">
                    <div class="image-cell">
                        ${imageHtml}
                    </div>
                </td>
                <td class="col-name">
                    <strong>${escapeHtml(platform.name)}</strong>
                    <div class="mobile-badges">
                        ${hasLogo ? '<span class="badge badge-success">Logo</span>' : ''}
                        ${hasConsole ? '<span class="badge badge-info">Console</span>' : ''}
                        ${totalImages === 0 ? '<span class="badge badge-warning">∅</span>' : ''}
                    </div>
                </td>
                <td class="col-manufacturer">
                    ${platform.manufacturer ? escapeHtml(platform.manufacturer) : '<span class="text-muted">-</span>'}
                </td>
                <td class="col-date">
                    ${platform.release_date ? formatDate(platform.release_date) : '<span class="text-muted">-</span>'}
                </td>
                <td class="col-images">
                    <div class="images-badges">
                        ${hasLogo ? '<span class="badge badge-success" title="Logo">Logo</span>' : ''}
                        ${hasConsole ? '<span class="badge badge-info" title="Image console">Console</span>' : ''}
                        ${totalImages === 0 ? '<span class="badge badge-warning">Aucune</span>' : ''}
                    </div>
                </td>
                <td class="col-actions">
                    <div class="actions-cell">
                        <button class="btn-icon" onclick="DatabasesPanel.editPlatform(${platform.id})" title="Modifier">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                        </button>
                        <button class="btn-icon btn-upload" onclick="DatabasesPanel.uploadImage(${platform.id})" title="Ajouter une image manuellement">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="17 8 12 3 7 8"></polyline>
                                <line x1="12" y1="3" x2="12" y2="15"></line>
                            </svg>
                        </button>
                        <button class="btn-icon btn-fetch" onclick="DatabasesPanel.fetchImages(${platform.id}, '${escapeHtml(platform.name).replace(/'/g, "\\'")}')" title="Rechercher images automatiquement">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        </button>
                        <button class="btn-icon danger" onclick="DatabasesPanel.deletePlatform(${platform.id}, '${escapeHtml(platform.name).replace(/'/g, "\\'")}')" title="Supprimer">
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
 * Rend la pagination
 * @param {Object} pagination - Données de pagination
 */
function renderPagination(pagination) {
    if (!elements.platformsPagination) return;
    
    totalPages = pagination.pages;
    currentPage = pagination.page;
    
    if (totalPages <= 1) {
        elements.platformsPagination.innerHTML = '';
        return;
    }
    
    let html = '<div class="pagination-info">';
    html += `Page ${currentPage} sur ${totalPages} (${pagination.total} résultats)`;
    html += '</div><div class="pagination-buttons">';
    
    // Bouton précédent
    html += `<button class="btn-page" ${currentPage === 1 ? 'disabled' : ''} onclick="DatabasesPanel.goToPage(${currentPage - 1})">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
    </button>`;
    
    // Pages
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);
    
    if (startPage > 1) {
        html += `<button class="btn-page" onclick="DatabasesPanel.goToPage(1)">1</button>`;
        if (startPage > 2) html += `<span class="page-ellipsis">...</span>`;
    }
    
    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="btn-page ${i === currentPage ? 'active' : ''}" onclick="DatabasesPanel.goToPage(${i})">${i}</button>`;
    }
    
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) html += `<span class="page-ellipsis">...</span>`;
        html += `<button class="btn-page" onclick="DatabasesPanel.goToPage(${totalPages})">${totalPages}</button>`;
    }
    
    // Bouton suivant
    html += `<button class="btn-page" ${currentPage === totalPages ? 'disabled' : ''} onclick="DatabasesPanel.goToPage(${currentPage + 1})">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
    </button>`;
    
    html += '</div>';
    elements.platformsPagination.innerHTML = html;
}

/**
 * Change de page
 * @param {number} page - Numéro de page
 */
export function goToPage(page) {
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    loadPlatforms();
}

/**
 * Ouvre le modal d'ajout de plateforme
 */
function openAddPlatformModal() {
    const content = `
        <form id="platformForm" class="admin-form">
            <input type="hidden" id="platformId" value="">
            
            <div class="form-group">
                <label for="platformName" class="required">Nom de la plateforme</label>
                <input type="text" id="platformName" name="name" required placeholder="Ex: PlayStation 5">
            </div>
            
            <div class="form-row-2">
                <div class="form-group">
                    <label for="platformManufacturer">Fabricant</label>
                    <input type="text" id="platformManufacturer" name="manufacturer" list="manufacturersList" placeholder="Ex: Sony">
                    <datalist id="manufacturersList">
                        ${manufacturers.map(m => `<option value="${escapeHtml(m)}">`).join('')}
                    </datalist>
                </div>
                <div class="form-group">
                    <label for="platformReleaseDate">Date de sortie</label>
                    <input type="date" id="platformReleaseDate" name="release_date">
                </div>
            </div>
            
            <div class="form-row-2">
                <div class="form-group">
                    <label for="platformCpu">CPU</label>
                    <input type="text" id="platformCpu" name="cpu" placeholder="Ex: AMD Zen 2, 8 cores">
                </div>
                <div class="form-group">
                    <label for="platformMemory">Mémoire</label>
                    <input type="text" id="platformMemory" name="memory" placeholder="Ex: 16 GB GDDR6">
                </div>
            </div>
            
            <div class="form-row-2">
                <div class="form-group">
                    <label for="platformGraphics">Graphiques</label>
                    <input type="text" id="platformGraphics" name="graphics" placeholder="Ex: AMD RDNA 2">
                </div>
                <div class="form-group">
                    <label for="platformMedia">Média</label>
                    <input type="text" id="platformMedia" name="media" placeholder="Ex: Blu-ray 4K, Digital">
                </div>
            </div>
            
            <div class="form-group">
                <label for="platformDescFr">Description (FR)</label>
                <textarea id="platformDescFr" name="desc_fr" rows="3" placeholder="Description en français..."></textarea>
            </div>
            
            <div class="form-group">
                <label for="platformDescEn">Description (EN)</label>
                <textarea id="platformDescEn" name="desc_en" rows="3" placeholder="Description in English..."></textarea>
            </div>
        </form>
    `;

    if (ModalManager) {
        ModalManager.open({
            title: 'Ajouter une plateforme',
            content: content,
            size: 'modal-lg',
            buttons: [
                { text: 'Annuler', action: 'close', class: 'btn-secondary' },
                { text: 'Créer', action: 'create', class: 'btn-primary' }
            ],
            onAction: async (action, modalId) => {
                if (action === 'create') {
                    await savePlatform(modalId, true);
                }
            }
        });
    }
}

/**
 * Ouvre le modal d'édition de plateforme
 * @param {number} id - ID de la plateforme
 */
export async function openEditPlatformModal(id) {
    showDatabasesLoading(true);
    
    try {
        const response = await fetch(`${DATABASES_API}?table=platforms&action=get&id=${id}`, {
            credentials: 'same-origin'
        });
        const result = await response.json();

        if (!result.success) {
            showToast(result.error || 'Erreur lors du chargement', 'error');
            return;
        }

        const platform = result.data;
        
        // Construire les images HTML
        let imagesHtml = '<div class="platform-images-section">';
        
        // Section Logo
        imagesHtml += `
            <div class="image-type-section">
                <h5>Logo</h5>
                <div class="platform-image-slot">
        `;
        if (platform.img_logo_url) {
            imagesHtml += `
                <div class="platform-image-item" data-type="logo">
                    <img src="${escapeHtml(platform.img_logo_url)}" alt="Logo" loading="lazy">
                    <button type="button" class="btn-remove-image" onclick="DatabasesPanel.removeImage(${id}, '${escapeHtml(platform.img_logo)}', 'logo')" title="Supprimer">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            `;
        } else {
            imagesHtml += `
                <div class="platform-image-empty" onclick="DatabasesPanel.openFileSelector(${id}, 'logo')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="12" y1="8" x2="12" y2="16"></line>
                        <line x1="8" y1="12" x2="16" y2="12"></line>
                    </svg>
                    <span>Ajouter un logo</span>
                </div>
            `;
        }
        imagesHtml += '</div></div>';
        
        // Section Console
        imagesHtml += `
            <div class="image-type-section">
                <h5>Image Console</h5>
                <div class="platform-image-slot">
        `;
        if (platform.img_console_url) {
            imagesHtml += `
                <div class="platform-image-item" data-type="console">
                    <img src="${escapeHtml(platform.img_console_url)}" alt="Console" loading="lazy">
                    <button type="button" class="btn-remove-image" onclick="DatabasesPanel.removeImage(${id}, '${escapeHtml(platform.img_console)}', 'console')" title="Supprimer">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            `;
        } else {
            imagesHtml += `
                <div class="platform-image-empty" onclick="DatabasesPanel.openFileSelector(${id}, 'console')">
                    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="12" y1="8" x2="12" y2="16"></line>
                        <line x1="8" y1="12" x2="16" y2="12"></line>
                    </svg>
                    <span>Ajouter une image</span>
                </div>
            `;
        }
        imagesHtml += '</div></div></div>';
        
        const content = `
            <form id="platformForm" class="admin-form">
                <input type="hidden" id="platformId" value="${platform.id}">
                
                <div class="form-section">
                    <h4>Images</h4>
                    ${imagesHtml}
                </div>
                
                <hr class="form-divider">
                
                <div class="form-group">
                    <label for="platformName" class="required">Nom de la plateforme</label>
                    <input type="text" id="platformName" name="name" required value="${escapeHtml(platform.name)}">
                </div>
                
                <div class="form-row-2">
                    <div class="form-group">
                        <label for="platformManufacturer">Fabricant</label>
                        <input type="text" id="platformManufacturer" name="manufacturer" list="manufacturersList" value="${escapeHtml(platform.manufacturer || '')}">
                        <datalist id="manufacturersList">
                            ${manufacturers.map(m => `<option value="${escapeHtml(m)}">`).join('')}
                        </datalist>
                    </div>
                    <div class="form-group">
                        <label for="platformReleaseDate">Date de sortie</label>
                        <input type="date" id="platformReleaseDate" name="release_date" value="${platform.release_date || ''}">
                    </div>
                </div>
                
                <div class="form-row-2">
                    <div class="form-group">
                        <label for="platformDeveloper">Développeur</label>
                        <input type="text" id="platformDeveloper" name="developer" value="${escapeHtml(platform.developer || '')}">
                    </div>
                    <div class="form-group">
                        <label for="platformMaxControllers">Max. Manettes</label>
                        <input type="number" id="platformMaxControllers" name="max_controllers" min="1" max="16" value="${platform.max_controllers || ''}">
                    </div>
                </div>
                
                <div class="form-row-2">
                    <div class="form-group">
                        <label for="platformCpu">CPU</label>
                        <input type="text" id="platformCpu" name="cpu" value="${escapeHtml(platform.cpu || '')}">
                    </div>
                    <div class="form-group">
                        <label for="platformMemory">Mémoire</label>
                        <input type="text" id="platformMemory" name="memory" value="${escapeHtml(platform.memory || '')}">
                    </div>
                </div>
                
                <div class="form-row-2">
                    <div class="form-group">
                        <label for="platformGraphics">Graphiques</label>
                        <input type="text" id="platformGraphics" name="graphics" value="${escapeHtml(platform.graphics || '')}">
                    </div>
                    <div class="form-group">
                        <label for="platformSound">Son</label>
                        <input type="text" id="platformSound" name="sound" value="${escapeHtml(platform.sound || '')}">
                    </div>
                </div>
                
                <div class="form-row-2">
                    <div class="form-group">
                        <label for="platformDisplay">Affichage</label>
                        <input type="text" id="platformDisplay" name="display" value="${escapeHtml(platform.display || '')}">
                    </div>
                    <div class="form-group">
                        <label for="platformMedia">Média</label>
                        <input type="text" id="platformMedia" name="media" value="${escapeHtml(platform.media || '')}">
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="platformDescFr">Description (FR)</label>
                    <textarea id="platformDescFr" name="desc_fr" rows="3">${escapeHtml(platform.desc_fr || '')}</textarea>
                </div>
                
                <div class="form-group">
                    <label for="platformDescEn">Description (EN)</label>
                    <textarea id="platformDescEn" name="desc_en" rows="3">${escapeHtml(platform.desc_en || '')}</textarea>
                </div>
            </form>
        `;

        if (ModalManager) {
            ModalManager.open({
                title: `Modifier : ${escapeHtml(platform.name)}`,
                content: content,
                size: 'modal-lg',
                buttons: [
                    { text: 'Annuler', action: 'close', class: 'btn-secondary' },
                    { text: 'Enregistrer', action: 'save', class: 'btn-primary' }
                ],
                onAction: async (action, modalId) => {
                    if (action === 'save') {
                        await savePlatform(modalId, false);
                    }
                }
            });
        }
    } catch (error) {
        console.error('[Databases] Edit platform error:', error);
        showToast('Erreur lors du chargement', 'error');
    } finally {
        showDatabasesLoading(false);
    }
}

/**
 * Sauvegarde une plateforme
 * @param {string} modalId - ID du modal
 * @param {boolean} isNew - Est-ce une nouvelle plateforme
 */
async function savePlatform(modalId, isNew) {
    const id = document.getElementById('platformId')?.value;
    
    const data = {
        name: document.getElementById('platformName')?.value?.trim(),
        manufacturer: document.getElementById('platformManufacturer')?.value?.trim() || null,
        release_date: document.getElementById('platformReleaseDate')?.value || null,
        developer: document.getElementById('platformDeveloper')?.value?.trim() || null,
        max_controllers: document.getElementById('platformMaxControllers')?.value || null,
        cpu: document.getElementById('platformCpu')?.value?.trim() || null,
        memory: document.getElementById('platformMemory')?.value?.trim() || null,
        graphics: document.getElementById('platformGraphics')?.value?.trim() || null,
        sound: document.getElementById('platformSound')?.value?.trim() || null,
        display: document.getElementById('platformDisplay')?.value?.trim() || null,
        media: document.getElementById('platformMedia')?.value?.trim() || null,
        desc_fr: document.getElementById('platformDescFr')?.value?.trim() || null,
        desc_en: document.getElementById('platformDescEn')?.value?.trim() || null
    };

    if (!data.name) {
        showToast('Le nom est requis', 'error');
        return;
    }

    try {
        const url = isNew 
            ? `${DATABASES_API}?table=platforms&action=create`
            : `${DATABASES_API}?table=platforms&id=${id}`;
        
        const response = await fetch(url, {
            method: isNew ? 'POST' : 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            credentials: 'same-origin'
        });

        const result = await response.json();

        if (result.success) {
            showToast(isNew ? 'Plateforme créée' : 'Plateforme mise à jour', 'success');
            ModalManager.close(modalId);
            loadStats();
            loadPlatforms();
            if (isNew) loadManufacturers();
        } else {
            showToast(result.error || 'Erreur lors de la sauvegarde', 'error');
        }
    } catch (error) {
        console.error('[Databases] Save platform error:', error);
        showToast('Erreur de connexion', 'error');
    }
}

/**
 * Supprime une plateforme
 * @param {number} id - ID de la plateforme
 * @param {string} name - Nom de la plateforme
 */
export async function deletePlatform(id, name) {
    const confirmed = await ModalManager.confirm(
        `<p>Êtes-vous sûr de vouloir supprimer la plateforme <strong>${escapeHtml(name)}</strong> ?</p>
         <p class="text-warning">Cette action supprimera également toutes les images associées.</p>`,
        {
            title: 'Supprimer la plateforme',
            type: 'danger',
            confirmText: 'Supprimer',
            cancelText: 'Annuler'
        }
    );

    if (!confirmed) return;

    try {
        const response = await fetch(`${DATABASES_API}?table=platforms&id=${id}`, {
            method: 'DELETE',
            credentials: 'same-origin'
        });

        const result = await response.json();

        if (result.success) {
            showToast('Plateforme supprimée', 'success');
            loadStats();
            loadPlatforms();
        } else {
            showToast(result.error || 'Erreur lors de la suppression', 'error');
        }
    } catch (error) {
        console.error('[Databases] Delete platform error:', error);
        showToast('Erreur de connexion', 'error');
    }
}

/**
 * Upload d'image
 * @param {number} id - ID de la plateforme
 */
export function uploadImage(id) {
    const content = `
        <div class="image-type-selector">
            <p>Quel type d'image souhaitez-vous ajouter ?</p>
            <div class="image-type-buttons">
                <button type="button" class="btn btn-primary image-type-btn" data-type="logo">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                    Logo
                </button>
                <button type="button" class="btn btn-secondary image-type-btn" data-type="console">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                        <line x1="8" y1="21" x2="16" y2="21"></line>
                        <line x1="12" y1="17" x2="12" y2="21"></line>
                    </svg>
                    Console
                </button>
            </div>
        </div>
    `;
    
    ModalManager.open({
        title: 'Ajouter une image',
        content: content,
        size: 'modal-sm',
        buttons: [
            { text: 'Annuler', action: 'close', class: 'btn-secondary' }
        ],
        onOpen: (modalId) => {
            const modal = document.querySelector(`[data-modal-id="${modalId}"]`) || document.querySelector('.modal.active');
            if (modal) {
                modal.querySelectorAll('.image-type-btn').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const type = btn.dataset.type;
                        ModalManager.close(modalId);
                        openFileSelector(id, type);
                    });
                });
            }
        }
    });
}

/**
 * Ouvre le sélecteur de fichier
 * @param {number} id - ID de la plateforme
 * @param {string} imageType - Type d'image (logo ou console)
 */
export function openFileSelector(id, imageType) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => handleImageUpload(id, e.target, imageType);
    input.click();
}

/**
 * Gère l'upload d'image
 * @param {number} id - ID de la plateforme
 * @param {HTMLInputElement} input - Input file
 * @param {string} imageType - Type d'image
 */
export async function handleImageUpload(id, input, imageType = 'console') {
    const file = input.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);
    formData.append('image_type', imageType);

    showDatabasesLoading(true);

    try {
        const response = await fetch(`${DATABASES_API}?table=platforms&action=upload_image&id=${id}`, {
            method: 'POST',
            body: formData,
            credentials: 'same-origin'
        });

        const result = await response.json();

        if (result.success) {
            showToast('Image ajoutée', 'success');
            loadStats();
            loadPlatforms();
            
            const modalId = ModalManager.getCurrentModalId?.();
            if (modalId) {
                ModalManager.close(modalId);
                setTimeout(() => openEditPlatformModal(id), 300);
            }
        } else {
            showToast(result.error || 'Erreur lors de l\'upload', 'error');
        }
    } catch (error) {
        console.error('[Databases] Upload image error:', error);
        showToast('Erreur de connexion', 'error');
    } finally {
        showDatabasesLoading(false);
    }
}

/**
 * Supprime une image
 * @param {number} id - ID de la plateforme
 * @param {string} filename - Nom du fichier
 * @param {string} imageType - Type d'image
 */
export async function removeImage(id, filename, imageType) {
    const typeLabel = imageType === 'logo' ? 'le logo' : 'l\'image console';
    const confirmed = await ModalManager.confirm(
        `Êtes-vous sûr de vouloir supprimer ${typeLabel} ?`,
        {
            title: 'Supprimer l\'image',
            type: 'danger',
            confirmText: 'Supprimer',
            cancelText: 'Annuler'
        }
    );

    if (!confirmed) return;

    try {
        const response = await fetch(`${DATABASES_API}?table=platforms&action=image&id=${id}&filename=${encodeURIComponent(filename)}&image_type=${imageType}`, {
            method: 'DELETE',
            credentials: 'same-origin'
        });

        const result = await response.json();

        if (result.success) {
            showToast('Image supprimée', 'success');
            loadStats();
            loadPlatforms();
            
            const modalId = ModalManager.getCurrentModalId?.();
            if (modalId) {
                ModalManager.close(modalId);
                setTimeout(() => openEditPlatformModal(id), 300);
            }
        } else {
            showToast(result.error || 'Erreur lors de la suppression', 'error');
        }
    } catch (error) {
        console.error('[Databases] Remove image error:', error);
        showToast('Erreur de connexion', 'error');
    }
}

/**
 * Récupère les images pour une seule plateforme
 * @param {number} platformId - ID de la plateforme
 * @param {string} platformName - Nom de la plateforme
 */
export async function fetchSinglePlatformImages(platformId, platformName) {
    const confirmed = await ModalManager.confirm(
        `Rechercher automatiquement les images pour "${platformName}" ?`,
        { 
            type: 'info',
            confirmText: 'Rechercher',
            cancelText: 'Annuler'
        }
    );
    
    if (!confirmed) return;
    
    showToast('Recherche en cours...', 'info');
    
    try {
        const response = await fetch(`${PLATFORM_IMAGES_API}?action=fetch`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ platform_id: platformId, overwrite: false })
        });
        
        const result = await response.json();
        
        if (result.success) {
            const logoMsg = result.logo ? (result.logo.skipped ? 'existant' : 'trouvé') : 'non trouvé';
            const consoleMsg = result.console ? (result.console.skipped ? 'existante' : 'trouvée') : 'non trouvée';
            
            showToast(`Logo: ${logoMsg}, Console: ${consoleMsg}`, 'success');
            loadPlatforms();
            loadStats();
        } else {
            showToast(result.error || 'Erreur', 'error');
        }
    } catch (e) {
        showToast('Erreur: ' + e.message, 'error');
    }
}

/**
 * Annule la récupération en cours
 */
function cancelFetch() {
    if (fetchAbortController) {
        fetchAbortController.abort();
    }
}

/**
 * Attache les événements
 */
function bindEvents() {
    // Tabs navigation
    elements.settingsTabs.forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });
    
    // Search with debounce
    if (elements.searchPlatforms) {
        elements.searchPlatforms.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                currentPage = 1;
                loadPlatforms();
            }, 300);
        });
    }
    
    // Filters
    if (elements.filterManufacturer) {
        elements.filterManufacturer.addEventListener('change', () => {
            currentPage = 1;
            loadPlatforms();
        });
    }
    
    if (elements.filterImages) {
        elements.filterImages.addEventListener('change', () => {
            currentPage = 1;
            loadPlatforms();
        });
    }
    
    // Add platform button
    if (elements.addPlatformBtn) {
        elements.addPlatformBtn.addEventListener('click', openAddPlatformModal);
    }
    
    // Cancel fetch button
    if (elements.cancelFetchBtn) {
        elements.cancelFetchBtn.addEventListener('click', cancelFetch);
    }
}

/**
 * Initialise le module Databases
 * @param {Object} modalManager - Instance du ModalManager
 */
export function init(modalManager) {
    ModalManager = modalManager;
    
    initElements();
    
    if (!elements.platformsTableBody) {
        console.log('[Databases] Not on databases section');
        return;
    }
    
    markActiveNavItem('databases');
    bindEvents();
    loadStats();
    loadManufacturers();
    loadPlatforms();
    
    console.log('[Databases] Initialized');
}

/**
 * API publique exposée globalement
 */
window.DatabasesPanel = {
    editPlatform: openEditPlatformModal,
    deletePlatform: deletePlatform,
    uploadImage: uploadImage,
    openFileSelector: openFileSelector,
    handleImageUpload: handleImageUpload,
    removeImage: removeImage,
    goToPage: goToPage,
    fetchImages: fetchSinglePlatformImages
};

// Export par défaut
export default {
    init,
    loadStats,
    loadManufacturers,
    loadPlatforms,
    goToPage,
    openEditPlatformModal,
    deletePlatform,
    uploadImage,
    removeImage,
    fetchSinglePlatformImages
};
