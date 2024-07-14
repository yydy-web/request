import { HttpResponse, http } from 'msw'
import { setupServer } from 'msw/node'

const server = setupServer(
  http.get('/user', () => {
    return HttpResponse.text('1')
  }),
)

server.events.on('request:start', ({ request }) => {
  console.log('MSW intercepted:', request.method, request.url)
})

export default server
