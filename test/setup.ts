import { afterAll, afterEach, beforeAll } from 'vitest'
import { getRequest } from '../src'
import server from './mock-server'

beforeAll(async () => {
  getRequest()?.clear()
  server.listen()
})

afterEach(async () => {
  server.resetHandlers()
})

afterAll(async () => {
  server.close()
})
