const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;

// Configuration Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Log la configuration
console.log('☁️  Cloudinary Config:');
console.log('  - Cloud Name:', process.env.CLOUDINARY_CLOUD_NAME ? '✅ SET' : '❌ NOT SET');
console.log('  - API Key:', process.env.CLOUDINARY_API_KEY ? '✅ SET' : '❌ NOT SET');
console.log('  - API Secret:', process.env.CLOUDINARY_API_SECRET ? '✅ SET' : '❌ NOT SET');

// Storage en mémoire (les fichiers seront envoyés à Cloudinary)
const storage = multer.memoryStorage();

// Filtre pour n'accepter que les images
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Seules les images sont autorisées (jpeg, jpg, png, gif, webp)'));
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: fileFilter
});

// Middleware pour uploader vers Cloudinary
const uploadToCloudinary = async (req, res, next) => {
    if (!req.file) {
        return next();
    }

    try {
        // Vérifier que Cloudinary est configuré
        if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
            console.warn('⚠️  Cloudinary non configuré - mode local activé');
            // Fallback: garder l'image en mémoire avec une URL locale
            req.file.url = `/uploads/products/${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`;
            return next();
        }

        // Créer une promise pour uploader vers Cloudinary
        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'phenix-products',
                    public_id: `product-${Date.now()}-${Math.round(Math.random() * 1E9)}`,
                    resource_type: 'auto'
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );

            uploadStream.end(req.file.buffer);
        });

        // Stocker les infos Cloudinary dans req.file
        req.file.cloudinary = result;
        req.file.url = result.secure_url;
        req.file.publicId = result.public_id;

        console.log('✅ Image uploadée sur Cloudinary:', req.file.url);
        next();
    } catch (error) {
        console.error('❌ Erreur upload Cloudinary:', error.message);
        // Fallback en case d'erreur Cloudinary
        console.warn('⚠️  Fallback: utilisation URL locale');
        req.file.url = `/uploads/products/${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`;
        next();
    }
};

module.exports = { upload, uploadToCloudinary, cloudinary };
