import { z } from 'zod'
import { defineTool } from './define'
import { uploadAttachment } from '../../chatwoot/uploads'

const inputSchema = z
  .object({
    external_url: z.string().url().optional(),
    data_base64: z.string().min(1).optional(),
    filename: z.string().min(1).optional(),
    content_type: z.string().min(1).optional(),
  })
  .refine(
    (v) => {
      const hasUrl = !!v.external_url
      const hasFile = !!v.data_base64 && !!v.filename && !!v.content_type
      const partialFile =
        !!v.data_base64 || !!v.filename || !!v.content_type
      // exactly one mode, and file mode requires all three fields
      if (hasUrl && partialFile) return false
      if (!hasUrl && !hasFile) return false
      return true
    },
    {
      message:
        'Provide exactly one of: external_url alone, OR data_base64 + filename + content_type together.',
    },
  )

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

export const uploadAttachmentTool = defineTool({
  name: 'chatwoot_upload_attachment',
  description:
    'Upload an image or file to Chatwoot via POST /api/v1/accounts/{a}/upload and return its public file_url and Active Storage blob_id. Embed file_url directly into article markdown to reference the asset. Provide either external_url (Chatwoot downloads it) or data_base64 + filename + content_type (caller supplies the bytes).',
  inputSchema,
  async run(ctx, input) {
    if (input.external_url) {
      return uploadAttachment(ctx.chatwoot, {
        kind: 'url',
        external_url: input.external_url,
      })
    }
    const bytes = base64ToBytes(input.data_base64!)
    return uploadAttachment(ctx.chatwoot, {
      kind: 'file',
      bytes,
      filename: input.filename!,
      contentType: input.content_type!,
    })
  },
})
