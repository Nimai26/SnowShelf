<?php
/**
 * API - Sauvegarde d'images temporaires pour l'éditeur d'image
 * 
 * Reçoit une image éditée et la stocke temporairement avant
 * qu'elle soit déplacée vers sa destination finale.
 * 
 * Utilise les configurations de la table upload_config via UploadConfig.
 * 
 * Méthodes : POST (upload)
 * 
 * @author SnowShelf
 * @version 1.0.0
 */

require_once __DIR__ . '/../../core/i18n.php';
require_once __DIR__ . '/../../core/logger.php';
require_once __DIR__ . '/../../core/ApiAuth.php';
require_once __DIR__ . '/../../core/UploadConfig.php';

// Configuration statique
define('TEMP_DIR', __DIR__ . '/../../storage/temp/');
define('TEMP_FILE_LIFETIME', 3600); // 1 heure de durée de vie

// Charger la configuration des images depuis la BDD
$imageConfig = UploadConfig::getCategory('images');
$maxFileSize = $imageConfig ? $imageConfig['maxSize'] : 10 * 1024 * 1024;
$allowedMimes = $imageConfig ? $imageConfig['mimes'] : ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
$maxSizeMB = $imageConfig ? $imageConfig['maxSizeMB'] : 10;

header('Content-Type: application/json; charset=utf-8');

// Vérifier l'authentification (utilisateur connecté)
session_start();
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => __('error.unauthorized')]);
    exit;
}

// Vérifier la méthode
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => __('error.method_not_allowed')]);
    exit;
}

// Vérifier la présence du fichier
if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
    $errorCode = $_FILES['image']['error'] ?? UPLOAD_ERR_NO_FILE;
    $errorMessages = [
        UPLOAD_ERR_INI_SIZE   => 'Fichier trop volumineux (limite serveur)',
        UPLOAD_ERR_FORM_SIZE  => 'Fichier trop volumineux (limite formulaire)',
        UPLOAD_ERR_PARTIAL    => 'Fichier partiellement uploadé',
        UPLOAD_ERR_NO_FILE    => 'Aucun fichier reçu',
        UPLOAD_ERR_NO_TMP_DIR => 'Dossier temporaire manquant',
        UPLOAD_ERR_CANT_WRITE => 'Échec d\'écriture sur disque',
        UPLOAD_ERR_EXTENSION  => 'Extension bloquée',
    ];
    
    http_response_code(400);
    echo json_encode(['error' => $errorMessages[$errorCode] ?? 'Erreur d\'upload']);
    exit;
}

$file = $_FILES['image'];

// Vérifier la taille (depuis upload_config)
if ($file['size'] > $maxFileSize) {
    http_response_code(400);
    echo json_encode(['error' => "Fichier trop volumineux (max {$maxSizeMB} MB)"]);
    exit;
}

// Vérifier le type MIME (depuis upload_config)
$finfo = new finfo(FILEINFO_MIME_TYPE);
$mimeType = $finfo->file($file['tmp_name']);

if (!in_array($mimeType, $allowedMimes)) {
    http_response_code(400);
    loger('image-temp', 'WARNING', 'Type MIME non autorisé', [
        'user_id' => $_SESSION['user_id'],
        'mime' => $mimeType,
        'filename' => $file['name']
    ]);
    echo json_encode(['error' => 'Type de fichier non autorisé']);
    exit;
}

// Vérifier que c'est une vraie image
$imageInfo = @getimagesize($file['tmp_name']);
if ($imageInfo === false) {
    http_response_code(400);
    loger('image-temp', 'WARNING', 'Fichier non valide comme image', [
        'user_id' => $_SESSION['user_id'],
        'filename' => $file['name']
    ]);
    echo json_encode(['error' => 'Le fichier n\'est pas une image valide']);
    exit;
}

// Créer le dossier temporaire si nécessaire
if (!is_dir(TEMP_DIR)) {
    if (!mkdir(TEMP_DIR, 0755, true)) {
        http_response_code(500);
        loger('image-temp', 'ERROR', 'Impossible de créer le dossier temporaire');
        echo json_encode(['error' => 'Erreur serveur']);
        exit;
    }
}

// Générer un nom de fichier unique
$extension = [
    'image/jpeg' => 'jpg',
    'image/png'  => 'png',
    'image/gif'  => 'gif',
    'image/webp' => 'webp'
][$mimeType];

$userId = $_SESSION['user_id'];
$timestamp = time();
$random = bin2hex(random_bytes(8));
$filename = "temp_{$userId}_{$timestamp}_{$random}.{$extension}";
$filepath = TEMP_DIR . $filename;

// Déplacer le fichier
if (!move_uploaded_file($file['tmp_name'], $filepath)) {
    http_response_code(500);
    loger('image-temp', 'ERROR', 'Échec du déplacement du fichier', [
        'user_id' => $userId,
        'filepath' => $filepath
    ]);
    echo json_encode(['error' => 'Erreur lors de l\'enregistrement']);
    exit;
}

// Nettoyer les anciens fichiers temporaires de l'utilisateur
cleanupOldTempFiles($userId);

// Répondre avec le chemin
loger('image-temp', 'INFO', 'Image temporaire créée', [
    'user_id' => $userId,
    'filename' => $filename,
    'size' => $file['size'],
    'dimensions' => $imageInfo[0] . 'x' . $imageInfo[1]
]);

echo json_encode([
    'success' => true,
    'path' => '/storage/temp/' . $filename,
    'filename' => $filename,
    'size' => $file['size'],
    'width' => $imageInfo[0],
    'height' => $imageInfo[1],
    'mime' => $mimeType
]);

/**
 * Supprime les anciens fichiers temporaires d'un utilisateur
 * 
 * @param int $userId ID de l'utilisateur
 */
function cleanupOldTempFiles(int $userId): void {
    // GLOB_BRACE n'est pas disponible sur Alpine Linux, donc on fait plusieurs globs
    $extensions = ['jpg', 'png', 'gif', 'webp'];
    $files = [];
    
    foreach ($extensions as $ext) {
        $pattern = TEMP_DIR . "temp_{$userId}_*.{$ext}";
        $matches = glob($pattern);
        if ($matches) {
            $files = array_merge($files, $matches);
        }
    }
    
    if (empty($files)) return;
    
    $now = time();
    $deleted = 0;
    
    foreach ($files as $file) {
        // Extraire le timestamp du nom de fichier
        if (preg_match('/temp_\d+_(\d+)_/', basename($file), $matches)) {
            $fileTime = (int) $matches[1];
            
            // Supprimer si plus vieux que TEMP_FILE_LIFETIME
            if ($now - $fileTime > TEMP_FILE_LIFETIME) {
                if (unlink($file)) {
                    $deleted++;
                }
            }
        }
    }
    
    if ($deleted > 0) {
        loger('image-temp', 'INFO', 'Nettoyage fichiers temporaires', [
            'user_id' => $userId,
            'deleted' => $deleted
        ]);
    }
}
