import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { patientsApi } from '@/api/patients'
import { consultationsApi } from '@/api/consultations'
import { reportsApi } from '@/api/reports'
import { format } from 'date-fns'
import {
  ArrowLeft, Calendar, User, FileText,
  Stethoscope, Clock, CheckCircle, ChevronRight, ActivitySquare
} from 'lucide-react'
import type { Consultation } from '@/types'

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  completed:   { color: '#059669', bg: '#ecfdf5', label: 'Completed' },
  in_progress: { color: '#2563eb', bg: '#eff6ff', label: 'In Progress' },
  scheduled:   { color: '#d97706', bg: '#fffbeb', label: 'Scheduled' },
  cancelled:   { color: '#e11d48', bg: '#fff1f2', label: 'Cancelled' },
}

export default function PatientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => patientsApi.get(id!),
    enabled: !!id
  })

  const { data: consultationsData, isLoading: consultationsLoading } = useQuery({
    queryKey: ['consultations', { patient_id: id }],
    queryFn: () => consultationsApi.list({ patient_id: id }),
    enabled: !!id
  })

  const { data: reportsData, isLoading: reportsLoading } = useQuery({
    queryKey: ['reports', { patient_id: id }],
    queryFn: () => reportsApi.list({ patient_id: id }),
    enabled: !!id
  })

  const consultations: Consultation[] = Array.isArray(consultationsData) ? consultationsData : consultationsData?.data ?? []
  const reports: any[] = Array.isArray(reportsData) ? reportsData : reportsData?.data ?? []

  if (patientLoading) {
    return (
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div className="skeleton" style={{ height: 60, width: 200 }} />
        <div className="skeleton" style={{ height: 140, width: '100%' }} />
        <div className="skeleton" style={{ height: 300, width: '100%' }} />
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="empty-state slide-up">
        <User size={40} color="var(--text-4)" />
        <h3>Patient not found</h3>
        <button className="btn mt-4" onClick={() => navigate('/app/patients')}>
          Return to Patients List
        </button>
      </div>
    )
  }

  const getInitials = (first: string, last: string) => `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase()

  return (
    <div className="fade-in">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="page-header" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => navigate('/app/patients')}
          className="btn-icon"
          style={{ width: 36, height: 36, border: '1px solid var(--border)', background: 'var(--surface)' }}
          title="Back to Patients"
        >
          <ArrowLeft size={16} color="var(--text-2)" />
        </button>
        <h2 className="page-title">Patient Profile</h2>
      </div>

      {/* ── Patient Identity Card ──────────────────────────────── */}
      <div className="card slide-up" style={{ marginBottom: 24, padding: 0, overflow: 'hidden' }}>
        <div style={{
          height: 80,
          background: 'linear-gradient(135deg, var(--blue-light) 0%, var(--teal-light) 100%)',
          borderBottom: '1px solid var(--border)',
        }} />
        <div style={{ padding: '0 24px 24px', display: 'flex', gap: 24, alignItems: 'flex-start', marginTop: -40 }}>
          <div style={{
            width: 80, height: 80, borderRadius: 16,
            background: 'var(--surface)', border: '4px solid var(--surface)',
            boxShadow: 'var(--shadow-sm)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, fontWeight: 700, color: 'var(--teal)',
          }}>
            {getInitials(patient.first_name, patient.last_name)}
          </div>
          <div style={{ flex: 1, marginTop: 44 }}>
            <h3 style={{ fontSize: 24, margin: 0, color: 'var(--text-1)', fontWeight: 700, letterSpacing: '-0.02em' }}>
              {patient.first_name} {patient.last_name}
            </h3>
            <div style={{ display: 'flex', gap: 16, marginTop: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <ActivitySquare size={14} /> MRN: {patient.medical_id || 'N/A'}
              </span>
              <span style={{ fontSize: 13, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={14} /> DOB: {patient.date_of_birth ? format(new Date(patient.date_of_birth), 'MMM d, yyyy') : 'Unknown'}
              </span>
              <span style={{ fontSize: 13, color: 'var(--text-3)', textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: 6 }}>
                <User size={14} /> {patient.gender || 'Unknown'}
              </span>
            </div>
          </div>
          <div style={{ marginTop: 44 }}>
            <button
              onClick={() => navigate('/app/consultations', { state: { patientId: patient.patient_id } })}
              className="btn btn-primary pulse"
              style={{ padding: '8px 16px' }}
            >
              <Stethoscope size={16} /> New Consultation
            </button>
          </div>
        </div>
        
        {patient.medical_history && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', background: 'var(--surface-hover)' }}>
            <h4 style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 6 }}>Known Medical History</h4>
            <p style={{ fontSize: 13, color: 'var(--text-2)', margin: 0, lineHeight: 1.6 }}>
              {patient.medical_history}
            </p>
          </div>
        )}
      </div>

      {/* ── Main Layout: Consultations & Reports ────────────────── */}
      <div className="grid-responsive grid-cols-2-equal" style={{ gap: 24 }}>
        
        {/* Past Sessions List */}
        <div className="card slide-up" style={{ animationDelay: '0.1s' }}>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 16, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={18} color="var(--blue)" /> Past Sessions
            </h3>
            <span className="badge badge-gray">{consultations.length} total</span>
          </div>
          <div style={{ padding: 0 }}>
            {consultationsLoading ? (
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 60, borderRadius: 8 }} />)}
              </div>
            ) : consultations.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 20px' }}>
                <div className="empty-state-icon"><Stethoscope size={32} color="var(--text-4)" /></div>
                <h3 style={{ fontSize: 14 }}>No past sessions found</h3>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {consultations.map(c => {
                  const st = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.scheduled
                  return (
                    <div
                      key={c.consultation_id}
                      onClick={() => navigate(`/app/consultations/${c.consultation_id}`)}
                      style={{
                        padding: '16px 22px', borderBottom: '1px solid var(--border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        cursor: 'pointer', transition: 'background 0.2s',
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>
                          {c.created_at ? format(new Date(c.created_at), 'MMM d, yyyy') : 'Unknown Date'}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4, textTransform: 'capitalize' }}>
                          {c.consultation_type?.replace('_', ' ') || 'General Visit'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{
                          fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20,
                          background: st.bg, color: st.color
                        }}>
                          {st.label}
                        </span>
                        <ChevronRight size={16} color="var(--text-4)" />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Reports List */}
        <div className="card slide-up" style={{ animationDelay: '0.2s' }}>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: 16, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={18} color="var(--teal)" /> Clinical Reports
            </h3>
            <span className="badge badge-gray">{reports.length} total</span>
          </div>
          <div style={{ padding: 0 }}>
            {reportsLoading ? (
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 60, borderRadius: 8 }} />)}
              </div>
            ) : reports.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 20px' }}>
                <div className="empty-state-icon"><FileText size={32} color="var(--text-4)" /></div>
                <h3 style={{ fontSize: 14 }}>No reports available</h3>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {reports.map(r => (
                  <div
                    key={r.report_id}
                    onClick={() => navigate(`/app/reports`)} // Ideally could navigate to specific report if supported
                    style={{
                      padding: '16px 22px', borderBottom: '1px solid var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      cursor: 'pointer', transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8, background: 'var(--teal-light)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--teal)'
                      }}>
                        <CheckCircle size={16} />
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>
                          SOAP Note
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
                          {r.created_at ? format(new Date(r.created_at), 'MMM d, yyyy') : ''}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span className={r.status === 'approved' ? 'badge badge-green' : 'badge badge-amber'}>
                        {r.status || 'draft'}
                      </span>
                      <ChevronRight size={16} color="var(--text-4)" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
