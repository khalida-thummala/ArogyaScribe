import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthLayout, LoginForm, RegisterForm } from '@/components/auth'
import { useAuthStore } from '@/store/authStore'

export default function LoginPage() {
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  const user = useAuthStore((s) => s.user)

useEffect(() => {
  if (isAuthenticated) {
    if (user?.role === 'super_admin') {
        navigate('/admin')
      }
      else if (user?.role === 'organization_admin') {
        navigate('/organization')
      }
      else if (user?.role === 'patient') {
        navigate('/patient/dashboard')
      }
      else {
        navigate('/app/dashboard')
      }
  }
}, [isAuthenticated, user, navigate])

  const handleRegisterSuccess = () => {
    setTab('login')
  }

  // Widen the card when showing the register form (many fields)
  const isWide = tab === 'register'

  return (
    <AuthLayout
      title="ArogyaScribe"
      subtitle="Production-Grade Healthcare Documentation Platform"
      wide={isWide}
    >
      {/* Tab switcher */}
      <div className="flex border-b border-gray-100 mb-6">
        {(['login', 'register'] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t) }}
            className={`flex-1 py-3 text-sm font-semibold transition-all duration-200 border-b-2 ${
              tab === t
                ? 'border-[#2563eb] text-[#2563eb]'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {t === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        ))}
      </div>

      {/* Login form */}
      {tab === 'login' && <LoginForm />}

      {/* Register form — scrollable so it doesn't overflow on small screens */}
      {tab === 'register' && (
        <div className="max-h-[70vh] overflow-y-auto pr-1 -mr-1">
          <RegisterForm onSuccess={handleRegisterSuccess} />
        </div>
      )}

      <div className="mt-6 text-center">
        <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">
          Trusted by 500+ Medical Professionals
        </p>
      </div>
    </AuthLayout>
  )
}
