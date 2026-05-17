import { z } from 'zod'
import { defineTool } from './define'
import { updateArticle, type ArticleRaw } from '../../chatwoot/articles'

const STATUS_TO_INT = { draft: 0, published: 1, archived: 2 } as const

const inputSchema = z
  .object({
    portal_slug: z.string().min(1),
    id: z.number().int().positive(),
    title: z.string().min(1).optional(),
    slug: z.string().min(1).optional(),
    content: z.string().min(1).optional(),
    description: z.string().optional(),
    category_id: z.number().int().positive().optional(),
    locale: z.string().optional(),
    status: z.enum(['draft', 'published', 'archived']).optional(),
    author_id: z.number().int().positive().optional(),
    associated_article_id: z.number().int().positive().optional(),
    meta: z.record(z.string(), z.unknown()).optional(),
    position: z.number().int().optional(),
  })
  .refine(
    (v) =>
      v.title !== undefined ||
      v.slug !== undefined ||
      v.content !== undefined ||
      v.description !== undefined ||
      v.category_id !== undefined ||
      v.locale !== undefined ||
      v.status !== undefined ||
      v.author_id !== undefined ||
      v.associated_article_id !== undefined ||
      v.meta !== undefined ||
      v.position !== undefined,
    { message: 'At least one field to update must be provided.' },
  )

export const updateArticleTool = defineTool({
  name: 'chatwoot_update_article',
  description:
    'Patch a Help Center article by id. Only the fields you pass are updated. Status is a string enum (draft|published|archived) mapped to Chatwoot\'s integer field. To link this article as a translation of another, pass associated_article_id.',
  inputSchema,
  async run(ctx, input) {
    const patch: Partial<ArticleRaw> & {
      title?: string
      content?: string
      description?: string
      author_id?: number
      position?: number
    } = {}
    if (input.title !== undefined) patch.title = input.title
    if (input.slug !== undefined) patch.slug = input.slug
    if (input.content !== undefined) patch.content = input.content
    if (input.description !== undefined) patch.description = input.description
    if (input.category_id !== undefined) patch.category_id = input.category_id
    if (input.locale !== undefined) patch.locale = input.locale
    if (input.status !== undefined) patch.status = STATUS_TO_INT[input.status]
    if (input.author_id !== undefined) patch.author_id = input.author_id
    if (input.associated_article_id !== undefined) {
      patch.associated_article_id = input.associated_article_id
    }
    if (input.meta !== undefined) patch.meta = input.meta
    if (input.position !== undefined) patch.position = input.position

    const updated = await updateArticle(
      ctx.chatwoot,
      input.portal_slug,
      input.id,
      patch,
    )
    return {
      id: updated.id,
      slug: updated.slug,
      title: updated.title,
      locale: updated.locale,
      status: updated.status ?? null,
      category_id: updated.category_id ?? null,
    }
  },
})
