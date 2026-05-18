import { Hono } from 'hono'
import { bearerAuth } from './auth'
import { ChatwootClient } from './chatwoot/client'
import { validateEnv, type Env } from './env'
import { createMcpServer } from './mcp/server'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'

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

// SSE streaming is not supported in stateless JSON-response mode.
// Returning 405 prevents the Worker from holding an open ReadableStream
// indefinitely, which Cloudflare cancels as a "hung" Worker.
app.get('/mcp', (c) =>
  c.text('Method Not Allowed', 405, { Allow: 'POST' }),
)

app.all('/mcp', async (c) => {
  const env = validateEnv(c.env)
  const chatwoot = new ChatwootClient({
    baseUrl: env.CHATWOOT_BASE_URL,
    apiToken: env.CHATWOOT_API_TOKEN,
    accountId: env.CHATWOOT_ACCOUNT_ID,
  })
  const server = createMcpServer({ chatwoot })

  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  })
  await server.connect(transport)

  return transport.handleRequest(c.req.raw)
})

export default app
