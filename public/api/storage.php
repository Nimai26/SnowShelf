<?php
/**
 * API de service des fichiers du dossier storage/
 * 
 * Ce script sert les fichiers stockés dans /storage/ qui est hors du dossier public
 * Il gère la sécurité, le cache navigateur et les types MIME
 * 
 * Usage:
 *   /api/storage.php?file=default_categories/1/icon.png
 *   /api/storage.php?file=users/5/Categories/12/images/photo.jpg
 * 
 * Raccourci recommandé via .htaccess:
 *   /storage/default_categories/1/icon.png → /api/storage.php?file=default_categories/1/icon.png
 */

// Démarrer la session pour vérifier l'authentification si nécessaire
session_start();

// Chemin de base du storage (en dehors de public/)
define('STORAGE_PATH', realpath(__DIR__ . '/../../storage'));

// Types MIME autorisés
$allowedMimeTypes = [
    // Images
    'jpg'  => 'image/jpeg',
    'jpeg' => 'image/jpeg',
    'png'  => 'image/png',
    'gif'  => 'image/gif',
    'webp' => 'image/webp',
    'svg'  => 'image/svg+xml',
    'ico'  => 'image/x-icon',
    // Audio
    'mp3'  => 'audio/mpeg',
    'wav'  => 'audio/wav',
    'ogg'  => 'audio/ogg',
    'flac' => 'audio/flac',
    // Vidéo
    'mp4'  => 'video/mp4',
    'webm' => 'video/webm',
    'avi'  => 'video/x-msvideo',
    'mkv'  => 'video/x-matroska',
    'mov'  => 'video/quicktime',
    // Documents
    'pdf'  => 'application/pdf',
    'txt'  => 'text/plain',
    'json' => 'application/json',
];

// Récupérer le chemin du fichier demandé
$requestedFile = $_GET['file'] ?? '';

if (empty($requestedFile)) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Paramètre file manquant']);
    exit;
}

// Nettoyer le chemin pour éviter les attaques de traversée de répertoire
$requestedFile = str_replace(['..', "\0"], '', $requestedFile);
$requestedFile = ltrim($requestedFile, '/');

// Construire le chemin absolu
$absolutePath = STORAGE_PATH . '/' . $requestedFile;
$realPath = realpath($absolutePath);

// Vérifier que le fichier existe et est dans le dossier storage
if ($realPath === false || strpos($realPath, STORAGE_PATH) !== 0) {
    http_response_code(404);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Fichier non trouvé']);
    exit;
}

// Vérifier que c'est un fichier (pas un dossier)
if (!is_file($realPath)) {
    http_response_code(404);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Fichier non trouvé']);
    exit;
}

// Récupérer l'extension
$extension = strtolower(pathinfo($realPath, PATHINFO_EXTENSION));

// Vérifier que l'extension est autorisée
if (!isset($allowedMimeTypes[$extension])) {
    http_response_code(403);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Type de fichier non autorisé']);
    exit;
}

// === CONTRÔLE D'ACCÈS ===
// Les fichiers default_categories sont publics
// Les fichiers users/{id}/ nécessitent une vérification

$pathParts = explode('/', $requestedFile);

if ($pathParts[0] === 'users' && isset($pathParts[1])) {
    // Fichier utilisateur - vérifier les droits d'accès
    $fileOwnerId = (int)$pathParts[1];
    $currentUserId = $_SESSION['user_id'] ?? 0;
    $isAdmin = $_SESSION['is_admin'] ?? false;
    
    // Pour l'instant, on autorise l'accès aux fichiers utilisateur si :
    // - L'utilisateur est connecté ET (propriétaire OU admin)
    // - OU le fichier est dans une catégorie visible
    // TODO: Affiner les règles d'accès selon les besoins
    
    // Pour simplifier, on autorise l'accès pour les utilisateurs connectés
    // Une logique plus fine peut être ajoutée selon les besoins
    if (!isset($_SESSION['user_id'])) {
        // Vérifier si la catégorie est visible publiquement
        // Pour l'instant on bloque les accès non authentifiés aux fichiers utilisateur
        http_response_code(403);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Accès non autorisé']);
        exit;
    }
}

// === GESTION DU CACHE ===

// Récupérer les métadonnées du fichier
$fileSize = filesize($realPath);
$lastModified = filemtime($realPath);

// Générer un ETag basé sur le chemin, la taille et la date de modification
$etag = '"' . md5($realPath . $fileSize . $lastModified) . '"';

// Headers de cache
header('Cache-Control: public, max-age=86400'); // Cache 24h
header('ETag: ' . $etag);
header('Last-Modified: ' . gmdate('D, d M Y H:i:s', $lastModified) . ' GMT');

// Vérifier si le client a une version en cache valide
$ifNoneMatch = $_SERVER['HTTP_IF_NONE_MATCH'] ?? '';
$ifModifiedSince = $_SERVER['HTTP_IF_MODIFIED_SINCE'] ?? '';

if ($ifNoneMatch === $etag) {
    http_response_code(304); // Not Modified
    exit;
}

if (!empty($ifModifiedSince)) {
    $ifModifiedSinceTime = strtotime($ifModifiedSince);
    if ($ifModifiedSinceTime !== false && $ifModifiedSinceTime >= $lastModified) {
        http_response_code(304); // Not Modified
        exit;
    }
}

// === SERVIR LE FICHIER ===

// Définir le type MIME
$mimeType = $allowedMimeTypes[$extension];

// Pour les SVG, ajouter une protection XSS
if ($extension === 'svg') {
    header('Content-Security-Policy: default-src \'none\'; style-src \'unsafe-inline\'');
}

// Headers de réponse
header('Content-Type: ' . $mimeType);
header('Content-Length: ' . $fileSize);
header('Accept-Ranges: bytes');

// Support du Range pour les vidéos/audio/PDF (lecture progressive)
if (isset($_SERVER['HTTP_RANGE'])) {
    $range = $_SERVER['HTTP_RANGE'];
    
    if (preg_match('/bytes=(\d+)-(\d*)/', $range, $matches)) {
        $start = (int)$matches[1];
        $end = !empty($matches[2]) ? (int)$matches[2] : $fileSize - 1;
        
        if ($start > $end || $start >= $fileSize) {
            http_response_code(416); // Range Not Satisfiable
            header('Content-Range: bytes */' . $fileSize);
            exit;
        }
        
        $length = $end - $start + 1;
        
        http_response_code(206); // Partial Content
        header('Content-Range: bytes ' . $start . '-' . $end . '/' . $fileSize);
        header('Content-Length: ' . $length);
        
        $fp = fopen($realPath, 'rb');
        fseek($fp, $start);
        
        // Lire et envoyer par chunks pour les gros fichiers
        $chunkSize = 8192;
        $remaining = $length;
        while ($remaining > 0 && !feof($fp)) {
            $toRead = min($chunkSize, $remaining);
            echo fread($fp, $toRead);
            $remaining -= $toRead;
            flush();
        }
        
        fclose($fp);
        exit;
    }
}

// Pour les gros fichiers (> 50 Mo), utiliser X-Accel-Redirect ou streaming par chunks
if ($fileSize > 50 * 1024 * 1024) {
    // Désactiver le buffering de sortie
    while (ob_get_level()) {
        ob_end_clean();
    }
    
    // Streaming par chunks pour éviter la saturation mémoire
    $fp = fopen($realPath, 'rb');
    if ($fp === false) {
        http_response_code(500);
        echo json_encode(['error' => 'Impossible d\'ouvrir le fichier']);
        exit;
    }
    
    $chunkSize = 8192; // 8 Ko par chunk
    while (!feof($fp)) {
        echo fread($fp, $chunkSize);
        flush();
    }
    fclose($fp);
} else {
    // Fichiers normaux : readfile est OK
    readfile($realPath);
}
