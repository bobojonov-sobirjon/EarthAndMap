import axios from 'axios'
import { shouldTrackProgress, trackRequestEnd, trackRequestStart } from './pending'

/** Dev: Vite proxy `/api` → 8009. Prod: same-origin `/api`. */
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const client = axios.create({
  baseURL: API_BASE_URL,
})

function markStart(config) {
  if (!shouldTrackProgress(config) || config._retry || config._progress) return
  config._progress = true
  trackRequestStart()
}

function markEnd(config) {
  if (!config?._progress) return
  config._progress = false
  trackRequestEnd()
}

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  if (config.data && !(config.data instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json'
  }
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }
  const lang = localStorage.getItem('buxoro-gis-lang') || 'uz'
  config.headers['X-Lang'] = lang
  config.params = { ...(config.params || {}), lang }
  markStart(config)
  return config
})

client.interceptors.response.use(
  (res) => {
    markEnd(res.config)
    return res
  },
  async (error) => {
    if (error.response?.status === 401) {
      const refresh = localStorage.getItem('refresh_token')
      if (refresh && !error.config._retry) {
        error.config._retry = true
        try {
          const { data } = await axios.post(`${API_BASE_URL}/auth/refresh/`, { refresh })
          localStorage.setItem('access_token', data.access)
          error.config.headers.Authorization = `Bearer ${data.access}`
          return client(error.config)
        } catch {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
        }
      }
    }
    markEnd(error.config)
    return Promise.reject(error)
  },
)

export default client
