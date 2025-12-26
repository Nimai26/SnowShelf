<?php
/**
 * SnowShelf - API Admin Databases
 * Gestion des bases de données internes (VG_DB, etc.)
 */

session_start();

// Vérifier l'authentification et les droits admin
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Non authentifié']);
    exit;
}

if (!($_SESSION['is_admin'] ?? false)) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Accès refusé']);
    exit;
}

require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../core/SecureUpload.php';
require_once __DIR__ . '/../../../core/logger.php';

header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$table = $_GET['table'] ?? '';

// Chemins de stockage
define('VG_DB_PLATFORMS_PATH', __DIR__ . '/../../../storage/VG_DB/Platforms');

try {
    // Connexion à la base de données des plateformes
    $platformDb = getPlatformDbConnection();
    
    switch ($table) {
        case 'platforms':
            handlePlatforms($platformDb, $method, $action);
            break;
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Table non spécifiée ou invalide']);
    }
} catch (Exception $e) {
    loger('admin-databases', 'ERROR', 'API Error', ['error' => $e->getMessage()]);
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

/**
 * Gestion des plateformes VG_DB
 */
function handlePlatforms($db, $method, $action) {
    switch ($method) {
        case 'GET':
            if ($action === 'stats') {
                // Statistiques globales
                getPlatformStats($db);
            } elseif ($action === 'list') {
                // Liste paginée des plateformes
                listPlatforms($db);
            } elseif ($action === 'get' && isset($_GET['id'])) {
                // Détails d'une plateforme
                getPlatform($db, (int)$_GET['id']);
            } elseif ($action === 'manufacturers') {
                // Liste des fabricants
                getManufacturers($db);
            } else {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Action GET non reconnue']);
            }
            break;
            
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            
            if ($action === 'create') {
                // Créer une plateforme
                createPlatform($db, $data);
            } elseif ($action === 'upload_image' && isset($_GET['id'])) {
                // Upload d'image pour une plateforme
                uploadPlatformImage($db, (int)$_GET['id']);
            } else {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Action POST non reconnue']);
            }
            break;
            
        case 'PUT':
            $data = json_decode(file_get_contents('php://input'), true);
            if (isset($_GET['id'])) {
                updatePlatform($db, (int)$_GET['id'], $data);
            } else {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'ID requis pour PUT']);
            }
            break;
            
        case 'DELETE':
            if ($action === 'image' && isset($_GET['id']) && isset($_GET['filename'])) {
                // Supprimer une image spécifique
                deletePlatformImage($db, (int)$_GET['id'], $_GET['filename']);
            } elseif (isset($_GET['id'])) {
                // Supprimer une plateforme
                deletePlatform($db, (int)$_GET['id']);
            } else {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'ID requis pour DELETE']);
            }
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Méthode non autorisée']);
    }
}

/**
 * Statistiques des plateformes
 */
function getPlatformStats($db) {
    $stats = [];
    
    // Total plateformes
    $stmt = $db->query("SELECT COUNT(*) as total FROM Platform");
    $stats['total'] = (int)$stmt->fetchColumn();
    
    // Avec image console
    $stmt = $db->query("SELECT COUNT(*) FROM Platform WHERE img_console IS NOT NULL AND img_console != ''");
    $stats['with_console_images'] = (int)$stmt->fetchColumn();
    
    // Avec logo
    $stmt = $db->query("SELECT COUNT(*) FROM Platform WHERE img_logo IS NOT NULL AND img_logo != ''");
    $stats['with_logo_images'] = (int)$stmt->fetchColumn();
    
    // Sans images (ni console ni logo)
    $stmt = $db->query("SELECT COUNT(*) FROM Platform WHERE (img_console IS NULL OR img_console = '') AND (img_logo IS NULL OR img_logo = '')");
    $stats['without_images'] = (int)$stmt->fetchColumn();
    
    // Par fabricant
    $stmt = $db->query("SELECT manufacturer, COUNT(*) as count FROM Platform WHERE manufacturer IS NOT NULL GROUP BY manufacturer ORDER BY count DESC LIMIT 10");
    $stats['by_manufacturer'] = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo json_encode(['success' => true, 'data' => $stats]);
}

/**
 * Liste paginée des plateformes
 */
function listPlatforms($db) {
    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = min(100, max(10, (int)($_GET['limit'] ?? 50)));
    $offset = ($page - 1) * $limit;
    
    $search = $_GET['search'] ?? '';
    $manufacturer = $_GET['manufacturer'] ?? '';
    $hasImages = $_GET['has_images'] ?? ''; // 'yes', 'no', 'console', 'logo'
    $sortBy = $_GET['sort'] ?? 'name';
    $sortOrder = strtoupper($_GET['order'] ?? 'ASC') === 'DESC' ? 'DESC' : 'ASC';
    
    // Construction de la requête
    $where = [];
    $params = [];
    
    if ($search) {
        $where[] = "(name LIKE :search OR altername LIKE :search2)";
        $params[':search'] = "%{$search}%";
        $params[':search2'] = "%{$search}%";
    }
    
    if ($manufacturer) {
        $where[] = "manufacturer = :manufacturer";
        $params[':manufacturer'] = $manufacturer;
    }
    
    if ($hasImages === 'yes') {
        $where[] = "((img_console IS NOT NULL AND img_console != '') OR (img_logo IS NOT NULL AND img_logo != ''))";
    } elseif ($hasImages === 'no') {
        $where[] = "(img_console IS NULL OR img_console = '') AND (img_logo IS NULL OR img_logo = '')";
    } elseif ($hasImages === 'console') {
        $where[] = "img_console IS NOT NULL AND img_console != ''";
    } elseif ($hasImages === 'logo') {
        $where[] = "img_logo IS NOT NULL AND img_logo != ''";
    }
    
    $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';
    
    // Colonnes de tri autorisées
    $allowedSorts = ['id', 'name', 'manufacturer', 'release_date', 'created_at', 'updated_at'];
    if (!in_array($sortBy, $allowedSorts)) {
        $sortBy = 'name';
    }
    
    // Compter le total
    $countSql = "SELECT COUNT(*) FROM Platform $whereClause";
    $stmt = $db->prepare($countSql);
    $stmt->execute($params);
    $total = (int)$stmt->fetchColumn();
    
    // Récupérer les plateformes
    $sql = "SELECT id, name, manufacturer, release_date, img_console, img_logo, created_at, updated_at 
            FROM Platform 
            $whereClause 
            ORDER BY $sortBy $sortOrder 
            LIMIT :limit OFFSET :offset";
    
    $stmt = $db->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    
    $platforms = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Ajouter les URLs d'images
    foreach ($platforms as &$platform) {
        // Construire les URLs complètes pour les images
        // Si la valeur est déjà une URL (commence par /), l'utiliser telle quelle
        $platform['img_console_url'] = $platform['img_console'] 
            ? (str_starts_with($platform['img_console'], '/') 
                ? $platform['img_console'] 
                : "/storage/VG_DB/Platforms/{$platform['id']}/{$platform['img_console']}")
            : null;
        $platform['img_logo_url'] = $platform['img_logo'] 
            ? (str_starts_with($platform['img_logo'], '/') 
                ? $platform['img_logo'] 
                : "/storage/VG_DB/Platforms/{$platform['id']}/{$platform['img_logo']}")
            : null;
        
        // Image principale : logo prioritaire, sinon console
        $platform['primary_image'] = $platform['img_logo_url'] ?: $platform['img_console_url'];
        
        // Comptage des images pour l'affichage
        $platform['images_count'] = ($platform['img_console'] ? 1 : 0) + ($platform['img_logo'] ? 1 : 0);
    }
    
    echo json_encode([
        'success' => true,
        'data' => $platforms,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'pages' => ceil($total / $limit)
        ]
    ]);
}

/**
 * Détails d'une plateforme
 */
function getPlatform($db, $id) {
    $stmt = $db->prepare("SELECT * FROM Platform WHERE id = :id");
    $stmt->execute([':id' => $id]);
    $platform = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$platform) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Plateforme non trouvée']);
        return;
    }
    
    // Décoder les JSON
    $platform['altername'] = $platform['altername'] ? json_decode($platform['altername'], true) : [];
    $platform['accessories'] = $platform['accessories'] ? json_decode($platform['accessories'], true) : [];
    
    // Construire les URLs complètes
    // Si la valeur est déjà une URL (commence par /), l'utiliser telle quelle
    $platform['img_console_url'] = $platform['img_console'] 
        ? (str_starts_with($platform['img_console'], '/') 
            ? $platform['img_console'] 
            : "/storage/VG_DB/Platforms/{$platform['id']}/{$platform['img_console']}")
        : null;
    $platform['img_logo_url'] = $platform['img_logo'] 
        ? (str_starts_with($platform['img_logo'], '/') 
            ? $platform['img_logo'] 
            : "/storage/VG_DB/Platforms/{$platform['id']}/{$platform['img_logo']}")
        : null;
    
    // Image principale : logo prioritaire, sinon console
    $platform['primary_image'] = $platform['img_logo_url'] ?: $platform['img_console_url'];
    
    echo json_encode(['success' => true, 'data' => $platform]);
}

/**
 * Liste des fabricants
 */
function getManufacturers($db) {
    $stmt = $db->query("SELECT DISTINCT manufacturer FROM Platform WHERE manufacturer IS NOT NULL ORDER BY manufacturer");
    $manufacturers = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo json_encode(['success' => true, 'data' => $manufacturers]);
}

/**
 * Créer une plateforme
 */
function createPlatform($db, $data) {
    $required = ['name'];
    foreach ($required as $field) {
        if (empty($data[$field])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => "Le champ '$field' est requis"]);
            return;
        }
    }
    
    // Vérifier l'unicité du nom
    $stmt = $db->prepare("SELECT id FROM Platform WHERE name = :name");
    $stmt->execute([':name' => $data['name']]);
    if ($stmt->fetch()) {
        http_response_code(409);
        echo json_encode(['success' => false, 'error' => 'Une plateforme avec ce nom existe déjà']);
        return;
    }
    
    $sql = "INSERT INTO Platform (name, release_date, developer, manufacturer, cpu, memory, graphics, sound, display, media, max_controllers, desc_en, desc_fr, desc_es, altername, img_console, img_logo, accessories) 
            VALUES (:name, :release_date, :developer, :manufacturer, :cpu, :memory, :graphics, :sound, :display, :media, :max_controllers, :desc_en, :desc_fr, :desc_es, :altername, :img_console, :img_logo, :accessories)";
    
    $stmt = $db->prepare($sql);
    $stmt->execute([
        ':name' => $data['name'],
        ':release_date' => $data['release_date'] ?? null,
        ':developer' => $data['developer'] ?? null,
        ':manufacturer' => $data['manufacturer'] ?? null,
        ':cpu' => $data['cpu'] ?? null,
        ':memory' => $data['memory'] ?? null,
        ':graphics' => $data['graphics'] ?? null,
        ':sound' => $data['sound'] ?? null,
        ':display' => $data['display'] ?? null,
        ':media' => $data['media'] ?? null,
        ':max_controllers' => $data['max_controllers'] ?? null,
        ':desc_en' => $data['desc_en'] ?? null,
        ':desc_fr' => $data['desc_fr'] ?? null,
        ':desc_es' => $data['desc_es'] ?? null,
        ':altername' => isset($data['altername']) ? json_encode($data['altername']) : null,
        ':img_console' => $data['img_console'] ?? null,
        ':img_logo' => $data['img_logo'] ?? null,
        ':accessories' => isset($data['accessories']) ? json_encode($data['accessories']) : null
    ]);
    
    $id = $db->lastInsertId();
    
    // Créer le dossier pour les images
    $platformDir = VG_DB_PLATFORMS_PATH . "/{$id}";
    if (!is_dir($platformDir)) {
        mkdir($platformDir, 0755, true);
    }
    
    loger('admin-databases', 'INFO', 'Platform created', ['id' => $id, 'name' => $data['name']]);
    
    echo json_encode(['success' => true, 'data' => ['id' => $id]]);
}

/**
 * Mettre à jour une plateforme
 */
function updatePlatform($db, $id, $data) {
    // Vérifier que la plateforme existe
    $stmt = $db->prepare("SELECT id FROM Platform WHERE id = :id");
    $stmt->execute([':id' => $id]);
    if (!$stmt->fetch()) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Plateforme non trouvée']);
        return;
    }
    
    // Champs modifiables
    $allowedFields = ['name', 'release_date', 'developer', 'manufacturer', 'cpu', 'memory', 'graphics', 'sound', 'display', 'media', 'max_controllers', 'desc_en', 'desc_fr', 'desc_es', 'altername', 'img_console', 'img_logo', 'accessories'];
    
    $updates = [];
    $params = [':id' => $id];
    
    foreach ($allowedFields as $field) {
        if (array_key_exists($field, $data)) {
            $value = $data[$field];
            
            // Encoder en JSON si nécessaire
            if (in_array($field, ['altername', 'accessories']) && is_array($value)) {
                $value = json_encode($value);
            }
            
            $updates[] = "$field = :$field";
            $params[":$field"] = $value;
        }
    }
    
    if (empty($updates)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Aucun champ à mettre à jour']);
        return;
    }
    
    $sql = "UPDATE Platform SET " . implode(', ', $updates) . " WHERE id = :id";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    
    loger('admin-databases', 'INFO', 'Platform updated', ['id' => $id]);
    
    echo json_encode(['success' => true]);
}

/**
 * Supprimer une plateforme
 */
function deletePlatform($db, $id) {
    // Récupérer les infos avant suppression
    $stmt = $db->prepare("SELECT name FROM Platform WHERE id = :id");
    $stmt->execute([':id' => $id]);
    $platform = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$platform) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Plateforme non trouvée']);
        return;
    }
    
    // Supprimer le dossier d'images
    $platformDir = VG_DB_PLATFORMS_PATH . "/{$id}";
    if (is_dir($platformDir)) {
        $files = glob($platformDir . '/*');
        foreach ($files as $file) {
            if (is_file($file)) {
                unlink($file);
            }
        }
        rmdir($platformDir);
    }
    
    // Supprimer de la BDD
    $stmt = $db->prepare("DELETE FROM Platform WHERE id = :id");
    $stmt->execute([':id' => $id]);
    
    loger('admin-databases', 'INFO', 'Platform deleted', ['id' => $id, 'name' => $platform['name']]);
    
    echo json_encode(['success' => true]);
}

/**
 * Upload d'image pour une plateforme
 */
function uploadPlatformImage($db, $id) {
    // Vérifier que la plateforme existe
    $stmt = $db->prepare("SELECT id, img_console, img_logo FROM Platform WHERE id = :id");
    $stmt->execute([':id' => $id]);
    $platform = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$platform) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Plateforme non trouvée']);
        return;
    }
    
    if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Fichier non reçu ou erreur d\'upload']);
        return;
    }
    
    // Créer le dossier si nécessaire
    $platformDir = VG_DB_PLATFORMS_PATH . "/{$id}";
    if (!is_dir($platformDir)) {
        mkdir($platformDir, 0755, true);
    }
    
    // Utiliser SecureUpload pour valider et sauvegarder
    $result = SecureUpload::upload($_FILES['image'], 'images', $platformDir);
    
    if (!$result['success']) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => $result['error']]);
        return;
    }
    
    // Déterminer quel champ mettre à jour (console ou logo)
    $imageType = $_POST['image_type'] ?? 'console'; // 'console' ou 'logo'
    $column = $imageType === 'logo' ? 'img_logo' : 'img_console';
    $imageUrl = "/storage/VG_DB/Platforms/{$id}/{$result['filename']}";
    
    $stmt = $db->prepare("UPDATE Platform SET $column = :img_url WHERE id = :id");
    $stmt->execute([
        ':img_url' => $imageUrl,
        ':id' => $id
    ]);
    
    loger('admin-databases', 'INFO', 'Platform image uploaded', [
        'id' => $id,
        'type' => $imageType,
        'filename' => $result['filename']
    ]);
    
    echo json_encode([
        'success' => true,
        'data' => [
            'filename' => $result['filename'],
            'url' => $imageUrl,
            'type' => $imageType
        ]
    ]);
}

/**
 * Supprimer une image d'une plateforme
 */
function deletePlatformImage($db, $id, $filename) {
    // Vérifier que la plateforme existe
    $stmt = $db->prepare("SELECT id, img_console, img_logo FROM Platform WHERE id = :id");
    $stmt->execute([':id' => $id]);
    $platform = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$platform) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Plateforme non trouvée']);
        return;
    }
    
    // Sécuriser le nom de fichier
    $filename = basename($filename);
    $filePath = VG_DB_PLATFORMS_PATH . "/{$id}/{$filename}";
    
    // Supprimer le fichier
    if (file_exists($filePath)) {
        unlink($filePath);
    }
    
    // Déterminer quel champ mettre à jour
    $imageType = $_GET['image_type'] ?? null;
    if ($imageType === 'console' || (strpos($platform['img_console'] ?? '', $filename) !== false)) {
        $stmt = $db->prepare("UPDATE Platform SET img_console = NULL WHERE id = :id");
        $stmt->execute([':id' => $id]);
    } elseif ($imageType === 'logo' || (strpos($platform['img_logo'] ?? '', $filename) !== false)) {
        $stmt = $db->prepare("UPDATE Platform SET img_logo = NULL WHERE id = :id");
        $stmt->execute([':id' => $id]);
    }
    
    loger('admin-databases', 'INFO', 'Platform image deleted', [
        'id' => $id,
        'filename' => $filename
    ]);
    
    echo json_encode(['success' => true]);
}
