# @yy-web/request

[![npm version](https://img.shields.io/npm/v/@yy-web/request?color=a1b858&label=)](https://www.npmjs.com/package/@yy-web/request)

面向链式调用的 HTTP 客户端封装。底层支持 **Axios** 与 **Fetch** 两种传输方式，提供统一的 `Request` API（路径模板、`GET` 缓存、重复请求取消、简单并发队列等）。

## 特性

- **双入口**：`@yy-web/request`（Axios）与 `@yy-web/request/fetch`（Fetch）
- **链式调用**：`setPath` → `get` / `post` / `put` / `del` / `upload`
- **REST风格路径**：`carry` 替换 `{id}` 占位符
- **GET 缓存**：内存 Map + 可自定义 `getStore` / `setStore` / `clearStore`
- **可选去重**：`cancelRepeat` 或单次 `forceCancelRepeat()`（Axios 使用 `CancelToken`，Fetch 使用 `AbortController`）
- **Axios 为可选 peer**：仅用 Fetch 时可不安装 `axios`

## 安装

```bash
pnpm add @yy-web/request
# 使用 Axios 传输时再安装
pnpm add axios
```

## 快速开始（Axios）

主入口会加载 Axios 适配注册逻辑（`sideEffects` 已声明），通过 `RequestFactory`（等价于 `Request.getInstance`）绑定你的 `AxiosInstance`：

```ts
import { RequestFactory, setRequest } from '@yy-web/request'
import axios from 'axios'

const http = axios.create({ baseURL: '/api' })

// 若你在拦截器里统一返回 response.data，请保持与业务一致
http.interceptors.response.use(
  res => res.data,
  err => Promise.reject(err),
)

const request = RequestFactory(http, {
  cancelRepeat: true,
  maxConcurrentNum: 5,
})

setRequest(request)
export default request
```

发起请求：

```ts
import request from './request'

await request.setPath('/users').get<{ id: number }>()
await request.setPath('/users').post({ name: 'yy' })
await request.setPath('/files').upload(file, { type: 'avatar' })
```

路径占位符：

```ts
await request.setPath('/users/{id}').carry(1).get()
// 实际请求 /users/1
```

### GET 缓存

第二个参数为 `true` 时开启本次 `GET` 的缓存（键由 URL + 方法 + 序列化参数生成）：

```ts
await request.setPath('/config').get(true)
await request.setPath('/config').get({}, true)
```

自定义存储（默认使用包内模块级 `Map`）：

```ts
const request = RequestFactory(http, {
  getStore: key => myCache.get(key),
  setStore: (key, val) => myCache.set(key, val),
  clearStore: () => myCache.clear(),
})
```

模块级缓存工具（与默认 `RequestConfig` 使用同一套存储）：

```ts
import { clearStore, getStore, setStore } from '@yy-web/request'
```

### 全局实例（可选）

```ts
import { getRequest, RequestFactory, setRequest } from '@yy-web/request'

setRequest(RequestFactory(http))
const r = getRequest() // 未 set时返回 null，并在控制台输出错误提示
```

### 取消重复请求

在构造选项中开启 `cancelRepeat: true`，或对单次链式调用使用 `forceCancelRepeat()`：

```ts
await request.setPath('/same').forceCancelRepeat().get()
```

### 响应形态与 `setConfig`

链上可合并 Axios 请求配置（类型为 `IAxiosRequestConfig`，在 `AxiosRequestConfig` 基础上扩展了 `loading`、`isFile`、`cache` 等字段）：

```ts
await request
  .setPath('/report')
  .setConfig({ timeout: 30_000, headers: { 'X-Trace': '1' } })
  .get()
```

### 清理

```ts
request.clear() // 清空单例引用与当前实例配置的 store（含自定义 clearStore）
```

## 快速开始（Fetch）

子路径 **`@yy-web/request/fetch`** 使用原生 `fetch` 传输，不依赖 Axios：

```ts
import { createFetchRequest } from '@yy-web/request/fetch'

const request = createFetchRequest(
  {
    fetch: globalThis.fetch,
    baseURL: 'https://api.example.com',
  },
  {
    cancelRepeat: true,
  },
)

await request.setPath('/health').get()
```

说明：

- `createFetchRequest` 在进程内是**单例**（首次创建后再次调用返回同一实例）。
- 在浏览器中可省略 `fetch` 字段；在 Node 等环境请传入可用的 `fetch` 实现。
- 错误时可能抛出 `FetchHttpError`（`name === 'FetchHttpError'`，含 `status` 与 `body` 文本）。

## 子路径与导出

| 入口 | 用途 |
|------|------|
| `@yy-web/request` | `RequestFactory`、`Request`、`getStore` / `setStore` / `clearStore`、`getRequest` / `setRequest`、类型等 |
| `@yy-web/request/fetch` | `createFetchRequest`、`Request`、传输相关类型 |

## TypeScript

库自带类型声明。核心请求对象实现 `IRequest`，构造选项见 `RequestConfig`。

## 开发

```bash
pnpm install
pnpm test
pnpm run build
```

## License

MIT
