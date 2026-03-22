const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;

// Configuration Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

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
        console.error('❌ Erreur upload Cloudinary:', error);
        res.status(500).json({ success: false, message: 'Erreur lors de l\'upload: ' + error.message });
    }
};

module.exports = { upload, uploadToCloudinary, cloudinary };
