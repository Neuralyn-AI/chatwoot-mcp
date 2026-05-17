import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getPortalLogoTool,
  uploadPortalLogoTool,
  removePortalLogoTool,
} from '../../../src/mcp/tools'
import { ChatwootClient } from '../../../src/chatwoot/client'

const baseClient = () =>
  new ChatwootClient({ baseUrl: 'https://x', apiToken: 't', accountId: '1' })

describe('portal logo tools', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(new Blob(['xx'], { type: 'image/png' }), { status: 200 }),
        ),
    )
  })
  afterEach(() => vi.unstubAllGlobals())

  it('get returns logo_url/filename', async () => {
    const c = baseClient()
    vi.spyOn(c, 'request').mockResolvedValue({
      id: 1,
      name: 'n',
      slug: 'docs',
      logo: { file_url: 'https://cdn/u', filename: 'l.png' },
    })
    const r = await getPortalLogoTool.run({ chatwoot: c }, { portal_slug: 'docs' })
    expect(r).toEqual({ logo_url: 'https://cdn/u', logo_filename: 'l.png' })
  })

  it('get returns null when no logo', async () => {
    const c = baseClient()
    vi.spyOn(c, 'request').mockResolvedValue({ id: 1, name: 'n', slug: 'docs' })
    const r = await getPortalLogoTool.run({ chatwoot: c }, { portal_slug: 'docs' })
    expect(r).toEqual({ logo_url: null, logo_filename: null })
  })

  it('upload downloads source and PATCHes multipart', async () => {
    const c = baseClient()
    const spy = vi.spyOn(c, 'request').mockResolvedValue({
      id: 1,
      name: 'n',
      slug: 'docs',
      logo: { file_url: 'https://cdn/new', filename: 'logo.png' },
    })
    const r = await uploadPortalLogoTool.run(
      { chatwoot: c },
      { portal_slug: 'docs', logo_url: 'https://src/logo.png' },
    )
    expect(spy).toHaveBeenCalledWith(
      '/portals/docs',
      expect.objectContaining({ method: 'PATCH' }),
    )
    const body = (spy.mock.calls[0]![1] as { body: unknown }).body
    expect(body).toBeInstanceOf(FormData)
    expect(r).toEqual({ logo_url: 'https://cdn/new', logo_filename: 'logo.png' })
  })

  it('remove returns { removed: true }', async () => {
    const c = baseClient()
    vi.spyOn(c, 'request').mockResolvedValue({ id: 1, name: 'n', slug: 'docs', logo: null })
    const r = await removePortalLogoTool.run({ chatwoot: c }, { portal_slug: 'docs' })
    expect(r).toEqual({ removed: true })
  })
})
