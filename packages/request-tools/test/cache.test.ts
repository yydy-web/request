import { clearStore, setStore } from '@yy-web/request'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearRequestCache,
  getRequestCacheSnapshot,
  subscribeRequestCache,
} from '../src'

describe('@yy-web/request-tools cache api', () => {
  beforeEach(() => {
    clearStore()
  })

  it('reads the current cache snapshot', () => {
    setStore('tools-key', { hello: 'world' })

    expect(getRequestCacheSnapshot()).toEqual([
      {
        key: 'tools-key',
        value: { hello: 'world' },
      },
    ])
  })

  it('subscribes to cache changes', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeRequestCache(listener)

    setStore('tools-watch', 'value')
    unsubscribe()
    setStore('ignored', 'ignored')

    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith({
      type: 'set',
      key: 'tools-watch',
      value: 'value',
      entries: [
        {
          key: 'tools-watch',
          value: 'value',
        },
      ],
    })
  })

  it('clears the cache through the wrapper api', () => {
    setStore('to-clear', true)

    clearRequestCache()

    expect(getRequestCacheSnapshot()).toEqual([])
  })
})
