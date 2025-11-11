import { RequestFactory } from '@yy-web/request'
import { describe, expect, it } from 'vitest'
import axiosInstance from './request'

describe('request fn ', () => {
  it ('data form request', async () => {
    const yyRequest = RequestFactory(axiosInstance)
    const value = await yyRequest.setPath('/data-form').post<{ id: string }>({ test: 'test', test2: 'test2', test3: 'test3', test4: undefined })

    expect(value).toEqual({ test: 'test', test2: 'test2', test3: 'test3' })
  })

  // it ('request base get', async () => {
  //   const value = await yyRequest.setPath('/test/get').get<{ id: number }>({ id: '1' })

  //   expect(value.id).toBe('1')
  // })

  // it ('request get carry', async () => {
  //   const params = await yyRequest.setPath('/test/{id}').carry(1).get()

  //   expect(params).not.toBeFalsy()
  // })

  // it ('request change request', async () => {
  //   const value = await yyRequest.setPath('/test/get')
  //     .get<{ id: string }, { id: string }>({ id: '1' }, false, (res) => {
  //       return { id: `${res.id}test` }
  //     })

  //   expect(value).toEqual({ id: '1test' })
  // })

  // it ('request base post', async () => {
  //   const body = await yyRequest.setPath('/test/save').post<200 | 204>({ username: 'admin' })

  //   expect(body).toBe(200)
  // })

  // it ('request base put', async () => {
  //   const body = await yyRequest.setPath('/test/put/{id}').carry('1').put<boolean>({ username: 'admin' })

  //   expect(body).toBeTruthy()
  // })

  // it ('request base del', async () => {
  //   const body = await yyRequest.setPath('/test/del/{id}').carry('1').del<string>()

  //   expect(body).toBe('1')
  // })

  // it ('request base upload', async () => {
  //   const imageBuffer = readFileSync(path.resolve(__dirname, './image.png'))
  //   // eslint-disable-next-line ts/ban-ts-comment
  //   // @ts-expect-error
  //   const body = await yyRequest.setPath('/test/upload').upload<{ isFile: unknown }>(new File(imageBuffer, 'file.png'))

  //   expect(body.isFile).toBeDefined()
  // })

  // it ('request params upload', async () => {
  //   const imageBuffer = readFileSync(path.resolve(__dirname, './image.png'))
  //   // eslint-disable-next-line ts/ban-ts-comment
  //   // @ts-expect-error
  //   const body = await yyRequest.setPath('/test/upload').upload<{ isFile: unknown }>(new File(imageBuffer, 'file.png'), { test: '1' })

  //   expect(body.isFile).toBeDefined()
  // })

  // it ('request base down file', async () => {
  //   // eslint-disable-next-line no-restricted-globals
  //   ;((global as any).URL.createObjectURL) = vi.fn(() => 'details')
  //   // eslint-disable-next-line no-restricted-globals
  //   ;((global as any).URL.revokeObjectURL) = vi.fn(() => 'details')

  //   // eslint-disable-next-line ts/ban-ts-comment
  //   // @ts-expect-error
  //   window.navigator.msSaveBlob = vi.fn(() => 'details')
  //   await yyRequest.setPath('/test/downFile').downLoad()

  //   expect(URL.createObjectURL).toBeCalled()
  //   expect(URL.revokeObjectURL).toBeCalled()
  // })

  // it ('request base down error file', async () => {
  //   const errorCatch = vi.fn()
  //   await yyRequest.setPath('/test/down/error').downLoad().catch(errorCatch)

  //   expect(errorCatch).toBeCalled()
  // })
})
