# 原生 fetch 客户端

`@yy-web/request` 与传输层无关。核心的 `request(...)` 工厂接受任意符合
`(config) => Promise<data>` 签名的适配器。axios 实例天然满足该契约，而
`createFetchClient` 则在原生 `fetch` API 之上提供同样的契约，且无需依赖 axios。

## 上手

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

链式 API 与 axios 的写法完全一致：

```ts
import request from './request'

const user = await request.setPath('users/{id}').carry(1).get()
await request.setPath('users').post({ name: 'ada' })
```

## 配置项

```ts
interface FetchClientOptions {
  baseURL?: string
  headers?: Record<string, string>
  // 超过指定毫秒数后中止请求。
  timeout?: number
  interceptors?: {
    request?: (config) => config | Promise<config>
    response?: (response: Response, data: any, config) => any
    error?: (error: any, config) => any
  }
}
```

## 拦截器

拦截器与 axios 的工作流类似，但都是普通函数，且**在 `createFetchClient` 创建时通过 `interceptors` 选项配置**——返回的 fetch 客户端没有 axios 那种 `.interceptors.request.use()` 链式 API。

```ts
const client = createFetchClient({
  baseURL: '/api',
  headers: { 'X-App': 'demo' },
  timeout: 10000,
  interceptors: {
    // 在每次请求前注入鉴权头。
    request: (config) => {
      config.headers = { ...config.headers, Authorization: `Bearer ${getToken()}` }
      return config
    },
    // 转换已解析的数据；返回 undefined 则保持原样。
    response: (response, data) => {
      if (data?.code !== 0)
        throw new Error(data?.message)
      return data.data
    },
    // 恢复错误或重新抛出。
    error: (error) => {
      if (error.status === 401)
        redirectToLogin()
      throw error
    },
  },
})
```

### 注入 Token（请求拦截器）

Token 应通过 **`interceptors.request`** 在每次请求发出前动态注入，而不是写死在 `headers` 选项里——`headers` 只在客户端创建时求值一次，token 刷新后不会自动更新。

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

`getToken` 为异步函数时，拦截器同样支持 `async`：

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

::: warning 常见踩坑

1. **不要用静态 `headers` 传 token**：`headers: { Authorization: getToken() }` 只在模块加载时执行一次。
2. **不要对 fetch 客户端使用 axios 拦截器**：`createFetchClient` 返回的是 `(config) => Promise<data>` 函数，没有 `.interceptors` 属性。
3. **必须 `return config`**：拦截器需要返回修改后的 config，否则 header 不会生效。
4. **axios 与 fetch 分开配置**：若项目同时存在两种传输层，axios 走 `service.interceptors.request.use(...)`，fetch 走 `createFetchClient({ interceptors: { request } })`。

:::

与 axios 的对比：

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

## 行为说明

- 请求体：`FormData` 原样发送（由运行时设置 `multipart/form-data` 边界）；普通对象会被
  JSON 序列化，并默认带上 `application/json` 头。
- 响应：`application/json` 通过 `response.json()` 解析；其它文本会尝试 `JSON.parse`，
  失败则回退为原始文本（与 axios 默认行为一致）。
- 下载：使用 `downLoad()`（`responseType: 'blob'`）时，客户端会解析为
  `[blob, headers]`，由链式调用消费以触发浏览器下载。
- 取消：`forceCancelRepeat()` 及并发重复取消由 `AbortController` 驱动，
  fetch 与 axios 两种传输层共用。

## 在 axios 与 fetch 间切换

两种传输层暴露的 `IRequest` 链完全相同，因此只需更换传给 `request(...)` 的适配器即可切换：

```ts
import request, { createFetchClient } from '@yy-web/request'
import axios from 'axios'

// axios
const viaAxios = request(axios.create({ baseURL: '/api' }))

// 原生 fetch
const viaFetch = request(createFetchClient({ baseURL: '/api' }))
```
