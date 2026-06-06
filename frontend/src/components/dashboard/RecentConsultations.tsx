import { useQuery } from '@tanstack/react-query'
import { consultationsApi } from '@/api/consultations'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import Badge from '@/components/shared/Badge'

export default function RecentConsultations() {
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({
    queryKey: ['consultations', { limit: 5 }],
    queryFn: () => consultationsApi.list({ limit: 5 }),
  })

  const consultations = Array.isArray(data) ? data : (data as any)?.data ?? []

  return (
    <div style={{
      background: 'var(--surface)', borderRadius: 12,
      border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)',
      overflow: 'hidden',
    }}>
      <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-1)' }}>Recent Consultations</h3>
        <button onClick={() => navigate('/app/consultations')} style={{ fontSize: 12, color: 'var(--teal)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
          View all →
        </button>
      </div>
      <div>
        {isLoading && (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>Loading…</div>
        )}
        {!isLoading && consultations.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>No consultations yet</div>
        )}
        {consultations.map((c: any) => (
          <div
            key={c.consultation_id}
            onClick={() => navigate(`/app/consultations`)}
            style={{
              padding: '14px 24px', display: 'flex', alignItems: 'center', gap: 14,
              borderBottom: '1px solid var(--border)', cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = '')}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {c.chief_complaint || 'General Consultation'}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>
                {c.consultation_type} · {c.created_at ? format(new Date(c.created_at), 'MMM d, h:mm a') : ''}
              </div>
            </div>
            <Badge variant={c.status === 'completed' ? 'green' : c.status === 'in_progress' ? 'amber' : 'gray'}>
              {c.status}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  )
}
