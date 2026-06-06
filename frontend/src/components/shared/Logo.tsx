import React from 'react'
import { Stethoscope } from 'lucide-react'

interface LogoProps {
  showText?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
  /** 'sidebar' = on dark blue header (white text), 'light' = on white/light bg (dark text) */
  variant?: 'sidebar' | 'light'
}

const Logo: React.FC<LogoProps> = ({
  showText = true,
  size = 'md',
  className = '',
  variant = 'light',
}) => {
  const sizes = {
    sm: { icon: 15, box: 30, text: 15, sub: 8  },
    md: { icon: 20, box: 38, text: 19, sub: 9  },
    lg: { icon: 28, box: 54, text: 26, sub: 10 },
  }

  const { icon, box, text, sub } = sizes[size]
  const onDark = variant === 'sidebar'

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Icon Box — teal-green stethoscope, matches landing page exactly */}
      <div
        style={{
          width:  box,
          height: box,
          borderRadius: Math.round(box * 0.27),
          background: onDark ? '#ffffff' : 'linear-gradient(135deg, #1d4ed8, #2563eb)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: onDark ? '0 4px 12px rgba(0,0,0,0.1)' : '0 4px 14px rgba(37,99,235,0.35)',
          flexShrink: 0,
        }}
      >
        <Stethoscope size={icon} color={onDark ? '#2563eb' : '#fff'} />
      </div>

      {/* Brand Text */}
      {showText && (
        <div className="flex flex-col">
          <span
            style={{
              fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif",
              fontSize: text,
              fontWeight: 800,
              color: onDark ? '#ffffff' : 'var(--text-1)',
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
            }}
          >
            ArogyaScribe
          </span>
          <span
            style={{
              fontSize: sub,
              color: onDark ? 'rgba(255,255,255,0.6)' : 'var(--text-3)',
              letterSpacing: '0.09em',
              textTransform: 'uppercase',
              marginTop: 2,
              fontWeight: 600,
            }}
          >
            Healthcare v2.0
          </span>
        </div>
      )}
    </div>
  )
}

export default Logo
