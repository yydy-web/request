import axios from 'axios'

const axiosInstance = axios.create({
  url: '/',
})

axiosInstance.interceptors.response.use((data) => {
  return data.data
}, (error) => {
  return Promise.reject(error)
})

export default axiosInstance
