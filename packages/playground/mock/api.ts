import type { IncomingMessage, ServerResponse } from 'node:http'

type Next = (err?: unknown) => void

function json(res: ServerResponse, status: number, data: unknown, headers: Record<string, string> = {}) {
  res.writeHead(status, { 'Content-Type': 'application/json', ...headers })
  res.end(typeof data === 'string' ? data : JSON.stringify(data))
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let raw = ''
    req.on('data', chunk => (raw += chunk))
    req.on('end', () => resolve(raw))
    req.on('error', () => resolve(raw))
  })
}

function safeJson(raw: string) {
  try {
    return raw ? JSON.parse(raw) : null
  }
  catch {
    return raw
  }
}

/**
 * A tiny in-process mock API so the playground can exercise every request
 * method without depending on a remote server. Mounted as a dev middleware.
 */
export async function mockApiMiddleware(req: IncomingMessage, res: ServerResponse, next: Next) {
  const url = new URL(req.url || '/', 'http://localhost')
  const { pathname } = url

  if (!pathname.startsWith('/api/'))
    return next()

  const method = (req.method || 'GET').toUpperCase()

  // Optional artificial latency, used by concurrency / cancel demos.
  const delay = Number(url.searchParams.get('delay') || 0)
  if (delay > 0)
    await new Promise(resolve => setTimeout(resolve, delay))

  // GET /api/info — simple payload, also used for cache / dedup demos.
  if (pathname === '/api/info' && method === 'GET') {
    return json(res, 200, { name: '@yy-web/request', value: 1, time: Date.now() })
  }

  // GET /api/user?id=&role= — echoes query params.
  if (pathname === '/api/user' && method === 'GET') {
    return json(res, 200, {
      id: url.searchParams.get('id'),
      query: Object.fromEntries(url.searchParams),
    })
  }

  // POST /api/user — create.
  if (pathname === '/api/user' && method === 'POST') {
    const body = await readBody(req)
    return json(res, 200, { created: true, received: safeJson(body) })
  }

  // /api/user/:id — GET / PUT / DELETE (drives carry()).
  const matched = pathname.match(/^\/api\/user\/([^/]+)$/)
  if (matched) {
    const id = matched[1]
    if (method === 'GET')
      return json(res, 200, { id })
    if (method === 'PUT') {
      const body = await readBody(req)
      return json(res, 200, { id, updated: true, received: safeJson(body) })
    }
    if (method === 'DELETE')
      return json(res, 200, { id, deleted: true })
  }

  // POST /api/upload — multipart, just acknowledge.
  if (pathname === '/api/upload' && method === 'POST') {
    await readBody(req)
    return json(res, 200, { isFile: true, ok: true })
  }

  // GET /api/download — binary-ish payload with a filename header.
  if (pathname === '/api/download' && method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': 'attachment;filename=playground.txt',
    })
    return res.end('hello from the @yy-web/request playground')
  }

  // GET /api/error — always fails.
  if (pathname === '/api/error') {
    return json(res, 500, { message: 'mock server error' })
  }

  return next()
}
