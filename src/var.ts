import type { IRequest } from './request'

let request: IRequest | null = null

function setRequest(requestFn: IRequest) {
  return new Promise<void>((resolve) => {
    request = requestFn
    resolve()
  })
}

function getRequest() {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (!request)
        console.error('[mx:error]: not found request of @yy-web/request')
      resolve(request)
    }, 0)
  })
}

export default function createApi() {
  return {
    setRequest,
    getRequest,
  }
}
