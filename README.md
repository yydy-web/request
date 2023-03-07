# @yy-web/request

[![NPM version](https://img.shields.io/npm/v/@yy-web/request?color=a1b858&label=)](https://www.npmjs.com/package/@yy-web/request)

## Features

- Plug-in mode
- Chain call
- restful specification
- Flexible configuration
  
## Install

```bash
npm i @yy-web/request
```

```js
// request.ts
import axios from 'axios'
import request, { setRequest } from '@yy-web/request'

const service = axios.create({
  baseURL: '/api',
})

const yyRequest = request(service)
setRequest(yyRequest)

export default yyRequest
```

## Feature
- get action
```js
import { getRequest } from '@yy-web/request' // get instance
import request from './request.ts'

// simple
request.setPath('xxxx').get(params)

// cache get
request.setPath('xxxx').get(true)
request.setPath('xxxx').get(params, true)
```

- other
```js
import { getRequest } from '@yy-web/request' // get instance
import request from './request.ts'

request.setPath('xxxx').post(data)
request.setPath('xxxx').put()
request.setPath('xxxx').upload()
request.setPath('xxxx').del()
```

result carry
```js
const id = 1
request.setPath('xxxx/{id}').carry(id) // -> request.setPath('xxxx/1')
```

- downfile
```js
import axios from 'axios'
import request, { fileInterceptorsResponseConfig, setRequest } from '@yy-web/request'

const service = axios.create({
  baseURL: '/api',
})

service.interceptors.response.use((response: any) => {
  const { isFile, value } = fileInterceptorsResponseConfig(response)
  if (isFile)
    return value

  return response.data
})

const yyRequest = request(service)
setRequest(yyRequest)

request.setPath('xxxx').downFile(data)
```

## type
```ts
interface IRequest {
  setPath(url: string, loading?: boolean): IRequest
  setConfig(config: IAxiosRequestConfig): IRequest
  carry(key: string | number): IRequest
  get<T, Callback = false>(params?: boolean | object, cache?: boolean, dataCallback?: (data: T) => Callback): Promise<Callback extends false ? T : Callback>
  post<T>(data?: object | FormData): Promise<T>
  put<T>(data?: object): Promise<T>
  del<T>(params?: object): Promise<T>
  upload<T>(file: File, data?: object): Promise<T>
  downLoad(params?: object, methods?: 'post' | 'get', fileName?: string): Promise<unknown>
}
```

## License

MIT