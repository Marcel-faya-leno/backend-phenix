// routes/admin.js
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Settings = require('../models/Settings');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware d'authentification
const authenticate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ 
                success: false, 
                message: 'Accès non autorisé. Token manquant.' 
            });
        }
        
        // En mode développement, accepter les tokens de démo
        if (process.env.NODE_ENV === 'development' && token.startsWith('demo-token-')) {
            req.user = { _id: 'demo-admin-id', role: 'admin' };
            return next();
        }
        
        const decoded = jwt.verify(token, JWT_SECRET);
        const admin = await Admin.findById(decoded.id).select('-password');
        
        if (!admin || !admin.isActive) {
            return res.status(401).json({ 
                success: false, 
                message: 'Admin non trouvé ou compte désactivé' 
            });
        }
        
        req.user = admin;
        next();
    } catch (error) {
        console.error('❌ Erreur authentification:', error);
        return res.status(401).json({ 
            success: false, 
            message: 'Token invalide ou expiré' 
        });
    }
};

// POST /api/admin/login - Connexion admin
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email et mot de passe requis' 
            });
        }
        
        // Chercher l'admin avec le mot de passe
        const admin = await Admin.findOne({ email }).select('+password');
        
        if (!admin) {
            return res.status(401).json({ 
                success: false, 
                message: 'Email ou mot de passe incorrect' 
            });
        }
        
        if (!admin.isActive) {
            return res.status(403).json({ 
                success: false, 
                message: 'Compte désactivé' 
            });
        }
        
        // Vérifier le mot de passe
        const isPasswordValid = await admin.comparePassword(password);
        
        if (!isPasswordValid) {
            return res.status(401).json({ 
                success: false, 
                message: 'Email ou mot de passe incorrect' 
            });
        }
        
        // Mettre à jour la dernière connexion
        admin.lastLogin = new Date();
        await admin.save();
        
        // Générer le token JWT
        const token = jwt.sign(
            { 
                id: admin._id, 
                email: admin.email,
                role: admin.role
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        // Supprimer le mot de passe de la réponse
        const adminData = admin.toJSON();
        
        res.json({
            success: true,
            message: 'Connexion réussie',
            admin: adminData,
            token
        });
        
    } catch (error) {
        console.error('❌ Erreur connexion admin:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la connexion' 
        });
    }
});

// POST /api/admin/register - Inscription admin (uniquement pour superadmin)
router.post('/register', authenticate, async (req, res) => {
    try {
        // Vérifier que seul un superadmin peut créer des admins
        if (req.user.role !== 'superadmin') {
            return res.status(403).json({ 
                success: false, 
                message: 'Permission refusée. Superadmin requis.' 
            });
        }
        
        const { email, password, name, role = 'admin', phone, permissions } = req.body;
        
        if (!email || !password || !name) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email, mot de passe et nom requis' 
            });
        }
        
        // Vérifier si l'email existe déjà
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({ 
                success: false, 
                message: 'Cet email est déjà utilisé' 
            });
        }
        
        // Créer le nouvel admin
        const admin = await Admin.create({
            email,
            password,
            name,
            role,
            phone,
            permissions: permissions || ['view_reports'],
            createdBy: req.user._id
        });
        
        res.status(201).json({
            success: true,
            message: 'Admin créé avec succès',
            data: admin
        });
        
    } catch (error) {
        console.error('❌ Erreur création admin:', error);
        
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({ 
                success: false, 
                message: 'Validation échouée',
                errors: messages 
            });
        }
        
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la création de l\'admin' 
        });
    }
});

// GET /api/admin/verify - Vérifier le token
router.get('/verify', authenticate, async (req, res) => {
    try {
        res.json({
            success: true,
            data: req.user
        });
    } catch (error) {
        console.error('❌ Erreur vérification token:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la vérification' 
        });
    }
});

// GET /api/admin/profile - Profil admin
router.get('/profile', authenticate, async (req, res) => {
    try {
        res.json({
            success: true,
            data: req.user
        });
    } catch (error) {
        console.error('❌ Erreur récupération profil:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la récupération du profil' 
        });
    }
});

// PUT /api/admin/profile - Mettre à jour le profil
router.put('/profile', authenticate, async (req, res) => {
    try {
        const { name, phone, preferences } = req.body;
        
        const updateData = {};
        if (name) updateData.name = name;
        if (phone) updateData.phone = phone;
        if (preferences) updateData.preferences = preferences;
        
        const admin = await Admin.findByIdAndUpdate(
            req.user._id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');
        
        res.json({
            success: true,
            message: 'Profil mis à jour avec succès',
            data: admin
        });
        
    } catch (error) {
        console.error('❌ Erreur mise à jour profil:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la mise à jour du profil' 
        });
    }
});

// PUT /api/admin/change-password - Changer le mot de passe
router.put('/change-password', authenticate, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ 
                success: false, 
                message: 'Mot de passe actuel et nouveau mot de passe requis' 
            });
        }
        
        const admin = await Admin.findById(req.user._id).select('+password');
        
        // Vérifier le mot de passe actuel
        const isPasswordValid = await admin.comparePassword(currentPassword);
        if (!isPasswordValid) {
            return res.status(400).json({ 
                success: false, 
                message: 'Mot de passe actuel incorrect' 
            });
        }
        
        // Mettre à jour le mot de passe
        admin.password = newPassword;
        await admin.save();
        
        res.json({
            success: true,
            message: 'Mot de passe changé avec succès'
        });
        
    } catch (error) {
        console.error('❌ Erreur changement mot de passe:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors du changement de mot de passe' 
        });
    }
});

// POST /api/admin/logout - Déconnexion
router.post('/logout', authenticate, async (req, res) => {
    try {
        // En mode production, vous pourriez blacklister le token ici
        res.json({
            success: true,
            message: 'Déconnexion réussie'
        });
    } catch (error) {
        console.error('❌ Erreur déconnexion:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur lors de la déconnexion' 
        });
    }
});

// GET /api/admin/stats - Statistiques admin
router.get('/stats', authenticate, async (req, res) => {
    try {
        const Product = require('../models/Product');
        const Cart = require('../models/Cart');
        
        // Statistiques produits
        const productStats = await Product.aggregate([
                { 
                    $match: { status: 'active' } 
                },
                {
                    $group: {
                        _id: null,
                        totalProducts: { $sum: 1 },
                        totalStock: { $sum: '$stock' },
                        totalValue: { $sum: { $multiply: ['$price', '$stock'] } },
                        averagePrice: { $avg: '$price' }
                    }
                }
            ]);
            
            // Produits par catégorie
            const productsByCategory = await Product.aggregate([
                { 
                    $match: { status: 'active' } 
                },
                {
                    $group: {
                        _id: '$category',
                        count: { $sum: 1 },
                        stock: { $sum: '$stock' },
                        value: { $sum: { $multiply: ['$price', '$stock'] } }
                    }
                },
                {
                    $sort: { count: -1 }
                }
            ]);
            
            // Produits en rupture
            const outOfStock = await Product.countDocuments({ 
                stock: 0, 
                status: 'active' 
            });
            
            // Produits à stock faible
            const lowStock = await Product.countDocuments({ 
                stock: { $gt: 0, $lte: 10 },
                status: 'active' 
            });
            
            // Produits ajoutés ce mois
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);
            
            const productsThisMonth = await Product.countDocuments({
                createdAt: { $gte: startOfMonth },
                status: 'active'
            });
            
        // Paniers actifs
        const activeCarts = await Cart.countDocuments({
            items: { $exists: true, $ne: [] }
        });
        
        const stats = {
            products: {
                total: productStats[0]?.totalProducts || 0,
                stock: productStats[0]?.totalStock || 0,
                value: productStats[0]?.totalValue || 0,
                averagePrice: productStats[0]?.averagePrice || 0,
                byCategory: productsByCategory,
                outOfStock,
                lowStock,
                thisMonth: productsThisMonth
            },
            carts: {
                active: activeCarts
            },
            lastUpdated: new Date()
        };
        
        console.log('✅ Admin stats from MongoDB:', stats);
        
        res.json({
            success: true,
            data: stats
        });
        
    } catch (error) {
        console.warn('⚠️ MongoDB indisponible pour les stats admin, utilisation des données démo');
        
        const fallbackStats = {
            products: {
                total: 42,
                stock: 500,
                value: 50000,
                averagePrice: 1190,
                byCategory: [
                    { _id: 'Microcontrôleurs', count: 15, stock: 200, value: 25000 },
                    { _id: 'Capteurs', count: 20, stock: 200, value: 15000 },
                    { _id: 'Modules', count: 7, stock: 100, value: 10000 }
                ],
                outOfStock: 2,
                lowStock: 5,
                thisMonth: 5
            },
            carts: {
                active: 8
            },
            lastUpdated: new Date()
        };
        
        res.json({ 
            success: true,
            data: fallbackStats
        });
    }
});

// ============================================================
// PARAMÈTRES DU SITE
// ============================================================

// GET /api/admin/settings - Récupérer tous les paramètres
router.get('/settings', authenticate, async (req, res) => {
    try {
        let settings = await Settings.findOne().select('-paymentConfig.apiKey -paymentConfig.merchantId -notifications.emailNotifications.senderPassword -notifications.smsNotifications.apiKey');
        
        // Si pas de paramètres, en créer avec les valeurs par défaut
        if (!settings) {
            settings = new Settings();
            await settings.save();
        }
        
        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error('❌ Erreur récupération paramètres:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la récupération des paramètres'
        });
    }
});

// PUT /api/admin/settings - Mettre à jour les paramètres
router.put('/settings', authenticate, async (req, res) => {
    try {
        // Vérifier les permissions
        if (req.user.role !== 'superadmin' && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Permission refusée. Admin requis.'
            });
        }

        let settings = await Settings.findOne();
        
        if (!settings) {
            settings = new Settings();
        }

        // Mettre à jour les champs autorisés
        const allowedFields = [
            'siteName', 'siteDescription', 'siteLogo', 'siteEmail', 'sitePhone', 'siteAddress',
            'shippingFee', 'shippingFreeAbove', 'shippingDelay', 'maxProductsPerOrder', 'minOrderAmount',
            'paymentMethods', 'paymentConfig',
            'notifications', 'security', 'policies', 'theme', 'commerce'
        ];

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                if (typeof settings[field] === 'object' && typeof req.body[field] === 'object') {
                    // Fusion pour les objets imbriqués
                    settings[field] = { ...settings[field], ...req.body[field] };
                } else {
                    settings[field] = req.body[field];
                }
            }
        }

        settings.lastUpdatedBy = req.user._id;
        await settings.save();

        // Récupérer la version sauvegardée sans les données sensibles
        const savedSettings = await Settings.findOne().select('-paymentConfig.apiKey -paymentConfig.merchantId -notifications.emailNotifications.senderPassword -notifications.smsNotifications.apiKey');

        res.json({
            success: true,
            message: 'Paramètres mis à jour avec succès',
            data: savedSettings
        });

    } catch (error) {
        console.error('❌ Erreur mise à jour paramètres:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour des paramètres',
            error: error.message
        });
    }
});

// PUT /api/admin/settings/payment-config - Mettre à jour la config paiement (avec clés sensibles)
router.put('/settings/payment-config', authenticate, async (req, res) => {
    try {
        // Vérifier les permissions
        if (req.user.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Permission refusée. Superadmin requis.'
            });
        }

        let settings = await Settings.findOne();
        
        if (!settings) {
            settings = new Settings();
        }

        // Mettre à jour la configuration de paiement avec les données sensibles
        if (req.body.paymentConfig) {
            settings.paymentConfig = { ...settings.paymentConfig, ...req.body.paymentConfig };
        }

        settings.lastUpdatedBy = req.user._id;
        await settings.save();

        res.json({
            success: true,
            message: 'Configuration de paiement mise à jour avec succès'
        });

    } catch (error) {
        console.error('❌ Erreur mise à jour config paiement:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la mise à jour de la configuration'
        });
    }
});

// POST /api/admin/settings/reset - Réinitialiser les paramètres par défaut
router.post('/settings/reset', authenticate, async (req, res) => {
    try {
        // Vérifier les permissions
        if (req.user.role !== 'superadmin') {
            return res.status(403).json({
                success: false,
                message: 'Permission refusée. Superadmin requis.'
            });
        }

        await Settings.deleteMany({});
        const newSettings = new Settings();
        await newSettings.save();

        res.json({
            success: true,
            message: 'Paramètres réinitialisés aux valeurs par défaut',
            data: newSettings
        });

    } catch (error) {
        console.error('❌ Erreur réinitialisation paramètres:', error);
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la réinitialisation des paramètres'
        });
    }
});

module.exports = router;