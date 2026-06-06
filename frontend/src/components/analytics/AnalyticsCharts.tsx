import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '@/api/analytics'
import { TrendingUp, CheckCircle2, XCircle, Activity, Users, Timer, BarChart2 } from 'lucide-react'

const TYPE_COLORS = ['#0d9488', '#3b82f6', '#7c3aed', '#f59e0b', '#f43f5e', '#10b981']

export default function AnalyticsCharts() {
  const { data: summary, isLoading: sumLoading } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: () => analyticsApi.getSummary(),
  })
  const { data: trends, isLoading: trendLoading } = useQuery({
    queryKey: ['analytics-trends'],
    queryFn: () => analyticsApi.getConsultationTrends(),
  })
  const { data: kpis, isLoading: kpiLoading } = useQuery({
    queryKey: ['analytics-kpis'],
    queryFn: () => analyticsApi.getKpis(),
  })

  const byType: any[] = (trends as any)?.by_type ?? []
  const monthly: any[] = (trends as any)?.monthly ?? []
  const kpiList: any[] = Array.isArray(kpis) ? kpis : []
  const sum = summary as any

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ── Summary Stat Cards ─────────────── */}
      {sum && (
        <div className="grid-responsive grid-cols-3" style={{ display: 'grid', gap: 16 }}>
          {[
            { label: 'Avg Duration',    value: `${sum.avg_duration_minutes ?? 0} min`, icon: Timer,     color: '#3b82f6', bg: '#eff6ff' },
            { label: 'Reports Exported',value: sum.reports_exported ?? 0,              icon: BarChart2,  color: '#7c3aed', bg: '#f5f3ff' },
            { label: 'Time Saved Total',value: `${sum.time_saved_hours ?? 0} hrs`,     icon: TrendingUp, color: '#10b981', bg: '#ecfdf5' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="card" style={{
              padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 16,
            }}>
              <div style={{
                width: 46, height: 46, borderRadius: 12, background: bg, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `1px solid ${color}22`,
              }}>
                <Icon size={22} color={color} />
              </div>
              <div>
                <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--text-1)', lineHeight: 1 }}>
                  {sumLoading ? <div className="skeleton" style={{ width: 60, height: 26 }} /> : String(value)}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>{label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Charts Row ─────────────────────── */}
      <div className="grid-responsive grid-cols-2-equal" style={{ display: 'grid', gap: 20 }}>
        {/* Consultations by Type */}
        <div className="card">
          <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={15} color="var(--teal)" />
            <h3 style={{ fontSize: 14, margin: 0, fontFamily: 'DM Sans, sans-serif', fontWeight: 600 }}>
              Consultations by Type
            </h3>
          </div>
          <div style={{ padding: '20px 22px' }}>
            {trendLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 36, borderRadius: 8 }} />)}
              </div>
            ) : byType.length === 0 ? (
              <div className="empty-state" style={{ padding: '30px 0' }}>
                <p>No consultation type data yet</p>
              </div>
            ) : byType.map((t: any, i: number) => (
              <div key={t.label} style={{ marginBottom: 16 }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  marginBottom: 7, fontSize: 13, color: 'var(--text-2)',
                }}>
                  <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>{t.label}</span>
                  <span style={{ fontWeight: 700, color: TYPE_COLORS[i % TYPE_COLORS.length] }}>{t.pct}%</span>
                </div>
                <div style={{ height: 8, background: 'var(--surface-2)', borderRadius: 20, overflow: 'hidden' }}>
                  <div style={{
                    width: `${t.pct}%`, height: '100%', borderRadius: 20,
                    background: `linear-gradient(90deg, ${TYPE_COLORS[i % TYPE_COLORS.length]}, ${TYPE_COLORS[i % TYPE_COLORS.length]}88)`,
                    transition: 'width 0.6s ease',
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Volume Chart */}
        <div className="card">
          <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={15} color="var(--teal)" />
            <h3 style={{ fontSize: 14, margin: 0, fontFamily: 'DM Sans, sans-serif', fontWeight: 600 }}>
              Monthly Volume
            </h3>
          </div>
          <div style={{ padding: '20px 22px' }}>
            {trendLoading ? (
              <div className="skeleton" style={{ height: 120, borderRadius: 8 }} />
            ) : (
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 130 }}>
                {(monthly.length > 0 ? monthly : Array(6).fill({ label: '-', h: 0, current: false })).map((m: any, i: number) => (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{ fontSize: 10, fontWeight: 600, color: m.h > 40 ? 'var(--teal)' : 'transparent' }}>
                      {Math.round(m.h || 0)}
                    </div>
                    <div
                      title={`${m.label}: ${m.count ?? m.h ?? 0} consultations`}
                      style={{
                        width: '100%', minHeight: 4,
                        height: `${Math.max(m.h ?? 4, 4)}%`,
                        borderRadius: '6px 6px 0 0',
                        background: m.current
                          ? 'linear-gradient(180deg, #14b8a6, #0d9488)'
                          : 'linear-gradient(180deg, #99f6e4, #5eead4)',
                        boxShadow: m.h > 20 ? '0 -3px 10px rgba(13,148,136,0.2)' : 'none',
                        transition: 'height 0.5s ease',
                        cursor: 'default',
                      }}
                    />
                    <span style={{ fontSize: 10, color: 'var(--text-3)' }}>{m.label}</span>
                  </div>
                ))}
                {monthly.length === 0 && (
                  <div style={{ flex: 1, textAlign: 'center', color: 'var(--text-3)', fontSize: 12, alignSelf: 'center' }}>
                    No monthly data yet
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── KPI Table ──────────────────────── */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontSize: 14, margin: 0, fontFamily: 'DM Sans, sans-serif', fontWeight: 600 }}>
            System KPIs
          </h3>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>Key performance indicators vs. targets</p>
        </div>
        {kpiLoading ? (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 44, borderRadius: 8 }} />)}
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  {['Metric', 'Target', 'Current', 'Progress', 'Status'].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {kpiList.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--text-3)' }}>
                      No KPI data available
                    </td>
                  </tr>
                ) : kpiList.map((k: any, i: number) => {
                  const pct = Math.min(parseFloat(k.current) || 0, 100)
                  return (
                    <tr key={i}>
                      <td style={{ fontWeight: 500, color: 'var(--text-1)' }}>{k.metric}</td>
                      <td>
                        <code style={{
                          fontSize: 12, background: 'var(--surface-2)',
                          padding: '2px 7px', borderRadius: 6, border: '1px solid var(--border)',
                        }}>
                          {k.target}
                        </code>
                      </td>
                      <td>
                        <span style={{
                          fontSize: 13, fontWeight: 700,
                          color: k.met ? '#059669' : '#d97706',
                        }}>
                          {k.current}
                        </span>
                      </td>
                      <td style={{ minWidth: 120 }}>
                        <div style={{ height: 6, background: 'var(--surface-2)', borderRadius: 20, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', borderRadius: 20, width: `${pct}%`,
                            background: k.met ? 'linear-gradient(90deg, #10b981, #34d399)' : 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                            transition: 'width 0.6s ease',
                          }} />
                        </div>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '3px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 600,
                          background: k.met ? '#ecfdf5' : '#fffbeb',
                          color: k.met ? '#059669' : '#d97706',
                          border: `1px solid ${k.met ? '#a7f3d0' : '#fde68a'}`,
                        }}>
                          {k.met
                            ? <><CheckCircle2 size={11} /> Met</>
                            : <><XCircle size={11} /> Missed</>
                          }
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
