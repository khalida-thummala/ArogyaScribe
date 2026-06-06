import { useNavigate } from 'react-router-dom'
import { UserPlus, Mic, FileText, BarChart2 } from 'lucide-react'

const ACTIONS = [
  { label: 'New Patient', description: 'Register a new patient record', icon: UserPlus, color: '#5a3fad', path: '/patients' },
  { label: 'Start Consultation', description: 'Begin a new consultation session', icon: Mic, color: '#0e7c4a', path: '/consultations' },
  { label: 'View Reports', description: 'Browse and export SOAP reports', icon: FileText, color: '#e67e22', path: '/reports' },
  { label: 'Analytics', description: 'Review performance metrics', icon: BarChart2, color: '#2980b9', path: '/analytics' },
]

export default function QuickActions() {
  const navigate = useNavigate()

  return (
    <div style={{ marginBottom: 28 }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)', marginBottom: 14 }}>Quick Actions</h3>
      <div className="grid-cols-stats" style={{ display: 'grid', gap: 14 }}>
        {ACTIONS.map(({ label, description, icon: Icon, color, path }) => (
          <button
            key={label}
            onClick={() => navigate(path)}
            style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 12, padding: '18px 16px', cursor: 'pointer',
              textAlign: 'left', transition: 'all 0.15s', boxShadow: 'var(--shadow-sm)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = color
              e.currentTarget.style.boxShadow = `0 0 0 3px ${color}18`
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border)'
              e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              background: `${color}18`, display: 'flex',
              alignItems: 'center', justifyContent: 'center', marginBottom: 12,
            }}>
              <Icon size={20} color={color} />
            </div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-1)', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-3)', lineHeight: 1.4 }}>{description}</div>
          </button>
        ))}
      </div>
    </div>
  )
}
