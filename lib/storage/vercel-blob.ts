import { put } from "@vercel/blob"

function generateFilename(originalName: string): string {
  const timestamp = Date.now()
  const randomString = Math.random().toString(36).substring(2, 15)
  const extension = originalName.split(".").pop() || "jpg"
  return `${timestamp}-${randomString}.${extension}`
}

export function isBlobStorageConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN)
}

/**
 * Envoie une image vers Vercel Blob (public).
 * Nécessite BLOB_READ_WRITE_TOKEN (auto sur Vercel si un Blob store est lié au projet).
 */
export async function uploadToVercelBlob(
  buffer: Buffer,
  filename: string,
  contentType: string,
  folder = "products"
): Promise<string> {
  const token = process.env.BLOB_READ_WRITE_TOKEN
  if (!token) {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN manquant. Créez un Blob store dans Vercel → Storage et liez-le au projet."
    )
  }

  const blob = await put(`${folder}/${filename}`, buffer, {
    access: "public",
    contentType,
    token,
  })

  return blob.url
}

export { generateFilename }
