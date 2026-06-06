import { useEffect, useState } from 'react'
import { adminApi } from '@/api/admin'
import { Settings, Lock, CheckCircle2, UserCircle2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function OrganizationSettings() {
  const [form, setForm] = useState({ name: '', email: '', phone: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const data = await adminApi.getOrganizationSettings()
      setForm({ name: data.name || '', email: data.email || '', phone: data.phone || '' })
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    if (!form.name || !form.email) {
      toast.error('Name and email are required')
      return
    }
    try {
      setSaving(true)
      await adminApi.updateOrganizationSettings(form)
      toast.success('Settings updated successfully')
    } catch (err) {
      console.error(err)
      toast.error('Failed to update settings')
    } finally {
      setSaving(false)
    }
  }

  const changePassword = async () => {
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error("Passwords do not match")
      return
    }
    if (passwordForm.new_password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }
    try {
      setChangingPassword(true)
      await adminApi.changeOrganizationPassword(passwordForm.current_password, passwordForm.new_password)
      toast.success("Password changed successfully")
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' })
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.detail || "Failed to change password")
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ width: 42, height: 42, borderRadius: 11, background: 'var(--surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Settings size={20} color="var(--text-2)" />
        </div>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Organization Settings</h1>
          <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '2px 0 0' }}>Update organization profile and security</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, maxWidth: 1000 }}>
        
        {/* Profile Card */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <UserCircle2 size={18} color="var(--blue)" />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-1)' }}>Organization Profile</h3>
          </div>
          
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="skeleton" style={{ height: 40, borderRadius: 8 }} />
              <div className="skeleton" style={{ height: 40, borderRadius: 8 }} />
              <div className="skeleton" style={{ height: 40, borderRadius: 8 }} />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.02em' }}>Organization Name</label>
                <input
                  type="text"
                  className="form-control"
                  style={{ height: 40, fontSize: 13 }}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.02em' }}>Organization Email</label>
                <input
                  type="email"
                  className="form-control"
                  style={{ height: 40, fontSize: 13 }}
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.02em' }}>Phone Number</label>
                <input
                  type="text"
                  className="form-control"
                  style={{ height: 40, fontSize: 13 }}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              <div style={{ marginTop: 8 }}>
                <button
                  onClick={saveSettings}
                  disabled={saving}
                  className="btn btn-primary w-full"
                  style={{ height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  <CheckCircle2 size={16} />
                  {saving ? 'Saving Changes...' : 'Save Profile Changes'}
                </button>
              </div>
            </div>
          )}
        </div>



        {/* Security Card */}
        <div className="card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
            <Lock size={18} color="var(--rose)" />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-1)' }}>Security & Password</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.02em' }}>Current Password</label>
              <input
                type="password"
                className="form-control"
                style={{ height: 40, fontSize: 13 }}
                value={passwordForm.current_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.02em' }}>New Password</label>
              <input
                type="password"
                className="form-control"
                style={{ height: 40, fontSize: 13 }}
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.02em' }}>Confirm New Password</label>
              <input
                type="password"
                className="form-control"
                style={{ height: 40, fontSize: 13 }}
                value={passwordForm.confirm_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
              />
            </div>

            <div style={{ marginTop: 8 }}>
              <button
                onClick={changePassword}
                disabled={changingPassword || !passwordForm.current_password || !passwordForm.new_password}
                className="btn w-full"
                style={{ 
                  height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: 'var(--rose)', color: 'white', fontWeight: 600
                }}
              >
                <Lock size={16} />
                {changingPassword ? "Updating Password..." : "Update Password"}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}