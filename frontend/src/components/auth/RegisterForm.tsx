import React, { useState } from 'react'
import toast from 'react-hot-toast'
import { Eye, EyeOff } from 'lucide-react'
import { authApi } from '@/api/auth'

interface RegisterFormProps {
  onSuccess: (email: string, userId: string) => void
}

/* ── Form Components ───────────────────────────────────── */

const TIMEZONES = [
  { value: 'UTC',                  label: 'UTC (Coordinated Universal Time)' },
  { value: 'Asia/Kolkata',         label: 'Asia/Kolkata — IST (UTC+5:30)' },
  { value: 'America/New_York',     label: 'America/New_York — EST (UTC-5)' },
  { value: 'America/Chicago',      label: 'America/Chicago — CST (UTC-6)' },
  { value: 'America/Denver',       label: 'America/Denver — MST (UTC-7)' },
  { value: 'America/Los_Angeles',  label: 'America/Los_Angeles — PST (UTC-8)' },
  { value: 'Europe/London',        label: 'Europe/London — GMT (UTC+0)' },
  { value: 'Europe/Paris',         label: 'Europe/Paris — CET (UTC+1)' },
  { value: 'Europe/Berlin',        label: 'Europe/Berlin — CET (UTC+1)' },
  { value: 'Asia/Dubai',           label: 'Asia/Dubai — GST (UTC+4)' },
  { value: 'Asia/Singapore',       label: 'Asia/Singapore — SGT (UTC+8)' },
  { value: 'Asia/Tokyo',           label: 'Asia/Tokyo — JST (UTC+9)' },
  { value: 'Australia/Sydney',     label: 'Australia/Sydney — AEST (UTC+10)' },
]

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish — Español' },
  { value: 'fr', label: 'French — Français' },
  { value: 'de', label: 'German — Deutsch' },
  { value: 'pt', label: 'Portuguese — Português' },
  { value: 'ar', label: 'Arabic — العربية' },
  { value: 'hi', label: 'Hindi — हिन्दी' },
  { value: 'zh', label: 'Chinese — 中文' },
]

const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    full_name:           '',
    license_number:      '',
    email:               '',
    organization_name:   '',
    phone:               '',
    password:            '',
    confirm_password:    '',
    role:                'patient',
    timezone:            'UTC',
    language_preference: 'en',
  })
  const [showPw,    setShowPw]    = useState(false)
  const [showCPw,   setShowCPw]   = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const set = (field: string, value: string) =>
    setFormData(prev => ({ ...prev, [field]: value }))

  /* password strength logic */
  const pw = formData.password
  const strength = pw.length === 0 ? 0
    : pw.length < 8  ? 1
    : pw.length < 12 ? 2
    : pw.length < 16 ? 3
    : 4
  const strengthLabel = ['', 'Too short', 'Fair', 'Good', 'Strong'][strength]
  const strengthColor = ['', 'var(--rose)', 'var(--amber)', 'var(--blue)', 'var(--emerald)'][strength]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.password !== formData.confirm_password) {
      toast.error('Passwords do not match')
      return
    }
    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    if (formData.phone.length !== 10) {
      toast.error('Phone number must be exactly 10 digits')
      return
    }
    setIsSubmitting(true)
    try {
      const { confirm_password, ...payload } = formData
      const response = await authApi.register(payload)
      toast.success('Account created! You can now sign in.')
      onSuccess(formData.email, response.user_id)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Registration failed')
    } finally {
      setIsSubmitting(false)
    }
  }

  /* shared styles */
  const inpStyle = {
    background: 'var(--bg-2)',
    border: '1px solid var(--border)',
    color: 'var(--text-1)',
    outline: 'none'
  }
  const labelStyle = { color: 'var(--text-3)' }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* ── Patient Notice ── */}
      <div className="mb-6 p-3 rounded-lg text-sm text-center font-bold" style={{ background: 'rgba(37, 99, 235, 0.1)', color: 'var(--blue)', border: '1px solid rgba(37, 99, 235, 0.2)' }}>
        Registration is strictly for Patients. Doctors must be invited by their Organization.
      </div>

      {/* ── Section: Personal Info ── */}
      <div className="pb-1">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: 'var(--teal)' }}>
          <span className="w-4 h-px inline-block" style={{ background: 'var(--teal)' }} />
          Personal Information
          <span className="flex-1 h-px opacity-10 inline-block" style={{ background: 'var(--text-1)' }} />
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold mb-1 uppercase tracking-wider" style={labelStyle}>Full Name *</label>
            <input required className="w-full px-4 py-2.5 rounded-lg text-sm transition-all" style={inpStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--teal)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
              placeholder="Jane Smith"
              value={formData.full_name}
              onChange={e => set('full_name', e.target.value)} />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1 uppercase tracking-wider" style={labelStyle}>Email Address *</label>
            <input required type="email" className="w-full px-4 py-2.5 rounded-lg text-sm transition-all" style={inpStyle}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--teal)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
              placeholder="patient@example.com"
              value={formData.email}
              onChange={e => set('email', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1 uppercase tracking-wider" style={labelStyle}>Phone Number *</label>
            <div className="flex gap-2">
              <span className="px-3 py-2.5 rounded-lg text-sm flex items-center shrink-0 font-bold" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-3)' }}>+91</span>
              <input required type="tel" inputMode="numeric" maxLength={10} className="w-full px-4 py-2.5 rounded-lg text-sm transition-all" style={inpStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--teal)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                placeholder="9876543210"
                value={formData.phone}
                onChange={e => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Section: Preferences ── */}
      <div className="pb-1">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: 'var(--teal)' }}>
          <span className="w-4 h-px inline-block" style={{ background: 'var(--teal)' }} />
          Preferences
          <span className="flex-1 h-px opacity-10 inline-block" style={{ background: 'var(--text-1)' }} />
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold mb-1 uppercase tracking-wider" style={labelStyle}>Timezone</label>
            <div className="relative">
              <select className="w-full px-4 py-2.5 rounded-lg text-sm transition-all appearance-none outline-none cursor-pointer" style={inpStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--teal)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                value={formData.timezone}
                onChange={e => set('timezone', e.target.value)}>
                {TIMEZONES.map(tz => <option key={tz.value} value={tz.value} style={{ background: 'var(--bg-2)' }}>{tz.label}</option>)}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 opacity-50" style={{ color: 'var(--text-1)' }}>▾</span>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold mb-1 uppercase tracking-wider" style={labelStyle}>Language</label>
            <div className="relative">
              <select className="w-full px-4 py-2.5 rounded-lg text-sm transition-all appearance-none outline-none cursor-pointer" style={inpStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--teal)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                value={formData.language_preference}
                onChange={e => set('language_preference', e.target.value)}>
                {LANGUAGES.map(l => <option key={l.value} value={l.value} style={{ background: 'var(--bg-2)' }}>{l.label}</option>)}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 opacity-50" style={{ color: 'var(--text-1)' }}>▾</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section: Password ── */}
      <div className="pb-1">
        <p className="text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2" style={{ color: 'var(--teal)' }}>
          <span className="w-4 h-px inline-block" style={{ background: 'var(--teal)' }} />
          Security
          <span className="flex-1 h-px opacity-10 inline-block" style={{ background: 'var(--text-1)' }} />
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold mb-1 uppercase tracking-wider" style={labelStyle}>Password *</label>
            <div className="relative">
              <input required type={showPw ? 'text' : 'password'} className="w-full px-4 py-2.5 rounded-lg text-sm transition-all pr-10"
                style={inpStyle}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--teal)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                placeholder="Min. 8 characters"
                value={formData.password}
                onChange={e => set('password', e.target.value)} />
              <button type="button" tabIndex={-1}
                onClick={() => setShowPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity" style={{ color: 'var(--text-1)' }}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {/* Strength bar */}
            {formData.password && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300" 
                      style={{ 
                        background: i <= strength ? strengthColor : 'var(--bg-2)',
                        opacity: i <= strength ? 1 : 0.3
                      }} 
                    />
                  ))}
                </div>
                <p className="text-[10px]" style={{ color: 'var(--text-4)' }}>{strengthLabel}</p>
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-bold mb-1 uppercase tracking-wider" style={labelStyle}>Confirm Password *</label>
            <div className="relative">
              <input required type={showCPw ? 'text' : 'password'} className="w-full px-4 py-2.5 rounded-lg text-sm transition-all pr-10"
                style={{
                  ...inpStyle,
                  borderColor: formData.confirm_password && formData.confirm_password !== formData.password
                    ? 'var(--rose)'
                    : formData.confirm_password && formData.confirm_password === formData.password
                    ? 'var(--emerald)'
                    : 'var(--border)'
                }}
                placeholder="Re-enter password"
                value={formData.confirm_password}
                onChange={e => set('confirm_password', e.target.value)} />
              <button type="button" tabIndex={-1}
                onClick={() => setShowCPw(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 hover:opacity-100 transition-opacity" style={{ color: 'var(--text-1)' }}>
                {showCPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {formData.confirm_password && formData.confirm_password !== pw && (
              <p className="text-[11px] mt-1" style={{ color: 'var(--rose)' }}>Passwords do not match</p>
            )}
            {formData.confirm_password && formData.confirm_password === pw && (
              <p className="text-[11px] mt-1" style={{ color: 'var(--emerald)' }}>✓ Passwords match</p>
            )}
          </div>
        </div>

        {/* Requirements checklist */}
        <div className="mt-4 rounded-lg p-3 space-y-1" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
          <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-4)' }}>Requirements</p>
          {[
            { label: 'At least 8 characters',          met: pw.length >= 8 },
            { label: 'Contains a number',              met: /\d/.test(pw) },
            { label: 'Contains a letter',              met: /[a-zA-Z]/.test(pw) },
          ].map(({ label, met }) => (
            <div key={label} className="flex items-center gap-2">
              <div 
                className="w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold transition-colors" 
                style={{ 
                  background: met ? 'var(--emerald)' : 'var(--border)',
                  color: met ? '#fff' : 'var(--text-4)'
                }}
              >
                {met ? '✓' : '·'}
              </div>
              <span className="text-[11px]" style={{ color: met ? 'var(--text-1)' : 'var(--text-4)' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <button type="submit" disabled={isSubmitting}
        className="btn btn-primary w-full py-3 mt-4">
        {isSubmitting ? 'Creating account…' : 'Create Account'}
      </button>

      <div className="pt-2 text-center">
        <button
          type="button"
          onClick={() => window.location.href = '/'}
          className="inline-flex items-center gap-2 text-sm font-bold transition-colors"
          style={{ color: 'var(--text-3)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--teal)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-3)')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          Back to Home Page
        </button>
      </div>
    </form>
  )
}

export default RegisterForm
