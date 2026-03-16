// api.js - API Client pour PHENIX TECH-SERVICES
// Utilitaires et fonctions API globales

const PhenixAPI = {
    // Configuration
    config: {
        apiBase: 'http://localhost:3000/api',
        socketUrl: 'http://localhost:3000',
        timeout: 30000
    },

    // Socket.io
    socket: null,

    // Initialiser Socket.io
    initSocket() {
        try {
            if (this.socket) return;
            
            const token = localStorage.getItem(CONFIG.STORAGE.USER_TOKEN);
            
            this.socket = io(this.config.socketUrl, {
                transports: ['websocket', 'polling'],
                auth: {
                    token: token
                }
            });

            this.socket.on('connect', () => {
                console.log('✓ Connecté au serveur temps réel');
            });

            this.socket.on('disconnect', () => {
                console.log('✗ Déconnecté du serveur');
            });

            this.socket.on('error', (error) => {
                console.error('Erreur Socket:', error);
            });

            return this.socket;
        } catch (error) {
            console.error('Erreur initSocket:', error);
            return null;
        }
    },

    // Récupérer le socket
    getSocket() {
        if (!this.socket) {
            this.initSocket();
        }
        return this.socket;
    },

    // Fermer le socket
    closeSocket() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    },

    // Requête fetch standard
    async fetch(endpoint, options = {}) {
        const token = localStorage.getItem(CONFIG.STORAGE.USER_TOKEN);
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
            timeout: this.config.timeout,
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
                    CONFIG.logoutUser();
                    window.location.href = 'login-user.html';
                }
                throw new Error(data.message || 'Erreur serveur');
            }

            return data;
        } catch (error) {
            console.error('Erreur fetch:', error);
            throw error;
        }
    },

    // === PRODUITS ===
    async getProducts(options = {}) {
        try {
            const url = new URL(`${this.config.apiBase}/products`);
            if (options.search) url.searchParams.append('search', options.search);
            if (options.category) url.searchParams.append('category', options.category);
            if (options.page) url.searchParams.append('page', options.page);
            if (options.limit) url.searchParams.append('limit', options.limit);

            const response = await this.fetch(url.toString());
            return Array.isArray(response) ? response : (response.data || []);
        } catch (error) {
            console.error('Erreur getProducts:', error);
            return [];
        }
    },

    async getProduct(id) {
        try {
            const response = await this.fetch(`${this.config.apiBase}/products/${id}`);
            return response.data || response || null;
        } catch (error) {
            console.error('Erreur getProduct:', error);
            return null;
        }
    },

    async getCategories() {
        try {
            const response = await this.fetch(`${this.config.apiBase}/products/categories`);
            return Array.isArray(response) ? response : (response.data || []);
        } catch (error) {
            console.error('Erreur getCategories:', error);
            return [];
        }
    },

    async getStats() {
        try {
            const response = await this.fetch(`${this.config.apiBase}/products/stats`);
            const data = response.data || response || {};
            
            // Retourner les statistiques dans le format attendu
            return {
                totalProducts: data.totalProducts || 0,
                totalCategories: data.totalCategories || 0,
                totalRevenue: data.totalRevenue || 0,
                totalOrders: data.totalOrders || 0,
                products: data.totalProducts || 0,
                customers: data.customers || 0,
                successRate: data.successRate || 98,
                supportTime: data.supportTime || "24h"
            };
        } catch (error) {
            console.error('Erreur getStats:', error);
            return {
                totalProducts: 0,
                totalCategories: 0,
                totalRevenue: 0,
                totalOrders: 0,
                products: 0,
                customers: 0,
                successRate: 0,
                supportTime: "N/A"
            };
        }
    },

    async createProduct(formData) {
        try {
            const token = localStorage.getItem(CONFIG.STORAGE.USER_TOKEN);
            const headers = {
                'Authorization': `Bearer ${token}`
            };

            const response = await fetch(`${this.config.apiBase}/products`, {
                method: 'POST',
                headers,
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Erreur création produit');
            }

            // Émettre l'événement socket pour les autres clients
            this.getSocket()?.emit('product:created', data.data);

            return data;
        } catch (error) {
            console.error('Erreur createProduct:', error);
            throw error;
        }
    },

    async updateProduct(id, formData) {
        try {
            const token = localStorage.getItem(CONFIG.STORAGE.USER_TOKEN);
            const headers = {
                'Authorization': `Bearer ${token}`
            };

            const response = await fetch(`${this.config.apiBase}/products/${id}`, {
                method: 'PUT',
                headers,
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Erreur mise à jour produit');
            }

            this.getSocket()?.emit('product:updated', data.data);
            return data;
        } catch (error) {
            console.error('Erreur updateProduct:', error);
            throw error;
        }
    },

    async deleteProduct(id) {
        try {
            const token = localStorage.getItem(CONFIG.STORAGE.USER_TOKEN);
            const headers = {
                'Authorization': `Bearer ${token}`
            };

            const response = await fetch(`${this.config.apiBase}/products/${id}`, {
                method: 'DELETE',
                headers
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Erreur suppression produit');
            }

            this.getSocket()?.emit('product:deleted', id);
            return data;
        } catch (error) {
            console.error('Erreur deleteProduct:', error);
            throw error;
        }
    },

    // === PANIER ===
    async getCart() {
        try {
            const response = await this.fetch(`${this.config.apiBase}/cart`);
            
            if (response.success && response.data && response.data.items) {
                localStorage.setItem(CONFIG.STORAGE.CART_ITEMS, JSON.stringify(response.data.items));
            }
            
            return response;
        } catch (error) {
            console.error('Erreur getCart:', error);
            const cached = localStorage.getItem(CONFIG.STORAGE.CART_ITEMS);
            if (cached) {
                return { success: true, data: { items: JSON.parse(cached) } };
            }
            return { success: false, data: { items: [] } };
        }
    },

    async addToCart(productId, quantity = 1) {
        try {
            // Valider les paramètres
            if (!productId) {
                throw new Error('ID produit requis');
            }
            
            // Essayer d'ajouter via l'API
            const result = await this.fetch(`${this.config.apiBase}/cart/add`, {
                method: 'POST',
                body: {
                    productId: productId.toString(),
                    quantity: parseInt(quantity) || 1
                }
            });

            if (result.success && result.data) {
                // Succès API - sauvegarder les items du panier
                localStorage.setItem(CONFIG.STORAGE.CART_ITEMS, JSON.stringify(result.data.items || []));
                this.getSocket()?.emit('cart:updated', { items: result.data.items });
                return result;
            } else {
                // Erreur API - sauvegarder en localStorage en fallback
                console.warn('API retourna une erreur, utilisation du localStorage:', result?.message);
                const cartItems = JSON.parse(localStorage.getItem(CONFIG.STORAGE.CART_ITEMS) || '[]');
                const existingItem = cartItems.find(item => 
                    (item.productId === productId || item.productId?._id === productId)
                );
                
                if (existingItem) {
                    existingItem.quantity += quantity;
                } else {
                    cartItems.push({ 
                        productId: productId.toString(), 
                        quantity: parseInt(quantity) || 1,
                        addedAt: new Date().toISOString()
                    });
                }
                
                localStorage.setItem(CONFIG.STORAGE.CART_ITEMS, JSON.stringify(cartItems));
                
                // Retourner succès pour indiquer que le produit est au panier (localement)
                return { 
                    success: true, 
                    message: 'Produit ajouté au panier (offline)',
                    data: { items: cartItems }
                };
            }
        } catch (error) {
            console.error('Erreur addToCart:', error);
            
            // Sauver en localStorage en dernier recours
            try {
                const cartItems = JSON.parse(localStorage.getItem(CONFIG.STORAGE.CART_ITEMS) || '[]');
                const existingItem = cartItems.find(item => 
                    (item.productId === productId || item.productId?._id === productId)
                );
                
                if (existingItem) {
                    existingItem.quantity += quantity;
                } else {
                    cartItems.push({ 
                        productId: productId.toString(), 
                        quantity: parseInt(quantity) || 1,
                        addedAt: new Date().toISOString()
                    });
                }
                
                localStorage.setItem(CONFIG.STORAGE.CART_ITEMS, JSON.stringify(cartItems));
                
                // Retourner succès même en cas d'erreur
                return { 
                    success: true, 
                    message: 'Produit ajouté au panier (mode offline)',
                    data: { items: cartItems }
                };
            } catch (storageError) {
                console.error('Erreur localStorage:', storageError);
                return { success: false, message: error.message };
            }
        }
    },

    async removeFromCart(productId) {
        try {
            const result = await this.fetch(`${this.config.apiBase}/cart/remove`, {
                method: 'DELETE',
                body: { productId }
            });

            if (result.success) {
                localStorage.setItem(CONFIG.STORAGE.CART_ITEMS, JSON.stringify(result.data?.items || []));
                this.getSocket()?.emit('cart:updated', { items: result.data?.items });
                return result;
            }
        } catch (error) {
            console.error('Erreur removeFromCart:', error);
        }

        // Fallback localStorage
        try {
            const cartItems = JSON.parse(localStorage.getItem(CONFIG.STORAGE.CART_ITEMS) || '[]');
            const filteredItems = cartItems.filter(item => item.productId !== productId && item.productId?._id !== productId);
            localStorage.setItem(CONFIG.STORAGE.CART_ITEMS, JSON.stringify(filteredItems));
            return { success: true, data: { items: filteredItems } };
        } catch (storageError) {
            console.error('Erreur localStorage:', storageError);
            return { success: false, message: storageError.message };
        }
    },

    async updateCartItem(productId, quantity) {
        try {
            const result = await this.fetch(`${this.config.apiBase}/cart/update`, {
                method: 'PUT',
                body: { productId, quantity }
            });

            if (result.success && result.data) {
                localStorage.setItem(CONFIG.STORAGE.CART_ITEMS, JSON.stringify(result.data.items || []));
                this.getSocket()?.emit('cart:updated', { items: result.data.items });
            }

            return result;
        } catch (error) {
            console.error('Erreur updateCartItem:', error);
        }

        // Fallback localStorage
        try {
            const cartItems = JSON.parse(localStorage.getItem(CONFIG.STORAGE.CART_ITEMS) || '[]');
            const item = cartItems.find(i => i.productId === productId || i.productId?._id === productId);
            
            if (item) {
                item.quantity = quantity;
            }
            
            localStorage.setItem(CONFIG.STORAGE.CART_ITEMS, JSON.stringify(cartItems));
            return { success: true, data: { items: cartItems } };
        } catch (storageError) {
            console.error('Erreur localStorage:', storageError);
            return { success: false, message: storageError.message };
        }
    },

    async clearCart() {
        try {
            const result = await this.fetch(`${this.config.apiBase}/cart/clear`, {
                method: 'DELETE'
            });

            if (result.success) {
                localStorage.removeItem(CONFIG.STORAGE.CART_ITEMS);
                this.getSocket()?.emit('cart:cleared');
            }

            return result;
        } catch (error) {
            console.error('Erreur clearCart:', error);
            return { success: false };
        }
    },

    async updateCartCount() {
        try {
            const cart = await this.getCart();
            const count = cart.data?.items?.length || 0;
            const cartBadge = document.querySelector('[data-cart-count]');
            if (cartBadge) {
                cartBadge.textContent = count;
                cartBadge.style.display = count > 0 ? 'inline-block' : 'none';
            }
            return { success: true, count };
        } catch (error) {
            console.error('Erreur updateCartCount:', error);
            return { success: false, count: 0 };
        }
    },

    async getCartSummary() {
        try {
            const response = await this.fetch(`${this.config.apiBase}/cart/validate/summary`);
            return response;
        } catch (error) {
            console.error('Erreur getCartSummary:', error);
            return { 
                success: false, 
                message: error.message,
                data: { items: [], subtotal: 0, shippingFee: 0, total: 0, isValid: false }
            };
        }
    },

    // === COMMANDES ET PAIEMENTS ===
    async createOrderFromCart(orderData) {
        try {
            return await this.fetch(`${this.config.apiBase}/payments/cart-to-order`, {
                method: 'POST',
                body: orderData
            });
        } catch (error) {
            console.error('Erreur createOrderFromCart:', error);
            return { success: false, message: error.message };
        }
    },

    async processPayment(paymentData) {
        try {
            return await this.fetch(`${this.config.apiBase}/payments/process`, {
                method: 'POST',
                body: paymentData
            });
        } catch (error) {
            console.error('Erreur processPayment:', error);
            return { success: false, message: error.message };
        }
    },

    async getOrderStatus(orderId) {
        try {
            return await this.fetch(`${this.config.apiBase}/payments/status/${orderId}`);
        } catch (error) {
            console.error('Erreur getOrderStatus:', error);
            return { success: false, message: error.message };
        }
    },

    // === AUTHENTIFICATION ===
    async signup(userData) {
        try {
            return await this.fetch(`${this.config.apiBase}/auth/signup`, {
                method: 'POST',
                body: userData
            });
        } catch (error) {
            console.error('Erreur signup:', error);
            return { success: false };
        }
    },

    async login(email, password) {
        try {
            return await this.fetch(`${this.config.apiBase}/auth/login`, {
                method: 'POST',
                body: { email, password }
            });
        } catch (error) {
            console.error('Erreur login:', error);
            return { success: false };
        }
    },

    // === UTILITAIRES ===
    formatPrice(price) {
        if (!price) return '0 GNF';
        return new Intl.NumberFormat('fr-FR').format(Math.round(price)) + ' GNF';
    },

    formatDate(date) {
        if (!date) return '';
        return new Date(date).toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        let icon = 'info-circle';
        if (type === 'success') icon = 'check-circle';
        if (type === 'error') icon = 'exclamation-circle';
        if (type === 'warning') icon = 'exclamation-triangle';

        notification.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
        `;

        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '16px 24px',
            borderRadius: '8px',
            zIndex: '9999',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '14px',
            fontWeight: '500',
            animation: 'slideIn 0.3s ease',
            maxWidth: '400px'
        });

        if (type === 'success') {
            notification.style.background = 'rgba(16, 185, 129, 0.95)';
            notification.style.color = 'white';
        } else if (type === 'error') {
            notification.style.background = 'rgba(239, 68, 68, 0.95)';
            notification.style.color = 'white';
        } else if (type === 'warning') {
            notification.style.background = 'rgba(245, 158, 11, 0.95)';
            notification.style.color = 'white';
        } else {
            notification.style.background = 'rgba(42, 92, 170, 0.95)';
            notification.style.color = 'white';
        }

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }
};

// Rendre disponible globalement
window.PhenixAPI = PhenixAPI;

if (typeof module !== 'undefined' && module.exports) {
    module.exports = PhenixAPI;
}
