import { afterAll, afterEach, beforeAll } from 'vitest'
import server from './mock-server'

beforeAll(async () => {
  server.listen()
})

afterEach(async () => {
  server.resetHandlers()
})

afterAll(async () => {
  server.close()
})
