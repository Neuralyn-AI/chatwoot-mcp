import { describe, it, expect, vi } from 'vitest'
import { suggestCategoryAssociationsTool } from '../../../src/mcp/tools/suggest-category-associations'
import { ChatwootClient } from '../../../src/chatwoot/client'

describe('chatwoot_suggest_category_associations', () => {
  it('clusters categories with similar names across locales', async () => {
    const c = new ChatwootClient({ baseUrl: 'x', apiToken: 't', accountId: '1' })
    vi.spyOn(c, 'request').mockImplementation(async (path: string) => {
      if (path === '/portals/docs') {
        return {
          id: 1,
          name: 'd',
          slug: 'docs',
          config: {
            default_locale: 'en',
            allowed_locales: [{ code: 'en' }, { code: 'pt_BR' }],
          },
        }
      }
      if (path === '/portals/docs/categories?locale=en') {
        return {
          payload: [
            {
              id: 1,
              slug: 'getting-started',
              name: 'Getting Started',
              locale: 'en',
              position: 1,
            },
          ],
        }
      }
      if (path === '/portals/docs/categories?locale=pt_BR') {
        return {
          payload: [
            {
              id: 2,
              slug: 'first-steps',
              name: 'Getting Started',
              locale: 'pt_BR',
              position: 1,
            },
          ],
        }
      }
      if (path.startsWith('/portals/docs/articles')) {
        return { payload: [], meta: { current_page: 1, articles_count: 0 } }
      }
      throw new Error('unexpected ' + path)
    })

    const r = await suggestCategoryAssociationsTool.run(
      { chatwoot: c },
      { portal_slug: 'docs' },
    )

    expect(r.clusters).toHaveLength(1)
    const cluster = r.clusters[0]!
    expect(cluster.candidates.map((c) => c.locale).sort()).toEqual(['en', 'pt_BR'])
    expect(cluster.suggested_target_slug).toBe('getting-started')
    expect(cluster.confidence).toMatch(/high|medium/)
  })

  it('does not cluster when slugs already match', async () => {
    const c = new ChatwootClient({ baseUrl: 'x', apiToken: 't', accountId: '1' })
    vi.spyOn(c, 'request').mockImplementation(async (path: string) => {
      if (path === '/portals/docs') {
        return {
          id: 1,
          name: 'd',
          slug: 'docs',
          config: {
            default_locale: 'en',
            allowed_locales: [{ code: 'en' }, { code: 'pt_BR' }],
          },
        }
      }
      if (path === '/portals/docs/categories?locale=en')
        return { payload: [{ id: 1, slug: 's', name: 'S', locale: 'en', position: 1 }] }
      if (path === '/portals/docs/categories?locale=pt_BR')
        return { payload: [{ id: 2, slug: 's', name: 'S', locale: 'pt_BR', position: 1 }] }
      if (path.startsWith('/portals/docs/articles'))
        return { payload: [], meta: { current_page: 1, articles_count: 0 } }
      throw new Error('unexpected ' + path)
    })

    const r = await suggestCategoryAssociationsTool.run(
      { chatwoot: c },
      { portal_slug: 'docs' },
    )
    expect(r.clusters).toHaveLength(0)
  })
})
