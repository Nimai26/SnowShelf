/**
 * SnowShelf - Web Search Module
 * Gestion de la galerie d'images
 */

import { state } from '../state.js';
import { getTranslations } from '../utils/helpers.js';

/**
 * Configurer les événements de la galerie d'images
 */
export function setupGalleryEvents() {
    const gallery = document.getElementById('wsImageGallery');
    if (!gallery) return;
    
    gallery.querySelectorAll('.detail-thumb-wrapper').forEach(wrapper => {
        const thumb = wrapper.querySelector('.detail-thumb');
        const imageUrl = wrapper.dataset.url;
        
        // Simple clic = voir l'image en grand
        thumb.addEventListener('click', (e) => {
            e.preventDefault();
            selectGalleryImage(thumb, imageUrl);
        });
        
        // Double-clic = sélectionner/désélectionner pour import
        wrapper.addEventListener('dblclick', (e) => {
            e.preventDefault();
            toggleImageSelection(wrapper, imageUrl);
        });
    });
}

/**
 * Sélectionner une image dans la galerie (affichage)
 * @param {HTMLElement} thumbEl - Élément miniature
 * @param {string} imageUrl - URL de l'image
 */
export function selectGalleryImage(thumbEl, imageUrl) {
    const mainImage = document.getElementById('wsMainImage');
    if (mainImage) {
        mainImage.src = imageUrl;
    }
    
    document.querySelectorAll('.detail-image-gallery .detail-thumb').forEach(thumb => {
        thumb.classList.remove('active');
    });
    if (thumbEl) {
        thumbEl.classList.add('active');
    }
}

/**
 * Basculer la sélection d'une image pour l'import
 * @param {HTMLElement} wrapperEl - Élément wrapper
 * @param {string} imageUrl - URL de l'image
 */
export function toggleImageSelection(wrapperEl, imageUrl) {
    if (!state.selectedImages) {
        state.selectedImages = new Set();
    }
    
    if (state.selectedImages.has(imageUrl)) {
        state.selectedImages.delete(imageUrl);
        wrapperEl.classList.remove('selected');
    } else {
        state.selectedImages.add(imageUrl);
        wrapperEl.classList.add('selected');
    }
    
    updateSelectedImagesCount();
    updateImageImportField();
}

/**
 * Mettre à jour le compteur d'images sélectionnées
 */
export function updateSelectedImagesCount() {
    const t = getTranslations();
    const countEl = document.getElementById('wsSelectedImagesCount');
    if (countEl && state.selectedImages) {
        countEl.textContent = `${state.selectedImages.size} ${t.detail_images_selected || 'sélectionnée(s)'}`;
    }
}

/**
 * Mettre à jour le champ Image dans les options d'import
 */
export function updateImageImportField() {
    const imageField = document.querySelector('#wsImportFields [data-field="image"]');
    if (!imageField) return;
    
    const checkbox = imageField.querySelector('input[type="checkbox"]');
    const valueSpan = imageField.querySelector('.import-field-value');
    
    if (state.selectedImages && state.selectedImages.size > 0) {
        imageField.classList.remove('disabled');
        if (checkbox) {
            checkbox.disabled = false;
            checkbox.checked = true;
        }
        if (valueSpan) {
            valueSpan.textContent = state.selectedImages.size > 1 
                ? `${state.selectedImages.size} images` 
                : '✓';
        }
    } else {
        imageField.classList.add('disabled');
        if (checkbox) {
            checkbox.disabled = true;
            checkbox.checked = false;
        }
        if (valueSpan) {
            valueSpan.textContent = '-';
        }
    }
}
