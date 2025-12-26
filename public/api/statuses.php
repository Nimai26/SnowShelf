<?php
/**
 * SnowShelf - API Statuses
 * 
 * Gestion des statuts (états de possession) des objets de collection.
 * 
 * Les statuts par défaut (defaut = 1, user_id = NULL) sont partagés par tous.
 * Les utilisateurs Premium/Admin peuvent créer leurs propres statuts.
 * 
 * Endpoints:
 * GET    /api/statuses.php              - Liste des statuts accessibles
 * GET    /api/statuses.php?id=X         - Détails d'un statut
 * POST   /api/statuses.php              - Créer un statut (Premium/Admin)
 * PUT    /api/statuses.php?id=X         - Modifier un statut (proprio/Admin)
 * DELETE /api/statuses.php?id=X         - Supprimer un statut (proprio/Admin)
 */

// Headers CORS et JSON
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Authorization');

// Gérer les requêtes OPTIONS (preflight CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Chargement des dépendances
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../core/ApiAuth.php';
require_once __DIR__ . '/../../core/i18n.php';
require_once __DIR__ . '/../../core/logger.php';

// Initialisation
try {
    $db = getDbConnection();
    $auth = new ApiAuth($db);
} catch (Exception $e) {
    loger('statuses', 'ERROR', 'Erreur initialisation', ['error' => $e->getMessage()]);
    sendError(500, 'server_error', 'Erreur serveur');
}

// Authentification obligatoire
$currentUser = $auth->authenticate();
if (!$currentUser) {
    $auth->sendUnauthorized('Authentification requise');
}

// Récupérer le statut de l'utilisateur
$isAdmin = $auth->isAdmin();
$isPremium = $auth->isPremium();
$userId = $currentUser['id'];

// Récupérer les paramètres
$statusId = isset($_GET['id']) ? (int)$_GET['id'] : null;
$method = $_SERVER['REQUEST_METHOD'];

// Router les requêtes
switch ($method) {
    case 'GET':
        if ($statusId !== null) {
            handleGetOne($db, $statusId, $userId, $isAdmin);
        } else {
            handleGetList($db, $userId, $isAdmin, $isPremium);
        }
        break;
        
    case 'POST':
        handleCreate($db, $userId, $isAdmin, $isPremium);
        break;
        
    case 'PUT':
        handleUpdate($db, $statusId, $userId, $isAdmin);
        break;
        
    case 'DELETE':
        handleDelete($db, $statusId, $userId, $isAdmin);
        break;
        
    default:
        sendError(405, 'method_not_allowed', 'Méthode non autorisée');
}

/**
 * Récupère la liste des statuts accessibles
 */
function handleGetList(PDO $db, int $userId, bool $isAdmin, bool $isPremium): void
{
    // Mode admin = uniquement les statuts par défaut
    $adminMode = isset($_GET['admin']) && $_GET['admin'] == '1' && $isAdmin;
    
    try {
        if ($adminMode) {
            // Pour l'admin : uniquement les statuts par défaut
            $sql = "SELECT s.*, 
                    (SELECT COUNT(*) FROM items i WHERE i.status_id = s.id) as usage_count
                    FROM statuses s
                    WHERE s.defaut = 1
                    ORDER BY s.ordre ASC, s.name ASC";
            
            $stmt = $db->prepare($sql);
            $stmt->execute();
        } else {
            // Récupérer tous les statuts par défaut + les statuts de l'utilisateur
            $sql = "SELECT s.*, 
                    (SELECT COUNT(*) FROM items i WHERE i.status_id = s.id) as usage_count
                    FROM statuses s
                    WHERE s.defaut = 1 OR s.user_id = :userId
                    ORDER BY s.defaut DESC, s.ordre ASC, s.name ASC";
            
            $stmt = $db->prepare($sql);
            $stmt->execute([':userId' => $userId]);
        }
        $statuses = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Ajouter les permissions pour chaque statut
        foreach ($statuses as &$status) {
            $status['defaut'] = (bool)$status['defaut'];
            $status['is_own'] = ($status['user_id'] == $userId);
            $status['can_edit'] = canEditStatus($status, $userId, $isAdmin);
            $status['can_delete'] = canDeleteStatus($status, $userId, $isAdmin);
            $status['usage_count'] = (int)$status['usage_count'];
        }
        
        sendSuccess([
            'statuses' => $statuses,
            'count' => count($statuses),
            'user_permissions' => [
                'can_create' => $isPremium || $isAdmin,
                'is_premium' => $isPremium,
                'is_admin' => $isAdmin
            ]
        ]);
    } catch (PDOException $e) {
        loger('statuses', 'ERROR', 'Erreur SQL liste', ['error' => $e->getMessage()]);
        sendError(500, 'database_error', 'Erreur lors de la récupération des statuts');
    }
}

/**
 * Récupère un statut spécifique
 */
function handleGetOne(PDO $db, int $statusId, int $userId, bool $isAdmin): void
{
    try {
        $sql = "SELECT s.*, 
                (SELECT COUNT(*) FROM items i WHERE i.status_id = s.id) as usage_count
                FROM statuses s
                WHERE s.id = :id";
        
        $stmt = $db->prepare($sql);
        $stmt->execute([':id' => $statusId]);
        $status = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$status) {
            sendError(404, 'not_found', 'Statut non trouvé');
        }
        
        // Vérifier l'accès
        if (!$status['defaut'] && $status['user_id'] != $userId && !$isAdmin) {
            sendError(403, 'forbidden', 'Accès non autorisé à ce statut');
        }
        
        $status['defaut'] = (bool)$status['defaut'];
        $status['is_own'] = ($status['user_id'] == $userId);
        $status['can_edit'] = canEditStatus($status, $userId, $isAdmin);
        $status['can_delete'] = canDeleteStatus($status, $userId, $isAdmin);
        $status['usage_count'] = (int)$status['usage_count'];
        
        sendSuccess($status);
    } catch (PDOException $e) {
        loger('statuses', 'ERROR', 'Erreur SQL get', ['error' => $e->getMessage()]);
        sendError(500, 'database_error', 'Erreur lors de la récupération du statut');
    }
}

/**
 * Crée un nouveau statut
 */
function handleCreate(PDO $db, int $userId, bool $isAdmin, bool $isPremium): void
{
    // Mode admin = création de statut par défaut
    $adminMode = isset($_GET['admin']) && $_GET['admin'] == '1' && $isAdmin;
    
    // Seuls les premium et admins peuvent créer des statuts
    if (!$isPremium && !$isAdmin) {
        sendError(403, 'forbidden', 'Seuls les utilisateurs Premium peuvent créer des statuts');
    }
    
    $data = getJsonInput();
    
    // Validation
    $name = trim($data['name'] ?? '');
    $description = trim($data['description'] ?? '');
    $color = trim($data['color'] ?? '#6b7280');
    $icon = trim($data['icon'] ?? 'tag');
    $ordre = isset($data['ordre']) ? (int)$data['ordre'] : 0;
    
    if (empty($name)) {
        sendError(400, 'validation_error', 'Le nom du statut est requis');
    }
    
    if (strlen($name) > 50) {
        sendError(400, 'validation_error', 'Le nom du statut ne peut pas dépasser 50 caractères');
    }
    
    // Valider la couleur (format hex)
    if (!preg_match('/^#[0-9A-Fa-f]{6}$/', $color)) {
        $color = '#6b7280'; // Couleur par défaut
    }
    
    // Vérifier l'unicité du nom
    if ($adminMode) {
        // Pour les statuts par défaut, vérifier parmi tous les statuts par défaut
        $checkSql = "SELECT id FROM statuses WHERE name = :name AND defaut = 1";
        $checkStmt = $db->prepare($checkSql);
        $checkStmt->execute([':name' => $name]);
    } else {
        // Pour les statuts utilisateur, vérifier pour cet utilisateur
        $checkSql = "SELECT id FROM statuses WHERE name = :name AND user_id = :userId";
        $checkStmt = $db->prepare($checkSql);
        $checkStmt->execute([':name' => $name, ':userId' => $userId]);
    }
    
    if ($checkStmt->fetch()) {
        sendError(409, 'duplicate', 'Un statut avec ce nom existe déjà');
    }
    
    try {
        if ($adminMode) {
            // Statut par défaut (admin)
            $sql = "INSERT INTO statuses (name, description, color, icon, ordre, user_id, defaut, created_at) 
                    VALUES (:name, :description, :color, :icon, :ordre, NULL, 1, NOW())";
            $stmt = $db->prepare($sql);
            $stmt->execute([
                ':name' => $name,
                ':description' => $description ?: null,
                ':color' => $color,
                ':icon' => $icon,
                ':ordre' => $ordre
            ]);
        } else {
            // Statut utilisateur
            $sql = "INSERT INTO statuses (name, description, color, icon, ordre, user_id, defaut, created_at) 
                    VALUES (:name, :description, :color, :icon, :ordre, :userId, 0, NOW())";
            $stmt = $db->prepare($sql);
            $stmt->execute([
                ':name' => $name,
                ':description' => $description ?: null,
                ':color' => $color,
                ':icon' => $icon,
                ':ordre' => $ordre,
                ':userId' => $userId
            ]);
        }
        
        $newId = $db->lastInsertId();
        
        loger('statuses', 'INFO', 'Statut créé', [
            'id' => $newId, 
            'name' => $name, 
            'user' => $adminMode ? 'ADMIN (default)' : $userId,
            'defaut' => $adminMode
        ]);
        
        // Retourner le statut créé
        handleGetOne($db, $newId, $userId, $isAdmin);
        
    } catch (PDOException $e) {
        loger('statuses', 'ERROR', 'Erreur création statut', ['error' => $e->getMessage()]);
        sendError(500, 'database_error', 'Erreur lors de la création du statut');
    }
}

/**
 * Modifie un statut existant
 */
function handleUpdate(PDO $db, ?int $statusId, int $userId, bool $isAdmin): void
{
    if (!$statusId) {
        sendError(400, 'missing_id', 'ID du statut requis');
    }
    
    // Récupérer le statut
    $stmt = $db->prepare("SELECT * FROM statuses WHERE id = :id");
    $stmt->execute([':id' => $statusId]);
    $status = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$status) {
        sendError(404, 'not_found', 'Statut non trouvé');
    }
    
    if (!canEditStatus($status, $userId, $isAdmin)) {
        sendError(403, 'forbidden', 'Vous ne pouvez pas modifier ce statut');
    }
    
    $data = getJsonInput();
    
    // Validation
    $name = isset($data['name']) ? trim($data['name']) : null;
    $description = isset($data['description']) ? trim($data['description']) : null;
    $color = isset($data['color']) ? trim($data['color']) : null;
    $icon = isset($data['icon']) ? trim($data['icon']) : null;
    $ordre = isset($data['ordre']) ? (int)$data['ordre'] : null;
    
    if ($name !== null && empty($name)) {
        sendError(400, 'validation_error', 'Le nom du statut ne peut pas être vide');
    }
    
    if ($name !== null && strlen($name) > 50) {
        sendError(400, 'validation_error', 'Le nom du statut ne peut pas dépasser 50 caractères');
    }
    
    // Valider la couleur (format hex)
    if ($color !== null && !preg_match('/^#[0-9A-Fa-f]{6}$/', $color)) {
        $color = null; // Ignorer si format invalide
    }
    
    // Vérifier l'unicité du nom si modifié
    if ($name !== null && $name !== $status['name']) {
        // Pour les statuts par défaut (user_id = NULL), vérifier parmi les statuts par défaut
        if ($status['defaut']) {
            $checkSql = "SELECT id FROM statuses WHERE name = :name AND defaut = 1 AND id != :id";
            $checkStmt = $db->prepare($checkSql);
            $checkStmt->execute([':name' => $name, ':id' => $statusId]);
        } else {
            // Pour les statuts utilisateur, vérifier pour cet utilisateur
            $checkSql = "SELECT id FROM statuses WHERE name = :name AND user_id = :userId AND id != :id";
            $checkStmt = $db->prepare($checkSql);
            $checkStmt->execute([':name' => $name, ':userId' => $status['user_id'], ':id' => $statusId]);
        }
        if ($checkStmt->fetch()) {
            sendError(409, 'duplicate', 'Un statut avec ce nom existe déjà');
        }
    }
    
    try {
        $updates = [];
        $params = [':id' => $statusId];
        
        if ($name !== null) {
            $updates[] = "name = :name";
            $params[':name'] = $name;
        }
        
        if ($description !== null) {
            $updates[] = "description = :description";
            $params[':description'] = $description ?: null;
        }
        
        if ($color !== null) {
            $updates[] = "color = :color";
            $params[':color'] = $color;
        }
        
        if ($icon !== null) {
            $updates[] = "icon = :icon";
            $params[':icon'] = $icon;
        }
        
        if ($ordre !== null) {
            $updates[] = "ordre = :ordre";
            $params[':ordre'] = $ordre;
        }
        
        if (empty($updates)) {
            sendError(400, 'no_changes', 'Aucune modification fournie');
        }
        
        $sql = "UPDATE statuses SET " . implode(', ', $updates) . " WHERE id = :id";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        
        loger('statuses', 'INFO', 'Statut modifié', ['id' => $statusId, 'changes' => array_keys($params)]);
        
        // Retourner le statut mis à jour
        handleGetOne($db, $statusId, $userId, $isAdmin);
        
    } catch (PDOException $e) {
        loger('statuses', 'ERROR', 'Erreur modification statut', ['error' => $e->getMessage()]);
        sendError(500, 'database_error', 'Erreur lors de la modification du statut');
    }
}

/**
 * Supprime un statut
 */
function handleDelete(PDO $db, ?int $statusId, int $userId, bool $isAdmin): void
{
    if (!$statusId) {
        sendError(400, 'missing_id', 'ID du statut requis');
    }
    
    // Récupérer le statut
    $stmt = $db->prepare("SELECT * FROM statuses WHERE id = :id");
    $stmt->execute([':id' => $statusId]);
    $status = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$status) {
        sendError(404, 'not_found', 'Statut non trouvé');
    }
    
    if (!canDeleteStatus($status, $userId, $isAdmin)) {
        sendError(403, 'forbidden', 'Vous ne pouvez pas supprimer ce statut');
    }
    
    try {
        // Compter les utilisations
        $countStmt = $db->prepare("SELECT COUNT(*) FROM items WHERE status_id = :id");
        $countStmt->execute([':id' => $statusId]);
        $usageCount = (int)$countStmt->fetchColumn();
        
        // La FK avec ON DELETE SET NULL va automatiquement mettre à NULL
        // les références dans items
        $stmt = $db->prepare("DELETE FROM statuses WHERE id = :id");
        $stmt->execute([':id' => $statusId]);
        
        loger('statuses', 'INFO', 'Statut supprimé', [
            'id' => $statusId, 
            'name' => $status['name'],
            'items_affected' => $usageCount
        ]);
        
        sendSuccess([
            'deleted' => true,
            'items_affected' => $usageCount
        ]);
        
    } catch (PDOException $e) {
        loger('statuses', 'ERROR', 'Erreur suppression statut', ['error' => $e->getMessage()]);
        sendError(500, 'database_error', 'Erreur lors de la suppression du statut');
    }
}

/**
 * Vérifie si l'utilisateur peut modifier un statut
 */
function canEditStatus(array $status, int $userId, bool $isAdmin): bool
{
    // Admin peut modifier tous les statuts, y compris les statuts par défaut
    if ($isAdmin) {
        return true;
    }
    
    // Les statuts par défaut ne peuvent pas être modifiés par les utilisateurs normaux
    if ($status['defaut']) {
        return false;
    }
    
    // Le propriétaire peut modifier ses statuts
    return $status['user_id'] == $userId;
}

/**
 * Vérifie si l'utilisateur peut supprimer un statut
 */
function canDeleteStatus(array $status, int $userId, bool $isAdmin): bool
{
    // Admin peut supprimer tous les statuts, y compris les statuts par défaut
    if ($isAdmin) {
        return true;
    }
    
    // Les statuts par défaut ne peuvent pas être supprimés par les utilisateurs normaux
    if ($status['defaut']) {
        return false;
    }
    
    // Le propriétaire peut supprimer ses statuts
    return $status['user_id'] == $userId;
}

/**
 * Récupère le body JSON de la requête
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
function sendError(int $httpCode, string $code, string $message): void
{
    http_response_code($httpCode);
    echo json_encode([
        'success' => false,
        'error' => [
            'code' => $code,
            'message' => $message
        ]
    ], JSON_UNESCAPED_UNICODE);
    exit;
}
