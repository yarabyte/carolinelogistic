/**
 * Envoie les fichiers public/uploads vers Supabase Storage et met à jour les URLs en base.
 *
 * Prérequis :
 *   - Bucket public "media" créé dans Supabase
 *   - NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_STORAGE_BUCKET
 *
 * Usage : npm run storage:migrate
 */
import fs from "fs"
import path from "path"
import dotenv from "dotenv"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { toSupabasePublicUrl } from "@/lib/utils/image-url"

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

function mapUploadPath(value: string | null): string | null {
  if (!value || !value.startsWith("/uploads/")) return value
  return toSupabasePublicUrl(value)
}

function mapUploadPathsInJson(value: unknown): unknown {
  if (typeof value === "string") {
    return value.startsWith("/uploads/") ? toSupabasePublicUrl(value) : value
  }
  if (Array.isArray(value)) {
    return value.map((item) =>
      typeof item === "string" && item.startsWith("/uploads/")
        ? toSupabasePublicUrl(item)
        : item
    )
  }
  return value
}

async function uploadLocalFiles(): Promise<number> {
  const supabase = getSupabaseAdmin()
  const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "media"

  if (!supabase) {
    throw new Error("Configurez NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY")
  }

  if (!fs.existsSync(UPLOADS_DIR)) {
    console.log("  · Aucun dossier public/uploads/products")
    return 0
  }

  const files = fs.readdirSync(UPLOADS_DIR).filter((f) => !f.startsWith("."))
  let uploaded = 0

  for (const filename of files) {
    const filepath = path.join(UPLOADS_DIR, filename)
    if (!fs.statSync(filepath).isFile()) continue

    const storagePath = `products/${filename}`
    const buffer = fs.readFileSync(filepath)
    const ext = path.extname(filename).toLowerCase()
    const contentType =
      ext === ".png"
        ? "image/png"
        : ext === ".webp"
          ? "image/webp"
          : ext === ".avif"
            ? "image/avif"
            : ext === ".gif"
              ? "image/gif"
              : "image/jpeg"

    const { error } = await supabase.storage.from(bucket).upload(storagePath, buffer, {
      contentType,
      upsert: true,
    })

    if (error) {
      console.warn(`  ⚠ ${filename}: ${error.message}`)
      continue
    }

    uploaded++
    console.log(`  ✓ ${filename}`)
  }

  return uploaded
}

async function updateDatabaseUrls(prisma: PrismaClient) {
  const heroSlides = await prisma.heroSlide.findMany()
  for (const slide of heroSlides) {
    const image = mapUploadPath(slide.image)
    if (image !== slide.image) {
      await prisma.heroSlide.update({ where: { id: slide.id }, data: { image } })
    }
  }
  console.log(`  ✓ hero_slides (${heroSlides.length})`)

  const categories = await prisma.category.findMany()
  for (const category of categories) {
    const image = mapUploadPath(category.image)
    if (image !== category.image) {
      await prisma.category.update({ where: { id: category.id }, data: { image } })
    }
  }
  console.log(`  ✓ categories (${categories.length})`)

  const partners = await prisma.partner.findMany()
  for (const partner of partners) {
    const logo = mapUploadPath(partner.logo)
    if (logo !== partner.logo) {
      await prisma.partner.update({ where: { id: partner.id }, data: { logo } })
    }
  }
  console.log(`  ✓ partners (${partners.length})`)

  const products = await prisma.product.findMany({ select: { id: true, images: true } })
  for (const product of products) {
    const images = mapUploadPathsInJson(product.images)
    if (JSON.stringify(images) !== JSON.stringify(product.images)) {
      await prisma.product.update({
        where: { id: product.id },
        data: { images: images as never },
      })
    }
  }
  console.log(`  ✓ products (${products.length})`)

  const posts = await prisma.blogPost.findMany()
  for (const post of posts) {
    const image = mapUploadPath(post.image)
    if (image !== post.image) {
      await prisma.blogPost.update({ where: { id: post.id }, data: { image } })
    }
  }
  console.log(`  ✓ blog_posts (${posts.length})`)

  const settings = await prisma.settings.findUnique({ where: { id: "main" } })
  if (settings?.logo?.startsWith("/uploads/")) {
    await prisma.settings.update({
      where: { id: "main" },
      data: { logo: mapUploadPath(settings.logo) },
    })
    console.log("  ✓ settings.logo")
  }
}

async function main() {
  console.log("📤 Upload vers Supabase Storage…")
  const count = await uploadLocalFiles()
  console.log(`\n📊 ${count} fichier(s) envoyé(s)\n`)

  console.log("🔄 Mise à jour des URLs en base…")
  const prisma = createClient()
  try {
    await updateDatabaseUrls(prisma)
    console.log("\n✅ Migration storage terminée.")
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error("❌", error)
  process.exit(1)
})
