import { Outlet } from 'react-router-dom'
import AdminSidebar from './AdminSidebar'

export default function AdminLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', color: 'var(--text-1)' }}>
      <AdminSidebar />
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 32px', minWidth: 0 }}>
        <Outlet />
      </div>
    </div>
  )
}
