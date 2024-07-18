import { describe, expect, it, vi } from 'vitest'
import request, { getStore, setRequest } from '@yy-web/request'
import axiosInstance from './request'

describe('store', () => {
  it ('no set cache', async () => {
    const yyRequest = request(axiosInstance, { getStore: undefined, setStore: undefined })

    setRequest(yyRequest)

    await vi.waitFor(async () => {
      return await yyRequest.setPath('/test').get(true)
    })

    expect(getStore(`/testGET{}`)).toBeUndefined()
  })
})
