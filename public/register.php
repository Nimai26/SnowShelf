<?php
/**
 * SnowShelf - Page d'inscription
 * Formulaire de création de compte avec validation
 */

session_start();

// Chargement du système i18n
require_once __DIR__ . '/../core/i18n.php';

// Récupération du thème (par défaut: dracula)
$theme = $_COOKIE['snowshelf_theme'] ?? 'dracula';

// Récupération de la langue actuelle
$lang = getLang();

// Gestion des messages (succès/erreur)
$success = isset($_GET['success']);
$error = '';
$errorField = '';

if (isset($_GET['error'])) {
    switch ($_GET['error']) {
        case 'empty':
            $error = __('errors.empty_fields');
            break;
        case 'email_invalid':
            $error = __('errors.email_invalid');
            break;
        case 'email_taken':
            $error = __('errors.email_taken');
            break;
        case 'username_taken':
            $error = __('errors.username_taken');
            break;
        case 'password_weak':
            $error = __('errors.password_weak');
            break;
        case 'password_mismatch':
            $error = __('errors.password_mismatch');
            break;
        case 'mail_error':
            $error = __('errors.generic');
            break;
        default:
            $error = __('errors.generic');
    }
    $errorField = $_GET['field'] ?? '';
}

// Récupérer les valeurs précédentes (en cas d'erreur)
$oldUsername = htmlspecialchars($_GET['username'] ?? '');
$oldEmail = htmlspecialchars($_GET['email'] ?? '');
?>
<!DOCTYPE html>
<html lang="<?= htmlspecialchars($lang) ?>" data-theme="<?= htmlspecialchars($theme) ?>">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="<?= __('common.app_name') ?> - <?= __('register.title') ?>">
    <title><?= __('common.app_name') ?> - <?= __('register.title') ?></title>
    
    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="assets/images/favicon.ico">
    <link rel="icon" type="image/png" sizes="64x64" href="assets/images/favicon.png">
    <link rel="icon" type="image/png" sizes="32x32" href="assets/images/favicon-32.png">
    <link rel="icon" type="image/png" sizes="16x16" href="assets/images/favicon-16.png">
    <link rel="apple-touch-icon" href="assets/images/favicon.png">
    
    <!-- Styles -->
    <link rel="stylesheet" href="themes/themes.css?v=1.0">
    <link rel="stylesheet" href="assets/css/login.css?v=1.0">
    <link rel="stylesheet" href="assets/css/register.css?v=1.0">
    
    <!-- Préchargement de l'image de fond -->
    <link rel="preload" as="image" href="assets/images/backgrounds/login-bg.jpg">
</head>
<body class="login-page register-page">
    <!-- Fond d'écran avec overlay -->
    <div class="login-background">
        <div class="login-overlay"></div>
    </div>
    
    <!-- Conteneur principal -->
    <main class="login-container register-container">
        <!-- Logo -->
        <div class="login-logo">
            <img src="assets/images/logo.png" alt="<?= __('common.app_name') ?> Logo">
        </div>
        
        <?php if ($success): ?>
        <!-- Message de succès -->
        <div class="register-success">
            <div class="success-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
            </div>
            <h2><?= __('register.success_title') ?></h2>
            <p><?= __('register.success_message') ?></p>
            <p class="check-spam"><?= __('register.check_spam') ?></p>
            <a href="login.php" class="btn-login"><?= __('auth.login') ?></a>
        </div>
        
        <?php else: ?>
        <!-- Formulaire d'inscription -->
        <form class="login-form register-form" action="auth/register-handler.php" method="POST" autocomplete="on" id="register-form" novalidate>
            <h2 class="form-title"><?= __('register.title') ?></h2>
            <p class="form-subtitle"><?= __('register.subtitle') ?></p>
            
            <!-- Message d'erreur global -->
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
            
            <!-- Champ nom d'utilisateur -->
            <div class="form-group <?= $errorField === 'username' ? 'has-error' : '' ?>">
                <input 
                    type="text" 
                    id="username" 
                    name="username" 
                    placeholder="<?= __('register.username_placeholder') ?>"
                    autocomplete="username"
                    minlength="3"
                    maxlength="50"
                    pattern="[a-zA-Z0-9_\-]+"
                    value="<?= $oldUsername ?>"
                    required
                >
                <label for="username"><?= __('auth.username') ?></label>
                <span class="field-error" id="username-error"></span>
            </div>
            
            <!-- Champ email -->
            <div class="form-group <?= $errorField === 'email' ? 'has-error' : '' ?>">
                <input 
                    type="email" 
                    id="email" 
                    name="email" 
                    placeholder="<?= __('register.email_placeholder') ?>"
                    autocomplete="email"
                    value="<?= $oldEmail ?>"
                    required
                >
                <label for="email"><?= __('auth.email') ?></label>
                <span class="field-error" id="email-error"></span>
            </div>
            
            <!-- Champ mot de passe -->
            <div class="form-group">
                <input 
                    type="password" 
                    id="password" 
                    name="password" 
                    placeholder="<?= __('register.password_placeholder') ?>"
                    autocomplete="new-password"
                    minlength="8"
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
                <span class="field-error" id="password-error"></span>
            </div>
            
            <!-- Indicateur de force du mot de passe -->
            <div class="password-strength" id="password-strength">
                <div class="strength-bar">
                    <div class="strength-fill" id="strength-fill"></div>
                </div>
                <span class="strength-text" id="strength-text"><?= __('register.password_requirements') ?></span>
            </div>
            
            <!-- Champ confirmation mot de passe -->
            <div class="form-group">
                <input 
                    type="password" 
                    id="password_confirm" 
                    name="password_confirm" 
                    placeholder="<?= __('register.password_confirm_placeholder') ?>"
                    autocomplete="new-password"
                    required
                >
                <label for="password_confirm"><?= __('auth.password_confirm') ?></label>
                <button type="button" class="password-toggle" aria-label="<?= __('auth.password_confirm') ?>">
                    <svg class="eye-open" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    <svg class="eye-closed hidden" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                </button>
                <span class="field-error" id="password-confirm-error"></span>
            </div>
            
            <!-- Checkbox conditions d'utilisation -->
            <div class="form-group-checkbox terms-checkbox">
                <label class="checkbox-container">
                    <input type="checkbox" name="terms" id="terms" required>
                    <span class="checkmark"></span>
                    <span class="checkbox-label">
                        <?= __('register.terms_agree') ?> 
                        <a href="terms.php" target="_blank"><?= __('register.terms_link') ?></a>
                        <?= __('register.privacy_and') ?>
                        <a href="privacy.php" target="_blank"><?= __('register.privacy_link') ?></a>
                    </span>
                </label>
                <span class="field-error" id="terms-error"></span>
            </div>
            
            <!-- Bouton d'inscription -->
            <button type="submit" class="btn-login btn-register" id="submit-btn">
                <span class="btn-text"><?= __('register.submit_button') ?></span>
                <span class="btn-loading hidden">
                    <svg class="spinner" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="3" stroke-dasharray="30 70" stroke-linecap="round"/>
                    </svg>
                </span>
            </button>
            
            <!-- Lien vers connexion -->
            <div class="login-register">
                <span><?= __('register.already_account') ?></span>
                <a href="login.php"><?= __('register.login_link') ?></a>
            </div>
        </form>
        <?php endif; ?>
        
        <!-- Sélecteur de langue -->
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
    <script src="assets/js/register.js"></script>
    
    <!-- Traductions pour JavaScript -->
    <script>
        window.translations = {
            required: <?= json_encode(__('validation.required')) ?>,
            email_format: <?= json_encode(__('validation.email_format')) ?>,
            password_min_length: <?= json_encode(__('validation.password_min_length', ['min' => 8])) ?>,
            password_needs_number: <?= json_encode(__('validation.password_needs_number')) ?>,
            password_needs_special: <?= json_encode(__('validation.password_needs_special')) ?>,
            password_match: <?= json_encode(__('validation.password_match')) ?>,
            username_min_length: <?= json_encode(__('validation.username_min_length', ['min' => 3])) ?>,
            username_max_length: <?= json_encode(__('validation.username_max_length', ['max' => 50])) ?>,
            username_format: <?= json_encode(__('validation.username_format')) ?>,
            terms_required: <?= json_encode(__('validation.terms_required')) ?>,
            strength_weak: <?= json_encode($lang === 'fr' ? 'Faible' : 'Weak') ?>,
            strength_medium: <?= json_encode($lang === 'fr' ? 'Moyen' : 'Medium') ?>,
            strength_strong: <?= json_encode($lang === 'fr' ? 'Fort' : 'Strong') ?>,
            strength_very_strong: <?= json_encode($lang === 'fr' ? 'Très fort' : 'Very strong') ?>,
        };
    </script>
</body>
</html>
