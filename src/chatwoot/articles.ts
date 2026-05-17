import type { ChatwootClient } from './client'

export interface ArticleRaw {
  id: number
  slug: string
  title: string
  locale: string
  status?: number
  category_id?: number | null
  associated_article_id?: number | null
  meta?: Record<string, unknown>
}

/**
 * Full article shape returned by GET /portals/:slug/articles/:id. Differs
 * from `ArticleRaw` (which models the list-endpoint row): includes `content`
 * and a nested `category` object, but does NOT include `locale`,
 * `category_id`, or `associated_article_id` at the top level. See ADR 0002.
 */
export interface ArticleDetailRaw {
  id: number
  slug: string
  title: string
  content: string
  description?: string | null
  status?: number
  position?: number
  account_id?: number
  updated_at?: number
  meta?: Record<string, unknown>
  category?: { id: number; slug: string; locale: string } | null
  views?: number
  author?: { id: number; name?: string; email?: string } | null
}

export interface ListArticlesQuery {
  portal_slug: string
  locale?: string
  category_slug?: string
  page?: number
}

export async function listArticles(
  client: ChatwootClient,
  query: ListArticlesQuery,
): Promise<ArticleRaw[]> {
  const params = new URLSearchParams()
  if (query.locale) params.set('locale', query.locale)
  if (query.category_slug) params.set('category_slug', query.category_slug)

  const out: ArticleRaw[] = []
  let page = query.page ?? 1
  for (;;) {
    params.set('page', String(page))
    const res = await client.request<{
      payload: ArticleRaw[]
      meta?: { current_page: number; articles_count: number }
    }>(`/portals/${encodeURIComponent(query.portal_slug)}/articles?${params.toString()}`)
    const items = res.payload ?? []
    out.push(...items)
    if (items.length === 0) break
    if (res.meta && out.length >= res.meta.articles_count) break
    if (items.length < 25) break
    page++
    if (page > 200) break
  }
  return out
}

export async function getArticle(
  client: ChatwootClient,
  portalSlug: string,
  id: number,
): Promise<ArticleDetailRaw> {
  const res = await client.request<{ payload: ArticleDetailRaw }>(
    `/portals/${encodeURIComponent(portalSlug)}/articles/${id}`,
  )
  return res.payload
}

export async function updateArticle(
  client: ChatwootClient,
  portalSlug: string,
  id: number,
  patch: Partial<ArticleRaw>,
): Promise<ArticleRaw> {
  const res = await client.request<{ payload: ArticleRaw }>(
    `/portals/${encodeURIComponent(portalSlug)}/articles/${id}`,
    { method: 'PATCH', body: { article: patch } },
  )
  return res.payload
}
