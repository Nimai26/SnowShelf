<?php
/**
 * API Médias de Catégories
 * 
 * Gère les opérations CRUD sur les médias associés aux catégories
 * (images, vidéos, audio, documents)
 * 
 * @author SnowShelf
 * @version 1.0.0
 */

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../core/ApiAuth.php';
require_once __DIR__ . '/../../core/SecureUpload.php';
require_once __DIR__ . '/../../core/i18n.php';

// Headers API
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

// Tables de médias par type
const MEDIA_TABLES = [
    'images' => 'category_img',
    'videos' => 'category_videos',
    'audio' => 'category_audio',
    'documents' => 'category_doc'
];

// Catégories d'upload correspondantes
const UPLOAD_CATEGORIES = [
    'images' => 'images',
    'videos' => 'videos',
    'audio' => 'audio',
    'documents' => 'documents'
];

// Méthode HTTP
$method = $_SERVER['REQUEST_METHOD'];

try {
    $db = getDbConnection();
    
    // Authentification requise
    $auth = new ApiAuth($db);
    $authResult = $auth->authenticate();
    
    if (!$auth->isAuthenticated()) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'unauthorized', 'message' => 'Non authentifié']);
        exit;
    }
    
    $userId = $auth->getUserId();
    $isAdmin = $auth->isAdmin();
    $isPremium = $auth->isPremium();
    
    switch ($method) {
        case 'GET':
            handleGet($db, $userId, $isAdmin);
            break;
        case 'POST':
            handlePost($db, $userId, $isAdmin, $isPremium);
            break;
        case 'PUT':
            handlePut($db, $userId, $isAdmin);
            break;
        case 'DELETE':
            handleDelete($db, $userId, $isAdmin);
            break;
        default:
            sendError(405, 'method_not_allowed', 'Méthode non autorisée');
    }
} catch (PDOException $e) {
    error_log("Category Media API Error: " . $e->getMessage());
    sendError(500, 'database_error', 'Erreur de base de données');
}

/**
 * GET - Liste les médias d'une catégorie
 */
function handleGet(PDO $db, int $userId, bool $isAdmin): void
{
    $entityType = $_GET['entity_type'] ?? 'category';
    $entityId = isset($_GET['entity_id']) ? (int)$_GET['entity_id'] : null;
    $mediaType = $_GET['media_type'] ?? 'images';
    $isDefault = isset($_GET['is_default']) && $_GET['is_default'] === '1';
    
    if (!$entityId) {
        sendError(400, 'missing_param', 'entity_id requis');
    }
    
    if (!isset(MEDIA_TABLES[$mediaType])) {
        sendError(400, 'invalid_type', 'Type de média invalide');
    }
    
    // Vérifier l'accès à la catégorie
    if (!canAccessCategory($db, $entityId, $userId, $isAdmin, $isDefault)) {
        sendError(403, 'forbidden', 'Accès non autorisé à cette catégorie');
    }
    
    $table = MEDIA_TABLES[$mediaType];
    
    // Colonnes selon le type de table
    // Les tables utilisent: url, title, ordre (pas path, filename, order)
    $thumbnailCol = ($mediaType === 'videos') ? ', thumbnail_url' : '';
    
    $stmt = $db->prepare("
        SELECT id, title, url, ordre, created_at {$thumbnailCol}
        FROM {$table}
        WHERE category_id = ?
        ORDER BY ordre ASC, id ASC
    ");
    $stmt->execute([$entityId]);
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Mapper vers le format attendu par le frontend
    $files = [];
    foreach ($rows as $row) {
        $file = [
            'id' => $row['id'],
            'filename' => $row['title'],
            'path' => '/storage' . $row['url'],
            'thumbnailPath' => '/storage' . ($row['thumbnail_url'] ?? $row['url']),
            'order' => $row['ordre'],
            'created_at' => $row['created_at']
        ];
        $files[] = $file;
    }
    
    sendSuccess($files);
}

/**
 * POST - Upload ou finalise un média
 */
function handlePost(PDO $db, int $userId, bool $isAdmin, bool $isPremium): void
{
    // Récupérer les paramètres (JSON ou multipart)
    $isJson = strpos($_SERVER['CONTENT_TYPE'] ?? '', 'application/json') !== false;
    
    if ($isJson) {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
    } else {
        $data = $_POST;
    }
    
    $action = $data['action'] ?? 'upload';
    $entityType = $data['entity_type'] ?? 'category';
    $entityId = isset($data['entity_id']) ? (int)$data['entity_id'] : null;
    $mediaType = $data['media_type'] ?? 'images';
    $isDefault = isset($data['is_default']) && ($data['is_default'] === '1' || $data['is_default'] === true);
    
    // Seul l'admin peut modifier les catégories par défaut
    if ($isDefault && !$isAdmin) {
        sendError(403, 'forbidden', 'Seuls les administrateurs peuvent modifier les catégories par défaut');
    }
    
    // Vérifier que l'utilisateur peut créer/modifier des catégories (Premium ou Admin)
    if (!$isDefault && !$isPremium && !$isAdmin) {
        sendError(403, 'premium_required', 'Fonctionnalité réservée aux membres Premium');
    }
    
    if (!isset(MEDIA_TABLES[$mediaType])) {
        sendError(400, 'invalid_type', 'Type de média invalide');
    }
    
    switch ($action) {
        case 'upload':
            handleUpload($db, $userId, $entityId, $mediaType, $isDefault);
            break;
        case 'add_from_temp':
            handleAddFromTemp($db, $userId, $entityId, $mediaType, $isDefault, $data);
            break;
        case 'finalize_temp':
            handleFinalizeTemp($db, $userId, $entityId, $mediaType, $isDefault, $data);
            break;
        default:
            sendError(400, 'invalid_action', 'Action non reconnue');
    }
}

/**
 * Upload direct d'un fichier
 */
function handleUpload(PDO $db, int $userId, ?int $entityId, string $mediaType, bool $isDefault): void
{
    if (!isset($_FILES['file'])) {
        sendError(400, 'no_file', 'Aucun fichier envoyé');
    }
    
    $uploadCategory = UPLOAD_CATEGORIES[$mediaType];
    
    // Si pas d'entityId (mode création), stocker en temporaire
    if (!$entityId) {
        $destDir = realpath(__DIR__ . '/../../storage/temp');
        $result = SecureUpload::upload($_FILES['file'], $uploadCategory, $destDir);
        
        if (!$result['success']) {
            sendError(400, 'upload_error', $result['error']);
        }
        
        // Générer un thumbnail pour les vidéos
        $thumbnailPath = null;
        if ($mediaType === 'videos') {
            $thumbnailPath = generateVideoThumbnail($result['path']);
        }
        
        sendSuccess([
            'tempId' => 'temp-' . uniqid(),
            'tempPath' => '/storage/temp/' . $result['filename'],
            'filename' => $result['filename'],
            'thumbnailPath' => $thumbnailPath ? '/storage/temp/' . basename($thumbnailPath) : null
        ]);
        return;
    }
    
    // Vérifier l'accès
    if (!canModifyCategory($db, $entityId, $userId, $isDefault)) {
        sendError(403, 'forbidden', 'Vous ne pouvez pas modifier cette catégorie');
    }
    
    // Déterminer le dossier de destination
    $destDir = getMediaDirectory($userId, $entityId, $mediaType, $isDefault);
    
    // Upload
    $result = SecureUpload::upload($_FILES['file'], $uploadCategory, $destDir);
    
    if (!$result['success']) {
        sendError(400, 'upload_error', $result['error']);
    }
    
    // Générer un thumbnail pour les vidéos
    $thumbnailUrl = null;
    if ($mediaType === 'videos') {
        $thumbPath = generateVideoThumbnail($result['path']);
        if ($thumbPath) {
            $thumbnailUrl = getRelativePath($thumbPath, $userId, $entityId, $isDefault);
        }
    }
    
    // Récupérer l'ordre max
    $table = MEDIA_TABLES[$mediaType];
    $stmt = $db->prepare("SELECT COALESCE(MAX(ordre), -1) + 1 as next_order FROM {$table} WHERE category_id = ?");
    $stmt->execute([$entityId]);
    $nextOrder = (int)$stmt->fetchColumn();
    
    // Insérer en base (colonnes: title, url, ordre, thumbnail_url pour vidéos)
    $relativeUrl = getRelativePath($result['path'], $userId, $entityId, $isDefault);
    
    if ($mediaType === 'videos') {
        $stmt = $db->prepare("
            INSERT INTO {$table} (category_id, title, url, thumbnail_url, ordre, created_at)
            VALUES (?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([$entityId, $result['filename'], $relativeUrl, $thumbnailUrl, $nextOrder]);
    } else {
        $stmt = $db->prepare("
            INSERT INTO {$table} (category_id, title, url, ordre, created_at)
            VALUES (?, ?, ?, ?, NOW())
        ");
        $stmt->execute([$entityId, $result['filename'], $relativeUrl, $nextOrder]);
    }
    $insertId = $db->lastInsertId();
    
    sendSuccess([
        'id' => $insertId,
        'filename' => $result['filename'],
        'path' => '/storage' . $relativeUrl,
        'thumbnailPath' => '/storage' . ($thumbnailUrl ?: $relativeUrl),
        'order' => $nextOrder
    ]);
}

/**
 * Ajoute un fichier depuis le stockage temporaire (après ImageEditor)
 */
function handleAddFromTemp(PDO $db, int $userId, ?int $entityId, string $mediaType, bool $isDefault, array $data): void
{
    $tempPath = $data['temp_path'] ?? null;
    $filename = $data['filename'] ?? null;
    
    if (!$tempPath || !$filename) {
        sendError(400, 'missing_param', 'temp_path et filename requis');
    }
    
    // Chemin absolu du fichier temporaire
    $absoluteTempPath = realpath(__DIR__ . '/../../' . ltrim($tempPath, '/'));
    
    if (!$absoluteTempPath || !file_exists($absoluteTempPath)) {
        sendError(404, 'not_found', 'Fichier temporaire non trouvé');
    }
    
    if (!$entityId) {
        // Garder en temp, retourner les infos
        sendSuccess([
            'tempId' => 'temp-' . uniqid(),
            'tempPath' => $tempPath,
            'filename' => $filename,
            'thumbnailPath' => $tempPath
        ]);
        return;
    }
    
    // Vérifier l'accès
    if (!canModifyCategory($db, $entityId, $userId, $isDefault)) {
        sendError(403, 'forbidden', 'Vous ne pouvez pas modifier cette catégorie');
    }
    
    // Déplacer vers le dossier final
    $destDir = getMediaDirectory($userId, $entityId, $mediaType, $isDefault);
    $destPath = $destDir . '/' . $filename;
    
    // Éviter les doublons
    if (file_exists($destPath)) {
        $info = pathinfo($filename);
        $filename = $info['filename'] . '_' . time() . '.' . $info['extension'];
        $destPath = $destDir . '/' . $filename;
    }
    
    if (!rename($absoluteTempPath, $destPath)) {
        sendError(500, 'move_error', 'Impossible de déplacer le fichier');
    }
    
    // Récupérer l'ordre max
    $table = MEDIA_TABLES[$mediaType];
    $stmt = $db->prepare("SELECT COALESCE(MAX(ordre), -1) + 1 as next_order FROM {$table} WHERE category_id = ?");
    $stmt->execute([$entityId]);
    $nextOrder = (int)$stmt->fetchColumn();
    
    // Insérer en base (colonnes: title, url, ordre)
    $relativeUrl = getRelativePath($destPath, $userId, $entityId, $isDefault);
    
    $stmt = $db->prepare("
        INSERT INTO {$table} (category_id, title, url, ordre, created_at)
        VALUES (?, ?, ?, ?, NOW())
    ");
    $stmt->execute([$entityId, $filename, $relativeUrl, $nextOrder]);
    $insertId = $db->lastInsertId();
    
    sendSuccess([
        'id' => $insertId,
        'filename' => $filename,
        'path' => '/storage' . $relativeUrl,
        'thumbnailPath' => '/storage' . $relativeUrl,
        'order' => $nextOrder
    ]);
}

/**
 * Finalise les fichiers temporaires après création de la catégorie
 */
function handleFinalizeTemp(PDO $db, int $userId, ?int $entityId, string $mediaType, bool $isDefault, array $data): void
{
    if (!$entityId) {
        sendError(400, 'missing_param', 'entity_id requis pour finaliser');
    }
    
    $tempPath = $data['temp_path'] ?? null;
    $filename = $data['filename'] ?? null;
    
    if (!$tempPath || !$filename) {
        sendError(400, 'missing_param', 'temp_path et filename requis');
    }
    
    // Vérifier l'accès
    if (!canModifyCategory($db, $entityId, $userId, $isDefault)) {
        sendError(403, 'forbidden', 'Vous ne pouvez pas modifier cette catégorie');
    }
    
    // Chemin absolu du fichier temporaire
    $absoluteTempPath = realpath(__DIR__ . '/../../' . ltrim($tempPath, '/'));
    
    if (!$absoluteTempPath || !file_exists($absoluteTempPath)) {
        sendError(404, 'not_found', 'Fichier temporaire non trouvé');
    }
    
    // Déplacer vers le dossier final
    $destDir = getMediaDirectory($userId, $entityId, $mediaType, $isDefault);
    $destPath = $destDir . '/' . $filename;
    
    // Éviter les doublons
    if (file_exists($destPath)) {
        $info = pathinfo($filename);
        $filename = $info['filename'] . '_' . time() . '.' . $info['extension'];
        $destPath = $destDir . '/' . $filename;
    }
    
    if (!rename($absoluteTempPath, $destPath)) {
        sendError(500, 'move_error', 'Impossible de déplacer le fichier');
    }
    
    // Générer un thumbnail pour les vidéos
    $thumbnailUrl = null;
    if ($mediaType === 'videos') {
        $thumbPath = generateVideoThumbnail($destPath);
        if ($thumbPath) {
            $thumbnailUrl = getRelativePath($thumbPath, $userId, $entityId, $isDefault);
        }
    }
    
    // Récupérer l'ordre max
    $table = MEDIA_TABLES[$mediaType];
    $stmt = $db->prepare("SELECT COALESCE(MAX(ordre), -1) + 1 as next_order FROM {$table} WHERE category_id = ?");
    $stmt->execute([$entityId]);
    $nextOrder = (int)$stmt->fetchColumn();
    
    // Insérer en base (colonnes: title, url, ordre, thumbnail_url pour vidéos)
    $relativeUrl = getRelativePath($destPath, $userId, $entityId, $isDefault);
    
    if ($mediaType === 'videos') {
        $stmt = $db->prepare("
            INSERT INTO {$table} (category_id, title, url, thumbnail_url, ordre, created_at)
            VALUES (?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([$entityId, $filename, $relativeUrl, $thumbnailUrl, $nextOrder]);
    } else {
        $stmt = $db->prepare("
            INSERT INTO {$table} (category_id, title, url, ordre, created_at)
            VALUES (?, ?, ?, ?, NOW())
        ");
        $stmt->execute([$entityId, $filename, $relativeUrl, $nextOrder]);
    }
    $insertId = $db->lastInsertId();
    
    sendSuccess([
        'id' => $insertId,
        'filename' => $filename,
        'path' => '/storage' . $relativeUrl,
        'thumbnailPath' => '/storage' . ($thumbnailUrl ?: $relativeUrl),
        'order' => $nextOrder
    ]);
}

/**
 * PUT - Réordonne ou met à jour un média
 */
function handlePut(PDO $db, int $userId, bool $isAdmin): void
{
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $action = $data['action'] ?? 'reorder';
    
    switch ($action) {
        case 'reorder':
            handleReorder($db, $userId, $isAdmin, $data);
            break;
        case 'update_from_temp':
            handleUpdateFromTemp($db, $userId, $isAdmin, $data);
            break;
        default:
            sendError(400, 'invalid_action', 'Action non reconnue');
    }
}

/**
 * Réordonne les médias
 */
function handleReorder(PDO $db, int $userId, bool $isAdmin, array $data): void
{
    $entityId = isset($data['entity_id']) ? (int)$data['entity_id'] : null;
    $mediaType = $data['media_type'] ?? 'images';
    $order = $data['order'] ?? [];
    
    if (!$entityId || empty($order)) {
        sendError(400, 'missing_param', 'entity_id et order requis');
    }
    
    if (!isset(MEDIA_TABLES[$mediaType])) {
        sendError(400, 'invalid_type', 'Type de média invalide');
    }
    
    // Déterminer si c'est une catégorie par défaut
    $stmt = $db->prepare("SELECT user_id FROM categories WHERE id = ?");
    $stmt->execute([$entityId]);
    $category = $stmt->fetch(PDO::FETCH_ASSOC);
    $isDefault = $category && $category['user_id'] === null;
    
    if (!canModifyCategory($db, $entityId, $userId, $isDefault)) {
        sendError(403, 'forbidden', 'Vous ne pouvez pas modifier cette catégorie');
    }
    
    $table = MEDIA_TABLES[$mediaType];
    
    $db->beginTransaction();
    try {
        $stmt = $db->prepare("UPDATE {$table} SET ordre = ? WHERE id = ? AND category_id = ?");
        
        foreach ($order as $item) {
            if (isset($item['id']) && isset($item['order'])) {
                $stmt->execute([(int)$item['order'], (int)$item['id'], $entityId]);
            }
        }
        
        $db->commit();
        sendSuccess(['message' => 'Ordre mis à jour']);
    } catch (Exception $e) {
        $db->rollBack();
        throw $e;
    }
}

/**
 * Met à jour un média depuis un fichier temporaire (après édition)
 */
function handleUpdateFromTemp(PDO $db, int $userId, bool $isAdmin, array $data): void
{
    $fileId = isset($data['id']) ? (int)$data['id'] : null;
    $entityId = isset($data['entity_id']) ? (int)$data['entity_id'] : null;
    $mediaType = $data['media_type'] ?? 'images';
    $tempPath = $data['temp_path'] ?? null;
    $filename = $data['filename'] ?? null;
    
    if (!$fileId || !$entityId || !$tempPath || !$filename) {
        sendError(400, 'missing_param', 'Paramètres manquants');
    }
    
    if (!isset(MEDIA_TABLES[$mediaType])) {
        sendError(400, 'invalid_type', 'Type de média invalide');
    }
    
    // Déterminer si c'est une catégorie par défaut
    $stmt = $db->prepare("SELECT user_id FROM categories WHERE id = ?");
    $stmt->execute([$entityId]);
    $category = $stmt->fetch(PDO::FETCH_ASSOC);
    $isDefault = $category && $category['user_id'] === null;
    
    if (!canModifyCategory($db, $entityId, $userId, $isDefault)) {
        sendError(403, 'forbidden', 'Vous ne pouvez pas modifier cette catégorie');
    }
    
    $table = MEDIA_TABLES[$mediaType];
    
    // Récupérer l'ancien fichier
    $stmt = $db->prepare("SELECT url FROM {$table} WHERE id = ? AND category_id = ?");
    $stmt->execute([$fileId, $entityId]);
    $oldFile = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$oldFile) {
        sendError(404, 'not_found', 'Média non trouvé');
    }
    
    // Chemin absolu du fichier temporaire
    $absoluteTempPath = realpath(__DIR__ . '/../../' . ltrim($tempPath, '/'));
    
    if (!$absoluteTempPath || !file_exists($absoluteTempPath)) {
        sendError(404, 'not_found', 'Fichier temporaire non trouvé');
    }
    
    // Déterminer le dossier de destination
    $destDir = getMediaDirectory($userId, $entityId, $mediaType, $isDefault);
    $destPath = $destDir . '/' . $filename;
    
    // Supprimer l'ancien fichier
    $oldAbsolutePath = getAbsolutePath($oldFile['url'], $userId, $entityId, $isDefault);
    if (file_exists($oldAbsolutePath)) {
        unlink($oldAbsolutePath);
    }
    
    // Déplacer le nouveau
    if (!rename($absoluteTempPath, $destPath)) {
        sendError(500, 'move_error', 'Impossible de déplacer le fichier');
    }
    
    // Mettre à jour en base
    $relativePath = getRelativePath($destPath, $userId, $entityId, $isDefault);
    
    // Seules les vidéos ont une colonne thumbnail_url
    if ($mediaType === 'videos') {
        $stmt = $db->prepare("UPDATE {$table} SET title = ?, url = ?, thumbnail_url = NULL WHERE id = ?");
    } else {
        $stmt = $db->prepare("UPDATE {$table} SET title = ?, url = ? WHERE id = ?");
    }
    $stmt->execute([$filename, $relativePath, $fileId]);
    
    sendSuccess([
        'id' => $fileId,
        'filename' => $filename,
        'path' => getPublicPath($relativePath, $isDefault),
        'thumbnailPath' => getPublicPath($relativePath, $isDefault)
    ]);
}

/**
 * DELETE - Supprime un ou tous les médias
 */
function handleDelete(PDO $db, int $userId, bool $isAdmin): void
{
    // Récupérer les paramètres (GET ou JSON body)
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    
    if (strpos($contentType, 'application/json') !== false) {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $action = $data['action'] ?? 'delete';
        $entityId = isset($data['entity_id']) ? (int)$data['entity_id'] : null;
        $mediaType = $data['media_type'] ?? 'images';
    } else {
        $action = 'delete';
        $fileId = isset($_GET['id']) ? (int)$_GET['id'] : null;
        $entityId = null; // Sera déterminé depuis le fichier
        $mediaType = $_GET['media_type'] ?? 'images';
    }
    
    if (!isset(MEDIA_TABLES[$mediaType])) {
        sendError(400, 'invalid_type', 'Type de média invalide');
    }
    
    if ($action === 'delete_all') {
        handleDeleteAll($db, $userId, $isAdmin, $entityId, $mediaType);
    } else {
        handleDeleteOne($db, $userId, $isAdmin, $fileId ?? null, $mediaType);
    }
}

/**
 * Supprime un seul média
 */
function handleDeleteOne(PDO $db, int $userId, bool $isAdmin, ?int $fileId, string $mediaType): void
{
    if (!$fileId) {
        sendError(400, 'missing_param', 'id requis');
    }
    
    $table = MEDIA_TABLES[$mediaType];
    
    // Récupérer le fichier et sa catégorie
    $stmt = $db->prepare("
        SELECT m.*, c.user_id as category_user_id
        FROM {$table} m
        JOIN categories c ON c.id = m.category_id
        WHERE m.id = ?
    ");
    $stmt->execute([$fileId]);
    $file = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$file) {
        sendError(404, 'not_found', 'Média non trouvé');
    }
    
    $isDefault = $file['category_user_id'] === null;
    
    if (!canModifyCategory($db, $file['category_id'], $userId, $isDefault)) {
        sendError(403, 'forbidden', 'Vous ne pouvez pas supprimer ce média');
    }
    
    // Supprimer le fichier physique
    $absolutePath = getAbsolutePath($file['url'], $userId, $file['category_id'], $isDefault);
    if (file_exists($absolutePath)) {
        unlink($absolutePath);
    }
    
    // Supprimer le thumbnail si présent
    if (!empty($file['thumbnail_url'])) {
        $thumbPath = getAbsolutePath($file['thumbnail_url'], $userId, $file['category_id'], $isDefault);
        if (file_exists($thumbPath)) {
            unlink($thumbPath);
        }
    }
    
    // Supprimer en base
    $stmt = $db->prepare("DELETE FROM {$table} WHERE id = ?");
    $stmt->execute([$fileId]);
    
    sendSuccess(['message' => 'Média supprimé']);
}

/**
 * Supprime tous les médias d'une catégorie
 */
function handleDeleteAll(PDO $db, int $userId, bool $isAdmin, ?int $entityId, string $mediaType): void
{
    if (!$entityId) {
        sendError(400, 'missing_param', 'entity_id requis');
    }
    
    // Déterminer si c'est une catégorie par défaut
    $stmt = $db->prepare("SELECT user_id FROM categories WHERE id = ?");
    $stmt->execute([$entityId]);
    $category = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$category) {
        sendError(404, 'not_found', 'Catégorie non trouvée');
    }
    
    $isDefault = $category['user_id'] === null;
    
    if (!canModifyCategory($db, $entityId, $userId, $isDefault)) {
        sendError(403, 'forbidden', 'Vous ne pouvez pas modifier cette catégorie');
    }
    
    $table = MEDIA_TABLES[$mediaType];
    
    // Récupérer tous les fichiers
    $stmt = $db->prepare("SELECT url, thumbnail_url FROM {$table} WHERE category_id = ?");
    $stmt->execute([$entityId]);
    $files = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Supprimer les fichiers physiques
    foreach ($files as $file) {
        $absolutePath = getAbsolutePath($file['url'], $userId, $entityId, $isDefault);
        if (file_exists($absolutePath)) {
            unlink($absolutePath);
        }
        
        if (!empty($file['thumbnail_url'])) {
            $thumbPath = getAbsolutePath($file['thumbnail_url'], $userId, $entityId, $isDefault);
            if (file_exists($thumbPath)) {
                unlink($thumbPath);
            }
        }
    }
    
    // Supprimer en base
    $stmt = $db->prepare("DELETE FROM {$table} WHERE category_id = ?");
    $stmt->execute([$entityId]);
    
    sendSuccess(['message' => 'Tous les médias supprimés', 'count' => count($files)]);
}

// ========================================
// Fonctions utilitaires
// ========================================

/**
 * Vérifie si l'utilisateur peut accéder à une catégorie
 */
function canAccessCategory(PDO $db, int $categoryId, int $userId, bool $isAdmin, bool $isDefault): bool
{
    if ($isAdmin) return true;
    if ($isDefault) return true; // Tout le monde peut voir les catégories par défaut
    
    $stmt = $db->prepare("SELECT user_id, is_public FROM categories WHERE id = ?");
    $stmt->execute([$categoryId]);
    $category = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$category) return false;
    
    // Propriétaire ou catégorie publique
    return $category['user_id'] == $userId || $category['is_public'];
}

/**
 * Vérifie si l'utilisateur peut modifier une catégorie
 */
function canModifyCategory(PDO $db, int $categoryId, int $userId, bool $isDefault): bool
{
    global $isAdmin;
    
    if ($isDefault) {
        return $isAdmin; // Seul l'admin peut modifier les catégories par défaut
    }
    
    if ($isAdmin) return true;
    
    $stmt = $db->prepare("SELECT user_id FROM categories WHERE id = ?");
    $stmt->execute([$categoryId]);
    $category = $stmt->fetch(PDO::FETCH_ASSOC);
    
    return $category && $category['user_id'] == $userId;
}

/**
 * Retourne le dossier de destination pour un média
 */
function getMediaDirectory(int $userId, int $categoryId, string $mediaType, bool $isDefault): string
{
    $baseDir = realpath(__DIR__ . '/../../storage');
    
    if ($isDefault) {
        $dir = "{$baseDir}/default_categories/{$categoryId}/{$mediaType}";
    } else {
        $dir = "{$baseDir}/users/{$userId}/Categories/{$categoryId}/{$mediaType}";
    }
    
    // Créer le dossier si nécessaire
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
    
    return $dir;
}

/**
 * Convertit un chemin absolu en chemin relatif pour stockage en BDD
 */
function getRelativePath(string $absolutePath, int $userId, int $categoryId, bool $isDefault): string
{
    $baseDir = realpath(__DIR__ . '/../../storage');
    return str_replace($baseDir, '', $absolutePath);
}

/**
 * Convertit un chemin relatif en chemin public pour l'affichage
 */
function getPublicPath(string $relativePath, bool $isDefault): string
{
    // Les fichiers sont accessibles via /storage/
    return '/storage' . $relativePath;
}

/**
 * Convertit un chemin relatif en chemin absolu
 */
function getAbsolutePath(string $relativePath, int $userId, int $categoryId, bool $isDefault): string
{
    $baseDir = realpath(__DIR__ . '/../../storage');
    return $baseDir . $relativePath;
}

/**
 * Génère un thumbnail pour une vidéo avec ffmpeg
 * Utilise le binaire statique intégré au projet
 */
function generateVideoThumbnail(string $videoPath): ?string
{
    // Chemin vers le binaire ffmpeg intégré au projet
    $ffmpegBin = realpath(__DIR__ . '/../../bin/ffmpeg');
    
    // Vérifier que le binaire existe
    if (!$ffmpegBin || !is_executable($ffmpegBin)) {
        error_log("FFmpeg binary not found or not executable at: " . ($ffmpegBin ?: 'null'));
        return null;
    }
    
    $thumbnailPath = preg_replace('/\.[^.]+$/', '_thumb.jpg', $videoPath);
    
    // Extraire une frame à 1 seconde
    $command = sprintf(
        '%s -i %s -ss 00:00:01 -vframes 1 -vf "scale=200:-1" -y %s 2>&1',
        escapeshellarg($ffmpegBin),
        escapeshellarg($videoPath),
        escapeshellarg($thumbnailPath)
    );
    
    exec($command, $output, $returnCode);
    
    if ($returnCode === 0 && file_exists($thumbnailPath)) {
        return $thumbnailPath;
    }
    
    error_log("FFmpeg thumbnail generation failed (code $returnCode): " . implode("\n", $output));
    return null;
}

/**
 * Envoie une réponse de succès
 */
function sendSuccess($data): void
{
    echo json_encode(['success' => true, 'data' => $data]);
    exit;
}

/**
 * Envoie une erreur
 */
function sendError(int $httpCode, string $errorCode, string $message): void
{
    http_response_code($httpCode);
    echo json_encode([
        'success' => false,
        'error' => $errorCode,
        'message' => $message
    ]);
    exit;
}
