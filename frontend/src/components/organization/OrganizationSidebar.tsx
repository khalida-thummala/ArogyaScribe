import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { getInitials } from '@/utils'
import {
  LayoutDashboard, Users, FileText, Settings, LogOut, ShieldCheck, Activity, CreditCard,
  Building2
} from 'lucide-react'
import Logo from '../shared/Logo'

const ORG_NAV = [
  {
    label: 'Overview',
    items: [
      { to: '/organization',          icon: LayoutDashboard, label: 'Dashboard',     color: '#3b82f6' },
    ],
  },
  {
    label: 'Management',
    items: [
      { to: '/organization/doctors',  icon: Activity,      label: 'Doctors',       color: '#10b981' },
      { to: '/organization/patients', icon: Users,         label: 'Patients',      color: '#f59e0b' },
      { to: '/organization/reports',  icon: FileText,      label: 'Reports',       color: '#0d9488' },
    ],
  },
  {
    label: 'Administration',
    items: [
      { to: '/organization/usage',        icon: ShieldCheck, label: 'Usage',        color: '#6b7280' },
      { to: '/organization/subscription', icon: CreditCard,  label: 'Subscription', color: '#7c3aed' },
      { to: '/organization/settings',     icon: Settings,    label: 'Settings',     color: '#6b7280' },
    ],
  },
]

export default function OrganizationSidebar() {
  const user    = useAuthStore((s) => s.user)
  const logout  = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const { sidebarOpen } = useUIStore()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav 
      className={`app-sidebar ${sidebarOpen ? 'open' : 'closed'}`}
      style={{
        width: '100%', height: '100%', background: 'var(--surface)',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        borderRight: '1px solid var(--border)',
        boxShadow: '2px 0 16px rgba(30,58,138,0.07)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 50,
      }}
    >
      <div style={{ padding: '0 18px', background: 'var(--grad-header)', paddingTop: 20, paddingBottom: 20 }}>
        <Logo variant="sidebar" />
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, color: '#fff', fontSize: 11, fontWeight: 700, opacity: 0.9, letterSpacing: '0.04em' }}>
          <Building2 size={13} /> ADMIN PORTAL
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 10px' }}>
        {ORG_NAV.map((group) => (
          <div key={group.label} style={{ marginBottom: 12 }}>
            <div style={{
              padding: '0 12px 6px', fontSize: 9.5, color: 'var(--text-4)',
              letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700,
            }}>
              {group.label}
            </div>

            {group.items.map((item) => {
              const Icon = item.icon
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/organization'}
                  onClick={() => {
                    if (window.innerWidth <= 1024 && sidebarOpen) {
                      useUIStore.getState().toggleSidebar()
                    }
                  }}
                  style={({ isActive }) => ({
                    display: 'flex', alignItems: 'center', gap: 12, padding: '9px 12px',
                    marginBottom: 2, borderRadius: 10, cursor: 'pointer', fontSize: 13.5,
                    fontWeight: isActive ? 600 : 500, textDecoration: 'none',
                    color: isActive ? 'var(--blue)' : 'var(--text-3)',
                    background: isActive ? 'var(--blue-light)' : 'transparent',
                    borderLeft: isActive ? '3px solid var(--blue)' : '3px solid transparent',
                    transition: 'all 0.15s ease',
                  })}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.classList.contains('active')) {
                      e.currentTarget.style.background = 'var(--surface-hover)'
                      e.currentTarget.style.color = 'var(--blue)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!e.currentTarget.classList.contains('active')) {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = 'var(--text-3)'
                    }
                  }}
                >
                  {({ isActive }) => (
                    <>
                      <div style={{
                        width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isActive ? 'var(--surface-active)' : 'var(--surface-2)',
                        boxShadow: isActive ? '0 2px 8px rgba(37,99,235,0.15)' : 'none',
                        transition: 'all 0.15s',
                      }}>
                        <Icon size={15} color={isActive ? 'var(--blue)' : 'var(--text-4)'} />
                      </div>
                      <span style={{ flex: 1 }}>{item.label}</span>
                      {isActive && <div style={{ width: 4, height: 16, background: 'var(--blue)', borderRadius: 10, marginLeft: 4 }} />}
                    </>
                  )}
                </NavLink>
              )
            })}
          </div>
        ))}
      </div>

      <div style={{ padding: '12px 10px 16px', borderTop: '1px solid var(--border)' }}>
        <div style={{
          background: 'var(--surface-2)', borderRadius: 12, padding: '10px 12px',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
              width: 34, height: 34, borderRadius: 8, flexShrink: 0,
              background: 'var(--grad-blue)', color: '#fff', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 11, fontWeight: 700,
              boxShadow: 'var(--shadow-blue)', letterSpacing: '0.03em',
            }}
          >
            {user ? getInitials(user.full_name) : 'ORG'}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--text-1)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.full_name ?? 'Org Admin'}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-4)', textTransform: 'capitalize', marginTop: 1 }}>
              {user?.role ?? 'Admin'}
            </div>
          </div>

          <button
            onClick={handleLogout}
            title="Sign Out"
            style={{
              padding: 6, borderRadius: 6, border: 'none', background: 'transparent',
              cursor: 'pointer', color: 'var(--text-4)', display: 'flex', alignItems: 'center',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--rose)'
              e.currentTarget.style.background = 'var(--rose-light)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--text-4)'
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </nav>
  )
}