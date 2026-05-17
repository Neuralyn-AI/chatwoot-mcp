async function main() {
  const baseUrl = process.env.CHATWOOT_BASE_URL!
  const portalSlug = process.env.PORTAL_SLUG!
  const locale = process.env.LOCALE ?? 'en'
  const query = process.env.QUERY ?? 'test'

  const url = `${baseUrl.replace(/\/+$/, '')}/hc/${portalSlug}/${locale}/articles.json?query=${encodeURIComponent(query)}`
  console.log('GET', url)
  const res = await fetch(url)
  console.log('status', res.status)
  const text = await res.text()
  console.log(text.slice(0, 2000))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
