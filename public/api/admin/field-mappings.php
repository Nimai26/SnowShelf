<?php
/**
 * API Admin - Gestion des mappings de champs (primary_type_key_to_field)
 * 
 * Endpoints:
 * - GET    : Liste des mappings (optionnel: ?type_id=X pour filtrer par type)
 * - GET    ?id=X : Détails d'un mapping
 * - POST   : Créer un nouveau mapping
 * - PUT    : Modifier un mapping existant
 * - DELETE ?id=X : Supprimer un mapping
 * 
 * @package SnowShelf Admin API
 * @since 2025-12-18
 */

session_start();
require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../core/i18n.php';

header('Content-Type: application/json; charset=utf-8');

// Vérifier l'authentification admin
if (empty($_SESSION['user_id']) || empty($_SESSION['is_admin'])) {
    http_response_code(401);
    echo json_encode(['error' => __('errors.unauthorized')]);
    exit;
}

/**
 * Décode le champ name JSON et ajoute name_fr pour la rétro-compatibilité
 */
function decodeTypeName(array $row, string $lang = 'fr'): array {
    if (isset($row['name']) && is_string($row['name'])) {
        $names = json_decode($row['name'], true);
        if (is_array($names)) {
            $row['name_fr'] = $names['fr'] ?? $names['en'] ?? $row['name'];
            $row['name_en'] = $names['en'] ?? $names['fr'] ?? $row['name'];
            $row['name_localized'] = $names[$lang] ?? $names['fr'] ?? $row['name'];
        } else {
            $row['name_fr'] = $row['name'];
            $row['name_en'] = $row['name'];
            $row['name_localized'] = $row['name'];
        }
    }
    return $row;
}

function decodeTypeNames(array $types, string $lang = 'fr'): array {
    return array_map(fn($t) => decodeTypeName($t, $lang), $types);
}

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getDbConnection();
$currentLang = getLang();

try {
    switch ($method) {
        case 'GET':
            if (isset($_GET['id'])) {
                // Détails d'un mapping spécifique
                getMapping($pdo, (int) $_GET['id'], $currentLang);
            } elseif (isset($_GET['transforms'])) {
                // Liste des types de transformation disponibles
                getTransformTypes($pdo);
            } else {
                // Liste des mappings
                getMappings($pdo, $_GET['type_id'] ?? null, $_GET['field_id'] ?? null, $currentLang);
            }
            break;
            
        case 'POST':
            createMapping($pdo);
            break;
            
        case 'PUT':
            $input = json_decode(file_get_contents('php://input'), true);
            if (empty($input['id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'ID requis']);
                exit;
            }
            updateMapping($pdo, $input);
            break;
            
        case 'DELETE':
            if (empty($_GET['id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'ID requis']);
                exit;
            }
            deleteMapping($pdo, (int) $_GET['id']);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['error' => 'Méthode non autorisée']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Erreur base de données', 'details' => $e->getMessage()]);
}

/**
 * Liste des mappings avec jointures
 */
function getMappings(PDO $pdo, ?int $typeId = null, ?int $fieldId = null, string $lang = 'fr'): void
{
    $sql = "
        SELECT 
            m.id,
            m.field_id,
            m.api_keys,
            m.transform_type,
            m.transform_config,
            m.priority,
            m.is_active,
            m.created_at,
            m.updated_at,
            f.field_key,
            f.field_type,
            f.lang as field_lang,
            f.primary_type_id,
            pt.name as type_name
        FROM primary_type_key_to_field m
        JOIN primary_type_fields f ON m.field_id = f.id
        JOIN primary_type pt ON f.primary_type_id = pt.id
        WHERE 1=1
    ";
    
    $params = [];
    
    if ($typeId !== null) {
        $sql .= " AND f.primary_type_id = ?";
        $params[] = $typeId;
    }
    
    if ($fieldId !== null) {
        $sql .= " AND m.field_id = ?";
        $params[] = $fieldId;
    }
    
    $sql .= " ORDER BY pt.id, f.sort_order, m.priority DESC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $mappings = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Décoder les JSON
    foreach ($mappings as &$mapping) {
        $mapping['api_keys'] = $mapping['api_keys'] ? json_decode($mapping['api_keys'], true) : [];
        $mapping['transform_config'] = $mapping['transform_config'] ? json_decode($mapping['transform_config'], true) : null;
        $mapping['field_lang'] = $mapping['field_lang'] ? json_decode($mapping['field_lang'], true) : [];
        $mapping['is_active'] = (bool) $mapping['is_active'];
        
        // Décoder le nom du type (JSON)
        $typeNames = json_decode($mapping['type_name'], true);
        if (is_array($typeNames)) {
            $mapping['type_name_fr'] = $typeNames['fr'] ?? $typeNames['en'] ?? $mapping['type_name'];
        } else {
            $mapping['type_name_fr'] = $mapping['type_name'];
        }
    }
    
    // Charger aussi les données auxiliaires pour l'interface
    $primaryTypes = $pdo->query("
        SELECT id, name, icon, color 
        FROM primary_type 
        ORDER BY sort_order
    ")->fetchAll(PDO::FETCH_ASSOC);
    $primaryTypes = decodeTypeNames($primaryTypes, $lang);
    
    $fields = $pdo->query("
        SELECT id, primary_type_id, field_key, field_type, lang 
        FROM primary_type_fields 
        ORDER BY primary_type_id, sort_order
    ")->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($fields as &$field) {
        $field['lang'] = $field['lang'] ? json_decode($field['lang'], true) : [];
    }
    
    $transforms = $pdo->query("
        SELECT id, type_key as name, lang 
        FROM field_transform_types 
        ORDER BY sort_order
    ")->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($transforms as &$transform) {
        $langData = $transform['lang'] ? json_decode($transform['lang'], true) : [];
        $transform['description'] = $langData['fr']['description'] ?? $transform['name'];
    }
    
    echo json_encode([
        'success' => true,
        'data' => [
            'mappings' => $mappings,
            'primary_types' => $primaryTypes,
            'fields' => $fields,
            'transforms' => $transforms
        ],
        'count' => count($mappings)
    ]);
}

/**
 * Détails d'un mapping
 */
function getMapping(PDO $pdo, int $id, string $lang = 'fr'): void
{
    $sql = "
        SELECT 
            m.*,
            f.field_key,
            f.field_type,
            f.lang as field_lang,
            f.primary_type_id,
            pt.name as type_name
        FROM primary_type_key_to_field m
        JOIN primary_type_fields f ON m.field_id = f.id
        JOIN primary_type pt ON f.primary_type_id = pt.id
        WHERE m.id = ?
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$id]);
    $mapping = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$mapping) {
        http_response_code(404);
        echo json_encode(['error' => 'Mapping non trouvé']);
        return;
    }
    
    $mapping['api_keys'] = $mapping['api_keys'] ? json_decode($mapping['api_keys'], true) : [];
    $mapping['transform_config'] = $mapping['transform_config'] ? json_decode($mapping['transform_config'], true) : null;
    $mapping['field_lang'] = $mapping['field_lang'] ? json_decode($mapping['field_lang'], true) : [];
    $mapping['is_active'] = (bool) $mapping['is_active'];
    
    // Décoder le nom du type (JSON)
    $typeNames = json_decode($mapping['type_name'], true);
    if (is_array($typeNames)) {
        $mapping['type_name_fr'] = $typeNames[$lang] ?? $typeNames['fr'] ?? $typeNames['en'] ?? $mapping['type_name'];
    } else {
        $mapping['type_name_fr'] = $mapping['type_name'];
    }
    
    echo json_encode(['success' => true, 'data' => $mapping]);
}

/**
 * Liste des types de transformation
 */
function getTransformTypes(PDO $pdo): void
{
    $stmt = $pdo->query("
        SELECT id, type_key, lang, config_schema, is_system, sort_order
        FROM field_transform_types
        ORDER BY sort_order
    ");
    $types = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($types as &$type) {
        $type['lang'] = $type['lang'] ? json_decode($type['lang'], true) : [];
        $type['config_schema'] = $type['config_schema'] ? json_decode($type['config_schema'], true) : null;
        $type['is_system'] = (bool) $type['is_system'];
    }
    
    echo json_encode(['success' => true, 'data' => $types]);
}

/**
 * Créer un nouveau mapping
 */
function createMapping(PDO $pdo): void
{
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validation
    if (empty($input['field_id']) || empty($input['api_keys'])) {
        http_response_code(400);
        echo json_encode(['error' => 'field_id et api_keys sont requis']);
        return;
    }
    
    // Vérifier que le field existe
    $stmt = $pdo->prepare("SELECT id FROM primary_type_fields WHERE id = ?");
    $stmt->execute([$input['field_id']]);
    if (!$stmt->fetch()) {
        http_response_code(400);
        echo json_encode(['error' => 'Field ID invalide']);
        return;
    }
    
    // Préparer les données
    $apiKeys = is_array($input['api_keys']) ? json_encode($input['api_keys']) : $input['api_keys'];
    $transformConfig = isset($input['transform_config']) 
        ? (is_array($input['transform_config']) ? json_encode($input['transform_config']) : $input['transform_config'])
        : null;
    
    $sql = "
        INSERT INTO primary_type_key_to_field 
        (field_id, api_keys, transform_type, transform_config, priority, is_active)
        VALUES (?, ?, ?, ?, ?, ?)
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $input['field_id'],
        $apiKeys,
        $input['transform_type'] ?? null,
        $transformConfig,
        $input['priority'] ?? 0,
        $input['is_active'] ?? 1
    ]);
    
    $newId = $pdo->lastInsertId();
    
    echo json_encode([
        'success' => true,
        'message' => 'Mapping créé',
        'id' => $newId
    ]);
}

/**
 * Modifier un mapping
 */
function updateMapping(PDO $pdo, array $input): void
{
    $id = (int) $input['id'];
    
    // Vérifier que le mapping existe
    $stmt = $pdo->prepare("SELECT id FROM primary_type_key_to_field WHERE id = ?");
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        http_response_code(404);
        echo json_encode(['error' => 'Mapping non trouvé']);
        return;
    }
    
    // Construire la requête de mise à jour dynamique
    $updates = [];
    $params = [];
    
    if (isset($input['field_id'])) {
        $updates[] = 'field_id = ?';
        $params[] = $input['field_id'];
    }
    
    if (isset($input['api_keys'])) {
        $updates[] = 'api_keys = ?';
        $params[] = is_array($input['api_keys']) ? json_encode($input['api_keys']) : $input['api_keys'];
    }
    
    if (array_key_exists('transform_type', $input)) {
        $updates[] = 'transform_type = ?';
        $params[] = $input['transform_type'];
    }
    
    if (array_key_exists('transform_config', $input)) {
        $updates[] = 'transform_config = ?';
        $params[] = $input['transform_config'] !== null 
            ? (is_array($input['transform_config']) ? json_encode($input['transform_config']) : $input['transform_config'])
            : null;
    }
    
    if (isset($input['priority'])) {
        $updates[] = 'priority = ?';
        $params[] = $input['priority'];
    }
    
    if (isset($input['is_active'])) {
        $updates[] = 'is_active = ?';
        $params[] = $input['is_active'] ? 1 : 0;
    }
    
    if (empty($updates)) {
        echo json_encode(['success' => true, 'message' => 'Aucune modification']);
        return;
    }
    
    $params[] = $id;
    $sql = "UPDATE primary_type_key_to_field SET " . implode(', ', $updates) . " WHERE id = ?";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    echo json_encode([
        'success' => true,
        'message' => 'Mapping mis à jour'
    ]);
}

/**
 * Supprimer un mapping
 */
function deleteMapping(PDO $pdo, int $id): void
{
    $stmt = $pdo->prepare("DELETE FROM primary_type_key_to_field WHERE id = ?");
    $stmt->execute([$id]);
    
    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Mapping non trouvé']);
        return;
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Mapping supprimé'
    ]);
}
