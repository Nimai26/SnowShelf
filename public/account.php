<?php
/**
 * SnowShelf - Gestion du Compte Utilisateur
 * Page de paramètres personnels : profil, sécurité, apparence
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
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../core/UserService.php';

// Récupérer la configuration effective (avec fallback sur les défauts admin)
$siteConfig = SiteConfig::getInstance();
$effective = $siteConfig->getEffectiveConfig($_SESSION['user_id']);
$theme = $effective['theme'];
$backgroundUrl = $effective['background_url'];

// Récupérer les informations complètes de l'utilisateur
$db = getDbConnection();
$userService = new UserService($db);
$userFields = ['id', 'name', 'email', 'avatar_url', 'is_admin', 'is_premium', 'premium_until', 
               'created_at', 'newsletter', 'Visi_collec', 'Desc_Collec', 'show_mail', 'theme', 'lang_pref', 'background'];
$user = $userService->getUser($_SESSION['user_id'], $userFields);

if (!$user) {
    // Utilisateur introuvable, déconnecter
    session_destroy();
    header('Location: login.php');
    exit;
}

// Variables pour la page
$username = $_SESSION['username'] ?? $user['name'];
$isAdmin = $_SESSION['is_admin'] ?? false;
$isPremium = $_SESSION['is_premium'] ?? $isAdmin;

// Section active (profil par défaut)
$section = $_GET['section'] ?? 'profile';
$validSections = ['profile', 'security', 'appearance', 'privacy'];
if (!in_array($section, $validSections)) {
    $section = 'profile';
}

// Récupérer les thèmes disponibles
$availableThemes = $siteConfig->getAvailableThemes();
?>
<!DOCTYPE html>
<html lang="<?= $currentLang ?>" data-theme="<?= htmlspecialchars($theme) ?>">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= __('common.app_name') ?> - <?= __('account.title') ?></title>
    
    <!-- Favicon -->
    <link rel="icon" type="image/png" href="assets/images/favicon.png">
    
    <!-- Thèmes CSS -->
    <link rel="stylesheet" href="themes/themes.css">
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
                <li class="nav-item">
                    <a href="dashboard.php" class="nav-link" title="<?= __('dashboard.home') ?>">
                        <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                            <polyline points="9 22 9 12 15 12 15 22"></polyline>
                        </svg>
                        <span class="nav-text"><?= __('dashboard.home') ?></span>
                    </a>
                </li>
                
                <li class="nav-item">
                    <a href="collection.php" class="nav-link" title="<?= __('dashboard.my_collection') ?>">
                        <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                        </svg>
                        <span class="nav-text"><?= __('dashboard.my_collection') ?></span>
                    </a>
                </li>
                
                <li class="nav-item">
                    <a href="scan.php" class="nav-link" title="<?= __('dashboard.scan') ?>">
                        <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M3 7V5a2 2 0 0 1 2-2h2"></path>
                            <path d="M17 3h2a2 2 0 0 1 2 2v2"></path>
                            <path d="M21 17v2a2 2 0 0 1-2 2h-2"></path>
                            <path d="M7 21H5a2 2 0 0 1-2-2v-2"></path>
                            <line x1="7" y1="12" x2="17" y2="12"></line>
                        </svg>
                        <span class="nav-text"><?= __('dashboard.scan') ?></span>
                    </a>
                </li>
                
                <li class="nav-item">
                    <a href="wishlist.php" class="nav-link" title="<?= __('dashboard.wishlist') ?>">
                        <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                        <span class="nav-text"><?= __('dashboard.wishlist') ?></span>
                    </a>
                </li>
                
                <li class="nav-divider"></li>
                
                <li class="nav-item">
                    <a href="explore.php" class="nav-link" title="<?= __('dashboard.explore') ?>">
                        <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
                        </svg>
                        <span class="nav-text"><?= __('dashboard.explore') ?></span>
                    </a>
                </li>
                
                <li class="nav-item">
                    <a href="community.php" class="nav-link" title="<?= __('dashboard.community') ?>">
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
                    <a href="stats.php" class="nav-link" title="<?= __('dashboard.stats') ?>">
                        <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="20" x2="18" y2="10"></line>
                            <line x1="12" y1="20" x2="12" y2="4"></line>
                            <line x1="6" y1="20" x2="6" y2="14"></line>
                        </svg>
                        <span class="nav-text"><?= __('dashboard.stats') ?></span>
                    </a>
                </li>
                
                <li class="nav-divider"></li>
                
                <li class="nav-item active">
                    <a href="account.php" class="nav-link" title="<?= __('account.title') ?>">
                        <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                        <span class="nav-text"><?= __('account.title') ?></span>
                    </a>
                </li>
                
                <?php if ($isAdmin): ?>
                <li class="nav-item">
                    <a href="admin/" class="nav-link" title="<?= __('dashboard.admin') ?>">
                        <svg class="nav-icon" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="3"></circle>
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                        </svg>
                        <span class="nav-text"><?= __('dashboard.admin') ?></span>
                    </a>
                </li>
                <?php endif; ?>
            </ul>
        </nav>
        
        <!-- User info en bas -->
        <div class="sidebar-footer">
            <div class="sidebar-user">
                <div class="user-avatar">
                    <?php if (!empty($user['avatar_url'])): ?>
                        <img src="<?= htmlspecialchars($user['avatar_url']) ?>" alt="Avatar">
                    <?php else: ?>
                        <span class="avatar-initials"><?= strtoupper(substr($username, 0, 1)) ?></span>
                    <?php endif; ?>
                </div>
                <div class="user-info">
                    <span class="user-name"><?= htmlspecialchars($username) ?></span>
                    <span class="user-role">
                        <?php if ($isAdmin): ?>
                            <?= __('dashboard.role_admin') ?>
                        <?php elseif ($isPremium): ?>
                            <?= __('dashboard.role_premium') ?>
                        <?php else: ?>
                            <?= __('dashboard.role_member') ?>
                        <?php endif; ?>
                    </span>
                </div>
            </div>
            <a href="auth/logout.php" class="sidebar-logout" title="<?= __('dashboard.logout') ?>">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
            </a>
        </div>
        
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
                <button class="mobile-menu-toggle" id="mobileMenuToggle">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="3" y1="12" x2="21" y2="12"></line>
                        <line x1="3" y1="6" x2="21" y2="6"></line>
                        <line x1="3" y1="18" x2="21" y2="18"></line>
                    </svg>
                </button>
                <div class="header-title">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <span><?= __('account.title') ?></span>
                </div>
            </div>
            
            <div class="header-right">
                <?= renderLangSelector('lang-selector') ?>
            </div>
        </header>
        
        <!-- Contenu de la page -->
        <div class="page-content">
            <!-- Navigation par onglets -->
            <div class="account-tabs">
                <a href="?section=profile" class="account-tab <?= $section === 'profile' ? 'active' : '' ?>">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    <span><?= __('account.tab_profile') ?></span>
                </a>
                <a href="?section=security" class="account-tab <?= $section === 'security' ? 'active' : '' ?>">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                    <span><?= __('account.tab_security') ?></span>
                </a>
                <a href="?section=appearance" class="account-tab <?= $section === 'appearance' ? 'active' : '' ?>">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <circle cx="12" cy="12" r="4"></circle>
                        <line x1="21.17" y1="8" x2="12" y2="8"></line>
                        <line x1="3.95" y1="6.06" x2="8.54" y2="14"></line>
                        <line x1="10.88" y1="21.94" x2="15.46" y2="14"></line>
                    </svg>
                    <span><?= __('account.tab_appearance') ?></span>
                </a>
                <a href="?section=privacy" class="account-tab <?= $section === 'privacy' ? 'active' : '' ?>">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    <span><?= __('account.tab_privacy') ?></span>
                </a>
            </div>
            
            <!-- Section Profil -->
            <?php if ($section === 'profile'): ?>
            <div class="account-section" id="section-profile">
                <div class="section-header">
                    <div class="section-title">
                        <h2><?= __('account.profile_title') ?></h2>
                        <p class="section-subtitle"><?= __('account.profile_subtitle') ?></p>
                    </div>
                </div>
                
                <div class="account-card">
                    <!-- Avatar Section -->
                    <div class="avatar-section">
                        <div class="avatar-container">
                            <div class="avatar-large" id="avatarPreview">
                                <?php if (!empty($user['avatar_url'])): ?>
                                    <img src="<?= htmlspecialchars($user['avatar_url']) ?>" alt="Avatar" id="avatarImg">
                                <?php else: ?>
                                    <span class="avatar-initials-large" id="avatarInitials"><?= strtoupper(substr($username, 0, 2)) ?></span>
                                <?php endif; ?>
                            </div>
                            <div class="avatar-actions">
                                <input type="file" id="avatarFile" accept="image/*" style="display: none;">
                                <button type="button" class="btn btn-secondary btn-sm" id="changeAvatarBtn">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                        <polyline points="17 8 12 3 7 8"></polyline>
                                        <line x1="12" y1="3" x2="12" y2="15"></line>
                                    </svg>
                                    <?= __('account.change_avatar') ?>
                                </button>
                                <?php if (!empty($user['avatar_url'])): ?>
                                <button type="button" class="btn btn-danger btn-sm" id="removeAvatarBtn">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                        <polyline points="3 6 5 6 21 6"></polyline>
                                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                    </svg>
                                    <?= __('common.delete') ?>
                                </button>
                                <?php endif; ?>
                            </div>
                        </div>
                        <p class="avatar-hint"><?= __('account.avatar_hint') ?></p>
                    </div>
                    
                    <!-- Profile Form -->
                    <form id="profileForm" class="account-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="userName"><?= __('auth.username') ?></label>
                                <input type="text" id="userName" name="name" value="<?= htmlspecialchars($user['name']) ?>" 
                                       minlength="3" maxlength="50" required>
                                <small class="form-hint"><?= __('account.username_hint') ?></small>
                            </div>
                            
                            <div class="form-group">
                                <label for="userEmail"><?= __('auth.email') ?></label>
                                <input type="email" id="userEmail" name="email" value="<?= htmlspecialchars($user['email']) ?>" required>
                                <small class="form-hint"><?= __('account.email_hint') ?></small>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="userDesc"><?= __('account.bio') ?></label>
                            <textarea id="userDesc" name="Desc_Collec" rows="3" maxlength="500" 
                                      placeholder="<?= __('account.bio_placeholder') ?>"><?= htmlspecialchars($user['Desc_Collec'] ?? '') ?></textarea>
                            <small class="form-hint"><?= __('account.bio_hint') ?></small>
                        </div>
                        
                        <div class="form-group checkbox-group">
                            <label class="checkbox-label">
                                <input type="checkbox" name="newsletter" value="1" <?= ($user['newsletter'] ?? 0) ? 'checked' : '' ?>>
                                <span class="checkbox-custom"></span>
                                <?= __('account.newsletter') ?>
                            </label>
                            <small class="form-hint"><?= __('account.newsletter_hint') ?></small>
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
                
                <!-- Infos compte -->
                <div class="account-card account-info">
                    <h3><?= __('account.account_info') ?></h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label"><?= __('account.member_since') ?></span>
                            <span class="info-value"><?= date('d/m/Y', strtotime($user['created_at'])) ?></span>
                        </div>
                        <div class="info-item">
                            <span class="info-label"><?= __('account.account_type') ?></span>
                            <span class="info-value">
                                <?php if ($isAdmin): ?>
                                    <span class="badge badge-admin"><?= __('dashboard.role_admin') ?></span>
                                <?php elseif ($isPremium): ?>
                                    <span class="badge badge-premium"><?= __('dashboard.role_premium') ?></span>
                                <?php else: ?>
                                    <span class="badge badge-member"><?= __('dashboard.role_member') ?></span>
                                <?php endif; ?>
                            </span>
                        </div>
                        <?php if ($isPremium && !$isAdmin && !empty($user['premium_until'])): ?>
                        <div class="info-item">
                            <span class="info-label"><?= __('account.premium_until') ?></span>
                            <span class="info-value"><?= date('d/m/Y', strtotime($user['premium_until'])) ?></span>
                        </div>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
            <?php endif; ?>
            
            <!-- Section Sécurité -->
            <?php if ($section === 'security'): ?>
            <div class="account-section" id="section-security">
                <div class="section-header">
                    <div class="section-title">
                        <h2><?= __('account.security_title') ?></h2>
                        <p class="section-subtitle"><?= __('account.security_subtitle') ?></p>
                    </div>
                </div>
                
                <div class="account-card">
                    <h3><?= __('account.change_password') ?></h3>
                    <form id="passwordForm" class="account-form">
                        <div class="form-group">
                            <label for="currentPassword"><?= __('account.current_password') ?></label>
                            <div class="password-input-wrapper">
                                <input type="password" id="currentPassword" name="current_password" required autocomplete="current-password">
                                <button type="button" class="toggle-password" data-target="currentPassword">
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
                        </div>
                        
                        <div class="form-group">
                            <label for="newPassword"><?= __('account.new_password') ?></label>
                            <div class="password-input-wrapper">
                                <input type="password" id="newPassword" name="new_password" required autocomplete="new-password"
                                       minlength="8" pattern="^(?=.*[0-9])(?=.*[^a-zA-Z0-9]).{8,}$">
                                <button type="button" class="toggle-password" data-target="newPassword">
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
                            <small class="form-hint"><?= __('account.password_requirements') ?></small>
                            
                            <!-- Password strength indicator -->
                            <div class="password-strength" id="passwordStrength">
                                <div class="strength-bar">
                                    <div class="strength-fill" id="strengthFill"></div>
                                </div>
                                <span class="strength-text" id="strengthText"></span>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="confirmPassword"><?= __('account.confirm_password') ?></label>
                            <div class="password-input-wrapper">
                                <input type="password" id="confirmPassword" name="confirm_password" required autocomplete="new-password">
                                <button type="button" class="toggle-password" data-target="confirmPassword">
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
                            <small class="form-hint" id="passwordMatch"></small>
                        </div>
                        
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary" id="changePasswordBtn">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                                </svg>
                                <?= __('account.update_password') ?>
                            </button>
                        </div>
                    </form>
                </div>
                
                <!-- Zone dangereuse -->
                <div class="account-card danger-zone">
                    <h3><?= __('account.danger_zone') ?></h3>
                    <p class="danger-warning"><?= __('account.danger_warning') ?></p>
                    
                    <div class="danger-actions">
                        <button type="button" class="btn btn-danger" id="deleteAccountBtn">
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                <line x1="14" y1="11" x2="14" y2="17"></line>
                            </svg>
                            <?= __('account.delete_account') ?>
                        </button>
                    </div>
                </div>
            </div>
            <?php endif; ?>
            
            <!-- Section Apparence -->
            <?php if ($section === 'appearance'): ?>
            <div class="account-section" id="section-appearance">
                <div class="section-header">
                    <div class="section-title">
                        <h2><?= __('account.appearance_title') ?></h2>
                        <p class="section-subtitle"><?= __('account.appearance_subtitle') ?></p>
                    </div>
                </div>
                
                <div class="account-card">
                    <form id="appearanceForm" class="account-form">
                        <!-- Thème -->
                        <div class="form-group">
                            <label for="userTheme"><?= __('common.theme') ?></label>
                            <select id="userTheme" name="theme">
                                <?php foreach ($availableThemes as $themeKey => $themeInfo): ?>
                                    <option value="<?= htmlspecialchars($themeKey) ?>" <?= ($user['theme'] ?? 'dark') === $themeKey ? 'selected' : '' ?>>
                                        <?= $themeInfo['icon'] ?> <?= htmlspecialchars($themeInfo['name']) ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                            <small class="form-hint"><?= __('account.theme_hint') ?></small>
                        </div>
                        
                        <!-- Langue -->
                        <div class="form-group">
                            <label for="userLang"><?= __('common.language') ?></label>
                            <select id="userLang" name="lang_pref">
                                <option value="fr" <?= ($user['lang_pref'] ?? 'fr') === 'fr' ? 'selected' : '' ?>>🇫🇷 Français</option>
                                <option value="en" <?= ($user['lang_pref'] ?? 'fr') === 'en' ? 'selected' : '' ?>>🇬🇧 English</option>
                            </select>
                            <small class="form-hint"><?= __('account.lang_hint') ?></small>
                        </div>
                        
                        <!-- Image de fond -->
                        <div class="form-group">
                            <label><?= __('account.background') ?></label>
                            <div class="background-upload-container">
                                <div class="background-preview" id="backgroundPreview">
                                    <?php if (!empty($user['background'])): ?>
                                        <img src="<?= htmlspecialchars($user['background']) ?>" alt="Background" id="backgroundPreviewImg">
                                    <?php else: ?>
                                        <div class="background-placeholder" id="backgroundPlaceholder">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                                <polyline points="21 15 16 10 5 21"></polyline>
                                            </svg>
                                            <span><?= __('account.no_background') ?></span>
                                        </div>
                                    <?php endif; ?>
                                </div>
                                <div class="background-actions">
                                    <input type="file" id="backgroundFile" accept="image/*" style="display: none;">
                                    <button type="button" class="btn btn-secondary" id="selectBackgroundBtn">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                            <polyline points="17 8 12 3 7 8"></polyline>
                                            <line x1="12" y1="3" x2="12" y2="15"></line>
                                        </svg>
                                        <?= __('account.select_image') ?>
                                    </button>
                                    <button type="button" class="btn btn-danger" id="removeBackgroundBtn" <?= empty($user['background']) ? 'style="display:none;"' : '' ?>>
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <polyline points="3 6 5 6 21 6"></polyline>
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                        </svg>
                                        <?= __('common.delete') ?>
                                    </button>
                                </div>
                            </div>
                            <small class="form-hint"><?= __('account.background_hint') ?></small>
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
            <?php endif; ?>
            
            <!-- Section Confidentialité -->
            <?php if ($section === 'privacy'): ?>
            <div class="account-section" id="section-privacy">
                <div class="section-header">
                    <div class="section-title">
                        <h2><?= __('account.privacy_title') ?></h2>
                        <p class="section-subtitle"><?= __('account.privacy_subtitle') ?></p>
                    </div>
                </div>
                
                <div class="account-card">
                    <form id="privacyForm" class="account-form">
                        <!-- Visibilité collection -->
                        <div class="form-group">
                            <label for="visiCollec"><?= __('account.collection_visibility') ?></label>
                            <select id="visiCollec" name="Visi_collec">
                                <option value="0" <?= ($user['Visi_collec'] ?? 0) == 0 ? 'selected' : '' ?>><?= __('account.visibility_private') ?></option>
                                <option value="1" <?= ($user['Visi_collec'] ?? 0) == 1 ? 'selected' : '' ?>><?= __('account.visibility_friends') ?></option>
                                <option value="2" <?= ($user['Visi_collec'] ?? 0) == 2 ? 'selected' : '' ?>><?= __('account.visibility_public') ?></option>
                            </select>
                            <small class="form-hint"><?= __('account.visibility_hint') ?></small>
                        </div>
                        
                        <!-- Afficher email -->
                        <div class="form-group checkbox-group">
                            <label class="checkbox-label">
                                <input type="checkbox" name="show_mail" value="1" <?= ($user['show_mail'] ?? 0) ? 'checked' : '' ?>>
                                <span class="checkbox-custom"></span>
                                <?= __('account.show_email') ?>
                            </label>
                            <small class="form-hint"><?= __('account.show_email_hint') ?></small>
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
            <?php endif; ?>
        </div>
    </div>
    
    <!-- Modal de confirmation suppression compte -->
    <div class="modal" id="deleteAccountModal">
        <div class="modal-backdrop"></div>
        <div class="modal-container modal-danger">
            <div class="modal-header">
                <h3><?= __('account.delete_account_title') ?></h3>
                <button type="button" class="modal-close" id="deleteModalClose">&times;</button>
            </div>
            <div class="modal-body">
                <div class="danger-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                        <line x1="12" y1="9" x2="12" y2="13"></line>
                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                    </svg>
                </div>
                <p><?= __('account.delete_account_warning') ?></p>
                <div class="form-group">
                    <label for="deleteConfirmPassword"><?= __('account.enter_password_confirm') ?></label>
                    <input type="password" id="deleteConfirmPassword" placeholder="<?= __('auth.password') ?>">
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" id="deleteModalCancel"><?= __('common.cancel') ?></button>
                <button type="button" class="btn btn-danger" id="deleteModalConfirm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    <?= __('account.confirm_delete') ?>
                </button>
            </div>
        </div>
    </div>
    
    </div>
    
    <!-- Toast container -->
    <div class="toast-container" id="toastContainer"></div>
    
    <!-- JavaScript -->
    <script src="assets/js/dashboard.js"></script>
    <script src="assets/js/account.js"></script>
</body>
</html>
