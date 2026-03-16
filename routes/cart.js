const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Middleware pour obtenir l'ID utilisateur (depuis token ou générer un anonyme)
const getUserId = (req) => {
    // Si l'utilisateur est connecté, utiliser son ID
    if (req.user?.id) return req.user.id;
    // Sinon utiliser un ID anonyme (du localStorage du client)
    return req.query.userId || 'anonymous';
};

// GET panier (sans userId - utilise la valeur par défaut)
router.get('/', async (req, res) => {
    try {
        const userId = getUserId(req);
        let cart = await Cart.findOne({ userId: userId }).populate('items.productId');
        
        if (!cart) {
            cart = new Cart({ userId: userId, items: [] });
            await cart.save();
        }
        
        res.json({ success: true, data: cart });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET panier d'un utilisateur spécifique
router.get('/:userId', async (req, res) => {
    try {
        let cart = await Cart.findOne({ userId: req.params.userId }).populate('items.productId');
        
        if (!cart) {
            cart = new Cart({ userId: req.params.userId, items: [] });
            await cart.save();
        }
        
        res.json({ success: true, data: cart });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST ajouter au panier (sans userId)
router.post('/add', async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;
        const userId = getUserId(req);
        
        // Validation des paramètres
        if (!productId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Product ID est requis' 
            });
        }

        const parsedQuantity = parseInt(quantity);
        if (isNaN(parsedQuantity) || parsedQuantity < 1) {
            return res.status(400).json({ 
                success: false, 
                message: 'La quantité doit être au moins 1' 
            });
        }

        // Vérifier que le produit existe
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ 
                success: false, 
                message: 'Produit non trouvé' 
            });
        }

        // Vérifier la disponibilité du produit
        if (!product.stock || product.stock <= 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Ce produit n\'est pas disponible' 
            });
        }

        // Vérifier le stock disponible
        if (product.stock < parsedQuantity) {
            return res.status(400).json({ 
                success: false, 
                message: `Stock insuffisant. Disponible: ${product.stock}`,
                availableStock: product.stock
            });
        }

        // Obtenir ou créer le panier
        let cart = await Cart.findOne({ userId: userId });
        if (!cart) {
            cart = new Cart({ userId: userId, items: [] });
        }

        // Vérifier le stock total en cas d'ajout à un article existant
        const existingItem = cart.items.find(item => item.productId.toString() === productId.toString());
        const totalQuantityInCart = (existingItem?.quantity || 0) + parsedQuantity;
        
        if (product.stock < totalQuantityInCart) {
            return res.status(400).json({ 
                success: false, 
                message: `Quantité totale exceeds disponibilité. Max: ${product.stock}`,
                availableStock: product.stock
            });
        }

        // Ajouter le produit au panier
        await cart.addItem(productId, parsedQuantity);
        
        // Recharger avec les données du produit
        cart = await Cart.findOne({ userId: userId }).populate('items.productId');
        
        // Émettre l'événement en temps réel
        req.io.emit('cart:updated', { userId, productId, quantity: parsedQuantity, action: 'add' });
        
        res.json({ 
            success: true, 
            message: 'Produit ajouté au panier',
            data: cart
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// POST ajouter au panier (avec userId)
router.post('/:userId/add', async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;
        const userId = req.params.userId;
        
        // Validation des paramètres
        if (!productId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Product ID est requis' 
            });
        }

        const parsedQuantity = parseInt(quantity);
        if (isNaN(parsedQuantity) || parsedQuantity < 1) {
            return res.status(400).json({ 
                success: false, 
                message: 'La quantité doit être au moins 1' 
            });
        }

        // Vérifier que le produit existe
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ 
                success: false, 
                message: 'Produit non trouvé' 
            });
        }

        // Vérifier la disponibilité du produit
        if (!product.stock || product.stock <= 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Ce produit n\'est pas disponible' 
            });
        }

        // Vérifier le stock disponible
        if (product.stock < parsedQuantity) {
            return res.status(400).json({ 
                success: false, 
                message: `Stock insuffisant. Disponible: ${product.stock}`,
                availableStock: product.stock
            });
        }

        // Obtenir ou créer le panier
        let cart = await Cart.findOne({ userId: userId });
        if (!cart) {
            cart = new Cart({ userId: userId, items: [] });
        }

        // Vérifier le stock total en cas d'ajout à un article existant
        const existingItem = cart.items.find(item => item.productId.toString() === productId.toString());
        const totalQuantityInCart = (existingItem?.quantity || 0) + parsedQuantity;
        
        if (product.stock < totalQuantityInCart) {
            return res.status(400).json({ 
                success: false, 
                message: `Quantité totale exceeds disponibilité. Max: ${product.stock}`,
                availableStock: product.stock
            });
        }

        // Ajouter le produit au panier
        await cart.addItem(productId, parsedQuantity);
        
        // Recharger avec les données du produit
        cart = await Cart.findOne({ userId: userId }).populate('items.productId');
        
        // Émettre l'événement en temps réel
        req.io.emit('cart:updated', { userId, productId, quantity: parsedQuantity, action: 'add' });
        
        res.json({ 
            success: true, 
            message: 'Produit ajouté au panier',
            data: cart
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT mettre à jour la quantité (sans userId)
router.put('/update', async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const userId = getUserId(req);
        
        if (!productId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Product ID est requis' 
            });
        }

        let cart = await Cart.findOne({ userId: userId });
        if (!cart) {
            return res.status(404).json({ 
                success: false, 
                message: 'Panier non trouvé' 
            });
        }

        if (quantity < 1) {
            await cart.removeItem(productId);
        } else {
            const item = cart.items.find(i => i.productId.toString() === productId.toString());
            if (item) {
                item.quantity = quantity;
                item.updatedAt = new Date();
            }
            await cart.save();
        }
        
        // Recharger avec les données du produit
        cart = await Cart.findOne({ userId: userId }).populate('items.productId');
        
        req.io.emit('cart:updated', { userId, productId, quantity, action: 'update' });
        
        res.json({ 
            success: true, 
            message: 'Panier mis à jour',
            data: cart
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// PUT mettre à jour la quantité (avec userId)
router.put('/:userId/update', async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const userId = req.params.userId;
        
        if (!productId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Product ID est requis' 
            });
        }

        let cart = await Cart.findOne({ userId: userId });
        if (!cart) {
            return res.status(404).json({ 
                success: false, 
                message: 'Panier non trouvé' 
            });
        }

        if (quantity < 1) {
            await cart.removeItem(productId);
        } else {
            const item = cart.items.find(i => i.productId.toString() === productId.toString());
            if (item) {
                item.quantity = quantity;
                item.updatedAt = new Date();
            }
            await cart.save();
        }
        
        // Recharger avec les données du produit
        cart = await Cart.findOne({ userId: userId }).populate('items.productId');
        
        req.io.emit('cart:updated', { userId, productId, quantity, action: 'update' });
        
        res.json({ 
            success: true, 
            message: 'Panier mis à jour',
            data: cart
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE retirer du panier (sans userId)
router.delete('/remove/:productId', async (req, res) => {
    try {
        const productId = req.params.productId;
        const userId = getUserId(req);
        
        if (!productId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Product ID est requis' 
            });
        }

        let cart = await Cart.findOne({ userId: userId });
        if (!cart) {
            return res.status(404).json({ 
                success: false, 
                message: 'Panier non trouvé' 
            });
        }

        await cart.removeItem(productId);
        
        // Recharger avec les données du produit
        cart = await Cart.findOne({ userId: userId }).populate('items.productId');
        
        req.io.emit('cart:updated', { userId, productId, action: 'remove' });
        
        res.json({ 
            success: true, 
            message: 'Produit retiré du panier',
            data: cart
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE retirer du panier (avec userId)
router.delete('/:userId/remove/:productId', async (req, res) => {
    try {
        const productId = req.params.productId;
        const userId = req.params.userId;
        
        if (!productId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Product ID est requis' 
            });
        }

        let cart = await Cart.findOne({ userId: userId });
        if (!cart) {
            return res.status(404).json({ 
                success: false, 
                message: 'Panier non trouvé' 
            });
        }

        await cart.removeItem(productId);
        
        // Recharger avec les données du produit
        cart = await Cart.findOne({ userId: userId }).populate('items.productId');
        
        req.io.emit('cart:updated', { userId, productId, action: 'remove' });
        
        res.json({ 
            success: true, 
            message: 'Produit retiré du panier',
            data: cart
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE vider le panier (sans userId)
router.delete('/clear', async (req, res) => {
    try {
        const userId = getUserId(req);
        
        const cart = await Cart.findOne({ userId: userId });
        if (!cart) {
            return res.status(404).json({ 
                success: false, 
                message: 'Panier non trouvé' 
            });
        }

        await cart.clear();
        
        req.io.emit('cart:cleared', { userId });
        
        res.json({ 
            success: true, 
            message: 'Panier vidé',
            data: cart
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// DELETE vider le panier (avec userId)
router.delete('/:userId/clear', async (req, res) => {
    try {
        const userId = req.params.userId;
        
        const cart = await Cart.findOne({ userId: userId });
        if (!cart) {
            return res.status(404).json({ 
                success: false, 
                message: 'Panier non trouvé' 
            });
        }

        await cart.clear();
        
        req.io.emit('cart:cleared', { userId });
        
        res.json({ 
            success: true, 
            message: 'Panier vidé',
            data: cart
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET vérifier et obtenir les détails complets du panier (sans userId)
router.get('/validate/summary', async (req, res) => {
    try {
        const userId = getUserId(req);
        
        let cart = await Cart.findOne({ userId: userId }).populate('items.productId');
        if (!cart) {
            cart = new Cart({ userId: userId, items: [] });
            await cart.save();
        }

        // Vérifier la validité de chaque article
        let isValid = true;
        let issues = [];
        let total = 0;
        let items = [];

        for (const item of cart.items) {
            const product = item.productId;
            
            if (!product) {
                isValid = false;
                issues.push(`Produit supprimé du catalogue`);
                continue;
            }

            if (!product.stock || product.stock <= 0) {
                isValid = false;
                issues.push(`${product.name} n'est plus disponible`);
                continue;
            }

            if (item.quantity > product.stock) {
                isValid = false;
                issues.push(`Quantité pour ${product.name} exceeds disponibilité (max: ${product.stock})`);
            }

            const itemTotal = product.price * item.quantity;
            total += itemTotal;

            items.push({
                productId: product._id,
                name: product.name,
                price: product.price,
                quantity: item.quantity,
                stock: product.stock,
                image: product.image || null,
                subtotal: itemTotal
            });
        }

        const shippingFee = items.length > 0 ? 25000 : 0;
        const finalTotal = total + shippingFee;

        res.json({
            success: true,
            data: {
                userId,
                items,
                subtotal: total,
                shippingFee,
                total: finalTotal,
                isValid,
                issues,
                itemCount: items.length
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// GET vérifier et obtenir les détails complets du panier (avec userId)
router.get('/:userId/validate/summary', async (req, res) => {
    try {
        const userId = req.params.userId;
        
        let cart = await Cart.findOne({ userId: userId }).populate('items.productId');
        if (!cart) {
            cart = new Cart({ userId: userId, items: [] });
            await cart.save();
        }

        // Vérifier la validité de chaque article
        let isValid = true;
        let issues = [];
        let total = 0;
        let items = [];

        for (const item of cart.items) {
            const product = item.productId;
            
            if (!product) {
                isValid = false;
                issues.push(`Produit supprimé du catalogue`);
                continue;
            }

            if (!product.stock || product.stock <= 0) {
                isValid = false;
                issues.push(`${product.name} n'est plus disponible`);
                continue;
            }

            if (item.quantity > product.stock) {
                isValid = false;
                issues.push(`Quantité pour ${product.name} exceeds disponibilité (max: ${product.stock})`);
            }

            const itemTotal = product.price * item.quantity;
            total += itemTotal;

            items.push({
                productId: product._id,
                name: product.name,
                price: product.price,
                quantity: item.quantity,
                stock: product.stock,
                image: product.image || null,
                subtotal: itemTotal
            });
        }

        const shippingFee = items.length > 0 ? 25000 : 0;
        const finalTotal = total + shippingFee;

        res.json({
            success: true,
            data: {
                userId,
                items,
                subtotal: total,
                shippingFee,
                total: finalTotal,
                isValid,
                issues,
                itemCount: items.length
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
