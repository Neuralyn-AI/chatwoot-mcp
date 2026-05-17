import { describe, it, expect, vi } from 'vitest'
import { associateCategoriesTool } from '../../../src/mcp/tools/associate-categories'
import { ChatwootClient } from '../../../src/chatwoot/client'

type Call = { path: string; init?: { method?: string; body?: unknown } }

describe('chatwoot_associate_categories (patch strategy)', () => {
  it('PATCHes the slug of each source category', async () => {
    const c = new ChatwootClient({ baseUrl: 'x', apiToken: 't', accountId: '1' })
    const calls: Call[] = []
    vi.spyOn(c, 'request').mockImplementation(async (path: string, init?: unknown) => {
      const i = init as Call['init']
      calls.push({ path, init: i })
      if (path === '/portals/docs/categories?locale=pt_BR') {
        return { payload: [{ id: 99, slug: 'primeiros-passos', name: 'X', locale: 'pt_BR' }] }
      }
      if (path === '/portals/docs/categories?locale=es') {
        return { payload: [{ id: 100, slug: 'comenzar', name: 'X', locale: 'es' }] }
      }
      if (path.startsWith('/portals/docs/articles')) {
        return { payload: [{ id: 1 }], meta: { current_page: 1, articles_count: 1 } }
      }
      return { payload: { id: 99, slug: 'getting-started', name: 'X', locale: 'pt_BR' } }
    })

    const r = await associateCategoriesTool.run(
      { chatwoot: c },
      {
        portal_slug: 'docs',
        target_slug: 'getting-started',
        sources: [
          { locale: 'pt_BR', current_slug: 'primeiros-passos' },
          { locale: 'es', current_slug: 'comenzar' },
        ],
      },
    )

    expect(r.associated).toHaveLength(2)
    expect(r.associated.every((a) => a.strategy === 'patch')).toBe(true)
    const patches = calls.filter((c) => c.init?.method === 'PATCH')
    expect(patches).toHaveLength(2)
    const firstPatchBody = patches[0]!.init!.body as { category: { slug: string } }
    expect(firstPatchBody.category.slug).toBe('getting-started')
  })

  it('no-ops when current slug already matches target', async () => {
    const c = new ChatwootClient({ baseUrl: 'x', apiToken: 't', accountId: '1' })
    const spy = vi.spyOn(c, 'request')
    const r = await associateCategoriesTool.run(
      { chatwoot: c },
      {
        portal_slug: 'docs',
        target_slug: 'same',
        sources: [{ locale: 'en', current_slug: 'same' }],
      },
    )
    expect(r.associated[0]).toMatchObject({
      slug: 'same',
      strategy: 'patch',
      articles_moved: 0,
    })
    expect(spy).not.toHaveBeenCalled()
  })
})
