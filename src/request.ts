import type { AxiosInstance, AxiosRequestConfig, AxiosRequestHeaders, Canceler, Method } from 'axios'
import axios from 'axios'
import emitter from './mitt'

export interface IAxiosRequestConfig extends AxiosRequestConfig {
  loading?: boolean
  isFile?: boolean
  cache?: boolean
}

export interface IRequest {
  setPath(url: string, loading?: boolean): IRequest
  setConfig(config: IAxiosRequestConfig): IRequest
  carry(key: string | number): IRequest
  withAction<T, Callback = false>(
    sendData: any,
    methods: Method,
    callback?: (data: T) => Callback
  ): Promise<Callback extends false ? T : Callback>
  get<T, Callback = false>(
    params?: boolean | object,
    cache?: boolean,
    dataCallback?: (data: T) => Callback
  ): Promise<Callback extends false ? T : Callback>
  post<T>(data?: object | FormData): Promise<T>
  put<T>(data?: object): Promise<T>
  del<T>(params?: object): Promise<T>
  upload<T>(file: File, data?: object): Promise<T>
  downLoad(params?: object, methods?: 'post' | 'get', fileName?: string): Promise<void>
}

export interface RequestStoreConfig {
  getStore: (key: string) => any
  setStore: (key: string, data: any) => void
}

export default function (service: AxiosInstance, storeOption?: RequestStoreConfig | (() => RequestStoreConfig)) {
  const sendToken: Map<string, any> = new Map()
  const cancelTokenMap: Map<string, Canceler | null> = new Map()

  class Request implements IRequest {
    static instance: IRequest | null = null
    private path?: string
    private config: IAxiosRequestConfig = {}
    private obSend = emitter

    static getStoreOption() {
      return typeof storeOption === 'function' ? storeOption() : (storeOption || {}) as RequestStoreConfig
    }

    static setStore(key: string, data: any) {
      const { setStore } = Request.getStoreOption()
      return setStore(key, data)
    }

    static getStore(key: string) {
      const { getStore } = Request.getStoreOption()
      return getStore(key)
    }

    static getInstance() {
      if (!Request.instance)
        Request.instance = new Request()

      return Request.instance
    }

    setPath(url: string, loading = false): IRequest {
      this.path = url
      this.config = {}
      this.setConfig({ loading })

      return this
    }

    setConfig(config: IAxiosRequestConfig): IRequest {
      this.config = Object.assign(this.config, config)
      return this
    }

    getStoreOption() {
      return typeof storeOption === 'function' ? storeOption() : (storeOption || {}) as RequestStoreConfig
    }

    withCacheAction<T, Callback = false>(
      isCache: boolean,
      cacheKey: string,
      resolve: (value: (Callback extends false ? T : Callback)
      | PromiseLike<Callback extends false ? T : Callback>) => void) {
      const { getStore } = Request.getStoreOption()
      // cacheAction
      if (sendToken.get(cacheKey)) {
        this.obSend.once(cacheKey, resolve as any)
        return true
      }
      if (storeOption && isCache && getStore(cacheKey)) {
        resolve(getStore(cacheKey) as Callback extends false ? T : Callback)
        return true
      }
      if (isCache && !sendToken.get(cacheKey))
        sendToken.set(cacheKey, true)

      return false
    }

    emitCache(isCache: boolean, cacheKey: string) {
      const { getStore } = Request.getStoreOption()
      const cacheData = getStore(cacheKey)
      if (isCache && sendToken.get(cacheKey) && cacheData) {
        sendToken.delete(cacheKey)
        this.obSend.emit(cacheKey, cacheData)
      }
    }

    carry(key: string | number) {
      if (!this.path) {
        this.path = ''
        throw new Error('yydy-web: request url set error')
      }
      this.path = this.path.replace(/\{.*?\}/g, () => `${key}`)
      return this
    }

    withAction<T, Callback = false>(
      sendData: any,
      methods: Method,
      callback?: (data: T) => Callback): Promise<Callback extends false ? T : Callback> {
      const toMethod = methods.toUpperCase()
      const isSendData = ['POST', 'PUT', 'DELETE'].includes(toMethod)
      const url = `${this.path}`.replace(/(\/\/)/g, '/')
      const cacheKey = `${url}${JSON.stringify(sendData)}`
      const isCache = !!(this.config.cache && toMethod === 'GET')
      return new Promise((resolve, reject) => {
        if (this.withCacheAction(isCache, cacheKey, resolve))
          return

        const cancelToken = cancelTokenMap.get(cacheKey)
        if (cancelToken) {
          cancelToken()
          cancelTokenMap.delete(cacheKey)
        }
        service({
          url,
          method: toMethod,
          [isSendData ? 'data' : 'params']: sendData,
          cancelToken: new axios.CancelToken((c) => {
            cancelTokenMap.set(cacheKey, c)
          }),
          ...this.config,
        })
          .then((data: any) => {
            const withData = typeof callback === 'function' ? callback(data) : data
            if (isCache)
              Request.setStore(cacheKey, withData)

            resolve(withData)
          })
          .catch(reject)
          .finally(() => {
            cancelTokenMap.delete(cacheKey)
            if (!storeOption)
              return
            this.emitCache(isCache, cacheKey)
          })
      })
    }

    get<T, Callback = unknown>(params?: boolean | object, cache = false, dataCallback?: (data: T) => Callback) {
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
      return new Promise((resolve) => {
        this.withAction<[File, AxiosRequestHeaders]>(params, methods || 'get').then(([file, config]) => {
          const blob = new Blob([file])
          fileName = fileName || decodeURIComponent(config['content-disposition'] as string).slice(20)
          if ('download' in document.createElement('a')) {
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
          else {
            // IE10+下载
            const nav = window.navigator as any
            if (nav.msSaveBlob)
              nav.msSaveBlob(blob, fileName)
          }
          resolve()
        })
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
