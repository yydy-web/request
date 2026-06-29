import type { RequestAdapter, RequestAdapterConfig } from './request'

export interface FetchInterceptors {
  /** Mutate or replace the outgoing config before the request is sent. */
  request?: (config: RequestAdapterConfig) => RequestAdapterConfig | Promise<RequestAdapterConfig>
  /**
   * Transform the already-unwrapped data. Return a value to override it,
   * or return `undefined` to keep the default unwrapped data.
   */
  response?: (response: Response, data: any, config: RequestAdapterConfig) => any
  /** Handle a thrown/rejected error. Return a value to recover, or rethrow. */
  error?: (error: any, config: RequestAdapterConfig) => any
}

export interface FetchClientOptions {
  baseURL?: string
  headers?: Record<string, string>
  /** Abort the request after the given milliseconds. */
  timeout?: number
  interceptors?: FetchInterceptors
}

export interface FetchClientError extends Error {
  response: Response
  status: number
  data: unknown
  config: RequestAdapterConfig
}

function normalizeHeaders(headers?: unknown): Record<string, string> {
  if (!headers)
    return {}

  if (headers instanceof Headers) {
    const result: Record<string, string> = {}
    headers.forEach((value, key) => {
      result[key] = value
    })
    return result
  }

  if (typeof headers === 'object') {
    const result: Record<string, string> = {}
    for (const [key, value] of Object.entries(headers as Record<string, unknown>)) {
      if (value != null)
        result[key] = String(value)
    }
    return result
  }

  return {}
}

function hasHeader(headers: Record<string, string>, name: string) {
  const lower = name.toLowerCase()
  return Object.keys(headers).some(key => key.toLowerCase() === lower)
}

function removeHeader(headers: Record<string, string>, name: string) {
  const lower = name.toLowerCase()
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === lower)
      delete headers[key]
  }
}

function buildURL(baseURL: string, url: string, params?: unknown): string {
  let full = url
  if (baseURL && !/^https?:\/\//i.test(url)) {
    const base = baseURL.replace(/\/+$/, '')
    const path = url.replace(/^\/+/, '')
    full = `${base}/${path}`
  }

  if (params && typeof params === 'object') {
    const search = new URLSearchParams()
    for (const [key, value] of Object.entries(params as Record<string, unknown>)) {
      if (value !== undefined && value !== null)
        search.append(key, typeof value === 'object' ? JSON.stringify(value) : String(value))
    }
    const query = search.toString()
    if (query)
      full += (full.includes('?') ? '&' : '?') + query
  }

  return full
}

function headersToObject(headers: Headers): Record<string, string> {
  const result: Record<string, string> = {}
  headers.forEach((value, key) => {
    result[key] = value
  })
  return result
}

function combineSignals(...signals: (AbortSignal | undefined)[]): AbortSignal | undefined {
  const valid = signals.filter(Boolean) as AbortSignal[]
  if (valid.length <= 1)
    return valid[0]

  const anyFn = (AbortSignal as unknown as { any?: (signals: AbortSignal[]) => AbortSignal }).any
  if (typeof anyFn === 'function')
    return anyFn(valid)

  const controller = new AbortController()
  for (const signal of valid) {
    if (signal.aborted) {
      controller.abort()
      break
    }
    signal.addEventListener('abort', () => controller.abort(), { once: true })
  }
  return controller.signal
}

async function parseBody(response: Response): Promise<any> {
  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json'))
    return response.json()

  const text = await response.text()
  if (text === '')
    return text
  // Mirror axios' default transform: opportunistically parse JSON-like text.
  try {
    return JSON.parse(text)
  }
  catch {
    return text
  }
}

/**
 * Create a transport adapter backed by the native `fetch` API.
 *
 * The returned function satisfies {@link RequestAdapter} and can be passed
 * straight into `request(...)` just like an axios instance.
 */
export function createFetchClient(options: FetchClientOptions = {}): RequestAdapter {
  const { baseURL = '', headers: baseHeaders = {}, timeout, interceptors = {} } = options

  return async function fetchAdapter(rawConfig: RequestAdapterConfig): Promise<any> {
    let config: RequestAdapterConfig = {
      ...rawConfig,
      headers: normalizeHeaders(rawConfig.headers),
    }
    if (interceptors.request)
      config = await interceptors.request(config)

    const method = (config.method || 'GET').toUpperCase()
    const isBodyMethod = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
    const url = buildURL(baseURL, config.url, config.params)

    const headers: Record<string, string> = {
      ...baseHeaders,
      ...normalizeHeaders(config.headers),
    }

    let body: BodyInit | undefined
    if (isBodyMethod && config.data != null) {
      if (config.data instanceof FormData) {
        body = config.data
        // Let the runtime set `multipart/form-data` with the correct boundary.
        removeHeader(headers, 'content-type')
      }
      else if (typeof config.data === 'object') {
        body = JSON.stringify(config.data)
        if (!hasHeader(headers, 'content-type'))
          headers['Content-Type'] = 'application/json'
      }
      else {
        body = config.data as BodyInit
      }
    }

    let signal = config.signal as AbortSignal | undefined
    if (timeout && timeout > 0)
      signal = combineSignals(signal, AbortSignal.timeout(timeout))

    let response: Response
    try {
      response = await fetch(url, { method, headers, body, signal })
    }
    catch (error) {
      if (interceptors.error)
        return interceptors.error(error, config)
      throw error
    }

    const isFile = !!(config.isFile || config.responseType === 'blob')

    if (isFile) {
      const contentType = response.headers.get('content-type') || ''
      // A JSON payload on a file request is treated as an error envelope.
      if (contentType.includes('application/json')) {
        const data = await response.json()
        const error = Object.assign(new Error('file response error'), {
          response,
          status: response.status,
          data,
          config,
        }) as FetchClientError
        if (interceptors.error)
          return interceptors.error(error, config)
        throw error
      }
      return [await response.blob(), headersToObject(response.headers)]
    }

    if (!response.ok) {
      let data: unknown
      try {
        data = await parseBody(response)
      }
      catch {
        data = undefined
      }
      const error = Object.assign(new Error(`Request failed with status ${response.status}`), {
        response,
        status: response.status,
        data,
        config,
      }) as FetchClientError
      if (interceptors.error)
        return interceptors.error(error, config)
      throw error
    }

    let data = await parseBody(response)
    if (interceptors.response) {
      const result = await interceptors.response(response, data, config)
      if (result !== undefined)
        data = result
    }

    return data
  }
}
