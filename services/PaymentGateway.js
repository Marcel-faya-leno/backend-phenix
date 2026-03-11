/**
 * PaymentGateway.js - Intégration avec les vraies APIs de paiement
 * Opérateurs supportés: Orange Money Guinea, MTN MoMo Guinea, Wave
 */

const axios = require('axios');

// ==================== ORANGE MONEY GUINÉE ====================
class OrangeMoneyGN {
  constructor() {
    this.name = 'Orange Money Guinea';
    this.code = 'orange';
    this.apiKey = process.env.ORANGE_MONEY_API_KEY;
    this.apiSecret = process.env.ORANGE_MONEY_API_SECRET;
    this.merchantId = process.env.ORANGE_MONEY_MERCHANT_ID || 'PHENIX001';
    this.apiUrl = process.env.ORANGE_MONEY_API_URL || 'https://api.orange.com/gn/payment';
  }

  async initiatePayment(amount, phoneNumber, orderId, email) {
    try {
      console.log('🟠 Orange Money: Initiation du paiement');
      console.log(`   Montant: ${amount} GNF | Numéro: ${phoneNumber}`);

      // Vérifier que les credentials sont configurés
      if (!this.apiKey || this.apiKey === 'test_key' || this.apiKey.includes('your_')) {
        return {
          success: false,
          error: 'CREDENTIALS_NOT_CONFIGURED',
          message: 'Credentials Orange Money non configurés. Veuillez configurer ORANGE_MONEY_API_KEY et ORANGE_MONEY_API_SECRET dans le fichier .env',
          provider: 'orange'
        };
      }
      
      const payload = {
        merchant_id: this.merchantId,
        order_id: orderId,
        amount: Math.round(amount),
        currency: 'GNF',
        phone_number: this.normalizePhoneNumber(phoneNumber),
        email: email || 'noreply@phenix.com',
        description: `Commande PHENIX #${orderId}`,
        reference: `PHENIX-${orderId}-${Date.now()}`,
        callback_url: `${process.env.APP_URL || 'http://localhost:5000'}/api/payments/callback/orange`,
        return_url: `${process.env.APP_URL || 'http://localhost:5000'}/checkout?status=pending`
      };

      const headers = {
        'Authorization': `Bearer ${this.apiKey}`,
        'X-API-Key': this.apiSecret,
        'Content-Type': 'application/json'
      };

      const response = await axios.post(`${this.apiUrl}/charge`, payload, { headers });

      return {
        success: true,
        transactionId: response.data.transaction_id || response.data.reference,
        referenceCode: response.data.reference_code || response.data.reference,
        status: 'pending',
        provider: 'orange',
        message: 'Paiement initié avec succès',
        rawResponse: response.data
      };
    } catch (error) {
      console.error('❌ Erreur Orange Money:', error.response?.data || error.message);
      
      // Améliorer le message d'erreur
      let errorMessage = error.response?.data?.message || error.message;
      
      if (error.response?.status === 404) {
        errorMessage = 'URL API Orange Money invalide. Vérifier ORANGE_MONEY_API_URL dans .env';
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        errorMessage = 'Credentials Orange Money invalides. Vérifier API_KEY et API_SECRET';
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Impossible de se connecter à l\'API Orange Money. Vérifier la connexion internet et l\'URL API';
      }
      
      return {
        success: false,
        error: error.response?.data?.error || error.code || 'PAYMENT_ERROR',
        message: errorMessage,
        provider: 'orange',
        statusCode: error.response?.status
      };
    }
  }

  async getTransactionStatus(transactionId) {
    try {
      const headers = {
        'Authorization': `Bearer ${this.apiKey}`,
        'X-API-Key': this.apiSecret
      };

      const response = await axios.get(
        `${this.apiUrl}/transaction/${transactionId}`,
        { headers }
      );

      return {
        success: true,
        status: response.data.status,
        transactionId: response.data.transaction_id,
        amount: response.data.amount,
        currency: response.data.currency
      };
    } catch (error) {
      console.error('❌ Erreur vérification statut Orange Money:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  normalizePhoneNumber(phone) {
    let normalized = phone.replace(/\D/g, '');
    if (!normalized.startsWith('224')) {
      if (normalized.startsWith('6') || normalized.startsWith('7')) {
        normalized = '224' + normalized;
      }
    }
    return normalized;
  }

  async processPayment(amount, phoneNumber, orderId, email) {
    return this.initiatePayment(amount, phoneNumber, orderId, email);
  }
}

// ==================== MTN MOMO GUINÉE ====================
class MTNMomoGN {
  constructor() {
    this.name = 'MTN MoMo Guinea';
    this.code = 'mtn';
    this.apiKey = process.env.MTN_MOMO_API_KEY;
    this.apiSecret = process.env.MTN_MOMO_API_SECRET;
    this.subscriptionKey = process.env.MTN_MOMO_SUBSCRIPTION_KEY;
    this.apiUrl = process.env.MTN_MOMO_API_URL || 'https://api.mtn.com/gn/momo';
  }

  async initiatePayment(amount, phoneNumber, orderId, email) {
    try {
      console.log('🔵 MTN MoMo: Initiation du paiement');
      console.log(`   Montant: ${amount} GNF | Numéro: ${phoneNumber}`);
      
      // Vérifier que les credentials sont configurés
      if (!this.subscriptionKey || this.subscriptionKey === 'test_sub_key' || this.subscriptionKey.includes('your_')) {
        return {
          success: false,
          error: 'CREDENTIALS_NOT_CONFIGURED',
          message: 'Credentials MTN MoMo non configurés. Veuillez configurer MTN_MOMO_SUBSCRIPTION_KEY dans le fichier .env',
          provider: 'mtn'
        };
      }
      
      const externalId = `PHENIX-${orderId}-${Date.now()}`;

      const payload = {
        amount: Math.round(amount),
        currency: 'GNF',
        externalId: externalId,
        payer: {
          partyIdType: 'MSISDN',
          partyId: this.normalizePhoneNumber(phoneNumber),
          partyIdEmail: email
        },
        payerMessage: `Paiement PHENIX #${orderId}`,
        payeeNote: `Commande #${orderId}`,
        description: `Achat PHENIX`,
        callbackUrl: `${process.env.APP_URL || 'http://localhost:5000'}/api/payments/callback/mtn`
      };

      const headers = {
        'Authorization': `Bearer ${this.apiKey}`,
        'OCP-Apim-Subscription-Key': this.subscriptionKey,
        'X-Reference-Id': externalId,
        'Content-Type': 'application/json'
      };

      const response = await axios.post(
        `${this.apiUrl}/requesttopay`,
        payload,
        { headers }
      );

      return {
        success: true,
        transactionId: externalId,
        referenceCode: externalId,
        status: 'pending',
        provider: 'mtn',
        message: 'Paiement initié - Demande d\'autorisation envoyée au client',
        requiresPolling: true,
        rawResponse: response.data
      };
    } catch (error) {
      console.error('❌ Erreur MTN MoMo:', error.response?.data || error.message);
      
      // Améliorer le message d'erreur
      let errorMessage = error.response?.data?.message || error.message;
      
      if (error.response?.status === 404) {
        errorMessage = 'URL API MTN MoMo invalide. Vérifier MTN_MOMO_API_URL dans .env';
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        errorMessage = 'Credentials MTN MoMo invalides. Vérifier SUBSCRIPTION_KEY';
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Impossible de se connecter à l\'API MTN MoMo. Vérifier la connexion internet';
      }
      
      return {
        success: false,
        error: error.response?.data?.message || error.code || 'PAYMENT_ERROR',
        message: errorMessage,
        provider: 'mtn',
        statusCode: error.response?.status
      };
    }
  }

  async getTransactionStatus(transactionId) {
    try {
      const headers = {
        'Authorization': `Bearer ${this.apiKey}`,
        'OCP-Apim-Subscription-Key': this.subscriptionKey
      };

      const response = await axios.get(
        `${this.apiUrl}/requesttopay/${transactionId}`,
        { headers }
      );

      return {
        success: response.data.status === 'SUCCESSFUL',
        status: response.data.status,
        transactionId: transactionId,
        amount: response.data.amount,
        currency: response.data.currency,
        failureReason: response.data.reason
      };
    } catch (error) {
      console.error('❌ Erreur vérification statut MTN MoMo:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  normalizePhoneNumber(phone) {
    let normalized = phone.replace(/\D/g, '');
    if (!normalized.startsWith('224')) {
      if (normalized.startsWith('6') || normalized.startsWith('7')) {
        normalized = '224' + normalized;
      }
    }
    return normalized;
  }

  async processPayment(amount, phoneNumber, orderId, email) {
    return this.initiatePayment(amount, phoneNumber, orderId, email);
  }
}

// ==================== WAVE ====================
class WaveGN {
  constructor() {
    this.name = 'Wave';
    this.code = 'wave';
    this.apiKey = process.env.WAVE_API_KEY;
    this.businessId = process.env.WAVE_BUSINESS_ID || 'PHENIX001';
    this.apiUrl = process.env.WAVE_API_URL || 'https://gn.api.transferwise.com';
  }

  async initiatePayment(amount, phoneNumber, orderId, email) {
    try {
      console.log('🌊 Wave: Initiation du paiement');
      console.log(`   Montant: ${amount} GNF | Numéro: ${phoneNumber}`);
      
      // Vérifier que les credentials sont configurés
      if (!this.apiKey || this.apiKey === 'test_key' || this.apiKey.includes('your_')) {
        return {
          success: false,
          error: 'CREDENTIALS_NOT_CONFIGURED',
          message: 'Credentials Wave non configurés. Veuillez configurer WAVE_API_KEY dans le fichier .env',
          provider: 'wave'
        };
      }
      
      const payload = {
        business_id: this.businessId,
        order_id: orderId,
        amount: Math.round(amount),
        currency: 'GNF',
        payer_phone: this.normalizePhoneNumber(phoneNumber),
        payer_email: email,
        metadata: {
          orderId: orderId,
          description: `Commande PHENIX #${orderId}`,
          timestamp: new Date().toISOString()
        },
        return_url: `${process.env.APP_URL || 'http://localhost:5000'}/checkout?status=success`,
        cancel_url: `${process.env.APP_URL || 'http://localhost:5000'}/checkout?status=cancelled`
      };

      const headers = {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      };

      const response = await axios.post(
        `${this.apiUrl}/payment/initiate`,
        payload,
        { headers }
      );

      return {
        success: true,
        transactionId: response.data.transaction_id || response.data.payment_id,
        referenceCode: response.data.reference_code || response.data.payment_id,
        status: response.data.status || 'pending',
        provider: 'wave',
        message: 'Paiement Wave initié avec succès',
        paymentUrl: response.data.payment_url,
        rawResponse: response.data
      };
    } catch (error) {
      console.error('❌ Erreur Wave:', error.response?.data || error.message);
      
      // Améliorer le message d'erreur
      let errorMessage = error.response?.data?.message || error.message;
      
      if (error.response?.status === 404) {
        errorMessage = 'URL API Wave invalide. Vérifier WAVE_API_URL dans .env';
      } else if (error.response?.status === 401 || error.response?.status === 403) {
        errorMessage = 'Credentials Wave invalides. Vérifier WAVE_API_KEY';
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Impossible de se connecter à l\'API Wave. Vérifier la connexion internet';
      }
      
      return {
        success: false,
        error: error.response?.data?.message || error.code || 'PAYMENT_ERROR',
        message: errorMessage,
        provider: 'wave',
        statusCode: error.response?.status
      };
    }
  }

  async getTransactionStatus(transactionId) {
    try {
      const headers = {
        'Authorization': `Bearer ${this.apiKey}`
      };

      const response = await axios.get(
        `${this.apiUrl}/payment/status/${transactionId}`,
        { headers }
      );

      return {
        success: response.data.status === 'COMPLETED',
        status: response.data.status,
        transactionId: transactionId,
        amount: response.data.amount,
        currency: response.data.currency
      };
    } catch (error) {
      console.error('❌ Erreur vérification statut Wave:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  normalizePhoneNumber(phone) {
    let normalized = phone.replace(/\D/g, '');
    if (!normalized.startsWith('224')) {
      if (normalized.startsWith('6') || normalized.startsWith('7')) {
        normalized = '224' + normalized;
      }
    }
    return normalized;
  }

  async processPayment(amount, phoneNumber, orderId, email) {
    return this.initiatePayment(amount, phoneNumber, orderId, email);
  }
}

// ==================== DEMO MODE ====================
class DemoPaymentGateway {
  constructor() {
    this.name = 'Demo Payment (Test Mode)';
    this.code = 'demo';
  }

  async initiatePayment(amount, phoneNumber, orderId, email) {
    try {
      console.log('🎮 DEMO MODE: Initiation du paiement (non réel)');
      console.log(`   Montant: ${amount} GNF | Numéro: ${phoneNumber}`);
      console.log(`   ⚠️  Ceci est un mode DÉMO - Pas de paiement réel`);
      
      // Simuler délai réseau
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Générer un ID de transaction factice
      const transactionId = `DEMO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      console.log(`✅ DÉMO: Paiement simulé réussi - ID: ${transactionId}`);

      return {
        success: true,
        transactionId: transactionId,
        referenceCode: transactionId,
        status: 'completed',
        provider: 'demo',
        message: '✅ Paiement DÉMO réussi (pas de paiement réel)',
        isDemoMode: true
      };
    } catch (error) {
      console.error('❌ Erreur DÉMO:', error.message);
      return {
        success: false,
        error: error.message,
        provider: 'demo',
        isDemoMode: true
      };
    }
  }

  async getTransactionStatus(transactionId) {
    return {
      success: true,
      status: 'completed',
      transactionId: transactionId
    };
  }

  async processPayment(amount, phoneNumber, orderId, email) {
    return this.initiatePayment(amount, phoneNumber, orderId, email);
  }
}

// ==================== FACTORY FUNCTION ====================
const demoProvider = new DemoPaymentGateway();
const paymentProviders = {
  orange: new OrangeMoneyGN(),
  mtn: new MTNMomoGN(),
  wave: new WaveGN(),
  demo: demoProvider
};

function getProvider(providerName) {
  const provider = paymentProviders[providerName.toLowerCase()];
  if (!provider) {
    throw new Error(
      `Opérateur de paiement '${providerName}' non supporté. ` +
      `Exemples: 'orange', 'mtn', 'wave', 'demo'`
    );
  }
  return provider;
}

function getAvailableProviders() {
  return Object.keys(paymentProviders).map(key => ({
    code: key,
    name: paymentProviders[key].name
  }));
}

module.exports = {
  OrangeMoneyGN,
  MTNMomoGN,
  WaveGN,
  DemoPaymentGateway,
  paymentProviders,
  getProvider,
  getAvailableProviders
};
