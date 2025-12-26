<?php
/**
 * SnowShelf - Fragment Collection
 * Page d'affichage de la collection de l'utilisateur
 * 
 * Optimisée pour gérer des milliers d'items via:
 * - Chargement paginé / infinite scroll
 * - Lazy loading des images
 * - Cache-busting pour les images modifiées
 * 
 * Variables disponibles: $userId, $userName, $userData, $pdo, $isPremium, $isAdmin
 */
?>

<div class="collection-page">
    
    <!-- Header de la page -->
    <div class="page-header">
        <div class="header-content">
            <h1><?= htmlspecialchars(__('collection.title')) ?></h1>
            <p class="header-subtitle">
                <span id="collectionCount">0</span> <?= htmlspecialchars(__('collection.items_count')) ?>
            </p>
        </div>
        
        <button class="btn btn-primary" id="btnAddItem">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span><?= htmlspecialchars(__('collection.add_item')) ?></span>
        </button>
    </div>
    
    <!-- Barre de recherche et filtres (sticky) -->
    <div class="collection-toolbar" id="collectionToolbar">
        <div class="toolbar-row">
            <!-- Recherche -->
            <div class="search-box">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input type="text" 
                       id="searchItems" 
                       placeholder="<?= htmlspecialchars(__('collection.search_placeholder')) ?>"
                       autocomplete="off">
                <button type="button" class="search-clear" id="clearSearch" style="display: none;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            
            <!-- Options d'affichage -->
            <div class="toolbar-actions">
                <!-- Tri -->
                <div class="sort-dropdown">
                    <button type="button" class="btn btn-icon" id="sortBtn" title="<?= htmlspecialchars(__('collection.sort')) ?>">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="4" y1="6" x2="20" y2="6"></line>
                            <line x1="4" y1="12" x2="14" y2="12"></line>
                            <line x1="4" y1="18" x2="8" y2="18"></line>
                        </svg>
                    </button>
                    <div class="dropdown-menu" id="sortMenu">
                        <button class="dropdown-item active" data-sort="name" data-order="asc">
                            <span><?= htmlspecialchars(__('collection.sort_name_asc')) ?></span>
                            <svg class="check-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </button>
                        <button class="dropdown-item" data-sort="name" data-order="desc">
                            <span><?= htmlspecialchars(__('collection.sort_name_desc')) ?></span>
                            <svg class="check-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </button>
                        <button class="dropdown-item" data-sort="created_at" data-order="desc">
                            <span><?= htmlspecialchars(__('collection.sort_recent')) ?></span>
                            <svg class="check-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </button>
                        <button class="dropdown-item" data-sort="created_at" data-order="asc">
                            <span><?= htmlspecialchars(__('collection.sort_oldest')) ?></span>
                            <svg class="check-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </button>
                        <button class="dropdown-item" data-sort="rating" data-order="desc">
                            <span><?= htmlspecialchars(__('collection.sort_rating')) ?></span>
                            <svg class="check-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </button>
                        <button class="dropdown-item" data-sort="market_value" data-order="desc">
                            <span><?= htmlspecialchars(__('collection.sort_value')) ?></span>
                            <svg class="check-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <!-- Filtres avancés -->
                <button type="button" class="btn btn-icon" id="filterBtn" title="<?= htmlspecialchars(__('collection.filters')) ?>">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                    </svg>
                    <span class="filter-badge" id="filterBadge" style="display: none;">0</span>
                </button>
                
                <!-- Mode d'affichage -->
                <div class="view-toggle">
                    <button type="button" class="btn btn-icon active" id="viewGrid" title="<?= htmlspecialchars(__('collection.view_grid')) ?>">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="7" height="7"></rect>
                            <rect x="14" y="3" width="7" height="7"></rect>
                            <rect x="3" y="14" width="7" height="7"></rect>
                            <rect x="14" y="14" width="7" height="7"></rect>
                        </svg>
                    </button>
                    <button type="button" class="btn btn-icon" id="viewList" title="<?= htmlspecialchars(__('collection.view_list')) ?>">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="8" y1="6" x2="21" y2="6"></line>
                            <line x1="8" y1="12" x2="21" y2="12"></line>
                            <line x1="8" y1="18" x2="21" y2="18"></line>
                            <line x1="3" y1="6" x2="3.01" y2="6"></line>
                            <line x1="3" y1="12" x2="3.01" y2="12"></line>
                            <line x1="3" y1="18" x2="3.01" y2="18"></line>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Filtres actifs -->
        <div class="active-filters" id="activeFilters" style="display: none;">
            <!-- Rempli dynamiquement -->
        </div>
    </div>
    
    <!-- Panel des filtres avancés (slide) -->
    <div class="filters-panel" id="filtersPanel">
        <div class="filters-panel-header">
            <h3><?= htmlspecialchars(__('collection.filters_title')) ?></h3>
            <button type="button" class="btn btn-icon" id="closeFilters">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>
        <div class="filters-panel-body">
            <!-- Catégories -->
            <div class="filter-group">
                <label><?= htmlspecialchars(__('collection.filter_categories')) ?></label>
                <select id="filterCategory" class="form-select">
                    <option value=""><?= htmlspecialchars(__('collection.all_categories')) ?></option>
                    <!-- Rempli dynamiquement -->
                </select>
            </div>
            
            <!-- Note minimum -->
            <div class="filter-group">
                <label><?= htmlspecialchars(__('collection.filter_rating')) ?></label>
                <div class="rating-filter">
                    <input type="range" id="filterRating" min="0" max="5" step="0.5" value="0">
                    <span id="filterRatingValue">0+</span>
                </div>
            </div>
            
            <!-- Plage de valeur -->
            <div class="filter-group">
                <label><?= htmlspecialchars(__('collection.filter_value')) ?></label>
                <div class="range-inputs">
                    <input type="number" id="filterValueMin" placeholder="Min" min="0" step="0.01">
                    <span>-</span>
                    <input type="number" id="filterValueMax" placeholder="Max" min="0" step="0.01">
                </div>
            </div>
            
            <!-- Date d'acquisition -->
            <div class="filter-group">
                <label><?= htmlspecialchars(__('collection.filter_acquisition')) ?></label>
                <div class="range-inputs">
                    <input type="date" id="filterDateFrom">
                    <span>-</span>
                    <input type="date" id="filterDateTo">
                </div>
            </div>
            
            <!-- Statut -->
            <div class="filter-group">
                <label><?= htmlspecialchars(__('collection.field_status')) ?></label>
                <select id="filterStatus" class="form-select">
                    <option value=""><?= htmlspecialchars(__('collection.all_statuses') ?? 'Tous les statuts') ?></option>
                    <!-- Options chargées dynamiquement via JavaScript -->
                </select>
            </div>
        </div>
        <div class="filters-panel-footer">
            <button type="button" class="btn btn-secondary" id="resetFilters">
                <?= htmlspecialchars(__('collection.reset_filters')) ?>
            </button>
            <button type="button" class="btn btn-primary" id="applyFilters">
                <?= htmlspecialchars(__('collection.apply_filters')) ?>
            </button>
        </div>
    </div>
    <div class="filters-overlay" id="filtersOverlay"></div>
    
    <!-- Conteneur des items -->
    <div class="collection-container" id="collectionContainer">
        <!-- Grille des items -->
        <div class="items-grid" id="itemsGrid">
            <!-- Items chargés dynamiquement -->
        </div>
        
        <!-- Liste des items -->
        <div class="items-list" id="itemsList" style="display: none;">
            <!-- Items chargés dynamiquement -->
        </div>
        
        <!-- Loading -->
        <div class="collection-loading" id="collectionLoading">
            <div class="loading-spinner"></div>
            <p><?= htmlspecialchars(__('collection.loading')) ?></p>
        </div>
        
        <!-- État vide -->
        <div class="collection-empty" id="collectionEmpty" style="display: none;">
            <div class="empty-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                </svg>
            </div>
            <h3 id="emptyTitle"><?= htmlspecialchars(__('collection.empty_title')) ?></h3>
            <p id="emptyMessage"><?= htmlspecialchars(__('collection.empty_message')) ?></p>
            <button class="btn btn-primary" id="btnAddFirstItem">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span><?= htmlspecialchars(__('collection.add_first_item')) ?></span>
            </button>
        </div>
        
        <!-- Aucun résultat -->
        <div class="collection-no-results" id="collectionNoResults" style="display: none;">
            <div class="empty-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    <line x1="8" y1="8" x2="14" y2="14"></line>
                    <line x1="14" y1="8" x2="8" y2="14"></line>
                </svg>
            </div>
            <h3><?= htmlspecialchars(__('collection.no_results_title')) ?></h3>
            <p><?= htmlspecialchars(__('collection.no_results_message')) ?></p>
            <button class="btn btn-secondary" id="btnClearFilters">
                <?= htmlspecialchars(__('collection.clear_filters')) ?>
            </button>
        </div>
    </div>
    
    <!-- Sentinel pour infinite scroll -->
    <div class="scroll-sentinel" id="scrollSentinel"></div>
    
    <!-- Bouton retour en haut -->
    <button class="btn-scroll-top" id="btnScrollTop" style="display: none;" title="<?= htmlspecialchars(__('collection.back_to_top')) ?>">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="18 15 12 9 6 15"></polyline>
        </svg>
    </button>
</div>

<script>
// Variables globales pour cette page
window.collectionUserId = <?= json_encode($userId) ?>;
window.collectionTranslations = {
    // Général
    loading: <?= json_encode(__('collection.loading')) ?>,
    error_loading: <?= json_encode(__('collection.error_loading')) ?>,
    items_count: <?= json_encode(__('collection.items_count')) ?>,
    item_count: <?= json_encode(__('collection.item_count')) ?>,
    no_image: <?= json_encode(__('collection.no_image')) ?>,
    
    // Catégories pour filtres
    personal_categories: <?= json_encode(__('collection.personal_categories')) ?>,
    default_categories: <?= json_encode(__('collection.default_categories')) ?>,
    
    // Modal titres
    modal_view_title: <?= json_encode(__('collection.modal_view_title')) ?>,
    modal_add_title: <?= json_encode(__('collection.modal_add_title')) ?>,
    modal_edit_title: <?= json_encode(__('collection.modal_edit_title')) ?>,
    
    // Champs
    field_name: <?= json_encode(__('collection.field_name')) ?>,
    field_name_placeholder: <?= json_encode(__('collection.field_name_placeholder')) ?>,
    field_description: <?= json_encode(__('collection.field_description')) ?>,
    field_description_placeholder: <?= json_encode(__('collection.field_description_placeholder')) ?>,
    field_notes: <?= json_encode(__('collection.field_notes')) ?>,
    field_notes_placeholder: <?= json_encode(__('collection.field_notes_placeholder')) ?>,
    field_barcode: <?= json_encode(__('collection.field_barcode')) ?>,
    field_barcode_placeholder: <?= json_encode(__('collection.field_barcode_placeholder')) ?>,
    field_rating: <?= json_encode(__('collection.field_rating')) ?>,
    field_rating_hint: <?= json_encode(__('collection.field_rating_hint')) ?>,
    field_purchase_price: <?= json_encode(__('collection.field_purchase_price')) ?>,
    field_market_value: <?= json_encode(__('collection.field_market_value')) ?>,
    field_acquisition_date: <?= json_encode(__('collection.field_acquisition_date')) ?>,
    field_search_state: <?= json_encode(__('collection.field_search_state')) ?>,
    field_categories: <?= json_encode(__('collection.field_categories')) ?>,
    field_categories_placeholder: <?= json_encode(__('collection.field_categories_placeholder')) ?>,
    field_grades: <?= json_encode(__('collection.field_grades')) ?>,
    field_grades_placeholder: <?= json_encode(__('collection.field_grades_placeholder')) ?>,
    field_storage_location: <?= json_encode(__('collection.field_storage_location')) ?>,
    field_storage_location_placeholder: <?= json_encode(__('collection.field_storage_location_placeholder')) ?>,
    no_storage_location: <?= json_encode(__('collection.no_storage_location') ?: 'Non défini') ?>,
    add_storage_location: <?= json_encode(__('collection.add_storage_location') ?: 'Ajouter un emplacement') ?>,
    storage_location_name_placeholder: <?= json_encode(__('collection.storage_location_name_placeholder') ?: 'Ex: Étagère salon...') ?>,
    storage_location_desc_placeholder: <?= json_encode(__('collection.storage_location_desc_placeholder') ?: 'Description optionnelle...') ?>,
    storage_location_created: <?= json_encode(__('collection.storage_location_created') ?: 'Emplacement créé') ?>,
    grades_section_personal: <?= json_encode(__('collection.grades_section_personal') ?: 'Mes grades') ?>,
    grades_section_defaults: <?= json_encode(__('collection.grades_section_defaults') ?: 'Grades par défaut') ?>,
    no_grades_for_categories: <?= json_encode(__('collection.no_grades_for_categories') ?: 'Sélectionnez des catégories pour voir les états disponibles') ?>,
    
    // Sections
    section_info: <?= json_encode(__('collection.section_info')) ?>,
    section_values: <?= json_encode(__('collection.section_values')) ?>,
    section_dates: <?= json_encode(__('collection.section_dates')) ?>,
    section_media: <?= json_encode(__('collection.section_media')) ?>,
    section_categories: <?= json_encode(__('collection.section_categories')) ?>,
    section_grades: <?= json_encode(__('collection.section_grades')) ?>,
    
    // États de recherche
    search_state_owned: <?= json_encode(__('collection.search_state_owned')) ?>,
    search_state_searching: <?= json_encode(__('collection.search_state_searching')) ?>,
    search_state_found: <?= json_encode(__('collection.search_state_found')) ?>,
    
    // Statuts de possession
    field_status: <?= json_encode(__('collection.field_status')) ?>,
    field_status_placeholder: <?= json_encode(__('collection.field_status_placeholder')) ?>,
    no_status: <?= json_encode(__('collection.no_status')) ?>,
    all_statuses: <?= json_encode(__('collection.all_statuses')) ?>,
    status_show_defaults: <?= json_encode(__('collection.show_default_statuses')) ?>,
    status_manage: <?= json_encode(__('collection.manage_my_statuses')) ?>,
    status_section_personal: <?= json_encode(__('collection.my_statuses')) ?>,
    status_section_defaults: <?= json_encode(__('collection.default_statuses')) ?>,
    modal_statuses_title: <?= json_encode(__('collection.modal_statuses_title')) ?>,
    status_add: <?= json_encode(__('collection.modal_status_add')) ?>,
    status_edit: <?= json_encode(__('collection.modal_status_edit')) ?>,
    status_name: <?= json_encode(__('collection.status_name')) ?>,
    status_name_placeholder: <?= json_encode(__('collection.status_name_placeholder')) ?>,
    status_description: <?= json_encode(__('collection.status_description')) ?>,
    status_description_placeholder: <?= json_encode(__('collection.status_description_placeholder')) ?>,
    status_color: <?= json_encode(__('collection.status_color')) ?>,
    status_icon: <?= json_encode(__('collection.status_icon')) ?>,
    status_icon_hint: <?= json_encode(__('collection.status_icon_hint')) ?>,
    status_created: <?= json_encode(__('collection.status_created')) ?>,
    status_updated: <?= json_encode(__('collection.status_updated')) ?>,
    status_deleted: <?= json_encode(__('collection.status_deleted')) ?>,
    status_delete_confirm: <?= json_encode(__('collection.status_delete_confirm')) ?>,
    status_delete_warning: <?= json_encode(__('collection.status_delete_warning')) ?>,
    no_personal_statuses: <?= json_encode(__('collection.no_custom_statuses')) ?>,
    create_first_status: <?= json_encode(__('collection.create_first_status')) ?>,
    
    // Valeurs vides
    no_value: <?= json_encode(__('collection.no_value')) ?>,
    no_description: <?= json_encode(__('collection.no_description')) ?>,
    no_notes: <?= json_encode(__('collection.no_notes')) ?>,
    no_barcode: <?= json_encode(__('collection.no_barcode')) ?>,
    no_date: <?= json_encode(__('collection.no_date')) ?>,
    no_categories: <?= json_encode(__('collection.no_categories')) ?>,
    no_grades: <?= json_encode(__('collection.no_grades')) ?>,
    no_location: <?= json_encode(__('collection.no_location')) ?>,
    
    // Catégories - sélecteur
    show_default_categories: <?= json_encode(__('collection.show_default_categories')) ?>,
    auto_select_parents: <?= json_encode(__('collection.auto_select_parents')) ?>,
    categories_selected: <?= json_encode(__('collection.categories_selected')) ?>,
    no_category_selected: <?= json_encode(__('collection.no_category_selected')) ?>,
    select_categories: <?= json_encode(__('collection.select_categories')) ?>,
    
    // Compteurs médias
    images_count: <?= json_encode(__('collection.images_count')) ?>,
    videos_count: <?= json_encode(__('collection.videos_count')) ?>,
    audios_count: <?= json_encode(__('collection.audios_count')) ?>,
    documents_count: <?= json_encode(__('collection.documents_count')) ?>,
    media_coming_soon: <?= json_encode(__('collection.media_coming_soon')) ?>,
    
    // Onglets médias
    media_tab_images: <?= json_encode(__('categories_page.media_tab_images')) ?>,
    media_tab_videos: <?= json_encode(__('categories_page.media_tab_videos')) ?>,
    media_tab_audio: <?= json_encode(__('categories_page.media_tab_audio')) ?>,
    media_tab_documents: <?= json_encode(__('categories_page.media_tab_documents')) ?>,
    media_hint_images: <?= json_encode(__('categories_page.media_hint_images')) ?>,
    media_hint_videos: <?= json_encode(__('categories_page.media_hint_videos')) ?>,
    media_hint_audio: <?= json_encode(__('categories_page.media_hint_audio')) ?>,
    media_hint_documents: <?= json_encode(__('categories_page.media_hint_documents')) ?>,
    take_photo: <?= json_encode(__('categories_page.take_photo')) ?>,
    
    // Actions
    save: <?= json_encode(__('collection.save')) ?>,
    cancel: <?= json_encode(__('collection.cancel')) ?>,
    close: <?= json_encode(__('collection.close')) ?>,
    edit: <?= json_encode(__('collection.edit')) ?>,
    delete: <?= json_encode(__('collection.delete')) ?>,
    
    // Confirmations et messages
    confirm_delete: <?= json_encode(__('collection.confirm_delete')) ?>,
    delete_confirm_title: <?= json_encode(__('collection.delete_confirm_title')) ?>,
    delete_confirm_message: <?= json_encode(__('collection.delete_confirm_message')) ?>,
    created_success: <?= json_encode(__('collection.created_success')) ?>,
    updated_success: <?= json_encode(__('collection.updated_success')) ?>,
    deleted_success: <?= json_encode(__('collection.deleted_success')) ?>,
    error_load: <?= json_encode(__('collection.error_load')) ?>,
    error_save: <?= json_encode(__('collection.error_save')) ?>,
    error_delete: <?= json_encode(__('collection.error_delete')) ?>,
    
    // Dates
    created_at: <?= json_encode(__('collection.created_at')) ?>,
    updated_at: <?= json_encode(__('collection.updated_at')) ?>,
    
    // Recherche web
    web_search_btn: <?= json_encode(__('web_search.title')) ?>,
    
    // Confirmation d'import
    import_confirm_title: <?= json_encode(__('web_search.import_confirm_title')) ?>,
    import_confirm_message: <?= json_encode(__('web_search.import_confirm_message')) ?>,
    import_confirm_yes: <?= json_encode(__('web_search.import_confirm_yes')) ?>,
    import_confirm_cancel: <?= json_encode(__('web_search.import_confirm_cancel')) ?>,
    import_field_name: <?= json_encode(__('web_search.import_field_name')) ?>,
    import_field_description: <?= json_encode(__('web_search.import_field_description')) ?>,
    import_field_price: <?= json_encode(__('web_search.import_field_price')) ?>,
    import_field_barcode: <?= json_encode(__('web_search.import_field_barcode')) ?>,
    import_cancelled: <?= json_encode(__('web_search.import_cancelled')) ?>,
    
    // Erreurs d'import
    error_import_image: <?= json_encode(__('collection.error_import_image')) ?>,
    error_import_document: <?= json_encode(__('collection.error_import_document')) ?>,
    warning_images_protected: <?= json_encode(__('collection.warning_images_protected') ?: 'Images non importées (source protégée contre le téléchargement)') ?>
};
</script>
