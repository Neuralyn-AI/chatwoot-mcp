import { describe, it, expect, vi } from 'vitest'
import { findUntranslatedArticlesTool } from '../../../src/mcp/tools/find-untranslated-articles'
import { ChatwootClient } from '../../../src/chatwoot/client'

describe('chatwoot_find_untranslated_articles', () => {
  it('groups articles by translation_key and reports missing locales', async () => {
    const c = new ChatwootClient({ baseUrl: 'x', apiToken: 't', accountId: '1' })

    const articlesByLocale: Record<
      string,
      Array<{
        id: number
        slug: string
        title: string
        locale: string
        associated_article_id: number | null
      }>
    > = {
      en: [
        { id: 1, slug: 'a', title: 'A', locale: 'en', associated_article_id: null },
        { id: 3, slug: 'b', title: 'B', locale: 'en', associated_article_id: null },
      ],
      pt_BR: [
        { id: 2, slug: 'a', title: 'A pt', locale: 'pt_BR', associated_article_id: 1 },
      ],
    }

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
      if (path.startsWith('/portals/docs/articles')) {
        const m = path.match(/[?&]locale=([^&]+)/)
        const locale = m ? decodeURIComponent(m[1]!) : 'en'
        const items = articlesByLocale[locale] ?? []
        return { payload: items, meta: { current_page: 1, articles_count: items.length } }
      }
      throw new Error('unexpected ' + path)
    })

    const r = await findUntranslatedArticlesTool.run(
      { chatwoot: c },
      { portal_slug: 'docs' },
    )

    expect(r.translation_key_field).toBe(
      'associated_article_id' satisfies typeof r.translation_key_field,
    )

    const groupB = r.groups.find((g) => g.articles.some((a) => a.slug === 'b'))!
    expect(groupB.present_in).toEqual(['en'])
    expect(groupB.missing_in).toEqual(['pt_BR'])

    const groupA = r.groups.find((g) =>
      g.articles.some((a) => a.slug === 'a' && a.locale === 'en'),
    )
    expect(groupA).toBeUndefined()
  })
})
