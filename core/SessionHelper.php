<?php
/**
 * SnowShelf - Helper de Session
 * 
 * Fonctions utilitaires pour la gestion des sessions et authentification
 * À inclure dans les pages qui nécessitent une authentification
 */

/**
 * Démarre la session si pas déjà fait
 */
function ensureSession(): void
{
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
}

/**
 * Vérifie si l'utilisateur est connecté
 */
function isLoggedIn(): bool
{
    ensureSession();
    return isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);
}

/**
 * Vérifie si l'utilisateur est admin
 */
function isAdmin(): bool
{
    ensureSession();
    return isset($_SESSION['is_admin']) && $_SESSION['is_admin'] === true;
}

/**
 * Vérifie si l'utilisateur est premium
 * Note : Les administrateurs sont automatiquement considérés comme premium
 */
function isPremium(): bool
{
    ensureSession();
    // Admin = automatiquement premium
    if (isset($_SESSION['is_admin']) && $_SESSION['is_admin'] === true) {
        return true;
    }
    return isset($_SESSION['is_premium']) && $_SESSION['is_premium'] === true;
}

/**
 * Récupère l'ID de l'utilisateur connecté
 */
function getUserId(): ?int
{
    ensureSession();
    return $_SESSION['user_id'] ?? null;
}

/**
 * Récupère le nom d'utilisateur
 */
function getUsername(): ?string
{
    ensureSession();
    return $_SESSION['username'] ?? null;
}

/**
 * Récupère le thème de l'utilisateur
 */
function getUserTheme(): string
{
    ensureSession();
    // Priorité : session > cookie > défaut
    return $_SESSION['theme'] ?? $_COOKIE['snowshelf_theme'] ?? 'dracula';
}

/**
 * Récupère la langue préférée de l'utilisateur
 */
function getUserLang(): string
{
    ensureSession();
    // Priorité : session > cookie > défaut
    return $_SESSION['lang_pref'] ?? $_COOKIE['snowshelf_lang'] ?? 'fr';
}

/**
 * Récupère toutes les infos de session utilisateur
 */
function getSessionUser(): ?array
{
    ensureSession();
    
    if (!isLoggedIn()) {
        return null;
    }
    
    $isAdmin = $_SESSION['is_admin'] ?? false;
    
    return [
        'id' => $_SESSION['user_id'],
        'username' => $_SESSION['username'] ?? null,
        'email' => $_SESSION['email'] ?? null,
        'is_admin' => $isAdmin,
        // Admin = automatiquement premium
        'is_premium' => $isAdmin || ($_SESSION['is_premium'] ?? false),
        'theme' => getUserTheme(),
        'lang_pref' => getUserLang(),
    ];
}

/**
 * Exige que l'utilisateur soit connecté, sinon redirige
 * 
 * @param string $redirectTo URL de redirection si non connecté
 */
function requireLogin(string $redirectTo = '/login.php'): void
{
    if (!isLoggedIn()) {
        header('Location: ' . $redirectTo);
        exit;
    }
}

/**
 * Exige que l'utilisateur soit admin, sinon redirige
 * 
 * @param string $redirectTo URL de redirection si non admin
 */
function requireAdmin(string $redirectTo = '/dashboard.php'): void
{
    requireLogin();
    
    if (!isAdmin()) {
        header('Location: ' . $redirectTo);
        exit;
    }
}

/**
 * Exige que l'utilisateur soit premium, sinon redirige
 * 
 * @param string $redirectTo URL de redirection si non premium
 */
function requirePremium(string $redirectTo = '/upgrade.php'): void
{
    requireLogin();
    
    if (!isPremium()) {
        header('Location: ' . $redirectTo);
        exit;
    }
}

/**
 * Déconnecte l'utilisateur
 */
function logout(): void
{
    ensureSession();
    
    // Supprimer toutes les variables de session
    $_SESSION = [];
    
    // Supprimer le cookie de session
    if (isset($_COOKIE[session_name()])) {
        setcookie(session_name(), '', time() - 3600, '/');
    }
    
    // Supprimer le cookie remember
    if (isset($_COOKIE['snowshelf_remember'])) {
        setcookie('snowshelf_remember', '', time() - 3600, '/');
    }
    
    // Détruire la session
    session_destroy();
}

/**
 * Met à jour les infos de session (après modification via API)
 * 
 * @param array $updates Données à mettre à jour
 */
function updateSession(array $updates): void
{
    ensureSession();
    
    $allowedKeys = ['username', 'email', 'is_admin', 'is_premium', 'theme', 'lang_pref', 'avatar_url'];
    
    foreach ($updates as $key => $value) {
        if (in_array($key, $allowedKeys)) {
            $_SESSION[$key] = $value;
            
            // Mettre à jour les cookies pour theme et lang
            if ($key === 'theme') {
                setcookie('snowshelf_theme', $value, time() + 31536000, '/');
            }
            if ($key === 'lang_pref') {
                setcookie('snowshelf_lang', $value, time() + 31536000, '/');
            }
        }
    }
}
