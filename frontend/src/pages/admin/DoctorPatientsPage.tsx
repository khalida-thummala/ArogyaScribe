import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { adminApi } from '@/api/admin'
import { ArrowLeft, Users, FileText } from 'lucide-react'

export default function DoctorPatientsPage() {
  const { doctorId } = useParams()
  const navigate     = useNavigate()
  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    if (doctorId) loadPatients()
  }, [doctorId])

  const loadPatients = async () => {
    setLoading(true)
    try {
      const data = await adminApi.getDoctorPatients(doctorId!)
      setPatients(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const AVATAR_COLORS = [
    ['#eff6ff','#2563eb'], ['#ecfdf5','#059669'], ['#f5f3ff','#7c3aed'],
    ['#fffbeb','#d97706'], ['#fff1f2','#e11d48'], ['#f0fdfa','#0d9488'],
  ]
  const getAvatarColor = (name: string) => AVATAR_COLORS[(name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length]

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button
          onClick={() => navigate('/admin/doctors')}
          style={{ width: 36, height: 36, borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
        >
          <ArrowLeft size={15} color="var(--text-2)" />
        </button>
        <div style={{ width: 42, height: 42, borderRadius: 11, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Users size={20} color="#10b981" />
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Doctor's Patients</h1>
          <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '2px 0 0' }}>{patients.length} patients linked</p>
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 52, borderRadius: 8 }} />)}
          </div>
        ) : patients.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Users size={36} color="var(--text-4)" /></div>
            <h3>No patients found for this doctor</h3>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  {['Patient', 'Email', 'Phone', 'Actions'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {patients.map(patient => {
                  const initials = `${patient.first_name?.[0] ?? ''}${patient.last_name?.[0] ?? ''}`.toUpperCase()
                  const [avatarBg, avatarColor] = getAvatarColor(patient.first_name ?? 'A')
                  return (
                    <tr key={patient.patient_id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: 9, background: avatarBg, color: avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, fontWeight: 700 }}>
                            {initials}
                          </div>
                          <span style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text-1)' }}>{patient.first_name} {patient.last_name}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--text-2)' }}>{patient.email || '—'}</td>
                      <td style={{ fontSize: 13, color: 'var(--text-2)' }}>{patient.phone || '—'}</td>
                      <td>
                        <button
                          onClick={() => navigate(`/admin/patients/${patient.patient_id}/consultations`)}
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
                          <FileText size={12} /> View History
                        </button>
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
