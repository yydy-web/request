# @yy-web/request monorepo

[![NPM version](https://img.shields.io/npm/v/@yy-web/request?color=a1b858&label=)](https://www.npmjs.com/package/@yy-web/request)

A flexible, plugin-based and chainable [axios](https://axios-http.com/) request wrapper, managed as a pnpm workspace monorepo.

## Packages

| Package | Path | Description |
| --- | --- | --- |
| [`@yy-web/request`](packages/request) | `packages/request` | The publishable core library. |
| [`@yy-web/request-tools`](packages/request-tools) | `packages/request-tools` | Cache inspection helpers and a lightweight Vue debug panel. |
| `playground` | `packages/playground` | Vue 3 example app that consumes the library. |
| `docs` | `packages/docs` | Rspress documentation site. |

## Requirements

- Node.js >= 20
- pnpm (see `packageManager` in `package.json`)

## Setup

```bash
pnpm install
```

## Scripts

Run from the repository root:

| Command | Description |
| --- | --- |
| `pnpm build` | Build the core library (`@yy-web/request`). |
| `pnpm dev` | Build the library in watch mode. |
| `pnpm test` | Run the library test suite (Vitest). |
| `pnpm coverage` | Run tests with coverage. |
| `pnpm play` | Start the playground dev server. |
| `pnpm play:build` | Build the playground. |
| `pnpm docs:dev` | Start the documentation dev server. |
| `pnpm docs:build` | Build the documentation site. |
| `pnpm lint` / `pnpm lint:fix` | Lint the whole workspace. |
| `pnpm release` | Build and publish a new version (`bumpp`). |

## Documentation

See [`packages/docs`](packages/docs) or the published documentation site for full usage and API reference. Library-specific docs also live in [`packages/request/README.md`](packages/request/README.md).

## License

MIT
