const DEFAULT_PLACEHOLDER = "/placeholder.svg"

/**
 * Normalise une URL d'image en base.
 * Les uploads Vercel Blob sont stockés en URL HTTPS complète.
 * Les chemins /images/... et /uploads/... locaux restent relatifs (dev).
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

  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`
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
