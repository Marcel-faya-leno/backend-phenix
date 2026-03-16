// productController.js - ContrÃ´leur pour les produits
const Product = require('../models/Product');

const productController = {
    // RÃ©cupÃ©rer tous les produits
    async getAllProducts(req, res) {
        try {
            const { page = 1, limit = 20, category, search } = req.query;
            const query = {};

            if (category) query.category = category;
            if (search) query.name = { $regex: search, $options: 'i' };

            const skip = (page - 1) * limit;
            const products = await Product.find(query)
                .skip(skip)
                .limit(parseInt(limit))
                .sort({ createdAt: -1 });

            const total = await Product.countDocuments(query);

            res.json({
                products,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // RÃ©cupÃ©rer un produit par ID
    async getProductById(req, res) {
        try {
            const product = await Product.findById(req.params.id);
            if (!product) {
                return res.status(404).json({ error: 'Produit non trouvÃ©' });
            }
            res.json(product);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // CrÃ©er un produit (Admin)
    async createProduct(req, res) {
        try {
            const { name, description, price, category, image, stock } = req.body;

            const product = new Product({
                name,
                description,
                price,
                category,
                image,
                stock,
                createdBy: req.user?.userId
            });

            await product.save();
            res.status(201).json({ message: 'Produit crÃ©Ã©', product });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Mettre Ã  jour un produit (Admin)
    async updateProduct(req, res) {
        try {
            const product = await Product.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true, runValidators: true }
            );
            res.json({ message: 'Produit mis Ã  jour', product });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    // Supprimer un produit (Admin)
    async deleteProduct(req, res) {
        try {
            await Product.findByIdAndDelete(req.params.id);
            res.json({ message: 'Produit supprimÃ©' });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = productController;
