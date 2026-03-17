# 🔗 Configuration MongoDB Atlas pour Render

## ⚠️ Problème Actuel
MongoDB n'est pas configurée sur le service Render, ce qui cause:
- ❌ Timeouts sur les endpoints `/api/cart`
- ❌ Timeouts sur les endpoints `/api/products` (sauf mode démo)
- ❌ Images non disponibles
- ❌ "Operation carts.findOne() buffering timed out after 10000ms"

## ✅ Solution: Utiliser MongoDB Atlas (Cloud)

### **Étape 1: Créer un compte MongoDB Atlas**
1. Aller sur https://www.mongodb.com/cloud/atlas
2. S'inscrire ou se connecter
3. Créer un organisation (ex: "Phenix Tech")

### **Étape 2: Créer un cluster**
1. Cliquer sur "+ Create" → "Cluster"
2. Sélectionner **M0 (Gratuit)** - Suffisant pour développement
3. Choisir un provider (AWS, Azure, GCP) et région proche
4. Attendre ~3 minutes la création du cluster

### **Étape 3: Obtenir la Connection String**
1. Cliquer sur "Databases" → Votre cluster
2. Cliquer sur "Connect" → "Drivers"
3. Sélectionner "Node.js" et version "4.x or later"
4. **Copier la URI** (commence par `mongodb+srv://`)

### **Étape 4: Créer un database user**
Dans MongoDB Atlas:
1. "Security" → "Database Access"
2. "+ Add New Database User"
3. Remplir:
   - **Username**: `phenix_admin` (ou votre choix)
   - **Password**: Générer un mot de passe fort
   - **Autogenerate Secure Password** ✅
4. Cliquer "Add User"

### **Étape 5: Configurer sur Render**
1. Aller à https://dashboard.render.com
2. Sélectionner le service "backend-phenix"
3. Aller dans "Environment"
4. **Ajouter/Modifier** `MONGODB_URI`:
```
mongodb+srv://phenix_admin:YOUR_PASSWORD@cluster.mongodb.net/phenixdb?retryWrites=true&w=majority
```
5. Remplacer:
   - `phenix_admin` → votre username MongoDB
   - `YOUR_PASSWORD` → votre mot de passe MongoDB
   - `cluster` → votre nom de cluster MongoDB

6. Cliquer "Save Changes" → Service redéploiera automatiquement

### **Étape 6: Autoriser les IPs (si nécessaire)**
1. MongoDB Atlas → "Security" → "Network Access"
2. Si vous voyez un warning IP non autorisée:
   - Ajouter l'IP de Render (souvent affichée dans les logs)
   - Ou cliquer "Add IP Whitelist Entry" → "0.0.0.0/0" (production risqué!)

---

## 🧪 Vérifier la connexion

Une fois configuré:

```bash
# Tester l'api
curl https://backend-phenix.onrender.com/api/products

# Vous devriez voir les produits sans timeout
# Les logs Render doivent montrer:
# ✅ MongoDB connecté avec succès
```

---

## 📝 Exemple URI formatée
```
mongodb+srv://phenix_admin:Abc123!@phenix-cluster.mongodb.net/phenixdb?retryWrites=true&w=majority
```

---

## 💡 Alternative: Utiliser un fournisseur DB managé par Render
Si vous préférez ne pas gérer MongoDB:
1. Dans Render Dashboard → "+ New" → "PostgreSQL"
2. Utiliser Prisma ou Sequelize au lieu de Mongoose

---

**Questions?** Consultez: https://docs.mongodb.com/cloud/atlas/getting-started/
