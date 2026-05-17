import { z } from 'zod'
import { defineTool } from './define'
import { uploadAttachment } from '../../chatwoot/uploads'

// NOTE: cross-field validation ("exactly one input mode") is enforced in
// run() instead of via .refine() on the schema. Wrapping z.object() with
// .refine() produces a ZodEffects, which @modelcontextprotocol/sdk's
// registerTool fails to register at server boot, crashing every /mcp
// request.
const inputSchema = z.object({
  external_url: z.string().url().optional(),
  data_base64: z.string().min(1).optional(),
  filename: z.string().min(1).optional(),
  content_type: z.string().min(1).optional(),
})

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
    const hasUrl = !!input.external_url
    const hasFile =
      !!input.data_base64 && !!input.filename && !!input.content_type
    const partialFile =
      !!input.data_base64 || !!input.filename || !!input.content_type
    if (hasUrl && partialFile) {
      throw new Error(
        'Provide exactly one of: external_url alone, OR data_base64 + filename + content_type together.',
      )
    }
    if (!hasUrl && !hasFile) {
      throw new Error(
        'Provide exactly one of: external_url alone, OR data_base64 + filename + content_type together.',
      )
    }
    if (hasUrl) {
      return uploadAttachment(ctx.chatwoot, {
        kind: 'url',
        external_url: input.external_url!,
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
