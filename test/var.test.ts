import axios from 'axios'
import request, { getRequest, setRequest } from '@yy-web/request'
import { describe, expect, it } from 'vitest'

describe('request instance ', () => {
  it ('get error request', () => {
    const request = getRequest()

    expect(request).toBeNull()
  })

  it('set request', () => {
    const axiosInstance = axios.create({
      url: 'http://localhost:8080/',
    })

    const yyRequest = request(axiosInstance)
    setRequest(yyRequest)
    const yyRequestInstance = getRequest()

    expect(yyRequestInstance).toBe(getRequest())
  })
})
