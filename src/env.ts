import { z } from 'zod'

export const envSchema = z.object({
  CHATWOOT_BASE_URL: z.string().url(),
  CHATWOOT_API_TOKEN: z.string().min(1),
  CHATWOOT_ACCOUNT_ID: z.string().regex(/^\d+$/),
  MCP_AUTH_TOKEN: z.string().min(16),
})

export type Env = z.infer<typeof envSchema>

export function validateEnv(env: unknown): Env {
  const result = envSchema.safeParse(env)
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ')
    throw new Error(`Invalid env: ${issues}`)
  }
  return result.data
}
