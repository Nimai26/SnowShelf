<?php
/**
 * SnowShelf - Déconnexion
 * Détruit la session et redirige vers la page de login
 */

session_start();

// Supprimer le cookie remember si présent
if (isset($_COOKIE['snowshelf_remember'])) {
    // Invalider le token en base
    if (isset($_SESSION['user_id'])) {
        require_once __DIR__ . '/../../config/database.php';
        try {
            $pdo = getDbConnection();
            $stmt = $pdo->prepare("UPDATE users SET remember_token = NULL, remember_expires = NULL WHERE id = :id");
            $stmt->execute(['id' => $_SESSION['user_id']]);
        } catch (Exception $e) {
            // Ignorer les erreurs de DB lors de la déconnexion
        }
    }
    
    // Supprimer le cookie
    setcookie('snowshelf_remember', '', [
        'expires' => time() - 3600,
        'path' => '/',
        'secure' => true,
        'httponly' => true,
        'samesite' => 'Lax'
    ]);
}

// Détruire toutes les variables de session
$_SESSION = [];

// Détruire le cookie de session
if (isset($_COOKIE[session_name()])) {
    setcookie(session_name(), '', time() - 3600, '/');
}

// Détruire la session
session_destroy();

// Vérifier s'il y a une raison spécifique de déconnexion
$reason = $_GET['reason'] ?? '';
$redirectParam = 'logout=1';

switch ($reason) {
    case 'email_changed':
        $redirectParam = 'email_changed=1';
        break;
    case 'password_changed':
        $redirectParam = 'password_changed=1';
        break;
    case 'account_deleted':
        $redirectParam = 'account_deleted=1';
        break;
}

// Rediriger vers la page de connexion
header('Location: ../login.php?' . $redirectParam);
exit;
