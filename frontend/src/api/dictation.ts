import { apiClient } from './client'

export interface DictationReport {
  patient_name: string
  patient_age: string
  patient_gender: string
  date: string
  doctor_name: string
  indication: string
  history: string
  findings: string
  impression: string
  plan: string
  medications?: string[]
  follow_up?: string
  notes?: string
  content?: Record<string, any>
  report_type?: string
  _error?: string
}

export interface DictationResult {
  success: boolean
  transcript: string
  transcription_confidence?: number
  report: DictationReport | null
  letterhead_b64?: string
  letterhead_mime?: string
  generated_at?: string
  error?: string
}

export const dictationApi = {
  /**
   * Transcribe audio + generate structured report (returns JSON).
   */
  transcribeAndReport: async (
    audioBlob: Blob,
    letterheadFile?: File | null,
    patientContext?: string,
    templateId?: string
  ): Promise<DictationResult> => {
    const form = new FormData()
    // Explicitly reconstruct the Blob to ensure type is preserved when retrieved from IDB
    const isText = audioBlob.type === 'text/plain'
    const validMimeType = isText ? 'text/plain' : (audioBlob.type || 'audio/webm')
    const safeAudioBlob = new Blob([audioBlob], { type: validMimeType })
    
    form.append('audio', safeAudioBlob, isText ? 'transcript.txt' : 'recording.webm')
    if (letterheadFile) {
      form.append('letterhead', letterheadFile, letterheadFile.name)
    }
    form.append('patient_context', patientContext || '')
    if (templateId) {
      form.append('template_id', templateId)
    }

    const res = await apiClient.post('/dictation/transcribe-and-report', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000, // 2 minutes — transcription can be slow
    })
    return res.data
  },

  /**
   * Full pipeline → returns a PDF blob for download/print.
   */
  generatePdf: async (
    audioBlob: Blob,
    letterheadFile?: File | null,
    patientContext?: string,
    templateId?: string
  ): Promise<Blob> => {
    const form = new FormData()
    form.append('audio', audioBlob, 'recording.webm')
    if (letterheadFile) {
      form.append('letterhead', letterheadFile, letterheadFile.name)
    }
    form.append('patient_context', patientContext || '')
    form.append('template_id', templateId || 'minimal')

    const res = await apiClient.post('/dictation/generate-pdf', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      responseType: 'blob',
      timeout: 120000,
    })
    return res.data
  },

  /**
   * Generate PDF from an already-processed report (no re-transcription).
   */
  generatePdfFromReport: async (
    report: DictationReport,
    letterheadFile?: File | null,
    templateId?: string
  ): Promise<Blob> => {
    const form = new FormData()
    // Send report as JSON field
    form.append('report_data', JSON.stringify(report))
    if (letterheadFile) {
      form.append('letterhead', letterheadFile, letterheadFile.name)
    }
    form.append('template_id', templateId || 'minimal')

    const res = await apiClient.post('/dictation/generate-pdf-from-report', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      responseType: 'blob',
      timeout: 60000,
    })
    return res.data
  },

  /**
   * Save the final edited report to the DB.
   */
  save: async (
    report: DictationReport,
    letterheadFile?: File | null,
    reportId?: string | null,
    patientId?: string | null
  ): Promise<{ success: boolean; report_id: string }> => {
    const form = new FormData()
    form.append('report_data', JSON.stringify(report))
    if (reportId) {
      form.append('report_id', reportId)
    }
    if (patientId) {
      form.append('patient_id', patientId)
    }
    if (letterheadFile) {
      form.append('letterhead', letterheadFile, letterheadFile.name)
    }

    const res = await apiClient.post('/dictation/save', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data
  },
}
