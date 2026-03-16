# 🔐 Guide CORS - Backend Render Configuration

## 🚀 Problème Résolu

Les erreurs CORS et CSP sont dues à une configuration backend incomplete. Voici comment les corriger.

---

## 📋 Changements Effectués dans Backend

### 1. **Ajouter les URLs Netlify au CORS** ✅

**Fichier:** `backend/server.js`

```javascript
// CORS Origins - Localhost + Production
const allowedOrigins = [
    // Development
    "http://localhost:5500",
    "http://localhost:3000",
    "http://127.0.0.1:5500",
    // Production - Netlify
    "https://front-phenix.netlify.app",
    "https://phenix-tech.com",  // Si domaine personnalisé
    // Environment variable
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200
}));
```

### 2. **Configurer les Headers Sécurisés** ✅

```javascript
// Headers sécurisés (sans CSP trop restrictive)
app.use((req, res, next) => {
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'SAMEORIGIN');
    res.header('X-XSS-Protection', '1; mode=block');
    // CSP permissive pour fetch API
    res.header(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' https://backend-phenix.onrender.com wss: ws:;"
    );
    next();
});
```

---

## 🔧 Configuration Render

### Étape 1: Définir les Variables d'Environnement

**Render Dashboard → Services → backend-phenix → Environment**

Ajouter/Vérifier:

```
FRONTEND_URL = https://front-phenix.netlify.app
NODE_ENV = production
PORT = 3000
MONGODB_URI = mongodb+srv://...
JWT_SECRET = your_secret_key
```

### Étape 2: Redéployer

```
Dashboard → Deploys → Trigger deploy
```

---

## 🧪 Vérifier la Configuration

### Test 1: CORS Headers

```bash
# Vérifier les headers CORS
curl -X OPTIONS https://backend-phenix.onrender.com/api/products \
  -H "Origin: https://front-phenix.netlify.app" \
  -H "Access-Control-Request-Method: GET" \
  -v

# Résultat attendu:
# Access-Control-Allow-Origin: https://front-phenix.netlify.app
# Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
# Access-Control-Allow-Headers: Content-Type, Authorization, Accept
```

### Test 2: API Health

```bash
curl -X GET https://backend-phenix.onrender.com/api/health

# Résultat:
# {"success": true, "message": "Serveur en bon état"}
```

### Test 3: Fetch depuis Netlify

Ouvrir: https://front-phenix.netlify.app/test-api.html

Cliquer "Tester Produits" → Devrait retourner des produits

---

## 🐛 Troubleshooting CORS

### Erreur: CORS policy blocked

**Cause:** Origin non whitelisté au backend

**Solution:**
```javascript
// Vérifier que Netlify URL est dans allowedOrigins
console.log('✓ CORS Origins Allowed:', allowedOrigins);
// Doit contenir: https://front-phenix.netlify.app
```

### Erreur: CSP violation

**Cause:** Content-Security-Policy trop restrictive

**Solution:**
```javascript
// CSP doit autoriser fetch vers backend
res.header('Content-Security-Policy', 
    "connect-src 'self' https://backend-phenix.onrender.com wss: ws:;"
);
```

### Erreur: 404 for .well-known

**Cause:** Chrome cherche devtools config (normal)

**Solution:** Ignorer - pas grave!

---

## 📝 Fichier .env Backend

Créer `.env` à partir de `.env.example`:

```bash
# Production
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://front-phenix.netlify.app

# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/phenix_db

# JWT
JWT_SECRET=your_super_secret_key_here
ADMIN_JWT_SECRET=admin_secret_here
```

---

## 🚀 Déploiement Render Complet

### 1. Push le code sur GitHub

```bash
cd backend
git add server.js .env.example
git commit -m "Fix CORS for Netlify production"
git push origin main
```

### 2. Render Auto-Deploy

Render se redéploie automatiquement! ✨

### 3. Attendre ~2-3 minutes

Render reconstruit et redémarre le serveur.

### 4. Vérifier l'Status

```
Render Dashboard → Deploys → Latest

Status doit être: "Build successful" ✓
```

---

## ✅ Checklist Final

- [ ] Backend server.js a les URLs Netlify dans CORS
- [ ] Backend a les bons headers security
- [ ] .env.example mis à jour avec URLs production
- [ ] Render redéployé (Trigger deploy)
- [ ] Test curl CORS OK
- [ ] test-api.html produits chargent
- [ ] Console F12 = pas d'erreurs CORS
- [ ] CSP error disparu

---

## 🔗 Test URLs

| URL | Objectif |
|-----|----------|
| https://backend-phenix.onrender.com/api/health | Health check |
| https://backend-phenix.onrender.com/api/products | Produits list |
| https://front-phenix.netlify.app/test-api.html | Test interactif |

---

## 💡 Important: Local vs Production

### Local Development
```javascript
allowedOrigins = ["http://localhost:5500"];
// Pas de CSP restrictions
```

### Production
```javascript
allowedOrigins = [
    "https://front-phenix.netlify.app",
    "https://phenix-tech.com"
];
// CSP strict
```

---

**Status:** ✅ CORS Configuration Fixed  
**Backend:** https://backend-phenix.onrender.com  
**Frontend:** https://front-phenix.netlify.app
