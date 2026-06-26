# API Reference

## IRequest

The chainable request interface returned by the global instance.

```ts
interface IRequest {
  setPath: (url: string, loading?: boolean) => IRequest
  setConfig: (config: IRequestConfig) => IRequest
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

### Methods

| Method | Description |
| --- | --- |
| `setPath(url, loading?)` | Set the request path. Optionally toggle a loading flag. |
| `setConfig(config)` | Merge a request config for the next call. |
| `forceCancelRepeat()` | Force cancellation of repeated identical requests. |
| `carry(key)` | Replace a `{placeholder}` segment in the path. |
| `get(params?, cache?, dataCallback?)` | Issue a GET request, with optional caching and data transform. |
| `post(data?)` | Issue a POST request (supports `FormData`). |
| `put(data?)` | Issue a PUT request. |
| `del(params?)` | Issue a DELETE request. |
| `upload(file, data?)` | Upload a file with optional extra fields. |
| `downLoad(params?, methods?, fileName?)` | Download a file via GET or POST. |
| `clear()` | Reset the global instance and clear the built-in cache. |

## Store config

```ts
interface RequestStoreConfig {
  getStore?: (key: string) => unknown
  setStore?: (key: string, data: unknown) => void
  hasStore?: (key: string) => boolean
  cancelRepeat?: boolean // cancel repeated in-flight requests
  maxConcurrentNum?: number // max simultaneous requests (default: 99)
}
```

## Top-level exports

| Export | Description |
| --- | --- |
| `request` (default) | Factory that wraps a transport adapter (axios instance or fetch client) into an `IRequest`. |
| `createFetchClient(options?)` | Create a native `fetch` transport adapter with `baseURL`, `headers`, `timeout` and interceptors. See [Native fetch client](/guide/fetch). |
| `getDefaultCacheSnapshot()` | Read the full built-in default cache as a snapshot array. |
| `subscribeDefaultCache(listener)` | Subscribe to `set` and `clear` events from the built-in default cache. |
| `setRequest(instance)` | Register the global request instance. |
| `getRequest()` | Retrieve the registered global instance. |
| `fileInterceptorsResponseConfig(response)` | Detect file responses inside an axios response interceptor. |
| `dataToFormData(data)` | Convert a plain object into `FormData` (JSON-encoding non-string values). |
| `getStore` / `hasStore` / `setStore` | Default in-memory store helpers. |
