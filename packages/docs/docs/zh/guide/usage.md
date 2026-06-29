# 使用

所有请求都从共享实例出发，通过链式调用组合而成。

## GET

```ts
import request from './request'

// 普通请求
request.setPath('xxxx').get(params)

// 带缓存的请求
request.setPath('xxxx').get(true)
request.setPath('xxxx').get(params, true)
```

使用 `@yy-web/request` 内置缓存辅助函数时，建议一并传入 `hasStore`，这样
`0`、`false`、`''` 等假值缓存也能被正确判定为命中：

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

> 启用缓存后，并发发起的相同缓存 GET 会被去重为一次网络请求：第一个调用真正发起请求，
> 其余调用共享它的结果（成功或失败一并 resolve / reject）。

## POST / PUT / DELETE / UPLOAD

```ts
import request from './request'

request.setPath('xxxx').post(data)
request.setPath('xxxx').put()
request.setPath('xxxx').upload()
request.setPath('xxxx').del()
```

## 路径参数 `carry`

用 `carry` 替换路径中的占位符：

```ts
const id = 1
request.setPath('xxxx/{id}').carry(id) // -> request.setPath('xxxx/1')
```

## 并发限流

通过 `maxConcurrentNum` 限制同时进行的请求数量，超出的请求会排队，待有空位时再发出（默认 `99`）。

```ts
const yyRequest = request(service, { maxConcurrentNum: 5 })
```

## 文件下载

用 `fileInterceptorsResponseConfig` 识别文件响应，再调用 `downLoad`。

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
  cancelRepeat?: boolean // 取消对同一路径的重复在途请求
  maxConcurrentNum?: number // 最大并发请求数（默认 99）
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

## 查看内置缓存

如果想实时查看默认的内存缓存，可安装 `@yy-web/request-tools`。

```ts
import {
  clearRequestCache,
  getRequestCacheSnapshot,
  RequestCacheInspector,
  subscribeRequestCache,
} from '@yy-web/request-tools'
```

- `getRequestCacheSnapshot()` 返回当前所有默认缓存条目。
- `subscribeRequestCache(listener)` 让工具能响应缓存变化。
- `RequestCacheInspector` 在 Vue 应用中渲染一个浮动调试面板。
- `clearRequestCache()` 清空内置缓存。

它仅适用于 `@yy-web/request` 的默认缓存辅助函数，不支持自定义的
`getStore` / `setStore` 实现。
