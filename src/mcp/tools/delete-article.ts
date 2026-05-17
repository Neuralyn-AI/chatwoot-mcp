import { z } from 'zod'
import { defineTool } from './define'
import { deleteArticle } from '../../chatwoot/articles'

export const deleteArticleTool = defineTool({
  name: 'chatwoot_delete_article',
  description:
    'Delete a Help Center article by id. Irreversible; the public URL will 404 immediately afterwards.',
  inputSchema: z.object({
    portal_slug: z.string().min(1),
    id: z.number().int().positive(),
  }),
  async run(ctx, { portal_slug, id }) {
    await deleteArticle(ctx.chatwoot, portal_slug, id)
    return { ok: true, id }
  },
})
