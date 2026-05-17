const stripDiacritics = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '')

export function slugify(input: string): string {
  return stripDiacritics(input)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function normalizeName(input: string): string {
  return stripDiacritics(input)
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Chatwoot prefixes article slugs with a creation-time epoch (e.g.
// "1778977553-getting-started"). The prefix is per-article and differs
// across locale-versions of the same logical article, so the stripped
// remainder is the only reliable cross-locale key — see ADR 0002.
export function stripTimestampPrefix(slug: string): string {
  return slug.replace(/^\d+-/, '')
}
