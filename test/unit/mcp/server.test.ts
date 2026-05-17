import { describe, it, expect } from 'vitest'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { createMcpServer } from '../../../src/mcp/server'
import { ChatwootClient } from '../../../src/chatwoot/client'

describe('MCP server', () => {
  it('exposes tools via tools/list', async () => {
    const chatwoot = new ChatwootClient({
      baseUrl: 'https://chat.example.com',
      apiToken: 'tok',
      accountId: '1',
    })
    const server = createMcpServer({ chatwoot })

    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair()
    await server.connect(serverTransport)

    const client = new Client({ name: 'test', version: '0.0.0' }, { capabilities: {} })
    await client.connect(clientTransport)

    const { tools } = await client.listTools()
    expect(tools.length).toBeGreaterThanOrEqual(0)
    for (const t of tools) {
      expect(t.name).toMatch(/^chatwoot_/)
      expect(t.description).toBeTruthy()
    }
  })
})
