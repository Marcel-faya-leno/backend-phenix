// authController.js - ContrÃ´leur pour l'authentification
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcryptjs = require('bcryptjs');

const authController = {
    // Enregistrement d'un utilisateur
    async registerUser(req, res) {
        try {
            const { name, email, phone, password, address } = req.body;

            // Validation basique
            if (!email || !password || !name) {
                return res.status(400).json({ error: 'Champs obligatoires manquants' });
            }

            // VÃ©rifier si l'utilisateur existe
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(409).json({ error: 'L\'email existe dÃ©jÃ ' });
            }

            // CrÃ©er un nouvel utilisateur
            const user = new User({
                name,
                email,
                phone,
                password,
                address
            });

            await user.save();

            // CrÃ©er un token JWT
            const token = jwt.sign(
                { userId: user._id, role: user.role },
                process.env.JWT_SECRET || 'secret-key',
                { expiresIn: '7d' }
            );

            res.status(201).json({
                message: 'Utilisateur crÃ©Ã© avec succÃ¨s',
                user: { id: user._id, name: user.name, email: user.email },
                token
            });
        } catch (error) {
            console.error('Erreur enregistrement:', error);
            res.status(500).json({ error: error.message });
        }
    },

    // Connexion d'un utilisateur
    async loginUser(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ error: 'Email et mot de passe requis' });
            }

            const user = await User.findOne({ email }).select('+password');
            if (!user || !(await user.comparePassword(password))) {
                return res.status(401).json({ error: 'Identifiants invalides' });
            }

            const token = jwt.sign(
                { userId: user._id, role: user.role },
                process.env.JWT_SECRET || 'secret-key',
                { expiresIn: '7d' }
            );

            res.json({
                message: 'Connexion rÃ©ussie',
                user: { id: user._id, name: user.name, email: user.email, role: user.role },
                token
            });
        } catch (error) {
            console.error('Erreur connexion:', error);
            res.status(500).json({ error: error.message });
        }
    },

    // RÃ©cupÃ©rer le profil utilisateur
    async getProfile(req, res) {
        try {
            const user = await User.findById(req.user.userId).select('-password');
            if (!user) {
                return res.status(404).json({ error: 'Utilisateur non trouvÃ©' });
            }
            res.json(user);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Mettre Ã  jour le profil
    async updateProfile(req, res) {
        try {
            const user = await User.findByIdAndUpdate(
                req.user.userId,
                req.body,
                { new: true, runValidators: true }
            );
            res.json(user);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = authController;
