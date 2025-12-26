<?php
/**
 * SnowShelf - Authentification API
 * 
 * Gère l'authentification et l'autorisation des requêtes API
 */

class ApiAuth
{
    /** @var PDO Instance de base de données */
    private PDO $db;
    
    /** @var array|null Utilisateur authentifié */
    private ?array $user = null;
    
    /** @var string Clé secrète pour les tokens JWT */
    private string $jwtSecret;
    
    /**
     * Constructeur
     */
    public function __construct(PDO $db)
    {
        $this->db = $db;
        $this->jwtSecret = $_ENV['JWT_SECRET'] ?? 'snowshelf_default_secret_change_me_in_production';
    }
    
    /**
     * Authentifie une requête API
     * 
     * @return array|null Données utilisateur ou null si non authentifié
     */
    public function authenticate(): ?array
    {
        // Charger le logger si disponible
        $loggerPath = __DIR__ . '/logger.php';
        if (file_exists($loggerPath)) {
            require_once $loggerPath;
            loger('apiauth', 'DEBUG', 'authenticate() appelée', [
                'session_status_before' => session_status(),
                'session_id_before' => session_id()
            ]);
        }
        
        // Vérifier d'abord la session PHP
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
            if (function_exists('loger')) {
                loger('apiauth', 'DEBUG', 'Session démarrée', [
                    'session_id' => session_id()
                ]);
            }
        }
        
        if (function_exists('loger')) {
            loger('apiauth', 'DEBUG', 'État session après start', [
                'session_status' => session_status(),
                'session_id' => session_id(),
                'session_user_id' => $_SESSION['user_id'] ?? 'non défini',
                'session_keys' => array_keys($_SESSION ?? [])
            ]);
        }
        
        if (isset($_SESSION['user_id'])) {
            if (function_exists('loger')) {
                loger('apiauth', 'DEBUG', 'User ID trouvé en session', [
                    'user_id' => $_SESSION['user_id']
                ]);
            }
            $this->user = $this->getUserById($_SESSION['user_id']);
            if (function_exists('loger')) {
                loger('apiauth', 'DEBUG', 'Utilisateur récupéré de la BDD', [
                    'user' => $this->user ? ['id' => $this->user['id'], 'name' => $this->user['name']] : null
                ]);
            }
            return $this->user;
        }
        
        // Vérifier le token Bearer
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['HTTP_X_AUTHORIZATION'] ?? '';
        
        if (function_exists('loger')) {
            loger('apiauth', 'DEBUG', 'Pas de session, vérification token Bearer', [
                'auth_header' => $authHeader ? 'présent' : 'absent'
            ]);
        }
        
        if (preg_match('/Bearer\s+(.+)$/i', $authHeader, $matches)) {
            $token = $matches[1];
            $this->user = $this->validateToken($token);
            return $this->user;
        }
        
        // Vérifier le cookie remember_token
        if (isset($_COOKIE['snowshelf_remember'])) {
            if (function_exists('loger')) {
                loger('apiauth', 'DEBUG', 'Vérification cookie remember');
            }
            $this->user = $this->validateRememberToken($_COOKIE['snowshelf_remember']);
            return $this->user;
        }
        
        if (function_exists('loger')) {
            loger('apiauth', 'WARNING', 'Aucune méthode d\'authentification valide');
        }
        
        return null;
    }
    
    /**
     * Vérifie si l'utilisateur est authentifié
     */
    public function isAuthenticated(): bool
    {
        return $this->user !== null;
    }
    
    /**
     * Vérifie si l'utilisateur est admin
     */
    public function isAdmin(): bool
    {
        return $this->user !== null && (bool)($this->user['is_admin'] ?? false);
    }
    
    /**
     * Vérifie si l'utilisateur est premium
     * Note : Les administrateurs sont automatiquement considérés comme premium
     */
    public function isPremium(): bool
    {
        if ($this->user === null) {
            return false;
        }
        // Admin = automatiquement premium
        return (bool)($this->user['is_admin'] ?? false) || (bool)($this->user['is_premium'] ?? false);
    }
    
    /**
     * Retourne l'utilisateur authentifié
     */
    public function getUser(): ?array
    {
        return $this->user;
    }
    
    /**
     * Retourne l'ID de l'utilisateur authentifié
     */
    public function getUserId(): ?int
    {
        return $this->user['id'] ?? null;
    }
    
    /**
     * Génère un token API pour un utilisateur
     */
    public function generateToken(int $userId, int $expiresIn = 86400): string
    {
        $header = $this->base64UrlEncode(json_encode(['typ' => 'JWT', 'alg' => 'HS256']));
        
        $payload = $this->base64UrlEncode(json_encode([
            'user_id' => $userId,
            'iat' => time(),
            'exp' => time() + $expiresIn
        ]));
        
        $signature = $this->base64UrlEncode(
            hash_hmac('sha256', "{$header}.{$payload}", $this->jwtSecret, true)
        );
        
        return "{$header}.{$payload}.{$signature}";
    }
    
    /**
     * Valide un token JWT
     */
    private function validateToken(string $token): ?array
    {
        $parts = explode('.', $token);
        
        if (count($parts) !== 3) {
            return null;
        }
        
        [$header, $payload, $signature] = $parts;
        
        // Vérifier la signature
        $expectedSignature = $this->base64UrlEncode(
            hash_hmac('sha256', "{$header}.{$payload}", $this->jwtSecret, true)
        );
        
        if (!hash_equals($expectedSignature, $signature)) {
            return null;
        }
        
        // Décoder le payload
        $data = json_decode($this->base64UrlDecode($payload), true);
        
        if (!$data || !isset($data['user_id']) || !isset($data['exp'])) {
            return null;
        }
        
        // Vérifier l'expiration
        if ($data['exp'] < time()) {
            return null;
        }
        
        return $this->getUserById($data['user_id']);
    }
    
    /**
     * Valide un token "remember me"
     */
    private function validateRememberToken(string $token): ?array
    {
        $hashedToken = hash('sha256', $token);
        
        $stmt = $this->db->prepare('
            SELECT id FROM users 
            WHERE remember_token = ? 
            AND remember_expires > NOW()
        ');
        $stmt->execute([$hashedToken]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($result) {
            return $this->getUserById($result['id']);
        }
        
        return null;
    }
    
    /**
     * Récupère un utilisateur par ID (informations de session)
     */
    private function getUserById(int $id): ?array
    {
        $stmt = $this->db->prepare('
            SELECT id, name, email, is_admin, is_premium, theme, lang_pref 
            FROM users 
            WHERE id = ?
        ');
        $stmt->execute([$id]);
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
    }
    
    /**
     * Encode en base64 URL-safe
     */
    private function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
    
    /**
     * Décode depuis base64 URL-safe
     */
    private function base64UrlDecode(string $data): string
    {
        return base64_decode(strtr($data, '-_', '+/'));
    }
    
    /**
     * Envoie une réponse d'erreur d'authentification
     */
    public function sendUnauthorized(string $message = 'Non autorisé'): void
    {
        http_response_code(401);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'success' => false,
            'error' => 'unauthorized',
            'message' => $message
        ]);
        exit;
    }
    
    /**
     * Envoie une réponse d'erreur d'accès interdit
     */
    public function sendForbidden(string $message = 'Accès interdit'): void
    {
        http_response_code(403);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'success' => false,
            'error' => 'forbidden',
            'message' => $message
        ]);
        exit;
    }
}
