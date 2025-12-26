<?php
/**
 * SnowShelf - Vérification d'email
 * Valide le token d'email et active le compte
 */

session_start();

// Chargement des dépendances
require_once __DIR__ . '/../core/i18n.php';
require_once __DIR__ . '/../config/database.php';

// Récupération du thème (par défaut: dracula)
$theme = $_COOKIE['snowshelf_theme'] ?? 'dracula';
$lang = getLang();

// Récupérer le token
$token = $_GET['token'] ?? '';

// Logs pour debug
error_log("[VerifyEmail] Token reçu: " . substr($token, 0, 20) . "... (longueur: " . strlen($token) . ")");

// État de la vérification
$success = false;
$error = '';
$alreadyVerified = false;
$username = '';

if (empty($token)) {
    $error = 'invalid';
} else {
    try {
        $db = getDbConnection();
        
        // Chercher l'utilisateur avec ce token
        $stmt = $db->prepare('
            SELECT id, name, email, email_verified, email_token 
            FROM users 
            WHERE email_token = ?
        ');
        $stmt->execute([$token]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            // Token non trouvé - peut-être déjà utilisé ?
            // On ne peut pas savoir quel utilisateur car le token a été effacé
            error_log("[VerifyEmail] Token non trouvé en base - probablement déjà utilisé");
            $error = 'invalid';
            
            // On suppose que si le token n'existe plus, c'est qu'il a été consommé
            // Donc le compte est probablement déjà vérifié
            $alreadyVerified = true;
        } elseif ($user['email_verified'] == 1) {
            $error = 'already_verified';
            $alreadyVerified = true;
            $username = $user['name'];
        } else {
            // Valider l'email
            $stmt = $db->prepare('
                UPDATE users 
                SET email_verified = 1, 
                    email_token = NULL, 
                    updated_at = NOW() 
                WHERE id = ?
            ');
            $stmt->execute([$user['id']]);
            
            $success = true;
            $username = $user['name'];
            error_log("[VerifyEmail] Email vérifié avec succès pour: " . $user['email']);
        }
        
    } catch (PDOException $e) {
        error_log('Erreur vérification email: ' . $e->getMessage());
        $error = 'generic';
    }
}
?>
<!DOCTYPE html>
<html lang="<?= htmlspecialchars($lang) ?>" data-theme="<?= htmlspecialchars($theme) ?>">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="<?= __('common.app_name') ?> - <?= __('verify_email.title') ?>">
    <title><?= __('common.app_name') ?> - <?= __('verify_email.title') ?></title>
    
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
    
    <style>
        .verify-result {
            background: var(--card-bg, rgba(30, 30, 30, 0.7));
            backdrop-filter: blur(20px) saturate(180%);
            -webkit-backdrop-filter: blur(20px) saturate(180%);
            border-radius: var(--border-radius, 12px);
            padding: 2.5rem 2rem;
            text-align: center;
            border: 1px solid rgba(255, 255, 255, 0.15);
            box-shadow: 
                0 8px 32px rgba(0, 0, 0, 0.4),
                inset 0 0 0 1px rgba(255, 255, 255, 0.1);
            animation: slideUp 0.4s ease;
        }
        
        .verify-icon {
            margin-bottom: 1rem;
        }
        
        .verify-icon.success {
            color: var(--success-color, #2ecc71);
        }
        
        .verify-icon.error {
            color: var(--error-color, #e74c3c);
        }
        
        .verify-icon.warning {
            color: var(--warning-color, #f39c12);
        }
        
        .verify-icon svg {
            animation: scaleIn 0.5s ease;
        }
        
        .verify-result h2 {
            margin: 0 0 1rem;
            font-size: 1.5rem;
            color: var(--text-heading, #fff);
        }
        
        .verify-result p {
            margin: 0 0 1.5rem;
            color: var(--text, #ddd);
            line-height: 1.6;
        }
        
        .verify-result .btn-login {
            display: inline-block;
            text-decoration: none;
            text-align: center;
        }
        
        @keyframes slideUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes scaleIn {
            from { transform: scale(0); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }
        
        /* Centrer le conteneur sur les pages sans hero */
        .verify-page {
            justify-content: center !important;
        }
        
        .verify-page .login-container {
            margin-right: 0 !important;
        }
    </style>
</head>
<body class="login-page verify-page">
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
        
        <div class="verify-result">
            <?php if ($success): ?>
            <!-- Succès -->
            <div class="verify-icon success">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
            </div>
            <h2><?= __('verify_email.success_title') ?></h2>
            <p><?= __('verify_email.success_message') ?></p>
            <a href="login.php?success=verified" class="btn-login"><?= __('verify_email.login_button') ?></a>
            
            <?php elseif ($alreadyVerified): ?>
            <!-- Déjà vérifié / Lien déjà utilisé - Message positif -->
            <div class="verify-icon success">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
            </div>
            <h2><?= __('verify_email.success_title') ?></h2>
            <p><?= __('verify_email.error_already_verified') ?></p>
            <a href="login.php" class="btn-login"><?= __('verify_email.login_button') ?></a>
            
            <?php else: ?>
            <!-- Erreur réelle (token vide ou invalide) -->
            <div class="verify-icon error">
                <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
            </div>
            <h2><?= __('verify_email.error_title') ?></h2>
            <p><?= __('verify_email.error_message') ?></p>
            <a href="login.php" class="btn-login"><?= __('auth.login') ?></a>
            <?php endif; ?>
        </div>
        
        <!-- Sélecteur de langue -->
        <div class="language-selector">
            <?= renderLangSelector('lang-select') ?>
        </div>
    </main>
    
    <!-- Script pour le sélecteur de langue -->
    <script>
        document.getElementById('lang-select')?.addEventListener('change', function() {
            const expires = new Date();
            expires.setFullYear(expires.getFullYear() + 1);
            document.cookie = `snowshelf_lang=${this.value}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
            window.location.reload();
        });
    </script>
</body>
</html>
