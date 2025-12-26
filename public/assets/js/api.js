/**
 * SnowShelf - API Client
 * 
 * Client JavaScript pour interagir avec l'API SnowShelf
 */

const SnowShelfAPI = {
    /**
     * URL de base de l'API
     */
    baseUrl: '/api',

    /**
     * Effectue une requête API
     * 
     * @param {string} endpoint - Endpoint de l'API
     * @param {object} options - Options fetch
     * @returns {Promise<object>}
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'same-origin', // Envoyer les cookies de session
        };

        const mergedOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers,
            },
        };

        try {
            const response = await fetch(url, mergedOptions);
            const data = await response.json();

            if (!response.ok) {
                throw new APIError(data.message || 'Erreur API', data.error, response.status);
            }

            return data;
        } catch (error) {
            if (error instanceof APIError) {
                throw error;
            }
            throw new APIError('Erreur de connexion', 'network_error', 0);
        }
    },

    /**
     * API Utilisateurs
     */
    users: {
        /**
         * Récupère les infos de l'utilisateur connecté
         * @param {string[]} fields - Champs spécifiques (optionnel)
         */
        async getMe(fields = null) {
            let endpoint = '/users.php?me';
            if (fields && fields.length > 0) {
                endpoint += `&fields=${fields.join(',')}`;
            }
            return SnowShelfAPI.request(endpoint);
        },

        /**
         * Récupère les infos d'un utilisateur
         * @param {number} id - ID de l'utilisateur
         * @param {string[]} fields - Champs spécifiques (optionnel)
         */
        async get(id, fields = null) {
            let endpoint = `/users.php?id=${id}`;
            if (fields && fields.length > 0) {
                endpoint += `&fields=${fields.join(',')}`;
            }
            return SnowShelfAPI.request(endpoint);
        },

        /**
         * Liste les utilisateurs (admin)
         * @param {object} options - Options de pagination/filtrage
         */
        async list(options = {}) {
            const params = new URLSearchParams();
            if (options.page) params.append('page', options.page);
            if (options.limit) params.append('limit', options.limit);
            if (options.search) params.append('search', options.search);
            if (options.orderBy) params.append('order_by', options.orderBy);
            if (options.orderDir) params.append('order_dir', options.orderDir);

            const query = params.toString();
            return SnowShelfAPI.request(`/users.php${query ? '?' + query : ''}`);
        },

        /**
         * Crée un utilisateur (admin)
         * @param {object} userData - Données de l'utilisateur
         */
        async create(userData) {
            return SnowShelfAPI.request('/users.php', {
                method: 'POST',
                body: JSON.stringify(userData),
            });
        },

        /**
         * Met à jour un utilisateur
         * @param {number} id - ID de l'utilisateur
         * @param {object} userData - Données à modifier
         */
        async update(id, userData) {
            return SnowShelfAPI.request(`/users.php?id=${id}`, {
                method: 'PUT',
                body: JSON.stringify(userData),
            });
        },

        /**
         * Supprime un utilisateur
         * @param {number} id - ID de l'utilisateur
         */
        async delete(id) {
            return SnowShelfAPI.request(`/users.php?id=${id}`, {
                method: 'DELETE',
            });
        },

        /**
         * Change le mot de passe
         * @param {string} currentPassword - Mot de passe actuel
         * @param {string} newPassword - Nouveau mot de passe
         */
        async changePassword(currentPassword, newPassword) {
            return SnowShelfAPI.request('/users.php?action=password', {
                method: 'POST',
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword,
                }),
            });
        },

        /**
         * Met à jour les préférences (thème, langue)
         * @param {object} preferences - { theme, lang_pref }
         */
        async updatePreferences(preferences) {
            return SnowShelfAPI.request('/users.php?action=preferences', {
                method: 'POST',
                body: JSON.stringify(preferences),
            });
        },
    },
};

/**
 * Classe d'erreur API personnalisée
 */
class APIError extends Error {
    constructor(message, code, status) {
        super(message);
        this.name = 'APIError';
        this.code = code;
        this.status = status;
    }
}

// Export pour les modules ES6
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SnowShelfAPI, APIError };
}
