/**
 * SnowShelf - Admin Configuration
 * Configuration centralisée pour les modules admin
 */

export const API_ENDPOINTS = {
    CONFIG: '../api/admin/config.php',
    USERS: '../api/users.php',
    DATABASES: '../api/admin/databases.php',
    PRIMARY_TYPES: '../api/admin/primary-types.php',
    TYPE_FIELDS: '../api/admin/type-fields.php',
    FIELD_MAPPINGS: '../api/admin/field-mappings.php',
    ITEM_FIELD_MAPPINGS: '../api/admin/item-field-mappings.php',
    PLATFORM_IMAGES: '/api/admin/platform-images.php',
    GRADES: '../api/grades.php',
    STATUSES: '../api/statuses.php'
};

export const ITEM_FIXED_FIELDS = [
    { key: 'name', label: 'Titre', icon: '📝', tab: 'general' },
    { key: 'description', label: 'Description', icon: '📄', tab: 'general' },
    { key: 'value', label: 'Valeur marchande', icon: '💰', tab: 'general' },
    { key: 'code_barre', label: 'Code-barres', icon: '📊', tab: 'general' },
    { key: 'images', label: 'Images', icon: '🖼️', tab: 'medias', isArray: true },
    { key: 'videos', label: 'Vidéos', icon: '🎬', tab: 'medias', isArray: true },
    { key: 'audio', label: 'Audio', icon: '🎵', tab: 'medias', isArray: true },
    { key: 'documents', label: 'Documents', icon: '📁', tab: 'medias', isArray: true }
];

export const TRANSFORM_TYPES = [
    { value: 'direct', label: 'Direct', description: 'Valeur brute sans transformation' },
    { value: 'array', label: 'Array', description: 'Extraire un tableau (ex: items[*].url)' },
    { value: 'first', label: 'Premier', description: 'Premier élément d\'un tableau' },
    { value: 'join', label: 'Joindre', description: 'Concaténer avec séparateur' },
    { value: 'template', label: 'Template', description: 'Format avec variables (ex: https://example.com/{id}.jpg)' }
];
