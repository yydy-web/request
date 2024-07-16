import request, { setRequest } from '@yy-web/request'
import { describe, expect, it, vi } from 'vitest'
import axiosInstance from './request'

function getAsyncFruitStock() {
  return Promise.reject(new Error('empty'))
}

describe('request fn ', () => {
  const yyRequest = request(axiosInstance, { maxConcurrentNum: 2 })
  setRequest(yyRequest)

  function getFn() {
    return yyRequest.setPath('/test/{id}').carry(1).forceCancelRepeat().get()
  }

  it ('request get carry', async () => {
    await Promise.all(
      [
        yyRequest.setPath('/test/{id}').carry(1).get(),
        yyRequest.setPath('/test/{id}').carry(2).get(),
        yyRequest.setPath('/test/{id}').carry(3).get(),
      ],
    )
  })

  it('throws on pineapples', async () => {
    await expect(() => getAsyncFruitStock()).rejects.toThrowError('empty')
  })

  it ('request get forceCancelRepeat', async () => {
    // eslint-disable-next-line unicorn/error-message
    const catchFn = vi.fn().mockRejectedValue(new Error())
    const [_, value2] = await Promise.all(
      [
        getFn().catch((err) => {
          catchFn(err)
        }),
        getFn(),
      ],
    )

    expect(catchFn).toBeCalled()
    expect(value2).toBe(1)
  })
})
