/**
 * SnowShelf - Admin Custom Dropdown
 * Gestion des dropdowns personnalisés
 */

import { renderIcon } from '/assets/js/admin/core/utils.js';

/**
 * Ferme tous les dropdowns ouverts
 */
export function closeAllDropdowns() {
    document.querySelectorAll('.custom-dropdown.open').forEach(d => {
        d.classList.remove('open');
        d.querySelector('.custom-dropdown-menu')?.classList.remove('open');
    });
}

/**
 * Positionne le menu dropdown
 * @param {HTMLElement} trigger - Élément déclencheur
 * @param {HTMLElement} menu - Menu dropdown
 */
export function positionDropdownMenu(trigger, menu) {
    const rect = trigger.getBoundingClientRect();
    const menuHeight = menu.scrollHeight || 280;
    const viewportHeight = window.innerHeight;
    
    // Calculer si le menu doit s'ouvrir vers le haut ou le bas
    const spaceBelow = viewportHeight - rect.bottom;
    const openUpward = spaceBelow < menuHeight && rect.top > menuHeight;
    
    menu.style.position = 'fixed';
    menu.style.left = `${rect.left}px`;
    menu.style.width = `${rect.width}px`;
    menu.style.zIndex = '99999';
    
    if (openUpward) {
        menu.style.top = 'auto';
        menu.style.bottom = `${viewportHeight - rect.top + 4}px`;
    } else {
        menu.style.top = `${rect.bottom + 4}px`;
        menu.style.bottom = 'auto';
    }
}

/**
 * Initialise un custom dropdown dans un modal
 * @param {string} dropdownId - ID du conteneur .custom-dropdown
 * @param {string} selectId - ID du select caché
 */
export function initModalCustomDropdown(dropdownId, selectId) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) return;
    
    // Si désactivé, ne pas initialiser les événements
    if (dropdown.classList.contains('disabled')) return;
    
    // Éviter la double initialisation - nettoyer les anciens listeners
    if (dropdown._modalInitialized) {
        // Supprimer l'ancien close handler si existe
        if (dropdown._closeHandler) {
            document.removeEventListener('click', dropdown._closeHandler, true);
        }
    }
    dropdown._modalInitialized = true;

    const trigger = dropdown.querySelector('.custom-dropdown-trigger');
    const menu = dropdown.querySelector('.custom-dropdown-menu');
    const select = document.getElementById(selectId);
    
    // Stocker la référence originale
    const originalParent = menu.parentNode;
    
    // Fonction pour positionner le menu
    const positionMenu = () => {
        const rect = trigger.getBoundingClientRect();
        menu.style.position = 'fixed';
        menu.style.top = `${rect.bottom + 4}px`;
        menu.style.left = `${rect.left}px`;
        menu.style.width = `${rect.width}px`;
        menu.style.zIndex = '999999';
    };

    // Click sur le trigger
    trigger.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (trigger.disabled) return;
        
        const isOpen = dropdown.classList.contains('open');
        closeAllDropdowns();
        
        if (!isOpen) {
            // Déplacer le menu dans le body
            document.body.appendChild(menu);
            dropdown.classList.add('open');
            menu.classList.add('open');
            positionMenu();
        }
    });

    // Click sur une option (délégation d'événements)
    menu.addEventListener('click', (e) => {
        const option = e.target.closest('.custom-dropdown-option');
        if (!option) return;
        
        const value = option.dataset.value;
        const icon = option.dataset.icon || '📋';
        const text = option.querySelector('.custom-dropdown-option-text').textContent;

        // Mettre à jour le select natif
        select.value = value;
        
        // Trigger l'événement change
        select.dispatchEvent(new Event('change', { bubbles: true }));

        // Mettre à jour le trigger - utiliser renderIcon pour supporter MDI
        const iconContainer = trigger.querySelector('.custom-dropdown-icon, .mdi');
        if (iconContainer) {
            const newIconHtml = renderIcon(icon, 'custom-dropdown-icon');
            iconContainer.outerHTML = newIconHtml;
        }
        trigger.querySelector('.custom-dropdown-text').textContent = text;

        // Mettre à jour la sélection visuelle dans le menu
        menu.querySelectorAll('.custom-dropdown-option').forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');

        // Fermer le menu et le remettre dans le dropdown
        dropdown.classList.remove('open');
        menu.classList.remove('open');
        originalParent.appendChild(menu);
    });

    // Fermer quand on clique ailleurs (utilise capture pour fonctionner dans les modals)
    const closeHandler = (e) => {
        if (!dropdown.contains(e.target) && !menu.contains(e.target)) {
            dropdown.classList.remove('open');
            menu.classList.remove('open');
            // Remettre le menu dans le dropdown
            if (menu.parentNode === document.body) {
                originalParent.appendChild(menu);
            }
        }
    };
    document.addEventListener('click', closeHandler, true);
    
    // Stocker le handler pour pouvoir le retirer si nécessaire
    dropdown._closeHandler = closeHandler;
}

/**
 * Initialise un custom dropdown pour les filtres (hors modal)
 * @param {string} dropdownId - ID du conteneur .custom-dropdown
 * @param {string} selectId - ID du select caché
 * @param {Function} onChangeCallback - Fonction appelée lors du changement
 */
export function initFilterDropdown(dropdownId, selectId, onChangeCallback) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) {
        console.warn(`[Dropdown] Container #${dropdownId} not found`);
        return;
    }
    
    // Éviter la double initialisation
    if (dropdown._initialized) return;
    dropdown._initialized = true;

    const trigger = dropdown.querySelector('.custom-dropdown-trigger');
    const menu = dropdown.querySelector('.custom-dropdown-menu');
    const select = document.getElementById(selectId);
    
    if (!trigger || !menu) {
        console.warn(`[Dropdown] Trigger or menu not found in #${dropdownId}`);
        return;
    }
    
    // Fonction pour positionner le menu
    const positionMenu = () => {
        const rect = trigger.getBoundingClientRect();
        menu.style.position = 'fixed';
        menu.style.top = `${rect.bottom + 4}px`;
        menu.style.left = `${rect.left}px`;
        menu.style.width = `${rect.width}px`;
        menu.style.zIndex = '99999';
    };

    // Click sur le trigger
    trigger.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const isOpen = dropdown.classList.contains('open');
        closeAllDropdowns();
        
        if (!isOpen) {
            dropdown.classList.add('open');
            menu.classList.add('open');
            positionMenu();
        }
    });

    // Delegation pour les clicks sur les options
    menu.addEventListener('click', (e) => {
        const option = e.target.closest('.custom-dropdown-option');
        if (!option) return;
        
        const value = option.dataset.value;
        const icon = option.dataset.icon || '📋';
        const text = option.querySelector('.custom-dropdown-option-text').textContent;

        // Mettre à jour le select natif
        select.value = value;

        // Mettre à jour le trigger - utiliser renderIcon pour supporter MDI
        const iconContainer = trigger.querySelector('.custom-dropdown-icon, .mdi');
        if (iconContainer) {
            const newIconHtml = renderIcon(icon, 'custom-dropdown-icon');
            iconContainer.outerHTML = newIconHtml;
        }
        trigger.querySelector('.custom-dropdown-text').textContent = text;

        // Mettre à jour la sélection visuelle
        menu.querySelectorAll('.custom-dropdown-option').forEach(opt => opt.classList.remove('selected'));
        option.classList.add('selected');

        // Fermer le menu
        dropdown.classList.remove('open');
        menu.classList.remove('open');
        
        // Appeler le callback
        if (typeof onChangeCallback === 'function') {
            onChangeCallback();
        }
    });

    // Fermer quand on clique ailleurs
    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target)) {
            dropdown.classList.remove('open');
            menu.classList.remove('open');
        }
    });
}

/**
 * Met à jour l'affichage d'un dropdown avec la valeur actuelle
 * @param {string} dropdownId - ID du dropdown
 * @param {string} value - Valeur à sélectionner
 */
export function updateDropdownValue(dropdownId, value) {
    const dropdown = document.getElementById(dropdownId);
    if (!dropdown) return;

    const trigger = dropdown.querySelector('.custom-dropdown-trigger');
    const menu = dropdown.querySelector('.custom-dropdown-menu');
    const select = dropdown.querySelector('select');
    const options = menu.querySelectorAll('.custom-dropdown-option');

    // Mettre à jour le select natif
    if (select) {
        select.value = value || '';
    }

    // Trouver l'option correspondante
    let foundOption = null;
    options.forEach(opt => {
        opt.classList.remove('selected');
        if (opt.dataset.value === (value || '')) {
            opt.classList.add('selected');
            foundOption = opt;
        }
    });

    // Mettre à jour le trigger
    if (foundOption && trigger) {
        const iconEl = trigger.querySelector('.custom-dropdown-icon');
        const textEl = trigger.querySelector('.custom-dropdown-text');
        
        if (iconEl) {
            iconEl.textContent = foundOption.dataset.icon || '📋';
        }
        if (textEl) {
            textEl.textContent = foundOption.querySelector('.custom-dropdown-option-text')?.textContent || '';
        }
    }
}
