/**
 * Routes d'authentification Admin avec code d'accès
 */

const express = require('express');
const router = express.Router();
const {
    verifyAccessCode,
    generateAdminToken,
    verifyAdminAuth,
    requireAdminAuth
} = require('../middleware/authMiddleware');

/**
 * POST /api/admin/login
 * Connexion admin avec code d'accès
 */
router.post('/login', verifyAccessCode, (req, res) => {
    try {
        const code = req.body.code;
        const isDemoMode = req.isDemoMode || false;

        // Générer le token
        const token = generateAdminToken(code);

        res.json({
            success: true,
            message: isDemoMode ? '✅ Connexion démo réussie' : '✅ Connexion réussie',
            token,
            isDemoMode,
            expiresIn: '24h',
            admin: {
                role: 'superadmin',
                permissions: [
                    'manage_products',
                    'manage_orders',
                    'manage_payments',
                    'manage_settings',
                    'view_reports',
                    'manage_users'
                ]
            }
        });

        console.log('✅ Admin connecté avec succès');
    } catch (error) {
        console.error('❌ Erreur lors de la connexion:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la connexion'
        });
    }
});

/**
 * POST /api/admin/logout
 * Déconnexion admin
 */
router.post('/logout', verifyAdminAuth, (req, res) => {
    try {
        res.json({
            success: true,
            message: '✅ Déconnexion réussie'
        });

        console.log('✅ Admin déconnecté');
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la déconnexion'
        });
    }
});

/**
 * GET /api/admin/verify
 * Vérifier si l'admin est authentifié
 */
router.get('/verify', verifyAdminAuth, requireAdminAuth, (req, res) => {
    try {
        res.json({
            success: true,
            authenticated: true,
            isDemoMode: req.isDemoMode || false,
            admin: {
                role: 'superadmin',
                permissions: [
                    'manage_products',
                    'manage_orders',
                    'manage_payments',
                    'manage_settings',
                    'view_reports',
                    'manage_users'
                ]
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur de vérification'
        });
    }
});

/**
 * GET /api/admin/status
 * Vérifier le statut de l'authentification
 */
router.get('/status', (req, res) => {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '') || 
                     req.cookies?.admin_token || 
                     req.query?.token;

        const isAuthenticated = !!token && token.startsWith('ADMIN-');

        res.json({
            success: true,
            authenticated: isAuthenticated,
            mode: process.env.DEMO_MODE === 'true' ? 'demo' : 'production'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur de vérification du statut'
        });
    }
});

module.exports = router;
