import { Hono } from 'hono'
import { bearerAuth } from './auth'
import { ChatwootClient } from './chatwoot/client'
import { validateEnv, type Env } from './env'
import { createMcpServer } from './mcp/server'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'

type Bindings = Env

const app = new Hono<{ Bindings: Bindings }>()

app.get('/', (c) => c.text('chatwoot-mcp'))

app.get('/healthz', async (c) => {
  let env: Env
  try {
    env = validateEnv(c.env)
  } catch (err) {
    return c.json(
      { status: 'error', message: (err as Error).message },
      503,
    )
  }
  const client = new ChatwootClient({
    baseUrl: env.CHATWOOT_BASE_URL,
    apiToken: env.CHATWOOT_API_TOKEN,
    accountId: env.CHATWOOT_ACCOUNT_ID,
  })
  try {
    const result = await client.request<{ payload: unknown[] }>('/portals')
    const portals_visible = Array.isArray(result?.payload) ? result.payload.length : 0
    return c.json({ status: 'ok', portals_visible })
  } catch (err) {
    return c.json({ status: 'error', message: (err as Error).message }, 503)
  }
})

app.use('/mcp', bearerAuth)
app.use('/mcp/*', bearerAuth)

app.all('/mcp', async (c) => {
  const env = validateEnv(c.env)
  const chatwoot = new ChatwootClient({
    baseUrl: env.CHATWOOT_BASE_URL,
    apiToken: env.CHATWOOT_API_TOKEN,
    accountId: env.CHATWOOT_ACCOUNT_ID,
  })
  const server = createMcpServer({ chatwoot })

  // Stateless: a new transport per request.
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  })
  await server.connect(transport)

  // Bridge Hono's Request to the SDK by collecting body and proxying through.
  const req = c.req.raw
  const body =
    req.method === 'GET' || req.method === 'DELETE'
      ? undefined
      : await req.json().catch(() => undefined)

  return await new Promise<Response>((resolve, reject) => {
    const headers = new Headers()
    let status = 200
    const chunks: Uint8Array[] = []

    const fakeRes = {
      setHeader(name: string, value: string) {
        headers.set(name, value)
      },
      writeHead(s: number, h?: Record<string, string>) {
        status = s
        if (h) for (const [k, v] of Object.entries(h)) headers.set(k, v)
      },
      write(chunk: string | Uint8Array) {
        chunks.push(typeof chunk === 'string' ? new TextEncoder().encode(chunk) : chunk)
      },
      end(chunk?: string | Uint8Array) {
        if (chunk) this.write(chunk)
        const total = chunks.reduce((s, c) => s + c.length, 0)
        const out = new Uint8Array(total)
        let off = 0
        for (const c of chunks) {
          out.set(c, off)
          off += c.length
        }
        resolve(new Response(out, { status, headers }))
      },
      on() {},
    }

    transport
      .handleRequest(
        {
          method: req.method,
          headers: Object.fromEntries(req.headers.entries()),
          url: '/mcp',
        } as any,
        fakeRes as any,
        body,
      )
      .catch(reject)
  })
})

export default app
