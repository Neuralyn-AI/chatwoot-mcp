import type { ChatwootClient } from './client'

export interface CategoryRaw {
  id: number
  slug: string
  name: string
  description?: string
  locale: string
  position?: number
  parent_category_id?: number | null
  associated_category_id?: number | null
}

export interface CategorySummary {
  id: number
  slug: string
  name: string
  description: string
  locale: string
  position: number
  parent_category_id: number | null
}

export function toCategorySummary(c: CategoryRaw): CategorySummary {
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    description: c.description ?? '',
    locale: c.locale,
    position: c.position ?? 0,
    parent_category_id: c.parent_category_id ?? null,
  }
}

export async function listCategories(
  client: ChatwootClient,
  portalSlug: string,
  locale: string,
): Promise<CategorySummary[]> {
  const res = await client.request<{ payload: CategoryRaw[] }>(
    `/portals/${encodeURIComponent(portalSlug)}/categories?locale=${encodeURIComponent(locale)}`,
  )
  return (res.payload ?? []).map(toCategorySummary)
}

export interface CreateCategoryInput {
  name: string
  slug: string
  locale: string
  description?: string
  position?: number
  parent_category_id?: number | null
  associated_category_id?: number | null
}

export async function createCategory(
  client: ChatwootClient,
  portalSlug: string,
  input: CreateCategoryInput,
): Promise<CategoryRaw> {
  const res = await client.request<{ payload: CategoryRaw }>(
    `/portals/${encodeURIComponent(portalSlug)}/categories`,
    { method: 'POST', body: { category: input } },
  )
  return res.payload
}

export async function deleteCategory(
  client: ChatwootClient,
  portalSlug: string,
  id: number,
): Promise<void> {
  await client.request(
    `/portals/${encodeURIComponent(portalSlug)}/categories/${id}`,
    { method: 'DELETE' },
  )
}

export async function updateCategory(
  client: ChatwootClient,
  portalSlug: string,
  id: number,
  patch: Partial<CategoryRaw>,
): Promise<CategoryRaw> {
  const res = await client.request<{ payload: CategoryRaw }>(
    `/portals/${encodeURIComponent(portalSlug)}/categories/${id}`,
    { method: 'PATCH', body: { category: patch } },
  )
  return res.payload
}
