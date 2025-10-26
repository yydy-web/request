import type Request from './request/instance'

let request: Request | null = null

export function setRequest(requestFn: Request) {
  request = requestFn
}

export function getRequest() {
  if (!request)
    console.error('[yy-web:error]: not found request of @yy-web/request')
  return request
}
