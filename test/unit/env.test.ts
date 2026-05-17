import { describe, it, expect } from 'vitest'
import { validateEnv } from '../../src/env'

describe('validateEnv', () => {
  const valid = {
    CHATWOOT_BASE_URL: 'https://chat.example.com',
    CHATWOOT_API_TOKEN: 'tok',
    CHATWOOT_ACCOUNT_ID: '1',
    MCP_AUTH_TOKEN: 'a'.repeat(32),
  }

  it('returns config for valid env', () => {
    expect(validateEnv(valid)).toEqual(valid)
  })

  it('throws when CHATWOOT_API_TOKEN is empty', () => {
    expect(() => validateEnv({ ...valid, CHATWOOT_API_TOKEN: '' })).toThrow(
      /CHATWOOT_API_TOKEN/,
    )
  })

  it('throws when CHATWOOT_BASE_URL is not a URL', () => {
    expect(() => validateEnv({ ...valid, CHATWOOT_BASE_URL: 'not-a-url' })).toThrow(
      /CHATWOOT_BASE_URL/,
    )
  })

  it('throws when CHATWOOT_ACCOUNT_ID is non-numeric', () => {
    expect(() => validateEnv({ ...valid, CHATWOOT_ACCOUNT_ID: 'abc' })).toThrow(
      /CHATWOOT_ACCOUNT_ID/,
    )
  })

  it('throws when MCP_AUTH_TOKEN is too short', () => {
    expect(() => validateEnv({ ...valid, MCP_AUTH_TOKEN: 'short' })).toThrow(
      /MCP_AUTH_TOKEN/,
    )
  })
})
