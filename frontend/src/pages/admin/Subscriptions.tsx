import { useEffect, useState } from 'react'
import { adminApi } from '@/api/admin'
import { CreditCard, Edit2, Check, X } from 'lucide-react'
import toast from 'react-hot-toast'

const PLAN_COLORS: Record<string, { color: string; bg: string }> = {
  basic:      { color: '#2563eb', bg: '#eff6ff' },
  premium:    { color: '#7c3aed', bg: '#f5f3ff' },
  enterprise: { color: '#0d9488', bg: '#f0fdfa' },
}
const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  active:    { color: '#059669', bg: '#ecfdf5' },
  inactive:  { color: '#6b7280', bg: '#f3f4f6' },
  cancelled: { color: '#e11d48', bg: '#fff1f2' },
  trialing:  { color: '#d97706', bg: '#fffbeb' },
}

export default function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [loading, setLoading]             = useState(true)
  const [editing, setEditing]             = useState<any>(null)
  const [saving,  setSaving]              = useState(false)

  useEffect(() => { loadSubscriptions() }, [])

  const loadSubscriptions = async () => {
    setLoading(true)
    try {
      const data = await adminApi.getSubscriptions()
      setSubscriptions(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    setSaving(true)
    try {
      await adminApi.updateSubscription(editing.subscription_id, {
        plan_name:             editing.plan_name,
        report_limit:          editing.report_limit,
        transcription_limit:   editing.transcription_limit,
        status:                editing.status,
      })
      toast.success('Subscription updated')
      setEditing(null)
      await loadSubscriptions()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  const planStyle   = (p: string) => PLAN_COLORS[p]   ?? { color: '#6b7280', bg: '#f3f4f6' }
  const statusStyle = (s: string) => STATUS_COLORS[s] ?? { color: '#6b7280', bg: '#f3f4f6' }

  const usagePct = (used: number, limit: number) => limit > 0 ? Math.min((used / limit) * 100, 100) : 0

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ width: 42, height: 42, borderRadius: 11, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CreditCard size={20} color="#2563eb" />
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Subscriptions</h1>
          <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '2px 0 0' }}>{subscriptions.length} active plans</p>
        </div>
      </div>

      {/* Edit inline panel */}
      {editing && (
        <div className="card slide-up" style={{ marginBottom: 24, padding: 22, borderLeft: '4px solid var(--blue)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, margin: 0 }}>Edit Subscription — {editing.organization_name}</h3>
            <button onClick={() => setEditing(null)} style={{ padding: 6, borderRadius: 6, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-3)' }}>
              <X size={16} />
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
            {[
              { label: 'Plan Name',            key: 'plan_name',           type: 'text'   },
              { label: 'Report Limit',         key: 'report_limit',        type: 'number' },
              { label: 'Transcription Limit',  key: 'transcription_limit', type: 'number' },
            ].map(({ label, key, type }) => (
              <div key={key}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.02em' }}>{label}</label>
                <input
                  type={type}
                  className="form-control"
                  style={{ height: 38, fontSize: 13 }}
                  value={(editing as any)[key] ?? ''}
                  onChange={e => setEditing((prev: any) => ({ ...prev, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
                />
              </div>
            ))}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.02em' }}>Status</label>
              <select className="form-control" style={{ height: 38, fontSize: 13 }} value={editing.status ?? 'active'} onChange={e => setEditing((prev: any) => ({ ...prev, status: e.target.value }))}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="cancelled">Cancelled</option>
                <option value="trialing">Trialing</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
            <button onClick={() => setEditing(null)} className="btn" style={{ padding: '8px 16px' }}>Cancel</button>
            <button onClick={handleUpdate} disabled={saving} className="btn btn-primary" style={{ padding: '8px 18px', display: 'flex', alignItems: 'center', gap: 7 }}>
              <Check size={14} /> {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 8 }} />)}
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><CreditCard size={36} color="var(--text-4)" /></div>
            <h3>No subscriptions found</h3>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  {['Organization', 'Plan', 'Reports', 'Transcriptions', 'Status', 'Actions'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {subscriptions.map(sub => {
                  const ps  = planStyle(sub.plan_name)
                  const ss  = statusStyle(sub.status)
                  const rPct = usagePct(sub.reports_used, sub.report_limit)
                  const tPct = usagePct(sub.transcriptions_used, sub.transcription_limit)
                  return (
                    <tr key={sub.subscription_id}>
                      <td style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text-1)' }}>{sub.organization_name}</td>
                      <td>
                        <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: ps.bg, color: ps.color, textTransform: 'capitalize' }}>
                          {sub.plan_name}
                        </span>
                      </td>
                      <td style={{ minWidth: 140 }}>
                        <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 5 }}>{sub.reports_used} / {sub.report_limit}</div>
                        <div style={{ height: 5, borderRadius: 20, background: 'var(--surface-2)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: 20, width: `${rPct}%`, background: rPct > 85 ? '#ef4444' : '#3b82f6', transition: 'width 0.4s ease' }} />
                        </div>
                      </td>
                      <td style={{ minWidth: 140 }}>
                        <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 5 }}>{sub.transcriptions_used} / {sub.transcription_limit}</div>
                        <div style={{ height: 5, borderRadius: 20, background: 'var(--surface-2)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: 20, width: `${tPct}%`, background: tPct > 85 ? '#ef4444' : '#0d9488', transition: 'width 0.4s ease' }} />
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: ss.bg, color: ss.color, textTransform: 'capitalize' }}>
                          {sub.status}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => setEditing(sub)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
                            background: 'var(--surface-2)', color: 'var(--text-2)',
                            border: '1px solid var(--border)', fontSize: 12, fontWeight: 600,
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.color = '#2563eb'; e.currentTarget.style.borderColor = '#bfdbfe' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text-2)'; e.currentTarget.style.borderColor = 'var(--border)' }}
                        >
                          <Edit2 size={12} /> Edit
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
  )
}
