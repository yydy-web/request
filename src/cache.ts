import type { RequestConfig } from './request'

const cacheKeys: Map<string, unknown> = new Map()

export const setStore: RequestConfig['setStore'] = (key: string, data: unknown) => {
  cacheKeys.set(key, data)
}

export const getStore: RequestConfig['getStore'] = (key: string) => {
  return cacheKeys.get(key) || undefined
}

export function clearStore() {
  cacheKeys.clear()
}
