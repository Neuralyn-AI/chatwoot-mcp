import { z } from 'zod'
import { defineTool } from './define'
import { getArticle } from '../../chatwoot/articles'

export const getArticleTool = defineTool({
  name: 'chatwoot_get_article',
  description:
    'Fetch a single Help Center article by id. Returns title, slug, content (markdown), status, nested category, meta and author. Note: this endpoint does not surface locale, category_id, or associated_article_id — use chatwoot_list_articles to discover those.',
  inputSchema: z.object({
    portal_slug: z.string().min(1),
    id: z.number().int().positive(),
  }),
  async run(ctx, { portal_slug, id }) {
    const a = await getArticle(ctx.chatwoot, portal_slug, id)
    return {
      id: a.id,
      slug: a.slug,
      title: a.title,
      content: a.content,
      description: a.description ?? null,
      status: a.status ?? null,
      position: a.position ?? null,
      meta: a.meta ?? {},
      category: a.category ?? null,
      views: a.views ?? null,
      author: a.author ?? null,
      updated_at: a.updated_at ?? null,
    }
  },
})
