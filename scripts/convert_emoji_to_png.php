<?php
/**
 * Script de conversion des emojis en images PNG
 * Génère les icônes pour les catégories par défaut
 * 
 * Usage: docker exec swag php /Websites/SnowShelf/scripts/convert_emoji_to_png.php
 * 
 * Prérequis: font-noto-emoji installé dans le conteneur
 * Installation: docker exec swag apk add --no-cache font-noto-emoji
 */

// Configuration base de données
$host = '10.110.1.1';
$port = 3307;
$dbname = 'snowshelf';
$user = 'Nimai';
$pass = 'Amiral_Ackbar@38';

// Chemins
$baseStoragePath = '/Websites/SnowShelf/storage/default_categories';

// Mapping des catégories vers leurs emojis
// (car le terminal ne les affiche pas correctement)
$categoryEmojis = [
    1 => '🎮',   // Jeux vidéo
    2 => '🎲',   // Jeux de société
    3 => '🕹️',  // Consoles & Systèmes
    4 => '🧸',   // Jouets
    5 => '📚',   // Livres
    6 => '🃏',   // Cartes à collectionner
    7 => '📼',   // VHS
    8 => '📀',   // DVD
    9 => '💿',   // Blu-ray
    10 => '💽',  // LaserDisc
    11 => '🎵',  // Vinyles
    12 => '💿',  // CD Audio
    13 => '📼',  // K7 Audio
    14 => '🖼️', // Albums d'images
];

echo "=== Conversion des emojis en PNG ===\n\n";

try {
    // Connexion à la base de données
    $pdo = new PDO(
        "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4",
        $user,
        $pass,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );
    echo "✓ Connexion à la base de données réussie\n";

    // Vérifier si GD est disponible
    if (!extension_loaded('gd')) {
        die("❌ Extension GD non disponible. Impossible de générer les images.\n");
    }
    echo "✓ Extension GD disponible\n";
    
    // Vérifier si Imagick est disponible (meilleur support emoji)
    $useImagick = extension_loaded('imagick');
    echo $useImagick ? "✓ Extension Imagick disponible\n" : "⚠ Imagick non disponible, utilisation de GD\n";

    // Récupérer les catégories par défaut
    $stmt = $pdo->query("SELECT id, name, icon FROM categories WHERE is_default = 1");
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
        $emoji = $categoryEmojis[$catId] ?? '📁';
        
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
        
        // Générer l'image PNG de l'emoji
        $iconPath = "$catPath/icon.png";
        
        $success = $useImagick 
            ? generateEmojiPngImagick($emoji, $iconPath)
            : generateEmojiPngGD($emoji, $iconPath);
            
        if ($success) {
            echo "  ✓ Icône générée: $iconPath\n";
            
            // Mettre à jour la base de données avec le chemin relatif
            $relativePath = "storage/default_categories/$catId/icon.png";
            $stmt = $pdo->prepare("UPDATE categories SET icon = :icon WHERE id = :id");
            $stmt->execute([':icon' => $relativePath, ':id' => $catId]);
            echo "  ✓ Base de données mise à jour: $relativePath\n";
        } else {
            echo "  ❌ Échec de génération de l'icône\n";
        }
        
        echo "\n";
    }
    
    echo "=== Conversion terminée ===\n";
    
} catch (PDOException $e) {
    die("❌ Erreur de base de données: " . $e->getMessage() . "\n");
} catch (Exception $e) {
    die("❌ Erreur: " . $e->getMessage() . "\n");
}

/**
 * Génère une image PNG à partir d'un emoji avec Imagick
 */
function generateEmojiPngImagick(string $emoji, string $outputPath, int $size = 256): bool
{
    try {
        $image = new Imagick();
        $image->setBackgroundColor(new ImagickPixel('transparent'));
        
        // Police Noto Color Emoji
        $fontPath = '/usr/share/fonts/noto/NotoColorEmoji.ttf';
        
        // Créer un texte avec l'emoji
        $draw = new ImagickDraw();
        $draw->setFont($fontPath);
        $draw->setFontSize($size * 0.7);
        $draw->setFillColor(new ImagickPixel('black'));
        $draw->setTextAlignment(Imagick::ALIGN_CENTER);
        $draw->setGravity(Imagick::GRAVITY_CENTER);
        
        // Créer l'image avec le texte
        $image->newImage($size, $size, new ImagickPixel('transparent'));
        $image->annotateImage($draw, $size/2, $size/2 + $size*0.25, 0, $emoji);
        $image->setImageFormat('png');
        
        $result = $image->writeImage($outputPath);
        $image->destroy();
        
        return $result;
    } catch (Exception $e) {
        echo "  ⚠ Erreur Imagick: " . $e->getMessage() . "\n";
        return generateEmojiPngGD($emoji, $outputPath, $size);
    }
}

/**
 * Génère une image PNG à partir d'un emoji avec GD
 * Utilise un fond transparent et l'emoji au centre
 */
function generateEmojiPngGD(string $emoji, string $outputPath, int $size = 256): bool
{
    // Créer une image avec fond transparent
    $image = imagecreatetruecolor($size, $size);
    
    // Activer l'alpha blending et sauvegarder l'alpha
    imagealphablending($image, false);
    imagesavealpha($image, true);
    
    // Fond transparent
    $transparent = imagecolorallocatealpha($image, 0, 0, 0, 127);
    imagefill($image, 0, 0, $transparent);
    
    // Chercher une police avec support emoji (Noto en priorité)
    $fontPaths = [
        '/usr/share/fonts/noto/NotoColorEmoji.ttf',  // Alpine (SWAG)
        '/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf',
        '/usr/share/fonts/google-noto-emoji/NotoColorEmoji.ttf',
        '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
        '/usr/share/fonts/dejavu/DejaVuSans.ttf',
    ];
    
    $fontPath = null;
    foreach ($fontPaths as $path) {
        if (file_exists($path)) {
            $fontPath = $path;
            echo "  📝 Police utilisée: $path\n";
            break;
        }
    }
    
    if ($fontPath === null) {
        // Pas de police trouvée, créer une image de fallback avec un carré coloré
        echo "  ⚠ Aucune police trouvée, génération d'un fallback\n";
        imagealphablending($image, true);
        
        // Couleur de fond selon la catégorie (basé sur le hash de l'emoji)
        $hash = crc32($emoji);
        $r = ($hash >> 16) & 0xFF;
        $g = ($hash >> 8) & 0xFF;
        $b = $hash & 0xFF;
        
        // S'assurer que la couleur n'est pas trop sombre
        $brightness = ($r + $g + $b) / 3;
        if ($brightness < 100) {
            $r = min(255, $r + 100);
            $g = min(255, $g + 100);
            $b = min(255, $b + 100);
        }
        
        $bgColor = imagecolorallocate($image, $r, $g, $b);
        $white = imagecolorallocate($image, 255, 255, 255);
        
        // Dessiner un rectangle arrondi (simulé par un rectangle simple)
        $padding = 20;
        imagefilledrectangle($image, $padding, $padding, $size - $padding, $size - $padding, $bgColor);
        
        // Ajouter le premier caractère de l'emoji (ou un caractère de fallback)
        $text = mb_substr($emoji, 0, 1);
        // Pour les emojis multi-byte, utiliser un caractère simple
        if (strlen($text) > 4) {
            $text = '?';
        }
        
        // Dessiner le texte au centre avec la police par défaut
        $fontSize = 5; // Taille de police GD par défaut (1-5)
        $textWidth = imagefontwidth($fontSize) * strlen($text);
        $textHeight = imagefontheight($fontSize);
        $x = ($size - $textWidth) / 2;
        $y = ($size - $textHeight) / 2;
        imagestring($image, $fontSize, (int)$x, (int)$y, $text, $white);
        
        // Sauvegarder l'image
        $result = imagepng($image, $outputPath);
        imagedestroy($image);
        
        return $result;
    }
    
    // Utiliser la police trouvée pour dessiner l'emoji
    imagealphablending($image, true);
    
    $textColor = imagecolorallocate($image, 0, 0, 0);
    $fontSize = $size * 0.6; // 60% de la taille de l'image
    
    // Calculer la boîte de texte pour centrer
    $bbox = imagettfbbox($fontSize, 0, $fontPath, $emoji);
    $textWidth = $bbox[2] - $bbox[0];
    $textHeight = $bbox[1] - $bbox[7];
    
    $x = ($size - $textWidth) / 2 - $bbox[0];
    $y = ($size - $textHeight) / 2 - $bbox[7];
    
    // Dessiner l'emoji
    imagettftext($image, $fontSize, 0, (int)$x, (int)$y, $textColor, $fontPath, $emoji);
    
    // Sauvegarder l'image
    $result = imagepng($image, $outputPath);
    imagedestroy($image);
    
    return $result;
}
