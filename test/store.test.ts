import { getStore, Request } from '@yydy-web/request'
import { describe, expect, it, vi } from 'vitest'
import axiosInstance from './request'

describe('store', () => {
  it ('no set cache', async () => {
    const requestInstance = Request.getInstance(axiosInstance, { getStore: undefined, setStore: undefined })

    await vi.waitFor(async () => {
      return await requestInstance.setPath('/test').get(true)
    })

    expect(getStore(`/testGET{}`)).toBeDefined()
  })

  it ('set cache', async () => {
    const requestInstance = Request.getInstance(axiosInstance)

    const cacheValue = await requestInstance.setPath('/get/cache').get<{ value: string }>(true)

    const storeValue = getStore(`/get/cacheGET{}`)
    expect(storeValue).toBeDefined()
    expect(storeValue).toEqual(cacheValue)
  })

  it ('del cache', async () => {
    const requestInstance = Request.getInstance(axiosInstance)

    const cacheValue = await requestInstance.setPath('/get/cache').get<{ value: string }>(true)
    requestInstance.clear()

    const storeValue = getStore(`/get/cacheGET{}`)
    expect(cacheValue).toBeDefined()
    expect(storeValue).toBeUndefined()
  })

  it('custom store', async () => {
    let customStore: Record<string, unknown> = {}
    const requestInstance = Request.getInstance(axiosInstance, {
      getStore(key: string) {
        return customStore[key] || undefined
      },
      setStore(key: string, value: unknown) {
        customStore[key] = value
      },
      clearStore() {
        customStore = {}
      },
    })

    const cacheValue = await requestInstance.setPath('/get/cache').get<{ value: string }>(true)

    const storeValue = customStore[`/get/cacheGET{}`]
    expect(storeValue).toEqual(cacheValue)

    requestInstance.clear()
    expect(customStore[`/get/cacheGET{}`]).toBeUndefined()
  })

  it ('store request', async () => {
    const requestInstance = Request.getInstance(axiosInstance, { cancelRepeat: false })

    const [value, value2] = await Promise.all(
      [
        requestInstance.setPath('/get/cache').get<{ value: string }>(true),
        requestInstance.setPath('/get/cache').get<{ value: string }>(true),
      ],
    )

    expect(value).toEqual(value2)
  }, 2000)
})
