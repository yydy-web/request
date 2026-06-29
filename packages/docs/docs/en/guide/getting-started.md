# Getting Started

`@yy-web/request` is a flexible, plugin-based and chainable wrapper around [axios](https://axios-http.com/) and the native `fetch` API.

## Features

- Plug-in mode
- Chain call
- RESTful specification
- Flexible configuration

## Install

```bash
npm i @yy-web/request
```

```bash
pnpm add @yy-web/request
```

> The library is transport-agnostic. `axios` is an optional peer dependency: install it
> only if you want to use an axios instance as the transport. For the native fetch client,
> no extra dependency is needed.

## Quick Start

`request(...)` accepts any transport adapter with the signature `(config) => Promise<data>`.

### With native fetch (no extra dependency)

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

See [Native fetch client](/guide/fetch) for interceptors and options.

### With axios

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

Now you can issue chainable requests anywhere in your app:

```ts
import request from './request'

const users = await request.setPath('users').get()
```

Continue to [Usage](/guide/usage) for the full set of actions.
