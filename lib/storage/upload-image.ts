import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"
import {
  generateFilename,
  isBlobStorageConfigured,
  uploadToVercelBlob,
} from "@/lib/storage/vercel-blob"

async function uploadToLocalFilesystem(buffer: Buffer, filename: string): Promise<string> {
  const uploadsDir = join(process.cwd(), "public", "uploads", "products")
  if (!existsSync(uploadsDir)) {
    await mkdir(uploadsDir, { recursive: true })
  }
  await writeFile(join(uploadsDir, filename), buffer)
  return `/uploads/products/${filename}`
}

/**
 * En local sans token : public/uploads.
 * Avec BLOB_READ_WRITE_TOKEN (Vercel ou .env local) : Vercel Blob.
 */
export async function uploadProductImage(
  file: File,
  buffer: Buffer
): Promise<{ url: string; storage: "local" | "vercel-blob" }> {
  const filename = generateFilename(file.name)

  if (isBlobStorageConfigured()) {
    const url = await uploadToVercelBlob(buffer, filename, file.type)
    return { url, storage: "vercel-blob" }
  }

  const url = await uploadToLocalFilesystem(buffer, filename)
  return { url, storage: "local" }
}
