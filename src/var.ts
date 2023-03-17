import type { IRequest } from './request'

let request: IRequest | null = null

function setRequest(requestFn: IRequest) {
  return new Promise<void>((resolve) => {
    request = requestFn
    resolve()
  })
}

function getRequest() {
  if (!request)
    console.error('[mx:error]: not found request of @mx-web/use')
  return request
}

export default function createApi() {
  return {
    setRequest,
    getRequest,
  }
}
