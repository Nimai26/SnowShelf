/**
 * SnowShelf - Admin Main Config Module
 * Gestion de la configuration principale
 */

import { API_ENDPOINTS } from '/assets/js/admin/core/config.js';
import { showToast, showLoading } from '/assets/js/admin/core/utils.js';

const CONFIG_API = API_ENDPOINTS.CONFIG;

/**
 * Charge la configuration principale
 */
export async function loadMainConfig() {
    try {
        const response = await fetch(`${CONFIG_API}?table=Admin_Main_Config`, {
            credentials: 'same-origin'
        });
        const result = await response.json();

        if (result.success && result.data.exists) {
            const data = result.data.data;
            const cfgTimezone = document.getElementById('cfgTimezone');
            const cfgOcrTimeout = document.getElementById('cfgOcrTimeout');
            const cfgOcrUrl = document.getElementById('cfgOcrUrl');
            const cfgInfosUrl = document.getElementById('cfgInfosUrl');
            const cfgEncryptionKey = document.getElementById('cfgEncryptionKey');
            const cfgTradUrl = document.getElementById('cfgTradUrl');
            
            if (cfgTimezone) cfgTimezone.value = data.SNOWSHELF_TZ || '';
            if (cfgOcrTimeout) cfgOcrTimeout.value = data.WS_OCR_TIMEOUT || '';
            if (cfgOcrUrl) cfgOcrUrl.value = data.IDENTIFY_OCR_URL || '';
            if (cfgInfosUrl) cfgInfosUrl.value = data.IDENTIFY_INFOS_URL || '';
            if (cfgEncryptionKey) cfgEncryptionKey.value = data.API_ENCRYPTION_KEY || '';
            if (cfgTradUrl) cfgTradUrl.value = data.AUTO_TRAD_URL || '';
        }
    } catch (error) {
        console.error('Load main config error:', error);
    }
}

/**
 * Teste une URL et affiche le résultat
 * @param {string} inputId - ID de l'input contenant l'URL
 */
export async function testUrl(inputId) {
    const input = document.getElementById(inputId);
    const statusEl = document.getElementById(`${inputId}-status`);
    const btn = document.querySelector(`[data-target="${inputId}"]`);
    
    if (!input || !statusEl) return;
    
    const url = input.value.trim();
    
    // Reset status
    statusEl.className = 'url-status';
    statusEl.textContent = '';
    
    if (!url) {
        statusEl.className = 'url-status url-status-warning';
        statusEl.textContent = 'Veuillez entrer une URL';
        return;
    }
    
    // Show loading state
    if (btn) {
        btn.disabled = true;
        btn.classList.add('loading');
    }
    statusEl.className = 'url-status url-status-testing';
    statusEl.textContent = 'Test en cours...';
    
    try {
        const response = await fetch(`${CONFIG_API}?action=test_url`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url }),
            credentials: 'same-origin'
        });
        
        const result = await response.json();
        
        if (result.success) {
            const data = result.data;
            if (data.accessible) {
                statusEl.className = 'url-status url-status-success';
                statusEl.textContent = `✓ ${data.message} (${data.response_time}ms)`;
            } else {
                statusEl.className = `url-status url-status-${data.status}`;
                statusEl.textContent = `✗ ${data.message}`;
            }
        } else {
            statusEl.className = 'url-status url-status-error';
            statusEl.textContent = `✗ ${result.message}`;
        }
    } catch (error) {
        console.error('URL test error:', error);
        statusEl.className = 'url-status url-status-error';
        statusEl.textContent = '✗ Erreur de connexion';
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.classList.remove('loading');
        }
    }
}

/**
 * Teste toutes les URLs configurées
 */
export async function testAllUrls() {
    const urlFields = ['cfgOcrUrl', 'cfgInfosUrl', 'cfgTradUrl'];
    for (const fieldId of urlFields) {
        const input = document.getElementById(fieldId);
        if (input && input.value.trim()) {
            await testUrl(fieldId);
        }
    }
}

/**
 * Gère la soumission du formulaire de configuration principale
 * @param {Event} e - Événement de soumission
 */
export async function handleMainConfigSubmit(e) {
    e.preventDefault();
    showLoading(true);

    // Vérifier les URLs avant de sauvegarder
    const urlFields = [
        { id: 'cfgOcrUrl', key: 'IDENTIFY_OCR_URL' },
        { id: 'cfgInfosUrl', key: 'IDENTIFY_INFOS_URL' },
        { id: 'cfgTradUrl', key: 'AUTO_TRAD_URL' }
    ];

    const urlsToCheck = urlFields.filter(f => {
        const input = document.getElementById(f.id);
        return input && input.value.trim();
    });

    // Tester toutes les URLs non vides
    let hasInvalidUrl = false;
    for (const field of urlsToCheck) {
        const input = document.getElementById(field.id);
        const statusEl = document.getElementById(`${field.id}-status`);
        const btn = document.querySelector(`[data-target="${field.id}"]`);
        const url = input.value.trim();

        if (btn) {
            btn.disabled = true;
            btn.classList.add('loading');
        }
        if (statusEl) {
            statusEl.className = 'url-status url-status-testing';
            statusEl.textContent = 'Vérification...';
        }

        try {
            const response = await fetch(`${CONFIG_API}?action=test_url`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url }),
                credentials: 'same-origin'
            });

            const result = await response.json();

            if (result.success && result.data) {
                const data = result.data;
                if (data.accessible) {
                    if (statusEl) {
                        statusEl.className = 'url-status url-status-success';
                        statusEl.textContent = `✓ ${data.message} (${data.response_time}ms)`;
                    }
                } else {
                    hasInvalidUrl = true;
                    if (statusEl) {
                        statusEl.className = `url-status url-status-${data.status}`;
                        statusEl.textContent = `✗ ${data.message}`;
                    }
                }
            } else {
                hasInvalidUrl = true;
                if (statusEl) {
                    statusEl.className = 'url-status url-status-error';
                    statusEl.textContent = `✗ ${result.message || 'Erreur de validation'}`;
                }
            }
        } catch (error) {
            hasInvalidUrl = true;
            if (statusEl) {
                statusEl.className = 'url-status url-status-error';
                statusEl.textContent = '✗ Erreur de connexion';
            }
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.classList.remove('loading');
            }
        }
    }

    // Si des URLs sont invalides, demander confirmation
    if (hasInvalidUrl) {
        showLoading(false);
        const confirm = window.confirm('Certaines URLs ne sont pas accessibles. Voulez-vous quand même sauvegarder la configuration ?');
        if (!confirm) {
            return;
        }
        showLoading(true);
    }

    const data = {
        SNOWSHELF_TZ: document.getElementById('cfgTimezone').value,
        WS_OCR_TIMEOUT: parseInt(document.getElementById('cfgOcrTimeout').value) || 10000,
        IDENTIFY_OCR_URL: document.getElementById('cfgOcrUrl').value,
        IDENTIFY_INFOS_URL: document.getElementById('cfgInfosUrl').value,
        API_ENCRYPTION_KEY: document.getElementById('cfgEncryptionKey').value,
        AUTO_TRAD_URL: document.getElementById('cfgTradUrl').value
    };

    try {
        const response = await fetch(`${CONFIG_API}?table=Admin_Main_Config`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            credentials: 'same-origin'
        });

        const result = await response.json();

        if (result.success) {
            showToast('Configuration sauvegardée', 'success');
        } else {
            showToast(result.message || 'Erreur lors de la sauvegarde', 'error');
        }
    } catch (error) {
        console.error('Save config error:', error);
        showToast('Erreur de connexion', 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Initialise les événements du module
 * @param {Object} elements - Références aux éléments DOM
 */
export function initMainConfig(elements) {
    if (elements.mainConfigForm) {
        elements.mainConfigForm.addEventListener('submit', handleMainConfigSubmit);
    }
    
    // URL Test Buttons
    document.querySelectorAll('.btn-test-url').forEach(btn => {
        btn.addEventListener('click', () => testUrl(btn.dataset.target));
    });
}
