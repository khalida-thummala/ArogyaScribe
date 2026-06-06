import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { patientApi } from '@/api/patient'
import { format } from 'date-fns'
import { FileText, ArrowLeft, ArrowRight, User, LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'

const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  draft:    { color: '#d97706', bg: '#fffbeb' },
  reviewed: { color: '#2563eb', bg: '#eff6ff' },
  approved: { color: '#059669', bg: '#ecfdf5' },
  signed:   { color: '#7c3aed', bg: '#f5f3ff' },
  archived: { color: '#6b7280', bg: '#f3f4f6' },
}

export default function MyReportsPage() {
  const navigate = useNavigate()
  const user     = useAuthStore((s) => s.user)
  const logout   = useAuthStore((s) => s.logout)

  const { data, isLoading, isError } = useQuery({
    queryKey: ['patient-reports'],
    queryFn:  () => patientApi.getReports(),
  })

  const reports: any[] = Array.isArray(data) ? data : []

  const handleLogout = () => { logout(); navigate('/login') }

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
      <div style={{ maxWidth: 880, margin: '0 auto', padding: 'clamp(20px,4vw,40px) clamp(16px,5vw,40px)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <button
            onClick={() => navigate('/patient/dashboard')}
            style={{ width: 36, height: 36, borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
          >
            <ArrowLeft size={15} color="var(--text-2)" />
          </button>
          <div style={{ width: 42, height: 42, borderRadius: 11, background: '#f0fdfa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FileText size={20} color="#0d9488" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>My Reports</h1>
            <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '2px 0 0' }}>{reports.length} total reports</p>
          </div>
        </div>

        {/* Table */}
        <div className="card" style={{ overflow: 'hidden' }}>
          {isLoading ? (
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 52, borderRadius: 8 }} />)}
            </div>
          ) : isError ? (
            <div className="empty-state">
              <div className="empty-state-icon" style={{ fontSize: 32 }}>⚠️</div>
              <h3>Could not load reports</h3>
              <p>There was a problem fetching your reports. Please try again later.</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><FileText size={36} color="var(--text-4)" /></div>
              <h3>No reports available</h3>
              <p>Your medical reports will appear here after your consultations are completed.</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    {['Report ID', 'Date', 'Status', 'Actions'].map(h => <th key={h}>{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report: any) => {
                    const sc = STATUS_COLORS[report.status] ?? STATUS_COLORS.draft
                    return (
                      <tr key={report.report_id}>
                        <td style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text-3)' }}>
                          {report.report_id?.slice(0, 12)}…
                        </td>
                        <td style={{ fontSize: 13, color: 'var(--text-2)' }}>
                          {report.created_at ? format(new Date(report.created_at), 'MMM d, yyyy, h:mm a') : '—'}
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
                            View <ArrowRight size={12} />
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
