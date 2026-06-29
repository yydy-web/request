# API 参考

## IRequest

全局实例返回的链式请求接口。

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

### 方法

| 方法 | 说明 |
| --- | --- |
| `setPath(url, loading?)` | 设置请求路径，可选切换 loading 标记。 |
| `setConfig(config)` | 为下一次调用合并请求配置。 |
| `forceCancelRepeat()` | 强制取消重复的相同请求。 |
| `carry(key)` | 替换路径中的 `{占位符}` 片段。 |
| `get(params?, cache?, dataCallback?)` | 发起 GET 请求，支持可选缓存与数据转换。 |
| `post(data?)` | 发起 POST 请求（支持 `FormData`）。 |
| `put(data?)` | 发起 PUT 请求。 |
| `del(params?)` | 发起 DELETE 请求。 |
| `upload(file, data?)` | 上传文件，可附带额外字段。 |
| `downLoad(params?, methods?, fileName?)` | 通过 GET 或 POST 下载文件。 |
| `clear()` | 重置全局实例并清空内置缓存。 |

## 存储配置

```ts
interface RequestStoreConfig {
  getStore?: (key: string) => unknown
  setStore?: (key: string, data: unknown) => void
  hasStore?: (key: string) => boolean
  cancelRepeat?: boolean // 取消重复的在途请求
  maxConcurrentNum?: number // 最大并发请求数（默认 99）
}
```

## 顶层导出

| 导出 | 说明 |
| --- | --- |
| `request`（默认） | 将传输适配器（axios 实例或 fetch 客户端）包装成 `IRequest` 的工厂函数。 |
| `createFetchClient(options?)` | 创建原生 `fetch` 传输适配器，支持 `baseURL`、`headers`、`timeout` 与拦截器。详见 [原生 fetch 客户端](/zh/guide/fetch)。 |
| `getDefaultCacheSnapshot()` | 以快照数组形式读取完整的内置默认缓存。 |
| `subscribeDefaultCache(listener)` | 订阅内置默认缓存的 `set` 与 `clear` 事件。 |
| `setRequest(instance)` | 注册全局请求实例。 |
| `getRequest()` | 获取已注册的全局实例。 |
| `fileInterceptorsResponseConfig(response)` | 在 axios 响应拦截器中识别文件响应。 |
| `dataToFormData(data)` | 将普通对象转换为 `FormData`（非字符串值会被 JSON 编码）。 |
| `getStore` / `hasStore` / `setStore` | 默认的内存存储辅助函数。 |
