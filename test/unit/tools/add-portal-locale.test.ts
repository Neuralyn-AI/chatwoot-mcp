import { describe, it, expect, vi } from 'vitest'
import { addPortalLocaleTool } from '../../../src/mcp/tools/add-portal-locale'
import { ChatwootClient } from '../../../src/chatwoot/client'

type Call = { path: string; init?: { method?: string; body?: unknown } }

describe('chatwoot_add_portal_locale', () => {
  it('adds the locale and backfills missing categories', async () => {
    const c = new ChatwootClient({ baseUrl: 'x', apiToken: 't', accountId: '1' })
    const calls: Call[] = []

    vi.spyOn(c, 'request').mockImplementation(async (path: string, init?: unknown) => {
      const i = init as Call['init']
      calls.push({ path, init: i })

      if (path === '/portals/docs' && (!i || i.method === undefined)) {
        return {
          id: 1,
          name: 'Docs',
          slug: 'docs',
          config: {
            default_locale: 'en',
            allowed_locales: [{ code: 'en' }],
          },
        }
      }
      if (path === '/portals/docs' && i?.method === 'PATCH') {
        return {
          id: 1,
          name: 'Docs',
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
            { id: 1, slug: 'a', name: 'A', locale: 'en', description: '', position: 1 },
            { id: 2, slug: 'b', name: 'B', locale: 'en', description: '', position: 2 },
          ],
        }
      }
      if (path === '/portals/docs/categories?locale=pt_BR') {
        return {
          payload: [
            { id: 3, slug: 'a', name: 'A', locale: 'pt_BR', description: '', position: 1 },
          ],
        }
      }
      if (path === '/portals/docs/categories' && i?.method === 'POST') {
        const cat = (i.body as { category: { slug: string; name: string; locale: string } })
          .category
        return { id: 99, slug: cat.slug, name: cat.name, locale: cat.locale }
      }
      throw new Error('unexpected path ' + path)
    })

    const r = await addPortalLocaleTool.run(
      { chatwoot: c },
      { portal_slug: 'docs', locale: 'pt_BR' },
    )

    expect(r.added_locale).toBe('pt_BR')
    expect(r.backfilled_categories).toEqual([
      { slug: 'b', locale: 'pt_BR', source_category_id: 2 },
    ])

    const patch = calls.find((c) => c.path === '/portals/docs' && c.init?.method === 'PATCH')!
    const portalPatch = (patch.init!.body as { portal: { config: { allowed_locales: string[] } } })
      .portal
    expect(portalPatch.config.allowed_locales).toEqual(['en', 'pt_BR'])
  })

  it('no-ops if locale is already allowed', async () => {
    const c = new ChatwootClient({ baseUrl: 'x', apiToken: 't', accountId: '1' })
    vi.spyOn(c, 'request').mockResolvedValueOnce({
      id: 1,
      name: 'Docs',
      slug: 'docs',
      config: {
        default_locale: 'en',
        allowed_locales: [{ code: 'en' }, { code: 'pt_BR' }],
      },
    })
    const r = await addPortalLocaleTool.run(
      { chatwoot: c },
      { portal_slug: 'docs', locale: 'pt_BR' },
    )
    expect(r.backfilled_categories).toEqual([])
  })
})
