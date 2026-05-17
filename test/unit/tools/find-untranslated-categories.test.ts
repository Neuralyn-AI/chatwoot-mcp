import { describe, it, expect, vi } from 'vitest'
import { findUntranslatedCategoriesTool } from '../../../src/mcp/tools/find-untranslated-categories'
import { ChatwootClient } from '../../../src/chatwoot/client'

describe('chatwoot_find_untranslated_categories', () => {
  it('returns groups with missing locales per slug', async () => {
    const c = new ChatwootClient({ baseUrl: 'x', apiToken: 't', accountId: '1' })
    vi.spyOn(c, 'request').mockImplementation(async (path: string) => {
      if (path === '/portals/docs') {
        return {
          id: 1,
          name: 'd',
          slug: 'docs',
          config: {
            default_locale: 'en',
            allowed_locales: [{ code: 'en' }, { code: 'pt_BR' }, { code: 'es' }],
          },
        }
      }
      if (path === '/portals/docs/categories?locale=en') {
        return {
          payload: [
            { id: 1, slug: 'a', name: 'A', locale: 'en' },
            { id: 2, slug: 'b', name: 'B', locale: 'en' },
          ],
        }
      }
      if (path === '/portals/docs/categories?locale=pt_BR') {
        return { payload: [{ id: 3, slug: 'a', name: 'A pt', locale: 'pt_BR' }] }
      }
      if (path === '/portals/docs/categories?locale=es') {
        return { payload: [] }
      }
      throw new Error('unexpected ' + path)
    })

    const r = await findUntranslatedCategoriesTool.run(
      { chatwoot: c },
      { portal_slug: 'docs' },
    )

    const byA = r.groups.find((g) => g.slug === 'a')!
    expect(byA.present_in.sort()).toEqual(['en', 'pt_BR'])
    expect(byA.missing_in.sort()).toEqual(['es'])

    const byB = r.groups.find((g) => g.slug === 'b')!
    expect(byB.present_in).toEqual(['en'])
    expect(byB.missing_in.sort()).toEqual(['es', 'pt_BR'])
  })
})
