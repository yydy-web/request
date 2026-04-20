import { Request } from '@yydy-web/request'
import { isCancel } from 'axios'
import { describe, expect, it } from 'vitest'
import axiosInstance from './request'

describe('cancel', () => {
  it ('cancel', async () => {
    const requestInstance = Request.getInstance(axiosInstance, { cancelRepeat: true })

    const firstRequest = requestInstance.setPath('/test').get()
    requestInstance.setPath('/test').get()

    await expect(firstRequest).rejects.toSatisfy(err => isCancel(err))
    requestInstance.clear()
  })

  it ('cancel force', async () => {
    const requestInstance = Request.getInstance(axiosInstance, { cancelRepeat: false })

    const [value, value2] = await Promise.all(
      [
        requestInstance.setPath('/test').get(),
        requestInstance.setPath('/test').get(),
      ],
    )

    expect(value).toBe('Hello World!')
    expect(value2).toBe('Hello World!')
  }, 1000)

  it ('cancel force cancel', async () => {
    const requestInstance = Request.getInstance(axiosInstance, { cancelRepeat: false })

    const action = () => requestInstance.setPath('/test').forceCancelRepeat().get()

    const firstRequest = action()
    action()

    await expect(firstRequest).rejects.toSatisfy(err => isCancel(err))
  }, 1000)
})
