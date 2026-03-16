// api.js - API Client pour PHENIX TECH-SERVICES
// Utilitaires et fonctions API globales

const PhenixAPI = {
    // Configuration avec deux environnements
    config: {
        env: 'local', // 'local' ou 'prod'
        apiBaseLocal: 'http://localhost:3000/api',
        socketUrlLocal: 'http://localhost:3000',
        apiBaseProd: 'https://backend-phenix.onrender.com/api',
        socketUrlProd: 'https://backend-phenix.onrender.com',
        timeout: 30000
    },

    // Accès dynamique selon l'environnement
    get apiBase() {
        return this.config.env === 'local' ? this.config.apiBaseLocal : this.config.apiBaseProd;
    },

    get socketUrl() {
        return this.config.env === 'local' ? this.config.socketUrlLocal : this.config.socketUrlProd;
    },

    // Socket.io
    socket: null,

    // Initialiser Socket.io
    initSocket() {
        try {
            if (this.socket) return;

            const token = localStorage.getItem(CONFIG.STORAGE.USER_TOKEN);

            this.socket = io(this.socketUrl, {
                transports: ['websocket', 'polling'],
                auth: { token }
            });

            this.socket.on('connect', () => console.log('✓ Connecté au serveur temps réel'));
            this.socket.on('disconnect', () => console.log('✗ Déconnecté du serveur'));
            this.socket.on('error', (error) => console.error('Erreur Socket:', error));

            return this.socket;
        } catch (error) {
            console.error('Erreur initSocket:', error);
            return null;
        }
    },

    getSocket() { if (!this.socket) this.initSocket(); return this.socket; },
    closeSocket() { if (this.socket) { this.socket.disconnect(); this.socket = null; } },

    // Requête fetch standard
    async fetch(endpoint, options = {}) {
        const token = localStorage.getItem(CONFIG.STORAGE.USER_TOKEN);
        const headers = { 'Content-Type': 'application/json', ...options.headers };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const config = { method: options.method || 'GET', headers, timeout: this.config.timeout, ...options };
        if (options.body && typeof options.body === 'object') config.body = JSON.stringify(options.body);

        try {
            const response = await fetch(endpoint, config);
            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) { CONFIG.logoutUser(); window.location.href = 'login-user.html'; }
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
            const url = new URL(`${this.apiBase}/products`);
            if (options.search) url.searchParams.append('search', options.search);
            if (options.category) url.searchParams.append('category', options.category);
            if (options.page) url.searchParams.append('page', options.page);
            if (options.limit) url.searchParams.append('limit', options.limit);

            const response = await this.fetch(url.toString());
            return Array.isArray(response) ? response : (response.data || []);
        } catch (error) { console.error('Erreur getProducts:', error); return []; }
    },

    async getProduct(id) {
        try { const response = await this.fetch(`${this.apiBase}/products/${id}`); return response.data || response || null; }
        catch (error) { console.error('Erreur getProduct:', error); return null; }
    },

    async getCategories() {
        try { const response = await this.fetch(`${this.apiBase}/products/categories`); return Array.isArray(response) ? response : (response.data || []); }
        catch (error) { console.error('Erreur getCategories:', error); return []; }
    },

    async getStats() {
        try {
            const response = await this.fetch(`${this.apiBase}/products/stats`);
            const data = response.data || response || {};
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
        } catch (error) { console.error('Erreur getStats:', error); return { totalProducts:0,totalCategories:0,totalRevenue:0,totalOrders:0,products:0,customers:0,successRate:0,supportTime:"N/A" }; }
    },

    async createProduct(formData) { return this._productAction('POST', '/products', formData, 'product:created'); },
    async updateProduct(id, formData) { return this._productAction('PUT', `/products/${id}`, formData, 'product:updated'); },
    async deleteProduct(id) { return this._productAction('DELETE', `/products/${id}`, null, 'product:deleted', id); },

    async _productAction(method, path, body = null, socketEvent = null, socketData = null) {
        try {
            const token = localStorage.getItem(CONFIG.STORAGE.USER_TOKEN);
            const headers = { 'Authorization': `Bearer ${token}` };
            const response = await fetch(`${this.apiBase}${path}`, { method, headers, body });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Erreur produit');
            if (socketEvent) this.getSocket()?.emit(socketEvent, socketData || data.data);
            return data;
        } catch (error) { console.error(`Erreur ${socketEvent}:`, error); throw error; }
    },

    // === PANIER ===
    async getCart() { return await this._cartAction('GET', '/cart'); },
    async addToCart(productId, quantity = 1) { return await this._cartAdd(productId, quantity); },
    async removeFromCart(productId) { return await this._cartAction('DELETE', '/cart/remove', { productId }); },
    async updateCartItem(productId, quantity) { return await this._cartAction('PUT', '/cart/update', { productId, quantity }); },
    async clearCart() { return await this._cartAction('DELETE', '/cart/clear'); },

    async _cartAction(method, path, body = null) {
        try {
            const response = await this.fetch(`${this.apiBase}${path}`, { method, body });
            if (response.success) localStorage.setItem(CONFIG.STORAGE.CART_ITEMS, JSON.stringify(response.data?.items || []));
            this.getSocket()?.emit('cart:updated', { items: response.data?.items });
            return response;
        } catch (error) {
            console.error(`Erreur cart ${path}:`, error);
            return { success: false };
        }
    },

    async _cartAdd(productId, quantity = 1) {
        try { return await this._cartAction('POST', '/cart/add', { productId, quantity }); }
        catch (error) {
            console.warn('Fallback localStorage:', error.message);
            const cartItems = JSON.parse(localStorage.getItem(CONFIG.STORAGE.CART_ITEMS) || '[]');
            const existing = cartItems.find(i => i.productId === productId || i.productId?._id === productId);
            if (existing) existing.quantity += quantity;
            else cartItems.push({ productId: productId.toString(), quantity, addedAt: new Date().toISOString() });
            localStorage.setItem(CONFIG.STORAGE.CART_ITEMS, JSON.stringify(cartItems));
            return { success: true, message: 'Produit ajouté au panier (offline)', data: { items: cartItems } };
        }
    },

    // === COMMANDES, PAIEMENTS, AUTH, UTILITAIRES ===
    async createOrderFromCart(orderData) { return this.fetch(`${this.apiBase}/payments/cart-to-order`, { method:'POST', body:orderData }); },
    async processPayment(paymentData) { return this.fetch(`${this.apiBase}/payments/process`, { method:'POST', body:paymentData }); },
    async getOrderStatus(orderId) { return this.fetch(`${this.apiBase}/payments/status/${orderId}`); },
    async signup(userData) { return this.fetch(`${this.apiBase}/auth/signup`, { method:'POST', body:userData }); },
    async login(email, password) { return this.fetch(`${this.apiBase}/auth/login`, { method:'POST', body:{email,password} }); },

    formatPrice(price) { return price ? new Intl.NumberFormat('fr-FR').format(Math.round(price)) + ' GNF' : '0 GNF'; },
    formatDate(date) { return date ? new Date(date).toLocaleDateString('fr-FR', { year:'numeric', month:'long', day:'numeric' }) : ''; },

    showNotification(message, type='info', duration=3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        let icon = { info:'info-circle', success:'check-circle', error:'exclamation-circle', warning:'exclamation-triangle' }[type] || 'info-circle';
        notification.innerHTML = `<i class="fas fa-${icon}"></i><span>${message}</span>`;
        Object.assign(notification.style, { position:'fixed', top:'20px', right:'20px', padding:'16px 24px', borderRadius:'8px', zIndex:'9999', display:'flex', alignItems:'center', gap:'12px', fontSize:'14px', fontWeight:'500', animation:'slideIn 0.3s ease', maxWidth:'400px' });
        const colors = { success:'rgba(16,185,129,0.95)', error:'rgba(239,68,68,0.95)', warning:'rgba(245,158,11,0.95)', info:'rgba(42,92,170,0.95)' };
        notification.style.background = colors[type] || colors.info; notification.style.color = 'white';
        document.body.appendChild(notification);
        setTimeout(() => { notification.style.animation='slideOut 0.3s ease'; setTimeout(()=>notification.remove(),300); }, duration);
    }
};

// Rendre disponible globalement
window.PhenixAPI = PhenixAPI;
if (typeof module !== 'undefined' && module.exports) module.exports = PhenixAPI;
