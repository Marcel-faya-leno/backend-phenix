# 🚀 Configuration Cloudinary - Guide Rapide

## Étape 1: Créer un compte Cloudinary (2 min)

1. Va sur: https://cloudinary.com/users/register/free
2. Remplis:
   - **Email**: ton email
   - **Password**: un mot de passe
3. Clique **"Sign Up"**
4. Valide ton email (reçois un lien dans ta boîte mail)

## Étape 2: Récupérer tes Credentials (30 secondes)

1. Après login, tu arrives au **Dashboard**
2. En haut à droite, tu vois tes infos:
   - **Cloud Name** (ex: `dxxxxxxxxx`)
   - **API Key** (ex: `123456789012345`)
   - **API Secret** (ex: `abcdefghijk123`)

## Étape 3: Ajouter les variables à Render (1 min)

### Localement (pour tester):
```bash
# Édite .env et ajoute:
CLOUDINARY_CLOUD_NAME=ta_cloud_name
CLOUDINARY_API_KEY=ta_api_key
CLOUDINARY_API_SECRET=ta_api_secret
```

### Sur Render.com:
1. Va sur https://dashboard.render.com
2. Cherche ton service **backend-phenix**
3. Clique **Settings** → **Environment**
4. Clique **Add Environment Variable**
5. Ajoute les 3 variables:
   ```
   CLOUDINARY_CLOUD_NAME = ta_cloud_name
   CLOUDINARY_API_KEY = ta_api_key
   CLOUDINARY_API_SECRET = ta_api_secret
   ```
6. Clique **Save**
7. Le service redémarre automatiquement ✅

## Étape 4: Vérifier que ça marche

- Teste localement d'abord: `npm run dev`
- Puis upload une image et vérifie qu'elle vient de Cloudinary
- Sur Render, redéploie et teste avec une image

C'est tout! 🎉

## Besoin d'aide?

Si tu as le `Cloud Name`, `API Key`, et `API Secret`, envoie-les moi et je peux configurer le `.env` et te guider pour Render!
