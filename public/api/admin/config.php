<?php
/**
 * SnowShelf - API Configuration Système
 * 
 * Gestion des tables de configuration admin :
 * - Admin_webApi : APIs externes
 * - Admin_Main_Config : Configuration principale
 * - user_limits : Limites utilisateurs
 * 
 * Endpoints:
 * GET    /api/admin/config.php?table=xxx           - Liste les entrées
 * GET    /api/admin/config.php?table=xxx&id=X      - Récupère une entrée
 * POST   /api/admin/config.php?table=xxx           - Crée une entrée
 * PUT    /api/admin/config.php?table=xxx&id=X      - Modifie une entrée
 * DELETE /api/admin/config.php?table=xxx&id=X      - Supprime une entrée
 */

// Headers CORS et JSON
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Chargement des dépendances
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../core/ApiAuth.php';
require_once __DIR__ . '/../../../core/UploadConfig.php';

// Initialisation
try {
    $db = getDbConnection();
    $auth = new ApiAuth($db);
} catch (Exception $e) {
    sendError(500, 'server_error', 'Erreur serveur');
}

// Authentification - Admin requis
$currentUser = $auth->authenticate();
if (!$currentUser || !$auth->isAdmin()) {
    $auth->sendForbidden('Accès réservé aux administrateurs');
}

// Tables autorisées et leur configuration
$allowedTables = [
    'Admin_webApi' => [
        'primaryKey' => 'id',
        'fields' => ['id', 'name', 'Name_UF', 'alias', 'api_key', 'client_id', 'Type', 'max_results_premium', 'max_results_free', 'Notes', 'Defaut_active', 'USER_API', 'READ_CODE', 'has_details', 'CLIENT_ID_ON', 'PREMIUM_ONLY', 'created_at', 'updated_at'],
        'editableFields' => ['name', 'Name_UF', 'alias', 'api_key', 'client_id', 'Type', 'max_results_premium', 'max_results_free', 'Notes', 'Defaut_active', 'USER_API', 'READ_CODE', 'has_details', 'CLIENT_ID_ON', 'PREMIUM_ONLY'],
        'requiredFields' => ['name', 'Name_UF'],
        'booleanFields' => ['Defaut_active', 'USER_API', 'READ_CODE', 'has_details', 'CLIENT_ID_ON', 'PREMIUM_ONLY'],
        'intFields' => ['max_results_premium', 'max_results_free'],
        'jsonFields' => []
    ],
    'Admin_Main_Config' => [
        'primaryKey' => null, // Pas de clé primaire, table à une seule ligne
        'fields' => ['WS_OCR_TIMEOUT', 'SNOWSHELF_TZ', 'IDENTIFY_OCR_URL', 'IDENTIFY_INFOS_URL', 'API_ENCRYPTION_KEY', 'AUTO_TRAD_URL', 'DEFAULT_THEME', 'DEFAULT_LANG', 'DEFAULT_BACKGROUND'],
        'editableFields' => ['WS_OCR_TIMEOUT', 'SNOWSHELF_TZ', 'IDENTIFY_OCR_URL', 'IDENTIFY_INFOS_URL', 'API_ENCRYPTION_KEY', 'AUTO_TRAD_URL', 'DEFAULT_THEME', 'DEFAULT_LANG', 'DEFAULT_BACKGROUND'],
        'requiredFields' => [],
        'booleanFields' => [],
        'intFields' => ['WS_OCR_TIMEOUT'],
        'jsonFields' => []
    ],
    'user_limits' => [
        'primaryKey' => 'id',
        'fields' => ['id', 'free_limit', 'premium_limit'],
        'editableFields' => ['free_limit', 'premium_limit'],
        'requiredFields' => ['free_limit'],
        'booleanFields' => [],
        'intFields' => ['free_limit', 'premium_limit'],
        'jsonFields' => []
    ],
    'upload_config' => [
        'primaryKey' => 'id',
        'fields' => ['id', 'category', 'extensions', 'max_size_mb', 'description', 'is_active', 'created_at', 'updated_at'],
        'editableFields' => ['category', 'extensions', 'max_size_mb', 'description', 'is_active'],
        'requiredFields' => ['category', 'extensions', 'max_size_mb'],
        'booleanFields' => ['is_active'],
        'intFields' => ['max_size_mb'],
        'jsonFields' => ['extensions'],
        'uniqueFields' => ['category']
    ],
    'proxy_whitelist' => [
        'primaryKey' => 'id',
        'fields' => ['id', 'domain', 'category', 'description', 'is_active', 'created_at'],
        'editableFields' => ['domain', 'category', 'description', 'is_active'],
        'requiredFields' => ['domain'],
        'booleanFields' => ['is_active'],
        'intFields' => [],
        'jsonFields' => [],
        'uniqueFields' => ['domain']  // Empêche les doublons de domaines
    ]
];

// Récupérer les paramètres
$table = $_GET['table'] ?? null;
$id = isset($_GET['id']) ? (int)$_GET['id'] : null;
$action = $_GET['action'] ?? null;
$method = $_SERVER['REQUEST_METHOD'];

// Action spéciale : test d'URL
if ($action === 'test_url' && $method === 'POST') {
    handleTestUrl();
}

// Action spéciale : upload background
if ($action === 'upload_background' && $method === 'POST') {
    handleUploadBackground($db);
}

// Action spéciale : supprimer background
if ($action === 'delete_background' && $method === 'DELETE') {
    handleDeleteBackground($db);
}

// Vérifier la table
if (!$table || !isset($allowedTables[$table])) {
    sendError(400, 'invalid_table', 'Table non valide. Tables autorisées: ' . implode(', ', array_keys($allowedTables)));
}

$tableConfig = $allowedTables[$table];

// Router les requêtes
switch ($method) {
    case 'GET':
        handleGet($db, $table, $tableConfig, $id);
        break;
    case 'POST':
        handlePost($db, $table, $tableConfig);
        break;
    case 'PUT':
        handlePut($db, $table, $tableConfig, $id);
        break;
    case 'DELETE':
        handleDelete($db, $table, $tableConfig, $id);
        break;
    default:
        sendError(405, 'method_not_allowed', 'Méthode non autorisée');
}

/**
 * GET - Liste ou récupère une entrée
 */
function handleGet(PDO $db, string $table, array $config, ?int $id): void
{
    $fields = implode(', ', $config['fields']);
    
    // Table sans clé primaire (Admin_Main_Config)
    if ($config['primaryKey'] === null) {
        $stmt = $db->query("SELECT {$fields} FROM {$table} LIMIT 1");
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$row) {
            // Retourner les valeurs par défaut si la table est vide
            sendSuccess(['exists' => false, 'data' => null]);
        }
        
        sendSuccess(['exists' => true, 'data' => $row]);
    }
    
    // Récupérer une entrée spécifique
    if ($id !== null) {
        $stmt = $db->prepare("SELECT {$fields} FROM {$table} WHERE {$config['primaryKey']} = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$row) {
            sendError(404, 'not_found', 'Entrée non trouvée');
        }
        
        sendSuccess($row);
    }
    
    // Liste toutes les entrées
    $stmt = $db->query("SELECT {$fields} FROM {$table} ORDER BY {$config['primaryKey']} ASC");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    sendSuccess([
        'items' => $rows,
        'total' => count($rows)
    ]);
}

/**
 * POST - Crée une entrée
 */
function handlePost(PDO $db, string $table, array $config): void
{
    $data = getJsonInput();
    error_log("[CONFIG API DEBUG] handlePost called for table: {$table}");
    error_log("[CONFIG API DEBUG] Raw input data: " . json_encode($data));
    
    // Table sans clé primaire - INSERT ou UPDATE si existe
    if ($config['primaryKey'] === null) {
        // Vérifier si une ligne existe
        $stmt = $db->query("SELECT COUNT(*) FROM {$table}");
        $exists = (int)$stmt->fetchColumn() > 0;
        
        $filteredData = filterData($data, $config);
        error_log("[CONFIG API DEBUG] Filtered data: " . json_encode($filteredData));
        
        if ($exists) {
            // UPDATE
            $setParts = [];
            $params = [];
            foreach ($filteredData as $field => $value) {
                $setParts[] = "{$field} = ?";
                $params[] = $value;
            }
            
            $sql = "UPDATE {$table} SET " . implode(', ', $setParts);
            error_log("[CONFIG API DEBUG] SQL: {$sql}");
            error_log("[CONFIG API DEBUG] Params: " . json_encode($params));
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
            error_log("[CONFIG API DEBUG] Rows affected: " . $stmt->rowCount());
            
            // Vérifier ce qui a été sauvegardé
            $checkStmt = $db->query("SELECT DEFAULT_THEME, DEFAULT_LANG FROM {$table} LIMIT 1");
            $savedData = $checkStmt->fetch(PDO::FETCH_ASSOC);
            error_log("[CONFIG API DEBUG] Data after save: " . json_encode($savedData));
        } else {
            // INSERT
            $fields = array_keys($filteredData);
            $placeholders = array_fill(0, count($fields), '?');
            
            $sql = "INSERT INTO {$table} (" . implode(', ', $fields) . ") VALUES (" . implode(', ', $placeholders) . ")";
            $stmt = $db->prepare($sql);
            $stmt->execute(array_values($filteredData));
        }
        
        sendSuccess(['message' => 'Configuration mise à jour']);
    }
    
    // Validation des champs requis
    foreach ($config['requiredFields'] as $field) {
        if (empty($data[$field])) {
            sendError(400, 'missing_field', "Le champ '{$field}' est requis");
        }
    }
    
    // Vérification des champs uniques
    $uniqueFields = $config['uniqueFields'] ?? [];
    foreach ($uniqueFields as $field) {
        if (!empty($data[$field])) {
            $checkStmt = $db->prepare("SELECT {$config['primaryKey']} FROM {$table} WHERE {$field} = ?");
            $checkStmt->execute([$data[$field]]);
            if ($checkStmt->fetch()) {
                sendError(400, 'duplicate', "Cette valeur pour '{$field}' existe déjà");
            }
        }
    }
    
    $filteredData = filterData($data, $config);
    
    $fields = array_keys($filteredData);
    $placeholders = array_fill(0, count($fields), '?');
    
    $sql = "INSERT INTO {$table} (" . implode(', ', $fields) . ") VALUES (" . implode(', ', $placeholders) . ")";
    
    try {
        $stmt = $db->prepare($sql);
        $stmt->execute(array_values($filteredData));
        $newId = $db->lastInsertId();
        
        sendSuccess([
            'id' => $newId,
            'message' => 'Entrée créée avec succès'
        ]);
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate entry') !== false) {
            sendError(400, 'duplicate', 'Une entrée avec ce nom existe déjà');
        }
        sendError(500, 'db_error', 'Erreur lors de la création');
    }
}

/**
 * PUT - Modifie une entrée
 */
function handlePut(PDO $db, string $table, array $config, ?int $id): void
{
    $data = getJsonInput();
    
    // Table sans clé primaire
    if ($config['primaryKey'] === null) {
        handlePost($db, $table, $config);
        return;
    }
    
    if ($id === null) {
        sendError(400, 'missing_id', 'ID requis pour la modification');
    }
    
    // Vérifier que l'entrée existe
    $stmt = $db->prepare("SELECT {$config['primaryKey']} FROM {$table} WHERE {$config['primaryKey']} = ?");
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        sendError(404, 'not_found', 'Entrée non trouvée');
    }
    
    $filteredData = filterData($data, $config);
    
    if (empty($filteredData)) {
        sendError(400, 'no_data', 'Aucune donnée à mettre à jour');
    }
    
    // Vérifier les champs uniques (pour éviter les doublons, en excluant l'entrée courante)
    if (!empty($config['uniqueFields'])) {
        foreach ($config['uniqueFields'] as $uniqueField) {
            if (isset($filteredData[$uniqueField])) {
                $stmt = $db->prepare("SELECT {$config['primaryKey']} FROM {$table} WHERE {$uniqueField} = ? AND {$config['primaryKey']} != ?");
                $stmt->execute([$filteredData[$uniqueField], $id]);
                if ($stmt->fetch()) {
                    sendError(400, 'duplicate', "Une entrée avec cette valeur de '{$uniqueField}' existe déjà");
                }
            }
        }
    }
    
    $setParts = [];
    $params = [];
    foreach ($filteredData as $field => $value) {
        $setParts[] = "{$field} = ?";
        $params[] = $value;
    }
    $params[] = $id;
    
    $sql = "UPDATE {$table} SET " . implode(', ', $setParts) . " WHERE {$config['primaryKey']} = ?";
    
    try {
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        
        sendSuccess(['message' => 'Entrée mise à jour avec succès']);
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate entry') !== false) {
            sendError(400, 'duplicate', 'Une entrée avec ce nom existe déjà');
        }
        sendError(500, 'db_error', 'Erreur lors de la mise à jour');
    }
}

/**
 * DELETE - Supprime une entrée
 */
function handleDelete(PDO $db, string $table, array $config, ?int $id): void
{
    // Pas de suppression pour Admin_Main_Config
    if ($config['primaryKey'] === null) {
        sendError(400, 'not_allowed', 'La suppression n\'est pas autorisée pour cette table');
    }
    
    if ($id === null) {
        sendError(400, 'missing_id', 'ID requis pour la suppression');
    }
    
    // Vérifier que l'entrée existe
    $stmt = $db->prepare("SELECT {$config['primaryKey']} FROM {$table} WHERE {$config['primaryKey']} = ?");
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        sendError(404, 'not_found', 'Entrée non trouvée');
    }
    
    $stmt = $db->prepare("DELETE FROM {$table} WHERE {$config['primaryKey']} = ?");
    $stmt->execute([$id]);
    
    sendSuccess(['message' => 'Entrée supprimée avec succès']);
}

/**
 * Filtre les données selon la config de la table
 */
function filterData(array $data, array $config): array
{
    error_log("[CONFIG API DEBUG] filterData input: " . json_encode($data));
    error_log("[CONFIG API DEBUG] editableFields: " . json_encode($config['editableFields']));
    
    $filtered = [];
    $jsonFields = $config['jsonFields'] ?? [];
    
    foreach ($data as $field => $value) {
        if (!in_array($field, $config['editableFields'])) {
            error_log("[CONFIG API DEBUG] Field '{$field}' not in editableFields, skipping");
            continue;
        }
        
        // Convertir les booléens
        if (in_array($field, $config['booleanFields'])) {
            $filtered[$field] = $value ? 1 : 0;
            continue;
        }
        
        // Convertir les entiers
        if (in_array($field, $config['intFields'])) {
            $filtered[$field] = (int)$value;
            continue;
        }
        
        // Convertir les champs JSON (tableau → JSON string)
        if (in_array($field, $jsonFields)) {
            if (is_array($value)) {
                $filtered[$field] = json_encode($value);
            } elseif (is_string($value)) {
                // Si c'est déjà une string, vérifier si c'est du JSON valide ou une liste CSV
                $decoded = json_decode($value, true);
                if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                    $filtered[$field] = $value; // Déjà du JSON valide
                } else {
                    // Considérer comme une liste séparée par des virgules
                    $items = array_map('trim', explode(',', $value));
                    $items = array_filter($items, fn($item) => !empty($item));
                    $items = array_map('strtolower', $items);
                    $filtered[$field] = json_encode(array_values($items));
                }
            } else {
                $filtered[$field] = json_encode([]);
            }
            continue;
        }
        
        $filtered[$field] = $value;
    }
    
    return $filtered;
}

/**
 * Récupère les données JSON de la requête
 */
function getJsonInput(): array
{
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    return is_array($data) ? $data : [];
}

/**
 * Envoie une réponse de succès
 */
function sendSuccess($data): void
{
    echo json_encode([
        'success' => true,
        'data' => $data
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Envoie une réponse d'erreur
 */
function sendError(int $httpCode, string $error, string $message): void
{
    http_response_code($httpCode);
    echo json_encode([
        'success' => false,
        'error' => $error,
        'message' => $message
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Test d'accessibilité d'une URL
 */
function handleTestUrl(): void
{
    $data = getJsonInput();
    $url = $data['url'] ?? '';
    
    // Validation de l'URL
    if (empty($url)) {
        sendError(400, 'missing_url', 'URL requise');
    }
    
    if (!filter_var($url, FILTER_VALIDATE_URL)) {
        sendError(400, 'invalid_url', 'Format d\'URL invalide');
    }
    
    // Vérifier le protocole (http ou https uniquement)
    $scheme = parse_url($url, PHP_URL_SCHEME);
    if (!in_array($scheme, ['http', 'https'])) {
        sendError(400, 'invalid_protocol', 'Seuls les protocoles HTTP et HTTPS sont autorisés');
    }
    
    // Test de l'URL avec cURL
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS => 3,
        CURLOPT_NOBODY => true, // HEAD request seulement
        CURLOPT_SSL_VERIFYPEER => false, // Pour les certificats auto-signés
        CURLOPT_USERAGENT => 'SnowShelf URL Checker/1.0'
    ]);
    
    $result = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $totalTime = round(curl_getinfo($ch, CURLINFO_TOTAL_TIME) * 1000); // en ms
    $error = curl_error($ch);
    $errno = curl_errno($ch);
    curl_close($ch);
    
    // Analyser le résultat
    if ($errno !== 0) {
        // Erreur cURL
        $errorMessages = [
            CURLE_COULDNT_RESOLVE_HOST => 'Impossible de résoudre l\'hôte',
            CURLE_COULDNT_CONNECT => 'Impossible de se connecter au serveur',
            CURLE_OPERATION_TIMEDOUT => 'Délai d\'attente dépassé',
            CURLE_SSL_CONNECT_ERROR => 'Erreur de connexion SSL',
            CURLE_GOT_NOTHING => 'Aucune réponse du serveur',
        ];
        
        $message = $errorMessages[$errno] ?? "Erreur de connexion: {$error}";
        sendSuccess([
            'accessible' => false,
            'status' => 'error',
            'message' => $message,
            'http_code' => 0,
            'response_time' => $totalTime
        ]);
    }
    
    // Vérifier le code HTTP
    $isSuccess = $httpCode >= 200 && $httpCode < 400;
    
    if ($isSuccess) {
        sendSuccess([
            'accessible' => true,
            'status' => 'success',
            'message' => "URL accessible (HTTP {$httpCode})",
            'http_code' => $httpCode,
            'response_time' => $totalTime
        ]);
    } else {
        $statusMessages = [
            401 => 'Non autorisé (authentification requise)',
            403 => 'Accès interdit',
            404 => 'Page non trouvée',
            500 => 'Erreur serveur interne',
            502 => 'Mauvaise passerelle',
            503 => 'Service indisponible',
        ];
        
        $message = $statusMessages[$httpCode] ?? "Erreur HTTP {$httpCode}";
        sendSuccess([
            'accessible' => false,
            'status' => 'warning',
            'message' => $message,
            'http_code' => $httpCode,
            'response_time' => $totalTime
        ]);
    }
}

/**
 * Upload du background par défaut
 */
function handleUploadBackground(PDO $db): void
{
    // Vérifier qu'un fichier a été envoyé
    if (!isset($_FILES['background']) || $_FILES['background']['error'] !== UPLOAD_ERR_OK) {
        $errorMessages = [
            UPLOAD_ERR_INI_SIZE => 'Le fichier dépasse la taille maximale autorisée',
            UPLOAD_ERR_FORM_SIZE => 'Le fichier dépasse la taille maximale du formulaire',
            UPLOAD_ERR_PARTIAL => 'Le fichier n\'a été que partiellement téléchargé',
            UPLOAD_ERR_NO_FILE => 'Aucun fichier n\'a été téléchargé',
            UPLOAD_ERR_NO_TMP_DIR => 'Dossier temporaire manquant',
            UPLOAD_ERR_CANT_WRITE => 'Échec de l\'écriture du fichier',
        ];
        $error = $_FILES['background']['error'] ?? UPLOAD_ERR_NO_FILE;
        sendError(400, 'upload_error', $errorMessages[$error] ?? 'Erreur d\'upload');
    }
    
    $file = $_FILES['background'];
    
    // Récupération de la config depuis la table upload_config (catégorie 'images')
    $uploadConfig = UploadConfig::getConfig('images');
    
    // Extensions autorisées avec mapping MIME
    $extensionToMime = [
        'png' => 'image/png',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'gif' => 'image/gif',
        'webp' => 'image/webp'
    ];
    
    // Construire la liste des types MIME autorisés
    $allowedTypes = [];
    if ($uploadConfig) {
        foreach ($uploadConfig['extensions'] as $ext) {
            $ext = strtolower($ext);
            if (isset($extensionToMime[$ext])) {
                $allowedTypes[] = $extensionToMime[$ext];
            }
        }
    }
    
    // Fallback si pas de config
    if (empty($allowedTypes)) {
        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    }
    
    // Vérifier le type MIME
    $finfo = new finfo(FILEINFO_MIME_TYPE);
    $mimeType = $finfo->file($file['tmp_name']);
    
    if (!in_array($mimeType, $allowedTypes)) {
        sendError(400, 'invalid_type', 'Type de fichier non autorisé. Formats acceptés: JPG, PNG, GIF, WebP');
    }
    
    // Vérifier la taille depuis config (fallback 5 Mo)
    $maxSize = $uploadConfig ? $uploadConfig['maxSize'] : 5 * 1024 * 1024;
    $maxSizeMb = round($maxSize / (1024 * 1024));
    
    if ($file['size'] > $maxSize) {
        sendError(400, 'file_too_large', "Le fichier est trop volumineux (max {$maxSizeMb} Mo)");
    }
    
    // Déterminer l'extension
    $extensions = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/gif' => 'gif',
        'image/webp' => 'webp'
    ];
    $ext = $extensions[$mimeType];
    
    // Chemin de destination
    $uploadDir = __DIR__ . '/../../assets/images/backgrounds/';
    $filename = 'bgrddefaut.' . $ext;
    $filepath = $uploadDir . $filename;
    
    // Supprimer les anciens fichiers bgrddefaut.*
    $existingFiles = glob($uploadDir . 'bgrddefaut.*');
    foreach ($existingFiles as $existingFile) {
        unlink($existingFile);
    }
    
    // Déplacer le fichier
    if (!move_uploaded_file($file['tmp_name'], $filepath)) {
        sendError(500, 'move_failed', 'Erreur lors du déplacement du fichier');
    }
    
    // Mettre à jour la base de données
    $relativePath = 'assets/images/backgrounds/' . $filename;
    
    // Vérifier si une ligne existe
    $stmt = $db->query("SELECT COUNT(*) FROM Admin_Main_Config");
    $exists = $stmt->fetchColumn() > 0;
    
    if ($exists) {
        $stmt = $db->prepare("UPDATE Admin_Main_Config SET DEFAULT_BACKGROUND = ?");
        $stmt->execute([$relativePath]);
    } else {
        $stmt = $db->prepare("INSERT INTO Admin_Main_Config (DEFAULT_BACKGROUND) VALUES (?)");
        $stmt->execute([$relativePath]);
    }
    
    sendSuccess([
        'message' => 'Image uploadée avec succès',
        'path' => $relativePath,
        'url' => '../' . $relativePath
    ]);
}

/**
 * Supprimer le background par défaut
 */
function handleDeleteBackground(PDO $db): void
{
    // Supprimer les fichiers bgrddefaut.*
    $uploadDir = __DIR__ . '/../../assets/images/backgrounds/';
    $existingFiles = glob($uploadDir . 'bgrddefaut.*');
    foreach ($existingFiles as $existingFile) {
        unlink($existingFile);
    }
    
    // Mettre à jour la base de données
    $stmt = $db->prepare("UPDATE Admin_Main_Config SET DEFAULT_BACKGROUND = NULL");
    $stmt->execute();
    
    sendSuccess([
        'message' => 'Image supprimée avec succès'
    ]);
}
