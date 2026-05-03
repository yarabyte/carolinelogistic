import { PrismaClient } from "@prisma/client"
import { PrismaMariaDb } from "@prisma/adapter-mariadb"
import type { PoolConfig } from "mariadb"

/**
 * Nettoie DATABASE_URL (copier-coller depuis un fichier .env sur Vercel, etc.) :
 * - espaces / BOM
 * - préfixe accidentel DATABASE_URL=
 * - guillemets englobants "…" ou '…'
 */
export function normalizeDatabaseUrl(raw: string | undefined): string {
  if (raw === undefined || raw === null || String(raw).trim() === "") {
    throw new Error("DATABASE_URL is not set in environment variables")
  }
  let s = String(raw).trim().replace(/^\uFEFF/, "")

  for (let i = 0; i < 3; i++) {
    if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
      s = s.slice(1, -1).trim()
    }
    const prefixed = s.match(/^DATABASE_URL\s*=\s*(.+)$/is)
    if (prefixed) {
      s = prefixed[1].trim()
    }
  }

  if (!s.startsWith("mysql://")) {
    throw new Error(
      "DATABASE_URL doit commencer par mysql:// (vérifiez Vercel : valeur = URL seule, sans nom de variable ni guillemets)."
    )
  }
  return s
}

// mysql://user:pass@host:3306/db | mysql://user:@host:3306/db | mysql://user@host:3306/db
function parseDatabaseUrl(url: string) {
  try {
    const match = url.match(
      /^mysql:\/\/([^:@/]+)(?::([^@]*))?@([^:/]+):(\d+)\/([^?#]+)(?:[?#].*)?$/
    )
    if (match) {
      const [, user, password, host, port, database] = match
      return {
        host,
        port: parseInt(port, 10) || 3306,
        user,
        password: password !== undefined && password !== "" ? password : undefined,
        database: database.split("?")[0] ?? database,
      }
    }

    const urlObj = new URL(url.replace(/^mysql:\/\//, "http://"))
    const db = urlObj.pathname.replace(/^\//, "").split("?")[0]
    if (!db) {
      throw new Error("Chemin base de données manquant dans l’URL")
    }
    return {
      host: urlObj.hostname,
      port: parseInt(urlObj.port, 10) || 3306,
      user: decodeURIComponent(urlObj.username) || undefined,
      password:
        urlObj.password !== undefined && urlObj.password !== ""
          ? decodeURIComponent(urlObj.password)
          : undefined,
      database: db,
    }
  } catch (error: unknown) {
    const hint = error instanceof Error ? error.message : String(error)
    throw new Error(
      `Impossible d’analyser DATABASE_URL. Sur Vercel, mettez uniquement l’URL (ex. mysql://user:motdepasse@hôte:3306/nom_base), sans préfixe DATABASE_URL= ni guillemets. Détail : ${hint}`
    )
  }
}

function parseEnvInt(name: string, fallback: number): number {
  const raw = process.env[name]?.trim()
  if (!raw) return fallback
  const n = parseInt(raw, 10)
  return Number.isFinite(n) && n > 0 ? n : fallback
}

/** Active la vérification stricte du certificat (CA reconnu). */
function tlsVerifyStrictFromEnv(): boolean {
  const v = process.env.DATABASE_SSL_REJECT_UNAUTHORIZED?.trim().toLowerCase()
  return v === "1" || v === "true"
}

/** TLS pour MySQL distant (ex. Vercel → VPS) : variable ou paramètres d’URL. */
function resolveSsl(fullUrl: string): PoolConfig["ssl"] | undefined {
  const env = process.env.DATABASE_SSL?.trim().toLowerCase()
  if (env === "0" || env === "false") return undefined
  if (env === "1" || env === "true") {
    return { rejectUnauthorized: tlsVerifyStrictFromEnv() }
  }

  const q = fullUrl.indexOf("?")
  if (q === -1) return undefined
  const params = new URLSearchParams(fullUrl.slice(q + 1).split("#")[0] ?? "")
  const ssl = params.get("ssl")
  const sslMode = (params.get("ssl-mode") ?? params.get("sslmode") ?? "").toUpperCase()
  const sslaccept = (params.get("sslaccept") ?? "").toLowerCase()
  const wantsTls =
    ssl === "true" ||
    ssl === "1" ||
    sslMode === "REQUIRED" ||
    sslMode === "VERIFY_CA" ||
    sslMode === "VERIFY_IDENTITY" ||
    sslaccept === "strict" ||
    sslaccept === "accept_invalid_certs"
  if (!wantsTls) return undefined

  if (sslaccept === "strict" || sslMode === "VERIFY_IDENTITY" || sslMode === "VERIFY_CA") {
    return { rejectUnauthorized: true }
  }
  return { rejectUnauthorized: tlsVerifyStrictFromEnv() }
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const databaseUrl = normalizeDatabaseUrl(process.env.DATABASE_URL)

  let connectionDetails: ReturnType<typeof parseDatabaseUrl>
  try {
    connectionDetails = parseDatabaseUrl(databaseUrl)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("Error parsing DATABASE_URL:", message)
    throw error
  }

  const connectTimeout = parseEnvInt("DATABASE_CONNECT_TIMEOUT_MS", 20_000)
  const acquireTimeout = parseEnvInt("DATABASE_ACQUIRE_TIMEOUT_MS", 25_000)
  const connectionLimit = parseEnvInt("DATABASE_POOL_CONNECTION_LIMIT", 5)
  const ssl = resolveSsl(databaseUrl)

  const adapterConfig: PoolConfig = {
    host: connectionDetails.host,
    port: connectionDetails.port,
    user: connectionDetails.user,
    database: connectionDetails.database,
    connectionLimit,
    connectTimeout,
    acquireTimeout,
    ...(connectionDetails.password ? { password: connectionDetails.password } : {}),
    ...(ssl !== undefined ? { ssl } : {}),
  }

  let adapter: PrismaMariaDb
  try {
    adapter = new PrismaMariaDb(adapterConfig)
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    console.error("Error creating Prisma adapter:", message)
    throw error
  }

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  })
}

function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient()
  }
  return globalForPrisma.prisma
}

/**
 * Client Prisma initialisé à la première utilisation (lazy).
 * Permet à `next build` sur Vercel sans `DATABASE_URL` tant qu’aucune route n’exécute de requête pendant la collecte.
 * En production / runtime, définir `DATABASE_URL` reste obligatoire dès qu’une route touche la base.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const inst = getPrisma()
    const value = Reflect.get(inst, prop, receiver)
    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(inst)
    }
    return value
  },
})
