import { fileInterceptorsResponseConfig } from '@yy-web/request'
import axios from 'axios'

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
