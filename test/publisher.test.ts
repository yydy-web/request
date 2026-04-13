import { describe, expect, it, vi } from 'vitest'
import { Publisher } from '../src/request/Publisher'

describe('publisher', () => {
  it('on, emit, off, and once', () => {
    const pub = new Publisher()
    const cb = vi.fn()
    pub.on('e', cb)
    pub.on('e', cb)
    pub.emit('e', 1, 2)
    expect(cb).toHaveBeenCalledTimes(2)
    expect(cb).toHaveBeenLastCalledWith(1, 2)

    pub.off('e', cb)
    pub.emit('e')
    expect(cb).toHaveBeenCalledTimes(2)

    const onceCb = vi.fn()
    pub.once('x', onceCb)
    pub.emit('x', 'ok')
    pub.emit('x')
    expect(onceCb).toHaveBeenCalledTimes(1)
    expect(onceCb).toHaveBeenCalledWith('ok')
  })

  it('emit with no subscribers is a no-op', () => {
    const pub = new Publisher()
    expect(() => pub.emit('missing')).not.toThrow()
  })

  it('off with no subscribers is a no-op', () => {
    const pub = new Publisher()
    expect(() => pub.off('missing', vi.fn())).not.toThrow()
  })
})
