import { z } from 'zod'
import { defineTool } from './define'
import { getPortal, toPortalSummary } from '../../chatwoot/portals'
import { listCategories, type CategorySummary } from '../../chatwoot/categories'
import { listArticles } from '../../chatwoot/articles'
import { normalizeName } from '../../lib/slug'

interface Candidate {
  locale: string
  current_slug: string
  name: string
  id: number
  article_count: number
}

interface Cluster {
  suggested_target_slug: string
  reason: string
  confidence: 'high' | 'medium' | 'low'
  candidates: Candidate[]
}

export const suggestCategoryAssociationsTool = defineTool({
  name: 'chatwoot_suggest_category_associations',
  description:
    'Suggest groupings of categories across locales that look like the same logical category but currently have divergent slugs. Output is a list of candidate clusters for the agent to review with the user.',
  inputSchema: z.object({ portal_slug: z.string().min(1) }),
  async run(ctx, { portal_slug }) {
    const portal = toPortalSummary(await getPortal(ctx.chatwoot, portal_slug))

    const byLocale = new Map<string, CategorySummary[]>()
    for (const locale of portal.allowed_locales) {
      byLocale.set(
        locale,
        await listCategories(ctx.chatwoot, portal_slug, locale).catch(() => []),
      )
    }

    const buckets = new Map<string, Map<string, CategorySummary>>()

    for (const [locale, cats] of byLocale) {
      for (const cat of cats) {
        const nameKey = `name:${normalizeName(cat.name)}`
        const posKey = cat.position ? `pos:${cat.position}` : null
        const keys = [nameKey, posKey].filter(Boolean) as string[]
        for (const k of keys) {
          if (!buckets.has(k)) buckets.set(k, new Map())
          if (!buckets.get(k)!.has(locale)) buckets.get(k)!.set(locale, cat)
        }
      }
    }

    const seen = new Set<string>()
    const clusters: Cluster[] = []

    for (const [key, perLocale] of buckets) {
      if (perLocale.size < 2) continue
      const cats = Array.from(perLocale.entries()).map(([locale, cat]) => ({ locale, cat }))
      const slugs = new Set(cats.map((x) => x.cat.slug))
      if (slugs.size === 1) continue

      const signature = cats
        .map((x) => `${x.locale}:${x.cat.id}`)
        .sort()
        .join('|')
      if (seen.has(signature)) continue
      seen.add(signature)

      const fromDefault = cats.find((x) => x.locale === portal.default_locale)
      const target = (fromDefault ?? cats[0]!).cat.slug

      const candidates: Candidate[] = await Promise.all(
        cats.map(async ({ locale, cat }) => {
          const articles = await listArticles(ctx.chatwoot, {
            portal_slug,
            locale,
            category_slug: cat.slug,
          }).catch(() => [])
          return {
            locale,
            current_slug: cat.slug,
            name: cat.name,
            id: cat.id,
            article_count: articles.length,
          }
        }),
      )

      const reason = key.startsWith('name:')
        ? 'normalized name matches across locales'
        : 'shared position across locales'
      const confidence: Cluster['confidence'] = key.startsWith('name:') ? 'high' : 'medium'

      clusters.push({ suggested_target_slug: target, reason, confidence, candidates })
    }

    return { clusters }
  },
})
