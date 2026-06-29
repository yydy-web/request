# 请求工具

`@yy-web/request-tools` 是配套包，用于查看 `@yy-web/request` 的内置默认缓存。

## 安装

```bash
pnpm add @yy-web/request-tools
```

## 适用范围

该工具包仅支持 `@yy-web/request` 的默认内存缓存。如果你提供了自定义的
`getStore` / `setStore` 实现，工具包无法自动枚举或订阅这些自定义存储。

## API

```ts
import {
  clearRequestCache,
  getRequestCacheSnapshot,
  subscribeRequestCache,
} from '@yy-web/request-tools'
```

### 读取全部缓存

```ts
const entries = getRequestCacheSnapshot()
```

每个条目的结构：

```ts
interface RequestCacheEntry {
  key: string
  value: unknown
}
```

### 订阅缓存变化

```ts
const stop = subscribeRequestCache((event) => {
  console.log(event.type, event.entries)
})

stop()
```

### 清空缓存

```ts
clearRequestCache()
```

## Vue 面板

`RequestCacheInspector` 是一个小巧的浮动组件，可挂载到任意 Vue 应用中实时观察缓存变化。

```vue
<script setup lang="ts">
import { RequestCacheInspector } from '@yy-web/request-tools'
</script>

<template>
  <RequestCacheInspector />
</template>
```

面板会展示：

- 当前缓存条目数量
- 最近更新时间
- 键值对
- 手动刷新与清空操作

## 推荐的请求配置

使用内置辅助函数时，建议在 `getStore`、`setStore` 之外一并传入 `hasStore`，
让假值也能算作缓存命中。

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
