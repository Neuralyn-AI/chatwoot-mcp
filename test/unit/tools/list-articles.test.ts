import { describe, it, expect, vi } from 'vitest'
import { listArticlesTool } from '../../../src/mcp/tools/list-articles'
import { ChatwootClient } from '../../../src/chatwoot/client'

describe('chatwoot_list_articles', () => {
  it('lists all articles for a portal across pages', async () => {
    const c = new ChatwootClient({ baseUrl: 'x', apiToken: 't', accountId: '1' })
    const spy = vi.spyOn(c, 'request').mockImplementation(async (path: string) => {
      // first page returns 25 rows, second page returns 1 row, third page returns 0
      if (path === '/portals/docs/articles?page=1') {
        return {
          payload: Array.from({ length: 25 }, (_, i) => ({
            id: i + 1,
            slug: `a-${i + 1}`,
            title: `A ${i + 1}`,
            locale: 'en',
            status: 1,
            category_id: 7,
          })),
          meta: { current_page: 1, articles_count: 26 },
        }
      }
      if (path === '/portals/docs/articles?page=2') {
        return {
          payload: [
            { id: 26, slug: 'a-26', title: 'A 26', locale: 'en', status: 1, category_id: 7 },
          ],
          meta: { current_page: 2, articles_count: 26 },
        }
      }
      throw new Error(`unexpected path: ${path}`)
    })

    const r = await listArticlesTool.run(
      { chatwoot: c },
      { portal_slug: 'docs' },
    )

    expect(spy).toHaveBeenCalledTimes(2)
    expect(r.articles).toHaveLength(26)
    expect(r.articles[0]).toEqual({
      id: 1,
      slug: 'a-1',
      title: 'A 1',
      locale: 'en',
      status: 1,
      category_id: 7,
    })
  })

  it('forwards locale and category_slug filters', async () => {
    const c = new ChatwootClient({ baseUrl: 'x', apiToken: 't', accountId: '1' })
    const spy = vi.spyOn(c, 'request').mockResolvedValue({
      payload: [],
      meta: { current_page: 1, articles_count: 0 },
    })
    await listArticlesTool.run(
      { chatwoot: c },
      { portal_slug: 'docs', locale: 'pt_BR', category_slug: 'onboarding' },
    )
    expect(spy).toHaveBeenCalledWith(
      '/portals/docs/articles?locale=pt_BR&category_slug=onboarding&page=1',
    )
  })

  it('returns an empty list when the portal has no articles', async () => {
    const c = new ChatwootClient({ baseUrl: 'x', apiToken: 't', accountId: '1' })
    vi.spyOn(c, 'request').mockResolvedValue({
      payload: [],
      meta: { current_page: 1, articles_count: 0 },
    })
    const r = await listArticlesTool.run(
      { chatwoot: c },
      { portal_slug: 'docs' },
    )
    expect(r.articles).toEqual([])
  })
})
