import AuditLogTable from '@/components/audit/AuditLogTable'
import { ShieldCheck } from 'lucide-react'

export default function AuditPage() {
  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginBottom: 16 }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7,
          background: 'var(--emerald-light)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '6px 12px', fontSize: 12, color: 'var(--emerald)', fontWeight: 600,
        }}>
          <ShieldCheck size={13} />
          HIPAA Ready
        </div>
      </div>
      <AuditLogTable />
    </div>
  )
}
