<?php
/**
 * SnowShelf - API Recherche Web
 * Gestion des fournisseurs d'informations et recherches web
 * 
 * Endpoints:
 * GET    ?action=providers         - Liste des fournisseurs par type
 * GET    ?action=providers&type=X  - Fournisseurs filtrés par type
 * POST   action=search             - Lancer une recherche
 * POST   action=search_image       - Recherche par image (OCR/barcode)
 */

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../core/i18n.php';
require_once __DIR__ . '/../../core/logger.php';

/**
 * Encrypte une clé API avec AES-256-GCM
 * Compatible avec le système d'encryption de toys_api
 * 
 * @param string $plainKey - Clé en clair
 * @return string|null - Clé encryptée en base64 ou null si erreur
 */
function encryptApiKey(string $plainKey): ?string
{
    if (!defined('API_ENCRYPTION_KEY') || !API_ENCRYPTION_KEY) {
        return null;
    }
    
    try {
        // Générer un IV aléatoire de 12 bytes (96 bits pour GCM)
        $iv = random_bytes(12);
        
        // Dériver la clé avec SHA-256 (comme dans toys_api)
        $key = hash('sha256', API_ENCRYPTION_KEY, true);
        
        // Encrypter avec AES-256-GCM
        $ciphertext = openssl_encrypt(
            $plainKey,
            'aes-256-gcm',
            $key,
            OPENSSL_RAW_DATA,
            $iv,
            $tag,
            '',
            16 // Tag length
        );
        
        if ($ciphertext === false) {
            return null;
        }
        
        // Concaténer: IV (12) + Auth Tag (16) + Ciphertext
        $encrypted = $iv . $tag . $ciphertext;
        
        // Encoder en base64
        return base64_encode($encrypted);
    } catch (Exception $e) {
        loger('web_search_api', 'ERROR', 'Encryption error', ['error' => $e->getMessage()]);
        return null;
    }
}

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
$isPremium = !empty($_SESSION['is_premium']) || !empty($_SESSION['is_admin']);
$isAdmin = !empty($_SESSION['is_admin']);
$userLang = $_SESSION['lang_pref'] ?? 'fr';
$autoTrad = $isPremium && !empty($_SESSION['auto_trad']); // Auto-traduction si premium ET activée
$method = $_SERVER['REQUEST_METHOD'];
$pdo = getDbConnection();

// Récupération de la configuration API depuis Admin_Main_Config
$toysApiBaseUrl = null;
$apiEncryptionKey = null;
try {
    $stmt = $pdo->query("SELECT IDENTIFY_INFOS_URL, API_ENCRYPTION_KEY FROM Admin_Main_Config LIMIT 1");
    $configRow = $stmt->fetch(PDO::FETCH_ASSOC);
    if ($configRow) {
        if (!empty($configRow['IDENTIFY_INFOS_URL'])) {
            // Enlever /health si présent à la fin de l'URL
            $toysApiBaseUrl = rtrim(preg_replace('#/health$#', '', $configRow['IDENTIFY_INFOS_URL']), '/');
        }
        $apiEncryptionKey = $configRow['API_ENCRYPTION_KEY'] ?? null;
    }
} catch (Exception $e) {
    loger('web_search_api', 'ERROR', 'Impossible de récupérer la configuration API', ['error' => $e->getMessage()]);
}

if (empty($toysApiBaseUrl)) {
    // Fallback sur une URL par défaut
    $toysApiBaseUrl = 'http://toys_api:3000';
}

define('TOYS_API_BASE_URL', $toysApiBaseUrl);
define('API_ENCRYPTION_KEY', $apiEncryptionKey);

/**
 * Mapping des providers enfants vers leurs providers parents pour les clés API
 * Les providers enfants héritent des clés API configurées sur leur provider parent
 * Format : 'provider_enfant' => 'provider_parent'
 */
define('PROVIDER_PARENT_MAPPING', [
    // TMDB sous-variantes → utilisent les clés de tmdb
    'tmdb_movies' => 'tmdb',
    'tmdb_series' => 'tmdb',
    // TVDB sous-variantes → utilisent les clés de tvdb
    'tvdb_movies' => 'tvdb',
    'tvdb_series' => 'tvdb',
    // IMDB sous-variantes (pas de clé API requise mais pour cohérence)
    'imdb_movies' => 'imdb',
    'imdb_series' => 'imdb',
]);

/**
 * Obtenir le nom du provider parent pour les clés API
 * @param string $providerName - Nom du provider
 * @return string - Nom du provider parent (ou le même si pas d'héritage)
 */
function getParentProviderName(string $providerName): string
{
    return PROVIDER_PARENT_MAPPING[$providerName] ?? $providerName;
}

/**
 * Obtenir l'ID du provider parent depuis son nom
 * @param PDO $pdo
 * @param string $providerName - Nom du provider enfant
 * @return int|null - ID du provider parent ou null si non trouvé
 */
function getParentProviderId(PDO $pdo, string $providerName): ?int
{
    $parentName = getParentProviderName($providerName);
    if ($parentName === $providerName) {
        return null; // Pas de parent
    }
    
    static $cache = [];
    if (isset($cache[$parentName])) {
        return $cache[$parentName];
    }
    
    $stmt = $pdo->prepare("SELECT id FROM Admin_webApi WHERE name = ? LIMIT 1");
    $stmt->execute([$parentName]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    $cache[$parentName] = $row ? (int)$row['id'] : null;
    return $cache[$parentName];
}

try {
    $action = $_GET['action'] ?? $_POST['action'] ?? '';
    
    switch ($action) {
        case 'providers':
            handleGetProviders($pdo, $isPremium, $isAdmin);
            break;
            
        case 'search':
            if ($method !== 'POST') {
                http_response_code(405);
                echo json_encode(['success' => false, 'error' => __('api.method_not_allowed')]);
                exit;
            }
            handleSearch($pdo, $userId, $isPremium, $isAdmin, $userLang, $autoTrad);
            break;
            
        case 'search_image':
            if ($method !== 'POST') {
                http_response_code(405);
                echo json_encode(['success' => false, 'error' => __('api.method_not_allowed')]);
                exit;
            }
            handleImageSearch($pdo, $userId, $isPremium, $isAdmin, $userLang, $autoTrad);
            break;
            
        case 'details':
            // Récupérer les détails complets d'un produit
            handleGetDetails($pdo, $userId, $isPremium, $isAdmin, $userLang, $autoTrad);
            break;
            
        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => __('api.invalid_action')]);
    }
} catch (PDOException $e) {
    loger('web_search_api', 'ERROR', 'Database error', ['error' => $e->getMessage()]);
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => __('api.server_error')]);
} catch (Exception $e) {
    loger('web_search_api', 'ERROR', 'General error', ['error' => $e->getMessage()]);
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

/**
 * Récupérer la clé API Rebrickable (admin ou utilisateur)
 * Utilisée pour l'enrichissement des données LEGO
 * 
 * @param PDO $pdo
 * @param int $userId
 * @return string|null
 */
function getRebrickableApiKey(PDO $pdo, int $userId): ?string
{
    // D'abord chercher la clé admin
    $adminStmt = $pdo->prepare("SELECT id, api_key, USER_API FROM Admin_webApi WHERE name = 'rebrickable' LIMIT 1");
    $adminStmt->execute();
    $providerInfo = $adminStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$providerInfo) {
        return null;
    }
    
    // Si une clé admin existe et USER_API n'est pas requis, l'utiliser
    if (!empty($providerInfo['api_key']) && !$providerInfo['USER_API']) {
        return $providerInfo['api_key'];
    }
    
    // Chercher la clé utilisateur
    $userStmt = $pdo->prepare("SELECT api_key FROM users_api WHERE user_id = ? AND webapi_id = ?");
    $userStmt->execute([$userId, $providerInfo['id']]);
    $userKey = $userStmt->fetch(PDO::FETCH_ASSOC);
    
    if ($userKey && !empty($userKey['api_key'])) {
        return $userKey['api_key'];
    }
    
    // Fallback sur la clé admin même si USER_API est true (pour les admins qui ont configuré une clé globale)
    if (!empty($providerInfo['api_key'])) {
        return $providerInfo['api_key'];
    }
    
    return null;
}

/**
 * GET - Récupérer la liste des fournisseurs
 */
function handleGetProviders(PDO $pdo, bool $isPremium, bool $isAdmin): void
{
    $type = $_GET['type'] ?? null;
    
    // Types disponibles (récupérés dynamiquement depuis Admin_webApi.Type)
    $typesStmt = $pdo->query("SELECT DISTINCT Type FROM Admin_webApi WHERE Type IS NOT NULL ORDER BY Type");
    $typeRows = $typesStmt->fetchAll(PDO::FETCH_COLUMN);
    
    $types = [];
    foreach ($typeRows as $typeKey) {
        // Traduction dynamique avec fallback sur le nom capitalisé
        $translationKey = 'web_search.type_' . $typeKey;
        $translated = __($translationKey);
        // Si pas de traduction, utiliser le nom avec première lettre majuscule
        $types[$typeKey] = ($translated !== $translationKey) ? $translated : ucfirst(str_replace('_', ' ', $typeKey));
    }
    
    // Mapping webapi_type vers primary_type_id (depuis primary_type)
    $typeMapping = [];
    $mappingStmt = $pdo->query("SELECT webapi_type, id FROM primary_type WHERE webapi_type IS NOT NULL");
    while ($row = $mappingStmt->fetch(PDO::FETCH_ASSOC)) {
        $webapiType = $row['webapi_type'];
        // Ne garder que le premier primary_type_id pour chaque webapi_type (éviter doublons)
        if (!isset($typeMapping[$webapiType])) {
            $typeMapping[$webapiType] = (int)$row['id'];
        }
    }
    
    // Construction de la requête
    $sql = "SELECT id, name, Name_UF, Type, Defaut_active, USER_API, READ_CODE, has_details, PREMIUM_ONLY,
                   max_results_premium, max_results_free
            FROM Admin_webApi";
    $params = [];
    
    // Filtrer par type si spécifié
    if ($type && $type !== 'all') {
        $sql .= " WHERE Type = :type";
        $params[':type'] = $type;
    }
    
    $sql .= " ORDER BY Type, Name_UF";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $providers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Filtrer les fournisseurs accessibles selon le niveau utilisateur
    $accessibleProviders = [];
    foreach ($providers as $provider) {
        // USER_API = 1 signifie que c'est réservé aux premium/admin
        if ($provider['USER_API'] && !$isPremium) {
            continue; // Pas accessible pour les utilisateurs gratuits
        }
        
        // Déterminer le nombre max de résultats
        $maxResults = $isPremium ? $provider['max_results_premium'] : $provider['max_results_free'];
        
        $accessibleProviders[] = [
            'id' => (int)$provider['id'],
            'name' => $provider['name'],
            'display_name' => $provider['Name_UF'],
            'type' => $provider['Type'],
            'default_active' => (bool)$provider['Defaut_active'],
            'supports_barcode' => (bool)$provider['READ_CODE'],
            'has_details' => (bool)$provider['has_details'],
            'requires_user_key' => (bool)$provider['USER_API'],
            'premium_only' => (bool)$provider['PREMIUM_ONLY'],
            'max_results' => (int)$maxResults,
        ];
    }
    
    // Récupérer les fournisseurs par défaut pour chaque type primaire
    $defaultProvidersByType = [];
    $stmt = $pdo->query("
        SELECT pt.id as primary_type_id, pt.name as primary_type_name, pt.webapi_type,
               ptdp.webapi_id, ptdp.sort_order
        FROM primary_type pt
        LEFT JOIN primary_type_default_providers ptdp ON pt.id = ptdp.primary_type_id
        ORDER BY pt.id, ptdp.sort_order
    ");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($rows as $row) {
        $ptId = (int)$row['primary_type_id'];
        if (!isset($defaultProvidersByType[$ptId])) {
            $defaultProvidersByType[$ptId] = [
                'name' => $row['primary_type_name'],
                'webapi_type' => $row['webapi_type'],
                'provider_ids' => []
            ];
        }
        if ($row['webapi_id']) {
            $defaultProvidersByType[$ptId]['provider_ids'][] = (int)$row['webapi_id'];
        }
    }
    
    echo json_encode([
        'success' => true,
        'data' => [
            'types' => $types,
            'type_mapping' => $typeMapping,
            'providers' => $accessibleProviders,
            'default_providers_by_type' => $defaultProvidersByType,
            'user_is_premium' => $isPremium,
            'user_is_admin' => $isAdmin,
        ]
    ]);
}

/**
 * POST - Lancer une recherche textuelle
 */
function handleSearch(PDO $pdo, int $userId, bool $isPremium, bool $isAdmin, string $userLang, bool $autoTrad = false): void
{
    $input = json_decode(file_get_contents('php://input'), true);
    
    $query = trim($input['query'] ?? '');
    $providerIds = $input['providers'] ?? [];
    $refresh = !empty($input['refresh']); // Force le rafraîchissement depuis les sources externes
    
    if (empty($query)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => __('web_search.error_empty_query')]);
        return;
    }
    
    if (empty($providerIds)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => __('web_search.error_no_provider')]);
        return;
    }
    
    // Convertir la langue utilisateur en locale pour l'API
    $locale = convertLangToLocale($userLang);
    
    // Vérifier que les fournisseurs sont accessibles
    $placeholders = implode(',', array_fill(0, count($providerIds), '?'));
    $sql = "SELECT id, name, Name_UF, Type, api_key, client_id, USER_API, PREMIUM_ONLY,
                   max_results_premium, max_results_free
            FROM Admin_webApi 
            WHERE id IN ($placeholders)";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($providerIds);
    $providers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Récupérer les clés API utilisateur pour les fournisseurs qui les requièrent
    // Inclut les providers parents pour les sous-variantes
    $userApiKeys = [];
    $userApiProviderIds = [];
    $parentProviderIds = []; // IDs des providers parents à récupérer
    
    foreach ($providers as $p) {
        if ($p['USER_API']) {
            $userApiProviderIds[] = (int)$p['id'];
            // Si c'est un provider enfant, récupérer aussi les clés du parent
            $parentId = getParentProviderId($pdo, $p['name']);
            if ($parentId !== null && !in_array($parentId, $parentProviderIds)) {
                $parentProviderIds[] = $parentId;
            }
        }
    }
    
    // Fusionner les IDs à chercher (providers + leurs parents)
    $allProviderIdsForKeys = array_unique(array_merge($userApiProviderIds, $parentProviderIds));
    
    if (!empty($allProviderIdsForKeys)) {
        $userPlaceholders = implode(',', array_fill(0, count($allProviderIdsForKeys), '?'));
        $userKeysSql = "SELECT webapi_id, api_key, Cliend_ID_Token as client_id 
                        FROM users_api 
                        WHERE user_id = ? AND webapi_id IN ($userPlaceholders)";
        $userKeysParams = array_merge([$userId], array_values($allProviderIdsForKeys));
        $stmt = $pdo->prepare($userKeysSql);
        $stmt->execute($userKeysParams);
        $userKeysRows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($userKeysRows as $row) {
            $userApiKeys[$row['webapi_id']] = [
                'api_key' => $row['api_key'],
                'client_id' => $row['client_id']
            ];
        }
    }
    
    // Fonction pour obtenir la clé API effective (du provider ou de son parent)
    $getEffectiveApiKey = function($providerId, $providerName) use ($userApiKeys, $pdo) {
        // D'abord vérifier si le provider a sa propre clé
        if (isset($userApiKeys[$providerId]) && !empty($userApiKeys[$providerId]['api_key'])) {
            return $userApiKeys[$providerId];
        }
        // Sinon, vérifier le parent
        $parentId = getParentProviderId($pdo, $providerName);
        if ($parentId !== null && isset($userApiKeys[$parentId]) && !empty($userApiKeys[$parentId]['api_key'])) {
            return $userApiKeys[$parentId];
        }
        return null;
    };
    
    // Vérifier les permissions
    foreach ($providers as $provider) {
        if ($provider['PREMIUM_ONLY'] && !$isPremium) {
            http_response_code(403);
            echo json_encode([
                'success' => false, 
                'error' => str_replace('%provider%', $provider['Name_UF'], __('web_search.error_premium_required'))
            ]);
            return;
        }
        
        // Vérifier que l'utilisateur a configuré sa clé si requise (ou celle du parent)
        if ($provider['USER_API']) {
            $effectiveKey = $getEffectiveApiKey($provider['id'], $provider['name']);
            if (empty($effectiveKey['api_key'])) {
                // Afficher le nom du provider parent si applicable
                $parentName = getParentProviderName($provider['name']);
                $displayName = ($parentName !== $provider['name']) 
                    ? $provider['Name_UF'] . ' (' . $parentName . ')' 
                    : $provider['Name_UF'];
                http_response_code(400);
                echo json_encode([
                    'success' => false, 
                    'error' => sprintf(__('web_search.error_user_key_required'), $displayName)
                ]);
                return;
            }
        }
    }
    
    // Lancer les recherches vers l'API toys_api
    $results = [];
    
    foreach ($providers as $provider) {
        $maxResults = $isPremium ? (int)$provider['max_results_premium'] : (int)$provider['max_results_free'];
        
        // Utiliser les clés utilisateur si USER_API = 1, sinon les clés admin
        $apiKey = $provider['api_key'];
        $clientId = $provider['client_id'];
        
        if ($provider['USER_API']) {
            $effectiveKey = $getEffectiveApiKey($provider['id'], $provider['name']);
            if ($effectiveKey) {
                $apiKey = $effectiveKey['api_key'];
                $clientId = $effectiveKey['client_id'] ?: $clientId;
                $parentName = getParentProviderName($provider['name']);
                $isUsingParentKey = ($parentName !== $provider['name'] && !isset($userApiKeys[$provider['id']]));
                loger('web_search_api', 'DEBUG', 'Using user API key', [
                    'provider' => $provider['name'],
                    'has_key' => !empty($apiKey),
                    'using_parent_key' => $isUsingParentKey,
                    'parent' => $isUsingParentKey ? $parentName : null,
                ]);
            }
        }
        
        // Appeler l'API externe pour ce fournisseur
        $providerResults = callToysApi(
            $provider['name'], 
            $query, 
            $maxResults, 
            $locale,
            $apiKey,
            $clientId,
            $autoTrad,
            $refresh
        );
        
        $results[] = [
            'provider_id' => (int)$provider['id'],
            'provider_name' => $provider['Name_UF'],
            'provider_type' => $provider['Type'],
            'query' => $query,
            'results_count' => count($providerResults),
            'results' => $providerResults,
        ];
    }
    
    // Logger la recherche
    loger('web_search', 'INFO', 'Search performed', [
        'user_id' => $userId,
        'query' => $query,
        'providers' => array_column($providers, 'name'),
        'results_count' => array_sum(array_column($results, 'results_count')),
        'locale' => $locale,
    ]);
    
    echo json_encode([
        'success' => true,
        'data' => [
            'query' => $query,
            'total_results' => array_sum(array_column($results, 'results_count')),
            'providers_results' => $results,
        ]
    ]);
}

/**
 * POST - Recherche par image (OCR/barcode)
 */
function handleImageSearch(PDO $pdo, int $userId, bool $isPremium, bool $isAdmin, string $userLang, bool $autoTrad = false): void
{
    // Vérifier qu'une image a été envoyée
    if (!isset($_FILES['image']) && !isset($_POST['image_data'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => __('web_search.error_no_image')]);
        return;
    }
    
    $providerIds = isset($_POST['providers']) ? json_decode($_POST['providers'], true) : [];
    $searchType = $_POST['search_type'] ?? 'barcode'; // barcode ou ocr
    
    // TODO: Implémenter la détection de code-barre et OCR
    // Pour l'instant, retourner une réponse simulée
    
    $detectedCode = null;
    $detectedText = null;
    
    if ($searchType === 'barcode') {
        // Simuler la détection d'un code-barre
        $detectedCode = '9780141036144'; // ISBN de test
    } else {
        // Simuler l'OCR
        $detectedText = 'Sample detected text';
    }
    
    echo json_encode([
        'success' => true,
        'data' => [
            'search_type' => $searchType,
            'detected_code' => $detectedCode,
            'detected_text' => $detectedText,
            'message' => __('web_search.image_processed'),
        ]
    ]);
}

/**
 * GET - Récupérer les détails complets d'un produit
 * Paramètres: provider (lego, rawg, etc.), product_id (ID du produit)
 */
function handleGetDetails(PDO $pdo, int $userId, bool $isPremium, bool $isAdmin, string $userLang, bool $autoTrad = false): void
{
    $provider = $_GET['provider'] ?? '';
    $productId = $_GET['product_id'] ?? '';
    $refresh = !empty($_GET['refresh']); // Force le rafraîchissement depuis les sources externes
    
    if (empty($provider) || empty($productId)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Provider et product_id requis']);
        return;
    }
    
    $locale = convertLangToLocale($userLang);
    
    // Vérifier si le provider nécessite un accès premium
    // On cherche d'abord par name, puis par alias (pour les sous-providers comme deezer, discogs → music)
    // FIND_IN_SET cherche dans une liste séparée par des virgules
    $providerStmt = $pdo->prepare("SELECT id, name, alias, api_key, client_id, USER_API, PREMIUM_ONLY, READ_CODE FROM Admin_webApi WHERE name = ? OR FIND_IN_SET(?, alias) > 0 LIMIT 1");
    $providerStmt->execute([$provider, $provider]);
    $providerInfo = $providerStmt->fetch(PDO::FETCH_ASSOC);
    
    if ($providerInfo && $providerInfo['PREMIUM_ONLY'] && !$isPremium && !$isAdmin) {
        http_response_code(403);
        echo json_encode(['success' => false, 'error' => 'Ce fournisseur nécessite un abonnement premium']);
        return;
    }
        

    // $productId contient le chemin complet (ex: /rebrickable/details?detailUrl=%2Frebrickable%2Fset%2F40658-1)
    $url = TOYS_API_BASE_URL . $productId;

    // Paramètres de base (sauf pour Amazon qui n'utilise pas lang)
    $params = ['lang' => $locale];
    
    // Headers de base
    $headers = [
        'Accept: application/json',
        'User-Agent: SnowShelf/1.0',
    ];
    
    // Récupérer les clés API du provider principal
    $apiKey = null;
    $clientId = null;
    
    if ($providerInfo) {
        $apiKey = $providerInfo['api_key'];
        $clientId = $providerInfo['client_id'];
        
        // Si USER_API est requis, récupérer la clé de l'utilisateur (ou du provider parent)
        if ($providerInfo['USER_API']) {
            $userApiKey = null;
            $userClientId = null;
            
            // D'abord chercher la clé pour ce provider
            $userStmt = $pdo->prepare("SELECT api_key, Cliend_ID_Token FROM users_api WHERE user_id = ? AND webapi_id = ?");
            $userStmt->execute([$userId, $providerInfo['id']]);
            $userKeys = $userStmt->fetch(PDO::FETCH_ASSOC);
            
            if ($userKeys && !empty($userKeys['api_key'])) {
                $userApiKey = $userKeys['api_key'];
                $userClientId = $userKeys['Cliend_ID_Token'];
            } else {
                // Sinon, vérifier si ce provider a un parent et récupérer ses clés
                $parentId = getParentProviderId($pdo, $providerInfo['name']);
                if ($parentId !== null) {
                    $parentStmt = $pdo->prepare("SELECT api_key, Cliend_ID_Token FROM users_api WHERE user_id = ? AND webapi_id = ?");
                    $parentStmt->execute([$userId, $parentId]);
                    $parentKeys = $parentStmt->fetch(PDO::FETCH_ASSOC);
                    if ($parentKeys && !empty($parentKeys['api_key'])) {
                        $userApiKey = $parentKeys['api_key'];
                        $userClientId = $parentKeys['Cliend_ID_Token'];
                        $parentName = getParentProviderName($providerInfo['name']);
                        loger('web_search_api', 'DEBUG', 'Using parent provider API key', [
                            'provider' => $provider,
                            'parent' => $parentName,
                            'user_id' => $userId,
                        ]);
                    }
                }
            }
            
            if ($userApiKey) {
                $apiKey = $userApiKey;
                $clientId = $userClientId ?: $clientId;
            } elseif (empty($providerInfo['api_key'])) {
                // USER_API requis mais aucune clé disponible (ni directe, ni parent)
                $parentName = getParentProviderName($providerInfo['name']);
                loger('web_search_api', 'WARNING', 'User API key required but not found', [
                    'provider' => $provider,
                    'parent' => ($parentName !== $providerInfo['name']) ? $parentName : null,
                    'user_id' => $userId,
                ]);
            }
        }
    }
    
    // ========================================
    // Gestion de l'enrichissement cross-provider
    // ========================================

    // IGDB nécessite le format "clientId:clientSecret" dans X-Api-Key (authentification Twitch)
    if ($provider === 'igdb' && $clientId && $apiKey) {
        $combinedKey = $clientId . ':' . $apiKey;
        if (API_ENCRYPTION_KEY) {
            $encryptedKey = encryptApiKey($combinedKey);
            if ($encryptedKey) {
                $headers[] = 'X-Encrypted-Key: ' . $encryptedKey;
            }
        } else {
            $headers[] = 'X-Api-Key: ' . $combinedKey;
        }
        loger('web_search_api', 'DEBUG', 'IGDB: Using combined clientId:clientSecret format');
    }
    // Autres providers : clé simple ou séparée
    else {
        if ($apiKey) {
            if (API_ENCRYPTION_KEY) {
                $encryptedKey = encryptApiKey($apiKey);
                if ($encryptedKey) {
                    $headers[] = 'X-Encrypted-Key: ' . $encryptedKey;
                }
            } else {
                $headers[] = 'X-Api-Key: ' . $apiKey;
            }
        }
        if ($clientId && $provider !== 'igdb') {
            if (API_ENCRYPTION_KEY) {
                $encryptedClientId = encryptApiKey($clientId);
                if ($encryptedClientId) {
                    $headers[] = 'X-Encrypted-Client-Id: ' . $encryptedClientId;
                }
            } else {
                $headers[] = 'X-Client-Id: ' . $clientId;
            }
        }
    }
    
    
    // Ajouter les paramètres à l'URL seulement s'il y en a
    if (!empty($params)) {
        // Vérifier si l'URL a déjà des paramètres (contient déjà ?)
        $separator = str_contains($url, '?') ? '&' : '?';
        $url .= $separator . http_build_query($params);
    }
    
    // Ajouter autoTrad=1 si l'utilisateur a activé l'auto-traduction (premium uniquement)
    if ($autoTrad) {
        $separator = str_contains($url, '?') ? '&' : '?';
        $url .= $separator . 'autoTrad=1';
    }
    
    // Ajouter refresh=true si demandé (force le rafraîchissement depuis les sources externes)
    if ($refresh) {
        $separator = str_contains($url, '?') ? '&' : '?';
        $url .= $separator . 'refresh=true';
    }
    
    loger('web_search_api', 'INFO', 'Fetching product details', [
        'provider' => $provider,
        'product_id' => $productId,
        'url' => $url,
        'has_api_key' => !empty($apiKey) || in_array('X-Api-Key', array_map(fn($h) => explode(':', $h)[0], $headers)),
        'enrich' => $params['enrich'] ?? false,
    ]);
    
    // Appeler l'API
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_FOLLOWLOCATION => true,
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        loger('web_search_api', 'ERROR', 'Details API call failed', [
            'provider' => $provider,
            'product_id' => $productId,
            'error' => $error,
        ]);
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Erreur lors de la récupération des détails']);
        return;
    }
    
    if ($httpCode !== 200) {
        loger('web_search_api', 'WARNING', 'Details API returned non-200', [
            'provider' => $provider,
            'product_id' => $productId,
            'http_code' => $httpCode,
            'response' => substr($response, 0, 500),
        ]);
        
        // Tenter de décoder l'erreur JSON de l'API externe
        $errorData = json_decode($response, true);
        $errorMessage = 'Produit non trouvé';
        
        if ($errorData && isset($errorData['error'])) {
            $errorMessage = 'Erreur API externe: ' . $errorData['error'];
            loger('web_search_api', 'ERROR', 'External API error', [
                'provider' => $provider,
                'product_id' => $productId,
                'external_error' => $errorData['error'],
            ]);
        }
        
        // Toujours retourner du JSON propre
        http_response_code(200); // Retourner 200 pour éviter les erreurs de parsing côté client
        echo json_encode([
            'success' => false, 
            'error' => $errorMessage,
            'http_code' => $httpCode,
            'provider' => $provider,
        ]);
        return;
    }
    
    $data = json_decode($response, true);
    
    if (!$data) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => 'Réponse invalide de l\'API']);
        return;
    }
    
    // LOG DÉTAILLÉ : Afficher la réponse complète
    loger('web_search_api', 'DEBUG', 'Product details raw response', [
        'provider' => $provider,
        'product_id' => $productId,
        'response' => json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT),
    ]);
    
    // Normaliser le résultat détaillé
    // $normalizedDetails = normalizeDetailedItem($provider, $data);
    
    // // Log après normalisation pour debug
    // loger('web_search_api', 'DEBUG', 'Normalized details', [
    //     'provider' => $provider,
    //     'normalized' => json_encode($normalizedDetails, JSON_UNESCAPED_UNICODE),
    // ]);
    
    echo json_encode([
        'success' => true,
        'data' => $data,
        'webapi_id' => $providerInfo ? (int)$providerInfo['id'] : null,
        'provider' => $provider,
    ]);
}

/**
 * Parser une checklist Paninimania et calculer le total d'images
 * Ex: "1 à 128" => total=128, "1 à 128 et H1 à H6" => total=134
 * Ex: "1 à 240" => total=240, "1 à 240 et F1 à F10" => total=250
 * Ex: "1 à 228, A à R" => total=228 + 18 = 246 (A-R = 18 lettres)
 */
function parseChecklistData($checklist): array
{
    // Si checklist est null ou vide
    if (!$checklist) {
        return ['total' => null, 'ranges' => []];
    }
    
    // Si checklist est déjà un objet/array avec les données parsées
    if (is_array($checklist)) {
        // Format toys_api: {raw, total, items}
        if (isset($checklist['total'])) {
            return [
                'total' => (int)$checklist['total'],
                'ranges' => [], // Pas besoin de parser, on a déjà le total
                'items' => $checklist['items'] ?? [],
                'raw' => $checklist['raw'] ?? null,
            ];
        }
        // Autre format array non supporté
        return ['total' => null, 'ranges' => []];
    }
    
    // Si checklist est une string, la parser
    if (!is_string($checklist)) {
        return ['total' => null, 'ranges' => []];
    }
    
    $totalStickers = 0;
    $ranges = [];
    
    // Séparer par "et", "+", "," ou ";"
    $parts = preg_split('/\s+et\s+|\s*\+\s*|\s*,\s*|\s*;\s*/i', $checklist);
    
    foreach ($parts as $part) {
        $part = trim($part);
        if (empty($part)) continue;
        
        // Format numérique: "1 à 128" ou "1-128" ou "1 - 128"
        if (preg_match('/^(\d+)\s*(?:à|-)\s*(\d+)$/i', $part, $matches)) {
            $start = (int)$matches[1];
            $end = (int)$matches[2];
            $count = $end - $start + 1;
            $totalStickers += $count;
            $ranges[] = ['start' => $start, 'end' => $end, 'count' => $count, 'prefix' => '', 'type' => 'numeric'];
        }
        // Format alphabétique pur: "A à R" ou "A-Z" (lettres simples)
        elseif (preg_match('/^([A-Za-z])\s*(?:à|-)\s*([A-Za-z])$/i', $part, $matches)) {
            $startLetter = strtoupper($matches[1]);
            $endLetter = strtoupper($matches[2]);
            $start = ord($startLetter);
            $end = ord($endLetter);
            $count = $end - $start + 1;
            if ($count > 0) {
                $totalStickers += $count;
                $ranges[] = ['start' => $startLetter, 'end' => $endLetter, 'count' => $count, 'prefix' => '', 'type' => 'alpha'];
            }
        }
        // Format avec préfixe et chiffres: "H1 à H6" ou "F1 à F10" ou "A1-A20"
        elseif (preg_match('/^([A-Za-z]+)(\d+)\s*(?:à|-)\s*\1?(\d+)$/i', $part, $matches)) {
            $prefix = strtoupper($matches[1]);
            $start = (int)$matches[2];
            $end = (int)$matches[3];
            $count = $end - $start + 1;
            $totalStickers += $count;
            $ranges[] = ['start' => $start, 'end' => $end, 'count' => $count, 'prefix' => $prefix, 'type' => 'prefixed'];
        }
        // Format avec préfixe explicite des 2 côtés: "H1 à K6"
        elseif (preg_match('/^([A-Za-z]+)(\d+)\s*(?:à|-)\s*([A-Za-z]+)(\d+)$/i', $part, $matches)) {
            $prefix = strtoupper($matches[1]);
            $start = (int)$matches[2];
            $end = (int)$matches[4];
            $count = $end - $start + 1;
            $totalStickers += $count;
            $ranges[] = ['start' => $start, 'end' => $end, 'count' => $count, 'prefix' => $prefix, 'type' => 'prefixed'];
        }
    }
    
    return [
        'total' => $totalStickers > 0 ? $totalStickers : null,
        'ranges' => $ranges,
        'raw' => $checklist,  // Conserver la string originale
        'items' => generateChecklistItems($ranges),  // Générer la liste des items
    ];
}

/**
 * Générer la liste des items à partir des ranges parsés
 * @param array $ranges Les ranges parsés (numeric, alpha, prefixed)
 * @return array Liste des items (ex: ["1", "2", "3", "A", "B", "C", "H1", "H2"])
 */
function generateChecklistItems(array $ranges): array
{
    $items = [];
    
    foreach ($ranges as $range) {
        $type = $range['type'] ?? 'numeric';
        $prefix = $range['prefix'] ?? '';
        
        if ($type === 'alpha') {
            // Items alphabétiques: A, B, C, ...
            $startOrd = ord($range['start']);
            $endOrd = ord($range['end']);
            for ($i = $startOrd; $i <= $endOrd; $i++) {
                $items[] = chr($i);
            }
        } elseif ($type === 'prefixed') {
            // Items avec préfixe: H1, H2, H3, ...
            for ($i = $range['start']; $i <= $range['end']; $i++) {
                $items[] = $prefix . $i;
            }
        } else {
            // Items numériques: 1, 2, 3, ...
            for ($i = $range['start']; $i <= $range['end']; $i++) {
                $items[] = (string)$i;
            }
        }
    }
    
    return $items;
}


/**
 * Convertir la langue utilisateur (fr, en) en locale complète (fr-FR, en-US)
 */
function convertLangToLocale(string $lang): string
{
    $locales = [
        'fr' => 'fr-FR',
        'en' => 'en-US',
        'de' => 'de-DE',
        'es' => 'es-ES',
        'it' => 'it-IT',
    ];
    
    return $locales[$lang] ?? 'fr-FR';
}

/**
 * Construire les paramètres de requête selon le fournisseur
 * L'API toys_api utilise des paramètres harmonisés : q, max, lang
 * Les endpoints correspondent directement aux noms des providers
 */
function buildApiParams(string $providerName, string $query, int $maxResults, string $locale): array
{
    // Extraire le code langue simple (fr, en) de la locale (fr-FR, en-US)
    $langShort = substr($locale, 0, 2);
    
    // Barcode : pas de query, juste la langue (le code est dans l'URL)
    if ($providerName === 'barcode') {
        return ['lang' => $langShort];
    }
    
    // Paramètres harmonisés pour tous les providers
    return [
        'q' => $query,
        'max' => $maxResults,
        'lang' => $langShort,
    ];
}

/**
 * Recherche dans la base de données locale snow_shelf_DB.Platform
 * 
 * @param string $query Terme de recherche
 * @param int $maxResults Nombre max de résultats
 * @param string $locale Langue de l'utilisateur (fr, en, es)
 * @return array Résultats formatés
 */
function searchLocalPlatformDb(string $query, int $maxResults, string $locale): array
{
    try {
        // Utiliser la fonction centralisée de connexion à la base Platform
        $pdoPlatform = getPlatformDbConnection();
        
        // Préparer les termes de recherche (insensible à la casse)
        $searchTerm = '%' . $query . '%';
        $searchTermLower = '%' . strtolower($query) . '%';
        
        // Requête : chercher dans name et altername (JSON converti en texte)
        // On compare aussi en supprimant les espaces/tirets pour matcher "megadrive" avec "Mega Drive"
        $sql = "
            SELECT 
                id, name, release_date, developer, manufacturer,
                cpu, memory, graphics, sound, display, media, max_controllers,
                desc_en, desc_fr, desc_es,
                altername, img
            FROM Platform
            WHERE 
                LOWER(name) LIKE LOWER(:search)
                OR LOWER(altername) LIKE :search_alt
                OR LOWER(REPLACE(REPLACE(name, ' ', ''), '-', '')) LIKE LOWER(REPLACE(REPLACE(:search_nospace, ' ', ''), '-', ''))
                OR LOWER(REPLACE(REPLACE(altername, ' ', ''), '-', '')) LIKE LOWER(REPLACE(REPLACE(:search_alt_nospace, ' ', ''), '-', ''))
            ORDER BY 
                CASE WHEN LOWER(name) LIKE LOWER(:search_exact) THEN 0 ELSE 1 END,
                name ASC
            LIMIT :max_results
        ";
        
        $stmt = $pdoPlatform->prepare($sql);
        $stmt->bindValue(':search', $searchTerm, PDO::PARAM_STR);
        $stmt->bindValue(':search_alt', $searchTermLower, PDO::PARAM_STR);
        $stmt->bindValue(':search_nospace', $searchTerm, PDO::PARAM_STR);
        $stmt->bindValue(':search_alt_nospace', $searchTermLower, PDO::PARAM_STR);
        $stmt->bindValue(':search_exact', $query, PDO::PARAM_STR);
        $stmt->bindValue(':max_results', $maxResults, PDO::PARAM_INT);
        $stmt->execute();
        
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        // Déterminer la colonne de description selon la langue
        $descColumn = 'desc_en'; // Par défaut anglais
        $langShort = substr($locale, 0, 2);
        if (in_array($langShort, ['fr', 'en', 'es'])) {
            $descColumn = 'desc_' . $langShort;
        }
        
        // Formater les résultats
        $formattedResults = [];
        foreach ($results as $row) {
            // Décoder les JSON
            $altNames = json_decode($row['altername'] ?? '[]', true) ?: [];
            $images = json_decode($row['img'] ?? '[]', true) ?: [];
            
            // Prendre la première image si disponible
            $imageUrl = !empty($images) ? $images[0] : null;
            
            // Utiliser la description dans la langue de l'utilisateur, fallback sur anglais
            $description = $row[$descColumn] ?? $row['desc_en'] ?? '';
            
            // Construire les métadonnées techniques
            $technicalSpecs = array_filter([
                'cpu' => $row['cpu'],
                'memory' => $row['memory'],
                'graphics' => $row['graphics'],
                'sound' => $row['sound'],
                'display' => $row['display'],
                'media' => $row['media'],
                'max_controllers' => $row['max_controllers'],
            ], fn($v) => !empty($v));
            
            $formattedResults[] = [
                'id' => $row['id'],
                'name' => $row['name'],
                'description' => $description,
                'image' => $imageUrl,
                'release_date' => $row['release_date'],
                'developer' => $row['developer'],
                'manufacturer' => $row['manufacturer'],
                'alt_names' => $altNames,
                'technical_specs' => $technicalSpecs,
                'source' => 'snow_vg_db_plat',
            ];
        }
        
        loger('web_search_api', 'INFO', 'Local Platform DB search', [
            'query' => $query,
            'results_count' => count($formattedResults),
            'locale' => $locale
        ]);
        
        return $formattedResults;
        
    } catch (PDOException $e) {
        loger('web_search_api', 'ERROR', 'Local Platform DB search failed', [
            'query' => $query,
            'error' => $e->getMessage()
        ]);
        return [];
    }
}

/**
 * Appeler l'API toys_api pour un fournisseur donné
 */
function callToysApi(string $providerName, string $query, int $maxResults, string $locale, ?string $apiKey = null, ?string $clientId = null, bool $autoTrad = false, bool $refresh = false): array
{
    // Cas spécial : providers locaux (base de données interne)
    // if ($providerName === 'snow_vg_db_plat') {
    //     return searchLocalPlatformDb($query, $maxResults, $locale);
    // }
    
    // Construire l'endpoint dynamiquement : GET /{providerName}/search
    // Format harmonisé : tous les endpoints correspondent directement aux noms des providers
    
    // Construire les paramètres harmonisés
    $params = buildApiParams($providerName, $query, $maxResults, $locale);
    
    // Ajouter refresh=true si demandé (force le rafraîchissement depuis les sources externes)
    if ($refresh) {
        $params['refresh'] = 'true';
    }
    
    // Construire l'URL selon le type de provider
    if ($providerName === 'barcode') {
        // Barcode : GET /barcode/{code}?lang=xx
        $url = TOYS_API_BASE_URL . '/barcode/' . urlencode($query);
        if (!empty($params)) {
            $url .= '?' . http_build_query($params);
        }
    } else {
        // Tous les autres : GET /{providerName}/search?q=...&lang=...&max=...
        $url = TOYS_API_BASE_URL . '/' . $providerName . '/search?' . http_build_query($params);
    }
    
    // Ajouter autoTrad=1 si l'utilisateur a activé l'auto-traduction (premium uniquement)
    if ($autoTrad) {
        $url .= (str_contains($url, '?') ? '&' : '?') . 'autoTrad=1';
    }
    
    // Préparer les headers
    $headers = [
        'Accept: application/json',
        'User-Agent: SnowShelf/1.0',
    ];
    
    // Ajouter la clé API si nécessaire (encryptée si API_ENCRYPTION_KEY est configurée)
    // IGDB nécessite le format "clientId:clientSecret" dans X-Api-Key (authentification Twitch)
    if ($providerName === 'igdb' && $apiKey && $clientId) {
        $combinedKey = $clientId . ':' . $apiKey;
        if (API_ENCRYPTION_KEY) {
            $encryptedKey = encryptApiKey($combinedKey);
            if ($encryptedKey) {
                $headers[] = 'X-Encrypted-Key: ' . $encryptedKey;
            } else {
                loger('web_search_api', 'ERROR', 'Échec encryption clé API IGDB', ['provider' => $providerName]);
            }
        } else {
            $headers[] = 'X-Api-Key: ' . $combinedKey;
        }
        loger('web_search_api', 'DEBUG', 'IGDB: Using combined clientId:clientSecret format');
    } else {
        // Autres providers : clé simple ou séparée
        if ($apiKey) {
            if (API_ENCRYPTION_KEY) {
                // Encrypter la clé avant envoi
                $encryptedKey = encryptApiKey($apiKey);
                if ($encryptedKey) {
                    $headers[] = 'X-Encrypted-Key: ' . $encryptedKey;
                } else {
                    loger('web_search_api', 'ERROR', 'Échec encryption clé API', ['provider' => $providerName]);
                }
            } else {
                // Pas d'encryption, envoyer en clair
                $headers[] = 'X-Api-Key: ' . $apiKey;
            }
        }
        if ($clientId && $providerName !== 'igdb') {
            if (API_ENCRYPTION_KEY) {
                // Encrypter le client ID aussi
                $encryptedClientId = encryptApiKey($clientId);
                if ($encryptedClientId) {
                    $headers[] = 'X-Encrypted-Client-Id: ' . $encryptedClientId;
                }
            } else {
                $headers[] = 'X-Client-Id: ' . $clientId;
            }
        }
    }
    
    // Log des headers pour debug (masquer les valeurs sensibles)
    $headerKeys = array_map(fn($h) => explode(':', $h)[0], $headers);
    loger('web_search_api', 'DEBUG', 'API call headers', [
        'provider' => $providerName,
        'url' => $url,
        'header_keys' => $headerKeys,
        'has_api_key' => in_array('X-Api-Key', $headerKeys) || in_array('X-Encrypted-Key', $headerKeys),
    ]);
    
    // Appeler l'API
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_FOLLOWLOCATION => true,
    ]);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        loger('web_search_api', 'ERROR', 'API call failed', [
            'provider' => $providerName,
            'error' => $error,
            'url' => $url,
        ]);
        return [];
    }
    
    if ($httpCode !== 200) {
        loger('web_search_api', 'WARNING', 'API returned non-200', [
            'provider' => $providerName,
            'http_code' => $httpCode,
            'response' => substr($response, 0, 500),
        ]);
        return [];
    }
    
    $data = json_decode($response, true);
    
    if (!$data) {
        loger('web_search_api', 'ERROR', 'Invalid JSON response', [
            'provider' => $providerName,
            'response' => substr($response, 0, 500),
        ]);
        return [];
    }
    
    // LOG DÉTAILLÉ : Afficher la structure complète de la réponse API
    loger('web_search_api', 'DEBUG', 'API raw response', [
        'provider' => $providerName,
        'url' => $url,
        'response_keys' => array_keys($data),
        'response_sample' => json_encode(array_slice($data, 0, 2), JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT),
    ]);
    
    // Si c'est un tableau de résultats, logger le premier élément complet
    $firstItem = null;
    foreach (['products', 'results', 'items', 'data', 'sets', 'books', 'games'] as $key) {
        if (isset($data[$key]) && is_array($data[$key]) && !empty($data[$key])) {
            $firstItem = $data[$key][0];
            break;
        }
    }
    if ($firstItem) {
        loger('web_search_api', 'DEBUG', 'First item structure', [
            'provider' => $providerName,
            'first_item' => json_encode($firstItem, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT),
        ]);
    }
    
    // Transformer les résultats dans un format unifié
    return normalizeResults($providerName, $data, $maxResults);
}

/**
 * Normaliser les résultats de recherche depuis toys_api
 * L'API retourne maintenant un format harmonisé BASE_SEARCH_SCHEMA pour tous les providers
 */
function normalizeResults(string $providerName, array $data, int $maxResults): array
{
    $results = [];
    
    // L'API toys_api retourne les résultats sous la clé 'results'
    $products = $data['results'] ?? $data['data'] ?? $data['items'] ?? [];
    
    // Si pas de tableau, essayer de retourner les données directement (tableau indexé)
    if (empty($products) && is_array($data) && !empty($data)) {
        $firstKey = array_key_first($data);
        if (is_int($firstKey) || $firstKey === '0') {
            $products = $data;
        }
    }
    
    // Limiter au nombre max de résultats
    $products = array_slice($products, 0, $maxResults);
    
    foreach ($products as $item) {
        $normalized = normalizeSearchItem($providerName, $item);
        if ($normalized) {
            $results[] = $normalized;
        }
    }
    
    return $results;
}

/**
 * Normaliser un item de recherche depuis le format harmonisé BASE_SEARCH_SCHEMA
 * 
 * Format toys_api (BASE_SEARCH_SCHEMA) passé directement au frontend:
 * - type: Type de contenu (construct_toy, book, movie, etc.)
 * - source: Provider source (lego, playmobil, tmdb, etc.)
 * - sourceId: ID original du provider
 * - name: Nom affiché (traduit si disponible)
 * - name_original: Nom original si différent
 * - image: URL de l'image principale/thumbnail
 * - detailUrl: URL endpoint pour détails (ex: /lego/product/42217)
 */
function normalizeSearchItem(string $providerName, array $item): ?array
{
    // Vérifier que les champs essentiels sont présents
    $name = $item['name'] ?? $item['title'] ?? null;
    if (empty($name)) {
        return null;
    }
    
    // Passer directement le format toys_api au frontend
    // On ajoute juste le provider si non présent
    return [
        'type' => $item['type'] ?? 'generic',
        'source' => $item['source'] ?? $providerName,
        'sourceId' => $item['sourceId'] ?? $item['id'] ?? uniqid(),
        'name' => $name,
        'name_original' => $item['name_original'] ?? null,
        'image' => $item['image'] ?? null,
        'detailUrl' => $item['detailUrl'] ?? null,
        'description' => $item['description'] ?? null,
        'year' => $item['year'] ?? null,
        'src_url' => $item['src_url'] ?? null
    ];
}

