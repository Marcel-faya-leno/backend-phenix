// models/Cart.js
const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    items: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
            default: 1
        },
        addedAt: {
            type: Date,
            default: Date.now
        },
        updatedAt: {
            type: Date,
            default: Date.now
        }
    }],
    expiresAt: {
        type: Date,
        default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 jours
        index: { expires: '7d' }
    }
}, {
    timestamps: true
});

// Méthode pour obtenir le total du panier
cartSchema.methods.getTotal = async function() {
    const populated = await this.populate('items.productId');
    return populated.items.reduce((total, item) => {
        return total + (item.productId?.price || 0) * item.quantity;
    }, 0);
};

// Méthode pour ajouter un produit
cartSchema.methods.addItem = function(productId, quantity = 1) {
    const existingItem = this.items.find(item => item.productId.toString() === productId.toString());
    
    if (existingItem) {
        existingItem.quantity += quantity;
        existingItem.updatedAt = new Date();
    } else {
        this.items.push({
            productId,
            quantity,
            addedAt: new Date(),
            updatedAt: new Date()
        });
    }
    
    return this.save();
};

// Méthode pour supprimer un produit
cartSchema.methods.removeItem = function(productId) {
    this.items = this.items.filter(item => item.productId.toString() !== productId.toString());
    return this.save();
};

// Méthode pour vider le panier
cartSchema.methods.clear = function() {
    this.items = [];
    return this.save();
};

const Cart = mongoose.models.Cart || mongoose.model('Cart', cartSchema);

module.exports = Cart;