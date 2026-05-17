import { z } from 'zod'
import { defineTool } from './define'
import { getPortal, toPortalSummary } from '../../chatwoot/portals'

export const getPortalLocalesTool = defineTool({
  name: 'chatwoot_get_portal_locales',
  description: 'Return allowed_locales and default_locale for a portal.',
  inputSchema: z.object({ portal_slug: z.string().min(1) }),
  async run(ctx, { portal_slug }) {
    const portal = await getPortal(ctx.chatwoot, portal_slug)
    const summary = toPortalSummary(portal)
    return {
      allowed_locales: summary.allowed_locales,
      default_locale: summary.default_locale,
    }
  },
})
