/**
 * SnowShelf - Collection Module
 * dropdowns/index.js - Point d'entrée pour tous les dropdowns
 */

// Base dropdown
export { createCustomDropdown, createPrimaryTypeDropdown } from './base.js';

// Type primaire
export { populatePrimaryTypeSelect } from './primary-type.js';

// Statut
export { 
    populateStatusSelect, 
    openManageStatusesModal, 
    openStatusEditModal,
    deleteStatus 
} from './status.js';

// Catégories
export {
    createCategoriesSelector,
    populateItemCategoriesSelect
} from './categories.js';

// Grades
export { 
    populateGradesSelect, 
    populateGradesSelectByCategories,
    invalidateGradesCache 
} from './grades.js';

// Emplacements de stockage
export { 
    populateStorageLocationSelect,
    invalidateStorageCache 
} from './storage.js';
