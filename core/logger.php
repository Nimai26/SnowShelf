<?php
/**
 * SnowShelf - Système de Logging Centralisé
 * 
 * Gestion centralisée des logs avec niveaux de gravité et rotation automatique.
 * 
 * Usage:
 *   require_once __DIR__ . '/../core/logger.php';
 *   
 *   // Log simple
 *   loger('identify', 'INFO', 'Premium check', ['user_id' => 123]);
 *   
 *   // Niveaux disponibles : DEBUG, INFO, WARNING, ERROR
 *   loger('api', 'DEBUG', 'Requête reçue', ['params' => $_GET]);
 *   loger('auth', 'WARNING', 'Tentative de connexion échouée', ['email' => $email]);
 *   loger('database', 'ERROR', 'Connexion échouée', ['error' => $e->getMessage()]);
 * 
 * Les fichiers de log sont créés dans /logs/{source}.log
 * 
 * Configuration via variables d'environnement ou constantes :
 *   - SNOWSHELF_LOG_LEVEL : Niveau minimum à logger (DEBUG, INFO, WARNING, ERROR)
 *   - SNOWSHELF_LOG_MAX_SIZE : Taille max en bytes avant rotation (défaut: 10MB)
 *   - SNOWSHELF_LOG_MAX_FILES : Nombre max de fichiers de rotation (défaut: 5)
 */

// Niveaux de log avec priorités
define('LOG_LEVELS', [
    'DEBUG'   => 0,
    'INFO'    => 1,
    'WARNING' => 2,
    'WARN'    => 2, // Alias
    'ERROR'   => 3,
    'CRITICAL'=> 4
]);

// Configuration par défaut
define('LOG_DEFAULT_LEVEL', 'DEBUG');
define('LOG_MAX_SIZE', 10 * 1024 * 1024); // 10 MB
define('LOG_MAX_FILES', 5);

/**
 * Fonction principale de logging
 * 
 * @param string $source    Nom du fichier/module appelant (sans extension)
 * @param string $level     Niveau de log : DEBUG, INFO, WARNING, ERROR, CRITICAL
 * @param string $message   Message de log
 * @param array  $context   Données contextuelles optionnelles (tableau associatif)
 * @return bool             True si le log a été écrit, false sinon
 */
function loger(string $source, string $level, string $message, array $context = []): bool
{
    // Normaliser le niveau
    $level = strtoupper(trim($level));
    if (!isset(LOG_LEVELS[$level])) {
        $level = 'INFO';
    }

    // Vérifier le niveau minimum configuré
    $minLevel = getenv('SNOWSHELF_LOG_LEVEL') ?: LOG_DEFAULT_LEVEL;
    $minLevel = strtoupper(trim($minLevel));
    if (!isset(LOG_LEVELS[$minLevel])) {
        $minLevel = LOG_DEFAULT_LEVEL;
    }

    // Ne pas logger si le niveau est inférieur au minimum
    if (LOG_LEVELS[$level] < LOG_LEVELS[$minLevel]) {
        return false;
    }

    // Nettoyer le nom de source (sécurité)
    $source = preg_replace('/[^a-zA-Z0-9_\-]/', '_', $source);
    if (empty($source)) {
        $source = 'app';
    }

    // Chemin du dossier logs (même niveau que core)
    $logDir = dirname(__DIR__) . '/logs';

    // Créer le dossier logs s'il n'existe pas
    if (!is_dir($logDir)) {
        if (!@mkdir($logDir, 0755, true)) {
            error_log("SnowShelf Logger: Impossible de créer le dossier $logDir");
            return false;
        }
    }

    // Chemin du fichier de log
    $logFile = $logDir . '/' . $source . '.log';

    // Rotation des logs si nécessaire
    $maxSize = getenv('SNOWSHELF_LOG_MAX_SIZE') ?: LOG_MAX_SIZE;
    if (is_file($logFile) && filesize($logFile) > $maxSize) {
        rotateLogFile($logFile);
    }

    // Formater l'entrée de log
    $entry = formatLogEntry($level, $message, $context);

    // Écrire dans le fichier
    $result = @file_put_contents($logFile, $entry, FILE_APPEND | LOCK_EX);

    return $result !== false;
}

/**
 * Formate une entrée de log
 * 
 * @param string $level    Niveau de log
 * @param string $message  Message
 * @param array  $context  Contexte
 * @return string          Ligne de log formatée
 */
function formatLogEntry(string $level, string $message, array $context): string
{
    $timestamp = date('Y-m-d H:i:s.') . sprintf('%03d', (int)(microtime(true) * 1000) % 1000);
    
    // Formater le contexte en JSON si non vide
    $contextStr = '';
    if (!empty($context)) {
        // Nettoyer les données sensibles
        $context = sanitizeContext($context);
        $contextStr = ' | ' . json_encode($context, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }

    // Format: [TIMESTAMP] [LEVEL] Message | {"context": "data"}
    return sprintf(
        "[%s] [%-8s] %s%s\n",
        $timestamp,
        $level,
        $message,
        $contextStr
    );
}

/**
 * Nettoie les données sensibles du contexte
 * 
 * @param array $context Données à nettoyer
 * @return array         Données nettoyées
 */
function sanitizeContext(array $context): array
{
    $sensitiveKeys = ['password', 'pwd', 'secret', 'token', 'api_key', 'apikey', 'auth', 'credential'];
    
    foreach ($context as $key => $value) {
        $keyLower = strtolower($key);
        
        // Masquer les valeurs sensibles
        foreach ($sensitiveKeys as $sensitive) {
            if (strpos($keyLower, $sensitive) !== false) {
                $context[$key] = is_string($value) ? '***MASKED***' : '[MASKED]';
                break;
            }
        }
        
        // Récursivement nettoyer les tableaux
        if (is_array($value)) {
            $context[$key] = sanitizeContext($value);
        }
        
        // Limiter la taille des chaînes longues
        if (is_string($value) && strlen($value) > 1000) {
            $context[$key] = substr($value, 0, 1000) . '...[TRUNCATED]';
        }
    }
    
    return $context;
}

/**
 * Effectue la rotation d'un fichier de log
 * 
 * @param string $logFile Chemin du fichier de log
 * @return void
 */
function rotateLogFile(string $logFile): void
{
    $maxFiles = getenv('SNOWSHELF_LOG_MAX_FILES') ?: LOG_MAX_FILES;
    
    // Supprimer le plus ancien si nécessaire
    $oldestLog = $logFile . '.' . $maxFiles;
    if (is_file($oldestLog)) {
        @unlink($oldestLog);
    }

    // Décaler les fichiers existants
    for ($i = $maxFiles - 1; $i >= 1; $i--) {
        $currentFile = $logFile . '.' . $i;
        $nextFile = $logFile . '.' . ($i + 1);
        if (is_file($currentFile)) {
            @rename($currentFile, $nextFile);
        }
    }

    // Renommer le fichier actuel
    @rename($logFile, $logFile . '.1');
}

/**
 * Fonctions raccourcies par niveau
 */
function log_debug(string $source, string $message, array $context = []): bool
{
    return loger($source, 'DEBUG', $message, $context);
}

function log_info(string $source, string $message, array $context = []): bool
{
    return loger($source, 'INFO', $message, $context);
}

function log_warning(string $source, string $message, array $context = []): bool
{
    return loger($source, 'WARNING', $message, $context);
}

function log_error(string $source, string $message, array $context = []): bool
{
    return loger($source, 'ERROR', $message, $context);
}

function log_critical(string $source, string $message, array $context = []): bool
{
    return loger($source, 'CRITICAL', $message, $context);
}

/**
 * Classe Logger pour usage orienté objet (optionnel)
 */
class Logger
{
    private string $source;

    public function __construct(string $source)
    {
        $this->source = $source;
    }

    public function debug(string $message, array $context = []): bool
    {
        return loger($this->source, 'DEBUG', $message, $context);
    }

    public function info(string $message, array $context = []): bool
    {
        return loger($this->source, 'INFO', $message, $context);
    }

    public function warning(string $message, array $context = []): bool
    {
        return loger($this->source, 'WARNING', $message, $context);
    }

    public function error(string $message, array $context = []): bool
    {
        return loger($this->source, 'ERROR', $message, $context);
    }

    public function critical(string $message, array $context = []): bool
    {
        return loger($this->source, 'CRITICAL', $message, $context);
    }
}
