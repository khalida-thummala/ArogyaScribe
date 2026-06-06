import { apiClient } from './client'
import type { Consultation, CreateConsultationPayload, SOAPReport } from '@/types'

export const consultationsApi = {
  list: (params = {}) =>
    apiClient.get('/consultations', { params }).then((r) => r.data),

  get: (id: string) =>
    apiClient.get<Consultation>(`/consultations/${id}`).then((r) => r.data),

  create: (data: CreateConsultationPayload) =>
    apiClient.post<Consultation>('/consultations', data).then((r) => r.data),

  start: (id: string) =>
    apiClient.post(`/consultations/${id}/start`).then((r) => r.data),

  /** Send audio as multipart/form-data — backend expects UploadFile */
  end: (id: string, audioBlob: Blob) => {
    const formData = new FormData()
    formData.append('audio', audioBlob, 'recording.webm')
    return apiClient
      .post(`/consultations/${id}/end`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 360_000, // AssemblyAI polling can run up to 5 minutes
      })
      .then((r) => r.data)
  },

  getTranscription: (id: string) =>
    apiClient.get(`/consultations/${id}/transcription`).then((r) => r.data),

  getReport: (id: string) =>
    apiClient.get<SOAPReport>(`/consultations/${id}/report`).then((r) => r.data),

  updateReport: (id: string, data: Partial<SOAPReport>) =>
    apiClient.put(`/consultations/${id}/report`, data).then((r) => r.data),

  approveReport: (id: string, data: Partial<SOAPReport> = {}) =>
    apiClient.post(`/consultations/${id}/report/approve`, data).then((r) => r.data),

  generateSoap: (id: string) =>
    apiClient.post(`/consultations/${id}/generate-soap`).then((r) => r.data),

  update: (id: string, data: any) =>
    apiClient.put(`/consultations/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`/consultations/${id}`).then((r) => r.data),
}
