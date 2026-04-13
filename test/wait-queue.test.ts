import { describe, expect, it, vi } from 'vitest'
import WaitQueue from '../src/request/WaitQueue'

describe('waitQueue', () => {
  it('queues when pool is at capacity then runs deferred work via dequeue', async () => {
    vi.useFakeTimers()
    const q = new WaitQueue(1)
    const blocker = vi.fn()
    q.add(blocker)

    const second = vi.fn()
    q.fnExec(second)
    expect(second).not.toHaveBeenCalled()

    q.delete(blocker)
    q.fnExec(vi.fn())

    await vi.runAllTimersAsync()
    expect(second).toHaveBeenCalledOnce()
    vi.useRealTimers()
  })
})
