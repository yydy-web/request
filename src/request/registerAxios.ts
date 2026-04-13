import type { AxiosInstance } from 'axios'
import type { RequestConfig } from './type'
import { createAxiosTransport } from './adapters/axios'
import { Request } from './RequestClass'

function getInstance(service: AxiosInstance, options?: RequestConfig) {
  if (!Request.instance)
    Request.instance = new Request(createAxiosTransport(service), options)
  return Request.instance
}

Request.getInstance = getInstance

export const RequestFactory = getInstance
