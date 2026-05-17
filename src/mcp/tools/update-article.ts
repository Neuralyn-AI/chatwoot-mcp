import { z } from 'zod'
import { defineTool } from './define'
import { updateArticle, type ArticleRaw } from '../../chatwoot/articles'

const STATUS_TO_INT = { draft: 0, published: 1, archived: 2 } as const

// NOTE: cross-field validation ("at least one patch field provided") lives in
// run() rather than as a .refine() on the schema. Wrapping z.object() with
// .refine() produces a ZodEffects, which @modelcontextprotocol/sdk's
// registerTool fails to register at server boot, crashing every /mcp request.
const inputSchema = z.object({
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

export const updateArticleTool = defineTool({
  name: 'chatwoot_update_article',
  description:
    'Patch a Help Center article by id. Only the fields you pass are updated. Status is a string enum (draft|published|archived) mapped to Chatwoot\'s integer field. To link this article as a translation of another, pass associated_article_id.',
  inputSchema,
  async run(ctx, input) {
    const hasAnyPatch =
      input.title !== undefined ||
      input.slug !== undefined ||
      input.content !== undefined ||
      input.description !== undefined ||
      input.category_id !== undefined ||
      input.locale !== undefined ||
      input.status !== undefined ||
      input.author_id !== undefined ||
      input.associated_article_id !== undefined ||
      input.meta !== undefined ||
      input.position !== undefined
    if (!hasAnyPatch) {
      throw new Error('At least one field to update must be provided.')
    }

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
