<?php
/**
 * SnowShelf - API User Categories (Simplifiée)
 * 
 * Renvoie la liste des catégories auxquelles l'utilisateur a accès
 * Utilisé principalement pour les filtres de la collection
 * 
 * Endpoint:
 * GET /api/user-categories.php - Liste toutes les catégories accessibles
 */

// Headers CORS et JSON
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Gérer les requêtes OPTIONS (preflight CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Chargement des dépendances
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../core/i18n.php';

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
$isPremium = (bool)($_SESSION['is_premium'] ?? false);
$isAdmin = (bool)($_SESSION['is_admin'] ?? false);

try {
    $pdo = getDbConnection();
    
    // Construction de la requête selon les droits
    // Free : catégories par défaut uniquement
    // Premium/Admin : catégories par défaut + ses propres catégories perso + catégories publiques
    
    $conditions = [];
    $params = [];
    
    // Toujours inclure les catégories par défaut
    $conditions[] = "is_default = 1";
    
    // Premium et Admin : ajouter les catégories personnelles + publiques
    if ($isPremium || $isAdmin) {
        // Mes catégories perso
        $conditions[] = "(user_id = :user_id AND is_default = 0)";
        $params[':user_id'] = $userId;
        
        // Catégories publiques des autres (si visible = 1)
        $conditions[] = "(visible = 1 AND user_id != :user_id2 AND is_default = 0)";
        $params[':user_id2'] = $userId;
    }
    
    $whereClause = '(' . implode(' OR ', $conditions) . ')';
    
    $sql = "
        SELECT 
            id,
            name,
            description,
            icon,
            is_default,
            CASE 
                WHEN is_default = 1 THEN 'default'
                WHEN user_id = :check_user THEN 'perso'
                ELSE 'public'
            END as type
        FROM categories
        WHERE $whereClause
        ORDER BY 
            CASE WHEN is_default = 1 THEN 0 ELSE 1 END,
            name ASC
    ";
    
    $params[':check_user'] = $userId;
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Récupérer les IDs des catégories pour les requêtes de parenté
    $categoryIds = array_column($categories, 'id');
    
    // Récupérer les relations parent-enfant pour les catégories par défaut
    $defaultParents = [];
    if (!empty($categoryIds)) {
        $placeholders = implode(',', array_fill(0, count($categoryIds), '?'));
        $stmtDefault = $pdo->prepare("
            SELECT id_fille, id_mere 
            FROM category_mothers_default 
            WHERE id_fille IN ($placeholders)
        ");
        $stmtDefault->execute($categoryIds);
        while ($row = $stmtDefault->fetch(PDO::FETCH_ASSOC)) {
            if (!isset($defaultParents[$row['id_fille']])) {
                $defaultParents[$row['id_fille']] = [];
            }
            $defaultParents[$row['id_fille']][] = (int)$row['id_mere'];
        }
    }
    
    // Récupérer les relations parent-enfant pour les catégories utilisateurs
    $userParents = [];
    if (!empty($categoryIds)) {
        $placeholders = implode(',', array_fill(0, count($categoryIds), '?'));
        $stmtUser = $pdo->prepare("
            SELECT id_fille, id_mere 
            FROM category_mothers 
            WHERE id_fille IN ($placeholders) AND user_id = ?
        ");
        $stmtUser->execute(array_merge($categoryIds, [$userId]));
        while ($row = $stmtUser->fetch(PDO::FETCH_ASSOC)) {
            if (!isset($userParents[$row['id_fille']])) {
                $userParents[$row['id_fille']] = [];
            }
            $userParents[$row['id_fille']][] = (int)$row['id_mere'];
        }
    }
    
    // Conversion des types et ajout des parent_ids
    foreach ($categories as &$cat) {
        $cat['id'] = (int)$cat['id'];
        $cat['is_default'] = (bool)$cat['is_default'];
        
        // Ajouter les IDs des parents selon le type de catégorie
        if ($cat['is_default']) {
            $cat['parent_ids'] = $defaultParents[$cat['id']] ?? [];
        } else {
            $cat['parent_ids'] = $userParents[$cat['id']] ?? [];
        }
    }
    
    echo json_encode([
        'success' => true,
        'data' => $categories
    ]);
    
} catch (PDOException $e) {
    error_log('user-categories API error: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => __('api.server_error')]);
}
