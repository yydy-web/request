import type { RequestStoreConfig } from './request/index'

const cacheKeys: Map<string, unknown> = new Map()

export const setStore: RequestStoreConfig['setStore'] = (key: string, data: unknown) => {
  cacheKeys.set(key, data)
}

export const getStore: RequestStoreConfig['getStore'] = (key: string) => {
  return cacheKeys.get(key) || undefined
}

export function clearStore() {
  cacheKeys.clear()
}
