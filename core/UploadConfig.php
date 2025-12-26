<?php
/**
 * UploadConfig - Gestionnaire de configuration des uploads depuis la BDD
 * 
 * Récupère les paramètres d'upload (extensions, tailles max) depuis
 * la table upload_config pour une gestion centralisée et administrable.
 * 
 * @author SnowShelf
 * @version 1.0.0
 */

class UploadConfig
{
    private static ?PDO $pdo = null;
    private static array $cache = [];
    private static bool $cacheLoaded = false;
    
    // Mapping des extensions vers types MIME
    private static array $extensionToMime = [
        // Images
        'jpg'  => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'png'  => 'image/png',
        'gif'  => 'image/gif',
        'webp' => 'image/webp',
        'avif' => 'image/avif',
        'svg'  => 'image/svg+xml',
        'ico'  => 'image/x-icon',
        'bmp'  => 'image/bmp',
        
        // Audio
        'mp3'  => 'audio/mpeg',
        'wav'  => 'audio/wav',
        'ogg'  => 'audio/ogg',
        'flac' => 'audio/flac',
        'm4a'  => 'audio/mp4',
        'aac'  => 'audio/aac',
        'wma'  => 'audio/x-ms-wma',
        
        // Vidéos
        'mp4'  => 'video/mp4',
        'webm' => 'video/webm',
        'avi'  => 'video/x-msvideo',
        'mkv'  => 'video/x-matroska',
        'mov'  => 'video/quicktime',
        'm4v'  => 'video/x-m4v',
        'ogv'  => 'video/ogg',
        'wmv'  => 'video/x-ms-wmv',
        
        // Documents
        'pdf'  => 'application/pdf',
        'doc'  => 'application/msword',
        'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'odt'  => 'application/vnd.oasis.opendocument.text',
        'txt'  => 'text/plain',
        'rtf'  => 'application/rtf',
        'epub' => 'application/epub+zip',
        'cbr'  => 'application/x-cbr',
        'cbz'  => 'application/x-cbz',
        
        // Archives
        'zip'  => 'application/zip',
        'rar'  => 'application/vnd.rar',
        '7z'   => 'application/x-7z-compressed',
        'tar'  => 'application/x-tar',
        'gz'   => 'application/gzip',
    ];
    
    // Configuration par défaut (fallback si BDD indisponible)
    private static array $defaultConfig = [
        'avatar' => [
            'extensions' => ['jpg', 'jpeg', 'png', 'gif', 'webp'],
            'max_size_mb' => 5,
        ],
        'images' => [
            'extensions' => ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'],
            'max_size_mb' => 10,
        ],
        'audio' => [
            'extensions' => ['mp3', 'wav', 'ogg', 'flac'],
            'max_size_mb' => 50,
        ],
        'videos' => [
            'extensions' => ['mp4', 'webm', 'avi', 'mkv', 'mov'],
            'max_size_mb' => 500,
        ],
        'documents' => [
            'extensions' => ['pdf', 'doc', 'docx', 'txt', 'zip'],
            'max_size_mb' => 500,
        ],
    ];

    /**
     * Initialise la connexion à la base de données
     */
    private static function initPdo(): void
    {
        if (self::$pdo !== null) {
            return;
        }
        
        try {
            $configPath = __DIR__ . '/../config/database.php';
            if (!file_exists($configPath)) {
                throw new Exception('Fichier de configuration BDD non trouvé');
            }
            
            // Inclure le fichier de configuration (définit les constantes et getDbConnection)
            require_once $configPath;
            
            // Utiliser la fonction getDbConnection si disponible
            if (function_exists('getDbConnection')) {
                self::$pdo = getDbConnection();
            } else {
                // Fallback : utiliser les constantes
                $dsn = sprintf(
                    'mysql:host=%s;port=%s;dbname=%s;charset=%s',
                    defined('DB_HOST') ? DB_HOST : '10.110.1.1',
                    defined('DB_PORT') ? DB_PORT : '3307',
                    defined('DB_NAME') ? DB_NAME : 'snowshelf',
                    defined('DB_CHARSET') ? DB_CHARSET : 'utf8mb4'
                );
                
                self::$pdo = new PDO($dsn, 
                    defined('DB_USER') ? DB_USER : 'Nimai', 
                    defined('DB_PASS') ? DB_PASS : '', 
                    [
                        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                        PDO::ATTR_EMULATE_PREPARES => false,
                    ]
                );
            }
        } catch (Exception $e) {
            error_log('[UploadConfig] Erreur connexion BDD: ' . $e->getMessage());
            self::$pdo = null;
        }
    }

    /**
     * Charge toutes les configurations depuis la BDD
     */
    private static function loadFromDatabase(): void
    {
        if (self::$cacheLoaded) {
            return;
        }
        
        self::initPdo();
        
        if (self::$pdo === null) {
            // Utiliser les valeurs par défaut
            self::$cache = self::$defaultConfig;
            self::$cacheLoaded = true;
            return;
        }
        
        try {
            $stmt = self::$pdo->query(
                'SELECT category, extensions, max_size_mb, is_active 
                 FROM upload_config 
                 WHERE is_active = 1'
            );
            
            while ($row = $stmt->fetch()) {
                $extensions = json_decode($row['extensions'], true);
                if (!is_array($extensions)) {
                    $extensions = [];
                }
                
                self::$cache[$row['category']] = [
                    'extensions' => $extensions,
                    'max_size_mb' => (int) $row['max_size_mb'],
                ];
            }
            
            // Compléter avec les valeurs par défaut si catégorie manquante
            foreach (self::$defaultConfig as $category => $config) {
                if (!isset(self::$cache[$category])) {
                    self::$cache[$category] = $config;
                }
            }
            
            self::$cacheLoaded = true;
            
        } catch (Exception $e) {
            error_log('[UploadConfig] Erreur chargement config: ' . $e->getMessage());
            self::$cache = self::$defaultConfig;
            self::$cacheLoaded = true;
        }
    }

    /**
     * Récupère la configuration d'une catégorie
     * 
     * @param string $category Catégorie (avatar, images, audio, videos, documents)
     * @return array|null Configuration ou null si catégorie inconnue
     */
    public static function getCategory(string $category): ?array
    {
        self::loadFromDatabase();
        
        if (!isset(self::$cache[$category])) {
            return null;
        }
        
        $config = self::$cache[$category];
        
        // Construire le tableau des types MIME
        $mimes = [];
        foreach ($config['extensions'] as $ext) {
            $ext = strtolower($ext);
            if (isset(self::$extensionToMime[$ext])) {
                $mimes[] = self::$extensionToMime[$ext];
            }
        }
        // Ajouter les variantes MIME alternatives
        if (in_array('audio/mpeg', $mimes)) {
            $mimes[] = 'audio/mp3';
        }
        if (in_array('audio/flac', $mimes)) {
            $mimes[] = 'audio/x-flac';
        }
        
        return [
            'extensions' => $config['extensions'],
            'mimes' => array_unique($mimes),
            'maxSize' => $config['max_size_mb'] * 1024 * 1024,
            'maxSizeMB' => $config['max_size_mb'],
        ];
    }

    /**
     * Récupère toutes les configurations
     * 
     * @return array Tableau des configurations par catégorie
     */
    public static function getAll(): array
    {
        self::loadFromDatabase();
        
        $result = [];
        foreach (self::$cache as $category => $config) {
            $result[$category] = self::getCategory($category);
        }
        
        return $result;
    }

    /**
     * Récupère les extensions autorisées pour une catégorie
     * 
     * @param string $category Catégorie
     * @return array Liste des extensions
     */
    public static function getExtensions(string $category): array
    {
        $config = self::getCategory($category);
        return $config ? $config['extensions'] : [];
    }

    /**
     * Récupère la taille max pour une catégorie (en bytes)
     * 
     * @param string $category Catégorie
     * @return int Taille max en bytes
     */
    public static function getMaxSize(string $category): int
    {
        $config = self::getCategory($category);
        return $config ? $config['maxSize'] : 0;
    }

    /**
     * Récupère la taille max pour une catégorie (en MB)
     * 
     * @param string $category Catégorie
     * @return int Taille max en MB
     */
    public static function getMaxSizeMB(string $category): int
    {
        $config = self::getCategory($category);
        return $config ? $config['maxSizeMB'] : 0;
    }

    /**
     * Vérifie si une extension est autorisée pour une catégorie
     * 
     * @param string $extension Extension à vérifier
     * @param string $category Catégorie
     * @return bool
     */
    public static function isExtensionAllowed(string $extension, string $category): bool
    {
        $extensions = self::getExtensions($category);
        return in_array(strtolower($extension), array_map('strtolower', $extensions));
    }

    /**
     * Vérifie si un type MIME est autorisé pour une catégorie
     * 
     * @param string $mime Type MIME
     * @param string $category Catégorie
     * @return bool
     */
    public static function isMimeAllowed(string $mime, string $category): bool
    {
        $config = self::getCategory($category);
        return $config && in_array($mime, $config['mimes']);
    }

    /**
     * Retourne les configurations au format JSON pour JavaScript
     * 
     * @return string JSON des configurations
     */
    public static function toJson(): string
    {
        $configs = self::getAll();
        
        // Simplifier pour le JS (juste extensions et maxSizeMB)
        $result = [];
        foreach ($configs as $category => $config) {
            if ($config) {
                $result[$category] = [
                    'extensions' => $config['extensions'],
                    'maxSizeMB' => $config['maxSizeMB'],
                ];
            }
        }
        
        return json_encode($result);
    }

    /**
     * Vide le cache (utile après modification admin)
     */
    public static function clearCache(): void
    {
        self::$cache = [];
        self::$cacheLoaded = false;
    }

    /**
     * Récupère le mapping extension → MIME
     */
    public static function getExtensionMimeMap(): array
    {
        return self::$extensionToMime;
    }
}
