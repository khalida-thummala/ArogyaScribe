import { useEffect, useState } from 'react'
import { adminApi } from '@/api/admin'
import { Users, Search } from 'lucide-react'

export default function Patients() {
  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading]   = useState(true)
  const [search,  setSearch]    = useState('')

  useEffect(() => { loadPatients() }, [])

  const loadPatients = async () => {
    setLoading(true)
    try {
      const data = await adminApi.getPatients()
      setPatients(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = patients.filter(p => {
    const q = search.toLowerCase()
    return (
      p.first_name?.toLowerCase().includes(q) ||
      p.last_name?.toLowerCase().includes(q)  ||
      p.email?.toLowerCase().includes(q)       ||
      p.phone?.includes(q)
    )
  })

  const AVATAR_COLORS = [
    ['#eff6ff','#2563eb'], ['#ecfdf5','#059669'], ['#f5f3ff','#7c3aed'],
    ['#fffbeb','#d97706'], ['#fff1f2','#e11d48'], ['#f0fdfa','#0d9488'],
  ]
  const getAvatarColor = (name: string) => AVATAR_COLORS[(name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length]

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 11, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={20} color="#10b981" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Patients</h1>
            <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '2px 0 0' }}>{patients.length} total patients</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: 360, marginBottom: 20 }}>
        <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email or phone…"
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
            <div className="empty-state-icon"><Users size={36} color="var(--text-4)" /></div>
            <h3>{search ? 'No matching patients' : 'No patients found'}</h3>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  {['Patient', 'Gender', 'Phone', 'Email', 'Status'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const initials = `${p.first_name?.[0] ?? ''}${p.last_name?.[0] ?? ''}`.toUpperCase()
                  const [avatarBg, avatarColor] = getAvatarColor(p.first_name ?? 'A')
                  return (
                    <tr key={p.patient_id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: 9, background: avatarBg, color: avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, fontWeight: 700 }}>
                            {initials}
                          </div>
                          <span style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text-1)' }}>{p.first_name} {p.last_name}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--text-2)', textTransform: 'capitalize' }}>{p.gender || '—'}</td>
                      <td style={{ fontSize: 13, color: 'var(--text-2)' }}>{p.phone || '—'}</td>
                      <td style={{ fontSize: 13, color: 'var(--text-2)' }}>{p.email || '—'}</td>
                      <td>
                        <span style={{
                          fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                          background: p.status === 'active' ? '#ecfdf5' : '#f3f4f6',
                          color:      p.status === 'active' ? '#059669' : '#6b7280',
                          textTransform: 'capitalize',
                        }}>
                          {p.status || 'active'}
                        </span>
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
