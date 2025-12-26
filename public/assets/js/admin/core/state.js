/**
 * SnowShelf - Admin State Management
 * État partagé entre les modules admin
 */

// État pour la suppression
export let deleteTarget = null;

export function setDeleteTarget(target) {
    deleteTarget = target;
}

export function clearDeleteTarget() {
    deleteTarget = null;
}

// État pour l'apparence
export let currentBackgroundPath = null;

export function setBackgroundPath(path) {
    currentBackgroundPath = path;
}

export function clearBackgroundPath() {
    currentBackgroundPath = null;
}

// État pour les types primaires
export let primaryTypesData = [];

export function setPrimaryTypesData(data) {
    primaryTypesData = Array.isArray(data) ? data : [];
}

// État pour les champs de métadonnées
export let typeFieldsData = [];

export function setTypeFieldsData(data) {
    typeFieldsData = Array.isArray(data) ? data : [];
}

// État pour les mappings
export let fieldMappingsData = [];

export function setFieldMappingsData(data) {
    fieldMappingsData = Array.isArray(data) ? data : [];
}

// État pour les types de transformation
export let transformTypesData = [];

export function setTransformTypesData(data) {
    transformTypesData = Array.isArray(data) ? data : [];
}
