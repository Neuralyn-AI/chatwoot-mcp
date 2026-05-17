import { z } from 'zod'
import { defineTool } from './define'
import { listPortals } from '../../chatwoot/portals'

export const listPortalsTool = defineTool({
  name: 'chatwoot_list_portals',
  description: 'List all Help Center portals visible to the configured Chatwoot account.',
  inputSchema: z.object({}),
  async run(ctx) {
    return { portals: await listPortals(ctx.chatwoot) }
  },
})
