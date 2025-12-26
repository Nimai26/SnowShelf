<?php
/**
 * SnowShelf - Système d'internationalisation (i18n)
 * 
 * Gestion centralisée des traductions avec support multi-langues.
 * 
 * Usage:
 *   require_once __DIR__ . '/../core/i18n.php';
 *   $i18n = I18n::getInstance();
 *   echo __('auth.login');  // Affiche "Connexion" ou "Login" selon la langue
 * 
 * Fonctions globales disponibles:
 *   __('clé')           - Récupère une traduction
 *   __('clé', [...])    - Récupère une traduction avec paramètres
 *   _e('clé')           - Affiche directement une traduction (echo)
 *   getLang()           - Récupère le code langue actuel
 *   getAvailableLangs() - Liste des langues disponibles
 */

class I18n
{
    /** @var I18n|null Instance singleton */
    private static ?I18n $instance = null;

    /** @var string Code de la langue actuelle */
    private string $currentLang;

    /** @var string Langue par défaut (fallback) */
    private string $defaultLang = 'fr';

    /** @var array Traductions chargées */
    private array $translations = [];

    /** @var array Langues disponibles avec leurs métadonnées */
    private array $availableLanguages = [];

    /** @var string Chemin vers les fichiers de langue */
    private string $langPath;

    /**
     * Constructeur privé (singleton)
     */
    private function __construct()
    {
        $this->langPath = dirname(__DIR__) . '/lang/';
        $this->loadAvailableLanguages();
        $this->detectLanguage();
        $this->loadTranslations();
    }

    /**
     * Récupère l'instance singleton
     */
    public static function getInstance(): I18n
    {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Charge la liste des langues disponibles depuis les fichiers
     */
    private function loadAvailableLanguages(): void
    {
        $files = glob($this->langPath . '*.php');
        
        foreach ($files as $file) {
            $langCode = basename($file, '.php');
            $langData = require $file;
            
            if (isset($langData['_meta'])) {
                $this->availableLanguages[$langCode] = $langData['_meta'];
            }
        }
    }

    /**
     * Détecte la langue à utiliser (session > cookie > navigateur > défaut)
     */
    private function detectLanguage(): void
    {
        // 1. Vérifier la préférence en session (utilisateur connecté)
        if (session_status() === PHP_SESSION_ACTIVE && isset($_SESSION['lang_pref']) && $this->isValidLang($_SESSION['lang_pref'])) {
            $this->currentLang = $_SESSION['lang_pref'];
            return;
        }

        // 2. Vérifier le cookie
        if (isset($_COOKIE['snowshelf_lang']) && $this->isValidLang($_COOKIE['snowshelf_lang'])) {
            $this->currentLang = $_COOKIE['snowshelf_lang'];
            return;
        }

        // 3. Vérifier l'en-tête Accept-Language du navigateur
        if (isset($_SERVER['HTTP_ACCEPT_LANGUAGE'])) {
            $browserLangs = explode(',', $_SERVER['HTTP_ACCEPT_LANGUAGE']);
            foreach ($browserLangs as $browserLang) {
                // Extraire le code langue (ex: "fr-FR,fr;q=0.9" -> "fr")
                $langCode = strtolower(substr(trim(explode(';', $browserLang)[0]), 0, 2));
                if ($this->isValidLang($langCode)) {
                    $this->currentLang = $langCode;
                    return;
                }
            }
        }

        // 4. Utiliser la langue par défaut
        $this->currentLang = $this->defaultLang;
    }

    /**
     * Vérifie si un code langue est valide
     */
    private function isValidLang(string $langCode): bool
    {
        return array_key_exists($langCode, $this->availableLanguages);
    }

    /**
     * Charge les traductions de la langue actuelle
     */
    private function loadTranslations(): void
    {
        $langFile = $this->langPath . $this->currentLang . '.php';
        $defaultFile = $this->langPath . $this->defaultLang . '.php';

        // Charger la langue par défaut comme base (fallback)
        if (file_exists($defaultFile)) {
            $this->translations = require $defaultFile;
        }

        // Charger la langue actuelle par-dessus (si différente)
        if ($this->currentLang !== $this->defaultLang && file_exists($langFile)) {
            $currentTranslations = require $langFile;
            $this->translations = $this->mergeDeep($this->translations, $currentTranslations);
        }
    }

    /**
     * Fusion profonde de tableaux (pour les traductions imbriquées)
     */
    private function mergeDeep(array $base, array $override): array
    {
        foreach ($override as $key => $value) {
            if (is_array($value) && isset($base[$key]) && is_array($base[$key])) {
                $base[$key] = $this->mergeDeep($base[$key], $value);
            } else {
                $base[$key] = $value;
            }
        }
        return $base;
    }

    /**
     * Récupère une traduction par sa clé
     * 
     * @param string $key Clé de traduction (ex: "auth.login")
     * @param array $params Paramètres de remplacement
     * @return string Traduction ou clé si non trouvée
     */
    public function get(string $key, array $params = []): string
    {
        $keys = explode('.', $key);
        $value = $this->translations;

        // Naviguer dans le tableau imbriqué
        foreach ($keys as $k) {
            if (is_array($value) && isset($value[$k])) {
                $value = $value[$k];
            } else {
                // Clé non trouvée, retourner la clé elle-même
                return $key;
            }
        }

        // Si la valeur n'est pas une chaîne, retourner la clé
        if (!is_string($value)) {
            return $key;
        }

        // Remplacer les paramètres {param}
        foreach ($params as $paramKey => $paramValue) {
            $value = str_replace('{' . $paramKey . '}', (string)$paramValue, $value);
        }

        // Gérer le pluriel (format: "singulier|pluriel")
        if (str_contains($value, '|') && isset($params['count'])) {
            $parts = explode('|', $value);
            $value = ($params['count'] == 1) ? $parts[0] : ($parts[1] ?? $parts[0]);
        }

        return $value;
    }

    /**
     * Change la langue actuelle
     */
    public function setLang(string $langCode): bool
    {
        if (!$this->isValidLang($langCode)) {
            return false;
        }

        $this->currentLang = $langCode;
        $this->loadTranslations();

        // Sauvegarder dans un cookie (1 an)
        $expires = time() + (365 * 24 * 60 * 60);
        setcookie('snowshelf_lang', $langCode, [
            'expires' => $expires,
            'path' => '/',
            'secure' => true,
            'httponly' => false,
            'samesite' => 'Lax'
        ]);

        return true;
    }

    /**
     * Récupère le code de la langue actuelle
     */
    public function getCurrentLang(): string
    {
        return $this->currentLang;
    }

    /**
     * Récupère les métadonnées de la langue actuelle
     */
    public function getCurrentLangMeta(): array
    {
        return $this->availableLanguages[$this->currentLang] ?? [];
    }

    /**
     * Récupère la liste des langues disponibles
     */
    public function getAvailableLanguages(): array
    {
        return $this->availableLanguages;
    }

    /**
     * Génère le HTML pour un sélecteur de langue
     */
    public function renderLanguageSelector(string $class = 'lang-select'): string
    {
        $html = '<select id="lang-select" class="' . htmlspecialchars($class) . '">';
        
        foreach ($this->availableLanguages as $code => $meta) {
            $selected = ($code === $this->currentLang) ? ' selected' : '';
            $html .= '<option value="' . htmlspecialchars($code) . '"' . $selected . '>';
            $html .= htmlspecialchars($meta['flag'] . ' ' . $meta['name']);
            $html .= '</option>';
        }
        
        $html .= '</select>';
        
        return $html;
    }
}

// ============================================
// FONCTIONS GLOBALES HELPER
// ============================================

/**
 * Récupère une traduction (shorthand)
 * 
 * @param string $key Clé de traduction
 * @param array $params Paramètres optionnels
 * @return string
 */
function __(string $key, array $params = []): string
{
    return I18n::getInstance()->get($key, $params);
}

/**
 * Affiche une traduction (echo)
 * 
 * @param string $key Clé de traduction
 * @param array $params Paramètres optionnels
 */
function _e(string $key, array $params = []): void
{
    echo I18n::getInstance()->get($key, $params);
}

/**
 * Récupère le code de la langue actuelle
 * 
 * @return string
 */
function getLang(): string
{
    return I18n::getInstance()->getCurrentLang();
}

/**
 * Récupère les langues disponibles
 * 
 * @return array
 */
function getAvailableLangs(): array
{
    return I18n::getInstance()->getAvailableLanguages();
}

/**
 * Génère le sélecteur de langue HTML
 * 
 * @param string $class Classe CSS
 * @return string
 */
function renderLangSelector(string $class = 'lang-select'): string
{
    return I18n::getInstance()->renderLanguageSelector($class);
}

// Initialiser automatiquement le système i18n
I18n::getInstance();
