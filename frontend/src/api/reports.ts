import { apiClient } from './client'
import type { ExportOptions } from '@/types'

export const reportsApi = {
  list: (params = {}) =>
    apiClient.get('/reports', { params }).then((r) => r.data),

  get: (id: string) =>
    apiClient.get(`/reports/${id}`).then((r) => r.data),

  export: (id: string, options: ExportOptions) =>
    apiClient.post(`/reports/${id}/export`, options, { responseType: 'blob' }).then((r) => r.data),

  update: (id: string, data: any) =>
    apiClient.put(`/reports/${id}`, data).then((r) => r.data),

  approve: (id: string) =>
    apiClient.post(`/reports/${id}/approve`).then((r) => r.data),

  sign: (id: string) =>
    apiClient.post(`/reports/${id}/sign`).then((r) => r.data),

  email: (id: string, payload: { recipient_email: string; subject: string; message?: string }) =>
    apiClient.post(`/reports/${id}/email`, payload).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`/reports/${id}`).then((r) => r.data),
}
