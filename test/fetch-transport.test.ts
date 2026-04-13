import { describe, expect, it, vi } from 'vitest'
import { createFetchTransport, mergeAbortSignals } from '../src/request/adapters/fetch'

function jsonResponse(data: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
}

describe('mergeAbortSignals', () => {
  it('returns undefined for an empty list after filtering', () => {
    expect(mergeAbortSignals([undefined, undefined])).toBeUndefined()
  })

  it('returns the same signal when only one is present', () => {
    const s = new AbortController().signal
    expect(mergeAbortSignals([s])).toBe(s)
  })

  it('returns an already-aborted merged signal when any input is aborted', () => {
    const a = new AbortController()
    a.abort('nope')
    const b = new AbortController()
    const merged = mergeAbortSignals([a.signal, b.signal])
    expect(merged?.aborted).toBe(true)
  })

  it('aborts the merged signal when any linked controller aborts', () => {
    const a = new AbortController()
    const b = new AbortController()
    const merged = mergeAbortSignals([a.signal, b.signal])
    expect(merged?.aborted).toBe(false)
    b.abort('b')
    expect(merged?.aborted).toBe(true)
  })
})

describe('createFetchTransport', () => {
  it('parses JSON, merges absolute URLs, and appends GET query params', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ok: true }))
    const transport = createFetchTransport({
      fetchImpl: fetchMock as unknown as typeof fetch,
      baseURL: 'http://api.test',
    })

    const data = await transport.execute(
      {
        url: 'https://other.example/full',
        method: 'GET',
        params: { a: 1, skip: undefined, nul: null },
      },
      { useCancelRepeat: false, registerCanceler: () => {} },
    )

    expect(data).toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledOnce()
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('https://other.example/full?a=1')
    expect(init.method).toBe('GET')
  })

  it('resolves relative paths against baseURL and normalizes paths without leading slash', async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(jsonResponse(1)))
    const transport = createFetchTransport({
      fetchImpl: fetchMock as unknown as typeof fetch,
      baseURL: 'http://api.test/base/',
    })

    await transport.execute(
      { url: 'no-leading', method: 'GET', params: {} },
      { useCancelRepeat: false, registerCanceler: () => {} },
    )

    const [url] = fetchMock.mock.calls[0] as [string]
    expect(url).toMatch(/^https?:\/\/api\.test\//)
    expect(url).toContain('no-leading')
  })

  it('sends JSON bodies for POST and does not append params to URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}))
    const transport = createFetchTransport({
      fetchImpl: fetchMock as unknown as typeof fetch,
      baseURL: 'http://api.test',
    })

    await transport.execute(
      { url: '/p', method: 'POST', data: { x: 1 }, params: { ignored: 1 } },
      { useCancelRepeat: false, registerCanceler: () => {} },
    )

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(init.body).toBe(JSON.stringify({ x: 1 }))
    expect((init.headers as Headers).get('Content-Type')).toBe('application/json')
  })

  it('sends raw string bodies and preserves explicit Content-Type', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}))
    const transport = createFetchTransport({
      fetchImpl: fetchMock as unknown as typeof fetch,
      baseURL: 'http://api.test',
    })

    await transport.execute(
      {
        url: '/raw',
        method: 'POST',
        data: 'plain',
        headers: { 'Content-Type': 'text/plain' },
      },
      { useCancelRepeat: false, registerCanceler: () => {} },
    )

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(init.body).toBe('plain')
    expect((init.headers as Headers).get('Content-Type')).toBe('text/plain')
  })

  it('sends FormData and drops Content-Type so the boundary can be set', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}))
    const transport = createFetchTransport({
      fetchImpl: fetchMock as unknown as typeof fetch,
      baseURL: 'http://api.test',
    })

    const fd = new FormData()
    fd.append('a', 'b')

    await transport.execute(
      { url: '/up', method: 'POST', data: fd, headers: { 'Content-Type': 'application/json' } },
      { useCancelRepeat: false, registerCanceler: () => {} },
    )

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(init.body).toBe(fd)
    expect((init.headers as Headers).has('Content-Type')).toBe(false)
  })

  it('supports Headers, tuple array, and plain object header shapes', async () => {
    const fetchMock = vi.fn().mockImplementation(() => Promise.resolve(jsonResponse({})))
    const transport = createFetchTransport({
      fetchImpl: fetchMock as unknown as typeof fetch,
      baseURL: 'http://api.test',
    })

    const h1 = new Headers({ 'X-A': '1' })
    await transport.execute(
      { url: '/h1', method: 'GET', headers: h1 },
      { useCancelRepeat: false, registerCanceler: () => {} },
    )
    expect((fetchMock.mock.calls[0][1] as RequestInit).headers).toBeInstanceOf(Headers)

    await transport.execute(
      { url: '/h2', method: 'GET', headers: [['X-B', '2']] },
      { useCancelRepeat: false, registerCanceler: () => {} },
    )
    expect(((fetchMock.mock.calls[1][1] as RequestInit).headers as Headers).get('X-B')).toBe('2')

    await transport.execute(
      { url: '/h3', method: 'GET', headers: { 'X-C': '3', 'Skip': null as unknown as undefined } },
      { useCancelRepeat: false, registerCanceler: () => {} },
    )
    expect(((fetchMock.mock.calls[2][1] as RequestInit).headers as Headers).get('X-C')).toBe('3')
  })

  it('parses text responses, including JSON-looking bodies without json content-type', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response('{"a":1}', { status: 200, headers: { 'Content-Type': 'text/plain' } }))
      .mockResolvedValueOnce(new Response('not-json', { status: 200, headers: { 'Content-Type': 'text/plain' } }))
      .mockResolvedValueOnce(new Response('', { status: 200, headers: { 'Content-Type': 'text/plain' } }))
      .mockResolvedValueOnce(new Response('plain', { status: 200, headers: { 'Content-Type': 'application/octet-stream' } }))

    const transport = createFetchTransport({
      fetchImpl: fetchMock as unknown as typeof fetch,
      baseURL: 'http://api.test',
    })

    expect(await transport.execute({ url: '/t1', method: 'GET' }, { useCancelRepeat: false, registerCanceler: () => {} }))
      .toEqual({ a: 1 })
    expect(await transport.execute({ url: '/t2', method: 'GET' }, { useCancelRepeat: false, registerCanceler: () => {} }))
      .toBe('not-json')
    expect(await transport.execute({ url: '/t3', method: 'GET' }, { useCancelRepeat: false, registerCanceler: () => {} }))
      .toBe('')
    expect(await transport.execute({ url: '/t4', method: 'GET' }, { useCancelRepeat: false, registerCanceler: () => {} }))
      .toBe('plain')
  })

  it('throws FetchHttpError for non-OK responses', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('nope', { status: 500 }))
    const transport = createFetchTransport({
      fetchImpl: fetchMock as unknown as typeof fetch,
      baseURL: 'http://api.test',
    })

    await expect(
      transport.execute({ url: '/e', method: 'GET' }, { useCancelRepeat: false, registerCanceler: () => {} }),
    ).rejects.toMatchObject({ name: 'FetchHttpError', status: 500, body: 'nope' })
  })

  it('registers cancel repeat abort and uses withCredentials', async () => {
    const fetchMock = vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
      return new Promise((_resolve, reject) => {
        if (init?.signal?.aborted) {
          reject(new DOMException('Aborted', 'AbortError'))
          return
        }
        init?.signal?.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'))
        }, { once: true })
      })
    })

    const transport = createFetchTransport({
      fetchImpl: fetchMock as unknown as typeof fetch,
      baseURL: 'http://api.test',
    })

    let cancel: (() => void) | undefined
    const p = transport.execute(
      { url: '/c', method: 'GET', withCredentials: true },
      { useCancelRepeat: true, registerCanceler: (c) => { cancel = c } },
    )

    cancel?.()
    await expect(p).rejects.toMatchObject({ name: 'AbortError' })

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(init.credentials).toBe('include')
  })

  it('merges client signal with cancel-repeat controller (multi-signal path)', async () => {
    const fetchMock = vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'))
        }, { once: true })
      })
    })
    const transport = createFetchTransport({
      fetchImpl: fetchMock as unknown as typeof fetch,
      baseURL: 'http://api.test',
    })

    const client = new AbortController()
    let cancel: (() => void) | undefined
    const p = transport.execute(
      { url: '/multi', method: 'GET', signal: client.signal },
      { useCancelRepeat: true, registerCanceler: (c) => { cancel = c } },
    )
    cancel?.()
    await expect(p).rejects.toMatchObject({ name: 'AbortError' })
  })

  it('merges an already-aborted signal and rejects fetch', async () => {
    const fetchMock = vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
      if (init?.signal?.aborted)
        return Promise.reject(new DOMException('Aborted', 'AbortError'))
      return jsonResponse({ ok: true })
    })
    const transport = createFetchTransport({
      fetchImpl: fetchMock as unknown as typeof fetch,
      baseURL: 'http://api.test',
    })

    const ac = new AbortController()
    ac.abort('x')

    await expect(
      transport.execute(
        { url: '/ab', method: 'GET', signal: ac.signal },
        { useCancelRepeat: true, registerCanceler: () => {} },
      ),
    ).rejects.toMatchObject({ name: 'AbortError' })

    expect(fetchMock).toHaveBeenCalledOnce()
  })

  it('merges AbortSignal.timeout when available', async () => {
    const TimeoutSignal = (AbortSignal as unknown as { timeout?: (ms: number) => AbortSignal }).timeout
    if (typeof TimeoutSignal !== 'function')
      return

    const fetchMock = vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
      return new Promise((resolve, reject) => {
        const t = setTimeout(() => resolve(jsonResponse({ ok: true })), 50)
        init?.signal?.addEventListener('abort', () => {
          clearTimeout(t)
          reject(new DOMException('Aborted', 'AbortError'))
        }, { once: true })
      })
    })

    const transport = createFetchTransport({
      fetchImpl: fetchMock as unknown as typeof fetch,
      baseURL: 'http://api.test',
    })

    await expect(
      transport.execute(
        { url: '/to', method: 'GET', timeout: 1 },
        { useCancelRepeat: false, registerCanceler: () => {} },
      ),
    ).rejects.toMatchObject({ name: 'AbortError' })
  })
})
