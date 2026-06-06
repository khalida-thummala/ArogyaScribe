import { useQuery } from '@tanstack/react-query'
import { auditApi } from '@/api/audit'
import { format } from 'date-fns'
import Badge from '@/components/shared/Badge'

export default function AuditLogTable() {
  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => auditApi.list(),
  })

  // Backend returns { data: events[] } — map id→event_id, created_at→timestamp
  const rawEvents: any[] = (data as any)?.data ?? []
  const events = rawEvents.map((e: any) => ({
    event_id: e.id ?? e.event_id,
    timestamp: e.created_at ?? e.timestamp,
    user_id: e.user_id,
    action: e.action,
    resource: e.resource,
    ip_address: e.ip_address,
    status: e.status,
  }))

  return (
    <div>
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                {['Timestamp', 'User', 'Action', 'Resource', 'IP', 'Status'].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--text-3)' }}>Loading audit logs…</td></tr>}
              {!isLoading && events.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--text-3)' }}>No audit events found</td></tr>}
              {events.map((e: any) => (
                <tr key={e.event_id}>
                  <td style={{ color: 'var(--text-3)', fontFamily: 'monospace', fontSize: 11.5 }}>
                    {e.timestamp ? format(new Date(e.timestamp), 'MMM d, HH:mm:ss') : '—'}
                  </td>
                  <td style={{ color: 'var(--text-2)', fontFamily: 'monospace', fontSize: 11.5 }}>
                    {String(e.user_id).slice(0, 8)}…
                  </td>
                  <td style={{ color: 'var(--text-1)', fontWeight: 500 }}>
                    <code style={{ background: 'var(--surface-hover)', padding: '2px 7px', borderRadius: 4, fontSize: 11.5 }}>{e.action}</code>
                  </td>
                  <td style={{ color: 'var(--text-2)' }}>{e.resource}</td>
                  <td style={{ color: 'var(--text-3)', fontFamily: 'monospace', fontSize: 11.5 }}>{e.ip_address}</td>
                  <td>
                    <Badge variant={e.status === 'success' ? 'green' : e.status === 'info' ? 'blue' : 'red'}>{e.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
