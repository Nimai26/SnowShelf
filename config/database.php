<?php
/**
 * SnowShelf - Configuration de la base de données
 * Gestion de la connexion PDO à MariaDB
 */

// Chargement des variables d'environnement
$envFile = __DIR__ . '/../.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        // Ignorer les commentaires
        if (strpos(trim($line), '#') === 0) {
            continue;
        }
        
        // Parser la ligne KEY=VALUE
        if (strpos($line, '=') !== false) {
            list($key, $value) = explode('=', $line, 2);
            $key = trim($key);
            $value = trim($value);
            
            // Retirer les guillemets si présents
            $value = trim($value, '"\'');
            
            // Définir la variable d'environnement
            putenv("{$key}={$value}");
            $_ENV[$key] = $value;
        }
    }
}

/**
 * Configuration de la base de données
 * Les valeurs DOIVENT être définies dans le fichier .env
 */

// Vérifier que les variables critiques sont définies
$requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASS'];
foreach ($requiredEnvVars as $var) {
    if (!getenv($var) && !isset($_ENV[$var])) {
        error_log("Variable d'environnement manquante: {$var}. Vérifiez le fichier .env");
        throw new RuntimeException("Configuration de base de données incomplète. Contactez l'administrateur.");
    }
}

define('DB_HOST', getenv('DB_HOST'));
define('DB_PORT', getenv('DB_PORT'));
define('DB_NAME', getenv('DB_NAME'));
define('DB_USER', getenv('DB_USER'));
define('DB_PASS', getenv('DB_PASS'));
define('DB_CHARSET', getenv('DB_CHARSET') ?: 'utf8mb4');

// Base de données Platform (snow_shelf_DB) - utilise les mêmes credentials
define('DB_PLATFORM_NAME', getenv('DB_PLATFORM_NAME') ?: 'snow_shelf_DB');

/**
 * Instance singleton de la connexion PDO
 */
$pdoInstance = null;

/**
 * Obtenir une connexion à la base de données
 * 
 * @return PDO Instance PDO configurée
 * @throws PDOException En cas d'erreur de connexion
 */
function getDbConnection(): PDO {
    global $pdoInstance;
    
    if ($pdoInstance === null) {
        $dsn = sprintf(
            'mysql:host=%s;port=%s;dbname=%s;charset=%s',
            DB_HOST,
            DB_PORT,
            DB_NAME,
            DB_CHARSET
        );
        
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES " . DB_CHARSET,
        ];
        
        try {
            $pdoInstance = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            // Log l'erreur sans exposer les détails sensibles
            error_log("Erreur de connexion à la base de données: " . $e->getMessage());
            throw new PDOException("Impossible de se connecter à la base de données.");
        }
    }
    
    return $pdoInstance;
}

/**
 * Fermer la connexion à la base de données
 */
function closeDbConnection(): void {
    global $pdoInstance;
    $pdoInstance = null;
}

/**
 * Instance singleton de la connexion PDO pour la base Platform
 */
$pdoPlatformInstance = null;

/**
 * Obtenir une connexion à la base de données Platform (snow_shelf_DB)
 * Utilise les mêmes credentials que la base principale mais un nom de DB différent
 * 
 * @return PDO Instance PDO configurée pour snow_shelf_DB
 * @throws PDOException En cas d'erreur de connexion
 */
function getPlatformDbConnection(): PDO {
    global $pdoPlatformInstance;
    
    if ($pdoPlatformInstance === null) {
        $dsn = sprintf(
            'mysql:host=%s;port=%s;dbname=%s;charset=%s',
            DB_HOST,
            DB_PORT,
            DB_PLATFORM_NAME,
            DB_CHARSET
        );
        
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES " . DB_CHARSET,
        ];
        
        try {
            $pdoPlatformInstance = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch (PDOException $e) {
            error_log("Erreur de connexion à la base Platform: " . $e->getMessage());
            throw new PDOException("Impossible de se connecter à la base de données Platform.");
        }
    }
    
    return $pdoPlatformInstance;
}
