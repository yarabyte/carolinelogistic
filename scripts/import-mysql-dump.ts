/**
 * Importe les données d'un dump MySQL (TablePlus) vers Supabase / PostgreSQL via Prisma.
 *
 * Usage:
 *   npm run db:import
 *   npm run db:import -- /chemin/vers/carolinelogistics2.sql
 *
 * Prérequis:
 *   1. DIRECT_URL configuré (connexion directe Supabase, port 5432)
 *   2. Schéma appliqué: npm run db:migrate
 */
import fs from "fs"
import path from "path"
import dotenv from "dotenv"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

dotenv.config()

const DEFAULT_DUMP = path.join(
  process.env.HOME ?? "",
  "Desktop",
  "carolinelogistics2.sql"
)

const BOOLEAN_COLUMNS = new Set([
  "isActive",
  "isPartner",
  "isFeatured",
  "consent",
])

const JSON_COLUMNS = new Set(["details", "customerInfo", "images"])

const IMPORT_ORDER = [
  "users",
  "categories",
  "partners",
  "products",
  "promotions",
  "promotion_products",
  "promotion_categories",
  "delivery_zones",
  "settings",
  "blog_posts",
  "hero_slides",
  "newsletter",
  "orders",
  "order_items",
  "activity_logs",
] as const

type TableName = (typeof IMPORT_ORDER)[number]

function createImportClient(): PrismaClient {
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL
  if (!url) {
    throw new Error("DIRECT_URL (ou DATABASE_URL) doit être défini dans .env")
  }

  const pool = new pg.Pool({
    connectionString: url,
    ssl: url.includes("supabase.com") || url.includes("supabase.co")
      ? { rejectUnauthorized: false }
      : undefined,
  })

  return new PrismaClient({
    adapter: new PrismaPg(pool),
  })
}

function parseInsertBlocks(sql: string): Map<string, { columns: string[]; rows: string[][] }> {
  const blocks = new Map<string, { columns: string[]; rows: string[][] }>()
  const insertRe = /INSERT INTO `([^`]+)` \(([^)]+)\) VALUES\s*([\s\S]*?);(?=\s*(?:\/\*|$|INSERT|DROP|CREATE|--))/gi

  let match: RegExpExecArray | null
  while ((match = insertRe.exec(sql)) !== null) {
    const table = match[1]
    const columns = match[2]
      .split(",")
      .map((c) => c.trim().replace(/^`|`$/g, ""))
    const rows = parseValueTuples(match[3])

    if (table === "_prisma_migrations") continue

    const existing = blocks.get(table)
    if (existing) {
      existing.rows.push(...rows)
    } else {
      blocks.set(table, { columns, rows })
    }
  }

  return blocks
}

function parseValueTuples(valuesSection: string): string[][] {
  const rows: string[][] = []
  let i = 0
  const s = valuesSection.trim()

  while (i < s.length) {
    while (i < s.length && (s[i] === "," || s[i] === "\n" || s[i] === "\r" || s[i] === " ")) {
      i++
    }
    if (i >= s.length || s[i] !== "(") break

    i++
    const row: string[] = []

    while (i < s.length) {
      while (i < s.length && (s[i] === " " || s[i] === "\n" || s[i] === "\r" || s[i] === ",")) {
        i++
      }
      if (i >= s.length) break

      if (s[i] === ")") {
        i++
        rows.push(row)
        break
      }

      if (s.startsWith("NULL", i) && (i + 4 >= s.length || s[i + 4] === "," || s[i + 4] === ")")) {
        row.push("NULL")
        i += 4
        continue
      }

      if (s[i] === "'") {
        i++
        let value = ""
        while (i < s.length) {
          const ch = s[i]
          if (ch === "\\") {
            value += s[i + 1] ?? ""
            i += 2
            continue
          }
          if (ch === "'") {
            if (s[i + 1] === "'") {
              value += "'"
              i += 2
              continue
            }
            i++
            break
          }
          value += ch
          i++
        }
        row.push(value)
        continue
      }

      let token = ""
      while (i < s.length && s[i] !== "," && s[i] !== ")") {
        token += s[i]
        i++
      }
      row.push(token.trim())
    }
  }

  return rows
}

function rowToRecord(columns: string[], values: string[]): Record<string, unknown> {
  const record: Record<string, unknown> = {}

  columns.forEach((column, index) => {
    const raw = values[index]
    if (raw === undefined || raw === "NULL") {
      record[column] = null
      return
    }

    if (BOOLEAN_COLUMNS.has(column)) {
      record[column] = raw === "1" || raw === "true"
      return
    }

    if (JSON_COLUMNS.has(column)) {
      record[column] = JSON.parse(raw)
      return
    }

    if (/^-?\d+(\.\d+)?$/.test(raw)) {
      if (column === "stock" || column === "views" || column === "clicks" || column === "quantity" || column === "sort_order" || column === "applied_steps_count") {
        record[column] = parseInt(raw, 10)
      } else if (column.includes("Date") || column.includes("At") || column === "publishedAt" || column === "finished_at" || column === "rolled_back_at" || column === "started_at") {
        record[column] = new Date(raw.replace(" ", "T") + (raw.includes("T") ? "" : "Z"))
      } else {
        record[column] = Number(raw)
      }
      return
    }

    if (column.includes("Date") || column.includes("At") || column === "publishedAt") {
      record[column] = new Date(raw.replace(" ", "T") + (raw.includes("T") ? "" : "Z"))
      return
    }

    record[column] = raw
  })

  return record
}

function mapHeroSlideRow(record: Record<string, unknown>): Record<string, unknown> {
  if ("sort_order" in record) {
    record.sortOrder = record.sort_order
    delete record.sort_order
  }
  return record
}

async function clearDatabase(prisma: PrismaClient) {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "activity_logs",
      "order_items",
      "orders",
      "newsletter",
      "hero_slides",
      "blog_posts",
      "settings",
      "delivery_zones",
      "promotion_categories",
      "promotion_products",
      "promotions",
      "products",
      "partners",
      "categories",
      "users"
    RESTART IDENTITY CASCADE
  `)
  console.log("  ✓ base vidée")
}

async function importTable(
  prisma: PrismaClient,
  table: TableName,
  columns: string[],
  rows: string[][]
) {
  const data = rows.map((values) => {
    const record = rowToRecord(columns, values)
    return table === "hero_slides" ? mapHeroSlideRow(record) : record
  })

  if (data.length === 0) return

  const model = (prisma as unknown as Record<string, { createMany: (args: unknown) => Promise<unknown> }>)[
    tableToModel(table)
  ]

  if (!model) {
    throw new Error(`Modèle Prisma introuvable pour la table ${table}`)
  }

  await model.createMany({ data, skipDuplicates: true })
  console.log(`  ✓ ${table}: ${data.length} ligne(s)`)
}

function tableToModel(table: TableName): string {
  const map: Record<TableName, string> = {
    users: "user",
    categories: "category",
    partners: "partner",
    products: "product",
    promotions: "promotion",
    promotion_products: "promotionProduct",
    promotion_categories: "promotionCategory",
    delivery_zones: "deliveryZone",
    settings: "settings",
    blog_posts: "blogPost",
    hero_slides: "heroSlide",
    newsletter: "newsletter",
    orders: "order",
    order_items: "orderItem",
    activity_logs: "activityLog",
  }
  return map[table]
}

async function main() {
  const dumpPath = process.argv[2] ?? DEFAULT_DUMP

  if (!fs.existsSync(dumpPath)) {
    throw new Error(`Fichier SQL introuvable: ${dumpPath}`)
  }

  console.log(`📂 Lecture du dump: ${dumpPath}`)
  const sql = fs.readFileSync(dumpPath, "utf8")
  const blocks = parseInsertBlocks(sql)

  const prisma = createImportClient()

  try {
    console.log("📥 Import des données…")
    await clearDatabase(prisma)
    for (const table of IMPORT_ORDER) {
      const block = blocks.get(table)
      if (!block) {
        console.log(`  · ${table}: aucune donnée`)
        continue
      }
      await importTable(prisma, table, block.columns, block.rows)
    }
    console.log("✅ Import terminé.")
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error("❌ Import échoué:", error)
  process.exit(1)
})
