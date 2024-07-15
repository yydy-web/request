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

  it ('data form2', () => {
    const formData = new FormData()
    formData.append('test', 'test')
    formData.append('test2', 'test2')
    formData.append('test3', 'test3')
    const dataForm = dataToFormData(formData)

    expect(dataForm).toEqual(formData)
  })

  it ('data form request', async () => {
    const value = await yyRequest.setPath('/data-form').post(dataToFormData({ test: 'test', test2: 'test2', test3: 'test3', test4: undefined }))

    expect(value).toEqual([['test', 'test'], ['test2', 'test2'], ['test3', 'test3']])
  })

  it ('request base get', async () => {
    const value = await yyRequest.setPath('/test/get').get<{ id: number }>({ id: '1' })

    expect(value.id).toBe('1')
  })

  it ('request get carry', async () => {
    const params = await yyRequest.setPath('/test/{id}').carry(1).get()

    expect(params).not.toBeFalsy()
  })

  it ('request change request', async () => {
    const value = await yyRequest.setPath('/test/get')
      .get<{ id: string }, { id: string }>({ id: '1' }, false, (res) => {
        return { id: `${res.id}test` }
      })

    expect(value).toEqual({ id: '1test' })
  })

  it ('request base post', async () => {
    const body = await yyRequest.setPath('/test/save').post<200 | 204>({ username: 'admin' })

    expect(body).toBe(200)
  })

  it ('request base put', async () => {
    const body = await yyRequest.setPath('/test/put/{id}').carry('1').put<boolean>({ username: 'admin' })

    expect(body).toBeTruthy()
  })

  it ('request base del', async () => {
    const body = await yyRequest.setPath('/test/del/{id}').carry('1').del<string>()

    expect(body).toBe('1')
  })
})
