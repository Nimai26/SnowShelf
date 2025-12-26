<?php
/**
 * SnowShelf - API de chargement des fragments de page (SPA)
 * Retourne le contenu HTML des différentes sections
 */

session_start();
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../core/SiteConfig.php';
require_once __DIR__ . '/../../core/i18n.php';

// Vérifier l'authentification
if (!isset($_SESSION['user_id'])) {
    header('Content-Type: application/json');
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Non authentifié']);
    exit;
}

header('Content-Type: application/json');

// Récupérer la page demandée
$page = isset($_GET['page']) ? trim($_GET['page']) : 'home';

// Liste des pages autorisées
$allowedPages = ['home', 'account', 'collection', 'categories', 'scan', 'wishlist', 'explore', 'community', 'stats'];

if (!in_array($page, $allowedPages)) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Page non trouvée']);
    exit;
}

// Configuration des pages
$pageConfig = [
    'home' => [
        'title' => __('dashboard.home'),
        'view' => 'home.php',
        'scripts' => [],
        'css' => []
    ],
    'account' => [
        'title' => __('account.title'),
        'view' => 'account.php',
        'scripts' => [],  // account.js sera chargé uniquement si nécessaire, le router gère cela
        'css' => []       // account.css est déjà dans dashboard.css, ou sera ajouté séparément
    ],
    'collection' => [
        'title' => __('dashboard.my_collection'),
        'view' => 'collection.php',
        'scripts' => [],
        'css' => []
    ],
    'categories' => [
        'title' => __('categories_page.title'),
        'view' => 'categories.php',
        'scripts' => ['assets/js/categories.js?v=' . filemtime(__DIR__ . '/../assets/js/categories.js')],
        'css' => ['assets/css/categories.css?v=' . filemtime(__DIR__ . '/../assets/css/categories.css')]
    ],
    'scan' => [
        'title' => __('dashboard.scan'),
        'view' => 'scan.php',
        'scripts' => [],
        'css' => []
    ],
    'wishlist' => [
        'title' => __('dashboard.wishlist'),
        'view' => 'wishlist.php',
        'scripts' => [],
        'css' => []
    ],
    'explore' => [
        'title' => __('dashboard.explore'),
        'view' => 'explore.php',
        'scripts' => [],
        'css' => []
    ],
    'community' => [
        'title' => __('dashboard.community'),
        'view' => 'community.php',
        'scripts' => [],
        'css' => []
    ],
    'stats' => [
        'title' => __('dashboard.stats'),
        'view' => 'stats.php',
        'scripts' => [],
        'css' => []
    ]
];

$config = $pageConfig[$page];
$viewPath = __DIR__ . '/../views/' . $config['view'];

// Vérifier que le fichier de vue existe
if (!file_exists($viewPath)) {
    // Retourner un placeholder si la vue n'existe pas encore
    $html = generatePlaceholder($page, $config['title']);
} else {
    // Capturer le contenu du fichier de vue
    ob_start();
    
    // Variables disponibles dans la vue
    $userId = $_SESSION['user_id'];
    $userName = $_SESSION['username'] ?? '';
    $isAdmin = $_SESSION['is_admin'] ?? false;
    $isPremium = $_SESSION['is_premium'] ?? false;
    
    // Charger les données nécessaires selon la page
    try {
        $pdo = getDbConnection();
        
        // Charger les données utilisateur pour certaines pages
        if (in_array($page, ['account', 'home', 'categories'])) {
            $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
            $stmt->execute([$userId]);
            $userData = $stmt->fetch(PDO::FETCH_ASSOC);
        }
        
        // Inclure la vue
        include $viewPath;
        
    } catch (Exception $e) {
        ob_end_clean();
        http_response_code(500);
        echo json_encode(['success' => false, 'message' => 'Erreur lors du chargement des données']);
        exit;
    }
    
    $html = ob_get_clean();
}

// Retourner la réponse JSON
echo json_encode([
    'success' => true,
    'html' => $html,
    'title' => $config['title'],
    'scripts' => $config['scripts'],
    'css' => $config['css'],
    'page' => $page
]);

/**
 * Génère un placeholder pour les pages non encore implémentées
 */
function generatePlaceholder(string $page, string $title): string {
    $icons = [
        'home' => '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9,22 9,12 15,12 15,22"></polyline></svg>',
        'collection' => '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>',
        'scan' => '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 7V5a2 2 0 0 1 2-2h2"></path><path d="M17 3h2a2 2 0 0 1 2 2v2"></path><path d="M21 17v2a2 2 0 0 1-2 2h-2"></path><path d="M7 21H5a2 2 0 0 1-2-2v-2"></path><line x1="7" y1="12" x2="17" y2="12"></line></svg>',
        'wishlist' => '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>',
        'explore' => '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><polygon points="16.24,7.76 14.12,14.12 7.76,16.24 9.88,9.88"></polygon></svg>',
        'community' => '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
        'stats' => '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>'
    ];
    
    $icon = $icons[$page] ?? $icons['home'];
    $comingSoon = __('common.coming_soon');
    $workInProgress = __('common.work_in_progress');
    
    return <<<HTML
<div class="placeholder-page">
    <div class="placeholder-content">
        <div class="placeholder-icon">
            {$icon}
        </div>
        <h1>{$title}</h1>
        <p class="placeholder-subtitle">{$comingSoon}</p>
        <p class="placeholder-description">{$workInProgress}</p>
    </div>
</div>
HTML;
}
