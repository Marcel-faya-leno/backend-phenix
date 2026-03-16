// models/Product.js
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true,
        enum: ['Microcontrôleurs', 'Capteurs', 'Modules', 'Connectivité', 'Alimentations', 'Outils', 'Composants', 'Systèmes embarqués']
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    stock: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    reference: {
        type: String,
        unique: true,
        sparse: true,
        default: () => 'REF-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
    },
    brand: {
        type: String,
        default: 'Generic'
    },
    badge: {
        type: String,
        enum: ['new', 'hot', 'sale', 'iot', null],
        default: null
    },
    image_url: {
        type: String
    },
    specs: [{
        type: String
    }],
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin'
    }
}, {
    timestamps: true
});

// Index pour la recherche
productSchema.index({ name: 'text', description: 'text', category: 'text' });
productSchema.index({ status: 1, category: 1 });

// MÃ©thode pour vÃ©rifier le stock
productSchema.methods.isInStock = function() {
    return this.stock > 0;
};

// MÃ©thode pour rÃ©duire le stock
productSchema.methods.reduceStock = function(quantity) {
    if (this.stock >= quantity) {
        this.stock -= quantity;
        return true;
    }
    return false;
};

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

module.exports = Product;
