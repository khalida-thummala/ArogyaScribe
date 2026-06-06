import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useUIStore } from '@/store/uiStore'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import SplitPane from './SplitPane'

export default function AppLayout() {
  const { theme, sidebarOpen, toggleSidebar } = useUIStore()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  // Auto-close sidebar when resizing to mobile, auto-open on desktop
  useEffect(() => {
    const handleResize = () => {
      const store = useUIStore.getState()
      if (window.innerWidth <= 1024 && store.sidebarOpen) {
        useUIStore.setState({ sidebarOpen: false })
      } else if (window.innerWidth > 1024 && !store.sidebarOpen) {
        useUIStore.setState({ sidebarOpen: true })
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const mainContent = (
    <div style={{ 
      flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
      width: '100%', minWidth: 0,
    }}>
      <Topbar />
      <main style={{ 
        flex: 1, overflowY: 'auto', padding: '16px 20px', 
        background: 'var(--bg)', transition: 'background 0.3s ease' 
      }}>
        <div className="fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  )

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--bg)', color: 'var(--text-1)', position: 'relative' }}>
      {/* Mobile Sidebar Overlay — shown when sidebar is open on mobile */}
      {sidebarOpen && (
        <div 
          onClick={toggleSidebar}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.45)', zIndex: 45, backdropFilter: 'blur(2px)',
            display: 'none',
          }}
          className="mobile-overlay"
        />
      )}

      {/* Desktop view with SplitPane */}
      <div className="desktop-only" style={{ width: '100%', height: '100%', display: 'flex' }}>
        {sidebarOpen ? (
          <SplitPane 
            id="appLayout"
            defaultSplit={18}
            minSplit={10}
            maxSplit={30}
            leftPane={<Sidebar />}
            rightPane={mainContent}
          />
        ) : (
          mainContent
        )}
      </div>

      {/* Mobile view — sidebar is fixed overlay, main content always full width */}
      <div className="mobile-only" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Sidebar />
        {mainContent}
      </div>
    </div>
  )
}
