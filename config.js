// Configuration globale PHENIX TECH-SERVICES
const CONFIG = {
    // === SERVEURS ===
    API_BASE_URL: 'http://localhost:3000/api',
    SOCKET_URL: 'http://localhost:3000',
    FRONTEND_URL: 'http://localhost:5500',
    
    // === ENDPOINTS AUTH ===
    ENDPOINTS: {
        // Authentification utilisateur
        AUTH_SIGNUP: '/auth/signup',
        AUTH_LOGIN: '/auth/login',
        AUTH_VERIFY: '/auth/verify',
        AUTH_LOGOUT: '/auth/logout',
        
        // Authentification admin
        ADMIN_SIGNUP: '/auth/admin/signup',
        ADMIN_LOGIN: '/auth/admin/login',
        ADMIN_VERIFY: '/auth/admin/verify',
        
        // Produits
        PRODUCTS_LIST: '/products',
        PRODUCTS_CREATE: '/products',
        PRODUCTS_GET: '/products/:id',
        PRODUCTS_UPDATE: '/products/:id',
        PRODUCTS_DELETE: '/products/:id',
        PRODUCTS_SEARCH: '/products/search',
        
        // Panier
        CART_GET: '/cart',
        CART_ADD: '/cart/add',
        CART_REMOVE: '/cart/remove/:id',
        CART_UPDATE: '/cart/update/:id',
        CART_CLEAR: '/cart/clear',
        
        // Commandes
        ORDERS_CREATE: '/orders',
        ORDERS_LIST: '/orders',
        ORDERS_GET: '/orders/:id',
        
        // Paiements
        PAYMENTS_CREATE: '/payments/create',
        PAYMENTS_VERIFY: '/payments/verify'
    },

    // === STOCKAGE LOCAL ===
    STORAGE: {
        USER_TOKEN: 'user_token',
        USER_INFO: 'user_info',
        ADMIN_TOKEN: 'admin_token',
        ADMIN_INFO: 'admin_info',
        CART_ITEMS: 'cart_items',
        USER_ID: 'user_id',
        REMEMBER_EMAIL: 'remember_email'
    },

    // === LIMITES ===
    UPLOAD_LIMIT: 5 * 1024 * 1024, // 5MB
    UPLOAD_FORMATS: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    MAX_CART_ITEMS: 100,
    MAX_PRODUCT_NAME: 200,
    MAX_PRODUCT_DESC: 5000,
    MAX_SEARCH_LENGTH: 50,

    // === TIMEOUTS ===
    REQUEST_TIMEOUT: 30000, // 30 secondes
    SOCKET_TIMEOUT: 5000, // 5 secondes
    CACHE_TIMEOUT: 5 * 60 * 1000, // 5 minutes
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 heures

    // === FEATURES ===
    FEATURES: {
        DEMO_MODE: true, // Mode démo actif
        SOCKET_IO: true, // WebSocket actif
        CACHE: true, // Cache local actif
        ANALYTICS: false, // Analytiques (à activer)
        TWO_FACTOR_AUTH: false // 2FA (à implémenter)
    },

    // === MESSAGES ===
    MESSAGES: {
        LOADING: 'Chargement...',
        ERROR_NETWORK: 'Erreur réseau. Vérifiez votre connexion.',
        ERROR_AUTH: 'Authentification échouée. Veuillez vous reconnecter.',
        ERROR_PERMISSION: 'Vous n\'avez pas les permissions pour cette action.',
        SUCCESS_SAVED: 'Les modifications ont été sauvegardées.',
        SUCCESS_DELETED: 'L\'élément a été supprimé.',
        CONFIRM_DELETE: 'Êtes-vous sûr de vouloir supprimer cet élément ?'
    },

    // === COULEURS ===
    COLORS: {
        PRIMARY: '#2A5CAA',
        SECONDARY: '#FF6B35',
        SUCCESS: '#10B981',
        WARNING: '#F59E0B',
        DANGER: '#EF4444',
        INFO: '#0EA5E9'
    },

    // === FONCTIONS UTILITAIRES ===
    
    // Obtenir l'URL complète d'un endpoint
    getEndpoint(key) {
        const endpoint = this.ENDPOINTS[key];
        if (!endpoint) {
            console.warn(`Endpoint ${key} non trouvé`);
            return '';
        }
        return `${this.API_BASE_URL}${endpoint}`;
    },

    // Obtenir le token utilisateur
    getUserToken() {
        return localStorage.getItem(this.STORAGE.USER_TOKEN);
    },

    // Obtenir le token admin
    getAdminToken() {
        return localStorage.getItem(this.STORAGE.ADMIN_TOKEN);
    },

    // Obtenir l'info utilisateur
    getUserInfo() {
        const info = localStorage.getItem(this.STORAGE.USER_INFO);
        return info ? JSON.parse(info) : null;
    },

    // Obtenir l'info admin
    getAdminInfo() {
        const info = localStorage.getItem(this.STORAGE.ADMIN_INFO);
        return info ? JSON.parse(info) : null;
    },

    // Vérifier si utilisateur connecté
    isUserLoggedIn() {
        return !!this.getUserToken();
    },

    // Vérifier si admin connecté
    isAdminLoggedIn() {
        return !!this.getAdminToken();
    },

    // Déconnecter l'utilisateur
    logoutUser() {
        localStorage.removeItem(this.STORAGE.USER_TOKEN);
        localStorage.removeItem(this.STORAGE.USER_INFO);
        localStorage.removeItem(this.STORAGE.CART_ITEMS);
    },

    // Déconnecter l'admin
    logoutAdmin() {
        localStorage.removeItem(this.STORAGE.ADMIN_TOKEN);
        localStorage.removeItem(this.STORAGE.ADMIN_INFO);
    },

    // Faire une requête fetch avec config standard
    async fetch(endpoint, options = {}) {
        const token = options.isAdmin ? this.getAdminToken() : this.getUserToken();
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            method: options.method || 'GET',
            headers,
            ...options
        };

        if (options.body && typeof options.body === 'object') {
            config.body = JSON.stringify(options.body);
        }

        try {
            const response = await fetch(endpoint, config);
            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    options.isAdmin ? this.logoutAdmin() : this.logoutUser();
                    window.location.href = options.isAdmin ? 'admin-login.html' : 'login.html';
                }
                throw new Error(data.message || 'Erreur serveur');
            }

            return data;
        } catch (error) {
            console.error('Erreur fetch:', error);
            throw error;
        }
    }
};

// Export pour utilisation
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}
