<?php
/**
 * SnowShelf - Gestionnaire d'inscription
 * Traite le formulaire d'inscription et envoie l'email de confirmation
 */

session_start();

// Chargement des dépendances
require_once __DIR__ . '/../../core/i18n.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../core/Mailer.php';

// Vérifier que la requête est POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ../register.php');
    exit;
}

// Récupérer les données du formulaire
$username = trim($_POST['username'] ?? '');
$email = trim($_POST['email'] ?? '');
$password = $_POST['password'] ?? '';
$passwordConfirm = $_POST['password_confirm'] ?? '';
$terms = isset($_POST['terms']);

// Fonction pour rediriger avec erreur
function redirectWithError(string $error, string $field = '', string $username = '', string $email = ''): void
{
    $params = ['error' => $error];
    if ($field) $params['field'] = $field;
    if ($username) $params['username'] = $username;
    if ($email) $params['email'] = $email;
    
    header('Location: ../register.php?' . http_build_query($params));
    exit;
}

// ============================================
// VALIDATION DES DONNÉES
// ============================================

// Champs vides
if (empty($username) || empty($email) || empty($password) || empty($passwordConfirm)) {
    redirectWithError('empty', '', $username, $email);
}

// Conditions d'utilisation non acceptées
if (!$terms) {
    redirectWithError('terms', 'terms', $username, $email);
}

// Format du nom d'utilisateur (3-50 caractères, alphanumériques + tirets/underscores)
if (strlen($username) < 3 || strlen($username) > 50) {
    redirectWithError('username_length', 'username', '', $email);
}

if (!preg_match('/^[a-zA-Z0-9_-]+$/', $username)) {
    redirectWithError('username_format', 'username', '', $email);
}

// Format de l'email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    redirectWithError('email_invalid', 'email', $username, '');
}

// Force du mot de passe
if (strlen($password) < 8) {
    redirectWithError('password_weak', 'password', $username, $email);
}

if (!preg_match('/[0-9]/', $password)) {
    redirectWithError('password_weak', 'password', $username, $email);
}

if (!preg_match('/[^a-zA-Z0-9]/', $password)) {
    redirectWithError('password_weak', 'password', $username, $email);
}

// Confirmation du mot de passe
if ($password !== $passwordConfirm) {
    redirectWithError('password_mismatch', 'password_confirm', $username, $email);
}

// ============================================
// VÉRIFICATION EN BASE DE DONNÉES
// ============================================

try {
    $db = getDbConnection();
    
    // Vérifier si l'email existe déjà
    $stmt = $db->prepare('SELECT id FROM users WHERE email = ?');
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        redirectWithError('email_taken', 'email', $username, '');
    }
    
    // Vérifier si le nom d'utilisateur existe déjà
    $stmt = $db->prepare('SELECT id FROM users WHERE name = ?');
    $stmt->execute([$username]);
    if ($stmt->fetch()) {
        redirectWithError('username_taken', 'username', '', $email);
    }
    
    // ============================================
    // CRÉATION DE L'UTILISATEUR
    // ============================================
    
    // Générer le hash du mot de passe (bcrypt)
    $passwordHash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
    
    // Générer le token de vérification d'email
    $emailToken = bin2hex(random_bytes(32));
    
    // Insérer l'utilisateur
    $stmt = $db->prepare('
        INSERT INTO users (name, email, password, email_verified, email_token, created_at, updated_at)
        VALUES (?, ?, ?, 0, ?, NOW(), NOW())
    ');
    
    $stmt->execute([
        $username,
        $email,
        $passwordHash,
        $emailToken
    ]);
    
    $userId = $db->lastInsertId();
    
    // ============================================
    // ENVOI DE L'EMAIL DE CONFIRMATION
    // ============================================
    
    // Récupérer la langue actuelle
    $lang = getLang();
    
    // Créer l'instance du mailer
    $mailer = new Mailer($lang);
    
    // Envoyer l'email de vérification
    $emailSent = $mailer->sendVerificationEmail($email, $username, $emailToken);
    
    if (!$emailSent) {
        // Log l'erreur mais ne pas bloquer l'inscription
        error_log("Échec de l'envoi de l'email de vérification pour: {$email}");
    }
    
    // ============================================
    // REDIRECTION VERS LE SUCCÈS
    // ============================================
    
    header('Location: ../register.php?success=1');
    exit;
    
} catch (PDOException $e) {
    error_log('Erreur inscription PDO: ' . $e->getMessage() . ' | Code: ' . $e->getCode());
    redirectWithError('generic', '', $username, $email);
} catch (Exception $e) {
    error_log('Erreur inscription: ' . $e->getMessage());
    redirectWithError('generic', '', $username, $email);
}
