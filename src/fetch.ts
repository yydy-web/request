import type { RequestConfig } from './request/type'
import { createFetchTransport } from './request/adapters/fetch'
import { Request } from './request/RequestClass'

export interface CreateFetchRequestOptions {
  fetch?: typeof fetch
  baseURL?: string
}

export function createFetchRequest(
  opts: CreateFetchRequestOptions = {},
  requestOptions?: RequestConfig,
) {
  if (!Request.instance) {
    Request.instance = new Request(
      createFetchTransport({ fetchImpl: opts.fetch, baseURL: opts.baseURL }),
      requestOptions ?? {},
    )
  }
  return Request.instance
}

export { Request } from './request/RequestClass'
export type { RequestTransport, TransportContext, TransportExecuteInput } from './request/transport'
export type * from './request/type'
