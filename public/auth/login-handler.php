<?php
/**
 * SnowShelf - Gestionnaire de connexion
 * Traite les requêtes POST du formulaire de login
 * La connexion se fait uniquement par email
 */

session_start();

// Vérification méthode POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ../login.php');
    exit;
}

// Récupération des données
$email = trim($_POST['email'] ?? '');
$password = $_POST['password'] ?? '';
$remember = isset($_POST['remember']);

// Validation des champs
if (empty($email) || empty($password)) {
    header('Location: ../login.php?error=empty');
    exit;
}

// Validation basique du format email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    header('Location: ../login.php?error=credentials');
    exit;
}

// Chargement de la configuration
require_once __DIR__ . '/../../config/database.php';

try {
    // Connexion à la base de données
    $pdo = getDbConnection();
    
    // Recherche de l'utilisateur par email uniquement
    $stmt = $pdo->prepare("
        SELECT id, name, email, password, is_admin, is_premium, email_verified, theme, lang_pref, avatar_url 
        FROM users 
        WHERE email = :email 
        LIMIT 1
    ");
    $stmt->execute(['email' => $email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    // Vérification de l'utilisateur et du mot de passe
    if (!$user || !password_verify($password, $user['password'])) {
        // Log de tentative échouée (optionnel)
        error_log("Tentative de connexion échouée pour: {$email}");
        
        header('Location: ../login.php?error=credentials');
        exit;
    }
    
    // Vérification que l'email a été vérifié
    if (!$user['email_verified']) {
        error_log("Tentative de connexion avec email non vérifié: {$email}");
        header('Location: ../login.php?error=not_verified');
        exit;
    }
    
    // Connexion réussie - Créer la session avec infos minimales
    $isAdmin = (bool)$user['is_admin'];
    
    $_SESSION['user_id'] = $user['id'];
    $_SESSION['username'] = $user['name'];
    $_SESSION['email'] = $user['email'];
    $_SESSION['is_admin'] = $isAdmin;
    // Admin = automatiquement premium
    $_SESSION['is_premium'] = $isAdmin || (bool)$user['is_premium'];
    $_SESSION['theme'] = $user['theme'] ?? 'dracula';
    $_SESSION['lang_pref'] = $user['lang_pref'] ?? 'fr';
    $_SESSION['avatar_url'] = $user['avatar_url'] ?? null;
    $_SESSION['auto_trad'] = (bool)($user['auto_trad'] ?? false);
    $_SESSION['login_time'] = time();
    
    // Mettre à jour les cookies de préférences
    setcookie('snowshelf_theme', $_SESSION['theme'], time() + 31536000, '/');
    setcookie('snowshelf_lang', $_SESSION['lang_pref'], time() + 31536000, '/');
    
    // Régénérer l'ID de session pour la sécurité
    session_regenerate_id(true);
    
    // Gestion du "Se souvenir de moi"
    if ($remember) {
        // Créer un token sécurisé
        $token = bin2hex(random_bytes(32));
        $expires = time() + (30 * 24 * 60 * 60); // 30 jours
        
        // Sauvegarder le token en base
        $stmt = $pdo->prepare("
            UPDATE users 
            SET remember_token = :token, remember_expires = :expires 
            WHERE id = :id
        ");
        $stmt->execute([
            'token' => hash('sha256', $token),
            'expires' => date('Y-m-d H:i:s', $expires),
            'id' => $user['id']
        ]);
        
        // Créer le cookie
        setcookie('snowshelf_remember', $token, [
            'expires' => $expires,
            'path' => '/',
            'secure' => true,
            'httponly' => true,
            'samesite' => 'Lax'
        ]);
    }
    
    // Mise à jour de la dernière connexion
    $stmt = $pdo->prepare("UPDATE users SET last_login = NOW() WHERE id = :id");
    $stmt->execute(['id' => $user['id']]);
    
    // Redirection vers le dashboard
    header('Location: ../dashboard.php');
    exit;
    
} catch (PDOException $e) {
    // Log de l'erreur
    error_log("Erreur de connexion BDD: " . $e->getMessage());
    
    // Rediriger avec une erreur générique
    header('Location: ../login.php?error=credentials');
    exit;
}
