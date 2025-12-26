<?php
/**
 * Proxy de téléchargement pour contourner les restrictions CORS
 * Permet de télécharger des images/documents depuis des serveurs externes
 * 
 * Deux modes de fonctionnement :
 * - Petit fichier (<50 Mo) : retourne le contenu en base64 (méthode classique)
 * - Gros fichier (>50 Mo) : streaming vers fichier temporaire + retourne un token
 * 
 * @endpoint POST /api/proxy-download.php
 * @param string url - URL du fichier à télécharger
 * @param string type - Type de fichier attendu ('image' ou 'document')
 * @return JSON avec le fichier en base64 OU un token pour récupérer le fichier
 * 
 * @endpoint GET /api/proxy-download.php?token=xxx
 * @param string token - Token du fichier temporaire à récupérer
 * @return Le fichier binaire directement (streaming)
 */

// Augmenter la limite mémoire pour les fichiers moyens
ini_set('memory_limit', '256M');

// Augmenter le temps d'exécution pour les gros téléchargements
set_time_limit(300); // 5 minutes

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../core/ApiAuth.php';
require_once __DIR__ . '/../../core/i18n.php';
require_once __DIR__ . '/../../core/logger.php';

// Dossier pour les fichiers temporaires
define('PROXY_TEMP_DIR', __DIR__ . '/../../storage/temp/proxy/');

// Seuil pour passer en mode streaming (50 Mo)
define('STREAMING_THRESHOLD', 50 * 1024 * 1024);

// Taille maximale absolue (1 Go pour les vidéos)
define('MAX_FILE_SIZE', 1024 * 1024 * 1024);

// Durée de vie des fichiers temporaires (1 heure)
define('TEMP_FILE_TTL', 3600);

/**
 * Nettoie les anciens fichiers temporaires
 */
function cleanupTempFiles() {
    if (!is_dir(PROXY_TEMP_DIR)) return;
    
    $files = glob(PROXY_TEMP_DIR . '*');
    $now = time();
    
    foreach ($files as $file) {
        if (is_file($file) && ($now - filemtime($file)) > TEMP_FILE_TTL) {
            @unlink($file);
        }
    }
}

/**
 * Génère un token unique pour un fichier temporaire
 */
function generateToken() {
    return bin2hex(random_bytes(32));
}

/**
 * Retourne le chemin du fichier temporaire pour un token
 */
function getTempFilePath($token, $extension = '') {
    // Valider le token (64 caractères hexadécimaux)
    if (!preg_match('/^[a-f0-9]{64}$/', $token)) {
        return null;
    }
    return PROXY_TEMP_DIR . $token . ($extension ? '.' . $extension : '');
}

// ============================================================================
// GESTION DES REQUÊTES GET (récupération d'un fichier temporaire OU image preview)
// ============================================================================

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Mode 1: Récupération via token (fichiers temporaires)
    if (isset($_GET['token'])) {
        $token = $_GET['token'];
        
        // Trouver le fichier avec ce token (peut avoir différentes extensions)
        $files = glob(PROXY_TEMP_DIR . $token . '.*');
        // Exclure le fichier .meta
        $files = array_filter($files, fn($f) => !str_ends_with($f, '.meta'));
        
        if (empty($files) || !is_file(reset($files))) {
            http_response_code(404);
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'error' => 'Fichier non trouvé ou expiré']);
            exit;
        }
        
        $filePath = reset($files);
        $extension = pathinfo($filePath, PATHINFO_EXTENSION);
        
        // Lire les métadonnées
        $metaPath = PROXY_TEMP_DIR . $token . '.meta';
        $metadata = [];
        if (file_exists($metaPath)) {
            $metadata = json_decode(file_get_contents($metaPath), true) ?: [];
        }
        
        $filename = $metadata['filename'] ?? ('download.' . $extension);
        $mimeType = $metadata['mimeType'] ?? 'application/octet-stream';
        $fileSize = filesize($filePath);
        
        // Envoyer le fichier en streaming
        header('Content-Type: ' . $mimeType);
        header('Content-Length: ' . $fileSize);
        header('Content-Disposition: attachment; filename="' . addslashes($filename) . '"');
        header('Cache-Control: no-cache, must-revalidate');
        header('Access-Control-Allow-Origin: *');
        
        // Streaming par chunks
        $handle = fopen($filePath, 'rb');
        while (!feof($handle)) {
            echo fread($handle, 8192);
            flush();
        }
        fclose($handle);
        
        // Supprimer le fichier après téléchargement
        @unlink($filePath);
        @unlink($metaPath);
        
        exit;
    }
    
    // Mode 2: Preview d'image via URL (pour les résultats de recherche WebSearch)
    // Pas d'authentification requise, mais limité aux images et domaines whitelist
    if (isset($_GET['url']) && isset($_GET['mode']) && $_GET['mode'] === 'image') {
        $url = $_GET['url'];
        
        // Valider l'URL
        if (!filter_var($url, FILTER_VALIDATE_URL)) {
            http_response_code(400);
            header('Content-Type: image/svg+xml');
            echo '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="10" y="50" fill="#666">Invalid URL</text></svg>';
            exit;
        }
        
        // Vérifier que le domaine est dans la whitelist
        $host = parse_url($url, PHP_URL_HOST);
        $allowedDomains = [
            'comicvine.gamespot.com', 'www.gamespot.com',
            'archive.org', 'ia800', 'ia600',
            'coverartarchive.org',
            'covers.openlibrary.org', 'openlibrary.org',
            'musicbrainz.org',
            'images-na.ssl-images-amazon.com', 'images-eu.ssl-images-amazon.com',
            'm.media-amazon.com',
            'image.tmdb.org', 'themoviedb.org',
            'thetvdb.com', 'artworks.thetvdb.com',
            'media.rawg.io',
            'cdn.myanimelist.net',
            'uploads.mangadex.org',
            'static.wikia.nocookie.net',
            'cdn.rebrickable.com',
            'images.brickset.com',
            'img.bricklink.com',
            'images.lego.com',
            'lego.com'
        ];
        
        $isAllowed = false;
        foreach ($allowedDomains as $domain) {
            if (str_contains($host, $domain)) {
                $isAllowed = true;
                break;
            }
        }
        
        if (!$isAllowed) {
            http_response_code(403);
            header('Content-Type: image/svg+xml');
            echo '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="10" y="50" fill="#666">Forbidden</text></svg>';
            exit;
        }
        
        // Télécharger l'image avec timeout court
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS => 5,
            CURLOPT_TIMEOUT => 10,
            CURLOPT_CONNECTTIMEOUT => 5,
            CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
            CURLOPT_HTTPHEADER => [
                'Accept: image/webp,image/apng,image/*,*/*;q=0.8',
                'Accept-Language: en-US,en;q=0.9,fr;q=0.8',
            ],
            CURLOPT_SSL_VERIFYPEER => true,
        ]);
        
        $imageData = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
        curl_close($ch);
        
        if ($httpCode !== 200 || empty($imageData)) {
            http_response_code(404);
            header('Content-Type: image/svg+xml');
            echo '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="#333"/><text x="50" y="55" fill="#666" text-anchor="middle" font-size="12">No image</text></svg>';
            exit;
        }
        
        // Vérifier que c'est bien une image
        if (!str_starts_with($contentType, 'image/')) {
            http_response_code(415);
            header('Content-Type: image/svg+xml');
            echo '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><text x="10" y="50" fill="#666">Not an image</text></svg>';
            exit;
        }
        
        // Envoyer l'image avec cache
        header('Content-Type: ' . $contentType);
        header('Content-Length: ' . strlen($imageData));
        header('Cache-Control: public, max-age=86400'); // Cache 24h
        header('Access-Control-Allow-Origin: *');
        echo $imageData;
        exit;
    }
    
    // GET sans token ni url valide = erreur
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'Paramètres manquants (token ou url+mode=image)']);
    exit;
}

// ============================================================================
// HEADERS CORS ET JSON POUR LES AUTRES REQUÊTES
// ============================================================================

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Authorization');

// Gérer les requêtes OPTIONS (preflight CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ============================================================================
// INITIALISATION ET AUTHENTIFICATION
// ============================================================================

try {
    $db = getDbConnection();
    $auth = new ApiAuth($db);
} catch (Exception $e) {
    loger('proxy-download', 'ERROR', 'Erreur initialisation', ['error' => $e->getMessage()]);
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur serveur']);
    exit;
}

// Vérifier l'authentification
$currentUser = $auth->authenticate();
if (!$currentUser) {
    $auth->sendUnauthorized('Authentification requise');
}

// Uniquement POST pour le téléchargement
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Méthode non autorisée']);
    exit;
}

// Nettoyer les anciens fichiers temporaires (1 fois sur 10 requêtes)
if (rand(1, 10) === 1) {
    cleanupTempFiles();
}

// ============================================================================
// RÉCUPÉRATION ET VALIDATION DES DONNÉES
// ============================================================================

$input = json_decode(file_get_contents('php://input'), true);
$url = $input['url'] ?? null;
$type = $input['type'] ?? 'image';

if (!$url) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'URL manquante']);
    exit;
}

// Nettoyer et valider l'URL
$url = str_replace(' ', '%20', $url);

if (!filter_var($url, FILTER_VALIDATE_URL)) {
    loger('proxy-download', 'WARNING', 'URL invalide', ['url' => $url]);
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'URL invalide']);
    exit;
}

// Limiter aux protocoles HTTP/HTTPS
$parsedUrl = parse_url($url);
if (!in_array($parsedUrl['scheme'] ?? '', ['http', 'https'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Protocole non supporté']);
    exit;
}

// ============================================================================
// LISTE BLANCHE DES DOMAINES
// ============================================================================

$allowedDomains = [
    // Albums/Stickers - Paninimania
    'paninimania.com', 'www.paninimania.com',
    
    // Livres - Google Books
    'books.google.com', 'books.googleusercontent.com',
    
    // Livres - OpenLibrary
    'covers.openlibrary.org', 'openlibrary.org',
    
    // Livres - Amazon (couvertures)
    'images-na.ssl-images-amazon.com', 'images-eu.ssl-images-amazon.com', 'm.media-amazon.com',
    
    // Livres - ComicVine
    'comicvine.gamespot.com', 'www.gamespot.com',
    
    // Livres/Manga - MangaDex
    'uploads.mangadex.org', 'mangadex.org',
    
    // Livres/BD - Bédéthèque
    'www.bedetheque.com', 'bedetheque.com',
    
    // Anime/Manga - Jikan (MyAnimeList)
    'cdn.myanimelist.net', 'myanimelist.net',
    
    // Jeux vidéo - RAWG
    'media.rawg.io',
    
    // Jeux vidéo - IGDB
    'images.igdb.com',
    
    // Jeux vidéo / Consoles - ConsoleVariations
    'consolevariations.com', 'cdn.consolevariations.com',
    
    // Jeux vidéo - JeuxVideo.com
    'www.jeuxvideo.com', 'jeuxvideo.com', 'image.jeuxvideo.com',
    
    // Films/Séries - TMDB
    'image.tmdb.org',
    
    // Films/Séries - TheTVDB
    'artworks.thetvdb.com', 'thetvdb.com',
    
    // Films/Séries - IMDB
    'www.imdb.com', 'imdb.com', 'ia.media-imdb.com',
    
    // LEGO Official
    'www.lego.com', 'lego.com', 'sh-s7-live-s.legocdn.com', 'assets.lego.com',
    
    // LEGO - Rebrickable
    'cdn.rebrickable.com', 'rebrickable.com', 'www.rebrickable.com',
    
    // LEGO - Brickset/Bricklink
    'images.brickset.com', 'brickset.com', 'img.bricklink.com', 'bricklink.com',
    
    // LEGO - Mega Construx
    'megaconstrux.com', 'www.megaconstrux.com',
    
    // Figurines/Jouets - Coleka
    'www.coleka.com', 'coleka.com', 'static.coleka.com', 'thumbs.coleka.com',
    
    // Figurines/Jouets - Lulu-Berlu
    'www.lulu-berlu.com', 'lulu-berlu.com',
    
    // Figurines/Jouets - Transformerland
    'www.transformerland.com', 'transformerland.com',
    
    // Musique - MusicBrainz/CoverArtArchive
    'coverartarchive.org', 'archive.org', 'musicbrainz.org',
    
    // CDN génériques / CloudFront
    'cloudfront.net', 'd1w7fb2mkkr3kw.cloudfront.net',
    
    // YouTube (thumbnails)
    'i.ytimg.com', 'img.youtube.com',
    
    // Générique / Wikimedia
    'upload.wikimedia.org', 'commons.wikimedia.org',
    
    // Steam
    'steamcdn-a.akamaihd.net', 'cdn.akamai.steamstatic.com',
    
    // Vimeo
    'i.vimeocdn.com', 'vimeocdn.com',
];

// Vérifier le domaine
$host = strtolower($parsedUrl['host'] ?? '');
$isAllowed = false;

foreach ($allowedDomains as $domain) {
    if ($host === $domain || str_ends_with($host, '.' . $domain)) {
        $isAllowed = true;
        break;
    }
}

if (!$isAllowed) {
    loger('proxy-download', 'WARNING', 'Domaine non autorisé', ['url' => $url, 'host' => $host]);
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Domaine non autorisé: ' . $host]);
    exit;
}

// ============================================================================
// TYPES MIME AUTORISÉS
// ============================================================================

$allowedMimeTypes = [
    'image' => ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml', 'image/bmp'],
    'document' => ['application/pdf', 'application/zip', 'text/plain', 'application/msword', 
                   'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    'video' => ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo'],
];

// ============================================================================
// TÉLÉCHARGEMENT DU FICHIER
// ============================================================================

try {
    // Créer le dossier temporaire si nécessaire
    if (!is_dir(PROXY_TEMP_DIR)) {
        mkdir(PROXY_TEMP_DIR, 0755, true);
    }
    
    // Générer un token unique
    $token = generateToken();
    
    // D'abord, faire une requête HEAD pour connaître la taille
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_NOBODY => true,
        CURLOPT_HEADER => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS => 5,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    ]);
    
    curl_exec($ch);
    $contentLength = curl_getinfo($ch, CURLINFO_CONTENT_LENGTH_DOWNLOAD);
    $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    // Si HEAD échoue ou ne retourne pas la taille, on continue quand même
    $useStreaming = ($contentLength > STREAMING_THRESHOLD) || ($contentLength < 0 && $type !== 'image');
    
    // Vérifier la taille maximale
    if ($contentLength > MAX_FILE_SIZE) {
        $sizeMo = round($contentLength / 1024 / 1024);
        loger('proxy-download', 'WARNING', 'Fichier trop volumineux', ['url' => $url, 'size' => $sizeMo . ' Mo']);
        http_response_code(413);
        echo json_encode(['success' => false, 'error' => "Fichier trop volumineux ({$sizeMo} Mo). Limite: 1 Go."]);
        exit;
    }
    
    // Déterminer l'extension depuis Content-Type ou URL
    $extension = '';
    $pathInfo = pathinfo($parsedUrl['path'] ?? '');
    if (!empty($pathInfo['extension'])) {
        $extension = strtolower($pathInfo['extension']);
    } else {
        $mimeToExt = [
            'image/jpeg' => 'jpg', 'image/png' => 'png', 'image/gif' => 'gif',
            'image/webp' => 'webp', 'application/pdf' => 'pdf', 'video/mp4' => 'mp4',
        ];
        if ($contentType) {
            $mime = explode(';', $contentType)[0];
            $extension = $mimeToExt[$mime] ?? '';
        }
    }
    
    // ========================================================================
    // MODE STREAMING (gros fichiers)
    // ========================================================================
    
    if ($useStreaming) {
        loger('proxy-download', 'INFO', 'Téléchargement en mode streaming', [
            'url' => $url,
            'expected_size' => $contentLength > 0 ? round($contentLength / 1024 / 1024, 2) . ' Mo' : 'inconnue'
        ]);
        
        $tempFile = getTempFilePath($token, $extension);
        $fp = fopen($tempFile, 'wb');
        
        if (!$fp) {
            throw new Exception('Impossible de créer le fichier temporaire');
        }
        
        $downloadedSize = 0;
        
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_FILE => $fp,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_MAXREDIRS => 5,
            CURLOPT_TIMEOUT => 300, // 5 minutes pour les gros fichiers
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            CURLOPT_NOPROGRESS => false,
            CURLOPT_PROGRESSFUNCTION => function($resource, $downloadSize, $downloaded) use (&$downloadedSize) {
                $downloadedSize = $downloaded;
                // Vérifier la limite
                if ($downloaded > MAX_FILE_SIZE) {
                    return 1; // Abort
                }
                return 0;
            },
        ]);
        
        $result = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $finalContentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
        $error = curl_error($ch);
        curl_close($ch);
        fclose($fp);
        
        // Vérifier les erreurs
        if ($result === false || $httpCode !== 200) {
            @unlink($tempFile);
            
            if (strpos($error, 'Callback aborted') !== false) {
                $sizeMo = round($downloadedSize / 1024 / 1024);
                loger('proxy-download', 'WARNING', 'Fichier trop volumineux (streaming)', ['url' => $url, 'size' => $sizeMo . ' Mo']);
                http_response_code(413);
                echo json_encode(['success' => false, 'error' => "Fichier trop volumineux ({$sizeMo} Mo). Limite: 1 Go."]);
            } else {
                loger('proxy-download', 'ERROR', 'Échec téléchargement streaming', ['url' => $url, 'http_code' => $httpCode, 'error' => $error]);
                http_response_code(502);
                echo json_encode(['success' => false, 'error' => 'Échec du téléchargement: ' . ($error ?: "HTTP $httpCode")]);
            }
            exit;
        }
        
        $fileSize = filesize($tempFile);
        
        // Déterminer le type MIME final
        $mimeType = $finalContentType ? explode(';', $finalContentType)[0] : 'application/octet-stream';
        
        // Générer le nom de fichier
        $filename = $pathInfo['basename'] ?? 'download';
        $filename = explode('?', $filename)[0];
        $filename = urldecode($filename);
        
        // Sauvegarder les métadonnées
        $metaPath = PROXY_TEMP_DIR . $token . '.meta';
        file_put_contents($metaPath, json_encode([
            'filename' => $filename,
            'mimeType' => $mimeType,
            'size' => $fileSize,
            'created' => time(),
        ]));
        
        loger('proxy-download', 'INFO', 'Fichier streaming prêt', [
            'url' => $url,
            'size' => round($fileSize / 1024 / 1024, 2) . ' Mo',
            'token' => substr($token, 0, 8) . '...'
        ]);
        
        // Retourner le token pour récupérer le fichier
        echo json_encode([
            'success' => true,
            'mode' => 'streaming',
            'token' => $token,
            'mimeType' => $mimeType,
            'filename' => $filename,
            'size' => $fileSize
        ]);
        exit;
    }
    
    // ========================================================================
    // MODE BASE64 (petits fichiers)
    // ========================================================================
    
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS => 5,
        CURLOPT_TIMEOUT => 120,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_USERAGENT => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    ]);
    
    $content = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $finalContentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($content === false || $httpCode !== 200) {
        $errorMsg = $error ?: "HTTP $httpCode";
        loger('proxy-download', 'ERROR', 'Échec téléchargement', ['url' => $url, 'error' => $errorMsg]);
        http_response_code($httpCode === 404 ? 404 : 502);
        echo json_encode(['success' => false, 'error' => 'Échec du téléchargement: ' . $errorMsg]);
        exit;
    }
    
    $size = strlen($content);
    
    // Déterminer le type MIME
    $mimeType = $finalContentType ? explode(';', $finalContentType)[0] : 'application/octet-stream';
    
    // Si le Content-Type est générique, essayer de deviner
    if ($mimeType === 'application/octet-stream' || empty($mimeType)) {
        $extensionMap = [
            'jpg' => 'image/jpeg', 'jpeg' => 'image/jpeg', 'png' => 'image/png',
            'gif' => 'image/gif', 'webp' => 'image/webp', 'pdf' => 'application/pdf',
            'zip' => 'application/zip', 'mp4' => 'video/mp4',
        ];
        $mimeType = $extensionMap[$extension] ?? 'application/octet-stream';
    }
    
    // Vérifier le type MIME
    $allowedForType = $allowedMimeTypes[$type] ?? $allowedMimeTypes['image'];
    if (!in_array($mimeType, $allowedForType)) {
        if ($type === 'image') {
            $finfo = new finfo(FILEINFO_MIME_TYPE);
            $detectedMime = $finfo->buffer($content);
            if (!in_array($detectedMime, $allowedForType)) {
                loger('proxy-download', 'WARNING', 'Type MIME non autorisé', ['url' => $url, 'mime' => $detectedMime]);
                http_response_code(415);
                echo json_encode(['success' => false, 'error' => 'Type de fichier non autorisé: ' . $detectedMime]);
                exit;
            }
            $mimeType = $detectedMime;
        }
    }
    
    // Générer le nom de fichier
    $filename = $pathInfo['basename'] ?? 'file';
    $filename = explode('?', $filename)[0];
    $filename = urldecode($filename);
    
    // Ajouter extension si manquante
    if (empty($pathInfo['extension'])) {
        $extMap = [
            'image/jpeg' => 'jpg', 'image/png' => 'png', 'image/gif' => 'gif',
            'image/webp' => 'webp', 'application/pdf' => 'pdf', 'video/mp4' => 'mp4',
        ];
        $filename .= '.' . ($extMap[$mimeType] ?? 'bin');
    }
    
    // Encoder en base64
    $base64 = base64_encode($content);
    
    loger('proxy-download', 'INFO', 'Fichier téléchargé (base64)', [
        'url' => $url,
        'size' => round($size / 1024, 1) . ' Ko',
        'filename' => $filename
    ]);
    
    echo json_encode([
        'success' => true,
        'mode' => 'base64',
        'data' => $base64,
        'mimeType' => $mimeType,
        'filename' => $filename,
        'size' => $size
    ]);
    
} catch (Exception $e) {
    loger('proxy-download', 'ERROR', 'Exception', ['url' => $url, 'error' => $e->getMessage()]);
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur interne: ' . $e->getMessage()]);
}
