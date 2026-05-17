import { describe, it, expect, vi } from 'vitest'
import { updateArticleTool } from '../../../src/mcp/tools/update-article'
import { ChatwootClient } from '../../../src/chatwoot/client'

describe('chatwoot_update_article', () => {
  it('PATCHes only the provided fields', async () => {
    const c = new ChatwootClient({ baseUrl: 'x', apiToken: 't', accountId: '1' })
    const spy = vi
      .spyOn(c, 'request')
      .mockImplementation(async (path: string, init?: unknown) => {
        expect(path).toBe('/portals/docs/articles/42')
        const opts = init as { method: string; body: { article: Record<string, unknown> } }
        expect(opts.method).toBe('PATCH')
        expect(opts.body.article).toEqual({
          title: 'New title',
          content: '# new body',
        })
        return {
          payload: {
            id: 42,
            slug: '1700-old-slug',
            title: 'New title',
            locale: 'en',
            status: 1,
            category_id: 7,
          },
        }
      })

    const r = await updateArticleTool.run(
      { chatwoot: c },
      {
        portal_slug: 'docs',
        id: 42,
        title: 'New title',
        content: '# new body',
      },
    )

    expect(spy).toHaveBeenCalledTimes(1)
    expect(r.id).toBe(42)
    expect(r.title).toBe('New title')
  })

  it('maps status string -> int on update too', async () => {
    const c = new ChatwootClient({ baseUrl: 'x', apiToken: 't', accountId: '1' })
    const sent: number[] = []
    vi.spyOn(c, 'request').mockImplementation(async (_p, init?: unknown) => {
      const body = (init as { body: { article: { status?: number } } }).body.article
      if (body.status !== undefined) sent.push(body.status)
      return { payload: { id: 1, slug: 's', title: 't', locale: 'en', status: body.status ?? 0 } }
    })

    for (const s of ['draft', 'published', 'archived'] as const) {
      await updateArticleTool.run(
        { chatwoot: c },
        { portal_slug: 'docs', id: 1, status: s },
      )
    }
    expect(sent).toEqual([0, 1, 2])
  })

  it('url-encodes the portal slug', async () => {
    const c = new ChatwootClient({ baseUrl: 'x', apiToken: 't', accountId: '1' })
    const spy = vi.spyOn(c, 'request').mockResolvedValue({
      payload: { id: 1, slug: 's', title: 't', locale: 'en' },
    })
    await updateArticleTool.run(
      { chatwoot: c },
      { portal_slug: 'help/center', id: 1, title: 'x' },
    )
    expect(spy.mock.calls[0]![0]).toBe('/portals/help%2Fcenter/articles/1')
  })

  it('forwards every supported optional field', async () => {
    const c = new ChatwootClient({ baseUrl: 'x', apiToken: 't', accountId: '1' })
    const spy = vi.spyOn(c, 'request').mockResolvedValue({
      payload: { id: 1, slug: 's', title: 't', locale: 'pt_BR', status: 1 },
    })
    await updateArticleTool.run(
      { chatwoot: c },
      {
        portal_slug: 'docs',
        id: 1,
        title: 't',
        slug: 'new-stem',
        content: 'body',
        description: 'd',
        category_id: 8,
        locale: 'pt_BR',
        status: 'published',
        author_id: 9,
        associated_article_id: 5,
        meta: { k: 'v' },
        position: 2,
      },
    )
    const body = (spy.mock.calls[0]![1] as { body: { article: Record<string, unknown> } }).body
      .article
    expect(body).toEqual({
      title: 't',
      slug: 'new-stem',
      content: 'body',
      description: 'd',
      category_id: 8,
      locale: 'pt_BR',
      status: 1,
      author_id: 9,
      associated_article_id: 5,
      meta: { k: 'v' },
      position: 2,
    })
  })

  it('throws at run() when no patch fields are provided', async () => {
    const c = new ChatwootClient({ baseUrl: 'x', apiToken: 't', accountId: '1' })
    const spy = vi.spyOn(c, 'request')
    await expect(
      updateArticleTool.run({ chatwoot: c }, { portal_slug: 'docs', id: 1 }),
    ).rejects.toThrow(/at least one field/i)
    expect(spy).not.toHaveBeenCalled()
  })

  it('rejects a non-positive id via schema', () => {
    const parsed = updateArticleTool.inputSchema.safeParse({
      portal_slug: 'docs',
      id: 0,
      title: 't',
    })
    expect(parsed.success).toBe(false)
  })
})
