import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

function generateFilename(originalName: string): string {
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 15)
  const extension = originalName.split(".").pop() || "jpg"
  return `${timestamp}-${randomString}.${extension}`
}

async function uploadToLocalFilesystem(buffer: Buffer, filename: string): Promise<string> {
  const uploadsDir = join(process.cwd(), "public", "uploads", "products")
  if (!existsSync(uploadsDir)) {
    await mkdir(uploadsDir, { recursive: true })
  }
  await writeFile(join(uploadsDir, filename), buffer)
  return `/uploads/products/${filename}`
}

async function uploadToSupabaseStorage(
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<string> {
  const supabase = getSupabaseAdmin()
  const bucket = process.env.SUPABASE_STORAGE_BUCKET ?? "media"
  const path = `products/${filename}`

  if (!supabase) {
    throw new Error("Supabase Storage non configuré")
  }

  const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
    contentType,
    upsert: false,
  })

  if (error) {
    throw new Error(error.message)
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

/**
 * En local : écrit dans public/uploads.
 * Sur Vercel : Supabase Storage (filesystem éphémère).
 */
export async function uploadProductImage(
  file: File,
  buffer: Buffer
): Promise<{ url: string; storage: "local" | "supabase" }> {
  const filename = generateFilename(file.name)
  const useSupabase = process.env.VERCEL === "1" || process.env.USE_SUPABASE_STORAGE === "1"

  if (useSupabase) {
    const url = await uploadToSupabaseStorage(buffer, filename, file.type)
    return { url, storage: "supabase" }
  }

  const url = await uploadToLocalFilesystem(buffer, filename)
  return { url, storage: "local" }
}
