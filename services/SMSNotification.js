/**
 * SMSNotification.js - Service de notifications SMS
 * Supporte: Twilio, AWS SNS, SMS local Guinée
 */

const axios = require('axios');

// ==================== TWILIO SMS ====================
class TwilioSMS {
  constructor() {
    this.name = 'Twilio';
    this.accountSid = process.env.TWILIO_ACCOUNT_SID;
    this.authToken = process.env.TWILIO_AUTH_TOKEN;
    this.phoneNumber = process.env.TWILIO_PHONE_NUMBER;
    this.baseUrl = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;
  }

  async send(toNumber, message) {
    if (!this.accountSid || !this.authToken) {
      console.warn('⚠️  Twilio: Credentials not configured');
      return {
        success: false,
        provider: 'twilio',
        message: 'Twilio credentials not configured'
      };
    }

    try {
      console.log(`📱 Twilio: Envoi SMS à ${toNumber}`);

      const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');

      const response = await axios.post(
        this.baseUrl,
        new URLSearchParams({
          From: this.phoneNumber,
          To: toNumber,
          Body: message
        }),
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );

      return {
        success: true,
        provider: 'twilio',
        smsId: response.data.sid,
        status: response.data.status,
        message: 'SMS envoyé avec succès'
      };
    } catch (error) {
      console.error('❌ Erreur Twilio:', error.response?.data || error.message);
      return {
        success: false,
        provider: 'twilio',
        error: error.message
      };
    }
  }
}

// ==================== AWS SNS ====================
class AWSSNS {
  constructor() {
    this.name = 'AWS SNS';
    try {
      this.sns = require('aws-sdk/clients/sns');
    } catch (e) {
      console.warn('⚠️  AWS SDK not installed');
      this.sns = null;
    }
  }

  async send(toNumber, message) {
    if (!this.sns) {
      console.warn('⚠️  AWS SNS: SDK not available. Install with: npm install aws-sdk');
      return {
        success: false,
        provider: 'aws',
        message: 'AWS SDK not installed'
      };
    }

    try {
      console.log(`📱 AWS SNS: Envoi SMS à ${toNumber}`);

      const client = new this.sns({
        region: process.env.AWS_REGION || 'us-east-1'
      });

      const params = {
        Message: message,
        PhoneNumber: toNumber
      };

      const response = await client.publish(params).promise();

      return {
        success: true,
        provider: 'aws',
        messageId: response.MessageId,
        message: 'SMS envoyé avec succès'
      };
    } catch (error) {
      console.error('❌ Erreur AWS SNS:', error.message);
      return {
        success: false,
        provider: 'aws',
        error: error.message
      };
    }
  }
}

// ==================== SMS LOCAL GUINÉE ====================
class LocalSMS {
  constructor() {
    this.name = 'Local SMS Gateway (Guinée)';
    this.apiUrl = process.env.LOCAL_SMS_API_URL;
    this.apiKey = process.env.LOCAL_SMS_API_KEY;
    this.senderId = process.env.LOCAL_SMS_SENDER_ID || 'PHENIX';
  }

  async send(toNumber, message) {
    if (!this.apiUrl || !this.apiKey) {
      console.warn('⚠️  Local SMS: Configuration manquante');
      return {
        success: false,
        provider: 'local',
        message: 'Configuration Local SMS manquante'
      };
    }

    try {
      console.log(`📱 Local SMS: Envoi SMS à ${toNumber}`);

      const payload = {
        phone: this.normalizePhoneNumber(toNumber),
        message: message,
        senderId: this.senderId
      };

      const headers = {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      };

      const response = await axios.post(this.apiUrl, payload, { headers });

      return {
        success: true,
        provider: 'local',
        smsId: response.data.smsId || response.data.id,
        status: response.data.status,
        message: 'SMS envoyé avec succès'
      };
    } catch (error) {
      console.error('❌ Erreur Local SMS:', error.response?.data || error.message);
      return {
        success: false,
        provider: 'local',
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
}

// ==================== SMS MANAGER ====================
class SMSManager {
  constructor() {
    this.twilio = new TwilioSMS();
    this.aws = new AWSSNS();
    this.local = new LocalSMS();

    this.selectedService = (process.env.SMS_SERVICE || 'local').toLowerCase();
    this.provider = this.getProvider();
  }

  getProvider() {
    switch (this.selectedService) {
      case 'twilio':
        return this.twilio;
      case 'aws':
        return this.aws;
      case 'local':
        return this.local;
      default:
        console.warn(`⚠️  SMS Service '${this.selectedService}' inconnu. Utilisation de 'local'`);
        return this.local;
    }
  }

  async send(toNumber, message) {
    console.log(`\n📨 === SMS Manager ===`);
    console.log(`Service: ${this.provider.name}`);
    console.log(`Destinataire: ${toNumber}`);
    console.log(`Message: ${message.substring(0, 50)}...`);

    const result = await this.provider.send(toNumber, message);
    console.log(`Résultat: ${result.success ? '✅ Succès' : '❌ Erreur'}\n`);

    return result;
  }

  async sendPaymentConfirmation(phoneNumber, orderData) {
    const {
      orderNumber,
      amount,
      paymentMethod,
      transactionId,
      provider
    } = orderData;

    const message = `PHENIX - Paiement confirmé\n` +
      `Commande: ${orderNumber}\n` +
      `Montant: ${amount.toLocaleString('fr-GN')} GNF\n` +
      `Méthode: ${paymentMethod}\n` +
      `Ref: ${transactionId.substring(0, 15)}...\n` +
      `Merci pour votre achat!`;

    return this.send(phoneNumber, message);
  }

  async sendOrderConfirmation(phoneNumber, orderData) {
    const {
      orderNumber,
      totalPrice,
      productCount,
      trackingNumber
    } = orderData;

    const message = `PHENIX - Commande reçue\n` +
      `Commande: ${orderNumber}\n` +
      `Produits: ${productCount}\n` +
      `Total: ${totalPrice.toLocaleString('fr-GN')} GNF\n` +
      `Suivi: ${trackingNumber}\n` +
      `Merci!`;

    return this.send(phoneNumber, message);
  }

  async sendShippingNotification(phoneNumber, orderData) {
    const {
      orderNumber,
      trackingNumber,
      estimatedDelivery
    } = orderData;

    const message = `PHENIX - Expédition\n` +
      `Commande: ${orderNumber}\n` +
      `Suivi: ${trackingNumber}\n` +
      `Livraison estimée: ${estimatedDelivery}\n` +
      `Lien: phenix.gn/track/${trackingNumber}`;

    return this.send(phoneNumber, message);
  }

  async sendOTP(phoneNumber, otpCode, expiryMinutes = 5) {
    const message = `PHENIX - Code de vérification\n` +
      `Code: ${otpCode}\n` +
      `Valide pour ${expiryMinutes} minutes\n` +
      `Ne partagez jamais ce code!`;

    return this.send(phoneNumber, message);
  }

  getActiveService() {
    return {
      name: this.provider.name,
      service: this.selectedService
    };
  }
}

// Exporter instance unique
const smsManager = new SMSManager();

module.exports = {
  TwilioSMS,
  AWSSNS,
  LocalSMS,
  SMSManager,
  smsManager
};
