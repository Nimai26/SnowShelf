<?php
/**
 * SnowShelf - Service Utilisateur
 * 
 * Gère toutes les opérations CRUD sur les utilisateurs
 */

class UserService
{
    /** @var PDO Instance de base de données */
    private PDO $db;
    
    /** @var array Champs autorisés en lecture */
    private array $readableFields = [
        'id', 'name', 'email', 'avatar_url', 'is_admin', 'is_premium', 
        'premium_until', 'created_at', 'email_verified', 'newsletter',
        'Visi_collec', 'Desc_Collec', 'show_mail', 'theme', 'lang_pref', 'background', 'auto_trad'
    ];
    
    /** @var array Champs modifiables par l'utilisateur */
    private array $userEditableFields = [
        'name', 'email', 'avatar_url', 'newsletter', 
        'Visi_collec', 'Desc_Collec', 'show_mail', 'theme', 'lang_pref', 'background', 'auto_trad'
    ];
    
    /** @var array Champs modifiables uniquement par admin */
    private array $adminOnlyFields = [
        'is_admin', 'is_premium', 'premium_until', 'email_verified'
    ];
    
    /**
     * Constructeur
     */
    public function __construct(PDO $db)
    {
        $this->db = $db;
    }
    
    /**
     * Récupère les informations d'un utilisateur
     * 
     * @param int $userId ID de l'utilisateur
     * @param array|null $fields Liste des champs à récupérer (null = tous)
     * @return array|null
     */
    public function getUser(int $userId, ?array $fields = null): ?array
    {
        // Si pas de champs spécifiés, retourner les infos de base
        if ($fields === null) {
            $fields = ['id', 'name', 'email', 'is_admin', 'is_premium', 'theme', 'lang_pref', 'avatar_url'];
        }
        
        // Filtrer les champs autorisés
        $fields = array_intersect($fields, $this->readableFields);
        
        if (empty($fields)) {
            return null;
        }
        
        $fieldList = implode(', ', $fields);
        $stmt = $this->db->prepare("SELECT {$fieldList} FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
    }
    
    /**
     * Récupère les informations de session minimales
     */
    public function getSessionInfo(int $userId): ?array
    {
        $stmt = $this->db->prepare('
            SELECT id, name, is_admin, is_premium, theme, lang_pref 
            FROM users 
            WHERE id = ?
        ');
        $stmt->execute([$userId]);
        return $stmt->fetch(PDO::FETCH_ASSOC) ?: null;
    }
    
    /**
     * Liste les utilisateurs (admin uniquement)
     * 
     * @param array $options Options de pagination et filtrage
     * @return array
     */
    public function listUsers(array $options = []): array
    {
        $page = max(1, (int)($options['page'] ?? 1));
        $limit = min(100, max(1, (int)($options['limit'] ?? 20)));
        $offset = ($page - 1) * $limit;
        $search = $options['search'] ?? null;
        
        // Sécuriser order_by
        $allowedOrderBy = ['id', 'name', 'email', 'created_at'];
        $orderByOption = $options['order_by'] ?? 'id';
        $orderBy = in_array($orderByOption, $allowedOrderBy) ? $orderByOption : 'id';
        
        $orderDir = strtoupper($options['order_dir'] ?? 'ASC') === 'DESC' ? 'DESC' : 'ASC';
        
        // Construire la requête
        $where = '';
        $params = [];
        
        if ($search) {
            $where = 'WHERE name LIKE ? OR email LIKE ?';
            $params = ["%{$search}%", "%{$search}%"];
        }
        
        // Compter le total
        $countStmt = $this->db->prepare("SELECT COUNT(*) FROM users {$where}");
        $countStmt->execute($params);
        $total = (int)$countStmt->fetchColumn();
        
        // Récupérer les utilisateurs
        $sql = "SELECT id, name, email, avatar_url, is_admin, is_premium, email_verified, created_at 
                FROM users {$where} 
                ORDER BY {$orderBy} {$orderDir} 
                LIMIT {$limit} OFFSET {$offset}";
        
        $stmt = $this->db->prepare($sql);
        $stmt->execute($params);
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        return [
            'users' => $users,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'pages' => ceil($total / $limit)
            ]
        ];
    }
    
    /**
     * Met à jour un utilisateur
     * 
     * @param int $userId ID de l'utilisateur
     * @param array $data Données à mettre à jour
     * @param bool $isAdmin Si l'opération est faite par un admin
     * @return array Résultat de l'opération
     */
    public function updateUser(int $userId, array $data, bool $isAdmin = false): array
    {
        // Déterminer les champs autorisés
        $allowedFields = $this->userEditableFields;
        if ($isAdmin) {
            $allowedFields = array_merge($allowedFields, $this->adminOnlyFields);
        }
        
        // Filtrer les données
        $updateData = [];
        foreach ($data as $field => $value) {
            if (in_array($field, $allowedFields)) {
                $updateData[$field] = $value;
            }
        }
        
        if (empty($updateData)) {
            return ['success' => false, 'error' => 'no_valid_fields', 'message' => 'Aucun champ valide à mettre à jour'];
        }
        
        // Validation spécifique
        if (isset($updateData['email'])) {
            if (!filter_var($updateData['email'], FILTER_VALIDATE_EMAIL)) {
                return ['success' => false, 'error' => 'invalid_email', 'message' => 'Email invalide'];
            }
            
            // Vérifier l'unicité
            $stmt = $this->db->prepare('SELECT id FROM users WHERE email = ? AND id != ?');
            $stmt->execute([$updateData['email'], $userId]);
            if ($stmt->fetch()) {
                return ['success' => false, 'error' => 'email_taken', 'message' => 'Email déjà utilisé'];
            }
        }
        
        if (isset($updateData['name'])) {
            if (strlen($updateData['name']) < 3 || strlen($updateData['name']) > 50) {
                return ['success' => false, 'error' => 'invalid_name', 'message' => 'Nom invalide (3-50 caractères)'];
            }
            
            // Vérifier l'unicité
            $stmt = $this->db->prepare('SELECT id FROM users WHERE name = ? AND id != ?');
            $stmt->execute([$updateData['name'], $userId]);
            if ($stmt->fetch()) {
                return ['success' => false, 'error' => 'name_taken', 'message' => 'Nom déjà utilisé'];
            }
        }
        
        // Construire la requête UPDATE
        $setParts = [];
        $params = [];
        foreach ($updateData as $field => $value) {
            $setParts[] = "{$field} = ?";
            $params[] = $value;
        }
        $setParts[] = "updated_at = NOW()";
        $params[] = $userId;
        
        $sql = "UPDATE users SET " . implode(', ', $setParts) . " WHERE id = ?";
        
        try {
            $stmt = $this->db->prepare($sql);
            $stmt->execute($params);
            
            return [
                'success' => true,
                'message' => 'Utilisateur mis à jour',
                'updated_fields' => array_keys($updateData)
            ];
        } catch (PDOException $e) {
            error_log('Erreur update user: ' . $e->getMessage());
            return ['success' => false, 'error' => 'database_error', 'message' => 'Erreur base de données'];
        }
    }
    
    /**
     * Change le mot de passe d'un utilisateur
     */
    public function changePassword(int $userId, string $currentPassword, string $newPassword): array
    {
        // Vérifier le mot de passe actuel
        $stmt = $this->db->prepare('SELECT password FROM users WHERE id = ?');
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user || !password_verify($currentPassword, $user['password'])) {
            return ['success' => false, 'error' => 'wrong_password', 'message' => 'Mot de passe actuel incorrect'];
        }
        
        // Valider le nouveau mot de passe
        if (strlen($newPassword) < 8) {
            return ['success' => false, 'error' => 'password_weak', 'message' => 'Mot de passe trop court (8 caractères minimum)'];
        }
        
        if (!preg_match('/[0-9]/', $newPassword)) {
            return ['success' => false, 'error' => 'password_weak', 'message' => 'Le mot de passe doit contenir au moins un chiffre'];
        }
        
        if (!preg_match('/[^a-zA-Z0-9]/', $newPassword)) {
            return ['success' => false, 'error' => 'password_weak', 'message' => 'Le mot de passe doit contenir au moins un caractère spécial'];
        }
        
        // Hasher et sauvegarder
        $hash = password_hash($newPassword, PASSWORD_BCRYPT, ['cost' => 12]);
        
        $stmt = $this->db->prepare('UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?');
        $stmt->execute([$hash, $userId]);
        
        return ['success' => true, 'message' => 'Mot de passe modifié'];
    }
    
    /**
     * Vérifie le mot de passe d'un utilisateur
     * 
     * @param int $userId ID de l'utilisateur
     * @param string $password Mot de passe à vérifier
     * @return bool True si le mot de passe est correct
     */
    public function verifyPassword(int $userId, string $password): bool
    {
        $stmt = $this->db->prepare('SELECT password FROM users WHERE id = ?');
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$user) {
            return false;
        }
        
        return password_verify($password, $user['password']);
    }
    
    /**
     * Supprime un utilisateur
     */
    public function deleteUser(int $userId): array
    {
        try {
            // Vérifier que l'utilisateur existe
            $stmt = $this->db->prepare('SELECT id FROM users WHERE id = ?');
            $stmt->execute([$userId]);
            if (!$stmt->fetch()) {
                return ['success' => false, 'error' => 'not_found', 'message' => 'Utilisateur non trouvé'];
            }
            
            // TODO: Supprimer les données liées (collections, items, etc.)
            // Pour l'instant, on supprime juste l'utilisateur
            
            $stmt = $this->db->prepare('DELETE FROM users WHERE id = ?');
            $stmt->execute([$userId]);
            
            return ['success' => true, 'message' => 'Utilisateur supprimé'];
            
        } catch (PDOException $e) {
            error_log('Erreur delete user: ' . $e->getMessage());
            return ['success' => false, 'error' => 'database_error', 'message' => 'Erreur base de données'];
        }
    }
    
    /**
     * Crée un nouvel utilisateur (admin uniquement)
     */
    public function createUser(array $data): array
    {
        // Champs requis
        $required = ['name', 'email', 'password'];
        foreach ($required as $field) {
            if (empty($data[$field])) {
                return ['success' => false, 'error' => 'missing_field', 'message' => "Champ requis: {$field}"];
            }
        }
        
        // Validation
        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            return ['success' => false, 'error' => 'invalid_email', 'message' => 'Email invalide'];
        }
        
        if (strlen($data['name']) < 3 || strlen($data['name']) > 50) {
            return ['success' => false, 'error' => 'invalid_name', 'message' => 'Nom invalide (3-50 caractères)'];
        }
        
        // Vérifier l'unicité
        $stmt = $this->db->prepare('SELECT id FROM users WHERE email = ?');
        $stmt->execute([$data['email']]);
        if ($stmt->fetch()) {
            return ['success' => false, 'error' => 'email_taken', 'message' => 'Email déjà utilisé'];
        }
        
        $stmt = $this->db->prepare('SELECT id FROM users WHERE name = ?');
        $stmt->execute([$data['name']]);
        if ($stmt->fetch()) {
            return ['success' => false, 'error' => 'name_taken', 'message' => 'Nom déjà utilisé'];
        }
        
        // Hasher le mot de passe
        $hash = password_hash($data['password'], PASSWORD_BCRYPT, ['cost' => 12]);
        
        try {
            $stmt = $this->db->prepare('
                INSERT INTO users (name, email, password, is_admin, is_premium, email_verified, theme, lang_pref, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
            ');
            
            $stmt->execute([
                $data['name'],
                $data['email'],
                $hash,
                (int)($data['is_admin'] ?? 0),
                (int)($data['is_premium'] ?? 0),
                (int)($data['email_verified'] ?? 0),
                $data['theme'] ?? 'dracula',
                $data['lang_pref'] ?? 'fr'
            ]);
            
            $userId = $this->db->lastInsertId();
            
            return [
                'success' => true,
                'message' => 'Utilisateur créé',
                'user_id' => $userId
            ];
            
        } catch (PDOException $e) {
            error_log('Erreur create user: ' . $e->getMessage());
            return ['success' => false, 'error' => 'database_error', 'message' => 'Erreur base de données'];
        }
    }
}
