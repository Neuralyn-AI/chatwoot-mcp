import { describe, it, expect, vi } from 'vitest'
import { createArticleTool } from '../../../src/mcp/tools/create-article'
import { ChatwootClient } from '../../../src/chatwoot/client'

describe('chatwoot_create_article', () => {
  it('posts a minimal article and returns the server-assigned slug + id', async () => {
    const c = new ChatwootClient({ baseUrl: 'x', apiToken: 't', accountId: '1' })
    const spy = vi
      .spyOn(c, 'request')
      .mockImplementation(async (path: string, init?: unknown) => {
        expect(path).toBe('/portals/docs/articles')
        const opts = init as { method: string; body: { article: Record<string, unknown> } }
        expect(opts.method).toBe('POST')
        expect(opts.body.article).toMatchObject({
          title: 'Getting started',
          slug: 'getting-started',
          content: '# Hello',
          category_id: 7,
          status: 0,
        })
        // optional fields not provided: should not appear in payload
        expect(opts.body.article).not.toHaveProperty('locale')
        expect(opts.body.article).not.toHaveProperty('description')
        expect(opts.body.article).not.toHaveProperty('author_id')
        expect(opts.body.article).not.toHaveProperty('associated_article_id')
        return {
          payload: {
            id: 100,
            slug: '1700000000-getting-started',
            title: 'Getting started',
            locale: 'en',
            status: 0,
            category_id: 7,
          },
        }
      })

    const r = await createArticleTool.run(
      { chatwoot: c },
      {
        portal_slug: 'docs',
        category_id: 7,
        title: 'Getting started',
        slug: 'getting-started',
        content: '# Hello',
      },
    )

    expect(spy).toHaveBeenCalledTimes(1)
    expect(r.id).toBe(100)
    expect(r.slug).toBe('1700000000-getting-started')
    expect(r.stem_slug).toBe('getting-started')
    expect(r.title).toBe('Getting started')
    expect(r.status).toBe(0)
  })

  it('maps status string -> int (draft=0, published=1, archived=2)', async () => {
    const c = new ChatwootClient({ baseUrl: 'x', apiToken: 't', accountId: '1' })
    const sent: number[] = []
    vi.spyOn(c, 'request').mockImplementation(async (_path, init?: unknown) => {
      const body = (init as { body: { article: { status: number } } }).body.article
      sent.push(body.status)
      return { payload: { id: 1, slug: 'x', title: 't', locale: 'en', status: body.status } }
    })

    for (const s of ['draft', 'published', 'archived'] as const) {
      await createArticleTool.run(
        { chatwoot: c },
        {
          portal_slug: 'docs',
          category_id: 1,
          title: 't',
          slug: 's',
          content: 'c',
          status: s,
        },
      )
    }
    expect(sent).toEqual([0, 1, 2])
  })

  it('forwards optional fields when provided', async () => {
    const c = new ChatwootClient({ baseUrl: 'x', apiToken: 't', accountId: '1' })
    const spy = vi.spyOn(c, 'request').mockResolvedValue({
      payload: { id: 1, slug: 'x', title: 't', locale: 'pt_BR', status: 1 },
    })

    await createArticleTool.run(
      { chatwoot: c },
      {
        portal_slug: 'docs',
        category_id: 1,
        title: 'Como começar',
        slug: 'como-comecar',
        content: 'body',
        locale: 'pt_BR',
        description: 'short',
        status: 'published',
        author_id: 42,
        associated_article_id: 99,
        meta: { source: 'helpdesk-writer' },
        position: 3,
      },
    )

    const body = spy.mock.calls[0]![1] as { body: { article: Record<string, unknown> } }
    expect(body.body.article).toMatchObject({
      title: 'Como começar',
      slug: 'como-comecar',
      content: 'body',
      category_id: 1,
      locale: 'pt_BR',
      description: 'short',
      status: 1,
      author_id: 42,
      associated_article_id: 99,
      meta: { source: 'helpdesk-writer' },
      position: 3,
    })
  })

  it('url-encodes the portal slug', async () => {
    const c = new ChatwootClient({ baseUrl: 'x', apiToken: 't', accountId: '1' })
    const spy = vi.spyOn(c, 'request').mockResolvedValue({
      payload: { id: 1, slug: 's', title: 't', locale: 'en', status: 0 },
    })
    await createArticleTool.run(
      { chatwoot: c },
      {
        portal_slug: 'help/center',
        category_id: 1,
        title: 't',
        slug: 's',
        content: 'c',
      },
    )
    expect(spy.mock.calls[0]![0]).toBe('/portals/help%2Fcenter/articles')
  })

  it('rejects an empty slug via schema', () => {
    const parsed = createArticleTool.inputSchema.safeParse({
      portal_slug: 'docs',
      category_id: 1,
      title: 't',
      slug: '',
      content: 'c',
    })
    expect(parsed.success).toBe(false)
  })

  it('defaults status to draft when omitted', async () => {
    const c = new ChatwootClient({ baseUrl: 'x', apiToken: 't', accountId: '1' })
    const spy = vi.spyOn(c, 'request').mockResolvedValue({
      payload: { id: 1, slug: 's', title: 't', locale: 'en', status: 0 },
    })
    await createArticleTool.run(
      { chatwoot: c },
      {
        portal_slug: 'docs',
        category_id: 1,
        title: 't',
        slug: 's',
        content: 'c',
      },
    )
    const body = spy.mock.calls[0]![1] as { body: { article: { status: number } } }
    expect(body.body.article.status).toBe(0)
  })
})
