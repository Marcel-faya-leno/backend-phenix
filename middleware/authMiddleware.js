/**
 * Middleware d'authentification Admin
 * Protège les routes admin avec vérification du code d'accès
 */

const ADMIN_ACCESS_CODE = process.env.ADMIN_ACCESS_CODE || '1234';
const DEMO_MODE = process.env.DEMO_MODE === 'true' || process.env.DEMO_MODE === '1';

/**
 * Vérifier si l'admin est authentifié
 */
function verifyAdminAuth(req, res, next) {
    try {
        const token = req.headers.authorization?.replace('Bearer ', '') || 
                     req.cookies?.admin_token || 
                     req.body?.token ||
                     req.query?.token;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Authentification requise - Token manquant'
            });
        }

        // Vérifier le token
        if (token === `ADMIN-${ADMIN_ACCESS_CODE}-${Date.now().toString().slice(0, -5)}` || 
            token.startsWith('ADMIN-') && token.includes(ADMIN_ACCESS_CODE)) {
            req.adminAuthenticated = true;
            req.adminToken = token;
            return next();
        }

        // Mode démo
        if (DEMO_MODE && token.startsWith('DEMO-ADMIN-')) {
            req.adminAuthenticated = true;
            req.adminToken = token;
            req.isDemoMode = true;
            return next();
        }

        return res.status(401).json({
            success: false,
            message: 'Token invalide ou expiré'
        });
    } catch (error) {
        console.error('❌ Erreur authentification:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Erreur serveur lors de la vérification'
        });
    }
}

/**
 * Vérifier le code d'accès lors de la connexion
 */
function verifyAccessCode(req, res, next) {
    try {
        const code = req.body?.code?.toString().trim();

        if (!code) {
            return res.status(400).json({
                success: false,
                message: 'Code d\'accès requis'
            });
        }

        // Vérifier le code
        if (code === ADMIN_ACCESS_CODE) {
            req.accessCodeValid = true;
            return next();
        }

        // Mode démo
        if (DEMO_MODE && (code === '0000' || code === 'DEMO')) {
            req.accessCodeValid = true;
            req.isDemoMode = true;
            return next();
        }

        console.warn(`⚠️ Tentative de connexion avec mauvais code: ${code}`);
        
        return res.status(401).json({
            success: false,
            message: 'Code d\'accès incorrect',
            isDemoMode: DEMO_MODE
        });
    } catch (error) {
        console.error('❌ Erreur vérification code:', error.message);
        return res.status(500).json({
            success: false,
            message: 'Erreur serveur'
        });
    }
}

/**
 * Générer un token d'authentification
 */
function generateAdminToken(code = ADMIN_ACCESS_CODE) {
    // Token avec timestap (expire après 24h)
    const timestamp = Math.floor(Date.now() / 1000);
    const token = `ADMIN-${code}-${timestamp}`;
    return token;
}

/**
 * Vérifier si le token n'a pas expiré
 */
function isTokenValid(token, maxAgeHours = 24) {
    try {
        const parts = token.split('-');
        if (parts.length < 3) return false;

        const timestamp = parseInt(parts[parts.length - 1]);
        const now = Math.floor(Date.now() / 1000);
        const maxAge = maxAgeHours * 3600;

        return (now - timestamp) < maxAge;
    } catch (error) {
        return false;
    }
}

/**
 * Middleware pour les routes protégées
 */
function requireAdminAuth(req, res, next) {
    if (!req.adminAuthenticated) {
        return res.status(401).json({
            success: false,
            message: 'Accès administrateur requis'
        });
    }
    next();
}

module.exports = {
    verifyAdminAuth,
    verifyAccessCode,
    generateAdminToken,
    isTokenValid,
    requireAdminAuth
};
