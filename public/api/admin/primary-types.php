<?php
/**
 * SnowShelf - API Admin Primary Types
 * Gestion des types primaires et de leurs fournisseurs par défaut
 */

require_once __DIR__ . '/../../../config/database.php';
require_once __DIR__ . '/../../../core/i18n.php';
require_once __DIR__ . '/../../../core/logger.php';

// Headers CORS et JSON
header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

// Démarrage de la session si pas déjà active
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Vérification de l'authentification admin
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => __('api.unauthorized')]);
    exit;
}

if (empty($_SESSION['is_admin'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => __('api.forbidden')]);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    $pdo = getDbConnection();
    
    switch ($method) {
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
        case 'PATCH':
            handlePatch($pdo);
            break;
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    }
} catch (Exception $e) {
    loger('admin_primary_types', 'ERROR', 'Exception', ['message' => $e->getMessage()]);
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

/**
 * Décode le nom JSON d'un type en gardant name_fr et name_en pour rétrocompatibilité
 */
function decodeTypeName(array $type, string $lang = 'fr'): array {
    if (!empty($type['name'])) {
        $names = json_decode($type['name'], true);
        if (is_array($names)) {
            $type['name_fr'] = $names['fr'] ?? $names['en'] ?? $type['name'];
            $type['name_en'] = $names['en'] ?? $names['fr'] ?? $type['name'];
        } else {
            $type['name_fr'] = $type['name'];
            $type['name_en'] = $type['name'];
        }
    }
    return $type;
}

/**
 * GET - Récupérer tous les types primaires avec leurs associations
 */
function handleGet($pdo) {
    $lang = getLang();
    
    // Récupérer tous les types primaires
    $stmt = $pdo->query("
        SELECT id, name, inter_name, icon, color, webapi_type, sort_order
        FROM primary_type
        ORDER BY sort_order
    ");
    $primaryTypes = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Décoder les noms JSON pour chaque type
    $primaryTypes = array_map(fn($t) => decodeTypeName($t, $lang), $primaryTypes);
    
    // Récupérer tous les fournisseurs actifs
    $stmt = $pdo->query("
        SELECT id, name, Name_UF, Type, Defaut_active, PREMIUM_ONLY
        FROM Admin_webApi
        ORDER BY Type, Name_UF
    ");
    $providers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Récupérer les fournisseurs par défaut pour chaque type
    $stmt = $pdo->query("
        SELECT primary_type_id, webapi_id, sort_order
        FROM primary_type_default_providers
        ORDER BY sort_order
    ");
    $defaultProviders = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Organiser les fournisseurs par défaut par type
    $providersByType = [];
    foreach ($defaultProviders as $dp) {
        $typeId = $dp['primary_type_id'];
        if (!isset($providersByType[$typeId])) {
            $providersByType[$typeId] = [];
        }
        $providersByType[$typeId][] = (int)$dp['webapi_id'];
    }
    
    // Ajouter les fournisseurs par défaut à chaque type
    foreach ($primaryTypes as &$type) {
        $type['default_provider_ids'] = $providersByType[$type['id']] ?? [];
    }
    
    // Récupérer les types d'API uniques
    $stmt = $pdo->query("SELECT DISTINCT Type FROM Admin_webApi WHERE Type IS NOT NULL ORDER BY Type");
    $apiTypes = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo json_encode([
        'success' => true,
        'data' => [
            'primary_types' => $primaryTypes,
            'providers' => $providers,
            'api_types' => $apiTypes
        ]
    ]);
}

/**
 * POST - Mettre à jour un type primaire
 */
function handlePost($pdo) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($input['primary_type_id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'primary_type_id required']);
        return;
    }
    
    $primaryTypeId = (int)$input['primary_type_id'];
    $webapiType = isset($input['webapi_type']) ? trim($input['webapi_type']) : null;
    $defaultProviderIds = isset($input['default_provider_ids']) && is_array($input['default_provider_ids']) 
        ? array_map('intval', $input['default_provider_ids']) 
        : [];
    
    // Vérifier que le type primaire existe
    $stmt = $pdo->prepare("SELECT id FROM primary_type WHERE id = ?");
    $stmt->execute([$primaryTypeId]);
    if (!$stmt->fetch()) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Primary type not found']);
        return;
    }
    
    $pdo->beginTransaction();
    
    try {
        // Mettre à jour le webapi_type
        $stmt = $pdo->prepare("UPDATE primary_type SET webapi_type = ? WHERE id = ?");
        $stmt->execute([$webapiType ?: null, $primaryTypeId]);
        
        // Supprimer les anciens fournisseurs par défaut
        $stmt = $pdo->prepare("DELETE FROM primary_type_default_providers WHERE primary_type_id = ?");
        $stmt->execute([$primaryTypeId]);
        
        // Ajouter les nouveaux fournisseurs par défaut
        if (!empty($defaultProviderIds)) {
            $stmt = $pdo->prepare("
                INSERT INTO primary_type_default_providers (primary_type_id, webapi_id, sort_order)
                VALUES (?, ?, ?)
            ");
            
            $sortOrder = 0;
            foreach ($defaultProviderIds as $providerId) {
                $stmt->execute([$primaryTypeId, $providerId, $sortOrder++]);
            }
        }
        
        $pdo->commit();
        
        loger('admin_primary_types', 'INFO', 'Type mis à jour', [
            'primary_type_id' => $primaryTypeId,
            'webapi_type' => $webapiType,
            'default_providers' => $defaultProviderIds
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Configuration saved'
        ]);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}

/**
 * PUT - Créer un nouveau type primaire
 */
function handlePut($pdo) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    // Accepter soit name_json (objet), soit name_fr/name_en séparés pour rétrocompatibilité
    if (!empty($input['name_json']) && is_array($input['name_json'])) {
        $nameData = $input['name_json'];
        $nameFr = trim($nameData['fr'] ?? '');
        $nameEn = trim($nameData['en'] ?? '');
    } else {
        $nameFr = trim($input['name_fr'] ?? '');
        $nameEn = trim($input['name_en'] ?? '');
    }
    
    if (empty($nameFr) || empty($nameEn)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Les noms fr et en sont requis']);
        return;
    }
    
    $icon = isset($input['icon']) ? trim($input['icon']) : 'mdi-folder';
    $color = isset($input['color']) ? trim($input['color']) : '#666666';
    $webapiType = isset($input['webapi_type']) ? trim($input['webapi_type']) : null;
    $interName = isset($input['inter_name']) ? trim($input['inter_name']) : '';
    
    // Valider inter_name : minuscule, sans espaces, sans caractères spéciaux sauf _
    if (!empty($interName)) {
        if (!preg_match('/^[a-z][a-z0-9_]{0,49}$/', $interName)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'inter_name doit être en minuscules, sans espaces, uniquement lettres, chiffres et _, max 50 caractères']);
            return;
        }
    }
    
    // Construire le JSON pour le nom
    $nameJson = json_encode(['fr' => $nameFr, 'en' => $nameEn], JSON_UNESCAPED_UNICODE);
    
    // Récupérer le prochain sort_order
    $stmt = $pdo->query("SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order FROM primary_type");
    $nextOrder = $stmt->fetchColumn();
    
    try {
        $stmt = $pdo->prepare("
            INSERT INTO primary_type (name, inter_name, icon, color, webapi_type, sort_order)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([$nameJson, $interName, $icon, $color, $webapiType ?: null, $nextOrder]);
        
        $newId = $pdo->lastInsertId();
        
        loger('admin_primary_types', 'INFO', 'Type créé', [
            'id' => $newId,
            'name_fr' => $nameFr
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Type created',
            'data' => [
                'id' => (int)$newId,
                'name' => $nameJson,
                'name_fr' => $nameFr,
                'name_en' => $nameEn,
                'inter_name' => $interName,
                'icon' => $icon,
                'color' => $color,
                'webapi_type' => $webapiType,
                'sort_order' => (int)$nextOrder,
                'default_provider_ids' => []
            ]
        ]);
        
    } catch (Exception $e) {
        throw $e;
    }
}

/**
 * DELETE - Supprimer un type primaire
 */
function handleDelete($pdo) {
    $typeId = isset($_GET['id']) ? (int)$_GET['id'] : 0;
    
    if (!$typeId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'id parameter required']);
        return;
    }
    
    // Vérifier que le type existe
    $stmt = $pdo->prepare("SELECT id, name FROM primary_type WHERE id = ?");
    $stmt->execute([$typeId]);
    $type = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$type) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Type not found']);
        return;
    }
    
    // Décoder le nom JSON pour le log
    $type = decodeTypeName($type);
    
    // Vérifier qu'il n'y a pas d'items utilisant ce type
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM items WHERE id_primary_cat = ?");
    $stmt->execute([$typeId]);
    $itemCount = $stmt->fetchColumn();
    
    if ($itemCount > 0) {
        http_response_code(409);
        echo json_encode([
            'success' => false, 
            'error' => "Cannot delete: $itemCount item(s) are using this type",
            'item_count' => (int)$itemCount
        ]);
        return;
    }
    
    $pdo->beginTransaction();
    
    try {
        // Supprimer les fournisseurs par défaut associés
        $stmt = $pdo->prepare("DELETE FROM primary_type_default_providers WHERE primary_type_id = ?");
        $stmt->execute([$typeId]);
        
        // Supprimer les champs de métadonnées associés
        $stmt = $pdo->prepare("DELETE FROM primary_type_fields WHERE primary_type_id = ?");
        $stmt->execute([$typeId]);
        
        // Supprimer le type
        $stmt = $pdo->prepare("DELETE FROM primary_type WHERE id = ?");
        $stmt->execute([$typeId]);
        
        $pdo->commit();
        
        loger('admin_primary_types', 'INFO', 'Type supprimé', [
            'id' => $typeId,
            'name' => $type['name'],
            'name_fr' => $type['name_fr'] ?? ''
        ]);
        
        echo json_encode([
            'success' => true,
            'message' => 'Type deleted'
        ]);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}

/**
 * PATCH - Mettre à jour l'apparence d'un type (icône et couleur)
 */
function handlePatch($pdo) {
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (empty($input['id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'ID required']);
        return;
    }
    
    $typeId = intval($input['id']);
    $icon = $input['icon'] ?? null;
    $color = $input['color'] ?? null;
    $nameJson = $input['name_json'] ?? null;
    $interName = $input['inter_name'] ?? null;
    
    // Vérifier que le type existe
    $stmt = $pdo->prepare("SELECT id, name FROM primary_type WHERE id = ?");
    $stmt->execute([$typeId]);
    $type = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$type) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => 'Type not found']);
        return;
    }
    
    // Construire la requête de mise à jour
    $updates = [];
    $params = [];
    
    // Mise à jour du nom (JSON)
    if ($nameJson !== null) {
        // Valider que c'est un objet avec les clés fr et en
        if (!is_array($nameJson) || empty($nameJson['fr']) || empty($nameJson['en'])) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'name_json must have fr and en keys']);
            return;
        }
        $updates[] = "name = ?";
        $params[] = json_encode($nameJson, JSON_UNESCAPED_UNICODE);
    }
    
    if ($icon !== null) {
        $updates[] = "icon = ?";
        $params[] = $icon;
    }
    
    // Mise à jour de inter_name avec validation
    if ($interName !== null) {
        if ($interName !== '' && !preg_match('/^[a-z][a-z0-9_]{0,49}$/', $interName)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'inter_name doit être en minuscules, sans espaces, uniquement lettres, chiffres et _, max 50 caractères']);
            return;
        }
        $updates[] = "inter_name = ?";
        $params[] = $interName;
    }
    
    if ($color !== null) {
        // Valider le format de la couleur (#RRGGBB)
        if (!preg_match('/^#[0-9A-Fa-f]{6}$/', $color)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Invalid color format']);
            return;
        }
        $updates[] = "color = ?";
        $params[] = $color;
    }
    
    if (empty($updates)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'No fields to update']);
        return;
    }
    
    $params[] = $typeId;
    $sql = "UPDATE primary_type SET " . implode(', ', $updates) . " WHERE id = ?";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    $logData = [
        'id' => $typeId,
        'original_name' => $type['name']
    ];
    if ($nameJson !== null) {
        $logData['new_name'] = $nameJson;
    }
    if ($interName !== null) {
        $logData['inter_name'] = $interName;
    }
    if ($icon !== null) {
        $logData['icon'] = $icon;
    }
    if ($color !== null) {
        $logData['color'] = $color;
    }
    
    loger('admin_primary_types', 'INFO', 'Type primaire mis à jour', $logData);
    
    echo json_encode([
        'success' => true,
        'message' => 'Type updated'
    ]);
}