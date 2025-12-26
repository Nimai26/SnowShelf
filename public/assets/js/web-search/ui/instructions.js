/**
 * SnowShelf - Web Search Module
 * Gestion des manuels d'instructions
 */

import { state } from '../state.js';
import { escapeHtml } from '../utils/helpers.js';

/**
 * Construire la section des manuels d'instructions
 * @param {Object} result - Résultat avec métadonnées
 * @param {Object} t - Traductions
 */
export function buildInstructionsSection(result, t) {
    const instructions = result.metadata?.instructions;
    if (!instructions || !Array.isArray(instructions) || instructions.length === 0) {
        return;
    }
    
    if (!state.selectedInstructions) {
        state.selectedInstructions = new Set();
    }
    
    // Supprimer l'ancienne section si elle existe
    const oldSection = document.querySelector('.detail-instructions-section');
    if (oldSection) {
        oldSection.remove();
    }
    
    const instructionsHtml = `
        <div class="detail-instructions-section">
            <h4>${t.detail_instructions_section || 'Manuels d\'instructions'}</h4>
            <div class="detail-instructions-actions">
                <button type="button" class="btn btn-xs btn-secondary" id="wsSelectAllInstructions">
                    ${t.detail_select_all || 'Tout sélectionner'}
                </button>
                <span class="detail-instructions-count">
                    <span id="wsInstructionsSelectedCount">0</span> / ${instructions.length} ${t.detail_selected || 'sélectionné(s)'}
                </span>
            </div>
            <div class="detail-instructions-list">
                ${instructions.map((manual, idx) => {
                    const manualUrl = manual.pdfUrl || manual.url || '';
                    const manualId = manual.id || `manual_${idx}`;
                    const manualDesc = manual.description || manual.name || `Manuel ${idx + 1}`;
                    return `
                        <label class="detail-instruction-item" data-url="${escapeHtml(manualUrl)}" data-id="${escapeHtml(manualId)}">
                            <input type="checkbox" class="detail-instruction-checkbox">
                            <span class="detail-instruction-name">${escapeHtml(manualDesc)}</span>
                            ${manualUrl ? `<a href="${escapeHtml(manualUrl)}" target="_blank" class="detail-instruction-link" title="${t.detail_view_pdf || 'Voir le PDF'}">
                                <i class="fas fa-external-link-alt"></i>
                            </a>` : ''}
                        </label>
                    `;
                }).join('')}
            </div>
        </div>
    `;
    
    // Insérer après la section des médias
    const mediaSection = document.getElementById('wsMediaSection');
    if (mediaSection) {
        mediaSection.insertAdjacentHTML('afterend', instructionsHtml);
    }
    
    // Event handlers
    setupInstructionsEventHandlers(instructions, t);
}

/**
 * Configurer les événements pour les manuels d'instructions
 * @param {Array} instructions - Liste des manuels
 * @param {Object} t - Traductions
 */
export function setupInstructionsEventHandlers(instructions, t) {
    const selectAllInstructionsBtn = document.getElementById('wsSelectAllInstructions');
    if (selectAllInstructionsBtn) {
        selectAllInstructionsBtn.addEventListener('click', function() {
            const checkboxes = document.querySelectorAll('.detail-instruction-checkbox');
            const allSelected = state.selectedInstructions.size === instructions.length;
            
            if (allSelected) {
                state.selectedInstructions.clear();
                checkboxes.forEach(cb => cb.checked = false);
                this.textContent = t.detail_select_all || 'Tout sélectionner';
            } else {
                checkboxes.forEach(cb => {
                    cb.checked = true;
                    const item = cb.closest('.detail-instruction-item');
                    if (item) {
                        state.selectedInstructions.add(item.dataset.url);
                    }
                });
                this.textContent = t.detail_deselect_all || 'Tout désélectionner';
            }
            updateInstructionsCount();
        });
    }
    
    document.querySelectorAll('.detail-instruction-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const item = this.closest('.detail-instruction-item');
            if (item) {
                const url = item.dataset.url;
                if (this.checked) {
                    state.selectedInstructions.add(url);
                } else {
                    state.selectedInstructions.delete(url);
                }
                updateInstructionsCount();
                updateSelectAllInstructionsButton(instructions, t);
            }
        });
    });
}

/**
 * Mettre à jour le compteur de manuels sélectionnés
 */
export function updateInstructionsCount() {
    const countEl = document.getElementById('wsInstructionsSelectedCount');
    if (countEl && state.selectedInstructions) {
        countEl.textContent = state.selectedInstructions.size;
    }
}

/**
 * Mettre à jour le bouton "Tout sélectionner" des manuels
 * @param {Array} instructions - Liste des manuels
 * @param {Object} t - Traductions
 */
export function updateSelectAllInstructionsButton(instructions, t) {
    const btn = document.getElementById('wsSelectAllInstructions');
    if (btn && instructions) {
        const allSelected = state.selectedInstructions.size === instructions.length;
        btn.textContent = allSelected ? (t.detail_deselect_all || 'Tout désélectionner') : (t.detail_select_all || 'Tout sélectionner');
    }
}
