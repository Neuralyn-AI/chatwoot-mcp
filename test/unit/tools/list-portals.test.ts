import { describe, it, expect, vi } from 'vitest'
import { listPortalsTool } from '../../../src/mcp/tools/list-portals'
import { ChatwootClient } from '../../../src/chatwoot/client'

describe('chatwoot_list_portals', () => {
  it('maps Chatwoot response to MCP shape', async () => {
    const client = new ChatwootClient({
      baseUrl: 'https://x',
      apiToken: 't',
      accountId: '1',
    })
    vi.spyOn(client, 'request').mockResolvedValue({
      payload: [
        {
          id: 1,
          name: 'Docs',
          slug: 'docs',
          color: '#fff',
          archived: false,
          config: {
            allowed_locales: [{ code: 'en' }, { code: 'pt_BR' }],
            default_locale: 'en',
          },
        },
      ],
    })

    const result = await listPortalsTool.run({ chatwoot: client }, {})
    expect(result).toEqual({
      portals: [
        {
          id: 1,
          name: 'Docs',
          slug: 'docs',
          color: '#fff',
          archived: false,
          allowed_locales: ['en', 'pt_BR'],
          default_locale: 'en',
        },
      ],
    })
  })
})
