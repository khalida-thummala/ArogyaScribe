import { useEffect, useState } from 'react'
import { adminApi } from '@/api/admin'
import { BarChart3, AlertTriangle } from 'lucide-react'

export default function Usage() {
  const [usage, setUsage]   = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadUsage() }, [])

  const loadUsage = async () => {
    setLoading(true)
    try {
      const data = await adminApi.getUsage()
      setUsage(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const usagePct = (used: number, limit: number) => limit > 0 ? Math.min((used / limit) * 100, 100) : 0
  const barColor = (pct: number) => pct > 90 ? '#ef4444' : pct > 70 ? '#f59e0b' : '#10b981'

  const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
    active:    { color: '#059669', bg: '#ecfdf5' },
    inactive:  { color: '#6b7280', bg: '#f3f4f6' },
    cancelled: { color: '#e11d48', bg: '#fff1f2' },
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ width: 42, height: 42, borderRadius: 11, background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BarChart3 size={20} color="#f59e0b" />
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Usage Tracking</h1>
          <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '2px 0 0' }}>Platform-wide resource consumption</p>
        </div>
      </div>

      {/* High-usage alert */}
      {!loading && usage.some(u => usagePct(u.reports_used, u.report_limit) > 85 || usagePct(u.transcriptions_used, u.transcription_limit) > 85) && (
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 12, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <AlertTriangle size={16} color="#c2410c" />
          <span style={{ fontSize: 13, color: '#9a3412', fontWeight: 500 }}>
            One or more organizations are approaching their usage limits.
          </span>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 8 }} />)}
          </div>
        ) : usage.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><BarChart3 size={36} color="var(--text-4)" /></div>
            <h3>No usage data available</h3>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  {['Organization', 'Plan', 'Reports', 'Transcriptions', 'Status'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {usage.map((item, idx) => {
                  const rPct = usagePct(item.reports_used, item.report_limit)
                  const tPct = usagePct(item.transcriptions_used, item.transcription_limit)
                  const ss   = STATUS_COLORS[item.status] ?? { color: '#6b7280', bg: '#f3f4f6' }
                  return (
                    <tr key={idx}>
                      <td style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text-1)' }}>{item.organization_name}</td>
                      <td>
                        <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: '#eff6ff', color: '#2563eb', textTransform: 'capitalize' }}>
                          {item.plan_name}
                        </span>
                      </td>
                      <td style={{ minWidth: 160 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                          <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{item.reports_used} / {item.report_limit}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: barColor(rPct) }}>{rPct.toFixed(0)}%</span>
                        </div>
                        <div style={{ height: 6, borderRadius: 20, background: 'var(--surface-2)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: 20, width: `${rPct}%`, background: barColor(rPct), transition: 'width 0.4s ease' }} />
                        </div>
                      </td>
                      <td style={{ minWidth: 160 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                          <span style={{ fontSize: 12, color: 'var(--text-2)' }}>{item.transcriptions_used} / {item.transcription_limit}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: barColor(tPct) }}>{tPct.toFixed(0)}%</span>
                        </div>
                        <div style={{ height: 6, borderRadius: 20, background: 'var(--surface-2)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: 20, width: `${tPct}%`, background: barColor(tPct), transition: 'width 0.4s ease' }} />
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: ss.bg, color: ss.color, textTransform: 'capitalize' }}>
                          {item.status}
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
