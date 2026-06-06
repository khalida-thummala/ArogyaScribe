import { apiClient } from './client'
import type { Patient, CreatePatientPayload, QueryParams } from '@/types'

export const patientsApi = {
  /** Backend returns a plain array of Patient objects (no pagination wrapper) */
  list: (params: QueryParams = {}) =>
    apiClient.get<Patient[]>('/patients', { params }).then((r) => r.data),

  get: (id: string) =>
    apiClient.get<Patient>(`/patients/${id}`).then((r) => r.data),

  create: (data: CreatePatientPayload) =>
    apiClient.post<Patient>('/patients', data).then((r) => r.data),

  update: (id: string, data: Partial<Patient>) =>
    apiClient.put<Patient>(`/patients/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`/patients/${id}`).then((r) => r.data),
}
