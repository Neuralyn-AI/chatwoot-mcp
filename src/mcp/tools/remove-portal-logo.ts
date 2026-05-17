import { z } from 'zod'
import { defineTool } from './define'
import { removePortalLogo } from '../../chatwoot/portals'

export const removePortalLogoTool = defineTool({
  name: 'chatwoot_remove_portal_logo',
  description: 'Remove the logo from a portal.',
  inputSchema: z.object({ portal_slug: z.string().min(1) }),
  async run(ctx, { portal_slug }) {
    await removePortalLogo(ctx.chatwoot, portal_slug)
    return { removed: true }
  },
})
