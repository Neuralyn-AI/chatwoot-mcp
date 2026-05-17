import { describe, it, expect, vi } from 'vitest'
import { createCategoryTool } from '../../../src/mcp/tools/create-category'
import { ChatwootClient } from '../../../src/chatwoot/client'

describe('chatwoot_create_category', () => {
  it('creates one category per allowed locale, with fallback name from default', async () => {
    const c = new ChatwootClient({ baseUrl: 'x', apiToken: 't', accountId: '1' })
    const spy = vi
      .spyOn(c, 'request')
      .mockImplementation(async (path: string, init?: unknown) => {
        if (path === '/portals/docs') {
          return {
            id: 1,
            name: 'Docs',
            slug: 'docs',
            config: {
              default_locale: 'en',
              allowed_locales: [{ code: 'en' }, { code: 'pt_BR' }, { code: 'es' }],
            },
          }
        }
        const body = (init as { body: { category: Record<string, unknown> } }).body.category
        return {
          id: Math.floor(Math.random() * 1000),
          slug: body.slug,
          name: body.name,
          description: body.description,
          locale: body.locale,
          position: body.position ?? 0,
        }
      })

    const r = await createCategoryTool.run(
      { chatwoot: c },
      {
        portal_slug: 'docs',
        slug: 'getting-started',
        names_by_locale: { en: 'Getting Started', pt_BR: 'Primeiros Passos' },
      },
    )

    expect(spy).toHaveBeenCalledTimes(4)
    expect(r.created).toHaveLength(3)
    const byLocale = Object.fromEntries(r.created.map((c) => [c.locale, c]))
    expect(byLocale.en!.name).toBe('Getting Started')
    expect(byLocale.pt_BR!.name).toBe('Primeiros Passos')
    expect(byLocale.es!.name).toBe('Getting Started')
  })

  it('records per-locale errors without aborting', async () => {
    const c = new ChatwootClient({ baseUrl: 'x', apiToken: 't', accountId: '1' })
    vi.spyOn(c, 'request').mockImplementation(async (path: string, init?: unknown) => {
      if (path === '/portals/docs') {
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
      const body = (init as { body: { category: Record<string, unknown> } }).body.category
      if (body.locale === 'pt_BR') throw new Error('boom')
      return { id: 1, slug: body.slug, name: body.name, locale: body.locale }
    })

    const r = await createCategoryTool.run(
      { chatwoot: c },
      {
        portal_slug: 'docs',
        slug: 's',
        names_by_locale: { en: 'En' },
      },
    )
    const byLocale = Object.fromEntries(r.created.map((c) => [c.locale, c]))
    expect(byLocale.en!.error).toBeUndefined()
    expect(byLocale.pt_BR!.error).toMatch(/boom/)
  })
})
