# Usage

All requests start from the shared instance and are composed through chain calls.

## GET

```ts
import request from './request'

// simple
request.setPath('xxxx').get(params)

// cache get
request.setPath('xxxx').get(true)
request.setPath('xxxx').get(params, true)
```

When using the built-in cache helpers from `@yy-web/request`, pass `hasStore` as
well so falsey cached values like `0`, `false` or `''` are still treated as
cache hits:

```ts
import request, { getStore, hasStore, setStore } from '@yy-web/request'
import axios from 'axios'

const service = axios.create({ baseURL: '/api' })

const yyRequest = request(service, {
  getStore,
  hasStore,
  setStore,
})
```

> When caching is enabled, identical cached GETs fired concurrently are
> de-duplicated into a single network request: the first call performs the
> request and the rest resolve (or reject) with its outcome.

## POST / PUT / DELETE / UPLOAD

```ts
import request from './request'

request.setPath('xxxx').post(data)
request.setPath('xxxx').put()
request.setPath('xxxx').upload()
request.setPath('xxxx').del()
```

## Path params with `carry`

Replace placeholders in the path with `carry`:

```ts
const id = 1
request.setPath('xxxx/{id}').carry(id) // -> request.setPath('xxxx/1')
```

## Concurrency limiting

Pass `maxConcurrentNum` to cap how many requests run at the same time; the rest
are queued and fire as slots free up (default: `99`).

```ts
const yyRequest = request(service, { maxConcurrentNum: 5 })
```

## Download files

Use `fileInterceptorsResponseConfig` to detect file responses, then call `downLoad`.

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
  maxConcurrentNum?: number // max simultaneous requests (default: 99)
}

const yyRequest = request(service, { getStore, hasStore, setStore, cancelRepeat: true })

const store: Record<string, any> = {}
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

## Inspect built-in cache

Install `@yy-web/request-tools` if you want to inspect the default in-memory
cache in real time.

```ts
import {
  clearRequestCache,
  getRequestCacheSnapshot,
  RequestCacheInspector,
  subscribeRequestCache,
} from '@yy-web/request-tools'
```

- `getRequestCacheSnapshot()` returns all current default-cache entries.
- `subscribeRequestCache(listener)` lets tooling react to cache changes.
- `RequestCacheInspector` renders a floating debug panel in Vue apps.
- `clearRequestCache()` clears the built-in cache.

This only works with the default cache helpers from `@yy-web/request`, not with
custom `getStore` / `setStore` implementations.
