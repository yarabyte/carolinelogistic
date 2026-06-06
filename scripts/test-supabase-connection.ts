/**
 * Teste la connexion Supabase et affiche une aide en cas d'erreur.
 *
 * Usage: npm run db:test
 */
import dotenv from "dotenv"
import pg from "pg"

dotenv.config()

function decodePasswordFromUrl(url: string): string {
  try {
    const parsed = new URL(url.replace(/^postgres(ql)?:\/\//, "http://"))
    return decodeURIComponent(parsed.password)
  } catch {
    return ""
  }
}

async function tryConnect(label: string, connectionString: string) {
  console.log(`\n→ ${label}`)
  const pool = new pg.Pool({
    connectionString,
    connectionTimeoutMillis: 10_000,
    ssl:
      connectionString.includes("supabase.com") || connectionString.includes("supabase.co")
        ? { rejectUnauthorized: false }
        : undefined,
  })

  try {
    const result = await pool.query("SELECT current_user, current_database()")
    console.log(`  ✅ Connexion OK (${result.rows[0].current_user} @ ${result.rows[0].current_database})`)
    return true
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.log(`  ❌ ${message}`)

    if (message.includes("tenant") || message.includes("Tenant")) {
      console.log("     → Projet introuvable sur ce pooler : région incorrecte, ref projet incorrecte, ou projet EN PAUSE.")
      console.log("     → Supabase Dashboard : Restore project, puis copier les URLs dans Settings → Database.")
    }
    if (message.includes("ENOTFOUND") || message.includes("EHOSTUNREACH")) {
      console.log("     → Hôte injoignable (souvent IPv6). Utilisez l’URL « Session pooler » du dashboard, pas db.*.supabase.co.")
    }
    if (message.includes("password authentication failed")) {
      console.log("     → Mot de passe incorrect. Réinitialisez-le dans Settings → Database.")
    }
    return false
  } finally {
    await pool.end()
  }
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL
  const directUrl = process.env.DIRECT_URL

  if (!directUrl && !databaseUrl) {
    console.error("❌ DIRECT_URL ou DATABASE_URL manquant dans .env")
    process.exit(1)
  }

  console.log("🔍 Test connexion Supabase")
  if (directUrl) {
    try {
      const parsed = new URL(directUrl.replace(/^postgres(ql)?:\/\//, "http://"))
      console.log(`   DIRECT_URL host: ${parsed.hostname}:${parsed.port || "5432"}`)
      console.log(`   DIRECT_URL user: ${parsed.username}`)
    } catch {
      console.log("   DIRECT_URL: format invalide")
    }
  }

  const pwd = directUrl ? decodePasswordFromUrl(directUrl) : ""
  if (pwd.includes("@") || pwd.includes("!")) {
    console.log("   ℹ️  Mot de passe avec caractères spéciaux — doit être encodé dans l’URL (@ → %40, ! → %21)")
  }

  let ok = false
  if (directUrl) ok = (await tryConnect("DIRECT_URL (migrations / import)", directUrl)) || ok
  if (databaseUrl && databaseUrl !== directUrl) {
    ok = (await tryConnect("DATABASE_URL (runtime pooler)", databaseUrl)) || ok
  }

  if (!ok) {
    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Actions à faire dans Supabase :
  1. Ouvrir https://supabase.com/dashboard
  2. Si le projet est « Paused » → cliquer « Restore project »
  3. Settings → Database → Connection string
  4. Copier-coller EXACTEMENT :
     • « Session pooler » → DIRECT_URL
     • « Transaction pooler » → DATABASE_URL
  5. Remplacer [YOUR-PASSWORD] par le mot de passe (encodé URL si @ ou !)
  6. npm run db:test && npm run db:migrate && npm run db:import
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`)
    process.exit(1)
  }

  console.log("\n✅ Au moins une connexion fonctionne. Lancez : npm run db:migrate && npm run db:import")
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
