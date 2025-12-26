/**
 * SnowShelf - Collection Module
 * filters.js - Gestion des filtres et du tri
 */

import { state, elements, getTranslations } from './state.js';
import { escapeHtml, formatCurrency } from './utils.js';

/**
 * Vérifie si des filtres sont actifs
 * @returns {boolean} True si au moins un filtre est actif
 */
export function hasActiveFilters() {
    return Object.values(state.filters).some(v => v !== null && v !== '' && v !== 0);
}

/**
 * Compte le nombre de filtres actifs
 * @returns {number} Nombre de filtres actifs
 */
export function countActiveFilters() {
    return Object.values(state.filters).filter(v => v !== null && v !== '' && v !== 0).length;
}

/**
 * Ouvre le panneau des filtres
 */
export function openFiltersPanel() {
    if (!elements.filtersPanel || !elements.filtersOverlay) return;
    
    elements.filtersPanel.classList.add('open');
    elements.filtersOverlay.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    // Mettre à jour les valeurs dans le panel
    if (elements.filterCategory) {
        elements.filterCategory.value = state.filters.category_id || '';
    }
    if (elements.filterRating) {
        elements.filterRating.value = state.filters.min_rating || 0;
    }
    if (elements.filterRatingValue) {
        elements.filterRatingValue.textContent = state.filters.min_rating ? `${state.filters.min_rating}+` : '0+';
    }
    if (elements.filterValueMin) {
        elements.filterValueMin.value = state.filters.min_value || '';
    }
    if (elements.filterValueMax) {
        elements.filterValueMax.value = state.filters.max_value || '';
    }
    if (elements.filterDateFrom) {
        elements.filterDateFrom.value = state.filters.date_from || '';
    }
    if (elements.filterDateTo) {
        elements.filterDateTo.value = state.filters.date_to || '';
    }
    if (elements.filterStatus) {
        elements.filterStatus.value = state.filters.status_id !== null ? state.filters.status_id : '';
    }
}

/**
 * Ferme le panneau des filtres
 */
export function closeFiltersPanel() {
    if (!elements.filtersPanel || !elements.filtersOverlay) return;
    
    elements.filtersPanel.classList.remove('open');
    elements.filtersOverlay.classList.remove('show');
    document.body.style.overflow = '';
}

/**
 * Réinitialise les filtres dans l'UI
 */
export function resetFiltersUI() {
    state.filters = {
        category_id: null,
        min_rating: null,
        min_value: null,
        max_value: null,
        date_from: null,
        date_to: null,
        status_id: null
    };
    
    if (elements.filterCategory) elements.filterCategory.value = '';
    if (elements.filterRating) elements.filterRating.value = 0;
    if (elements.filterRatingValue) elements.filterRatingValue.textContent = '0+';
    if (elements.filterValueMin) elements.filterValueMin.value = '';
    if (elements.filterValueMax) elements.filterValueMax.value = '';
    if (elements.filterDateFrom) elements.filterDateFrom.value = '';
    if (elements.filterDateTo) elements.filterDateTo.value = '';
    if (elements.filterStatus) elements.filterStatus.value = '';
}

/**
 * Applique les filtres depuis l'UI vers l'état
 */
export function applyFiltersFromUI() {
    state.filters.category_id = elements.filterCategory?.value || null;
    state.filters.min_rating = parseFloat(elements.filterRating?.value) || null;
    state.filters.min_value = parseFloat(elements.filterValueMin?.value) || null;
    state.filters.max_value = parseFloat(elements.filterValueMax?.value) || null;
    state.filters.date_from = elements.filterDateFrom?.value || null;
    state.filters.date_to = elements.filterDateTo?.value || null;
    state.filters.status_id = elements.filterStatus?.value ? parseInt(elements.filterStatus.value) : null;
}

/**
 * Met à jour l'UI des filtres actifs (badge et tags)
 * @param {Function} resetAndLoad - Fonction pour recharger les items
 */
export function updateActiveFiltersUI(resetAndLoad) {
    const count = countActiveFilters();
    const t = getTranslations();
    
    // Badge
    if (elements.filterBadge) {
        if (count > 0) {
            elements.filterBadge.textContent = count;
            elements.filterBadge.style.display = 'flex';
        } else {
            elements.filterBadge.style.display = 'none';
        }
    }
    
    // Tags des filtres actifs
    if (!elements.activeFilters) return;
    
    if (count > 0 || state.search) {
        elements.activeFilters.style.display = 'flex';
        elements.activeFilters.innerHTML = '';
        
        // Tag de recherche
        if (state.search) {
            elements.activeFilters.appendChild(createFilterTag(
                `"${state.search}"`,
                () => {
                    if (elements.searchItems) {
                        elements.searchItems.value = '';
                    }
                    if (elements.clearSearch) {
                        elements.clearSearch.style.display = 'none';
                    }
                    state.search = '';
                    resetAndLoad();
                }
            ));
        }
        
        // Tag catégorie
        if (state.filters.category_id) {
            const cat = state.categories.find(c => c.id == state.filters.category_id);
            elements.activeFilters.appendChild(createFilterTag(
                cat?.name || 'Catégorie',
                () => { 
                    state.filters.category_id = null; 
                    updateActiveFiltersUI(resetAndLoad); 
                    resetAndLoad(); 
                }
            ));
        }
        
        // Tag note minimum
        if (state.filters.min_rating) {
            elements.activeFilters.appendChild(createFilterTag(
                `★ ${state.filters.min_rating}+`,
                () => { 
                    state.filters.min_rating = null; 
                    updateActiveFiltersUI(resetAndLoad); 
                    resetAndLoad(); 
                }
            ));
        }
        
        // Tag valeur
        if (state.filters.min_value || state.filters.max_value) {
            const label = state.filters.min_value && state.filters.max_value
                ? `${formatCurrency(state.filters.min_value)} - ${formatCurrency(state.filters.max_value)}`
                : state.filters.min_value
                    ? `≥ ${formatCurrency(state.filters.min_value)}`
                    : `≤ ${formatCurrency(state.filters.max_value)}`;
            elements.activeFilters.appendChild(createFilterTag(
                label,
                () => { 
                    state.filters.min_value = null; 
                    state.filters.max_value = null; 
                    updateActiveFiltersUI(resetAndLoad); 
                    resetAndLoad(); 
                }
            ));
        }
        
        // Tag date
        if (state.filters.date_from || state.filters.date_to) {
            const label = state.filters.date_from && state.filters.date_to
                ? `${state.filters.date_from} → ${state.filters.date_to}`
                : state.filters.date_from
                    ? `Depuis ${state.filters.date_from}`
                    : `Jusqu'au ${state.filters.date_to}`;
            elements.activeFilters.appendChild(createFilterTag(
                label,
                () => { 
                    state.filters.date_from = null; 
                    state.filters.date_to = null; 
                    updateActiveFiltersUI(resetAndLoad); 
                    resetAndLoad(); 
                }
            ));
        }
        
        // Tag statut
        if (state.filters.status_id) {
            const status = state.statuses.find(s => s.id == state.filters.status_id);
            elements.activeFilters.appendChild(createFilterTag(
                status?.name || 'Statut',
                () => { 
                    state.filters.status_id = null; 
                    updateActiveFiltersUI(resetAndLoad); 
                    resetAndLoad(); 
                }
            ));
        }
    } else {
        elements.activeFilters.style.display = 'none';
    }
}

/**
 * Crée un tag de filtre
 * @param {string} text - Texte du tag
 * @param {Function} onRemove - Callback lors de la suppression
 * @returns {HTMLElement} Élément tag
 */
export function createFilterTag(text, onRemove) {
    const tag = document.createElement('span');
    tag.className = 'filter-tag';
    tag.innerHTML = `
        ${escapeHtml(text)}
        <button type="button">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
    `;
    tag.querySelector('button').addEventListener('click', (e) => {
        e.stopPropagation();
        onRemove();
    });
    return tag;
}

/**
 * Met à jour l'UI du tri
 */
export function updateSortUI() {
    elements.sortMenu?.querySelectorAll('.dropdown-item').forEach(item => {
        const isActive = item.dataset.sort === state.sort && item.dataset.order === state.order;
        item.classList.toggle('active', isActive);
    });
}

/**
 * Peuple le filtre de catégories
 */
export function populateCategoryFilter() {
    if (!elements.filterCategory) return;
    
    const t = getTranslations();
    
    // Conserver l'option "Toutes"
    const allOption = elements.filterCategory.querySelector('option[value=""]');
    elements.filterCategory.innerHTML = '';
    if (allOption) elements.filterCategory.appendChild(allOption);
    
    // Grouper par type (perso vs défaut)
    const personalCats = state.categories.filter(c => c.type === 'perso');
    const defaultCats = state.categories.filter(c => c.type === 'default');
    
    if (personalCats.length > 0) {
        const group = document.createElement('optgroup');
        group.label = t.personal_categories || 'Mes catégories';
        personalCats.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.id;
            opt.textContent = cat.name;
            group.appendChild(opt);
        });
        elements.filterCategory.appendChild(group);
    }
    
    if (defaultCats.length > 0) {
        const group = document.createElement('optgroup');
        group.label = t.default_categories || 'Catégories par défaut';
        defaultCats.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.id;
            opt.textContent = cat.name;
            group.appendChild(opt);
        });
        elements.filterCategory.appendChild(group);
    }
}

/**
 * Peuple le filtre de statuts
 * @param {Function} createCustomDropdown - Fonction pour créer un dropdown personnalisé
 * @param {Function} applyFilters - Fonction pour appliquer les filtres
 */
export function populateStatusFilter(createCustomDropdown, applyFilters) {
    if (!elements.filterStatus) return;
    
    const t = getTranslations();
    const currentValue = elements.filterStatus.value;
    
    // Construire la liste des options pour le dropdown custom
    const options = [];
    
    // Option "Tous les statuts"
    options.push({
        value: '',
        text: t.all_statuses || 'Tous les statuts',
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
    
    // Statuts par défaut
    if (defaultStatuses.length > 0) {
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
    elements.filterStatus.innerHTML = '';
    const emptyOpt = document.createElement('option');
    emptyOpt.value = '';
    emptyOpt.textContent = t.all_statuses || 'Tous les statuts';
    elements.filterStatus.appendChild(emptyOpt);
    
    if (personalStatuses.length > 0) {
        const group = document.createElement('optgroup');
        group.label = t.status_section_personal || 'Mes statuts';
        personalStatuses.forEach(status => {
            const opt = document.createElement('option');
            opt.value = status.id;
            opt.textContent = status.name;
            group.appendChild(opt);
        });
        elements.filterStatus.appendChild(group);
    }
    
    if (defaultStatuses.length > 0) {
        const group = document.createElement('optgroup');
        group.label = t.status_section_defaults || 'Statuts par défaut';
        defaultStatuses.forEach(status => {
            const opt = document.createElement('option');
            opt.value = status.id;
            opt.textContent = status.name;
            group.appendChild(opt);
        });
        elements.filterStatus.appendChild(group);
    }
    
    // Restaurer la valeur précédente si elle existe
    if (currentValue && elements.filterStatus.querySelector(`option[value="${currentValue}"]`)) {
        elements.filterStatus.value = currentValue;
    }
    
    // Créer le dropdown personnalisé avec callback pour recharger les items
    if (createCustomDropdown) {
        createCustomDropdown(elements.filterStatus, options, currentValue || '', (value) => {
            applyFilters();
        });
    }
}
