/**
 * ModalManager - Système de gestion des modals avec empilement
 * 
 * Permet d'afficher des modals superposés, avec gestion du focus,
 * de l'accessibilité et des callbacks de fermeture.
 * 
 * @author SnowShelf
 * @version 1.0.0
 */

const ModalManager = (function() {
    'use strict';

    // === CONFIGURATION ===
    const CONFIG = {
        baseZIndex: 1000,           // Z-index de base pour le premier modal
        zIndexStep: 10,             // Incrément de z-index entre chaque modal
        animationDuration: 200,     // Durée des animations en ms
        closeOnOverlay: true,       // Fermer en cliquant sur l'overlay par défaut
        closeOnEscape: true,        // Fermer avec Échap par défaut
    };

    // === ÉTAT ===
    let modalStack = [];            // Pile des modals ouverts
    let modalIdCounter = 0;         // Compteur pour générer des IDs uniques

    // === TEMPLATES DE MODALS ===
    const TEMPLATES = {
        // Modal de base
        base: (id, options) => `
            <div class="modal-overlay" data-modal-id="${id}">
                <div class="modal ${options.size || ''} ${options.customClass || ''}" 
                     role="dialog" 
                     aria-modal="true" 
                     aria-labelledby="modal-title-${id}"
                     tabindex="-1">
                    ${options.showHeader !== false ? `
                    <div class="modal-header">
                        <h3 class="modal-title" id="modal-title-${id}">${options.title || ''}</h3>
                        ${options.showClose !== false ? `
                        <button type="button" class="modal-close" data-action="close" aria-label="Fermer">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>` : ''}
                    </div>` : ''}
                    <div class="modal-body">
                        ${options.content || ''}
                    </div>
                    ${options.showFooter !== false && (options.buttons || options.footerContent) ? `
                    <div class="modal-footer">
                        ${options.footerContent || ''}
                        ${options.buttons ? renderButtons(options.buttons, id) : ''}
                    </div>` : ''}
                </div>
            </div>
        `,

        // Modal de confirmation
        confirm: (id, options) => `
            <div class="modal-overlay" data-modal-id="${id}">
                <div class="modal modal-confirm modal-sm ${options.type || ''} ${options.customClass || ''}" 
                     role="alertdialog" 
                     aria-modal="true" 
                     aria-labelledby="modal-title-${id}"
                     aria-describedby="modal-desc-${id}"
                     tabindex="-1">
                    <div class="modal-header">
                        <div class="modal-icon">
                            ${getSvgIconForType(options.type)}
                        </div>
                        <h3 class="modal-title" id="modal-title-${id}">${options.title || 'Confirmation'}</h3>
                    </div>
                    <div class="modal-body">
                        <p id="modal-desc-${id}">${options.message || 'Êtes-vous sûr ?'}</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-action="cancel">
                            ${options.cancelText || 'Annuler'}
                        </button>
                        <button type="button" class="btn ${getButtonClassForType(options.type)}" data-action="confirm">
                            ${options.confirmText || 'Confirmer'}
                        </button>
                    </div>
                </div>
            </div>
        `,

        // Modal d'alerte
        alert: (id, options) => `
            <div class="modal-overlay" data-modal-id="${id}">
                <div class="modal modal-alert modal-sm ${options.type || ''} ${options.customClass || ''}" 
                     role="alertdialog" 
                     aria-modal="true" 
                     aria-labelledby="modal-title-${id}"
                     aria-describedby="modal-desc-${id}"
                     tabindex="-1">
                    <div class="modal-header">
                        <div class="modal-icon">
                            ${getSvgIconForType(options.type)}
                        </div>
                        <h3 class="modal-title" id="modal-title-${id}">${options.title || 'Information'}</h3>
                    </div>
                    <div class="modal-body">
                        <p id="modal-desc-${id}">${options.message || ''}</p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-primary" data-action="close">
                            ${options.buttonText || 'OK'}
                        </button>
                    </div>
                </div>
            </div>
        `,

        // Modal de chargement
        loading: (id, options) => `
            <div class="modal-overlay modal-overlay-loading" data-modal-id="${id}">
                <div class="modal modal-loading" role="dialog" aria-modal="true" aria-busy="true" tabindex="-1">
                    <div class="modal-body">
                        <div class="loading-spinner"></div>
                        <p>${options.message || 'Chargement...'}</p>
                    </div>
                </div>
            </div>
        `,

        // Modal avec formulaire
        form: (id, options) => `
            <div class="modal-overlay" data-modal-id="${id}">
                <div class="modal modal-form ${options.size || ''}" 
                     role="dialog" 
                     aria-modal="true" 
                     aria-labelledby="modal-title-${id}"
                     tabindex="-1">
                    <div class="modal-header">
                        <h3 class="modal-title" id="modal-title-${id}">${options.title || ''}</h3>
                        <button type="button" class="modal-close" data-action="close" aria-label="Fermer">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                    </div>
                    <form id="modal-form-${id}" class="modal-form-content" ${options.formAttributes || ''}>
                        <div class="modal-body">
                            ${options.content || ''}
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-action="cancel">
                                ${options.cancelText || 'Annuler'}
                            </button>
                            <button type="submit" class="btn btn-primary">
                                ${options.submitText || 'Enregistrer'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `,
    };

    // === HELPERS ===

    /**
     * Génère le HTML des boutons avec groupement gauche/droite
     * Les boutons danger vont à gauche, les autres à droite
     */
    function renderButtons(buttons, modalId) {
        const leftButtons = buttons.filter(btn => btn.class && btn.class.includes('btn-danger'));
        const rightButtons = buttons.filter(btn => !btn.class || !btn.class.includes('btn-danger'));
        
        const renderBtn = (btn) => `
            <button type="button" 
                    class="btn ${btn.class || 'btn-secondary'}" 
                    data-action="${btn.action || 'close'}"
                    ${btn.disabled ? 'disabled' : ''}>
                ${btn.text}
            </button>
        `;
        
        // Si pas de boutons danger, retourner juste les boutons droite sans groupes
        if (leftButtons.length === 0) {
            return rightButtons.map(renderBtn).join('');
        }
        
        // Sinon, créer deux groupes
        return `
            <div class="footer-left">
                ${leftButtons.map(renderBtn).join('')}
            </div>
            <div class="footer-right">
                ${rightButtons.map(renderBtn).join('')}
            </div>
        `;
    }

    /**
     * Retourne l'icône SVG selon le type de modal
     */
    function getSvgIconForType(type) {
        const icons = {
            'warning': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
            'danger': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
            'success': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
            'info': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
            'question': '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
        };
        return icons[type] || icons['info'];
    }

    /**
     * Retourne la classe de bouton selon le type
     */
    function getButtonClassForType(type) {
        const classes = {
            'warning': 'btn-warning',
            'danger': 'btn-danger',
            'success': 'btn-success',
            'info': 'btn-primary',
            'question': 'btn-primary',
        };
        return classes[type] || 'btn-primary';
    }

    /**
     * Génère un ID unique pour le modal
     */
    function generateModalId() {
        return `modal-${++modalIdCounter}-${Date.now()}`;
    }

    /**
     * Calcule le z-index pour un nouveau modal
     */
    function calculateZIndex() {
        return CONFIG.baseZIndex + (modalStack.length * CONFIG.zIndexStep);
    }

    /**
     * Désactive/réactive le modal précédent
     * @param {boolean} disable - true pour désactiver, false pour réactiver
     * @param {boolean} afterRemoval - true si appelé après suppression d'un modal de la pile
     */
    function togglePreviousModal(disable, afterRemoval = false) {
        // Calculer l'index du modal à modifier
        // Si afterRemoval=true, le modal est déjà retiré donc on utilise length-1
        // Sinon on utilise length-2 (le modal avant le dernier)
        const targetIndex = afterRemoval ? modalStack.length - 1 : modalStack.length - 2;
        
        if (targetIndex >= 0 && modalStack[targetIndex]) {
            const targetModal = modalStack[targetIndex];
            const overlay = document.querySelector(`[data-modal-id="${targetModal.id}"]`);
            if (overlay) {
                overlay.classList.toggle('modal-inactive', disable);
                const modal = overlay.querySelector('.modal');
                if (modal) {
                    // D'abord déplacer le focus si on désactive
                    if (disable && modal.contains(document.activeElement)) {
                        document.activeElement.blur();
                    }
                    modal.setAttribute('aria-hidden', disable);
                    modal.querySelectorAll('button, input, select, textarea, a').forEach(el => {
                        el.tabIndex = disable ? -1 : 0;
                    });
                }
            }
        }
    }

    /**
     * Gère le focus trap dans le modal
     */
    function trapFocus(modalElement) {
        const focusableElements = modalElement.querySelectorAll(
            'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        modalElement.addEventListener('keydown', (e) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        });

        // Focus sur le premier élément focusable
        setTimeout(() => firstElement.focus(), CONFIG.animationDuration);
    }

    /**
     * Gère la fermeture avec Échap
     */
    function handleEscapeKey(e) {
        if (e.key === 'Escape' && modalStack.length > 0) {
            const currentModal = modalStack[modalStack.length - 1];
            if (currentModal.options.closeOnEscape !== false) {
                close(currentModal.id, 'escape');
            }
        }
    }

    // === API PUBLIQUE ===

    /**
     * Ouvre un modal
     * 
     * @param {Object} options - Options du modal
     * @param {string} options.template - Type de template ('base', 'confirm', 'alert', 'loading', 'form')
     * @param {string} options.title - Titre du modal
     * @param {string} options.content - Contenu HTML du modal
     * @param {string} options.message - Message (pour confirm/alert)
     * @param {string} options.type - Type visuel ('warning', 'danger', 'success', 'info')
     * @param {string} options.size - Taille ('modal-sm', 'modal-lg', 'modal-xl')
     * @param {string} options.caller - Identifiant de l'appelant
     * @param {Array} options.buttons - Tableau de boutons personnalisés
     * @param {Object} options.data - Données additionnelles
     * @param {Function} options.onOpen - Callback à l'ouverture
     * @param {Function} options.onClose - Callback à la fermeture
     * @param {Function} options.onConfirm - Callback de confirmation
     * @param {Function} options.onCancel - Callback d'annulation
     * @param {Function} options.onSubmit - Callback de soumission (pour form)
     * @param {boolean} options.closeOnOverlay - Fermer en cliquant sur l'overlay
     * @param {boolean} options.closeOnEscape - Fermer avec Échap
     * @returns {string} ID du modal créé
     */
    function open(options = {}) {
        const id = generateModalId();
        const template = options.template || 'base';
        const templateFn = TEMPLATES[template] || TEMPLATES.base;

        // Définir les options par défaut
        const modalOptions = {
            closeOnOverlay: CONFIG.closeOnOverlay,
            closeOnEscape: CONFIG.closeOnEscape,
            ...options,
        };

        // Générer le HTML
        const html = templateFn(id, modalOptions);
        
        // Créer l'élément
        const container = document.createElement('div');
        container.innerHTML = html;
        const overlay = container.firstElementChild;

        // Appliquer le z-index
        overlay.style.zIndex = calculateZIndex();

        // Désactiver le modal précédent
        togglePreviousModal(true);

        // Ajouter au DOM
        document.body.appendChild(overlay);
        document.body.classList.add('modal-open');

        // Sauvegarder dans la pile
        const modalData = {
            id,
            options: modalOptions,
            overlay,
            previousActiveElement: document.activeElement,
        };
        modalStack.push(modalData);

        // Animation d'entrée - Double rAF pour s'assurer que le DOM est prêt
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                overlay.classList.add('modal-visible');
            });
        });

        // Configurer les événements
        setupModalEvents(modalData);

        // Focus trap
        const modal = overlay.querySelector('.modal');
        if (modal) {
            trapFocus(modal);
        }

        // Callback d'ouverture
        if (typeof modalOptions.onOpen === 'function') {
            setTimeout(() => modalOptions.onOpen(id, overlay), CONFIG.animationDuration);
        }

        return id;
    }

    /**
     * Configure les événements du modal
     */
    function setupModalEvents(modalData) {
        const { id, options, overlay } = modalData;
        const modal = overlay.querySelector('.modal');

        // Clic sur l'overlay
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay && options.closeOnOverlay !== false) {
                close(id, 'overlay');
            }
        });

        // Boutons d'action
        overlay.addEventListener('click', async (e) => {
            const action = e.target.closest('[data-action]')?.dataset.action;
            if (!action) return;

            switch (action) {
                case 'close':
                    close(id, 'button');
                    break;
                case 'cancel':
                    if (typeof options.onCancel === 'function') {
                        options.onCancel(id);
                    }
                    close(id, 'cancel');
                    break;
                case 'confirm':
                    if (typeof options.onConfirm === 'function') {
                        try {
                            const result = await options.onConfirm(id, options.data);
                            // Si onConfirm retourne false, ne pas fermer
                            if (result === false) return;
                        } catch (error) {
                            console.error('[ModalManager] onConfirm error:', error);
                            return; // Ne pas fermer en cas d'erreur
                        }
                    }
                    close(id, 'confirm');
                    break;
                default:
                    // Action personnalisée
                    if (typeof options.onAction === 'function') {
                        options.onAction(action, id, options.data);
                    }
            }
        });

        // Formulaire
        const form = overlay.querySelector('form');
        if (form && typeof options.onSubmit === 'function') {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(form);
                const result = await options.onSubmit(formData, id, options.data);
                // Si onSubmit retourne false, ne pas fermer
                if (result !== false) {
                    close(id, 'submit');
                }
            });
        }
    }

    /**
     * Ferme un modal
     * 
     * @param {string} id - ID du modal à fermer (optionnel, ferme le dernier si non fourni)
     * @param {string} reason - Raison de la fermeture ('button', 'overlay', 'escape', 'cancel', 'confirm', 'submit', 'programmatic')
     */
    function close(id = null, reason = 'programmatic') {
        // Si pas d'ID, fermer le dernier modal
        if (!id && modalStack.length > 0) {
            id = modalStack[modalStack.length - 1].id;
        }

        // Trouver le modal dans la pile
        const index = modalStack.findIndex(m => m.id === id);
        if (index === -1) return;

        const modalData = modalStack[index];
        const { overlay, options, previousActiveElement } = modalData;

        // Animation de sortie
        overlay.classList.remove('modal-visible');
        overlay.classList.add('modal-hiding');

        // Retirer de la pile
        modalStack.splice(index, 1);

        // Callback de fermeture
        if (typeof options.onClose === 'function') {
            options.onClose(id, reason, options.data);
        }

        // Supprimer du DOM après l'animation
        setTimeout(() => {
            overlay.remove();

            // Réactiver le modal précédent
            if (modalStack.length > 0) {
                togglePreviousModal(false, true); // afterRemoval=true car le modal a déjà été retiré
                const lastModal = modalStack[modalStack.length - 1];
                const lastOverlay = document.querySelector(`[data-modal-id="${lastModal.id}"]`);
                if (lastOverlay) {
                    const modal = lastOverlay.querySelector('.modal');
                    if (modal) modal.focus();
                }
            } else {
                // Plus de modals, retirer la classe du body
                document.body.classList.remove('modal-open');
                // Restaurer le focus
                if (previousActiveElement) {
                    previousActiveElement.focus();
                }
            }
        }, CONFIG.animationDuration);
    }

    /**
     * Ferme tous les modals
     */
    function closeAll() {
        while (modalStack.length > 0) {
            close();
        }
    }

    /**
     * Met à jour le contenu d'un modal
     * 
     * @param {string} id - ID du modal
     * @param {Object} updates - Mises à jour à appliquer
     */
    function update(id, updates) {
        const overlay = document.querySelector(`[data-modal-id="${id}"]`);
        if (!overlay) return;

        if (updates.title) {
            const titleEl = overlay.querySelector('.modal-title');
            if (titleEl) titleEl.textContent = updates.title;
        }

        if (updates.content) {
            const bodyEl = overlay.querySelector('.modal-body');
            if (bodyEl) bodyEl.innerHTML = updates.content;
        }

        if (updates.message) {
            const messageEl = overlay.querySelector('.modal-body p');
            if (messageEl) messageEl.textContent = updates.message;
        }

        // Mettre à jour les données dans la pile
        const modalData = modalStack.find(m => m.id === id);
        if (modalData && updates.data) {
            modalData.options.data = { ...modalData.options.data, ...updates.data };
        }
    }

    /**
     * Récupère les données d'un modal
     * 
     * @param {string} id - ID du modal
     * @returns {Object|null} Données du modal
     */
    function getData(id) {
        const modalData = modalStack.find(m => m.id === id);
        return modalData ? modalData.options.data : null;
    }

    /**
     * Vérifie si un modal est ouvert
     * 
     * @param {string} id - ID du modal (optionnel)
     * @returns {boolean}
     */
    function isOpen(id = null) {
        if (id) {
            return modalStack.some(m => m.id === id);
        }
        return modalStack.length > 0;
    }

    /**
     * Retourne le nombre de modals ouverts
     * 
     * @returns {number}
     */
    function count() {
        return modalStack.length;
    }

    // === RACCOURCIS ===

    /**
     * Modal de confirmation rapide
     */
    function confirm(message, options = {}) {
        return new Promise((resolve) => {
            open({
                template: 'confirm',
                message,
                type: options.type || 'question',
                title: options.title,
                confirmText: options.confirmText,
                cancelText: options.cancelText,
                onConfirm: () => resolve(true),
                onCancel: () => resolve(false),
                onClose: (id, reason) => {
                    if (reason === 'escape' || reason === 'overlay') {
                        resolve(false);
                    }
                },
                ...options,
            });
        });
    }

    /**
     * Modal d'alerte rapide
     */
    function alert(message, options = {}) {
        return new Promise((resolve) => {
            open({
                template: 'alert',
                message,
                type: options.type || 'info',
                title: options.title,
                buttonText: options.buttonText,
                onClose: () => resolve(),
                ...options,
            });
        });
    }

    /**
     * Modal de chargement
     */
    function loading(message = 'Chargement...') {
        return open({
            template: 'loading',
            message,
            closeOnOverlay: false,
            closeOnEscape: false,
        });
    }

    // === INITIALISATION ===

    function init() {
        // Écouter la touche Échap globalement
        document.addEventListener('keydown', handleEscapeKey);
    }

    // Initialiser au chargement
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // === EXPORT ===
    return {
        open,
        close,
        closeAll,
        update,
        getData,
        isOpen,
        count,
        confirm,
        alert,
        loading,
        // Configuration
        config: CONFIG,
    };

})();

// Exposer globalement pour les autres scripts
window.ModalManager = ModalManager;

// Export pour les modules ES6 si disponible
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ModalManager;
}
