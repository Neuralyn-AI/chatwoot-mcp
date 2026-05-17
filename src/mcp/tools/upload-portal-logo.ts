import { z } from 'zod'
import { defineTool } from './define'
import { uploadPortalLogo } from '../../chatwoot/portals'

const MAX_BYTES = 5 * 1024 * 1024

export const uploadPortalLogoTool = defineTool({
  name: 'chatwoot_upload_portal_logo',
  description:
    'Download an image from logo_url and upload it as the portal logo via multipart/form-data.',
  inputSchema: z.object({
    portal_slug: z.string().min(1),
    logo_url: z.string().url(),
  }),
  async run(ctx, { portal_slug, logo_url }) {
    const res = await fetch(logo_url)
    if (!res.ok) throw new Error(`Failed to download logo: HTTP ${res.status}`)
    const buf = await res.arrayBuffer()
    if (buf.byteLength > MAX_BYTES) throw new Error('Logo exceeds 5MB limit')
    const blob = new Blob([buf], { type: res.headers.get('content-type') ?? 'image/png' })
    const filename = logo_url.split('/').pop() || 'logo.png'

    const updated = await uploadPortalLogo(ctx.chatwoot, portal_slug, { blob, filename })
    return {
      logo_url: updated.logo?.file_url ?? null,
      logo_filename: updated.logo?.filename ?? null,
    }
  },
})
