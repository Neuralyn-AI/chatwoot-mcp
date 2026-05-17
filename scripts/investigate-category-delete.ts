import { ChatwootClient } from '../src/chatwoot/client'

async function main() {
  const baseUrl = process.env.CHATWOOT_BASE_URL!
  const apiToken = process.env.CHATWOOT_API_TOKEN!
  const accountId = process.env.CHATWOOT_ACCOUNT_ID!
  const portalSlug = process.env.PORTAL_SLUG!
  const locale = process.env.LOCALE ?? 'en'
  const authorId = Number(process.env.AUTHOR_ID)
  if (!baseUrl || !apiToken || !accountId || !portalSlug || !authorId)
    throw new Error('Missing env (need CHATWOOT_*, PORTAL_SLUG, AUTHOR_ID)')

  const client = new ChatwootClient({ baseUrl, apiToken, accountId })

  const catRes = await client.request<{ payload: { id: number; slug: string } }>(
    `/portals/${portalSlug}/categories`,
    {
      method: 'POST',
      body: { category: { name: 'q1-test', slug: 'q1-test-old', locale } },
    },
  )
  const cat = catRes.payload
  console.log('created category', cat)

  const artRes = await client.request<{ payload: { id: number } }>(
    `/portals/${portalSlug}/articles`,
    {
      method: 'POST',
      body: {
        article: {
          title: 'q1',
          content: 'x',
          category_id: cat.id,
          author_id: authorId,
          portal_slug: portalSlug,
        },
      },
    },
  )
  const art = artRes.payload
  console.log('created article', art)

  console.log('\n--- Probe 1: PATCH slug ---')
  try {
    const patched = await client.request<unknown>(
      `/portals/${portalSlug}/categories/${cat.id}`,
      { method: 'PATCH', body: { category: { slug: 'q1-test-new' } } },
    )
    console.log('PATCH OK:', JSON.stringify(patched))
  } catch (err) {
    console.log('PATCH FAIL:', (err as Error).message)
  }

  console.log('\n--- Probe 2: DELETE category w/ article ---')
  try {
    await client.request(`/portals/${portalSlug}/categories/${cat.id}`, {
      method: 'DELETE',
    })
    console.log('DELETE OK')
    const aRes = await client.request<{
      payload: { category_id: number | null; category?: { id: number | null } }
    }>(`/portals/${portalSlug}/articles/${art.id}`)
    const a = aRes.payload
    console.log(
      'article after delete:',
      JSON.stringify({ category_id: a.category_id, category: a.category }),
    )
  } catch (err) {
    console.log('DELETE FAIL:', (err as Error).message)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
