<?php
/**
 * SnowShelf - API Items
 * Gestion des items de la collection utilisateur
 * 
 * Endpoints:
 * GET    - Liste paginée des items avec filtres
 * POST   - Création d'un nouvel item
 * PUT    - Mise à jour d'un item
 * DELETE - Suppression d'un item
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

try {
    switch ($method) {
        case 'GET':
            handleGet($pdo, $userId);
            break;
        case 'POST':
            handlePost($pdo, $userId);
            break;
        case 'PUT':
            handlePut($pdo, $userId);
            break;
        case 'DELETE':
            handleDelete($pdo, $userId);
            break;
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => __('api.method_not_allowed')]);
    }
} catch (PDOException $e) {
    loger('items_api', 'ERROR', 'Database error', ['error' => $e->getMessage()]);
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => __('api.server_error')]);
} catch (Exception $e) {
    loger('items_api', 'ERROR', 'General error', ['error' => $e->getMessage()]);
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

/**
 * GET - Récupération des items avec pagination et filtres
 */
function handleGet(PDO $pdo, int $userId): void
{
    // Paramètres de pagination
    $page = max(1, (int)($_GET['page'] ?? 1));
    $limit = min(100, max(10, (int)($_GET['limit'] ?? 50)));
    $offset = ($page - 1) * $limit;
    
    // Paramètres de tri
    $allowedSort = ['name', 'created_at', 'updated_at', 'rating', 'market_value', 'purchase_price', 'acquisition_date'];
    $sort = in_array($_GET['sort'] ?? '', $allowedSort) ? $_GET['sort'] : 'name';
    $order = strtoupper($_GET['order'] ?? 'ASC') === 'DESC' ? 'DESC' : 'ASC';
    
    // Paramètres de recherche et filtres
    $search = trim($_GET['search'] ?? '');
    $categoryId = !empty($_GET['category_id']) ? (int)$_GET['category_id'] : null;
    $minRating = !empty($_GET['min_rating']) ? (float)$_GET['min_rating'] : null;
    $minValue = !empty($_GET['min_value']) ? (float)$_GET['min_value'] : null;
    $maxValue = !empty($_GET['max_value']) ? (float)$_GET['max_value'] : null;
    $dateFrom = !empty($_GET['date_from']) ? $_GET['date_from'] : null;
    $dateTo = !empty($_GET['date_to']) ? $_GET['date_to'] : null;
    $statusId = isset($_GET['status_id']) && $_GET['status_id'] !== '' ? (int)$_GET['status_id'] : null;
    
    // Récupération d'un item spécifique
    if (!empty($_GET['id'])) {
        getItemById($pdo, $userId, (int)$_GET['id']);
        return;
    }
    
    // Construction de la requête
    $whereConditions = ['i.user_id = :user_id'];
    $params = [':user_id' => $userId];
    
    // Recherche textuelle
    if (!empty($search)) {
        $searchPattern = '%' . $search . '%';
        $whereConditions[] = '(i.name LIKE :search_name OR i.description LIKE :search_desc OR i.code_barre LIKE :search_barcode)';
        $params[':search_name'] = $searchPattern;
        $params[':search_desc'] = $searchPattern;
        $params[':search_barcode'] = $searchPattern;
    }
    
    // Filtre par catégorie
    $joinCategory = '';
    if ($categoryId !== null) {
        $joinCategory = 'INNER JOIN item_categories ic ON i.id = ic.item_id';
        $whereConditions[] = 'ic.category_id = :category_id';
        $params[':category_id'] = $categoryId;
    }
    
    // Filtre par note minimum
    if ($minRating !== null) {
        $whereConditions[] = 'i.rating >= :min_rating';
        $params[':min_rating'] = $minRating;
    }
    
    // Filtre par valeur
    if ($minValue !== null) {
        $whereConditions[] = 'i.market_value >= :min_value';
        $params[':min_value'] = $minValue;
    }
    if ($maxValue !== null) {
        $whereConditions[] = 'i.market_value <= :max_value';
        $params[':max_value'] = $maxValue;
    }
    
    // Filtre par date d'acquisition
    if ($dateFrom !== null) {
        $whereConditions[] = 'i.acquisition_date >= :date_from';
        $params[':date_from'] = $dateFrom;
    }
    if ($dateTo !== null) {
        $whereConditions[] = 'i.acquisition_date <= :date_to';
        $params[':date_to'] = $dateTo;
    }
    
    // Filtre par statut
    if ($statusId !== null) {
        $whereConditions[] = 'i.status_id = :status_id';
        $params[':status_id'] = $statusId;
    }
    
    $whereClause = implode(' AND ', $whereConditions);
    
    // Comptage total
    $countSql = "SELECT COUNT(DISTINCT i.id) FROM items i $joinCategory WHERE $whereClause";
    $countStmt = $pdo->prepare($countSql);
    $countStmt->execute($params);
    $total = (int)$countStmt->fetchColumn();
    
    // Récupération des items avec leur première image et statut
    $sql = "
        SELECT DISTINCT
            i.id,
            i.name,
            i.description,
            i.note,
            i.rating,
            i.purchase_price,
            i.market_value,
            i.acquisition_date,
            i.status_id,
            s.name as status_name,
            s.color as status_color,
            s.icon as status_icon,
            i.code_barre,
            i.storage_location_id,
            i.created_at,
            i.updated_at,
            (
                SELECT ii.url 
                FROM item_img ii 
                WHERE ii.item_id = i.id 
                ORDER BY ii.ordre ASC, ii.id ASC 
                LIMIT 1
            ) as thumbnail_url,
            (
                SELECT UNIX_TIMESTAMP(ii.created_at) 
                FROM item_img ii 
                WHERE ii.item_id = i.id 
                ORDER BY ii.ordre ASC, ii.id ASC 
                LIMIT 1
            ) as thumbnail_timestamp
        FROM items i
        LEFT JOIN statuses s ON i.status_id = s.id
        $joinCategory
        WHERE $whereClause
        ORDER BY i.$sort $order, i.id ASC
        LIMIT :limit OFFSET :offset
    ";
    
    $stmt = $pdo->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    
    $items = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Récupération des catégories pour chaque item
    if (!empty($items)) {
        $itemIds = array_column($items, 'id');
        $placeholders = implode(',', array_fill(0, count($itemIds), '?'));
        
        $catSql = "
            SELECT ic.item_id, c.id as category_id, c.name as category_name
            FROM item_categories ic
            INNER JOIN categories c ON ic.category_id = c.id
            WHERE ic.item_id IN ($placeholders)
        ";
        $catStmt = $pdo->prepare($catSql);
        $catStmt->execute($itemIds);
        $categories = $catStmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Regroupement par item
        $categoriesByItem = [];
        foreach ($categories as $cat) {
            $categoriesByItem[$cat['item_id']][] = [
                'id' => $cat['category_id'],
                'name' => $cat['category_name']
            ];
        }
        
        // Ajout des catégories aux items + formatage thumbnail
        foreach ($items as &$item) {
            $item['categories'] = $categoriesByItem[$item['id']] ?? [];
            
            // Construction de l'objet statut
            if (!empty($item['status_id'])) {
                $item['status'] = [
                    'id' => (int)$item['status_id'],
                    'name' => $item['status_name'],
                    'color' => $item['status_color'],
                    'icon' => $item['status_icon']
                ];
            } else {
                $item['status'] = null;
            }
            unset($item['status_name'], $item['status_color'], $item['status_icon']);
            
            // Cache-busting pour les images (utilise updated_at de l'item)
            // Préfixer /storage si l'URL ne commence pas déjà par /storage
            if (!empty($item['thumbnail_url'])) {
                $url = $item['thumbnail_url'];
                if (strpos($url, '/storage') !== 0) {
                    $url = '/storage' . $url;
                }
                $timestamp = $item['thumbnail_timestamp'] ?? strtotime($item['updated_at']);
                $item['thumbnail_url'] = $url . '?v=' . $timestamp;
            }
            unset($item['thumbnail_timestamp']);
            
            // Conversion des types
            $item['id'] = (int)$item['id'];
            $item['rating'] = $item['rating'] !== null ? (float)$item['rating'] : null;
            $item['purchase_price'] = $item['purchase_price'] !== null ? (float)$item['purchase_price'] : null;
            $item['market_value'] = $item['market_value'] !== null ? (float)$item['market_value'] : null;
            $item['status_id'] = $item['status_id'] !== null ? (int)$item['status_id'] : null;
            $item['storage_location_id'] = $item['storage_location_id'] !== null ? (int)$item['storage_location_id'] : null;
        }
    }
    
    // Calcul de la pagination
    $totalPages = ceil($total / $limit);
    $hasMore = $page < $totalPages;
    
    echo json_encode([
        'success' => true,
        'data' => [
            'items' => $items,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'total_pages' => $totalPages,
                'has_more' => $hasMore
            ]
        ]
    ]);
}

/**
 * Récupération d'un item spécifique par ID
 */
function getItemById(PDO $pdo, int $userId, int $itemId): void
{
    // Récupération de l'item avec son statut et type primaire
    $sql = "
        SELECT i.*, 
               s.name as status_name, 
               s.color as status_color, 
               s.icon as status_icon,
               pt.name as primary_type_name,
               pt.icon as primary_type_icon,
               pt.color as primary_type_color
        FROM items i
        LEFT JOIN statuses s ON i.status_id = s.id
        LEFT JOIN primary_type pt ON i.id_primary_cat = pt.id
        WHERE i.id = :id AND i.user_id = :user_id
    ";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([':id' => $itemId, ':user_id' => $userId]);
    $item = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$item) {
        http_response_code(404);
        echo json_encode(['success' => false, 'error' => __('collection.item_not_found')]);
        return;
    }
    
    // Récupération des images
    $imgSql = "SELECT * FROM item_img WHERE item_id = :item_id ORDER BY ordre ASC, id ASC";
    $imgStmt = $pdo->prepare($imgSql);
    $imgStmt->execute([':item_id' => $itemId]);
    $images = $imgStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Préfixer /storage et cache-busting pour les images
    foreach ($images as &$img) {
        $timestamp = strtotime($img['created_at']);
        $url = $img['url'];
        if (strpos($url, '/storage') !== 0) {
            $url = '/storage' . $url;
        }
        $img['url'] = $url . '?v=' . $timestamp;
    }
    
    // Récupération des catégories
    $catSql = "
        SELECT c.id, c.name, c.icon, c.is_default
        FROM item_categories ic
        INNER JOIN categories c ON ic.category_id = c.id
        WHERE ic.item_id = :item_id
    ";
    $catStmt = $pdo->prepare($catSql);
    $catStmt->execute([':item_id' => $itemId]);
    $categories = $catStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Récupération des grades
    $gradeSql = "SELECT * FROM item_grades WHERE item_id = :item_id ORDER BY id ASC";
    $gradeStmt = $pdo->prepare($gradeSql);
    $gradeStmt->execute([':item_id' => $itemId]);
    $grades = $gradeStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Récupération des vidéos
    $videoSql = "SELECT * FROM item_videos WHERE item_id = :item_id ORDER BY ordre ASC, id ASC";
    $videoStmt = $pdo->prepare($videoSql);
    $videoStmt->execute([':item_id' => $itemId]);
    $videos = $videoStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Préfixer /storage pour les vidéos
    foreach ($videos as &$video) {
        if (!empty($video['url']) && strpos($video['url'], '/storage') !== 0) {
            $video['url'] = '/storage' . $video['url'];
        }
        if (!empty($video['thumbnail_url']) && strpos($video['thumbnail_url'], '/storage') !== 0) {
            $video['thumbnail_url'] = '/storage' . $video['thumbnail_url'];
        }
    }
    
    // Récupération des audios
    $audioSql = "SELECT * FROM item_audio WHERE item_id = :item_id ORDER BY ordre ASC, id ASC";
    $audioStmt = $pdo->prepare($audioSql);
    $audioStmt->execute([':item_id' => $itemId]);
    $audios = $audioStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Préfixer /storage pour les audios
    foreach ($audios as &$audio) {
        if (!empty($audio['url']) && strpos($audio['url'], '/storage') !== 0) {
            $audio['url'] = '/storage' . $audio['url'];
        }
    }
    
    // Récupération des documents
    $docSql = "SELECT * FROM item_doc WHERE item_id = :item_id ORDER BY ordre ASC, id ASC";
    $docStmt = $pdo->prepare($docSql);
    $docStmt->execute([':item_id' => $itemId]);
    $documents = $docStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Préfixer /storage pour les documents
    foreach ($documents as &$doc) {
        if (!empty($doc['url']) && strpos($doc['url'], '/storage') !== 0) {
            $doc['url'] = '/storage' . $doc['url'];
        }
    }
    
    // Assemblage de la réponse
    $item['images'] = $images;
    $item['categories'] = $categories;
    $item['grades'] = $grades;
    $item['videos'] = $videos;
    $item['audios'] = $audios;
    $item['documents'] = $documents;
    
    // Construction de l'objet statut
    if (!empty($item['status_id'])) {
        $item['status'] = [
            'id' => (int)$item['status_id'],
            'name' => $item['status_name'],
            'color' => $item['status_color'],
            'icon' => $item['status_icon']
        ];
    } else {
        $item['status'] = null;
    }
    unset($item['status_name'], $item['status_color'], $item['status_icon']);
    
    // Construction de l'objet type primaire
    if (!empty($item['id_primary_cat'])) {
        // Décoder le nom JSON du type primaire
        $typeNameJson = $item['primary_type_name'];
        $typeNames = json_decode($typeNameJson, true);
        
        $lang = getLang();
        if (is_array($typeNames)) {
            $translatedName = $typeNames[$lang] ?? $typeNames['fr'] ?? $typeNameJson;
            $typeKey = $typeNames['en'] ?? $typeNames['fr'] ?? $typeNameJson; // Clé anglaise pour référence
        } else {
            // Fallback si ce n'est pas du JSON (ancien format)
            $typeKey = $typeNameJson;
            $translatedName = __("primary_types.{$typeKey}");
            if ($translatedName === "primary_types.{$typeKey}") {
                $translatedName = $typeNameJson;
            }
        }
        
        $item['primary_type'] = [
            'id' => (int)$item['id_primary_cat'],
            'name' => $translatedName,
            'key' => $typeKey, // Clé pour les traitements JS
            'icon' => $item['primary_type_icon'],
            'color' => $item['primary_type_color']
        ];
    } else {
        $item['primary_type'] = null;
    }
    unset($item['primary_type_name'], $item['primary_type_icon'], $item['primary_type_color']);
    
    // Conversion des types
    $item['id'] = (int)$item['id'];
    $item['user_id'] = (int)$item['user_id'];
    $item['id_primary_cat'] = $item['id_primary_cat'] !== null ? (int)$item['id_primary_cat'] : null;
    $item['rating'] = $item['rating'] !== null ? (float)$item['rating'] : null;
    $item['purchase_price'] = $item['purchase_price'] !== null ? (float)$item['purchase_price'] : null;
    $item['market_value'] = $item['market_value'] !== null ? (float)$item['market_value'] : null;
    $item['status_id'] = $item['status_id'] !== null ? (int)$item['status_id'] : null;
    $item['storage_location_id'] = $item['storage_location_id'] !== null ? (int)$item['storage_location_id'] : null;
    
    echo json_encode([
        'success' => true,
        'data' => $item
    ]);
}

/**
 * POST - Création d'un nouvel item
 */
function handlePost(PDO $pdo, int $userId): void
{
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (empty($input['name'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => __('collection.name_required')]);
        return;
    }
    
    $pdo->beginTransaction();
    
    try {
        // Insertion de l'item
        $sql = "
            INSERT INTO items (
                user_id, id_primary_cat, name, description, note, rating, 
                purchase_price, market_value, acquisition_date, 
                status_id, code_barre, storage_location_id,
                created_at, updated_at
            ) VALUES (
                :user_id, :id_primary_cat, :name, :description, :note, :rating,
                :purchase_price, :market_value, :acquisition_date,
                :status_id, :code_barre, :storage_location_id,
                NOW(), NOW()
            )
        ";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':user_id' => $userId,
            ':id_primary_cat' => !empty($input['id_primary_cat']) ? (int)$input['id_primary_cat'] : null,
            ':name' => trim($input['name']),
            ':description' => trim($input['description'] ?? ''),
            ':note' => trim($input['note'] ?? ''),
            ':rating' => !empty($input['rating']) ? (float)$input['rating'] : null,
            ':purchase_price' => !empty($input['purchase_price']) ? (float)$input['purchase_price'] : null,
            ':market_value' => !empty($input['market_value']) ? (float)$input['market_value'] : null,
            ':acquisition_date' => !empty($input['acquisition_date']) ? $input['acquisition_date'] : null,
            ':status_id' => !empty($input['status_id']) ? (int)$input['status_id'] : null,
            ':code_barre' => trim($input['code_barre'] ?? ''),
            ':storage_location_id' => !empty($input['storage_location_id']) ? (int)$input['storage_location_id'] : null
        ]);
        
        $itemId = (int)$pdo->lastInsertId();
        
        // Association des catégories
        if (!empty($input['category_ids']) && is_array($input['category_ids'])) {
            $catSql = "INSERT INTO item_categories (item_id, category_id) VALUES (:item_id, :category_id)";
            $catStmt = $pdo->prepare($catSql);
            
            foreach ($input['category_ids'] as $catId) {
                $catStmt->execute([
                    ':item_id' => $itemId,
                    ':category_id' => (int)$catId
                ]);
            }
        }
        
        // Association des grades
        if (!empty($input['grade_ids']) && is_array($input['grade_ids'])) {
            $gradeSql = "INSERT INTO item_grades (item_id, grade_id) VALUES (:item_id, :grade_id)";
            $gradeStmt = $pdo->prepare($gradeSql);
            
            foreach ($input['grade_ids'] as $gradeId) {
                $gradeStmt->execute([
                    ':item_id' => $itemId,
                    ':grade_id' => (int)$gradeId
                ]);
            }
        }
        
        $pdo->commit();
        
        loger('items_api', 'INFO', 'Item created', ['item_id' => $itemId, 'user_id' => $userId]);
        
        echo json_encode([
            'success' => true,
            'data' => ['id' => $itemId],
            'message' => __('collection.item_created')
        ]);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}

/**
 * PUT - Mise à jour d'un item
 */
function handlePut(PDO $pdo, int $userId): void
{
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (empty($input['id'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => __('collection.id_required')]);
        return;
    }
    
    $itemId = (int)$input['id'];
    
    // Vérification de la propriété
    $checkSql = "SELECT id FROM items WHERE id = :id AND user_id = :user_id";
    $checkStmt = $pdo->prepare($checkSql);
    $checkStmt->execute([':id' => $itemId, ':user_id' => $userId]);
    
    if (!$checkStmt->fetch()) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => __('collection.not_owner')]);
        return;
    }
    
    $pdo->beginTransaction();
    
    try {
        // Construction de la mise à jour dynamique
        $updates = [];
        $params = [':id' => $itemId];
        
        $fields = [
            'name' => 'string',
            'description' => 'string',
            'note' => 'string',
            'rating' => 'float',
            'purchase_price' => 'float',
            'market_value' => 'float',
            'acquisition_date' => 'date',
            'status_id' => 'int_nullable',
            'id_primary_cat' => 'int_nullable',
            'code_barre' => 'string',
            'storage_location_id' => 'int'
        ];
        
        foreach ($fields as $field => $type) {
            if (array_key_exists($field, $input)) {
                $updates[] = "$field = :$field";
                
                $value = $input[$field];
                if ($value === '' || $value === null) {
                    $params[":$field"] = null;
                } else {
                    switch ($type) {
                        case 'int':
                            $params[":$field"] = (int)$value;
                            break;
                        case 'int_nullable':
                            // Permet de passer explicitement null ou une valeur
                            $params[":$field"] = $value !== null ? (int)$value : null;
                            break;
                        case 'float':
                            $params[":$field"] = (float)$value;
                            break;
                        default:
                            $params[":$field"] = trim($value);
                    }
                }
            }
        }
        
        if (!empty($updates)) {
            $updates[] = "updated_at = NOW()";
            $sql = "UPDATE items SET " . implode(', ', $updates) . " WHERE id = :id";
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
        }
        
        // Mise à jour des catégories si fournies
        if (array_key_exists('category_ids', $input)) {
            // Suppression des anciennes associations
            $delCatSql = "DELETE FROM item_categories WHERE item_id = :item_id";
            $delCatStmt = $pdo->prepare($delCatSql);
            $delCatStmt->execute([':item_id' => $itemId]);
            
            // Nouvelles associations
            if (!empty($input['category_ids']) && is_array($input['category_ids'])) {
                $catSql = "INSERT INTO item_categories (item_id, category_id) VALUES (:item_id, :category_id)";
                $catStmt = $pdo->prepare($catSql);
                
                foreach ($input['category_ids'] as $catId) {
                    $catStmt->execute([
                        ':item_id' => $itemId,
                        ':category_id' => (int)$catId
                    ]);
                }
            }
        }
        
        // Mise à jour des grades si fournis
        if (array_key_exists('grade_ids', $input)) {
            // Suppression des anciennes associations
            $delGradeSql = "DELETE FROM item_grades WHERE item_id = :item_id";
            $delGradeStmt = $pdo->prepare($delGradeSql);
            $delGradeStmt->execute([':item_id' => $itemId]);
            
            // Nouvelles associations
            if (!empty($input['grade_ids']) && is_array($input['grade_ids'])) {
                $gradeSql = "INSERT INTO item_grades (item_id, grade_id) VALUES (:item_id, :grade_id)";
                $gradeStmt = $pdo->prepare($gradeSql);
                
                foreach ($input['grade_ids'] as $gradeId) {
                    $gradeStmt->execute([
                        ':item_id' => $itemId,
                        ':grade_id' => (int)$gradeId
                    ]);
                }
            }
        }
        
        $pdo->commit();
        
        loger('items_api', 'INFO', 'Item updated', ['item_id' => $itemId, 'user_id' => $userId]);
        
        echo json_encode([
            'success' => true,
            'message' => __('collection.item_updated')
        ]);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}

/**
 * DELETE - Suppression d'un item
 */
function handleDelete(PDO $pdo, int $userId): void
{
    $itemId = (int)($_GET['id'] ?? 0);
    
    if (!$itemId) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => __('collection.id_required')]);
        return;
    }
    
    // Vérification de la propriété
    $checkSql = "SELECT id FROM items WHERE id = :id AND user_id = :user_id";
    $checkStmt = $pdo->prepare($checkSql);
    $checkStmt->execute([':id' => $itemId, ':user_id' => $userId]);
    
    if (!$checkStmt->fetch()) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => __('collection.not_owner')]);
        return;
    }
    
    $pdo->beginTransaction();
    
    try {
        // Suppression du dossier de l'item (contient tous les médias)
        $storageBase = __DIR__ . '/../../storage/users/' . $userId . '/items/' . $itemId;
        $itemDir = realpath($storageBase);
        
        // Si realpath échoue, essayer avec le chemin direct
        if (!$itemDir && is_dir($storageBase)) {
            $itemDir = $storageBase;
        }
        
        if ($itemDir && is_dir($itemDir)) {
            // Vérification de sécurité
            $realItemDir = realpath($itemDir);
            if ($realItemDir && strpos($realItemDir, DIRECTORY_SEPARATOR . 'storage' . DIRECTORY_SEPARATOR . 'users' . DIRECTORY_SEPARATOR) !== false) {
                $deleted = deleteDirectory($realItemDir);
                if ($deleted) {
                    loger('items_api', 'INFO', 'Item directory deleted', ['path' => $realItemDir]);
                } else {
                    loger('items_api', 'WARNING', 'Item directory deletion incomplete', ['path' => $realItemDir]);
                }
            }
        }
        
        // Suppression des relations (cascades normalement gérées par FK, mais par sécurité)
        $pdo->prepare("DELETE FROM item_categories WHERE item_id = :id")->execute([':id' => $itemId]);
        $pdo->prepare("DELETE FROM item_img WHERE item_id = :id")->execute([':id' => $itemId]);
        $pdo->prepare("DELETE FROM item_grades WHERE item_id = :id")->execute([':id' => $itemId]);
        $pdo->prepare("DELETE FROM item_videos WHERE item_id = :id")->execute([':id' => $itemId]);
        $pdo->prepare("DELETE FROM item_audio WHERE item_id = :id")->execute([':id' => $itemId]);
        $pdo->prepare("DELETE FROM item_doc WHERE item_id = :id")->execute([':id' => $itemId]);
        $pdo->prepare("DELETE FROM item_metadata WHERE item_id = :id")->execute([':id' => $itemId]);
        
        // Suppression de l'item
        $delSql = "DELETE FROM items WHERE id = :id";
        $delStmt = $pdo->prepare($delSql);
        $delStmt->execute([':id' => $itemId]);
        
        $pdo->commit();
        
        loger('items_api', 'INFO', 'Item deleted', ['item_id' => $itemId, 'user_id' => $userId]);
        
        echo json_encode([
            'success' => true,
            'message' => __('collection.item_deleted')
        ]);
        
    } catch (Exception $e) {
        $pdo->rollBack();
        throw $e;
    }
}

/**
 * Supprime récursivement un dossier et son contenu
 */
function deleteDirectory(string $dir): bool
{
    if (!is_dir($dir)) {
        return false;
    }
    
    $success = true;
    $items = scandir($dir);
    foreach ($items as $item) {
        if ($item === '.' || $item === '..') {
            continue;
        }
        
        $path = $dir . DIRECTORY_SEPARATOR . $item;
        if (is_dir($path)) {
            // Vérifier le résultat de l'appel récursif
            if (!deleteDirectory($path)) {
                $success = false;
                loger('items_api', 'WARNING', 'Failed to delete subdirectory', ['path' => $path]);
            }
        } else {
            if (!@unlink($path)) {
                $success = false;
                loger('items_api', 'WARNING', 'Failed to delete file', ['path' => $path]);
            }
        }
    }
    
    // Supprimer le dossier lui-même
    if (!@rmdir($dir)) {
        // Forcer la suppression si rmdir échoue
        loger('items_api', 'WARNING', 'rmdir failed, trying alternative', ['dir' => $dir]);
        
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
        
        // Vérifier aussi les fichiers normaux qui auraient pu être manqués
        $remainingFiles = glob($dir . DIRECTORY_SEPARATOR . '*');
        if ($remainingFiles) {
            foreach ($remainingFiles as $file) {
                if (is_file($file)) {
                    @unlink($file);
                } elseif (is_dir($file)) {
                    deleteDirectory($file);
                }
            }
        }
        
        // Réessayer rmdir
        if (!@rmdir($dir)) {
            loger('items_api', 'ERROR', 'Failed to delete directory after retries', ['dir' => $dir]);
            return false;
        }
    }
    
    return $success;
}
