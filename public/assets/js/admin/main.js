/**
 * SnowShelf - Admin Main Entry Point
 * Point d'entrée ES6 pour la section admin
 */

import SettingsPanel from './settings/index.js';
import UsersPanel from './users/index.js';
import DatabasesPanel from './databases/index.js';

// Déterminer la section active depuis l'URL
function getCurrentSection() {
    const params = new URLSearchParams(window.location.search);
    return params.get('section') || 'users';
}

/**
 * Attendre que ModalManager soit disponible
 * @param {number} maxAttempts - Nombre max de tentatives
 * @returns {Promise<Object|null>}
 */
function waitForModalManager(maxAttempts = 50) {
    return new Promise((resolve) => {
        let attempts = 0;
        const check = () => {
            if (window.ModalManager) {
                resolve(window.ModalManager);
            } else if (attempts < maxAttempts) {
                attempts++;
                setTimeout(check, 20);
            } else {
                console.warn('[Admin] ModalManager not found after waiting');
                resolve(null);
            }
        };
        check();
    });
}

/**
 * Initialise la section admin appropriée
 */
async function initAdmin() {
    const section = getCurrentSection();
    
    console.log(`[Admin] Initializing section: ${section}`);
    
    // Attendre ModalManager pour les sections qui en ont besoin
    let modalManager = window.ModalManager;
    if (!modalManager && (section === 'settings' || section === 'databases')) {
        modalManager = await waitForModalManager();
    }
    
    // Initialiser la section appropriée
    switch (section) {
        case 'users':
            UsersPanel.init(modalManager);
            break;
            
        case 'settings':
            if (!modalManager) {
                console.error('[Admin] ModalManager required for settings');
                return;
            }
            SettingsPanel.init(modalManager);
            break;
            
        case 'databases':
            if (!modalManager) {
                console.error('[Admin] ModalManager required for databases');
                return;
            }
            DatabasesPanel.init(modalManager);
            break;
            
        case 'stats':
        case 'logs':
            // Ces sections n'ont pas encore de module ES6
            console.log(`[Admin] Section ${section} - no ES6 module yet`);
            break;
            
        default:
            console.log(`[Admin] Unknown section: ${section}`);
    }
}

// Attendre que le DOM soit chargé
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAdmin);
} else {
    initAdmin();
}
