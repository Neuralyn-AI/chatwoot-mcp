import { z } from 'zod'
import { defineTool } from './define'
import { createArticle, type CreateArticleBody } from '../../chatwoot/articles'

const STATUS_TO_INT = { draft: 0, published: 1, archived: 2 } as const

export const createArticleTool = defineTool({
  name: 'chatwoot_create_article',
  description:
    'Create a Help Center article in a single locale. The provided slug is a stem; the Chatwoot server prepends a timestamp prefix (e.g. "1700000000-getting-started") and returns the final slug. Status defaults to draft. Pass associated_article_id to link this article as a translation of an existing one. IMPORTANT: the content field must be in Markdown format — Chatwoot automatically converts it to HTML for display. Never send raw HTML.',
  inputSchema: z.object({
    portal_slug: z.string().min(1),
    category_id: z.number().int().positive(),
    title: z.string().min(1),
    slug: z.string().min(1),
    content: z.string().min(1),
    description: z.string().optional(),
    locale: z.string().optional(),
    status: z.enum(['draft', 'published', 'archived']).optional(),
    author_id: z.number().int().positive().optional(),
    associated_article_id: z.number().int().positive().optional(),
    meta: z.record(z.string(), z.unknown()).optional(),
    position: z.number().int().optional(),
  }),
  async run(ctx, input) {
    const status = STATUS_TO_INT[input.status ?? 'draft']
    const body: CreateArticleBody = {
      title: input.title,
      slug: input.slug,
      content: input.content,
      category_id: input.category_id,
      status,
    }
    if (input.locale !== undefined) body.locale = input.locale
    if (input.description !== undefined) body.description = input.description
    if (input.author_id !== undefined) body.author_id = input.author_id
    if (input.associated_article_id !== undefined) {
      body.associated_article_id = input.associated_article_id
    }
    if (input.meta !== undefined) body.meta = input.meta
    if (input.position !== undefined) body.position = input.position

    const created = await createArticle(ctx.chatwoot, input.portal_slug, body)
    return {
      id: created.id,
      slug: created.slug,
      stem_slug: input.slug,
      title: created.title,
      locale: created.locale,
      status: created.status ?? null,
      category_id: created.category_id ?? input.category_id,
    }
  },
})
