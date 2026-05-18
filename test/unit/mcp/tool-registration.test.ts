// Regression guard for the issue where adding a new tool whose inputSchema
// is not a plain z.object() (e.g. a ZodEffects from .refine()) makes the
// whole MCP server crash on every /mcp request — symptom: HTTP 500 with an
// empty body. The bug is invisible to per-tool .run() tests; this suite
// exercises the actual register() call against a real McpServer.

import { describe, it, expect } from 'vitest'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { tools } from '../../../src/mcp/tools'
import { ChatwootClient } from '../../../src/chatwoot/client'

describe('tool registration against the real MCP SDK', () => {
  it('every tool registers without throwing', () => {
    const server = new McpServer(
      { name: 'diag', version: '0.0' },
      { capabilities: { tools: {} } },
    )
    const chatwoot = new ChatwootClient({
      baseUrl: 'x',
      apiToken: 't',
      accountId: '1',
    })
    for (const t of tools) {
      expect(() => t.register(server, { chatwoot })).not.toThrow()
    }
  })
})
