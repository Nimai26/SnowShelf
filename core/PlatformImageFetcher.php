<?php
/**
 * PlatformImageFetcher - Récupération automatique d'images de plateformes
 * 
 * Sources:
 * - IGDB (Twitch) : Logos haute qualité
 * - Wikimedia Commons : Images de consoles physiques
 * 
 * @author SnowShelf
 * @version 1.0
 */

class PlatformImageFetcher {
    
    private PDO $pdo;
    private PDO $pdoPlatform;
    private string $storagePath;
    private ?string $igdbToken = null;
    private ?string $igdbClientId = null;
    private int $userId;
    
    // Configuration
    private const IGDB_TOKEN_URL = 'https://id.twitch.tv/oauth2/token';
    private const IGDB_API_URL = 'https://api.igdb.com/v4';
    private const IGDB_IMAGE_URL = 'https://images.igdb.com/igdb/image/upload';
    private const WIKIMEDIA_API_URL = 'https://commons.wikimedia.org/w/api.php';
    
    // Tailles d'images IGDB disponibles
    private const IGDB_SIZES = [
        'thumb' => 't_thumb',           // 90x90
        'small' => 't_cover_small',     // 90x128
        'medium' => 't_logo_med',       // 284x160
        'big' => 't_cover_big',         // 264x374
        '720p' => 't_720p',             // 1280x720
        '1080p' => 't_1080p'            // 1920x1080
    ];
    
    /**
     * Constructeur
     * 
     * @param int $userId ID de l'utilisateur pour récupérer les clés API
     */
    public function __construct(int $userId = 4) {
        require_once __DIR__ . '/../config/database.php';
        
        $this->pdo = getDbConnection();
        $this->pdoPlatform = getPlatformDbConnection();
        $this->userId = $userId;
        $this->storagePath = __DIR__ . '/../storage/VG_DB/Platforms';
        
        // S'assurer que le dossier de stockage existe
        if (!is_dir($this->storagePath)) {
            mkdir($this->storagePath, 0755, true);
        }
    }
    
    /**
     * Récupérer les clés IGDB de l'utilisateur
     */
    private function loadIgdbCredentials(): bool {
        $stmt = $this->pdo->prepare("
            SELECT ua.api_key, ua.Cliend_ID_Token 
            FROM users_api ua 
            JOIN Admin_webApi wa ON ua.webapi_id = wa.id 
            WHERE ua.user_id = ? AND wa.name = 'igdb'
        ");
        $stmt->execute([$this->userId]);
        $creds = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$creds || !$creds['api_key'] || !$creds['Cliend_ID_Token']) {
            return false;
        }
        
        $this->igdbClientId = $creds['Cliend_ID_Token'];
        
        // Obtenir le token OAuth
        $ch = curl_init(self::IGDB_TOKEN_URL);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
            'client_id' => $creds['Cliend_ID_Token'],
            'client_secret' => $creds['api_key'],
            'grant_type' => 'client_credentials'
        ]));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 200) {
            return false;
        }
        
        $result = json_decode($response, true);
        if (!isset($result['access_token'])) {
            return false;
        }
        
        $this->igdbToken = $result['access_token'];
        return true;
    }
    
    /**
     * Exécuter une requête IGDB
     */
    private function igdbQuery(string $endpoint, string $query): ?array {
        if (!$this->igdbToken && !$this->loadIgdbCredentials()) {
            return null;
        }
        
        $ch = curl_init(self::IGDB_API_URL . '/' . $endpoint);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $query);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 15);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Client-ID: ' . $this->igdbClientId,
            'Authorization: Bearer ' . $this->igdbToken,
            'Content-Type: text/plain'
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 200) {
            return null;
        }
        
        return json_decode($response, true);
    }
    
    /**
     * Rechercher le logo d'une plateforme sur IGDB
     * 
     * @param string $platformName Nom de la plateforme
     * @param string $size Taille de l'image (thumb, small, medium, big, 720p, 1080p)
     * @return array|null Informations sur le logo
     */
    public function searchIgdbLogo(string $platformName, string $size = '720p'): ?array {
        $query = 'fields id, name, slug, platform_logo.image_id; ';
        $query .= 'search "' . addslashes($platformName) . '"; ';
        $query .= 'limit 1;';
        
        $result = $this->igdbQuery('platforms', $query);
        
        if (empty($result) || !isset($result[0]['platform_logo']['image_id'])) {
            return null;
        }
        
        $platform = $result[0];
        $imageId = $platform['platform_logo']['image_id'];
        $sizePrefix = self::IGDB_SIZES[$size] ?? self::IGDB_SIZES['720p'];
        
        return [
            'igdb_id' => $platform['id'],
            'name' => $platform['name'],
            'slug' => $platform['slug'] ?? null,
            'image_id' => $imageId,
            'url' => self::IGDB_IMAGE_URL . "/{$sizePrefix}/{$imageId}.png",
            'source' => 'igdb'
        ];
    }
    
    /**
     * Rechercher une image de console sur Wikimedia Commons
     * 
     * @param string $platformName Nom de la plateforme
     * @return array|null Informations sur l'image
     */
    public function searchWikimediaConsole(string $platformName): ?array {
        // Termes de recherche à essayer
        $searchTerms = [
            $platformName . ' console',
            $platformName . ' system',
            $platformName . ' hardware',
            $platformName . ' set'
        ];
        
        foreach ($searchTerms as $search) {
            $url = self::WIKIMEDIA_API_URL . '?' . http_build_query([
                'action' => 'query',
                'list' => 'search',
                'srsearch' => $search,
                'srnamespace' => '6', // File namespace
                'srlimit' => '15',
                'format' => 'json'
            ]);
            
            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_USERAGENT, 'SnowShelf/1.0 (https://snowshelf.snowmanprod.fr)');
            curl_setopt($ch, CURLOPT_TIMEOUT, 10);
            $response = curl_exec($ch);
            curl_close($ch);
            
            $data = json_decode($response, true);
            
            if (!isset($data['query']['search'])) {
                continue;
            }
            
            foreach ($data['query']['search'] as $result) {
                $filename = $result['title'];
                $lowerFilename = strtolower($filename);
                
                // Exclure les fichiers non-image (PDF, SVG, etc.)
                if (preg_match('/\.(pdf|svg|ogg|ogv|webm|mp3|mp4|wav|gif)$/i', $lowerFilename)) continue;
                
                // Exclure les logos et fichiers non pertinents
                if (strpos($lowerFilename, 'logo') !== false) continue;
                if (strpos($lowerFilename, 'icon') !== false) continue;
                if (strpos($lowerFilename, 'wordmark') !== false) continue;
                if (strpos($lowerFilename, 'screenshot') !== false) continue;
                if (strpos($lowerFilename, 'game') !== false && strpos($lowerFilename, 'console') === false) continue;
                
                // Accepter uniquement les formats image courants
                if (!preg_match('/\.(jpg|jpeg|png|webp)$/i', $lowerFilename)) continue;
                
                // Préférer les fichiers avec des mots-clés pertinents
                $isGoodCandidate = (
                    strpos($lowerFilename, 'console') !== false ||
                    strpos($lowerFilename, '-set') !== false ||
                    strpos($lowerFilename, '_set') !== false ||
                    strpos($lowerFilename, 'controller') !== false ||
                    strpos($lowerFilename, 'docked') !== false ||
                    strpos($lowerFilename, 'hardware') !== false ||
                    strpos($lowerFilename, 'system') !== false
                );
                
                if ($isGoodCandidate) {
                    $imageInfo = $this->getWikimediaImageUrl($filename);
                    if ($imageInfo) {
                        return [
                            'filename' => $filename,
                            'url' => $imageInfo['url'],
                            'width' => $imageInfo['width'],
                            'height' => $imageInfo['height'],
                            'source' => 'wikimedia'
                        ];
                    }
                }
            }
            
            usleep(100000); // Rate limiting
        }
        
        return null;
    }
    
    /**
     * Obtenir l'URL directe d'une image Wikimedia Commons
     */
    private function getWikimediaImageUrl(string $filename): ?array {
        $url = self::WIKIMEDIA_API_URL . '?' . http_build_query([
            'action' => 'query',
            'titles' => $filename,
            'prop' => 'imageinfo',
            'iiprop' => 'url|size',
            'format' => 'json'
        ]);
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_USERAGENT, 'SnowShelf/1.0');
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        $response = curl_exec($ch);
        curl_close($ch);
        
        $data = json_decode($response, true);
        
        if (isset($data['query']['pages'])) {
            foreach ($data['query']['pages'] as $page) {
                if (isset($page['imageinfo'][0])) {
                    return $page['imageinfo'][0];
                }
            }
        }
        
        return null;
    }
    
    /**
     * Télécharger une image
     * 
     * @param string $url URL de l'image
     * @param string $destPath Chemin de destination
     * @return int|false Taille du fichier ou false en cas d'erreur
     */
    private function downloadImage(string $url, string $destPath) {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_USERAGENT, 'SnowShelf/1.0');
        curl_setopt($ch, CURLOPT_TIMEOUT, 60);
        
        $data = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
        curl_close($ch);
        
        if ($httpCode !== 200 || !$data) {
            return false;
        }
        
        // Vérifier que c'est bien une image (pas un PDF ou autre)
        $allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        $mimeType = explode(';', $contentType)[0]; // Enlever charset si présent
        if (!in_array($mimeType, $allowedMimeTypes)) {
            // Log pour debug
            error_log("PlatformImageFetcher: Rejected file from $url - MIME type: $contentType");
            return false;
        }
        
        // Créer le dossier si nécessaire
        $dir = dirname($destPath);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
        
        file_put_contents($destPath, $data);
        return filesize($destPath);
    }
    
    /**
     * Récupérer les images d'une plateforme (preview sans téléchargement)
     * 
     * @param int $platformId ID de la plateforme
     * @return array Résultat de la recherche
     */
    public function previewPlatformImages(int $platformId): array {
        // Récupérer les infos de la plateforme
        $stmt = $this->pdoPlatform->prepare("SELECT id, name, manufacturer FROM Platform WHERE id = ?");
        $stmt->execute([$platformId]);
        $platform = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$platform) {
            return ['success' => false, 'error' => 'Plateforme non trouvée'];
        }
        
        $result = [
            'success' => true,
            'platform' => $platform,
            'logo' => null,
            'console' => null
        ];
        
        // Rechercher le logo sur IGDB
        $logo = $this->searchIgdbLogo($platform['name']);
        if ($logo) {
            $result['logo'] = $logo;
        }
        
        usleep(300000); // Rate limiting IGDB
        
        // Rechercher l'image console sur Wikimedia
        $console = $this->searchWikimediaConsole($platform['name']);
        if ($console) {
            $result['console'] = $console;
        }
        
        return $result;
    }
    
    /**
     * Récupérer et télécharger les images d'une plateforme
     * 
     * @param int $platformId ID de la plateforme
     * @param bool $overwrite Écraser les images existantes
     * @return array Résultat du téléchargement
     */
    public function fetchPlatformImages(int $platformId, bool $overwrite = false): array {
        // Récupérer les infos de la plateforme
        $stmt = $this->pdoPlatform->prepare("SELECT id, name, manufacturer, img_logo, img_console FROM Platform WHERE id = ?");
        $stmt->execute([$platformId]);
        $platform = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$platform) {
            return ['success' => false, 'error' => 'Plateforme non trouvée'];
        }
        
        $platformDir = $this->storagePath . '/' . $platformId;
        
        $result = [
            'success' => true,
            'platform_id' => $platformId,
            'platform_name' => $platform['name'],
            'logo' => null,
            'console' => null
        ];
        
        // Logo
        $hasLogo = !empty($platform['img_logo']) && file_exists("$platformDir/{$platform['img_logo']}");
        if (!$hasLogo || $overwrite) {
            $logo = $this->searchIgdbLogo($platform['name']);
            if ($logo) {
                $destPath = "$platformDir/logo.png";
                $size = $this->downloadImage($logo['url'], $destPath);
                if ($size) {
                    $result['logo'] = [
                        'url' => $logo['url'],
                        'size' => $size,
                        'source' => 'igdb',
                        'filename' => 'logo.png'
                    ];
                    // Mettre à jour img_logo
                    $stmt = $this->pdoPlatform->prepare('UPDATE Platform SET img_logo = ? WHERE id = ?');
                    $stmt->execute(['logo.png', $platformId]);
                }
            }
            usleep(300000);
        } else {
            $result['logo'] = ['skipped' => true, 'reason' => 'exists'];
        }
        
        // Console
        $hasConsole = !empty($platform['img_console']);
        // Vérifier si le fichier existe (gérer les cas où c'est une URL ou un nom de fichier)
        if ($hasConsole) {
            $consoleFile = $platform['img_console'];
            if (!str_starts_with($consoleFile, '/')) {
                $hasConsole = file_exists("$platformDir/$consoleFile");
            }
        }
        
        if (!$hasConsole || $overwrite) {
            // Supprimer l'ancienne image console si on écrase
            if ($overwrite) {
                foreach (glob("$platformDir/console.*") as $oldFile) {
                    unlink($oldFile);
                }
            }
            
            $console = $this->searchWikimediaConsole($platform['name']);
            if ($console) {
                $ext = strtolower(pathinfo(parse_url($console['url'], PHP_URL_PATH), PATHINFO_EXTENSION));
                $ext = $ext ?: 'jpg';
                $consoleFilename = "console.$ext";
                $destPath = "$platformDir/$consoleFilename";
                $size = $this->downloadImage($console['url'], $destPath);
                if ($size) {
                    $result['console'] = [
                        'url' => $console['url'],
                        'size' => $size,
                        'filename' => $consoleFilename,
                        'source' => 'wikimedia'
                    ];
                    // Mettre à jour img_console
                    $stmt = $this->pdoPlatform->prepare('UPDATE Platform SET img_console = ? WHERE id = ?');
                    $stmt->execute([$consoleFilename, $platformId]);
                }
            }
        } else {
            $result['console'] = ['skipped' => true, 'reason' => 'exists'];
        }
        
        return $result;
    }
    
    /**
     * Récupérer les images de plusieurs plateformes (batch)
     * 
     * @param array|null $platformIds Liste des IDs (null = toutes sans images)
     * @param callable|null $progressCallback Callback pour la progression
     * @param bool $overwrite Écraser les images existantes
     * @return array Résultats
     */
    public function fetchBatch(?array $platformIds = null, ?callable $progressCallback = null, bool $overwrite = false): array {
        // Si pas d'IDs spécifiés, récupérer les plateformes sans images (ni logo ni console)
        if ($platformIds === null) {
            $stmt = $this->pdoPlatform->query("
                SELECT id FROM Platform 
                WHERE (img_logo IS NULL OR img_logo = '')
                   OR (img_console IS NULL OR img_console = '')
                ORDER BY name
            ");
            $platformIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
        }
        
        $total = count($platformIds);
        $results = [
            'total' => $total,
            'success' => 0,
            'failed' => 0,
            'skipped' => 0,
            'details' => []
        ];
        
        foreach ($platformIds as $index => $platformId) {
            try {
                $result = $this->fetchPlatformImages($platformId, $overwrite);
                
                if ($result['success']) {
                    if ($result['logo'] || $result['console']) {
                        $results['success']++;
                    } else {
                        $results['skipped']++;
                    }
                } else {
                    $results['failed']++;
                }
                
                $results['details'][$platformId] = $result;
                
                // Callback de progression
                if ($progressCallback) {
                    $progressCallback([
                        'current' => $index + 1,
                        'total' => $total,
                        'platform_id' => $platformId,
                        'platform_name' => $result['platform_name'] ?? 'Unknown',
                        'result' => $result
                    ]);
                }
                
            } catch (Exception $e) {
                $results['failed']++;
                $results['details'][$platformId] = [
                    'success' => false,
                    'error' => $e->getMessage()
                ];
            }
            
            // Pause entre les plateformes pour éviter le rate limiting
            usleep(500000); // 500ms
        }
        
        return $results;
    }
    
    /**
     * Obtenir les statistiques des images
     */
    public function getStats(): array {
        $stats = [
            'total' => 0,
            'with_logo' => 0,
            'with_console' => 0,
            'without_images' => 0,
            'with_both' => 0
        ];
        
        $stmt = $this->pdoPlatform->query("SELECT COUNT(*) FROM Platform");
        $stats['total'] = (int) $stmt->fetchColumn();
        
        $stmt = $this->pdoPlatform->query("
            SELECT COUNT(*) FROM Platform 
            WHERE img_logo IS NOT NULL AND img_logo != ''
        ");
        $stats['with_logo'] = (int) $stmt->fetchColumn();
        
        $stmt = $this->pdoPlatform->query("
            SELECT COUNT(*) FROM Platform 
            WHERE img_console IS NOT NULL AND img_console != ''
        ");
        $stats['with_console'] = (int) $stmt->fetchColumn();
        
        $stmt = $this->pdoPlatform->query("
            SELECT COUNT(*) FROM Platform 
            WHERE (img_logo IS NULL OR img_logo = '')
            AND (img_console IS NULL OR img_console = '')
        ");
        $stats['without_images'] = (int) $stmt->fetchColumn();
        
        $stmt = $this->pdoPlatform->query("
            SELECT COUNT(*) FROM Platform 
            WHERE img_logo IS NOT NULL AND img_logo != ''
            AND img_console IS NOT NULL AND img_console != ''
        ");
        $stats['with_both'] = (int) $stmt->fetchColumn();
        
        return $stats;
    }
}
