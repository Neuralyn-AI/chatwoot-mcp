import { describe, it, expect, vi } from 'vitest'
import { deleteArticleTool } from '../../../src/mcp/tools/delete-article'
import { ChatwootClient } from '../../../src/chatwoot/client'

describe('chatwoot_delete_article', () => {
  it('issues DELETE and returns ok:true with the id', async () => {
    const c = new ChatwootClient({ baseUrl: 'x', apiToken: 't', accountId: '1' })
    const spy = vi
      .spyOn(c, 'request')
      .mockImplementation(async (path: string, init?: unknown) => {
        expect(path).toBe('/portals/docs/articles/42')
        const opts = init as { method: string }
        expect(opts.method).toBe('DELETE')
        return undefined
      })

    const r = await deleteArticleTool.run(
      { chatwoot: c },
      { portal_slug: 'docs', id: 42 },
    )

    expect(spy).toHaveBeenCalledTimes(1)
    expect(r).toEqual({ ok: true, id: 42 })
  })

  it('url-encodes the portal slug', async () => {
    const c = new ChatwootClient({ baseUrl: 'x', apiToken: 't', accountId: '1' })
    const spy = vi.spyOn(c, 'request').mockResolvedValue(undefined)
    await deleteArticleTool.run(
      { chatwoot: c },
      { portal_slug: 'help/center', id: 1 },
    )
    expect(spy.mock.calls[0]![0]).toBe('/portals/help%2Fcenter/articles/1')
  })

  it('rejects non-positive ids via schema', () => {
    const parsed = deleteArticleTool.inputSchema.safeParse({
      portal_slug: 'docs',
      id: 0,
    })
    expect(parsed.success).toBe(false)
  })
})
