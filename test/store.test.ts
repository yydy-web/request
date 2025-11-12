import { getStore, Request } from '@yy-web/request'
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
})
