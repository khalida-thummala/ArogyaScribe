import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { format } from 'date-fns'
import { analyticsApi } from '@/api/analytics'
import { consultationsApi } from '@/api/consultations'
import type { Consultation } from '@/types'
import {
  Users, Stethoscope, FileText, Clock, TrendingUp,
  BrainCircuit, UserPlus, Download, ArrowRight, Activity
} from 'lucide-react'

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  completed:   { color: '#059669', bg: '#ecfdf5', label: 'Completed' },
  in_progress: { color: '#2563eb', bg: '#eff6ff', label: 'In Progress' },
  scheduled:   { color: '#d97706', bg: '#fffbeb', label: 'Scheduled' },
  cancelled:   { color: '#e11d48', bg: '#fff1f2', label: 'Cancelled' },
}

const QUICK_ACTIONS = [
  { icon: Stethoscope, title: 'New Consultation',  sub: 'Start recording + transcription', path: '/app/consultations', color: '#f59e0b', bg: '#fffbeb' },
  { icon: BrainCircuit,title: 'AI Analysis',       sub: 'Upload document for AI review',   path: '/app/ai-analysis',  color: '#7c3aed', bg: '#f5f3ff' },
  { icon: UserPlus,    title: 'Add Patient',        sub: 'Register a patient record',       path: '/app/patients',     color: '#10b981', bg: '#ecfdf5' },
  { icon: Download,    title: 'Export Report',      sub: 'Download as PDF',                path: '/app/reports',      color: '#3b82f6', bg: '#eff6ff' },
]

export default function DashboardPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  const { data: summaryData, isLoading: sumLoading } = useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: () => analyticsApi.getSummary({ period: '30d' }),
  })

  const { data: consultationsData, isLoading: conLoading } = useQuery({
    queryKey: ['consultations', { limit: 5 }],
    queryFn: () => consultationsApi.list({ limit: 5 }),
  })

  const { data: kpisData, isLoading: kpiLoading } = useQuery({
    queryKey: ['analytics', 'kpis'],
    queryFn: () => analyticsApi.getKpis(),
  })

  const summary = summaryData ?? {
    total_patients: 0, reports_exported: 0, ai_accuracy_rate: 0,
    time_saved_hours: 0, total_consultations: 0, monthly_trend: [],
  }
  const recentConsultations: Consultation[] = consultationsData?.data ?? []
  const kpis = kpisData ?? []

  const hourOfDay = new Date().getHours()
  const greeting = hourOfDay < 12 ? 'Good Morning' : hourOfDay < 17 ? 'Good Afternoon' : 'Good Evening'

  const STAT_CARDS = [
    { label: 'Total Patients',    value: summary.total_patients,    icon: Users,       color: '#3b82f6', bg: '#eff6ff', trend: '+12%' },
    { label: 'Consultations',     value: summary.total_consultations,icon: Stethoscope, color: '#f59e0b', bg: '#fffbeb', trend: '+8%' },
    { label: 'Reports Exported',  value: summary.reports_exported,  icon: FileText,    color: '#10b981', bg: '#ecfdf5', trend: '+24%' },
    { label: 'Time Saved',        value: `${summary.time_saved_hours}h`, icon: Clock,  color: '#7c3aed', bg: '#f5f3ff', trend: '+15%' },
  ]

  return (
    <div className="fade-in">
      {/* ── Welcome Banner ──────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, var(--teal-dark) 0%, var(--teal) 50%, var(--teal-dark) 100%)',
        borderRadius: 16, padding: 'clamp(18px, 4vw, 28px)',
        marginBottom: 24,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: 'var(--shadow-teal)',
        position: 'relative', overflow: 'hidden',
        gap: 16, flexWrap: 'wrap',
      }}>
        {/* Background decoration */}
        <div style={{
          position: 'absolute', right: -40, top: -40,
          width: 200, height: 200, borderRadius: '50%',
          background: 'rgba(255,255,255,0.06)',
        }} className="desktop-only" />
        <div style={{
          position: 'absolute', right: 80, bottom: -60,
          width: 160, height: 160, borderRadius: '50%',
          background: 'rgba(255,255,255,0.04)',
        }} className="desktop-only" />

        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>
            {greeting} 👋
          </div>
          <h1 style={{
            fontFamily: 'DM Serif Display, serif', fontSize: 26,
            color: '#fff', margin: 0, fontWeight: 400,
          }}>
            Dr. {user?.full_name?.split(' ').slice(-1)[0] ?? 'Welcome Back'}
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.65)', marginTop: 6, fontSize: 13 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <button
          onClick={() => navigate('/app/consultations')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '11px 20px', borderRadius: 12,
            background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
            color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            backdropFilter: 'blur(8px)', transition: 'all 0.2s', whiteSpace: 'nowrap',
            width: 'fit-content'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
        >
          <Stethoscope size={16} />
          Start Consultation
        </button>
      </div>

      {/* ── Stat Cards ──────────────────────────── */}
      <div className="grid-responsive grid-cols-stats" style={{ display: 'grid', gap: 16, marginBottom: 24 }}>
        {STAT_CARDS.map((s) => {
          const Icon = s.icon
          return (
            <div 
              key={s.label} 
              className="stat-card-premium" 
              style={{ '--card-grad': `linear-gradient(90deg, ${s.color} 0%, ${s.color}88 100%)` } as any}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                <div className="icon-box-premium" style={{ color: s.color }}>
                  <Icon size={20} />
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 700, 
                  color: 'var(--emerald)',
                  background: 'var(--emerald-light)', 
                  padding: '3px 10px', borderRadius: 20, 
                  display: 'flex', alignItems: 'center', gap: 4,
                  border: '1px solid var(--emerald-light)',
                  boxShadow: '0 2px 10px rgba(16,185,129,0.1)'
                }}>
                  <TrendingUp size={10} /> {s.trend}
                </span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-1)', lineHeight: 1, marginBottom: 6, letterSpacing: '-0.02em' }}>
                {sumLoading ? (
                  <div className="skeleton" style={{ width: 60, height: 28 }} />
                ) : (
                  String(s.value)
                )}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', fontFamily: 'DM Sans, sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {s.label}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Row 2: Recent Consultations + Quick Actions ── */}
      <div className="grid-responsive grid-cols-main" style={{ display: 'grid', gap: 20, marginBottom: 24 }}>
        {/* Recent Consultations */}
        <div className="card" style={{ overflow: 'hidden' }}>
            <div className="stack-on-mobile" style={{
              padding: '18px 22px 14px', borderBottom: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <h3 style={{ fontSize: 15, margin: 0 }}>Recent Consultations</h3>
                <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>Latest patient sessions</p>
              </div>
              <button className="btn btn-sm" onClick={() => navigate('/app/consultations')}
                style={{ display: 'flex', alignItems: 'center', gap: 5, width: 'fit-content' }}>
                View All <ArrowRight size={12} />
              </button>
            </div>

          <div style={{ overflowX: 'auto' }}>
            {conLoading ? (
              <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 44, borderRadius: 8 }} />)}
              </div>
            ) : recentConsultations.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🎙</div>
                <h3>No consultations yet</h3>
                <p>Start your first consultation to see recent activity here</p>
                <button className="btn btn-primary btn-sm" onClick={() => navigate('/app/consultations')}>
                  Start Consultation
                </button>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    {['Patient', 'Type', 'Status', 'Time'].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recentConsultations.map((c) => {
                    const st = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.scheduled
                    return (
                      <tr key={c.consultation_id} onClick={() => navigate(`/app/consultations/${c.consultation_id}`)}>
                        <td>
                          <div style={{ fontWeight: 600, fontSize: 13 }}>
                            {c.patient_id.substring(0, 8)}…
                          </div>
                        </td>
                        <td style={{ textTransform: 'capitalize' }}>{c.consultation_type?.replace('_', ' ')}</td>
                        <td>
                          <span style={{
                            display: 'inline-block', padding: '3px 9px', borderRadius: 20,
                            fontSize: 11.5, fontWeight: 600,
                            background: st.bg, color: st.color,
                          }}>
                            {st.label}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-3)', fontSize: 12 }}>
                          {c.created_at ? format(new Date(c.created_at), 'h:mm a') : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 15, margin: 0 }}>Quick Actions</h3>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>Jump to common tasks</p>
          </div>
          <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {QUICK_ACTIONS.map((a) => {
              const Icon = a.icon
              return (
                <button
                  key={a.path}
                  onClick={() => navigate(a.path)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '12px 16px', borderRadius: 14,
                    border: '1px solid var(--border)', background: 'var(--surface)',
                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    width: '100%',
                    boxShadow: 'var(--shadow-xs)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--surface-hover)'
                    e.currentTarget.style.borderColor = a.color + '40'
                    e.currentTarget.style.transform = 'translateX(4px)'
                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--surface)'
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.transform = 'translateX(0)'
                    e.currentTarget.style.boxShadow = 'var(--shadow-xs)'
                  }}
                >
                  <div className="icon-box-premium" style={{ color: a.color }}>
                    <Icon size={18} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-1)' }}>{a.title}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>{a.sub}</div>
                  </div>
                  <div style={{ 
                    width: 24, height: 24, borderRadius: '50%', background: 'var(--surface-2)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.6 
                  }}>
                    <ArrowRight size={12} color="var(--text-3)" />
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Row 3: Monthly Trend + KPIs ─────────── */}
      <div className="grid-responsive grid-cols-2-equal" style={{ display: 'grid', gap: 20 }}>
        {/* Monthly Trend */}
        <div className="card">
          <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={16} color="var(--teal)" />
            <h3 style={{ fontSize: 15, margin: 0 }}>Monthly Trend</h3>
          </div>
          <div style={{ padding: '20px 22px' }}>
            {sumLoading ? (
              <div className="skeleton" style={{ height: 100, width: '100%' }} />
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: 100, gap: 6 }}>
                  {(summary.monthly_trend?.length > 0
                    ? summary.monthly_trend
                    : Array(7).fill({ count: 0, month: '' })
                  ).slice(-7).map((trend: any, i: number) => {
                    const maxCount = Math.max(...(summary.monthly_trend?.map((t: any) => t.count) ?? [1]), 1)
                    const pct = trend.count > 0 ? (trend.count / maxCount) * 100 : 4
                    return (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, height: '100%', justifyContent: 'flex-end' }}>
                        <div style={{
                          width: '100%', borderRadius: '6px 6px 0 0',
                          height: `${pct}%`, minHeight: 4,
                          background: `linear-gradient(180deg, #14b8a6 0%, #0d9488 100%)`,
                          opacity: 0.8, transition: 'all 0.3s',
                          boxShadow: pct > 10 ? '0 -2px 8px rgba(13,148,136,0.3)' : 'none',
                        }} />
                        <div style={{ fontSize: 10, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
                          {trend.month || '-'}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 12 }}>Total consultations by month</p>
              </>
            )}
          </div>
        </div>

        {/* System KPIs */}
        <div className="card">
          <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: 15, margin: 0 }}>System Performance</h3>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>Key quality indicators</p>
          </div>
          <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {kpiLoading ? (
              [1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 40, borderRadius: 8 }} />)
            ) : kpis.length === 0 ? (
              <div style={{ color: 'var(--text-3)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
                No KPI data available
              </div>
            ) : kpis.map((k: any) => (
              <div key={k.metric}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)' }}>{k.metric}</span>
                  <span style={{
                    fontSize: 12, fontWeight: 700,
                    color: k.met ? '#059669' : '#d97706',
                    background: k.met ? '#ecfdf5' : '#fffbeb',
                    padding: '1px 8px', borderRadius: 20,
                    border: `1px solid ${k.met ? '#a7f3d0' : '#fde68a'}`,
                  }}>
                    {k.current}
                  </span>
                </div>
                <div style={{ height: 6, borderRadius: 20, background: 'var(--surface-2)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 20,
                    width: `${Math.min(parseFloat(k.current) || 80, 100)}%`,
                    background: k.met ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                    transition: 'width 0.6s ease',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
