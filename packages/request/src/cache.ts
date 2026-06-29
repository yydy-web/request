const cacheKeys: Map<string, any> = new Map()
const listeners = new Set<(event: DefaultCacheEvent) => void>()

export interface DefaultCacheEntry {
  key: string
  value: unknown
}

export type DefaultCacheEvent
  = | {
    type: 'set'
    key: string
    value: unknown
    entries: DefaultCacheEntry[]
  }
  | {
    type: 'clear'
    entries: DefaultCacheEntry[]
  }

function createSnapshot(): DefaultCacheEntry[] {
  return Array.from(cacheKeys.entries()).map(([key, value]) => ({ key, value }))
}

function emit(event: DefaultCacheEvent) {
  for (const listener of listeners)
    listener(event)
}

export const setStore: (key: string, data: unknown) => void = (key, data) => {
  cacheKeys.set(key, data)
  emit({
    type: 'set',
    key,
    value: data,
    entries: createSnapshot(),
  })
}

export const getStore: (key: string) => unknown = (key) => {
  return cacheKeys.has(key) ? cacheKeys.get(key) : undefined
}

export const hasStore: (key: string) => boolean = (key) => {
  return cacheKeys.has(key)
}

export function getDefaultCacheSnapshot() {
  return createSnapshot()
}

export function subscribeDefaultCache(listener: (event: DefaultCacheEvent) => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function clearStore() {
  cacheKeys.clear()
  emit({
    type: 'clear',
    entries: [],
  })
}
