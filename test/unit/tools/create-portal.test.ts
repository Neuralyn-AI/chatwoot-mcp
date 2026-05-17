import { describe, it, expect, vi } from 'vitest'
import { createPortalTool } from '../../../src/mcp/tools/create-portal'
import { ChatwootClient } from '../../../src/chatwoot/client'

describe('chatwoot_create_portal', () => {
  it('POSTs the payload and returns the created portal', async () => {
    const client = new ChatwootClient({ baseUrl: 'x', apiToken: 't', accountId: '1' })
    const spy = vi.spyOn(client, 'request').mockResolvedValue({
      id: 9,
      name: 'Docs',
      slug: 'docs',
      config: { allowed_locales: [{ code: 'en' }], default_locale: 'en' },
    })

    const result = await createPortalTool.run(
      { chatwoot: client },
      { name: 'Docs', slug: 'docs', default_locale: 'en' },
    )

    expect(spy).toHaveBeenCalledWith(
      '/portals',
      expect.objectContaining({
        method: 'POST',
        body: expect.objectContaining({
          portal: expect.objectContaining({
            name: 'Docs',
            slug: 'docs',
            config: { default_locale: 'en', allowed_locales: ['en'] },
          }),
        }),
      }),
    )
    expect(result).toMatchObject({ portal: { id: 9, slug: 'docs' } })
  })

  it('forwards optional fields', async () => {
    const client = new ChatwootClient({ baseUrl: 'x', apiToken: 't', accountId: '1' })
    const spy = vi.spyOn(client, 'request').mockResolvedValue({
      id: 1,
      name: 'n',
      slug: 's',
      config: { allowed_locales: [{ code: 'en' }], default_locale: 'en' },
    })

    await createPortalTool.run(
      { chatwoot: client },
      {
        name: 'n',
        slug: 's',
        color: '#000',
        homepage_link: 'https://x',
        page_title: 'pt',
        header_text: 'ht',
      },
    )
    const body = (spy.mock.calls[0]![1] as { body: { portal: Record<string, unknown> } }).body
      .portal
    expect(body).toMatchObject({
      color: '#000',
      homepage_link: 'https://x',
      page_title: 'pt',
      header_text: 'ht',
    })
  })
})
