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

Interceptors mirror the axios workflow but are plain functions, configured **at
`createFetchClient` creation time via the `interceptors` option**. The returned fetch
client is a `(config) => Promise<data>` function — it does **not** expose axios-style
`.interceptors.request.use()`.

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

### Injecting a token (request interceptor)

Tokens should be injected dynamically in **`interceptors.request`** before each
outgoing call — not via the static `headers` option, which is evaluated once at client
creation and will not pick up refreshed tokens.

```ts
function getToken() {
  return localStorage.getItem('token') ?? ''
}

const client = createFetchClient({
  baseURL: '/api',
  interceptors: {
    request: (config) => {
      const token = getToken()
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        }
      }
      return config
    },
  },
})

const yyRequest = request(client)
```

When `getToken` is async, the interceptor can be `async` too:

```ts
interceptors: {
  request: async (config) => {
    const token = await getToken()
    if (token) {
      config.headers = { ...config.headers, Authorization: `Bearer ${token}` }
    }
    return config
  },
},
```

::: warning Common pitfalls

1. **Do not pass tokens via static `headers`**: `headers: { Authorization: getToken() }` runs once at module load.
2. **Do not use axios interceptors on the fetch client**: `createFetchClient` returns a function, not an axios instance — there is no `.interceptors` property.
3. **Always `return config`**: the interceptor must return the modified config or headers will not apply.
4. **Configure axios and fetch separately**: axios uses `service.interceptors.request.use(...)`, fetch uses `createFetchClient({ interceptors: { request } })`.

:::

Side-by-side with axios:

```ts
// axios
service.interceptors.request.use((config) => {
  config.headers.Authorization = `Bearer ${getToken()}`
  return config
})

// fetch
createFetchClient({
  interceptors: {
    request: (config) => {
      config.headers = { ...config.headers, Authorization: `Bearer ${getToken()}` }
      return config
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
