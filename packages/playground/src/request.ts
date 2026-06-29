import request, {
  createFetchClient,
  fileInterceptorsResponseConfig,
  getStore,
  hasStore,
  setRequest,
  setStore,
} from '@yy-web/request'
import axios from 'axios'

// --- axios transport ------------------------------------------------------
const service = axios.create({ baseURL: '/' })
service.interceptors.response.use((response: any) => {
  const { isFile, value } = fileInterceptorsResponseConfig(response)
  return isFile ? value : response.data
})

export const axiosRequest = request(service, { getStore, hasStore, setStore })

// --- native fetch transport -----------------------------------------------
function getToken() {
  return localStorage.getItem('token') ?? ''
}

const fetchClient = createFetchClient({
  baseURL: '',
  interceptors: {
    // fetch 没有 axios 那种 .interceptors.request.use，token 要在创建时注入。
    request: (config) => {
      const token = getToken()
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        }
      }
      return config
    },
  },
})
export const fetchRequest = request(fetchClient, { getStore, hasStore, setStore })

// --- concurrency-limited transport (for the maxConcurrentNum demo) ---------
export const limitedRequest = request(createFetchClient({ baseURL: '' }), {
  maxConcurrentNum: 2,
})

setRequest(axiosRequest)

export default axiosRequest
