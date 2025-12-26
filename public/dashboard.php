<?php
/**
 * SnowShelf - Dashboard principal
 * Interface utilisateur après connexion
 */

session_start();

// Vérifier l'authentification
if (!isset($_SESSION['user_id'])) {
    header('Location: login.php');
    exit;
}

// Charger les dépendances
require_once __DIR__ . '/../core/i18n.php';
require_once __DIR__ . '/../core/SiteConfig.php';

// Récupérer la configuration effective (avec fallback sur les défauts admin)
$siteConfig = SiteConfig::getInstance();
$effective = $siteConfig->getEffectiveConfig($_SESSION['user_id']);
$theme = $effective['theme'];
$backgroundUrl = $effective['background_url'];

// DEBUG: Log des valeurs de thème
error_log("[DASHBOARD DEBUG] User ID: " . $_SESSION['user_id']);
error_log("[DASHBOARD DEBUG] Session theme: " . ($_SESSION['theme'] ?? 'NON DÉFINI'));
error_log("[DASHBOARD DEBUG] Default theme from config: " . $siteConfig->getDefaultTheme());
error_log("[DASHBOARD DEBUG] Effective theme: " . $theme);
error_log("[DASHBOARD DEBUG] Full effective config: " . json_encode($effective));

$username = $_SESSION['username'] ?? 'Utilisateur';
$isAdmin = $_SESSION['is_admin'] ?? false;
$isPremium = $_SESSION['is_premium'] ?? false;

// Récupérer auto_trad depuis la session ou la BDD si pas encore en session
$autoTrad = $_SESSION['auto_trad'] ?? null;
if ($autoTrad === null && isset($_SESSION['user_id'])) {
    // Charger depuis la BDD si pas en session (ancienne session)
    $db = getDbConnection();
    $stmt = $db->prepare("SELECT auto_trad FROM users WHERE id = ?");
    $stmt->execute([$_SESSION['user_id']]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    $autoTrad = (bool)($result['auto_trad'] ?? false);
    $_SESSION['auto_trad'] = $autoTrad; // Mettre en cache dans la session
}
$autoTrad = (bool)$autoTrad;
?>
<!DOCTYPE html>
<html lang="<?= getLang() ?>" data-theme="<?= htmlspecialchars($theme) ?>">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= __('common.app_name') ?> - <?= __('dashboard.title') ?></title>
    
    <!-- Favicon -->
    <link rel="icon" type="image/png" href="assets/images/favicon.png">
    
    <!-- Material Design Icons -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@mdi/font@7.4.47/css/materialdesignicons.min.css">
    
    <!-- Thèmes CSS -->
    <link rel="stylesheet" href="themes/themes.css">
    <link rel="stylesheet" href="assets/css/modal.css?v=<?= time() ?>">
    <link rel="stylesheet" href="assets/css/icon-editor.css?v=<?= time() ?>">
    <link rel="stylesheet" href="assets/css/image-editor.css?v=<?= time() ?>">
    <link rel="stylesheet" href="assets/css/camera-capture.css?v=<?= time() ?>">
    <link rel="stylesheet" href="assets/css/document-viewer.css?v=<?= time() ?>">
    <link rel="stylesheet" href="assets/css/media-list-manager.css?v=<?= time() ?>">
    <link rel="stylesheet" href="assets/css/collection.css?v=<?= time() ?>">
    <link rel="stylesheet" href="assets/css/web-search.css?v=<?= time() ?>">
    <link rel="stylesheet" href="assets/css/dashboard.css">
    <link rel="stylesheet" href="assets/css/account.css">
    
    <!-- Background personnalisé -->
    <?php if (!empty($backgroundUrl)): ?>
    <style>
        body {
            background-image: url('<?= htmlspecialchars($backgroundUrl) ?>');
            background-size: cover;
            background-position: center;
            background-attachment: fixed;
            background-repeat: no-repeat;
        }
        body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: -1;
            pointer-events: none;
        }
    </style>
    <?php endif; ?>
    
    <!-- Traductions JS -->
    <script>
        window.__ = function(key) {
            const translations = <?= json_encode([
                'common' => [
                    'loading' => __('common.loading'),
                    'save' => __('common.save'),
                    'cancel' => __('common.cancel'),
                ],
                'image_editor' => [
                    'title' => __('image_editor.title'),
                    'rotate_left' => __('image_editor.rotate_left'),
                    'rotate_right' => __('image_editor.rotate_right'),
                    'flip_horizontal' => __('image_editor.flip_horizontal'),
                    'flip_vertical' => __('image_editor.flip_vertical'),
                    'zoom_in' => __('image_editor.zoom_in'),
                    'zoom_out' => __('image_editor.zoom_out'),
                    'reset' => __('image_editor.reset'),
                    'crop' => __('image_editor.crop'),
                    'crop_mode' => __('image_editor.crop_mode'),
                    'brightness' => __('image_editor.brightness'),
                    'contrast' => __('image_editor.contrast'),
                    'saturation' => __('image_editor.saturation'),
                    'preview' => __('image_editor.preview'),
                    'drag_hint' => __('image_editor.drag_hint'),
                    'zoom_hint' => __('image_editor.zoom_hint'),
                    'error_load' => __('image_editor.error_load'),
                    'error_save' => __('image_editor.error_save'),
                    'processing' => __('image_editor.processing'),
                ],
                'icon_editor' => [
                    'title' => __('icon_editor.title'),
                    'rotate_left' => __('icon_editor.rotate_left'),
                    'rotate_right' => __('icon_editor.rotate_right'),
                    'flip_horizontal' => __('icon_editor.flip_horizontal'),
                    'flip_vertical' => __('icon_editor.flip_vertical'),
                    'zoom_in' => __('icon_editor.zoom_in'),
                    'zoom_out' => __('icon_editor.zoom_out'),
                    'reset' => __('icon_editor.reset'),
                    'preview' => __('icon_editor.preview'),
                    'drag_hint' => __('icon_editor.drag_hint'),
                    'zoom_hint' => __('icon_editor.zoom_hint'),
                    'error_load' => __('icon_editor.error_load'),
                    'error_save' => __('icon_editor.error_save'),
                ],
                'media' => [
                    'add_files' => __('media.add_files'),
                    'drag_drop' => __('media.drag_drop'),
                    'delete_all' => __('media.delete_all'),
                    'delete_confirm' => __('media.delete_confirm'),
                    'delete_all_confirm' => __('media.delete_all_confirm'),
                    'no_files' => __('media.no_files'),
                    'uploading' => __('media.uploading'),
                    'processing' => __('media.processing'),
                    'error_upload' => __('media.error_upload'),
                    'error_type' => __('media.error_type'),
                    'error_size' => __('media.error_size'),
                    'play' => __('media.play'),
                    'pause' => __('media.pause'),
                    'view' => __('media.view'),
                    'download' => __('media.download'),
                    'edit' => __('media.edit'),
                    'images' => __('media.images'),
                    'videos' => __('media.videos'),
                    'audio' => __('media.audio'),
                    'documents' => __('media.documents'),
                ],
                'camera' => [
                    'title' => __('camera.title'),
                    'initializing' => __('camera.initializing'),
                    'error_camera' => __('camera.error_camera'),
                    'error_permission' => __('camera.error_permission'),
                    'error_not_supported' => __('camera.error_not_supported'),
                    'error_capture' => __('camera.error_capture'),
                    'retry' => __('camera.retry'),
                    'take_photo' => __('camera.take_photo'),
                    'switch_camera' => __('camera.switch_camera'),
                    'flash' => __('camera.flash'),
                    'flash_off' => __('camera.flash_off'),
                    'flash_on' => __('camera.flash_on'),
                    'flash_auto' => __('camera.flash_auto'),
                    'zoom_hint' => __('camera.zoom_hint'),
                    'select_camera' => __('camera.select_camera'),
                    'processing' => __('camera.processing'),
                    'front_camera' => __('camera.front_camera'),
                    'back_camera' => __('camera.back_camera'),
                    // Mode scan
                    'scan_title' => __('camera.scan_title'),
                    'scan_capture' => __('camera.scan_capture'),
                    'scan_barcode_label' => __('camera.scan_barcode_label'),
                    'scan_document_label' => __('camera.scan_document_label'),
                    'scan_auto_label' => __('camera.scan_auto_label'),
                    'scan_barcode_hint' => __('camera.scan_barcode_hint'),
                    'scan_document_hint' => __('camera.scan_document_hint'),
                    'scan_auto_hint' => __('camera.scan_auto_hint'),
                    'scan_searching' => __('camera.scan_searching'),
                    'scan_detected' => __('camera.scan_detected'),
                ],
                'document_viewer' => [
                    'loading' => __('document_viewer.loading'),
                    'error_load' => __('document_viewer.error_load'),
                    'error_format' => __('document_viewer.error_format'),
                    'download' => __('document_viewer.download'),
                    'close' => __('document_viewer.close'),
                    'fullscreen' => __('document_viewer.fullscreen'),
                    'exit_fullscreen' => __('document_viewer.exit_fullscreen'),
                    'page' => __('document_viewer.page'),
                    'of' => __('document_viewer.of'),
                    'prev_page' => __('document_viewer.prev_page'),
                    'next_page' => __('document_viewer.next_page'),
                    'first_page' => __('document_viewer.first_page'),
                    'last_page' => __('document_viewer.last_page'),
                    'zoom_in' => __('document_viewer.zoom_in'),
                    'zoom_out' => __('document_viewer.zoom_out'),
                    'zoom_reset' => __('document_viewer.zoom_reset'),
                    'fit' => __('document_viewer.fit'),
                    'rotate_left' => __('document_viewer.rotate_left'),
                    'rotate_right' => __('document_viewer.rotate_right'),
                    'files' => __('document_viewer.files'),
                    'folders' => __('document_viewer.folders'),
                    'extract' => __('document_viewer.extract'),
                    'extract_all' => __('document_viewer.extract_all'),
                    'extracting' => __('document_viewer.extracting'),
                    'archive_empty' => __('document_viewer.archive_empty'),
                    'table_of_contents' => __('document_viewer.table_of_contents'),
                    'show_toc' => __('document_viewer.show_toc'),
                    'hide_toc' => __('document_viewer.hide_toc'),
                    'chapter' => __('document_viewer.chapter'),
                    'prev_chapter' => __('document_viewer.prev_chapter'),
                    'next_chapter' => __('document_viewer.next_chapter'),
                    'single_page' => __('document_viewer.single_page'),
                    'double_page' => __('document_viewer.double_page'),
                    'reading_mode' => __('document_viewer.reading_mode'),
                    'download_title' => __('document_viewer.download_title'),
                    'download_desc' => __('document_viewer.download_desc'),
                    'file_type' => __('document_viewer.file_type'),
                ],
                'web_search' => [
                    'title' => __('web_search.title'),
                    'type_label' => __('web_search.type_label'),
                    'providers_label' => __('web_search.providers_label'),
                    'text_search_label' => __('web_search.text_search_label'),
                    'text_search_placeholder' => __('web_search.text_search_placeholder'),
                    'image_search_label' => __('web_search.image_search_label'),
                    'image_drop_hint' => __('web_search.image_drop_hint'),
                    'results_title' => __('web_search.results_title'),
                    'search_btn' => __('web_search.search_btn'),
                    'stop_btn' => __('web_search.stop_btn'),
                    'browse_file' => __('web_search.browse_file'),
                    'camera_btn' => __('web_search.camera_btn'),
                    'camera_btn_title' => __('web_search.camera_btn_title'),
                    'scan_btn' => __('web_search.scan_btn'),
                    'scan_btn_title' => __('web_search.scan_btn_title'),
                    'search_image_btn' => __('web_search.search_image_btn'),
                    'close' => __('web_search.close'),
                    'select_result' => __('web_search.select_result'),
                    'view_source' => __('web_search.view_source'),
                    'no_results_yet' => __('web_search.no_results_yet'),
                    'no_results' => __('web_search.no_results'),
                    'searching' => __('web_search.searching'),
                    'results_found' => __('web_search.results_found'),
                    'search_cancelled' => __('web_search.search_cancelled'),
                    'result_selected' => __('web_search.result_selected'),
                    'supports_barcode' => __('web_search.supports_barcode'),
                    'no_providers' => __('web_search.no_providers'),
                    'error_loading' => __('web_search.error_loading'),
                    'error_empty_query' => __('web_search.error_empty_query'),
                    'error_no_provider' => __('web_search.error_no_provider'),
                    'error_no_image' => __('web_search.error_no_image'),
                    'error_invalid_image' => __('web_search.error_invalid_image'),
                    'error_search' => __('web_search.error_search'),
                    'image_search_coming_soon' => __('web_search.image_search_coming_soon'),
                    'camera_not_available' => __('web_search.camera_not_available'),
                    'barcode_not_detected' => __('web_search.barcode_not_detected'),
                    // Modal détails et import
                    'detail_title' => __('web_search.detail_title'),
                    'detail_import_as' => __('web_search.detail_import_as'),
                    'detail_select_type' => __('web_search.detail_select_type'),
                    'detail_select_fields' => __('web_search.detail_select_fields'),
                    'detail_select_all' => __('web_search.detail_select_all'),
                    'detail_select_none' => __('web_search.detail_select_none'),
                    'detail_import_btn' => __('web_search.detail_import_btn'),
                    'detail_cancel_btn' => __('web_search.detail_cancel_btn'),
                    'detail_view_source' => __('web_search.detail_view_source'),
                    'detail_no_metadata' => __('web_search.detail_no_metadata'),
                    'detail_no_description' => __('web_search.detail_no_description'),
                    'detail_metadata_section' => __('web_search.detail_metadata_section'),
                    'detail_import_section' => __('web_search.detail_import_section'),
                    'detail_field_name' => __('web_search.detail_field_name'),
                    'detail_field_description' => __('web_search.detail_field_description'),
                    'detail_field_image' => __('web_search.detail_field_image'),
                    'detail_import_success' => __('web_search.detail_import_success'),
                    'detail_no_field_selected' => __('web_search.detail_no_field_selected'),
                    'detail_load_more' => __('web_search.detail_load_more'),
                    'detail_load_more_title' => __('web_search.detail_load_more_title'),
                    'detail_loading' => __('web_search.detail_loading'),
                    'detail_loaded' => __('web_search.detail_loaded'),
                    'detail_loaded_success' => __('web_search.detail_loaded_success'),
                    'detail_load_error' => __('web_search.detail_load_error'),
                    'detail_images_hint' => __('web_search.detail_images_hint'),
                    'detail_images_selected' => __('web_search.detail_images_selected'),
                    'detail_select_all_images' => __('web_search.detail_select_all_images'),
                    'detail_deselect_all_images' => __('web_search.detail_deselect_all_images'),
                    'detail_instructions_section' => __('web_search.detail_instructions_section'),
                    'detail_selected' => __('web_search.detail_selected'),
                    'detail_view_pdf' => __('web_search.detail_view_pdf'),
                    'detail_deselect_all' => __('web_search.detail_deselect_all'),
                ],
                'primary_types' => [
                    'books' => __('primary_types.books'),
                    'video_games' => __('primary_types.video_games'),
                    'music' => __('primary_types.music'),
                    'movies' => __('primary_types.movies'),
                    'series' => __('primary_types.series'),
                    'toys_fig' => __('primary_types.toys_fig'),
                    'toys_construct' => __('primary_types.toys_construct'),
                    'divers' => __('primary_types.divers'),
                    'board_games' => __('primary_types.board_games'),
                    'trading_cards' => __('primary_types.trading_cards'),
                    'sticker_albums' => __('primary_types.sticker_albums'),
                ],
                'metadata' => [
                    // Communs
                    'year' => __('metadata.year'),
                    'rating' => __('metadata.rating'),
                    'price' => __('metadata.price'),
                    'availability' => __('metadata.availability'),
                    'reviews_count' => __('metadata.reviews_count'),
                    // Toys / LEGO
                    'set_number' => __('metadata.set_number'),
                    'brand' => __('metadata.brand'),
                    'pieces' => __('metadata.pieces'),
                    'unique_parts' => __('metadata.unique_parts'),
                    'minifigs' => __('metadata.minifigs'),
                    'minifigs_list' => __('metadata.minifigs_list'),
                    'theme' => __('metadata.theme'),
                    'theme_id' => __('metadata.theme_id'),
                    'subtheme' => __('metadata.subtheme'),
                    'age_range' => __('metadata.age_range'),
                    'dimensions' => __('metadata.dimensions'),
                    'weight' => __('metadata.weight'),
                    'designer' => __('metadata.designer'),
                    'difficulty' => __('metadata.difficulty'),
                    'vip_points' => __('metadata.vip_points'),
                    'instructions_url' => __('metadata.instructions_url'),
                    'instructions' => __('metadata.instructions'),
                    'instructions_count' => __('metadata.instructions_count'),
                    'rebrickable_id' => __('metadata.rebrickable_id'),
                    'parts_count' => __('metadata.parts_count'),
                    // Books
                    'authors' => __('metadata.authors'),
                    'author' => __('metadata.author'),
                    'isbn' => __('metadata.isbn'),
                    'pages' => __('metadata.pages'),
                    'publisher' => __('metadata.publisher'),
                    'language' => __('metadata.language'),
                    // Video Games
                    'platforms' => __('metadata.platforms'),
                    'platform' => __('metadata.platform'),
                    'developer' => __('metadata.developer'),
                    'developers' => __('metadata.developers'),
                    'publishers' => __('metadata.publishers'),
                    'release_date' => __('metadata.release_date'),
                    'genres' => __('metadata.genres'),
                    'genre' => __('metadata.genre'),
                    'metacritic' => __('metadata.metacritic'),
                    'playtime' => __('metadata.playtime'),
                    'esrb_rating' => __('metadata.esrb_rating'),
                    // Movies / Series
                    'runtime' => __('metadata.runtime'),
                    'duration' => __('metadata.duration'),
                    'director' => __('metadata.director'),
                    'episodes' => __('metadata.episodes'),
                    'seasons' => __('metadata.seasons'),
                    'media_type' => __('metadata.media_type'),
                    'votes' => __('metadata.votes'),
                    'tagline' => __('metadata.tagline'),
                    'budget' => __('metadata.budget'),
                    'revenue' => __('metadata.revenue'),
                    'status' => __('metadata.status'),
                    'original_language' => __('metadata.original_language'),
                    'production_companies' => __('metadata.production_companies'),
                    'networks' => __('metadata.networks'),
                    // Music
                    'artist' => __('metadata.artist'),
                    'album' => __('metadata.album'),
                    'track_count' => __('metadata.track_count'),
                    'tracks' => __('metadata.tracks'),
                    // Divers
                    'category' => __('metadata.category'),
                    'collection' => __('metadata.collection'),
                    'series' => __('metadata.series'),
                    'condition' => __('metadata.condition'),
                    'barcode' => __('metadata.barcode'),
                    'barcode_type' => __('metadata.barcode_type'),
                ],
            ], JSON_HEX_TAG | JSON_HEX_APOS | JSON_HEX_QUOT) ?>;
            
            const parts = key.split('.');
            let value = translations;
            for (const part of parts) {
                if (value && typeof value === 'object' && part in value) {
                    value = value[part];
                } else {
                    return key; // Fallback : retourner la clé
                }
            }
            return value;
        };
        
        // Informations utilisateur pour les modules JS
        window.userInfo = {
            isPremium: <?= json_encode($isPremium) ?>,
            isAdmin: <?= json_encode($isAdmin) ?>,
            autoTrad: <?= json_encode($autoTrad) ?>
        };
    </script>
</head>
<body>
    
    <!-- Sidebar / Menu latéral -->
    <aside class="sidebar" id="sidebar">
        <div class="sidebar-header">
            <img src="assets/images/logo.png" alt="<?= __('common.app_name') ?>" class="sidebar-logo">
            <span class="sidebar-title"><?= __('common.app_name') ?></span>
        </div>
        
        <nav class="sidebar-nav">
            <!-- Menu principal -->
            <ul class="nav-menu">
                <li class="nav-item active">
                    <a href="dashboard.php" class="nav-link" data-page="home" title="<?= __('dashboard.home') ?>">
                        <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                            <polyline points="9 22 9 12 15 12 15 22"></polyline>
                        </svg>
                        <span class="nav-text"><?= __('dashboard.home') ?></span>
                    </a>
                </li>
                
                <li class="nav-item">
                    <a href="dashboard.php?page=collection" class="nav-link" data-page="collection" title="<?= __('dashboard.my_collection') ?>">
                        <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                        </svg>
                        <span class="nav-text"><?= __('dashboard.my_collection') ?></span>
                    </a>
                </li>
                
                <li class="nav-item">
                    <a href="dashboard.php?page=categories" class="nav-link" data-page="categories" title="<?= __('dashboard.categories') ?>">
                        <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                        </svg>
                        <span class="nav-text"><?= __('dashboard.categories') ?></span>
                    </a>
                </li>
                
                <li class="nav-item">
                    <a href="dashboard.php?page=scan" class="nav-link" data-page="scan" title="<?= __('dashboard.scan') ?>">
                        <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="3" y1="9" x2="21" y2="9"></line>
                            <line x1="9" y1="21" x2="9" y2="9"></line>
                        </svg>
                        <span class="nav-text"><?= __('dashboard.scan') ?></span>
                    </a>
                </li>
                
                <li class="nav-item">
                    <a href="dashboard.php?page=wishlist" class="nav-link" data-page="wishlist" title="<?= __('dashboard.wishlist') ?>">
                        <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                        <span class="nav-text"><?= __('dashboard.wishlist') ?></span>
                    </a>
                </li>
                
                <li class="nav-item">
                    <a href="dashboard.php?page=explore" class="nav-link" data-page="explore" title="<?= __('dashboard.explore') ?>">
                        <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
                        </svg>
                        <span class="nav-text"><?= __('dashboard.explore') ?></span>
                    </a>
                </li>
                
                <li class="nav-item">
                    <a href="dashboard.php?page=community" class="nav-link" data-page="community" title="<?= __('dashboard.community') ?>">
                        <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                        <span class="nav-text"><?= __('dashboard.community') ?></span>
                    </a>
                </li>
                
                <li class="nav-item">
                    <a href="dashboard.php?page=stats" class="nav-link" data-page="stats" title="<?= __('dashboard.stats') ?>">
                        <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="20" x2="18" y2="10"></line>
                            <line x1="12" y1="20" x2="12" y2="4"></line>
                            <line x1="6" y1="20" x2="6" y2="14"></line>
                        </svg>
                        <span class="nav-text"><?= __('dashboard.stats') ?></span>
                    </a>
                </li>
            </ul>
            
            <!-- Séparateur -->
            <div class="nav-separator"></div>
            
            <!-- Menu secondaire -->
            <ul class="nav-menu nav-menu-secondary">
                <li class="nav-item">
                    <a href="dashboard.php?page=account" class="nav-link" data-page="account" title="<?= __('account.title') ?>">
                        <?php if (!empty($_SESSION['avatar_url'])): ?>
                            <div class="nav-avatar" id="sidebarAvatar">
                                <img src="<?= htmlspecialchars($_SESSION['avatar_url']) ?>?v=<?= time() ?>" alt="Avatar">
                            </div>
                        <?php else: ?>
                            <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                        <?php endif; ?>
                        <span class="nav-text"><?= __('account.title') ?></span>
                    </a>
                </li>
                
                <?php if ($isAdmin): ?>
                <li class="nav-item">
                    <a href="admin/" class="nav-link" title="<?= __('dashboard.admin') ?>">
                        <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                        </svg>
                        <span class="nav-text"><?= __('dashboard.admin') ?></span>
                    </a>
                </li>
                <?php endif; ?>
            </ul>
        </nav>
        
        <!-- Bouton toggle sidebar -->
        <button class="sidebar-toggle" id="sidebarToggle" title="<?= __('dashboard.toggle_menu') ?>">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
        </button>
    </aside>
    
    <!-- Contenu principal -->
    <div class="main-wrapper" id="mainWrapper">
        
        <!-- Header -->
        <header class="main-header">
            <div class="header-left">
                <!-- Bouton hamburger mobile -->
                <button class="mobile-menu-toggle" id="mobileMenuToggle">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                    </svg>
                </button>
                
                <!-- Barre de recherche -->
                <div class="header-search">
                    <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <input type="text" class="search-input" placeholder="<?= __('dashboard.search_placeholder') ?>">
                </div>
            </div>
            
            <div class="header-right">
                <!-- Bouton ajout rapide item -->
                <button class="header-btn" id="quickAddBtn" title="<?= __('dashboard.quick_add') ?>">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                </button>
                
                <!-- Bouton ajout rapide catégorie -->
                <button class="header-btn" id="quickAddCategoryBtn" title="<?= __('dashboard.quick_add_category') ?>">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                        <line x1="12" y1="11" x2="12" y2="17"></line>
                        <line x1="9" y1="14" x2="15" y2="14"></line>
                    </svg>
                </button>
                
                <!-- Notifications -->
                <button class="header-btn" title="<?= __('dashboard.notifications') ?>">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                    <span class="notification-badge">3</span>
                </button>
                
                <!-- Menu utilisateur -->
                <div class="user-menu" id="userMenu">
                    <button class="user-menu-toggle" id="userMenuToggle">
                        <div class="user-avatar" id="headerAvatar">
                            <?php if (!empty($_SESSION['avatar_url'])): ?>
                                <img src="<?= htmlspecialchars($_SESSION['avatar_url']) ?>?v=<?= time() ?>" alt="Avatar">
                            <?php else: ?>
                                <?= strtoupper(substr($username, 0, 1)) ?>
                            <?php endif; ?>
                        </div>
                        <span class="user-name"><?= htmlspecialchars($username) ?></span>
                        <svg class="user-chevron" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </button>
                    
                    <div class="user-dropdown" id="userDropdown">
                        <div class="dropdown-header">
                            <div class="user-avatar large" id="dropdownAvatar">
                                <?php if (!empty($_SESSION['avatar_url'])): ?>
                                    <img src="<?= htmlspecialchars($_SESSION['avatar_url']) ?>?v=<?= time() ?>" alt="Avatar">
                                <?php else: ?>
                                    <?= strtoupper(substr($username, 0, 1)) ?>
                                <?php endif; ?>
                            </div>
                            <div class="dropdown-user-info">
                                <span class="dropdown-username"><?= htmlspecialchars($username) ?></span>
                                <span class="dropdown-role">
                                    <?php if ($isAdmin): ?>
                                        <span class="badge badge-admin"><?= __('dashboard.role_admin') ?></span>
                                    <?php elseif ($isPremium): ?>
                                        <span class="badge badge-premium"><?= __('dashboard.role_premium') ?></span>
                                    <?php else: ?>
                                        <span class="badge badge-member"><?= __('dashboard.role_member') ?></span>
                                    <?php endif; ?>
                                </span>
                            </div>
                        </div>
                        
                        <div class="dropdown-divider"></div>
                        
                        <a href="dashboard.php?page=account" class="dropdown-item" data-page="account">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="3"></circle>
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                            </svg>
                            <?= __('dashboard.settings') ?>
                        </a>
                        
                        <div class="dropdown-divider"></div>
                        
                        <a href="auth/logout.php" class="dropdown-item dropdown-item-danger">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                <polyline points="16 17 21 12 16 7"></polyline>
                                <line x1="21" y1="12" x2="9" y2="12"></line>
                            </svg>
                            <?= __('dashboard.logout') ?>
                        </a>
                    </div>
                </div>
            </div>
        </header>
        
        <!-- Contenu de la page (SPA container) -->
        <main class="main-content" id="pageContent">
            <!-- Loader pendant le chargement -->
            <div class="page-loader" id="pageLoader">
                <div class="loader-spinner"></div>
                <span><?= __('common.loading') ?? 'Chargement...' ?></span>
            </div>
        </main>
        
        <!-- Footer -->
        <?php include __DIR__ . '/components/footer.php'; ?>
    </div>
    
    <!-- Toast container pour les notifications -->
    <div class="toast-container" id="toastContainer"></div>
    
    <!-- Overlay mobile -->
    <div class="sidebar-overlay" id="sidebarOverlay"></div>
    
    <!-- Scripts -->
    <script src="assets/js/modal-manager.js"></script>
    <script src="assets/js/icon-editor.js"></script>
    <script src="assets/js/image-editor.js"></script>
    <script src="assets/js/barcode-scanner.js"></script>
    <script src="assets/js/camera-capture.js"></script>
    <script src="assets/js/document-viewer.js"></script>
    <script src="assets/js/media-list-manager.js"></script>
    <script type="module" src="assets/js/web-search/index.js"></script>
    <script src="assets/js/account.js"></script>
    <script type="module" src="assets/js/collection/index.js?v=<?= time() ?>"></script>
    <script src="assets/js/dashboard.js"></script>
    <script src="assets/js/router.js"></script>
</body>
</html>
