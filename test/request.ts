import axios from 'axios'
import { fileInterceptorsResponseConfig } from '@yy-web/request'

const axiosInstance = axios.create({
  url: '/',
})

axiosInstance.interceptors.response.use((data) => {
  const { isFile, value } = fileInterceptorsResponseConfig(data)
  if (isFile) {
    return value
  }
  return data.data
})

export default axiosInstance
