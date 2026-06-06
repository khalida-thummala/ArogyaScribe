import SettingsPanel from '@/components/settings/SettingsPanel'
import { Shield } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7,
          background: 'var(--surface-2)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '6px 12px', fontSize: 12, color: 'var(--text-3)', fontWeight: 600,
        }}>
          <Shield size={13} />
          Compliance Locked
        </div>
      </div>
      <SettingsPanel />
    </div>
  )
}
