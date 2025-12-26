/**
 * SnowShelf - Collection Module
 * dropdowns/grades.js - Sélecteur multi-grades
 */

import { getTranslations } from '../state.js';
import { escapeHtml } from '../utils.js';
import { loadGrades, loadGradesByCategories } from '../api.js';

/**
 * Cache local pour les grades
 */
let gradesCache = null;

/**
 * Invalide le cache des grades
 */
export function invalidateGradesCache() {
    gradesCache = null;
}

/**
 * Charge les grades depuis l'API (avec cache)
 * @returns {Promise<Array>} Liste des grades
 */
async function getGrades() {
    if (gradesCache !== null) return gradesCache;
    gradesCache = await loadGrades();
    return gradesCache;
}

/**
 * Popule le select des grades selon les catégories sélectionnées
 * Les grades affichés sont ceux liés aux catégories via category_grades
 * @param {HTMLSelectElement} select - Le select à peupler
 * @param {Array} selectedGrades - Grades déjà sélectionnés
 * @param {number[]} categoryIds - IDs des catégories sélectionnées
 */
export async function populateGradesSelectByCategories(select, selectedGrades = [], categoryIds = []) {
    const t = getTranslations();
    
    // Charger les grades liés aux catégories
    const grades = await loadGradesByCategories(categoryIds);
    
    // Construire les options (sans doublons car l'API les gère)
    const options = [];
    
    // Séparer les grades personnels et par défaut
    const personalGrades = grades.filter(g => !g.defaut);
    const defaultGrades = grades.filter(g => g.defaut);
    
    // Grades personnels
    if (personalGrades.length > 0) {
        personalGrades.forEach(grade => {
            options.push({
                value: grade.id,
                text: grade.name,
                description: grade.description || '',
                group: t.grades_section_personal || 'Mes grades'
            });
        });
    }
    
    // Grades par défaut
    if (defaultGrades.length > 0) {
        defaultGrades.forEach(grade => {
            options.push({
                value: grade.id,
                text: grade.name,
                description: grade.description || '',
                group: t.grades_section_defaults || 'Grades par défaut'
            });
        });
    }
    
    // IDs des grades sélectionnés (conserver uniquement ceux qui sont dans les options)
    const availableGradeIds = grades.map(g => g.id);
    const selectedIds = selectedGrades
        .map(g => g.grade_id || g.id)
        .filter(id => availableGradeIds.includes(id)); // Filtrer pour garder uniquement les grades disponibles
    
    // Mettre à jour le select natif
    select.innerHTML = '';
    
    if (grades.length === 0) {
        // Aucun grade disponible pour ces catégories
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = t.no_grades_for_categories || 'Aucun état disponible pour ces catégories';
        opt.disabled = true;
        select.appendChild(opt);
    } else {
        if (personalGrades.length > 0) {
            const group = document.createElement('optgroup');
            group.label = t.grades_section_personal || 'Mes grades';
            personalGrades.forEach(grade => {
                const opt = document.createElement('option');
                opt.value = grade.id;
                opt.textContent = grade.name;
                if (selectedIds.includes(grade.id)) opt.selected = true;
                group.appendChild(opt);
            });
            select.appendChild(group);
        }
        
        if (defaultGrades.length > 0) {
            const group = document.createElement('optgroup');
            group.label = t.grades_section_defaults || 'Grades par défaut';
            defaultGrades.forEach(grade => {
                const opt = document.createElement('option');
                opt.value = grade.id;
                opt.textContent = grade.name;
                if (selectedIds.includes(grade.id)) opt.selected = true;
                group.appendChild(opt);
            });
            select.appendChild(group);
        }
    }
    
    // Créer/Mettre à jour le sélecteur multi-select personnalisé
    createGradesMultiSelect(select, options, selectedIds);
}

/**
 * Popule le select des grades (tous les grades)
 * @param {HTMLSelectElement} select - Le select à peupler
 * @param {Array} selectedGrades - Grades déjà sélectionnés
 * @param {number|null} primaryTypeId - ID du type primaire (non utilisé actuellement)
 */
export async function populateGradesSelect(select, selectedGrades = [], primaryTypeId = null) {
    const t = getTranslations();
    const grades = await getGrades();
    
    // Construire les options
    const options = [];
    
    // Séparer les grades personnels et par défaut
    const personalGrades = grades.filter(g => !g.defaut);
    const defaultGrades = grades.filter(g => g.defaut);
    
    // Grades personnels
    if (personalGrades.length > 0) {
        personalGrades.forEach(grade => {
            options.push({
                value: grade.id,
                text: grade.name,
                description: grade.description || '',
                group: t.grades_section_personal || 'Mes grades'
            });
        });
    }
    
    // Grades par défaut
    if (defaultGrades.length > 0) {
        defaultGrades.forEach(grade => {
            options.push({
                value: grade.id,
                text: grade.name,
                description: grade.description || '',
                group: t.grades_section_defaults || 'Grades par défaut'
            });
        });
    }
    
    // IDs des grades sélectionnés
    const selectedIds = selectedGrades.map(g => g.grade_id || g.id);
    
    // Mettre à jour le select natif
    select.innerHTML = '';
    
    if (personalGrades.length > 0) {
        const group = document.createElement('optgroup');
        group.label = t.grades_section_personal || 'Mes grades';
        personalGrades.forEach(grade => {
            const opt = document.createElement('option');
            opt.value = grade.id;
            opt.textContent = grade.name;
            if (selectedIds.includes(grade.id)) opt.selected = true;
            group.appendChild(opt);
        });
        select.appendChild(group);
    }
    
    if (defaultGrades.length > 0) {
        const group = document.createElement('optgroup');
        group.label = t.grades_section_defaults || 'Grades par défaut';
        defaultGrades.forEach(grade => {
            const opt = document.createElement('option');
            opt.value = grade.id;
            opt.textContent = grade.name;
            if (selectedIds.includes(grade.id)) opt.selected = true;
            group.appendChild(opt);
        });
        select.appendChild(group);
    }
    
    // Créer un sélecteur multi-select personnalisé
    createGradesMultiSelect(select, options, selectedIds);
}

/**
 * Crée un composant multi-select personnalisé pour les grades (style unifié)
 * @param {HTMLSelectElement} select - Le select natif
 * @param {Array} options - Options [{value, text, description?, group?}]
 * @param {number[]} selectedIds - IDs des grades sélectionnés
 */
function createGradesMultiSelect(select, options, selectedIds) {
    const t = getTranslations();
    
    // Wrapper avec style custom-dropdown
    let dropdown = select.parentElement;
    if (!dropdown.classList.contains('custom-dropdown')) {
        dropdown = document.createElement('div');
        dropdown.className = 'custom-dropdown grades-dropdown';
        select.parentNode.insertBefore(dropdown, select);
        dropdown.appendChild(select);
    }
    dropdown.classList.add('grades-dropdown');
    
    // Supprimer l'ancien menu du body s'il existe
    if (dropdown.dataset.menuId) {
        const oldMenu = document.querySelector(`.custom-dropdown-menu[data-dropdown-id="${dropdown.dataset.menuId}"]`);
        if (oldMenu) oldMenu.remove();
    }
    
    // Supprimer l'ancien contenu (sauf le select)
    Array.from(dropdown.children).forEach(child => {
        if (child !== select) child.remove();
    });
    
    // Fonction pour obtenir le texte d'affichage
    const getDisplayText = () => {
        const selectedOptions = Array.from(select.selectedOptions);
        if (selectedOptions.length === 0) {
            return t.field_grades_placeholder || 'Sélectionner un état...';
        }
        if (selectedOptions.length === 1) {
            return selectedOptions[0].text;
        }
        return `${selectedOptions.length} états sélectionnés`;
    };
    
    // Créer le bouton trigger
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'custom-dropdown-trigger';
    trigger.innerHTML = `
        <span class="custom-dropdown-tags"></span>
        <span class="custom-dropdown-text">${getDisplayText()}</span>
        <svg class="custom-dropdown-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6,9 12,15 18,9"></polyline>
        </svg>
    `;
    dropdown.insertBefore(trigger, select);
    
    // Créer le menu déroulant - ATTACHÉ AU BODY
    const menu = document.createElement('div');
    menu.className = 'custom-dropdown-menu custom-dropdown-multiselect-menu';
    menu.dataset.dropdownId = 'dropdown-grades-' + Date.now();
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
        
        if (groupName !== '__default__') {
            const labelEl = document.createElement('div');
            labelEl.className = 'custom-dropdown-group-label';
            labelEl.textContent = groupName;
            groupEl.appendChild(labelEl);
        }
        
        groupOptions.forEach(opt => {
            const isSelected = selectedIds.includes(opt.value);
            const optionEl = document.createElement('div');
            optionEl.className = 'custom-dropdown-option custom-dropdown-checkbox-option' + (isSelected ? ' selected' : '');
            optionEl.dataset.value = opt.value;
            
            optionEl.innerHTML = `
                <span class="custom-dropdown-checkbox">${isSelected ? '✓' : ''}</span>
                <span class="custom-dropdown-option-text">${escapeHtml(opt.text)}</span>
                ${opt.description ? `<span class="custom-dropdown-option-desc">${escapeHtml(opt.description)}</span>` : ''}
            `;
            
            optionEl.addEventListener('click', (e) => {
                e.stopPropagation();
                const value = parseInt(optionEl.dataset.value);
                const nativeOption = select.querySelector(`option[value="${value}"]`);
                
                if (nativeOption) {
                    nativeOption.selected = !nativeOption.selected;
                    optionEl.classList.toggle('selected');
                    optionEl.querySelector('.custom-dropdown-checkbox').textContent = nativeOption.selected ? '✓' : '';
                    updateTrigger();
                }
            });
            
            groupEl.appendChild(optionEl);
        });
        
        menu.appendChild(groupEl);
    });
    
    // Fonction pour mettre à jour le trigger
    const updateTrigger = () => {
        const tagsContainer = trigger.querySelector('.custom-dropdown-tags');
        const textEl = trigger.querySelector('.custom-dropdown-text');
        const selectedOptions = Array.from(select.selectedOptions);
        
        tagsContainer.innerHTML = '';
        
        if (selectedOptions.length === 0) {
            textEl.textContent = t.field_grades_placeholder || 'Sélectionner un état...';
            textEl.style.display = '';
        } else {
            textEl.style.display = 'none';
            selectedOptions.forEach(opt => {
                const tag = document.createElement('span');
                tag.className = 'custom-dropdown-tag';
                tag.innerHTML = `
                    ${escapeHtml(opt.text)}
                    <button type="button" class="custom-dropdown-tag-remove" data-value="${opt.value}">×</button>
                `;
                tagsContainer.appendChild(tag);
            });
        }
    };
    
    // Initialiser l'affichage
    updateTrigger();
    
    // Événement de suppression de tag
    trigger.querySelector('.custom-dropdown-tags').addEventListener('click', (e) => {
        const removeBtn = e.target.closest('.custom-dropdown-tag-remove');
        if (removeBtn) {
            e.stopPropagation();
            const value = removeBtn.dataset.value;
            const nativeOption = select.querySelector(`option[value="${value}"]`);
            if (nativeOption) {
                nativeOption.selected = false;
                const menuOption = menu.querySelector(`.custom-dropdown-option[data-value="${value}"]`);
                if (menuOption) {
                    menuOption.classList.remove('selected');
                    menuOption.querySelector('.custom-dropdown-checkbox').textContent = '';
                }
                updateTrigger();
            }
        }
    });
    
    /**
     * Positionne le menu
     */
    function positionMenu() {
        const rect = trigger.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        
        // Mesurer la hauteur réelle du menu
        menu.style.visibility = 'hidden';
        menu.style.display = 'block';
        const menuHeight = menu.offsetHeight;
        menu.style.visibility = '';
        menu.style.display = '';
        
        let top = rect.bottom + 4;
        let left = rect.left;
        const width = Math.max(rect.width, 200);
        
        // Vérifier si le menu sort en bas
        if (top + menuHeight > viewportHeight - 10) {
            top = rect.top - menuHeight - 4;
            menu.classList.add('dropdown-above');
        } else {
            menu.classList.remove('dropdown-above');
        }
        
        // S'assurer que le menu reste dans l'écran
        if (top < 10) top = 10;
        if (top + menuHeight > viewportHeight - 10) {
            top = viewportHeight - menuHeight - 10;
        }
        
        menu.style.position = 'fixed';
        menu.style.top = top + 'px';
        menu.style.left = left + 'px';
        menu.style.width = width + 'px';
    }
    
    function closeDropdown() {
        dropdown.classList.remove('open');
        menu.classList.remove('open');
    }
    
    function openDropdown() {
        // Fermer tous les autres dropdowns
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
        if (!dropdown.contains(e.target) && !menu.contains(e.target)) {
            closeDropdown();
        }
    };
    if (dropdown._closeHandler) document.removeEventListener('click', dropdown._closeHandler);
    dropdown._closeHandler = closeHandler;
    document.addEventListener('click', closeHandler);
    
    // Repositionner au scroll
    const scrollHandler = () => {
        if (dropdown.classList.contains('open')) {
            positionMenu();
        }
    };
    window.addEventListener('scroll', scrollHandler, true);
}
