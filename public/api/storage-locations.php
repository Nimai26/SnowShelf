<?php
/**
 * API de gestion des emplacements de stockage
 * 
 * GET    /api/storage-locations.php              - Liste des emplacements de l'utilisateur
 * GET    /api/storage-locations.php?id=X         - Détails d'un emplacement
 * POST   /api/storage-locations.php              - Création d'un emplacement
 * PUT    /api/storage-locations.php?id=X         - Modification d'un emplacement
 * DELETE /api/storage-locations.php?id=X         - Suppression d'un emplacement
 */

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../core/ApiAuth.php';
require_once __DIR__ . '/../../core/logger.php';

// Headers CORS et JSON
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Authorization');

// Gestion des requêtes OPTIONS (preflight CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Initialisation
try {
    $pdo = getDbConnection();
    $auth = new ApiAuth($pdo);
} catch (Exception $e) {
    loger('storage_locations', 'ERROR', 'Erreur initialisation', ['error' => $e->getMessage()]);
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Erreur serveur']);
    exit;
}

// Authentification obligatoire
$currentUser = $auth->authenticate();
if (!$currentUser) {
    $auth->sendUnauthorized('Authentification requise');
}

$userId = (int)$currentUser['id'];
$method = $_SERVER['REQUEST_METHOD'];
$locationId = isset($_GET['id']) ? (int)$_GET['id'] : null;

// Router les requêtes
switch ($method) {
    case 'GET':
        if ($locationId !== null) {
            handleGetOne($pdo, $locationId, $userId);
        } else {
            handleGetList($pdo, $userId);
        }
        break;
        
    case 'POST':
        handleCreate($pdo, $userId);
        break;
        
    case 'PUT':
        handleUpdate($pdo, $locationId, $userId);
        break;
        
    case 'DELETE':
        handleDelete($pdo, $locationId, $userId);
        break;
        
    default:
        http_response_code(405);
        echo json_encode(['success' => false, 'error' => 'Méthode non autorisée']);
}

/**
 * Récupère la liste des emplacements de stockage de l'utilisateur
 */
function handleGetList(PDO $pdo, int $userId): void
{
    try {
        $sql = "SELECT sl.*, 
                (SELECT COUNT(*) FROM items i WHERE i.storage_location_id = sl.id) as items_count
                FROM storage_locations sl
                WHERE sl.user_id = :userId
                ORDER BY sl.name ASC";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':userId' => $userId]);
        $locations = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Convertir les types
        foreach ($locations as &$location) {
            $location['id'] = (int)$location['id'];
            $location['user_id'] = (int)$location['user_id'];
            $location['items_count'] = (int)$location['items_count'];
        }
        
        echo json_encode([
            'success' => true,
            'locations' => $locations,
            'count' => count($locations)
        ]);
    } catch (PDOException $e) {
        loger('storage_locations', 'ERROR', 'Erreur SQL liste', ['error' => $e->getMessage()]);
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Erreur lors de la récupération des emplacements']);
    }
}

/**
 * Récupère un emplacement spécifique
 */
function handleGetOne(PDO $pdo, int $locationId, int $userId): void
{
    try {
        $sql = "SELECT sl.*, 
                (SELECT COUNT(*) FROM items i WHERE i.storage_location_id = sl.id) as items_count
                FROM storage_locations sl
                WHERE sl.id = :id AND sl.user_id = :userId";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':id' => $locationId, ':userId' => $userId]);
        $location = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$location) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Emplacement non trouvé']);
            return;
        }
        
        // Convertir les types
        $location['id'] = (int)$location['id'];
        $location['user_id'] = (int)$location['user_id'];
        $location['items_count'] = (int)$location['items_count'];
        
        echo json_encode([
            'success' => true,
            'location' => $location
        ]);
    } catch (PDOException $e) {
        loger('storage_locations', 'ERROR', 'Erreur SQL get', ['error' => $e->getMessage()]);
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Erreur lors de la récupération de l\'emplacement']);
    }
}

/**
 * Crée un nouvel emplacement de stockage
 */
function handleCreate(PDO $pdo, int $userId): void
{
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (empty($input['name'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Le nom est requis']);
        return;
    }
    
    $name = trim($input['name']);
    $description = trim($input['description'] ?? '');
    
    // Vérifier l'unicité du nom pour cet utilisateur
    try {
        $checkSql = "SELECT id FROM storage_locations WHERE user_id = :userId AND name = :name";
        $checkStmt = $pdo->prepare($checkSql);
        $checkStmt->execute([':userId' => $userId, ':name' => $name]);
        
        if ($checkStmt->fetch()) {
            http_response_code(409);
            echo json_encode(['success' => false, 'error' => 'Un emplacement avec ce nom existe déjà']);
            return;
        }
        
        // Insertion
        $sql = "INSERT INTO storage_locations (user_id, name, description) VALUES (:userId, :name, :description)";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':userId' => $userId,
            ':name' => $name,
            ':description' => $description
        ]);
        
        $locationId = (int)$pdo->lastInsertId();
        
        loger('storage_locations', 'INFO', 'Emplacement créé', ['id' => $locationId, 'user_id' => $userId]);
        
        echo json_encode([
            'success' => true,
            'location' => [
                'id' => $locationId,
                'user_id' => $userId,
                'name' => $name,
                'description' => $description,
                'items_count' => 0
            ],
            'message' => 'Emplacement créé avec succès'
        ]);
    } catch (PDOException $e) {
        loger('storage_locations', 'ERROR', 'Erreur SQL create', ['error' => $e->getMessage()]);
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Erreur lors de la création de l\'emplacement']);
    }
}

/**
 * Met à jour un emplacement de stockage
 */
function handleUpdate(PDO $pdo, ?int $locationId, int $userId): void
{
    if (!$locationId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'ID requis']);
        return;
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Vérifier la propriété
    try {
        $checkSql = "SELECT id FROM storage_locations WHERE id = :id AND user_id = :userId";
        $checkStmt = $pdo->prepare($checkSql);
        $checkStmt->execute([':id' => $locationId, ':userId' => $userId]);
        
        if (!$checkStmt->fetch()) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Emplacement non trouvé ou non autorisé']);
            return;
        }
        
        // Construction de la mise à jour dynamique
        $updates = [];
        $params = [':id' => $locationId];
        
        if (isset($input['name'])) {
            $name = trim($input['name']);
            if (empty($name)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Le nom ne peut pas être vide']);
                return;
            }
            
            // Vérifier l'unicité du nouveau nom
            $uniqueCheckSql = "SELECT id FROM storage_locations WHERE user_id = :userId AND name = :name AND id != :id";
            $uniqueCheckStmt = $pdo->prepare($uniqueCheckSql);
            $uniqueCheckStmt->execute([':userId' => $userId, ':name' => $name, ':id' => $locationId]);
            
            if ($uniqueCheckStmt->fetch()) {
                http_response_code(409);
                echo json_encode(['success' => false, 'error' => 'Un autre emplacement avec ce nom existe déjà']);
                return;
            }
            
            $updates[] = "name = :name";
            $params[':name'] = $name;
        }
        
        if (array_key_exists('description', $input)) {
            $updates[] = "description = :description";
            $params[':description'] = trim($input['description'] ?? '');
        }
        
        if (empty($updates)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Aucune donnée à mettre à jour']);
            return;
        }
        
        $sql = "UPDATE storage_locations SET " . implode(', ', $updates) . " WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        
        loger('storage_locations', 'INFO', 'Emplacement mis à jour', ['id' => $locationId, 'user_id' => $userId]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Emplacement mis à jour avec succès'
        ]);
    } catch (PDOException $e) {
        loger('storage_locations', 'ERROR', 'Erreur SQL update', ['error' => $e->getMessage()]);
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Erreur lors de la mise à jour de l\'emplacement']);
    }
}

/**
 * Supprime un emplacement de stockage
 */
function handleDelete(PDO $pdo, ?int $locationId, int $userId): void
{
    if (!$locationId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'ID requis']);
        return;
    }
    
    try {
        // Vérifier la propriété
        $checkSql = "SELECT id FROM storage_locations WHERE id = :id AND user_id = :userId";
        $checkStmt = $pdo->prepare($checkSql);
        $checkStmt->execute([':id' => $locationId, ':userId' => $userId]);
        
        if (!$checkStmt->fetch()) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Emplacement non trouvé ou non autorisé']);
            return;
        }
        
        // Vérifier s'il y a des items associés
        $itemsCheckSql = "SELECT COUNT(*) as count FROM items WHERE storage_location_id = :id";
        $itemsCheckStmt = $pdo->prepare($itemsCheckSql);
        $itemsCheckStmt->execute([':id' => $locationId]);
        $itemsCount = (int)$itemsCheckStmt->fetch(PDO::FETCH_ASSOC)['count'];
        
        if ($itemsCount > 0) {
            // Option: soit bloquer la suppression, soit mettre à NULL les références
            // Ici on met à NULL les références pour permettre la suppression
            $updateItemsSql = "UPDATE items SET storage_location_id = NULL WHERE storage_location_id = :id";
            $updateItemsStmt = $pdo->prepare($updateItemsSql);
            $updateItemsStmt->execute([':id' => $locationId]);
        }
        
        // Suppression
        $sql = "DELETE FROM storage_locations WHERE id = :id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([':id' => $locationId]);
        
        loger('storage_locations', 'INFO', 'Emplacement supprimé', ['id' => $locationId, 'user_id' => $userId, 'items_cleared' => $itemsCount]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Emplacement supprimé avec succès',
            'items_cleared' => $itemsCount
        ]);
    } catch (PDOException $e) {
        loger('storage_locations', 'ERROR', 'Erreur SQL delete', ['error' => $e->getMessage()]);
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Erreur lors de la suppression de l\'emplacement']);
    }
}
