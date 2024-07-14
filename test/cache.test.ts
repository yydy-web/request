import axios from 'axios'
import { describe, expect, it, vi } from 'vitest'
import { getStore, setRequest, setStore } from '@yy-web/request'
import request from '../src'

describe('store', () => {
  it('getStore', () => {
    const keys = 'test1'

    const value = getStore(keys)

    expect(value).toBeUndefined()
  })

  it ('setStore', async () => {
    const instance = axios.create({
      baseURL: '/',
    })

    const yyRequest = request(instance, { getStore, setStore })

    setRequest(yyRequest)

    const value = await vi.waitFor(async () => {
      return await yyRequest.setPath('user').get(true)
    })

    expect(value).toBe('1')
  })
})
