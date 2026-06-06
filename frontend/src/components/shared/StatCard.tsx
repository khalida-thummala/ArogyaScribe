interface StatCardProps {
  label: string
  value: string | number
  sub?: string
  subColor?: string
}

export default function StatCard({ label, value, sub, subColor }: StatCardProps) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '18px 20px' }}>
      <div style={{ fontSize: 11.5, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: 'DM Serif Display, serif', fontSize: 28, color: 'var(--text)', lineHeight: 1, marginBottom: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: subColor ?? 'var(--text-3)' }}>{sub}</div>}
    </div>
  )
}
