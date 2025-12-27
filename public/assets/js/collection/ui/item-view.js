/**
 * Module de visualisation d'un item de collection
 * @module collection/ui/item-view
 */

import { getTranslations } from '../state.js';
import { escapeHtml, formatDate, formatCurrency, renderMdiIcon } from '../utils.js';
import { loadItemDetails, deleteItem } from '../api.js';
import { showToast, showError } from './feedback.js';

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
    
    for (const [key, data] of Object.entries(metadata)) {
        if (data.value === null || data.value === '' || data.value === undefined) continue;
        
        const icon = data.icon || '';
        const label = data.label || key;
        let displayValue = data.value;
        
        // Formater la valeur selon le type
        if (data.type === 'select') {
            // Les valeurs select sont déjà des strings lisibles
            displayValue = escapeHtml(data.value);
        } else if (data.type === 'multiselect' && Array.isArray(data.value)) {
            displayValue = data.value.map(v => `<span class="metadata-tag">${escapeHtml(v)}</span>`).join('');
        } else if (data.type === 'url' && data.value) {
            displayValue = `<a href="${escapeHtml(data.value)}" target="_blank" rel="noopener">${escapeHtml(data.value)}</a>`;
        } else if (data.type === 'rating' && data.value) {
            displayValue = `${buildStarsHtml(parseFloat(data.value))} <span>${parseFloat(data.value).toFixed(1)}/5</span>`;
        } else if (data.type === 'number' || data.type === 'year') {
            displayValue = escapeHtml(data.value.toString());
        } else {
            displayValue = escapeHtml(data.value.toString());
        }
        
        fieldsHtml += `
            <div class="metadata-view-item">
                <div class="metadata-view-label">
                    ${icon ? `<span class="metadata-icon">${icon}</span>` : ''}
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

    // Compteurs médias
    const mediaCounters = {
        images: item.images?.length || 0,
        videos: item.videos?.length || 0,
        audios: item.audios?.length || 0,
        documents: item.documents?.length || 0
    };

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
            <div class="item-view-section item-media-section">
                <h4 class="section-title">${t.section_media}</h4>
                <div class="media-counters">
                    <div class="media-counter">
                        <span class="media-icon">🖼️</span>
                        <span class="media-label">${t.images_count.replace('%d', mediaCounters.images)}</span>
                    </div>
                    <div class="media-counter">
                        <span class="media-icon">🎬</span>
                        <span class="media-label">${t.videos_count.replace('%d', mediaCounters.videos)}</span>
                    </div>
                    <div class="media-counter">
                        <span class="media-icon">🎵</span>
                        <span class="media-label">${t.audios_count.replace('%d', mediaCounters.audios)}</span>
                    </div>
                    <div class="media-counter">
                        <span class="media-icon">📄</span>
                        <span class="media-label">${t.documents_count.replace('%d', mediaCounters.documents)}</span>
                    </div>
                </div>
                <p class="media-coming-soon text-muted">${t.media_coming_soon}</p>
            </div>
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
                }
            }
        }
    });
}
