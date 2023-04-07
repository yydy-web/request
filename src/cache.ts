import type { RequestStoreConfig } from './request'

const cacheKeys: Map<string, any> = new Map()

export const setStore: RequestStoreConfig['setStore'] = (key: string, data: any) => {
  cacheKeys.set(key, data)
}

export const getStore: RequestStoreConfig['getStore'] = (key: string) => {
  return cacheKeys.get(key) || undefined
}
