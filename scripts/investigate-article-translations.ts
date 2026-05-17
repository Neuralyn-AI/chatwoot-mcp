import { ChatwootClient } from '../src/chatwoot/client'

async function main() {
  const baseUrl = process.env.CHATWOOT_BASE_URL!
  const apiToken = process.env.CHATWOOT_API_TOKEN!
  const accountId = process.env.CHATWOOT_ACCOUNT_ID!
  const portalSlug = process.env.PORTAL_SLUG!
  const articleId = process.env.ARTICLE_ID!
  if (!baseUrl || !apiToken || !accountId || !portalSlug || !articleId) {
    throw new Error(
      'Required: CHATWOOT_BASE_URL CHATWOOT_API_TOKEN CHATWOOT_ACCOUNT_ID PORTAL_SLUG ARTICLE_ID',
    )
  }

  const client = new ChatwootClient({ baseUrl, apiToken, accountId })

  console.log('--- GET article ---')
  const article = await client.request<unknown>(
    `/portals/${portalSlug}/articles/${articleId}`,
  )
  console.log(JSON.stringify(article, null, 2))

  console.log('\n--- Try PATCH associated_article_id=null (probe field) ---')
  try {
    await client.request(`/portals/${portalSlug}/articles/${articleId}`, {
      method: 'PATCH',
      body: { article: { associated_article_id: null } },
    })
    console.log('PATCH associated_article_id accepted')
  } catch (err) {
    console.log('FAIL:', (err as Error).message)
  }

  console.log('\n--- Try LIST with associated_article_id filter ---')
  try {
    const r = await client.request<unknown>(
      `/portals/${portalSlug}/articles?associated_article_id=${articleId}`,
    )
    console.log(JSON.stringify(r, null, 2))
  } catch (err) {
    console.log('FAIL:', (err as Error).message)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
