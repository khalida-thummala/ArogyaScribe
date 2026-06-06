import { useState, useEffect, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { consultationsApi } from '@/api/consultations'
import { useRecording } from '@/hooks/useRecording'
import { useAutoSave } from '@/hooks/useAutoSave'
import { useConsultationStore } from '@/store/consultationStore'
import {
  Mic,
  StopCircle,
  Pause,
  Play,
  Loader2,
  Info,
  WifiOff,
  RotateCcw,
} from 'lucide-react'
import AudioVisualizer from './AudioVisualizer'
import toast from 'react-hot-toast'

interface Props {
  consultationId: string
  onComplete: () => void
}

export default function RecordingPanel({ consultationId, onComplete }: Props) {

  const { isRecording, start, pause, resume, stop, analyser } = useRecording()

  const { recSeconds, transcript, liveText, appendTranscript, reset } = useConsultationStore()

  const [phase, setPhase] = useState<'idle' | 'recording' | 'paused' | 'stopping' | 'done'>('idle')

  // Reset store state on mount so stale isPaused/transcript from a previous session don't bleed in
  useEffect(() => {
    reset()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  // Track online/offline
  useEffect(() => {
    const onOnline  = () => setIsOnline(true)
    const onOffline = () => setIsOnline(false)
    window.addEventListener('online',  onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online',  onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  // Auto-save — active while recording or paused (not after stop)
  const autoSaveEnabled = phase === 'recording' || phase === 'paused'
  useAutoSave({
    consultationId,
    getTranscript: () => useConsultationStore.getState().transcript,
    enabled: autoSaveEnabled,
  })

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
  }

  useEffect(() => { return () => stopPolling() }, [])

  const pollStatus = () => {
    if (pollIntervalRef.current) return
    pollIntervalRef.current = setInterval(async () => {
      try {
        const consultation = await consultationsApi.get(consultationId)
        if (consultation.status === 'completed') {
          stopPolling()
          if (consultation.transcription_text) {
            appendTranscript(consultation.transcription_text)
          }
          toast.success('Consultation completed and report generated!')
          setPhase('done')
          setTimeout(onComplete, 3000)
        } else if (
          consultation.status === 'failed' ||
          consultation.status === 'failed_transcription' ||
          consultation.status === 'failed_soap'
        ) {
          stopPolling()
          toast.error('Audio processing or AI generation failed. Please try again.')
          setPhase('idle')
        }
      } catch (err) {
        console.error('Polling error:', err)
      }
    }, 5000)
  }

  // END CONSULTATION
  const endMut = useMutation({
    mutationFn: (audioBlob: Blob) => consultationsApi.end(consultationId, audioBlob),
    onSuccess: () => {
      toast.success('Audio uploaded. Processing in background...')
      pollStatus()
    },
    onError: (err: any) => {
      const detail = err.response?.data?.detail
      const msg = Array.isArray(detail)
        ? detail.map((d: any) => d.msg ?? JSON.stringify(d)).join(', ')
        : (typeof detail === 'string' ? detail : 'Failed to end consultation')
      toast.error(msg)
      setPhase('idle')
    },
  })

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleStart = async () => {
    setPhase('recording')
    await start()
  }

  const handlePause = () => {
    pause()
    setPhase('paused')
  }

  const handleResume = async () => {
    setPhase('recording')
    await resume()
  }

  const handleStop = async () => {
    setPhase('stopping')
    const audioBlob = await stop()
    if (audioBlob.size < 1000) {
      toast.error('Recording is empty. Please check microphone access and try again.')
      setPhase('idle')
      return
    }
    endMut.mutate(audioBlob)
  }

  const handleRestart = async () => {
    // Discard current recording and start fresh
    await stop().catch(() => {}) // stop the stream silently
    reset()
    setPhase('idle')
    toast('Recording discarded. Ready to start fresh.', { icon: '🔄' })
  }

  // ── Timer display ──────────────────────────────────────────────────────────
  const minutes = Math.floor(recSeconds / 60).toString().padStart(2, '0')
  const seconds = (recSeconds % 60).toString().padStart(2, '0')

  return (
    <div style={{ padding: '8px 0' }}>

      {/* OFFLINE BANNER */}
      {!isOnline && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '10px 14px',
          background: '#fef3c7',
          color: '#92400e',
          borderRadius: 10,
          fontSize: 12,
          marginBottom: 16,
          border: '1px solid #fcd34d',
        }}>
          <WifiOff size={14} />
          No internet connection — auto-saves are queued locally and will sync when you're back online.
        </div>
      )}

      {/* TIMER + VISUALIZER */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: 24,
        marginBottom: 20,
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <div style={{
            fontSize: 56,
            fontWeight: 700,
            fontFamily: 'DM Sans, monospace',
            color: phase === 'recording' ? '#e74c3c' : phase === 'paused' ? '#f59e0b' : 'var(--text-1)',
            transition: 'color 0.3s',
            letterSpacing: -1,
          }}>
            {minutes}:{seconds}
          </div>
        </div>

        <AudioVisualizer analyser={analyser} isRecording={isRecording} />

        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <div style={{
            fontSize: 13,
            fontWeight: 600,
            color: phase === 'recording' ? '#e74c3c' : phase === 'paused' ? '#f59e0b' : 'var(--text-3)',
          }}>
            {phase === 'idle'     && 'READY TO RECORD'}
            {phase === 'recording' && (
              <span className="pulse" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#e74c3c' }} />
                LIVE RECORDING
              </span>
            )}
            {phase === 'paused'   && '⏸ PAUSED'}
            {phase === 'stopping' && 'PROCESSING AUDIO...'}
            {phase === 'done'     && '✓ SESSION COMPLETE'}
          </div>
        </div>
      </div>

      {/* INFO BOX */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 14px', background: '#eff6ff', color: '#2563eb',
        borderRadius: 10, fontSize: 12, marginBottom: 20, border: '1px solid #bfdbfe',
      }}>
        <Info size={14} />
        Audio is processed using real AI transcription.
        {autoSaveEnabled && (
          <span style={{ marginLeft: 'auto', opacity: 0.7 }}>
            Auto-saving every 30s
          </span>
        )}
      </div>

      {/* LIVE TRANSCRIPT */}
      {(phase === 'recording' || phase === 'paused' || phase === 'stopping') && (
        <div style={{
          background: 'var(--surface-hover)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 18,
          marginBottom: 24,
          minHeight: 120,
          maxHeight: 220,
          overflowY: 'auto',
          fontSize: 14,
          lineHeight: 1.6,
          color: 'var(--text-2)',
        }}>
          {(transcript || liveText) ? (
            <div>
              {transcript && <span>{transcript}</span>}
              {liveText && (
                <span style={{ color: 'var(--text-4)', fontStyle: 'italic' }}>
                  {transcript ? ' ' : ''}{liveText}
                </span>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginTop: 20 }}>
              <Loader2 size={20} className="spin" style={{ color: 'var(--text-4)' }} />
              <span style={{ color: 'var(--text-4)', fontStyle: 'italic' }}>
                {phase === 'paused' ? 'Recording paused…' : 'Listening for speech…'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* FINAL TRANSCRIPT */}
      {phase === 'done' && transcript && (
        <div style={{
          background: '#f0fdf4', border: '1px solid #bbf7d0',
          borderRadius: 12, padding: 18, marginBottom: 24,
          fontSize: 14, lineHeight: 1.6, color: '#166534',
        }}>
          <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 12, textTransform: 'uppercase', opacity: 0.7 }}>
            Final Transcript
          </div>
          {transcript}
        </div>
      )}

      {/* BUTTONS */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>

        {phase === 'idle' && (
          <button onClick={handleStart} className="btn btn-primary"
            style={{ padding: '14px 40px', borderRadius: 12, fontSize: 15 }}>
            <Mic size={18} /> Start Session
          </button>
        )}

        {phase === 'recording' && (
          <>
            <button onClick={handlePause}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '14px 28px', background: '#f59e0b', color: '#fff',
                border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600,
                cursor: 'pointer', boxShadow: '0 4px 12px rgba(245,158,11,0.3)',
              }}>
              <Pause size={18} /> Pause
            </button>
            <button onClick={handleStop}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '14px 28px', background: '#e74c3c', color: '#fff',
                border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600,
                cursor: 'pointer', boxShadow: '0 4px 12px rgba(231,76,60,0.3)',
              }}>
              <StopCircle size={18} /> Stop & Generate SOAP
            </button>
            <button onClick={handleRestart}
              title="Discard recording and start fresh"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '14px 20px', background: 'var(--surface)', color: 'var(--text-3)',
                border: '1px solid var(--border)', borderRadius: 12, fontSize: 15, fontWeight: 600,
                cursor: 'pointer',
              }}>
              <RotateCcw size={16} /> Restart
            </button>
          </>
        )}

        {phase === 'paused' && (
          <>
            <button onClick={handleResume}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '14px 28px', background: '#10b981', color: '#fff',
                border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600,
                cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
              }}>
              <Play size={18} /> Resume
            </button>
            <button onClick={handleStop}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '14px 28px', background: '#e74c3c', color: '#fff',
                border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600,
                cursor: 'pointer', boxShadow: '0 4px 12px rgba(231,76,60,0.3)',
              }}>
              <StopCircle size={18} /> Stop & Generate SOAP
            </button>
            <button onClick={handleRestart}
              title="Discard recording and start fresh"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '14px 20px', background: 'var(--surface)', color: 'var(--text-3)',
                border: '1px solid var(--border)', borderRadius: 12, fontSize: 15, fontWeight: 600,
                cursor: 'pointer',
              }}>
              <RotateCcw size={16} /> Restart
            </button>
          </>
        )}

        {phase === 'stopping' && (
          <button disabled style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '14px 40px', background: 'var(--border)', color: 'var(--text-3)',
            border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 600, cursor: 'not-allowed',
          }}>
            <Loader2 size={18} className="spin" /> Processing Audio...
          </button>
        )}

      </div>
    </div>
  )
}
