import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { format } from 'date-fns'
import { ArrowLeft, FileText, User, Stethoscope, ClipboardList, CheckSquare, LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

const SECTION_CONFIG = [
  { key: 'subjective',  label: 'S — Subjective',  icon: User,          color: '#2563eb', bg: '#eff6ff',  desc: 'Patient-reported symptoms and history' },
  { key: 'objective',   label: 'O — Objective',   icon: Stethoscope,   color: '#059669', bg: '#ecfdf5',  desc: 'Clinical observations and exam findings' },
  { key: 'assessment',  label: 'A — Assessment',  icon: ClipboardList, color: '#e11d48', bg: '#fff1f2',  desc: 'Diagnosis and clinical reasoning' },
  { key: 'plan',        label: 'P — Plan',        icon: CheckSquare,   color: '#7c3aed', bg: '#f5f3ff',  desc: 'Treatment plan and next steps' },
]

import PatientReportChat from '@/components/patient/PatientReportChat'

const renderSoapField = (value: any) => {
  if (!value) return <span style={{ fontStyle: 'italic', color: 'var(--text-4)' }}>Not recorded.</span>;

  let parsedValue = value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed === 'object' && parsed !== null) {
        parsedValue = parsed;
      }
    } catch (e) {
      // Keep as string
    }
  }

  if (typeof parsedValue === 'object' && parsedValue !== null) {
    const entries = Object.entries(parsedValue).filter(([_, v]) => v !== null && v !== '');
    
    if (entries.length === 0) {
      return <span style={{ fontStyle: 'italic', color: 'var(--text-4)' }}>Not recorded.</span>;
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {entries.map(([k, v]) => {
          const formattedKey = k.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
          return (
            <div key={k}>
              <strong style={{ display: 'block', color: 'var(--text-1)', marginBottom: '4px', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{formattedKey}</strong>
              <div style={{ color: 'var(--text-2)', fontSize: '14px', lineHeight: 1.6 }}>
                {typeof v === 'object' ? (
                  <pre style={{ fontFamily: 'inherit', margin: 0, whiteSpace: 'pre-wrap', background: 'var(--surface-2)', padding: '12px', borderRadius: '8px', fontSize: '13px' }}>
                    {JSON.stringify(v, null, 2)}
                  </pre>
                ) : (
                  String(v)
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return <span style={{ whiteSpace: 'pre-wrap', fontSize: '14px', color: 'var(--text-2)', lineHeight: 1.75 }}>{String(parsedValue)}</span>;
};

export default function PatientReportPage() {
  const { reportId } = useParams()
  const navigate     = useNavigate()
  const user         = useAuthStore((s) => s.user)
  const logout       = useAuthStore((s) => s.logout)

  const { data: report, isLoading, isError } = useQuery({
    queryKey: ['patient-report', reportId],
    queryFn:  () => apiClient.get(`/patient/reports/${reportId}`).then(r => r.data),
    enabled:  !!reportId,
  })

  const handleLogout = () => { logout(); navigate('/login') }

  const handleDownloadPDF = async () => {
    try {
      const response = await apiClient.get(`/patient/reports/${reportId}/pdf`, {
        responseType: 'blob'
      })
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Report_${reportId?.slice(0, 8) || 'download'}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.parentNode?.removeChild(link)
    } catch (error) {
      console.error("Failed to download PDF", error)
      alert("Failed to download PDF. Please try again later.")
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text-1)', fontFamily: 'DM Sans, system-ui, sans-serif' }}>
      {/* Top bar */}
      <div style={{
        height: 64, background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(16px,5vw,40px)', boxShadow: 'var(--shadow-xs)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg,#0d9488,#14b8a6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={17} color="#fff" />
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>Patient Portal</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>{user?.full_name ?? 'Patient'}</span>
          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
            borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)',
            color: 'var(--text-3)', fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = '#fecdd3'; e.currentTarget.style.background = '#fff1f2' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface-2)' }}
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 850, margin: '0 auto', padding: 'clamp(20px,4vw,40px) clamp(16px,5vw,40px)' }}>
        {/* Header Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => navigate('/patient/reports')}
              style={{ width: 36, height: 36, borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
            >
              <ArrowLeft size={15} color="var(--text-2)" />
            </button>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Report View</h1>
          </div>
          {report && !isLoading && (
            <button
              onClick={handleDownloadPDF}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
                borderRadius: 8, border: 'none', background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
                color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(13, 148, 136, 0.2)'
              }}
            >
              <FileText size={16} /> Download PDF
            </button>
          )}
        </div>

        {/* Loading */}
        {isLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="skeleton" style={{ height: 600, borderRadius: 12, background: '#fff' }} />
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="card" style={{ padding: 40, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚠️</div>
            <h3 style={{ color: 'var(--text-1)' }}>Could not load report</h3>
            <p style={{ color: 'var(--text-3)', fontSize: 13 }}>This report may not be available or you may not have access to it.</p>
            <button onClick={() => navigate('/patient/reports')} className="btn btn-primary" style={{ marginTop: 16 }}>Back to Reports</button>
          </div>
        )}

        {/* Report Document (A4 Letterhead Style) */}
        {report && !isLoading && (
          <div style={{ 
            background: '#fff', 
            borderRadius: 12, 
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01)',
            border: '1px solid #f3f4f6',
            padding: 'clamp(30px, 6vw, 60px)',
            position: 'relative'
          }}>
            {/* Watermark / Brand Header */}
            <div style={{ borderBottom: '2px solid #0d9488', paddingBottom: 24, marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h1 style={{ fontSize: 28, fontWeight: 800, color: '#111827', letterSpacing: '-0.02em', margin: 0 }}>Medical Report</h1>
                <p style={{ fontSize: 14, color: '#6b7280', margin: '4px 0 0' }}>{report.report_type ? report.report_type.replace('_', ' ').toUpperCase() : 'CLINICAL CONSULTATION'}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>ArogyaScribe Platform</div>
                {report.created_at && (
                  <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                    Date: {format(new Date(report.created_at), 'MMMM d, yyyy')}
                  </div>
                )}
                <div style={{ fontSize: 12, fontWeight: 700, padding: '4px 10px', borderRadius: 12, background: report.status === 'approved' ? '#ecfdf5' : '#fffbeb', color: report.status === 'approved' ? '#059669' : '#d97706', display: 'inline-block', marginTop: 8, border: `1px solid ${report.status === 'approved' ? '#a7f3d0' : '#fde68a'}`, textTransform: 'uppercase' }}>
                  {report.status ?? 'draft'}
                </div>
              </div>
            </div>

            {/* Doctor & Patient Info */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 40, background: '#f9fafb', padding: 20, borderRadius: 8 }}>
              <div>
                <div style={{ fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: 4 }}>Consulting Doctor</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>Dr. {report.doctor?.name || 'Unknown'}</div>
                {report.doctor?.license_number && <div style={{ fontSize: 13, color: '#4b5563' }}>License: {report.doctor.license_number}</div>}
              </div>
              <div>
                <div style={{ fontSize: 12, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: 4 }}>Patient</div>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>{user?.full_name ?? 'Patient'}</div>
                <div style={{ fontSize: 13, color: '#4b5563' }}>ID: {report.patient_id?.slice(0, 8).toUpperCase()}...</div>
              </div>
            </div>

            {/* Report Content */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
              
              {/* SOAP Sections */}
              {SECTION_CONFIG.map(({ key, label, color }) => (
                <div key={key}>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: color, margin: '0 0 12px 0', borderBottom: '1px solid #f3f4f6', paddingBottom: 8 }}>
                    {label}
                  </h2>
                  <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.7 }}>
                    {renderSoapField((report as any)[key])}
                  </div>
                </div>
              ))}

              {/* Medications */}
              {Array.isArray(report.medications) && report.medications.length > 0 && (
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0d9488', margin: '0 0 12px 0', borderBottom: '1px solid #f3f4f6', paddingBottom: 8 }}>
                    Prescribed Medications
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {report.medications.map((med: any, idx: number) => (
                      <div key={idx} style={{ background: '#f0fdfa', borderRadius: 8, padding: '12px 16px', display: 'flex', flexWrap: 'wrap', gap: 16, border: '1px solid #ccfbf1' }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: '#115e59', minWidth: 140 }}>{med.name}</div>
                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                          {[
                            { label: 'Dosage',    val: med.dosage    },
                            { label: 'Frequency', val: med.frequency },
                            { label: 'Duration',  val: med.duration  },
                            { label: 'Route',     val: med.route     },
                          ].map(({ label, val }) => val ? (
                            <div key={label} style={{ fontSize: 13 }}>
                              <span style={{ color: '#0f766e', fontWeight: 600 }}>{label}: </span>
                              <span style={{ color: '#115e59' }}>{val}</span>
                            </div>
                          ) : null)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Follow-up */}
              {report.follow_up_needed && (
                <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, padding: '16px', display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <ClipboardList size={20} color="#d97706" />
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#92400e' }}>Follow-up Required</div>
                    <div style={{ fontSize: 14, color: '#b45309', marginTop: 2 }}>
                      {report.follow_up_days ? `Please schedule a follow-up visit in ${report.follow_up_days} day(s).` : 'Please schedule a follow-up visit as advised by your doctor.'}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Signature Area */}
            <div style={{ marginTop: 60, paddingTop: 20, borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end' }}>
              <div style={{ textAlign: 'center', width: 200 }}>
                <div style={{ borderBottom: '1px solid #374151', height: 40, marginBottom: 8 }}></div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Dr. {report.doctor?.name || 'Unknown'}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Electronic Signature</div>
              </div>
            </div>

            {/* Chat component */}
            {reportId && <PatientReportChat reportId={reportId} />}
          </div>
        )}
      </div>
    </div>
  )
}


