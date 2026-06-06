import React, { useEffect, useRef, useState, useCallback } from 'react'
import cornerstone from 'cornerstone-core'
import cornerstoneTools from 'cornerstone-tools'
import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader'
import cornerstoneMath from 'cornerstone-math'
import dicomParser from 'dicom-parser'
import Hammer from 'hammerjs'
import { ZoomIn, Move, Ruler, Sun, Info, RotateCcw } from 'lucide-react'
import { clsx } from 'clsx'

// ── Cornerstone wiring ────────────────────────────────────────────────────────
cornerstoneTools.external.cornerstone = cornerstone
cornerstoneTools.external.cornerstoneMath = cornerstoneMath
cornerstoneTools.external.Hammer = Hammer
cornerstoneWADOImageLoader.external.cornerstone = cornerstone
cornerstoneWADOImageLoader.external.dicomParser = dicomParser

try {
  cornerstoneWADOImageLoader.webWorkerManager.initialize({
    maxWebWorkers: navigator.hardwareConcurrency || 1,
    startWebWorkersOnDemand: true,
    taskConfiguration: {
      decodeTask: { initializeCodecsOnStartup: false, usePDFJS: false, strict: false },
    },
  })
} catch (e) {
  console.warn('Cornerstone workers already initialized')
}

// Global Cornerstone Tools Initialization (Outside React Lifecycle)
try {
  cornerstoneTools.init({ showSVGCursors: true })
} catch (e) {}

try {
  cornerstoneTools.addTool(cornerstoneTools.WwwcTool)
  cornerstoneTools.addTool(cornerstoneTools.PanTool)
  cornerstoneTools.addTool(cornerstoneTools.ZoomTool)
  cornerstoneTools.addTool(cornerstoneTools.LengthTool)
} catch (e) {}

// ── Types ─────────────────────────────────────────────────────────────────────
interface DicomViewerProps {
  file?: File | null
  imageUrl?: string
  metadata?: any
}

// ── Canvas-based image viewer state ──────────────────────────────────────────
interface ViewState {
  scale: number
  offsetX: number
  offsetY: number
  brightness: number  // 0–200, 100 = normal
  contrast: number    // 0–200, 100 = normal
}

const DEFAULT_VIEW: ViewState = { scale: 1, offsetX: 0, offsetY: 0, brightness: 100, contrast: 100 }

// ── Component ─────────────────────────────────────────────────────────────────
export const DicomViewer: React.FC<DicomViewerProps> = ({ file, imageUrl, metadata }) => {
  const viewerRef   = useRef<HTMLDivElement>(null)   // DICOM element
  const canvasRef   = useRef<HTMLCanvasElement>(null) // Regular image canvas
  const imgRef      = useRef<HTMLImageElement | null>(null)

  const [activeTool, setActiveTool] = useState<string>('Pan')
  const [showMetadata, setShowMetadata] = useState(false)
  const [isLoaded, setIsLoaded]     = useState(false)
  const [loadError, setLoadError]   = useState(false)
  const [view, setView]             = useState<ViewState>(DEFAULT_VIEW)

  // Drag state for pan
  const dragRef = useRef<{ startX: number; startY: number; startOX: number; startOY: number } | null>(null)
  // W/L drag state for brightness/contrast
  const wlRef = useRef<{ startX: number; startY: number; startB: number; startC: number } | null>(null)

  const isDicom =
    file?.name.toLowerCase().endsWith('.dcm') ||
    (imageUrl?.toLowerCase().endsWith('.dcm') ?? false)

  const isRegularImage = !isDicom && (!!file || !!imageUrl)

  // ── Draw canvas ─────────────────────────────────────────────────────────────
  const drawCanvas = useCallback((v: ViewState) => {
    const canvas = canvasRef.current
    const img    = imgRef.current
    if (!canvas || !img) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height

    ctx.clearRect(0, 0, W, H)
    ctx.save()

    // Apply brightness/contrast via CSS filter on canvas context
    ctx.filter = `brightness(${v.brightness}%) contrast(${v.contrast}%)`

    // Center + pan + zoom
    const drawW = img.naturalWidth  * v.scale
    const drawH = img.naturalHeight * v.scale
    const x = (W - drawW) / 2 + v.offsetX
    const y = (H - drawH) / 2 + v.offsetY

    ctx.drawImage(img, x, y, drawW, drawH)
    ctx.restore()
  }, [])

  // ── Load regular image onto canvas ──────────────────────────────────────────
  useEffect(() => {
    if (!isRegularImage) return

    const canvas = canvasRef.current
    if (!canvas) return

    const src = file ? URL.createObjectURL(file) : imageUrl!
    const img  = new Image()
    img.onload = () => {
      imgRef.current = img
      // Fit image to canvas
      const scaleX = canvas.width  / img.naturalWidth
      const scaleY = canvas.height / img.naturalHeight
      const fitScale = Math.min(scaleX, scaleY, 1)
      const initial: ViewState = { ...DEFAULT_VIEW, scale: fitScale }
      setView(initial)
      drawCanvas(initial)
      setIsLoaded(true)
    }
    img.onerror = () => { setLoadError(true); setIsLoaded(true) }
    img.src = src

    return () => {  }
  }, [file, imageUrl, isRegularImage, drawCanvas])

  // Redraw whenever view changes
  useEffect(() => {
    if (isRegularImage) drawCanvas(view)
  }, [view, isRegularImage, drawCanvas])

  // Resize canvas to match container
  useEffect(() => {
    if (!isRegularImage) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ro = new ResizeObserver(() => {
      const parent = canvas.parentElement
      if (!parent) return
      canvas.width  = parent.clientWidth
      canvas.height = parent.clientHeight
      drawCanvas(view)
    })
    if (canvas.parentElement) ro.observe(canvas.parentElement)
    return () => ro.disconnect()
  }, [isRegularImage, view, drawCanvas])

  // ── Mouse handlers for regular image ────────────────────────────────────────
  const onMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    if (activeTool === 'Pan') {
      dragRef.current = { startX: e.clientX, startY: e.clientY, startOX: view.offsetX, startOY: view.offsetY }
    } else if (activeTool === 'Wwwc') {
      wlRef.current = { startX: e.clientX, startY: e.clientY, startB: view.brightness, startC: view.contrast }
    }
  }, [activeTool, view])

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeTool === 'Pan' && dragRef.current) {
      const dx = e.clientX - dragRef.current.startX
      const dy = e.clientY - dragRef.current.startY
      setView(v => ({ ...v, offsetX: dragRef.current!.startOX + dx, offsetY: dragRef.current!.startOY + dy }))
    } else if (activeTool === 'Wwwc' && wlRef.current) {
      // Horizontal drag → contrast, vertical drag → brightness
      const dx = e.clientX - wlRef.current.startX
      const dy = e.clientY - wlRef.current.startY
      const newB = Math.max(0, Math.min(300, wlRef.current.startB - dy * 0.5))
      const newC = Math.max(0, Math.min(300, wlRef.current.startC + dx * 0.5))
      setView(v => ({ ...v, brightness: newB, contrast: newC }))
    }
  }, [activeTool])

  const onMouseUp = useCallback(() => {
    dragRef.current = null
    wlRef.current   = null
  }, [])

  const onWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    if (activeTool === 'Zoom' || activeTool === 'Pan') {
      const delta = e.deltaY > 0 ? 0.9 : 1.1
      setView(v => ({ ...v, scale: Math.max(0.1, Math.min(10, v.scale * delta)) }))
    }
  }, [activeTool])

  const handleReset = useCallback(() => {
    const canvas = canvasRef.current
    const img    = imgRef.current
    if (canvas && img) {
      const scaleX = canvas.width  / img.naturalWidth
      const scaleY = canvas.height / img.naturalHeight
      const fitScale = Math.min(scaleX, scaleY, 1)
      setView({ ...DEFAULT_VIEW, scale: fitScale })
    }
  }, [])

  // ── DICOM setup ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isDicom || !viewerRef.current) return
    const element = viewerRef.current
    
    try { cornerstone.enable(element) } catch(e) {}
    
    // Explicitly add tools to this new element instance (safe for StrictMode remounts)
    try {
      cornerstoneTools.addToolForElement(element, cornerstoneTools.WwwcTool)
      cornerstoneTools.addToolForElement(element, cornerstoneTools.PanTool)
      cornerstoneTools.addToolForElement(element, cornerstoneTools.ZoomTool)
      cornerstoneTools.addToolForElement(element, cornerstoneTools.LengthTool)
    } catch(e) {}

    cornerstoneTools.setToolActiveForElement(element, 'Pan', { mouseButtonMask: 1 })

    const loadImage = async () => {
      try {
        let imageId = ''
        if (file?.name.toLowerCase().endsWith('.dcm')) {
          imageId = cornerstoneWADOImageLoader.wadouri.fileManager.add(file)
        } else if (imageUrl?.toLowerCase().endsWith('.dcm')) {
          imageId = `wadouri:${imageUrl}`
        }
        if (imageId) {
          const image = await cornerstone.loadImage(imageId)
          cornerstone.displayImage(element, image)
          cornerstoneTools.addStackStateManager(element, ['stack'])
          cornerstoneTools.addToolState(element, 'stack', { currentImageIdIndex: 0, imageIds: [imageId] })
          
          cornerstoneTools.setToolActiveForElement(element, 'Pan',  { mouseButtonMask: 1 })
          cornerstoneTools.setToolActiveForElement(element, 'Zoom', { mouseButtonMask: 2 })
          cornerstoneTools.setToolActiveForElement(element, 'Wwwc', { mouseButtonMask: 4 })
          setIsLoaded(true)
        }
      } catch (err) {
        console.error('Failed to load DICOM:', err)
        setLoadError(true)
        setIsLoaded(true)
      }
    }
    loadImage()
    return () => { try { cornerstone.disable(element) } catch (e) { /* ignore */ } }
  }, [file, imageUrl, isDicom])

  const handleDicomToolActivate = (toolName: string) => {
    if (!viewerRef.current) return
    const element = viewerRef.current
    ;['Pan', 'Wwwc', 'Zoom', 'Length'].forEach(t => {
      try { cornerstoneTools.setToolPassiveForElement(element, t) } catch (e) { /* ignore */ }
    })
    cornerstoneTools.setToolActiveForElement(element, toolName, { mouseButtonMask: 1 })
    setActiveTool(toolName)
  }

  const handleDicomReset = () => {
    if (!viewerRef.current) return
    const viewport = cornerstone.getDefaultViewport(
      viewerRef.current,
      cornerstone.getImage(viewerRef.current)
    )
    cornerstone.setViewport(viewerRef.current, viewport)
  }

  // ── Toolbar definition (shared for both modes) ────────────────────────────
  const tools = [
    { icon: Sun,    tool: 'Wwwc',   title: 'Window / Brightness' },
    { icon: Move,   tool: 'Pan',    title: 'Pan'                  },
    { icon: ZoomIn, tool: 'Zoom',   title: 'Zoom'                 },
    { icon: Ruler,  tool: 'Length', title: 'Measure (DICOM only)' },
  ]

  const handleToolClick = (toolName: string) => {
    if (isDicom) {
      handleDicomToolActivate(toolName)
    } else {
      // For regular images, Measure is not applicable
      if (toolName === 'Length') return
      setActiveTool(toolName)
    }
  }

  const handleResetClick = () => {
    if (isDicom) handleDicomReset()
    else handleReset()
  }

  // ── Cursor style ─────────────────────────────────────────────────────────────
  const cursorStyle =
    activeTool === 'Pan'   ? 'grab'      :
    activeTool === 'Zoom'  ? 'zoom-in'   :
    activeTool === 'Wwwc'  ? 'crosshair' : 'default'

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="relative w-full h-full flex flex-col bg-black overflow-hidden">

      {/* ── Regular image: canvas renderer ── */}
      {isRegularImage && (
        <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%' }}>
          {!isLoaded && !loadError && (
            <div className="absolute inset-0 flex items-center justify-center text-slate-400">
              <span className="animate-pulse">Loading image…</span>
            </div>
          )}
          {loadError && (
            <div className="absolute inset-0 flex items-center justify-center text-red-400">
              Failed to load image
            </div>
          )}
          <canvas
            ref={canvasRef}
            style={{ width: '100%', height: '100%', display: 'block', cursor: cursorStyle }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onWheel={onWheel}
          />
        </div>
      )}

      {/* ── DICOM viewer ── */}
      {isDicom && (
        <div
          ref={viewerRef}
          className="flex-1 w-full relative bg-black"
          style={{ height: '100%' }}
          onContextMenu={e => e.preventDefault()}
        >
          {!isLoaded && !loadError && (
            <div className="absolute inset-0 flex items-center justify-center text-slate-400">
              <span className="animate-pulse">Loading DICOM…</span>
            </div>
          )}
        </div>
      )}

      {/* ── Toolbar (always visible when a file is loaded) ── */}
      {(isRegularImage || isDicom) && (
        <div className="absolute top-3 left-3 flex gap-2 z-20">
          {tools.map(item => {
            const isDisabled = !isDicom && item.tool === 'Length'
            return (
              <button
                key={item.tool}
                onClick={() => handleToolClick(item.tool)}
                disabled={isDisabled}
                className={clsx(
                  'p-2 rounded-lg backdrop-blur transition-all border',
                  isDisabled
                    ? 'bg-slate-900/30 border-slate-800 text-slate-600 cursor-not-allowed opacity-40'
                    : activeTool === item.tool
                      ? 'bg-indigo-600 border-indigo-400 text-white'
                      : 'bg-slate-900/70 border-slate-700 text-slate-300 hover:bg-slate-800'
                )}
                title={item.title}
              >
                <item.icon className="w-5 h-5" />
              </button>
            )
          })}

          {/* Reset */}
          <button
            onClick={handleResetClick}
            className="p-2 rounded-lg bg-slate-900/70 border border-slate-700 text-slate-300 hover:bg-slate-800 transition-all"
            title="Reset View"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {/* Metadata (DICOM only) */}
          {isDicom && (
            <button
              onClick={() => setShowMetadata(!showMetadata)}
              className={clsx(
                'p-2 rounded-lg border transition-all',
                showMetadata
                  ? 'bg-indigo-600 border-indigo-400 text-white'
                  : 'bg-slate-900/70 border-slate-700 text-slate-300'
              )}
              title="Metadata"
            >
              <Info className="w-5 h-5" />
            </button>
          )}

          {/* W/L indicator for regular images */}
          {isRegularImage && activeTool === 'Wwwc' && (
            <div style={{
              background: 'rgba(15,23,42,0.8)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              padding: '4px 10px',
              fontSize: 11,
              color: '#94a3b8',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <span>B: {Math.round(view.brightness)}%</span>
              <span>C: {Math.round(view.contrast)}%</span>
            </div>
          )}
        </div>
      )}

      {/* ── DICOM Metadata Panel ── */}
      {showMetadata && metadata && (
        <div className="absolute right-0 top-0 bottom-0 w-72 bg-slate-900/95 border-l border-slate-700 p-4 overflow-y-auto z-30">
          <h3 className="text-white text-sm font-semibold mb-4 uppercase tracking-wide">DICOM Metadata</h3>
          <div className="space-y-3">
            {Object.entries(metadata).map(([key, value]) => (
              <div key={key} className="border-b border-slate-800 pb-2">
                <div className="text-slate-500 text-xs capitalize mb-1">{key.replace(/_/g, ' ')}</div>
                <div className="text-slate-200 text-xs break-all font-mono">{String(value)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
