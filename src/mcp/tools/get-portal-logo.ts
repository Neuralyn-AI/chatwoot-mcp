import { z } from 'zod'
import { defineTool } from './define'
import { getPortal } from '../../chatwoot/portals'

export const getPortalLogoTool = defineTool({
  name: 'chatwoot_get_portal_logo',
  description: 'Get the logo URL and filename for a portal.',
  inputSchema: z.object({ portal_slug: z.string().min(1) }),
  async run(ctx, { portal_slug }) {
    const portal = await getPortal(ctx.chatwoot, portal_slug)
    return {
      logo_url: portal.logo?.file_url ?? null,
      logo_filename: portal.logo?.filename ?? null,
    }
  },
})
