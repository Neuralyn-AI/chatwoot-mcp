import { z } from 'zod'
import { defineTool } from './define'
import { listArticles } from '../../chatwoot/articles'

export const listArticlesTool = defineTool({
  name: 'chatwoot_list_articles',
  description:
    'List Help Center articles for a portal, optionally filtered by locale and category slug. Paginates through every result page. Returns id, slug, title, locale, status and category_id for each row.',
  inputSchema: z.object({
    portal_slug: z.string().min(1),
    locale: z.string().optional(),
    category_slug: z.string().optional(),
  }),
  async run(ctx, { portal_slug, locale, category_slug }) {
    const rows = await listArticles(ctx.chatwoot, {
      portal_slug,
      locale,
      category_slug,
    })
    return {
      articles: rows.map((a) => ({
        id: a.id,
        slug: a.slug,
        title: a.title,
        locale: a.locale,
        status: a.status ?? null,
        category_id: a.category_id ?? null,
      })),
    }
  },
})
