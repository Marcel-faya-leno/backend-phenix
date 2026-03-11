// models/Settings.js
const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
    // Configuration du site
    siteName: { type: String, default: 'PHENIX TECH-SERVICES' },
    siteDescription: { type: String, default: 'Votre partenaire technologique' },
    siteLogo: { type: String, default: '' },
    siteEmail: { type: String, default: 'contact@phenixtech.com' },
    sitePhone: { type: String, default: '+225' },
    siteAddress: { type: String, default: '' },

    // Paramètres logistiques
    shippingFee: { type: Number, default: 0 },
    shippingFreeAbove: { type: Number, default: 50000 },
    shippingDelay: { type: String, default: '2-3 jours' },
    maxProductsPerOrder: { type: Number, default: 100 },
    minOrderAmount: { type: Number, default: 0 },

    // Moyens de paiement
    paymentMethods: new mongoose.Schema({
        creditCard: new mongoose.Schema({
            enabled: { type: Boolean, default: false },
            description: { type: String, default: 'Cartes bancaires' }
        }, { _id: false }),
        mobilePayment: new mongoose.Schema({
            enabled: { type: Boolean, default: true },
            description: { type: String, default: 'Paiement mobile' }
        }, { _id: false }),
        transfer: new mongoose.Schema({
            enabled: { type: Boolean, default: true },
            description: { type: String, default: 'Virement bancaire' }
        }, { _id: false }),
        cash: new mongoose.Schema({
            enabled: { type: Boolean, default: false },
            description: { type: String, default: 'Paiement à la livraison' }
        }, { _id: false })
    }, { _id: false }),

    // Config paiement
    paymentConfig: new mongoose.Schema({
        mobileOperator: { type: String, enum: ['MTN', 'MOOV', 'ORANGE'], default: 'MOOV' },
        apiKey: { type: String, default: '', select: false },
        merchantId: { type: String, default: '', select: false },
        bankDetails: new mongoose.Schema({
            accountName: { type: String, default: '' },
            accountNumber: { type: String, default: '' },
            bankName: { type: String, default: '' }
        }, { _id: false })
    }, { _id: false }),

    // Notifications
    notifications: new mongoose.Schema({
        emailNotifications: new mongoose.Schema({
            enabled: { type: Boolean, default: true },
            smtpServer: { type: String, default: '' },
            smtpPort: { type: Number, default: 587 },
            senderEmail: { type: String, default: '' },
            senderPassword: { type: String, default: '', select: false }
        }, { _id: false }),
        smsNotifications: new mongoose.Schema({
            enabled: { type: Boolean, default: true },
            provider: { type: String, enum: ['MOOV', 'MTN', 'ORANGE', 'CUSTOM'], default: 'MOOV' },
            apiKey: { type: String, default: '', select: false }
        }, { _id: false })
    }, { _id: false }),

    // Sécurité
    security: new mongoose.Schema({
        requireEmailVerification: { type: Boolean, default: true },
        requirePhoneVerification: { type: Boolean, default: false },
        passwordMinLength: { type: Number, default: 6 },
        sessionTimeout: { type: Number, default: 1800 },
        maxLoginAttempts: { type: Number, default: 5 }
    }, { _id: false }),

    // Politiques
    policies: new mongoose.Schema({
        returnPolicy: { type: String, default: '30 jours de retour' },
        privacyPolicy: { type: String, default: '' },
        termsOfService: { type: String, default: '' },
        warrantySetting: { type: String, default: '' }
    }, { _id: false }),

    // Thème
    theme: new mongoose.Schema({
        primaryColor: { type: String, default: '#2A5CAA' },
        secondaryColor: { type: String, default: '#FF6B35' },
        accentColor: { type: String, default: '#00A896' },
        fontFamily: { type: String, default: 'Segoe UI, system-ui' }
    }, { _id: false }),

    // Commerce
    commerce: new mongoose.Schema({
        taxRate: { type: Number, default: 0 },
        discountStrategy: { type: String, enum: ['PERCENTAGE', 'FIXED'], default: 'PERCENTAGE' },
        automaticDiscountActive: { type: Boolean, default: false },
        loyaltyPointsActive: { type: Boolean, default: false }
    }, { _id: false }),

    // Maintenance
    maintenanceMode: new mongoose.Schema({
        enabled: { type: Boolean, default: false },
        maintenanceMessage: { type: String, default: 'Le site est en maintenance' }
    }, { _id: false }),

    // Métadonnées
    lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
    updatedAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Middleware pour mettre à jour updatedAt
SettingsSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

module.exports = mongoose.model('Settings', SettingsSchema);
