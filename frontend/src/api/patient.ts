import { apiClient } from './client'

export const patientApi = {
  getReports: () =>
    apiClient
      .get('/patient/reports')
      .then((r) => r.data),
}