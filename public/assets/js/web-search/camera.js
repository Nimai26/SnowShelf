/**
 * SnowShelf - Web Search Module
 * Gestion caméra et images
 */

import { state, elements } from './state.js';
import { showToast, getTranslation } from './utils/helpers.js';
import { performTextSearch } from './search.js';

/**
 * Traiter un fichier image
 * @param {File} file - Fichier image
 */
export function handleImageFile(file) {
    if (!file.type.startsWith('image/')) {
        showToast(getTranslation('error_invalid_image'), 'error');
        return;
    }
    
    state.currentImage = file;
    
    // Afficher l'aperçu
    const reader = new FileReader();
    reader.onload = (e) => {
        if (elements.imagePreview) {
            elements.imagePreview.src = e.target.result;
            elements.imagePreview.hidden = false;
        }
        if (elements.imagePlaceholder) {
            elements.imagePlaceholder.hidden = true;
        }
        if (elements.imageSearchBtn) {
            elements.imageSearchBtn.disabled = false;
        }
    };
    reader.readAsDataURL(file);
}

/**
 * Ouvre la caméra en mode photo (pour reconnaissance d'image/OCR future)
 */
export function openCameraCapture() {
    if (typeof CameraCapture !== 'undefined') {
        CameraCapture.open({
            mode: 'default',
            facingMode: 'environment',
            skipEditor: false,
            onCapture: (result) => {
                if (result.blob) {
                    handleImageFile(result.blob);
                }
            },
            onCancel: () => {}
        });
    } else {
        showToast(getTranslation('camera_not_available'), 'error');
    }
}

/**
 * Ouvre la caméra en mode scan (détection code-barres)
 */
export function openBarcodeScanner() {
    if (typeof CameraCapture !== 'undefined') {
        CameraCapture.open({
            mode: 'scan',
            scanType: 'barcode',
            facingMode: 'environment',
            onCapture: (result) => {
                if (result.type === 'barcode' && result.code) {
                    console.log('WebSearch: Code-barres détecté:', result.code, result.format);
                    if (elements.searchInput) {
                        elements.searchInput.value = result.code;
                    }
                    setTimeout(() => {
                        performTextSearch();
                    }, 100);
                }
                else if (result.blob) {
                    handleImageFile(result.blob);
                    showToast(getTranslation('barcode_not_detected'), 'warning');
                }
            },
            onCancel: () => {}
        });
    } else {
        showToast(getTranslation('camera_not_available'), 'error');
    }
}
