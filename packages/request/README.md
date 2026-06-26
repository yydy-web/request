# @yy-web/request

[![NPM version](https://img.shields.io/npm/v/@yy-web/request?color=a1b858&label=)](https://www.npmjs.com/package/@yy-web/request)

## Features

- Plug-in mode
- Chain call
- restful specification
- Flexible configuration
- Transport-agnostic: works with a native `fetch` client or an axios instance
- Built-in caching with in-flight de-duplication for identical cached GETs
- Concurrency limiting via `maxConcurrentNum`

## Install

```bash
npm i @yy-web/request
```

> `axios` is an optional peer dependency. Install it only if you pass an axios instance as
> the transport. The native fetch client needs no extra dependency.

### With native fetch

```js
// request.ts
import request, { createFetchClient, setRequest } from '@yy-web/request'

const client = createFetchClient({
  baseURL: '/api',
})

const yyRequest = request(client)
setRequest(yyRequest)

export default yyRequest
```

`createFetchClient` supports `baseURL`, `headers`, `timeout` and request/response/error
interceptors. The chainable API below is identical regardless of transport.

### With axios

```js
// request.ts
import request, { setRequest } from '@yy-web/request'
import axios from 'axios'

const service = axios.create({
  baseURL: '/api',
})

const yyRequest = request(service)
setRequest(yyRequest)

export default yyRequest
```

## Feature
- get action
```js
import { getRequest } from '@yy-web/request' // get instance
import request from './request.ts'

// simple
request.setPath('xxxx').get(params)

// cache get
request.setPath('xxxx').get(true)
request.setPath('xxxx').get(params, true)
```

> When caching is enabled, identical cached GETs fired concurrently are
> de-duplicated into a single network request: the first call performs the
> request and the rest resolve (or reject) with its outcome.

### Inspect built-in cache with `@yy-web/request-tools`

`@yy-web/request-tools` can inspect the default in-memory cache provided by
`@yy-web/request`. It currently supports only the built-in cache helpers
(`getStore` / `setStore` / `hasStore`), not custom store implementations.

```bash
pnpm add @yy-web/request-tools
```

```ts
import {
  clearRequestCache,
  getRequestCacheSnapshot,
  RequestCacheInspector,
  subscribeRequestCache,
} from '@yy-web/request-tools'
```

- `getRequestCacheSnapshot()` reads all current cache entries.
- `subscribeRequestCache(listener)` listens for cache `set` and `clear` events.
- `clearRequestCache()` clears the built-in cache.
- `RequestCacheInspector` is a floating Vue component for quick debugging.

- other
```js
import { getRequest } from '@yy-web/request' // get instance
import request from './request.ts'

request.setPath('xxxx').post(data)
request.setPath('xxxx').put()
request.setPath('xxxx').upload()
request.setPath('xxxx').del()
```

result carry
```js
const id = 1
request.setPath('xxxx/{id}').carry(id) // -> request.setPath('xxxx/1')
```

- downfile
```ts
import request, { fileInterceptorsResponseConfig, setRequest } from '@yy-web/request'
import axios from 'axios'

const service = axios.create({
  baseURL: '/api',
})

service.interceptors.response.use((response: any) => {
  const { isFile, value } = fileInterceptorsResponseConfig(response)
  if (isFile)
    return value

  return response.data
})

interface RequestStoreConfig {
  getStore?: (key: string) => any
  hasStore?: (key: string) => boolean
  setStore?: (key: string, data: any) => void
  cancelRepeat?: boolean // cancel repeated in-flight requests to the same path
  maxConcurrentNum?: number // max simultaneous requests, others queue (default: 99)
}

const yyRequest = request(service, { getStore, hasStore, setStore, cancelRepeat: true })

const store = {}
function getStore(key: string) {
  return store[key]
}

function hasStore(key: string) {
  return key in store
}

function setStore(key: string, data: any) {
  store[key] = data
}
setRequest(yyRequest)

request.setPath('xxxx').downLoad(data)
```

## type
```ts
interface IRequest {
  setPath: (url: string, loading?: boolean) => IRequest
  setConfig: (config: IAxiosRequestConfig) => IRequest
  forceCancelRepeat: () => IRequest
  carry: (key: string | number) => IRequest
  get: <T, Callback = false>(params?: boolean | object, cache?: boolean, dataCallback?: (data: T) => Callback) => Promise<Callback extends false ? T : Callback>
  post: <T>(data?: object | FormData) => Promise<T>
  put: <T>(data?: object) => Promise<T>
  del: <T>(params?: object) => Promise<T>
  upload: <T>(file: File, data?: object) => Promise<T>
  downLoad: (params?: object, methods?: 'post' | 'get', fileName?: string) => Promise<void>
  clear: () => void
}
```

## License

MIT
