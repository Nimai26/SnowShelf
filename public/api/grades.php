<?php
/**
 * SnowShelf - API Grades
 * 
 * Gestion des grades (états physiques) des objets de collection.
 * 
 * Les grades par défaut (defaut = 1, user_id = NULL) sont partagés par tous.
 * Les utilisateurs Premium/Admin peuvent créer leurs propres grades.
 * 
 * Endpoints:
 * GET    /api/grades.php              - Liste des grades accessibles
 * GET    /api/grades.php?id=X         - Détails d'un grade
 * POST   /api/grades.php              - Créer un grade (Premium/Admin)
 * PUT    /api/grades.php?id=X         - Modifier un grade (proprio/Admin)
 * DELETE /api/grades.php?id=X         - Supprimer un grade (proprio/Admin)
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
    loger('grades', 'ERROR', 'Erreur initialisation', ['error' => $e->getMessage()]);
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
$gradeId = isset($_GET['id']) ? (int)$_GET['id'] : null;
$categoryIds = isset($_GET['category_ids']) ? $_GET['category_ids'] : null;
$method = $_SERVER['REQUEST_METHOD'];

// Router les requêtes
switch ($method) {
    case 'GET':
        if ($gradeId !== null) {
            handleGetOne($db, $gradeId, $userId, $isAdmin);
        } elseif ($categoryIds !== null) {
            // Récupérer les grades liés à des catégories spécifiques
            handleGetByCategories($db, $categoryIds, $userId, $isAdmin, $isPremium);
        } else {
            handleGetList($db, $userId, $isAdmin, $isPremium);
        }
        break;
        
    case 'POST':
        handleCreate($db, $userId, $isAdmin, $isPremium);
        break;
        
    case 'PUT':
        handleUpdate($db, $gradeId, $userId, $isAdmin);
        break;
        
    case 'DELETE':
        handleDelete($db, $gradeId, $userId, $isAdmin);
        break;
        
    default:
        sendError(405, 'method_not_allowed', 'Méthode non autorisée');
}

/**
 * Récupère la liste des grades accessibles
 */
function handleGetList(PDO $db, int $userId, bool $isAdmin, bool $isPremium): void
{
    // Mode admin = uniquement les grades par défaut
    $adminMode = isset($_GET['admin']) && $_GET['admin'] == '1' && $isAdmin;
    
    try {
        if ($adminMode) {
            // Pour l'admin : uniquement les grades par défaut
            $sql = "SELECT g.*, 
                    (SELECT COUNT(*) FROM item_grades ig WHERE ig.grade_id = g.id) as item_usage_count,
                    (SELECT COUNT(*) FROM category_grades cg WHERE cg.grade_id = g.id) as category_usage_count
                    FROM grades g
                    WHERE g.defaut = 1
                    ORDER BY g.name ASC";
            
            $stmt = $db->prepare($sql);
            $stmt->execute();
        } else {
            // Récupérer tous les grades par défaut + les grades de l'utilisateur
            $sql = "SELECT g.*, 
                    (SELECT COUNT(*) FROM item_grades ig WHERE ig.grade_id = g.id) as item_usage_count,
                    (SELECT COUNT(*) FROM category_grades cg WHERE cg.grade_id = g.id) as category_usage_count
                    FROM grades g
                    WHERE g.defaut = 1 OR g.user_id = :userId
                    ORDER BY g.defaut DESC, g.name ASC";
            
            $stmt = $db->prepare($sql);
            $stmt->execute([':userId' => $userId]);
        }
        $grades = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Ajouter les permissions pour chaque grade
        foreach ($grades as &$grade) {
            $grade['defaut'] = (bool)$grade['defaut'];
            $grade['is_own'] = ($grade['user_id'] == $userId);
            $grade['can_edit'] = canEditGrade($grade, $userId, $isAdmin);
            $grade['can_delete'] = canDeleteGrade($grade, $userId, $isAdmin);
            // Total des utilisations (items + catégories)
            $grade['item_usage_count'] = (int)$grade['item_usage_count'];
            $grade['category_usage_count'] = (int)$grade['category_usage_count'];
            $grade['usage_count'] = $grade['item_usage_count'] + $grade['category_usage_count'];
        }
        
        sendSuccess([
            'grades' => $grades,
            'count' => count($grades),
            'user_permissions' => [
                'can_create' => $isPremium || $isAdmin,
                'is_premium' => $isPremium,
                'is_admin' => $isAdmin
            ]
        ]);
    } catch (PDOException $e) {
        loger('grades', 'ERROR', 'Erreur SQL liste', ['error' => $e->getMessage()]);
        sendError(500, 'database_error', 'Erreur lors de la récupération des grades');
    }
}

/**
 * Récupère les grades liés à des catégories spécifiques (via category_grades)
 * Si aucun grade n'est configuré pour les catégories, retourne une liste vide
 * @param string|array $categoryIds - Liste d'IDs de catégories (string séparée par virgules OU array)
 */
function handleGetByCategories(PDO $db, string|array $categoryIds, int $userId, bool $isAdmin, bool $isPremium): void
{
    try {
        // Parser les IDs de catégories - supporte string "1,2,3" ou array [1, 2, 3]
        if (is_array($categoryIds)) {
            $ids = array_filter(array_map('intval', $categoryIds));
        } else {
            $ids = array_filter(array_map('intval', explode(',', $categoryIds)));
        }
        
        loger('grades', 'DEBUG', 'handleGetByCategories appelé', [
            'category_ids_raw' => $categoryIds,
            'category_ids_parsed' => $ids,
            'user_id' => $userId
        ]);
        
        if (empty($ids)) {
            // Aucune catégorie sélectionnée = retourner liste vide
            sendSuccess([
                'grades' => [],
                'count' => 0,
                'category_ids' => []
            ]);
            return;
        }
        
        // Créer les placeholders pour la requête IN
        $placeholders = implode(',', array_fill(0, count($ids), '?'));
        
        // Récupérer les grades liés aux catégories spécifiées (sans doublons)
        $sql = "SELECT DISTINCT g.*, 
                (SELECT COUNT(*) FROM item_grades ig WHERE ig.grade_id = g.id) as item_usage_count,
                (SELECT COUNT(*) FROM category_grades cg WHERE cg.grade_id = g.id) as category_usage_count
                FROM grades g
                INNER JOIN category_grades cg ON g.id = cg.grade_id
                WHERE cg.category_id IN ($placeholders)
                  AND (g.defaut = 1 OR g.user_id = ?)
                ORDER BY g.defaut DESC, g.name ASC";
        
        $stmt = $db->prepare($sql);
        $params = array_merge($ids, [$userId]);
        
        loger('grades', 'DEBUG', 'Requête SQL grades par catégories', [
            'sql' => $sql,
            'params' => $params
        ]);
        
        $stmt->execute($params);
        $grades = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        loger('grades', 'DEBUG', 'Résultat requête grades', [
            'count' => count($grades),
            'grades' => array_map(fn($g) => ['id' => $g['id'], 'name' => $g['name']], $grades)
        ]);
        
        // Ajouter les permissions pour chaque grade
        foreach ($grades as &$grade) {
            $grade['defaut'] = (bool)$grade['defaut'];
            $grade['is_own'] = ($grade['user_id'] == $userId);
            $grade['can_edit'] = canEditGrade($grade, $userId, $isAdmin);
            $grade['can_delete'] = canDeleteGrade($grade, $userId, $isAdmin);
            $grade['item_usage_count'] = (int)$grade['item_usage_count'];
            $grade['category_usage_count'] = (int)$grade['category_usage_count'];
            $grade['usage_count'] = $grade['item_usage_count'] + $grade['category_usage_count'];
        }
        
        sendSuccess([
            'grades' => $grades,
            'count' => count($grades),
            'category_ids' => $ids,
            'user_permissions' => [
                'can_create' => $isPremium || $isAdmin,
                'is_premium' => $isPremium,
                'is_admin' => $isAdmin
            ]
        ]);
    } catch (PDOException $e) {
        loger('grades', 'ERROR', 'Erreur SQL grades par catégories', ['error' => $e->getMessage(), 'category_ids' => $categoryIds]);
        sendError(500, 'database_error', 'Erreur lors de la récupération des grades par catégories');
    }
}

/**
 * Récupère un grade spécifique
 */
function handleGetOne(PDO $db, int $gradeId, int $userId, bool $isAdmin): void
{
    try {
        $sql = "SELECT g.*, 
                (SELECT COUNT(*) FROM item_grades ig WHERE ig.grade_id = g.id) as item_usage_count,
                (SELECT COUNT(*) FROM category_grades cg WHERE cg.grade_id = g.id) as category_usage_count
                FROM grades g
                WHERE g.id = :id";
        
        $stmt = $db->prepare($sql);
        $stmt->execute([':id' => $gradeId]);
        $grade = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$grade) {
            sendError(404, 'not_found', 'Grade non trouvé');
        }
        
        // Vérifier l'accès
        if (!$grade['defaut'] && $grade['user_id'] != $userId && !$isAdmin) {
            sendError(403, 'forbidden', 'Accès non autorisé à ce grade');
        }
        
        $grade['defaut'] = (bool)$grade['defaut'];
        $grade['is_own'] = ($grade['user_id'] == $userId);
        $grade['can_edit'] = canEditGrade($grade, $userId, $isAdmin);
        $grade['can_delete'] = canDeleteGrade($grade, $userId, $isAdmin);
        $grade['item_usage_count'] = (int)$grade['item_usage_count'];
        $grade['category_usage_count'] = (int)$grade['category_usage_count'];
        $grade['usage_count'] = $grade['item_usage_count'] + $grade['category_usage_count'];
        
        sendSuccess($grade);
    } catch (PDOException $e) {
        loger('grades', 'ERROR', 'Erreur SQL get', ['error' => $e->getMessage()]);
        sendError(500, 'database_error', 'Erreur lors de la récupération du grade');
    }
}

/**
 * Crée un nouveau grade
 */
function handleCreate(PDO $db, int $userId, bool $isAdmin, bool $isPremium): void
{
    // Mode admin = création de grade par défaut
    $adminMode = isset($_GET['admin']) && $_GET['admin'] == '1' && $isAdmin;
    
    // Seuls les premium et admins peuvent créer des grades
    if (!$isPremium && !$isAdmin) {
        sendError(403, 'forbidden', 'Seuls les utilisateurs Premium peuvent créer des grades');
    }
    
    $data = getJsonInput();
    
    // Validation
    $name = trim($data['name'] ?? '');
    $description = trim($data['description'] ?? '');
    
    if (empty($name)) {
        sendError(400, 'validation_error', 'Le nom du grade est requis');
    }
    
    if (strlen($name) > 50) {
        sendError(400, 'validation_error', 'Le nom du grade ne peut pas dépasser 50 caractères');
    }
    
    // Vérifier l'unicité du nom
    if ($adminMode) {
        // Pour les grades par défaut, vérifier parmi tous les grades par défaut
        $checkSql = "SELECT id FROM grades WHERE name = :name AND defaut = 1";
        $checkStmt = $db->prepare($checkSql);
        $checkStmt->execute([':name' => $name]);
    } else {
        // Pour les grades utilisateur, vérifier pour cet utilisateur
        $checkSql = "SELECT id FROM grades WHERE name = :name AND user_id = :userId";
        $checkStmt = $db->prepare($checkSql);
        $checkStmt->execute([':name' => $name, ':userId' => $userId]);
    }
    
    if ($checkStmt->fetch()) {
        sendError(409, 'duplicate', 'Un grade avec ce nom existe déjà');
    }
    
    try {
        if ($adminMode) {
            // Grade par défaut (admin)
            $sql = "INSERT INTO grades (name, description, user_id, defaut, created_at) 
                    VALUES (:name, :description, NULL, 1, NOW())";
            $stmt = $db->prepare($sql);
            $stmt->execute([
                ':name' => $name,
                ':description' => $description ?: null
            ]);
        } else {
            // Grade utilisateur
            $sql = "INSERT INTO grades (name, description, user_id, defaut, created_at) 
                    VALUES (:name, :description, :userId, 0, NOW())";
            $stmt = $db->prepare($sql);
            $stmt->execute([
                ':name' => $name,
                ':description' => $description ?: null,
                ':userId' => $userId
            ]);
        }
        
        $newId = $db->lastInsertId();
        
        loger('grades', 'INFO', 'Grade créé', [
            'id' => $newId, 
            'name' => $name, 
            'user' => $adminMode ? 'ADMIN (default)' : $userId,
            'defaut' => $adminMode
        ]);
        
        // Retourner le grade créé
        handleGetOne($db, $newId, $userId, $isAdmin);
        
    } catch (PDOException $e) {
        loger('grades', 'ERROR', 'Erreur création grade', ['error' => $e->getMessage()]);
        sendError(500, 'database_error', 'Erreur lors de la création du grade');
    }
}

/**
 * Modifie un grade existant
 */
function handleUpdate(PDO $db, ?int $gradeId, int $userId, bool $isAdmin): void
{
    if (!$gradeId) {
        sendError(400, 'missing_id', 'ID du grade requis');
    }
    
    // Récupérer le grade
    $stmt = $db->prepare("SELECT * FROM grades WHERE id = :id");
    $stmt->execute([':id' => $gradeId]);
    $grade = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$grade) {
        sendError(404, 'not_found', 'Grade non trouvé');
    }
    
    if (!canEditGrade($grade, $userId, $isAdmin)) {
        sendError(403, 'forbidden', 'Vous ne pouvez pas modifier ce grade');
    }
    
    $data = getJsonInput();
    
    // Validation
    $name = isset($data['name']) ? trim($data['name']) : null;
    $description = isset($data['description']) ? trim($data['description']) : null;
    
    if ($name !== null && empty($name)) {
        sendError(400, 'validation_error', 'Le nom du grade ne peut pas être vide');
    }
    
    if ($name !== null && strlen($name) > 50) {
        sendError(400, 'validation_error', 'Le nom du grade ne peut pas dépasser 50 caractères');
    }
    
    // Vérifier l'unicité du nom si modifié
    if ($name !== null && $name !== $grade['name']) {
        // Pour les grades par défaut (user_id = NULL), vérifier parmi les grades par défaut
        if ($grade['defaut']) {
            $checkSql = "SELECT id FROM grades WHERE name = :name AND defaut = 1 AND id != :id";
            $checkStmt = $db->prepare($checkSql);
            $checkStmt->execute([':name' => $name, ':id' => $gradeId]);
        } else {
            // Pour les grades utilisateur, vérifier pour cet utilisateur
            $checkSql = "SELECT id FROM grades WHERE name = :name AND user_id = :userId AND id != :id";
            $checkStmt = $db->prepare($checkSql);
            $checkStmt->execute([':name' => $name, ':userId' => $grade['user_id'], ':id' => $gradeId]);
        }
        if ($checkStmt->fetch()) {
            sendError(409, 'duplicate', 'Un grade avec ce nom existe déjà');
        }
    }
    
    try {
        $updates = [];
        $params = [':id' => $gradeId];
        
        if ($name !== null) {
            $updates[] = "name = :name";
            $params[':name'] = $name;
        }
        
        if ($description !== null) {
            $updates[] = "description = :description";
            $params[':description'] = $description ?: null;
        }
        
        if (empty($updates)) {
            sendError(400, 'no_changes', 'Aucune modification fournie');
        }
        
        $sql = "UPDATE grades SET " . implode(', ', $updates) . " WHERE id = :id";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        
        loger('grades', 'INFO', 'Grade modifié', ['id' => $gradeId, 'changes' => array_keys($params)]);
        
        // Retourner le grade mis à jour
        handleGetOne($db, $gradeId, $userId, $isAdmin);
        
    } catch (PDOException $e) {
        loger('grades', 'ERROR', 'Erreur modification grade', ['error' => $e->getMessage()]);
        sendError(500, 'database_error', 'Erreur lors de la modification du grade');
    }
}

/**
 * Supprime un grade
 */
function handleDelete(PDO $db, ?int $gradeId, int $userId, bool $isAdmin): void
{
    if (!$gradeId) {
        sendError(400, 'missing_id', 'ID du grade requis');
    }
    
    // Récupérer le grade
    $stmt = $db->prepare("SELECT * FROM grades WHERE id = :id");
    $stmt->execute([':id' => $gradeId]);
    $grade = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$grade) {
        sendError(404, 'not_found', 'Grade non trouvé');
    }
    
    if (!canDeleteGrade($grade, $userId, $isAdmin)) {
        sendError(403, 'forbidden', 'Vous ne pouvez pas supprimer ce grade');
    }
    
    try {
        // Compter les utilisations
        $countStmt = $db->prepare("SELECT COUNT(*) FROM item_grades WHERE grade_id = :id");
        $countStmt->execute([':id' => $gradeId]);
        $usageCount = (int)$countStmt->fetchColumn();
        
        // La FK avec ON DELETE SET NULL va automatiquement mettre à NULL
        // les références dans item_grades
        $stmt = $db->prepare("DELETE FROM grades WHERE id = :id");
        $stmt->execute([':id' => $gradeId]);
        
        // Supprimer aussi des category_grades
        $db->prepare("DELETE FROM category_grades WHERE grade_id = :id")->execute([':id' => $gradeId]);
        
        loger('grades', 'INFO', 'Grade supprimé', [
            'id' => $gradeId, 
            'name' => $grade['name'],
            'items_affected' => $usageCount
        ]);
        
        sendSuccess([
            'deleted' => true,
            'items_affected' => $usageCount
        ]);
        
    } catch (PDOException $e) {
        loger('grades', 'ERROR', 'Erreur suppression grade', ['error' => $e->getMessage()]);
        sendError(500, 'database_error', 'Erreur lors de la suppression du grade');
    }
}

/**
 * Vérifie si l'utilisateur peut modifier un grade
 */
function canEditGrade(array $grade, int $userId, bool $isAdmin): bool
{
    // Admin peut modifier tous les grades, y compris les grades par défaut
    if ($isAdmin) {
        return true;
    }
    
    // Les grades par défaut ne peuvent pas être modifiés par les utilisateurs normaux
    if ($grade['defaut']) {
        return false;
    }
    
    // Le propriétaire peut modifier ses grades
    return $grade['user_id'] == $userId;
}

/**
 * Vérifie si l'utilisateur peut supprimer un grade
 */
function canDeleteGrade(array $grade, int $userId, bool $isAdmin): bool
{
    // Admin peut supprimer tous les grades, y compris les grades par défaut
    if ($isAdmin) {
        return true;
    }
    
    // Les grades par défaut ne peuvent pas être supprimés par les utilisateurs normaux
    if ($grade['defaut']) {
        return false;
    }
    
    // Le propriétaire peut supprimer ses grades
    return $grade['user_id'] == $userId;
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
