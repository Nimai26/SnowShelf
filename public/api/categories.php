<?php
/**
 * SnowShelf - API Catégories
 * 
 * Gestion des catégories selon les droits utilisateurs :
 * - Free : Consultation des catégories par défaut uniquement
 * - Premium : Consultation par défaut + publiques, CRUD sur ses propres catégories
 * - Admin : Accès total (CRUD sur toutes les catégories)
 * 
 * Endpoints:
 * GET    /api/categories.php              - Liste des catégories accessibles
 * GET    /api/categories.php?id=X         - Détails d'une catégorie
 * POST   /api/categories.php              - Créer une catégorie (Premium/Admin)
 * PUT    /api/categories.php?id=X         - Modifier une catégorie
 * DELETE /api/categories.php?id=X         - Supprimer une catégorie
 * 
 * Paramètres GET (liste) :
 * - search     : Recherche dans le nom et la description
 * - filter     : 'all', 'default', 'public', 'mine'
 * - show_default : 1/0 - Inclure les catégories par défaut
 * - show_public  : 1/0 - Inclure les catégories publiques des autres
 * 
 * ⚠️ TODO - Gestion des médias (category_img, category_videos, category_audio, category_doc) :
 * Quand l'upload/modification des médias sera implémenté, appliquer la même logique que pour l'icône :
 * - Si is_default change, NE PAS inclure les URLs médias dans l'UPDATE principal
 * - transferCategoryFiles() gère le déplacement des fichiers ET la mise à jour des URLs
 * - Pour les nouveaux uploads pendant un changement is_default : utiliser directement le chemin destination final
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
require_once __DIR__ . '/../../core/UploadConfig.php';

// Log de début de requête
loger('categories', 'DEBUG', 'API Categories appelée', [
    'method' => $_SERVER['REQUEST_METHOD'],
    'get_params' => $_GET,
    'session_id' => session_id(),
    'session_status' => session_status(),
    'session_data' => isset($_SESSION) ? array_keys($_SESSION) : 'SESSION non définie'
]);

// Initialisation
try {
    $db = getDbConnection();
    $auth = new ApiAuth($db);
    loger('categories', 'DEBUG', 'Connexion DB et Auth OK');
} catch (Exception $e) {
    loger('categories', 'ERROR', 'Erreur initialisation', ['error' => $e->getMessage()]);
    sendError(500, 'server_error', 'Erreur serveur');
}

// Authentification obligatoire
$currentUser = $auth->authenticate();
loger('categories', 'DEBUG', 'Résultat authentification', [
    'user' => $currentUser ? ['id' => $currentUser['id'], 'name' => $currentUser['name'] ?? 'N/A'] : null,
    'session_user_id' => $_SESSION['user_id'] ?? 'non défini',
    'session_keys' => isset($_SESSION) ? array_keys($_SESSION) : []
]);

if (!$currentUser) {
    loger('categories', 'WARNING', 'Authentification échouée - Utilisateur non connecté');
    $auth->sendUnauthorized('Authentification requise');
}

// Récupérer le statut de l'utilisateur
$isAdmin = $auth->isAdmin();
$isPremium = $auth->isPremium();
$userId = $currentUser['id'];

loger('categories', 'INFO', 'Utilisateur authentifié', [
    'user_id' => $userId,
    'is_admin' => $isAdmin,
    'is_premium' => $isPremium
]);

// Récupérer la méthode HTTP (avec support de X-HTTP-Method-Override pour FormData)
$method = $_SERVER['REQUEST_METHOD'];

// Support du header X-HTTP-Method-Override pour contourner les limitations de FormData
if ($method === 'POST') {
    $override = $_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'] ?? '';
    if (in_array(strtoupper($override), ['PUT', 'DELETE', 'PATCH'])) {
        $method = strtoupper($override);
        loger('categories', 'DEBUG', 'Méthode HTTP overridée', [
            'original' => 'POST',
            'override' => $method
        ]);
    }
}

// Récupérer les paramètres
$categoryId = isset($_GET['id']) ? (int)$_GET['id'] : null;
$action = $_GET['action'] ?? null;

// Router les requêtes
switch ($method) {
    case 'GET':
        if ($action === 'search') {
            // Recherche pour auto-complétion
            handleSearchCategories($db, $userId, $isAdmin, $isPremium);
        } elseif ($action === 'grades') {
            // Liste de tous les grades disponibles
            handleGetGrades($db, $userId, $isAdmin);
        } elseif ($action === 'default-parents' && $categoryId) {
            // Récupérer les liens par défaut d'une catégorie
            handleGetDefaultParents($db, $categoryId);
        } elseif ($categoryId !== null) {
            handleGetOne($db, $categoryId, $userId, $isAdmin, $isPremium);
        } else {
            handleGetList($db, $userId, $isAdmin, $isPremium);
        }
        break;
        
    case 'POST':
        if ($action === 'copy' && $categoryId) {
            handleCopy($db, $categoryId, $userId, $isAdmin, $isPremium);
        } elseif ($action === 'parents' && $categoryId) {
            handleUpdateParents($db, $categoryId, $userId, $isAdmin, $isPremium);
        } elseif ($action === 'default-parents' && $categoryId) {
            // Gérer les liens par défaut (admin uniquement)
            handleUpdateDefaultParents($db, $categoryId, $isAdmin);
        } elseif ($action === 'import-defaults' && $categoryId) {
            // Importer les liens par défaut pour un utilisateur
            handleImportDefaultParents($db, $categoryId, $userId);
        } elseif ($action === 'grades' && $categoryId) {
            handleUpdateGrades($db, $categoryId, $userId, $isAdmin, $isPremium);
        } else {
            handleCreate($db, $userId, $isAdmin, $isPremium);
        }
        break;
        
    case 'PUT':
        handleUpdate($db, $categoryId, $userId, $isAdmin, $isPremium);
        break;
        
    case 'DELETE':
        handleDelete($db, $categoryId, $userId, $isAdmin);
        break;
        
    default:
        sendError(405, 'method_not_allowed', 'Méthode non autorisée');
}

/**
 * Récupère la liste des catégories accessibles
 */
function handleGetList(PDO $db, int $userId, bool $isAdmin, bool $isPremium): void
{
    loger('categories', 'DEBUG', 'handleGetList appelée', [
        'userId' => $userId,
        'isAdmin' => $isAdmin,
        'isPremium' => $isPremium,
        'GET' => $_GET
    ]);

    $search = $_GET['search'] ?? null;
    $filter = $_GET['filter'] ?? 'all';
    // Note: (bool)'0' = true en PHP, donc on compare avec '1' ou on utilise filter_var
    $showDefault = !isset($_GET['show_default']) || $_GET['show_default'] === '1';
    $showPublic = !isset($_GET['show_public']) || $_GET['show_public'] === '1';
    
    loger('categories', 'DEBUG', 'Paramètres de filtrage', [
        'search' => $search,
        'filter' => $filter,
        'showDefault' => $showDefault,
        'showPublic' => $showPublic
    ]);
    
    // Construction de la requête SQL
    $sql = "SELECT c.*, 
            u.name as owner_name,
            uc.name as creator_name,
            (SELECT COUNT(*) FROM item_categories ic WHERE ic.category_id = c.id) as items_count
            FROM categories c
            LEFT JOIN users u ON c.user_id = u.id
            LEFT JOIN users uc ON c.original_creator = uc.id
            WHERE 1=1";
    
    $params = [];
    $conditions = [];
    
    // Logique d'accès selon le rôle
    if ($isAdmin) {
        // Admin : accès à toutes les catégories, mais respecte les toggles showDefault/showPublic
        $accessConditions = [];
        
        if ($showDefault) {
            $accessConditions[] = "c.is_default = 1";
        }
        if ($showPublic) {
            // Catégories publiques (visibles, non par défaut)
            $accessConditions[] = "(c.visible = 1 AND c.is_default = 0)";
        }
        // Toujours inclure les catégories privées (non visibles, non par défaut)
        $accessConditions[] = "(c.visible = 0 AND c.is_default = 0)";
        
        if (!empty($accessConditions)) {
            $conditions[] = "(" . implode(" OR ", $accessConditions) . ")";
        }
    } elseif ($isPremium) {
        // Premium : par défaut + publiques + les siennes
        $accessConditions = [];
        
        if ($showDefault) {
            $accessConditions[] = "c.is_default = 1";
        }
        if ($showPublic) {
            $accessConditions[] = "(c.visible = 1 AND c.user_id != :userIdPublic)";
            $params[':userIdPublic'] = $userId;
        }
        $accessConditions[] = "c.user_id = :userIdOwn";
        $params[':userIdOwn'] = $userId;
        
        $conditions[] = "(" . implode(" OR ", $accessConditions) . ")";
    } else {
        // Free : uniquement les catégories par défaut
        $conditions[] = "c.is_default = 1";
    }
    
    // Filtres additionnels
    switch ($filter) {
        case 'default':
            $conditions[] = "c.is_default = 1";
            break;
        case 'public':
            if ($isPremium || $isAdmin) {
                $conditions[] = "c.visible = 1 AND c.is_default = 0";
            }
            break;
        case 'mine':
            if ($isPremium || $isAdmin) {
                $conditions[] = "c.user_id = :filterUserId";
                $params[':filterUserId'] = $userId;
            }
            break;
    }
    
    // Recherche
    if ($search) {
        $conditions[] = "(c.name LIKE :searchName OR c.description LIKE :searchDesc)";
        $params[':searchName'] = '%' . $search . '%';
        $params[':searchDesc'] = '%' . $search . '%';
    }
    
    // Assembler les conditions
    if (!empty($conditions)) {
        $sql .= " AND " . implode(" AND ", $conditions);
    }
    
    // Tri : catégories par défaut en premier, puis par nom
    $sql .= " ORDER BY c.is_default DESC, c.name ASC";
    
    loger('categories', 'DEBUG', 'Requête SQL construite', [
        'sql' => $sql,
        'params' => $params
    ]);
    
    try {
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        loger('categories', 'INFO', 'Catégories récupérées', [
            'count' => count($categories)
        ]);
        
        // Ajouter les informations de permissions pour chaque catégorie
        foreach ($categories as &$cat) {
            $cat['can_edit'] = canEditCategory($cat, $userId, $isAdmin);
            $cat['can_delete'] = canDeleteCategory($cat, $userId, $isAdmin);
            $cat['is_owner'] = ($cat['user_id'] == $userId);
            $cat['items_count'] = (int)$cat['items_count'];
            $cat['is_default'] = (bool)$cat['is_default'];
            $cat['visible'] = (bool)$cat['visible'];
        }
        
        loger('categories', 'DEBUG', 'Envoi réponse succès');
        
        sendSuccess([
            'categories' => $categories,
            'count' => count($categories),
            'user_permissions' => [
                'can_create' => $isPremium || $isAdmin,
                'is_premium' => $isPremium,
                'is_admin' => $isAdmin
            ]
        ]);
    } catch (PDOException $e) {
        loger('categories', 'ERROR', 'Erreur SQL liste', ['error' => $e->getMessage()]);
        sendError(500, 'database_error', 'Erreur lors de la récupération des catégories');
    }
}

/**
 * Récupère une catégorie spécifique avec toutes ses données relationnelles
 */
function handleGetOne(PDO $db, int $categoryId, int $userId, bool $isAdmin, bool $isPremium): void
{
    try {
        $sql = "SELECT c.*, 
                u.name as owner_name,
                uc.name as creator_name,
                (SELECT COUNT(*) FROM item_categories ic WHERE ic.category_id = c.id) as items_count
                FROM categories c
                LEFT JOIN users u ON c.user_id = u.id
                LEFT JOIN users uc ON c.original_creator = uc.id
                WHERE c.id = :id";
        
        $stmt = $db->prepare($sql);
        $stmt->execute([':id' => $categoryId]);
        $category = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$category) {
            sendError(404, 'not_found', 'Catégorie non trouvée');
        }
        
        // Vérifier les droits d'accès
        if (!canAccessCategory($category, $userId, $isAdmin, $isPremium)) {
            sendError(403, 'forbidden', 'Accès non autorisé à cette catégorie');
        }
        
        // Ajouter les permissions
        $category['can_edit'] = canEditCategory($category, $userId, $isAdmin);
        $category['can_delete'] = canDeleteCategory($category, $userId, $isAdmin);
        $category['can_copy'] = $isPremium || $isAdmin;
        $category['is_owner'] = ($category['user_id'] == $userId);
        $category['items_count'] = (int)$category['items_count'];
        $category['is_default'] = (bool)$category['is_default'];
        $category['visible'] = (bool)$category['visible'];
        
        // Récupérer les catégories filles (cette catégorie est mère) - liens utilisateur
        $category['children'] = getCategoryChildren($db, $categoryId, $userId);
        
        // Récupérer les catégories mères (cette catégorie est fille) - liens utilisateur
        $category['mothers'] = getCategoryParents($db, $categoryId, $userId);
        
        // Récupérer les liens par défaut (pour affichage et import potentiel)
        $category['default_parents'] = getDefaultParents($db, $categoryId);
        $category['default_children'] = getDefaultChildren($db, $categoryId);
        $category['has_default_parents'] = count($category['default_parents']) > 0;
        
        // Récupérer les grades associés (incluant les grades personnalisés de l'utilisateur)
        $category['grades'] = getCategoryGrades($db, $categoryId, $userId);
        
        // Récupérer les médias
        $category['images'] = getCategoryMedia($db, $categoryId, 'img');
        $category['videos'] = getCategoryMedia($db, $categoryId, 'videos');
        $category['audio'] = getCategoryMedia($db, $categoryId, 'audio');
        $category['documents'] = getCategoryMedia($db, $categoryId, 'doc');
        
        sendSuccess($category);
    } catch (PDOException $e) {
        loger('categories', 'ERROR', 'Erreur SQL get', ['error' => $e->getMessage()]);
        sendError(500, 'database_error', 'Erreur lors de la récupération de la catégorie');
    }
}

/**
 * Récupère les catégories filles d'une catégorie (liens utilisateur uniquement)
 */
function getCategoryChildren(PDO $db, int $categoryId, int $userId = 0): array
{
    $sql = "SELECT DISTINCT c.id, c.name, c.icon
            FROM category_mothers cm
            JOIN categories c ON cm.id_fille = c.id
            WHERE cm.id_mere = :id AND cm.user_id = :userId
            ORDER BY c.name";
    $stmt = $db->prepare($sql);
    $stmt->execute([':id' => $categoryId, ':userId' => $userId]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

/**
 * Récupère les catégories mères (parentes) d'une catégorie (liens utilisateur uniquement)
 */
function getCategoryParents(PDO $db, int $categoryId, int $userId = 0): array
{
    $sql = "SELECT DISTINCT c.id, c.name, c.icon
            FROM category_mothers cm
            JOIN categories c ON cm.id_mere = c.id
            WHERE cm.id_fille = :id AND cm.user_id = :userId
            ORDER BY c.name";
    $stmt = $db->prepare($sql);
    $stmt->execute([':id' => $categoryId, ':userId' => $userId]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

/**
 * Récupère les catégories parentes par défaut d'une catégorie
 */
function getDefaultParents(PDO $db, int $categoryId): array
{
    $sql = "SELECT DISTINCT c.id, c.name, c.icon
            FROM category_mothers_default cmd
            JOIN categories c ON cmd.id_mere = c.id
            WHERE cmd.id_fille = :id
            ORDER BY c.name";
    $stmt = $db->prepare($sql);
    $stmt->execute([':id' => $categoryId]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

/**
 * Récupère les catégories filles par défaut d'une catégorie
 */
function getDefaultChildren(PDO $db, int $categoryId): array
{
    $sql = "SELECT DISTINCT c.id, c.name, c.icon
            FROM category_mothers_default cmd
            JOIN categories c ON cmd.id_fille = c.id
            WHERE cmd.id_mere = :id
            ORDER BY c.name";
    $stmt = $db->prepare($sql);
    $stmt->execute([':id' => $categoryId]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

/**
 * Récupère les grades associés à une catégorie
 * Inclut les grades par défaut ET les grades personnalisés de l'utilisateur
 */
function getCategoryGrades(PDO $db, int $categoryId, int $userId = 0): array
{
    $sql = "SELECT g.id, g.name, g.description, g.defaut,
            CASE WHEN cg.id IS NOT NULL THEN 1 ELSE 0 END as enabled
            FROM grades g
            LEFT JOIN category_grades cg ON cg.grade_id = g.id AND cg.category_id = :id
            WHERE g.defaut = 1 OR g.user_id = :userId
            ORDER BY g.defaut DESC, g.name";
    $stmt = $db->prepare($sql);
    $stmt->execute([':id' => $categoryId, ':userId' => $userId]);
    $grades = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Convertir enabled en booléen
    foreach ($grades as &$grade) {
        $grade['enabled'] = (bool)$grade['enabled'];
        $grade['defaut'] = (bool)$grade['defaut'];
    }
    
    return $grades;
}

/**
 * Récupère les médias d'une catégorie
 */
function getCategoryMedia(PDO $db, int $categoryId, string $type): array
{
    $table = 'category_' . $type;
    $sql = "SELECT * FROM {$table} WHERE category_id = :id ORDER BY ordre, id";
    $stmt = $db->prepare($sql);
    $stmt->execute([':id' => $categoryId]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

/**
 * Crée une nouvelle catégorie
 */
function handleCreate(PDO $db, int $userId, bool $isAdmin, bool $isPremium): void
{
    // Seuls les premium et admins peuvent créer des catégories
    if (!$isPremium && !$isAdmin) {
        sendError(403, 'premium_required', 'La création de catégories est réservée aux utilisateurs Premium');
    }
    
    // Gérer les deux formats : JSON pur ou FormData avec fichier
    $data = getInputData();
    
    // Validation
    if (empty($data['name'])) {
        sendError(400, 'missing_field', 'Le nom de la catégorie est obligatoire');
    }
    
    $name = trim($data['name']);
    $description = trim($data['description'] ?? '');
    $notes = trim($data['notes'] ?? '');
    $visible = isset($data['visible']) ? (bool)$data['visible'] : false;
    $isDefault = $isAdmin && isset($data['is_default']) ? (bool)$data['is_default'] : false;
    
    // Gestion de l'icône
    $icon = handleIconUpload($data, $isDefault, $userId);
    
    // Récupérer les parents et grades
    // parent_ids = catégories parentes (cette catégorie sera fille de ces catégories)
    $parentIds = isset($data['parent_ids']) ? array_filter(array_map('intval', (array)$data['parent_ids'])) : [];
    $gradeIds = isset($data['grades']) ? array_filter(array_map('intval', (array)$data['grades'])) : [];
    
    // Vérifier que le nom n'existe pas déjà pour cet utilisateur
    try {
        $db->beginTransaction();
        
        $checkSql = "SELECT id FROM categories WHERE name = :name AND (user_id = :userId OR is_default = 1)";
        $stmt = $db->prepare($checkSql);
        $stmt->execute([':name' => $name, ':userId' => $userId]);
        
        if ($stmt->fetch()) {
            $db->rollBack();
            sendError(400, 'name_exists', 'Une catégorie avec ce nom existe déjà');
        }
        
        // Insertion avec icône temporaire si fichier en attente
        $iconForInsert = str_starts_with($icon, '__PENDING_UPLOAD__:') ? '📁' : $icon;
        
        // original_creator = l'utilisateur qui crée, ne changera jamais même si la catégorie change de propriétaire
        $sql = "INSERT INTO categories (name, description, Notes, user_id, original_creator, is_default, icon, visible, created_at)
                VALUES (:name, :description, :notes, :userId, :originalCreator, :isDefault, :icon, :visible, NOW())";
        
        $stmt = $db->prepare($sql);
        $stmt->execute([
            ':name' => $name,
            ':description' => $description,
            ':notes' => $notes,
            ':userId' => $isDefault ? null : $userId,
            ':originalCreator' => $userId,  // Toujours l'utilisateur qui crée
            ':isDefault' => $isDefault ? 1 : 0,
            ':icon' => $iconForInsert,
            ':visible' => $visible ? 1 : 0
        ]);
        
        $newId = $db->lastInsertId();
        
        // Si un fichier d'icône est en attente, le sauvegarder maintenant qu'on a l'ID
        if (str_starts_with($icon, '__PENDING_UPLOAD__:')) {
            $extension = substr($icon, strlen('__PENDING_UPLOAD__:'));
            $savedIconPath = saveIconFile($newId, $isDefault, $userId, $extension);
            
            // Mettre à jour l'icône dans la base
            $updateIconStmt = $db->prepare("UPDATE categories SET icon = :icon WHERE id = :id");
            $updateIconStmt->execute([':icon' => $savedIconPath, ':id' => $newId]);
        }
        
        // Ajouter les catégories parentes (la nouvelle catégorie est fille de ces catégories)
        if (!empty($parentIds)) {
            $insertParentSql = "INSERT INTO category_mothers (id_mere, id_fille, user_id, created_at) 
                                VALUES (:mere, :fille, :userId, NOW())";
            $insertParentStmt = $db->prepare($insertParentSql);
            
            foreach ($parentIds as $parentId) {
                // Vérifier que la catégorie parente existe et que l'utilisateur y a accès
                $checkParent = $db->prepare("SELECT id FROM categories WHERE id = :id AND (user_id = :userId OR is_default = 1)");
                $checkParent->execute([':id' => $parentId, ':userId' => $userId]);
                if ($checkParent->fetch()) {
                    // La nouvelle catégorie ($newId) est la FILLE, la catégorie sélectionnée ($parentId) est la MÈRE
                    $insertParentStmt->execute([
                        ':mere' => $parentId, 
                        ':fille' => $newId,
                        ':userId' => $userId
                    ]);
                }
            }
        }
        
        // Ajouter les grades
        if (!empty($gradeIds)) {
            $insertGradeSql = "INSERT INTO category_grades (category_id, grade_id, created_at) VALUES (:catId, :gradeId, NOW())";
            $insertGradeStmt = $db->prepare($insertGradeSql);
            
            foreach ($gradeIds as $gradeId) {
                // Vérifier que le grade existe
                $checkGrade = $db->prepare("SELECT id FROM grades WHERE id = :id");
                $checkGrade->execute([':id' => $gradeId]);
                if ($checkGrade->fetch()) {
                    $insertGradeStmt->execute([':catId' => $newId, ':gradeId' => $gradeId]);
                }
            }
        }
        
        $db->commit();
        
        loger('categories', 'INFO', 'Catégorie créée', [
            'id' => $newId, 
            'user' => $userId,
            'parents' => count($parentIds),
            'grades' => count($gradeIds)
        ]);
        
        // Récupérer la catégorie créée
        handleGetOne($db, $newId, $userId, $isAdmin, $isPremium);
        
    } catch (PDOException $e) {
        $db->rollBack();
        error_log("[Categories API] Erreur SQL create: " . $e->getMessage());
        sendError(500, 'database_error', 'Erreur lors de la création de la catégorie');
    }
}

/**
 * Met à jour une catégorie
 */
function handleUpdate(PDO $db, ?int $categoryId, int $userId, bool $isAdmin, bool $isPremium): void
{
    if (!$categoryId) {
        sendError(400, 'missing_id', 'ID de catégorie requis');
    }
    
    // Récupérer la catégorie
    $stmt = $db->prepare("SELECT * FROM categories WHERE id = :id");
    $stmt->execute([':id' => $categoryId]);
    $category = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$category) {
        sendError(404, 'not_found', 'Catégorie non trouvée');
    }
    
    // Vérifier les droits d'édition
    if (!canEditCategory($category, $userId, $isAdmin)) {
        sendError(403, 'forbidden', 'Vous n\'avez pas les droits pour modifier cette catégorie');
    }
    
    // Gérer les deux formats : JSON pur ou FormData avec fichier
    $data = getInputData();
    
    loger('categories', 'DEBUG', 'handleUpdate - données reçues', [
        'categoryId' => $categoryId,
        'data' => $data,
        'has_files' => !empty($_FILES),
        'files_keys' => array_keys($_FILES ?? []),
        'icon_file_info' => isset($_FILES['icon_file']) ? [
            'name' => $_FILES['icon_file']['name'] ?? 'N/A',
            'type' => $_FILES['icon_file']['type'] ?? 'N/A',
            'size' => $_FILES['icon_file']['size'] ?? 0,
            'error' => $_FILES['icon_file']['error'] ?? 'N/A'
        ] : 'pas de fichier'
    ]);
    
    // Construire la mise à jour
    $updates = [];
    $params = [':id' => $categoryId];
    
    if (isset($data['name']) && !empty(trim($data['name']))) {
        $newName = trim($data['name']);
        
        // Vérifier l'unicité du nom
        $checkSql = "SELECT id FROM categories WHERE name = :name AND id != :catId AND (user_id = :userId OR is_default = 1)";
        $checkStmt = $db->prepare($checkSql);
        $checkStmt->execute([':name' => $newName, ':catId' => $categoryId, ':userId' => $category['user_id'] ?? $userId]);
        
        if ($checkStmt->fetch()) {
            sendError(400, 'name_exists', 'Une catégorie avec ce nom existe déjà');
        }
        
        $updates[] = "name = :name";
        $params[':name'] = $newName;
    }
    
    if (isset($data['description'])) {
        $updates[] = "description = :description";
        $params[':description'] = trim($data['description']);
    }
    
    if (isset($data['notes'])) {
        $updates[] = "Notes = :notes";
        $params[':notes'] = trim($data['notes']);
    }
    
    // Gestion de l'icône (upload de fichier ou valeur existante)
    $pendingIconUpload = false;
    $iconExtension = '';
    
    loger('categories', 'DEBUG', 'Vérification icon_file', [
        'isset_FILES' => isset($_FILES['icon_file']),
        'error_code' => $_FILES['icon_file']['error'] ?? 'non défini',
        'UPLOAD_ERR_OK' => UPLOAD_ERR_OK
    ]);
    
    if (isset($_FILES['icon_file']) && $_FILES['icon_file']['error'] === UPLOAD_ERR_OK) {
        // Nouveau fichier uploadé
        $file = $_FILES['icon_file'];
        
        loger('categories', 'INFO', 'Fichier d\'icône détecté', [
            'name' => $file['name'],
            'type' => $file['type'],
            'size' => $file['size'],
            'tmp_name' => $file['tmp_name']
        ]);
        
        // Récupération de la config depuis la table upload_config (catégorie 'images')
        $uploadConfig = UploadConfig::getConfig('images');
        
        // Extensions autorisées avec mapping MIME
        $extensionToMime = [
            'png' => 'image/png',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'gif' => 'image/gif',
            'webp' => 'image/webp',
            'avif' => 'image/avif',
            'svg' => 'image/svg+xml'
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
            $allowedTypes = [
                'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 
                'image/webp', 'image/avif', 'image/svg+xml'
            ];
        }
        
        // Validation du type MIME
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($file['tmp_name']);
        
        loger('categories', 'DEBUG', 'Type MIME détecté', ['mimeType' => $mimeType]);
        
        if (!in_array($mimeType, $allowedTypes)) {
            sendError(400, 'invalid_file_type', 'Type de fichier non autorisé');
        }
        
        // Validation de la taille depuis config (fallback 6MB)
        $maxSize = $uploadConfig ? $uploadConfig['maxSize'] : 6 * 1024 * 1024;
        $maxSizeMb = round($maxSize / (1024 * 1024));
        
        if ($file['size'] > $maxSize) {
            sendError(400, 'file_too_large', "Fichier trop volumineux (max {$maxSizeMb} Mo)");
        }
        
        // Extension basée sur le type MIME
        $mimeToExtension = array_flip($extensionToMime);
        $mimeToExtension['image/jpeg'] = 'jpg'; // Préférer jpg à jpeg
        $extensions = [
            'image/png' => 'png',
            'image/jpeg' => 'jpg',
            'image/jpg' => 'jpg',
            'image/gif' => 'gif',
            'image/webp' => 'webp',
            'image/avif' => 'avif',
            'image/svg+xml' => 'svg'
        ];
        $iconExtension = $extensions[$mimeType] ?? 'png';
        $pendingIconUpload = true;
        
        loger('categories', 'INFO', 'Icon upload en attente', ['extension' => $iconExtension]);
    } elseif (isset($data['icon']) && $data['icon'] !== '__NEW_FILE__') {
        // Icône texte/emoji ou chemin existant
        // Note: On stocke la valeur mais on ne l'ajoute pas encore aux updates
        // car si is_default change, transferCategoryFiles mettra à jour le chemin
        $iconValue = trim($data['icon']);
        $hasIconTextUpdate = true;
        loger('categories', 'DEBUG', 'Icon texte/existant', ['icon' => $data['icon']]);
    } else {
        loger('categories', 'DEBUG', 'Pas d\'icône à traiter', [
            'data_icon' => $data['icon'] ?? 'non défini'
        ]);
    }

    if (isset($data['visible'])) {
        $updates[] = "visible = :visible";
        $params[':visible'] = $data['visible'] ? 1 : 0;
    }
    
    // Seul un admin peut changer is_default - avec transfert de fichiers
    $isDefaultChanged = false;
    $newIsDefault = null;
    if ($isAdmin && isset($data['is_default'])) {
        $newIsDefault = (bool)$data['is_default'];
        $currentIsDefault = (bool)$category['is_default'];
        
        if ($newIsDefault !== $currentIsDefault) {
            $isDefaultChanged = true;
            $updates[] = "is_default = :isDefault";
            $params[':isDefault'] = $newIsDefault ? 1 : 0;
            
            if ($newIsDefault) {
                // Passage en catégorie par défaut → retirer le user_id
                $updates[] = "user_id = NULL";
            } else {
                // Passage en catégorie privée → assigner à l'utilisateur actuel
                $updates[] = "user_id = :newUserId";
                $params[':newUserId'] = $userId;
            }
            
            loger('categories', 'INFO', 'Changement is_default détecté', [
                'category_id' => $categoryId,
                'from' => $currentIsDefault,
                'to' => $newIsDefault,
                'old_user_id' => $category['user_id'],
                'new_user_id' => $newIsDefault ? null : $userId
            ]);
        }
    }
    
    // Ajouter la mise à jour de l'icône texte SEULEMENT si is_default ne change pas
    // (sinon transferCategoryFiles s'occupe de mettre à jour le chemin de l'icône)
    if (isset($hasIconTextUpdate) && $hasIconTextUpdate && !$isDefaultChanged) {
        $updates[] = "icon = :icon";
        $params[':icon'] = $iconValue;
        loger('categories', 'DEBUG', 'Icon ajoutée aux updates', ['icon' => $iconValue]);
    } elseif (isset($hasIconTextUpdate) && $hasIconTextUpdate && $isDefaultChanged) {
        loger('categories', 'DEBUG', 'Icon NON ajoutée aux updates (is_default change, transferCategoryFiles s\'en occupe)');
    }
    
    // Vérifier s'il y a des données relationnelles à mettre à jour
    $hasRelationalUpdates = isset($data['parent_ids']) || isset($data['grade_ids']);
    
    if (empty($updates) && !$hasRelationalUpdates) {
        sendError(400, 'no_changes', 'Aucune modification fournie');
    }
    
    try {
        $db->beginTransaction();
        
        // Si is_default change, transférer les fichiers AVANT la mise à jour SQL
        // Pour le transfert, utiliser le bon user_id selon la direction
        if ($isDefaultChanged) {
            // Si toDefault=true, on utilise l'ancien user_id (source)
            // Si toDefault=false, on utilise l'utilisateur actuel (destination)
            $transferUserId = $newIsDefault ? $category['user_id'] : $userId;
            
            $transferResult = transferCategoryFiles(
                $db, 
                $categoryId, 
                $transferUserId, 
                $newIsDefault  // true = vers default, false = vers user
            );
            
            if (!$transferResult['success'] && !empty($transferResult['errors'])) {
                // Log les erreurs mais continue (fichiers manquants ne bloquent pas)
                loger('categories', 'WARNING', 'Erreurs lors du transfert de fichiers', [
                    'errors' => $transferResult['errors']
                ]);
            }
        }
        
        // Mise à jour des champs de base
        if (!empty($updates)) {
            $sql = "UPDATE categories SET " . implode(", ", $updates) . " WHERE id = :id";
            $stmt = $db->prepare($sql);
            $stmt->execute($params);
        }
        
        // Mise à jour des catégories parentes (cette catégorie comme fille)
        if (isset($data['parent_ids'])) {
            $parentIds = array_filter(array_map('intval', (array)$data['parent_ids']));
            
            // Vérifier qu'on ne crée pas de boucle (une catégorie ne peut pas être son propre parent)
            if (in_array($categoryId, $parentIds)) {
                $db->rollBack();
                sendError(400, 'invalid_relation', 'Une catégorie ne peut pas être son propre parent');
            }
            
            // Supprimer les liens utilisateur existants pour cette catégorie
            $db->prepare("DELETE FROM category_mothers WHERE id_fille = :id AND user_id = :userId")
               ->execute([':id' => $categoryId, ':userId' => $userId]);
            
            // Ajouter les nouvelles relations
            if (!empty($parentIds)) {
                $insertSql = "INSERT INTO category_mothers (id_mere, id_fille, user_id, created_at) 
                              VALUES (:mere, :fille, :userId, NOW())
                              ON DUPLICATE KEY UPDATE created_at = NOW()";
                $insertStmt = $db->prepare($insertSql);
                
                foreach ($parentIds as $parentId) {
                    // Vérifier que la catégorie parente existe et est accessible
                    $checkStmt = $db->prepare("SELECT id FROM categories WHERE id = :id AND (user_id = :checkUserId OR is_default = 1)");
                    $checkStmt->execute([':id' => $parentId, ':checkUserId' => $userId]);
                    if ($checkStmt->fetch()) {
                        // La catégorie actuelle ($categoryId) est FILLE, la catégorie sélectionnée ($parentId) est MÈRE
                        $insertStmt->execute([
                            ':mere' => $parentId, 
                            ':fille' => $categoryId,
                            ':userId' => $userId
                        ]);
                    }
                }
            }
        }
        
        // Mise à jour des grades
        if (isset($data['grades'])) {
            $gradeIds = array_filter(array_map('intval', (array)$data['grades']));
            
            // Supprimer les anciennes associations
            $db->prepare("DELETE FROM category_grades WHERE category_id = :id")->execute([':id' => $categoryId]);
            
            // Ajouter les nouvelles associations
            if (!empty($gradeIds)) {
                $insertSql = "INSERT INTO category_grades (category_id, grade_id, created_at) VALUES (:catId, :gradeId, NOW())";
                $insertStmt = $db->prepare($insertSql);
                
                foreach ($gradeIds as $gradeId) {
                    // Vérifier que le grade existe
                    $checkStmt = $db->prepare("SELECT id FROM grades WHERE id = :id");
                    $checkStmt->execute([':id' => $gradeId]);
                    if ($checkStmt->fetch()) {
                        $insertStmt->execute([':catId' => $categoryId, ':gradeId' => $gradeId]);
                    }
                }
            }
        }
        
        // Mise à jour des liens par défaut (admin uniquement sur catégorie par défaut)
        if ($isAdmin && (bool)$category['is_default'] && isset($data['default_parent_ids'])) {
            $defaultParentIds = array_filter(array_map('intval', (array)$data['default_parent_ids']));
            
            // Vérifier qu'on ne crée pas de boucle
            if (in_array($categoryId, $defaultParentIds)) {
                $db->rollBack();
                sendError(400, 'invalid_relation', 'Une catégorie ne peut pas être son propre parent');
            }
            
            // Supprimer les anciens liens par défaut
            $db->prepare("DELETE FROM category_mothers_default WHERE id_fille = :id")
               ->execute([':id' => $categoryId]);
            
            // Ajouter les nouveaux liens par défaut
            if (!empty($defaultParentIds)) {
                $insertDefaultSql = "INSERT INTO category_mothers_default (id_fille, id_mere, created_at) 
                                     VALUES (:fille, :mere, NOW())";
                $insertDefaultStmt = $db->prepare($insertDefaultSql);
                
                foreach ($defaultParentIds as $parentId) {
                    // Vérifier que la catégorie parente existe
                    $checkStmt = $db->prepare("SELECT id FROM categories WHERE id = :id");
                    $checkStmt->execute([':id' => $parentId]);
                    if ($checkStmt->fetch()) {
                        $insertDefaultStmt->execute([':fille' => $categoryId, ':mere' => $parentId]);
                    }
                }
            }
            
            loger('categories', 'INFO', 'Liens par défaut mis à jour', [
                'category_id' => $categoryId,
                'default_parent_ids' => $defaultParentIds
            ]);
        }
        
        // Si un fichier d'icône a été uploadé, le sauvegarder
        if ($pendingIconUpload) {
            // Déterminer si c'est une catégorie par défaut (peut avoir changé)
            $finalIsDefault = $isDefaultChanged ? $newIsDefault : (bool)$category['is_default'];
            $finalUserId = $finalIsDefault ? $userId : ($category['user_id'] ?? $userId);
            
            $savedIconPath = saveIconFile($categoryId, $finalIsDefault, $finalUserId, $iconExtension);
            
            // Mettre à jour l'icône dans la base
            $updateIconStmt = $db->prepare("UPDATE categories SET icon = :icon WHERE id = :id");
            $updateIconStmt->execute([':icon' => $savedIconPath, ':id' => $categoryId]);
        }
        
        $db->commit();
        
        loger('categories', 'INFO', 'Catégorie mise à jour', [
            'id' => $categoryId, 
            'user' => $userId,
            'fields_updated' => count($updates),
            'parents_updated' => isset($data['parent_ids']),
            'grades_updated' => isset($data['grades'])
        ]);
        
        // Retourner la catégorie mise à jour
        handleGetOne($db, $categoryId, $userId, $isAdmin, $isPremium);
        
    } catch (PDOException $e) {
        $db->rollBack();
        error_log("[Categories API] Erreur SQL update: " . $e->getMessage());
        sendError(500, 'database_error', 'Erreur lors de la mise à jour de la catégorie');
    }
}

/**
 * Supprime une catégorie
 */
function handleDelete(PDO $db, ?int $categoryId, int $userId, bool $isAdmin): void
{
    if (!$categoryId) {
        sendError(400, 'missing_id', 'ID de catégorie requis');
    }
    
    // Récupérer la catégorie
    $stmt = $db->prepare("SELECT * FROM categories WHERE id = :id");
    $stmt->execute([':id' => $categoryId]);
    $category = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$category) {
        sendError(404, 'not_found', 'Catégorie non trouvée');
    }
    
    // Vérifier les droits de suppression
    if (!canDeleteCategory($category, $userId, $isAdmin)) {
        sendError(403, 'forbidden', 'Vous n\'avez pas les droits pour supprimer cette catégorie');
    }
    
    try {
        // Déterminer le chemin du dossier de la catégorie
        $isDefault = !empty($category['is_default']);
        if ($isDefault) {
            // Catégorie par défaut : /storage/default_categories/{id}/
            $categoryDir = __DIR__ . '/../../storage/default_categories/' . $categoryId;
        } else {
            // Catégorie utilisateur : /storage/users/{user_id}/Categories/{id}/
            $catUserId = $category['user_id'] ?? $userId;
            $categoryDir = __DIR__ . '/../../storage/users/' . $catUserId . '/Categories/' . $categoryId;
        }
        
        // Supprimer le dossier et son contenu
        $realDir = realpath($categoryDir);
        if ($realDir && is_dir($realDir) && strpos($realDir, DIRECTORY_SEPARATOR . 'storage' . DIRECTORY_SEPARATOR) !== false) {
            deleteDirectoryRecursive($realDir);
            error_log("[Categories API] Directory deleted: " . $realDir);
        }
        
        // Supprimer d'abord les liens avec les objets
        $db->prepare("DELETE FROM item_categories WHERE category_id = :id")->execute([':id' => $categoryId]);
        
        // Supprimer les médias associés
        $db->prepare("DELETE FROM category_img WHERE category_id = :id")->execute([':id' => $categoryId]);
        $db->prepare("DELETE FROM category_audio WHERE category_id = :id")->execute([':id' => $categoryId]);
        $db->prepare("DELETE FROM category_videos WHERE category_id = :id")->execute([':id' => $categoryId]);
        $db->prepare("DELETE FROM category_doc WHERE category_id = :id")->execute([':id' => $categoryId]);
        
        // Supprimer les relations parent/enfant
        $db->prepare("DELETE FROM category_mothers WHERE id_fille = :id OR id_mere = :id")->execute([':id' => $categoryId]);
        
        // Supprimer les conditions
        $db->prepare("DELETE FROM category_grades WHERE category_id = :id")->execute([':id' => $categoryId]);
        
        // Supprimer la catégorie
        $db->prepare("DELETE FROM categories WHERE id = :id")->execute([':id' => $categoryId]);
        
        sendSuccess(['message' => 'Catégorie supprimée avec succès', 'deleted_id' => $categoryId]);
        
    } catch (PDOException $e) {
        error_log("[Categories API] Erreur SQL delete: " . $e->getMessage());
        sendError(500, 'database_error', 'Erreur lors de la suppression de la catégorie');
    }
}

/**
 * Supprime récursivement un dossier et son contenu
 */
function deleteDirectoryRecursive(string $dir): bool
{
    if (!is_dir($dir)) {
        return false;
    }
    
    $items = scandir($dir);
    foreach ($items as $item) {
        if ($item === '.' || $item === '..') {
            continue;
        }
        
        $path = $dir . DIRECTORY_SEPARATOR . $item;
        if (is_dir($path)) {
            deleteDirectoryRecursive($path);
        } else {
            @unlink($path);
        }
    }
    
    // Supprimer le dossier lui-même
    if (!@rmdir($dir)) {
        // Vérifier s'il reste des fichiers cachés
        $remaining = glob($dir . DIRECTORY_SEPARATOR . '.*');
        if ($remaining) {
            foreach ($remaining as $hidden) {
                $basename = basename($hidden);
                if ($basename !== '.' && $basename !== '..') {
                    @unlink($hidden);
                }
            }
        }
        return @rmdir($dir);
    }
    
    return true;
}

/**
 * Recherche de catégories pour l'auto-complétion
 */
function handleSearchCategories(PDO $db, int $userId, bool $isAdmin, bool $isPremium): void
{
    $query = trim($_GET['q'] ?? '');
    $excludeId = isset($_GET['exclude']) ? (int)$_GET['exclude'] : null;
    
    if (strlen($query) < 1) {
        sendSuccess(['categories' => []]);
    }
    
    $sql = "SELECT c.id, c.name, c.icon, c.is_default, c.user_id
            FROM categories c
            WHERE c.name LIKE :query";
    
    $params = [':query' => '%' . $query . '%'];
    
    // Filtrer selon les droits
    if (!$isAdmin) {
        if ($isPremium) {
            $sql .= " AND (c.is_default = 1 OR c.visible = 1 OR c.user_id = :userId)";
            $params[':userId'] = $userId;
        } else {
            $sql .= " AND c.is_default = 1";
        }
    }
    
    // Exclure une catégorie (pour éviter les boucles)
    if ($excludeId) {
        $sql .= " AND c.id != :excludeId";
        $params[':excludeId'] = $excludeId;
    }
    
    $sql .= " ORDER BY c.is_default DESC, c.name ASC LIMIT 20";
    
    try {
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($categories as &$cat) {
            $cat['is_default'] = (bool)$cat['is_default'];
        }
        
        sendSuccess(['categories' => $categories]);
    } catch (PDOException $e) {
        loger('categories', 'ERROR', 'Erreur recherche', ['error' => $e->getMessage()]);
        sendError(500, 'database_error', 'Erreur lors de la recherche');
    }
}

/**
 * Récupère tous les grades disponibles
 */
function handleGetGrades(PDO $db, int $userId, bool $isAdmin): void
{
    try {
        $sql = "SELECT id, name, description, defaut 
                FROM grades 
                WHERE defaut = 1 OR user_id IS NULL";
        
        if (!$isAdmin) {
            $sql .= " OR user_id = :userId";
        }
        
        $sql .= " ORDER BY defaut DESC, name ASC";
        
        $stmt = $db->prepare($sql);
        $params = [];
        if (!$isAdmin) {
            $params[':userId'] = $userId;
        }
        $stmt->execute($params);
        
        $grades = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($grades as &$grade) {
            $grade['defaut'] = (bool)$grade['defaut'];
        }
        
        sendSuccess(['grades' => $grades]);
    } catch (PDOException $e) {
        loger('categories', 'ERROR', 'Erreur grades', ['error' => $e->getMessage()]);
        sendError(500, 'database_error', 'Erreur lors de la récupération des grades');
    }
}

/**
 * Copie une catégorie
 */
function handleCopy(PDO $db, int $categoryId, int $userId, bool $isAdmin, bool $isPremium): void
{
    if (!$isPremium && !$isAdmin) {
        sendError(403, 'premium_required', 'La copie de catégories est réservée aux utilisateurs Premium');
    }
    
    try {
        // Récupérer la catégorie source
        $stmt = $db->prepare("SELECT * FROM categories WHERE id = :id");
        $stmt->execute([':id' => $categoryId]);
        $source = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$source) {
            sendError(404, 'not_found', 'Catégorie source non trouvée');
        }
        
        // Vérifier l'accès
        if (!canAccessCategory($source, $userId, $isAdmin, $isPremium)) {
            sendError(403, 'forbidden', 'Accès non autorisé à cette catégorie');
        }
        
        // Générer un nouveau nom unique
        $baseName = $source['name'] . ' (copie)';
        $newName = $baseName;
        $counter = 1;
        
        while (true) {
            $check = $db->prepare("SELECT id FROM categories WHERE name = :name AND user_id = :userId");
            $check->execute([':name' => $newName, ':userId' => $userId]);
            if (!$check->fetch()) break;
            $counter++;
            $newName = $baseName . ' ' . $counter;
        }
        
        // Créer la copie
        $sql = "INSERT INTO categories (name, description, Notes, user_id, is_default, icon, visible, created_at)
                VALUES (:name, :description, :notes, :userId, 0, :icon, :visible, NOW())";
        
        $stmt = $db->prepare($sql);
        $stmt->execute([
            ':name' => $newName,
            ':description' => $source['description'],
            ':notes' => $source['Notes'],
            ':userId' => $userId,
            ':icon' => $source['icon'],
            ':visible' => 0  // Par défaut privée
        ]);
        
        $newId = $db->lastInsertId();
        
        // Copier les conditions
        $condSql = "INSERT INTO category_grades (category_id, grade_id, created_at)
                    SELECT :newId, grade_id, NOW() FROM category_grades WHERE category_id = :sourceId";
        $db->prepare($condSql)->execute([':newId' => $newId, ':sourceId' => $categoryId]);
        
        // Copier les catégories parentes (la nouvelle catégorie hérite des mêmes parents)
        // Les liens copiés sont personnels (user_id = utilisateur)
        $parentSql = "INSERT INTO category_mothers (id_mere, id_fille, user_id, created_at)
                      SELECT id_mere, :newId, :userId, NOW() FROM category_mothers 
                      WHERE id_fille = :sourceId AND user_id = :userId2";
        $db->prepare($parentSql)->execute([
            ':newId' => $newId, 
            ':sourceId' => $categoryId, 
            ':userId' => $userId,
            ':userId2' => $userId
        ]);
        
        loger('categories', 'INFO', 'Catégorie copiée', ['source' => $categoryId, 'new' => $newId, 'user' => $userId]);
        
        // Retourner la nouvelle catégorie
        handleGetOne($db, $newId, $userId, $isAdmin, $isPremium);
        
    } catch (PDOException $e) {
        loger('categories', 'ERROR', 'Erreur copie', ['error' => $e->getMessage()]);
        sendError(500, 'database_error', 'Erreur lors de la copie de la catégorie');
    }
}

/**
 * Met à jour les catégories parentes d'une catégorie
 * La catégorie actuelle devient fille des catégories parentes sélectionnées
 */
function handleUpdateParents(PDO $db, int $categoryId, int $userId, bool $isAdmin, bool $isPremium): void
{
    // Récupérer la catégorie
    $stmt = $db->prepare("SELECT * FROM categories WHERE id = :id");
    $stmt->execute([':id' => $categoryId]);
    $category = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$category) {
        sendError(404, 'not_found', 'Catégorie non trouvée');
    }
    
    if (!canEditCategory($category, $userId, $isAdmin)) {
        sendError(403, 'forbidden', 'Vous n\'avez pas les droits pour modifier cette catégorie');
    }
    
    $data = getJsonInput();
    $parentIds = $data['parents'] ?? [];
    
    // Valider que ce sont des entiers
    $parentIds = array_filter(array_map('intval', $parentIds));
    
    // Vérifier qu'on ne crée pas de boucle (une catégorie ne peut pas être son propre parent)
    if (in_array($categoryId, $parentIds)) {
        sendError(400, 'invalid_relation', 'Une catégorie ne peut pas être son propre parent');
    }
    
    try {
        $db->beginTransaction();
        
        // Supprimer les liens utilisateur existants pour cette catégorie
        $db->prepare("DELETE FROM category_mothers WHERE id_fille = :id AND user_id = :userId")
           ->execute([':id' => $categoryId, ':userId' => $userId]);
        
        // Ajouter les nouvelles relations
        if (!empty($parentIds)) {
            $insertSql = "INSERT INTO category_mothers (id_mere, id_fille, user_id, created_at) 
                          VALUES (:mere, :fille, :userId, NOW())
                          ON DUPLICATE KEY UPDATE created_at = NOW()";
            $insertStmt = $db->prepare($insertSql);
            
            foreach ($parentIds as $parentId) {
                // Vérifier que la catégorie parente existe et est accessible
                $checkStmt = $db->prepare("SELECT id FROM categories WHERE id = :id AND (user_id = :checkUserId OR is_default = 1)");
                $checkStmt->execute([':id' => $parentId, ':checkUserId' => $userId]);
                if ($checkStmt->fetch()) {
                    // La catégorie actuelle ($categoryId) est FILLE, la catégorie sélectionnée ($parentId) est MÈRE
                    $insertStmt->execute([
                        ':mere' => $parentId, 
                        ':fille' => $categoryId,
                        ':userId' => $userId
                    ]);
                }
            }
        }
        
        $db->commit();
        
        loger('categories', 'INFO', 'Catégories parentes mises à jour', [
            'category' => $categoryId, 
            'parents' => $parentIds
        ]);
        
        // Retourner la catégorie mise à jour
        handleGetOne($db, $categoryId, $userId, $isAdmin, $isPremium);
        
    } catch (PDOException $e) {
        $db->rollBack();
        loger('categories', 'ERROR', 'Erreur mise à jour parents', ['error' => $e->getMessage()]);
        sendError(500, 'database_error', 'Erreur lors de la mise à jour des catégories parentes');
    }
}

/**
 * Met à jour les grades d'une catégorie
 */
function handleUpdateGrades(PDO $db, int $categoryId, int $userId, bool $isAdmin, bool $isPremium): void
{
    // Récupérer la catégorie
    $stmt = $db->prepare("SELECT * FROM categories WHERE id = :id");
    $stmt->execute([':id' => $categoryId]);
    $category = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$category) {
        sendError(404, 'not_found', 'Catégorie non trouvée');
    }
    
    if (!canEditCategory($category, $userId, $isAdmin)) {
        sendError(403, 'forbidden', 'Vous n\'avez pas les droits pour modifier cette catégorie');
    }
    
    $data = getJsonInput();
    $gradeIds = $data['grades'] ?? [];
    
    // Valider que ce sont des entiers
    $gradeIds = array_filter(array_map('intval', $gradeIds));
    
    try {
        $db->beginTransaction();
        
        // Supprimer les anciennes associations
        $db->prepare("DELETE FROM category_grades WHERE category_id = :id")->execute([':id' => $categoryId]);
        
        // Ajouter les nouvelles associations
        if (!empty($gradeIds)) {
            $insertSql = "INSERT INTO category_grades (category_id, grade_id, created_at) VALUES (:catId, :gradeId, NOW())";
            $insertStmt = $db->prepare($insertSql);
            
            foreach ($gradeIds as $gradeId) {
                // Vérifier que le grade existe
                $checkStmt = $db->prepare("SELECT id FROM grades WHERE id = :id");
                $checkStmt->execute([':id' => $gradeId]);
                if ($checkStmt->fetch()) {
                    $insertStmt->execute([':catId' => $categoryId, ':gradeId' => $gradeId]);
                }
            }
        }
        
        $db->commit();
        
        loger('categories', 'INFO', 'Grades mis à jour', [
            'category' => $categoryId, 
            'grades' => $gradeIds
        ]);
        
        // Retourner la catégorie mise à jour
        handleGetOne($db, $categoryId, $userId, $isAdmin, $isPremium);
        
    } catch (PDOException $e) {
        $db->rollBack();
        loger('categories', 'ERROR', 'Erreur mise à jour grades', ['error' => $e->getMessage()]);
        sendError(500, 'database_error', 'Erreur lors de la mise à jour des grades');
    }
}

/**
 * Vérifie si l'utilisateur peut accéder à une catégorie
 */
function canAccessCategory(array $category, int $userId, bool $isAdmin, bool $isPremium): bool
{
    // Admin : accès total
    if ($isAdmin) return true;
    
    // Catégorie par défaut : accessible à tous
    if ($category['is_default']) return true;
    
    // Propriétaire de la catégorie
    if ($category['user_id'] == $userId) return true;
    
    // Premium : accès aux catégories publiques
    if ($isPremium && $category['visible']) return true;
    
    return false;
}

/**
 * Vérifie si l'utilisateur peut éditer une catégorie
 */
function canEditCategory(array $category, int $userId, bool $isAdmin): bool
{
    // Admin : peut tout éditer
    if ($isAdmin) return true;
    
    // Catégorie par défaut : non éditable (sauf admin)
    if ($category['is_default']) return false;
    
    // Propriétaire de la catégorie
    if ($category['user_id'] == $userId) return true;
    
    return false;
}

/**
 * Vérifie si l'utilisateur peut supprimer une catégorie
 */
function canDeleteCategory(array $category, int $userId, bool $isAdmin): bool
{
    // Admin : peut tout supprimer
    if ($isAdmin) return true;
    
    // Catégorie par défaut : non supprimable (sauf admin)
    if ($category['is_default']) return false;
    
    // Propriétaire de la catégorie
    if ($category['user_id'] == $userId) return true;
    
    return false;
}

/**
 * Récupère les données JSON de la requête
 */
function getJsonInput(): array
{
    $json = file_get_contents('php://input');
    $data = json_decode($json, true);
    return is_array($data) ? $data : [];
}

/**
 * Récupère les données d'entrée (JSON ou FormData avec fichier)
 * Gère aussi le header X-HTTP-Method-Override pour les PUT avec FormData
 */
function getInputData(): array
{
    // Vérifier si c'est un upload avec FormData
    if (isset($_POST['data'])) {
        // FormData avec JSON dans le champ 'data'
        $data = json_decode($_POST['data'], true);
        return is_array($data) ? $data : [];
    }
    
    // Sinon, c'est du JSON pur
    return getJsonInput();
}

/**
 * Gère l'upload d'une icône pour une catégorie
 * 
 * @param array $data Données de la catégorie
 * @param bool $isDefault Est-ce une catégorie par défaut ?
 * @param int $userId ID de l'utilisateur
 * @param int|null $categoryId ID de la catégorie (pour update)
 * @return string Chemin de l'icône ou emoji par défaut
 */
function handleIconUpload(array $data, bool $isDefault, int $userId, ?int $categoryId = null): string
{
    // Vérifier si un fichier a été uploadé
    if (isset($_FILES['icon_file']) && $_FILES['icon_file']['error'] === UPLOAD_ERR_OK) {
        $file = $_FILES['icon_file'];
        
        // Récupération de la config depuis la table upload_config (catégorie 'images')
        $uploadConfig = UploadConfig::getConfig('images');
        
        // Extensions autorisées avec mapping MIME
        $extensionToMime = [
            'png' => 'image/png',
            'jpg' => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'gif' => 'image/gif',
            'webp' => 'image/webp',
            'avif' => 'image/avif',
            'svg' => 'image/svg+xml'
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
            $allowedTypes = [
                'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 
                'image/webp', 'image/avif', 'image/svg+xml'
            ];
        }
        
        // Validation du type MIME
        $finfo = new finfo(FILEINFO_MIME_TYPE);
        $mimeType = $finfo->file($file['tmp_name']);
        
        if (!in_array($mimeType, $allowedTypes)) {
            sendError(400, 'invalid_file_type', 'Type de fichier non autorisé. Utilisez PNG, JPG, GIF, WebP, AVIF ou SVG.');
        }
        
        // Validation de la taille depuis config (fallback 6MB)
        $maxSize = $uploadConfig ? $uploadConfig['maxSize'] : 6 * 1024 * 1024;
        $maxSizeMb = round($maxSize / (1024 * 1024));
        
        if ($file['size'] > $maxSize) {
            sendError(400, 'file_too_large', "Fichier trop volumineux (max {$maxSizeMb} Mo)");
        }
        
        // Extension basée sur le type MIME
        $mimeToExtension = array_flip($extensionToMime);
        $mimeToExtension['image/jpeg'] = 'jpg'; // Préférer jpg à jpeg
        $extension = $mimeToExtension[$mimeType] ?? 'png';
        
        // Le chemin sera défini après création de la catégorie (on a besoin de l'ID)
        // On retourne un marqueur spécial qui sera traité après l'insertion
        return '__PENDING_UPLOAD__:' . $extension;
    }
    
    // Pas de nouveau fichier, vérifier si on garde l'existant
    $icon = trim($data['icon'] ?? '');
    
    if ($icon === '__NEW_FILE__' || $icon === '') {
        // Pas d'icône spécifiée ou marqueur invalide, utiliser l'emoji par défaut
        return '📁';
    }
    
    // Garder l'icône existante (chemin storage ou emoji)
    return $icon;
}

/**
 * Sauvegarde le fichier d'icône uploadé pour une catégorie
 * 
 * @param int $categoryId ID de la catégorie
 * @param bool $isDefault Est-ce une catégorie par défaut ?
 * @param int $userId ID de l'utilisateur
 * @param string $extension Extension du fichier
 * @return string Chemin relatif de l'icône sauvegardée
 */
function saveIconFile(int $categoryId, bool $isDefault, int $userId, string $extension): string
{
    // Utiliser un chemin relatif à partir du fichier actuel (fonctionne dans le container)
    $basePath = realpath(__DIR__ . '/../../storage');
    
    if (!$basePath) {
        loger('categories', 'ERROR', 'Chemin storage non trouvé', [
            'dir' => __DIR__,
            'attempted' => __DIR__ . '/../../storage'
        ]);
        return '📁';
    }
    
    loger('categories', 'DEBUG', 'saveIconFile appelée', [
        'categoryId' => $categoryId,
        'isDefault' => $isDefault,
        'userId' => $userId,
        'extension' => $extension,
        'basePath' => $basePath
    ]);
    
    // Déterminer le dossier de destination
    if ($isDefault) {
        $destDir = "{$basePath}/default_categories/{$categoryId}";
        $relativePath = "storage/default_categories/{$categoryId}/icon.{$extension}";
    } else {
        // Note : Categories avec majuscule comme dans la structure documentée
        $destDir = "{$basePath}/users/{$userId}/Categories/{$categoryId}";
        $relativePath = "storage/users/{$userId}/Categories/{$categoryId}/icon.{$extension}";
    }
    
    loger('categories', 'DEBUG', 'Chemins de destination', [
        'destDir' => $destDir,
        'relativePath' => $relativePath
    ]);
    
    // Créer le dossier si nécessaire
    if (!is_dir($destDir)) {
        $mkdirResult = mkdir($destDir, 0755, true);
        loger('categories', 'DEBUG', 'Création dossier', [
            'path' => $destDir,
            'success' => $mkdirResult
        ]);
    }
    
    // Supprimer l'ancienne icône si elle existe
    $existingIcons = glob("{$destDir}/icon.*");
    foreach ($existingIcons as $oldIcon) {
        unlink($oldIcon);
        loger('categories', 'DEBUG', 'Ancienne icône supprimée', ['path' => $oldIcon]);
    }
    
    // Déplacer le fichier uploadé
    $destPath = "{$destDir}/icon.{$extension}";
    $tmpName = $_FILES['icon_file']['tmp_name'] ?? '';
    
    loger('categories', 'DEBUG', 'Tentative de déplacement fichier', [
        'tmp_name' => $tmpName,
        'destPath' => $destPath,
        'file_exists' => file_exists($tmpName)
    ]);
    
    if (!$tmpName || !move_uploaded_file($tmpName, $destPath)) {
        loger('categories', 'ERROR', 'Échec move_uploaded_file', [
            'tmp_name' => $tmpName,
            'destPath' => $destPath,
            'error' => error_get_last()
        ]);
        return '📁'; // Fallback sur emoji
    }
    
    loger('categories', 'INFO', 'Icône sauvegardée avec succès', [
        'path' => $relativePath
    ]);
    
    return $relativePath;
}

/**
 * Transfère les fichiers médias d'une catégorie lors du changement de is_default
 * 
 * @param PDO $db Connexion à la base de données
 * @param int $categoryId ID de la catégorie
 * @param int|null $userId ID du propriétaire (null si catégorie par défaut)
 * @param bool $toDefault true = vers default_categories, false = vers user storage
 * @return array Résultat du transfert avec succès et erreurs
 */
function transferCategoryFiles(PDO $db, int $categoryId, ?int $userId, bool $toDefault): array
{
    // Utiliser un chemin relatif à partir du fichier actuel (fonctionne dans le container)
    $basePath = realpath(__DIR__ . '/../../storage');
    $result = ['success' => true, 'transferred' => 0, 'errors' => []];
    
    if (!$basePath) {
        $result['errors'][] = 'Chemin storage non trouvé';
        $result['success'] = false;
        return $result;
    }
    
    // Définir les chemins source et destination
    if ($toDefault) {
        // User storage → default_categories
        if (!$userId) {
            $result['errors'][] = 'Impossible de transférer : pas de user_id source';
            $result['success'] = false;
            return $result;
        }
        $sourcePath = "{$basePath}/users/{$userId}/Categories/{$categoryId}";
        $destPath = "{$basePath}/default_categories/{$categoryId}";
        $oldUrlPrefix = "storage/users/{$userId}/Categories/{$categoryId}";
        $newUrlPrefix = "storage/default_categories/{$categoryId}";
    } else {
        // default_categories → User storage
        if (!$userId) {
            $result['errors'][] = 'Impossible de transférer : pas de user_id destination';
            $result['success'] = false;
            return $result;
        }
        $sourcePath = "{$basePath}/default_categories/{$categoryId}";
        $destPath = "{$basePath}/users/{$userId}/Categories/{$categoryId}";
        $oldUrlPrefix = "storage/default_categories/{$categoryId}";
        $newUrlPrefix = "storage/users/{$userId}/Categories/{$categoryId}";
    }
    
    loger('categories', 'INFO', 'Transfert de fichiers catégorie', [
        'category_id' => $categoryId,
        'to_default' => $toDefault,
        'source' => $sourcePath,
        'dest' => $destPath
    ]);
    
    // Vérifier si le dossier source existe
    if (!is_dir($sourcePath)) {
        loger('categories', 'DEBUG', 'Pas de dossier source à transférer', ['path' => $sourcePath]);
        // Pas d'erreur, juste rien à transférer
        return $result;
    }
    
    // Créer le dossier destination principal
    if (!is_dir($destPath)) {
        if (!mkdir($destPath, 0755, true)) {
            $result['errors'][] = "Impossible de créer le dossier destination";
            $result['success'] = false;
            loger('categories', 'ERROR', 'Échec création dossier destination', ['path' => $destPath]);
            return $result;
        }
    }
    
    // Créer les sous-dossiers
    $subDirs = ['images', 'audio', 'videos', 'documents'];
    foreach ($subDirs as $subDir) {
        $subPath = "{$destPath}/{$subDir}";
        if (!is_dir($subPath)) {
            if (!mkdir($subPath, 0755, true)) {
                $result['errors'][] = "Impossible de créer le dossier {$subDir}";
                loger('categories', 'ERROR', 'Échec création dossier', ['path' => $subPath]);
            }
        }
    }
    
    // ============================================================
    // 1. Transférer le fichier icon.png à la racine du dossier
    // ============================================================
    $iconFile = "{$sourcePath}/icon.png";
    if (file_exists($iconFile)) {
        $destIconFile = "{$destPath}/icon.png";
        if (rename($iconFile, $destIconFile)) {
            $result['transferred']++;
            $result['icon_transferred'] = true;
            loger('categories', 'INFO', 'Icône transférée', [
                'from' => $iconFile,
                'to' => $destIconFile
            ]);
            
            // Mettre à jour la colonne icon dans la table categories
            $newIconUrl = "{$newUrlPrefix}/icon.png";
            try {
                $updateIconStmt = $db->prepare("UPDATE categories SET icon = :icon WHERE id = :id");
                $updateIconStmt->execute([':icon' => $newIconUrl, ':id' => $categoryId]);
                loger('categories', 'INFO', 'URL icône mise à jour en BDD', [
                    'category_id' => $categoryId,
                    'old_prefix' => $oldUrlPrefix,
                    'new_url' => $newIconUrl
                ]);
            } catch (PDOException $e) {
                $result['errors'][] = "Erreur mise à jour icon en BDD: " . $e->getMessage();
                loger('categories', 'ERROR', 'Erreur SQL mise à jour icon', ['error' => $e->getMessage()]);
            }
        } else {
            $result['errors'][] = "Échec transfert icon.png";
            loger('categories', 'ERROR', 'Échec transfert icône', [
                'from' => $iconFile,
                'to' => $destIconFile
            ]);
        }
    } else {
        loger('categories', 'DEBUG', 'Pas de fichier icon.png à transférer', ['path' => $iconFile]);
    }
    
    // ============================================================
    // 2. Parcourir et déplacer les fichiers des sous-dossiers
    // ============================================================
    foreach ($subDirs as $subDir) {
        $sourceSubDir = "{$sourcePath}/{$subDir}";
        $destSubDir = "{$destPath}/{$subDir}";
        
        if (!is_dir($sourceSubDir)) continue;
        
        $files = scandir($sourceSubDir);
        foreach ($files as $file) {
            if ($file === '.' || $file === '..') continue;
            
            $sourceFile = "{$sourceSubDir}/{$file}";
            $destFile = "{$destSubDir}/{$file}";
            
            if (is_file($sourceFile)) {
                if (rename($sourceFile, $destFile)) {
                    $result['transferred']++;
                    loger('categories', 'DEBUG', 'Fichier transféré', [
                        'from' => $sourceFile,
                        'to' => $destFile
                    ]);
                } else {
                    $result['errors'][] = "Échec transfert: {$file}";
                    $result['success'] = false;
                    loger('categories', 'ERROR', 'Échec transfert fichier', [
                        'from' => $sourceFile,
                        'to' => $destFile
                    ]);
                }
            }
        }
    }
    
    // Mettre à jour les URLs dans les tables de médias
    $mediaTables = ['category_img', 'category_videos', 'category_audio', 'category_doc'];
    
    foreach ($mediaTables as $table) {
        try {
            // Récupérer les médias de cette catégorie
            $stmt = $db->prepare("SELECT id, url FROM {$table} WHERE category_id = :catId");
            $stmt->execute([':catId' => $categoryId]);
            $medias = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            foreach ($medias as $media) {
                if (!empty($media['url'])) {
                    // Remplacer le préfixe du chemin
                    $newUrl = str_replace($oldUrlPrefix, $newUrlPrefix, $media['url']);
                    
                    if ($newUrl !== $media['url']) {
                        $updateStmt = $db->prepare("UPDATE {$table} SET url = :url WHERE id = :id");
                        $updateStmt->execute([':url' => $newUrl, ':id' => $media['id']]);
                        
                        loger('categories', 'DEBUG', 'URL média mise à jour', [
                            'table' => $table,
                            'id' => $media['id'],
                            'old_url' => $media['url'],
                            'new_url' => $newUrl
                        ]);
                    }
                }
                
                // Mettre à jour thumbnail_url pour les vidéos
                if ($table === 'category_videos') {
                    $stmt2 = $db->prepare("SELECT id, thumbnail_url FROM {$table} WHERE category_id = :catId AND thumbnail_url IS NOT NULL");
                    $stmt2->execute([':catId' => $categoryId]);
                    $videos = $stmt2->fetchAll(PDO::FETCH_ASSOC);
                    
                    foreach ($videos as $video) {
                        if (!empty($video['thumbnail_url'])) {
                            $newThumbUrl = str_replace($oldUrlPrefix, $newUrlPrefix, $video['thumbnail_url']);
                            if ($newThumbUrl !== $video['thumbnail_url']) {
                                $updateStmt = $db->prepare("UPDATE {$table} SET thumbnail_url = :url WHERE id = :id");
                                $updateStmt->execute([':url' => $newThumbUrl, ':id' => $video['id']]);
                            }
                        }
                    }
                }
            }
        } catch (PDOException $e) {
            $result['errors'][] = "Erreur mise à jour {$table}: " . $e->getMessage();
            loger('categories', 'ERROR', 'Erreur SQL mise à jour URLs', [
                'table' => $table,
                'error' => $e->getMessage()
            ]);
        }
    }
    
    // Nettoyer le dossier source vide
    if ($result['success'] && is_dir($sourcePath)) {
        // Supprimer les sous-dossiers vides
        foreach ($subDirs as $subDir) {
            $subPath = "{$sourcePath}/{$subDir}";
            if (is_dir($subPath)) {
                @rmdir($subPath);
            }
        }
        // Supprimer le dossier principal s'il est vide
        @rmdir($sourcePath);
    }
    
    loger('categories', 'INFO', 'Transfert terminé', [
        'category_id' => $categoryId,
        'transferred' => $result['transferred'],
        'errors_count' => count($result['errors'])
    ]);
    
    return $result;
}

/**
 * Récupère les liens par défaut d'une catégorie
 */
function handleGetDefaultParents(PDO $db, int $categoryId): void
{
    try {
        $parents = getDefaultParents($db, $categoryId);
        sendSuccess([
            'category_id' => $categoryId,
            'default_parents' => $parents,
            'count' => count($parents)
        ]);
    } catch (PDOException $e) {
        loger('categories', 'ERROR', 'Erreur récupération liens par défaut', ['error' => $e->getMessage()]);
        sendError(500, 'database_error', 'Erreur lors de la récupération des liens par défaut');
    }
}

/**
 * Met à jour les liens par défaut d'une catégorie (admin uniquement)
 */
function handleUpdateDefaultParents(PDO $db, int $categoryId, bool $isAdmin): void
{
    if (!$isAdmin) {
        sendError(403, 'forbidden', 'Seuls les administrateurs peuvent gérer les liens par défaut');
    }
    
    $input = json_decode(file_get_contents('php://input'), true);
    $parentIds = $input['parent_ids'] ?? [];
    
    if (!is_array($parentIds)) {
        sendError(400, 'invalid_input', 'parent_ids doit être un tableau');
    }
    
    try {
        $db->beginTransaction();
        
        // Supprimer les anciens liens par défaut
        $stmt = $db->prepare("DELETE FROM category_mothers_default WHERE id_fille = :id");
        $stmt->execute([':id' => $categoryId]);
        
        // Ajouter les nouveaux liens par défaut
        if (!empty($parentIds)) {
            $insertStmt = $db->prepare(
                "INSERT INTO category_mothers_default (id_fille, id_mere) VALUES (:fille, :mere)"
            );
            foreach ($parentIds as $parentId) {
                $parentId = (int)$parentId;
                if ($parentId > 0 && $parentId !== $categoryId) {
                    $insertStmt->execute([':fille' => $categoryId, ':mere' => $parentId]);
                }
            }
        }
        
        $db->commit();
        
        loger('categories', 'INFO', 'Liens par défaut mis à jour', [
            'category_id' => $categoryId,
            'parent_ids' => $parentIds
        ]);
        
        sendSuccess([
            'message' => 'Liens par défaut mis à jour',
            'default_parents' => getDefaultParents($db, $categoryId)
        ]);
    } catch (PDOException $e) {
        $db->rollBack();
        loger('categories', 'ERROR', 'Erreur mise à jour liens par défaut', ['error' => $e->getMessage()]);
        sendError(500, 'database_error', 'Erreur lors de la mise à jour des liens par défaut');
    }
}

/**
 * Importe les liens par défaut d'une catégorie pour un utilisateur
 */
function handleImportDefaultParents(PDO $db, int $categoryId, int $userId): void
{
    try {
        // Récupérer les liens par défaut
        $defaultParents = getDefaultParents($db, $categoryId);
        
        if (empty($defaultParents)) {
            sendSuccess([
                'message' => 'Aucun lien par défaut à importer',
                'imported' => 0
            ]);
            return;
        }
        
        $db->beginTransaction();
        
        // Insérer les liens par défaut comme liens utilisateur (ignorer les doublons)
        $insertStmt = $db->prepare(
            "INSERT IGNORE INTO category_mothers (id_fille, id_mere, user_id) 
             VALUES (:fille, :mere, :userId)"
        );
        
        $imported = 0;
        foreach ($defaultParents as $parent) {
            $insertStmt->execute([
                ':fille' => $categoryId,
                ':mere' => $parent['id'],
                ':userId' => $userId
            ]);
            if ($insertStmt->rowCount() > 0) {
                $imported++;
            }
        }
        
        $db->commit();
        
        loger('categories', 'INFO', 'Liens par défaut importés', [
            'category_id' => $categoryId,
            'user_id' => $userId,
            'imported' => $imported,
            'total' => count($defaultParents)
        ]);
        
        sendSuccess([
            'message' => "Liens par défaut importés",
            'imported' => $imported,
            'total' => count($defaultParents),
            'parents' => getCategoryParents($db, $categoryId, $userId)
        ]);
    } catch (PDOException $e) {
        $db->rollBack();
        loger('categories', 'ERROR', 'Erreur import liens par défaut', ['error' => $e->getMessage()]);
        sendError(500, 'database_error', 'Erreur lors de l\'import des liens par défaut');
    }
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
