import React, { useRef, useEffect } from 'react'
import { GripVertical, GripHorizontal } from 'lucide-react'
import { useUIStore } from '@/store/uiStore'

interface SplitPaneProps {
  id: string
  leftPane: React.ReactNode
  rightPane: React.ReactNode
  direction?: 'horizontal' | 'vertical'
  defaultSplit?: number // percentage
  minSplit?: number // percentage
  maxSplit?: number // percentage
  className?: string
}

export default function SplitPane({
  id,
  leftPane,
  rightPane,
  direction = 'horizontal',
  defaultSplit = 50,
  minSplit = 20,
  maxSplit = 80,
  className = ''
}: SplitPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const isHorizontal = direction === 'horizontal'

  // Get persisted split ratio or use default
  const savedSplit = useUIStore((s) => s.panelSizes[id])
  const setPanelSize = useUIStore((s) => s.setPanelSize)
  const splitRatio = savedSplit ?? defaultSplit

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    isDragging.current = true
    
    // Support both mouse and touch events
    document.addEventListener('mousemove', handleDragMove)
    document.addEventListener('mouseup', handleDragEnd)
    document.addEventListener('touchmove', handleDragMove, { passive: false })
    document.addEventListener('touchend', handleDragEnd)
    
    document.body.style.userSelect = 'none'
    document.body.style.cursor = isHorizontal ? 'col-resize' : 'row-resize'
  }

  const handleDragMove = (e: MouseEvent | TouchEvent) => {
    if (!isDragging.current || !containerRef.current) return
    if ('touches' in e) e.preventDefault() // Prevent scrolling on mobile while dragging

    const containerRect = containerRef.current.getBoundingClientRect()
    
    let clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    let clientY = 'touches' in e ? e.touches[0].clientY : e.clientY

    let newRatio = 0
    if (isHorizontal) {
      newRatio = ((clientX - containerRect.left) / containerRect.width) * 100
    } else {
      newRatio = ((clientY - containerRect.top) / containerRect.height) * 100
    }

    if (newRatio >= minSplit && newRatio <= maxSplit) {
      setPanelSize(id, newRatio)
    }
  }

  const handleDragEnd = () => {
    isDragging.current = false
    document.removeEventListener('mousemove', handleDragMove)
    document.removeEventListener('mouseup', handleDragEnd)
    document.removeEventListener('touchmove', handleDragMove)
    document.removeEventListener('touchend', handleDragEnd)
    
    document.body.style.userSelect = ''
    document.body.style.cursor = ''
  }

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleDragMove)
      document.removeEventListener('mouseup', handleDragEnd)
      document.removeEventListener('touchmove', handleDragMove)
      document.removeEventListener('touchend', handleDragEnd)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }
  }, [])

  return (
    <div 
      ref={containerRef} 
      className={`split-pane-container ${className}`}
      style={{
        display: 'flex',
        flexDirection: isHorizontal ? 'row' : 'column',
        width: '100%',
        height: '100%',
        minHeight: 0,
        minWidth: 0,
        overflow: 'hidden'
      }}
    >
      {/* Pane 1 */}
      <div 
        style={{ 
          flex: `0 0 calc(${splitRatio}% - 4px)`,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          minHeight: 0,
          overflow: 'hidden'
        }}
      >
        {leftPane}
      </div>

      {/* Divider */}
      <div
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        style={{
          width: isHorizontal ? 8 : '100%',
          height: isHorizontal ? '100%' : 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isHorizontal ? 'col-resize' : 'row-resize',
          zIndex: 10,
          opacity: 0.8,
          transition: 'opacity 0.2s',
          backgroundColor: 'transparent'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.8')}
      >
        <div style={{
          width: isHorizontal ? 4 : 40,
          height: isHorizontal ? 40 : 4,
          background: 'var(--border, #475569)',
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative'
        }}>
          {isHorizontal ? (
            <GripVertical size={12} color="var(--bg, #0f172a)" style={{ position: 'absolute' }} />
          ) : (
            <GripHorizontal size={12} color="var(--bg, #0f172a)" style={{ position: 'absolute' }} />
          )}
        </div>
      </div>

      {/* Pane 2 */}
      <div 
        style={{ 
          flex: `1`, // Takes the remaining space
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          minHeight: 0,
          overflow: 'hidden'
        }}
      >
        {rightPane}
      </div>
    </div>
  )
}
