import type { Request } from './request'

let request: Request | null = null

export function setRequest(requestFn: Request) {
  request = requestFn
}

export function getRequest() {
  if (!request)
    console.error('[yydy-web:error]: not found request of @yydy-web/request')
  return request
}
