const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { v4: uuidv4 } = require('uuid');

// Importer les services de paiement réels
const { paymentProviders, getAvailableProviders } = require('../services/PaymentGateway');
const { smsManager } = require('../services/SMSNotification');

// GET list available payment providers
router.get('/providers', (req, res) => {
  try {
    const providers = getAvailableProviders();
    res.json({
      success: true,
      data: providers,
      message: `${providers.length} opérateurs disponibles`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET check SMS service status
router.get('/sms-status', (req, res) => {
  try {
    const service = smsManager.getActiveService();
    res.json({
      success: true,
      data: service,
      message: `Service SMS actif: ${service.name}`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST créer une commande
router.post('/create-order', async (req, res) => {
    try {
        const { userId, items, shippingAddress, phone, notes } = req.body;
        
        // Calculer le total
        let totalAmount = 0;
        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product || product.stock < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Stock insuffisant pour ${product?.name || 'le produit'}`
                });
            }
            totalAmount += product.price * item.quantity;
        }

        // Créer la commande
        const orderNumber = 'CMD-' + Date.now().toString().slice(-8) + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
        
        const orderData = {
            order_number: orderNumber,
            user_id: userId,
            total_amount: totalAmount,
            shipping_amount: 25000, // Frais de livraison fixes
            final_amount: totalAmount + 25000,
            phone,
            address: shippingAddress,
            notes
        };

        const orderId = await Order.create(orderData, items);
        
        // Mettre à jour les stocks
        for (const item of items) {
            await Product.updateStock(item.productId, item.quantity);
        }

        res.json({
            success: true,
            message: 'Commande créée',
            data: { orderId, orderNumber, ...orderData }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST créer une commande à partir du panier
router.post('/cart-to-order', async (req, res) => {
    try {
        const { userId, shippingAddress, phone, notes, firstName = '', lastName = '', items = [] } = req.body;
        
        // Validation des paramètres
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User ID est requis'
            });
        }

        if (!shippingAddress || !shippingAddress.street || !shippingAddress.city) {
            return res.status(400).json({
                success: false,
                message: 'Adresse de livraison incomplète'
            });
        }

        if (!phone || phone.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Numéro de téléphone est requis'
            });
        }

        // Récupérer les items - soit du panier MongoDB, soit du paramètre frontend
        let cartItems = items && items.length > 0 ? items : [];
        
        // Si pas d'items fournis, chercher en base de données
        if (cartItems.length === 0) {
            const cart = await Cart.findOne({ userId }).populate('items.productId');
            
            if (!cart || !cart.items || cart.items.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Le panier est vide'
                });
            }
            
            cartItems = cart.items;
        }

        // Valider et préparer les articles
        let totalAmount = 0;
        const orderItems = [];

        for (const item of cartItems) {
            // Déterminer le productId
            let productId = item.productId;
            if (typeof productId === 'object' && productId._id) {
                productId = productId._id;
            }
            
            const product = await Product.findById(productId);

            if (!product) {
                return res.status(400).json({
                    success: false,
                    message: 'Un produit du panier n\'existe plus dans le catalogue'
                });
            }

            if (!product.stock || product.stock <= 0) {
                return res.status(400).json({
                    success: false,
                    message: `${product.name} n'est plus disponible`
                });
            }

            if (product.stock < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Stock insuffisant pour ${product.name}. Disponible: ${product.stock}`,
                    availableStock: product.stock
                });
            }

            // Ajouter à la liste des articles de la commande
            orderItems.push({
                productId: product._id,
                name: product.name,
                price: product.price,
                quantity: item.quantity,
                image: product.image || null
            });

            totalAmount += product.price * item.quantity;
        }

        // Générer le numéro de commande
        const orderNumber = 'CMD-' + Date.now().toString().slice(-8) + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
        const shippingFee = 25000; // Frais de livraison fixes
        const finalAmount = totalAmount + shippingFee;

        // Créer la commande
        const order = new Order({
            userId: userId,
            items: orderItems,
            totalPrice: totalAmount,
            shippingAddress: shippingAddress,
            paymentMethod: 'bank',  // Défaut, sera mis à jour lors du paiement
            paymentStatus: 'pending',
            orderStatus: 'pending',
            trackingNumber: orderNumber,
            createdAt: new Date(),
            updatedAt: new Date()
        });

        // Sauvegarder la commande
        const savedOrder = await order.save();

        // Mettre à jour les stocks
        for (const item of orderItems) {
            const product = await Product.findById(item.productId);
            if (product) {
                product.stock = (product.stock || 0) - item.quantity;
                await product.save();
            }
        }

        // Vider le panier après succès si celui-ci existe en base
        const existingCart = await Cart.findOne({ userId });
        if (existingCart) {
            existingCart.items = [];
            await existingCart.save();
        }

        // Émettre l'événement en temps réel
        req.io?.emit('order:created', {
            orderId: savedOrder._id,
            orderNumber: orderNumber,
            userId,
            totalAmount: finalAmount,
            status: 'pending'
        });

        res.json({
            success: true,
            message: 'Commande créée avec succès',
            data: {
                orderId: savedOrder._id,
                orderNumber: orderNumber,
                subtotal: totalAmount,
                shippingFee: shippingFee,
                total: finalAmount,
                items: orderItems,
                shippingAddress,
                phone,
                paymentStatus: 'pending',
                orderStatus: 'pending'
            }
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: error.message || 'Erreur lors de la création de la commande'
        });
    }
});
router.post('/process', async (req, res) => {
    try {
        const { orderId, provider, phone, pin } = req.body;
        
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Commande non trouvée' });
        }

        if (!paymentProviders[provider]) {
            return res.status(400).json({ 
                success: false, 
                message: 'Provider de paiement non supporté. Options: orange, mtn, wave' 
            });
        }

        // Calculer le montant total (total + frais de livraison)
        const shippingFee = 25000;
        const totalAmount = order.totalPrice + shippingFee;

        console.log(`\n💳 TRAITEMENT PAIEMENT RÉEL`);
        console.log(`   Provider: ${paymentProviders[provider].name}`);
        console.log(`   Montant: ${totalAmount} GNF`);
        console.log(`   Numéro: ${phone}`);
        
        // Appel à la vraie API du provider
        const paymentResult = await paymentProviders[provider].processPayment(
            totalAmount,
            phone,
            orderId.toString(),
            order.email || 'customer@phenix.com'
        );
        
        if (paymentResult.success) {
            // Mettre à jour la commande avec le statut de paiement
            const updatedOrder = await Order.findByIdAndUpdate(
                orderId,
                {
                    paymentStatus: 'completed',
                    paymentMethod: provider,
                    paymentProvider: provider,
                    transactionId: paymentResult.transactionId,
                    orderStatus: 'processing',
                    updatedAt: new Date()
                },
                { new: true }
            );
            
            // Envoyer la confirmation SMS
            console.log(`📱 Envoi SMS de confirmation à ${phone}...`);
            const smsResult = await smsManager.sendPaymentConfirmation(phone, {
                orderNumber: updatedOrder.trackingNumber,
                amount: updatedOrder.totalPrice + 25000,
                paymentMethod: paymentProviders[provider].name,
                transactionId: paymentResult.transactionId,
                provider: provider
            });
            
            if (smsResult.success) {
                console.log('✅ SMS envoyé avec succès');
            } else {
                console.warn('⚠️ Erreur lors de l\'envoi du SMS:', smsResult.message || smsResult.error);
            }
            
            // Émettre l'événement en temps réel
            req.io.emit('payment:completed', { 
                orderId, 
                orderNumber: updatedOrder.trackingNumber,
                amount: updatedOrder.totalPrice + 25000,
                provider,
                transactionId: paymentResult.transactionId
            });
            
            res.json({
                success: true,
                message: 'Paiement réussi - Confirmation SMS envoyée',
                data: {
                    orderNumber: updatedOrder.trackingNumber,
                    transactionId: paymentResult.transactionId,
                    amount: updatedOrder.totalPrice + 25000,
                    provider: paymentProviders[provider].name,
                    smsStatus: smsResult.success ? 'sent' : 'pending',
                    smsMessage: 'Confirmation de paiement envoyée au numero fourni'
                }
            });
        } else {
            // Mettre à jour le statut en échec
            await Order.findByIdAndUpdate(
                orderId,
                {
                    paymentStatus: 'failed',
                    paymentMethod: provider,
                    updatedAt: new Date()
                },
                { new: true }
            );
            
            console.error('❌ Paiement échoué:', paymentResult.message);
            
            res.status(400).json({
                success: false,
                message: paymentResult.message || 'Échec du paiement. Veuillez réessayer.',
                error: paymentResult.error
            });
        }
    } catch (error) {
        console.error('❌ Erreur traitement paiement:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET vérifier le statut d'une commande
router.get('/status/:orderId', async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId);
        if (!order) {
            return res.status(404).json({ success: false, message: 'Commande non trouvée' });
        }
        
        res.json({
            success: true,
            data: {
                status: order.status,
                paymentStatus: order.payment_status,
                orderNumber: order.order_number,
                amount: order.final_amount
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;