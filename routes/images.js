// routes/images.js
// Endpoint pour servir les images des produits avec fallback

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

/**
 * GET /api/images/product/:productId
 * Retourne l'image du produit ou un placeholder SVG
 */
router.get('/product/:productId', (req, res) => {
    const { productId } = req.params;
    const uploadDir = path.join(__dirname, '../uploads/products');
    
    try {
        // Chercher une image avec ce nom
        const files = fs.readdirSync(uploadDir);
        const productImage = files.find(f => 
            f.toLowerCase().includes(productId.toLowerCase()) || 
            f.toLowerCase().includes(productId.replace(/[^a-z0-9]/gi, '').toLowerCase())
        );
        
        if (productImage) {
            return res.sendFile(path.join(uploadDir, productImage));
        }
        
        // Sinon retourner un placeholder SVG
        const placeholderSVG = `
            <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
                <rect width="300" height="200" fill="#f0f0f0"/>
                <text x="150" y="100" font-size="14" text-anchor="middle" fill="#999">
                    Image produit ${productId}
                </text>
            </svg>
        `;
        
        res.type('image/svg+xml').send(placeholderSVG);
    } catch (error) {
        console.error('❌ Erreur chargement image:', error);
        
        // Retourner un SVG d'erreur
        const errorSVG = `
            <svg width="300" height="200" xmlns="http://www.w3.org/2000/svg">
                <rect width="300" height="200" fill="#ffe6e6"/>
                <text x="150" y="100" font-size="14" text-anchor="middle" fill="#cc0000">
                    Image indisponible
                </text>
            </svg>
        `;
        
        res.type('image/svg+xml').status(200).send(errorSVG);
    }
});

/**
 * GET /api/images/placeholder
 * Retourne une image placeholder générique
 */
router.get('/placeholder', (req, res) => {
    const { text = 'Image indisponible', width = 300, height = 200 } = req.query;
    
    const decodedText = decodeURIComponent(text);
    
    const placeholderSVG = `
        <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#e0e0e0;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#f5f5f5;stop-opacity:1" />
                </linearGradient>
            </defs>
            <rect width="${width}" height="${height}" fill="url(#grad1)"/>
            <circle cx="${width/2}" cy="${height/2 - 20}" r="30" fill="#999" opacity="0.3"/>
            <path d="M ${width/2 - 40} ${height/2 + 20} L ${width/2 + 40} ${height/2 + 20}" stroke="#999" stroke-width="2" opacity="0.3"/>
            <text x="${width/2}" y="${height - 20}" font-size="12" text-anchor="middle" fill="#999">
                ${decodedText}
            </text>
        </svg>
    `;
    
    res.type('image/svg+xml').send(placeholderSVG);
});

module.exports = router;
