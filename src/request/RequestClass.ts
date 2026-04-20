import type { AxiosInstance, Method } from 'axios'
import type { RequestTransport } from './transport'
import type { IAxiosRequestConfig, IRequest, RequestConfig } from './type'
import EmitCache from './EmitCache'
import WaitQueue from './WaitQueue'

export class Request implements IRequest {
  static instance: Request | null = null

  static getInstance: (service: AxiosInstance, options?: RequestConfig) => Request = () => {
    throw new Error(
      '[@yydy-web/request] Request.getInstance is not registered. Import `@yydy-web/request` so the axios adapter can assign it.',
    )
  }

  private transport: RequestTransport

  private emitCacheInstance: EmitCache
  private waitQueneInstance: WaitQueue

  private path?: string
  private config: IAxiosRequestConfig = {}
  private options?: RequestConfig

  private cancelRepeat = false
  private cancelTokenMap: Map<string, () => void>

  constructor(transport: RequestTransport, options: RequestConfig = {}) {
    this.transport = transport
    this.options = options

    this.emitCacheInstance = new EmitCache(options)
    this.waitQueneInstance = new WaitQueue(this.options?.maxConcurrentNum)
    this.cancelTokenMap = new Map<string, () => void>()
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

  createCancelToken(cacheKey: string, cancelToken: () => void) {
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
        const instanceOptions = {
          url,
          method: toMethod,
          [isSendData ? 'data' : 'params']: sendData,
          ...this.config,
        }
        try {
          const res = await this.transport.execute(instanceOptions, {
            useCancelRepeat: !!(this.options?.cancelRepeat || this.cancelRepeat),
            registerCanceler: c => this.createCancelToken(url, c),
          })

          const withData = typeof callback === 'function' ? callback(res as T) : res
          if (isCache)
            this.emitCacheInstance.setStoreFn()(cacheKey, withData)

          resolve(withData as Callback extends false ? T : Callback)
        }
        catch (error) {
          reject(error)
        }
        finally {
          this.cancelTokenMap.delete(cacheKey)
          this.emitCacheInstance.emitCache(isCache, cacheKey)
        }
      })
    })
  }

  get<T, Callback = false>(params?: boolean | unknown, cache = false, dataCallback?: (data: T) => Callback) {
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
    return this.withAction<T>(formData, 'post')
  }

  clear() {
    Request.instance = null
    this.emitCacheInstance.clearStoreFn()
  }
}
