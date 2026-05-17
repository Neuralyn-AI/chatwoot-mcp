import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import type { ChatwootClient } from '../chatwoot/client'
import { tools, type ToolContext } from './tools'

export interface CreateMcpServerOptions {
  chatwoot: ChatwootClient
}

export function createMcpServer(opts: CreateMcpServerOptions): McpServer {
  const server = new McpServer(
    { name: 'chatwoot-mcp', version: '0.1.0' },
    { capabilities: { tools: {} } },
  )
  const ctx: ToolContext = { chatwoot: opts.chatwoot }
  for (const t of tools) t.register(server, ctx)

  // The high-level McpServer only wires up tools/list once a tool is registered.
  // When the registry is empty we still want tools/list to return an empty array
  // instead of "method not found".
  if (tools.length === 0) {
    server.server.registerCapabilities({ tools: { listChanged: true } })
    server.server.setRequestHandler(ListToolsRequestSchema, () => ({ tools: [] }))
  }

  return server
}
