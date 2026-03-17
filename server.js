const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
require('dotenv').config();

// Importer la configuration MongoDB
const connectDB = require('./config/database');

// Routes
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const paymentRoutes = require('./routes/payments');
const adminAuthRoutes = require('./routes/adminAuth');
const adminRoutes = require('./routes/admin');

const app = express();
const server = http.createServer(app);

// CORS Origins - Localhost + Production
const allowedOrigins = [
    // Development
    "http://localhost:5500",
    "http://localhost:3000",
    "http://localhost:5501",
    "http://127.0.0.1:5500",
    "http://127.0.0.1:5501",
    "http://127.0.0.1:3000",

    // Production
    "https://front-phenix.netlify.app",
    "https://phenix-tech.com",
    "https://phenix-tech-services.netlify.app", // ✅ AJOUTÉ

    process.env.FRONTEND_URL
].filter(Boolean);

console.log('✓ CORS Origins Allowed:', allowedOrigins);

// Middleware CORS amélioré (gère Netlify automatiquement)
app.use(cors({
    origin: function(origin, callback) {
        // Autoriser les requêtes sans origin (Postman, mobile apps)
        if (!origin) return callback(null, true);

        // Autoriser les origins définis
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        // Autoriser TOUS les sous-domaines Netlify (important)
        if (origin.includes('netlify.app')) {
            return callback(null, true);
        }

        console.warn('❌ CORS bloqué pour:', origin);
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    optionsSuccessStatus: 200
}));

// Traiter les requêtes OPTIONS
app.options('*', cors());

// Middleware CORS
app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200
}));

// Traiter les requêtes OPTIONS explicitement
app.options('*', cors());

// Headers sécurisés (sans CSP trop restrictive)
app.use((req, res, next) => {
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'SAMEORIGIN');
    res.header('X-XSS-Protection', '1; mode=block');
    // CSP permissive pour fetch API depuis Netlify
    res.header(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' https://backend-phenix.onrender.com wss: ws:; img-src 'self' data: https:; style-src 'self' 'unsafe-inline';"
    );
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Passer Socket.io aux requêtes
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminAuthRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Serveur en bon état' });
});
// Route racine (accueil API)
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'API PHENIX TECH active 🚀',
        endpoints: {
            products: '/api/products',
            auth: '/api/auth',
            cart: '/api/cart',
            payments: '/api/payments'
        }
    });
});

// Gestion des erreurs 404
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route non trouvée' });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
    console.error('❌ Erreur:', err.stack);
    res.status(500).json({ 
        success: false, 
        message: 'Erreur interne du serveur',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Configuration Socket.io
io.on('connection', (socket) => {
    console.log('🔌 Nouveau client connecté:', socket.id);
    
    // Rejoindre une room pour un utilisateur spécifique
    socket.on('join:user', (userId) => {
        socket.join(`user:${userId}`);
        console.log(`👤 User ${userId} rejoint sa room`);
    });
    
    // Rejoindre la room admin
    socket.on('join:admin', () => {
        socket.join('admin');
        console.log('🛡️ Admin rejoint la room');
    });
    
    socket.on('disconnect', () => {
        console.log('🔌 Client déconnecté:', socket.id);
    });
});

// Connexion à MongoDB (tentatives en arrière-plan) et démarrage du serveur
const PORT = process.env.PORT || 3000;

// Lancer la tentative de connexion sans bloquer le démarrage du serveur
connectDB({ retries: 5, delayMs: 5000 }).catch(err => {
    console.error('❌ Erreur lors de la tentative de connexion MongoDB (background):', err);
});

// Gestion des erreurs d'écoute (ex. port déjà utilisé)
server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
        console.error(`❌ Le port ${PORT} est déjà utilisé. Fermez l'autre processus ou changez PORT dans .env.`);
        process.exit(1);
    }
    console.error('❌ Erreur serveur non gérée:', err);
    process.exit(1);
});

server.listen(PORT, () => {
    console.log(`🚀 Serveur backend démarré sur le port ${PORT}`);
    console.log(`🌍 API disponible sur http://localhost:${PORT}/api`);
    console.log(`📁 Uploads disponibles sur http://localhost:${PORT}/uploads`);
    console.log(`🔗 Socket.io actif sur http://localhost:${PORT}`);
});