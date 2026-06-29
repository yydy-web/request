import request, {
  clearStore,
  getDefaultCacheSnapshot,
  getStore,
  hasStore,
  setRequest,
  setStore,
  subscribeDefaultCache,
} from '@yy-web/request'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import axiosInstance from './request'

describe('store', () => {
  beforeEach(() => {
    clearStore()
  })

  it('getStore', () => {
    const keys = 'test1'

    const value = getStore(keys)

    expect(value).toBeUndefined()
  })

  it ('setStore', async () => {
    const yyRequest = request(axiosInstance, { getStore, hasStore, setStore })

    setRequest(yyRequest)

    await vi.waitFor(async () => {
      return await yyRequest.setPath('/test').get(true)
    })

    expect(getStore(`/testGET{}`)).toBe('Hello World!')
  })

  it('returns a cache snapshot', () => {
    setStore('snapshot-key', { ok: true })

    expect(getDefaultCacheSnapshot()).toEqual([
      {
        key: 'snapshot-key',
        value: { ok: true },
      },
    ])
  })

  it('subscribes to cache updates', () => {
    const listener = vi.fn()
    const unsubscribe = subscribeDefaultCache(listener)

    setStore('watch-key', 'watch-value')
    clearStore()
    unsubscribe()
    setStore('after-unsubscribe', 'ignored')

    expect(listener).toHaveBeenCalledTimes(2)
    expect(listener).toHaveBeenNthCalledWith(1, {
      type: 'set',
      key: 'watch-key',
      value: 'watch-value',
      entries: [
        {
          key: 'watch-key',
          value: 'watch-value',
        },
      ],
    })
    expect(listener).toHaveBeenNthCalledWith(2, {
      type: 'clear',
      entries: [],
    })
  })

  it('supports falsey cached values with hasStore', async () => {
    const service = vi.fn().mockResolvedValueOnce(0)
    const yyRequest = request(service as any, { getStore, hasStore, setStore })

    const first = await yyRequest.setPath('/zero').get<number>(true)
    const second = await yyRequest.setPath('/zero').get<number>(true)

    expect(first).toBe(0)
    expect(second).toBe(0)
    expect(service).toHaveBeenCalledTimes(1)
  })
})
