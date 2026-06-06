import { apiClient } from './client'

export const analyticsApi = {
  getSummary: (params: { period?: string; from?: string; to?: string } = {}) =>
    apiClient.get('/analytics/summary', { params }).then((r) => r.data),

  getConsultationTrends: (params = {}) =>
    apiClient.get('/analytics/consultations', { params }).then((r) => r.data),

  getPerformanceMetrics: () =>
    apiClient.get('/analytics/performance').then((r) => r.data),

  getKpis: () =>
    apiClient.get('/analytics/kpis').then((r) => r.data),
}
