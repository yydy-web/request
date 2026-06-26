import request, { clearStore, getStore, hasStore, setStore } from '@yy-web/request'
import { beforeEach, describe, expect, it, vi } from 'vitest'

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('concurrent cache de-duplication', () => {
  beforeEach(() => {
    clearStore()
  })

  it('collapses concurrent identical cache GETs into a single request', async () => {
    const service = vi.fn().mockResolvedValue('shared')
    const yyRequest = request(service as any, { getStore, hasStore, setStore })

    const first = yyRequest.setPath('/dedup/ok').get<string>(true)
    const second = yyRequest.setPath('/dedup/ok').get<string>(true)

    const [a, b] = await Promise.all([first, second])

    expect(a).toBe('shared')
    expect(b).toBe('shared')
    expect(service).toHaveBeenCalledTimes(1)
  })

  it('rejects every in-flight duplicate when the leading request fails', async () => {
    const control = deferred<string>()
    const service = vi.fn().mockReturnValueOnce(control.promise)
    const yyRequest = request(service as any, { getStore, hasStore, setStore })

    const first = yyRequest.setPath('/dedup/fail').get<string>(true)
    const second = yyRequest.setPath('/dedup/fail').get<string>(true)

    control.reject(new Error('upstream down'))

    await expect(first).rejects.toThrow('upstream down')
    await expect(second).rejects.toThrow('upstream down')
    expect(service).toHaveBeenCalledTimes(1)
  }, 5000)

  it('does not permanently poison the cache key after a failure', async () => {
    const control = deferred<string>()
    const service = vi.fn()
      .mockReturnValueOnce(control.promise)
      .mockResolvedValueOnce('recovered')
    const yyRequest = request(service as any, { getStore, hasStore, setStore })

    const failing = yyRequest.setPath('/dedup/recover').get<string>(true)
    control.reject(new Error('temporary'))
    await expect(failing).rejects.toThrow('temporary')

    const retry = await yyRequest.setPath('/dedup/recover').get<string>(true)
    expect(retry).toBe('recovered')
    expect(service).toHaveBeenCalledTimes(2)
  }, 5000)
})
