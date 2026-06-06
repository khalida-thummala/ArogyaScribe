import { apiClient } from './client'

export interface RadiologyResponse {
  success: boolean
  patient_id: string
  report_id: string
  previous_reports_count: number

  report: {
    indication?: string
    technique?: string
    findings: string
    impression: string
    abnormalities: string[]
    comparison: string
    status: string

    snomed_codes?: Array<{
      code: string
      term: string
    }>

    loinc_codes?: Array<{
      code: string
      term: string
    }>

    critical_flags?: string[]
  }
}

export interface SimilarReport {

  patient_id: string

  patient_name?: string

  created_at?: string

  indication?: string

  technique?: string

  findings: string

  impression: string

  comparison: string

  status?: string
}

export interface SimilarReportsResponse {

  query: string

  matches: SimilarReport[]
}

export const radiologyApi = {

 analyzeXray: (

  patientId: string,

  file: File

) => {

  const formData = new FormData()

  formData.append(
    'file',
    file
  )

  return apiClient.post<RadiologyResponse>(

    `/radiology/analyze-xray`,

    formData,

    {

      params: {
        patient_id: patientId
      },

      headers: {

        'Content-Type':
          'multipart/form-data'
      },
    }

  ).then((r) => r.data)
},

  getSimilarReports: (
    query: string
  ) => {

    return apiClient.get<SimilarReportsResponse>(

      `/radiology/similar-reports`,

      {
        params: { query },
      }

    ).then((r) => r.data)
  },

  getAllReports: () => {

    return apiClient.get<{
      reports: any[]
    }>(

      `/radiology/all-reports`

    ).then((r) => r.data)
  },

  getPatientRadiologyHistory: (
    patientId: string
  ) => {

    return apiClient.get(

      `/radiology/patient-radiology-history/${patientId}`

    ).then((r) => r.data)
  },

  updateReport: (

    reportId: string,

    data: Partial<RadiologyResponse['report']>

  ) => {

    return apiClient.put(

      `/radiology/${reportId}`,

      data

    ).then((r) => r.data)
  },

  deleteReport: (
    reportId: string
  ) => {

    return apiClient.delete(

      `/radiology/${reportId}`

    ).then((r) => r.data)
  }
}