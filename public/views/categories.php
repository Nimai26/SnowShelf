<?php
/**
 * SnowShelf - Fragment Categories
 * Page de gestion des catégories
 * 
 * Variables disponibles: $userId, $userName, $userData, $pdo, $isPremium, $isAdmin
 */

// La fonction __() est disponible via i18n.php chargé par pages.php
$canCreate = $isPremium || $isAdmin;
?>

<div class="categories-page">
    
    <!-- Header de la page -->
    <div class="page-header">
        <div class="header-content">
            <h1><?= htmlspecialchars(__('categories_page.title')) ?></h1>
            <p class="header-subtitle"><?= htmlspecialchars(__('categories_page.subtitle')) ?></p>
        </div>
        
        <?php if ($canCreate): ?>
        <button class="btn btn-primary" id="btnAddCategory">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span><?= htmlspecialchars(__('categories_page.add_category')) ?></span>
        </button>
        <?php endif; ?>
    </div>
    
    <!-- Bannière Premium pour utilisateurs Free -->
    <?php if (!$isPremium && !$isAdmin): ?>
    <div class="premium-banner">
        <div class="premium-banner-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"></path>
            </svg>
        </div>
        <div class="premium-banner-content">
            <h3><?= htmlspecialchars(__('categories_page.premium_banner_title')) ?></h3>
            <p><?= htmlspecialchars(__('categories_page.premium_banner_message')) ?></p>
        </div>
        <button class="btn btn-accent" id="btnGoPremium">
            <?= htmlspecialchars(__('categories_page.premium_button')) ?>
        </button>
    </div>
    <div class="info-notice">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        <span><?= htmlspecialchars(__('categories_page.free_info')) ?></span>
    </div>
    <?php endif; ?>
    
    <!-- Barre de recherche et filtres -->
    <div class="categories-toolbar">
        <div class="search-box">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input type="text" 
                   id="searchCategories" 
                   placeholder="<?= htmlspecialchars(__('categories_page.search_placeholder')) ?>"
                   autocomplete="off">
        </div>
        
        <div class="filter-tabs">
            <button class="filter-tab active" data-filter="all">
                <?= htmlspecialchars(__('categories_page.filter_all')) ?>
            </button>
            <button class="filter-tab" data-filter="default">
                <?= htmlspecialchars(__('categories_page.filter_default')) ?>
            </button>
            <?php if ($isPremium || $isAdmin): ?>
            <button class="filter-tab" data-filter="public">
                <?= htmlspecialchars(__('categories_page.filter_public')) ?>
            </button>
            <button class="filter-tab" data-filter="mine">
                <?= htmlspecialchars(__('categories_page.filter_mine')) ?>
            </button>
            <?php endif; ?>
        </div>
        
        <?php if ($isPremium || $isAdmin): ?>
        <div class="filter-toggles">
            <label class="toggle-label">
                <input type="checkbox" id="showDefault" checked>
                <span class="toggle-text"><?= htmlspecialchars(__('categories_page.show_default')) ?></span>
            </label>
            <label class="toggle-label">
                <input type="checkbox" id="showPublic" checked>
                <span class="toggle-text"><?= htmlspecialchars(__('categories_page.show_public')) ?></span>
            </label>
        </div>
        <?php endif; ?>
    </div>
    
    <!-- Liste des catégories -->
    <div class="categories-grid" id="categoriesGrid">
        <!-- Chargé dynamiquement par JavaScript -->
        <div class="loading-state">
            <div class="spinner"></div>
            <p><?= htmlspecialchars(__('common.loading')) ?></p>
        </div>
    </div>
    
    <!-- État vide -->
    <div class="empty-state" id="emptyState" style="display: none;">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
        </svg>
        <h3 id="emptyTitle"><?= htmlspecialchars(__('categories_page.empty_title')) ?></h3>
        <p id="emptyMessage"><?= htmlspecialchars(__('categories_page.empty_message')) ?></p>
    </div>
</div>

<!-- Template pour une carte de catégorie -->
<template id="categoryCardTemplate">
    <div class="category-card" data-id="">
        <div class="category-header">
            <span class="category-icon"></span>
            <div class="category-badges">
                <!-- Badges dynamiques -->
            </div>
        </div>
        <div class="category-body">
            <h3 class="category-name"></h3>
            <p class="category-description"></p>
            <div class="category-meta">
                <span class="category-owner">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <span class="owner-name"></span>
                </span>
                <span class="category-items-count">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                    </svg>
                    <span class="items-count"></span>
                </span>
            </div>
        </div>
        <div class="category-actions">
            <!-- Actions dynamiques selon permissions -->
        </div>
    </div>
</template>

<!-- Données pour JavaScript -->
<script>
    window.CategoriesPageData = {
        userId: <?= $userId ?>,
        isPremium: <?= $isPremium ? 'true' : 'false' ?>,
        isAdmin: <?= $isAdmin ? 'true' : 'false' ?>,
        canCreate: <?= $canCreate ? 'true' : 'false' ?>,
        translations: {
            // Badges
            default_badge: <?= json_encode(__('categories_page.default_badge')) ?>,
            public_badge: <?= json_encode(__('categories_page.public_badge')) ?>,
            private_badge: <?= json_encode(__('categories_page.private_badge')) ?>,
            
            // Infos
            owner: <?= json_encode(__('categories_page.owner')) ?>,
            no_items: <?= json_encode(__('categories_page.no_items')) ?>,
            created_at: <?= json_encode(__('categories_page.created_at')) ?>,
            
            // Actions
            view: <?= json_encode(__('categories_page.view')) ?>,
            view_import: <?= json_encode(__('categories_page.view_import')) ?>,
            edit: <?= json_encode(__('categories_page.edit')) ?>,
            delete: <?= json_encode(__('categories_page.delete')) ?>,
            copy: <?= json_encode(__('categories_page.copy')) ?>,
            import: <?= json_encode(__('categories_page.import')) ?>,
            save: <?= json_encode(__('categories_page.save')) ?>,
            close: <?= json_encode(__('categories_page.close')) ?>,
            use_category: <?= json_encode(__('categories_page.use_category')) ?>,
            
            // Permissions
            readonly: <?= json_encode(__('categories_page.readonly')) ?>,
            readonly_default: <?= json_encode(__('categories_page.readonly_default')) ?>,
            readonly_other: <?= json_encode(__('categories_page.readonly_other')) ?>,
            
            // Confirmations
            confirm_delete: <?= json_encode(__('categories_page.confirm_delete')) ?>,
            confirm_delete_message: <?= json_encode(__('categories_page.confirm_delete_message')) ?>,
            
            // Messages succès
            created_success: <?= json_encode(__('categories_page.created_success')) ?>,
            updated_success: <?= json_encode(__('categories_page.updated_success')) ?>,
            deleted_success: <?= json_encode(__('categories_page.deleted_success')) ?>,
            copy_success: <?= json_encode(__('categories_page.copy_success')) ?>,
            
            // Erreurs
            error_name_required: <?= json_encode(__('categories_page.error_name_required')) ?>,
            error_circular_reference: <?= json_encode(__('categories_page.error_circular_reference')) ?>,
            
            // Titres de formulaire
            form_title_add: <?= json_encode(__('categories_page.form_title_add')) ?>,
            form_title_edit: <?= json_encode(__('categories_page.form_title_edit')) ?>,
            form_title_view: <?= json_encode(__('categories_page.form_title_view')) ?>,
            
            // Champs de formulaire
            field_name: <?= json_encode(__('categories_page.field_name')) ?>,
            field_name_placeholder: <?= json_encode(__('categories_page.field_name_placeholder')) ?>,
            field_description: <?= json_encode(__('categories_page.field_description')) ?>,
            field_description_placeholder: <?= json_encode(__('categories_page.field_description_placeholder')) ?>,
            field_notes: <?= json_encode(__('categories_page.field_notes')) ?>,
            field_notes_placeholder: <?= json_encode(__('categories_page.field_notes_placeholder')) ?>,
            field_icon: <?= json_encode(__('categories_page.field_icon')) ?>,
            field_icon_hint: <?= json_encode(__('categories_page.field_icon_hint')) ?>,
            field_visible: <?= json_encode(__('categories_page.field_visible')) ?>,
            field_visible_hint: <?= json_encode(__('categories_page.field_visible_hint')) ?>,
            field_owner: <?= json_encode(__('categories_page.field_owner')) ?>,
            field_original_creator: <?= json_encode(__('categories_page.field_original_creator')) ?>,
            field_items_count: <?= json_encode(__('categories_page.field_items_count')) ?>,
            field_created_at: <?= json_encode(__('categories_page.field_created_at')) ?>,
            field_visibility: <?= json_encode(__('categories_page.field_visibility')) ?>,
            field_id: <?= json_encode(__('categories_page.field_id')) ?>,
            
            // Admin - Catégorie par défaut
            field_is_default: <?= json_encode(__('categories_page.field_is_default')) ?>,
            is_default_label: <?= json_encode(__('categories_page.is_default_label')) ?>,
            is_default_hint: <?= json_encode(__('categories_page.is_default_hint')) ?>,
            is_default_warning: <?= json_encode(__('categories_page.is_default_warning')) ?>,
            
            // Hiérarchie
            section_hierarchy: <?= json_encode(__('categories_page.section_hierarchy')) ?>,
            field_children: <?= json_encode(__('categories_page.field_children')) ?>,
            field_mothers: <?= json_encode(__('categories_page.field_mothers')) ?>,
            children_placeholder: <?= json_encode(__('categories_page.children_placeholder')) ?>,
            mothers_readonly_hint: <?= json_encode(__('categories_page.mothers_readonly_hint')) ?>,
            no_children: <?= json_encode(__('categories_page.no_children')) ?>,
            no_mothers: <?= json_encode(__('categories_page.no_mothers')) ?>,
            add_child: <?= json_encode(__('categories_page.add_child')) ?>,
            remove_child: <?= json_encode(__('categories_page.remove_child')) ?>,
            no_results: <?= json_encode(__('categories_page.no_results')) ?>,
            
            // Grades (état physique)
            section_grades: <?= json_encode(__('categories_page.section_grades')) ?>,
            field_grades: <?= json_encode(__('categories_page.field_grades')) ?>,
            grades_available: <?= json_encode(__('categories_page.grades_available')) ?>,
            no_grades: <?= json_encode(__('categories_page.no_grades')) ?>,
            grade_enabled: <?= json_encode(__('categories_page.grade_enabled')) ?>,
            grade_disabled: <?= json_encode(__('categories_page.grade_disabled')) ?>,
            
            // Médias
            section_media: <?= json_encode(__('categories_page.section_media')) ?>,
            images_count: <?= json_encode(__('categories_page.images_count')) ?>,
            videos_count: <?= json_encode(__('categories_page.videos_count')) ?>,
            audios_count: <?= json_encode(__('categories_page.audios_count')) ?>,
            documents_count: <?= json_encode(__('categories_page.documents_count')) ?>,
            media_coming_soon: <?= json_encode(__('categories_page.media_coming_soon')) ?>,
            take_photo: <?= json_encode(__('categories_page.take_photo')) ?>,
            
            // Visibilité
            visibility_public: <?= json_encode(__('categories_page.visibility_public')) ?>,
            visibility_private: <?= json_encode(__('categories_page.visibility_private')) ?>,
            visibility_default: <?= json_encode(__('categories_page.visibility_default')) ?>,
            
            // Divers
            no_description: <?= json_encode(__('categories_page.no_description')) ?>,
            no_notes: <?= json_encode(__('categories_page.no_notes')) ?>,
            system_category: <?= json_encode(__('categories_page.system_category')) ?>,
            
            // États vides
            empty_title: <?= json_encode(__('categories_page.empty_title')) ?>,
            empty_message: <?= json_encode(__('categories_page.empty_message')) ?>,
            empty_no_categories: <?= json_encode(__('categories_page.empty_no_categories')) ?>,
            
            // Common
            cancel: <?= json_encode(__('common.cancel')) ?>,
            loading: <?= json_encode(__('common.loading')) ?>,
            
            // Icon Editor
            icon_editor_title: <?= json_encode(__('icon_editor.title')) ?>,
            icon_editor_rotate_left: <?= json_encode(__('icon_editor.rotate_left')) ?>,
            icon_editor_rotate_right: <?= json_encode(__('icon_editor.rotate_right')) ?>,
            icon_editor_flip_horizontal: <?= json_encode(__('icon_editor.flip_horizontal')) ?>,
            icon_editor_flip_vertical: <?= json_encode(__('icon_editor.flip_vertical')) ?>,
            icon_editor_zoom_in: <?= json_encode(__('icon_editor.zoom_in')) ?>,
            icon_editor_zoom_out: <?= json_encode(__('icon_editor.zoom_out')) ?>,
            icon_editor_reset: <?= json_encode(__('icon_editor.reset')) ?>,
            icon_editor_cancel: <?= json_encode(__('icon_editor.cancel')) ?>,
            icon_editor_save: <?= json_encode(__('icon_editor.save')) ?>,
            icon_editor_preview: <?= json_encode(__('icon_editor.preview')) ?>,
            icon_editor_drag_hint: <?= json_encode(__('icon_editor.drag_hint')) ?>,
            icon_editor_zoom_hint: <?= json_encode(__('icon_editor.zoom_hint')) ?>,
            icon_editor_loading: <?= json_encode(__('icon_editor.loading')) ?>,
            icon_editor_error_load: <?= json_encode(__('icon_editor.error_load')) ?>,
            icon_editor_error_save: <?= json_encode(__('icon_editor.error_save')) ?>
        }
    };
</script>
