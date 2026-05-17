import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ChatwootClient } from '../../chatwoot/client'
import { listPortalsTool } from './list-portals'

export interface ToolContext {
  chatwoot: ChatwootClient
}

export interface ToolDefinition {
  register(server: McpServer, ctx: ToolContext): void
}

export const tools: ToolDefinition[] = [listPortalsTool]
