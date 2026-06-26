import type { AxiosInstance, AxiosRequestConfig, AxiosRequestHeaders, Method } from 'axios'
import { clearStore, hasStore } from './cache'
import { Publisher } from './mitt'

type Canceler = () => void

/** Outcome of an in-flight request, broadcast to de-duplicated waiters. */
type SettledResult
  = | { ok: true, value: unknown }
    | { ok: false, error: unknown }

/**
 * Normalized request config shared by every transport (axios or fetch).
 * Kept structurally compatible with axios so existing instances keep working.
 */
export interface IRequestConfig extends AxiosRequestConfig {
  loading?: boolean
  isFile?: boolean
  cache?: boolean
}

/** @deprecated use {@link IRequestConfig} instead. Kept for backward compatibility. */
export type IAxiosRequestConfig = IRequestConfig

/** Config object handed to a {@link RequestAdapter} for a single call. */
export interface RequestAdapterConfig extends IRequestConfig {
  url: string
  method: string
}

/**
 * A transport adapter. Receives a normalized config and resolves with the
 * already-unwrapped response data. An axios instance satisfies this signature
 * out of the box, and {@link createFetchClient} produces one for native fetch.
 */
export type RequestAdapter = (config: RequestAdapterConfig) => Promise<any>

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
  downLoad: (params?: object, methods?: 'post' | 'get', fileName?: string) => Promise<void>
  clear: () => void
}

export interface RequestStoreConfig {
  getStore?: (key: string) => unknown | undefined
  setStore?: (key: string, data: unknown) => void
  hasStore?: (key: string) => boolean
  cancelRepeat?: boolean
  maxConcurrentNum?: number
}

export default function (service: AxiosInstance | RequestAdapter, storeOption?: RequestStoreConfig) {
  const send = service as RequestAdapter
  const sendToken: Map<string, any> = new Map()
  const cancelTokenMap: Map<string, Canceler | null> = new Map()
  const requestPool = new Set<() => void>()
  const waitQueue: (() => void)[] = []

  class Request implements IRequest {
    static instance: IRequest | null = null
    private path?: string
    private config: IAxiosRequestConfig = {}
    private obSend = new Publisher()
    private cancelRepeat = false

    static getStoreOption() {
      return { maxConcurrentNum: 99, ...storeOption }
    }

    static getInstance() {
      if (!Request.instance)
        Request.instance = new Request()

      return Request.instance
    }

    clear() {
      Request.instance = null
      clearStore()
    }

    setPath(url: string, loading = false): IRequest {
      this.path = url
      this.config = {}
      this.setConfig({ loading })
      this.cancelRepeat = false

      return this
    }

    setConfig(config: IAxiosRequestConfig): IRequest {
      this.config = { ...this.config, ...config }
      return this
    }

    forceCancelRepeat() {
      this.cancelRepeat = true
      return this
    }

    withCacheAction<T, Callback = false>(
      isCache: boolean,
      cacheKey: string,
      resolve: (value: (Callback extends false ? T : Callback)
        | PromiseLike<Callback extends false ? T : Callback>) => void,
      reject: (reason?: unknown) => void,
    ) {
      const { getStore, hasStore: hasStoreOption } = Request.getStoreOption()
      const cachedData = getStore?.(cacheKey)
      // A request with the same key is already in flight: wait for its
      // outcome instead of firing a duplicate. We must mirror BOTH success
      // and failure, otherwise a rejected leader would leave us hanging.
      if (sendToken.get(cacheKey)) {
        this.obSend.once(cacheKey, (settled: SettledResult) => {
          if (settled.ok)
            resolve(settled.value as Callback extends false ? T : Callback)
          else
            reject(settled.error)
        })
        return true
      }
      const hasCachedData = hasStoreOption
        ? hasStoreOption(cacheKey)
        : typeof cachedData !== 'undefined' || hasStore(cacheKey)
      if (isCache && getStore && hasCachedData) {
        resolve(cachedData as Callback extends false ? T : Callback)
        return true
      }
      if (isCache)
        sendToken.set(cacheKey, true)

      return false
    }

    // Notify every de-duplicated waiter of the leader's outcome and release
    // the in-flight token so the key can be requested again later.
    settleCache(cacheKey: string, settled: SettledResult) {
      if (sendToken.get(cacheKey)) {
        sendToken.delete(cacheKey)
        this.obSend.emit(cacheKey, settled)
      }
    }

    carry(key: string | number) {
      if (this.path)
        this.path = this.path.replace(/\{.*?\}/g, () => `${key}`)

      return this
    }

    execCancelToken(cacheKey: string) {
      const cancelToken = cancelTokenMap.get(cacheKey)
      if (cancelToken) {
        cancelToken()
        cancelTokenMap.delete(cacheKey)
      }
    }

    createCancelToken(cacheKey: string, cancelToken: Canceler) {
      this.execCancelToken(cacheKey)
      cancelTokenMap.set(cacheKey, cancelToken)
    }

    withAction<T, Callback = false>(
      sendData: any,
      methods: Method,
      callback?: (data: T) => Callback,
    ): Promise<Callback extends false ? T : Callback> {
      const toMethod = methods.toUpperCase()
      const isSendData = ['POST', 'PUT', 'DELETE'].includes(toMethod)
      const url = `${this.path}`.replace(/\/\//g, '/')
      const cacheKey = `${url}${methods.toUpperCase()}${JSON.stringify(sendData)}`
      const { getStore, setStore, maxConcurrentNum } = Request.getStoreOption()
      const isCache = !!(this.config.cache && toMethod === 'GET' && getStore && setStore)
      return new Promise((resolve, reject) => {
        if (this.withCacheAction(isCache, cacheKey, resolve, reject))
          return

        const isOverflow = requestPool.size >= maxConcurrentNum
        this.execCancelToken(url)
        const action = () => {
          const controller = new AbortController()
          if (storeOption?.cancelRepeat || this.cancelRepeat)
            this.createCancelToken(url, () => controller.abort())

          send({
            url,
            method: toMethod,
            [isSendData ? 'data' : 'params']: sendData,
            signal: controller.signal,
            ...this.config,
          })
            .then((data: any) => {
              const withData = typeof callback === 'function' ? callback(data) : data
              if (isCache)
                setStore?.(cacheKey, withData)

              resolve(withData)
              this.settleCache(cacheKey, { ok: true, value: withData })
            })
            .catch((error: unknown) => {
              reject(error)
              this.settleCache(cacheKey, { ok: false, error })
            })
            .finally(() => {
              requestPool.delete(action)
              cancelTokenMap.delete(url)
              const next = waitQueue.shift()
              if (next) {
                requestPool.add(next)
              }
              setTimeout(() => {
                next?.()
              })
            })
        }

        if (isOverflow) {
          waitQueue.push(action)
          return
        }
        requestPool.add(action)
        action()
      })
    }

    get<T, Callback = false>(params?: boolean | object, cache = false, dataCallback?: (data: T) => Callback) {
      if (typeof params === 'boolean') {
        cache = params
        params = {}
      }
      this.config.cache = cache
      return this.withAction<T, Callback>(params, 'GET', dataCallback)
    }

    post<T>(data?: object | FormData) {
      return this.withAction<T>(data, 'post')
    }

    put<T>(data?: object) {
      return this.withAction<T>(data, 'put')
    }

    del<T>(params?: object) {
      return this.withAction<T>(params, 'delete')
    }

    upload<T>(file: File, data: object = {}) {
      const formData = new FormData()
      formData.append('file', file)
      Object.entries(data).forEach(([k, v]) => formData.append(k, v))
      this.setConfig(Object.assign(this.config, { headers: { 'Content-Type': 'multipart/form-data' } }))
      return this.withAction<T>(formData, 'post')
    }

    downLoad(params: object = {}, methods: 'post' | 'get' = 'get', fileName = ''): Promise<void> {
      this.setConfig(Object.assign(this.config, { isFile: true, responseType: 'blob' }))
      return new Promise((resolve, reject) => {
        this.withAction<[File, AxiosRequestHeaders]>(params, methods || 'get').then(([file, config]) => {
          const blob = new Blob([file])
          fileName = fileName || decodeURIComponent(config['content-disposition'] as string).slice(20)
          if (window && document && 'download' in document.createElement('a')) {
            // 非IE下载
            const eLink = document.createElement('a')
            eLink.download = fileName
            eLink.style.display = 'none'
            eLink.href = URL.createObjectURL(blob)
            document.body.appendChild(eLink)
            eLink.click()
            // 释放URL 对象
            URL.revokeObjectURL(eLink.href)
            document.body.removeChild(eLink)
          }
          resolve()
        }).catch(reject)
      })
    }
  }

  return Request.getInstance()
}

export function dataToFormData(data: object) {
  if (data instanceof FormData)
    return data

  return Object.entries(data).reduce((total, [key, value]) => {
    if (typeof value !== 'undefined')
      total.append(key, typeof value !== 'string' ? JSON.stringify(value) : value)

    return total
  }, new FormData())
}
