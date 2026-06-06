import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { AuthLayout } from '@/components/auth'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    navigate(`/reset-password?email=${encodeURIComponent(email)}`)
  }

  return (
    <AuthLayout 
      title="Forgot Password?"
      subtitle="Enter your email to reset your password. You will be redirected to the reset page."
    >
      <div className="flex flex-col">
        {/* Back button */}
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 text-sm mb-6 transition-colors"
          style={{ color: 'var(--text-3)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--teal)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-3)')}
        >
          <ArrowLeft size={16} /> Back to Sign In
        </button>

        <form onSubmit={handleSubmit} className="space-y-5">
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

          <button
            type="submit"
            className="btn btn-primary w-full py-3"
          >
            Continue to Reset Password
          </button>
        </form>
      </div>
    </AuthLayout>
  )
}
