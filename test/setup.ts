import { beforeAll } from 'vitest'
import server from './mock-server'

beforeAll(async () => {
  server.listen({ onUnhandledRequest: 'error' })
})

beforeAll(async () => {
  server.resetHandlers()
})

beforeAll(async () => {
  server.close()
})
