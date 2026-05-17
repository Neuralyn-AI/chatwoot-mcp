import type { MiddlewareHandler } from 'hono'

export const bearerAuth: MiddlewareHandler<{
  Bindings: { MCP_AUTH_TOKEN?: string }
}> = async (c, next) => {
  const expected = c.env.MCP_AUTH_TOKEN
  const header = c.req.header('Authorization') ?? ''
  const match = /^Bearer\s+(.+)$/i.exec(header)
  const provided = match ? match[1] : undefined

  if (!expected || !provided || !timingSafeEqual(expected, provided)) {
    return c.json({ error: 'unauthorized' }, 401)
  }
  await next()
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}
