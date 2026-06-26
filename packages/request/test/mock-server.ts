import { readFileSync } from 'node:fs'
import path from 'node:path'
import { URL } from 'node:url'
import { delay, http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

const server = setupServer(
  http.get('/test', () => {
    return HttpResponse.text('Hello World!')
  }),

  http.post('/data-form', async ({ request }) => {
    const value = await request.formData()
    return HttpResponse.json(Array.from(value))
  }),

  http.get('/test/get', ({ request }) => {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    return HttpResponse.json({ id })
  }),

  // Returns JSON-shaped text under a non-JSON content type so the fetch
  // adapter has to opportunistically parse it (mirrors axios' behaviour).
  http.get('/test/text-json', () => {
    return new HttpResponse('{"parsed":true}', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    })
  }),

  // Plain text that is NOT valid JSON should be returned verbatim.
  http.get('/test/plain-text', () => {
    return new HttpResponse('just text', {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    })
  }),

  // Echoes the raw query string so we can assert URL building / merging.
  http.get('/test/echo-query', ({ request }) => {
    const url = new URL(request.url)
    return HttpResponse.json({ query: url.search })
  }),

  // Slow endpoint used to exercise client-side timeouts.
  http.get('/test/slow', async () => {
    await delay(200)
    return HttpResponse.json({ ok: true })
  }),

  // File download that advertises a filename via content-disposition.
  http.get('/test/download-named', () => {
    const imageBuffer = readFileSync(path.resolve(__dirname, './image.png'))
    return new Response(imageBuffer, {
      status: 200,
      headers: {
        'Content-Length': imageBuffer.byteLength.toString(),
        'Content-Type': 'application/octet-stream',
        'content-disposition': 'attachment;filename=hello-world.png',
      },
    })
  }),

  http.get('/test/:id', ({ params }) => {
    const { id } = params
    return HttpResponse.text(id as string)
  }),

  http.post('/test/upload', async () => {
    return HttpResponse.json({ isFile: true })
  }),

  http.post('/test/save', async (req) => {
    // eslint-disable-next-line ts/ban-ts-comment
    // @ts-expect-error
    const requestBody: Record<string, any> = await req.request.json()
    return HttpResponse.text(requestBody.username === 'admin' ? '200' : '204')
  }),

  http.put('/test/put/:id', async () => {
    return HttpResponse.json(true)
  }),

  http.delete('/test/del/:id', async ({ params }) => {
    const { id } = params

    return HttpResponse.json(id)
  }),

  http.get('/test/cache/1', () => {
    return HttpResponse.text('Hello World!')
  }),

  http.get('/test/downFile', () => {
    const imageBuffer = readFileSync(path.resolve(__dirname, './image.png'))
    return new Response(imageBuffer, {
      status: 200,
      headers: {
        'Content-Length': imageBuffer.byteLength.toString(),
        'Content-Type': 'application/octet-stream',
      },
    })
  }),

  http.get('/test/down/error', () => {
    return HttpResponse.json({ error: 'test' })
  }),

  http.get('/error-500', () => {
    return new HttpResponse('boom', { status: 500 })
  }),
)

export default server
