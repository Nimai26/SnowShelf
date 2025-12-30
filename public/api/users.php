<?php
/**
 * SnowShelf - API Utilisateurs
 * 
 * Endpoints:
 * GET    /api/users.php              - Liste des utilisateurs (admin)
 * GET    /api/users.php?id=X         - Info d'un utilisateur
 * GET    /api/users.php?id=X&fields=a,b,c - Info avec champs spécifiques
 * GET    /api/users.php?me           - Info de l'utilisateur connecté
 * POST   /api/users.php              - Créer un utilisateur (admin)
 * PUT    /api/users.php?id=X         - Modifier un utilisateur
 * DELETE /api/users.php?id=X         - Supprimer un utilisateur
 * 
 * POST   /api/users.php?action=password     - Changer mot de passe
 * POST   /api/users.php?action=preferences  - Mettre à jour préférences (theme, lang)
 */

// Headers CORS et JSON
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Authorization');

// Gérer les requêtes OPTIONS (preflight CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Chargement des dépendances
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../core/ApiAuth.php';
require_once __DIR__ . '/../../core/UserService.php';
require_once __DIR__ . '/../../core/UploadConfig.php';

// Initialisation
try {
    $db = getDbConnection();
    $auth = new ApiAuth($db);
    $userService = new UserService($db);
} catch (Exception $e) {
    sendError(500, 'server_error', 'Erreur serveur');
}

// Authentification
$currentUser = $auth->authenticate();

// Récupérer la méthode HTTP
$method = $_SERVER['REQUEST_METHOD'];

// Récupérer les paramètres
$userId = isset($_GET['id']) ? (int)$_GET['id'] : null;
$action = $_GET['action'] ?? null;
$isMe = isset($_GET['me']);
$fields = isset($_GET['fields']) ? explode(',', $_GET['fields']) : null;

// Router les requêtes
switch ($method) {
    case 'GET':
        handleGet($auth, $userService, $currentUser, $userId, $isMe, $fields);
        break;
        
    case 'POST':
        handlePost($auth, $userService, $currentUser, $action);
        break;
        
    case 'PUT':
        handlePut($auth, $userService, $currentUser, $userId);
        break;
        
    case 'DELETE':
        handleDelete($auth, $userService, $currentUser, $userId);
        break;
        
    default:
        sendError(405, 'method_not_allowed', 'Méthode non autorisée');
}

/**
 * Gère les requêtes GET
 */
function handleGet(ApiAuth $auth, UserService $userService, ?array $currentUser, ?int $userId, bool $isMe, ?array $fields): void
{
    // GET /api/users.php?me - Info utilisateur connecté
    if ($isMe) {
        if (!$currentUser) {
            $auth->sendUnauthorized('Authentification requise');
        }
        
        $user = $userService->getUser($currentUser['id'], $fields);
        sendSuccess($user);
    }
    
    // GET /api/users.php?id=X - Info d'un utilisateur spécifique
    if ($userId !== null) {
        if (!$currentUser) {
            $auth->sendUnauthorized('Authentification requise');
        }
        
        // Un utilisateur ne peut voir que son propre profil (sauf admin)
        if ($userId !== $currentUser['id'] && !$auth->isAdmin()) {
            $auth->sendForbidden('Accès non autorisé');
        }
        
        $user = $userService->getUser($userId, $fields);
        
        if (!$user) {
            sendError(404, 'not_found', 'Utilisateur non trouvé');
        }
        
        sendSuccess($user);
    }
    
    // GET /api/users.php - Liste des utilisateurs (admin uniquement)
    if (!$currentUser) {
        $auth->sendUnauthorized('Authentification requise');
    }
    
    if (!$auth->isAdmin()) {
        $auth->sendForbidden('Réservé aux administrateurs');
    }
    
    $options = [
        'page' => $_GET['page'] ?? 1,
        'limit' => $_GET['limit'] ?? 20,
        'search' => $_GET['search'] ?? null,
        'order_by' => $_GET['order_by'] ?? 'id',
        'order_dir' => $_GET['order_dir'] ?? 'ASC'
    ];
    
    $result = $userService->listUsers($options);
    sendSuccess($result);
}

/**
 * Gère les requêtes POST
 */
function handlePost(ApiAuth $auth, UserService $userService, ?array $currentUser, ?string $action): void
{
    $data = getJsonInput();
    
    // POST /api/users.php?action=password - Changer mot de passe
    if ($action === 'password') {
        if (!$currentUser) {
            $auth->sendUnauthorized('Authentification requise');
        }
        
        if (empty($data['current_password']) || empty($data['new_password'])) {
            sendError(400, 'missing_fields', 'Champs requis: current_password, new_password');
        }
        
        $result = $userService->changePassword(
            $currentUser['id'],
            $data['current_password'],
            $data['new_password']
        );
        
        if ($result['success']) {
            sendSuccess($result);
        } else {
            sendError(400, $result['error'], $result['message']);
        }
    }
    
    // POST /api/users.php?action=preferences - Mettre à jour préférences
    if ($action === 'preferences') {
        if (!$currentUser) {
            $auth->sendUnauthorized('Authentification requise');
        }
        
        // Filtrer uniquement les préférences (theme, lang_pref, auto_trad, use_db)
        $prefs = array_intersect_key($data, array_flip(['theme', 'lang_pref', 'auto_trad', 'use_db']));
        
        // Convertir auto_trad en entier (0 ou 1) pour la BDD
        if (isset($prefs['auto_trad'])) {
            $prefs['auto_trad'] = $prefs['auto_trad'] ? 1 : 0;
        }
        
        // Convertir use_db en entier (0 ou 1) pour la BDD
        if (isset($prefs['use_db'])) {
            $prefs['use_db'] = $prefs['use_db'] ? 1 : 0;
        }
        
        // Note: count() au lieu de empty() car ['auto_trad' => 0] serait considéré vide
        if (count($prefs) === 0) {
            sendError(400, 'no_data', 'Aucune préférence à mettre à jour');
        }
        
        $result = $userService->updateUser($currentUser['id'], $prefs, false);
        
        if ($result['success']) {
            // Mettre à jour la session
            if (isset($prefs['theme'])) {
                $_SESSION['theme'] = $prefs['theme'];
                setcookie('snowshelf_theme', $prefs['theme'], time() + 31536000, '/');
            }
            if (isset($prefs['lang_pref'])) {
                $_SESSION['lang_pref'] = $prefs['lang_pref'];
                setcookie('snowshelf_lang', $prefs['lang_pref'], time() + 31536000, '/');
            }
            if (isset($prefs['auto_trad'])) {
                $_SESSION['auto_trad'] = $prefs['auto_trad'];
            }
            if (isset($prefs['use_db'])) {
                $_SESSION['use_db'] = $prefs['use_db'];
            }
            
            sendSuccess($result);
        } else {
            sendError(400, $result['error'], $result['message']);
        }
    }
    
    // POST /api/users.php?action=upload_background - Upload background utilisateur
    if ($action === 'upload_background') {
        if (!$currentUser) {
            $auth->sendUnauthorized('Authentification requise');
        }
        
        handleBackgroundUpload($currentUser['id'], $userService);
    }
    
    // POST /api/users.php?action=delete_background - Supprimer background utilisateur
    if ($action === 'delete_background') {
        if (!$currentUser) {
            $auth->sendUnauthorized('Authentification requise');
        }
        
        handleBackgroundDelete($currentUser['id'], $userService);
    }
    
    // POST /api/users.php?action=upload_avatar - Upload avatar utilisateur
    if ($action === 'upload_avatar') {
        if (!$currentUser) {
            $auth->sendUnauthorized('Authentification requise');
        }
        
        handleAvatarUpload($currentUser['id'], $userService);
    }
    
    // POST /api/users.php?action=delete_avatar - Supprimer avatar utilisateur
    if ($action === 'delete_avatar') {
        if (!$currentUser) {
            $auth->sendUnauthorized('Authentification requise');
        }
        
        handleAvatarDelete($currentUser['id'], $userService);
    }
    
    // POST /api/users.php?action=verify_password - Vérifier le mot de passe (pour suppression compte)
    if ($action === 'verify_password') {
        if (!$currentUser) {
            $auth->sendUnauthorized('Authentification requise');
        }
        
        if (empty($data['password'])) {
            sendError(400, 'missing_password', 'Mot de passe requis');
        }
        
        $result = $userService->verifyPassword($currentUser['id'], $data['password']);
        
        if ($result) {
            sendSuccess(['verified' => true]);
        } else {
            sendError(400, 'wrong_password', 'Mot de passe incorrect');
        }
    }
    
    // POST /api/users.php - Créer un utilisateur (admin)
    if (!$currentUser) {
        $auth->sendUnauthorized('Authentification requise');
    }
    
    if (!$auth->isAdmin()) {
        $auth->sendForbidden('Réservé aux administrateurs');
    }
    
    $result = $userService->createUser($data);
    
    if ($result['success']) {
        http_response_code(201);
        sendSuccess($result);
    } else {
        sendError(400, $result['error'], $result['message']);
    }
}

/**
 * Gère les requêtes PUT
 */
function handlePut(ApiAuth $auth, UserService $userService, ?array $currentUser, ?int $userId): void
{
    if (!$currentUser) {
        $auth->sendUnauthorized('Authentification requise');
    }
    
    if ($userId === null) {
        sendError(400, 'missing_id', 'ID utilisateur requis');
    }
    
    // Un utilisateur ne peut modifier que son propre profil (sauf admin)
    $isAdmin = $auth->isAdmin();
    if ($userId !== $currentUser['id'] && !$isAdmin) {
        $auth->sendForbidden('Accès non autorisé');
    }
    
    $data = getJsonInput();
    
    if (empty($data)) {
        sendError(400, 'no_data', 'Aucune donnée à mettre à jour');
    }
    
    // Vérifier si l'email change (pour l'utilisateur lui-même)
    $emailChanged = false;
    if ($userId === $currentUser['id'] && isset($data['email']) && $data['email'] !== $currentUser['email']) {
        $emailChanged = true;
    }
    
    $result = $userService->updateUser($userId, $data, $isAdmin);
    
    if ($result['success']) {
        // Mettre à jour la session si c'est l'utilisateur connecté
        if ($userId === $currentUser['id']) {
            // Mettre à jour le nom dans la session
            if (isset($data['name'])) {
                $_SESSION['username'] = $data['name'];
                // Mettre à jour le cookie du nom
                setcookie('snowshelf_username', $data['name'], time() + 31536000, '/');
            }
            
            // Si l'email a changé, marquer pour déconnexion (côté client)
            if ($emailChanged) {
                $result['email_changed'] = true;
            }
        }
        
        sendSuccess($result);
    } else {
        sendError(400, $result['error'], $result['message']);
    }
}

/**
 * Gère les requêtes DELETE
 */
function handleDelete(ApiAuth $auth, UserService $userService, ?array $currentUser, ?int $userId): void
{
    if (!$currentUser) {
        $auth->sendUnauthorized('Authentification requise');
    }
    
    if ($userId === null) {
        sendError(400, 'missing_id', 'ID utilisateur requis');
    }
    
    // Un utilisateur peut supprimer son propre compte, un admin peut supprimer n'importe qui
    if ($userId !== $currentUser['id'] && !$auth->isAdmin()) {
        $auth->sendForbidden('Accès non autorisé');
    }
    
    // Empêcher un admin de se supprimer lui-même
    if ($userId === $currentUser['id'] && $auth->isAdmin()) {
        sendError(400, 'cannot_delete_self', 'Un administrateur ne peut pas supprimer son propre compte');
    }
    
    $result = $userService->deleteUser($userId);
    
    if ($result['success']) {
        sendSuccess($result);
    } else {
        sendError(400, $result['error'], $result['message']);
    }
}

/**
 * Récupère les données JSON de la requête
 */
function getJsonInput(): array
{
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    return is_array($data) ? $data : [];
}

/**
 * Envoie une réponse de succès
 */
function sendSuccess($data): void
{
    echo json_encode([
        'success' => true,
        'data' => $data
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Envoie une réponse d'erreur
 */
function sendError(int $httpCode, string $error, string $message): void
{
    http_response_code($httpCode);
    echo json_encode([
        'success' => false,
        'error' => $error,
        'message' => $message
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Gère l'upload du background utilisateur
 */
function handleBackgroundUpload(int $userId, UserService $userService): void
{
    // Charger la configuration depuis upload_config
    $avatarConfig = UploadConfig::getCategory('avatar');
    $allowedTypes = $avatarConfig ? $avatarConfig['mimes'] : ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    $maxSize = $avatarConfig ? $avatarConfig['maxSize'] : 5 * 1024 * 1024;
    $maxSizeMB = $avatarConfig ? $avatarConfig['maxSizeMB'] : 5;
    
    // Vérifier qu'un fichier a été envoyé
    if (!isset($_FILES['background']) || $_FILES['background']['error'] !== UPLOAD_ERR_OK) {
        $errorMessages = [
            UPLOAD_ERR_INI_SIZE => 'Le fichier dépasse la taille maximale autorisée',
            UPLOAD_ERR_FORM_SIZE => 'Le fichier dépasse la taille maximale du formulaire',
            UPLOAD_ERR_PARTIAL => 'Le fichier n\'a été que partiellement téléchargé',
            UPLOAD_ERR_NO_FILE => 'Aucun fichier n\'a été téléchargé',
            UPLOAD_ERR_NO_TMP_DIR => 'Dossier temporaire manquant',
            UPLOAD_ERR_CANT_WRITE => 'Échec de l\'écriture du fichier',
        ];
        $error = $_FILES['background']['error'] ?? UPLOAD_ERR_NO_FILE;
        sendError(400, 'upload_error', $errorMessages[$error] ?? 'Erreur d\'upload');
    }
    
    $file = $_FILES['background'];
    
    // Vérifier le type MIME (depuis upload_config)
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mimeType = $finfo->file($file['tmp_name']);
    
    if (!in_array($mimeType, $allowedTypes)) {
        $extensions = UploadConfig::getExtensions('avatar');
        $extList = strtoupper(implode(', ', $extensions));
        sendError(400, 'invalid_type', "Type de fichier non autorisé. Formats acceptés: {$extList}");
    }
    
    // Vérifier la taille (depuis upload_config)
    if ($file['size'] > $maxSize) {
        sendError(400, 'file_too_large', "Le fichier est trop volumineux (max {$maxSizeMB} Mo)");
    }
    
    // Déterminer l'extension
    $extensions = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/gif' => 'gif',
        'image/webp' => 'webp'
    ];
    $ext = $extensions[$mimeType];
    
    // Créer le dossier utilisateur si nécessaire
    $userDir = __DIR__ . '/../assets/images/users/' . $userId;
    if (!is_dir($userDir)) {
        mkdir($userDir, 0755, true);
    }
    
    // Nom du fichier
    $filename = 'background.' . $ext;
    $filepath = $userDir . '/' . $filename;
    
    // Supprimer les anciens backgrounds de l'utilisateur
    $existingFiles = glob($userDir . '/background.*');
    foreach ($existingFiles as $existingFile) {
        unlink($existingFile);
    }
    
    // Déplacer le fichier
    if (!move_uploaded_file($file['tmp_name'], $filepath)) {
        sendError(500, 'move_failed', 'Erreur lors du déplacement du fichier');
    }
    
    // Mettre à jour la base de données
    $relativePath = 'assets/images/users/' . $userId . '/' . $filename;
    $result = $userService->updateUser($userId, ['background' => $relativePath], false);
    
    if ($result['success']) {
        // Mettre à jour la session
        $_SESSION['background'] = $relativePath;
        
        sendSuccess([
            'message' => 'Image uploadée avec succès',
            'path' => $relativePath,
            'url' => '/' . $relativePath
        ]);
    } else {
        sendError(500, 'update_failed', 'Erreur lors de la mise à jour du profil');
    }
}

/**
 * Supprime le background d'un utilisateur
 */
function handleBackgroundDelete(int $userId, UserService $userService): void
{
    // Supprimer les fichiers
    $userDir = __DIR__ . '/../assets/images/users/' . $userId;
    $existingFiles = glob($userDir . '/background.*');
    foreach ($existingFiles as $existingFile) {
        unlink($existingFile);
    }
    
    // Mettre à jour la base de données
    $result = $userService->updateUser($userId, ['background' => null], false);
    
    if ($result['success']) {
        // Mettre à jour la session
        unset($_SESSION['background']);
        
        sendSuccess(['message' => 'Image supprimée avec succès']);
    } else {
        sendError(500, 'update_failed', 'Erreur lors de la mise à jour du profil');
    }
}

/**
 * Gère l'upload d'un avatar
 */
function handleAvatarUpload(int $userId, UserService $userService): void
{
    if (!isset($_FILES['avatar']) || $_FILES['avatar']['error'] !== UPLOAD_ERR_OK) {
        $errorCode = $_FILES['avatar']['error'] ?? UPLOAD_ERR_NO_FILE;
        $errorMessages = [
            UPLOAD_ERR_INI_SIZE => 'Le fichier dépasse la taille maximale autorisée par PHP',
            UPLOAD_ERR_FORM_SIZE => 'Le fichier dépasse la taille maximale autorisée par le formulaire',
            UPLOAD_ERR_PARTIAL => 'Le fichier n\'a été que partiellement uploadé',
            UPLOAD_ERR_NO_FILE => 'Aucun fichier n\'a été uploadé',
            UPLOAD_ERR_NO_TMP_DIR => 'Dossier temporaire manquant',
            UPLOAD_ERR_CANT_WRITE => 'Échec de l\'écriture du fichier sur le disque',
            UPLOAD_ERR_EXTENSION => 'Une extension PHP a arrêté l\'upload du fichier'
        ];
        sendError(400, 'upload_error', $errorMessages[$errorCode] ?? 'Erreur lors de l\'upload');
    }
    
    // Charger la configuration depuis upload_config
    $avatarConfig = UploadConfig::getCategory('avatar');
    $allowedTypes = $avatarConfig ? $avatarConfig['mimes'] : ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    $maxSize = $avatarConfig ? $avatarConfig['maxSize'] : 5 * 1024 * 1024;
    $maxSizeMB = $avatarConfig ? $avatarConfig['maxSizeMB'] : 5;
    
    $file = $_FILES['avatar'];
    
    // Vérifier la taille (depuis upload_config)
    if ($file['size'] > $maxSize) {
        sendError(400, 'file_too_large', "Le fichier est trop volumineux (max {$maxSizeMB}MB)");
    }
    
    // Vérifier le type MIME (depuis upload_config)
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mimeType = $finfo->file($file['tmp_name']);
    
    if (!in_array($mimeType, $allowedTypes)) {
        $extensions = UploadConfig::getExtensions('avatar');
        $extList = strtoupper(implode(', ', $extensions));
        sendError(400, 'invalid_type', "Type de fichier non autorisé. Formats acceptés: {$extList}");
    }
    
    // Déterminer l'extension
    $extensions = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/gif' => 'gif',
        'image/webp' => 'webp'
    ];
    $extension = $extensions[$mimeType];
    
    // Créer le répertoire utilisateur si nécessaire
    $userDir = __DIR__ . '/../assets/images/users/' . $userId;
    if (!is_dir($userDir)) {
        mkdir($userDir, 0755, true);
    }
    
    // Supprimer l'ancien avatar s'il existe
    $existingFiles = glob($userDir . '/avatar.*');
    foreach ($existingFiles as $existingFile) {
        unlink($existingFile);
    }
    
    // Sauvegarder le nouveau fichier
    $filename = 'avatar.' . $extension;
    $destination = $userDir . '/' . $filename;
    
    if (!move_uploaded_file($file['tmp_name'], $destination)) {
        sendError(500, 'save_failed', 'Erreur lors de la sauvegarde du fichier');
    }
    
    // Chemin relatif pour la base de données
    $relativePath = 'assets/images/users/' . $userId . '/' . $filename;
    
    // Mettre à jour la base de données
    $result = $userService->updateUser($userId, ['avatar_url' => $relativePath], false);
    
    if ($result['success']) {
        // Mettre à jour la session
        $_SESSION['avatar_url'] = $relativePath;
        
        sendSuccess([
            'message' => 'Avatar uploadé avec succès',
            'path' => $relativePath,
            'url' => '/' . $relativePath
        ]);
    } else {
        sendError(500, 'update_failed', 'Erreur lors de la mise à jour du profil');
    }
}

/**
 * Supprime l'avatar d'un utilisateur
 */
function handleAvatarDelete(int $userId, UserService $userService): void
{
    // Supprimer les fichiers
    $userDir = __DIR__ . '/../assets/images/users/' . $userId;
    $existingFiles = glob($userDir . '/avatar.*');
    foreach ($existingFiles as $existingFile) {
        unlink($existingFile);
    }
    
    // Mettre à jour la base de données
    $result = $userService->updateUser($userId, ['avatar_url' => null], false);
    
    if ($result['success']) {
        // Mettre à jour la session
        unset($_SESSION['avatar_url']);
        
        sendSuccess(['message' => 'Avatar supprimé avec succès']);
    } else {
        sendError(500, 'update_failed', 'Erreur lors de la mise à jour du profil');
    }
}
