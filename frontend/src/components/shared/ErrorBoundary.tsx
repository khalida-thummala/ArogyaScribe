import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', textAlign: 'center', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <h1 style={{ fontSize: 24, marginBottom: 16, color: 'var(--red)' }}>Something went wrong.</h1>
          <p style={{ color: 'var(--text-2)', marginBottom: 24 }}>An unexpected error occurred in the application.</p>
          <pre style={{ background: 'var(--surface-2)', padding: 16, borderRadius: 8, fontSize: 12, textAlign: 'left', maxWidth: 600, overflowX: 'auto', marginBottom: 24 }}>
            {this.state.error?.message}
          </pre>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Reload Application
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
