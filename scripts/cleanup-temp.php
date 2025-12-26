<?php
/**
 * Script de nettoyage des fichiers temporaires
 * 
 * À exécuter via cron toutes les heures :
 * 0 * * * * /usr/bin/php /NAS/Data/Websites/SnowShelf/scripts/cleanup-temp.php
 * 
 * Via Docker :
 * docker exec swag php /Websites/SnowShelf/scripts/cleanup-temp.php
 * 
 * @author SnowShelf
 * @version 1.0.0
 */

// Configuration
define('TEMP_DIR', __DIR__ . '/../storage/temp/');
define('TEMP_FILE_LIFETIME', 3600); // 1 heure

// Charger le logger si disponible
$loggerPath = __DIR__ . '/../core/loger.php';
if (file_exists($loggerPath)) {
    require_once $loggerPath;
    $hasLogger = true;
} else {
    $hasLogger = false;
}

// Vérifier que le dossier existe
if (!is_dir(TEMP_DIR)) {
    echo "Dossier temporaire inexistant, rien à nettoyer.\n";
    exit(0);
}

// Scanner les fichiers
$files = glob(TEMP_DIR . 'temp_*.{jpg,png,gif,webp}', GLOB_BRACE);

if (empty($files)) {
    echo "Aucun fichier temporaire à nettoyer.\n";
    exit(0);
}

$now = time();
$deleted = 0;
$errors = 0;

foreach ($files as $file) {
    // Extraire le timestamp du nom de fichier
    $basename = basename($file);
    
    if (preg_match('/temp_\d+_(\d+)_/', $basename, $matches)) {
        $fileTime = (int) $matches[1];
        
        // Vérifier l'âge du fichier
        $age = $now - $fileTime;
        
        if ($age > TEMP_FILE_LIFETIME) {
            if (unlink($file)) {
                $deleted++;
                echo "Supprimé : $basename (âge : " . round($age / 60) . " min)\n";
            } else {
                $errors++;
                echo "Erreur suppression : $basename\n";
            }
        }
    } else {
        // Fichier sans timestamp valide, vérifier avec filemtime
        $fileTime = filemtime($file);
        if ($fileTime && ($now - $fileTime > TEMP_FILE_LIFETIME)) {
            if (unlink($file)) {
                $deleted++;
                echo "Supprimé (via mtime) : $basename\n";
            } else {
                $errors++;
            }
        }
    }
}

// Log du résultat
$summary = "Nettoyage terminé : $deleted fichiers supprimés, $errors erreurs";
echo $summary . "\n";

if ($hasLogger && $deleted > 0) {
    loger('cleanup', 'INFO', $summary);
}

exit($errors > 0 ? 1 : 0);
