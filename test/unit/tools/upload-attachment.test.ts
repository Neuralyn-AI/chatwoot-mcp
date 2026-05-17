import { describe, it, expect, vi } from 'vitest'
import { uploadAttachmentTool } from '../../../src/mcp/tools/upload-attachment'
import { ChatwootClient } from '../../../src/chatwoot/client'

describe('chatwoot_upload_attachment', () => {
  it('forwards external_url as JSON body', async () => {
    const c = new ChatwootClient({ baseUrl: 'x', apiToken: 't', accountId: '1' })
    const spy = vi
      .spyOn(c, 'request')
      .mockImplementation(async (path: string, init?: unknown) => {
        expect(path).toBe('/upload')
        const opts = init as { method: string; body: { external_url: string } }
        expect(opts.method).toBe('POST')
        expect(opts.body).toEqual({ external_url: 'https://example.com/img.png' })
        return { file_url: 'https://cw/files/abc/img.png', blob_id: 'sig123' }
      })

    const r = await uploadAttachmentTool.run(
      { chatwoot: c },
      { external_url: 'https://example.com/img.png' },
    )

    expect(spy).toHaveBeenCalledTimes(1)
    expect(r).toEqual({
      file_url: 'https://cw/files/abc/img.png',
      blob_id: 'sig123',
    })
  })

  it('builds a multipart body with the decoded file content when data_base64 is provided', async () => {
    const c = new ChatwootClient({ baseUrl: 'x', apiToken: 't', accountId: '1' })
    const spy = vi
      .spyOn(c, 'request')
      .mockImplementation(async (path: string, init?: unknown) => {
        expect(path).toBe('/upload')
        const opts = init as { method: string; body: FormData }
        expect(opts.body).toBeInstanceOf(FormData)
        const att = opts.body.get('attachment')
        expect(att).toBeInstanceOf(Blob)
        const blob = att as unknown as File | Blob
        expect(blob.type).toBe('image/png')
        // base64 of "hi!" is "aGkh" — verify bytes round-trip
        const text = await blob.text()
        expect(text).toBe('hi!')
        if ('name' in blob) expect((blob as File).name).toBe('screenshot.png')
        return { file_url: 'https://cw/files/zzz/screenshot.png', blob_id: 'sig999' }
      })

    const r = await uploadAttachmentTool.run(
      { chatwoot: c },
      {
        data_base64: 'aGkh',
        filename: 'screenshot.png',
        content_type: 'image/png',
      },
    )

    expect(spy).toHaveBeenCalledTimes(1)
    expect(r.file_url).toBe('https://cw/files/zzz/screenshot.png')
    expect(r.blob_id).toBe('sig999')
  })

  it('throws at run() when both external_url and data_base64 are provided', async () => {
    const c = new ChatwootClient({ baseUrl: 'x', apiToken: 't', accountId: '1' })
    const spy = vi.spyOn(c, 'request')
    await expect(
      uploadAttachmentTool.run(
        { chatwoot: c },
        {
          external_url: 'https://x/img.png',
          data_base64: 'aGkh',
          filename: 'a.png',
          content_type: 'image/png',
        },
      ),
    ).rejects.toThrow(/exactly one/i)
    expect(spy).not.toHaveBeenCalled()
  })

  it('throws at run() when neither is provided', async () => {
    const c = new ChatwootClient({ baseUrl: 'x', apiToken: 't', accountId: '1' })
    const spy = vi.spyOn(c, 'request')
    await expect(
      uploadAttachmentTool.run({ chatwoot: c }, {}),
    ).rejects.toThrow(/exactly one/i)
    expect(spy).not.toHaveBeenCalled()
  })

  it('throws at run() when data_base64 is provided without filename and content_type', async () => {
    const c = new ChatwootClient({ baseUrl: 'x', apiToken: 't', accountId: '1' })
    const spy = vi.spyOn(c, 'request')
    await expect(
      uploadAttachmentTool.run({ chatwoot: c }, { data_base64: 'aGkh' }),
    ).rejects.toThrow(/exactly one/i)
    expect(spy).not.toHaveBeenCalled()
  })

  it('rejects when external_url is not a URL via schema', () => {
    const parsed = uploadAttachmentTool.inputSchema.safeParse({
      external_url: 'not-a-url',
    })
    expect(parsed.success).toBe(false)
  })
})
