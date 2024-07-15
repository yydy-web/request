import request, { dataToFormData, setRequest } from '@yy-web/request'
import { describe, expect, it } from 'vitest'
import axiosInstance from './request'

describe('request fn ', () => {
  const yyRequest = request(axiosInstance)
  setRequest(yyRequest)
  it ('data form', () => {
    const dataForm = dataToFormData({ test: 'test', test2: 'test2', test3: 'test3', test4: undefined })

    const formData = new FormData()
    formData.append('test', 'test')
    formData.append('test2', 'test2')
    formData.append('test3', 'test3')

    expect(dataForm).toEqual(formData)
  })

  it ('data form request', async () => {
    const value = await yyRequest.setPath('/data-form').post(dataToFormData({ test: 'test', test2: 'test2', test3: 'test3', test4: undefined }))

    expect(value).toEqual([['test', 'test'], ['test2', 'test2'], ['test3', 'test3']])
  })

  it ('request get carry', async () => {
    const params = await yyRequest.setPath('/test/{id}').carry(1).get()

    expect(params).not.toBeFalsy()
  })

  it ('request post', async () => {
    const res = await yyRequest.setPath('/test/save').post<number>({ username: 'admin', password: '123' })

    expect(res).toBe(200)
  })
})
