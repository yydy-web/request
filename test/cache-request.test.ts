import request, { getStore, setRequest, setStore } from '@yy-web/request'
import { describe, expect, it } from 'vitest'
import axiosInstance from './request'

describe('request fn ', () => {
  const yyRequest = request(axiosInstance, { setStore, getStore })
  setRequest(yyRequest)

  it('request base get', async () => {
    await yyRequest.setPath('/test/cache/1').get<{ id: string }[]>(true)
    await yyRequest.setPath('/test/cache/1').get<{ id: string }[]>(true)
    await yyRequest.setPath('/test/cache/1').get<{ id: string }[]>(true)
    await yyRequest.setPath('/test/cache/1').get<{ id: string }[]>(true)
    const value = await yyRequest.setPath('/test/cache/1').get<{ id: string }[]>(true)

    expect(value).toBeDefined()
  })

  it('request base get cancel', async () => {
  })
})
