import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'
import { initSyncManager } from '@/lib/syncManager'
import './styles/globals.css'

// Start offline queue sync manager — flushes queued saves when connectivity restores
initSyncManager()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
          <Toaster
            position="bottom-right"
            toastOptions={{
              duration: 3500,
              style: {
                fontFamily: 'DM Sans, sans-serif',
                fontSize: '13.5px',
              },
            }}
          />
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
)
