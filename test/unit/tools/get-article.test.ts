import { describe, it, expect, vi } from 'vitest'
import { getArticleTool } from '../../../src/mcp/tools/get-article'
import { ChatwootClient } from '../../../src/chatwoot/client'

describe('chatwoot_get_article', () => {
  it('fetches a single article by id and returns its fields', async () => {
    const c = new ChatwootClient({ baseUrl: 'x', apiToken: 't', accountId: '1' })
    const spy = vi.spyOn(c, 'request').mockImplementation(async (path: string) => {
      if (path === '/portals/docs/articles/42') {
        return {
          payload: {
            id: 42,
            slug: '1778977553-getting-started',
            title: 'Getting Started',
            content: '# Hello\n\nBody',
            description: 'short desc',
            status: 1,
            position: 1,
            account_id: 1,
            updated_at: 1700000000,
            meta: { foo: 'bar' },
            category: { id: 7, slug: 'onboarding', locale: 'en' },
            views: 12,
            author: { id: 1, name: 'agent' },
          },
        }
      }
      throw new Error(`unexpected path: ${path}`)
    })

    const r = await getArticleTool.run(
      { chatwoot: c },
      { portal_slug: 'docs', id: 42 },
    )

    expect(spy).toHaveBeenCalledWith('/portals/docs/articles/42')
    expect(r.id).toBe(42)
    expect(r.title).toBe('Getting Started')
    expect(r.content).toBe('# Hello\n\nBody')
    expect(r.status).toBe(1)
    expect(r.category).toEqual({ id: 7, slug: 'onboarding', locale: 'en' })
    expect(r.meta).toEqual({ foo: 'bar' })
  })

  it('url-encodes the portal slug', async () => {
    const c = new ChatwootClient({ baseUrl: 'x', apiToken: 't', accountId: '1' })
    const spy = vi.spyOn(c, 'request').mockResolvedValue({
      payload: { id: 1, slug: 's', title: 't', content: '' },
    })
    await getArticleTool.run(
      { chatwoot: c },
      { portal_slug: 'help/center', id: 1 },
    )
    expect(spy).toHaveBeenCalledWith('/portals/help%2Fcenter/articles/1')
  })

  it('rejects non-positive ids via schema validation', async () => {
    const parsed = getArticleTool.inputSchema.safeParse({
      portal_slug: 'docs',
      id: 0,
    })
    expect(parsed.success).toBe(false)
  })
})
