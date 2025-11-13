import { Request } from '@yy-web/request'
import { isCancel } from 'axios'
import { describe, expect, it } from 'vitest'
import axiosInstance from './request'

describe('cancel', () => {
  it ('cancel', async () => {
    const requestInstance = Request.getInstance(axiosInstance, { cancelRepeat: true })

    const firstRequest = requestInstance.setPath('/test').get()
    requestInstance.setPath('/test').get()

    expect(firstRequest).rejects.toSatisfy(err => isCancel(err))
  })

  it ('cancel force', async () => {
    const requestInstance = Request.getInstance(axiosInstance, { cancelRepeat: false })

    const firstRequest = requestInstance.setPath('/test').get()

    expect(firstRequest).resolves.toBe('Hello World!')
  }, 1000)
})
