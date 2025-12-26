<?php
/**
 * API Admin - Gestion des champs de métadonnées (primary_type_fields)
 * 
 * Endpoints:
 * - GET              : Liste des champs (optionnel: ?type_id=X pour filtrer)
 * - GET    ?id=X     : Détails d'un champ
 * - GET    ?types=1  : Liste des types primaires
 * - POST             : Créer un nouveau champ
 * - PUT              : Modifier un champ existant
 * - DELETE ?id=X     : Supprimer un champ
 * - POST   ?action=reorder : Réordonner les champs
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
 * @param array $row - Ligne contenant un champ 'name' JSON
 * @param string $lang - Langue courante (fr, en)
 * @return array - Ligne avec name_fr, name_en ajoutés
 */
function decodeTypeName(array $row, string $lang = 'fr'): array {
    if (isset($row['name']) && is_string($row['name'])) {
        $names = json_decode($row['name'], true);
        if (is_array($names)) {
            $row['name_fr'] = $names['fr'] ?? $names['en'] ?? $row['name'];
            $row['name_en'] = $names['en'] ?? $names['fr'] ?? $row['name'];
            $row['name_localized'] = $names[$lang] ?? $names['fr'] ?? $row['name'];
        } else {
            // Fallback si ce n'est pas du JSON valide
            $row['name_fr'] = $row['name'];
            $row['name_en'] = $row['name'];
            $row['name_localized'] = $row['name'];
        }
    }
    return $row;
}

/**
 * Décode les noms pour un tableau de types
 */
function decodeTypeNames(array $types, string $lang = 'fr'): array {
    return array_map(fn($t) => decodeTypeName($t, $lang), $types);
}

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getDbConnection();
$currentLang = getLang();

try {
    switch ($method) {
        case 'GET':
            if (isset($_GET['types'])) {
                // Liste des types primaires
                getPrimaryTypes($pdo, $currentLang);
            } elseif (isset($_GET['field_types'])) {
                // Liste des types de champs disponibles
                getFieldTypes();
            } elseif (isset($_GET['id'])) {
                // Détails d'un champ
                getField($pdo, (int) $_GET['id'], $currentLang);
            } else {
                // Liste des champs
                getFields($pdo, $_GET['type_id'] ?? null, $currentLang);
            }
            break;
            
        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            if (isset($input['action']) && $input['action'] === 'reorder') {
                reorderFields($pdo, $input);
            } else {
                createField($pdo);
            }
            break;
            
        case 'PUT':
            $input = json_decode(file_get_contents('php://input'), true);
            if (empty($input['id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'ID requis']);
                exit;
            }
            updateField($pdo, $input);
            break;
            
        case 'DELETE':
            if (empty($_GET['id'])) {
                http_response_code(400);
                echo json_encode(['error' => 'ID requis']);
                exit;
            }
            deleteField($pdo, (int) $_GET['id']);
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
 * Liste des types primaires
 */
function getPrimaryTypes(PDO $pdo, string $lang = 'fr'): void
{
    $stmt = $pdo->query("
        SELECT id, name, icon, color, sort_order
        FROM primary_type
        ORDER BY sort_order, id
    ");
    $types = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $types = decodeTypeNames($types, $lang);
    
    echo json_encode(['success' => true, 'data' => $types]);
}

/**
 * Liste des types de champs disponibles (enum)
 */
function getFieldTypes(): void
{
    $types = [
        ['value' => 'text', 'label' => 'Texte court', 'icon' => 'type'],
        ['value' => 'textarea', 'label' => 'Texte long', 'icon' => 'align-left'],
        ['value' => 'number', 'label' => 'Nombre', 'icon' => 'hash'],
        ['value' => 'year', 'label' => 'Année', 'icon' => 'calendar'],
        ['value' => 'date', 'label' => 'Date', 'icon' => 'calendar'],
        ['value' => 'select', 'label' => 'Liste déroulante', 'icon' => 'chevron-down'],
        ['value' => 'multiselect', 'label' => 'Sélection multiple', 'icon' => 'list'],
        ['value' => 'url', 'label' => 'URL', 'icon' => 'link'],
        ['value' => 'rating', 'label' => 'Note / Rating', 'icon' => 'star'],
        ['value' => 'duration', 'label' => 'Durée', 'icon' => 'clock'],
    ];
    
    echo json_encode(['success' => true, 'data' => $types]);
}

/**
 * Liste des champs avec leurs mappings
 */
function getFields(PDO $pdo, ?int $typeId = null, string $lang = 'fr'): void
{
    $sql = "
        SELECT 
            f.id,
            f.primary_type_id,
            f.field_key,
            f.field_type,
            f.field_options,
            f.is_required,
            f.sort_order,
            f.icon,
            f.lang,
            f.created_at,
            pt.name as type_name,
            (SELECT COUNT(*) FROM primary_type_key_to_field m WHERE m.field_id = f.id) as mappings_count
        FROM primary_type_fields f
        JOIN primary_type pt ON f.primary_type_id = pt.id
        WHERE 1=1
    ";
    
    $params = [];
    
    if ($typeId !== null) {
        $sql .= " AND f.primary_type_id = ?";
        $params[] = $typeId;
    }
    
    $sql .= " ORDER BY pt.sort_order, f.sort_order";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $fields = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Décoder les JSON et les noms de types
    foreach ($fields as &$field) {
        $field['field_options'] = $field['field_options'] ? json_decode($field['field_options'], true) : null;
        $field['lang'] = $field['lang'] ? json_decode($field['lang'], true) : [];
        $field['is_required'] = (bool) $field['is_required'];
        $field['mappings_count'] = (int) $field['mappings_count'];
        
        // Décoder le nom du type (JSON)
        $typeNames = json_decode($field['type_name'], true);
        if (is_array($typeNames)) {
            $field['type_name_fr'] = $typeNames['fr'] ?? $typeNames['en'] ?? $field['type_name'];
            $field['type_name_localized'] = $typeNames[$lang] ?? $typeNames['fr'] ?? $field['type_name'];
        } else {
            $field['type_name_fr'] = $field['type_name'];
            $field['type_name_localized'] = $field['type_name'];
        }
    }
    
    // Charger aussi les données auxiliaires pour l'interface
    $primaryTypes = $pdo->query("
        SELECT id, name, icon, color 
        FROM primary_type 
        ORDER BY sort_order
    ")->fetchAll(PDO::FETCH_ASSOC);
    $primaryTypes = decodeTypeNames($primaryTypes, $lang);
    
    $fieldTypes = [
        'text', 'textarea', 'number', 'year', 'date', 
        'select', 'multiselect', 'array', 'url', 'rating', 'duration'
    ];
    
    echo json_encode([
        'success' => true,
        'data' => [
            'fields' => $fields,
            'primary_types' => $primaryTypes,
            'field_types' => $fieldTypes
        ],
        'count' => count($fields)
    ]);
}

/**
 * Détails d'un champ avec ses mappings
 */
function getField(PDO $pdo, int $id, string $lang = 'fr'): void
{
    $sql = "
        SELECT 
            f.*,
            pt.name as type_name
        FROM primary_type_fields f
        JOIN primary_type pt ON f.primary_type_id = pt.id
        WHERE f.id = ?
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$id]);
    $field = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$field) {
        http_response_code(404);
        echo json_encode(['error' => 'Champ non trouvé']);
        return;
    }
    
    $field['field_options'] = json_decode($field['field_options'], true);
    $field['lang'] = json_decode($field['lang'], true) ?? [];
    $field['is_required'] = (bool) $field['is_required'];
    
    // Décoder le nom du type (JSON)
    $typeNames = json_decode($field['type_name'], true);
    if (is_array($typeNames)) {
        $field['type_name_fr'] = $typeNames['fr'] ?? $typeNames['en'] ?? $field['type_name'];
        $field['type_name_localized'] = $typeNames[$lang] ?? $typeNames['fr'] ?? $field['type_name'];
    } else {
        $field['type_name_fr'] = $field['type_name'];
        $field['type_name_localized'] = $field['type_name'];
    }
    
    // Récupérer les mappings associés
    $stmt = $pdo->prepare("
        SELECT m.*, ft.lang as transform_lang
        FROM primary_type_key_to_field m
        LEFT JOIN field_transform_types ft ON m.transform_type = ft.type_key
        WHERE m.field_id = ?
        ORDER BY m.priority DESC
    ");
    $stmt->execute([$id]);
    $mappings = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($mappings as &$mapping) {
        $mapping['api_keys'] = json_decode($mapping['api_keys'], true) ?? [];
        $mapping['transform_config'] = json_decode($mapping['transform_config'], true);
        $mapping['transform_lang'] = json_decode($mapping['transform_lang'], true) ?? [];
        $mapping['is_active'] = (bool) $mapping['is_active'];
    }
    
    $field['mappings'] = $mappings;
    
    echo json_encode(['success' => true, 'data' => $field]);
}

/**
 * Créer un nouveau champ
 */
function createField(PDO $pdo): void
{
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Validation
    if (empty($input['primary_type_id']) || empty($input['field_key'])) {
        http_response_code(400);
        echo json_encode(['error' => 'primary_type_id et field_key sont requis']);
        return;
    }
    
    // Vérifier que le type existe
    $stmt = $pdo->prepare("SELECT id FROM primary_type WHERE id = ?");
    $stmt->execute([$input['primary_type_id']]);
    if (!$stmt->fetch()) {
        http_response_code(400);
        echo json_encode(['error' => 'Type primaire invalide']);
        return;
    }
    
    // Vérifier l'unicité de la clé pour ce type
    $stmt = $pdo->prepare("
        SELECT id FROM primary_type_fields 
        WHERE primary_type_id = ? AND field_key = ?
    ");
    $stmt->execute([$input['primary_type_id'], $input['field_key']]);
    if ($stmt->fetch()) {
        http_response_code(400);
        echo json_encode(['error' => 'Cette clé existe déjà pour ce type']);
        return;
    }
    
    // Préparer les données
    $lang = $input['lang'] ?? ['fr' => ['name' => $input['field_key']], 'en' => ['name' => $input['field_key']]];
    $fieldOptions = isset($input['field_options']) 
        ? (is_array($input['field_options']) ? json_encode($input['field_options']) : $input['field_options'])
        : null;
    
    // Calculer le sort_order (dernier + 1)
    $stmt = $pdo->prepare("SELECT COALESCE(MAX(sort_order), 0) + 1 FROM primary_type_fields WHERE primary_type_id = ?");
    $stmt->execute([$input['primary_type_id']]);
    $sortOrder = $stmt->fetchColumn();
    
    $sql = "
        INSERT INTO primary_type_fields 
        (primary_type_id, field_key, field_type, field_options, is_required, sort_order, icon, lang)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        $input['primary_type_id'],
        $input['field_key'],
        $input['field_type'] ?? 'text',
        $fieldOptions,
        $input['is_required'] ?? 0,
        $sortOrder,
        $input['icon'] ?? null,
        json_encode($lang)
    ]);
    
    $newId = $pdo->lastInsertId();
    
    echo json_encode([
        'success' => true,
        'message' => 'Champ créé',
        'id' => $newId
    ]);
}

/**
 * Modifier un champ
 */
function updateField(PDO $pdo, array $input): void
{
    $id = (int) $input['id'];
    
    // Vérifier que le champ existe
    $stmt = $pdo->prepare("SELECT id FROM primary_type_fields WHERE id = ?");
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        http_response_code(404);
        echo json_encode(['error' => 'Champ non trouvé']);
        return;
    }
    
    // Construire la requête de mise à jour dynamique
    $updates = [];
    $params = [];
    
    if (isset($input['field_key'])) {
        $updates[] = 'field_key = ?';
        $params[] = $input['field_key'];
    }
    
    if (isset($input['field_type'])) {
        $updates[] = 'field_type = ?';
        $params[] = $input['field_type'];
    }
    
    if (array_key_exists('field_options', $input)) {
        $updates[] = 'field_options = ?';
        $params[] = $input['field_options'] !== null 
            ? (is_array($input['field_options']) ? json_encode($input['field_options']) : $input['field_options'])
            : null;
    }
    
    if (isset($input['is_required'])) {
        $updates[] = 'is_required = ?';
        $params[] = $input['is_required'] ? 1 : 0;
    }
    
    if (isset($input['sort_order'])) {
        $updates[] = 'sort_order = ?';
        $params[] = $input['sort_order'];
    }
    
    if (array_key_exists('icon', $input)) {
        $updates[] = 'icon = ?';
        $params[] = $input['icon'];
    }
    
    if (isset($input['lang'])) {
        $updates[] = 'lang = ?';
        $params[] = is_array($input['lang']) ? json_encode($input['lang']) : $input['lang'];
    }
    
    if (empty($updates)) {
        echo json_encode(['success' => true, 'message' => 'Aucune modification']);
        return;
    }
    
    $params[] = $id;
    $sql = "UPDATE primary_type_fields SET " . implode(', ', $updates) . " WHERE id = ?";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    echo json_encode([
        'success' => true,
        'message' => 'Champ mis à jour'
    ]);
}

/**
 * Supprimer un champ (et ses mappings en cascade)
 */
function deleteField(PDO $pdo, int $id): void
{
    // Vérifier que le champ existe et n'a pas de données
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM item_metadata WHERE field_id = ?");
    $stmt->execute([$id]);
    $count = $stmt->fetchColumn();
    
    if ($count > 0) {
        http_response_code(400);
        echo json_encode([
            'error' => 'Impossible de supprimer',
            'details' => "Ce champ est utilisé par $count item(s)"
        ]);
        return;
    }
    
    $stmt = $pdo->prepare("DELETE FROM primary_type_fields WHERE id = ?");
    $stmt->execute([$id]);
    
    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode(['error' => 'Champ non trouvé']);
        return;
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Champ supprimé'
    ]);
}

/**
 * Réordonner les champs
 */
function reorderFields(PDO $pdo, array $input): void
{
    if (empty($input['orders']) || !is_array($input['orders'])) {
        http_response_code(400);
        echo json_encode(['error' => 'orders requis (array de {id, sort_order})']);
        return;
    }
    
    $stmt = $pdo->prepare("UPDATE primary_type_fields SET sort_order = ? WHERE id = ?");
    
    foreach ($input['orders'] as $order) {
        if (isset($order['id']) && isset($order['sort_order'])) {
            $stmt->execute([$order['sort_order'], $order['id']]);
        }
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Ordre mis à jour'
    ]);
}
