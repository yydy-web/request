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

export default yyRequest
```

## License

MIT