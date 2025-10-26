import request, { getStore, setRequest, setStore } from '@yy-web/request'
import { describe, expect, it, vi } from 'vitest'
import axiosInstance from './request'

describe('store', () => {
  it('getStore', () => {
    const keys = 'test1'

    const value = getStore(keys)

    expect(value).toBeUndefined()
  })

  it ('setStore', async () => {
    const yyRequest = request(axiosInstance, { getStore, setStore })

    setRequest(yyRequest)

    await vi.waitFor(async () => {
      return await yyRequest.setPath('/test').get(true)
    })

    expect(getStore(`/testGET{}`)).toBe('Hello World!')
  })
})
