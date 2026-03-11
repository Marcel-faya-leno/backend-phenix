const express = require('express');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Register User
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Tous les champs sont requis' });
        }

        // Vérifier si l'utilisateur existe
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Cet email est déjà utilisé' });
        }

        // Hasher le mot de passe
        const hashedPassword = await bcryptjs.hash(password, 10);

        const user = new User({
            name,
            email,
            password: hashedPassword,
            phone: phone || ''
        });

        await user.save();

        // Générer JWT
        const token = jwt.sign({ id: user._id, email: user.email, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            success: true,
            message: 'Utilisateur créé avec succès',
            token,
            user: { id: user._id, name: user.name, email: user.email }
        });
    } catch (error) {
        console.error('❌ Erreur lors de l\'enregistrement:', error);
        res.status(500).json({ success: false, message: 'Erreur du serveur' });
    }
});

// Alias pour compatibilité frontend
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Tous les champs sont requis' });
        }

        // Vérifier si l'utilisateur existe
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Cet email est déjà utilisé' });
        }

        // Hasher le mot de passe
        const hashedPassword = await bcryptjs.hash(password, 10);

        const user = new User({
            name,
            email,
            password: hashedPassword,
            phone: phone || ''
        });

        await user.save();

        // Générer JWT
        const token = jwt.sign({ id: user._id, email: user.email, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            success: true,
            message: 'Utilisateur créé avec succès',
            token,
            user: { id: user._id, name: user.name, email: user.email }
        });
    } catch (error) {
        console.error('❌ Erreur lors de l\'enregistrement:', error);
        res.status(500).json({ success: false, message: 'Erreur du serveur' });
    }
});

// Login User
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email et mot de passe requis' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Identifiants invalides' });
        }

        const isPasswordValid = await bcryptjs.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: 'Identifiants invalides' });
        }

        const token = jwt.sign({ id: user._id, email: user.email, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            success: true,
            message: 'Connexion réussie',
            token,
            user: { id: user._id, name: user.name, email: user.email }
        });
    } catch (error) {
        console.error('❌ Erreur lors de la connexion:', error);
        res.status(500).json({ success: false, message: 'Erreur du serveur' });
    }
});

// Register Admin
router.post('/admin/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Tous les champs sont requis' });
        }

        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({ success: false, message: 'Cet admin existe déjà' });
        }

        const hashedPassword = await bcryptjs.hash(password, 10);

        const admin = new Admin({
            name,
            email,
            password: hashedPassword
        });

        await admin.save();

        const token = jwt.sign({ id: admin._id, email: admin.email, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            success: true,
            message: 'Admin créé avec succès',
            token,
            admin: { id: admin._id, name: admin.name, email: admin.email }
        });
    } catch (error) {
        console.error('❌ Erreur lors de la création admin:', error);
        res.status(500).json({ success: false, message: 'Erreur du serveur' });
    }
});

// Login Admin
router.post('/admin/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email et mot de passe requis' });
        }

        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(401).json({ success: false, message: 'Identifiants admin invalides' });
        }

        const isPasswordValid = await bcryptjs.compare(password, admin.password);
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: 'Identifiants admin invalides' });
        }

        const token = jwt.sign({ id: admin._id, email: admin.email, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });

        res.json({
            success: true,
            message: 'Connexion admin réussie',
            token,
            admin: { id: admin._id, name: admin.name, email: admin.email }
        });
    } catch (error) {
        console.error('❌ Erreur lors de la connexion admin:', error);
        res.status(500).json({ success: false, message: 'Erreur du serveur' });
    }
});

// Register Admin (créer un nouvel admin)
router.post('/admin-signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Tous les champs sont requis' });
        }

        // Vérifier si l'admin existe
        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({ success: false, message: 'Cet email admin est déjà utilisé' });
        }

        // Créer l'admin - le modèle hashera automatiquement le mot de passe
        const admin = new Admin({
            name,
            email,
            password,
            role: 'admin',
            isActive: true
        });

        await admin.save();

        res.status(201).json({
            success: true,
            message: 'Admin créé avec succès',
            admin: { id: admin._id, name: admin.name, email: admin.email }
        });
    } catch (error) {
        console.error('❌ Erreur lors de la création de l\'admin:', error);
        res.status(500).json({ success: false, message: 'Erreur du serveur' });
    }
});

// Initialiser un admin par défaut (endpoint de développement)
router.post('/init-admin', async (req, res) => {
    try {
        // Vérifier si un admin existe déjà
        const existingAdmin = await Admin.findOne({ email: 'admin@phenix-tech.com' });
        
        if (existingAdmin) {
            return res.status(400).json({ success: false, message: 'Admin existe déjà' });
        }

        // Créer l'admin par défaut - le modèle hashera automatiquement le mot de passe
        const admin = new Admin({
            name: 'Administrateur PHENIX',
            email: 'admin@phenix-tech.com',
            password: 'admin123',
            role: 'admin',
            isActive: true
        });

        await admin.save();

        res.status(201).json({
            success: true,
            message: 'Admin créé avec succès',
            admin: { id: admin._id, name: admin.name, email: admin.email }
        });
    } catch (error) {
        console.error('❌ Erreur lors de la création de l\'admin:', error);
        res.status(500).json({ success: false, message: 'Erreur du serveur' });
    }
});

// Verify Token
router.get('/verify', (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, message: 'Token manquant' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        res.json({ success: true, user: decoded });
    } catch (error) {
        res.status(401).json({ success: false, message: 'Token invalide' });
    }
});

module.exports = router;
