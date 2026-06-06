# Déploiement Vercel — Caroline Logistic

## 1. Prérequis

- Compte [Vercel](https://vercel.com)
- Projet Supabase actif (PostgreSQL uniquement)
- Repo Git connecté à Vercel

## 2. Supabase (base de données)

Dans **Settings → Database**, copier :

| Variable Vercel | Source Supabase |
|-----------------|-----------------|
| `DATABASE_URL` | **Transaction pooler** (port 6543, `?pgbouncer=true`) |
| `DIRECT_URL` | **Session pooler** (port 5432) |

Encoder les caractères spéciaux du mot de passe : `@` → `%40`, `!` → `%21`

## 3. Vercel Blob (images / uploads admin)

Les fichiers `public/uploads/` ne sont **pas** déployés (gitignore). En production, les images passent par **Vercel Blob**.

1. Vercel → **Storage** → **Create Database** → **Blob**
2. Lier le store au projet Caroline Logistic
3. Vercel injecte automatiquement `BLOB_READ_WRITE_TOKEN` dans les variables d’environnement

Pour migrer les images locales existantes :

1. Copier `BLOB_READ_WRITE_TOKEN` depuis Vercel → Storage → `.env.local` dans votre `.env` local
2. Lancer :
   ```bash
   npm run storage:migrate
   ```
3. Redéployer sur Vercel

Les nouvelles URLs en base seront du type `https://….public.blob.vercel-storage.com/...`

En local sans token : les uploads vont dans `public/uploads/products/` (chemins relatifs `/uploads/...`).

## 4. Variables d’environnement Vercel

**Project Settings → Environment Variables** — ajouter pour **Production**, **Preview** et **Development** :

Voir le fichier [`.env.example`](.env.example) pour la liste complète.

Minimum requis :

```
DATABASE_URL
DIRECT_URL
NEXTAUTH_URL          # https://votre-domaine.vercel.app
AUTH_SECRET           # openssl rand -base64 32
BLOB_READ_WRITE_TOKEN # auto si Blob store lié au projet
STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS / SMTP_FROM
```

## 5. Stripe (webhook production)

1. [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. URL : `https://votre-domaine.vercel.app/api/webhooks/stripe`
3. Copier le signing secret → `STRIPE_WEBHOOK_SECRET` sur Vercel

## 6. Déployer

```bash
# Option A : Git push (recommandé)
git push origin main

# Option B : CLI
npm i -g vercel
vercel login
vercel --prod
```

Le build exécute automatiquement :

1. `prisma generate`
2. `prisma migrate deploy` (via `DIRECT_URL`)
3. `next build`

## 7. Après le déploiement

1. Ouvrir `https://votre-projet.vercel.app`
2. Admin : `/admin/login`
3. Tester upload d’image (produit, logo, slide)
4. Tester un paiement Stripe en mode test

## 8. Domaine custom

Vercel → **Settings → Domains** → ajouter `carolinelogistics.fr`  
Mettre à jour `NEXTAUTH_URL` avec le domaine final.

## 9. Dépannage

| Erreur | Solution |
|--------|----------|
| `DATABASE_URL is not set` | Ajouter `DATABASE_URL` sur Vercel |
| `tenant/user not found` | Projet Supabase en pause → Restore project |
| Upload 503 sur Vercel | Créer un Blob store et le lier au projet |
| Images cassées | Lancer `npm run storage:migrate` en local avec `BLOB_READ_WRITE_TOKEN` |
| Timeout homepage | Plan Hobby = 10 s max ; optimiser requêtes DB ou passer Pro |
| Auth redirect loop | `NEXTAUTH_URL` doit correspondre à l’URL publique exacte |

## 10. Commandes utiles

```bash
npm run db:test         # tester connexion Supabase en local
npm run db:migrate      # appliquer migrations
npm run storage:migrate # migrer uploads locaux → Vercel Blob
npm run build           # simuler le build Vercel
```
