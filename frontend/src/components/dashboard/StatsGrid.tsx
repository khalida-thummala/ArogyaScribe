import { Users, FileText, Clock, TrendingUp } from 'lucide-react'
import { analyticsApi } from '@/api/analytics'
import { useQuery } from '@tanstack/react-query'

const STAT_CONFIGS = [
  { key: 'total_patients', label: 'Total Patients', icon: Users, color: '#5a3fad', suffix: '' },
  { key: 'total_consultations', label: 'Total Consultations', icon: FileText, color: '#0e7c4a', suffix: '' },
  { key: 'time_saved_hours', label: 'Hours Saved', icon: Clock, color: '#e67e22', suffix: 'h' },
  { key: 'ai_accuracy_rate', label: 'AI Accuracy', icon: TrendingUp, color: '#2980b9', suffix: '%' },
]

export default function StatsGrid() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: () => analyticsApi.getSummary(),
  })

  return (
    <div className="grid-cols-stats" style={{ display: 'grid', gap: 20, marginBottom: 28 }}>
      {STAT_CONFIGS.map(({ key, label, icon: Icon, color, suffix }) => (
        <div key={key} style={{
          background: 'var(--surface)',
          borderRadius: 12,
          padding: '20px 24px',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          boxShadow: 'var(--shadow-sm)',
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: `${color}18`, display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Icon size={22} color={color} />
          </div>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-1)', lineHeight: 1.2 }}>
              {isLoading ? '—' : `${(data as any)?.[key] ?? 0}${suffix}`}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{label}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
