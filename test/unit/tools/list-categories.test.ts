import { describe, it, expect, vi } from 'vitest'
import { listCategoriesTool } from '../../../src/mcp/tools/list-categories'
import { ChatwootClient } from '../../../src/chatwoot/client'

describe('chatwoot_list_categories', () => {
  it('GETs /portals/{slug}/categories?locale=...', async () => {
    const c = new ChatwootClient({ baseUrl: 'x', apiToken: 't', accountId: '1' })
    const spy = vi.spyOn(c, 'request').mockResolvedValue({
      payload: [
        {
          id: 10,
          slug: 'getting-started',
          name: 'Getting Started',
          description: 'd',
          locale: 'en',
          position: 1,
          parent_category_id: null,
        },
      ],
    })

    const r = await listCategoriesTool.run(
      { chatwoot: c },
      { portal_slug: 'docs', locale: 'en' },
    )
    expect(spy).toHaveBeenCalledWith('/portals/docs/categories?locale=en')
    expect(r).toEqual({
      categories: [
        {
          id: 10,
          slug: 'getting-started',
          name: 'Getting Started',
          description: 'd',
          locale: 'en',
          position: 1,
          parent_category_id: null,
        },
      ],
    })
  })
})
