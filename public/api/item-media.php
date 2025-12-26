<?php
/**
 * API Médias d'Items
 * 
 * Gère les opérations CRUD sur les médias associés aux items
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
    'images' => 'item_img',
    'videos' => 'item_videos',
    'audio' => 'item_audio',
    'documents' => 'item_doc'
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
    error_log("Item Media API Error: " . $e->getMessage());
    sendError(500, 'database_error', 'Erreur de base de données');
}

/**
 * GET - Liste les médias d'un item
 */
function handleGet(PDO $db, int $userId, bool $isAdmin): void
{
    $entityType = $_GET['entity_type'] ?? 'item';
    $entityId = isset($_GET['entity_id']) ? (int)$_GET['entity_id'] : null;
    $mediaType = $_GET['media_type'] ?? 'images';
    
    if (!$entityId) {
        sendError(400, 'missing_param', 'entity_id requis');
    }
    
    if (!isset(MEDIA_TABLES[$mediaType])) {
        sendError(400, 'invalid_type', 'Type de média invalide');
    }
    
    // Vérifier l'accès à l'item
    if (!canAccessItem($db, $entityId, $userId, $isAdmin)) {
        sendError(403, 'forbidden', 'Accès non autorisé à cet item');
    }
    
    $table = MEDIA_TABLES[$mediaType];
    
    // Colonnes selon le type de table
    $thumbnailCol = ($mediaType === 'videos') ? ', thumbnail_url' : '';
    
    $stmt = $db->prepare("
        SELECT id, title, url, ordre, created_at {$thumbnailCol}
        FROM {$table}
        WHERE item_id = ?
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
    $entityType = $data['entity_type'] ?? 'item';
    $entityId = isset($data['entity_id']) ? (int)$data['entity_id'] : null;
    $mediaType = $data['media_type'] ?? 'images';
    
    if (!isset(MEDIA_TABLES[$mediaType])) {
        sendError(400, 'invalid_type', 'Type de média invalide');
    }
    
    switch ($action) {
        case 'upload':
            handleUpload($db, $userId, $entityId, $mediaType);
            break;
        case 'add_from_temp':
            handleAddFromTemp($db, $userId, $entityId, $mediaType, $data);
            break;
        case 'add_from_proxy':
            handleAddFromProxy($db, $userId, $entityId, $mediaType, $data);
            break;
        case 'finalize_temp':
            handleFinalizeTemp($db, $userId, $entityId, $mediaType, $data);
            break;
        default:
            sendError(400, 'invalid_action', 'Action non reconnue');
    }
}

/**
 * Upload direct d'un fichier
 */
function handleUpload(PDO $db, int $userId, ?int $entityId, string $mediaType): void
{
    // Augmenter les limites pour les gros fichiers
    ini_set('memory_limit', '1024M');
    set_time_limit(300);
    
    if (!isset($_FILES['file'])) {
        // Log détaillé pour debug
        error_log("[item-media] Pas de fichier dans \$_FILES. POST=" . json_encode($_POST) . ", FILES=" . json_encode($_FILES));
        sendError(400, 'no_file', 'Aucun fichier envoyé');
    }
    
    // Log pour debug des gros uploads
    $fileSize = $_FILES['file']['size'] ?? 0;
    $fileName = $_FILES['file']['name'] ?? 'unknown';
    error_log("[item-media] Upload reçu: {$fileName} ({$fileSize} bytes), mediaType={$mediaType}, entityId={$entityId}");
    
    $uploadCategory = UPLOAD_CATEGORIES[$mediaType];
    
    // Conserver le nom original pour le champ title (lisible)
    $originalTitle = $fileName;
    
    // Générer un nom de fichier avec timestamp pour éviter le cache navigateur
    $pathInfo = pathinfo($fileName);
    $safeName = SecureUpload::sanitizeFilename($pathInfo['filename'] ?? 'file', false);
    $fileNameWithTimestamp = $safeName . '_' . time();
    
    // Si pas d'entityId (mode création), stocker en temporaire
    if (!$entityId) {
        $destDir = realpath(__DIR__ . '/../../storage/temp');
        $result = SecureUpload::upload($_FILES['file'], $uploadCategory, $destDir, $fileNameWithTimestamp);
        
        if (!$result['success']) {
            error_log("[item-media] Upload échoué: " . ($result['error'] ?? 'unknown'));

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
            'originalTitle' => $originalTitle,
            'thumbnailPath' => $thumbnailPath ? '/storage/temp/' . basename($thumbnailPath) : null
        ]);
        return;
    }
    
    // Vérifier l'accès
    if (!canModifyItem($db, $entityId, $userId)) {
        sendError(403, 'forbidden', 'Vous ne pouvez pas modifier cet item');
    }
    
    // Déterminer le dossier de destination
    $destDir = getMediaDirectory($userId, $entityId, $mediaType);
    
    // Upload avec le nom + timestamp
    $result = SecureUpload::upload($_FILES['file'], $uploadCategory, $destDir, $fileNameWithTimestamp);
    
    if (!$result['success']) {
        sendError(400, 'upload_error', $result['error']);
    }
    
    // Générer un thumbnail pour les vidéos
    $thumbnailUrl = null;
    if ($mediaType === 'videos') {
        $thumbPath = generateVideoThumbnail($result['path']);
        if ($thumbPath) {
            $thumbnailUrl = getRelativePath($thumbPath, $userId, $entityId);
        }
    }
    
    // Récupérer l'ordre max
    $table = MEDIA_TABLES[$mediaType];
    $stmt = $db->prepare("SELECT COALESCE(MAX(ordre), -1) + 1 as next_order FROM {$table} WHERE item_id = ?");
    $stmt->execute([$entityId]);
    $nextOrder = (int)$stmt->fetchColumn();
    
    // Insérer en base avec le titre original lisible
    $relativeUrl = getRelativePath($result['path'], $userId, $entityId);
    
    if ($mediaType === 'videos') {
        $stmt = $db->prepare("
            INSERT INTO {$table} (item_id, title, url, thumbnail_url, ordre, created_at)
            VALUES (?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([$entityId, $originalTitle, $relativeUrl, $thumbnailUrl, $nextOrder]);
    } else {
        $stmt = $db->prepare("
            INSERT INTO {$table} (item_id, title, url, ordre, created_at)
            VALUES (?, ?, ?, ?, NOW())
        ");
        $stmt->execute([$entityId, $originalTitle, $relativeUrl, $nextOrder]);
    }
    $insertId = $db->lastInsertId();
    
    sendSuccess([
        'id' => $insertId,
        'filename' => $originalTitle,
        'path' => '/storage' . $relativeUrl,
        'thumbnailPath' => '/storage' . ($thumbnailUrl ?: $relativeUrl),
        'order' => $nextOrder
    ]);
}

/**
 * Ajoute un fichier depuis le stockage temporaire (après ImageEditor)
 */
function handleAddFromTemp(PDO $db, int $userId, ?int $entityId, string $mediaType, array $data): void
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
    if (!canModifyItem($db, $entityId, $userId)) {
        sendError(403, 'forbidden', 'Vous ne pouvez pas modifier cet item');
    }
    
    // Déplacer vers le dossier final
    $destDir = getMediaDirectory($userId, $entityId, $mediaType);
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
    $stmt = $db->prepare("SELECT COALESCE(MAX(ordre), -1) + 1 as next_order FROM {$table} WHERE item_id = ?");
    $stmt->execute([$entityId]);
    $nextOrder = (int)$stmt->fetchColumn();
    
    // Insérer en base
    $relativeUrl = getRelativePath($destPath, $userId, $entityId);
    
    $stmt = $db->prepare("
        INSERT INTO {$table} (item_id, title, url, ordre, created_at)
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
 * Ajoute un fichier depuis le proxy temp (gros fichiers téléchargés par le proxy)
 * Le fichier est déjà sur le serveur dans /storage/temp/proxy/
 */
function handleAddFromProxy(PDO $db, int $userId, ?int $entityId, string $mediaType, array $data): void
{
    $proxyToken = $data['proxy_token'] ?? null;
    $filename = $data['filename'] ?? null;
    $mimeType = $data['mime_type'] ?? null;
    
    if (!$proxyToken || !$filename) {
        sendError(400, 'missing_param', 'proxy_token et filename requis');
    }
    
    error_log("[item-media] addFromProxy: token={$proxyToken}, filename={$filename}, mimeType={$mimeType}");
    
    // Conserver le nom original pour le champ title (lisible)
    $originalTitle = $filename;
    
    // Chercher le fichier proxy par token
    $proxyDir = realpath(__DIR__ . '/../../storage/temp/proxy');
    if (!$proxyDir) {
        sendError(500, 'config_error', 'Dossier proxy non configuré');
    }
    
    // Le fichier proxy est stocké avec le token comme préfixe
    // Exclure les fichiers .meta qui contiennent les métadonnées
    $proxyFile = null;
    $pattern = $proxyDir . '/' . $proxyToken . '.*';
    $matches = glob($pattern);
    
    if (!empty($matches)) {
        // Filtrer pour exclure les fichiers .meta
        foreach ($matches as $match) {
            if (!str_ends_with($match, '.meta')) {
                $proxyFile = $match;
                break;
            }
        }
    }
    
    if (!$proxyFile || !file_exists($proxyFile)) {
        error_log("[item-media] Fichier proxy non trouvé: pattern={$pattern}, matches=" . json_encode($matches));
        sendError(404, 'not_found', 'Fichier proxy non trouvé ou expiré');
    }
    
    $fileSize = filesize($proxyFile);
    error_log("[item-media] Fichier proxy trouvé: {$proxyFile} ({$fileSize} bytes)");
    
    // Générer un nom de fichier avec timestamp pour le cache navigateur
    $pathInfo = pathinfo($filename);
    $safeName = SecureUpload::sanitizeFilename($pathInfo['filename'] ?? 'file', false);
    $extension = strtolower($pathInfo['extension'] ?? 'bin');
    $diskFilename = $safeName . '_' . time() . '.' . $extension;
    
    if (!$entityId) {
        // Mode création : déplacer vers temp standard
        $tempDir = realpath(__DIR__ . '/../../storage/temp');
        $destPath = $tempDir . '/' . $diskFilename;
        
        if (!rename($proxyFile, $destPath)) {
            error_log("[item-media] Échec déplacement vers temp: {$proxyFile} -> {$destPath}");
            sendError(500, 'move_error', 'Impossible de déplacer le fichier');
        }
        
        // Supprimer le fichier .meta associé
        $metaFile = $proxyDir . '/' . $proxyToken . '.meta';
        if (file_exists($metaFile)) {
            @unlink($metaFile);
        }
        
        error_log("[item-media] Fichier déplacé vers temp: {$destPath}");
        
        sendSuccess([
            'tempId' => 'proxy-' . uniqid(),
            'tempPath' => '/storage/temp/' . $diskFilename,
            'filename' => $diskFilename,
            'originalTitle' => $originalTitle
        ]);
        return;
    }
    
    // Vérifier l'accès
    if (!canModifyItem($db, $entityId, $userId)) {
        sendError(403, 'forbidden', 'Vous ne pouvez pas modifier cet item');
    }
    
    // Déplacer vers le dossier final
    $destDir = getMediaDirectory($userId, $entityId, $mediaType);
    $destPath = $destDir . '/' . $diskFilename;
    
    if (!rename($proxyFile, $destPath)) {
        error_log("[item-media] Échec déplacement vers final: {$proxyFile} -> {$destPath}");
        sendError(500, 'move_error', 'Impossible de déplacer le fichier');
    }
    
    // Supprimer le fichier .meta associé
    $metaFile = $proxyDir . '/' . $proxyToken . '.meta';
    if (file_exists($metaFile)) {
        @unlink($metaFile);
    }
    
    error_log("[item-media] Fichier déplacé vers final: {$destPath}");
    
    // Récupérer l'ordre max
    $table = MEDIA_TABLES[$mediaType];
    $stmt = $db->prepare("SELECT COALESCE(MAX(ordre), -1) + 1 as next_order FROM {$table} WHERE item_id = ?");
    $stmt->execute([$entityId]);
    $nextOrder = (int)$stmt->fetchColumn();
    
    // Insérer en base avec le titre original lisible
    $relativeUrl = getRelativePath($destPath, $userId, $entityId);
    
    // Gérer les vidéos (thumbnail)
    if ($mediaType === 'videos') {
        $thumbnailUrl = null;
        $thumbPath = generateVideoThumbnail($destPath);
        if ($thumbPath) {
            $thumbnailUrl = getRelativePath($thumbPath, $userId, $entityId);
        }
        
        $stmt = $db->prepare("
            INSERT INTO {$table} (item_id, title, url, thumbnail_url, ordre, created_at)
            VALUES (?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([$entityId, $originalTitle, $relativeUrl, $thumbnailUrl, $nextOrder]);
    } else {
        $stmt = $db->prepare("
            INSERT INTO {$table} (item_id, title, url, ordre, created_at)
            VALUES (?, ?, ?, ?, NOW())
        ");
        $stmt->execute([$entityId, $originalTitle, $relativeUrl, $nextOrder]);
    }
    
    $insertId = $db->lastInsertId();
    
    sendSuccess([
        'id' => $insertId,
        'filename' => $originalTitle,
        'path' => '/storage' . $relativeUrl,
        'thumbnailPath' => '/storage' . $relativeUrl,
        'order' => $nextOrder
    ]);
}

/**
 * Finalise les fichiers temporaires après création de l'item
 */
function handleFinalizeTemp(PDO $db, int $userId, ?int $entityId, string $mediaType, array $data): void
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
    if (!canModifyItem($db, $entityId, $userId)) {
        sendError(403, 'forbidden', 'Vous ne pouvez pas modifier cet item');
    }
    
    // Chemin absolu du fichier temporaire
    $absoluteTempPath = realpath(__DIR__ . '/../../' . ltrim($tempPath, '/'));
    
    if (!$absoluteTempPath || !file_exists($absoluteTempPath)) {
        sendError(404, 'not_found', 'Fichier temporaire non trouvé');
    }
    
    // Déplacer vers le dossier final
    $destDir = getMediaDirectory($userId, $entityId, $mediaType);
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
            $thumbnailUrl = getRelativePath($thumbPath, $userId, $entityId);
        }
    }
    
    // Récupérer l'ordre max
    $table = MEDIA_TABLES[$mediaType];
    $stmt = $db->prepare("SELECT COALESCE(MAX(ordre), -1) + 1 as next_order FROM {$table} WHERE item_id = ?");
    $stmt->execute([$entityId]);
    $nextOrder = (int)$stmt->fetchColumn();
    
    // Insérer en base
    $relativeUrl = getRelativePath($destPath, $userId, $entityId);
    
    if ($mediaType === 'videos') {
        $stmt = $db->prepare("
            INSERT INTO {$table} (item_id, title, url, thumbnail_url, ordre, created_at)
            VALUES (?, ?, ?, ?, ?, NOW())
        ");
        $stmt->execute([$entityId, $filename, $relativeUrl, $thumbnailUrl, $nextOrder]);
    } else {
        $stmt = $db->prepare("
            INSERT INTO {$table} (item_id, title, url, ordre, created_at)
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
    
    if (!canModifyItem($db, $entityId, $userId)) {
        sendError(403, 'forbidden', 'Vous ne pouvez pas modifier cet item');
    }
    
    $table = MEDIA_TABLES[$mediaType];
    
    $db->beginTransaction();
    try {
        $stmt = $db->prepare("UPDATE {$table} SET ordre = ? WHERE id = ? AND item_id = ?");
        
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
    
    if (!canModifyItem($db, $entityId, $userId)) {
        sendError(403, 'forbidden', 'Vous ne pouvez pas modifier cet item');
    }
    
    $table = MEDIA_TABLES[$mediaType];
    
    // Récupérer l'ancien fichier
    $stmt = $db->prepare("SELECT url FROM {$table} WHERE id = ? AND item_id = ?");
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
    $destDir = getMediaDirectory($userId, $entityId, $mediaType);
    $destPath = $destDir . '/' . $filename;
    
    // Supprimer l'ancien fichier
    $oldAbsolutePath = getAbsolutePath($oldFile['url'], $userId, $entityId);
    if (file_exists($oldAbsolutePath)) {
        unlink($oldAbsolutePath);
    }
    
    // Déplacer le nouveau
    if (!rename($absoluteTempPath, $destPath)) {
        sendError(500, 'move_error', 'Impossible de déplacer le fichier');
    }
    
    // Mettre à jour en base
    $relativePath = getRelativePath($destPath, $userId, $entityId);
    
    if ($mediaType === 'videos') {
        $stmt = $db->prepare("UPDATE {$table} SET title = ?, url = ?, thumbnail_url = NULL WHERE id = ?");
    } else {
        $stmt = $db->prepare("UPDATE {$table} SET title = ?, url = ? WHERE id = ?");
    }
    $stmt->execute([$filename, $relativePath, $fileId]);
    
    sendSuccess([
        'id' => $fileId,
        'filename' => $filename,
        'path' => '/storage' . $relativePath,
        'thumbnailPath' => '/storage' . $relativePath
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
        $entityId = null;
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
    
    // Récupérer le fichier et son item
    $stmt = $db->prepare("
        SELECT m.*, i.user_id as item_user_id
        FROM {$table} m
        JOIN items i ON i.id = m.item_id
        WHERE m.id = ?
    ");
    $stmt->execute([$fileId]);
    $file = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$file) {
        sendError(404, 'not_found', 'Média non trouvé');
    }
    
    if (!canModifyItem($db, $file['item_id'], $userId)) {
        sendError(403, 'forbidden', 'Vous ne pouvez pas supprimer ce média');
    }
    
    // Supprimer le fichier physique
    $absolutePath = getAbsolutePath($file['url'], $userId, $file['item_id']);
    if (file_exists($absolutePath)) {
        unlink($absolutePath);
    }
    
    // Supprimer le thumbnail si présent
    if (!empty($file['thumbnail_url'])) {
        $thumbPath = getAbsolutePath($file['thumbnail_url'], $userId, $file['item_id']);
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
 * Supprime tous les médias d'un item
 */
function handleDeleteAll(PDO $db, int $userId, bool $isAdmin, ?int $entityId, string $mediaType): void
{
    if (!$entityId) {
        sendError(400, 'missing_param', 'entity_id requis');
    }
    
    // Vérifier l'accès
    if (!canModifyItem($db, $entityId, $userId)) {
        sendError(403, 'forbidden', 'Vous ne pouvez pas modifier cet item');
    }
    
    $table = MEDIA_TABLES[$mediaType];
    
    // Récupérer tous les fichiers
    $stmt = $db->prepare("SELECT url, thumbnail_url FROM {$table} WHERE item_id = ?");
    $stmt->execute([$entityId]);
    $files = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Supprimer les fichiers physiques
    foreach ($files as $file) {
        $absolutePath = getAbsolutePath($file['url'], $userId, $entityId);
        if (file_exists($absolutePath)) {
            unlink($absolutePath);
        }
        
        if (!empty($file['thumbnail_url'])) {
            $thumbPath = getAbsolutePath($file['thumbnail_url'], $userId, $entityId);
            if (file_exists($thumbPath)) {
                unlink($thumbPath);
            }
        }
    }
    
    // Supprimer en base
    $stmt = $db->prepare("DELETE FROM {$table} WHERE item_id = ?");
    $stmt->execute([$entityId]);
    
    sendSuccess(['message' => 'Tous les médias supprimés', 'count' => count($files)]);
}

// ========================================
// Fonctions utilitaires
// ========================================

/**
 * Vérifie si l'utilisateur peut accéder à un item
 */
function canAccessItem(PDO $db, int $itemId, int $userId, bool $isAdmin): bool
{
    if ($isAdmin) return true;
    
    $stmt = $db->prepare("SELECT user_id FROM items WHERE id = ?");
    $stmt->execute([$itemId]);
    $item = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$item) return false;
    
    return $item['user_id'] == $userId;
}

/**
 * Vérifie si l'utilisateur peut modifier un item
 */
function canModifyItem(PDO $db, int $itemId, int $userId): bool
{
    global $isAdmin;
    
    if ($isAdmin) return true;
    
    $stmt = $db->prepare("SELECT user_id FROM items WHERE id = ?");
    $stmt->execute([$itemId]);
    $item = $stmt->fetch(PDO::FETCH_ASSOC);
    
    return $item && $item['user_id'] == $userId;
}

/**
 * Retourne le dossier de destination pour un média d'item
 */
function getMediaDirectory(int $userId, int $itemId, string $mediaType): string
{
    $baseDir = realpath(__DIR__ . '/../../storage');
    $dir = "{$baseDir}/users/{$userId}/items/{$itemId}/{$mediaType}";
    
    // Créer le dossier si nécessaire
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
    
    return $dir;
}

/**
 * Convertit un chemin absolu en chemin relatif pour stockage en BDD
 */
function getRelativePath(string $absolutePath, int $userId, int $itemId): string
{
    $baseDir = realpath(__DIR__ . '/../../storage');
    return str_replace($baseDir, '', $absolutePath);
}

/**
 * Convertit un chemin relatif en chemin absolu
 */
function getAbsolutePath(string $relativePath, int $userId, int $itemId): string
{
    $baseDir = realpath(__DIR__ . '/../../storage');
    return $baseDir . $relativePath;
}

/**
 * Génère un thumbnail pour une vidéo avec ffmpeg
 */
function generateVideoThumbnail(string $videoPath): ?string
{
    $ffmpegBin = realpath(__DIR__ . '/../../bin/ffmpeg');
    
    if (!$ffmpegBin || !is_executable($ffmpegBin)) {
        error_log("FFmpeg binary not found or not executable at: " . ($ffmpegBin ?: 'null'));
        return null;
    }
    
    $thumbnailPath = preg_replace('/\.[^.]+$/', '_thumb.jpg', $videoPath);
    
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
