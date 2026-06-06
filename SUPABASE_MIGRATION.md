# Migration Supabase (PostgreSQL)

Le projet utilise **Supabase** (PostgreSQL) au lieu de MySQL.

## 1. Créer le projet Supabase

1. [supabase.com](https://supabase.com) → New project  
2. **Project Settings → Database**  
3. Copier :
   - **Transaction pooler** (port **6543**) → `DATABASE_URL` (runtime Next.js)
   - **Direct connection** (port **5432**) → `DIRECT_URL` (migrations + import)

# 2. Configurer `.env`

Format correct (notez le **`@`** entre le mot de passe et l'hôte) :

```env
# Mot de passe avec @ et ! → encoder en URL : @ = %40, ! = %21
DATABASE_URL="postgresql://postgres:MonMotDePasse%40%21%21%21@db.VOTRE_REF.supabase.co:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:MonMotDePasse%40%21%21%21@db.VOTRE_REF.supabase.co:5432/postgres"
```

Erreur fréquente : oublier le `@` → le host est interprété comme partie du mot de passe (`invalid port number`).

Si `Can't reach database server` : vérifiez que le projet Supabase n'est pas en pause, ou activez **IPv4** dans Project Settings → Database.

## 3. Appliquer le schéma

```bash
npm run db:generate
npm run db:migrate
```

## 4. Importer le dump MySQL

```bash
npm run db:import
# ou avec un chemin explicite :
npm run db:import -- /Users/shakemill/Desktop/carolinelogistics2.sql
```

## 5. Vérifier

```bash
npm run db:studio
npm run dev
```

Comptes admin importés depuis le dump : `admin@carolinelogistic.com` (mot de passe inchangé depuis MySQL).
