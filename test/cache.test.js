import { getStore, setStore } from '@yy-web/request'
import { describe, it, expect } from 'vitest'

describe('store', () => {
  it('getStore', () => {
    const keys = 'test1'

    expect(getStore(keys)).toBeUndefined()
  })

  it ('setStore num', () => {
    const keys = 'test2'
    const value = 2
    setStore(keys, value)
    expect(getStore(keys)).toBe(value)
  })

  it ('setStore obj', () => {
    const keys = 'test3'
    const value = {  a: 1, b: 2, c: 3 }
    setStore(keys, value)
    expect(getStore(keys)).toBe(value)
  })

  it ('setStore string', () => {
    const keys = 'test4'
    const value = "string"
    setStore(keys, value)
    expect(getStore(keys)).toBe(value)
  })
})
