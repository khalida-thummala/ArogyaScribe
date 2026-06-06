import AnalyticsCharts from '@/components/analytics/AnalyticsCharts'
import { BarChart3 } from 'lucide-react'

export default function AnalyticsPage() {
  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7,
          background: 'var(--teal-light)', border: '1px solid var(--teal-glow)',
          borderRadius: 8, padding: '6px 12px', fontSize: 12, color: 'var(--teal-dark)', fontWeight: 600,
        }}>
          <BarChart3 size={13} />
          30-Day Outlook
        </div>
      </div>
      <AnalyticsCharts />
    </div>
  )
}
