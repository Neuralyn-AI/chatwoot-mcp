import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import app from '../../src/index'

const env = {
  CHATWOOT_BASE_URL: 'https://chat.example.com',
  CHATWOOT_API_TOKEN: 'tok',
  CHATWOOT_ACCOUNT_ID: '7',
  MCP_AUTH_TOKEN: 'a'.repeat(32),
}

describe('Hono app', () => {
  let fetchMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('GET /healthz returns 200 with portals_visible when Chatwoot responds', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ payload: [{ id: 1 }, { id: 2 }] }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    )

    const res = await app.fetch(new Request('http://x/healthz'), env as any)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ status: 'ok', portals_visible: 2 })
  })

  it('GET /healthz returns 503 when Chatwoot rejects', async () => {
    fetchMock.mockResolvedValue(new Response('forbidden', { status: 401 }))

    const res = await app.fetch(new Request('http://x/healthz'), env as any)
    expect(res.status).toBe(503)
    const body = (await res.json()) as { status: string; message: string }
    expect(body.status).toBe('error')
    expect(body.message).toMatch(/401/)
  })

  it('GET /healthz returns 503 when env is invalid', async () => {
    const res = await app.fetch(
      new Request('http://x/healthz'),
      { ...env, MCP_AUTH_TOKEN: '' } as any,
    )
    expect(res.status).toBe(503)
  })

  it('POST /mcp without bearer returns 401', async () => {
    const res = await app.fetch(
      new Request('http://x/mcp', { method: 'POST' }),
      env as any,
    )
    expect(res.status).toBe(401)
  })
})
