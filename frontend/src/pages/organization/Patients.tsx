import { useEffect, useState } from 'react'
import { adminApi } from '@/api/admin'
import { Users, UserCircle } from 'lucide-react'

export default function OrganizationPatients() {
  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPatients()
  }, [])

  const loadPatients = async () => {
    try {
      const data = await adminApi.getOrganizationPatients()
      setPatients(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ width: 42, height: 42, borderRadius: 11, background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Users size={20} color="#f59e0b" />
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Organization Patients</h1>
          <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '2px 0 0' }}>{patients.length} patients registered across all doctors</p>
        </div>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 50, borderRadius: 8 }} />)}
          </div>
        ) : patients.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Users size={36} color="var(--text-4)" /></div>
            <h3>No patients found</h3>
            <p>Patients registered by your doctors will appear here.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Patient Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((patient) => (
                  <tr key={patient.patient_id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)' }}>
                          <UserCircle size={18} />
                        </div>
                        <span style={{ fontWeight: 600, color: 'var(--text-1)' }}>{patient.first_name} {patient.last_name}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-2)' }}>{patient.email || '—'}</td>
                    <td style={{ color: 'var(--text-2)' }}>{patient.phone || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}