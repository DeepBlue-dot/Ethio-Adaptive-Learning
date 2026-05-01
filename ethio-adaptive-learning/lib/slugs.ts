const NON_ALPHANUMERIC_PATTERN = /[^a-z0-9]+/g
const EDGE_DASH_PATTERN = /^-+|-+$/g

export function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[^\x00-\x7F]/g, "")
    .toLowerCase()
    .replace(NON_ALPHANUMERIC_PATTERN, "-")
    .replace(EDGE_DASH_PATTERN, "")
}

export function buildFallbackSlug(value: string, fallbackPrefix: string) {
  const normalized = slugify(value)
  return normalized || fallbackPrefix
}

export function withNumericSuffix(baseSlug: string, suffix: number) {
  return suffix <= 1 ? baseSlug : `${baseSlug}-${suffix}`
}
