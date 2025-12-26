<?php
/**
 * API Admin - Récupération d'images de plateformes
 * 
 * Endpoints:
 * - GET ?action=stats : Statistiques des images
 * - GET ?action=preview&platform_id=X : Prévisualiser les images disponibles
 * - POST action=fetch&platform_id=X : Récupérer les images d'une plateforme
 * - POST action=fetch_batch : Récupérer les images de toutes les plateformes sans images
 * - POST action=fetch_batch&platform_ids=[1,2,3] : Récupérer pour des IDs spécifiques
 */

header('Content-Type: application/json; charset=utf-8');

// Vérification de l'authentification admin
session_start();
if (!isset($_SESSION['user_id']) || !$_SESSION['is_admin']) {
    http_response_code(403);
    echo json_encode(['success' => false, 'error' => 'Accès refusé']);
    exit;
}

require_once __DIR__ . '/../../../core/PlatformImageFetcher.php';

$action = $_GET['action'] ?? $_POST['action'] ?? '';
$userId = $_SESSION['user_id'];

try {
    $fetcher = new PlatformImageFetcher($userId);
    
    switch ($action) {
        
        case 'stats':
            // Statistiques des images
            $stats = $fetcher->getStats();
            echo json_encode(['success' => true, 'stats' => $stats]);
            break;
            
        case 'preview':
            // Prévisualiser les images disponibles pour une plateforme
            $platformId = (int) ($_GET['platform_id'] ?? 0);
            
            if (!$platformId) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'platform_id requis']);
                exit;
            }
            
            $result = $fetcher->previewPlatformImages($platformId);
            echo json_encode($result);
            break;
            
        case 'fetch':
            // Récupérer les images d'une plateforme
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                http_response_code(405);
                echo json_encode(['success' => false, 'error' => 'Méthode POST requise']);
                exit;
            }
            
            $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
            $platformId = (int) ($input['platform_id'] ?? 0);
            $overwrite = (bool) ($input['overwrite'] ?? false);
            
            if (!$platformId) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'platform_id requis']);
                exit;
            }
            
            $result = $fetcher->fetchPlatformImages($platformId, $overwrite);
            echo json_encode($result);
            break;
        
        case 'list_without_images':
            // Liste des plateformes sans images (pour traitement côté client)
            require_once __DIR__ . '/../../../config/database.php';
            $pdoPlatform = getPlatformDbConnection();
            
            $limit = (int) ($_GET['limit'] ?? 0);
            $onlyMissing = $_GET['only_missing'] ?? 'both'; // 'logo', 'console', 'both'
            
            $where = "(img_logo IS NULL OR img_logo = '') OR (img_console IS NULL OR img_console = '')";
            if ($onlyMissing === 'logo') {
                $where = "img_logo IS NULL OR img_logo = ''";
            } elseif ($onlyMissing === 'console') {
                $where = "img_console IS NULL OR img_console = ''";
            }
            
            $sql = "SELECT id, name, img_logo, img_console FROM Platform WHERE $where ORDER BY name";
            if ($limit > 0) {
                $sql .= " LIMIT $limit";
            }
            
            $stmt = $pdoPlatform->query($sql);
            $platforms = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'platforms' => $platforms,
                'total' => count($platforms)
            ]);
            break;
            
        case 'fetch_batch':
            // Récupérer les images en batch
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                http_response_code(405);
                echo json_encode(['success' => false, 'error' => 'Méthode POST requise']);
                exit;
            }
            
            $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
            $platformIds = $input['platform_ids'] ?? null;
            $overwrite = (bool) ($input['overwrite'] ?? false);
            $limit = (int) ($input['limit'] ?? 0);
            
            // Si une limite est spécifiée et pas d'IDs, limiter les plateformes
            if ($platformIds === null && $limit > 0) {
                require_once __DIR__ . '/../../../config/database.php';
                $pdoPlatform = getPlatformDbConnection();
                $stmt = $pdoPlatform->prepare("
                    SELECT id FROM Platform 
                    WHERE (img_logo IS NULL OR img_logo = '')
                       OR (img_console IS NULL OR img_console = '')
                    ORDER BY name
                    LIMIT ?
                ");
                $stmt->execute([$limit]);
                $platformIds = $stmt->fetchAll(PDO::FETCH_COLUMN);
            }
            
            $result = $fetcher->fetchBatch($platformIds, null, $overwrite);
            echo json_encode(['success' => true, 'result' => $result]);
            break;
            
        case 'fetch_single_streaming':
            // Version streaming pour une seule plateforme (SSE)
            // Utilisé pour afficher la progression en temps réel
            header('Content-Type: text/event-stream');
            header('Cache-Control: no-cache');
            header('Connection: keep-alive');
            
            $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
            $platformIds = $input['platform_ids'] ?? null;
            $overwrite = (bool) ($input['overwrite'] ?? false);
            
            // Désactiver le buffering
            if (ob_get_level()) ob_end_clean();
            
            $fetcher->fetchBatch($platformIds, function($progress) {
                echo "data: " . json_encode($progress) . "\n\n";
                flush();
            }, $overwrite);
            
            echo "data: " . json_encode(['done' => true]) . "\n\n";
            break;
            
        case 'check_credentials':
            // Vérifier si les credentials IGDB sont configurés
            require_once __DIR__ . '/../../../config/database.php';
            $pdo = getDbConnection();
            
            $stmt = $pdo->prepare("
                SELECT ua.api_key, ua.Cliend_ID_Token 
                FROM users_api ua 
                JOIN Admin_webApi wa ON ua.webapi_id = wa.id 
                WHERE ua.user_id = ? AND wa.name = 'igdb'
            ");
            $stmt->execute([$userId]);
            $creds = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $hasCredentials = $creds && !empty($creds['api_key']) && !empty($creds['Cliend_ID_Token']);
            
            echo json_encode([
                'success' => true,
                'has_credentials' => $hasCredentials,
                'message' => $hasCredentials 
                    ? 'Clés IGDB configurées' 
                    : 'Clés IGDB non configurées. Ajoutez vos clés dans Paramètres > Clés API.'
            ]);
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'Action non reconnue']);
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'error' => $e->getMessage()
    ]);
}
