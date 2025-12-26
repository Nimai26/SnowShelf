/**
 * SnowShelf - Collection Module
 * dropdowns/primary-type.js - Sélecteur de type primaire
 */

import { state, getTranslations } from '../state.js';
import { renderMdiIcon, parseLocalizedName } from '../utils.js';
import { loadPrimaryTypes } from '../api.js';
import { createPrimaryTypeDropdown } from './base.js';

/**
 * Popule le sélecteur de type primaire
 * @param {HTMLSelectElement} select - Le select à peupler
 * @param {string|number|null} selectedTypeId - ID du type sélectionné
 */
export async function populatePrimaryTypeSelect(select, selectedTypeId = null) {
    const t = getTranslations();
    
    // S'assurer que les types sont chargés
    if (state.primaryTypes.length === 0) {
        await loadPrimaryTypes();
    }
    
    // Construire les options
    const options = [];
    
    // Option vide
    options.push({
        value: '',
        text: t.no_primary_type || 'Non défini',
        color: null,
        icon: null
    });
    
    // Types primaires
    state.primaryTypes.forEach(type => {
        const localizedName = parseLocalizedName(type.name);
        options.push({
            value: type.id,
            text: localizedName,
            color: type.color || '#6b7280',
            icon: type.icon || null
        });
    });
    
    // Mettre à jour le select natif
    select.innerHTML = '';
    
    const emptyOpt = document.createElement('option');
    emptyOpt.value = '';
    emptyOpt.textContent = t.no_primary_type || 'Non défini';
    select.appendChild(emptyOpt);
    
    state.primaryTypes.forEach(type => {
        const localizedName = parseLocalizedName(type.name);
        const opt = document.createElement('option');
        opt.value = type.id;
        opt.textContent = localizedName;
        if (selectedTypeId !== null && type.id == selectedTypeId) {
            opt.selected = true;
        }
        select.appendChild(opt);
    });
    
    if (selectedTypeId !== null) {
        select.value = selectedTypeId;
    }
    
    // Créer le dropdown personnalisé avec icônes
    createPrimaryTypeDropdown(select, options, selectedTypeId);
}
