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
    updateSelectAllButtonLabel();
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
 * Mettre à jour le label du bouton "Tout sélectionner / Tout désélectionner"
 */
export function updateSelectAllButtonLabel() {
    const t = getTranslations();
    const selectAllBtn = document.getElementById('wsSelectAllImages');
    const gallery = document.getElementById('wsImageGallery');
    
    if (!selectAllBtn || !gallery) return;
    
    // Récupérer toutes les URLs des images de la galerie
    const galleryImages = Array.from(gallery.querySelectorAll('.detail-thumb-wrapper'))
        .map(wrapper => wrapper.dataset.url)
        .filter(Boolean);
    
    // Vérifier si toutes les images de la galerie sont sélectionnées
    const allGallerySelected = galleryImages.length > 0 && 
        galleryImages.every(img => state.selectedImages?.has(img));
    
    selectAllBtn.textContent = allGallerySelected 
        ? (t.detail_deselect_all_images || 'Tout désélectionner')
        : (t.detail_select_all_images || 'Tout sélectionner');
}

/**
 * Mettre à jour le champ Images dans les options d'import
 */
export function updateImageImportField() {
    // Le champ peut être dans wsImportFields ou wsMediaFields selon le contexte
    const imageField = document.querySelector('[data-field="images"]');
    if (!imageField) return;
    
    const checkbox = imageField.querySelector('input[type="checkbox"]');
    const valueSpan = imageField.querySelector('.import-field-value');
    
    const count = state.selectedImages ? state.selectedImages.size : 0;
    
    if (count > 0) {
        imageField.classList.remove('disabled');
        if (checkbox) {
            checkbox.disabled = false;
            checkbox.checked = true;
        }
        if (valueSpan) {
            valueSpan.textContent = `${count} image(s)`;
            valueSpan.title = `${count} image(s)`;
        }
    } else {
        imageField.classList.add('disabled');
        if (checkbox) {
            checkbox.disabled = true;
            checkbox.checked = false;
        }
        if (valueSpan) {
            valueSpan.textContent = '-';
            valueSpan.title = '-';
        }
    }
}
