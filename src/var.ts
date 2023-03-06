import type { IRequest } from './request'

let request: IRequest | null = null

export function setRequest(requestFn: IRequest) {
  request = requestFn
}

export function getRequest() {
  if (!request)
    console.error('[mx:error]: not found request of @mx-web/use')
  return request
}
