import type { ChatwootClient } from './client'

/**
 * Response shape of POST /api/v1/accounts/:account_id/upload.
 * file_url is the public URL of the uploaded blob (embeddable in article
 * markdown); blob_id is the Active Storage signed_id.
 */
export interface UploadResult {
  file_url: string
  blob_id: string
}

export type UploadInput =
  | { kind: 'url'; external_url: string }
  | { kind: 'file'; bytes: Uint8Array; filename: string; contentType: string }

export async function uploadAttachment(
  client: ChatwootClient,
  input: UploadInput,
): Promise<UploadResult> {
  if (input.kind === 'url') {
    return client.request<UploadResult>('/upload', {
      method: 'POST',
      body: { external_url: input.external_url },
    })
  }
  const form = new FormData()
  const blob = new Blob([input.bytes], { type: input.contentType })
  form.append('attachment', blob, input.filename)
  return client.request<UploadResult>('/upload', {
    method: 'POST',
    body: form,
  })
}
