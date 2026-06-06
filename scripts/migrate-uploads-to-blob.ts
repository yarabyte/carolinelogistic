/**
 * Envoie les fichiers public/uploads vers Vercel Blob et met à jour les URLs en base.
 *
 * Prérequis :
 *   - Blob store créé sur Vercel → Storage → lié au projet
 *   - BLOB_READ_WRITE_TOKEN dans .env (Vercel → Storage → .env.local)
 *
 * Usage : npm run storage:migrate
 */
import fs from "fs"
import path from "path"
import dotenv from "dotenv"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"
import { uploadToVercelBlob, isBlobStorageConfigured } from "@/lib/storage/vercel-blob"

dotenv.config()

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads", "products")

function createClient(): PrismaClient {
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL
  if (!url) throw new Error("DIRECT_URL ou DATABASE_URL requis")

  const pool = new pg.Pool({
    connectionString: url,
    ssl: url.includes("supabase") ? { rejectUnauthorized: false } : undefined,
  })

  return new PrismaClient({ adapter: new PrismaPg(pool) })
}

function contentTypeFromFilename(filename: string): string {
  const ext = path.extname(filename).toLowerCase()
  if (ext === ".png") return "image/png"
  if (ext === ".webp") return "image/webp"
  if (ext === ".avif") return "image/avif"
  if (ext === ".gif") return "image/gif"
  return "image/jpeg"
}

async function uploadLocalFiles(): Promise<Map<string, string>> {
  if (!isBlobStorageConfigured()) {
    throw new Error("BLOB_READ_WRITE_TOKEN manquant — voir VERCEL.md")
  }

  const urlByFilename = new Map<string, string>()

  if (!fs.existsSync(UPLOADS_DIR)) {
    console.log("  · Aucun dossier public/uploads/products")
    return urlByFilename
  }

  const files = fs.readdirSync(UPLOADS_DIR).filter((f) => !f.startsWith("."))

  for (const filename of files) {
    const filepath = path.join(UPLOADS_DIR, filename)
    if (!fs.statSync(filepath).isFile()) continue

    const buffer = fs.readFileSync(filepath)
    const url = await uploadToVercelBlob(
      buffer,
      filename,
      contentTypeFromFilename(filename)
    )

    urlByFilename.set(filename, url)
    console.log(`  ✓ ${filename}`)
  }

  return urlByFilename
}

function replaceUploadPath(value: string | null, urlByFilename: Map<string, string>): string | null {
  if (!value || !value.startsWith("/uploads/products/")) return value
  const filename = value.replace(/^\/uploads\/products\//, "")
  return urlByFilename.get(filename) ?? value
}

function replaceUploadPathsInJson(value: unknown, urlByFilename: Map<string, string>): unknown {
  if (typeof value === "string" && value.startsWith("/uploads/products/")) {
    return replaceUploadPath(value, urlByFilename)
  }
  if (Array.isArray(value)) {
    return value.map((item) =>
      typeof item === "string" ? replaceUploadPath(item, urlByFilename) ?? item : item
    )
  }
  return value
}

async function updateDatabaseUrls(prisma: PrismaClient, urlByFilename: Map<string, string>) {
  for (const slide of await prisma.heroSlide.findMany()) {
    const image = replaceUploadPath(slide.image, urlByFilename)
    if (image !== slide.image) {
      await prisma.heroSlide.update({ where: { id: slide.id }, data: { image } })
    }
  }
  console.log("  ✓ hero_slides")

  for (const category of await prisma.category.findMany()) {
    const image = replaceUploadPath(category.image, urlByFilename)
    if (image !== category.image) {
      await prisma.category.update({ where: { id: category.id }, data: { image } })
    }
  }
  console.log("  ✓ categories")

  for (const partner of await prisma.partner.findMany()) {
    const logo = replaceUploadPath(partner.logo, urlByFilename)
    if (logo !== partner.logo) {
      await prisma.partner.update({ where: { id: partner.id }, data: { logo } })
    }
  }
  console.log("  ✓ partners")

  for (const product of await prisma.product.findMany({ select: { id: true, images: true } })) {
    const images = replaceUploadPathsInJson(product.images, urlByFilename)
    if (JSON.stringify(images) !== JSON.stringify(product.images)) {
      await prisma.product.update({ where: { id: product.id }, data: { images: images as never } })
    }
  }
  console.log("  ✓ products")

  for (const post of await prisma.blogPost.findMany()) {
    const image = replaceUploadPath(post.image, urlByFilename)
    if (image !== post.image) {
      await prisma.blogPost.update({ where: { id: post.id }, data: { image } })
    }
  }
  console.log("  ✓ blog_posts")

  const settings = await prisma.settings.findUnique({ where: { id: "main" } })
  if (settings?.logo) {
    const logo = replaceUploadPath(settings.logo, urlByFilename)
    if (logo !== settings.logo) {
      await prisma.settings.update({ where: { id: "main" }, data: { logo } })
      console.log("  ✓ settings.logo")
    }
  }
}

async function main() {
  console.log("📤 Upload vers Vercel Blob…")
  const urlByFilename = await uploadLocalFiles()
  console.log(`\n📊 ${urlByFilename.size} fichier(s) envoyé(s)\n`)

  if (urlByFilename.size === 0) return

  console.log("🔄 Mise à jour des URLs en base…")
  const prisma = createClient()
  try {
    await updateDatabaseUrls(prisma, urlByFilename)
    console.log("\n✅ Migration Vercel Blob terminée.")
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error("❌", error)
  process.exit(1)
})
