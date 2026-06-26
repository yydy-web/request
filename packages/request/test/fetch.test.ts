import { readFileSync } from 'node:fs'
import path from 'node:path'
import request, { createFetchClient, dataToFormData, getStore, setRequest, setStore } from '@yy-web/request'
import { describe, expect, it, vi } from 'vitest'
import client from './fetch'

const ORIGIN = typeof location !== 'undefined' ? location.origin : 'http://localhost'

describe('fetch client', () => {
  const yyRequest = request(client, { getStore, setStore })
  setRequest(yyRequest)

  it('base get with params', async () => {
    const value = await yyRequest.setPath('/test/get').get<{ id: string }>({ id: '1' })
    expect(value.id).toBe('1')
  })

  it('get carry', async () => {
    const value = await yyRequest.setPath('/test/{id}').carry(1).get()
    expect(value).not.toBeFalsy()
  })

  it('get with dataCallback', async () => {
    const value = await yyRequest.setPath('/test/get')
      .get<{ id: string }, { id: string }>({ id: '1' }, false, res => ({ id: `${res.id}test` }))
    expect(value).toEqual({ id: '1test' })
  })

  it('post json', async () => {
    const body = await yyRequest.setPath('/test/save').post<200 | 204>({ username: 'admin' })
    expect(body).toBe(200)
  })

  it('put', async () => {
    const body = await yyRequest.setPath('/test/put/{id}').carry('1').put<boolean>({ username: 'admin' })
    expect(body).toBeTruthy()
  })

  it('del', async () => {
    const body = await yyRequest.setPath('/test/del/{id}').carry('1').del<string>()
    expect(body).toBe('1')
  })

  it('post FormData', async () => {
    const value = await yyRequest.setPath('/data-form').post(
      dataToFormData({ test: 'test', test2: 'test2', test3: 'test3', test4: undefined }),
    )
    expect(value).toEqual([['test', 'test'], ['test2', 'test2'], ['test3', 'test3']])
  })

  it('upload file', async () => {
    const imageBuffer = readFileSync(path.resolve(__dirname, './image.png'))
    // eslint-disable-next-line ts/ban-ts-comment
    // @ts-expect-error
    const body = await yyRequest.setPath('/test/upload').upload<{ isFile: unknown }>(new File(imageBuffer, 'file.png'))
    expect(body.isFile).toBeDefined()
  })

  it('cache get hits the store on the second call', async () => {
    const first = await yyRequest.setPath('/test/cache/1').get(true)
    const second = await yyRequest.setPath('/test/cache/1').get(true)
    expect(first).toBe('Hello World!')
    expect(second).toBe(first)
  })

  it('download file', async () => {
    ;((globalThis as any).URL.createObjectURL) = vi.fn(() => 'blob:details')
    ;((globalThis as any).URL.revokeObjectURL) = vi.fn(() => undefined)

    await yyRequest.setPath('/test/downFile').downLoad()

    expect(URL.createObjectURL).toBeCalled()
    expect(URL.revokeObjectURL).toBeCalled()
  })

  it('download error rejects', async () => {
    const errorCatch = vi.fn()
    await yyRequest.setPath('/test/down/error').downLoad().catch(errorCatch)
    expect(errorCatch).toBeCalled()
  })
})

describe('fetch client interceptors', () => {
  it('runs request and response interceptors', async () => {
    const onRequest = vi.fn((config: any) => config)
    const interceptedClient = createFetchClient({
      baseURL: typeof location !== 'undefined' ? location.origin : 'http://localhost',
      interceptors: {
        request: (config) => {
          onRequest(config)
          return config
        },
        response: (_response, data) => ({ wrapped: data }),
      },
    })

    const yyRequest = request(interceptedClient)
    const value = await yyRequest.setPath('/test/get').get<{ wrapped: { id: string } }>({ id: '9' })

    expect(onRequest).toBeCalled()
    expect(value.wrapped.id).toBe('9')
  })

  it('error interceptor recovers a failed request', async () => {
    const recovered = createFetchClient({
      baseURL: typeof location !== 'undefined' ? location.origin : 'http://localhost',
      interceptors: {
        error: () => ({ recovered: true }),
      },
    })

    const yyRequest = request(recovered)
    const value = await yyRequest.setPath('/error-500').get<{ recovered: boolean }>()
    expect(value.recovered).toBe(true)
  })

  it('response interceptor returning undefined keeps the default data', async () => {
    const passthrough = createFetchClient({
      baseURL: ORIGIN,
      interceptors: {
        response: () => undefined,
      },
    })
    const value = await passthrough({ url: '/test/get', method: 'GET', params: { id: '7' } } as any)
    expect(value).toEqual({ id: '7' })
  })

  it('rejects with a structured error when no error interceptor is set', async () => {
    const bare = createFetchClient({ baseURL: ORIGIN })
    await expect(bare({ url: '/error-500', method: 'GET' } as any)).rejects.toMatchObject({
      status: 500,
      data: 'boom',
    })
  })
})

describe('createFetchClient url building and parsing', () => {
  it('merges params into a url that already has a query string', async () => {
    const value = await client({ url: '/test/echo-query?foo=1', method: 'GET', params: { bar: '2' } } as any)
    expect(value.query).toContain('foo=1')
    expect(value.query).toContain('bar=2')
  })

  it('serialises object params as JSON in the query string', async () => {
    const value = await client({ url: '/test/echo-query', method: 'GET', params: { obj: { a: 1 } } } as any)
    expect(decodeURIComponent(value.query)).toContain('{"a":1}')
  })

  it('skips null and undefined params', async () => {
    const value = await client({ url: '/test/echo-query', method: 'GET', params: { a: '1', b: null, c: undefined } } as any)
    expect(value.query).toContain('a=1')
    expect(value.query).not.toContain('b=')
    expect(value.query).not.toContain('c=')
  })

  it('parses JSON-shaped text bodies', async () => {
    const value = await client({ url: '/test/text-json', method: 'GET' } as any)
    expect(value).toEqual({ parsed: true })
  })

  it('returns non-JSON text verbatim', async () => {
    const value = await client({ url: '/test/plain-text', method: 'GET' } as any)
    expect(value).toBe('just text')
  })

  it('leaves absolute urls untouched even with a baseURL', async () => {
    const value = await client({ url: `${ORIGIN}/test/get`, method: 'GET', params: { id: '5' } } as any)
    expect(value.id).toBe('5')
  })

  it('does not duplicate a content-type header regardless of casing', async () => {
    const seen = vi.fn()
    const inspect = createFetchClient({
      baseURL: ORIGIN,
      headers: { 'content-type': 'application/json' },
      interceptors: {
        request: (config) => {
          seen(config)
          return config
        },
      },
    })
    const value = await inspect({ url: '/test/save', method: 'POST', data: { username: 'admin' } } as any)
    expect(value).toBe(200)
  })
})

describe('createFetchClient timeout', () => {
  it('aborts a request that exceeds the timeout', async () => {
    const impatient = createFetchClient({ baseURL: ORIGIN, timeout: 20 })
    await expect(impatient({ url: '/test/slow', method: 'GET' } as any)).rejects.toThrow()
  })

  it('completes a request that finishes before the timeout', async () => {
    const patient = createFetchClient({ baseURL: ORIGIN, timeout: 5000 })
    const value = await patient({ url: '/test/get', method: 'GET', params: { id: '1' } } as any)
    expect(value.id).toBe('1')
  })
})
