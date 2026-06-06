import { useEffect, useState } from 'react'
import { adminApi } from '@/api/admin'
import { ArrowUpCircle, CheckCircle2, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

export default function UpgradeRequests() {
  const [requests, setRequests]   = useState<any[]>([])
  const [loading, setLoading]     = useState(true)
  const [approving, setApproving] = useState<string | null>(null)

  useEffect(() => { loadRequests() }, [])

  const loadRequests = async () => {
    setLoading(true)
    try {
      const data = await adminApi.getUpgradeRequests()
      setRequests(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const approveRequest = async (requestId: string) => {
    setApproving(requestId)
    try {
      await adminApi.approveUpgradeRequest(requestId)
      toast.success('Upgrade request approved')
      await loadRequests()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Approval failed')
    } finally {
      setApproving(null)
    }
  }

  const pending  = requests.filter(r => r.status === 'pending')
  const approved = requests.filter(r => r.status !== 'pending')

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ width: 42, height: 42, borderRadius: 11, background: '#fff1f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowUpCircle size={20} color="#e11d48" />
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Upgrade Requests</h1>
          <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '2px 0 0' }}>
            {pending.length} pending · {approved.length} processed
          </p>
        </div>
      </div>

      {/* Pending count badge */}
      {!loading && pending.length > 0 && (
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 12, padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <Clock size={16} color="#c2410c" />
          <span style={{ fontSize: 13, color: '#9a3412', fontWeight: 600 }}>
            {pending.length} request{pending.length > 1 ? 's' : ''} awaiting approval
          </span>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 56, borderRadius: 8 }} />)}
          </div>
        ) : requests.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><ArrowUpCircle size={36} color="var(--text-4)" /></div>
            <h3>No upgrade requests</h3>
            <p>All organizations are satisfied with their current plans.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  {['Organization', 'Current Plan', 'Requested Plan', 'Message', 'Status', 'Action'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map(req => (
                  <tr key={req.request_id}>
                    <td style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text-1)' }}>
                      {req.organization_id?.slice(0, 8) ?? '—'}…
                    </td>
                    <td>
                      <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: '#eff6ff', color: '#2563eb', textTransform: 'capitalize' }}>
                        {req.current_plan}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: '#f5f3ff', color: '#7c3aed', textTransform: 'capitalize' }}>
                        {req.requested_plan}
                      </span>
                    </td>
                    <td style={{ fontSize: 12.5, color: 'var(--text-2)', maxWidth: 220 }}>
                      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {req.message || '—'}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
                        background: req.status === 'pending' ? '#fffbeb' : '#ecfdf5',
                        color:      req.status === 'pending' ? '#d97706' : '#059669',
                        textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: 5, width: 'fit-content',
                      }}>
                        {req.status === 'pending' ? <Clock size={11} /> : <CheckCircle2 size={11} />}
                        {req.status}
                      </span>
                    </td>
                    <td>
                      {req.status === 'pending' ? (
                        <button
                          onClick={() => approveRequest(req.request_id)}
                          disabled={approving === req.request_id}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            padding: '6px 14px', borderRadius: 8, cursor: approving === req.request_id ? 'not-allowed' : 'pointer',
                            background: '#ecfdf5', color: '#059669',
                            border: '1px solid #a7f3d0', fontSize: 12, fontWeight: 600,
                            transition: 'all 0.15s', opacity: approving === req.request_id ? 0.7 : 1,
                          }}
                          onMouseEnter={e => { if (approving !== req.request_id) e.currentTarget.style.background = '#d1fae5' }}
                          onMouseLeave={e => e.currentTarget.style.background = '#ecfdf5'}
                        >
                          <CheckCircle2 size={12} />
                          {approving === req.request_id ? 'Approving…' : 'Approve'}
                        </button>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#059669', fontWeight: 600 }}>
                          <CheckCircle2 size={13} /> Approved
                        </div>
                      )}
                    </td>
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
