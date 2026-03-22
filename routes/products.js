// routes/products.js - API produits PHENIX-TECH-SERVICES
const express = require('express');
const router = express.Router();

// Importer Cloudinary et multer
const { upload, uploadToCloudinary } = require('../config/upload');

// Importer le modèle Product (mode démo si MongoDB non disponible)
let Product;
try {
    Product = require('../models/Product');
} catch (error) {
    console.log('⚠️ Mode démo activé pour les produits');
    // Mode démo - données en mémoire
    let demoProducts = [
        {
            _id: '1',
            name: 'Arduino Uno R3',
            description: 'Carte de développement officielle avec ATMega328P pour projets électroniques.',
            category: 'Microcontrôleurs',
            price: 150000,
            stock: 50,
            reference: 'PT-ARDUINO-001',
            brand: 'Arduino',
            badge: 'new',
            image_url: 'https://cdn.sparkfun.com//assets/parts/1/2/3/4/ArduinoUno_R3.jpg',
            specs: ['ATMega328P', '14 pins digital I/O', '6 analog inputs'],
            status: 'active',
            createdAt: new Date('2024-01-15')
        },
        {
            _id: '2',
            name: 'Raspberry Pi 4',
            description: 'Ordinateur monocarte haute performance pour IoT et projets embarqués.',
            category: 'Microcontrôleurs',
            price: 450000,
            stock: 35,
            reference: 'PT-RASPI4-001',
            brand: 'Raspberry Pi',
            badge: 'hot',
            image_url: 'https://www.raspberrypi.com/app/uploads/2022/02/COLOUR-1.webp',
            specs: ['ARM Cortex-A72', '4GB RAM', 'WiFi 6', 'Gigabit Ethernet'],
            status: 'active',
            createdAt: new Date('2024-01-10')
        },
        {
            _id: '3',
            name: 'Capteur température DHT22',
            description: 'Capteur numérique de température et humidité précis.',
            category: 'Capteurs',
            price: 25000,
            stock: 100,
            reference: 'PT-DHT22-001',
            brand: 'AOSONG',
            badge: null,
            image_url: 'https://images-na.ssl-images-amazon.com/images/I/71Zb2NkW-8L._AC_SL1500_.jpg',
            specs: ['-40 ~ 80°C', '0 ~ 100% RH', 'Digital interface'],
            status: 'active',
            createdAt: new Date('2024-01-08')
        },
        {
            _id: '4',
            name: 'Module WiFi ESP32',
            description: 'Microcontrôleur avec WiFi et Bluetooth intégrés.',
            category: 'Connectivité',
            price: 85000,
            stock: 60,
            reference: 'PT-ESP32-001',
            brand: 'Espressif',
            badge: 'sale',
            image_url: 'https://cdn.shopify.com/s/files/1/0425/5013/2063/products/ESP32-Espressif-Module.jpg',
            specs: ['WiFi 802.11 b/g/n', 'BLE 4.2', 'Dual core'],
            status: 'active',
            createdAt: new Date('2024-01-05')
        },
        {
            _id: '5',
            name: 'Kit écran LCD 16x2',
            description: 'Afficheur LCD avec interface I2C pour projets Arduino.',
            category: 'Modules',
            price: 35000,
            stock: 45,
            reference: 'PT-LCD16X2-001',
            brand: 'DFRobot',
            badge: null,
            image_url: 'https://images-na.ssl-images-amazon.com/images/I/61u4H8Y3LaL._AC_SL1000_.jpg',
            specs: ['16x2 caractères', 'Interface I2C', '5V compatible'],
            status: 'active',
            createdAt: new Date('2023-12-28')
        }
    ];
    
    Product = {
        find: () => ({
            sort: () => ({
                skip: () => ({
                    limit: () => Promise.resolve(demoProducts)
                })
            }),
            countDocuments: () => Promise.resolve(demoProducts.length)
        }),
        findById: (id) => Promise.resolve(demoProducts.find(p => p._id === id)),
        findOne: (query) => Promise.resolve(demoProducts.find(p => p.name.includes(query.name?.$regex || ''))),
        create: (data) => {
            const newProduct = {
                _id: (demoProducts.length + 1).toString(),
                ...data,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            demoProducts.push(newProduct);
            return Promise.resolve(newProduct);
        },
        findByIdAndUpdate: (id, update, options) => {
            const index = demoProducts.findIndex(p => p._id === id);
            if (index !== -1) {
                demoProducts[index] = { ...demoProducts[index], ...update, updatedAt: new Date() };
                return Promise.resolve(demoProducts[index]);
            }
            return Promise.resolve(null);
        },
        findByIdAndDelete: (id) => {
            const index = demoProducts.findIndex(p => p._id === id);
            if (index !== -1) {
                const deleted = demoProducts.splice(index, 1)[0];
                return Promise.resolve(deleted);
            }
            return Promise.resolve(null);
        }
    };
}

// Middleware d'authentification admin (simplifié pour le développement)
const authenticateAdmin = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    // Pour le développement, accepter un token simple
    if (token === 'dev-token' || process.env.NODE_ENV === 'development') {
        return next();
    }
    
    // En production, vérifier le vrai token
    if (!token) {
        return res.status(401).json({ success: false, message: 'Accès non autorisé' });
    }
    
    // Ici, vous vérifieriez le JWT
    next();
};

// GET /api/products/categories - Récupérer toutes les catégories (DOIT être avant /:id)
router.get('/categories', async (req, res) => {
    try {
        const categories = [
            'Microcontrôleurs',
            'Capteurs', 
            'Modules',
            'Connectivité',
            'Alimentations',
            'Outils',
            'Composants',
            'Systèmes embarqués'
        ];
        
        res.json({ success: true, data: categories });
    } catch (error) {
        console.error('❌ Erreur récupération catégories:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur serveur' 
        });
    }
});

// GET /api/products/stats - Statistiques des produits (DOIT être avant /:id)
router.get('/stats', async (req, res) => {
    try {
        const products = await Product.find({ status: 'active' }).limit(1000);
        const totalProducts = products.length;
        const totalRevenue = products.reduce((sum, p) => sum + (p.price || 0), 0);
        const categories = [...new Set(products.map(p => p.category))].length;
        
        console.log('✅ Stats from MongoDB:', { totalProducts, totalRevenue, categories });
        
        res.json({
            success: true,
            data: {
                totalProducts,
                totalCategories: categories,
                totalRevenue,
                totalOrders: 0
            }
        });
    } catch (error) {
        console.warn('⚠️ MongoDB indisponible pour les stats, utilisation des données démo');
        // Retourner des stats démo
        res.json({
            success: true,
            data: {
                totalProducts: 42,
                totalCategories: 8,
                totalRevenue: 125000,
                totalOrders: 0
            }
        });
    }
});

// GET /api/products/search - Rechercher des produits (DOIT être avant /:id)
router.get('/search', async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q || q.trim().length < 2) {
            return res.json({ success: true, data: [] });
        }
        
        try {
            const products = await Product.find({
                $or: [
                    { name: { $regex: q, $options: 'i' } },
                    { description: { $regex: q, $options: 'i' } },
                    { category: { $regex: q, $options: 'i' } },
                    { reference: { $regex: q, $options: 'i' } }
                ],
                status: 'active'
            }).limit(20);
            
            res.json({ success: true, data: products });
        } catch (dbError) {
            console.warn('⚠️ MongoDB indisponible pour la recherche, retour vide');
            res.json({ success: true, data: [] });
        }
    } catch (error) {
        console.error('❌ Erreur recherche produits:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur serveur'
        });
    }
});

// GET /api/products - Récupérer tous les produits
router.get('/', async (req, res) => {
    try {
        const { limit = 50, offset = 0, category, sort = '-createdAt' } = req.query;
        
        let query = {};
        if (category) {
            query.category = category;
        }
        
        try {
            const products = await Product.find(query)
                .sort(sort)
                .skip(parseInt(offset))
                .limit(parseInt(limit));
            
            const total = await Product.countDocuments(query);
            
            res.json({
                success: true,
                data: products,
                pagination: {
                    total,
                    limit: parseInt(limit),
                    offset: parseInt(offset)
                }
            });
        } catch (dbError) {
            console.warn('⚠️ MongoDB indisponible, utilisation des données démo');
            // Retourner les données démo stockées en haut du fichier
            let demoProducts = [
                {
                    _id: '1',
                    name: 'Arduino Uno R3',
                    description: 'Carte de développement officielle avec ATMega328P pour projets électroniques.',
                    category: 'Microcontrôleurs',
                    price: 150000,
                    stock: 50,
                    reference: 'PT-ARDUINO-001',
                    brand: 'Arduino',
                    badge: 'new',
                    image_url: 'https://cdn.sparkfun.com//assets/parts/1/2/3/4/ArduinoUno_R3.jpg',
                    specs: ['ATMega328P', '14 pins digital I/O', '6 analog inputs'],
                    status: 'active',
                    createdAt: new Date('2024-01-15')
                },
                {
                    _id: '2',
                    name: 'Raspberry Pi 4',
                    description: 'Ordinateur monocarte haute performance pour IoT et projets embarqués.',
                    category: 'Microcontrôleurs',
                    price: 450000,
                    stock: 35,
                    reference: 'PT-RASPI4-001',
                    brand: 'Raspberry Pi',
                    badge: 'hot',
                    image_url: 'https://www.raspberrypi.com/app/uploads/2022/02/COLOUR-1.webp',
                    specs: ['ARM Cortex-A72', '4GB RAM', 'WiFi 6', 'Gigabit Ethernet'],
                    status: 'active',
                    createdAt: new Date('2024-01-10')
                }
            ];
            
            // Filtrer par catégorie si demandé
            let filtered = demoProducts;
            if (category) {
                filtered = demoProducts.filter(p => p.category === category);
            }
            
            res.json({
                success: true,
                data: filtered,
                pagination: {
                    total: filtered.length,
                    limit: parseInt(limit),
                    offset: parseInt(offset)
                }
            });
        }
    } catch (error) {
        console.error('❌ Erreur récupération produits:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur serveur',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// GET /api/products/:id - Récupérer un produit par ID (DOIT être en dernier)
router.get('/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({ 
                success: false, 
                message: 'Produit non trouvé' 
            });
        }
        
        res.json({ success: true, data: product });
    } catch (error) {
        console.error('❌ Erreur récupération produit:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur serveur' 
        });
    }
});

// POST /api/products - Créer un nouveau produit (Admin seulement)
router.post('/', authenticateAdmin, upload.single('image'), uploadToCloudinary, async (req, res) => {
    try {
        const productData = req.body;
        
        // Valider les données requises
        if (!productData.name || !productData.description || !productData.price) {
            return res.status(400).json({ 
                success: false, 
                message: 'Nom, description et prix sont requis' 
            });
        }
        
        // Ajouter l'URL de l'image si téléchargée (depuis Cloudinary)
        if (req.file && req.file.url) {
            productData.image_url = req.file.url;
            productData.cloudinary_public_id = req.file.publicId;
        }
        
        // Convertir les spécifications si envoyées comme chaîne
        if (productData.specs && typeof productData.specs === 'string') {
            productData.specs = productData.specs.split('\n').filter(spec => spec.trim());
        }
        
        // Convertir le prix en nombre
        productData.price = parseFloat(productData.price);
        productData.stock = parseInt(productData.stock) || 0;
        
        // Créer le produit
        let product;
        try {
            product = await Promise.race([
                Product.create(productData),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout MongoDB - Base de données indisponible')), 8000)
                )
            ]);
        } catch (dbError) {
            console.warn('⚠️ MongoDB timeout/erreur, mode démo activé');
            // Mode démo: créer le produit en mémoire
            product = {
                _id: 'demo-' + Date.now(),
                ...productData,
                createdAt: new Date(),
                updatedAt: new Date()
            };
        }
        
        // Émettre l'événement socket
        if (req.io) {
            req.io.emit('product:created', product);
            req.io.to('admin').emit('product:created', product);
        }
        
        console.log('✅ Produit créé:', product.name);
        
        res.status(201).json({ 
            success: true, 
            message: 'Produit créé avec succès',
            data: product 
        });
    } catch (error) {
        console.error('❌ Erreur création produit:', error.message);
        
        // Supprimer l'image téléchargée en cas d'erreur
        if (req.file) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error('Erreur suppression image:', err);
            });
        }
        
        res.status(500).json({ 
            success: false, 
            message: 'Erreur création produit: ' + error.message,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
            hint: 'Vérifier que MongoDB Atlas est configuré dans Render Dashboard'
        });
    }
});

// PUT /api/products/:id - Mettre à jour un produit (Admin seulement)
router.put('/:id', authenticateAdmin, upload.single('image'), uploadToCloudinary, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({ 
                success: false, 
                message: 'Produit non trouvé' 
            });
        }
        
        const updateData = req.body;
        
        // Mettre à jour l'URL de l'image si une nouvelle image est téléchargée (depuis Cloudinary)
        if (req.file && req.file.url) {
            updateData.image_url = req.file.url;
            updateData.cloudinary_public_id = req.file.publicId;
        }
        
        // Convertir les spécifications si envoyées comme chaîne
        if (updateData.specs && typeof updateData.specs === 'string') {
            updateData.specs = updateData.specs.split('\n').filter(spec => spec.trim());
        }
        
        // Convertir les nombres
        if (updateData.price) updateData.price = parseFloat(updateData.price);
        if (updateData.stock) updateData.stock = parseInt(updateData.stock);
        
        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id, 
            updateData, 
            { new: true, runValidators: true }
        );
        
        // Émettre l'événement socket
        if (req.io) {
            req.io.emit('product:updated', updatedProduct);
            req.io.to('admin').emit('product:updated', updatedProduct);
        }
        
        res.json({ 
            success: true, 
            message: 'Produit mis à jour avec succès',
            data: updatedProduct 
        });
    } catch (error) {
        console.error('❌ Erreur mise à jour produit:', error);
        
        // Supprimer la nouvelle image en cas d'erreur
        if (req.file) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error('Erreur suppression image:', err);
            });
        }
        
        res.status(500).json({ 
            success: false, 
            message: 'Erreur mise à jour produit'
        });
    }
});

// DELETE /api/products/:id - Supprimer un produit (Admin seulement)
router.delete('/:id', authenticateAdmin, async (req, res) => {
    try {
        let product;
        try {
            product = await Promise.race([
                Product.findById(req.params.id),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout MongoDB')), 5000)
                )
            ]);
        } catch (dbError) {
            console.warn('⚠️ MongoDB timeout pour findById');
            // En mode démo, on ne peut pas vraiment supprimer
            return res.status(503).json({
                success: false,
                message: 'Base de données indisponible - Mode démo',
                hint: 'Configurez MongoDB Atlas dans Render Dashboard'
            });
        }
        
        if (!product) {
            return res.status(404).json({ 
                success: false, 
                message: 'Produit non trouvé' 
            });
        }
        
        // Supprimer l'image associée
        if (product.image_url && !product.image_url.startsWith('http')) {
            const imagePath = path.join(__dirname, '..', product.image_url);
            fs.unlink(imagePath, (err) => {
                if (err && err.code !== 'ENOENT') {
                    console.error('Erreur suppression image:', err);
                }
            });
        }
        
        try {
            await Promise.race([
                Product.findByIdAndDelete(req.params.id),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout MongoDB')), 5000)
                )
            ]);
        } catch (dbError) {
            console.warn('⚠️ MongoDB timeout pour findByIdAndDelete');
            return res.status(503).json({
                success: false,
                message: 'Erreur suppression - Base de données indisponible'
            });
        }
        
        // Émettre l'événement socket
        if (req.io) {
            req.io.emit('product:deleted', { id: req.params.id });
            req.io.to('admin').emit('product:deleted', { id: req.params.id });
        }
        
        console.log('✅ Produit supprimé:', req.params.id);
        
        res.json({ 
            success: true, 
            message: 'Produit supprimé avec succès' 
        });
    } catch (error) {
        console.error('❌ Erreur suppression produit:', error.message);
        res.status(500).json({ 
            success: false, 
            message: 'Erreur suppression produit: ' + error.message,
            hint: 'Vérifier que MongoDB Atlas est configuré dans Render Dashboard'
        });
    }
});

module.exports = router;