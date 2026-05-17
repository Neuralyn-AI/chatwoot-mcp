import { z } from 'zod'
import { defineTool } from './define'
import { createPortal, toPortalSummary } from '../../chatwoot/portals'

export const createPortalTool = defineTool({
  name: 'chatwoot_create_portal',
  description: 'Create a new Help Center portal.',
  inputSchema: z.object({
    name: z.string().min(1),
    slug: z.string().min(1),
    color: z.string().optional(),
    homepage_link: z.string().url().optional(),
    page_title: z.string().optional(),
    header_text: z.string().optional(),
    default_locale: z.string().optional(),
  }),
  async run(ctx, input) {
    const raw = await createPortal(ctx.chatwoot, input)
    return { portal: toPortalSummary(raw) }
  },
})
