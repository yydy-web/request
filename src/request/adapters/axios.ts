import type { AxiosInstance } from 'axios'
import type { RequestTransport } from '../transport'
import axios from 'axios'

export function createAxiosTransport(instance: AxiosInstance): RequestTransport {
  return {
    execute(input, ctx) {
      return instance({
        ...input,
        ...(ctx.useCancelRepeat
          ? { cancelToken: new axios.CancelToken(c => ctx.registerCanceler(c)) }
          : {}),
      })
    },
  }
}
