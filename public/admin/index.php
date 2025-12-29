<?php
/**
 * SnowShelf - Administration Panel
 * Gestion des utilisateurs et paramètres système
 */

session_start();

// Vérifier l'authentification et les droits admin
if (!isset($_SESSION['user_id'])) {
    header('Location: ../login.php');
    exit;
}

if (!($_SESSION['is_admin'] ?? false)) {
    header('Location: ../dashboard.php');
    exit;
}

// Charger les dépendances
require_once __DIR__ . '/../../core/i18n.php';
require_once __DIR__ . '/../../core/SiteConfig.php';
require_once __DIR__ . '/../../core/logger.php';

// Récupérer le thème effectif (config admin avec fallback)
$siteConfig = SiteConfig::getInstance();
$effective = $siteConfig->getEffectiveConfig($_SESSION['user_id']);
$theme = $effective['theme'];
$backgroundUrl = $effective['background_url'];

// DEBUG temporaire
loger('admin', 'DEBUG', 'Admin page loaded', [
    'user_id' => $_SESSION['user_id'],
    'session_theme' => $_SESSION['theme'] ?? 'null',
    'effective_theme' => $theme,
    'background_url' => $backgroundUrl
]);

$username = $_SESSION['username'] ?? 'Utilisateur';
$isAdmin = $_SESSION['is_admin'] ?? true;
$isPremium = $_SESSION['is_premium'] ?? false;

// Section active (users par défaut)
$section = $_GET['section'] ?? 'users';
$validSections = ['users', 'settings', 'logs', 'stats', 'databases'];
if (!in_array($section, $validSections)) {
    $section = 'users';
}
?>
<!-- DEBUG: theme='<?= $theme ?>' session_theme='<?= $_SESSION['theme'] ?? 'null' ?>' -->
<!DOCTYPE html>
<html lang="<?= getLang() ?>" data-theme="<?= htmlspecialchars($theme) ?>">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= __('common.app_name') ?> - <?= __('admin.title') ?></title>
    
    <!-- Favicon -->
    <link rel="icon" type="image/png" href="../assets/images/favicon.png">
    
    <!-- Material Design Icons -->
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@mdi/font@7.4.47/css/materialdesignicons.min.css">
    
    <!-- Thèmes CSS -->
    <link rel="stylesheet" href="../themes/themes.css">
    <link rel="stylesheet" href="../assets/css/modal.css">
    <link rel="stylesheet" href="../assets/css/dashboard.css">
    <link rel="stylesheet" href="../assets/css/admin.css">
    
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
    
    <!-- DEBUG: Afficher le thème actuel -->
    <!-- <script>
        console.log('[ADMIN PAGE DEBUG] data-theme attribute:', document.documentElement.getAttribute('data-theme'));
        console.log('[ADMIN PAGE DEBUG] PHP theme variable:', '<?= $theme ?>');
    </script> -->
</head>
<body>
    
    <!-- Sidebar / Menu latéral -->
    <aside class="sidebar" id="sidebar">
        <div class="sidebar-header">
            <img src="../assets/images/logo.png" alt="<?= __('common.app_name') ?>" class="sidebar-logo">
            <span class="sidebar-title"><?= __('common.app_name') ?></span>
        </div>
        
        <nav class="sidebar-nav">
            <!-- Menu principal -->
            <ul class="nav-menu">
                <li class="nav-item">
                    <a href="../dashboard.php" class="nav-link" title="<?= __('dashboard.home') ?>">
                        <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                            <polyline points="9 22 9 12 15 12 15 22"></polyline>
                        </svg>
                        <span class="nav-text"><?= __('dashboard.home') ?></span>
                    </a>
                </li>
            </ul>
            
            <!-- Séparateur -->
            <div class="nav-separator"></div>
            
            <!-- Menu Admin -->
            <div class="nav-section-title"><?= __('admin.title') ?></div>
            <ul class="nav-menu">
                <li class="nav-item <?= $section === 'users' ? 'active' : '' ?>">
                    <a href="?section=users" class="nav-link" title="<?= __('admin.users') ?>">
                        <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                        <span class="nav-text"><?= __('admin.users') ?></span>
                    </a>
                </li>
                
                <li class="nav-item <?= $section === 'stats' ? 'active' : '' ?>">
                    <a href="?section=stats" class="nav-link" title="<?= __('admin.statistics') ?>">
                        <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="20" x2="18" y2="10"></line>
                            <line x1="12" y1="20" x2="12" y2="4"></line>
                            <line x1="6" y1="20" x2="6" y2="14"></line>
                        </svg>
                        <span class="nav-text"><?= __('admin.statistics') ?></span>
                    </a>
                </li>
                
                <li class="nav-item <?= $section === 'logs' ? 'active' : '' ?>">
                    <a href="?section=logs" class="nav-link" title="<?= __('admin.logs') ?>">
                        <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                            <polyline points="14 2 14 8 20 8"></polyline>
                            <line x1="16" y1="13" x2="8" y2="13"></line>
                            <line x1="16" y1="17" x2="8" y2="17"></line>
                            <polyline points="10 9 9 9 8 9"></polyline>
                        </svg>
                        <span class="nav-text"><?= __('admin.logs') ?></span>
                    </a>
                </li>
                
                <li class="nav-item <?= $section === 'settings' ? 'active' : '' ?>">
                    <a href="?section=settings" class="nav-link" title="<?= __('admin.system_settings') ?>">
                        <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                        </svg>
                        <span class="nav-text"><?= __('admin.system_settings') ?></span>
                    </a>
                </li>
                
                <li class="nav-item <?= $section === 'databases' ? 'active' : '' ?>">
                    <a href="?section=databases" class="nav-link" title="<?= __('admin.databases') ?>">
                        <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
                            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
                            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
                        </svg>
                        <span class="nav-text"><?= __('admin.databases') ?></span>
                    </a>
                </li>
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
                
                <h1 class="header-title">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg>
                    <?= __('admin.title') ?>
                </h1>
            </div>
            
            <div class="header-right">
                <!-- Menu utilisateur -->
                <div class="user-menu" id="userMenu">
                    <button class="user-menu-toggle" id="userMenuToggle">
                        <div class="user-avatar" id="headerAvatar">
                            <?php if (!empty($_SESSION['avatar_url'])): ?>
                                <img src="../<?= htmlspecialchars($_SESSION['avatar_url']) ?>?v=<?= time() ?>" alt="Avatar">
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
                                    <img src="../<?= htmlspecialchars($_SESSION['avatar_url']) ?>?v=<?= time() ?>" alt="Avatar">
                                <?php else: ?>
                                    <?= strtoupper(substr($username, 0, 1)) ?>
                                <?php endif; ?>
                            </div>
                            <div class="dropdown-user-info">
                                <span class="dropdown-username"><?= htmlspecialchars($username) ?></span>
                                <span class="dropdown-role">
                                    <span class="badge badge-admin"><?= __('dashboard.role_admin') ?></span>
                                </span>
                            </div>
                        </div>
                        
                        <div class="dropdown-divider"></div>
                        
                        <a href="../dashboard.php?page=account" class="dropdown-item">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="3"></circle>
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                            </svg>
                            <?= __('dashboard.settings') ?>
                        </a>
                        
                        <a href="../dashboard.php" class="dropdown-item">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                <polyline points="9 22 9 12 15 12 15 22"></polyline>
                            </svg>
                            <?= __('dashboard.home') ?>
                        </a>
                        
                        <div class="dropdown-divider"></div>
                        
                        <a href="../auth/logout.php" class="dropdown-item dropdown-item-danger">
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
        
        <!-- Contenu de la page -->
        <main class="main-content">
            <?php if ($section === 'users'): ?>
            <!-- Section Gestion des Utilisateurs -->
            <div class="admin-section" id="usersSection">
                <div class="section-header">
                    <div class="section-title">
                        <h2><?= __('admin.users_management') ?></h2>
                        <p class="section-subtitle"><?= __('admin.users_subtitle') ?></p>
                    </div>
                    <button class="btn btn-primary" id="addUserBtn">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="8.5" cy="7" r="4"></circle>
                            <line x1="20" y1="8" x2="20" y2="14"></line>
                            <line x1="23" y1="11" x2="17" y2="11"></line>
                        </svg>
                        <?= __('admin.add_user') ?>
                    </button>
                </div>
                
                <!-- Toolbar -->
                <div class="admin-toolbar">
                    <div class="search-box">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        <input type="text" id="searchUsers" placeholder="<?= __('admin.search_users') ?>">
                    </div>
                    
                    <div class="toolbar-actions">
                        <!-- Dropdown Rôle -->
                        <div class="custom-dropdown" id="filterRoleDropdown" style="width: 160px;">
                            <select id="filterRole" class="custom-dropdown-select">
                                <option value=""><?= __('admin.all_roles') ?></option>
                                <option value="admin"><?= __('admin.filter_admins') ?></option>
                                <option value="premium"><?= __('admin.filter_premium') ?></option>
                                <option value="member"><?= __('admin.filter_members') ?></option>
                            </select>
                            <button type="button" class="custom-dropdown-trigger">
                                <span class="custom-dropdown-icon">👥</span>
                                <span class="custom-dropdown-text"><?= __('admin.all_roles') ?></span>
                                <svg class="custom-dropdown-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </button>
                            <div class="custom-dropdown-menu" role="listbox">
                                <div class="custom-dropdown-option selected" data-value="" data-icon="👥">
                                    <span class="custom-dropdown-option-icon">👥</span>
                                    <span class="custom-dropdown-option-text"><?= __('admin.all_roles') ?></span>
                                </div>
                                <div class="custom-dropdown-option" data-value="admin" data-icon="👑">
                                    <span class="custom-dropdown-option-icon">👑</span>
                                    <span class="custom-dropdown-option-text"><?= __('admin.filter_admins') ?></span>
                                </div>
                                <div class="custom-dropdown-option" data-value="premium" data-icon="⭐">
                                    <span class="custom-dropdown-option-icon">⭐</span>
                                    <span class="custom-dropdown-option-text"><?= __('admin.filter_premium') ?></span>
                                </div>
                                <div class="custom-dropdown-option" data-value="member" data-icon="👤">
                                    <span class="custom-dropdown-option-icon">👤</span>
                                    <span class="custom-dropdown-option-text"><?= __('admin.filter_members') ?></span>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Dropdown Tri -->
                        <div class="custom-dropdown" id="sortByDropdown" style="width: 160px;">
                            <select id="sortBy" class="custom-dropdown-select">
                                <option value="id"><?= __('admin.sort_id') ?></option>
                                <option value="name"><?= __('admin.sort_name') ?></option>
                                <option value="email"><?= __('admin.sort_email') ?></option>
                                <option value="created_at"><?= __('admin.sort_date') ?></option>
                            </select>
                            <button type="button" class="custom-dropdown-trigger">
                                <span class="custom-dropdown-icon">🔢</span>
                                <span class="custom-dropdown-text"><?= __('admin.sort_id') ?></span>
                                <svg class="custom-dropdown-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </button>
                            <div class="custom-dropdown-menu" role="listbox">
                                <div class="custom-dropdown-option selected" data-value="id" data-icon="🔢">
                                    <span class="custom-dropdown-option-icon">🔢</span>
                                    <span class="custom-dropdown-option-text"><?= __('admin.sort_id') ?></span>
                                </div>
                                <div class="custom-dropdown-option" data-value="name" data-icon="🔤">
                                    <span class="custom-dropdown-option-icon">🔤</span>
                                    <span class="custom-dropdown-option-text"><?= __('admin.sort_name') ?></span>
                                </div>
                                <div class="custom-dropdown-option" data-value="email" data-icon="📧">
                                    <span class="custom-dropdown-option-icon">📧</span>
                                    <span class="custom-dropdown-option-text"><?= __('admin.sort_email') ?></span>
                                </div>
                                <div class="custom-dropdown-option" data-value="created_at" data-icon="📅">
                                    <span class="custom-dropdown-option-icon">📅</span>
                                    <span class="custom-dropdown-option-text"><?= __('admin.sort_date') ?></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Table des utilisateurs -->
                <div class="table-container">
                    <table class="admin-table" id="usersTable">
                        <thead>
                            <tr>
                                <th class="col-id">#</th>
                                <th class="col-user"><?= __('admin.col_user') ?></th>
                                <th class="col-email"><?= __('admin.col_email') ?></th>
                                <th class="col-role"><?= __('admin.col_role') ?></th>
                                <th class="col-status"><?= __('admin.col_status') ?></th>
                                <th class="col-date"><?= __('admin.col_created') ?></th>
                                <th class="col-actions"><?= __('common.actions') ?></th>
                            </tr>
                        </thead>
                        <tbody id="usersTableBody">
                            <!-- Chargé via JavaScript -->
                        </tbody>
                    </table>
                </div>
                
                <!-- Pagination -->
                <div class="pagination" id="usersPagination">
                    <!-- Générée via JavaScript -->
                </div>
                
                <!-- Loading overlay -->
                <div class="loading-overlay" id="loadingOverlay">
                    <div class="spinner"></div>
                    <span><?= __('common.loading') ?></span>
                </div>
            </div>
            
            <?php elseif ($section === 'stats'): ?>
            <!-- Section Statistiques -->
            <div class="admin-section">
                <div class="section-header">
                    <div class="section-title">
                        <h2><?= __('admin.statistics') ?></h2>
                        <p class="section-subtitle"><?= __('admin.stats_subtitle') ?></p>
                    </div>
                </div>
                <div class="placeholder-card">
                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <line x1="18" y1="20" x2="18" y2="10"></line>
                        <line x1="12" y1="20" x2="12" y2="4"></line>
                        <line x1="6" y1="20" x2="6" y2="14"></line>
                    </svg>
                    <h2><?= __('admin.coming_soon') ?></h2>
                    <p><?= __('admin.stats_coming') ?></p>
                </div>
            </div>
            
            <?php elseif ($section === 'logs'): ?>
            <!-- Section Logs -->
            <div class="admin-section">
                <div class="section-header">
                    <div class="section-title">
                        <h2><?= __('admin.logs') ?></h2>
                        <p class="section-subtitle"><?= __('admin.logs_subtitle') ?></p>
                    </div>
                </div>
                <div class="placeholder-card">
                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                    </svg>
                    <h2><?= __('admin.coming_soon') ?></h2>
                    <p><?= __('admin.logs_coming') ?></p>
                </div>
            </div>
            
            <?php elseif ($section === 'settings'): ?>
            <!-- Section Paramètres Système -->
            <div class="admin-section" id="settingsSection">
                <div class="section-header">
                    <div class="section-title">
                        <h2><?= __('admin.system_settings') ?></h2>
                        <p class="section-subtitle"><?= __('admin.settings_subtitle') ?></p>
                    </div>
                </div>
                
                <!-- Tabs de navigation -->
                <div class="settings-tabs">
                    <button class="settings-tab active" data-tab="main-config">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                        </svg>
                        <?= __('admin.tab_main_config') ?>
                    </button>
                    <button class="settings-tab" data-tab="appearance">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <circle cx="12" cy="12" r="4"></circle>
                            <line x1="21.17" y1="8" x2="12" y2="8"></line>
                            <line x1="3.95" y1="6.06" x2="8.54" y2="14"></line>
                            <line x1="10.88" y1="21.94" x2="15.46" y2="14"></line>
                        </svg>
                        <?= __('admin.tab_appearance') ?>
                    </button>
                    <button class="settings-tab" data-tab="web-apis">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9m-9 9a9 9 0 0 1 9-9"></path>
                        </svg>
                        <?= __('admin.tab_web_apis') ?>
                    </button>
                    <button class="settings-tab" data-tab="user-limits">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                        <?= __('admin.tab_user_limits') ?>
                    </button>
                    <button class="settings-tab" data-tab="grades">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                        </svg>
                        <?= __('admin.tab_grades') ?>
                    </button>
                    <button class="settings-tab" data-tab="statuses">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                            <line x1="7" y1="7" x2="7.01" y2="7"></line>
                        </svg>
                        <?= __('admin.tab_statuses') ?>
                    </button>
                    <button class="settings-tab" data-tab="upload-config">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                            <polyline points="17 8 12 3 7 8"></polyline>
                            <line x1="12" y1="3" x2="12" y2="15"></line>
                        </svg>
                        <?= __('admin.tab_upload_config') ?>
                    </button>
                    <button class="settings-tab" data-tab="primary-types">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M4 6h16M4 12h16M4 18h7"></path>
                            <path d="M19 15l-3 3 3 3"></path>
                        </svg>
                        <?= __('admin.tab_primary_types') ?>
                    </button>
                    <button class="settings-tab" data-tab="type-fields">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="3" y1="9" x2="21" y2="9"></line>
                            <line x1="9" y1="21" x2="9" y2="9"></line>
                        </svg>
                        <?= __('admin.tab_type_fields') ?? 'Champs de détails' ?>
                    </button>
                    <button class="settings-tab" data-tab="field-mappings">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M16 3h5v5"></path>
                            <path d="M8 3H3v5"></path>
                            <path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3"></path>
                            <path d="m15 9 6-6"></path>
                        </svg>
                        <?= __('admin.tab_field_mappings') ?? 'Mappings API' ?>
                    </button>
                </div>
                
                <!-- Tab: Configuration Principale -->
                <div class="settings-panel active" id="panel-main-config">
                    <div class="config-card">
                        <div class="config-card-header">
                            <h3><?= __('admin.main_config_title') ?></h3>
                            <p><?= __('admin.main_config_desc') ?></p>
                        </div>
                        <form id="mainConfigForm" class="config-form">
                            <div class="form-group">
                                <label for="cfgTimezone"><?= __('admin.cfg_timezone') ?></label>
                                <input type="text" id="cfgTimezone" name="SNOWSHELF_TZ" placeholder="Europe/Paris">
                                <small class="form-hint"><?= __('admin.cfg_timezone_hint') ?></small>
                            </div>
                            
                            <div class="form-group">
                                <label for="cfgOcrTimeout"><?= __('admin.cfg_ocr_timeout') ?></label>
                                <input type="number" id="cfgOcrTimeout" name="WS_OCR_TIMEOUT" placeholder="10000">
                                <small class="form-hint"><?= __('admin.cfg_ocr_timeout_hint') ?></small>
                            </div>
                            
                            <div class="form-group">
                                <label for="cfgOcrUrl"><?= __('admin.cfg_ocr_url') ?></label>
                                <div class="url-input-group">
                                    <input type="url" id="cfgOcrUrl" name="IDENTIFY_OCR_URL" placeholder="http://...">
                                    <button type="button" class="btn btn-secondary btn-test-url" data-target="cfgOcrUrl" title="<?= __('admin.test_url') ?>">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                        </svg>
                                    </button>
                                </div>
                                <small class="url-status" id="cfgOcrUrl-status"></small>
                            </div>
                            
                            <div class="form-group">
                                <label for="cfgInfosUrl"><?= __('admin.cfg_infos_url') ?></label>
                                <div class="url-input-group">
                                    <input type="url" id="cfgInfosUrl" name="IDENTIFY_INFOS_URL" placeholder="http://...">
                                    <button type="button" class="btn btn-secondary btn-test-url" data-target="cfgInfosUrl" title="<?= __('admin.test_url') ?>">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                        </svg>
                                    </button>
                                </div>
                                <small class="url-status" id="cfgInfosUrl-status"></small>
                            </div>
                            
                            <div class="form-group">
                                <label for="cfgEncryptionKey"><?= __('admin.cfg_encryption_key') ?></label>
                                <div class="input-with-actions">
                                    <input type="password" id="cfgEncryptionKey" name="API_ENCRYPTION_KEY" placeholder="Clé d'encryption AES-256">
                                    <button type="button" class="btn btn-icon toggle-visibility" title="Afficher/Masquer">
                                        <svg class="eye-open" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                            <circle cx="12" cy="12" r="3"></circle>
                                        </svg>
                                        <svg class="eye-closed" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display:none;">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                            <line x1="1" y1="1" x2="23" y2="23"></line>
                                        </svg>
                                    </button>
                                </div>
                                <small class="form-hint"><?= __('admin.cfg_encryption_key_hint') ?></small>
                            </div>
                            
                            <div class="form-group">
                                <label for="cfgTradUrl"><?= __('admin.cfg_trad_url') ?></label>
                                <div class="url-input-group">
                                    <input type="url" id="cfgTradUrl" name="AUTO_TRAD_URL" placeholder="http://...">
                                    <button type="button" class="btn btn-secondary btn-test-url" data-target="cfgTradUrl" title="<?= __('admin.test_url') ?>">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                            <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                        </svg>
                                    </button>
                                </div>
                                <small class="url-status" id="cfgTradUrl-status"></small>
                            </div>
                            
                            <div class="form-actions">
                                <button type="submit" class="btn btn-primary">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                        <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                        <polyline points="7 3 7 8 15 8"></polyline>
                                    </svg>
                                    <?= __('common.save') ?>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
                
                <!-- Tab: Apparence -->
                <div class="settings-panel" id="panel-appearance">
                    <div class="config-card">
                        <div class="config-card-header">
                            <h3><?= __('admin.appearance_title') ?></h3>
                            <p><?= __('admin.appearance_desc') ?></p>
                        </div>
                        
                        <form id="appearanceForm" enctype="multipart/form-data">
                            <div class="form-row-2">
                                <div class="form-group">
                                    <label for="defaultTheme"><?= __('admin.default_theme') ?></label>
                                    <select id="defaultTheme" name="DEFAULT_THEME">
                                        <option value="aquamarine">💎 Aquamarine</option>
                                        <option value="blackberry-abyss">🌊 Blackberry Abyss</option>
                                        <option value="blackberry-amethyst">💜 Blackberry Amethyst</option>
                                        <option value="blackberry-carol">🎄 Blackberry Carol</option>
                                        <option value="blackberry-dreamscape">🌸 Blackberry Dreamscape</option>
                                        <option value="blackberry-flamingo">🦩 Blackberry Flamingo</option>
                                        <option value="blackberry-hearth">🔥 Blackberry Hearth</option>
                                        <option value="blackberry-martian">👽 Blackberry Martian</option>
                                        <option value="blackberry-pumpkin">🎃 Blackberry Pumpkin</option>
                                        <option value="blackberry-royal">👑 Blackberry Royal</option>
                                        <option value="blackberry-shadow">🌑 Blackberry Shadow</option>
                                        <option value="blackberry-solar">🫐 Blackberry Solar</option>
                                        <option value="blackberry-vanta">⬛ Blackberry Vanta</option>
                                        <option value="catppuccin-frappe">☕ Catppuccin Frappé</option>
                                        <option value="catppuccin-latte">☀️ Catppuccin Latte</option>
                                        <option value="catppuccin-macchiato">🌙 Catppuccin Macchiato</option>
                                        <option value="catppuccin-mocha">🌑 Catppuccin Mocha</option>
                                        <option value="dark">🌙 Dark</option>
                                        <option value="dracula">🧛 Dracula</option>
                                        <option value="hotline">🌴 Hotline</option>
                                        <option value="hotpink">💖 Hot Pink</option>
                                        <option value="ibracorp">💜 IbraCorp</option>
                                        <option value="infinity-mind">🧠 Infinity Mind</option>
                                        <option value="infinity-power">💪 Infinity Power</option>
                                        <option value="infinity-reality">🌌 Infinity Reality</option>
                                        <option value="infinity-soul">👻 Infinity Soul</option>
                                        <option value="infinity-space">🪐 Infinity Space</option>
                                        <option value="infinity-time">⏰ Infinity Time</option>
                                        <option value="maroon">🍷 Maroon</option>
                                        <option value="nord">❄️ Nord</option>
                                        <option value="onedark">🌑 One Dark</option>
                                        <option value="organizr">🎨 Organizr</option>
                                        <option value="overseerr">🎬 Overseerr</option>
                                        <option value="pine-shadow">🌲 Pine Shadow</option>
                                        <option value="plex">🎥 Plex</option>
                                        <option value="rose-pine">🌹 Rose Pine</option>
                                        <option value="rose-pine-dawn">🌅 Rose Pine Dawn</option>
                                        <option value="rose-pine-moon">🌙 Rose Pine Moon</option>
                                        <option value="snowshelf-christmas">🎄 SnowShelf Christmas</option>
                                        <option value="snowshelf-halloween">🎃 SnowShelf Halloween</option>
                                        <option value="snowshelf-santa">🎅 SnowShelf Santa</option>
                                        <option value="space-gray">🚀 Space Gray</option>
                                        <option value="trueblack">⬛ True Black (OLED)</option>
                                    </select>
                                    <small class="form-hint"><?= __('admin.default_theme_hint') ?></small>
                                </div>
                                
                                <div class="form-group">
                                    <label for="defaultLang"><?= __('admin.default_lang') ?></label>
                                    <select id="defaultLang" name="DEFAULT_LANG">
                                        <option value="fr">🇫🇷 Français</option>
                                        <option value="en">🇬🇧 English</option>
                                    </select>
                                    <small class="form-hint"><?= __('admin.default_lang_hint') ?></small>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="defaultBackground"><?= __('admin.default_background') ?></label>
                                <div class="background-upload-container">
                                    <div class="background-preview" id="backgroundPreview">
                                        <img src="" alt="Background preview" id="backgroundPreviewImg" style="display: none;">
                                        <div class="background-placeholder" id="backgroundPlaceholder">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                                <polyline points="21 15 16 10 5 21"></polyline>
                                            </svg>
                                            <span><?= __('admin.no_background') ?></span>
                                        </div>
                                    </div>
                                    <div class="background-actions">
                                        <input type="file" id="backgroundFile" name="background" accept="image/*" style="display: none;">
                                        <button type="button" class="btn btn-secondary" id="selectBackgroundBtn">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                                <polyline points="17 8 12 3 7 8"></polyline>
                                                <line x1="12" y1="3" x2="12" y2="15"></line>
                                            </svg>
                                            <?= __('admin.select_image') ?>
                                        </button>
                                        <button type="button" class="btn btn-danger" id="removeBackgroundBtn" style="display: none;">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <polyline points="3 6 5 6 21 6"></polyline>
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                            </svg>
                                            <?= __('admin.remove_image') ?>
                                        </button>
                                    </div>
                                </div>
                                <small class="form-hint"><?= __('admin.default_background_hint') ?></small>
                            </div>
                            
                            <div class="form-actions">
                                <button type="submit" class="btn btn-primary">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                        <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                        <polyline points="7 3 7 8 15 8"></polyline>
                                    </svg>
                                    <?= __('common.save') ?>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
                
                <!-- Tab: APIs Web -->
                <div class="settings-panel" id="panel-web-apis">
                    <div class="panel-header">
                        <h3><?= __('admin.web_apis_title') ?></h3>
                        <button class="btn btn-primary" id="addApiBtn">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            <?= __('admin.add_api') ?>
                        </button>
                    </div>
                    
                    <div class="table-container">
                        <table class="admin-table" id="apisTable">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th><?= __('admin.api_name') ?></th>
                                    <th><?= __('admin.api_type') ?></th>
                                    <th><?= __('admin.api_limits') ?></th>
                                    <th><?= __('admin.api_features') ?></th>
                                    <th><?= __('admin.api_status') ?></th>
                                    <th><?= __('common.actions') ?></th>
                                </tr>
                            </thead>
                            <tbody id="apisTableBody">
                                <!-- Chargé via JS -->
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <!-- Tab: Limites Utilisateurs -->
                <div class="settings-panel" id="panel-user-limits">
                    <div class="panel-header">
                        <h3><?= __('admin.user_limits_title') ?></h3>
                        <button class="btn btn-primary" id="addLimitBtn">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            <?= __('admin.add_limit') ?>
                        </button>
                    </div>
                    
                    <p class="panel-description"><?= __('admin.user_limits_desc') ?></p>
                    
                    <div class="table-container">
                        <table class="admin-table" id="limitsTable">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th><?= __('admin.limit_free') ?></th>
                                    <th><?= __('admin.limit_premium') ?></th>
                                    <th><?= __('common.actions') ?></th>
                                </tr>
                            </thead>
                            <tbody id="limitsTableBody">
                                <!-- Chargé via JS -->
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <!-- Tab: Grades par défaut -->
                <div class="settings-panel" id="panel-grades">
                    <div class="panel-header">
                        <h3><?= __('admin.grades_title') ?></h3>
                        <button class="btn btn-primary" id="addGradeBtn">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            <?= __('admin.add_grade') ?>
                        </button>
                    </div>
                    
                    <p class="panel-description"><?= __('admin.grades_desc') ?></p>
                    
                    <div class="table-container">
                        <table class="admin-table" id="gradesTable">
                            <thead>
                                <tr>
                                    <th style="width: 60px;">#</th>
                                    <th><?= __('admin.grade_name') ?></th>
                                    <th><?= __('admin.grade_description') ?></th>
                                    <th style="width: 120px;"><?= __('admin.grade_usage') ?></th>
                                    <th style="width: 120px;"><?= __('common.actions') ?></th>
                                </tr>
                            </thead>
                            <tbody id="gradesTableBody">
                                <!-- Chargé via JS -->
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <!-- Tab: Statuts par défaut -->
                <div class="settings-panel" id="panel-statuses">
                    <div class="panel-header">
                        <h3><?= __('admin.statuses_title') ?></h3>
                        <button class="btn btn-primary" id="addStatusBtn">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            <?= __('admin.add_status') ?>
                        </button>
                    </div>
                    
                    <p class="panel-description"><?= __('admin.statuses_desc') ?></p>
                    
                    <div class="table-container">
                        <table class="admin-table" id="statusesTable">
                            <thead>
                                <tr>
                                    <th style="width: 60px;">#</th>
                                    <th style="width: 50px;"><?= __('admin.status_color') ?></th>
                                    <th><?= __('admin.status_name') ?></th>
                                    <th><?= __('admin.status_description') ?></th>
                                    <th style="width: 80px;"><?= __('admin.status_icon') ?></th>
                                    <th style="width: 100px;"><?= __('admin.status_usage') ?></th>
                                    <th style="width: 120px;"><?= __('common.actions') ?></th>
                                </tr>
                            </thead>
                            <tbody id="statusesTableBody">
                                <!-- Chargé via JS -->
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <!-- Tab: Configuration des Uploads -->
                <div class="settings-panel" id="panel-upload-config">
                    <div class="panel-header">
                        <h3><?= __('admin.upload_config_title') ?></h3>
                        <button class="btn btn-primary" id="addUploadConfigBtn">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            <?= __('admin.add_upload_config') ?>
                        </button>
                    </div>
                    
                    <p class="panel-description"><?= __('admin.upload_config_desc') ?></p>
                    
                    <div class="table-container">
                        <table class="admin-table" id="uploadConfigTable">
                            <thead>
                                <tr>
                                    <th style="width: 50px;"><?= __('admin.upload_status') ?></th>
                                    <th style="width: 120px;"><?= __('admin.upload_category') ?></th>
                                    <th><?= __('admin.upload_extensions') ?></th>
                                    <th style="width: 100px;"><?= __('admin.upload_max_size') ?></th>
                                    <th><?= __('admin.upload_description') ?></th>
                                    <th style="width: 120px;"><?= __('common.actions') ?></th>
                                </tr>
                            </thead>
                            <tbody id="uploadConfigTableBody">
                                <!-- Chargé via JS -->
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <!-- Tab: Types Primaires et Fournisseurs -->
                <div class="settings-panel" id="panel-primary-types">
                    <div class="panel-header">
                        <h3><?= __('admin.primary_types_title') ?></h3>
                    </div>
                    
                    <p class="panel-description"><?= __('admin.primary_types_desc') ?></p>
                    
                    <div class="primary-types-container" id="primaryTypesContainer">
                        <!-- Chargé via JS -->
                    </div>
                </div>
                
                <!-- Tab: Champs de Détails (Métadonnées) -->
                <div class="settings-panel" id="panel-type-fields">
                    <div class="panel-header">
                        <h3><?= __('admin.type_fields_title') ?? 'Champs de métadonnées' ?></h3>
                        <button class="btn btn-primary btn-sm" id="addTypeFieldBtn">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            <?= __('common.add') ?>
                        </button>
                    </div>
                    
                    <p class="panel-description"><?= __('admin.type_fields_desc') ?? 'Gérez les champs de métadonnées affichés dans l\'onglet "Détails" du modal d\'item, pour chaque type primaire.' ?></p>
                    
                    <!-- Filtre par type -->
                    <div class="filter-row">
                        <label><?= __('admin.filter_by_type') ?? 'Filtrer par type' ?>:</label>
                        <div class="custom-dropdown" id="typeFieldsFilterDropdown" style="width: 220px;">
                            <select id="typeFieldsFilter" class="custom-dropdown-select">
                                <option value=""><?= __('common.all') ?? 'Tous' ?></option>
                                <!-- Options chargées via JS -->
                            </select>
                            <button type="button" class="custom-dropdown-trigger">
                                <span class="custom-dropdown-icon">📋</span>
                                <span class="custom-dropdown-text"><?= __('common.all') ?? 'Tous' ?></span>
                                <svg class="custom-dropdown-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </button>
                            <div class="custom-dropdown-menu">
                                <!-- Options chargées via JS -->
                            </div>
                        </div>
                    </div>
                    
                    <div class="table-container">
                        <table class="admin-table" id="typeFieldsTable">
                            <thead>
                                <tr>
                                    <th style="width: 40px;"><?= __('admin.order') ?? '#' ?></th>
                                    <th style="width: 150px;"><?= __('admin.type') ?? 'Type' ?></th>
                                    <th style="width: 120px;"><?= __('admin.field_key') ?? 'Clé' ?></th>
                                    <th><?= __('admin.field_name') ?? 'Nom (FR)' ?></th>
                                    <th style="width: 100px;"><?= __('admin.field_type') ?? 'Type' ?></th>
                                    <th style="width: 80px;"><?= __('admin.mappings') ?? 'Mappings' ?></th>
                                    <th style="width: 120px;"><?= __('common.actions') ?></th>
                                </tr>
                            </thead>
                            <tbody id="typeFieldsTableBody">
                                <!-- Chargé via JS -->
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <!-- Tab: Mappings API -->
                <div class="settings-panel" id="panel-field-mappings">
                    <div class="panel-header">
                        <h3><?= __('admin.field_mappings_title') ?? 'Mappings API → Champs' ?></h3>
                        <div class="panel-header-actions">
                            <button class="btn btn-secondary btn-sm" id="itemFieldMappingsBtn" title="<?= __('admin.item_field_mappings_tooltip') ?? 'Configurer les mappings pour les champs fixes (nom, description, valeur, médias)' ?>">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                    <line x1="16" y1="13" x2="8" y2="13"></line>
                                    <line x1="16" y1="17" x2="8" y2="17"></line>
                                </svg>
                                <?= __('admin.item_field_mappings') ?? 'Champs fixes' ?>
                            </button>
                            <button class="btn btn-primary btn-sm" id="addFieldMappingBtn">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                                <?= __('common.add') ?>
                            </button>
                        </div>
                    </div>
                    
                    <p class="panel-description"><?= __('admin.field_mappings_desc') ?? 'Configurez la correspondance entre les clés retournées par les API de recherche web et les champs de métadonnées. Permet de transformer automatiquement les valeurs lors de l\'import.' ?></p>
                    
                    <!-- Filtres -->
                    <div class="filter-row">
                        <label><?= __('admin.filter_by_type') ?? 'Type' ?>:</label>
                        <div class="custom-dropdown" id="mappingsTypeFilterDropdown" style="width: 200px;">
                            <select id="mappingsTypeFilter" class="custom-dropdown-select">
                                <option value=""><?= __('common.all') ?? 'Tous' ?></option>
                                <!-- Options chargées via JS -->
                            </select>
                            <button type="button" class="custom-dropdown-trigger">
                                <span class="custom-dropdown-icon">📋</span>
                                <span class="custom-dropdown-text"><?= __('common.all') ?? 'Tous' ?></span>
                                <svg class="custom-dropdown-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </button>
                            <div class="custom-dropdown-menu">
                                <!-- Options chargées via JS -->
                            </div>
                        </div>
                        
                        <label style="margin-left: 15px;"><?= __('admin.filter_by_field') ?? 'Champ' ?>:</label>
                        <div class="custom-dropdown" id="mappingsFieldFilterDropdown" style="width: 200px;">
                            <select id="mappingsFieldFilter" class="custom-dropdown-select">
                                <option value=""><?= __('common.all') ?? 'Tous' ?></option>
                                <!-- Options chargées via JS -->
                            </select>
                            <button type="button" class="custom-dropdown-trigger">
                                <span class="custom-dropdown-icon">📋</span>
                                <span class="custom-dropdown-text"><?= __('common.all') ?? 'Tous' ?></span>
                                <svg class="custom-dropdown-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </button>
                            <div class="custom-dropdown-menu">
                                <!-- Options chargées via JS -->
                            </div>
                        </div>
                    </div>
                    
                    <div class="table-container">
                        <table class="admin-table" id="fieldMappingsTable">
                            <thead>
                                <tr>
                                    <th style="width: 130px;"><?= __('admin.type') ?? 'Type' ?></th>
                                    <th style="width: 120px;"><?= __('admin.field') ?? 'Champ' ?></th>
                                    <th><?= __('admin.api_keys') ?? 'Clés API' ?></th>
                                    <th style="width: 130px;"><?= __('admin.transform') ?? 'Transformation' ?></th>
                                    <th style="width: 60px;"><?= __('admin.active') ?? 'Actif' ?></th>
                                    <th style="width: 100px;"><?= __('common.actions') ?></th>
                                </tr>
                            </thead>
                            <tbody id="fieldMappingsTableBody">
                                <!-- Chargé via JS -->
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <!-- Loading overlay -->
                <div class="loading-overlay" id="settingsLoading">
                    <div class="spinner"></div>
                    <span><?= __('common.loading') ?></span>
                </div>
            </div>
            
            <?php elseif ($section === 'databases'): ?>
            <!-- Section Bases de données -->
            <div class="admin-section" id="databasesSection">
                <div class="section-header">
                    <div class="section-title">
                        <h2><?= __('admin.databases') ?></h2>
                        <p class="section-subtitle"><?= __('admin.databases_subtitle') ?></p>
                    </div>
                </div>
                
                <!-- Tabs de navigation -->
                <div class="settings-tabs">
                    <button class="settings-tab active" data-tab="vg-platforms">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                            <line x1="8" y1="21" x2="16" y2="21"></line>
                            <line x1="12" y1="17" x2="12" y2="21"></line>
                        </svg>
                        <?= __('admin.db_vg_platforms') ?>
                    </button>
                </div>
                
                <!-- Tab: Plateformes Jeux Vidéo -->
                <div class="settings-panel active" id="panel-vg-platforms">
                    <!-- Statistiques -->
                    <div class="stats-cards" id="platformStats">
                        <div class="stat-card">
                            <div class="stat-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                                    <line x1="8" y1="21" x2="16" y2="21"></line>
                                    <line x1="12" y1="17" x2="12" y2="21"></line>
                                </svg>
                            </div>
                            <div class="stat-content">
                                <span class="stat-value" id="statTotal">-</span>
                                <span class="stat-label"><?= __('admin.db_total_platforms') ?></span>
                            </div>
                        </div>
                        <div class="stat-card stat-success">
                            <div class="stat-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                    <polyline points="21 15 16 10 5 21"></polyline>
                                </svg>
                            </div>
                            <div class="stat-content">
                                <span class="stat-value" id="statWithLocalImages">-</span>
                                <span class="stat-label"><?= __('admin.db_with_local_images') ?></span>
                            </div>
                        </div>
                        <div class="stat-card stat-info">
                            <div class="stat-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 12a9 9 0 0 1-9 9m9-9a9 9 0 0 0-9-9m9 9H3m9 9a9 9 0 0 1-9-9m9 9c1.66 0 3-4.03 3-9s-1.34-9-3-9m0 18c-1.66 0-3-4.03-3-9s1.34-9 3-9"></path>
                                </svg>
                            </div>
                            <div class="stat-content">
                                <span class="stat-value" id="statWithExternalImages">-</span>
                                <span class="stat-label"><?= __('admin.db_with_external_images') ?></span>
                            </div>
                        </div>
                        <div class="stat-card stat-warning">
                            <div class="stat-icon">
                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                    <line x1="9" y1="9" x2="15" y2="15"></line>
                                    <line x1="15" y1="9" x2="9" y2="15"></line>
                                </svg>
                            </div>
                            <div class="stat-content">
                                <span class="stat-value" id="statWithoutImages">-</span>
                                <span class="stat-label"><?= __('admin.db_without_images') ?></span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Toolbar -->
                    <div class="admin-toolbar">
                        <div class="search-box">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                            <input type="text" id="searchPlatforms" placeholder="<?= __('admin.db_search_platforms') ?>">
                        </div>
                        
                        <div class="toolbar-actions">
                            <select id="filterManufacturer" class="filter-select">
                                <option value=""><?= __('admin.db_all_manufacturers') ?></option>
                            </select>
                            
                            <select id="filterImages" class="filter-select">
                                <option value=""><?= __('admin.db_all_images') ?></option>
                                <option value="yes"><?= __('admin.db_with_images') ?></option>
                                <option value="no"><?= __('admin.db_without_images_filter') ?></option>
                                <option value="console"><?= __('admin.db_console_images') ?></option>
                                <option value="logo"><?= __('admin.db_logo_images') ?></option>
                            </select>
                            
                            <button class="btn btn-primary" id="addPlatformBtn">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <line x1="12" y1="5" x2="12" y2="19"></line>
                                    <line x1="5" y1="12" x2="19" y2="12"></line>
                                </svg>
                                <?= __('admin.db_add_platform') ?>
                            </button>
                            
                            <button class="btn btn-secondary" id="fetchAllImagesBtn" title="<?= __('admin.db_fetch_all_images_title') ?>">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="7 10 12 15 17 10"></polyline>
                                    <line x1="12" y1="15" x2="12" y2="3"></line>
                                </svg>
                                <?= __('admin.db_fetch_images') ?>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Barre de progression (cachée par défaut) -->
                    <div id="fetchProgressContainer" class="fetch-progress-container" style="display: none;">
                        <div class="fetch-progress-header">
                            <span class="fetch-progress-title"><?= __('admin.db_fetching_images') ?></span>
                            <span class="fetch-progress-count">0/0</span>
                        </div>
                        <div class="fetch-progress-bar">
                            <div class="fetch-progress-fill" style="width: 0%"></div>
                        </div>
                        <div class="fetch-progress-current"></div>
                        <div class="fetch-progress-actions">
                            <button class="btn btn-sm btn-secondary" id="cancelFetchBtn"><?= __('common.cancel') ?></button>
                        </div>
                    </div>
                    
                    <!-- Table des plateformes -->
                    <div class="table-container">
                        <table class="admin-table" id="platformsTable">
                            <thead>
                                <tr>
                                    <th class="col-id">#</th>
                                    <th class="col-image"><?= __('admin.db_col_image') ?></th>
                                    <th class="col-name"><?= __('admin.db_col_name') ?></th>
                                    <th class="col-manufacturer"><?= __('admin.db_col_manufacturer') ?></th>
                                    <th class="col-date"><?= __('admin.db_col_release_date') ?></th>
                                    <th class="col-images"><?= __('admin.db_col_images_count') ?></th>
                                    <th class="col-actions"><?= __('common.actions') ?></th>
                                </tr>
                            </thead>
                            <tbody id="platformsTableBody">
                                <!-- Chargé via JS -->
                            </tbody>
                        </table>
                    </div>
                    
                    <!-- Pagination -->
                    <div class="pagination" id="platformsPagination">
                        <!-- Générée via JavaScript -->
                    </div>
                </div>
                
                <!-- Loading overlay -->
                <div class="loading-overlay" id="databasesLoading">
                    <div class="spinner"></div>
                    <span><?= __('common.loading') ?></span>
                </div>
            </div>
            <?php endif; ?>
        </main>
        
        <!-- Footer -->
        <?php include __DIR__ . '/../components/footer.php'; ?>
    </div>
    
    <!-- Modal Edition Utilisateur -->
    <div class="modal" id="userModal">
        <div class="modal-backdrop"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="modalTitle"><?= __('admin.edit_user') ?></h3>
                <button class="modal-close" id="modalClose">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <form id="userForm">
                <input type="hidden" id="userId" name="id">
                <div class="modal-body">
                    <div class="form-group">
                        <label for="userName"><?= __('auth.username') ?></label>
                        <input type="text" id="userName" name="name" required>
                    </div>
                    
                    <div class="form-group">
                        <label for="userEmail"><?= __('auth.email') ?></label>
                        <input type="email" id="userEmail" name="email" required>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="userIsAdmin"><?= __('admin.is_admin') ?></label>
                            <label class="toggle-switch">
                                <input type="checkbox" id="userIsAdmin" name="is_admin">
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                        
                        <div class="form-group">
                            <label for="userIsPremium"><?= __('admin.is_premium') ?></label>
                            <label class="toggle-switch">
                                <input type="checkbox" id="userIsPremium" name="is_premium">
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                        
                        <div class="form-group">
                            <label for="userEmailVerified"><?= __('admin.email_verified') ?></label>
                            <label class="toggle-switch">
                                <input type="checkbox" id="userEmailVerified" name="email_verified">
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                    
                    <div class="form-group" id="passwordGroup" style="display: none;">
                        <label for="userPassword"><?= __('auth.password') ?></label>
                        <input type="password" id="userPassword" name="password" placeholder="<?= __('admin.password_placeholder') ?>">
                        <small class="form-hint"><?= __('admin.password_hint') ?></small>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" id="modalCancel"><?= __('common.cancel') ?></button>
                    <button type="submit" class="btn btn-primary"><?= __('common.save') ?></button>
                </div>
            </form>
        </div>
    </div>
    
    <!-- Modal Confirmation Suppression -->
    <div class="modal" id="deleteModal">
        <div class="modal-backdrop"></div>
        <div class="modal-content modal-small">
            <div class="modal-header">
                <h3><?= __('admin.confirm_delete') ?></h3>
                <button class="modal-close" id="deleteModalClose">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                <p id="deleteMessage"><?= __('admin.delete_user_confirm') ?></p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" id="deleteCancel"><?= __('common.cancel') ?></button>
                <button type="button" class="btn btn-danger" id="deleteConfirm"><?= __('common.delete') ?></button>
            </div>
        </div>
    </div>
    
    <!-- Modal Edition API -->
    <div class="modal" id="apiModal">
        <div class="modal-backdrop"></div>
        <div class="modal-content modal-large">
            <div class="modal-header">
                <h3 id="apiModalTitle"><?= __('admin.edit_api') ?></h3>
                <button class="modal-close" id="apiModalClose">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <form id="apiForm">
                <input type="hidden" id="apiId" name="id">
                <div class="modal-body">
                    <div class="form-row-2">
                        <div class="form-group">
                            <label for="apiName"><?= __('admin.api_name_field') ?> *</label>
                            <input type="text" id="apiName" name="name" required placeholder="google_books">
                            <small class="form-hint"><?= __('admin.api_name_hint') ?></small>
                        </div>
                        
                        <div class="form-group">
                            <label for="apiNameUF"><?= __('admin.api_name_uf') ?> *</label>
                            <input type="text" id="apiNameUF" name="Name_UF" required placeholder="Google Books API">
                        </div>
                    </div>
                    
                    <div class="form-row-2">
                        <div class="form-group">
                            <label for="apiType"><?= __('admin.api_type_field') ?></label>
                            <div class="custom-dropdown" id="apiTypeDropdown">
                                <select id="apiType" name="Type" class="form-select">
                                    <option value="">-- <?= __('admin.select_type') ?> --</option>
                                    <option value="toys"><?= __('web_search.type_toys') ?></option>
                                    <option value="books"><?= __('web_search.type_books') ?></option>
                                    <option value="movies"><?= __('web_search.type_movies') ?></option>
                                    <option value="video_games"><?= __('web_search.type_video_games') ?></option>
                                    <option value="music"><?= __('web_search.type_music') ?></option>
                                    <option value="generic"><?= __('web_search.type_generic') ?></option>
                                </select>
                                <button type="button" class="custom-dropdown-trigger" aria-haspopup="listbox">
                                    <span class="custom-dropdown-icon">📋</span>
                                    <span class="custom-dropdown-text">-- <?= __('admin.select_type') ?> --</span>
                                    <svg class="custom-dropdown-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                </button>
                                <div class="custom-dropdown-menu" role="listbox">
                                    <div class="custom-dropdown-option" data-value="" data-icon="📋">
                                        <span class="custom-dropdown-option-icon">📋</span>
                                        <span class="custom-dropdown-option-text">-- <?= __('admin.select_type') ?> --</span>
                                    </div>
                                    <div class="custom-dropdown-option" data-value="toys" data-icon="🧸">
                                        <span class="custom-dropdown-option-icon">🧸</span>
                                        <span class="custom-dropdown-option-text"><?= __('web_search.type_toys') ?></span>
                                    </div>
                                    <div class="custom-dropdown-option" data-value="books" data-icon="📚">
                                        <span class="custom-dropdown-option-icon">📚</span>
                                        <span class="custom-dropdown-option-text"><?= __('web_search.type_books') ?></span>
                                    </div>
                                    <div class="custom-dropdown-option" data-value="movies" data-icon="🎬">
                                        <span class="custom-dropdown-option-icon">🎬</span>
                                        <span class="custom-dropdown-option-text"><?= __('web_search.type_movies') ?></span>
                                    </div>
                                    <div class="custom-dropdown-option" data-value="video_games" data-icon="🎮">
                                        <span class="custom-dropdown-option-icon">🎮</span>
                                        <span class="custom-dropdown-option-text"><?= __('web_search.type_video_games') ?></span>
                                    </div>
                                    <div class="custom-dropdown-option" data-value="music" data-icon="🎵">
                                        <span class="custom-dropdown-option-icon">🎵</span>
                                        <span class="custom-dropdown-option-text"><?= __('web_search.type_music') ?></span>
                                    </div>
                                    <div class="custom-dropdown-option" data-value="generic" data-icon="🔍">
                                        <span class="custom-dropdown-option-icon">🔍</span>
                                        <span class="custom-dropdown-option-text"><?= __('web_search.type_generic') ?></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="apiClientId"><?= __('admin.api_client_id') ?></label>
                            <input type="text" id="apiClientId" name="client_id" placeholder="client_id_xxx">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="apiKey"><?= __('admin.api_key_field') ?></label>
                        <div class="input-with-toggle">
                            <input type="password" id="apiKey" name="api_key" placeholder="••••••••••••••••">
                            <button type="button" class="toggle-visibility" id="toggleApiKey">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                            </button>
                        </div>
                    </div>
                    
                    <div class="form-row-2">
                        <div class="form-group">
                            <label for="apiMaxPremium"><?= __('admin.api_max_premium') ?></label>
                            <input type="number" id="apiMaxPremium" name="max_results_premium" value="100" min="1">
                        </div>
                        
                        <div class="form-group">
                            <label for="apiMaxFree"><?= __('admin.api_max_free') ?></label>
                            <input type="number" id="apiMaxFree" name="max_results_free" value="10" min="1">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="apiNotes"><?= __('admin.api_notes') ?></label>
                        <textarea id="apiNotes" name="Notes" rows="3" placeholder="<?= __('admin.api_notes_placeholder') ?>"></textarea>
                    </div>
                    
                    <div class="form-row-3">
                        <div class="form-group">
                            <label><?= __('admin.api_default_active') ?></label>
                            <label class="toggle-switch">
                                <input type="checkbox" id="apiDefaultActive" name="Defaut_active" checked>
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                        
                        <div class="form-group">
                            <label><?= __('admin.api_user_api') ?></label>
                            <label class="toggle-switch">
                                <input type="checkbox" id="apiUserApi" name="USER_API">
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                        
                        <div class="form-group">
                            <label><?= __('admin.api_read_code') ?></label>
                            <label class="toggle-switch">
                                <input type="checkbox" id="apiReadCode" name="READ_CODE">
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                        
                        <div class="form-group">
                            <label><?= __('admin.api_has_details') ?></label>
                            <label class="toggle-switch">
                                <input type="checkbox" id="apiHasDetails" name="has_details" checked>
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                        
                        <div class="form-group">
                            <label><?= __('admin.api_client_id_on') ?></label>
                            <label class="toggle-switch">
                                <input type="checkbox" id="apiClientIdOn" name="CLIENT_ID_ON">
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                        
                        <div class="form-group">
                            <label><?= __('admin.api_premium_only') ?></label>
                            <label class="toggle-switch">
                                <input type="checkbox" id="apiPremiumOnly" name="PREMIUM_ONLY">
                                <span class="toggle-slider"></span>
                            </label>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" id="apiModalCancel"><?= __('common.cancel') ?></button>
                    <button type="submit" class="btn btn-primary"><?= __('common.save') ?></button>
                </div>
            </form>
        </div>
    </div>
    
    <!-- Modal Edition Grade -->
    <div class="modal" id="gradeModal">
        <div class="modal-backdrop"></div>
        <div class="modal-content modal-small">
            <div class="modal-header">
                <h3 id="gradeModalTitle"><?= __('admin.edit_grade') ?? 'Modifier le grade' ?></h3>
                <button class="modal-close" id="gradeModalClose">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <form id="gradeForm">
                <input type="hidden" id="gradeId" name="id">
                <div class="modal-body">
                    <div class="form-group">
                        <label for="gradeName"><?= __('admin.grade_name') ?? 'Nom' ?> *</label>
                        <input type="text" id="gradeName" name="name" required maxlength="50" placeholder="Ex: Neuf, Très bon état...">
                    </div>
                    
                    <div class="form-group">
                        <label for="gradeDescription"><?= __('admin.grade_description') ?? 'Description' ?></label>
                        <textarea id="gradeDescription" name="description" rows="3" maxlength="255" placeholder="Description détaillée de l'état..."></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" id="gradeModalCancel"><?= __('common.cancel') ?></button>
                    <button type="submit" class="btn btn-primary"><?= __('common.save') ?></button>
                </div>
            </form>
        </div>
    </div>
    
    <!-- Modal Edition Status -->
    <div class="modal" id="statusModal">
        <div class="modal-backdrop"></div>
        <div class="modal-content modal-small">
            <div class="modal-header">
                <h3 id="statusModalTitle"><?= __('admin.edit_status') ?? 'Modifier le statut' ?></h3>
                <button class="modal-close" id="statusModalClose">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <form id="statusForm">
                <input type="hidden" id="statusId" name="id">
                <div class="modal-body">
                    <div class="form-group">
                        <label for="statusName"><?= __('admin.status_name') ?? 'Nom' ?> *</label>
                        <input type="text" id="statusName" name="name" required maxlength="50">
                    </div>
                    
                    <div class="form-group">
                        <label for="statusDescription"><?= __('admin.status_description') ?? 'Description' ?></label>
                        <textarea id="statusDescription" name="description" rows="2" maxlength="255"></textarea>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="statusIcon"><?= __('admin.icon') ?? 'Icône' ?></label>
                            <input type="text" id="statusIcon" name="icon" placeholder="mdi:tag-outline">
                            <small class="form-hint">Format: mdi:xxx ou emoji</small>
                        </div>
                        <div class="form-group">
                            <label for="statusColor"><?= __('admin.color') ?? 'Couleur' ?></label>
                            <input type="color" id="statusColor" name="color" value="#9b59b6">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label><?= __('admin.preview') ?? 'Aperçu' ?></label>
                        <div id="statusIconPreview" class="icon-preview"></div>
                    </div>
                    
                    <div class="form-group">
                        <label for="statusOrdre"><?= __('admin.display_order') ?? 'Ordre d\'affichage' ?></label>
                        <input type="number" id="statusOrdre" name="ordre" min="0" value="0">
                        <small class="form-hint">Plus petit = affiché en premier</small>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" id="statusModalCancel"><?= __('common.cancel') ?></button>
                    <button type="submit" class="btn btn-primary"><?= __('common.save') ?></button>
                </div>
            </form>
        </div>
    </div>
    
    <!-- Modal Edition Limite -->
    <div class="modal" id="limitModal">
        <div class="modal-backdrop"></div>
        <div class="modal-content modal-small">
            <div class="modal-header">
                <h3 id="limitModalTitle"><?= __('admin.edit_limit') ?></h3>
                <button class="modal-close" id="limitModalClose">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <form id="limitForm">
                <input type="hidden" id="limitId" name="id">
                <div class="modal-body">
                    <div class="form-group">
                        <label for="limitFree"><?= __('admin.limit_free') ?> *</label>
                        <input type="number" id="limitFree" name="free_limit" required min="0">
                        <small class="form-hint"><?= __('admin.limit_free_hint') ?></small>
                    </div>
                    
                    <div class="form-group">
                        <label for="limitPremium"><?= __('admin.limit_premium') ?></label>
                        <input type="number" id="limitPremium" name="premium_limit" min="0">
                        <small class="form-hint"><?= __('admin.limit_premium_hint') ?></small>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" id="limitModalCancel"><?= __('common.cancel') ?></button>
                    <button type="submit" class="btn btn-primary"><?= __('common.save') ?></button>
                </div>
            </form>
        </div>
    </div>
    
    <!-- Modal Edition Configuration Upload -->
    <div class="modal" id="uploadConfigModal">
        <div class="modal-backdrop"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h3 id="uploadConfigModalTitle"><?= __('admin.edit_upload_config') ?></h3>
                <button class="modal-close" id="uploadConfigModalClose">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <form id="uploadConfigForm">
                <input type="hidden" id="uploadConfigId" name="id">
                <div class="modal-body">
                    <div class="form-row-2">
                        <div class="form-group">
                            <label for="uploadCategory"><?= __('admin.upload_category') ?> *</label>
                            <input type="text" id="uploadCategory" name="category" required 
                                   pattern="[a-z_]+" title="<?= __('admin.upload_category_pattern') ?>"
                                   placeholder="ex: images, avatar, videos...">
                            <small class="form-hint"><?= __('admin.upload_category_hint') ?></small>
                        </div>
                        
                        <div class="form-group">
                            <label for="uploadMaxSize"><?= __('admin.upload_max_size') ?> *</label>
                            <div class="input-with-suffix">
                                <input type="number" id="uploadMaxSize" name="max_size_mb" required min="1" max="2048" value="10">
                                <span class="input-suffix">MB</span>
                            </div>
                            <small class="form-hint"><?= __('admin.upload_max_size_hint') ?></small>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="uploadExtensions"><?= __('admin.upload_extensions') ?> *</label>
                        <input type="text" id="uploadExtensions" name="extensions" required
                               placeholder="jpg, png, gif, webp">
                        <small class="form-hint"><?= __('admin.upload_extensions_hint') ?></small>
                    </div>
                    
                    <div class="form-group">
                        <label for="uploadDescription"><?= __('admin.upload_description') ?></label>
                        <input type="text" id="uploadDescription" name="description" 
                               placeholder="<?= __('admin.upload_description_placeholder') ?>">
                    </div>
                    
                    <div class="form-group">
                        <label for="uploadIsActive"><?= __('admin.upload_is_active') ?></label>
                        <label class="toggle-switch">
                            <input type="checkbox" id="uploadIsActive" name="is_active" checked>
                            <span class="toggle-slider"></span>
                        </label>
                        <small class="form-hint"><?= __('admin.upload_is_active_hint') ?></small>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" id="uploadConfigModalCancel"><?= __('common.cancel') ?></button>
                    <button type="submit" class="btn btn-primary"><?= __('common.save') ?></button>
                </div>
            </form>
        </div>
    </div>
    
    <!-- Modal Edition Type Field -->
    <div class="modal" id="typeFieldModal">
        <div class="modal-backdrop"></div>
        <div class="modal-content modal-large">
            <div class="modal-header">
                <h3 id="typeFieldModalTitle"><?= __('admin.edit_type_field') ?? 'Modifier le champ' ?></h3>
                <button class="modal-close" id="typeFieldModalClose">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <form id="typeFieldForm">
                <input type="hidden" id="typeFieldId" name="id">
                <div class="modal-body">
                    <div class="form-row">
                        <div class="form-group">
                            <label><?= __('admin.primary_type') ?? 'Type primaire' ?> *</label>
                            <div class="custom-dropdown" id="typeFieldTypeDropdown">
                                <select id="typeFieldTypeId" name="primary_type_id" class="custom-dropdown-select" required>
                                    <option value="">-- Sélectionner --</option>
                                    <!-- Options chargées dynamiquement -->
                                </select>
                                <button type="button" class="custom-dropdown-trigger">
                                    <span class="custom-dropdown-icon">📋</span>
                                    <span class="custom-dropdown-text">-- Sélectionner --</span>
                                    <svg class="custom-dropdown-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                </button>
                                <div class="custom-dropdown-menu">
                                    <!-- Options chargées dynamiquement -->
                                </div>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="typeFieldKey"><?= __('admin.field_key') ?? 'Clé du champ' ?> *</label>
                            <input type="text" id="typeFieldKey" name="field_key" required maxlength="50" pattern="[a-z_]+" placeholder="ex: publisher">
                            <small class="form-hint">Lettres minuscules et underscores uniquement</small>
                        </div>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="typeFieldType"><?= __('admin.field_type') ?? 'Type de champ' ?> *</label>
                            <div class="custom-dropdown" id="fieldTypeDropdown">
                                <select id="typeFieldType" name="field_type" class="custom-dropdown-select" required>
                                    <option value="text">Texte court</option>
                                    <!-- Options chargées dynamiquement -->
                                </select>
                                <button type="button" class="custom-dropdown-trigger">
                                    <span class="custom-dropdown-icon"><i class="mdi mdi-form-textbox"></i></span>
                                    <span class="custom-dropdown-text">Texte court</span>
                                    <svg class="custom-dropdown-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                </button>
                                <div class="custom-dropdown-menu"></div>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="typeFieldSortOrder"><?= __('admin.display_order') ?? 'Ordre d\'affichage' ?></label>
                            <input type="number" id="typeFieldSortOrder" name="sort_order" min="0" value="0">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="typeFieldLangJson"><?= __('admin.translations_json') ?? 'Traductions (JSON)' ?> *</label>
                        <textarea id="typeFieldLangJson" name="lang_json" class="form-control code-input" rows="6" required>{
  "fr": { "name": "Nom du champ", "placeholder": "Texte indicatif..." },
  "en": { "name": "Field name", "placeholder": "Hint text..." }
}</textarea>
                        <small class="form-hint">
                            La clé <code>name</code> est obligatoire. Exemple : <code>{"fr": {"name": "Mon champ"}, "en": {"name": "My field"}}</code>
                        </small>
                    </div>
                    
                    <div class="form-group" id="typeFieldOptionsGroup" style="display: none;">
                        <label for="typeFieldOptions"><?= __('admin.field_options_json') ?? 'Options (JSON)' ?></label>
                        <textarea id="typeFieldOptions" name="field_options" class="form-control" rows="3" placeholder='{"opt1": "Label 1", "opt2": "Label 2"}'></textarea>
                        <small class="form-hint">Pour les champs select/multiselect uniquement</small>
                    </div>
                    
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="typeFieldRequired" name="is_required">
                            <span><?= __('admin.required') ?? 'Champ obligatoire' ?></span>
                        </label>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" id="typeFieldModalCancel"><?= __('common.cancel') ?></button>
                    <button type="submit" class="btn btn-primary"><?= __('common.save') ?></button>
                </div>
            </form>
        </div>
    </div>
    
    <!-- Modal Edition Field Mapping -->
    <div class="modal" id="fieldMappingModal">
        <div class="modal-backdrop"></div>
        <div class="modal-content modal-large">
            <div class="modal-header">
                <h3 id="fieldMappingModalTitle"><?= __('admin.edit_field_mapping') ?? 'Modifier le mapping' ?></h3>
                <button class="modal-close" id="fieldMappingModalClose">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <form id="fieldMappingForm">
                <input type="hidden" id="fieldMappingId" name="id">
                <div class="modal-body">
                    <div class="form-row">
                        <div class="form-group">
                            <label><?= __('admin.primary_type') ?? 'Type primaire' ?></label>
                            <div class="custom-dropdown" id="fieldMappingTypeDropdown">
                                <select id="fieldMappingTypeId" name="primary_type_id" class="custom-dropdown-select">
                                    <option value="">Global (tous types)</option>
                                    <!-- Options chargées dynamiquement -->
                                </select>
                                <button type="button" class="custom-dropdown-trigger">
                                    <span class="custom-dropdown-icon">🌐</span>
                                    <span class="custom-dropdown-text">Global (tous types)</span>
                                    <svg class="custom-dropdown-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                </button>
                                <div class="custom-dropdown-menu">
                                    <!-- Options chargées dynamiquement -->
                                </div>
                            </div>
                            <small class="form-hint">Laisser vide pour un mapping global</small>
                        </div>
                        <div class="form-group">
                            <label><?= __('admin.target_field') ?? 'Champ cible' ?> *</label>
                            <div class="custom-dropdown" id="fieldMappingFieldDropdown">
                                <select id="fieldMappingFieldId" name="field_id" class="custom-dropdown-select" required>
                                    <option value="">-- Sélectionner --</option>
                                    <!-- Options chargées dynamiquement -->
                                </select>
                                <button type="button" class="custom-dropdown-trigger">
                                    <span class="custom-dropdown-icon">🏷️</span>
                                    <span class="custom-dropdown-text">-- Sélectionner --</span>
                                    <svg class="custom-dropdown-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                </button>
                                <div class="custom-dropdown-menu">
                                    <!-- Options chargées dynamiquement -->
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="fieldMappingApiKeys"><?= __('admin.api_keys') ?? 'Clés API (sources)' ?> *</label>
                        <input type="text" id="fieldMappingApiKeys" name="api_keys" required placeholder="author, authors, creator">
                        <small class="form-hint">Clés séparées par des virgules, en ordre de priorité</small>
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label><?= __('admin.transform') ?? 'Transformation' ?></label>
                            <div class="custom-dropdown" id="fieldMappingTransformDropdown">
                                <select id="fieldMappingTransformType" name="transform_type" class="custom-dropdown-select">
                                    <option value="">Aucune</option>
                                    <!-- Options chargées dynamiquement -->
                                </select>
                                <button type="button" class="custom-dropdown-trigger">
                                    <span class="custom-dropdown-icon">⚙️</span>
                                    <span class="custom-dropdown-text">Aucune</span>
                                    <svg class="custom-dropdown-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="6 9 12 15 18 9"></polyline>
                                    </svg>
                                </button>
                                <div class="custom-dropdown-menu">
                                    <!-- Options chargées dynamiquement -->
                                </div>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="fieldMappingPriority"><?= __('admin.priority') ?? 'Priorité' ?></label>
                            <input type="number" id="fieldMappingPriority" name="priority" min="0" value="0">
                            <small class="form-hint">Plus petit = priorité plus haute</small>
                        </div>
                    </div>
                    
                    <div class="form-group" id="transformConfigGroup" style="display: none;">
                        <label for="fieldMappingTransformConfig"><?= __('admin.transform_config') ?? 'Configuration de transformation' ?></label>
                        <textarea id="fieldMappingTransformConfig" name="transform_config" rows="3" placeholder='{"separator": ", ", "default": ""}'></textarea>
                        <small class="form-hint" id="transformConfigHint">Configuration JSON pour la transformation sélectionnée</small>
                    </div>
                    
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="fieldMappingActive" name="is_active" checked>
                            <span><?= __('common.active') ?? 'Actif' ?></span>
                        </label>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" id="fieldMappingModalCancel"><?= __('common.cancel') ?></button>
                    <button type="submit" class="btn btn-primary"><?= __('common.save') ?></button>
                </div>
            </form>
        </div>
    </div>
    
    <!-- Modal Confirmation Suppression Config -->
    <div class="modal" id="deleteConfigModal">
        <div class="modal-backdrop"></div>
        <div class="modal-content modal-small">
            <div class="modal-header">
                <h3><?= __('admin.confirm_delete') ?></h3>
                <button class="modal-close" id="deleteConfigModalClose">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div class="modal-body">
                <p id="deleteConfigMessage"><?= __('admin.delete_config_confirm') ?></p>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" id="deleteConfigCancel"><?= __('common.cancel') ?></button>
                <button type="button" class="btn btn-danger" id="deleteConfigConfirm"><?= __('common.delete') ?></button>
            </div>
        </div>
    </div>
    
    <!-- Toast Notifications -->
    <div class="toast-container" id="toastContainer"></div>
    
    <!-- Overlay mobile -->
    <div class="sidebar-overlay" id="sidebarOverlay"></div>
    
    <!-- Scripts -->
    <script src="../assets/js/modal-manager.js"></script>
    <script src="../assets/js/dashboard.js"></script>
    <!-- ES6 Modules Admin -->
    <script type="module" src="../assets/js/admin/main.js?v=<?= time() ?>"></script>
</body>
</html>
