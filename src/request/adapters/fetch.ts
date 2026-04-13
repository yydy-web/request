import type { RequestTransport, TransportExecuteInput } from '../transport'

export interface FetchTransportOptions {
  fetchImpl?: typeof fetch
  baseURL?: string
}

export function mergeAbortSignals(signals: (AbortSignal | undefined)[]): AbortSignal | undefined {
  const valid = signals.filter((s): s is AbortSignal => !!s)
  if (valid.length === 0)
    return undefined
  if (valid.length === 1)
    return valid[0]
  const ctrl = new AbortController()
  for (const s of valid) {
    if (s.aborted) {
      ctrl.abort(s.reason)
      return ctrl.signal
    }
    s.addEventListener('abort', () => ctrl.abort(s.reason), { once: true })
  }
  return ctrl.signal
}

function resolveUrl(baseURL: string | undefined, path: string): URL {
  if (/^https?:\/\//i.test(path))
    return new URL(path)
  const base = baseURL
    ?? (typeof globalThis !== 'undefined' && 'location' in globalThis && globalThis.location?.origin
      ? globalThis.location.origin
      : 'http://localhost')
  return new URL(path.startsWith('/') ? path : `/${path}`, base.endsWith('/') ? base : `${base}/`)
}

function appendParams(url: URL, params: unknown) {
  if (params == null || typeof params !== 'object' || params instanceof FormData)
    return
  const sp = new URLSearchParams(url.search)
  for (const [k, v] of Object.entries(params as Record<string, unknown>)) {
    if (v === undefined || v === null)
      continue
    sp.append(k, String(v))
  }
  url.search = sp.toString()
}

function headersFromConfig(input: TransportExecuteInput): Headers {
  const h = new Headers()
  const raw = input.headers
  if (!raw)
    return h
  if (raw instanceof Headers) {
    raw.forEach((v, k) => h.set(k, v))
    return h
  }
  if (Array.isArray(raw)) {
    for (const [k, v] of raw)
      h.set(k, v)
    return h
  }
  for (const [k, v] of Object.entries(raw)) {
    if (v != null)
      h.set(k, String(v))
  }
  return h
}

async function parseBody(res: Response): Promise<unknown> {
  const ct = res.headers.get('content-type') || ''
  if (ct.includes('application/json'))
    return res.json()
  const text = await res.text()
  if (!text)
    return text
  if (ct.includes('text/')) {
    try {
      return JSON.parse(text) as unknown
    }
    catch {
      return text
    }
  }
  try {
    return JSON.parse(text)
  }
  catch {
    return text
  }
}

class FetchHttpError extends Error {
  status: number
  body: string
  constructor(status: number, body: string) {
    super(`HTTP ${status}: ${body}`)
    this.name = 'FetchHttpError'
    this.status = status
    this.body = body
  }
}

export function createFetchTransport(options: FetchTransportOptions = {}): RequestTransport {
  const fetchFn = options.fetchImpl ?? globalThis.fetch.bind(globalThis)
  const baseURL = options.baseURL

  return {
    async execute(input, ctx) {
      const url = resolveUrl(baseURL, input.url)
      if (!['POST', 'PUT', 'PATCH'].includes(input.method.toUpperCase()))
        appendParams(url, input.params)

      const headers = headersFromConfig(input)

      let body: BodyInit | undefined
      const method = input.method.toUpperCase()
      const data = input.data

      if (method !== 'GET' && method !== 'HEAD') {
        if (data instanceof FormData) {
          headers.delete('Content-Type')
          body = data
        }
        else if (data !== undefined && data !== null) {
          if (!headers.has('Content-Type'))
            headers.set('Content-Type', 'application/json')
          body = typeof data === 'string' ? data : JSON.stringify(data)
        }
      }

      let signal: AbortSignal | undefined = input.signal as AbortSignal | undefined
      if (ctx.useCancelRepeat) {
        const ac = new AbortController()
        ctx.registerCanceler(() => ac.abort())
        signal = mergeAbortSignals([signal, ac.signal])
      }

      const timeout = input.timeout
      if (timeout != null && typeof AbortSignal !== 'undefined' && 'timeout' in AbortSignal && typeof (AbortSignal as unknown as { timeout: (ms: number) => AbortSignal }).timeout === 'function') {
        const t = (AbortSignal as unknown as { timeout: (ms: number) => AbortSignal }).timeout(timeout)
        signal = mergeAbortSignals([signal, t])
      }

      const init: RequestInit = {
        method: input.method,
        headers,
        body,
        signal,
        credentials: input.withCredentials ? 'include' : undefined,
      }

      const res = await fetchFn(url.toString(), init)

      if (!res.ok) {
        const bodyText = await res.text()
        throw new FetchHttpError(res.status, bodyText)
      }

      return parseBody(res)
    },
  }
}
