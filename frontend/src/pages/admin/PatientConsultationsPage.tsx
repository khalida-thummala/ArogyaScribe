import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { adminApi } from '@/api/admin'
import { ArrowLeft, Stethoscope, FileText } from 'lucide-react'
import { format } from 'date-fns'

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  completed:            { color: '#059669', bg: '#ecfdf5', label: 'Completed'            },
  in_progress:          { color: '#2563eb', bg: '#eff6ff', label: 'In Progress'          },
  scheduled:            { color: '#d97706', bg: '#fffbeb', label: 'Scheduled'            },
  cancelled:            { color: '#e11d48', bg: '#fff1f2', label: 'Cancelled'            },
  failed_transcription: { color: '#e11d48', bg: '#fff1f2', label: 'Transcription Failed' },
  failed_soap:          { color: '#e11d48', bg: '#fff1f2', label: 'SOAP Failed'          },
}

export default function PatientConsultationsPage() {
  const { patientId } = useParams()
  const navigate      = useNavigate()
  const [consultations, setConsultations] = useState<any[]>([])
  const [loading, setLoading]             = useState(true)

  useEffect(() => {
    if (patientId) loadConsultations()
  }, [patientId])

  const loadConsultations = async () => {
    setLoading(true)
    try {
      const data = await adminApi.getPatientConsultations(patientId!)
      setConsultations(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button
          onClick={() => navigate(-1)}
          style={{ width: 36, height: 36, borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
        >
          <ArrowLeft size={15} color="var(--text-2)" />
        </button>
        <div style={{ width: 42, height: 42, borderRadius: 11, background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Stethoscope size={20} color="#f59e0b" />
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Consultation History</h1>
          <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '2px 0 0' }}>{consultations.length} sessions found</p>
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 52, borderRadius: 8 }} />)}
          </div>
        ) : consultations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Stethoscope size={36} color="var(--text-4)" /></div>
            <h3>No consultations found for this patient</h3>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  {['Type', 'Chief Complaint', 'Status', 'Created At', 'Actions'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {consultations.map(c => {
                  const st = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.scheduled
                  return (
                    <tr key={c.consultation_id}>
                      <td style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text-1)', textTransform: 'capitalize' }}>
                        {c.consultation_type?.replace('_', ' ')}
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--text-2)', maxWidth: 220 }}>
                        <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.chief_complaint || '—'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: st.bg, color: st.color }}>
                          {st.label}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-3)' }}>
                        {c.created_at ? format(new Date(c.created_at), 'MMM d, yyyy, h:mm a') : '—'}
                      </td>
                      <td>
                        {c.status === 'completed' && (
                          <button
                            onClick={() => navigate(`/app/consultations/${c.consultation_id}/soap`)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 6,
                              padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
                              background: '#f5f3ff', color: '#7c3aed',
                              border: '1px solid #ddd6fe', fontSize: 12, fontWeight: 600,
                              transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#ede9fe'}
                            onMouseLeave={e => e.currentTarget.style.background = '#f5f3ff'}
                          >
                            <FileText size={12} /> View SOAP
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
