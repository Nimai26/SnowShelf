<?php
/**
 * API Admin - Gestion des mappings de champs fixes des items
 * 
 * Gère les mappings globaux entre les réponses API externes et les champs fixes des items.
 * Ces mappings sont appliqués à TOUS les providers.
 * 
 * Champs fixes supportés: name, description, value, images, videos, audio, documents
 * 
 * GET                      - Récupérer tous les mappings
 * POST                     - Créer ou mettre à jour un mapping (upsert sur item_field)
 * PUT                      - Mettre à jour tous les mappings (bulk)
 * DELETE ?id=X             - Supprimer un mapping par ID
 * DELETE ?item_field=X     - Supprimer un mapping par champ
 */

session_start();
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../core/i18n.php';
require_once __DIR__ . '/../../../core/logger.php';

header('Content-Type: application/json; charset=utf-8');

// Vérifier authentification admin
if (empty($_SESSION['user_id']) || empty($_SESSION['is_admin'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Non autorisé']);
    exit;
}

// Liste des champs fixes valides
const VALID_ITEM_FIELDS = ['name', 'description', 'value', 'code_barre', 'images', 'videos', 'audio', 'documents'];

// Types de transformation valides
const VALID_TRANSFORM_TYPES = ['direct', 'array', 'first', 'join', 'template'];

try {
    $pdo = getDbConnection();
    
    switch ($_SERVER['REQUEST_METHOD']) {
        case 'GET':
            handleGet($pdo);
            break;
        case 'POST':
            handlePost($pdo);
            break;
        case 'PUT':
            handlePut($pdo);
            break;
        case 'DELETE':
            handleDelete($pdo);
            break;
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    loger('item_field_mappings', 'ERROR', 'Erreur API', ['message' => $e->getMessage()]);
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

/**
 * GET - Récupérer tous les mappings
 */
function handleGet($pdo) {
    $stmt = $pdo->query("
        SELECT id, item_field, api_path, transform_type, transform_config, created_at, updated_at
        FROM item_field_mappings
        ORDER BY FIELD(item_field, 'name', 'description', 'value', 'code_barre', 'images', 'videos', 'audio', 'documents')
    ");
    $mappings = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Décoder les configs JSON
    foreach ($mappings as &$mapping) {
        if ($mapping['transform_config']) {
            $decoded = json_decode($mapping['transform_config'], true);
            $mapping['transform_config'] = $decoded !== null ? $decoded : $mapping['transform_config'];
        }
    }
    
    echo json_encode([
        'success' => true,
        'mappings' => $mappings,
        'valid_fields' => VALID_ITEM_FIELDS,
        'valid_transforms' => VALID_TRANSFORM_TYPES
    ]);
}

/**
 * POST - Créer ou mettre à jour un mapping unique (upsert)
 */
function handlePost($pdo) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $itemField = trim($input['item_field'] ?? '');
    $apiPath = trim($input['api_path'] ?? '');
    $transformType = $input['transform_type'] ?? 'direct';
    $transformConfig = $input['transform_config'] ?? null;
    
    // Validation
    if (empty($itemField)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'item_field requis']);
        return;
    }
    
    if (!in_array($itemField, VALID_ITEM_FIELDS)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'item_field invalide. Valides: ' . implode(', ', VALID_ITEM_FIELDS)]);
        return;
    }
    
    // Si api_path est vide, supprimer le mapping existant
    if (empty($apiPath)) {
        $stmt = $pdo->prepare("DELETE FROM item_field_mappings WHERE item_field = ?");
        $stmt->execute([$itemField]);
        
        echo json_encode([
            'success' => true,
            'message' => "Mapping '$itemField' supprimé",
            'action' => 'deleted'
        ]);
        return;
    }
    
    if (!in_array($transformType, VALID_TRANSFORM_TYPES)) {
        $transformType = 'direct';
    }
    
    // Encoder la config si nécessaire
    if ($transformConfig !== null && !is_string($transformConfig)) {
        $transformConfig = json_encode($transformConfig);
    }
    
    // Upsert : INSERT ... ON DUPLICATE KEY UPDATE
    $stmt = $pdo->prepare("
        INSERT INTO item_field_mappings (item_field, api_path, transform_type, transform_config)
        VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            api_path = VALUES(api_path),
            transform_type = VALUES(transform_type),
            transform_config = VALUES(transform_config),
            updated_at = CURRENT_TIMESTAMP
    ");
    
    $stmt->execute([$itemField, $apiPath, $transformType, $transformConfig]);
    
    $isNew = $pdo->lastInsertId() > 0;
    
    loger('item_field_mappings', 'INFO', $isNew ? 'Mapping créé' : 'Mapping mis à jour', [
        'item_field' => $itemField,
        'api_path' => $apiPath
    ]);
    
    echo json_encode([
        'success' => true,
        'message' => $isNew ? 'Mapping créé' : 'Mapping mis à jour',
        'action' => $isNew ? 'created' : 'updated',
        'item_field' => $itemField
    ]);
}

/**
 * PUT - Mettre à jour tous les mappings en masse
 */
function handlePut($pdo) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['mappings']) || !is_array($input['mappings'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'mappings array requis']);
        return;
    }
    
    $pdo->beginTransaction();
    
    try {
        // Supprimer tous les mappings existants
        $pdo->exec("DELETE FROM item_field_mappings");
        
        $inserted = 0;
        foreach ($input['mappings'] as $mapping) {
            $itemField = trim($mapping['item_field'] ?? '');
            $apiPath = trim($mapping['api_path'] ?? '');
            
            // Ignorer les mappings vides ou invalides
            if (empty($itemField) || empty($apiPath)) {
                continue;
            }
            
            if (!in_array($itemField, VALID_ITEM_FIELDS)) {
                continue;
            }
            
            $transformType = $mapping['transform_type'] ?? 'direct';
            if (!in_array($transformType, VALID_TRANSFORM_TYPES)) {
                $transformType = 'direct';
            }
            
            $transformConfig = null;
            if (!empty($mapping['transform_config'])) {
                $transformConfig = is_string($mapping['transform_config']) 
                    ? $mapping['transform_config'] 
                    : json_encode($mapping['transform_config']);
            }
            
            $stmt = $pdo->prepare("
                INSERT INTO item_field_mappings (item_field, api_path, transform_type, transform_config)
                VALUES (?, ?, ?, ?)
            ");
            $stmt->execute([$itemField, $apiPath, $transformType, $transformConfig]);
            $inserted++;
        }
        
        $pdo->commit();
        
        loger('item_field_mappings', 'INFO', 'Mappings mis à jour en masse', ['count' => $inserted]);
        
        echo json_encode([
            'success' => true,
            'message' => "$inserted mapping(s) sauvegardé(s)",
            'count' => $inserted
        ]);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}

/**
 * DELETE - Supprimer un mapping
 */
function handleDelete($pdo) {
    $id = $_GET['id'] ?? null;
    $itemField = $_GET['item_field'] ?? null;
    
    if ($id) {
        $stmt = $pdo->prepare("DELETE FROM item_field_mappings WHERE id = ?");
        $stmt->execute([intval($id)]);
        $deleted = $stmt->rowCount();
        
        loger('item_field_mappings', 'INFO', 'Mapping supprimé par ID', ['id' => $id]);
        
    } elseif ($itemField) {
        $stmt = $pdo->prepare("DELETE FROM item_field_mappings WHERE item_field = ?");
        $stmt->execute([$itemField]);
        $deleted = $stmt->rowCount();
        
        loger('item_field_mappings', 'INFO', 'Mapping supprimé par champ', ['item_field' => $itemField]);
        
    } else {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'id ou item_field requis']);
        return;
    }
    
    echo json_encode([
        'success' => true,
        'message' => $deleted ? 'Mapping supprimé' : 'Aucun mapping trouvé',
        'deleted' => $deleted
    ]);
}
