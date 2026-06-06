import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

export const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 120000, // 2 min — transcription + SOAP can take up to 90s
})

// Request interceptor — attach JWT
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response interceptor — handle 401 / token refresh
apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    const isLoginOrRefresh = original.url?.includes('/auth/login') || original.url?.includes('/auth/refresh')
    
    if (error.response?.status === 401 && !original._retry && !isLoginOrRefresh) {
      original._retry = true
      try {
        const refreshToken = useAuthStore.getState().refreshToken
        if (!refreshToken) throw new Error('No refresh token')

        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refresh_token: refreshToken })
        useAuthStore.getState().setTokens(data.access_token, refreshToken!)
        original.headers.Authorization = `Bearer ${data.access_token}`
        return apiClient(original)
      } catch (err) {
        useAuthStore.getState().logout()
        if (window.location.pathname !== '/login') {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)
