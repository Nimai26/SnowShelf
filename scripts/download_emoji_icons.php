<?php
/**
 * Script de téléchargement des emojis Twemoji en PNG
 * Utilise les emojis Twitter (Twemoji) qui sont libres de droits
 * 
 * Usage: docker exec swag php /Websites/SnowShelf/scripts/download_emoji_icons.php
 */

// Configuration base de données
$host = '10.110.1.1';
$port = 3307;
$dbname = 'snowshelf';
$user = 'Nimai';
$pass = 'Amiral_Ackbar@38';

// Chemins
$baseStoragePath = '/Websites/SnowShelf/storage/default_categories';

// Mapping des catégories vers leurs emojis et codes Twemoji
// Format: [emoji, codepoint hexadécimal pour Twemoji]
$categoryEmojis = [
    1  => ['🎮', '1f3ae'],           // Jeux vidéo - Video Game
    2  => ['🎲', '1f3b2'],           // Jeux de société - Game Die
    3  => ['🕹️', '1f579'],           // Consoles & Systèmes - Joystick
    4  => ['🧸', '1f9f8'],           // Jouets - Teddy Bear
    5  => ['📚', '1f4da'],           // Livres - Books
    6  => ['🃏', '1f0cf'],           // Cartes à collectionner - Black Joker
    7  => ['📼', '1f4fc'],           // VHS - Videocassette
    8  => ['📀', '1f4c0'],           // DVD - DVD
    9  => ['💿', '1f4bf'],           // Blu-ray - CD
    10 => ['💽', '1f4bd'],           // LaserDisc - Minidisc
    11 => ['🎵', '1f3b5'],           // Vinyles - Musical Note
    12 => ['💿', '1f4bf'],           // CD Audio - CD
    13 => ['📼', '1f4fc'],           // K7 Audio - Videocassette
    14 => ['🖼️', '1f5bc'],           // Albums d'images - Framed Picture
];

// URL de base Twemoji (format 72x72 PNG)
$twemojiBaseUrl = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/';

echo "=== Téléchargement des icônes Twemoji ===\n\n";

try {
    // Connexion à la base de données
    $pdo = new PDO(
        "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4",
        $user,
        $pass,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    echo "✓ Connexion à la base de données réussie\n";

    // Récupérer les catégories par défaut
    $stmt = $pdo->query("SELECT id, name FROM categories WHERE is_default = 1");
    $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "✓ " . count($categories) . " catégories trouvées\n\n";

    // Créer le dossier de base si nécessaire
    if (!is_dir($baseStoragePath)) {
        mkdir($baseStoragePath, 0755, true);
        echo "✓ Dossier de base créé: $baseStoragePath\n";
    }

    // Traiter chaque catégorie
    foreach ($categories as $cat) {
        $catId = $cat['id'];
        $catName = $cat['name'];
        
        if (!isset($categoryEmojis[$catId])) {
            echo "⚠ Catégorie $catId non mappée, ignorée\n";
            continue;
        }
        
        $emoji = $categoryEmojis[$catId][0];
        $codepoint = $categoryEmojis[$catId][1];
        
        echo "Traitement: $catName (ID: $catId, Emoji: $emoji)\n";
        
        // Créer le dossier de la catégorie
        $catPath = "$baseStoragePath/$catId";
        if (!is_dir($catPath)) {
            mkdir($catPath, 0755, true);
            echo "  ✓ Dossier créé: $catPath\n";
        }
        
        // Créer les sous-dossiers
        foreach (['images', 'audio', 'videos', 'documents'] as $subdir) {
            $subdirPath = "$catPath/$subdir";
            if (!is_dir($subdirPath)) {
                mkdir($subdirPath, 0755, true);
            }
        }
        
        // Télécharger l'icône Twemoji
        $iconPath = "$catPath/icon.png";
        $twemojiUrl = $twemojiBaseUrl . $codepoint . '.png';
        
        echo "  📥 Téléchargement: $twemojiUrl\n";
        
        $imageData = @file_get_contents($twemojiUrl);
        
        if ($imageData !== false) {
            // Redimensionner à 256x256 avec GD
            $srcImage = imagecreatefromstring($imageData);
            if ($srcImage) {
                $srcWidth = imagesx($srcImage);
                $srcHeight = imagesy($srcImage);
                
                // Créer une nouvelle image 256x256 avec fond transparent
                $dstImage = imagecreatetruecolor(256, 256);
                imagealphablending($dstImage, false);
                imagesavealpha($dstImage, true);
                $transparent = imagecolorallocatealpha($dstImage, 0, 0, 0, 127);
                imagefill($dstImage, 0, 0, $transparent);
                
                // Redimensionner avec antialiasing
                imagealphablending($dstImage, true);
                imagecopyresampled($dstImage, $srcImage, 0, 0, 0, 0, 256, 256, $srcWidth, $srcHeight);
                
                // Sauvegarder
                imagepng($dstImage, $iconPath);
                imagedestroy($srcImage);
                imagedestroy($dstImage);
                
                echo "  ✓ Icône sauvegardée: $iconPath (256x256)\n";
                
                // Mettre à jour la base de données
                $relativePath = "storage/default_categories/$catId/icon.png";
                $stmt = $pdo->prepare("UPDATE categories SET icon = :icon WHERE id = :id");
                $stmt->execute([':icon' => $relativePath, ':id' => $catId]);
                echo "  ✓ Base de données mise à jour\n";
            } else {
                echo "  ❌ Erreur: impossible de décoder l'image\n";
            }
        } else {
            echo "  ❌ Erreur: téléchargement échoué\n";
        }
        
        echo "\n";
    }
    
    echo "=== Téléchargement terminé ===\n";
    
} catch (PDOException $e) {
    die("❌ Erreur de base de données: " . $e->getMessage() . "\n");
} catch (Exception $e) {
    die("❌ Erreur: " . $e->getMessage() . "\n");
}
