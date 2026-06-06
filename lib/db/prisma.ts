import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

/**
 * Nettoie DATABASE_URL (copier-coller depuis Supabase / Vercel, etc.) :
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

  if (!s.startsWith("postgresql://") && !s.startsWith("postgres://")) {
    throw new Error(
      "DATABASE_URL doit commencer par postgresql:// ou postgres:// (URL pooler Supabase pour le runtime)."
    )
  }
  return s
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  pgPool: pg.Pool | undefined
}

function createPrismaClient(): PrismaClient {
  const databaseUrl = normalizeDatabaseUrl(process.env.DATABASE_URL)
  const isVercel = process.env.VERCEL === "1"
  const defaultPoolMax = isVercel ? "1" : "10"

  if (!globalForPrisma.pgPool) {
    globalForPrisma.pgPool = new pg.Pool({
      connectionString: databaseUrl,
      max: parseInt(process.env.DATABASE_POOL_MAX ?? defaultPoolMax, 10) || 1,
      idleTimeoutMillis: isVercel ? 5_000 : 30_000,
      connectionTimeoutMillis: parseInt(process.env.DATABASE_CONNECT_TIMEOUT_MS ?? "10000", 10),
      ssl:
        databaseUrl.includes("supabase.com") || databaseUrl.includes("supabase.co")
          ? { rejectUnauthorized: false }
          : undefined,
    })
  }

  const adapter = new PrismaPg(globalForPrisma.pgPool)

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
 * Utilise DATABASE_URL (connexion pooler Supabase, port 6543) en runtime.
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
