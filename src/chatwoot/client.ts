export interface ChatwootClientOptions {
  baseUrl: string
  apiToken: string
  accountId: string
}

export interface ChatwootRequestInit extends Omit<RequestInit, 'body'> {
  body?: BodyInit | object | null
}

export class ChatwootApiError extends Error {
  override name = 'ChatwootApiError'
  constructor(
    public status: number,
    public body: unknown,
    public method: string,
    public url: string,
  ) {
    super(
      `Chatwoot API error: ${method} ${url} → ${status} ${
        typeof body === 'string' ? body : JSON.stringify(body)
      }`,
    )
  }
}

export class ChatwootClient {
  constructor(private readonly opts: ChatwootClientOptions) {}

  async request<T = unknown>(path: string, init: ChatwootRequestInit = {}): Promise<T> {
    const url = this.buildUrl(path)
    const method = init.method ?? 'GET'
    const headers: Record<string, string> = {
      api_access_token: this.opts.apiToken,
      ...this.normalizeHeaders(init.headers),
    }

    let body: BodyInit | null | undefined
    if (init.body == null) {
      body = init.body as null | undefined
    } else if (this.isRawBody(init.body)) {
      body = init.body as BodyInit
    } else {
      body = JSON.stringify(init.body)
      headers['content-type'] = 'application/json'
    }

    const response = await fetch(url, {
      ...init,
      method,
      headers,
      body: body ?? undefined,
    })

    if (!response.ok) {
      const errBody = await this.parseBody(response)
      throw new ChatwootApiError(response.status, errBody, method, url)
    }
    if (response.status === 204) return undefined as T
    return (await this.parseBody(response)) as T
  }

  private buildUrl(path: string): string {
    if (path.startsWith('/public/')) {
      return `${this.opts.baseUrl.replace(/\/+$/, '')}${path}`
    }
    return `${this.opts.baseUrl.replace(/\/+$/, '')}/api/v1/accounts/${this.opts.accountId}${path}`
  }

  private normalizeHeaders(h: HeadersInit | undefined): Record<string, string> {
    if (!h) return {}
    if (h instanceof Headers) return Object.fromEntries(h.entries())
    if (Array.isArray(h)) return Object.fromEntries(h)
    return { ...h }
  }

  private isRawBody(b: unknown): boolean {
    return (
      typeof b === 'string' ||
      b instanceof FormData ||
      b instanceof Blob ||
      b instanceof ArrayBuffer ||
      b instanceof URLSearchParams ||
      b instanceof ReadableStream
    )
  }

  private async parseBody(r: Response): Promise<unknown> {
    const ct = r.headers.get('content-type') ?? ''
    if (ct.includes('application/json')) return r.json()
    return r.text()
  }
}
