# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 常用命令

```bash
pnpm install                  # 安装依赖
pnpm build                    # 构建核心库 (@yy-web/request)
pnpm dev                      # 构建并 watch
pnpm test                     # 运行核心库测试 (vitest)
pnpm coverage                 # 测试 + 覆盖率
pnpm lint                     # ESLint 检查
pnpm lint:fix                 # ESLint 自动修复
pnpm -F @yy-web/request test -- -t "pattern"  # 运行匹配的单个测试
pnpm -F @yy-web/request test -- --ui           # Vitest UI 模式
pnpm -F @yy-web/request-tools test             # 运行 tools 包测试
pnpm play                     # 启动 playground (rsbuild dev)
pnpm docs:dev                 # 启动文档站点 (rspress dev)
```

## 架构概览

pnpm workspace monorepo，4 个包：

### `packages/request` — 核心库 (`@yy-web/request`)

链式调用的 axios 请求封装，同时支持原生 fetch。

- **`request.ts`** — 工厂函数 `export default function(service, storeOption?)`，接收 axios 实例或 `RequestAdapter`，返回 `IRequest` 单例。核心机制：
  - **链式 API**：`request.setPath('/api/{id}').carry(1).get(params, cache?)`
  - **GET 缓存**：通过 `cache.ts` 的 Map 存储，支持自定义 `getStore/setStore/hasStore`
  - **请求去重**：同一 cacheKey 的并发 GET 共享一个飞行中请求，通过 `Publisher` (mitt.ts) 广播结果给所有等待者
  - **并发控制**：`maxConcurrentNum` 限制同时请求数，超出排队
  - **取消令牌**：通过 `AbortController` + `cancelTokenMap`，重复请求时取消前一个
- **`fetch.ts`** — `createFetchClient(options)` 返回满足 `RequestAdapter` 签名的适配器，基于原生 `fetch`。支持 interceptors（request/response/error）、超时、FormData 自动处理。可以替代 axios 直接传给 `request()`
- **`cache.ts`** — 内置默认缓存（Map），带发布/订阅：`subscribeDefaultCache()` 可监听 `set`/`clear` 事件，被 `request-tools` 的 Vue 面板消费
- **`mitt.ts`** — 轻量 Pub/Sub，用于请求去重的飞行中通知
- **`downConf.ts`** — axios 响应拦截器辅助，处理文件下载的 blob 响应
- **`var.ts`** — 全局 request 实例的 setter/getter

测试位于 `packages/request/test/`，使用 vitest + jsdom + MSW mock HTTP。

### `packages/request-tools` — 调试工具 (`@yy-web/request-tools`)

- `cache.ts` — 对核心库 `cache.ts` 的再导出，API 相同但独立包名
- `vue/RequestCacheInspector.ts` — Vue 3 组件，浮动面板实时展示缓存条目，支持搜索、排序、复制、清除

### `packages/playground` — Vue 3 示例应用

rsbuild + Vue 3，消费 `@yy-web/request` 和 `@yy-web/request-tools`。

### `packages/docs` — Rspress 文档站点

中英文双语，部署到 GitHub Pages (`/request/` 路径)。

## 关键约定

- **TypeScript strict 模式**，但 `strictNullChecks: false`
- **Node >= 20**，pnpm 11.9
- 核心库 `sideEffects: false`，构建产物为 CJS + ESM + dts
- tsup 构建时 `axios` 标记为 external（peerDependency），fetch 路径无 axios 依赖
- ESLint 使用 `@antfu/eslint-config`
- 测试超时 60s，环境 jsdom
