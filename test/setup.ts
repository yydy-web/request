import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest'
import { Request } from '../src/request/RequestClass'
import server from './mock-server'

beforeEach(() => {
  Request.instance = null
})

beforeAll(async () => {
  server.listen()
})

afterEach(async () => {
  server.resetHandlers()
})

afterAll(async () => {
  server.close()
})
