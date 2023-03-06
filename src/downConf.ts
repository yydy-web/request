import type { AxiosResponse } from 'axios'
import type { IAxiosRequestConfig } from './request'

export function fileInterceptorsResponseConfig(response: AxiosResponse, errorLoad?: (err: string) => void):
{ isFile: boolean; value: any[] | AxiosResponse } {
  const config = response.config as IAxiosRequestConfig
  if (config.isFile) {
    if (response.data.type === 'application/json') {
      const reader = new FileReader()
      reader.readAsText(response.data, 'utf-8')
      reader.onload = function () {
        const errorMsg = JSON.parse(reader.result as string).subMsg
        typeof errorLoad === 'function' && errorLoad(errorMsg)
      }
      return {
        isFile: false,
        value: response,
      }
    }
    return {
      isFile: true,
      value: [response.data, response.headers],
    }
  }
  return {
    isFile: false,
    value: response,
  }
}
