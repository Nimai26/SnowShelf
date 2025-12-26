<?php
/**
 * SnowShelf - Page de connexion
 * Interface de login avec support multi-thèmes et i18n
 */

session_start();

// Chargement du système i18n
require_once __DIR__ . '/../core/i18n.php';

// Récupération du thème (par défaut: dracula)
$theme = $_COOKIE['snowshelf_theme'] ?? 'dracula';

// Récupération de la langue actuelle via i18n
$lang = getLang();

// Gestion des erreurs
$error = '';
$success = '';

if (isset($_GET['error'])) {
    switch ($_GET['error']) {
        case 'credentials':
            $error = __('errors.credentials');
            break;
        case 'empty':
            $error = __('errors.empty_fields');
            break;
        case 'not_verified':
            $error = __('errors.email_not_verified');
            break;
    }
}

if (isset($_GET['success'])) {
    switch ($_GET['success']) {
        case 'verified':
            $success = __('success.email_verified');
            break;
    }
}

// Messages de déconnexion avec raison
if (isset($_GET['logout'])) {
    $success = __('success.logout');
}
if (isset($_GET['email_changed'])) {
    $success = __('success.email_changed');
}
if (isset($_GET['password_changed'])) {
    $success = __('success.password_changed');
}
if (isset($_GET['account_deleted'])) {
    $success = __('success.account_deleted');
}
?>
<!DOCTYPE html>
<html lang="<?= htmlspecialchars($lang) ?>" data-theme="<?= htmlspecialchars($theme) ?>">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="<?= __('common.app_name') ?> - <?= __('nav.collections') ?>">
    <title><?= __('common.app_name') ?> - <?= __('auth.login') ?></title>
    
    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="assets/images/favicon.ico">
    <link rel="icon" type="image/png" sizes="64x64" href="assets/images/favicon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="assets/images/favicon-32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="assets/images/favicon-16.png">
    <link rel="apple-touch-icon" href="assets/images/favicon.png">
    
    <!-- Styles -->
    <link rel="stylesheet" href="themes/themes.css?v=1.0">
    <link rel="stylesheet" href="assets/css/login.css?v=1.0">
    
    <!-- Préchargement de l'image de fond -->
    <link rel="preload" as="image" href="assets/images/backgrounds/login-bg.jpg">
</head>
<body class="login-page">
    <!-- Fond d'écran avec overlay -->
    <div class="login-background">
        <div class="login-overlay"></div>
    </div>
    
    <!-- Conteneur principal -->
    <main class="login-container">
        <!-- Logo -->
        <div class="login-logo">
            <img src="assets/images/logo.png" alt="<?= __('common.app_name') ?> Logo">
        </div>
        
        <!-- Formulaire de connexion -->
        <form class="login-form" action="auth/login-handler.php" method="POST" autocomplete="on">
            <!-- Message de succès -->
            <?php if ($success): ?>
            <div class="login-success">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <span><?= htmlspecialchars($success) ?></span>
            </div>
            <?php endif; ?>
            
            <!-- Message d'erreur -->
            <?php if ($error): ?>
            <div class="login-error">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span><?= htmlspecialchars($error) ?></span>
            </div>
            <?php endif; ?>
            
            <!-- Champ email -->
            <div class="form-group">
                <input 
                    type="email" 
                    id="email" 
                    name="email" 
                    placeholder="<?= __('auth.email') ?>"
                    autocomplete="email"
                    required
                >
                <label for="email"><?= __('auth.email') ?></label>
            </div>
            
            <!-- Champ mot de passe -->
            <div class="form-group">
                <input 
                    type="password" 
                    id="password" 
                    name="password" 
                    placeholder="<?= __('auth.password') ?>"
                    autocomplete="current-password"
                    required
                >
                <label for="password"><?= __('auth.password') ?></label>
                <button type="button" class="password-toggle" aria-label="<?= __('auth.password') ?>">
                    <svg class="eye-open" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    <svg class="eye-closed hidden" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                </button>
            </div>
            
            <!-- Se souvenir de moi -->
            <div class="form-group-checkbox">
                <label class="checkbox-container">
                    <input type="checkbox" name="remember" id="remember">
                    <span class="checkmark"></span>
                    <span class="checkbox-label"><?= __('auth.remember_me') ?></span>
                </label>
            </div>
            
            <!-- Bouton de connexion -->
            <button type="submit" class="btn-login">
                <?= __('auth.login') ?>
            </button>
            
            <!-- Liens supplémentaires -->
            <div class="login-links">
                <a href="forgot-password.php" class="forgot-link"><?= __('auth.forgot_password') ?></a>
            </div>
            
            <div class="login-register">
                <span><?= __('auth.no_account') ?></span>
                <a href="register.php"><?= __('auth.register') ?></a>
            </div>
        </form>
        
        <!-- Sélecteur de langue (généré automatiquement) -->
        <div class="language-selector">
            <?= renderLangSelector('lang-select') ?>
        </div>
    </main>
    
    <!-- Section d'accroche -->
    <aside class="hero-section">
        <div class="hero-content">
            <h1 class="hero-tagline"><?= __('landing.tagline') ?></h1>
            <p class="hero-subtitle"><?= __('landing.subtitle') ?></p>
            
            <div class="hero-features">
                <div class="hero-feature">
                    <div class="feature-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                        </svg>
                    </div>
                    <div class="feature-text">
                        <strong><?= __('landing.feature_catalog') ?></strong>
                        <span><?= __('landing.feature_catalog_desc') ?></span>
                    </div>
                </div>
                
                <div class="hero-feature">
                    <div class="feature-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="20" x2="18" y2="10"></line>
                            <line x1="12" y1="20" x2="12" y2="4"></line>
                            <line x1="6" y1="20" x2="6" y2="14"></line>
                        </svg>
                    </div>
                    <div class="feature-text">
                        <strong><?= __('landing.feature_track') ?></strong>
                        <span><?= __('landing.feature_track_desc') ?></span>
                    </div>
                </div>
                
                <div class="hero-feature">
                    <div class="feature-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="3" y1="9" x2="21" y2="9"></line>
                            <line x1="9" y1="21" x2="9" y2="9"></line>
                        </svg>
                    </div>
                    <div class="feature-text">
                        <strong><?= __('landing.feature_scan') ?></strong>
                        <span><?= __('landing.feature_scan_desc') ?></span>
                    </div>
                </div>
                
                <div class="hero-feature">
                    <div class="feature-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                        </svg>
                    </div>
                    <div class="feature-text">
                        <strong><?= __('landing.feature_share') ?></strong>
                        <span><?= __('landing.feature_share_desc') ?></span>
                    </div>
                </div>
            </div>
        </div>
    </aside>
    
    <!-- Footer -->
    <?php include __DIR__ . '/components/footer.php'; ?>
    
    <!-- Scripts -->
    <script src="assets/js/login.js"></script>
</body>
</html>
