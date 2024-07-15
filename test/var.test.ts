import request, { getRequest, setRequest } from '@yy-web/request'
import { describe, expect, it } from 'vitest'
import axiosInstance from './request'

describe('request var instance ', () => {
  it ('get error request', () => {
    const request = getRequest()

    expect(request).toBeNull()
  })

  it('set request', () => {
    const yyRequest = request(axiosInstance)
    setRequest(yyRequest)
    const yyRequestInstance = getRequest()

    expect(yyRequestInstance).toBe(getRequest())
  })
})
