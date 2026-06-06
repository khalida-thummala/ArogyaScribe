import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApi } from '@/api/admin'
import { Stethoscope, Users, Search } from 'lucide-react'

const ROLE_COLORS: Record<string, { color: string; bg: string }> = {
  practitioner: { color: '#0d9488', bg: '#f0fdfa' },
  supervisor:   { color: '#7c3aed', bg: '#f5f3ff' },
  admin:        { color: '#2563eb', bg: '#eff6ff' },
}
const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  active:               { color: '#059669', bg: '#ecfdf5' },
  inactive:             { color: '#6b7280', bg: '#f3f4f6' },
  pending_verification: { color: '#d97706', bg: '#fffbeb' },
  suspended:            { color: '#e11d48', bg: '#fff1f2' },
}

export default function Doctors() {
  const [doctors, setDoctors]   = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [search,  setSearch]    = useState('')
  const navigate                = useNavigate()

  useEffect(() => { loadDoctors() }, [])

  const loadDoctors = async () => {
    setLoading(true)
    try {
      const data = await adminApi.getDoctors()
      setDoctors(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = doctors.filter(d => {
    const q = search.toLowerCase()
    return (
      d.full_name?.toLowerCase().includes(q) ||
      d.email?.toLowerCase().includes(q) ||
      d.role?.toLowerCase().includes(q)
    )
  })

  const roleStyle   = (r: string) => ROLE_COLORS[r]   ?? { color: '#6b7280', bg: '#f3f4f6' }
  const statusStyle = (s: string) => STATUS_COLORS[s] ?? { color: '#6b7280', bg: '#f3f4f6' }

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 11, background: '#f0fdfa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Stethoscope size={20} color="#0d9488" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Doctors</h1>
            <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '2px 0 0' }}>{doctors.length} registered practitioners</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: 360, marginBottom: 20 }}>
        <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email or role…"
          className="form-control"
          style={{ paddingLeft: 32 }}
        />
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 52, borderRadius: 8 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Stethoscope size={36} color="var(--text-4)" /></div>
            <h3>{search ? 'No matching doctors' : 'No doctors registered'}</h3>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  {['Doctor', 'Email', 'Role', 'Status', 'Organization', 'Actions'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(doc => {
                  const rs = roleStyle(doc.role)
                  const ss = statusStyle(doc.status)
                  const initials = doc.full_name?.split(' ').map((n: string) => n[0]).slice(0,2).join('').toUpperCase() || '??'
                  return (
                    <tr key={doc.user_id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg,#0d9488,#14b8a6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, fontWeight: 700, color: '#fff' }}>
                            {initials}
                          </div>
                          <span style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text-1)' }}>{doc.full_name}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--text-2)' }}>{doc.email}</td>
                      <td>
                        <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: rs.bg, color: rs.color, textTransform: 'capitalize' }}>
                          {doc.role}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: ss.bg, color: ss.color, textTransform: 'capitalize' }}>
                          {doc.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-3)', fontFamily: 'monospace' }}>
                        {doc.organization_id?.slice(0, 8) ?? '—'}…
                      </td>
                      <td>
                        <button
                          onClick={() => navigate(`/admin/doctors/${doc.user_id}/patients`)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
                            background: '#f0fdfa', color: '#0d9488',
                            border: '1px solid #99f6e4', fontSize: 12, fontWeight: 600,
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = '#ccfbf1'}
                          onMouseLeave={e => e.currentTarget.style.background = '#f0fdfa'}
                        >
                          <Users size={12} /> Patients
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
