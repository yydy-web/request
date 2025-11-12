import type { RequestConfig } from './type'
import { clearStore, getStore, setStore } from '../cache'
import { Publisher } from './Publisher'

export type EmitCacheOptions = Pick<RequestConfig, 'getStore' | 'setStore' | 'clearStore'>

export default class EmitCache {
  private obSend: Publisher
  private cacheOptions: EmitCacheOptions
  private sendToken: Map<string, any>

  constructor(cacheOptions: EmitCacheOptions) {
    this.cacheOptions = cacheOptions

    this.obSend = new Publisher()
    this.sendToken = new Map()
  }

  getStoreFn() {
    if (this.cacheOptions.getStore) {
      return this.cacheOptions.getStore
    }
    return getStore
  }

  setStoreFn() {
    if (this.cacheOptions.setStore) {
      return this.cacheOptions.setStore
    }
    return setStore
  }

  clearStoreFn() {
    if (this.cacheOptions.clearStore) {
      return this.cacheOptions.clearStore
    }
    return clearStore
  }

  emitCache(isCache: boolean, cacheKey: string) {
    const cacheData = this.getStoreFn()(cacheKey)
    if (isCache && this.sendToken.get(cacheKey) && cacheData) {
      this.sendToken.delete(cacheKey)
      this.emit(cacheKey, cacheData)
    }
  }

  emit(cacheKey: string, withData: unknown) {
    this.obSend.emit(cacheKey, withData)
  }

  once(cacheKey: string, callback: (data: unknown) => void) {
    this.obSend.once(cacheKey, callback)
  }

  sendTokenSet(cacheKey: string, token: unknown) {
    this.sendToken.set(cacheKey, token)
  }

  sendTokenDelete(cacheKey: string) {
    this.sendToken.delete(cacheKey)
  }

  getSendToken(cacheKey: string) {
    return this.sendToken.get(cacheKey)
  }

  withCacheAction<T, Callback = false>(
    isCache: boolean,
    cacheKey: string,
    resolve: (value: (Callback extends false ? T : Callback)
      | PromiseLike<Callback extends false ? T : Callback>) => void,
  ) {
    if (this.getSendToken(cacheKey)) {
      this.once(cacheKey, resolve as (data: unknown) => void)
      return true
    }

    const cacheValue = this.getStoreFn()(cacheKey)
    if (isCache && this.getStoreFn()(cacheKey)) {
      resolve(cacheValue as Callback extends false ? T : Callback)
      return true
    }

    if (isCache && !this.getSendToken(cacheKey))
      this.sendTokenSet(cacheKey, true)

    return false
  }
}
