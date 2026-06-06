import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import {
  LayoutDashboard, Building2, Stethoscope, Users,
  CreditCard, BarChart3, ArrowUpCircle, LogOut
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/admin',                  icon: LayoutDashboard, label: 'Dashboard',        end: true },
  { to: '/admin/organizations',    icon: Building2,       label: 'Organizations'              },
  { to: '/admin/doctors',          icon: Stethoscope,     label: 'Doctors'                    },
  { to: '/admin/patients',         icon: Users,           label: 'Patients'                   },
  { to: '/admin/subscriptions',    icon: CreditCard,      label: 'Subscriptions'              },
  { to: '/admin/usage',            icon: BarChart3,       label: 'Usage'                      },
  { to: '/admin/upgrade-requests', icon: ArrowUpCircle,   label: 'Upgrade Requests'           },
]

export default function AdminSidebar() {
  const navigate  = useNavigate()
  const logout    = useAuthStore((s) => s.logout)
  const user      = useAuthStore((s) => s.user)

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <nav style={{
      width: 240, flexShrink: 0, height: '100vh', position: 'sticky', top: 0,
      background: 'var(--surface)', borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      boxShadow: '2px 0 16px rgba(30,58,138,0.07)',
    }}>
      {/* Brand */}
      <div style={{
        padding: '20px 20px 16px',
        background: 'linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'rgba(255,255,255,0.2)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Stethoscope size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>ArogyaScribe</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Super Admin</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 10px' }}>
        <div style={{ fontSize: 9.5, color: 'var(--text-4)', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700, padding: '0 12px 8px' }}>
          Management
        </div>
        {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '9px 12px', marginBottom: 2, borderRadius: 10,
              textDecoration: 'none', fontSize: 13.5, fontWeight: isActive ? 600 : 500,
              color: isActive ? 'var(--blue)' : 'var(--text-3)',
              background: isActive ? 'var(--blue-light)' : 'transparent',
              borderLeft: isActive ? '3px solid var(--blue)' : '3px solid transparent',
              transition: 'all 0.15s ease',
            })}
          >
            {({ isActive }) => (
              <>
                <div style={{
                  width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isActive ? 'var(--surface-active)' : 'var(--surface-2)',
                }}>
                  <Icon size={15} color={isActive ? 'var(--blue)' : 'var(--text-4)'} />
                </div>
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* User card */}
      <div style={{ padding: '12px 10px 16px', borderTop: '1px solid var(--border)' }}>
        <div style={{
          background: 'var(--surface-2)', borderRadius: 12, padding: '10px 12px',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            background: 'linear-gradient(135deg,#1e3a8a,#2563eb)',
            color: '#fff', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 11, fontWeight: 700,
          }}>
            SA
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.full_name ?? 'Super Admin'}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-4)', marginTop: 1 }}>super_admin</div>
          </div>
          <button onClick={handleLogout} title="Sign Out" style={{
            padding: 6, borderRadius: 6, border: 'none', background: 'transparent',
            cursor: 'pointer', color: 'var(--text-4)', display: 'flex', alignItems: 'center',
            transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = '#fff1f2' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-4)'; e.currentTarget.style.background = 'transparent' }}
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </nav>
  )
}
