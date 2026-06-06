import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useQuery } from '@tanstack/react-query'
import { patientApi } from '@/api/patient'
import { format } from 'date-fns'
import {
  FileText, ArrowRight, ClipboardList, CheckCircle,
  Clock, User, LogOut
} from 'lucide-react'

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  draft:    { color: '#d97706', bg: '#fffbeb' },
  reviewed: { color: '#2563eb', bg: '#eff6ff' },
  approved: { color: '#059669', bg: '#ecfdf5' },
  signed:   { color: '#7c3aed', bg: '#f5f3ff' },
  archived: { color: '#6b7280', bg: '#f3f4f6' },
}

export default function PatientDashboard() {
  const navigate = useNavigate()
  const user     = useAuthStore((s) => s.user)
  const logout   = useAuthStore((s) => s.logout)

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['patient-reports'],
    queryFn:  () => patientApi.getReports(),
  })

  const reportsArr: any[] = Array.isArray(reports) ? reports : []
  const approved  = reportsArr.filter((r: any) => r.status === 'approved').length
  const pending   = reportsArr.filter((r: any) => r.status !== 'approved').length

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)', color: 'var(--text-1)',
      fontFamily: 'DM Sans, system-ui, sans-serif',
    }}>
      {/* Top bar */}
      <div style={{
        height: 64, background: 'var(--surface)', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(16px,5vw,40px)',
        boxShadow: 'var(--shadow-xs)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg,#0d9488,#14b8a6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={17} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>Patient Portal</div>
            <div style={{ fontSize: 11, color: 'var(--text-4)' }}>ArogyaScribe</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 500 }}>
            {user?.full_name ?? 'Patient'}
          </span>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px',
              borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)',
              color: 'var(--text-3)', fontSize: 13, fontWeight: 500, cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = '#fecdd3'; e.currentTarget.style.background = '#fff1f2' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface-2)' }}
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ maxWidth: 880, margin: '0 auto', padding: 'clamp(20px,4vw,40px) clamp(16px,5vw,40px)' }}>

        {/* Welcome banner */}
        <div style={{
          background: 'linear-gradient(135deg,#0d9488 0%,#14b8a6 50%,#0d9488 100%)',
          borderRadius: 16, padding: 'clamp(18px,4vw,28px)',
          marginBottom: 28, position: 'relative', overflow: 'hidden',
          boxShadow: '0 8px 32px rgba(13,148,136,0.25)',
        }}>
          <div style={{ position: 'absolute', right: -40, top: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 4 }}>Welcome back 👋</div>
            <h1 style={{ fontSize: 'clamp(18px,4vw,26px)', fontWeight: 700, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
              {user?.full_name ?? 'Patient'}
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', margin: 0 }}>
              View your medical reports and consultation history below.
            </p>
          </div>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Total Reports',    value: reportsArr.length, icon: FileText,    color: '#2563eb', bg: '#eff6ff' },
            { label: 'Approved',         value: approved,          icon: CheckCircle, color: '#059669', bg: '#ecfdf5' },
            { label: 'Pending Review',   value: pending,           icon: Clock,       color: '#d97706', bg: '#fffbeb' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="card" style={{ padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon size={20} color={color} />
              </div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-1)', lineHeight: 1, letterSpacing: '-0.02em' }}>
                  {isLoading ? <div className="skeleton" style={{ width: 40, height: 28 }} /> : value}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent reports */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <ClipboardList size={16} color="var(--teal)" />
              <h3 style={{ fontSize: 15, margin: 0, fontWeight: 700 }}>My Medical Reports</h3>
            </div>
            <button
              onClick={() => navigate('/patient/reports')}
              className="btn btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 5 }}
            >
              View All <ArrowRight size={12} />
            </button>
          </div>

          {isLoading ? (
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 52, borderRadius: 8 }} />)}
            </div>
          ) : reportsArr.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><FileText size={36} color="var(--text-4)" /></div>
              <h3>No reports available yet</h3>
              <p>Your doctor's notes and reports will appear here after your consultations.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    {['Date', 'Status', 'Actions'].map(h => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {reportsArr.slice(0, 5).map((report: any) => {
                    const sc = STATUS_COLORS[report.status] ?? STATUS_COLORS.draft
                    return (
                      <tr key={report.report_id}>
                        <td style={{ fontSize: 13, color: 'var(--text-2)' }}>
                          {report.created_at ? format(new Date(report.created_at), 'MMM d, yyyy') : '—'}
                        </td>
                        <td>
                          <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: sc.bg, color: sc.color, textTransform: 'capitalize' }}>
                            {report.status}
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={() => navigate(`/patient/reports/${report.report_id}`)}
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
                            <FileText size={12} /> View Report
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
    </div>
  )
}
