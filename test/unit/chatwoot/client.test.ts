import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ChatwootClient, ChatwootApiError } from '../../../src/chatwoot/client'

const baseClient = () =>
  new ChatwootClient({
    baseUrl: 'https://chat.example.com',
    apiToken: 'tok',
    accountId: '7',
  })

describe('ChatwootClient.request', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('composes URL with account id for account-scoped paths', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    await baseClient().request('/portals')

    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe('https://chat.example.com/api/v1/accounts/7/portals')
    expect((init as RequestInit).headers).toMatchObject({
      api_access_token: 'tok',
    })
  })

  it('does not inject account path for /public paths', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({}), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    await baseClient().request('/public/api/v1/portals')
    const [url] = fetchMock.mock.calls[0]!
    expect(url).toBe('https://chat.example.com/public/api/v1/portals')
  })

  it('returns parsed JSON for 2xx', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id: 1, name: 'x' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    const result = await baseClient().request<{ id: number }>('/portals/1')
    expect(result).toEqual({ id: 1, name: 'x' })
  })

  it('returns undefined for 204', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }))

    const result = await baseClient().request('/portals/1', { method: 'DELETE' })
    expect(result).toBeUndefined()
  })

  it('throws ChatwootApiError for 4xx with body', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: 'not found' }), {
        status: 404,
        headers: { 'content-type': 'application/json' },
      }),
    )

    await expect(baseClient().request('/portals/missing')).rejects.toMatchObject({
      name: 'ChatwootApiError',
      status: 404,
      body: { message: 'not found' },
      method: 'GET',
      url: 'https://chat.example.com/api/v1/accounts/7/portals/missing',
    })
  })

  it('throws ChatwootApiError for 5xx', async () => {
    fetchMock.mockResolvedValue(new Response('boom', { status: 503 }))
    await expect(baseClient().request('/portals')).rejects.toBeInstanceOf(
      ChatwootApiError,
    )
  })

  it('serializes JSON body and sets content-type', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ id: 1 }), {
        status: 201,
        headers: { 'content-type': 'application/json' },
      }),
    )

    await baseClient().request('/portals', {
      method: 'POST',
      body: { name: 'p', slug: 's' },
    })

    const [, init] = fetchMock.mock.calls[0]!
    expect((init as RequestInit).headers).toMatchObject({
      'content-type': 'application/json',
    })
    expect((init as RequestInit).body).toBe('{"name":"p","slug":"s"}')
  })

  it('passes raw FormData without JSON serializing', async () => {
    fetchMock.mockResolvedValue(new Response('{}', { status: 200 }))
    const fd = new FormData()
    fd.append('logo', new Blob(['x']))

    await baseClient().request('/portals/s', { method: 'PATCH', body: fd })

    const [, init] = fetchMock.mock.calls[0]!
    expect((init as RequestInit).body).toBe(fd)
    expect((init as RequestInit).headers).not.toHaveProperty('content-type')
  })
})
