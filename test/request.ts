import axios from 'axios'

const axiosInstance = axios.create({
  url: '/',
})

axiosInstance.interceptors.response.use((data) => {
  return data.data
})

export default axiosInstance
