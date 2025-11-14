import { readFileSync } from 'node:fs'
import path from 'node:path'
import { RequestFactory } from '@yy-web/request'
import { describe, expect, it } from 'vitest'
import axiosInstance from './request'

describe('request fn ', () => {
  const imageBuffer = readFileSync(path.resolve(__dirname, './image.png'))
  const yyRequest = RequestFactory(axiosInstance)
  it ('data form request', async () => {
    const value = await yyRequest.setPath('/data-form').post<{ id: string }>({ test: 'test', test2: 'test2', test3: 'test3', test4: undefined })

    expect(value).toEqual({ test: 'test', test2: 'test2', test3: 'test3' })
  })

  it ('request base get', async () => {
    const value = await yyRequest.setPath('/test/get').get<{ id: number }>({ id: '1' })

    expect(value.id).toBe('1')
  })

  it ('request get carry', async () => {
    const params = await yyRequest.setPath('/test/{id}').carry('test').get<string>()
    expect(params).toBe('test')
  })

  it ('request change request', async () => {
    const value = await yyRequest.setPath('/test/get')
      .get<{ id: string }, { idValue: string }>({ id: '1' }, false, (res) => {
        return { idValue: `${res.id}test` }
      })

    expect(value).toEqual({ idValue: '1test' })
  })

  it ('request base post', async () => {
    const body = await yyRequest.setPath('/test/save').post<200 | 204>({ username: 'admin' })

    expect(body).toBe(200)
  })

  it ('request base post not admin', async () => {
    const body = await yyRequest.setPath('/test/save').post<200 | 204>({ username: 'test' })

    expect(body).toBe(204)
  })

  it ('request base put', async () => {
    const body = await yyRequest.setPath('/test/put/{id}').carry('1').put<boolean>({ username: 'admin' })

    expect(body).toBeTruthy()
  })

  it ('request base del', async () => {
    const body = await yyRequest.setPath('/test/del/{id}').carry('1').del<string>()

    expect(body).toBe('1')
  })

  it ('request base upload', async () => {
    const body = await yyRequest.setPath('/test/upload').upload<{ isFile: boolean }>(new File([imageBuffer], 'file.png'))
    expect(body.isFile).toBeTruthy()
  }, 8000)

  it ('request params upload', async () => {
    const body = await yyRequest.setPath('/test/upload').upload<{ isFile: boolean, test: string }>(new File([imageBuffer], 'file.png'), { test: '1' })
    expect(body.test).toBe('1')
  }, 8000)
})
