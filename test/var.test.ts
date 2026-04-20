import { getRequest, RequestFactory, setRequest } from '@yydy-web/request'
import { describe, expect, it } from 'vitest'
import axiosInstance from './request'

describe('request var instance ', () => {
  it ('get error request', () => {
    const request = getRequest()

    expect(request).toBeNull()
  })

  it('set request', () => {
    const yyRequest = RequestFactory(axiosInstance)
    setRequest(yyRequest)
    const yyRequestInstance = getRequest()
    expect(yyRequestInstance).toBe(getRequest())
  })

  it ('get instance', () => {
    const yyRequest = RequestFactory(axiosInstance)
    const yyRequest2 = RequestFactory(axiosInstance)
    expect(yyRequest).toBe(yyRequest2)
  })
})
