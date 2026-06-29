import request, { getStore, setRequest, setStore } from '@yy-web/request'
import { describe, expect, it } from 'vitest'
import axiosInstance from './request'

describe('request fn ', () => {
  it('request base get', async () => {
    const yyRequest = request(axiosInstance, { setStore, getStore })
    setRequest(yyRequest)

    await yyRequest.setPath('/test/cache/1').get<{ id: string }[]>(true)
    await yyRequest.setPath('/test/cache/1').get<{ id: string }[]>(true)
    await yyRequest.setPath('/test/cache/1').get<{ id: string }[]>(true)
    await yyRequest.setPath('/test/cache/1').get<{ id: string }[]>(true)
    const value = await yyRequest.setPath('/test/cache/1').get<{ id: string }[]>(true)

    yyRequest.clear()

    expect(value).toBeDefined()
  })

  it('request no set cache', async () => {
    const yyRequest = request(axiosInstance, { setStore: undefined, getStore: undefined })
    setRequest(yyRequest)
    await yyRequest.setPath('/test/cache/1').get<{ id: string }[]>(true)
    const value = await yyRequest.setPath('/test/cache/1').get<{ id: string }[]>(true)

    expect(getStore('/test/cache/1GET{}')).toBeUndefined()
    expect(getStore('/test/cache/1GET{}')).not.equal(value)
  })
})
