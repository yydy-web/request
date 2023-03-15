import type { Emitter } from 'mitt'
import mitt from 'mitt'

declare module 'mitt' {
  export interface Emitter<Events extends Record<EventType, unknown>> {
    once<Key extends keyof Events>(type: Key, handler: Handler<Events[Key]>): void
  }
}

const emitter: Emitter<{ [key: string]: unknown }> = mitt()

emitter.once = (type, handler) => {
  const fn = (...args: any[]) => {
    emitter.off(type, fn)
    handler(args)
  }

  emitter.on(type, fn)
}

export default emitter
