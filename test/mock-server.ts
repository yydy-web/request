import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'

const server = setupServer(
  http.get('/test', () => {
    return HttpResponse.text('Hello World!')
  }),

  http.post('/data-form', async ({ request }) => {
    const value = await request.formData()
    return HttpResponse.json(Array.from(value))
  }),

  http.get('/test/:id', ({ params }) => {
    const { id } = params
    return HttpResponse.text(id as string)
  }),

  http.post('/test/save', async (req) => {
    const formData = await req.request.formData()
    return HttpResponse.text(formData.get('username') === 'admin' ? '200' : '204')
  }),
)

export default server
