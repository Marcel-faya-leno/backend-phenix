// config/database.js
const mongoose = require('mongoose');

const connectDB = async (options = {}) => {
    const { retries = 3, delayMs = 5000 } = options;
    
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/phenix-tech';
    
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            console.log(`ðŸ”— Tentative de connexion MongoDB (${attempt}/${retries})...`);
            
            await mongoose.connect(MONGODB_URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000,
            });
            
            console.log('âœ… MongoDB connectÃ© avec succÃ¨s');
            return mongoose.connection;
            
        } catch (error) {
            console.error(`âŒ Ã‰chec de connexion MongoDB (tentative ${attempt}/${retries}):`, error.message);
            
            if (attempt < retries) {
                console.log(`â³ Nouvelle tentative dans ${delayMs/1000} secondes...`);
                await new Promise(resolve => setTimeout(resolve, delayMs));
            } else {
                console.log('âš ï¸ Mode dÃ©mo activÃ© - Base de donnÃ©es non connectÃ©e');
                // Ne pas lancer d'erreur pour permettre le mode dÃ©mo
                return null;
            }
        }
    }
};

// Gestionnaire d'Ã©vÃ©nements de connexion
mongoose.connection.on('connected', () => {
    console.log('âœ… Mongoose connectÃ© Ã  MongoDB');
});

mongoose.connection.on('error', (err) => {
    console.error('âŒ Erreur de connexion Mongoose:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('âš ï¸ Mongoose dÃ©connectÃ© de MongoDB');
});

process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('â¹ï¸ Connexion MongoDB fermÃ©e (SIGINT)');
    process.exit(0);
});

module.exports = connectDB;
