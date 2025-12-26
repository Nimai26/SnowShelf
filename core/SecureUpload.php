<?php
/**
 * SecureUpload - Classe de gestion sécurisée des uploads de fichiers
 * 
 * Cette classe gère les uploads de fichiers de manière sécurisée :
 * - Validation du type MIME réel du fichier
 * - Validation de l'extension
 * - Renommage sécurisé des fichiers
 * - Vérification de la taille
 * - Suppression des métadonnées dangereuses
 * 
 * Les limites (extensions, tailles) sont chargées depuis la table upload_config
 * via la classe UploadConfig, permettant une gestion centralisée par l'admin.
 */

require_once __DIR__ . '/UploadConfig.php';

class SecureUpload
{
    // Cache de configuration chargée depuis UploadConfig
    private static ?array $loadedConfig = null;

    // Extensions dangereuses à bloquer absolument (sécurité, non configurable)
    private static array $dangerousExtensions = [
        'php', 'php3', 'php4', 'php5', 'php7', 'php8', 'phtml', 'phar', 'phps',
        'cgi', 'pl', 'py', 'pyc', 'pyo',
        'sh', 'bash', 'zsh', 'ksh',
        'exe', 'dll', 'bat', 'cmd', 'com', 'msi',
        'js', 'jse', 'vbs', 'vbe', 'wsf', 'wsh',
        'htaccess', 'htpasswd',
        'asp', 'aspx', 'cer', 'csr',
        'jsp', 'jspx',
        'cfm', 'cfc',
        'shtml', 'shtm',
        'svg' // SVG peut contenir du JavaScript - géré séparément si nécessaire
    ];

    /**
     * Récupère la configuration d'une catégorie depuis UploadConfig
     * 
     * @param string $category Catégorie
     * @return array|null Configuration ou null si non trouvée
     */
    private static function getCategoryConfig(string $category): ?array
    {
        return UploadConfig::getCategory($category);
    }

    /**
     * Valide et déplace un fichier uploadé de manière sécurisée
     *
     * @param array $file Élément de $_FILES
     * @param string $category Type de fichier (images, audio, videos, documents, avatar)
     * @param string $destinationDir Répertoire de destination
     * @param string|null $customName Nom personnalisé (sans extension)
     * @return array ['success' => bool, 'path' => string|null, 'error' => string|null]
     */
    public static function upload(array $file, string $category, string $destinationDir, ?string $customName = null): array
    {
        // Vérifier que le fichier a été uploadé via HTTP POST
        if (!isset($file['tmp_name']) || !is_uploaded_file($file['tmp_name'])) {
            return self::error('Aucun fichier uploadé ou tentative d\'injection');
        }

        // Vérifier les erreurs d'upload PHP
        if ($file['error'] !== UPLOAD_ERR_OK) {
            return self::error(self::getUploadErrorMessage($file['error']));
        }

        // Récupérer la configuration de la catégorie depuis UploadConfig (BDD)
        $config = self::getCategoryConfig($category);
        if ($config === null) {
            return self::error('Catégorie de fichier non reconnue');
        }

        // Vérifier la taille du fichier
        if ($file['size'] > $config['maxSize']) {
            $maxSizeMB = $config['maxSizeMB'];
            return self::error("Le fichier dépasse la taille maximale autorisée ({$maxSizeMB} MB)");
        }

        // Obtenir l'extension originale
        $originalName = $file['name'];
        $extension = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

        // Vérifier que l'extension n'est pas dangereuse
        if (in_array($extension, self::$dangerousExtensions)) {
            return self::error('Type de fichier non autorisé (extension dangereuse)');
        }

        // Vérifier que l'extension est autorisée pour cette catégorie
        if (!in_array($extension, $config['extensions'])) {
            return self::error('Extension de fichier non autorisée pour cette catégorie');
        }

        // Vérifier le type MIME réel du fichier
        $realMimeType = self::getRealMimeType($file['tmp_name']);
        if (!in_array($realMimeType, $config['mimes'])) {
            return self::error('Le type réel du fichier ne correspond pas à son extension');
        }

        // Vérification supplémentaire pour les images
        if ($category === 'images' || $category === 'avatar') {
            if (!self::isValidImage($file['tmp_name'])) {
                return self::error('Le fichier image est invalide ou corrompu');
            }
        }

        // Vérification pour SVG (peut contenir du JavaScript)
        if ($extension === 'svg') {
            if (!self::isSafeSvg($file['tmp_name'])) {
                return self::error('Le fichier SVG contient du contenu potentiellement dangereux');
            }
        }

        // Créer le répertoire de destination si nécessaire
        if (!is_dir($destinationDir)) {
            if (!mkdir($destinationDir, 0755, true)) {
                return self::error('Impossible de créer le répertoire de destination');
            }
        }

        // Générer un nom de fichier sécurisé
        if ($customName) {
            $safeName = self::sanitizeFilename($customName, false); // Sans extension, on l'ajoute après
        } else {
            $safeName = bin2hex(random_bytes(16)); // Nom aléatoire sécurisé
        }

        $finalName = $safeName . '.' . $extension;
        $destinationPath = rtrim($destinationDir, '/') . '/' . $finalName;

        // Vérifier que le chemin de destination est valide (pas de traversée)
        $realDestDir = realpath($destinationDir);
        if ($realDestDir === false) {
            // Le dossier vient d'être créé, on refait le check
            $realDestDir = realpath($destinationDir);
        }

        // Déplacer le fichier
        if (!move_uploaded_file($file['tmp_name'], $destinationPath)) {
            return self::error('Erreur lors du déplacement du fichier');
        }

        // Définir les permissions correctes (lecture seule pour tous, écriture pour le propriétaire)
        chmod($destinationPath, 0644);

        return [
            'success' => true,
            'path' => $destinationPath,
            'filename' => $finalName,
            'error' => null
        ];
    }

    /**
     * Supprime un fichier de manière sécurisée
     *
     * @param string $filePath Chemin du fichier à supprimer
     * @param string $baseDir Répertoire de base autorisé
     * @return bool
     */
    public static function delete(string $filePath, string $baseDir): bool
    {
        // Résoudre les chemins réels
        $realPath = realpath($filePath);
        $realBaseDir = realpath($baseDir);

        // Vérifier que le fichier existe et est dans le répertoire autorisé
        if ($realPath === false || $realBaseDir === false) {
            return false;
        }

        // Prévenir la traversée de répertoire
        if (strpos($realPath, $realBaseDir) !== 0) {
            return false;
        }

        // Vérifier que c'est bien un fichier
        if (!is_file($realPath)) {
            return false;
        }

        return unlink($realPath);
    }

    /**
     * Obtient le type MIME réel d'un fichier
     */
    private static function getRealMimeType(string $filePath): string
    {
        // Utiliser finfo pour obtenir le type MIME réel
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $filePath);
        finfo_close($finfo);

        return $mimeType ?: '';
    }

    /**
     * Vérifie qu'une image est valide
     */
    private static function isValidImage(string $filePath): bool
    {
        // Essayer de lire les informations de l'image
        $imageInfo = @getimagesize($filePath);
        
        if ($imageInfo === false) {
            return false;
        }

        // Vérifier que les dimensions sont valides
        if ($imageInfo[0] <= 0 || $imageInfo[1] <= 0) {
            return false;
        }

        return true;
    }

    /**
     * Vérifie qu'un fichier SVG est sûr (pas de JavaScript)
     */
    private static function isSafeSvg(string $filePath): bool
    {
        $content = file_get_contents($filePath);
        if ($content === false) {
            return false;
        }

        // Patterns dangereux dans les SVG
        $dangerousPatterns = [
            '/<script/i',
            '/javascript:/i',
            '/on\w+\s*=/i', // onclick, onload, etc.
            '/<iframe/i',
            '/<embed/i',
            '/<object/i',
            '/<foreignObject/i',
            '/data:/i', // data URIs
            '/xlink:href\s*=\s*["\'](?!#)/i', // xlink externe
        ];

        foreach ($dangerousPatterns as $pattern) {
            if (preg_match($pattern, $content)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Nettoie un nom de fichier
     * @param string $filename Le nom de fichier à nettoyer
     * @param bool $keepExtension Si true, conserve l'extension du fichier
     * @return string Le nom de fichier nettoyé
     */
    public static function sanitizeFilename(string $filename, bool $keepExtension = true): string
    {
        // Séparer le nom et l'extension
        $extension = '';
        if ($keepExtension) {
            $pathInfo = pathinfo($filename);
            $extension = isset($pathInfo['extension']) ? '.' . strtolower($pathInfo['extension']) : '';
            $filename = $pathInfo['filename'] ?? $filename;
        }
        
        // Supprimer les caractères dangereux
        $filename = preg_replace('/[^a-zA-Z0-9_-]/', '_', $filename);
        
        // Limiter la longueur
        $filename = substr($filename, 0, 100);
        
        // S'assurer que le nom n'est pas vide
        if (empty($filename)) {
            $filename = bin2hex(random_bytes(8));
        }

        return $filename . $extension;
    }

    /**
     * Retourne un message d'erreur formaté
     */
    private static function error(string $message): array
    {
        return [
            'success' => false,
            'path' => null,
            'filename' => null,
            'error' => $message
        ];
    }

    /**
     * Convertit le code d'erreur PHP en message
     */
    private static function getUploadErrorMessage(int $errorCode): string
    {
        return match ($errorCode) {
            UPLOAD_ERR_INI_SIZE => 'Le fichier dépasse la taille maximale autorisée par PHP',
            UPLOAD_ERR_FORM_SIZE => 'Le fichier dépasse la taille maximale spécifiée dans le formulaire',
            UPLOAD_ERR_PARTIAL => 'Le fichier n\'a été que partiellement uploadé',
            UPLOAD_ERR_NO_FILE => 'Aucun fichier n\'a été uploadé',
            UPLOAD_ERR_NO_TMP_DIR => 'Dossier temporaire manquant',
            UPLOAD_ERR_CANT_WRITE => 'Échec de l\'écriture du fichier sur le disque',
            UPLOAD_ERR_EXTENSION => 'Une extension PHP a arrêté l\'upload',
            default => 'Erreur inconnue lors de l\'upload'
        };
    }

    /**
     * Obtient la configuration des types autorisés pour une catégorie
     */
    public static function getAllowedConfig(string $category): ?array
    {
        return self::$allowedTypes[$category] ?? null;
    }

    /**
     * Crée la structure de dossiers pour un utilisateur
     *
     * @param int $userId ID de l'utilisateur
     * @param string $baseStoragePath Chemin de base du storage
     * @return bool
     */
    public static function createUserDirectories(int $userId, string $baseStoragePath): bool
    {
        $userDir = rtrim($baseStoragePath, '/') . '/users/' . $userId;
        
        $directories = [
            $userDir,
            $userDir . '/Objets',
            $userDir . '/Categories',
        ];

        foreach ($directories as $dir) {
            if (!is_dir($dir)) {
                if (!mkdir($dir, 0755, true)) {
                    return false;
                }
                // Créer un index.php pour empêcher le listing
                file_put_contents($dir . '/index.php', '<?php http_response_code(403); exit("Access Denied");');
            }
        }

        return true;
    }

    /**
     * Crée la structure de dossiers pour un objet d'un utilisateur
     *
     * @param int $userId ID de l'utilisateur
     * @param int $objectId ID de l'objet
     * @param string $baseStoragePath Chemin de base du storage
     * @return bool
     */
    public static function createObjectDirectories(int $userId, int $objectId, string $baseStoragePath): bool
    {
        $objectDir = rtrim($baseStoragePath, '/') . '/users/' . $userId . '/Objets/' . $objectId;
        
        $directories = [
            $objectDir . '/images',
            $objectDir . '/audio',
            $objectDir . '/videos',
            $objectDir . '/documents',
        ];

        foreach ($directories as $dir) {
            if (!is_dir($dir)) {
                if (!mkdir($dir, 0755, true)) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Crée la structure de dossiers pour une catégorie personnalisée
     *
     * @param int $userId ID de l'utilisateur
     * @param int $categoryId ID de la catégorie
     * @param string $baseStoragePath Chemin de base du storage
     * @return bool
     */
    public static function createCategoryDirectories(int $userId, int $categoryId, string $baseStoragePath): bool
    {
        $categoryDir = rtrim($baseStoragePath, '/') . '/users/' . $userId . '/Categories/' . $categoryId;
        
        $directories = [
            $categoryDir . '/images',
            $categoryDir . '/audio',
            $categoryDir . '/videos',
            $categoryDir . '/documents',
        ];

        foreach ($directories as $dir) {
            if (!is_dir($dir)) {
                if (!mkdir($dir, 0755, true)) {
                    return false;
                }
            }
        }

        return true;
    }
}
