import type { AxiosInstance, Canceler, Method } from 'axios'
import type { IAxiosRequestConfig, IRequest, RequestConfig } from './type'
import axios from 'axios'
import EmitCache from './EmitCache'
import WaitQueue from './WaitQueue'

export class Request implements IRequest {
  static instance: Request | null = null
  private axiosInstance: AxiosInstance

  private emitCacheInstance: EmitCache
  private waitQueneInstance: WaitQueue

  private path?: string
  private config: IAxiosRequestConfig = {}
  private options?: RequestConfig

  private cancelRepeat = false
  private cancelTokenMap: Map<string, Canceler>

  constructor(service: AxiosInstance, options: RequestConfig = {}) {
    this.axiosInstance = service
    this.options = options

    this.emitCacheInstance = new EmitCache(options)
    this.waitQueneInstance = new WaitQueue(this.options?.maxConcurrentNum)
    this.cancelTokenMap = new Map<string, Canceler>()
  }

  static getInstance(service: AxiosInstance, options?: RequestConfig) {
    if (!Request.instance)
      Request.instance = new Request(service, options)
    return Request.instance
  }

  setPath(url: string, loading?: boolean) {
    this.path = url
    this.config = {} as IAxiosRequestConfig
    this.setConfig({ loading })
    this.cancelRepeat = false

    return this
  }

  setConfig(config: IAxiosRequestConfig) {
    this.config = { ...this.config, ...config }
    return this
  }

  forceCancelRepeat() {
    this.cancelRepeat = true
    return this
  }

  carry(key: string | number) {
    this.path = this.path.replace(/\{.*?\}/g, () => `${key}`)
    return this
  }

  paramsWith(sendData: unknown, methods: Method) {
    const toMethod = methods.toUpperCase()
    const isSendData = ['POST', 'PUT', 'DELETE'].includes(toMethod)
    const url = `${this.path}`.replace(/\/\//g, '/')
    const cacheKey = `${url}${methods.toUpperCase()}${JSON.stringify(sendData)}`
    const isCache = !!(this.config.cache && toMethod === 'GET')

    return {
      url,
      isSendData,
      toMethod,
      cacheKey,
      isCache,
    }
  }

  execCancelToken(cacheKey: string) {
    const cancelToken = this.cancelTokenMap.get(cacheKey)
    if (cancelToken) {
      cancelToken()
      this.cancelTokenMap.delete(cacheKey)
    }
  }

  createCancelToken(cacheKey: string, cancelToken: Canceler) {
    this.execCancelToken(cacheKey)
    this.cancelTokenMap.set(cacheKey, cancelToken)
  }

  withAction<T, Callback = false>(sendData: unknown, methods: Method, callback?: (data: T) => Callback): Promise<Callback extends false ? T : Callback> {
    return new Promise((resolve, reject) => {
      const { cacheKey, isCache, url, toMethod, isSendData } = this.paramsWith(sendData, methods)

      if (this.emitCacheInstance.withCacheAction<T, Callback>(isCache, cacheKey, resolve))
        return

      this.waitQueneInstance.fnExec(async () => {
        this.execCancelToken(url)
        try {
          const res = await this.axiosInstance({
            url,
            method: toMethod,
            [isSendData ? 'data' : 'params']: sendData,
            cancelToken: new axios.CancelToken((c) => {
              if (this.options?.cancelRepeat || this.cancelRepeat)
                this.createCancelToken(url, c)
            }),
            ...this.config,
          })

          const withData = typeof callback === 'function' ? callback(res as T) : res
          if (isCache)
            this.emitCacheInstance.setStoreFn()(cacheKey, withData)

          resolve(withData as Callback extends false ? T : Callback)
        }
        catch {
          reject(new Error('Request failed'))
        }
        finally {
          this.cancelTokenMap.delete(cacheKey)
          this.emitCacheInstance.emitCache(isCache, cacheKey)
        }
      })
    })
  }

  get<T, Callback = unknown>(params?: boolean | unknown, cache = false, dataCallback?: (data: T) => Callback) {
    if (typeof params === 'boolean') {
      cache = params
      params = {}
    }
    this.config.cache = cache
    return this.withAction<T, Callback>(params, 'GET', dataCallback)
  }

  post<T>(data?: unknown | FormData) {
    return this.withAction<T>(data, 'post')
  }

  put<T>(data?: unknown) {
    return this.withAction<T>(data, 'put')
  }

  del<T>(params?: unknown) {
    return this.withAction<T>(params, 'delete')
  }

  upload<T>(file: File, data: unknown = {}) {
    const formData = new FormData()
    formData.append('file', file)
    Object.entries(data).forEach(([k, v]) => formData.append(k, v))
    this.setConfig(Object.assign(this.config, { headers: { 'Content-Type': 'multipart/form-data' } }))
    return this.withAction<T>(formData, 'post')
  }

  downLoad: (params?: object, methods?: 'post' | 'get', fileName?: string) => Promise<void>

  clear() {
    Request.instance = null
    this.emitCacheInstance.clearStoreFn()
  }
}

export const RequestFactory = Request.getInstance
