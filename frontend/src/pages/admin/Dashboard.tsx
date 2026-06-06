import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminApi } from '@/api/admin'
import {
  Building2, Stethoscope, Users, FileText,
  CreditCard, ArrowUpCircle, TrendingUp, Activity
} from 'lucide-react'

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => { loadDashboard() }, [])

  const loadDashboard = async () => {
    try {
      const data = await adminApi.getDashboard()
      setStats(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const STAT_CARDS = [
    { label: 'Organizations',         value: stats?.organizations,           icon: Building2,    color: '#2563eb', bg: '#eff6ff',  path: '/admin/organizations' },
    { label: 'Doctors',               value: stats?.doctors,                 icon: Stethoscope,  color: '#0d9488', bg: '#f0fdfa',  path: '/admin/doctors'       },
    { label: 'Patients',              value: stats?.patients,                icon: Users,        color: '#10b981', bg: '#ecfdf5',  path: '/admin/patients'      },
    { label: 'Consultations',         value: stats?.consultations,           icon: Activity,     color: '#f59e0b', bg: '#fffbeb',  path: null                   },
    { label: 'Reports',               value: stats?.reports,                 icon: FileText,     color: '#7c3aed', bg: '#f5f3ff',  path: null                   },
    { label: 'Subscriptions',         value: stats?.subscriptions,           icon: CreditCard,   color: '#3b82f6', bg: '#eff6ff',  path: '/admin/subscriptions' },
    { label: 'Pending Upgrades',      value: stats?.pending_upgrade_requests,icon: ArrowUpCircle,color: '#e11d48', bg: '#fff1f2',  path: '/admin/upgrade-requests' },
  ]

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-1)', margin: 0, letterSpacing: '-0.02em' }}>
          Admin Dashboard
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>
          Platform-wide overview and management controls
        </p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        {STAT_CARDS.map(({ label, value, icon: Icon, color, bg, path }) => (
          <div
            key={label}
            onClick={() => path && navigate(path)}
            className="card slide-up"
            style={{
              padding: '20px 22px', cursor: path ? 'pointer' : 'default',
              transition: 'all 0.2s', border: '1px solid var(--border)',
            }}
            onMouseEnter={e => { if (path) { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)' } }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 11, background: bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `1px solid ${color}20`, flexShrink: 0,
              }}>
                <Icon size={20} color={color} />
              </div>
              {path && (
                <div style={{ fontSize: 11, color, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                  <TrendingUp size={11} /> View
                </div>
              )}
            </div>
            <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-1)', lineHeight: 1, letterSpacing: '-0.02em' }}>
              {loading ? <div className="skeleton" style={{ width: 60, height: 32 }} /> : (value ?? 0)}
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Pending upgrade alert */}
      {!loading && stats?.pending_upgrade_requests > 0 && (
        <div
          onClick={() => navigate('/admin/upgrade-requests')}
          style={{
            background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 12,
            padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 14,
            cursor: 'pointer', transition: 'all 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#ffedd5'}
          onMouseLeave={e => e.currentTarget.style.background = '#fff7ed'}
        >
          <div style={{ width: 36, height: 36, borderRadius: 9, background: '#fed7aa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowUpCircle size={18} color='#c2410c' />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#9a3412' }}>
              {stats.pending_upgrade_requests} Upgrade Request{stats.pending_upgrade_requests > 1 ? 's' : ''} Pending
            </div>
            <div style={{ fontSize: 12, color: '#c2410c', marginTop: 2 }}>
              Click to review and approve pending plan upgrade requests
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
