import axios from 'axios'
import request, { fileInterceptorsResponseConfig, getStore, setRequest, setStore } from '@yy-web/request'

const service = axios.create({
  baseURL: '/api',
})

service.interceptors.response.use((response: any) => {
  const { isFile, value } = fileInterceptorsResponseConfig(response)
  if (isFile)
    return value

  return response.data
})

const yyRequest = request(service, {
  getStore, setStore,
})
setRequest(yyRequest)

export default yyRequest
