import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { getInitials } from '@/utils'
import { Bell, Search, Sun, Moon, ArrowLeft, Menu, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useState } from 'react'

const PAGE_META: Record<string, { title: string; emoji: string }> = {
  '/app/dashboard':    { title: 'Dashboard',        emoji: '⊞' },
  '/app/patients':     { title: 'Patients',          emoji: '👥' },
  '/app/consultations':{ title: 'Consultations',     emoji: '🎙' },
  '/app/ai-analysis':  { title: 'AI Report Analysis',emoji: '✦' },
  '/app/reports':      { title: 'SOAP Reports',       emoji: '📄' },
  '/app/analytics':    { title: 'Analytics',          emoji: '📊' },
  '/app/audit':        { title: 'Audit Trail',        emoji: '🛡' },
  '/app/settings':     { title: 'Settings',           emoji: '⚙' },
  '/app/radiology':    { title: 'Radiology Viewer',   emoji: '🩻' },
  '/app/dictation':    { title: 'Voice Dictation',    emoji: '🎤' },
}

export default function Topbar() {
  const { pathname } = useLocation()
  const navigate     = useNavigate()
  const user         = useAuthStore((s) => s.user)
  const { theme, toggleTheme, toggleSidebar } = useUIStore()
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)

  const meta = Object.entries(PAGE_META).find(([k]) => pathname.startsWith(k))?.[1]
              ?? { title: 'ArogyaScribe', emoji: '✦' }

  return (
    <>
      <header style={{
      height: 'var(--topbar-h)',
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 20px',
      gap: 10,
      flexShrink: 0,
      boxShadow: '0 1px 8px rgba(30,58,138,0.06)',
      transition: 'background 0.3s ease, border-color 0.3s ease',
    }}>
        {/* Mobile Menu Toggle */}
        <button
          onClick={toggleSidebar}
          className="mobile-only"
          style={{
            width: 36, height: 36, borderRadius: 10,
            border: '1.5px solid var(--border)', background: 'var(--surface-2)',
            color: 'var(--text-1)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
          }}
        >
          <Menu size={18} />
        </button>

        {/* Back Button & Page Title */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden', minWidth: 0 }}>
          {pathname !== '/app/dashboard' && (
            <button
              onClick={() => window.history.back()}
              className="desktop-only"
              style={{
                width: 32, height: 32, borderRadius: 8,
                border: '1px solid var(--border)', background: 'var(--surface)',
                color: 'var(--text-2)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', cursor: 'pointer', flexShrink: 0,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--surface)')}
            >
              <ArrowLeft size={16} />
            </button>
          )}
          <div style={{ 
            fontFamily: 'Plus Jakarta Sans, Inter, system-ui, sans-serif', 
            fontSize: 'clamp(14px, 3.5vw, 17px)',
            fontWeight: 700,
            color: 'var(--text-1)',
            letterSpacing: '-0.02em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            minWidth: 0,
          }}>
            {meta.title}
          </div>
        </div>

        {/* Desktop Search */}
        <div className="desktop-only" style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--surface-2)', border: '1.5px solid var(--border)',
          borderRadius: 10, padding: '7px 13px', minWidth: 180, maxWidth: 280,
          transition: 'all 0.15s',
        }}
          onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--blue)')}
          onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
        >
          <Search size={14} color="var(--text-3)" />
          <input
            placeholder="Search patients, reports…"
            style={{
              border: 'none', background: 'none', fontFamily: 'inherit',
              fontSize: 13, color: 'var(--text-1)', outline: 'none', flex: 1, minWidth: 0,
            }}
          />
        </div>

        {/* Mobile Search Toggle */}
        <button
          onClick={() => setMobileSearchOpen(true)}
          className="mobile-only"
          title="Search"
          style={{
            width: 36, height: 36, borderRadius: 10,
            border: '1.5px solid var(--border)', background: 'var(--surface)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-3)', flexShrink: 0,
          }}
        >
          <Search size={16} />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          style={{
            width: 36, height: 36, borderRadius: 10,
            border: '1.5px solid var(--border)', background: 'var(--surface)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-3)', transition: 'all 0.15s', flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--surface-hover)'
            e.currentTarget.style.borderColor = 'var(--border-2)'
            e.currentTarget.style.color = 'var(--text-2)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--surface)'
            e.currentTarget.style.borderColor = 'var(--border)'
            e.currentTarget.style.color = 'var(--text-3)'
          }}
        >
          {theme === 'light' ? <Moon size={15} /> : <Sun size={15} />}
        </button>

        {/* Notification Bell */}
        <button
          onClick={() => toast('No new notifications', { icon: '🔔' })}
          title="Notifications"
          style={{
            width: 36, height: 36, borderRadius: 10,
            border: '1.5px solid var(--border)', background: 'var(--surface)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-3)', transition: 'all 0.15s', position: 'relative', flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--surface-hover)'
            e.currentTarget.style.borderColor = 'var(--border-2)'
            e.currentTarget.style.color = 'var(--text-2)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--surface)'
            e.currentTarget.style.borderColor = 'var(--border)'
            e.currentTarget.style.color = 'var(--text-3)'
          }}
        >
          <Bell size={15} />
          <span style={{
            position: 'absolute', top: 7, right: 7,
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--rose)', border: '1.5px solid #fff',
          }} />
        </button>

        {/* User Avatar */}
        <div
          onClick={() => navigate(pathname.startsWith('/organization') ? '/organization/settings' : '/app/settings')}
          title="Profile & Settings"
          style={{
            width: 36, height: 36, borderRadius: 10, cursor: 'pointer', flexShrink: 0,
            background: 'var(--grad-blue)',
            color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, boxShadow: 'var(--shadow-blue)',
            transition: 'transform 0.15s',
            letterSpacing: '0.04em',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          {user ? getInitials(user.full_name) : 'DR'}
        </div>
      </header>

      {/* Mobile Search Overlay */}
      {mobileSearchOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 300,
            background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
            display: 'flex', flexDirection: 'column',
            padding: '16px',
          }}
          onClick={() => setMobileSearchOpen(false)}
        >
          <div
            style={{
              background: 'var(--surface)', borderRadius: 14,
              padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10,
              boxShadow: 'var(--shadow-lg)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <Search size={16} color="var(--text-3)" />
            <input
              autoFocus
              placeholder="Search patients, reports…"
              style={{
                flex: 1, border: 'none', background: 'none', fontFamily: 'inherit',
                fontSize: 15, color: 'var(--text-1)', outline: 'none',
              }}
            />
            <button
              onClick={() => setMobileSearchOpen(false)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--text-3)', padding: 4, borderRadius: 6,
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
