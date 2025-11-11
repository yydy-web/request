import type { RequireRquestConfig } from './request'

const cacheKeys: Map<string, unknown> = new Map()

export const setStore: RequireRquestConfig['setStore'] = (key: string, data: unknown) => {
  cacheKeys.set(key, data)
}

export const getStore: RequireRquestConfig['getStore'] = (key: string) => {
  return cacheKeys.get(key) || undefined
}

export function clearStore() {
  cacheKeys.clear()
}
