const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: {
        type: String,  // Peut Ãªtre string (anonymous-xxx) ou MongoDB ObjectId
        required: true
    },
    items: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        name: String,
        price: Number,
        quantity: {
            type: Number,
            required: true,
            default: 1
        },
        image: String
    }],
    totalPrice: {
        type: Number,
        required: true
    },
    shippingAddress: {
        street: String,
        city: String,
        zipCode: String,
        country: String
    },
    paymentMethod: {
        type: String,
        enum: ['card', 'paypal', 'bank_transfer', 'orange', 'mtn', 'wave', 'bank'],
        default: 'card'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    },
    paymentProvider: {
        type: String,
        default: null
    },
    transactionId: {
        type: String,
        default: null
    },
    orderStatus: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    trackingNumber: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// MÃ©thode statique pour mettre Ã  jour le statut de paiement
orderSchema.statics.updatePaymentStatus = async function(orderId, status, transactionId, provider) {
    try {
        const order = await this.findByIdAndUpdate(
            orderId,
            {
                paymentStatus: status,
                transactionId: transactionId,
                paymentProvider: provider,
                updatedAt: new Date()
            },
            { new: true }
        );
        return order;
    } catch (error) {
        throw error;
    }
};

module.exports = mongoose.model('Order', orderSchema);
