import { Hono } from 'hono'

type Bindings = {
  CHATWOOT_BASE_URL: string
  CHATWOOT_API_TOKEN: string
  CHATWOOT_ACCOUNT_ID: string
  MCP_AUTH_TOKEN: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.get('/', (c) => c.text('chatwoot-mcp'))

export default app
