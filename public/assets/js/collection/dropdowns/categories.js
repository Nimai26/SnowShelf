/**
 * SnowShelf - Collection Module
 * dropdowns/categories.js - Sélecteur de catégories avec checkboxes
 */

import { state, getTranslations } from '../state.js';
import { escapeHtml } from '../utils.js';

/**
 * Crée un composant de sélection multiple de catégories avec checkboxes
 * @param {HTMLSelectElement} select - Le select natif (caché, utilisé pour la soumission)
 * @param {Array} selectedCategories - Les catégories déjà sélectionnées [{id, name}]
 * @param {Object} options - Options de configuration
 */
export function createCategoriesSelector(select, selectedCategories, options = {}) {
    const t = getTranslations();
    const wrapper = select.closest('.categories-select-wrapper');
    if (!wrapper) return;
    
    const selectedIds = new Set(selectedCategories.map(c => c.id.toString()));
    const showDefaults = options.showDefaults !== false;
    const autoSelectParents = options.autoSelectParents !== false;
    
    // Supprimer l'ancien composant custom s'il existe
    const existingDropdown = wrapper.querySelector('.categories-dropdown');
    if (existingDropdown) existingDropdown.remove();
    
    // Supprimer l'ancien menu du body s'il existe
    if (wrapper.dataset.menuId) {
        const oldMenu = document.querySelector(`.categories-dropdown-menu[data-dropdown-id="${wrapper.dataset.menuId}"]`);
        if (oldMenu) oldMenu.remove();
    }
    
    // Créer le dropdown
    const dropdown = document.createElement('div');
    dropdown.className = 'categories-dropdown';
    
    // Créer le bouton trigger
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'categories-dropdown-trigger';
    updateTriggerText(trigger, selectedIds.size);
    dropdown.appendChild(trigger);
    
    // Créer le menu (attaché au body pour éviter les problèmes d'overflow)
    const menu = document.createElement('div');
    menu.className = 'categories-dropdown-menu';
    const menuId = 'cat-menu-' + Date.now();
    menu.dataset.dropdownId = menuId;
    wrapper.dataset.menuId = menuId;
    
    // Construire le contenu du menu
    buildCategoriesMenu(menu, selectedIds, showDefaults, autoSelectParents);
    
    document.body.appendChild(menu);
    wrapper.insertBefore(dropdown, select);
    
    /**
     * Met à jour le texte du trigger
     */
    function updateTriggerText(btn, count) {
        if (count === 0) {
            btn.innerHTML = `
                <span class="categories-dropdown-text">${t.select_categories || 'Sélectionner des catégories...'}</span>
                <svg class="categories-dropdown-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6,9 12,15 18,9"></polyline>
                </svg>
            `;
        } else {
            const text = (t.categories_selected || '{count} catégorie(s) sélectionnée(s)').replace('{count}', count);
            btn.innerHTML = `
                <span class="categories-dropdown-text">${text}</span>
                <svg class="categories-dropdown-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6,9 12,15 18,9"></polyline>
                </svg>
            `;
        }
    }
    
    /**
     * Construit le menu avec les catégories
     */
    function buildCategoriesMenu(menuEl, selected, showDef, autoParents) {
        menuEl.innerHTML = '';
        
        const personalCats = state.categories.filter(c => c.type === 'perso' || c.type === 'public');
        const defaultCats = state.categories.filter(c => c.type === 'default');
        
        // Catégories personnelles
        if (personalCats.length > 0) {
            const group = document.createElement('div');
            group.className = 'categories-dropdown-group';
            group.innerHTML = `<div class="categories-dropdown-group-label">${t.personal_categories || 'Mes catégories'}</div>`;
            
            personalCats.forEach(cat => {
                group.appendChild(createCategoryOption(cat, selected));
            });
            
            menuEl.appendChild(group);
        }
        
        // Catégories par défaut
        if (showDef && defaultCats.length > 0) {
            const group = document.createElement('div');
            group.className = 'categories-dropdown-group';
            group.innerHTML = `<div class="categories-dropdown-group-label">${t.default_categories || 'Catégories par défaut'}</div>`;
            
            defaultCats.forEach(cat => {
                group.appendChild(createCategoryOption(cat, selected));
            });
            
            menuEl.appendChild(group);
        }
        
        // Message si aucune catégorie
        if (personalCats.length === 0 && (!showDef || defaultCats.length === 0)) {
            menuEl.innerHTML = `<div class="categories-dropdown-empty">${t.no_categories || 'Aucune catégorie disponible'}</div>`;
        }
    }
    
    /**
     * Crée une option de catégorie avec checkbox
     */
    function createCategoryOption(cat, selected) {
        const option = document.createElement('label');
        option.className = 'categories-dropdown-option';
        option.dataset.categoryId = cat.id;
        option.dataset.parentIds = JSON.stringify(cat.parent_ids || []);
        
        const isChecked = selected.has(cat.id.toString());
        
        // Déterminer l'icône : si c'est un chemin d'image, afficher une img, sinon emoji
        let iconHtml;
        if (cat.icon && (cat.icon.includes('/') || cat.icon.includes('.'))) {
            const iconPath = cat.icon.startsWith('/') ? cat.icon : '/' + cat.icon;
            iconHtml = `<img src="${iconPath}" alt="" class="categories-option-icon">`;
        } else {
            iconHtml = `<span class="categories-option-icon">${cat.icon || '📁'}</span>`;
        }
        
        option.innerHTML = `
            <input type="checkbox" value="${cat.id}" ${isChecked ? 'checked' : ''}>
            ${iconHtml}
            <span class="categories-option-name">${escapeHtml(cat.name)}</span>
        `;
        
        const checkbox = option.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', (e) => {
            handleCategoryChange(cat, e.target.checked);
        });
        
        return option;
    }
    
    /**
     * Gère le changement d'état d'une catégorie
     */
    function handleCategoryChange(cat, isChecked) {
        if (isChecked) {
            selectedIds.add(cat.id.toString());
            
            // Auto-sélection des parents si activée
            const toggleAutoParents = wrapper.closest('.form-group')?.querySelector('#toggleAutoSelectParents');
            if (toggleAutoParents?.checked && cat.parent_ids && cat.parent_ids.length > 0) {
                selectParentsRecursively(cat.parent_ids);
            }
        } else {
            selectedIds.delete(cat.id.toString());
        }
        
        // Mettre à jour le select natif
        updateNativeSelect();
        // Mettre à jour le texte du trigger
        updateTriggerText(trigger, selectedIds.size);
    }
    
    /**
     * Sélectionne récursivement les catégories parentes
     */
    function selectParentsRecursively(parentIds) {
        parentIds.forEach(parentId => {
            const parentIdStr = parentId.toString();
            if (!selectedIds.has(parentIdStr)) {
                selectedIds.add(parentIdStr);
                
                // Cocher visuellement la checkbox
                const parentOption = menu.querySelector(`.categories-dropdown-option[data-category-id="${parentId}"] input`);
                if (parentOption) parentOption.checked = true;
                
                // Récursion sur les parents du parent
                const parentCat = state.categories.find(c => c.id === parentId);
                if (parentCat?.parent_ids?.length > 0) {
                    selectParentsRecursively(parentCat.parent_ids);
                }
            }
        });
    }
    
    /**
     * Met à jour le select natif avec les valeurs sélectionnées
     */
    function updateNativeSelect() {
        select.innerHTML = '';
        selectedIds.forEach(id => {
            const opt = document.createElement('option');
            opt.value = id;
            opt.selected = true;
            select.appendChild(opt);
        });
        
        // Déclencher un événement change pour notifier les autres composants
        select.dispatchEvent(new Event('change', { bubbles: true }));
    }
    
    /**
     * Positionne le menu
     */
    function positionMenu() {
        const rect = trigger.getBoundingClientRect();
        menu.style.position = 'fixed';
        menu.style.top = (rect.bottom + 4) + 'px';
        menu.style.left = rect.left + 'px';
        menu.style.width = rect.width + 'px';
    }
    
    /**
     * Ouvre le dropdown
     */
    function openDropdown() {
        // Fermer les autres dropdowns
        document.querySelectorAll('.categories-dropdown.open').forEach(d => d.classList.remove('open'));
        document.querySelectorAll('.categories-dropdown-menu.open').forEach(m => m.classList.remove('open'));
        
        positionMenu();
        dropdown.classList.add('open');
        menu.classList.add('open');
    }
    
    /**
     * Ferme le dropdown
     */
    function closeDropdown() {
        dropdown.classList.remove('open');
        menu.classList.remove('open');
    }
    
    // Événements
    trigger.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (dropdown.classList.contains('open')) {
            closeDropdown();
        } else {
            openDropdown();
        }
    });
    
    // Fermer au clic extérieur (mais pas sur le menu lui-même)
    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target) && !menu.contains(e.target)) {
            closeDropdown();
        }
    });
    
    // Fermer avec Échap
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && dropdown.classList.contains('open')) {
            closeDropdown();
            e.stopPropagation();
        }
    });
    
    // Écouter les changements des toggles
    const toggleDefaults = wrapper.closest('.form-group')?.querySelector('#toggleDefaultCategories');
    if (toggleDefaults) {
        toggleDefaults.addEventListener('change', () => {
            buildCategoriesMenu(menu, selectedIds, toggleDefaults.checked, true);
        });
    }
    
    // Initialiser le select natif
    updateNativeSelect();
    
    return {
        getSelectedIds: () => Array.from(selectedIds),
        refresh: (showDef) => buildCategoriesMenu(menu, selectedIds, showDef, true),
        close: closeDropdown
    };
}

/**
 * Remplit le select des catégories (ancienne version pour compatibilité filtre)
 * @param {HTMLSelectElement} select - Le select à peupler
 * @param {Array} selectedCategories - Catégories sélectionnées
 */
export function populateItemCategoriesSelect(select, selectedCategories) {
    const t = getTranslations();
    select.innerHTML = '';
    
    const selectedIds = selectedCategories.map(c => c.id.toString());
    
    // Option vide
    const emptyOpt = document.createElement('option');
    emptyOpt.value = '';
    emptyOpt.textContent = t.all_categories || 'Toutes les catégories';
    select.appendChild(emptyOpt);
    
    // Catégories personnelles
    const personalCats = state.categories.filter(c => c.type === 'perso' || c.type === 'public');
    if (personalCats.length > 0) {
        const group = document.createElement('optgroup');
        group.label = t.personal_categories || 'Mes catégories';
        personalCats.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.id;
            opt.textContent = (cat.icon ? cat.icon + ' ' : '') + cat.name;
            if (selectedIds.includes(cat.id.toString())) opt.selected = true;
            group.appendChild(opt);
        });
        select.appendChild(group);
    }
    
    // Catégories par défaut
    const defaultCats = state.categories.filter(c => c.type === 'default');
    if (defaultCats.length > 0) {
        const group = document.createElement('optgroup');
        group.label = t.default_categories || 'Catégories par défaut';
        defaultCats.forEach(cat => {
            const opt = document.createElement('option');
            opt.value = cat.id;
            opt.textContent = (cat.icon ? cat.icon + ' ' : '') + cat.name;
            if (selectedIds.includes(cat.id.toString())) opt.selected = true;
            group.appendChild(opt);
        });
        select.appendChild(group);
    }
}
