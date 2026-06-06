const DEFAULT_PLACEHOLDER = "/placeholder.svg"

function getSupabaseBaseUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL
  return url ? url.replace(/\/$/, "") : null
}

function getStorageBucket(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET ??
    process.env.SUPABASE_STORAGE_BUCKET ??
    "media"
  )
}

/**
 * Résout une URL d'image stockée en base.
 * Les chemins `/uploads/...` (fichiers locaux) sont mappés vers Supabase Storage en production.
 */
export function resolveImageUrl(
  url: string | null | undefined,
  fallback: string = DEFAULT_PLACEHOLDER
): string {
  if (!url || url.trim() === "") return fallback

  const trimmed = url.trim()

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed
  }

  const normalized = trimmed.startsWith("/") ? trimmed : `/${trimmed}`

  if (normalized.startsWith("/uploads/")) {
    const supabaseUrl = getSupabaseBaseUrl()
    if (supabaseUrl) {
      const storagePath = normalized.replace(/^\/uploads\//, "")
      return `${supabaseUrl}/storage/v1/object/public/${getStorageBucket()}/${storagePath}`
    }
  }

  return normalized
}

export function resolveImageUrls(
  urls: unknown,
  fallback: string = DEFAULT_PLACEHOLDER
): string[] {
  if (!Array.isArray(urls)) return []
  return urls
    .filter((item): item is string => typeof item === "string" && item.length > 0)
    .map((item) => resolveImageUrl(item, fallback))
}

export function toSupabasePublicUrl(relativeUploadPath: string): string {
  const supabaseUrl = getSupabaseBaseUrl()
  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL manquant")
  }

  const normalized = relativeUploadPath.startsWith("/")
    ? relativeUploadPath
    : `/${relativeUploadPath}`

  if (!normalized.startsWith("/uploads/")) {
    return resolveImageUrl(normalized)
  }

  const storagePath = normalized.replace(/^\/uploads\//, "")
  return `${supabaseUrl}/storage/v1/object/public/${getStorageBucket()}/${storagePath}`
}
