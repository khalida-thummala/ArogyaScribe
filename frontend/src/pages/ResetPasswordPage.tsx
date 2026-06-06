import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '@/api/auth'
import { AuthLayout } from '@/components/auth'

export default function ResetPasswordPage() {
  const navigate        = useNavigate()
  const [params]        = useSearchParams()
  const token           = params.get('token')
  const initialEmail    = params.get('email') ?? ''

  const [email,           setEmail]           = useState(initialEmail)
  const [newPassword,     setNewPassword]     = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew,         setShowNew]         = useState(false)
  const [showConfirm,     setShowConfirm]     = useState(false)
  const [isSubmitting,    setIsSubmitting]    = useState(false)
  const [done,            setDone]            = useState(false)

  /* password strength */
  const strength = newPassword.length === 0 ? 0
    : newPassword.length < 8  ? 1
    : newPassword.length < 12 ? 2
    : newPassword.length < 16 ? 3
    : 4
  const strengthLabel = ['', 'Too short', 'Fair', 'Good', 'Strong'][strength]
  const strengthColor = ['', 'var(--rose)', 'var(--amber)', 'var(--blue)', 'var(--emerald)'][strength]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast.error('Please enter your email')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    setIsSubmitting(true)
    try {
      await authApi.resetPassword(token, newPassword, email)
      setDone(true)
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Reset failed. Please check your email and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title={!done ? "Reset Password" : "Password Updated!"}
      subtitle={!done ? "Choose a strong new password for your ArogyaScribe account." : ""}
    >
      <div className="flex flex-col">
        {!done && (
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 text-sm mb-6 transition-colors"
            style={{ color: 'var(--text-3)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--teal)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-3)')}
          >
            <ArrowLeft size={16} /> Back to Sign In
          </button>
        )}

        {!done ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Address */}
            <div>
              <label className="block text-xs font-bold mb-1 uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>
                Email Address
              </label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
                style={{ 
                  background: 'var(--bg-2)', 
                  border: '1px solid var(--border)',
                  color: 'var(--text-1)'
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--teal)')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                placeholder="doctor@clinic.com"
              />
            </div>

            {/* New password */}
            <div>
              <label className="block text-xs font-bold mb-1 uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>
                New Password
              </label>
              <div className="relative">
                <input
                  required
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all pr-10"
                  style={{ 
                    background: 'var(--bg-2)', 
                    border: '1px solid var(--border)',
                    color: 'var(--text-1)'
                  }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--teal)')}
                  onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
                  placeholder="Min. 8 characters"
                />
                <button type="button" tabIndex={-1}
                  onClick={() => setShowNew(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {/* Strength bar */}
              {newPassword && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4].map(i => (
                      <div 
                        key={i} 
                        className="h-1 flex-1 rounded-full transition-all duration-300" 
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

            {/* Confirm password */}
            <div>
              <label className="block text-xs font-bold mb-1 uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  required
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all pr-10"
                  style={{ 
                    background: 'var(--bg-2)', 
                    border: `1px solid ${
                      confirmPassword && confirmPassword !== newPassword
                        ? 'var(--rose)'
                        : confirmPassword && confirmPassword === newPassword
                        ? 'var(--emerald)'
                        : 'var(--border)'
                    }`,
                    color: 'var(--text-1)'
                  }}
                  placeholder="Re-enter new password"
                />
                <button type="button" tabIndex={-1}
                  onClick={() => setShowConfirm(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirmPassword && confirmPassword !== newPassword && (
                <p className="text-[11px] mt-1" style={{ color: 'var(--rose)' }}>Passwords do not match</p>
              )}
              {confirmPassword && confirmPassword === newPassword && (
                <p className="text-[11px] mt-1" style={{ color: 'var(--emerald)' }}>✓ Passwords match</p>
              )}
            </div>

            {/* Password requirements */}
            <div className="rounded-lg p-3 space-y-1" style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
              <p className="text-[10px] font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--text-4)' }}>Requirements</p>
              {[
                { label: 'At least 8 characters',          met: newPassword.length >= 8 },
                { label: 'Contains a number',              met: /\d/.test(newPassword) },
                { label: 'Contains a letter',              met: /[a-zA-Z]/.test(newPassword) },
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

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary w-full py-3"
            >
              {isSubmitting ? 'Updating password…' : 'Update Password'}
            </button>
          </form>
        ) : (
          /* Success */
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: 'var(--emerald-light)' }}>
              <CheckCircle size={32} style={{ color: 'var(--emerald)' }} />
            </div>
            <p className="text-sm mb-8" style={{ color: 'var(--text-2)' }}>
              Your password has been reset successfully. You can now sign in with your new password.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="btn btn-primary w-full py-3"
            >
              Sign In Now
            </button>
          </div>
        )}
      </div>
    </AuthLayout>
  )
}
