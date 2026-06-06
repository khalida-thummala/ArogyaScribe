import { useEffect, useState } from 'react'
import { adminApi } from '@/api/admin'
import { Users, FileText, Activity, LayoutDashboard } from 'lucide-react'

export default function OrganizationDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      const data = await adminApi.getOrganizationDashboard()
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
        <div style={{ width: 42, height: 42, borderRadius: 11, background: 'var(--blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <LayoutDashboard size={20} color="var(--blue)" />
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>
            Organization Dashboard
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '2px 0 0' }}>
            Overview of your organization's performance
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        {loading ? (
          <>
            <div className="skeleton" style={{ height: 110, borderRadius: 16 }} />
            <div className="skeleton" style={{ height: 110, borderRadius: 16 }} />
            <div className="skeleton" style={{ height: 110, borderRadius: 16 }} />
          </>
        ) : (
          <>
            <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Doctors</span>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Activity size={16} color="#10b981" />
                </div>
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-1)', lineHeight: 1 }}>
                {stats?.doctors || 0}
              </div>
            </div>

            <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Patients</span>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={16} color="#f59e0b" />
                </div>
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-1)', lineHeight: 1 }}>
                {stats?.patients || 0}
              </div>
            </div>

            <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Reports</span>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#f0fdfa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={16} color="#0d9488" />
                </div>
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-1)', lineHeight: 1 }}>
                {stats?.reports || 0}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}