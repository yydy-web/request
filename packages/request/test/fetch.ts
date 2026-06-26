import { createFetchClient } from '@yy-web/request'

const origin = typeof location !== 'undefined' ? location.origin : 'http://localhost'

const client = createFetchClient({
  baseURL: origin,
})

export default client
