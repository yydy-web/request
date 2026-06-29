# Request Tools

`@yy-web/request-tools` is a companion package for inspecting the built-in
default cache from `@yy-web/request`.

## Install

```bash
pnpm add @yy-web/request-tools
```

## Scope

The tools package only supports the default in-memory cache from
`@yy-web/request`. If you provide your own `getStore` / `setStore`
implementation, the tools package cannot enumerate or subscribe to that custom
store automatically.

## API

```ts
import {
  clearRequestCache,
  getRequestCacheSnapshot,
  subscribeRequestCache,
} from '@yy-web/request-tools'
```

### Read the full cache

```ts
const entries = getRequestCacheSnapshot()
```

Each entry has the shape:

```ts
interface RequestCacheEntry {
  key: string
  value: unknown
}
```

### Subscribe to cache changes

```ts
const stop = subscribeRequestCache((event) => {
  console.log(event.type, event.entries)
})

stop()
```

### Clear the cache

```ts
clearRequestCache()
```

## Vue panel

`RequestCacheInspector` is a small floating component you can mount in any Vue
app to watch cache changes in real time.

```vue
<script setup lang="ts">
import { RequestCacheInspector } from '@yy-web/request-tools'
</script>

<template>
  <RequestCacheInspector />
</template>
```

The panel shows:

- current cache entry count
- latest update time
- key/value pairs
- manual refresh and clear actions

## Recommended request setup

When using the built-in helpers, pass `hasStore` alongside `getStore` and
`setStore` so falsey values still count as cache hits.

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
