import type { IAxiosRequestConfig } from './type'

export interface TransportExecuteInput extends IAxiosRequestConfig {
  url: string
  method: string
  data?: unknown
  params?: unknown
}

export interface TransportContext {
  useCancelRepeat: boolean
  registerCanceler: (cancel: () => void) => void
}

export interface RequestTransport {
  execute: (input: TransportExecuteInput, ctx: TransportContext) => Promise<unknown>
}
