import { useEffect, useState } from 'react'
import { adminApi } from '@/api/admin'
import { Building2, Plus, X, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
const PLAN_COLORS: Record<string, { color: string; bg: string }> = {
  basic:      { color: '#2563eb', bg: '#eff6ff' },
  premium:    { color: '#7c3aed', bg: '#f5f3ff' },
  enterprise: { color: '#0d9488', bg: '#f0fdfa' },
}
const STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  active:    { color: '#059669', bg: '#ecfdf5' },
  inactive:  { color: '#6b7280', bg: '#f3f4f6' },
  suspended: { color: '#e11d48', bg: '#fff1f2' },
}

const EMPTY_FORM = { name: '', email: '', phone: '', subscription_plan: 'basic', max_users: 10 ,password: '' }

export default function Organizations() {
  const [organizations, setOrganizations] = useState<any[]>([])
  const [loading, setLoading]             = useState(true)
  const [showForm, setShowForm]           = useState(false)
  const [saving, setSaving]               = useState(false)
  const [form, setForm]                   = useState(EMPTY_FORM)
const navigate = useNavigate()
  useEffect(() => { loadOrganizations() }, [])

  const loadOrganizations = async () => {
    setLoading(true)
    try {
      const data = await adminApi.getOrganizations()
      setOrganizations(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!form.name.trim() || form.name.length < 2) { toast.error('Organization name must be at least 2 characters'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { toast.error('Valid email is required'); return }
    if (!form.password || form.password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    if (form.phone && !/^(?:\+91|91)?\d{10}$/.test(form.phone)) { toast.error('Phone must be a valid 10-digit Indian number (e.g. +919876543210)'); return }
    setSaving(true)
    try {
      await adminApi.createOrganization(form)
      toast.success('Organization created')
      setForm(EMPTY_FORM)
      setShowForm(false)
      await loadOrganizations()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to create organization')
    } finally {
      setSaving(false)
    }
  }

  const planStyle  = (p: string) => PLAN_COLORS[p]  ?? { color: '#6b7280', bg: '#f3f4f6' }
  const statusStyle= (s: string) => STATUS_COLORS[s] ?? { color: '#6b7280', bg: '#f3f4f6' }

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 11, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={20} color="#2563eb" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Organizations</h1>
            <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '2px 0 0' }}>{organizations.length} registered</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px' }}
        >
          {showForm ? <X size={15} /> : <Plus size={15} />}
          {showForm ? 'Cancel' : 'New Organization'}
        </button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="card slide-up" style={{ marginBottom: 24, padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 18, color: 'var(--text-1)' }}>Create Organization</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
            {[
              { label: 'Organization Name *', key: 'name',  type: 'text', placeholder: 'e.g. Apollo Hospital' },
              { label: 'Email *',               key: 'email', type: 'email', placeholder: 'admin@apollo.com' },
              { label: 'Phone *',               key: 'phone', type: 'tel', placeholder: '9876543210', maxLength: 10 },
              { label: 'Password *', key: 'password', type: 'password', placeholder: 'Min. 8 characters' }
            ].map(({ label, key, type, placeholder, maxLength }) => (
              <div key={key}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.02em' }}>{label}</label>
                <input
                  type={type}
                  placeholder={placeholder}
                  maxLength={maxLength}
                  className="form-control"
                  style={{ height: 38, fontSize: 13 }}
                  value={(form as any)[key]}
                  onChange={e => {
                    let val = e.target.value;
                    if (key === 'phone') val = val.replace(/\D/g, '').slice(0, 10);
                    setForm(f => ({ ...f, [key]: val }));
                  }}
                />
              </div>
            ))}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.02em' }}>Plan</label>
              <select className="form-control" style={{ height: 38, fontSize: 13 }} value={form.subscription_plan} onChange={e => setForm(f => ({ ...f, subscription_plan: e.target.value }))}>
                <option value="basic">Basic</option>
                <option value="premium">Premium</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.02em' }}>Max Users</label>
              <input
                type="number"
                className="form-control"
                style={{ height: 38, fontSize: 13 }}
                value={form.max_users}
                onChange={e => setForm(f => ({ ...f, max_users: Number(e.target.value) }))}
              />
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
            <button onClick={handleCreate} disabled={saving} className="btn btn-primary" style={{ padding: '9px 22px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle size={14} />
              {saving ? 'Saving…' : 'Save Organization'}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 52, borderRadius: 8 }} />)}
          </div>
        ) : organizations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Building2 size={36} color="var(--text-4)" /></div>
            <h3>No organizations yet</h3>
            <p>Create the first organization to get started.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  {['Organization', 'Email', 'Phone', 'Plan', 'Status', 'Max Users'].map(h => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {organizations.map(org => {
                  const ps = planStyle(org.subscription_plan)
                  const ss = statusStyle(org.billing_status)
                  return (
                    <tr
  key={org.organization_id}
  onClick={() =>
    navigate(
      `/admin/organizations/${org.organization_id}`
    )
  }
  style={{
    cursor: 'pointer'
  }}
  onMouseEnter={(e) =>
    e.currentTarget.style.backgroundColor = '#f8fafc'
  }
  onMouseLeave={(e) =>
    e.currentTarget.style.backgroundColor = ''
  }
>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 34, height: 34, borderRadius: 9, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Building2 size={15} color="#2563eb" />
                          </div>
                          <span style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text-1)' }}>{org.name}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--text-2)' }}>{org.email || '—'}</td>
                      <td style={{ fontSize: 13, color: 'var(--text-2)' }}>{org.phone || '—'}</td>
                      <td>
                        <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: ps.bg, color: ps.color, textTransform: 'capitalize' }}>
                          {org.subscription_plan}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: ss.bg, color: ss.color, textTransform: 'capitalize' }}>
                          {org.billing_status || 'active'}
                        </span>
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--text-2)', textAlign: 'center' }}>{org.max_users}</td>
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
