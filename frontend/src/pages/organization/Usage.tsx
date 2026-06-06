import { useEffect, useState } from 'react'
import { adminApi } from '@/api/admin'
import { ShieldCheck, Activity, Users, Stethoscope, FileText } from 'lucide-react'

export default function OrganizationUsage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUsage()
  }, [])

  const loadUsage = async () => {
    try {
      const data = await adminApi.getOrganizationUsage()
      setStats(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ width: 42, height: 42, borderRadius: 11, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ShieldCheck size={20} color="#4b5563" />
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Usage Analytics</h1>
          <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '2px 0 0' }}>Monitor your organization's platform utilization</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        {loading ? (
          <>
            <div className="skeleton" style={{ height: 110, borderRadius: 16 }} />
            <div className="skeleton" style={{ height: 110, borderRadius: 16 }} />
            <div className="skeleton" style={{ height: 110, borderRadius: 16 }} />
            <div className="skeleton" style={{ height: 110, borderRadius: 16 }} />
          </>
        ) : (
          <>
            <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Doctors</span>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Activity size={16} color="#3b82f6" />
                </div>
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-1)', lineHeight: 1 }}>{stats?.doctors || 0}</div>
            </div>

            <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Patients</span>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={16} color="#f59e0b" />
                </div>
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-1)', lineHeight: 1 }}>{stats?.patients || 0}</div>
            </div>

            <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Consultations</span>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Stethoscope size={16} color="#8b5cf6" />
                </div>
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-1)', lineHeight: 1 }}>{stats?.consultations || 0}</div>
            </div>

            <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Reports</span>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f0fdfa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={16} color="#14b8a6" />
                </div>
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-1)', lineHeight: 1 }}>{stats?.reports || 0}</div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}