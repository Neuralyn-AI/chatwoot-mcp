import { describe, it, expect, vi } from 'vitest'
import { getPortalLocalesTool } from '../../../src/mcp/tools/get-portal-locales'
import { ChatwootClient } from '../../../src/chatwoot/client'

describe('chatwoot_get_portal_locales', () => {
  it('returns allowed_locales and default_locale', async () => {
    const client = new ChatwootClient({ baseUrl: 'x', apiToken: 't', accountId: '1' })
    vi.spyOn(client, 'request').mockResolvedValue({
      id: 1,
      name: 'n',
      slug: 'docs',
      config: {
        default_locale: 'en',
        allowed_locales: [{ code: 'en' }, { code: 'pt_BR' }],
      },
    })

    const r = await getPortalLocalesTool.run({ chatwoot: client }, { portal_slug: 'docs' })
    expect(r).toEqual({ allowed_locales: ['en', 'pt_BR'], default_locale: 'en' })
  })
})
