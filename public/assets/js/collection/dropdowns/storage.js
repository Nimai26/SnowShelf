/**
 * SnowShelf - Collection Module
 * dropdowns/storage.js - Sélecteur d'emplacement de stockage
 */

import { getTranslations } from '../state.js';
import { renderMdiIcon } from '../utils.js';
import { loadStorageLocations, createStorageLocation } from '../api.js';
import { showToast, showError } from '../ui/feedback.js';

/**
 * Cache local pour les emplacements de stockage
 */
let storageLocationsCache = null;

/**
 * Invalide le cache des emplacements de stockage
 */
export function invalidateStorageCache() {
    storageLocationsCache = null;
}

/**
 * Charge les emplacements de stockage (avec cache)
 * @returns {Promise<Array>} Liste des emplacements
 */
async function getStorageLocations() {
    if (storageLocationsCache !== null) return storageLocationsCache;
    storageLocationsCache = await loadStorageLocations();
    return storageLocationsCache;
}

/**
 * Popule le select des emplacements de stockage avec un dropdown personnalisé
 * @param {HTMLSelectElement} select - Le select à peupler
 * @param {string|number|null} selectedLocationId - ID de l'emplacement sélectionné
 */
export async function populateStorageLocationSelect(select, selectedLocationId = null) {
    const t = getTranslations();
    
    // Charger les emplacements de stockage
    const locations = await getStorageLocations();
    
    // Vider le select natif
    select.innerHTML = '';
    
    // Option vide
    const emptyOpt = document.createElement('option');
    emptyOpt.value = '';
    emptyOpt.textContent = t.no_storage_location || 'Non défini';
    select.appendChild(emptyOpt);
    
    // Ajouter les emplacements au select natif
    locations.forEach(loc => {
        const opt = document.createElement('option');
        opt.value = loc.id;
        opt.textContent = loc.name;
        if (selectedLocationId !== null && loc.id == selectedLocationId) {
            opt.selected = true;
        }
        select.appendChild(opt);
    });
    
    // Construire les options pour le dropdown custom
    const options = [
        { value: '', text: t.no_storage_location || 'Non défini', icon: '' }
    ];
    
    locations.forEach(loc => {
        options.push({
            value: loc.id,
            text: loc.name,
            description: loc.description || '',
            icon: '📦'
        });
    });
    
    // Créer le dropdown personnalisé
    createStorageLocationDropdown(select, options, selectedLocationId);
}

/**
 * Crée un dropdown personnalisé pour le sélecteur d'emplacement de stockage
 * @param {HTMLSelectElement} select - Le select natif
 * @param {Array} options - Options [{value, text, description?, icon?}]
 * @param {string|number|null} selectedValue - Valeur sélectionnée
 */
function createStorageLocationDropdown(select, options, selectedValue) {
    const t = getTranslations();
    
    // Wrapper parent
    let wrapper = select.parentElement;
    
    // Supprimer l'ancien dropdown custom s'il existe
    const existingDropdown = wrapper.querySelector('.custom-dropdown.storage-dropdown');
    if (existingDropdown) existingDropdown.remove();
    
    // Supprimer l'ancien menu du body
    if (wrapper.dataset.storageMenuId) {
        const oldMenu = document.querySelector(`.custom-dropdown-menu[data-dropdown-id="${wrapper.dataset.storageMenuId}"]`);
        if (oldMenu) oldMenu.remove();
    }
    
    // Cacher le select natif
    select.style.display = 'none';
    
    // Trouver l'option sélectionnée
    const selectedOption = options.find(opt => opt.value == selectedValue) || options[0];
    
    // Créer le dropdown
    const dropdown = document.createElement('div');
    dropdown.className = 'custom-dropdown storage-dropdown';
    
    // Créer le bouton trigger
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'custom-dropdown-trigger';
    trigger.innerHTML = `
        ${selectedOption?.icon ? `<span class="custom-dropdown-icon">${renderMdiIcon(selectedOption.icon)}</span>` : ''}
        <span class="custom-dropdown-text">${selectedOption?.text || (t.no_storage_location || 'Non défini')}</span>
        <svg class="custom-dropdown-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6,9 12,15 18,9"></polyline>
        </svg>
    `;
    dropdown.appendChild(trigger);
    
    // Créer le menu attaché au body
    const menu = document.createElement('div');
    menu.className = 'custom-dropdown-menu';
    const menuId = 'storage-menu-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    menu.dataset.dropdownId = menuId;
    wrapper.dataset.storageMenuId = menuId;
    document.body.appendChild(menu);
    
    // Construire les options du menu
    options.forEach(opt => {
        const optionEl = document.createElement('div');
        optionEl.className = 'custom-dropdown-option';
        if (opt.value === '' || opt.value === null) {
            optionEl.classList.add('empty-option');
        }
        if (opt.value == selectedValue || (selectedValue === null && opt.value === '')) {
            optionEl.classList.add('selected');
        }
        optionEl.dataset.value = opt.value;
        
        optionEl.innerHTML = `
            ${opt.icon ? `<span class="custom-dropdown-option-icon">${renderMdiIcon(opt.icon)}</span>` : ''}
            <span class="custom-dropdown-option-text">${opt.text}</span>
            ${opt.description ? `<span class="custom-dropdown-option-desc">${opt.description}</span>` : ''}
            <svg class="custom-dropdown-option-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="20,6 9,17 4,12"></polyline>
            </svg>
        `;
        
        optionEl.addEventListener('click', () => {
            // Mettre à jour la sélection visuelle
            menu.querySelectorAll('.custom-dropdown-option').forEach(el => el.classList.remove('selected'));
            optionEl.classList.add('selected');
            
            // Mettre à jour le trigger
            const iconEl = trigger.querySelector('.custom-dropdown-icon');
            const textEl = trigger.querySelector('.custom-dropdown-text');
            
            if (opt.icon) {
                if (iconEl) {
                    iconEl.innerHTML = renderMdiIcon(opt.icon);
                    iconEl.style.display = '';
                } else {
                    const newIconEl = document.createElement('span');
                    newIconEl.className = 'custom-dropdown-icon';
                    newIconEl.innerHTML = renderMdiIcon(opt.icon);
                    trigger.insertBefore(newIconEl, trigger.firstChild);
                }
            } else if (iconEl) {
                iconEl.style.display = 'none';
            }
            
            textEl.textContent = opt.text;
            
            // Mettre à jour le select natif
            select.value = opt.value;
            select.dispatchEvent(new Event('change', { bubbles: true }));
            
            // Fermer le menu
            closeDropdown();
        });
        
        menu.appendChild(optionEl);
    });
    
    // Ajouter un séparateur et le bouton d'ajout
    const separator = document.createElement('div');
    separator.className = 'custom-dropdown-separator';
    menu.appendChild(separator);
    
    const addOptionEl = document.createElement('div');
    addOptionEl.className = 'custom-dropdown-option add-option';
    addOptionEl.innerHTML = `
        <span class="custom-dropdown-option-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
        </span>
        <span class="custom-dropdown-option-text">${t.add_storage_location || 'Ajouter un emplacement'}</span>
    `;
    addOptionEl.addEventListener('click', (e) => {
        e.stopPropagation();
        closeDropdown();
        openAddStorageLocationModal(select);
    });
    menu.appendChild(addOptionEl);
    
    // Insérer le dropdown
    wrapper.insertBefore(dropdown, select);
    
    /**
     * Positionne le menu avec gestion haut/bas
     */
    function positionMenu() {
        const rect = trigger.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        
        // Rendre le menu temporairement visible pour mesurer sa hauteur
        menu.style.visibility = 'hidden';
        menu.style.display = 'block';
        const menuHeight = menu.offsetHeight;
        menu.style.visibility = '';
        menu.style.display = '';
        
        const spaceBelow = viewportHeight - rect.bottom - 10;
        const spaceAbove = rect.top - 10;
        
        let top, openDirection;
        if (spaceBelow >= menuHeight || spaceBelow >= spaceAbove) {
            // Ouvrir vers le bas
            top = rect.bottom + 4;
            openDirection = 'down';
        } else {
            // Ouvrir vers le haut - positionner juste au-dessus du trigger
            top = rect.top - menuHeight - 4;
            openDirection = 'up';
        }
        
        // S'assurer que le menu ne sort pas de l'écran
        if (top < 10) top = 10;
        if (top + menuHeight > viewportHeight - 10) {
            top = viewportHeight - menuHeight - 10;
        }
        
        menu.style.position = 'fixed';
        menu.style.top = top + 'px';
        menu.style.left = rect.left + 'px';
        menu.style.width = rect.width + 'px';
        menu.dataset.direction = openDirection;
    }
    
    function closeDropdown() {
        dropdown.classList.remove('open');
        menu.classList.remove('open');
    }
    
    function openDropdown() {
        // Fermer les autres dropdowns
        document.querySelectorAll('.custom-dropdown.open').forEach(d => d.classList.remove('open'));
        document.querySelectorAll('.custom-dropdown-menu.open').forEach(m => m.classList.remove('open'));
        
        positionMenu();
        dropdown.classList.add('open');
        menu.classList.add('open');
    }
    
    // Gestion ouverture/fermeture
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
        if (!dropdown.contains(e.target) && !menu.contains(e.target)) {
            closeDropdown();
        }
    };
    if (dropdown._closeHandler) document.removeEventListener('click', dropdown._closeHandler);
    dropdown._closeHandler = closeHandler;
    document.addEventListener('click', closeHandler);
    
    // Fermer avec Escape
    const escHandler = (e) => {
        if (e.key === 'Escape' && dropdown.classList.contains('open')) {
            closeDropdown();
            e.stopPropagation();
        }
    };
    if (dropdown._escHandler) document.removeEventListener('keydown', dropdown._escHandler);
    dropdown._escHandler = escHandler;
    document.addEventListener('keydown', escHandler);
    
    // Repositionner au scroll/resize
    window.addEventListener('scroll', () => {
        if (dropdown.classList.contains('open')) {
            positionMenu();
        }
    }, true);
    
    window.addEventListener('resize', () => {
        if (dropdown.classList.contains('open')) {
            positionMenu();
        }
    });
}

/**
 * Ouvre le modal pour ajouter un nouvel emplacement de stockage
 * @param {HTMLSelectElement} selectToUpdate - Le select à mettre à jour après création
 */
function openAddStorageLocationModal(selectToUpdate) {
    const t = getTranslations();
    
    const content = `
        <form id="addStorageLocationForm">
            <div class="form-group">
                <label for="storageLocationName">${t.field_name || 'Nom'} <span class="required">*</span></label>
                <input type="text" id="storageLocationName" class="form-control" required 
                       placeholder="${t.storage_location_name_placeholder || 'Ex: Étagère salon, Boîte grenier...'}">
            </div>
            <div class="form-group">
                <label for="storageLocationDesc">${t.field_description || 'Description'}</label>
                <textarea id="storageLocationDesc" class="form-control" rows="2"
                          placeholder="${t.storage_location_desc_placeholder || 'Description optionnelle...'}"></textarea>
            </div>
        </form>
    `;
    
    ModalManager.open({
        template: 'base',
        title: t.add_storage_location || 'Ajouter un emplacement',
        content: content,
        size: 'modal-sm',
        buttons: [
            { text: t.cancel || 'Annuler', action: 'close', class: 'btn-secondary' },
            { text: t.save || 'Enregistrer', action: 'save', class: 'btn-primary' }
        ],
        onAction: async (action, id) => {
            if (action === 'save') {
                const modal = document.querySelector(`[data-modal-id="${id}"]`);
                const name = modal.querySelector('#storageLocationName').value.trim();
                const description = modal.querySelector('#storageLocationDesc').value.trim();
                
                if (!name) {
                    showError(t.name_required || 'Le nom est requis');
                    return false; // Ne pas fermer le modal
                }
                
                try {
                    const result = await createStorageLocation(name, description);
                    
                    if (result.success) {
                        // Invalider le cache
                        invalidateStorageCache();
                        
                        // Recharger et sélectionner le nouvel emplacement
                        await populateStorageLocationSelect(selectToUpdate, result.location.id);
                        
                        showToast(t.storage_location_created || 'Emplacement créé', 'success');
                        ModalManager.close(id);
                    } else {
                        showError(result.error || 'Erreur lors de la création');
                        return false;
                    }
                } catch (error) {
                    console.error('Erreur création emplacement:', error);
                    showError(t.error_generic || 'Une erreur est survenue');
                    return false;
                }
            }
        }
    });
}
