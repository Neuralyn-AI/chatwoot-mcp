import type { ChatwootClient } from './client'

export interface ChatwootPortalRaw {
  id: number
  name: string
  slug: string
  color?: string
  archived?: boolean
  homepage_link?: string
  page_title?: string
  header_text?: string
  config?: {
    allowed_locales?: Array<{ code: string }>
    default_locale?: string
  }
  logo?: { file_url?: string; filename?: string } | null
}

export interface PortalSummary {
  id: number
  name: string
  slug: string
  color?: string
  archived: boolean
  allowed_locales: string[]
  default_locale: string
}

export async function listPortals(client: ChatwootClient): Promise<PortalSummary[]> {
  const res = await client.request<{ payload: ChatwootPortalRaw[] }>('/portals')
  return (res.payload ?? []).map(toPortalSummary)
}

export async function getPortal(
  client: ChatwootClient,
  slug: string,
): Promise<ChatwootPortalRaw> {
  return client.request<ChatwootPortalRaw>(`/portals/${encodeURIComponent(slug)}`)
}

export function toPortalSummary(p: ChatwootPortalRaw): PortalSummary {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    color: p.color,
    archived: !!p.archived,
    allowed_locales: (p.config?.allowed_locales ?? []).map((l) => l.code),
    default_locale: p.config?.default_locale ?? '',
  }
}
