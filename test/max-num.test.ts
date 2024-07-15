import request, { setRequest } from '@yy-web/request'
import { describe, it } from 'vitest'
import axiosInstance from './request'

describe('request fn ', () => {
  const yyRequest = request(axiosInstance, { maxConcurrentNum: 2 })
  setRequest(yyRequest)
  it.skip ('request get carry', async () => {
    await Promise.all(
      [
        yyRequest.setPath('/test/{id}').carry(1).get(),
        yyRequest.setPath('/test/{id}').carry(2).get(),
        yyRequest.setPath('/test/{id}').carry(3).get(),
      ],
    )
  })

  it.skip ('request get forceCancelRepeat', async () => {
    await Promise.all(
      [
        yyRequest.setPath('/test/{id}').carry(1).forceCancelRepeat().get(),
        yyRequest.setPath('/test/{id}').carry(1).forceCancelRepeat().get(),
      ],
    )
  })
})
