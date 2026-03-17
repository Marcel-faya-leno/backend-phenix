// config/productDefaults.js
// Produits par défaut avec images fiables

const defaultProducts = [
    {
        name: 'Arduino Uno R3',
        description: 'Carte de développement officielle avec ATMega328P pour projets électroniques.',
        category: 'Microcontrôleurs',
        price: 150000,
        stock: 50,
        reference: 'PT-ARDUINO-001',
        brand: 'Arduino',
        badge: 'new',
        // Image hébergée sur un CDN fiable
        image_url: '/uploads/products/default-arduino.jpg',
        specs: ['ATMega328P', '14 pins digital I/O', '6 analog inputs', 'USB Type-B'],
        status: 'active'
    },
    {
        name: 'Raspberry Pi 4',
        description: 'Ordinateur monocarte haute performance pour IoT et projets embarqués.',
        category: 'Microcontrôleurs',
        price: 450000,
        stock: 35,
        reference: 'PT-RASPI4-001',
        brand: 'Raspberry Pi',
        badge: 'hot',
        image_url: '/uploads/products/default-raspi4.jpg',
        specs: ['ARM Cortex-A72', '4GB RAM', 'WiFi 6', 'Gigabit Ethernet', 'POE'],
        status: 'active'
    },
    {
        name: 'Capteur température DHT22',
        description: 'Capteur numérique de température et humidité précis pour vos projets.',
        category: 'Capteurs',
        price: 25000,
        stock: 100,
        reference: 'PT-DHT22-001',
        brand: 'AOSONG',
        badge: null,
        image_url: '/uploads/products/default-dht22.jpg',
        specs: ['-40 ~ 80°C', '0 ~ 100% RH', 'Digital interface', '4 pins'],
        status: 'active'
    },
    {
        name: 'Module WiFi ESP32',
        description: 'Microcontrôleur avec WiFi et Bluetooth intégrés pour l\'IoT.',
        category: 'Connectivité',
        price: 85000,
        stock: 60,
        reference: 'PT-ESP32-001',
        brand: 'Espressif',
        badge: 'sale',
        image_url: '/uploads/products/default-esp32.jpg',
        specs: ['WiFi 802.11 b/g/n', 'BLE 4.2', 'Dual core', 'Antenne intégrée'],
        status: 'active'
    },
    {
        name: 'Kit écran LCD 16x2',
        description: 'Afficheur LCD avec interface I2C pour projets Arduino et ESP32.',
        category: 'Modules',
        price: 35000,
        stock: 45,
        reference: 'PT-LCD16X2-001',
        brand: 'DFRobot',
        badge: null,
        image_url: '/uploads/products/default-lcd.jpg',
        specs: ['16x2 caractères', 'Interface I2C', '5V compatible', 'Contraste réglable'],
        status: 'active'
    }
];

module.exports = defaultProducts;
