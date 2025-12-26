<?php
/**
 * SnowShelf - Configuration du Site
 * 
 * Gestion des paramètres par défaut du site (thème, langue, background)
 * et récupération des préférences effectives d'un utilisateur.
 * 
 * Usage:
 *   require_once __DIR__ . '/../core/SiteConfig.php';
 *   $config = SiteConfig::getInstance();
 *   
 *   // Récupérer les valeurs par défaut du site
 *   $defaultTheme = $config->getDefaultTheme();
 *   $defaultLang = $config->getDefaultLang();
 *   $defaultBackground = $config->getDefaultBackground();
 *   
 *   // Récupérer les préférences effectives d'un utilisateur
 *   $theme = $config->getUserTheme($userId);  // Retourne le thème user ou défaut
 *   $background = $config->getUserBackground($userId);  // Background user ou défaut
 */

// Charger le logger
require_once __DIR__ . '/logger.php';

class SiteConfig
{
    /** @var SiteConfig|null Instance singleton */
    private static ?SiteConfig $instance = null;

    /** @var PDO Connexion à la base de données */
    private PDO $db;

    /** @var array|null Configuration en cache */
    private ?array $config = null;

    /** @var string Thème par défaut en cas d'erreur */
    private string $fallbackTheme = 'organizr';

    /** @var string Langue par défaut en cas d'erreur */
    private string $fallbackLang = 'fr';

    /**
     * Constructeur privé (singleton)
     */
    private function __construct()
    {
        require_once __DIR__ . '/../config/database.php';
        $this->db = getDbConnection();
        $this->loadConfig();
    }

    /**
     * Récupère l'instance singleton
     */
    public static function getInstance(): SiteConfig
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Charge la configuration depuis la base de données
     */
    private function loadConfig(): void
    {
        try {
            $stmt = $this->db->query("SELECT * FROM Admin_Main_Config LIMIT 1");
            $this->config = $stmt->fetch(PDO::FETCH_ASSOC);
            loger('siteconfig', 'DEBUG', 'loadConfig() - Config loaded from DB', [
                'DEFAULT_THEME' => $this->config['DEFAULT_THEME'] ?? 'NULL',
                'DEFAULT_LANG' => $this->config['DEFAULT_LANG'] ?? 'NULL',
                'DEFAULT_BACKGROUND' => $this->config['DEFAULT_BACKGROUND'] ?? 'NULL'
            ]);
        } catch (PDOException $e) {
            loger('siteconfig', 'ERROR', 'loadConfig() - DB error', ['error' => $e->getMessage()]);
            $this->config = null;
        }
    }

    /**
     * Rafraîchit la configuration (après une modification)
     */
    public function refresh(): void
    {
        $this->config = null;
        $this->loadConfig();
    }

    /**
     * Récupère le thème par défaut du site
     */
    public function getDefaultTheme(): string
    {
        $theme = $this->config['DEFAULT_THEME'] ?? $this->fallbackTheme;
        loger('siteconfig', 'DEBUG', 'getDefaultTheme()', [
            'config_value' => $this->config['DEFAULT_THEME'] ?? 'NULL',
            'returning' => $theme
        ]);
        return $theme;
    }

    /**
     * Récupère la langue par défaut du site
     */
    public function getDefaultLang(): string
    {
        return $this->config['DEFAULT_LANG'] ?? $this->fallbackLang;
    }

    /**
     * Récupère le background par défaut du site (chemin relatif ou null)
     */
    public function getDefaultBackground(): ?string
    {
        return $this->config['DEFAULT_BACKGROUND'] ?? null;
    }

    /**
     * Récupère l'URL complète du background par défaut
     */
    public function getDefaultBackgroundUrl(): ?string
    {
        $path = $this->getDefaultBackground();
        return $path ? '/' . ltrim($path, '/') : null;
    }

    /**
     * Récupère le thème effectif d'un utilisateur
     * (son thème personnel ou le thème par défaut du site)
     * 
     * @param int|null $userId ID utilisateur (null = utiliser session)
     * @return string Code du thème
     */
    public function getUserTheme(?int $userId = null): string
    {
        loger('siteconfig', 'DEBUG', 'getUserTheme() called', ['userId' => $userId]);
        
        // Utiliser la session si pas d'ID fourni
        if ($userId === null) {
            loger('siteconfig', 'DEBUG', 'getUserTheme() - checking session', [
                'session_theme' => $_SESSION['theme'] ?? 'NOT SET'
            ]);
            if (isset($_SESSION['theme']) && !empty($_SESSION['theme']) && $_SESSION['theme'] !== 'default') {
                loger('siteconfig', 'DEBUG', 'getUserTheme() - returning session theme', ['theme' => $_SESSION['theme']]);
                return $_SESSION['theme'];
            }
            $defaultTheme = $this->getDefaultTheme();
            loger('siteconfig', 'DEBUG', 'getUserTheme() - returning default theme', ['theme' => $defaultTheme]);
            return $defaultTheme;
        }

        // Récupérer depuis la base de données
        try {
            loger('siteconfig', 'DEBUG', 'getUserTheme() - querying DB', ['userId' => $userId]);
            $stmt = $this->db->prepare("SELECT theme FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            loger('siteconfig', 'DEBUG', 'getUserTheme() - DB result', ['user' => $user]);

            if ($user && !empty($user['theme']) && $user['theme'] !== 'default') {
                loger('siteconfig', 'DEBUG', 'getUserTheme() - returning user DB theme', ['theme' => $user['theme']]);
                return $user['theme'];
            }
            $defaultTheme = $this->getDefaultTheme();
            loger('siteconfig', 'DEBUG', 'getUserTheme() - user has no theme, returning default', ['theme' => $defaultTheme]);
            return $defaultTheme;
        } catch (PDOException $e) {
            // En cas d'erreur, utiliser le défaut
            loger('siteconfig', 'ERROR', 'getUserTheme() - DB error', ['error' => $e->getMessage()]);
        }

        return $this->getDefaultTheme();
    }

    /**
     * Récupère la langue effective d'un utilisateur
     * 
     * @param int|null $userId ID utilisateur (null = utiliser session)
     * @return string Code langue
     */
    public function getUserLang(?int $userId = null): string
    {
        // Utiliser la session si pas d'ID fourni
        if ($userId === null) {
            if (isset($_SESSION['lang_pref']) && !empty($_SESSION['lang_pref'])) {
                return $_SESSION['lang_pref'];
            }
            return $this->getDefaultLang();
        }

        // Récupérer depuis la base de données
        try {
            $stmt = $this->db->prepare("SELECT lang_pref FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($user && !empty($user['lang_pref'])) {
                return $user['lang_pref'];
            }
        } catch (PDOException $e) {
            // En cas d'erreur, utiliser le défaut
        }

        return $this->getDefaultLang();
    }

    /**
     * Récupère le background effectif d'un utilisateur
     * (son background personnel ou le background par défaut du site)
     * 
     * @param int|null $userId ID utilisateur (null = utiliser session)
     * @return string|null Chemin relatif du background ou null
     */
    public function getUserBackground(?int $userId = null): ?string
    {
        // Utiliser la session si pas d'ID fourni
        if ($userId === null && isset($_SESSION['user_id'])) {
            $userId = $_SESSION['user_id'];
        }

        if ($userId !== null) {
            // Récupérer depuis la base de données
            try {
                $stmt = $this->db->prepare("SELECT background FROM users WHERE id = ?");
                $stmt->execute([$userId]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);

                if ($user && !empty($user['background'])) {
                    return $user['background'];
                }
            } catch (PDOException $e) {
                // En cas d'erreur, utiliser le défaut
            }
        }

        return $this->getDefaultBackground();
    }

    /**
     * Récupère l'URL du background effectif
     * 
     * @param int|null $userId ID utilisateur
     * @return string|null URL du background ou null
     */
    public function getUserBackgroundUrl(?int $userId = null): ?string
    {
        $path = $this->getUserBackground($userId);
        return $path ? '/' . ltrim($path, '/') : null;
    }

    /**
     * Récupère toute la configuration effective pour un utilisateur
     * 
     * @param int|null $userId ID utilisateur
     * @return array Configuration complète
     */
    public function getEffectiveConfig(?int $userId = null): array
    {
        return [
            'theme' => $this->getUserTheme($userId),
            'lang' => $this->getUserLang($userId),
            'background' => $this->getUserBackground($userId),
            'background_url' => $this->getUserBackgroundUrl($userId)
        ];
    }

    /**
     * Liste des thèmes disponibles (triés par ordre alphabétique)
     */
    public function getAvailableThemes(): array
    {
        return [
            'aquamarine' => ['name' => 'Aquamarine', 'icon' => '💎'],
            'blackberry-abyss' => ['name' => 'Blackberry Abyss', 'icon' => '🌊'],
            'blackberry-amethyst' => ['name' => 'Blackberry Amethyst', 'icon' => '💜'],
            'blackberry-carol' => ['name' => 'Blackberry Carol', 'icon' => '🎄'],
            'blackberry-dreamscape' => ['name' => 'Blackberry Dreamscape', 'icon' => '🌸'],
            'blackberry-flamingo' => ['name' => 'Blackberry Flamingo', 'icon' => '🦩'],
            'blackberry-hearth' => ['name' => 'Blackberry Hearth', 'icon' => '🔥'],
            'blackberry-martian' => ['name' => 'Blackberry Martian', 'icon' => '👽'],
            'blackberry-pumpkin' => ['name' => 'Blackberry Pumpkin', 'icon' => '🎃'],
            'blackberry-royal' => ['name' => 'Blackberry Royal', 'icon' => '👑'],
            'blackberry-shadow' => ['name' => 'Blackberry Shadow', 'icon' => '🌑'],
            'blackberry-solar' => ['name' => 'Blackberry Solar', 'icon' => '🫐'],
            'blackberry-vanta' => ['name' => 'Blackberry Vanta', 'icon' => '⬛'],
            'catppuccin-frappe' => ['name' => 'Catppuccin Frappé', 'icon' => '☕'],
            'catppuccin-latte' => ['name' => 'Catppuccin Latte', 'icon' => '☀️'],
            'catppuccin-macchiato' => ['name' => 'Catppuccin Macchiato', 'icon' => '🌙'],
            'catppuccin-mocha' => ['name' => 'Catppuccin Mocha', 'icon' => '🌑'],
            'dark' => ['name' => 'Dark', 'icon' => '🌙'],
            'dracula' => ['name' => 'Dracula', 'icon' => '🧛'],
            'hotline' => ['name' => 'Hotline', 'icon' => '🌴'],
            'hotpink' => ['name' => 'Hot Pink', 'icon' => '💖'],
            'ibracorp' => ['name' => 'IbraCorp', 'icon' => '💜'],
            'infinity-mind' => ['name' => 'Infinity Mind', 'icon' => '🧠'],
            'infinity-power' => ['name' => 'Infinity Power', 'icon' => '💪'],
            'infinity-reality' => ['name' => 'Infinity Reality', 'icon' => '🌌'],
            'infinity-soul' => ['name' => 'Infinity Soul', 'icon' => '👻'],
            'infinity-space' => ['name' => 'Infinity Space', 'icon' => '🪐'],
            'infinity-time' => ['name' => 'Infinity Time', 'icon' => '⏰'],
            'maroon' => ['name' => 'Maroon', 'icon' => '🍷'],
            'nord' => ['name' => 'Nord', 'icon' => '❄️'],
            'onedark' => ['name' => 'One Dark', 'icon' => '🌑'],
            'organizr' => ['name' => 'Organizr', 'icon' => '🎨'],
            'overseerr' => ['name' => 'Overseerr', 'icon' => '🎬'],
            'pine-shadow' => ['name' => 'Pine Shadow', 'icon' => '🌲'],
            'plex' => ['name' => 'Plex', 'icon' => '🎥'],
            'rose-pine' => ['name' => 'Rose Pine', 'icon' => '🌹'],
            'rose-pine-dawn' => ['name' => 'Rose Pine Dawn', 'icon' => '🌅'],
            'rose-pine-moon' => ['name' => 'Rose Pine Moon', 'icon' => '🌙'],
            'snowshelf-christmas' => ['name' => 'SnowShelf Christmas', 'icon' => '🎄'],
            'snowshelf-halloween' => ['name' => 'SnowShelf Halloween', 'icon' => '🎃'],
            'snowshelf-santa' => ['name' => 'SnowShelf Santa', 'icon' => '🎅'],
            'space-gray' => ['name' => 'Space Gray', 'icon' => '🚀'],
            'trueblack' => ['name' => 'True Black (OLED)', 'icon' => '⬛'],
        ];
    }
}

/**
 * Fonction helper globale pour récupérer la config du site
 */
function getSiteConfig(): SiteConfig
{
    return SiteConfig::getInstance();
}

/**
 * Récupère le thème effectif (utilisateur ou défaut site)
 */
function getEffectiveTheme(?int $userId = null): string
{
    return SiteConfig::getInstance()->getUserTheme($userId);
}

/**
 * Récupère le background effectif (utilisateur ou défaut site)
 */
function getEffectiveBackground(?int $userId = null): ?string
{
    return SiteConfig::getInstance()->getUserBackgroundUrl($userId);
}

/**
 * Génère une URL pour un fichier du dossier storage/ avec cache-busting
 * 
 * @param string $path Chemin relatif dans storage/ (ex: "default_categories/1/icon.png")
 * @param bool $cacheBust Ajouter un paramètre de version pour invalider le cache
 * @return string URL complète
 * 
 * @example
 *   storageUrl('default_categories/1/icon.png')
 *   // Retourne: /storage/default_categories/1/icon.png?v=1701523456
 */
function storageUrl(string $path, bool $cacheBust = true): string
{
    // Nettoyer le chemin
    $path = ltrim($path, '/');
    
    // Construire l'URL de base
    $url = '/storage/' . $path;
    
    // Ajouter le cache-busting si demandé
    if ($cacheBust) {
        // Essayer de récupérer la date de modification du fichier
        $storagePath = realpath(__DIR__ . '/../storage');
        $fullPath = $storagePath . '/' . $path;
        
        if (file_exists($fullPath)) {
            $mtime = filemtime($fullPath);
            $url .= '?v=' . $mtime;
        } else {
            // Fichier non trouvé, utiliser le timestamp actuel
            $url .= '?v=' . time();
        }
    }
    
    return $url;
}

/**
 * Génère une URL pour un fichier d'icône de catégorie avec cache-busting
 * 
 * @param int $categoryId ID de la catégorie
 * @param bool $isDefault True si c'est une catégorie par défaut
 * @param int|null $userId ID de l'utilisateur (pour les catégories personnalisées)
 * @return string URL de l'icône
 */
function categoryIconUrl(int $categoryId, bool $isDefault = true, ?int $userId = null): string
{
    if ($isDefault) {
        return storageUrl("default_categories/{$categoryId}/icon.png");
    } else {
        return storageUrl("users/{$userId}/Categories/{$categoryId}/icon.png");
    }
}
