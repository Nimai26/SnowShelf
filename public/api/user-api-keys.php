<?php
/**
 * SnowShelf - API Gestion des Clés API Utilisateur
 * 
 * Endpoints:
 * GET    /api/user-api-keys.php              - Liste des clés API de l'utilisateur
 * GET    /api/user-api-keys.php?id=X         - Détails d'une clé API spécifique
 * POST   /api/user-api-keys.php              - Créer/Modifier une clé API
 * DELETE /api/user-api-keys.php?id=X         - Supprimer une clé API
 * 
 * Paramètres POST/PUT:
 * - webapi_id: ID du fournisseur (Admin_webApi.id)
 * - api_key: Clé API de l'utilisateur
 * - client_id: Client ID/Token optionnel (pour IGDB, etc.)
 */

// Headers CORS et JSON
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
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

// Initialisation
try {
    $db = getDbConnection();
    $auth = new ApiAuth($db);
} catch (Exception $e) {
    sendError(500, 'server_error', 'Erreur serveur');
}

// Authentification obligatoire
$currentUser = $auth->authenticate();
if (!$currentUser) {
    $auth->sendUnauthorized(__('api.unauthorized'));
}

$userId = $currentUser['id'];

// Récupérer la méthode HTTP
$method = $_SERVER['REQUEST_METHOD'];

// Récupérer les paramètres
$providerId = isset($_GET['id']) ? (int)$_GET['id'] : null;
$action = $_GET['action'] ?? null;

// Action spéciale : tester une clé API
if ($action === 'test' && $method === 'POST') {
    handleTest($db);
}

// Router les requêtes
switch ($method) {
    case 'GET':
        handleGet($db, $userId, $providerId);
        break;
        
    case 'POST':
        handlePost($db, $userId);
        break;
        
    case 'DELETE':
        handleDelete($db, $userId, $providerId);
        break;
        
    default:
        sendError(405, 'method_not_allowed', __('api.method_not_allowed'));
}

/**
 * POST - Tester une clé API sans l'enregistrer
 */
function handleTest(PDO $db): void
{
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        sendError(400, 'invalid_input', 'Données JSON invalides');
    }
    
    $providerName = $input['provider_name'] ?? '';
    $apiKey = trim($input['api_key'] ?? '');
    $clientId = trim($input['client_id'] ?? '');
    
    if (empty($providerName) || empty($apiKey)) {
        sendError(400, 'missing_field', 'Fournisseur et clé API requis');
    }
    
    // Tester la clé selon le fournisseur
    $result = testApiKey($providerName, $apiKey, $clientId);
    
    if ($result['valid']) {
        sendSuccess([
            'valid' => true,
            'message' => __('account.api_key_valid'),
            'details' => $result['details'] ?? null
        ]);
    } else {
        sendSuccess([
            'valid' => false,
            'message' => $result['message'] ?? __('account.api_key_invalid'),
            'error' => $result['error'] ?? null
        ]);
    }
}

/**
 * Tester une clé API selon le fournisseur
 */
function testApiKey(string $providerName, string $apiKey, string $clientId = ''): array
{
    $testEndpoints = [
        'rebrickable' => [
            'url' => 'https://rebrickable.com/api/v3/lego/themes/?page_size=1&key=' . urlencode($apiKey),
            'method' => 'GET',
            'headers' => [],
        ],
        'googlebooks' => [
            'url' => 'https://www.googleapis.com/books/v1/volumes?q=test&maxResults=1&key=' . urlencode($apiKey),
            'method' => 'GET',
            'headers' => [],
        ],
        'rawg' => [
            'url' => 'https://api.rawg.io/api/games?key=' . urlencode($apiKey) . '&page_size=1',
            'method' => 'GET',
            'headers' => [],
        ],
        'tmdb' => [
            'url' => 'https://api.themoviedb.org/3/configuration?api_key=' . urlencode($apiKey),
            'method' => 'GET',
            'headers' => [],
        ],
        'igdb' => [
            // IGDB utilise OAuth2 via Twitch - on doit d'abord obtenir un access token
            'oauth' => true,
            'token_url' => 'https://id.twitch.tv/oauth2/token',
            'token_params' => [
                'client_id' => $clientId,
                'client_secret' => $apiKey,
                'grant_type' => 'client_credentials'
            ],
            'test_url' => 'https://api.igdb.com/v4/platforms',
            'test_body' => 'fields name; limit 1;',
        ],
        'tvdb' => [
            // TheTVDB utilise un token d'authentification
            'login' => true,
            'login_url' => 'https://api4.thetvdb.com/v4/login',
            'login_body' => ['apikey' => $apiKey],
            'test_url' => 'https://api4.thetvdb.com/v4/companies?page=0',
        ],
        'comicvine' => [
            'url' => 'https://comicvine.gamespot.com/api/characters/?api_key=' . urlencode($apiKey) . '&format=json&limit=1',
            'method' => 'GET',
            'headers' => ['User-Agent: SnowShelf/1.0'],
        ],
    ];
    
    // Vérifier si le fournisseur est supporté
    if (!isset($testEndpoints[$providerName])) {
        return [
            'valid' => false,
            'message' => 'Test non disponible pour ce fournisseur',
            'error' => 'unsupported_provider'
        ];
    }
    
    $config = $testEndpoints[$providerName];
    
    // Cas spécial : IGDB (OAuth2)
    if (!empty($config['oauth'])) {
        return testIgdbKey($config, $clientId, $apiKey);
    }
    
    // Cas spécial : TheTVDB (login + token)
    if (!empty($config['login'])) {
        return testTvdbKey($config, $apiKey, $clientId);
    }
    
    // Test standard
    return makeTestRequest($config['url'], $config['method'] ?? 'GET', $config['headers'] ?? []);
}

/**
 * Test spécifique pour IGDB (OAuth2 Twitch)
 */
function testIgdbKey(array $config, string $clientId, string $clientSecret): array
{
    if (empty($clientId)) {
        return [
            'valid' => false,
            'message' => 'Client ID requis pour IGDB',
            'error' => 'missing_client_id'
        ];
    }
    
    // Étape 1: Obtenir le access token
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $config['token_url'],
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => http_build_query([
            'client_id' => $clientId,
            'client_secret' => $clientSecret,
            'grant_type' => 'client_credentials'
        ]),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200) {
        $data = json_decode($response, true);
        return [
            'valid' => false,
            'message' => 'Échec de l\'authentification Twitch/IGDB',
            'error' => $data['message'] ?? 'oauth_failed'
        ];
    }
    
    $tokenData = json_decode($response, true);
    $accessToken = $tokenData['access_token'] ?? '';
    
    if (empty($accessToken)) {
        return [
            'valid' => false,
            'message' => 'Token d\'accès non reçu',
            'error' => 'no_token'
        ];
    }
    
    // Étape 2: Tester l'API IGDB avec le token
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $config['test_url'],
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $config['test_body'],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_HTTPHEADER => [
            'Client-ID: ' . $clientId,
            'Authorization: Bearer ' . $accessToken,
            'Content-Type: text/plain'
        ],
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        return [
            'valid' => true,
            'details' => 'Token obtenu et API accessible'
        ];
    }
    
    return [
        'valid' => false,
        'message' => 'Échec du test API IGDB (code ' . $httpCode . ')',
        'error' => 'api_test_failed'
    ];
}

/**
 * Test spécifique pour TheTVDB (login + bearer token)
 */
function testTvdbKey(array $config, string $apiKey, string $pin = ''): array
{
    // Étape 1: Login pour obtenir le token
    $loginBody = ['apikey' => $apiKey];
    if (!empty($pin)) {
        $loginBody['pin'] = $pin;
    }
    
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $config['login_url'],
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($loginBody),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Accept: application/json'
        ],
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode !== 200) {
        $data = json_decode($response, true);
        return [
            'valid' => false,
            'message' => 'Échec de l\'authentification TheTVDB',
            'error' => $data['message'] ?? 'login_failed'
        ];
    }
    
    $loginData = json_decode($response, true);
    $token = $loginData['data']['token'] ?? '';
    
    if (empty($token)) {
        return [
            'valid' => false,
            'message' => 'Token non reçu de TheTVDB',
            'error' => 'no_token'
        ];
    }
    
    // Étape 2: Tester l'API avec le token
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $config['test_url'],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . $token,
            'Accept: application/json'
        ],
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($httpCode === 200) {
        return [
            'valid' => true,
            'details' => 'Authentification et API accessibles'
        ];
    }
    
    return [
        'valid' => false,
        'message' => 'Échec du test API TheTVDB (code ' . $httpCode . ')',
        'error' => 'api_test_failed'
    ];
}

/**
 * Faire une requête de test simple
 */
function makeTestRequest(string $url, string $method = 'GET', array $headers = []): array
{
    $ch = curl_init();
    
    $defaultHeaders = ['Accept: application/json'];
    $allHeaders = array_merge($defaultHeaders, $headers);
    
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_HTTPHEADER => $allHeaders,
        CURLOPT_FOLLOWLOCATION => true,
    ]);
    
    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        return [
            'valid' => false,
            'message' => 'Erreur de connexion: ' . $error,
            'error' => 'connection_error'
        ];
    }
    
    // Codes de succès
    if ($httpCode >= 200 && $httpCode < 300) {
        return [
            'valid' => true,
            'details' => 'API accessible (HTTP ' . $httpCode . ')'
        ];
    }
    
    // Codes d'erreur courants pour les clés invalides
    if ($httpCode === 401 || $httpCode === 403) {
        return [
            'valid' => false,
            'message' => 'Clé API invalide ou expirée',
            'error' => 'invalid_key'
        ];
    }
    
    // Autres erreurs
    return [
        'valid' => false,
        'message' => 'Erreur API (HTTP ' . $httpCode . ')',
        'error' => 'api_error'
    ];
}

/**
 * GET - Récupérer les clés API de l'utilisateur
 */
function handleGet(PDO $db, int $userId, ?int $providerId): void
{
    try {
        if ($providerId !== null) {
            // Récupérer une clé spécifique
            $stmt = $db->prepare("
                SELECT ua.webapi_id, ua.api_key, ua.Cliend_ID_Token as client_id,
                       ua.created_at, ua.updated_at,
                       aw.name, aw.Name_UF, aw.Type, aw.Notes
                FROM users_api ua
                JOIN Admin_webApi aw ON aw.id = ua.webapi_id
                WHERE ua.user_id = ? AND ua.webapi_id = ?
            ");
            $stmt->execute([$userId, $providerId]);
            $key = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$key) {
                sendError(404, 'not_found', 'Clé API non trouvée');
            }
            
            // Masquer partiellement la clé
            $key['api_key_masked'] = maskApiKey($key['api_key']);
            
            sendSuccess($key);
        } else {
            // Récupérer toutes les clés de l'utilisateur
            $stmt = $db->prepare("
                SELECT ua.webapi_id, ua.api_key, ua.Cliend_ID_Token as client_id,
                       ua.created_at, ua.updated_at,
                       aw.name, aw.Name_UF, aw.Type, aw.Notes
                FROM users_api ua
                JOIN Admin_webApi aw ON aw.id = ua.webapi_id
                WHERE ua.user_id = ?
                ORDER BY aw.Type, aw.Name_UF
            ");
            $stmt->execute([$userId]);
            $keys = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Masquer partiellement les clés
            foreach ($keys as &$key) {
                $key['api_key_masked'] = maskApiKey($key['api_key']);
            }
            
            sendSuccess(['keys' => $keys, 'count' => count($keys)]);
        }
    } catch (PDOException $e) {
        sendError(500, 'database_error', 'Erreur base de données');
    }
}

/**
 * POST - Créer ou mettre à jour une clé API
 */
function handlePost(PDO $db, int $userId): void
{
    // Récupérer les données JSON
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input) {
        sendError(400, 'invalid_input', 'Données JSON invalides');
    }
    
    // Validation des champs requis
    if (empty($input['webapi_id'])) {
        sendError(400, 'missing_field', 'Le champ webapi_id est requis');
    }
    
    $webapiId = (int)$input['webapi_id'];
    $apiKey = trim($input['api_key'] ?? '');
    $clientId = trim($input['client_id'] ?? '');
    
    // Vérifier que le fournisseur existe et nécessite une clé utilisateur
    try {
        $stmt = $db->prepare("SELECT id, name, Name_UF FROM Admin_webApi WHERE id = ? AND USER_API = 1");
        $stmt->execute([$webapiId]);
        $provider = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$provider) {
            sendError(404, 'provider_not_found', 'Fournisseur non trouvé ou ne nécessite pas de clé utilisateur');
        }
        
        // Vérifier si l'utilisateur a déjà une clé pour ce fournisseur
        $stmt = $db->prepare("SELECT id FROM users_api WHERE user_id = ? AND webapi_id = ?");
        $stmt->execute([$userId, $webapiId]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($existing) {
            // Mise à jour
            $stmt = $db->prepare("
                UPDATE users_api 
                SET api_key = ?, Cliend_ID_Token = ?, updated_at = NOW()
                WHERE user_id = ? AND webapi_id = ?
            ");
            $stmt->execute([$apiKey, $clientId ?: null, $userId, $webapiId]);
            $action = 'updated';
        } else {
            // Création
            $stmt = $db->prepare("
                INSERT INTO users_api (user_id, webapi_id, api_key, Cliend_ID_Token, created_at, updated_at)
                VALUES (?, ?, ?, ?, NOW(), NOW())
            ");
            $stmt->execute([$userId, $webapiId, $apiKey, $clientId ?: null]);
            $action = 'created';
        }
        
        sendSuccess([
            'action' => $action,
            'provider' => $provider['Name_UF'],
            'message' => __('account.api_key_saved')
        ]);
        
    } catch (PDOException $e) {
        sendError(500, 'database_error', 'Erreur lors de l\'enregistrement');
    }
}

/**
 * DELETE - Supprimer une clé API
 */
function handleDelete(PDO $db, int $userId, ?int $providerId): void
{
    if ($providerId === null) {
        sendError(400, 'missing_id', 'ID du fournisseur requis');
    }
    
    try {
        // Vérifier que la clé existe
        $stmt = $db->prepare("SELECT id FROM users_api WHERE user_id = ? AND webapi_id = ?");
        $stmt->execute([$userId, $providerId]);
        $existing = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$existing) {
            sendError(404, 'not_found', 'Clé API non trouvée');
        }
        
        // Supprimer
        $stmt = $db->prepare("DELETE FROM users_api WHERE user_id = ? AND webapi_id = ?");
        $stmt->execute([$userId, $providerId]);
        
        sendSuccess([
            'message' => __('account.api_key_deleted')
        ]);
        
    } catch (PDOException $e) {
        sendError(500, 'database_error', 'Erreur lors de la suppression');
    }
}

/**
 * Masque partiellement une clé API pour l'affichage
 */
function maskApiKey(?string $key): string
{
    if (empty($key)) {
        return '';
    }
    
    $len = strlen($key);
    if ($len <= 8) {
        return str_repeat('•', $len);
    }
    
    // Afficher les 4 premiers et 4 derniers caractères
    return substr($key, 0, 4) . str_repeat('•', $len - 8) . substr($key, -4);
}

/**
 * Envoie une réponse JSON de succès
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
 * Envoie une réponse JSON d'erreur
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
