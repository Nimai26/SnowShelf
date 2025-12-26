/**
 * SnowShelf - Collection Module
 * dropdowns/base.js - Logique de base des dropdowns personnalisés
 */

import { getTranslations } from '../state.js';
import { renderMdiIcon } from '../utils.js';

/**
 * Crée un dropdown personnalisé générique
 * @param {HTMLSelectElement} select - Le select natif à transformer
 * @param {Array} options - Options [{value, text, color?, icon?, group?}]
 * @param {string|null} selectedValue - Valeur sélectionnée
 * @param {Function} onChange - Callback au changement
 * @returns {HTMLElement} Le wrapper dropdown
 */
export function createCustomDropdown(select, options, selectedValue, onChange) {
    const t = getTranslations();
    
    // Chercher un dropdown existant ou créer le wrapper
    let dropdown = select.parentElement;
    if (!dropdown.classList.contains('custom-dropdown')) {
        dropdown = document.createElement('div');
        dropdown.className = 'custom-dropdown';
        select.parentNode.insertBefore(dropdown, select);
        dropdown.appendChild(select);
    }
    
    // Supprimer l'ancien menu du body s'il existe
    if (dropdown.dataset.menuId) {
        const oldMenu = document.querySelector(`.custom-dropdown-menu[data-dropdown-id="${dropdown.dataset.menuId}"]`);
        if (oldMenu) oldMenu.remove();
    }
    
    // Supprimer l'ancien contenu (sauf le select)
    Array.from(dropdown.children).forEach(child => {
        if (child !== select) child.remove();
    });
    
    // Trouver l'option sélectionnée
    const selectedOption = options.find(opt => opt.value == selectedValue) || options[0];
    
    // Créer le bouton trigger
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'custom-dropdown-trigger';
    trigger.innerHTML = `
        <span class="custom-dropdown-color" style="background-color: ${selectedOption?.color || 'transparent'}; ${selectedOption?.color ? '' : 'display: none;'}"></span>
        <span class="custom-dropdown-text">${selectedOption?.text || t.no_status || 'Non défini'}</span>
        <svg class="custom-dropdown-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6,9 12,15 18,9"></polyline>
        </svg>
    `;
    dropdown.insertBefore(trigger, select);
    
    // Créer le menu déroulant - ATTACHÉ AU BODY pour éviter les problèmes de positionnement
    const menu = document.createElement('div');
    menu.className = 'custom-dropdown-menu';
    menu.dataset.dropdownId = 'dropdown-' + Date.now();
    dropdown.dataset.menuId = menu.dataset.dropdownId;
    document.body.appendChild(menu);
    
    // Grouper les options
    const groups = {};
    options.forEach(opt => {
        const groupKey = opt.group || '__default__';
        if (!groups[groupKey]) groups[groupKey] = [];
        groups[groupKey].push(opt);
    });
    
    // Construire le menu
    Object.entries(groups).forEach(([groupName, groupOptions]) => {
        const groupEl = document.createElement('div');
        groupEl.className = 'custom-dropdown-group';
        
        // Ajouter le label du groupe si ce n'est pas le groupe par défaut
        if (groupName !== '__default__') {
            const labelEl = document.createElement('div');
            labelEl.className = 'custom-dropdown-group-label';
            labelEl.textContent = groupName;
            groupEl.appendChild(labelEl);
        }
        
        // Ajouter les options du groupe
        groupOptions.forEach(opt => {
            const optionEl = document.createElement('div');
            optionEl.className = 'custom-dropdown-option';
            if (opt.value === '' || opt.value === null) {
                optionEl.classList.add('empty-option');
            }
            if (opt.value == selectedValue || (selectedValue === null && opt.value === '')) {
                optionEl.classList.add('selected');
            }
            optionEl.dataset.value = opt.value;
            optionEl.dataset.color = opt.color || '';
            
            optionEl.innerHTML = `
                ${opt.color ? `<span class="custom-dropdown-option-color" style="background-color: ${opt.color}"></span>` : ''}
                <span class="custom-dropdown-option-text">${opt.text}</span>
                <svg class="custom-dropdown-option-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <polyline points="20,6 9,17 4,12"></polyline>
                </svg>
            `;
            
            optionEl.addEventListener('click', () => {
                // Mettre à jour la sélection visuelle
                menu.querySelectorAll('.custom-dropdown-option').forEach(el => el.classList.remove('selected'));
                optionEl.classList.add('selected');
                
                // Mettre à jour le trigger
                const colorEl = trigger.querySelector('.custom-dropdown-color');
                const textEl = trigger.querySelector('.custom-dropdown-text');
                colorEl.style.backgroundColor = opt.color || 'transparent';
                colorEl.style.display = opt.color ? '' : 'none';
                textEl.textContent = opt.text;
                
                // Mettre à jour le select natif
                select.value = opt.value;
                
                // Fermer le menu
                closeDropdown();
                
                // Callback
                if (onChange) onChange(opt.value, opt);
            });
            
            groupEl.appendChild(optionEl);
        });
        
        menu.appendChild(groupEl);
    });
    
    /**
     * Positionne le menu de façon fixe
     */
    function positionMenu() {
        const rect = trigger.getBoundingClientRect();
        const menuHeight = menu.offsetHeight || 200;
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        
        let top = rect.bottom + 4;
        let left = rect.left;
        const width = rect.width;
        
        // Vérifier si le menu sort en bas de l'écran
        if (top + menuHeight > viewportHeight - 10) {
            top = rect.top - menuHeight - 4;
            menu.classList.add('dropdown-above');
        } else {
            menu.classList.remove('dropdown-above');
        }
        
        // S'assurer que le menu reste dans l'écran
        if (left < 10) left = 10;
        if (left + width > viewportWidth - 10) left = viewportWidth - width - 10;
        if (top < 10) top = 10;
        
        menu.style.top = top + 'px';
        menu.style.left = left + 'px';
        menu.style.width = Math.max(width, 150) + 'px';
    }
    
    function closeDropdown() {
        dropdown.classList.remove('open');
        menu.classList.remove('open');
    }
    
    function openDropdown() {
        // Fermer tous les autres dropdowns ouverts
        document.querySelectorAll('.custom-dropdown.open').forEach(d => d.classList.remove('open'));
        document.querySelectorAll('.custom-dropdown-menu.open').forEach(m => m.classList.remove('open'));
        
        positionMenu();
        dropdown.classList.add('open');
        menu.classList.add('open');
    }
    
    // Gestion de l'ouverture/fermeture
    trigger.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (dropdown.classList.contains('open')) {
            closeDropdown();
        } else {
            openDropdown();
        }
    });
    
    // Fermer au clic extérieur
    const closeHandler = (e) => {
        if (!dropdown.contains(e.target)) {
            closeDropdown();
        }
    };
    
    if (dropdown._closeHandler) {
        document.removeEventListener('click', dropdown._closeHandler);
    }
    dropdown._closeHandler = closeHandler;
    document.addEventListener('click', closeHandler);
    
    // Fermer avec Echap
    const escHandler = (e) => {
        if (e.key === 'Escape' && dropdown.classList.contains('open')) {
            closeDropdown();
            e.stopPropagation();
        }
    };
    if (dropdown._escHandler) {
        document.removeEventListener('keydown', dropdown._escHandler);
    }
    dropdown._escHandler = escHandler;
    document.addEventListener('keydown', escHandler);
    
    return dropdown;
}

/**
 * Crée un dropdown pour les types primaires (avec icônes)
 * @param {HTMLSelectElement} select - Le select natif à transformer
 * @param {Array} options - Options [{value, text, color, icon}]
 * @param {string|null} selectedValue - Valeur sélectionnée
 * @returns {HTMLElement} Le wrapper dropdown
 */
export function createPrimaryTypeDropdown(select, options, selectedValue) {
    const t = getTranslations();
    
    let dropdown = select.parentElement;
    if (!dropdown.classList.contains('custom-dropdown')) {
        dropdown = document.createElement('div');
        dropdown.className = 'custom-dropdown primary-type-dropdown';
        select.parentNode.insertBefore(dropdown, select);
        dropdown.appendChild(select);
    } else {
        dropdown.classList.add('primary-type-dropdown');
    }
    
    // Supprimer l'ancien menu
    if (dropdown.dataset.menuId) {
        const oldMenu = document.querySelector(`.custom-dropdown-menu[data-dropdown-id="${dropdown.dataset.menuId}"]`);
        if (oldMenu) oldMenu.remove();
    }
    
    Array.from(dropdown.children).forEach(child => {
        if (child !== select) child.remove();
    });
    
    const selectedOption = options.find(opt => opt.value == selectedValue) || options[0];
    
    // Créer le trigger avec support icône
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'custom-dropdown-trigger';
    trigger.innerHTML = `
        ${selectedOption?.icon ? `<span class="custom-dropdown-icon">${renderMdiIcon(selectedOption.icon)}</span>` : ''}
        <span class="custom-dropdown-color" style="background-color: ${selectedOption?.color || 'transparent'}; ${selectedOption?.color ? '' : 'display: none;'}"></span>
        <span class="custom-dropdown-text">${selectedOption?.text || (t.no_primary_type || 'Non défini')}</span>
        <svg class="custom-dropdown-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6,9 12,15 18,9"></polyline>
        </svg>
    `;
    dropdown.insertBefore(trigger, select);
    
    // Menu
    const menu = document.createElement('div');
    menu.className = 'custom-dropdown-menu';
    menu.dataset.dropdownId = 'primary-type-' + Date.now();
    dropdown.dataset.menuId = menu.dataset.dropdownId;
    document.body.appendChild(menu);
    
    // Options
    options.forEach(opt => {
        const optionEl = document.createElement('div');
        optionEl.className = 'custom-dropdown-option';
        if (opt.value === '' || opt.value === null) optionEl.classList.add('empty-option');
        if (opt.value == selectedValue || (selectedValue === null && opt.value === '')) optionEl.classList.add('selected');
        optionEl.dataset.value = opt.value;
        
        optionEl.innerHTML = `
            ${opt.icon ? `<span class="custom-dropdown-option-icon">${renderMdiIcon(opt.icon)}</span>` : ''}
            ${opt.color ? `<span class="custom-dropdown-option-color" style="background-color: ${opt.color}"></span>` : ''}
            <span class="custom-dropdown-option-text">${opt.text}</span>
            <svg class="custom-dropdown-option-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="20,6 9,17 4,12"></polyline>
            </svg>
        `;
        
        optionEl.addEventListener('click', () => {
            menu.querySelectorAll('.custom-dropdown-option').forEach(el => el.classList.remove('selected'));
            optionEl.classList.add('selected');
            
            // Mise à jour trigger
            let iconEl = trigger.querySelector('.custom-dropdown-icon');
            const colorEl = trigger.querySelector('.custom-dropdown-color');
            const textEl = trigger.querySelector('.custom-dropdown-text');
            
            if (opt.icon) {
                if (iconEl) {
                    iconEl.innerHTML = renderMdiIcon(opt.icon);
                    iconEl.style.display = '';
                } else {
                    iconEl = document.createElement('span');
                    iconEl.className = 'custom-dropdown-icon';
                    iconEl.innerHTML = renderMdiIcon(opt.icon);
                    trigger.insertBefore(iconEl, trigger.firstChild);
                }
            } else if (iconEl) {
                iconEl.style.display = 'none';
            }
            
            colorEl.style.backgroundColor = opt.color || 'transparent';
            colorEl.style.display = opt.color ? '' : 'none';
            textEl.textContent = opt.text;
            
            select.value = opt.value;
            select.dispatchEvent(new Event('change', { bubbles: true }));
            
            closeDropdown();
        });
        
        menu.appendChild(optionEl);
    });
    
    function positionMenu() {
        const rect = trigger.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        
        menu.style.visibility = 'hidden';
        menu.style.display = 'block';
        const menuHeight = menu.offsetHeight;
        menu.style.visibility = '';
        menu.style.display = '';
        
        const spaceBelow = viewportHeight - rect.bottom - 10;
        let top = spaceBelow >= menuHeight ? rect.bottom + 4 : rect.top - menuHeight - 4;
        
        if (top < 10) top = 10;
        if (top + menuHeight > viewportHeight - 10) top = viewportHeight - menuHeight - 10;
        
        menu.style.position = 'fixed';
        menu.style.top = top + 'px';
        menu.style.left = rect.left + 'px';
        menu.style.width = rect.width + 'px';
    }
    
    function closeDropdown() {
        dropdown.classList.remove('open');
        menu.classList.remove('open');
    }
    
    function openDropdown() {
        document.querySelectorAll('.custom-dropdown.open').forEach(d => d.classList.remove('open'));
        document.querySelectorAll('.custom-dropdown-menu.open').forEach(m => m.classList.remove('open'));
        positionMenu();
        dropdown.classList.add('open');
        menu.classList.add('open');
    }
    
    trigger.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropdown.classList.contains('open') ? closeDropdown() : openDropdown();
    });
    
    const closeHandler = (e) => {
        if (!dropdown.contains(e.target) && !menu.contains(e.target)) closeDropdown();
    };
    if (dropdown._closeHandler) document.removeEventListener('click', dropdown._closeHandler);
    dropdown._closeHandler = closeHandler;
    document.addEventListener('click', closeHandler);
    
    const escHandler = (e) => {
        if (e.key === 'Escape' && dropdown.classList.contains('open')) {
            closeDropdown();
            e.stopPropagation();
        }
    };
    if (dropdown._escHandler) document.removeEventListener('keydown', dropdown._escHandler);
    dropdown._escHandler = escHandler;
    document.addEventListener('keydown', escHandler);
    
    return dropdown;
}

/**
 * Détruit tous les dropdowns personnalisés et nettoie les écouteurs
 */
export function destroyAllDropdowns() {
    // Supprimer les menus attachés au body
    document.querySelectorAll('.dropdown-menu-body-attached').forEach(menu => {
        menu.remove();
    });
    
    // Nettoyer les dropdowns dans la page
    document.querySelectorAll('.custom-dropdown').forEach(dropdown => {
        if (dropdown._closeHandler) {
            document.removeEventListener('click', dropdown._closeHandler);
        }
        if (dropdown._escHandler) {
            document.removeEventListener('keydown', dropdown._escHandler);
        }
    });
}
