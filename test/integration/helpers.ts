import { ChatwootClient } from '../../src/chatwoot/client'

export const hasEnv =
  !!process.env.CHATWOOT_BASE_URL &&
  !!process.env.CHATWOOT_API_TOKEN &&
  !!process.env.CHATWOOT_ACCOUNT_ID

export function makeClient() {
  return new ChatwootClient({
    baseUrl: process.env.CHATWOOT_BASE_URL!,
    apiToken: process.env.CHATWOOT_API_TOKEN!,
    accountId: process.env.CHATWOOT_ACCOUNT_ID!,
  })
}

export function uniqueSlug(prefix = 'mcp-int'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}
