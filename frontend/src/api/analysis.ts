import { apiClient } from './client'
import type { AIAnalysis } from '@/types'

export const analysisApi = {
  /** Create a new analysis record (POST /ai-analysis) */
  create: (data: {
    upload_id: string
    source_file_name: string
    source_file_type: string
    extracted_text?: string
  }) =>
    apiClient.post<AIAnalysis>('/ai-analysis', data).then((r) => r.data),

  /** List all analysis records for the org */
  list: (params = {}) =>
    apiClient.get<AIAnalysis[]>('/ai-analysis', { params }).then((r) => r.data),

  /** Get a single analysis record by ID */
  get: (id: string) =>
    apiClient.get<AIAnalysis>(`/ai-analysis/${id}`).then((r) => r.data),
}
