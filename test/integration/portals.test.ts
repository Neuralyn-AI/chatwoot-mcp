import { describe, it, expect, afterAll } from 'vitest'
import { hasEnv, makeClient, uniqueSlug } from './helpers'
import { createPortal, listPortals } from '../../src/chatwoot/portals'

describe.skipIf(!hasEnv)('portals integration', () => {
  const client = makeClient()
  const slug = uniqueSlug('portal')
  let createdId: number | null = null

  afterAll(async () => {
    if (createdId == null) return
    await client.request(`/portals/${slug}`, { method: 'DELETE' }).catch(() => undefined)
  })

  it('creates and lists a portal', async () => {
    const created = await createPortal(client, {
      name: 'MCP Integration Test',
      slug,
      default_locale: 'en',
    })
    createdId = created.id
    expect(created.slug).toBe(slug)

    const all = await listPortals(client)
    expect(all.find((p) => p.slug === slug)).toBeTruthy()
  })
})
