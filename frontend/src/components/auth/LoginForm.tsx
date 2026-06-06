import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/store/authStore'

const LoginForm: React.FC = () => {
  const navigate  = useNavigate()
  const setAuth   = useAuthStore((s) => s.setAuth)

  const [email,        setEmail]        = useState('')
  const [password,     setPassword]     = useState('')
  const [showPw,       setShowPw]       = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const authRes = await authApi.login({ email, password })

      setAuth(
        { ...authRes.user, user_id: authRes.user.id } as any,
        authRes.access_token,
        authRes.refresh_token
      )

      try {
        const fullProfile = await authApi.getProfile()
        setAuth(fullProfile, authRes.access_token, authRes.refresh_token)
      } catch {
        // non-fatal
      }

      toast.success('Welcome back!')
     if (authRes.user.role === 'super_admin') {
  navigate('/admin', { replace: true })
}
else if (authRes.user.role === 'organization_admin') {
  navigate('/organization', { replace: true })
}
else if (authRes.user.role === 'patient') {
  navigate('/patient/dashboard', { replace: true })
}
else {
  navigate('/app/dashboard', { replace: true })
}
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Invalid credentials')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Email */}
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

      {/* Password with eye toggle */}
      <div>
        <label className="block text-xs font-bold mb-1 uppercase tracking-wider" style={{ color: 'var(--text-3)' }}>
          Password
        </label>
        <div className="relative">
          <input
            required
            type={showPw ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 pr-10 rounded-lg text-sm outline-none transition-all"
            style={{ 
              background: 'var(--bg-2)', 
              border: '1px solid var(--border)',
              color: 'var(--text-1)'
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--teal)')}
            onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
            placeholder="••••••••"
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
            style={{ color: 'var(--text-4)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-2)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-4)')}
          >
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {/* Remember me + Forgot password */}
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none" style={{ color: 'var(--text-3)' }}>
          <input 
            type="checkbox" 
            className="rounded transition-all" 
            style={{ 
              accentColor: 'var(--teal)',
              background: 'var(--bg-2)',
              border: '1px solid var(--border)'
            }} 
          />
          Remember me
        </label>
        <button
          type="button"
          onClick={() => navigate('/forgot-password')}
          className="text-sm font-bold hover:underline transition-colors"
          style={{ color: 'var(--teal)' }}
        >
          Forgot password?
        </button>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="btn btn-primary w-full py-3"
      >
        {isSubmitting ? 'Signing in…' : 'Sign In to ArogyaScribe'}
      </button>

      <div className="pt-2 text-center">
        <button
          type="button"
          onClick={() => navigate('/')}
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

export default LoginForm
