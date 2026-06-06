import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useUIStore } from '@/store/uiStore'
import OrganizationSidebar from './OrganizationSidebar'
import Topbar from '../shared/Topbar'
import SplitPane from '../shared/SplitPane'

export default function OrganizationLayout() {
  const { theme, sidebarOpen, toggleSidebar } = useUIStore()

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

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
      {sidebarOpen && (
        <div 
          onClick={toggleSidebar}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.45)', zIndex: 45, backdropFilter: 'blur(2px)',
          }}
          className="mobile-overlay mobile-only"
        />
      )}

      <div className="desktop-only" style={{ width: '100%', height: '100%', display: 'flex' }}>
        {sidebarOpen ? (
          <SplitPane 
            id="orgLayout"
            defaultSplit={18}
            minSplit={10}
            maxSplit={30}
            leftPane={<OrganizationSidebar />}
            rightPane={mainContent}
          />
        ) : (
          mainContent
        )}
      </div>

      <div className="mobile-only" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <OrganizationSidebar />
        {mainContent}
      </div>
    </div>
  )
}