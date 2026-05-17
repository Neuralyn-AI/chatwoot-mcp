import { describe, it, expect } from 'vitest'
import { Hono } from 'hono'
import { bearerAuth } from '../../src/auth'

const makeApp = (token: string | undefined) => {
  const app = new Hono<{ Bindings: { MCP_AUTH_TOKEN: string } }>()
  app.use('*', bearerAuth)
  app.get('/x', (c) => c.text('ok'))
  return (req: Request) =>
    app.fetch(req, { MCP_AUTH_TOKEN: token } as any)
}

describe('bearerAuth', () => {
  it('401 when no Authorization header', async () => {
    const res = await makeApp('a'.repeat(32))(new Request('http://x/x'))
    expect(res.status).toBe(401)
  })

  it('401 when scheme is not Bearer', async () => {
    const res = await makeApp('a'.repeat(32))(
      new Request('http://x/x', { headers: { Authorization: 'Basic abc' } }),
    )
    expect(res.status).toBe(401)
  })

  it('401 when token mismatches', async () => {
    const res = await makeApp('a'.repeat(32))(
      new Request('http://x/x', { headers: { Authorization: 'Bearer wrong' } }),
    )
    expect(res.status).toBe(401)
  })

  it('200 when token matches', async () => {
    const tok = 'a'.repeat(32)
    const res = await makeApp(tok)(
      new Request('http://x/x', { headers: { Authorization: `Bearer ${tok}` } }),
    )
    expect(res.status).toBe(200)
  })

  it('401 when server has no MCP_AUTH_TOKEN configured', async () => {
    const res = await makeApp(undefined)(
      new Request('http://x/x', { headers: { Authorization: 'Bearer anything' } }),
    )
    expect(res.status).toBe(401)
  })
})
