<?php
/**
 * SnowShelf - API Primary Types
 * Gestion des types primaires de contenu (books, video_games, music, etc.)
 * 
 * Endpoints:
 * GET - Liste des types primaires
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

$method = $_SERVER['REQUEST_METHOD'];
$pdo = getDbConnection();
$lang = getLang();

try {
    switch ($method) {
        case 'GET':
            handleGet($pdo, $lang);
            break;
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => __('api.method_not_allowed')]);
    }
} catch (PDOException $e) {
    loger('primary_types_api', 'ERROR', 'Database error', ['error' => $e->getMessage()]);
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => __('api.server_error')]);
} catch (Exception $e) {
    loger('primary_types_api', 'ERROR', 'General error', ['error' => $e->getMessage()]);
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

/**
 * GET - Récupération des types primaires
 */
function handleGet(PDO $pdo, string $lang): void
{
    $sql = "
        SELECT 
            id, 
            name, 
            icon, 
            color, 
            sort_order
        FROM primary_type 
        ORDER BY sort_order ASC
    ";
    
    $stmt = $pdo->query($sql);
    $types = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Décoder les noms JSON et ajouter label/name_fr/name_en pour rétrocompatibilité
    foreach ($types as &$type) {
        $type['id'] = (int)$type['id'];
        $type['sort_order'] = (int)$type['sort_order'];
        
        $names = json_decode($type['name'], true);
        if (is_array($names)) {
            $type['name_fr'] = $names['fr'] ?? $names['en'] ?? $type['name'];
            $type['name_en'] = $names['en'] ?? $names['fr'] ?? $type['name'];
            $type['label'] = $names[$lang] ?? $names['fr'] ?? $type['name'];
        } else {
            $type['name_fr'] = $type['name'];
            $type['name_en'] = $type['name'];
            $type['label'] = $type['name'];
        }
    }
    
    echo json_encode([
        'success' => true,
        'data' => $types
    ]);
}
