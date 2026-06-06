import { apiClient } from './client'
import type { AuthResponse, LoginCredentials, RegisterPayload } from '@/types'

export const authApi = {
  login: (data: LoginCredentials) =>
    apiClient.post<AuthResponse>('/auth/login', data).then((r) => r.data),

  register: (data: RegisterPayload) =>
    apiClient.post('/auth/register', data).then((r) => r.data),

  logout: () => apiClient.post('/auth/logout').then((r) => r.data),

  refresh: (refresh_token: string) =>
    apiClient.post('/auth/refresh', { refresh_token }).then((r) => r.data),

  getProfile: () => apiClient.get('/auth/me').then((r) => r.data),

  verifyEmail: (token: string) => apiClient.get(`/auth/verify?token=${token}`).then((r) => r.data),

  updateProfile: (data: any) => apiClient.put('/auth/me', data).then((r) => r.data),

  updateSecurity: (data: any) => apiClient.put('/auth/security', data).then((r) => r.data),

  updateOrganization: (data: any) => apiClient.put('/auth/organization', data).then((r) => r.data),

  verifyOtp: (user_id: string, otp: string) =>
    apiClient.post('/auth/verify-otp', { user_id, otp }).then((r) => r.data),

  forgotPassword: (email: string) =>
    apiClient.post('/auth/forgot-password', { email }).then((r) => r.data),

  resetPassword: (token: string | null, new_password: string, email?: string) =>
    apiClient.post('/auth/reset-password', { token, new_password, email }).then((r) => r.data),
}
