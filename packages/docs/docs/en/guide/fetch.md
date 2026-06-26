# Native fetch client

`@yy-web/request` is transport-agnostic. The core `request(...)` factory accepts any
adapter with the signature `(config) => Promise<data>`. An axios instance satisfies
this out of the box, and `createFetchClient` provides the same contract on top of the
native `fetch` API, with no axios dependency required.

## Quick start

```ts
// request.ts
import request, { createFetchClient, setRequest } from '@yy-web/request'

const client = createFetchClient({
  baseURL: '/api',
})

const yyRequest = request(client)
setRequest(yyRequest)

export default yyRequest
```

The chainable API is identical to the axios setup:

```ts
import request from './request'

const user = await request.setPath('users/{id}').carry(1).get()
await request.setPath('users').post({ name: 'ada' })
```

## Options

```ts
interface FetchClientOptions {
  baseURL?: string
  headers?: Record<string, string>
  // Abort the request after the given milliseconds.
  timeout?: number
  interceptors?: {
    request?: (config) => config | Promise<config>
    response?: (response: Response, data: any, config) => any
    error?: (error: any, config) => any
  }
}
```

## Interceptors

Interceptors mirror the axios workflow but are plain functions.

```ts
const client = createFetchClient({
  baseURL: '/api',
  headers: { 'X-App': 'demo' },
  timeout: 10000,
  interceptors: {
    // Inject auth headers before each request.
    request: (config) => {
      config.headers = { ...config.headers, Authorization: `Bearer ${getToken()}` }
      return config
    },
    // Transform the already-parsed data. Return undefined to keep it as-is.
    response: (response, data) => {
      if (data?.code !== 0)
        throw new Error(data?.message)
      return data.data
    },
    // Recover from or rethrow errors.
    error: (error) => {
      if (error.status === 401)
        redirectToLogin()
      throw error
    },
  },
})
```

## Behaviour notes

- Request bodies: `FormData` is sent as-is (the runtime sets the `multipart/form-data`
  boundary); plain objects are JSON-serialized with a default `application/json` header.
- Responses: `application/json` is parsed via `response.json()`; other text bodies are
  opportunistically `JSON.parse`d and fall back to raw text (matching axios defaults).
- Downloads: when `downLoad()` is used (`responseType: 'blob'`), the client resolves to
  `[blob, headers]`, which the chain consumes to trigger the browser download.
- Cancellation: `forceCancelRepeat()` and concurrent-repeat cancellation are powered by
  `AbortController`, shared by both the fetch and axios transports.

## Switching between axios and fetch

Both transports expose the exact same `IRequest` chain, so you can swap them by changing
only the adapter passed to `request(...)`:

```ts
import request, { createFetchClient } from '@yy-web/request'
import axios from 'axios'

// axios
const viaAxios = request(axios.create({ baseURL: '/api' }))

// native fetch
const viaFetch = request(createFetchClient({ baseURL: '/api' }))
```
