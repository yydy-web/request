import { getStore, Request, setRequest } from '@yy-web/request'
import { describe, expect, it, vi } from 'vitest'
import axiosInstance from './request'

describe('store', () => {
  it ('no set cache', async () => {
    const requestInstance = Request.getInstance(axiosInstance, { getStore: undefined, setStore: undefined })

    setRequest(requestInstance)

    await vi.waitFor(async () => {
      return await requestInstance.setPath('/test').get(true)
    })

    expect(getStore(`/testGET{}`)).toBeUndefined()
  })
})
