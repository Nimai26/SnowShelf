/**
 * Module de visualisation d'un item de collection
 * @module collection/ui/item-view
 */

import { getTranslations } from '../state.js';
import { escapeHtml, formatDate, formatCurrency, renderMdiIcon } from '../utils.js';
import { loadItemDetails, deleteItem } from '../api.js';
import { showToast, showError } from './feedback.js';

/**
 * Formate une durée en secondes en mm:ss
 * @param {number} seconds - Durée en secondes
 * @returns {string} Durée formatée
 */
function formatDuration(seconds) {
    if (!seconds || isNaN(seconds)) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Formate une tracklist pour l'affichage en mode consultation
 * @param {Array|string} tracks - Tableau de pistes ou JSON stringifié
 * @returns {string} HTML de la tracklist
 */
function formatTracklistForView(tracks) {
    // Parser si c'est une string JSON
    let trackList = tracks;
    if (typeof tracks === 'string') {
        try {
            trackList = JSON.parse(tracks);
        } catch (e) {
            return escapeHtml(tracks);
        }
    }
    
    if (!Array.isArray(trackList) || trackList.length === 0) {
        return '<span class="text-muted">-</span>';
    }
    
    // Construire un tableau HTML simple pour la tracklist
    let html = '<ol class="tracklist-view">';
    for (const track of trackList) {
        const title = track.title || track.name || 'Sans titre';
        const duration = track.duration ? formatDuration(track.duration) : '';
        html += `<li class="tracklist-view-item">
            <span class="track-title">${escapeHtml(title)}</span>
            ${duration ? `<span class="track-duration">${duration}</span>` : ''}
        </li>`;
    }
    html += '</ol>';
    
    return html;
}

/**
 * Formate une liste d'images avec noms pour l'affichage
 * @param {Array|string} items - Tableau d'items ou JSON stringifié
 * @param {string} fieldKey - Clé du champ (pour déterminer le label)
 * @returns {string} HTML de la liste d'images
 */
function formatImageListForView(items, fieldKey = '') {
    // Parser si c'est une string JSON
    let itemList = items;
    if (typeof items === 'string') {
        try {
            itemList = JSON.parse(items);
        } catch (e) {
            return escapeHtml(items);
        }
    }
    
    if (!Array.isArray(itemList) || itemList.length === 0) {
        return '<span class="text-muted">-</span>';
    }
    
    // Calculer le total avec quantités
    let totalQuantity = 0;
    itemList.forEach(item => {
        totalQuantity += (item.quantity || 1);
    });
    
    // Déterminer le label selon le fieldKey
    const itemLabel = fieldKey.toLowerCase().includes('minifig') ? 'minifigurine' : 'élément';
    const itemLabelPlural = fieldKey.toLowerCase().includes('minifig') ? 'minifigurines' : 'éléments';
    
    // Construire la grille d'images
    let html = `<div class="image-list-view-wrapper">`;
    html += `<div class="image-list-view-header">
        <span class="image-list-view-count">${totalQuantity} ${totalQuantity > 1 ? itemLabelPlural : itemLabel}</span>
        <span class="image-list-view-unique">(${itemList.length} unique${itemList.length > 1 ? 's' : ''})</span>
    </div>`;
    
    html += `<div class="image-list-view-grid">`;
    
    for (const item of itemList) {
        const name = item.name || item.id || 'Sans nom';
        const quantity = item.quantity || 1;
        // Prioriser l'image locale si elle existe (supporter imageUrl et image_url)
        const imageUrl = item.local_image || item.image_url || item.imageUrl || '';
        const hasImage = !!imageUrl;
        
        html += `<div class="image-list-view-item">`;
        
        // Image ou placeholder
        html += `<div class="image-list-view-item-image ${!hasImage ? 'no-image' : ''}">`;
        if (hasImage) {
            html += `<img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(name)}" loading="lazy" onerror="this.parentElement.classList.add('no-image'); this.style.display='none';">`;
        } else {
            html += `<span class="mdi mdi-image-off-outline"></span>`;
        }
        html += `</div>`;
        
        // Nom et quantité
        html += `<div class="image-list-view-item-info">`;
        html += `<span class="image-list-view-item-name" title="${escapeHtml(name)}">${escapeHtml(name)}</span>`;
        if (quantity > 1) {
            html += `<span class="image-list-view-item-quantity">×${quantity}</span>`;
        }
        html += `</div>`;
        
        html += `</div>`;
    }
    
    html += `</div></div>`;
    
    return html;
}

/**
 * Formate les images spéciales pour l'affichage en mode consultation
 * @param {Array|Object|string} value - Données des images spéciales
 * @returns {string} HTML des images spéciales
 */
function formatSpecialStickersForView(value) {
    // Parser si c'est une string JSON
    let specialData = value;
    if (typeof value === 'string') {
        try {
            specialData = JSON.parse(value);
        } catch (e) {
            return escapeHtml(value);
        }
    }
    
    if (!specialData || typeof specialData !== 'object') {
        return '<span class="text-muted">-</span>';
    }
    
    // Nouveau format de stockage: {types: [...], owned: {...}}
    if (specialData.types && Array.isArray(specialData.types)) {
        const owned = specialData.owned || {};
        
        if (specialData.types.length === 0) {
            return '<span class="text-muted">-</span>';
        }
        
        let html = '<div class="special-stickers-view">';
        
        for (const typeInfo of specialData.types) {
            const typeName = typeInfo.type_original || typeInfo.type || 'Spéciales';
            const typeKey = typeInfo.type || '';
            const total = typeInfo.total || 0;
            const range = typeInfo.range || '';
            
            // Calculer combien sont possédées
            const ownedItems = owned[typeKey] || [];
            const ownedCount = ownedItems.length;
            const missingCount = total - ownedCount;
            
            html += `<div class="special-sticker-view-type">
                <span class="special-type-name">${escapeHtml(typeName)}</span>
                ${range ? `<span class="special-type-range">(${escapeHtml(range)})</span>` : ''}
                <span class="special-type-count">${total} image(s)</span>
                ${missingCount > 0 ? `<span class="special-type-missing">${missingCount} manquante(s)</span>` : '<span class="special-type-complete">✅ Complet</span>'}
            </div>`;
        }
        
        html += '</div>';
        return html;
    }
    
    // Ancien format: objet direct avec clés de type {metallic: ["A", "B"]}
    if (!Array.isArray(specialData)) {
        const firstValue = Object.values(specialData)[0];
        if (Array.isArray(firstValue)) {
            // C'est des données possédées {type: [items]} - ancien format
            const parts = [];
            for (const [type, items] of Object.entries(specialData)) {
                if (Array.isArray(items) && items.length > 0) {
                    const typeName = type.charAt(0).toUpperCase() + type.slice(1);
                    parts.push(`<div class="special-sticker-view-type">
                        <span class="special-type-name">${escapeHtml(typeName)}</span>: 
                        <span class="special-type-owned">${items.length} possédée(s)</span>
                    </div>`);
                }
            }
            return parts.length > 0 ? `<div class="special-stickers-view">${parts.join('')}</div>` : '<span class="text-muted">-</span>';
        }
        return '<span class="text-muted">-</span>';
    }
    
    // Format tableau (données API directes): [{type, type_original, total, range, items}]
    let html = '<div class="special-stickers-view">';
    
    for (const special of specialData) {
        if (!special || typeof special !== 'object') continue;
        
        const typeName = special.type_original || special.type || 'Spéciales';
        const total = special.total || (Array.isArray(special.items) ? special.items.length : 0);
        const range = special.range || '';
        
        // Si on a des items possédés, calculer les manquantes
        let ownedCount = 0;
        let missingCount = total;
        if (Array.isArray(special.owned)) {
            ownedCount = special.owned.length;
            missingCount = total - ownedCount;
        }
        
        html += `<div class="special-sticker-view-type">
            <span class="special-type-name">${escapeHtml(typeName)}</span>
            ${range ? `<span class="special-type-range">(${escapeHtml(range)})</span>` : ''}
            <span class="special-type-count">${total} image(s)</span>
            ${missingCount > 0 ? `<span class="special-type-missing">${missingCount} manquante(s)</span>` : '<span class="special-type-complete">✅ Complet</span>'}
        </div>`;
    }
    
    html += '</div>';
    return html;
}

/**
 * Récupère l'extension d'un fichier depuis son URL
 * @param {string} url - URL du fichier
 * @returns {string} Extension en minuscules
 */
function getFileExtension(url) {
    if (!url) return '';
    // Enlever les paramètres de requête
    const cleanUrl = url.split('?')[0];
    const parts = cleanUrl.split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

/**
 * Récupère l'icône appropriée pour un document selon son extension
 * @param {string} extension - Extension du fichier
 * @returns {string} Emoji icône
 */
function getDocumentIcon(extension) {
    const icons = {
        pdf: '📕',
        doc: '📘', docx: '📘',
        xls: '📗', xlsx: '📗',
        txt: '📝', rtf: '📝', odt: '📘',
        zip: '📦', rar: '📦', '7z': '📦',
        epub: '📚', cbz: '📚', cbr: '📚'
    };
    return icons[extension] || '📄';
}

/**
 * Initialise le lazy loading des images avec Intersection Observer
 * Charge les images uniquement quand elles sont visibles dans le viewport
 * @param {HTMLElement} container - Conteneur avec les images à charger
 */
function initLazyLoadImages(container) {
    const lazyImages = container.querySelectorAll('img.lazy-image');
    
    if (lazyImages.length === 0) return;
    
    // Utiliser Intersection Observer pour un vrai lazy loading performant
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    const src = img.dataset.src;
                    if (src) {
                        img.src = src;
                        img.classList.add('lazy-loaded');
                        img.classList.remove('lazy-image');
                        // Supprimer le data-src une fois chargé
                        delete img.dataset.src;
                    }
                    // Ne plus observer cette image
                    observer.unobserve(img);
                }
            });
        }, {
            // Options : charger les images légèrement avant qu'elles soient visibles
            rootMargin: '50px 0px',
            threshold: 0.01
        });
        
        lazyImages.forEach(img => {
            imageObserver.observe(img);
        });
    } else {
        // Fallback pour les navigateurs sans Intersection Observer
        // Charger toutes les images immédiatement
        lazyImages.forEach(img => {
            const src = img.dataset.src;
            if (src) {
                img.src = src;
                img.classList.add('lazy-loaded');
                img.classList.remove('lazy-image');
            }
        });
    }
}

/**
 * Génère l'URL du thumbnail pour une image
 * @param {string} url - URL originale de l'image
 * @param {number} size - Taille du thumbnail (défaut: 200)
 * @returns {string} URL du thumbnail
 */
function getThumbnailUrl(url, size = 200) {
    // Si c'est déjà une URL externe (http/https), ne pas transformer
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    // Générer l'URL du thumbnail pour les images locales
    return `/api/thumbnail.php?path=${encodeURIComponent(url)}&size=${size}`;
}

/**
 * Construit le HTML pour l'affichage de la galerie de médias en mode consultation
 * @param {Object} item - L'item avec ses médias
 * @param {Object} t - Traductions
 * @returns {string} HTML de la section médias
 */
function buildMediaGalleryHtml(item, t) {
    const images = item.images || [];
    const videos = item.videos || [];
    const audios = item.audios || [];
    const documents = item.documents || [];
    
    const totalMedia = images.length + videos.length + audios.length + documents.length;
    
    if (totalMedia === 0) {
        return `
            <div class="item-view-section item-media-section">
                <h4 class="section-title">${t.section_media}</h4>
                <p class="text-muted">${t.no_media || 'Aucun média'}</p>
            </div>
        `;
    }
    
    let html = `<div class="item-view-section item-media-section">
        <h4 class="section-title">${t.section_media}</h4>
        <div class="media-gallery-view">`;
    
    // Section Images - avec thumbnails pour la performance
    if (images.length > 0) {
        html += `
            <div class="media-gallery-group">
                <h5 class="media-gallery-group-title">🖼️ ${t.images_count.replace('%d', images.length)}</h5>
                <div class="media-gallery-grid media-gallery-images">
                    ${images.map((img, index) => {
                        // Utiliser un thumbnail de 200px pour la galerie
                        const thumbUrl = getThumbnailUrl(img.url, 200);
                        return `
                        <div class="media-gallery-item image-item" data-type="image" data-url="${escapeHtml(img.url)}" data-index="${index}">
                            <img src="${escapeHtml(thumbUrl)}" alt="Image ${index + 1}" loading="lazy" decoding="async">
                            <div class="media-gallery-overlay">
                                <button type="button" class="media-view-btn" title="${t.view || 'Voir'}">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                        <circle cx="12" cy="12" r="3"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    `}).join('')}
                </div>
            </div>`;
    }
    
    // Section Vidéos
    if (videos.length > 0) {
        html += `
            <div class="media-gallery-group">
                <h5 class="media-gallery-group-title">🎬 ${t.videos_count.replace('%d', videos.length)}</h5>
                <div class="media-gallery-grid media-gallery-videos">
                    ${videos.map((video, index) => `
                        <div class="media-gallery-item video-item" data-type="video" data-url="${escapeHtml(video.url)}" data-index="${index}">
                            ${video.thumbnail_url 
                                ? `<img src="${escapeHtml(video.thumbnail_url)}" alt="Vidéo ${index + 1}" loading="lazy">`
                                : `<div class="media-gallery-placeholder">🎬</div>`
                            }
                            <div class="media-gallery-overlay">
                                <button type="button" class="media-view-btn" title="${t.play || 'Lire'}">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <polygon points="5 3 19 12 5 21 5 3"/>
                                    </svg>
                                </button>
                            </div>
                            <div class="media-video-badge">▶</div>
                        </div>
                    `).join('')}
                </div>
            </div>`;
    }
    
    // Section Audio
    if (audios.length > 0) {
        html += `
            <div class="media-gallery-group">
                <h5 class="media-gallery-group-title">🎵 ${t.audios_count.replace('%d', audios.length)}</h5>
                <div class="media-gallery-list media-gallery-audios">
                    ${audios.map((audio, index) => {
                        const filename = audio.url.split('/').pop().split('?')[0];
                        return `
                            <div class="media-audio-item" data-type="audio" data-url="${escapeHtml(audio.url)}" data-index="${index}">
                                <div class="media-audio-header">
                                    <span class="media-audio-icon">🎵</span>
                                    <span class="media-audio-name">${escapeHtml(decodeURIComponent(filename))}</span>
                                </div>
                                <audio controls preload="none" class="media-audio-player">
                                    <source src="${escapeHtml(audio.url)}" type="audio/mpeg">
                                </audio>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>`;
    }
    
    // Section Documents
    if (documents.length > 0) {
        html += `
            <div class="media-gallery-group">
                <h5 class="media-gallery-group-title">📄 ${t.documents_count.replace('%d', documents.length)}</h5>
                <div class="media-gallery-list media-gallery-documents">
                    ${documents.map((doc, index) => {
                        const rawFilename = doc.url.split('/').pop().split('?')[0];
                        const filename = decodeURIComponent(rawFilename);
                        const ext = getFileExtension(doc.url);
                        const icon = getDocumentIcon(ext);
                        return `
                            <div class="media-document-item" data-type="document" data-url="${escapeHtml(doc.url)}" data-index="${index}">
                                <span class="media-document-icon">${icon}</span>
                                <div class="media-document-info">
                                    <span class="media-document-name">${escapeHtml(filename)}</span>
                                    ${ext ? `<span class="media-document-ext">${ext.toUpperCase()}</span>` : ''}
                                </div>
                                <div class="media-document-actions">
                                    <a href="${escapeHtml(doc.url)}" target="_blank" class="media-doc-btn" title="${t.view || 'Voir'}">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                            <circle cx="12" cy="12" r="3"/>
                                        </svg>
                                    </a>
                                    <a href="${escapeHtml(doc.url)}" download class="media-doc-btn" title="${t.download || 'Télécharger'}">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                            <polyline points="7 10 12 15 17 10"/>
                                            <line x1="12" y1="15" x2="12" y2="3"/>
                                        </svg>
                                    </a>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>`;
    }
    
    html += '</div></div>';
    
    return html;
}

/**
 * Ouvre une lightbox simple pour afficher une image
 * @param {string} url - URL de l'image
 * @param {Array} allImages - Toutes les images pour navigation
 * @param {number} currentIndex - Index de l'image actuelle
 */
function openImageLightbox(url, allImages = [], currentIndex = 0) {
    const t = getTranslations();
    
    // Créer l'overlay lightbox
    const lightbox = document.createElement('div');
    lightbox.className = 'media-lightbox';
    lightbox.innerHTML = `
        <div class="media-lightbox-backdrop"></div>
        <div class="media-lightbox-content">
            <img src="${escapeHtml(url)}" alt="" class="media-lightbox-image">
            ${allImages.length > 1 ? `
                <button type="button" class="media-lightbox-nav media-lightbox-prev" title="${t.prev_image || 'Précédent'}">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="15 18 9 12 15 6"></polyline>
                    </svg>
                </button>
                <button type="button" class="media-lightbox-nav media-lightbox-next" title="${t.next_image || 'Suivant'}">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </button>
                <div class="media-lightbox-counter">${currentIndex + 1} / ${allImages.length}</div>
            ` : ''}
            <button type="button" class="media-lightbox-close" title="${t.close || 'Fermer'}">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
    `;
    
    document.body.appendChild(lightbox);
    document.body.style.overflow = 'hidden';
    
    // Animation d'entrée
    requestAnimationFrame(() => lightbox.classList.add('active'));
    
    let current = currentIndex;
    
    // Fonction pour changer d'image
    const showImage = (index) => {
        if (index < 0) index = allImages.length - 1;
        if (index >= allImages.length) index = 0;
        current = index;
        const img = lightbox.querySelector('.media-lightbox-image');
        img.src = allImages[index].url;
        const counter = lightbox.querySelector('.media-lightbox-counter');
        if (counter) counter.textContent = `${current + 1} / ${allImages.length}`;
    };
    
    // Fonction pour fermer
    const closeLightbox = () => {
        lightbox.classList.remove('active');
        setTimeout(() => {
            lightbox.remove();
            document.body.style.overflow = '';
        }, 200);
    };
    
    // Événements
    lightbox.querySelector('.media-lightbox-backdrop').addEventListener('click', closeLightbox);
    lightbox.querySelector('.media-lightbox-close').addEventListener('click', closeLightbox);
    
    if (allImages.length > 1) {
        lightbox.querySelector('.media-lightbox-prev')?.addEventListener('click', () => showImage(current - 1));
        lightbox.querySelector('.media-lightbox-next')?.addEventListener('click', () => showImage(current + 1));
    }
    
    // Navigation clavier
    const handleKeydown = (e) => {
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft' && allImages.length > 1) showImage(current - 1);
        if (e.key === 'ArrowRight' && allImages.length > 1) showImage(current + 1);
    };
    document.addEventListener('keydown', handleKeydown);
    
    // Nettoyer l'événement clavier à la fermeture
    lightbox.addEventListener('transitionend', () => {
        if (!lightbox.classList.contains('active')) {
            document.removeEventListener('keydown', handleKeydown);
        }
    });
}

/**
 * Ouvre une modale simple pour lire une vidéo
 * @param {string} url - URL de la vidéo
 */
function openVideoPlayer(url) {
    const t = getTranslations();
    
    const modal = document.createElement('div');
    modal.className = 'media-lightbox media-video-player';
    modal.innerHTML = `
        <div class="media-lightbox-backdrop"></div>
        <div class="media-lightbox-content media-video-content">
            <video controls autoplay class="media-video-element">
                <source src="${escapeHtml(url)}" type="video/mp4">
                ${t.video_not_supported || 'Votre navigateur ne supporte pas la lecture vidéo.'}
            </video>
            <button type="button" class="media-lightbox-close" title="${t.close || 'Fermer'}">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
    `;
    
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';
    
    requestAnimationFrame(() => modal.classList.add('active'));
    
    const closeModal = () => {
        const video = modal.querySelector('video');
        if (video) video.pause();
        modal.classList.remove('active');
        setTimeout(() => {
            modal.remove();
            document.body.style.overflow = '';
        }, 200);
    };
    
    modal.querySelector('.media-lightbox-backdrop').addEventListener('click', closeModal);
    modal.querySelector('.media-lightbox-close').addEventListener('click', closeModal);
    
    const handleKeydown = (e) => {
        if (e.key === 'Escape') closeModal();
    };
    document.addEventListener('keydown', handleKeydown);
    modal.addEventListener('transitionend', () => {
        if (!modal.classList.contains('active')) {
            document.removeEventListener('keydown', handleKeydown);
        }
    });
}

/**
 * Initialise les événements de clic sur la galerie de médias
 * @param {HTMLElement} modal - Élément modal
 * @param {Object} item - Données de l'item
 */
function initMediaGalleryEvents(modal, item) {
    const t = getTranslations();
    
    // Initialiser le lazy loading des images pour la performance
    initLazyLoadImages(modal);
    
    // Clic sur les images - ouvrir dans lightbox simple
    const imageItems = modal.querySelectorAll('.media-gallery-item.image-item');
    imageItems.forEach((imgItem, index) => {
        imgItem.addEventListener('click', () => {
            const url = imgItem.dataset.url;
            if (url) {
                openImageLightbox(url, item.images || [], index);
            }
        });
    });
    
    // Clic sur les vidéos - ouvrir player vidéo
    const videoItems = modal.querySelectorAll('.media-gallery-item.video-item');
    videoItems.forEach((vidItem) => {
        vidItem.addEventListener('click', () => {
            const url = vidItem.dataset.url;
            if (url) {
                openVideoPlayer(url);
            }
        });
    });
    
    // Clic sur les documents - ouvrir selon le type
    const docViewBtns = modal.querySelectorAll('.media-document-item .media-doc-btn:first-of-type');
    docViewBtns.forEach((btn) => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const url = btn.getAttribute('href');
            const filename = btn.closest('.media-document-item')?.querySelector('.media-document-name')?.textContent || 'document';
            const ext = filename.split('.').pop()?.toLowerCase();
            
            // PDF et EPUB : utiliser DocumentViewer si disponible
            if ((ext === 'pdf' || ext === 'epub' || ext === 'cbz' || ext === 'cbr') && typeof DocumentViewer !== 'undefined') {
                DocumentViewer.open(url, filename);
            } else {
                // Autres documents : ouvrir dans un nouvel onglet
                window.open(url, '_blank');
            }
        });
    });
}

/**
 * Construit les étoiles pour l'affichage de la note
 * @param {number} rating - Note sur 5
 * @returns {string} HTML des étoiles
 */
export function buildStarsHtml(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        const fillClass = i <= rating ? 'filled' : (i - 0.5 <= rating ? 'half' : '');
        html += `<svg class="star ${fillClass}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
        </svg>`;
    }
    return html;
}

/**
 * Construit le HTML pour l'affichage des métadonnées en mode consultation
 * @param {Object} metadata - Objet de métadonnées {field_key: {field_id, label, icon, type, value}}
 * @param {Object} t - Traductions
 * @returns {string} HTML de la section métadonnées
 */
export function buildMetadataViewHtml(metadata, t) {
    if (!metadata || Object.keys(metadata).length === 0) {
        return '';
    }

    let fieldsHtml = '';
    
    // Récupérer le total de stickers pour calculer les manquants
    const totalStickers = metadata['total_stickers']?.value ? parseInt(metadata['total_stickers'].value, 10) : 0;
    
    for (const [key, data] of Object.entries(metadata)) {
        if (data.value === null || data.value === '' || data.value === undefined) continue;
        
        // Ignorer checklist (données brutes, pas utile à afficher)
        if (key === 'checklist') continue;
        
        const icon = data.icon || '';
        const label = data.label || key;
        let displayValue = data.value;
        
        // Formater la valeur selon le type
        if (data.type === 'select') {
            // Les valeurs select sont déjà des strings lisibles
            displayValue = escapeHtml(data.value);
        } else if (key === 'sticker_grid' && data.type === 'multiselect') {
            // Grille de stickers : afficher les MANQUANTES au lieu des possédées
            const owned = Array.isArray(data.value) ? data.value : [];
            const ownedSet = new Set(owned.map(v => String(v)));
            
            if (totalStickers > 0) {
                // Calculer les manquantes
                const missing = [];
                for (let i = 1; i <= totalStickers; i++) {
                    if (!ownedSet.has(String(i))) {
                        missing.push(i);
                    }
                }
                
                const missingCount = missing.length;
                const ownedCount = owned.length;
                
                if (missingCount === 0) {
                    displayValue = `<span class="sticker-complete">✅ Collection complète ! (${ownedCount}/${totalStickers})</span>`;
                } else {
                    // Afficher un résumé + les manquantes (limité si trop nombreuses)
                    const maxDisplay = 50;
                    const missingDisplay = missing.slice(0, maxDisplay);
                    const missingTags = missingDisplay.map(v => `<span class="metadata-tag missing-tag">${escapeHtml(String(v))}</span>`).join('');
                    const moreText = missing.length > maxDisplay ? `<span class="text-muted">... et ${missing.length - maxDisplay} autres</span>` : '';
                    displayValue = `<div class="sticker-summary">${missingCount} manquante(s) sur ${totalStickers}</div>
                                   <div class="sticker-missing-list">${missingTags}${moreText}</div>`;
                }
            } else {
                // Pas de total, afficher les possédées comme avant
                displayValue = owned.map(v => `<span class="metadata-tag">${escapeHtml(String(v))}</span>`).join('');
            }
        } else if (key === 'special_stickers') {
            // Images spéciales : parser et afficher par type avec manquantes
            displayValue = formatSpecialStickersForView(data.value);
        } else if (data.type === 'multiselect' && Array.isArray(data.value)) {
            // Gérer les valeurs qui peuvent être des objets {id, name, ...} ou des strings
            displayValue = data.value.map(v => {
                // Si c'est un objet, extraire le nom ou la valeur textuelle
                const text = typeof v === 'object' && v !== null 
                    ? (v.name || v.label || v.title || v.value || JSON.stringify(v))
                    : String(v);
                return `<span class="metadata-tag">${escapeHtml(text)}</span>`;
            }).join('');
        } else if (data.type === 'url' && data.value) {
            displayValue = `<a href="${escapeHtml(data.value)}" target="_blank" rel="noopener">${escapeHtml(data.value)}</a>`;
        } else if (data.type === 'rating' && data.value) {
            displayValue = `${buildStarsHtml(parseFloat(data.value))} <span>${parseFloat(data.value).toFixed(1)}/5</span>`;
        } else if (data.type === 'tracklist') {
            // Afficher la tracklist sous forme de liste numérotée
            displayValue = formatTracklistForView(data.value);
        } else if (data.type === 'image_list') {
            // Afficher la liste d'images avec noms (minifigs, personnages, etc.)
            displayValue = formatImageListForView(data.value, key);
        } else if (data.type === 'number' || data.type === 'year') {
            displayValue = escapeHtml(data.value.toString());
        } else {
            displayValue = escapeHtml(data.value.toString());
        }
        
        fieldsHtml += `
            <div class="metadata-view-item">
                <div class="metadata-view-label">
                    ${icon ? `<span class="metadata-icon">${renderMdiIcon(icon)}</span>` : ''}
                    <span>${escapeHtml(label)}</span>
                </div>
                <div class="metadata-view-value">${displayValue}</div>
            </div>
        `;
    }
    
    if (!fieldsHtml) {
        return '';
    }

    return `
        <!-- Section Détails spécifiques (accordéon) -->
        <div class="item-view-section item-metadata-section">
            <button type="button" class="accordion-header" aria-expanded="false">
                <h4 class="section-title">${t.tab_details || 'Détails'}</h4>
                <svg class="accordion-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </button>
            <div class="accordion-content">
                <div class="metadata-view-grid">
                    ${fieldsHtml}
                </div>
            </div>
        </div>
    `;
}

/**
 * Construit le HTML de visualisation d'un item
 * @param {Object} item - Données de l'item
 * @param {Object|null} metadata - Métadonnées de l'item
 * @returns {string} HTML de la vue
 */
export function buildItemViewHtml(item, metadata = null) {
    const t = getTranslations();
    
    // Thumbnail principal
    const mainImage = item.images && item.images.length > 0 
        ? item.images[0].url 
        : null;
    
    const thumbnailHtml = mainImage
        ? `<img src="${escapeHtml(mainImage)}" alt="${escapeHtml(item.name)}" class="item-view-thumbnail">`
        : `<div class="item-view-no-image">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
           </div>`;

    // Note avec étoiles
    const ratingHtml = item.rating 
        ? `<div class="item-view-rating">${buildStarsHtml(item.rating)} <span>${item.rating.toFixed(1)}/5</span></div>`
        : '';

    // Badge statut
    let statusBadge = '';
    if (item.status_id && item.status) {
        const statusColor = item.status.color || '#6b7280';
        statusBadge = `<span class="item-badge status-badge" style="background-color: ${statusColor};">${escapeHtml(item.status.name)}</span>`;
    } else {
        statusBadge = `<span class="item-badge no-status">${t.no_status}</span>`;
    }

    // Badge type primaire
    let primaryTypeBadge = '';
    if (item.primary_type) {
        const typeColor = item.primary_type.color || '#6b7280';
        const typeIcon = item.primary_type.icon || '📦';
        primaryTypeBadge = `<span class="item-badge type-badge" style="background-color: ${typeColor};">
            <span class="type-icon">${renderMdiIcon(typeIcon)}</span>
            ${escapeHtml(item.primary_type.name)}
        </span>`;
    }

    // Catégories
    const categoriesHtml = item.categories && item.categories.length > 0
        ? item.categories.map(cat => `<span class="item-category-tag">${escapeHtml(cat.name)}</span>`).join('')
        : `<span class="text-muted">${t.no_categories}</span>`;

    // Grades (états physiques)
    const gradesHtml = item.grades && item.grades.length > 0
        ? item.grades.map(g => `<span class="item-grade-tag">${escapeHtml(g.name || 'Grade #' + g.grade_id)}</span>`).join('')
        : `<span class="text-muted">${t.no_grades}</span>`;


    // Dates formatées
    const createdDate = item.created_at ? formatDate(item.created_at) : t.no_date;
    const updatedDate = item.updated_at ? formatDate(item.updated_at) : t.no_date;
    const acquisitionDate = item.acquisition_date ? formatDate(item.acquisition_date) : t.no_date;

    // Section métadonnées (détails spécifiques au type)
    const metadataHtml = buildMetadataViewHtml(metadata, t);

    return `
        <div class="item-view-content">
            <!-- En-tête avec image et infos principales -->
            <div class="item-view-header">
                <div class="item-view-image-container">
                    ${thumbnailHtml}
                </div>
                <div class="item-view-main-info">
                    <h2 class="item-view-name">${escapeHtml(item.name)}</h2>
                    ${ratingHtml}
                    <div class="item-view-badges">
                        ${primaryTypeBadge}
                        ${statusBadge}
                    </div>
                    <div class="item-view-categories">
                        ${categoriesHtml}
                    </div>
                </div>
            </div>

            <!-- Section Description -->
            <div class="item-view-section">
                <h4 class="section-title">${t.field_description}</h4>
                <p class="item-view-description">${item.description ? escapeHtml(item.description) : `<span class="text-muted">${t.no_description}</span>`}</p>
            </div>

            <!-- Section Notes personnelles -->
            <div class="item-view-section">
                <h4 class="section-title">${t.field_notes}</h4>
                <p class="item-view-notes">${item.note ? escapeHtml(item.note) : `<span class="text-muted">${t.no_notes}</span>`}</p>
            </div>

            ${metadataHtml}

            <!-- Section Valeurs -->
            <div class="item-view-section item-values-section">
                <h4 class="section-title">${t.section_values}</h4>
                <div class="item-view-grid">
                    <div class="item-view-info">
                        <label>${t.field_purchase_price}</label>
                        <span>${item.purchase_price ? formatCurrency(item.purchase_price) : t.no_value}</span>
                    </div>
                    <div class="item-view-info">
                        <label>${t.field_market_value}</label>
                        <span class="value-highlight">${item.market_value ? formatCurrency(item.market_value) : t.no_value}</span>
                    </div>
                    <div class="item-view-info">
                        <label>${t.field_barcode}</label>
                        <span>${item.code_barre ? escapeHtml(item.code_barre) : t.no_barcode}</span>
                    </div>
                </div>
            </div>

            <!-- Section Dates -->
            <div class="item-view-section item-dates-section">
                <h4 class="section-title">${t.section_dates}</h4>
                <div class="item-view-grid">
                    <div class="item-view-info">
                        <label>${t.field_acquisition_date}</label>
                        <span>${acquisitionDate}</span>
                    </div>
                    <div class="item-view-info">
                        <label>${t.created_at}</label>
                        <span>${createdDate}</span>
                    </div>
                    <div class="item-view-info">
                        <label>${t.updated_at}</label>
                        <span>${updatedDate}</span>
                    </div>
                </div>
            </div>

            <!-- Section États physiques -->
            <div class="item-view-section">
                <h4 class="section-title">${t.section_grades}</h4>
                <div class="item-grades-list">
                    ${gradesHtml}
                </div>
            </div>

            <!-- Section Médias -->
            ${buildMediaGalleryHtml(item, t)}
        </div>
    `;
}

/**
 * Ouvre la modal de visualisation d'un item existant
 * @param {number} itemId - ID de l'item à afficher
 * @param {boolean} editMode - Si true, ouvre directement en mode édition
 * @param {Function} openItemEditModal - Fonction pour ouvrir la modal d'édition
 */
export async function openItemModal(itemId, editMode = false, openItemEditModal = null) {
    const t = getTranslations();
    
    // Afficher un loader pendant le chargement
    const loadingId = ModalManager.open({
        template: 'loading',
        title: t.loading
    });

    // Charger les détails complets de l'item
    const item = await loadItemDetails(itemId);
    
    // Fermer le loader
    ModalManager.close(loadingId);

    if (!item) {
        showError(t.error_load);
        return;
    }

    // Si mode édition demandé, ouvrir directement le formulaire d'édition
    if (editMode && openItemEditModal) {
        openItemEditModal(item);
        return;
    }

    // Charger les métadonnées si l'item a un type primaire
    let metadata = null;
    if (item.id_primary_cat || item.primary_type) {
        try {
            const metaResponse = await fetch(`/api/item-metadata.php?action=values&item_id=${itemId}`);
            const metaData = await metaResponse.json();
            if (metaData.success && metaData.data?.values) {
                metadata = metaData.data.values;
            }
        } catch (err) {
            console.warn('[Collection] Could not load metadata:', err);
        }
    }

    // Construire la vue de visualisation
    const viewHtml = buildItemViewHtml(item, metadata);
    
    // Boutons de la modal
    const buttons = [
        { 
            text: t.delete, 
            action: 'delete-item', 
            class: 'btn-danger'
        },
        { text: t.close, action: 'close', class: 'btn-secondary' },
        { 
            text: t.edit, 
            action: 'edit-item', 
            class: 'btn-primary'
        }
    ];

    ModalManager.open({
        template: 'base',
        title: t.modal_view_title,
        content: viewHtml,
        size: 'modal-lg',
        customClass: 'modal-item-view',
        buttons: buttons,
        data: { item: item },
        onOpen: (id) => {
            // Initialiser l'accordéon des métadonnées
            const modal = document.querySelector(`[data-modal-id="${id}"]`);
            if (modal) {
                const accordionHeader = modal.querySelector('.accordion-header');
                if (accordionHeader) {
                    accordionHeader.addEventListener('click', function() {
                        const isExpanded = this.getAttribute('aria-expanded') === 'true';
                        this.setAttribute('aria-expanded', !isExpanded);
                        this.classList.toggle('active', !isExpanded);
                    });
                }
                
                // Gestionnaires de clic sur les médias
                initMediaGalleryEvents(modal, item);
            }
        },
        onAction: async (action, id, data) => {
            if (action === 'edit-item') {
                ModalManager.close(id);
                if (openItemEditModal) {
                    openItemEditModal(data.item);
                }
            } else if (action === 'delete-item') {
                const confirmed = await ModalManager.confirm(t.delete_confirm_message, {
                    title: t.delete_confirm_title,
                    type: 'danger',
                    confirmText: t.delete,
                    cancelText: t.cancel
                });
                if (confirmed) {
                    await deleteItem(data.item.id);
                    ModalManager.close(id);
                    // Notifier la suppression pour rafraîchir la liste
                    document.dispatchEvent(new CustomEvent('collection:itemDeleted', { 
                        detail: { itemId: data.item.id } 
                    }));
                    showToast(t.deleted_success || 'Item supprimé', 'success');
                }
            }
        }
    });
}
