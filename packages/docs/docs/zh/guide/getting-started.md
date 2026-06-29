# 快速开始

`@yy-web/request` 是一个灵活、插件化、可链式调用的请求封装，底层兼容 [axios](https://axios-http.com/) 与原生 `fetch` API。

## 特性

- 插件化
- 链式调用
- RESTful 规范
- 灵活配置

## 安装

```bash
npm i @yy-web/request
```

```bash
pnpm add @yy-web/request
```

> 本库与传输层无关。`axios` 是可选的 peer 依赖：仅当你想用 axios 实例作为传输层时才需要安装。
> 使用原生 fetch 客户端时无需任何额外依赖。

## 上手

`request(...)` 接受任意符合 `(config) => Promise<data>` 签名的传输适配器。

### 使用原生 fetch（无需额外依赖）

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

拦截器与可选项详见 [原生 fetch 客户端](/zh/guide/fetch)。

### 使用 axios

```ts
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

之后即可在应用任意位置发起链式请求：

```ts
import request from './request'

const users = await request.setPath('users').get()
```

继续阅读 [使用](/zh/guide/usage) 了解完整的方法集。
