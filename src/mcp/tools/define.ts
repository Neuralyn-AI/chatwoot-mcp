import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z, type ZodTypeAny } from 'zod'
import type { ToolContext, ToolDefinition } from './index'

export interface ToolSpec<TInput extends ZodTypeAny, TOutput> {
  name: string
  description: string
  inputSchema: TInput
  run(ctx: ToolContext, input: z.infer<TInput>): Promise<TOutput>
}

export function defineTool<TInput extends ZodTypeAny, TOutput>(
  spec: ToolSpec<TInput, TOutput>,
): ToolDefinition & ToolSpec<TInput, TOutput> {
  return {
    ...spec,
    register(server: McpServer, ctx: ToolContext) {
      // MCP SDK 1.29 `registerTool` accepts a Zod schema directly via its
      // zod-compat `normalizeObjectSchema` helper — no raw-shape extraction needed.
      server.registerTool(
        spec.name,
        {
          description: spec.description,
          inputSchema: spec.inputSchema as never,
        },
        (async (args: unknown) => {
          try {
            const result = await spec.run(ctx, args as z.infer<TInput>)
            return {
              content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
            }
          } catch (err) {
            const e = err as Error & { status?: number; body?: unknown; url?: string }
            const text = formatError(e)
            return { content: [{ type: 'text', text }], isError: true }
          }
        }) as never,
      )
    },
  }
}

function formatError(e: Error & { status?: number; body?: unknown; url?: string }): string {
  if (e.name === 'ChatwootApiError') {
    if (e.status === 401) {
      return 'Credenciais inválidas — verifique CHATWOOT_API_TOKEN e CHATWOOT_ACCOUNT_ID.'
    }
    return `Chatwoot ${e.status} em ${e.url}: ${
      typeof e.body === 'string' ? e.body : JSON.stringify(e.body)
    }`
  }
  return `Erro: ${e.message}`
}
