import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// Single axios instance — withCredentials so the httpOnly refresh-token cookie is
// sent automatically on every request (including the /auth/refresh-token call).
const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
  withCredentials: true,   // ← Required for httpOnly refresh-token cookie
})

// ── Request interceptor: attach Bearer access-token ──────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
      delete config.headers['content-type']
    }

    return config
  },
  (error) => Promise.reject(error),
)

// ── Response interceptor: handle 401 + cookie-based token refresh ─────────────
// The backend sets `safnam_refresh_token` as an httpOnly cookie on login.
// On 401, we simply call POST /api/auth/refresh-token — the cookie is sent
// automatically because withCredentials = true. We do NOT send a body.
let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: unknown) => void
}> = []

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error)
    else prom.resolve(token!)
  })
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            return api(originalRequest)
          })
          .catch((err) => Promise.reject(err))
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // Cookie is sent automatically — no body needed.
        const response = await axios.post(`${BASE_URL}/api/auth/refresh-token`, undefined, { withCredentials: true })
        const { accessToken } = response.data.data
        localStorage.setItem('accessToken', accessToken)
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
        processQueue(null, accessToken)
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return api(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        localStorage.removeItem('accessToken')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)

export default api
