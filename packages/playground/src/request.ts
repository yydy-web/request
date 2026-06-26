import request, { fileInterceptorsResponseConfig, getStore, hasStore, setRequest, setStore } from '@yy-web/request'
import axios from 'axios'

const service = axios.create({
  baseURL: '/',
})

service.interceptors.response.use((response: any) => {
  const { isFile, value } = fileInterceptorsResponseConfig(response)
  if (isFile)
    return value

  return response.data
})

const yyRequest = request(service, {
  getStore,
  hasStore,
  setStore,
})
setRequest(yyRequest)

export default yyRequest
