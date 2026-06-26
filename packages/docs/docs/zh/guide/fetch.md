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

拦截器与 axios 的工作流类似，但都是普通函数。

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
