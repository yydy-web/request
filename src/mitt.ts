type EventCallback = (...args: any[]) => void

export class Publisher {
  private events: Record<string, EventCallback[]> = {}

  // 订阅事件
  on(event: string, callback: EventCallback): void {
    if (!this.events[event])
      this.events[event] = []

    this.events[event].push(callback)
  }

  // 发布事件
  emit(event: string, ...args: any[]): void {
    const callbacks = this.events[event]
    if (callbacks) {
      for (const callback of callbacks)
        callback(...args)
    }
  }

  // 取消订阅事件
  off(event: string, callback: EventCallback): void {
    const callbacks = this.events[event]
    if (callbacks)
      this.events[event] = callbacks.filter(cb => cb !== callback)
  }

  // 仅订阅一次事件
  once(event: string, callback: EventCallback): void {
    const wrappedCallback: EventCallback = (...args) => {
      callback(...args)
      this.off(event, wrappedCallback)
    }
    this.on(event, wrappedCallback)
  }
}
