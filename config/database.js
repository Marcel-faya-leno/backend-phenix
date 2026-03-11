// config/database.js
const mongoose = require('mongoose');

const connectDB = async (options = {}) => {
    const { retries = 3, delayMs = 5000 } = options;
    
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/phenix-tech';
    
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            console.log(`🔗 Tentative de connexion MongoDB (${attempt}/${retries})...`);
            
            await mongoose.connect(MONGODB_URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            });
            
            console.log('✅ MongoDB connecté avec succès');
            return mongoose.connection;
            
        } catch (error) {
            console.error(`❌ Échec de connexion MongoDB (tentative ${attempt}/${retries}):`, error.message);
            
            if (attempt < retries) {
                console.log(`⏳ Nouvelle tentative dans ${delayMs/1000} secondes...`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
            } else {
                console.log('⚠️ Mode démo activé - Base de données non connectée');
                // Ne pas lancer d'erreur pour permettre le mode démo
                return null;
            }
        }
    }
};

// Gestionnaire d'événements de connexion
mongoose.connection.on('connected', () => {
    console.log('✅ Mongoose connecté à MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('❌ Erreur de connexion Mongoose:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('⚠️ Mongoose déconnecté de MongoDB');
});

process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('⏹️ Connexion MongoDB fermée (SIGINT)');
    process.exit(0);
});

module.exports = connectDB;