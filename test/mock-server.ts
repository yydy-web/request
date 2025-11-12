import { readFileSync } from 'node:fs'
import path from 'node:path'
import { URL } from 'node:url'
import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

const server = setupServer(
  http.get('/test', () => {
    return HttpResponse.text('Hello World!')
  }),

  http.post('/data-form', async ({ request }) => {
    return HttpResponse.json(await request.clone().json())
  }),

  http.get('/test/get', ({ request }) => {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    return HttpResponse.json({ id })
  }),

  http.get('/test/:id', ({ params }) => {
    const { id } = params
    return HttpResponse.text(`${id}`)
  }),

  http.post('/test/upload', async ({ request }) => {
    const formData = await request.formData()
    const file = formData.get('file') as File
    return HttpResponse.json({ isFile: !!file, test: formData.get('test') })
  }),

  http.post('/test/save', async (req) => {
    const requestBody = await req.request.json() as Record<string, any>
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

  http.get('/get/cache', () => {
    return HttpResponse.json({ value: `${Math.random()}` })
  }),
)

export default server
