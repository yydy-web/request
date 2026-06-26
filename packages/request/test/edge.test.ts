import request, { dataToFormData, setRequest } from '@yy-web/request'
import { describe, expect, it, vi } from 'vitest'
import axiosInstance from './request'

describe('dataToFormData edge cases', () => {
  it('json-encodes non-string values and drops undefined', () => {
    const form = dataToFormData({
      name: 'admin',
      age: 18,
      profile: { city: 'sh' },
      skip: undefined,
    })

    expect(form.get('name')).toBe('admin')
    expect(form.get('age')).toBe('18')
    expect(form.get('profile')).toBe('{"city":"sh"}')
    expect(form.has('skip')).toBe(false)
  })
})

describe('request fluent guards', () => {
  const yyRequest = request(axiosInstance)
  setRequest(yyRequest)

  it('carry before setPath does not throw', () => {
    expect(() => yyRequest.carry(1)).not.toThrow()
  })

  it('collapses duplicate slashes in the path', async () => {
    const value = await yyRequest.setPath('//test//get').get<{ id: string }>({ id: '42' })
    expect(value.id).toBe('42')
  })
})

describe('downLoad filename handling', () => {
  function trackDownloads() {
    const names: string[] = []
    ;((globalThis as any).URL.createObjectURL) = vi.fn(() => 'blob:x')
    ;((globalThis as any).URL.revokeObjectURL) = vi.fn(() => undefined)
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      names.push(this.download)
    })
    return { names, clickSpy }
  }

  it('parses the filename from content-disposition', async () => {
    const { names } = trackDownloads()

    const yyRequest = request(axiosInstance)
    setRequest(yyRequest)
    await yyRequest.setPath('/test/download-named').downLoad()

    expect(names[0]).toBe('hello-world.png')
    vi.restoreAllMocks()
  })

  it('prefers an explicitly provided filename', async () => {
    const { names } = trackDownloads()

    const yyRequest = request(axiosInstance)
    setRequest(yyRequest)
    await yyRequest.setPath('/test/downFile').downLoad({}, 'get', 'custom.bin')

    expect(names[0]).toBe('custom.bin')
    vi.restoreAllMocks()
  })
})
