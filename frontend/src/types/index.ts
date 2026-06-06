// ─── Auth ────────────────────────────────────────────────────────────────────
export interface User {
  user_id: string
  email: string
  full_name: string
  license_number: string
  organization_id: string
  role: 'admin' | 'practitioner' | 'supervisor' | 'viewer' | 'super_admin' | 'patient' | 'organization_admin'
  status: 'active' | 'inactive' | 'suspended' | 'pending_verification'
  twofa_enabled: boolean
  timezone: string
  language_preference: string
  phone?: string
  created_at: string
  last_login: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterPayload {
  email: string
  password: string
  full_name: string
  license_number: string
  organization_name: string
  phone: string
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
  token_type: string
  user: {
    id: string
    email: string
    full_name: string
    role: string
    organization_id: string
  }
}

// ─── Patient ─────────────────────────────────────────────────────────────────
export interface Patient {
  patient_id: string
  user_id: string
  organization_id: string
  first_name: string
  last_name: string
  date_of_birth: string
  gender: 'male' | 'female' | 'other'
  medical_id: string
  email?: string
  phone?: string
  address_line1?: string
  address_line2?: string
  city?: string
  state_province?: string
  postal_code?: string
  country?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  medical_history?: string
  allergies?: string
  current_medications?: string
  insurance_provider?: string
  insurance_policy?: string
  blood_type?: string
  height_cm?: number
  weight_kg?: number
  insurance_verified?: boolean
  status: 'active' | 'inactive' | 'archived'
  created_at: string
  updated_at: string
  deleted_at?: string
}

export interface CreatePatientPayload {
  first_name: string
  last_name: string
  date_of_birth: string
  gender: 'male' | 'female' | 'other'
  medical_id: string
  email?: string
  phone?: string
  address_line1?: string
  address_line2?: string
  city?: string
  state_province?: string
  postal_code?: string
  country?: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  medical_history?: string
  allergies?: string
  current_medications?: string
  insurance_provider?: string
  insurance_policy?: string
  blood_type?: string
  height_cm?: number
  weight_kg?: number
  insurance_verified?: boolean
}

// ─── Consultation ─────────────────────────────────────────────────────────────
export type ConsultationStatus = 'scheduled' | 'pending' | 'in_progress' | 'processing' | 'completed' | 'failed' | 'failed_soap' | 'failed_transcription' | 'cancelled'
export type TranscriptionStatus = 'pending' | 'in_progress' | 'completed' | 'failed'

export interface Consultation {
  consultation_id: string
  patient_id: string
  user_id: string
  organization_id: string
  consultation_type: string
  status: ConsultationStatus
  chief_complaint: string
  scheduled_at?: string
  started_at?: string
  ended_at?: string
  duration_minutes?: number
  audio_file_id?: string
  audio_duration_seconds?: number
  audio_bitrate?: string
  audio_checksum?: string
  transcription_status: TranscriptionStatus
  transcription_text?: string
  transcription_confidence?: number
  notes?: string
  created_at: string
}

export interface CreateConsultationPayload {
  patient_id: string
  consultation_type: string
  chief_complaint: string
  scheduled_at?: string
}

// ─── SOAP Report ──────────────────────────────────────────────────────────────
export type ReportStatus = 'draft' | 'reviewed' | 'approved' | 'signed' | 'archived'

export interface SOAPReport {
  report_id: string
  consultation_id: string
  user_id: string
  organization_id: string
  subjective: string
  objective: string
  assessment: string
  plan: string
  medications: Medication[]
  follow_up_needed: boolean
  follow_up_days?: number
  status: ReportStatus
  created_at: string
  updated_at: string
  approved_at?: string
  approved_by?: string
}

export interface Medication {
  name: string
  dosage: string
  frequency: string
  duration: string
  route: string
  interaction_status: 'safe' | 'warning' | 'contraindicated'
}

// ─── AI Analysis ─────────────────────────────────────────────────────────────
export type AnalysisStatus = 'pending' | 'analyzing' | 'completed' | 'failed'
export type FileType = 'pdf' | 'docx' | 'image'

export interface AIAnalysis {
  analysis_id: string
  upload_id: string
  user_id: string
  organization_id: string
  source_file_name: string
  source_file_type: FileType
  extracted_text?: string
  analysis_status: AnalysisStatus
  status?: AnalysisStatus // For backward compatibility if needed
  generated_subjective?: string
  generated_objective?: string
  generated_assessment?: string
  generated_plan?: string
  generated_medications?: Medication[]
  confidence_score?: number
  key_entities?: MedicalEntity[]
  comparison_data?: ComparisonData
  analysis_timestamp?: string
  reviewed_at?: string
  approved_at?: string
  approved_by?: string
  notes?: string
}


export interface MedicalEntity {
  entity: string
  type: 'diagnosis' | 'medication' | 'test' | 'procedure' | 'symptom'
  confidence: number
}

export interface ComparisonData {
  additions: string[]
  deletions: string[]
  modifications: string[]
  discrepancies: string[]
}

// ─── Export ───────────────────────────────────────────────────────────────────
export type ExportFormat = 'pdf' | 'docx'

export interface ExportOptions {
  format: ExportFormat
  include_signatures?: boolean
  include_metadata?: boolean
  watermark?: string
  password?: string
}

export interface ExportResult {
  report_id: string
  export_format: ExportFormat
  file_name: string
  file_size_bytes: number
  download_url: string
  expires_at: string
}

// ─── Analytics ────────────────────────────────────────────────────────────────
export interface AnalyticsSummary {
  total_consultations: number
  total_patients: number
  avg_documentation_minutes: number
  ai_accuracy_rate: number
  reports_exported: number
  time_saved_hours: number
  consultations_by_type: Record<string, number>
  monthly_trend: { month: string; count: number }[]
}

// ─── Audit ────────────────────────────────────────────────────────────────────
export interface AuditEvent {
  id: string
  created_at: string
  user_id: string
  action: string
  resource: string
  ip_address: string
  status: 'success' | 'failed' | 'info'
}

// ─── Pagination ───────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  total_pages: number
}

export interface QueryParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}
