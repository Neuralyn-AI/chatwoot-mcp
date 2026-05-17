import { z } from 'zod'
import { defineTool } from './define'
import { getPortal, toPortalSummary } from '../../chatwoot/portals'
import { listArticles, type ArticleRaw } from '../../chatwoot/articles'
import { missing as missingLocales } from '../../lib/locale'

// CONFIRM against ADR 0002 when investigation runs against real Chatwoot.
const TRANSLATION_KEY_FIELD = 'associated_article_id' as const

function keyOf(article: ArticleRaw): string {
  if (TRANSLATION_KEY_FIELD === 'associated_article_id') {
    return String(article.associated_article_id ?? article.id)
  }
  return article.slug
}

export const findUntranslatedArticlesTool = defineTool({
  name: 'chatwoot_find_untranslated_articles',
  description:
    'List articles grouped by translation_key; report which allowed locales each group is missing.',
  inputSchema: z.object({
    portal_slug: z.string().min(1),
    category_slug: z.string().optional(),
  }),
  async run(ctx, { portal_slug, category_slug }) {
    const portal = toPortalSummary(await getPortal(ctx.chatwoot, portal_slug))
    const perLocale = await Promise.all(
      portal.allowed_locales.map(async (locale) => ({
        locale,
        articles: await listArticles(ctx.chatwoot, {
          portal_slug,
          locale,
          category_slug,
        }).catch(() => [] as ArticleRaw[]),
      })),
    )

    type Acc = {
      present_in: Set<string>
      articles: Array<{ id: number; locale: string; title: string; slug: string }>
    }
    const groups = new Map<string, Acc>()
    for (const { locale, articles } of perLocale) {
      for (const a of articles) {
        const k = keyOf(a)
        const acc = groups.get(k) ?? { present_in: new Set<string>(), articles: [] }
        acc.present_in.add(locale)
        acc.articles.push({ id: a.id, locale, title: a.title, slug: a.slug })
        groups.set(k, acc)
      }
    }

    const result = Array.from(groups.entries())
      .map(([translation_key, acc]) => ({
        translation_key,
        present_in: Array.from(acc.present_in),
        missing_in: missingLocales(portal.allowed_locales, Array.from(acc.present_in)),
        articles: acc.articles,
      }))
      .filter((g) => g.missing_in.length > 0)

    return {
      translation_key_field: TRANSLATION_KEY_FIELD as 'associated_article_id' | 'slug',
      groups: result,
    }
  },
})
