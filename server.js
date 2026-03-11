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
const io = socketIo(server, {
    cors: {
        origin: [
            process.env.FRONTEND_URL || "http://localhost:5500",
            "http://localhost:3000",
            "http://localhost:5501",
            "http://127.0.0.1:5500",
            "http://127.0.0.1:5501",
            "http://127.0.0.1:3000"
        ],
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    },
    transports: ['websocket', 'polling']
});

// Middleware CORS
app.use(cors({
    origin: [
        process.env.FRONTEND_URL || "http://localhost:5500",
        "http://localhost:3000",
        "http://localhost:5501",
        "http://127.0.0.1:5500",
        "http://127.0.0.1:5501",
        "http://127.0.0.1:3000"
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200
}));

// Traiter les requêtes OPTIONS explicitement
app.options('*', cors());

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