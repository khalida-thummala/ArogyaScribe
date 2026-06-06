import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
  sidebarOpen: boolean
  currentPage: string
  theme: 'light' | 'dark'
  panelSizes: Record<string, number>
  toggleSidebar: () => void
  setCurrentPage: (p: string) => void
  toggleTheme: () => void
  setTheme: (t: 'light' | 'dark') => void
  setPanelSize: (id: string, size: number) => void
}

const isMobile = () => typeof window !== 'undefined' && window.innerWidth <= 1024

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Default open on desktop, closed on mobile
      sidebarOpen: typeof window !== 'undefined' ? window.innerWidth > 1024 : true,
      currentPage: 'dashboard',
      theme: 'light',
      panelSizes: {},
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setCurrentPage: (currentPage) => set({ currentPage }),
      toggleTheme: () =>
        set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),
      setTheme: (theme) => set({ theme }),
      setPanelSize: (id, size) => set((s) => ({ panelSizes: { ...s.panelSizes, [id]: size } })),
    }),
    {
      name: 'arogyascribe-ui',
      // After rehydration from localStorage, force sidebar closed on mobile
      onRehydrateStorage: () => (state) => {
        if (state && isMobile()) {
          state.sidebarOpen = false
        }
      },
    }
  )
)
