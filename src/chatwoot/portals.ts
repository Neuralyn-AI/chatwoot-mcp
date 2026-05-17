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

export interface CreatePortalInput {
  name: string
  slug: string
  color?: string
  homepage_link?: string
  page_title?: string
  header_text?: string
  default_locale?: string
}

export async function createPortal(
  client: ChatwootClient,
  input: CreatePortalInput,
): Promise<ChatwootPortalRaw> {
  const locale = input.default_locale ?? 'en'
  const payload = {
    portal: {
      name: input.name,
      slug: input.slug,
      color: input.color,
      homepage_link: input.homepage_link,
      page_title: input.page_title,
      header_text: input.header_text,
      config: {
        default_locale: locale,
        allowed_locales: [locale],
      },
    },
  }
  return client.request<ChatwootPortalRaw>('/portals', { method: 'POST', body: payload })
}

// ADR 0001: Chatwoot accepts both `logo` and `portal[logo]` as multipart
// field names; we use the simpler `logo` form. The API does not surface a
// `logo` field in responses, so success is signalled by HTTP 200 only.
const LOGO_FIELD = 'logo'

export async function uploadPortalLogo(
  client: ChatwootClient,
  slug: string,
  source: { blob: Blob; filename: string },
): Promise<ChatwootPortalRaw> {
  const fd = new FormData()
  fd.append(LOGO_FIELD, source.blob, source.filename)
  return client.request<ChatwootPortalRaw>(`/portals/${encodeURIComponent(slug)}`, {
    method: 'PATCH',
    body: fd,
  })
}

export async function removePortalLogo(
  client: ChatwootClient,
  slug: string,
): Promise<ChatwootPortalRaw> {
  return client.request<ChatwootPortalRaw>(`/portals/${encodeURIComponent(slug)}`, {
    method: 'PATCH',
    body: { portal: { logo: null } },
  })
}

export async function updatePortal(
  client: ChatwootClient,
  slug: string,
  patch: { config?: { allowed_locales?: string[]; default_locale?: string } },
): Promise<ChatwootPortalRaw> {
  return client.request<ChatwootPortalRaw>(`/portals/${encodeURIComponent(slug)}`, {
    method: 'PATCH',
    body: { portal: patch },
  })
}
