import type { IRequest } from './request'

let request: IRequest | null = null

export function setRequest(requestFn: IRequest) {
  request = requestFn
}

export function getRequest() {
  if (!request)
    console.error('[yy-web:error]: not found request of @yy-web/request')
  return request
}
