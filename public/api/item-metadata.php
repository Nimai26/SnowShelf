<?php
/**
 * SnowShelf - API Item Metadata
 * Gestion des métadonnées dynamiques des items par type
 * 
 * Endpoints:
 * GET    ?action=fields&type_id=X  - Liste des champs pour un type
 * GET    ?action=values&item_id=X  - Valeurs des métadonnées d'un item
 * POST   - Sauvegarder les métadonnées d'un item
 */

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../core/i18n.php';
require_once __DIR__ . '/../../core/logger.php';

// Headers CORS et JSON
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

// Démarrage de la session si pas déjà active
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Vérification de l'authentification
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => __('api.unauthorized')]);
    exit;
}

$userId = (int)$_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];
$pdo = getDbConnection();
$lang = getLang();

try {
    switch ($method) {
        case 'GET':
            handleGet($pdo, $userId, $lang);
            break;
        case 'POST':
            handlePost($pdo, $userId);
            break;
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => __('api.method_not_allowed')]);
    }
} catch (PDOException $e) {
    loger('item_metadata_api', 'ERROR', 'Database error', ['error' => $e->getMessage()]);
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => __('api.server_error')]);
} catch (Exception $e) {
    loger('item_metadata_api', 'ERROR', 'General error', ['error' => $e->getMessage()]);
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

/**
 * GET - Récupération des champs ou des valeurs
 */
function handleGet(PDO $pdo, int $userId, string $lang): void
{
    $action = $_GET['action'] ?? 'fields';
    
    switch ($action) {
        case 'types':
            getTypes($pdo, $lang);
            break;
        case 'fields':
            getFields($pdo, $lang);
            break;
        case 'values':
            getValues($pdo, $userId, $lang);
            break;
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Action invalide']);
    }
}

/**
 * Récupère la liste des types primaires
 */
function getTypes(PDO $pdo, string $lang): void
{
    $stmt = $pdo->query("
        SELECT id, name, inter_name, icon, color, sort_order
        FROM primary_type
        ORDER BY sort_order, id
    ");
    
    $types = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Décoder le JSON name et ajouter name_fr/name_en/display_name pour rétrocompatibilité
    foreach ($types as &$type) {
        $names = json_decode($type['name'], true);
        if (is_array($names)) {
            $type['name_fr'] = $names['fr'] ?? $names['en'] ?? $type['name'];
            $type['name_en'] = $names['en'] ?? $names['fr'] ?? $type['name'];
            $type['display_name'] = $names[$lang] ?? $names['fr'] ?? $type['name'];
        } else {
            $type['name_fr'] = $type['name'];
            $type['name_en'] = $type['name'];
            $type['display_name'] = $type['name'];
        }
    }
    
    echo json_encode([
        'success' => true,
        'data' => $types
    ]);
}

/**
 * Récupère les champs pour un type donné
 */
function getFields(PDO $pdo, string $lang): void
{
    $typeId = isset($_GET['type_id']) ? (int)$_GET['type_id'] : null;
    
    // Si pas de type_id, récupérer l'ID de "divers" comme type par défaut
    // Le champ name contient du JSON, on cherche par l'id directement (id=8 pour divers)
    if (!$typeId) {
        $defaultStmt = $pdo->query("SELECT id FROM primary_type WHERE id = 8 LIMIT 1");
        $defaultType = $defaultStmt->fetch(PDO::FETCH_ASSOC);
        $typeId = $defaultType ? (int)$defaultType['id'] : null;
    }
    
    if (!$typeId) {
        echo json_encode(['success' => true, 'data' => []]);
        return;
    }
    
    // Récupérer tous les champs avec la colonne JSON 'lang' et les api_keys des mappings
    $sql = "
        SELECT 
            f.id,
            f.field_key,
            f.field_type,
            f.field_options,
            f.is_required,
            f.sort_order,
            f.icon,
            f.lang,
            (
                SELECT JSON_ARRAYAGG(m.api_keys)
                FROM primary_type_key_to_field m
                WHERE m.field_id = f.id AND m.is_active = 1
                ORDER BY m.priority DESC
            ) as api_keys_list
        FROM primary_type_fields f
        WHERE f.primary_type_id = :type_id
        ORDER BY f.sort_order ASC, f.id ASC
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':type_id' => $typeId]);
    $fields = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Formater les données et extraire les traductions
    foreach ($fields as &$field) {
        $field['id'] = (int)$field['id'];
        $field['is_required'] = (bool)$field['is_required'];
        $field['sort_order'] = (int)$field['sort_order'];
        
        // Parser la colonne JSON 'lang' pour les traductions
        $langData = $field['lang'] ? json_decode($field['lang'], true) : [];
        // Essayer 'name' d'abord, puis 'label' pour rétrocompatibilité
        $field['label'] = $langData[$lang]['name'] ?? $langData['fr']['name'] ?? $langData[$lang]['label'] ?? $langData['fr']['label'] ?? $field['field_key'];
        $field['placeholder'] = $langData[$lang]['placeholder'] ?? $langData['fr']['placeholder'] ?? '';
        $field['help_text'] = $langData[$lang]['help_text'] ?? $langData['fr']['help_text'] ?? '';
        unset($field['lang']);
        
        // Parser le JSON des options et extraire le tableau d'options si nécessaire
        $parsedOptions = $field['field_options'] ? json_decode($field['field_options'], true) : null;
        // Si c'est un objet avec une clé 'options', extraire le tableau
        if (is_array($parsedOptions) && isset($parsedOptions['options'])) {
            $field['options'] = $parsedOptions['options'];
        } else {
            $field['options'] = $parsedOptions;
        }
        unset($field['field_options']);
        
        // Parser les api_keys des mappings (fusion des tableaux)
        $apiKeysList = $field['api_keys_list'] ? json_decode($field['api_keys_list'], true) : [];
        $allApiKeys = [];
        if (is_array($apiKeysList)) {
            foreach ($apiKeysList as $keysJson) {
                $keys = is_string($keysJson) ? json_decode($keysJson, true) : $keysJson;
                if (is_array($keys)) {
                    $allApiKeys = array_merge($allApiKeys, $keys);
                }
            }
        }
        $field['api_keys'] = array_values(array_unique($allApiKeys));
        unset($field['api_keys_list']);
    }
    
    echo json_encode([
        'success' => true,
        'data' => [
            'type_id' => $typeId,
            'fields' => $fields
        ]
    ]);
}

/**
 * Récupère les valeurs des métadonnées pour un item
 */
function getValues(PDO $pdo, int $userId, string $lang): void
{
    $itemId = isset($_GET['item_id']) ? (int)$_GET['item_id'] : null;
    
    if (!$itemId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'item_id requis']);
        return;
    }
    
    // Vérifier que l'item appartient à l'utilisateur
    $checkStmt = $pdo->prepare("SELECT id, id_primary_cat FROM items WHERE id = :id AND user_id = :user_id");
    $checkStmt->execute([':id' => $itemId, ':user_id' => $userId]);
    $item = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$item) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => __('collection.item_not_found')]);
        return;
    }
    
    // Récupérer les métadonnées de l'item avec les infos de champs (utilise la colonne JSON 'lang')
    $sql = "
        SELECT 
            im.field_id,
            ptf.field_key,
            ptf.lang,
            ptf.field_type,
            ptf.icon,
            im.value_text,
            im.value_number,
            im.value_date,
            im.value_json
        FROM item_metadata im
        INNER JOIN primary_type_fields ptf ON im.field_id = ptf.id
        WHERE im.item_id = :item_id
        ORDER BY ptf.sort_order ASC
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':item_id' => $itemId]);
    $metadata = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Formater les valeurs selon le type de champ
    $values = [];
    foreach ($metadata as $meta) {
        $value = null;
        switch ($meta['field_type']) {
            case 'number':
            case 'year':
            case 'rating':
            case 'duration':
                $value = $meta['value_number'] !== null ? (float)$meta['value_number'] : null;
                break;
            case 'date':
                $value = $meta['value_date'];
                break;
            case 'multiselect':
                $value = $meta['value_json'] ? json_decode($meta['value_json'], true) : null;
                break;
            default:
                $value = $meta['value_text'];
        }
        
        // Extraire le label depuis la colonne JSON 'lang'
        $langData = $meta['lang'] ? json_decode($meta['lang'], true) : [];
        $label = $langData[$lang]['label'] ?? $langData['fr']['label'] ?? $meta['field_key'];
        
        $values[$meta['field_key']] = [
            'field_id' => (int)$meta['field_id'],
            'label' => $label,
            'icon' => $meta['icon'],
            'type' => $meta['field_type'],
            'value' => $value
        ];
    }
    
    echo json_encode([
        'success' => true,
        'data' => [
            'item_id' => $itemId,
            'type_id' => $item['id_primary_cat'],
            'values' => $values
        ]
    ]);
}

/**
 * POST - Sauvegarde des métadonnées d'un item
 */
function handlePost(PDO $pdo, int $userId): void
{
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (empty($input['item_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'item_id requis']);
        return;
    }
    
    $itemId = (int)$input['item_id'];
    $metadata = $input['metadata'] ?? [];
    
    // Vérifier que l'item appartient à l'utilisateur
    $checkStmt = $pdo->prepare("SELECT id FROM items WHERE id = :id AND user_id = :user_id");
    $checkStmt->execute([':id' => $itemId, ':user_id' => $userId]);
    
    if (!$checkStmt->fetch()) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => __('collection.not_owner')]);
        return;
    }
    
    $pdo->beginTransaction();
    
    try {
        // Préparer les requêtes
        $insertStmt = $pdo->prepare("
            INSERT INTO item_metadata (item_id, field_id, value_text, value_number, value_date, value_json)
            VALUES (:item_id, :field_id, :value_text, :value_number, :value_date, :value_json)
            ON DUPLICATE KEY UPDATE
                value_text = VALUES(value_text),
                value_number = VALUES(value_number),
                value_date = VALUES(value_date),
                value_json = VALUES(value_json),
                updated_at = CURRENT_TIMESTAMP
        ");
        
        $deleteStmt = $pdo->prepare("
            DELETE FROM item_metadata WHERE item_id = :item_id AND field_id = :field_id
        ");
        
        // Récupérer les infos des champs pour connaître leur type
        $fieldIds = array_keys($metadata);
        if (!empty($fieldIds)) {
            $placeholders = implode(',', array_fill(0, count($fieldIds), '?'));
            $fieldStmt = $pdo->prepare("SELECT id, field_type FROM primary_type_fields WHERE id IN ($placeholders)");
            $fieldStmt->execute($fieldIds);
            $fieldTypes = [];
            while ($row = $fieldStmt->fetch(PDO::FETCH_ASSOC)) {
                $fieldTypes[$row['id']] = $row['field_type'];
            }
        }
        
        // Traiter chaque champ
        foreach ($metadata as $fieldId => $value) {
            $fieldId = (int)$fieldId;
            $fieldType = $fieldTypes[$fieldId] ?? 'text';
            
            // Si la valeur est vide, supprimer l'entrée
            if ($value === null || $value === '' || (is_array($value) && empty($value))) {
                $deleteStmt->execute([':item_id' => $itemId, ':field_id' => $fieldId]);
                continue;
            }
            
            // Préparer les valeurs selon le type
            $valueText = null;
            $valueNumber = null;
            $valueDate = null;
            $valueJson = null;
            
            switch ($fieldType) {
                case 'number':
                case 'year':
                case 'rating':
                case 'duration':
                    $valueNumber = is_numeric($value) ? (float)$value : null;
                    break;
                case 'date':
                    $valueDate = $value;
                    break;
                case 'multiselect':
                    $valueJson = json_encode($value);
                    break;
                default:
                    $valueText = is_string($value) ? trim($value) : (string)$value;
            }
            
            $insertStmt->execute([
                ':item_id' => $itemId,
                ':field_id' => $fieldId,
                ':value_text' => $valueText,
                ':value_number' => $valueNumber,
                ':value_date' => $valueDate,
                ':value_json' => $valueJson
            ]);
        }
        
        $pdo->commit();
        
        loger('item_metadata_api', 'INFO', 'Metadata saved', [
            'item_id' => $itemId,
            'user_id' => $userId,
            'fields_count' => count($metadata)
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Métadonnées enregistrées'
        ]);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}
