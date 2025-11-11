type EventCallback = (...args: unknown[]) => void

export class Publisher {
  private events: Record<string, EventCallback[]> = {}

  on(event: string, callback: EventCallback): void {
    if (!this.events[event])
      this.events[event] = []

    this.events[event].push(callback)
  }

  emit(event: string, ...args: unknown[]): void {
    const callbacks = this.events[event]
    if (callbacks) {
      for (const callback of callbacks)
        callback(...args)
    }
  }

  off(event: string, callback: EventCallback): void {
    const callbacks = this.events[event]
    if (callbacks)
      this.events[event] = callbacks.filter(cb => cb !== callback)
  }

  once(event: string, callback: EventCallback): void {
    const wrappedCallback: EventCallback = (...args) => {
      callback(...args)
      this.off(event, wrappedCallback)
    }
    this.on(event, wrappedCallback)
  }
}
