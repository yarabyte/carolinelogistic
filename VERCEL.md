# Déploiement Vercel — Caroline Logistic

## 1. Prérequis

- Compte [Vercel](https://vercel.com)
- Projet Supabase actif (PostgreSQL + Storage)
- Repo Git connecté à Vercel

## 2. Supabase

### Base de données

Dans **Settings → Database**, copier :

| Variable Vercel | Source Supabase |
|-----------------|-----------------|
| `DATABASE_URL` | **Transaction pooler** (port 6543, `?pgbouncer=true`) |
| `DIRECT_URL` | **Session pooler** (port 5432) |

Encoder les caractères spéciaux du mot de passe : `@` → `%40`, `!` → `%21`

### Storage (uploads admin)

1. **Storage → New bucket** → nom : `media` → **Public bucket** ✓
2. **Settings → API** :
   - `NEXT_PUBLIC_SUPABASE_URL` = Project URL
   - `SUPABASE_SERVICE_ROLE_KEY` = service_role (secret, jamais côté client)
3. `SUPABASE_STORAGE_BUCKET=media`

Les images existantes en `/uploads/products/...` (local) ne migrent pas automatiquement — ré-uploadez via l’admin ou copiez-les dans le bucket.

### Images cassées sur Vercel

Les fichiers `/uploads/products/*` ne sont **pas** déployés (gitignore). Procédure :

1. Créer le bucket public **`media`** dans Supabase Storage
2. Sur Vercel, ajouter :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=media`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `SUPABASE_STORAGE_BUCKET=media`
3. En local (avec les clés Supabase dans `.env`), migrer les fichiers :
   ```bash
   npm run storage:migrate
   ```
4. Redéployer sur Vercel

Le code mappe automatiquement `/uploads/products/xxx.jpg` → URL publique Supabase Storage.

## 3. Variables d’environnement Vercel

**Project Settings → Environment Variables** — ajouter pour **Production**, **Preview** et **Development** :

Voir le fichier [`.env.example`](.env.example) pour la liste complète.

Minimum requis :

```
DATABASE_URL
DIRECT_URL
NEXTAUTH_URL          # https://votre-domaine.vercel.app
AUTH_SECRET           # openssl rand -base64 32
STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_STORAGE_BUCKET
SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS / SMTP_FROM
```

## 4. Stripe (webhook production)

1. [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. URL : `https://votre-domaine.vercel.app/api/webhooks/stripe`
3. Copier le signing secret → `STRIPE_WEBHOOK_SECRET` sur Vercel

## 5. Déployer

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

## 6. Après le déploiement

1. Ouvrir `https://votre-projet.vercel.app`
2. Admin : `/admin/login`
3. Tester upload d’image (produit, logo, slide)
4. Tester un paiement Stripe en mode test

## 7. Domaine custom

Vercel → **Settings → Domains** → ajouter `carolinelogistics.fr`  
Mettre à jour `NEXTAUTH_URL` avec le domaine final.

## 8. Dépannage

| Erreur | Solution |
|--------|----------|
| `DATABASE_URL is not set` | Ajouter `DATABASE_URL` sur Vercel |
| `tenant/user not found` | Projet Supabase en pause → Restore project |
| Upload 503 sur Vercel | Configurer Supabase Storage (section 2) |
| Timeout homepage | Plan Hobby = 10 s max ; optimiser requêtes DB ou passer Pro |
| Auth redirect loop | `NEXTAUTH_URL` doit correspondre à l’URL publique exacte |

## 9. Commandes utiles

```bash
npm run db:test      # tester connexion Supabase en local
npm run db:migrate   # appliquer migrations
npm run db:import    # importer dump MySQL (local uniquement)
npm run build        # simuler le build Vercel
```
