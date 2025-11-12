import type { AxiosRequestConfig, Method } from 'axios'

export interface IAxiosRequestConfig extends AxiosRequestConfig {
  loading?: boolean
  isFile?: boolean
  cache?: boolean
}

export interface IRequest {
  setPath: (url: string, loading?: boolean) => IRequest
  setConfig: (config: IAxiosRequestConfig) => IRequest
  forceCancelRepeat: () => IRequest
  carry: (key: string | number) => IRequest
  withAction: <T, Callback = false>(
    sendData: any,
    methods: Method,
    callback?: (data: T) => Callback,
  ) => Promise<Callback extends false ? T : Callback>
  get: <T, Callback = false>(
    params?: boolean | object,
    cache?: boolean,
    dataCallback?: (data: T) => Callback,
  ) => Promise<Callback extends false ? T : Callback>
  post: <T>(data?: object | FormData) => Promise<T>
  put: <T>(data?: object) => Promise<T>
  del: <T>(params?: object) => Promise<T>
  upload: <T>(file: File, data?: object) => Promise<T>
  clear: () => void
}

export interface RequestConfig {
  getStore?: ((key: string) => unknown)
  setStore?: (key: string, data: unknown) => void
  clearStore?: () => void
  cancelRepeat?: boolean
  maxConcurrentNum?: number
}

export type RequireRquestConfig = Required<RequestConfig>
