import { ChatwootClient } from '../src/chatwoot/client'

async function main() {
  const baseUrl = process.env.CHATWOOT_BASE_URL!
  const apiToken = process.env.CHATWOOT_API_TOKEN!
  const accountId = process.env.CHATWOOT_ACCOUNT_ID!
  const portalSlug = process.env.PORTAL_SLUG ?? 'mcp-test'
  if (!baseUrl || !apiToken || !accountId) throw new Error('Missing env')

  const client = new ChatwootClient({ baseUrl, apiToken, accountId })

  const img = await fetch('https://cataas.com/cat?width=64&height=64')
  const blob = await img.blob()

  for (const field of ['logo', 'portal[logo]']) {
    console.log(`\n=== Trying field name: ${field} ===`)
    const fd = new FormData()
    fd.append(field, blob, 'logo.jpg')
    try {
      const result = await client.request<unknown>(`/portals/${portalSlug}`, {
        method: 'PATCH',
        body: fd,
      })
      console.log('OK:', JSON.stringify(result, null, 2))
    } catch (err) {
      console.log('FAIL:', (err as Error).message)
    }
  }

  console.log('\n=== Trying remove via PATCH portal.logo: null ===')
  try {
    const result = await client.request<unknown>(`/portals/${portalSlug}`, {
      method: 'PATCH',
      body: { portal: { logo: null } },
    })
    console.log('OK:', JSON.stringify(result, null, 2))
  } catch (err) {
    console.log('FAIL:', (err as Error).message)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
