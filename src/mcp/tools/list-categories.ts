import { z } from 'zod'
import { defineTool } from './define'
import { listCategories } from '../../chatwoot/categories'

export const listCategoriesTool = defineTool({
  name: 'chatwoot_list_categories',
  description: 'List categories of a portal for a given locale.',
  inputSchema: z.object({
    portal_slug: z.string().min(1),
    locale: z.string().min(1),
  }),
  async run(ctx, { portal_slug, locale }) {
    const categories = await listCategories(ctx.chatwoot, portal_slug, locale)
    return { categories }
  },
})
