<?php
/**
 * API Thumbnail - Génère et sert des thumbnails d'images à la volée
 * 
 * Usage: /api/thumbnail.php?path=/storage/users/4/items/82/images/image.jpg&size=200
 * 
 * Les thumbnails sont mis en cache dans /storage/thumbnails/
 * 
 * @author SnowShelf
 * @version 1.0.0
 */

// Configuration
define('THUMBNAIL_QUALITY', 85); // Qualité JPEG
define('THUMBNAIL_CACHE_DIR', __DIR__ . '/../../storage/thumbnails');
define('STORAGE_BASE', __DIR__ . '/../../storage');
define('MAX_SIZE', 800); // Taille max autorisée
define('DEFAULT_SIZE', 200); // Taille par défaut

// Headers de cache agressifs
header('Cache-Control: public, max-age=31536000, immutable'); // 1 an
header('Expires: ' . gmdate('D, d M Y H:i:s', time() + 31536000) . ' GMT');

// Paramètres
$requestedPath = $_GET['path'] ?? '';
$size = min((int)($_GET['size'] ?? DEFAULT_SIZE), MAX_SIZE);

if (empty($requestedPath)) {
    http_response_code(400);
    die('Missing path parameter');
}

// Sécurité : nettoyer le chemin et empêcher les traversées
$cleanPath = str_replace(['..', "\0"], '', $requestedPath);
$cleanPath = preg_replace('#/+#', '/', $cleanPath); // Normaliser les slashes

// Retirer les query strings éventuels du path (ex: ?v=123456)
if (($queryPos = strpos($cleanPath, '?')) !== false) {
    $cleanPath = substr($cleanPath, 0, $queryPos);
}

// Construire le chemin source
// Le path peut être /storage/... ou juste users/...
if (strpos($cleanPath, '/storage/') === 0) {
    $cleanPath = substr($cleanPath, 8); // Retirer /storage
}
$sourcePath = STORAGE_BASE . '/' . ltrim($cleanPath, '/');

// Vérifier que le fichier existe
if (!file_exists($sourcePath)) {
    http_response_code(404);
    die('Image not found');
}

// Vérifier que c'est bien une image
$mimeType = mime_content_type($sourcePath);
if (!in_array($mimeType, ['image/jpeg', 'image/png', 'image/gif', 'image/webp'])) {
    http_response_code(400);
    die('Not an image');
}

// Construire le chemin du thumbnail en cache
$pathHash = md5($cleanPath . '_' . $size);
$cacheSubDir = substr($pathHash, 0, 2); // Sous-dossier pour éviter trop de fichiers
$thumbnailPath = THUMBNAIL_CACHE_DIR . '/' . $cacheSubDir . '/' . $pathHash . '.jpg';

// Vérifier si le thumbnail existe déjà et est plus récent que l'original
if (file_exists($thumbnailPath) && filemtime($thumbnailPath) >= filemtime($sourcePath)) {
    // Servir le thumbnail en cache
    header('Content-Type: image/jpeg');
    header('Content-Length: ' . filesize($thumbnailPath));
    header('X-Thumbnail-Cache: HIT');
    readfile($thumbnailPath);
    exit;
}

// Générer le thumbnail
header('X-Thumbnail-Cache: MISS');

// Créer le dossier de cache si nécessaire
$cacheDir = THUMBNAIL_CACHE_DIR . '/' . $cacheSubDir;
if (!is_dir($cacheDir)) {
    mkdir($cacheDir, 0755, true);
}

// Charger l'image source
switch ($mimeType) {
    case 'image/jpeg':
        $source = @imagecreatefromjpeg($sourcePath);
        break;
    case 'image/png':
        $source = @imagecreatefrompng($sourcePath);
        break;
    case 'image/gif':
        $source = @imagecreatefromgif($sourcePath);
        break;
    case 'image/webp':
        $source = @imagecreatefromwebp($sourcePath);
        break;
    default:
        http_response_code(500);
        die('Unsupported image type');
}

if (!$source) {
    http_response_code(500);
    die('Failed to load image');
}

// Obtenir les dimensions originales
$origWidth = imagesx($source);
$origHeight = imagesy($source);

// Calculer les nouvelles dimensions (garder le ratio, couvrir le carré)
$ratio = max($size / $origWidth, $size / $origHeight);
$newWidth = (int)($origWidth * $ratio);
$newHeight = (int)($origHeight * $ratio);

// Créer l'image redimensionnée
$resized = imagecreatetruecolor($size, $size);

// Remplir avec du blanc (pour les PNG transparents)
$white = imagecolorallocate($resized, 255, 255, 255);
imagefill($resized, 0, 0, $white);

// Calculer le décalage pour centrer
$offsetX = (int)(($size - $newWidth) / 2);
$offsetY = (int)(($size - $newHeight) / 2);

// Redimensionner avec interpolation de haute qualité
imagecopyresampled(
    $resized, $source,
    $offsetX, $offsetY, 0, 0,
    $newWidth, $newHeight, $origWidth, $origHeight
);

// Libérer la mémoire de l'image source
imagedestroy($source);

// Sauvegarder le thumbnail en cache
imagejpeg($resized, $thumbnailPath, THUMBNAIL_QUALITY);

// Servir le thumbnail
header('Content-Type: image/jpeg');
header('Content-Length: ' . filesize($thumbnailPath));
imagejpeg($resized, null, THUMBNAIL_QUALITY);

// Libérer la mémoire
imagedestroy($resized);
