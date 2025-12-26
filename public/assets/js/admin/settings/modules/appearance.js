/**
 * SnowShelf - Admin Appearance Module
 * Gestion de l'apparence (thème, langue, background)
 */

import { API_ENDPOINTS } from '/assets/js/admin/core/config.js';
import { showToast, showLoading } from '/assets/js/admin/core/utils.js';
import { currentBackgroundPath, setBackgroundPath, clearBackgroundPath } from '/assets/js/admin/core/state.js';

const CONFIG_API = API_ENDPOINTS.CONFIG;

// Éléments DOM
let elements = {};

/**
 * Charge les paramètres d'apparence
 */
export async function loadAppearance() {
    if (!elements.defaultTheme) {
        return;
    }

    try {
        const response = await fetch(`${CONFIG_API}?table=Admin_Main_Config`, {
            credentials: 'same-origin'
        });
        const result = await response.json();

        if (result.success && result.data.exists) {
            const data = result.data.data;
            
            // Thème par défaut
            if (data.DEFAULT_THEME) {
                elements.defaultTheme.value = data.DEFAULT_THEME;
            }
            
            // Langue par défaut
            if (data.DEFAULT_LANG && elements.defaultLang) {
                elements.defaultLang.value = data.DEFAULT_LANG;
            }
            
            // Background
            if (data.DEFAULT_BACKGROUND) {
                setBackgroundPath(data.DEFAULT_BACKGROUND);
                showBackgroundPreview('../' + data.DEFAULT_BACKGROUND);
            }
        }
    } catch (error) {
        console.error('Load appearance error:', error);
    }
}

/**
 * Affiche la prévisualisation du background
 * @param {string} url - URL de l'image
 */
export function showBackgroundPreview(url) {
    if (elements.backgroundPreviewImg) {
        elements.backgroundPreviewImg.src = url;
        elements.backgroundPreviewImg.style.display = 'block';
    }
    if (elements.backgroundPlaceholder) {
        elements.backgroundPlaceholder.style.display = 'none';
    }
    if (elements.removeBackgroundBtn) {
        elements.removeBackgroundBtn.style.display = 'inline-flex';
    }
}

/**
 * Cache la prévisualisation du background
 */
export function hideBackgroundPreview() {
    if (elements.backgroundPreviewImg) {
        elements.backgroundPreviewImg.src = '';
        elements.backgroundPreviewImg.style.display = 'none';
    }
    if (elements.backgroundPlaceholder) {
        elements.backgroundPlaceholder.style.display = 'flex';
    }
    if (elements.removeBackgroundBtn) {
        elements.removeBackgroundBtn.style.display = 'none';
    }
    clearBackgroundPath();
}

/**
 * Gère la sélection d'un fichier background
 * @param {Event} e - Événement change
 */
export function handleBackgroundSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Vérifier le type
    if (!file.type.startsWith('image/')) {
        showToast('Veuillez sélectionner une image', 'error');
        return;
    }

    // Vérifier la taille (5 Mo max)
    if (file.size > 5 * 1024 * 1024) {
        showToast('L\'image est trop volumineuse (max 5 Mo)', 'error');
        return;
    }

    // Prévisualiser
    const reader = new FileReader();
    reader.onload = (event) => {
        showBackgroundPreview(event.target.result);
    };
    reader.readAsDataURL(file);
}

/**
 * Gère la suppression du background
 */
export async function handleRemoveBackground() {
    if (!confirm('Supprimer l\'image de fond par défaut ?')) return;

    showLoading(true);
    try {
        const response = await fetch(`${CONFIG_API}?action=delete_background`, {
            method: 'DELETE',
            credentials: 'same-origin'
        });

        const result = await response.json();

        if (result.success) {
            hideBackgroundPreview();
            if (elements.backgroundFile) {
                elements.backgroundFile.value = '';
            }
            clearBackgroundPath();
            removeBackgroundFromPage();
            showToast('Image supprimée', 'success');
        } else {
            showToast(result.message || 'Erreur lors de la suppression', 'error');
        }
    } catch (error) {
        console.error('Delete background error:', error);
        showToast('Erreur de connexion', 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Applique un background à la page courante
 * @param {string} url - URL du background
 */
export function applyBackgroundToPage(url) {
    // Supprimer l'ancien style si existant
    let styleEl = document.getElementById('dynamic-background-style');
    if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = 'dynamic-background-style';
        document.head.appendChild(styleEl);
    }
    
    styleEl.textContent = `
        body {
            background-image: url('${url}') !important;
            background-size: cover !important;
            background-position: center !important;
            background-attachment: fixed !important;
            background-repeat: no-repeat !important;
        }
        body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: -1;
            pointer-events: none;
        }
    `;
}

/**
 * Retire le background de la page courante
 */
export function removeBackgroundFromPage() {
    const styleEl = document.getElementById('dynamic-background-style');
    if (styleEl) {
        styleEl.remove();
    }
    document.body.style.backgroundImage = '';
}

/**
 * Gère la soumission du formulaire d'apparence
 * @param {Event} e - Événement de soumission
 */
export async function handleAppearanceSubmit(e) {
    e.preventDefault();
    showLoading(true);

    try {
        // 1. Uploader le background si un fichier a été sélectionné
        const backgroundFile = elements.backgroundFile?.files[0];
        let bgPath = currentBackgroundPath;
        
        if (backgroundFile) {
            const formData = new FormData();
            formData.append('background', backgroundFile);

            const uploadResponse = await fetch(`${CONFIG_API}?action=upload_background`, {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            });

            const uploadResult = await uploadResponse.json();
            if (!uploadResult.success) {
                showToast(uploadResult.message || 'Erreur lors de l\'upload', 'error');
                showLoading(false);
                return;
            }
            bgPath = uploadResult.data.path;
            setBackgroundPath(bgPath);
        }

        // 2. Sauvegarder les autres paramètres
        const data = {
            DEFAULT_THEME: elements.defaultTheme.value,
            DEFAULT_LANG: elements.defaultLang?.value || 'fr'
        };

        const response = await fetch(`${CONFIG_API}?table=Admin_Main_Config`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
            credentials: 'same-origin'
        });

        const result = await response.json();

        if (result.success) {
            showToast('Apparence sauvegardée', 'success');
            // Reset le file input
            if (elements.backgroundFile) {
                elements.backgroundFile.value = '';
            }
            
            // Appliquer immédiatement le thème à la page
            const newTheme = elements.defaultTheme.value;
            document.documentElement.setAttribute('data-theme', newTheme);
            
            // Appliquer le background si uploadé
            if (bgPath) {
                applyBackgroundToPage('/' + bgPath);
            }
        } else {
            showToast(result.message || 'Erreur lors de la sauvegarde', 'error');
        }
    } catch (error) {
        console.error('Save appearance error:', error);
        showToast('Erreur de connexion', 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Initialise le module d'apparence
 * @param {Object} domElements - Références aux éléments DOM
 */
export function initAppearance(domElements) {
    elements = domElements;
    
    if (elements.appearanceForm) {
        elements.appearanceForm.addEventListener('submit', handleAppearanceSubmit);
    }
    if (elements.selectBackgroundBtn) {
        elements.selectBackgroundBtn.addEventListener('click', () => {
            elements.backgroundFile?.click();
        });
    }
    if (elements.backgroundFile) {
        elements.backgroundFile.addEventListener('change', handleBackgroundSelect);
    }
    if (elements.removeBackgroundBtn) {
        elements.removeBackgroundBtn.addEventListener('click', handleRemoveBackground);
    }
}
