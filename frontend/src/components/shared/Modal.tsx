import { useEffect } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  width?: number
}

export default function Modal({ open, onClose, title, children, footer, width = 560 }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [onClose])

  if (!open) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--surface)', borderRadius: 12,
          width: '100%', maxWidth: width,
          boxShadow: 'var(--shadow-lg)',
          display: 'flex', flexDirection: 'column',
          maxHeight: 'calc(100vh - 32px)',
          margin: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '18px 22px 14px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: 18, margin: 0 }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', fontSize: 18, cursor: 'pointer',
              color: 'var(--text-3)', padding: '4px 8px', borderRadius: 6,
              lineHeight: 1, transition: 'all 0.15s', flexShrink: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.color = 'var(--text-1)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--text-3)' }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ padding: '20px 22px', overflowY: 'auto', flex: 1 }}>
          {children}
        </div>

        {footer && (
          <div style={{
            padding: '14px 22px', borderTop: '1px solid var(--border)',
            display: 'flex', justifyContent: 'flex-end', gap: 10,
            flexShrink: 0,
          }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
