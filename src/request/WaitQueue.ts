export default class WaitQueue {
  private requestPool: Set<() => void>
  private queue: (() => void)[]
  private maxConcurrentNum: number

  constructor(maxConcurrentNum = 5) {
    this.requestPool = new Set()
    this.queue = []
    this.maxConcurrentNum = maxConcurrentNum
  }

  add(callback: () => void) {
    this.requestPool.add(callback)
  }

  delete(callback: () => void) {
    this.requestPool.delete(callback)
  }

  enqueue(callback: () => void) {
    this.queue.push(callback)
  }

  dequeue() {
    const callback = this.queue.shift()
    if (callback) {
      this.requestPool.add(callback)
      setTimeout(callback)
    }
  }

  fnExec(fn: (...args: any[]) => void) {
    const isOverflow = this.requestPool.size >= this.maxConcurrentNum
    if (isOverflow) {
      this.enqueue(fn)
      return
    }
    this.add(fn)
    fn()
    this.delete(fn)
    this.dequeue()
  }
}
