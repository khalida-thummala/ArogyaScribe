import { useEffect, useRef } from 'react'

interface Props {
  analyser: AnalyserNode | null
  isRecording: boolean
}

export default function AudioVisualizer({ analyser, isRecording }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

  useEffect(() => {
    if (!canvasRef.current || !analyser || !isRecording) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw)
      analyser.getByteFrequencyData(dataArray)

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw aesthetic waveform
      const barWidth = (canvas.width / bufferLength) * 2.5
      let barHeight
      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * canvas.height * 0.8
        
        // Use a nice gradient for production look
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0)
        gradient.addColorStop(0, '#0d9488') // Teal-600
        gradient.addColorStop(1, '#2dd4bf') // Teal-400
        
        ctx.fillStyle = gradient
        
        // Draw bars symmetrically for a modern "voice" look
        const y = (canvas.height - barHeight) / 2
        ctx.beginPath()
        ctx.roundRect(x, y, barWidth - 1, barHeight, 4)
        ctx.fill()

        x += barWidth + 1
      }
    }

    draw()

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current)
    }
  }, [analyser, isRecording])

  return (
    <div style={{ 
      width: '100%', 
      height: 80, 
      background: 'var(--surface-hover)', 
      borderRadius: 12,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      border: '1px solid var(--border)',
      position: 'relative'
    }}>
      {!isRecording && <div style={{ color: 'var(--text-4)', fontSize: 12 }}>Visualizer ready</div>}
      <canvas 
        ref={canvasRef} 
        width={400} 
        height={60} 
        style={{ width: '100%', height: '60px', display: isRecording ? 'block' : 'none' }} 
      />
    </div>
  )
}
