import type {
  DefaultCacheEntry,
  DefaultCacheEvent,
} from '@yy-web/request'
import {
  clearStore,
  getDefaultCacheSnapshot,
  subscribeDefaultCache,
} from '@yy-web/request'

export type RequestCacheEntry = DefaultCacheEntry
export type RequestCacheEvent = DefaultCacheEvent

export function getRequestCacheSnapshot() {
  return getDefaultCacheSnapshot()
}

export function subscribeRequestCache(listener: (event: RequestCacheEvent) => void) {
  return subscribeDefaultCache(listener)
}

export function clearRequestCache() {
  clearStore()
}
