/**
 * Seed des paramètres par défaut
 * Exécution: node seeds/seedSettings.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Settings = require('../models/Settings');

async function seedSettings() {
    try {
        // Connexion à MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/phenix', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log('📊 Vérification des paramètres...');

        // Vérifier si les paramètres existent
        let settings = await Settings.findOne();

        if (!settings) {
            console.log('➕ Création des paramètres par défaut...');
            settings = new Settings({
                siteName: 'PHENIX TECH-SERVICES',
                siteDescription: 'Votre partenaire technologique de confiance',
                siteEmail: 'contact@phenixtech.com',
                sitePhone: '+225 07 00 00 00 00',
                siteAddress: 'Abidjan, Côte d\'Ivoire',
                
                shippingFee: 2000,
                shippingFreeAbove: 50000,
                shippingDelay: '2-3 jours',
                minOrderAmount: 0,

                paymentMethods: {
                    mobilePayment: { 
                        enabled: true,
                        description: 'Paiement mobile (MTN, Moov, Orange)'
                    },
                    transfer: {
                        enabled: true,
                        description: 'Virement bancaire'
                    },
                    creditCard: {
                        enabled: false,
                        description: 'Cartes bancaires'
                    },
                    cash: {
                        enabled: false,
                        description: 'Paiement à la livraison'
                    }
                },

                paymentConfig: {
                    mobileOperator: 'MOOV',
                    bankDetails: {
                        accountName: '',
                        accountNumber: '',
                        bankName: ''
                    }
                },

                notifications: {
                    emailNotifications: {
                        enabled: true
                    },
                    smsNotifications: {
                        enabled: true,
                        provider: 'MOOV'
                    }
                },

                security: {
                    requireEmailVerification: true,
                    requirePhoneVerification: false,
                    passwordMinLength: 6,
                    sessionTimeout: 1800,
                    maxLoginAttempts: 5
                },

                policies: {
                    returnPolicy: '30 jours de retour avec facture.',
                    privacyPolicy: 'Votre confidentialité est importante pour nous.',
                    termsOfService: 'En utilisant notre site, vous acceptez nos conditions d\'utilisation.',
                    warrantySetting: ''
                }
            });

            await settings.save();
            console.log('✅ Paramètres par défaut créés avec succès!');
        } else {
            console.log('✅ Les paramètres existent déjà.');
            console.log('Paramètres actuels:', {
                siteName: settings.siteName,
                shippingFee: settings.shippingFee,
                paymentMethods: Object.keys(settings.paymentMethods)
            });
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Erreur lors du seed:', error);
        process.exit(1);
    }
}

seedSettings();
