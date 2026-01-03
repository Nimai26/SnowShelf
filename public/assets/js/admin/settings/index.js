/**
 * SnowShelf - Admin Settings Entry Point
 * Point d'entrée principal pour les paramètres d'administration
 */

// Core imports (chemins absolus depuis la racine du site)
import { API_ENDPOINTS } from '/assets/js/admin/core/config.js';
import { showToast, showLoading, markActiveNavItem } from '/assets/js/admin/core/utils.js';
import { deleteTarget, setDeleteTarget, clearDeleteTarget } from '/assets/js/admin/core/state.js';

// UI imports
import { initTabs, switchTab } from '/assets/js/admin/ui/tabs.js';
import { closeAllDropdowns, initFilterDropdown } from '/assets/js/admin/ui/dropdown.js';

// Settings modules imports
import { initMainConfig, loadMainConfig, testUrl, testAllUrls } from './modules/main-config.js';
import { initAppearance, loadAppearance } from './modules/appearance.js';
import { initApis, loadApis, openAddApiModal, openEditApiModal as editApi } from './modules/apis.js';
import { initLimits, loadLimits, openAddLimitModal, openEditLimitModal as editLimit, prepareDeleteLimit } from './modules/limits.js';
import { initGrades, loadGrades, openAddGradeModal, openEditGradeModal as editGrade, prepareDeleteGrade } from './modules/grades.js';
import { initStatuses, loadStatuses, openAddStatusModal, openEditStatusModal as editStatus, prepareDeleteStatus } from './modules/statuses.js';
import { initUploadConfig, loadUploadConfigs, openAddUploadConfigModal, openEditUploadConfigModal as editUploadConfig, prepareDeleteUploadConfig } from './modules/upload-config.js';
import { initProxyWhitelist, loadProxyWhitelist, saveProxyCategory, saveAllProxyWhitelist, exportProxyWhitelist } from './modules/proxy-whitelist.js';
import { initPrimaryTypes, loadPrimaryTypes } from './modules/primary-types.js';
import { initTypeFields, loadTypeFields, openAddTypeFieldModal, openEditTypeFieldModal as editTypeField, prepareDeleteTypeField } from './modules/type-fields.js';
import { initFieldMappings, loadFieldMappings, openAddFieldMappingModal, openEditFieldMappingModal as editFieldMapping, prepareDeleteFieldMapping } from './modules/field-mappings.js';
import { initItemFieldMappings, openItemFieldMappingsModal } from './modules/item-field-mappings.js';

const CONFIG_API = API_ENDPOINTS.CONFIG;

// Référence au ModalManager (sera injecté)
let ModalManager = null;

/**
 * Références aux éléments DOM
 */
const elements = {
    // Navigation
    settingsNav: null,
    settingsTabs: null,
    
    // Main Config
    mainConfigForm: null,
    
    // Appearance
    appearanceForm: null,
    defaultTheme: null,
    defaultLang: null,
    selectBackgroundBtn: null,
    backgroundFile: null,
    removeBackgroundBtn: null,
    backgroundPreviewImg: null,
    backgroundPlaceholder: null,
    
    // APIs
    apisTableBody: null,
    addApiBtn: null,
    apiModal: null,
    apiModalTitle: null,
    apiModalClose: null,
    apiModalCancel: null,
    apiForm: null,
    toggleApiKey: null,
    
    // Limits
    limitsTableBody: null,
    addLimitBtn: null,
    limitModal: null,
    limitModalTitle: null,
    limitModalClose: null,
    limitModalCancel: null,
    limitForm: null,
    
    // Grades
    gradesTableBody: null,
    addGradeBtn: null,
    gradeModal: null,
    gradeModalTitle: null,
    gradeModalClose: null,
    gradeModalCancel: null,
    gradeForm: null,
    
    // Statuses
    statusesTableBody: null,
    addStatusBtn: null,
    statusModal: null,
    statusModalTitle: null,
    statusModalClose: null,
    statusModalCancel: null,
    statusForm: null,
    
    // Upload Config
    uploadConfigTableBody: null,
    addUploadConfigBtn: null,
    uploadConfigModal: null,
    uploadConfigModalTitle: null,
    uploadConfigModalClose: null,
    uploadConfigModalCancel: null,
    uploadConfigForm: null,
    
    // Primary Types
    primaryTypesContainer: null,
    
    // Type Fields
    typeFieldsTableBody: null,
    addTypeFieldBtn: null,
    typeFieldModal: null,
    typeFieldModalTitle: null,
    typeFieldModalClose: null,
    typeFieldModalCancel: null,
    typeFieldForm: null,
    
    // Field Mappings
    fieldMappingsTableBody: null,
    addFieldMappingBtn: null,
    itemFieldMappingsBtn: null,
    fieldMappingModal: null,
    fieldMappingModalTitle: null,
    fieldMappingModalClose: null,
    fieldMappingModalCancel: null,
    fieldMappingForm: null,
    
    // Delete confirmation
    deleteModal: null,
    deleteModalClose: null,
    deleteModalCancel: null,
    deleteModalConfirm: null,
    deleteItemName: null
};

/**
 * Initialise les références DOM
 */
function initElements() {
    // Navigation
    elements.settingsNav = document.getElementById('settingsNav');
    elements.settingsTabs = document.querySelectorAll('.settings-tab');
    
    // Main Config
    elements.mainConfigForm = document.getElementById('mainConfigForm');
    
    // Appearance
    elements.appearanceForm = document.getElementById('appearanceForm');
    elements.defaultTheme = document.getElementById('defaultTheme');
    elements.defaultLang = document.getElementById('defaultLang');
    elements.selectBackgroundBtn = document.getElementById('selectBackgroundBtn');
    elements.backgroundFile = document.getElementById('backgroundFile');
    elements.removeBackgroundBtn = document.getElementById('removeBackgroundBtn');
    elements.backgroundPreviewImg = document.getElementById('backgroundPreviewImg');
    elements.backgroundPlaceholder = document.getElementById('backgroundPlaceholder');
    
    // APIs
    elements.apisTableBody = document.getElementById('apisTableBody');
    elements.addApiBtn = document.getElementById('addApiBtn');
    elements.apiModal = document.getElementById('apiModal');
    elements.apiModalTitle = document.getElementById('apiModalTitle');
    elements.apiModalClose = document.getElementById('apiModalClose');
    elements.apiModalCancel = document.getElementById('apiModalCancel');
    elements.apiForm = document.getElementById('apiForm');
    elements.toggleApiKey = document.getElementById('toggleApiKey');
    
    // Limits
    elements.limitsTableBody = document.getElementById('limitsTableBody');
    elements.addLimitBtn = document.getElementById('addLimitBtn');
    elements.limitModal = document.getElementById('limitModal');
    elements.limitModalTitle = document.getElementById('limitModalTitle');
    elements.limitModalClose = document.getElementById('limitModalClose');
    elements.limitModalCancel = document.getElementById('limitModalCancel');
    elements.limitForm = document.getElementById('limitForm');
    
    // Grades
    elements.gradesTableBody = document.getElementById('gradesTableBody');
    elements.addGradeBtn = document.getElementById('addGradeBtn');
    elements.gradeModal = document.getElementById('gradeModal');
    elements.gradeModalTitle = document.getElementById('gradeModalTitle');
    elements.gradeModalClose = document.getElementById('gradeModalClose');
    elements.gradeModalCancel = document.getElementById('gradeModalCancel');
    elements.gradeForm = document.getElementById('gradeForm');
    
    // Statuses
    elements.statusesTableBody = document.getElementById('statusesTableBody');
    elements.addStatusBtn = document.getElementById('addStatusBtn');
    elements.statusModal = document.getElementById('statusModal');
    elements.statusModalTitle = document.getElementById('statusModalTitle');
    elements.statusModalClose = document.getElementById('statusModalClose');
    elements.statusModalCancel = document.getElementById('statusModalCancel');
    elements.statusForm = document.getElementById('statusForm');
    
    // Upload Config
    elements.uploadConfigTableBody = document.getElementById('uploadConfigTableBody');
    elements.addUploadConfigBtn = document.getElementById('addUploadConfigBtn');
    elements.uploadConfigModal = document.getElementById('uploadConfigModal');
    elements.uploadConfigModalTitle = document.getElementById('uploadConfigModalTitle');
    elements.uploadConfigModalClose = document.getElementById('uploadConfigModalClose');
    elements.uploadConfigModalCancel = document.getElementById('uploadConfigModalCancel');
    elements.uploadConfigForm = document.getElementById('uploadConfigForm');
    
    // Primary Types
    elements.primaryTypesContainer = document.getElementById('primaryTypesContainer');
    
    // Type Fields
    elements.typeFieldsTableBody = document.getElementById('typeFieldsTableBody');
    elements.addTypeFieldBtn = document.getElementById('addTypeFieldBtn');
    elements.typeFieldModal = document.getElementById('typeFieldModal');
    elements.typeFieldModalTitle = document.getElementById('typeFieldModalTitle');
    elements.typeFieldModalClose = document.getElementById('typeFieldModalClose');
    elements.typeFieldModalCancel = document.getElementById('typeFieldModalCancel');
    elements.typeFieldForm = document.getElementById('typeFieldForm');
    
    // Field Mappings
    elements.fieldMappingsTableBody = document.getElementById('fieldMappingsTableBody');
    elements.addFieldMappingBtn = document.getElementById('addFieldMappingBtn');
    elements.itemFieldMappingsBtn = document.getElementById('itemFieldMappingsBtn');
    elements.fieldMappingModal = document.getElementById('fieldMappingModal');
    elements.fieldMappingModalTitle = document.getElementById('fieldMappingModalTitle');
    elements.fieldMappingModalClose = document.getElementById('fieldMappingModalClose');
    elements.fieldMappingModalCancel = document.getElementById('fieldMappingModalCancel');
    elements.fieldMappingForm = document.getElementById('fieldMappingForm');
    
    // Delete confirmation
    elements.deleteModal = document.getElementById('deleteModal');
    elements.deleteModalClose = document.getElementById('deleteModalClose');
    elements.deleteModalCancel = document.getElementById('deleteCancel');
    elements.deleteModalConfirm = document.querySelector('#deleteModal .btn-danger');
    elements.deleteItemName = document.getElementById('deleteItemName');
}

/**
 * Callback de confirmation de suppression
 * @param {number} id - ID de l'élément
 * @param {string} name - Nom de l'élément
 * @param {string} type - Type d'élément
 */
function openDeleteConfirmModal(id, name, type) {
    if (elements.deleteItemName) {
        elements.deleteItemName.textContent = `${type} "${name}"`;
    }
    if (elements.deleteModal) {
        elements.deleteModal.classList.add('active');
    }
}

/**
 * Effectue la suppression de l'élément confirmé
 */
async function performDelete() {
    const target = deleteTarget;
    if (!target) return;
    
    showLoading(true);
    
    try {
        // Construire l'URL selon si c'est une API dédiée ou via config.php
        let url;
        if (target.api) {
            // API dédiée (grades, statuses, type-fields, field-mappings)
            url = `${target.api}?id=${target.id}`;
        } else if (target.table) {
            // Via config.php (user_limits, upload_config, Admin_webApi)
            url = `${CONFIG_API}?table=${target.table}&id=${target.id}`;
        } else {
            throw new Error('Cible de suppression invalide');
        }
        
        const response = await fetch(url, {
            method: 'DELETE',
            credentials: 'same-origin'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Élément supprimé', 'success');
            
            // Recharger la section appropriée selon le type ou la table
            const typeOrTable = target.type || target.table;
            switch (typeOrTable) {
                case 'Admin_webApi':
                    loadApis();
                    break;
                case 'user_limits':
                    loadLimits();
                    break;
                case 'grade':
                    loadGrades();
                    break;
                case 'status':
                    loadStatuses();
                    break;
                case 'upload_config':
                    loadUploadConfigs();
                    break;
                case 'primary_type':
                    loadPrimaryTypes();
                    break;
                case 'type_field':
                    loadTypeFields();
                    break;
                case 'field_mapping':
                    loadFieldMappings();
                    break;
            }
        } else {
            showToast(result.message || 'Erreur lors de la suppression', 'error');
        }
    } catch (error) {
        console.error('[Settings] Delete error:', error);
        showToast('Erreur de connexion', 'error');
    } finally {
        showLoading(false);
        clearDeleteTarget();
        if (elements.deleteModal) {
            elements.deleteModal.classList.remove('active');
        }
    }
}

/**
 * Initialise les événements globaux
 */
function initGlobalEvents() {
    // Fermeture des dropdowns au clic externe
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.custom-dropdown')) {
            closeAllDropdowns();
        }
    });
    
    // Delete modal
    if (elements.deleteModalClose) {
        elements.deleteModalClose.addEventListener('click', () => {
            elements.deleteModal?.classList.remove('active');
            clearDeleteTarget();
        });
    }
    if (elements.deleteModalCancel) {
        elements.deleteModalCancel.addEventListener('click', () => {
            elements.deleteModal?.classList.remove('active');
            clearDeleteTarget();
        });
    }
    if (elements.deleteModalConfirm) {
        elements.deleteModalConfirm.addEventListener('click', performDelete);
    }
    if (elements.deleteModal) {
        elements.deleteModal.querySelector('.modal-backdrop')?.addEventListener('click', () => {
            elements.deleteModal.classList.remove('active');
            clearDeleteTarget();
        });
    }
    
    // Fermer les modals avec Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllDropdowns();
            document.querySelectorAll('.modal.active').forEach(modal => {
                modal.classList.remove('active');
            });
        }
    });
}

/**
 * Charge toutes les données initiales
 */
async function loadAllData() {
    showLoading(true);
    
    try {
        // Charger les données en parallèle où possible
        await Promise.all([
            loadMainConfig(),
            loadAppearance(),
            loadApis(),
            loadLimits(),
            loadGrades(),
            loadStatuses(),
            loadUploadConfigs(),
            loadProxyWhitelist(),
            loadPrimaryTypes()
        ]);
        
        // Ces dépendent des primary types
        await loadTypeFields();
        await loadFieldMappings();
        
    } catch (error) {
        console.error('[Settings] Load all data error:', error);
        showToast('Erreur lors du chargement des données', 'error');
    } finally {
        showLoading(false);
    }
}

/**
 * Initialise le panneau settings
 * @param {Object} modalManager - Instance du ModalManager
 */
export function init(modalManager) {
    ModalManager = modalManager;
    
    // Initialiser les références DOM
    initElements();
    
    // Initialiser les événements globaux
    initGlobalEvents();
    
    // Initialiser les onglets
    const tabs = document.querySelectorAll('#settingsSection .settings-tab');
    const panels = document.querySelectorAll('#settingsSection .settings-panel');
    initTabs(tabs, panels);
    
    // Initialiser les modules individuels
    initMainConfig(elements);
    initAppearance(elements);
    initApis(elements);
    initLimits(elements, openDeleteConfirmModal);
    initGrades(elements, openDeleteConfirmModal);
    initStatuses(elements, openDeleteConfirmModal);
    initUploadConfig(elements, openDeleteConfirmModal);
    initProxyWhitelist(elements);
    initPrimaryTypes(elements, ModalManager);
    initTypeFields(elements, openDeleteConfirmModal);
    initFieldMappings(elements, openDeleteConfirmModal);
    initItemFieldMappings(elements, ModalManager);
    
    // Marquer l'élément de navigation actif
    markActiveNavItem('admin-settings');
    
    // Charger les données
    loadAllData();
    
    console.log('[Settings] Initialized');
}

/**
 * API publique exposée globalement pour les onclick inline
 */
window.SettingsPanel = {
    // APIs
    editApi: editApi,
    deleteApi: (id, name) => {
        setDeleteTarget({ table: 'Admin_webApi', id, name });
        openDeleteConfirmModal(id, name, 'API');
    },
    editItemFieldMappings: () => {
        if (ModalManager) {
            openItemFieldMappingsModal(ModalManager);
        }
    },
    
    // Limits
    editLimit: editLimit,
    deleteLimit: (id, name) => prepareDeleteLimit(id, name),
    
    // Grades
    editGrade: editGrade,
    deleteGrade: (id, name) => prepareDeleteGrade(id, name),
    
    // Statuses
    editStatus: editStatus,
    deleteStatus: (id, name) => prepareDeleteStatus(id, name),
    
    // Upload Config
    editUploadConfig: editUploadConfig,
    deleteUploadConfig: (id, category) => prepareDeleteUploadConfig(id, category),
    
    // Proxy Whitelist
    saveProxyCategory: saveProxyCategory,
    saveAllProxyWhitelist: saveAllProxyWhitelist,
    exportProxyWhitelist: exportProxyWhitelist,
    
    // Type Fields
    editTypeField: editTypeField,
    deleteTypeField: (id, name) => prepareDeleteTypeField(id, name),
    
    // Field Mappings
    editFieldMapping: editFieldMapping,
    deleteFieldMapping: (id, name) => prepareDeleteFieldMapping(id, name),
    
    // URL testing
    testUrl: testUrl,
    testAllUrls: testAllUrls
};

// Export pour utilisation en module
export default {
    init,
    loadMainConfig,
    loadAppearance,
    loadApis,
    loadLimits,
    loadGrades,
    loadStatuses,
    loadUploadConfigs,
    loadProxyWhitelist,
    loadPrimaryTypes,
    loadTypeFields,
    loadFieldMappings
};
