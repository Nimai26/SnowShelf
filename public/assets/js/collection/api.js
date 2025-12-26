/**
 * SnowShelf - Collection Module
 * api.js - Appels API
 */

import { CONFIG, state } from './state.js';

/**
 * Charge les catégories de l'utilisateur
 * @returns {Promise<Array>} Liste des catégories
 */
export async function loadCategories() {
    try {
        const response = await fetch(CONFIG.CATEGORIES_API, {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (data.success && data.data) {
            state.categories = data.data;
            return data.data;
        }
        return [];
    } catch (error) {
        console.error('[Collection] Erreur chargement catégories:', error);
        return [];
    }
}

/**
 * Charge les statuts disponibles pour l'utilisateur
 * @returns {Promise<Array>} Liste des statuts
 */
export async function loadStatuses() {
    try {
        const response = await fetch(CONFIG.STATUSES_API, {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (data.success && data.data) {
            state.statuses = data.data.statuses || [];
            return state.statuses;
        }
        return [];
    } catch (error) {
        console.error('[Collection] Erreur chargement statuts:', error);
        return [];
    }
}

/**
 * Charge les types primaires
 * @returns {Promise<Array>} Liste des types primaires
 */
export async function loadPrimaryTypes() {
    try {
        const response = await fetch(CONFIG.PRIMARY_TYPES_API, {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (data.success && data.data) {
            state.primaryTypes = data.data;
            return data.data;
        }
        return [];
    } catch (error) {
        console.error('[Collection] Erreur chargement types primaires:', error);
        return [];
    }
}

/**
 * Charge les grades (états physiques)
 * @returns {Promise<Array>} Liste des grades
 */
export async function loadGrades() {
    try {
        const response = await fetch(CONFIG.GRADES_API, {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (data.success && data.data) {
            // L'API retourne {grades: [...], count: ...}
            const grades = data.data.grades || data.data || [];
            state.grades = grades;
            return grades;
        }
        return [];
    } catch (error) {
        console.error('[Collection] Erreur chargement grades:', error);
        return [];
    }
}

/**
 * Charge les grades par catégories
 * @param {Array<number>} categoryIds - IDs des catégories
 * @returns {Promise<Array>} Liste des grades
 */
export async function loadGradesByCategories(categoryIds) {
    if (!categoryIds || categoryIds.length === 0) {
        return loadGrades();
    }
    
    try {
        const params = new URLSearchParams();
        categoryIds.forEach(id => params.append('category_ids[]', id));
        
        const response = await fetch(`${CONFIG.GRADES_API}?${params}`, {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (data.success && data.data) {
            // L'API retourne {grades: [...], count: ...}
            return data.data.grades || data.data || [];
        }
        return [];
    } catch (error) {
        console.error('[Collection] Erreur chargement grades par catégories:', error);
        return [];
    }
}

/**
 * Charge les lieux de stockage
 * @returns {Promise<Array>} Liste des lieux de stockage
 */
export async function loadStorageLocations() {
    try {
        const response = await fetch(CONFIG.STORAGE_LOCATIONS_API, {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (data.success && data.data) {
            state.storageLocations = data.data;
            return data.data;
        }
        return [];
    } catch (error) {
        console.error('[Collection] Erreur chargement lieux de stockage:', error);
        return [];
    }
}

/**
 * Charge les items de la collection
 * @param {boolean} append - Ajouter aux items existants (pagination)
 * @returns {Promise<Object>} Résultat avec items et pagination
 */
export async function loadItems(append = false) {
    const params = new URLSearchParams({
        page: state.page,
        limit: CONFIG.ITEMS_PER_PAGE,
        sort: state.sort,
        order: state.order
    });

    if (state.search) params.append('search', state.search);
    if (state.filters.category_id) params.append('category_id', state.filters.category_id);
    if (state.filters.min_rating) params.append('min_rating', state.filters.min_rating);
    if (state.filters.min_value) params.append('min_value', state.filters.min_value);
    if (state.filters.max_value) params.append('max_value', state.filters.max_value);
    if (state.filters.date_from) params.append('date_from', state.filters.date_from);
    if (state.filters.date_to) params.append('date_to', state.filters.date_to);
    if (state.filters.status_id !== null) params.append('status_id', state.filters.status_id);

    const response = await fetch(`${CONFIG.API_ENDPOINT}?${params}`, {
        credentials: 'include'
    });
    const data = await response.json();

    if (data.success) {
        const { items, pagination } = data.data;
        
        if (append) {
            state.items = [...state.items, ...items];
        } else {
            state.items = items;
        }
        
        state.totalItems = pagination.total;
        state.totalPages = pagination.total_pages;
        state.hasMore = pagination.has_more;
        
        return { items, pagination };
    }
    
    throw new Error(data.error || 'Erreur lors du chargement');
}

/**
 * Charge les détails complets d'un item
 * @param {number} itemId - ID de l'item
 * @returns {Promise<Object|null>} Détails de l'item ou null
 */
export async function loadItemDetails(itemId) {
    try {
        const response = await fetch(`${CONFIG.API_ENDPOINT}?id=${itemId}`, {
            credentials: 'include'
        });
        const data = await response.json();
        if (data.success) {
            return data.data;
        }
        throw new Error(data.error || 'Erreur');
    } catch (error) {
        console.error('[Collection] Erreur chargement item:', error);
        return null;
    }
}

/**
 * Sauvegarde un item (création ou mise à jour)
 * @param {FormData} formData - Données du formulaire
 * @param {number|null} itemId - ID de l'item (null pour création)
 * @returns {Promise<Object>} Résultat de la sauvegarde
 */
export async function saveItem(formData, itemId = null) {
    const url = itemId 
        ? `${CONFIG.API_ENDPOINT}?id=${itemId}` 
        : CONFIG.API_ENDPOINT;
    
    const response = await fetch(url, {
        method: itemId ? 'PUT' : 'POST',
        credentials: 'include',
        body: formData
    });
    
    return response.json();
}

/**
 * Supprime un item
 * @param {number} itemId - ID de l'item à supprimer
 * @returns {Promise<Object>} Résultat de la suppression
 */
export async function deleteItem(itemId) {
    const response = await fetch(`${CONFIG.API_ENDPOINT}?id=${itemId}`, {
        method: 'DELETE',
        credentials: 'include'
    });
    
    return response.json();
}

/**
 * Charge les métadonnées d'un item par son type primaire
 * @param {number} typeId - ID du type primaire
 * @param {number|null} itemId - ID de l'item (pour charger les valeurs existantes)
 * @returns {Promise<Object>} Métadonnées avec champs et valeurs
 */
export async function loadMetadataForType(typeId, itemId = null) {
    let url = `/api/item-metadata.php?type_id=${typeId}`;
    if (itemId) {
        url += `&item_id=${itemId}`;
    }
    
    const response = await fetch(url, {
        credentials: 'include'
    });
    
    const data = await response.json();
    if (data.success) {
        return data.data;
    }
    
    throw new Error(data.error || 'Erreur lors du chargement des métadonnées');
}

/**
 * Crée un nouveau lieu de stockage
 * @param {Object} locationData - Données du lieu
 * @returns {Promise<Object>} Résultat de la création
 */
export async function createStorageLocation(locationData) {
    const response = await fetch(CONFIG.STORAGE_LOCATIONS_API, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(locationData)
    });
    
    return response.json();
}

/**
 * Crée un nouveau statut
 * @param {Object} statusData - Données du statut
 * @returns {Promise<Object>} Résultat de la création
 */
export async function createStatus(statusData) {
    const response = await fetch(CONFIG.STATUSES_API, {
        method: 'POST',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(statusData)
    });
    
    return response.json();
}

/**
 * Met à jour un statut
 * @param {number} statusId - ID du statut
 * @param {Object} statusData - Données du statut
 * @returns {Promise<Object>} Résultat de la mise à jour
 */
export async function updateStatus(statusId, statusData) {
    const response = await fetch(`${CONFIG.STATUSES_API}?id=${statusId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(statusData)
    });
    
    return response.json();
}

/**
 * Supprime un statut
 * @param {number} statusId - ID du statut à supprimer
 * @returns {Promise<Object>} Résultat de la suppression
 */
export async function deleteStatusApi(statusId) {
    const response = await fetch(`${CONFIG.STATUSES_API}?id=${statusId}`, {
        method: 'DELETE',
        credentials: 'include'
    });
    
    return response.json();
}
