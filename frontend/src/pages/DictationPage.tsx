import { useState, useRef, useEffect, useCallback } from 'react'
import { 
  Mic, MicOff, Upload, FileText, Printer, Save,
  RefreshCw, Trash2, ArrowRight, User, AlertCircle,
  Volume2, Pause, Play, WifiOff, RotateCcw
} from 'lucide-react'
import { dictationApi } from '@/api/dictation'
import { saveOfflineRecording } from '@/offline/offlineStorage'
import { useQuery } from '@tanstack/react-query'
import { patientsApi } from '@/api/patients'
import { useDictationStore } from '@/store/dictationStore'
import { apiClient } from '@/api/client'
import { enqueue } from '@/lib/offlineQueue'
import toast from 'react-hot-toast'
import { TemplateSelector } from '@/components/TemplateSelector'
import { reportTemplatesApi } from '@/api/report_templates'

// Extended window type for webkitSpeechRecognition
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export default function DictationPage() {
  const {
    patientId, setPatientId,
    letterhead, setLetterhead,
    transcript, setTranscript,
    realtimeText, setRealtimeText,
    statusText, setStatusText,
    report, setReport,
    currentReportId, setCurrentReportId,
    clearDictation
  } = useDictationStore()

  const [letterheadPreview, setLetterheadPreview] = useState<string | null>(null)
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isProcessing, setIsProcessing] = useState(false)
  const [pdfGenerating, setPdfGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('minimal')

  // MediaRecorder refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingMimeTypeRef = useRef('audio/webm')
  const streamRef = useRef<MediaStream | null>(null)
  
  // AssemblyAI WebSocket + AudioWorklet refs
  const wsRef = useRef<WebSocket | null>(null)
  const workletNodeRef = useRef<AudioWorkletNode | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const sessionReadyRef = useRef(false)
  const pausedRef = useRef(false)          // blocks PCM sends while paused
  const finalTranscriptRef = useRef('')

  // Auto-save refs
  const autoSaveIntervalRef = useRef<number | null>(null)
  const lastSavedTranscriptRef = useRef('')

  // Online/offline tracking
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


  // Fetch patients list for context
  const { data: patients } = useQuery({
    queryKey: ['patients'],
    queryFn: () => patientsApi.list(),
  })

  // Fetch templates for live preview
  const { data: templates } = useQuery({
    queryKey: ['report_templates'],
    queryFn: () => reportTemplatesApi.list(),
  })

  const currentTemplate = templates?.find((t: any) => t.type_key === selectedTemplate)

  // Handle letterhead upload
  const handleLetterheadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setLetterhead(file)
      
      const reader = new FileReader()
      reader.onloadend = () => {
        setLetterheadPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Clear current dictation
  const handleClear = () => {
    clearDictation()
    setErrorMsg('')
    setSaveSuccess(false)
  }

  // ── Auto-save helpers ─────────────────────────────────────────────────────
  const doAutoSave = useCallback(async () => {
    const current = useDictationStore.getState().transcript
    if (!current || current === lastSavedTranscriptRef.current) return

    const payload = { transcription_text: current, updated_at: new Date().toISOString() }

    if (!navigator.onLine) {
      await enqueue({ consultationId: 'dictation-draft', transcriptionText: current, updatedAt: new Date().toISOString() })
      return
    }
    try {
      // Persist to localStorage as a simple draft (dictation has no consultation_id)
      localStorage.setItem('dictation_draft_transcript', current)
      localStorage.setItem('dictation_draft_saved_at', payload.updated_at)
      lastSavedTranscriptRef.current = current
      console.log('[DictationAutoSave] Draft saved to localStorage')
    } catch (err) {
      console.warn('[DictationAutoSave] Save failed:', err)
      toast.error('Auto-save failed', { id: 'dictation-autosave-fail' })
    }
  }, [])

  const startAutoSave = useCallback(() => {
    if (autoSaveIntervalRef.current) return
    autoSaveIntervalRef.current = window.setInterval(doAutoSave, 30_000)
  }, [doAutoSave])

  const stopAutoSave = useCallback(async (finalSave = true) => {
    if (autoSaveIntervalRef.current) {
      window.clearInterval(autoSaveIntervalRef.current)
      autoSaveIntervalRef.current = null
    }
    if (finalSave) await doAutoSave()
  }, [doAutoSave])

  // ── AssemblyAI session setup ───────────────────────────────────────────────
  const connectAssemblyAI = useCallback(async (
    audioContext: AudioContext,
    source: MediaStreamAudioSourceNode
  ) => {
    const { data } = await apiClient.get('/speech/assemblyai-token')
    const token = data.token

    const wsUrl =
      `wss://streaming.assemblyai.com/v3/ws` +
      `?sample_rate=16000` +
      `&speech_model=universal-streaming-english` +
      `&format_turns=true` +
      `&token=${token}`

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => console.log('[AssemblyAI] WebSocket connected (v3)')

    ws.onmessage = (message) => {
      let res: any
      try { res = JSON.parse(message.data) } catch { return }

      if (res.error) {
        console.error('[AssemblyAI] Error:', res.error)
        setStatusText('Live transcription error: ' + res.error)
        return
      }

      if (res.type === 'Begin') {
        console.log('[AssemblyAI] Session ready — id:', res.id)
        sessionReadyRef.current = true
        return
      }

      if (res.type === 'Turn') {
        const turnText: string = res.transcript || ''
        if (!res.end_of_turn) {
          setRealtimeText(turnText)
        } else {
          if (turnText) {
            finalTranscriptRef.current = `${finalTranscriptRef.current} ${turnText}`.trim()
            setTranscript(finalTranscriptRef.current)
          }
          setRealtimeText('')
        }
      }
    }

    ws.onerror = () => console.error('[AssemblyAI] WebSocket error')

    ws.onclose = (evt) => {
      console.log('[AssemblyAI] WebSocket closed', evt.code, evt.reason)
      wsRef.current = null
      sessionReadyRef.current = false
    }

    // Inline AudioWorklet PCM pipeline to avoid path issues
    const workletCode = `
      class PCMProcessor extends AudioWorkletProcessor {
        constructor() {
          super();
          this._buffer = new Float32Array(0);
          this._targetSamples = 1600;
        }
        process(inputs) {
          const input = inputs[0];
          if (!input || !input[0]) return true;
          const chunk = input[0];
          const merged = new Float32Array(this._buffer.length + chunk.length);
          merged.set(this._buffer);
          merged.set(chunk, this._buffer.length);
          this._buffer = merged;
          while (this._buffer.length >= this._targetSamples) {
            const slice = this._buffer.slice(0, this._targetSamples);
            this._buffer = this._buffer.slice(this._targetSamples);
            const int16 = new Int16Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
              const s = Math.max(-1, Math.min(1, slice[i]));
              int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
            }
            this.port.postMessage(int16.buffer, [int16.buffer]);
          }
          return true;
        }
      }
      registerProcessor('pcm-processor', PCMProcessor);
    `;
    const blob = new Blob([workletCode], { type: 'application/javascript' });
    const workletUrl = URL.createObjectURL(blob);
    
    await audioContext.audioWorklet.addModule(workletUrl)
    const worklet = new AudioWorkletNode(audioContext, 'pcm-processor')
    workletNodeRef.current = worklet

    worklet.port.onmessage = (e: MessageEvent<ArrayBuffer>) => {
      if (
        pausedRef.current ||
        !wsRef.current ||
        wsRef.current.readyState !== WebSocket.OPEN ||
        !sessionReadyRef.current
      ) return
      wsRef.current.send(e.data)
    }

    source.connect(worklet)
    worklet.connect(audioContext.destination)
  }, [setRealtimeText, setTranscript, setStatusText])

  // Initialize Speech Recognition for Real-time Display
  // Native SpeechRecognition is removed due to Chromium Electron network errors.

  // Start recording audio and live transcription
  const startRecording = async () => {
    setErrorMsg('')
    setRealtimeText('')
    audioChunksRef.current = []
    finalTranscriptRef.current = useDictationStore.getState().transcript || ''
    lastSavedTranscriptRef.current = finalTranscriptRef.current
    pausedRef.current = false

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 })
      if (audioContext.state === 'suspended') {
        await audioContext.resume()
      }
      audioContextRef.current = audioContext
      const source = audioContext.createMediaStreamSource(stream)
      sourceRef.current = source

      // AssemblyAI WebSocket + AudioWorklet
      try {
        await connectAssemblyAI(audioContext, source)
      } catch (err: any) {
        console.warn('[Recording] Could not start AssemblyAI:', err)
        setStatusText('Live transcription unavailable: ' + (err.response?.data?.detail || err.message))
      }

      // Setup audio recording — pick the best supported MIME type
      const preferredMimeType = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus',
      ].find((type) => MediaRecorder.isTypeSupported(type))

      const mediaRecorder = preferredMimeType
        ? new MediaRecorder(stream, { mimeType: preferredMimeType })
        : new MediaRecorder(stream)

      recordingMimeTypeRef.current = mediaRecorder.mimeType || preferredMimeType || 'audio/webm'
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        if (audioContextRef.current) {
          audioContextRef.current.close()
          audioContextRef.current = null
        }
        const audioBlob = new Blob(audioChunksRef.current, { type: recordingMimeTypeRef.current })
        streamRef.current?.getTracks().forEach(track => track.stop())
        streamRef.current = null
        await processAudio(audioBlob)
      }

      mediaRecorder.start(250)
      setIsRecording(true)
      setIsPaused(false)
      setStatusText('Listening actively... speak now.')
      startAutoSave()

    } catch (err: any) {
      console.error('Failed to get media devices', err)
      setErrorMsg('Could not access your microphone. Please check system permissions.')
      setStatusText('Microphone access denied.')
    }
  }

  // Stop recording
  const stopRecording = async () => {
    if (!mediaRecorderRef.current) return

    await stopAutoSave(true)  // final save before stopping

    setIsRecording(false)
    setIsPaused(false)
    setStatusText('Recording stopped. Processing audio...')

    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'Terminate' }))
      }
      wsRef.current.close()
      wsRef.current = null
      sessionReadyRef.current = false
    }
    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect()
      workletNodeRef.current = null
    }

    // If paused, resume briefly so onstop fires
    if (mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume()
    }
    if (mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }

  // Pause recording
  const pauseRecording = async () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') return

    pausedRef.current = true
    mediaRecorderRef.current.pause()

    // Terminate AssemblyAI session while paused
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'Terminate' }))
      wsRef.current.close()
      wsRef.current = null
      sessionReadyRef.current = false
    }

    setIsRecording(false)
    setIsPaused(true)
    setStatusText('Recording paused. Click Resume to continue.')
    await stopAutoSave(true)  // save current transcript on pause
  }

  // Resume recording
  const resumeRecording = async () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'paused') return

    pausedRef.current = false
    mediaRecorderRef.current.resume()

    // Re-establish AssemblyAI session
    if (audioContextRef.current && streamRef.current) {
      try {
        const source = audioContextRef.current.createMediaStreamSource(streamRef.current)
        if (workletNodeRef.current) {
          workletNodeRef.current.disconnect()
          workletNodeRef.current = null
        }
        await connectAssemblyAI(audioContextRef.current, source)
      } catch (err: any) {
        console.warn('[Recording] AssemblyAI reconnect failed:', err)
        setStatusText('Live transcription reconnect failed — audio still recording.')
      }
    }

    setIsRecording(true)
    setIsPaused(false)
    setStatusText('Listening actively... speak now.')
    startAutoSave()
  }

  // Restart recording (discard current and reset)
  const handleRestart = async () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.onstop = null
      if (mediaRecorderRef.current.state === 'paused') {
        mediaRecorderRef.current.resume()
      }
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
      mediaRecorderRef.current = null
    }

    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'Terminate' }))
      }
      wsRef.current.close()
      wsRef.current = null
      sessionReadyRef.current = false
    }

    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect()
      workletNodeRef.current = null
    }

    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }

    streamRef.current?.getTracks().forEach(track => track.stop())
    streamRef.current = null

    await stopAutoSave(false)

    setIsRecording(false)
    setIsPaused(false)
    
    clearDictation()
    finalTranscriptRef.current = ''
    setErrorMsg('')
    toast('Recording discarded. Ready to start fresh.', { icon: '🔄' })
  }

  // Process the final audio blob
  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true)
    setStatusText('Transcribing speech and generating structured clinical report...')
    setErrorMsg('')

    // Find patient context if selected
    let patientContext = ''
    if (patientId && patients) {
      const selectedPat = patients.find((p: any) => p.patient_id === patientId)
      if (selectedPat) {
        patientContext = `Patient Name: ${selectedPat.first_name} ${selectedPat.last_name}, DOB: ${selectedPat.date_of_birth}, Gender: ${selectedPat.gender}. Medical History: ${selectedPat.medical_history || 'None recorded'}.`
      }
    }

    try {
      if (audioBlob.size < 1000) {
        toast.error('Recording is too short or empty. Please check your microphone and try again.')
        setStatusText('Recording was empty.')
        setIsProcessing(false)
        return
      }

      if (!navigator.onLine) {
        await saveOfflineRecording({
          id: crypto.randomUUID(),
          patientId,
          patientContext,
          audioBlob,
          letterhead,
          transcript,
          createdAt: new Date().toISOString()
        })

        toast.success('Saved locally. Will sync later.')
        setStatusText('Offline mode - recording saved.')
        setIsProcessing(false)
        return
      }

      const response = await dictationApi.transcribeAndReport(audioBlob, letterhead, patientContext, selectedTemplate)
      
      if (response.success && response.report) {
        setReport(response.report)
        // If AssemblyAI returned a more comprehensive transcript than real-time, use it!
        if (response.transcript) {
          setTranscript(response.transcript)
        }
        setStatusText('Report generated successfully!')
      } else {
        const errorText = response.error || 'Failed to process clinical dictation.'
        // If the backend failed because it couldn't reach AssemblyAI/OpenAI (common when testing offline on localhost)
        if (errorText.toLowerCase().includes('connection') || errorText.toLowerCase().includes('resolve host')) {
          await saveOfflineRecording({
            id: crypto.randomUUID(),
            patientId,
            patientContext,
            audioBlob,
            letterhead,
            transcript,
            createdAt: new Date().toISOString()
          })
          toast.success('Saved locally. Will sync later.')
          setStatusText('Offline mode - recording saved.')
          return
        }

        setErrorMsg(errorText)
        setStatusText('Generation failed.')
      }
    } catch (err: any) {
      console.error(err)
      const errorDetail = err.response?.data?.detail || err.message || 'An unexpected error occurred.'
      
      // If the frontend couldn't reach the backend (production offline behavior) or backend throws a connection error
      if (err.code === 'ERR_NETWORK' || err.message === 'Network Error' || errorDetail.toLowerCase().includes('connection') || errorDetail.toLowerCase().includes('name resolution')) {
        await saveOfflineRecording({
          id: crypto.randomUUID(),
          patientId,
          patientContext,
          audioBlob,
          letterhead,
          transcript,
          createdAt: new Date().toISOString()
        })
        toast.success('Saved locally. Will sync later.')
        setStatusText('Offline mode - recording saved.')
        return
      }

      setErrorMsg(errorDetail)
      setStatusText('Error occurred.')
    } finally {
      setIsProcessing(false)
    }
  };

  // Generate and download/print the PDF
  const handlePrint = async () => {
    if (!report) return
    setPdfGenerating(true)
    try {
      const blob = await dictationApi.generatePdfFromReport(report, letterhead, selectedTemplate)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `ArogyaScribe_Report_${report.patient_name.replace(/\s+/g, '_') || 'Patient'}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to generate PDF', err)
      alert('Failed to generate PDF for printing.')
    } finally {
      setPdfGenerating(false)
    }
  }

  const getPreviewStyles = (templateId: string) => {
    switch (templateId) {
      case 'apollo':
        return {
          fontFamily: 'Arial, sans-serif',
          headerColor: '#1e3a8a',
          sectionColor: '#1e3a8a',
          titleAlign: 'center' as const,
          borderStyle: '2px solid #1e3a8a'
        };
      case 'corporate':
        return {
          fontFamily: '"Times New Roman", Times, serif',
          headerColor: '#111827',
          sectionColor: '#374151',
          titleAlign: 'right' as const,
          borderStyle: '1px solid #d1d5db'
        };
      case 'pediatric':
        return {
          fontFamily: '"Comic Sans MS", "Chalkboard SE", sans-serif',
          headerColor: '#0ea5e9',
          sectionColor: '#0284c7',
          titleAlign: 'center' as const,
          borderStyle: '3px dashed #bae6fd'
        };
      case 'cardiology':
        return {
          fontFamily: 'Helvetica, Arial, sans-serif',
          headerColor: '#e11d48',
          sectionColor: '#be123c',
          titleAlign: 'center' as const,
          borderStyle: '2px solid #fda4af'
        };
      case 'minimal':
      default:
        return {
          fontFamily: 'Helvetica, Arial, sans-serif',
          headerColor: 'var(--teal-darker)',
          sectionColor: 'var(--teal)',
          titleAlign: 'center' as const,
          borderStyle: '1px solid #e5e7eb'
        };
    }
  }

  const previewStyles = getPreviewStyles(selectedTemplate);

  return (
    <div className="fade-in" style={{ paddingBottom: 40 }}>
      {/* ── Header ─────────────────────────── */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ fontSize: 'clamp(20px, 5vw, 28px)', color: 'var(--teal)' }}>Voice Dictation & Letterhead Reports</h1>
          <p className="page-subtitle">Speak out your clinical dictation, generate beautifully formatted medical reports, and print with your custom clinic letterhead instantly.</p>
        </div>
      </div>

      {/* ── Main Grid (responsive: side-by-side on desktop, stacked on mobile) ── */}
      <div className="dictation-layout" style={{ display: 'grid', gap: 24 }}>
        {/* ── LEFT: Input Panel ─────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Patient Context & Letterhead Setup */}
          <div className="card" style={{ padding: 22 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <User size={18} color="var(--teal)" />
              1. Setup Report Details
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Patient Selector */}
              <div className="form-group">
                <label className="form-label">Link Patient (Optional - enriches context)</label>
                <select 
                  className="form-control"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  style={{ height: 42 }}
                >
                  <option value="">-- Standard Dictation (No linked records) --</option>
                  {patients?.map((p: any) => (
                    <option key={p.patient_id} value={p.patient_id}>
                      {p.first_name} {p.last_name} ({p.gender}, DOB: {p.date_of_birth})
                    </option>
                  ))}
                </select>
              </div>

              {/* Letterhead File Upload */}
              <div className="form-group">
                <label className="form-label">Upload Clinic Letterhead (Header banner)</label>
                <div style={{
                  border: '2px dashed var(--border)',
                  borderRadius: 10,
                  padding: '16px 20px',
                  textAlign: 'center',
                  background: 'var(--surface-2)',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'border 0.2s',
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    const file = e.dataTransfer.files[0]
                    setLetterhead(file)
                    const reader = new FileReader()
                    reader.onloadend = () => setLetterheadPreview(reader.result as string)
                    reader.readAsDataURL(file)
                  }
                }}
                >
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleLetterheadChange}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      opacity: 0,
                      cursor: 'pointer',
                      width: '100%',
                      height: '100%',
                    }}
                  />
                  <Upload size={22} color="var(--text-3)" style={{ margin: '0 auto 8px' }} />
                  <p style={{ fontSize: 13, fontWeight: 500, margin: 0, color: 'var(--text-2)' }}>
                    {letterhead ? letterhead.name : 'Choose or drop letterhead image'}
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 4 }}>Supports PNG, JPEG, GIF. Recommended wide aspect ratio.</p>
                </div>

                {letterheadPreview && (
                  <div style={{ marginTop: 12, border: '1px solid var(--border)', borderRadius: 8, padding: 8, background: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)' }}>Letterhead Preview:</div>
                      <button onClick={() => { setLetterhead(null); setLetterheadPreview(null); }} className="btn-ghost" style={{ padding: 4, color: 'var(--rose)' }}><Trash2 size={12} /></button>
                    </div>
                    <img 
                      src={letterheadPreview} 
                      alt="Letterhead Preview" 
                      style={{ width: '100%', maxHeight: 90, objectFit: 'contain', borderRadius: 4 }}
                    />
                  </div>
                )}
              </div>
              {/* Template Selector */}
              <TemplateSelector 
                selectedTemplate={selectedTemplate} 
                onSelect={setSelectedTemplate} 
                disabled={isRecording || isProcessing}
              />
            </div>
          </div>

          {/* Speak & Capture Voice */}
          <div className="card" style={{ padding: 22, flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Volume2 size={18} color="var(--teal)" />
              2. Clinical Dictation
            </h3>

            {/* Offline banner */}
            {!isOnline && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 14px', background: '#fef3c7', color: '#92400e',
                borderRadius: 8, fontSize: 12, marginBottom: 16, border: '1px solid #fcd34d',
              }}>
                <WifiOff size={14} />
                No internet — transcript is being saved locally and will sync when you're back online.
              </div>
            )}

            {/* Glowing recording microphone */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '20px 0', gap: 12 }}>
              <button
                onClick={isRecording ? stopRecording : (isPaused ? stopRecording : startRecording)}
                disabled={isProcessing}
                className={`icon-box-premium ${isRecording ? 'recording' : ''}`}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  color: isRecording ? '#fff' : isPaused ? '#fff' : 'var(--teal)',
                  background: isRecording ? 'var(--grad-rose)' : isPaused ? '#f59e0b' : 'var(--teal-light)',
                  border: (isRecording || isPaused) ? 'none' : '2px solid var(--teal)',
                  cursor: 'pointer',
                  boxShadow: isRecording ? '0 0 20px rgba(244, 63, 94, 0.4)' : 'var(--shadow-sm)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isRecording ? <MicOff size={28} /> : isPaused ? <MicOff size={28} /> : <Mic size={28} />}
              </button>

              <div style={{ textAlign: 'center' }}>
                <span
                  className={`badge ${isRecording ? 'badge-red animate-pulse' : isPaused ? '' : 'badge-teal'}`}
                  style={{
                    fontSize: 12, padding: '4px 12px',
                    background: isPaused ? '#f59e0b' : undefined,
                    color: isPaused ? '#fff' : undefined,
                  }}
                >
                  {isRecording ? '● Live Recording Active' : isPaused ? '⏸ Paused' : 'Microphone Idle'}
                </span>
                <p style={{ fontSize: 12.5, color: 'var(--text-3)', marginTop: 8, maxWidth: 320 }}>
                  {statusText}
                </p>
              </div>

              {/* Pause / Resume controls */}
              {(isRecording || isPaused) && (
                <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                  {isRecording && (
                    <button
                      onClick={pauseRecording}
                      disabled={isProcessing}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 18px', background: '#f59e0b', color: '#fff',
                        border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <Pause size={14} /> Pause
                    </button>
                  )}
                  {isRecording && (
                    <button
                      onClick={handleRestart}
                      disabled={isProcessing}
                      title="Discard recording and start fresh"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 18px', background: 'var(--surface)', color: 'var(--text-3)',
                        border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <RotateCcw size={14} /> Restart
                    </button>
                  )}
                  {isPaused && (
                    <button
                      onClick={resumeRecording}
                      disabled={isProcessing}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 18px', background: '#10b981', color: '#fff',
                        border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <Play size={14} /> Resume
                    </button>
                  )}
                  {isPaused && (
                    <button
                      onClick={stopRecording}
                      disabled={isProcessing}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 18px', background: '#e74c3c', color: '#fff',
                        border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <MicOff size={14} /> Stop
                    </button>
                  )}
                  {isPaused && (
                    <button
                      onClick={handleRestart}
                      disabled={isProcessing}
                      title="Discard recording and start fresh"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 18px', background: 'var(--surface)', color: 'var(--text-3)',
                        border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      <RotateCcw size={14} /> Restart
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Real-time Subtitles / Live speech display */}
            {(realtimeText || isRecording || isPaused) && (
              <div style={{
                background: 'rgba(255, 239, 239, 0.4)',
                border: '1px solid rgba(244, 63, 94, 0.2)',
                borderRadius: 8,
                padding: '12px 16px',
                marginBottom: 16,
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--rose)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span className="pulse" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--rose)' }} />
                  Live Caption Feed:
                  {(isRecording || isPaused) && (
                    <span style={{ marginLeft: 'auto', fontWeight: 400, color: 'var(--text-4)', fontSize: 10 }}>
                      Auto-saving every 30s
                    </span>
                  )}
                </div>
                <p style={{ fontSize: 13, color: 'var(--text-1)', fontStyle: 'italic', margin: 0 }}>
                  {realtimeText || 'Speaking out to listen...'}
                </p>
              </div>
            )}

            {/* Main Edit Transcripts */}
            <div className="form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Voice Transcript (Editable)</span>
                {transcript && (
                  <button onClick={handleClear} className="btn-ghost" style={{ padding: '0 4px', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Trash2 size={12} /> Clear
                  </button>
                )}
              </label>
              <textarea
                className="form-control"
                placeholder="Click the microphone above and speak. Your voice transcript will appear here. You can also type or edit this text directly."
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                style={{ flex: 1, minHeight: 200, resize: 'vertical', fontSize: 13.5, lineHeight: 1.6 }}
              />
            </div>

            {errorMsg && (
              <div style={{
                background: 'var(--rose-light)',
                border: '1px solid #fecdd3',
                borderRadius: 8,
                padding: '10px 14px',
                color: 'var(--rose)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginTop: 16,
                fontSize: 13,
              }}>
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Action submit button */}
            {transcript && !isRecording && !isPaused && (
              <button
                disabled={isProcessing}
                onClick={async () => {
                  // Direct submit edited transcript
                  setIsProcessing(true);
                  setStatusText('AI is analysis and formatting...');
                  try {
                    // Let's create a dummy audio blob so we hit standard endpoint or simulate it
                    const blob = new Blob([transcript], { type: 'text/plain' });
                    await processAudio(blob);
                  } catch (e) {
                    console.error(e);
                  } finally {
                    setIsProcessing(false);
                  }
                }}
                className="btn btn-primary btn-lg"
                style={{
                  marginTop: 16,
                  width: '100%',
                  justifyContent: 'center',
                  background: 'var(--grad-teal)',
                  boxShadow: 'var(--shadow-teal)',
                }}
              >
                {isProcessing ? (
                  <>
                    <RefreshCw size={16} className="spin" /> Formatting clinical notes...
                  </>
                ) : (
                  <>
                    Generate Branded Report <ArrowRight size={16} />
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* ── RIGHT: Report Preview ─────────────────────── */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', background: 'var(--surface)' }}>
          <div style={{
            padding: '18px 22px 14px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--surface-2)',
            borderRadius: 'var(--radius) var(--radius) 0 0',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="icon-box-premium" style={{ color: 'var(--teal)' }}>
                <FileText size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: 16, margin: 0, fontWeight: 700 }}>
                  Report Preview
                </h3>
                <p style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>Interactive medical sheet preview</p>
              </div>
            </div>

            {report && (
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={async () => {
                    setIsSaving(true)
                    setSaveSuccess(false)
                    setErrorMsg('')
                    try {
                      const res = await dictationApi.save(report, letterhead, currentReportId, patientId)
                      if (res.report_id) {
                        setCurrentReportId(res.report_id)
                      }
                      setSaveSuccess(true)
                      setTimeout(() => setSaveSuccess(false), 3000)
                    } catch (err: any) {
                      console.error("Save error:", err)
                      setErrorMsg("Failed to save report to database.")
                    } finally {
                      setIsSaving(false)
                    }
                  }}
                  disabled={isSaving || pdfGenerating}
                  className="btn btn-sm"
                  style={{ 
                    borderRadius: 8, 
                    background: saveSuccess ? '#0d9488' : 'var(--teal)', 
                    color: '#fff', 
                    border: 'none',
                    transition: 'all 0.3s'
                  }}
                >
                  {isSaving ? (
                    <RefreshCw size={13} className="spin" />
                  ) : saveSuccess ? (
                    <Save size={13} />
                  ) : (
                    <Save size={13} />
                  )}
                  {saveSuccess ? 'Saved!' : 'Save Branded Report'}
                </button>
                <button
                  onClick={handlePrint}
                  disabled={pdfGenerating || isSaving}
                  className="btn btn-primary btn-sm"
                  style={{ borderRadius: 8 }}
                >
                  {pdfGenerating ? (
                    <RefreshCw size={13} className="spin" />
                  ) : (
                    <Printer size={13} />
                  )}
                  Print Branded PDF
                </button>
              </div>
            )}
          </div>

          <div style={{ padding: 24, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {report ? (
              <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                
                {/* Simulated Custom Branded PDF Page */}
                <div style={{
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  boxShadow: 'var(--shadow-sm)',
                  background: '#ffffff',
                  padding: 24,
                  color: '#1f2937',
                  fontFamily: previewStyles.fontFamily,
                }}>
                  {/* Letterhead Preview Header */}
                  {letterheadPreview ? (
                    <div style={{ borderBottom: previewStyles.borderStyle, paddingBottom: 14, marginBottom: 16 }}>
                      <img src={letterheadPreview} alt="Branded Banner" style={{ width: '100%', maxHeight: 80, objectFit: 'contain' }} />
                    </div>
                  ) : (
                    <div style={{
                      border: '2px dashed var(--border)',
                      borderRadius: 8,
                      padding: '14px 20px',
                      textAlign: 'center',
                      background: 'var(--surface-hover)',
                      marginBottom: 16,
                      fontSize: 12,
                      color: 'var(--text-3)',
                    }}>
                      [Hospital/Clinic Letterhead Banner will render here]
                    </div>
                  )}

                  {/* Consultation Details */}
                  <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: 12, marginBottom: 16 }}>
                    <h2 style={{ fontSize: 18, color: previewStyles.headerColor, fontWeight: 700, margin: '0 0 10px', textAlign: previewStyles.titleAlign, fontFamily: previewStyles.fontFamily }}>
                      CLINICAL CONSULTATION SHEET
                    </h2>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px 16px', fontSize: 12, color: '#374151' }}>
                      <div><strong>Patient:</strong> {report.patient_name}</div>
                      <div><strong>Date:</strong> {report.date || new Date().toLocaleDateString()}</div>
                      <div><strong>Age / Gender:</strong> {report.patient_age || '—'} / {report.patient_gender || '—'}</div>
                      <div><strong>Consultant:</strong> {report.doctor_name || 'Dr. Practitioner'}</div>
                    </div>
                  </div>

                  {/* Editable Sections */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 13, color: '#1f2937' }}>
                    
                    {report.content ? (
                      Object.entries(report.content).map(([key, value]) => (
                        <div key={key}>
                          <div style={{ fontSize: 11, fontWeight: 700, color: previewStyles.sectionColor, textTransform: 'uppercase', marginBottom: 3 }}>
                            {key.replace(/_/g, ' ')}
                          </div>
                          <textarea
                            className="form-control" 
                            value={typeof value === 'string' ? value : JSON.stringify(value)}
                            rows={3}
                            onChange={(e) => {
                              const newContent = { ...report.content, [key]: e.target.value }
                              setReport({ ...report, content: newContent })
                            }}
                            style={{ background: 'transparent', padding: '8px 10px', fontSize: 13 }}
                          />
                        </div>
                      ))
                    ) : (
                      <>
                        {report.indication && (
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: previewStyles.sectionColor, textTransform: 'uppercase', marginBottom: 3 }}>Indication</div>
                            <input 
                              type="text" 
                              className="form-control" 
                              value={report.indication}
                              onChange={(e) => setReport({ ...report, indication: e.target.value })}
                              style={{ background: 'transparent', padding: '6px 10px', fontSize: 13 }}
                            />
                          </div>
                        )}

                        {report.history && (
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: previewStyles.sectionColor, textTransform: 'uppercase', marginBottom: 3 }}>History</div>
                            <textarea
                              className="form-control" 
                              value={report.history}
                              rows={3}
                              onChange={(e) => setReport({ ...report, history: e.target.value })}
                              style={{ background: 'transparent', padding: '8px 10px', fontSize: 13 }}
                            />
                          </div>
                        )}

                        {report.findings && (
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: previewStyles.sectionColor, textTransform: 'uppercase', marginBottom: 3 }}>Findings & Vitals</div>
                            <textarea
                              className="form-control" 
                              value={report.findings}
                              rows={3}
                              onChange={(e) => setReport({ ...report, findings: e.target.value })}
                              style={{ background: 'transparent', padding: '8px 10px', fontSize: 13 }}
                            />
                          </div>
                        )}

                        {report.impression && (
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: previewStyles.sectionColor, textTransform: 'uppercase', marginBottom: 3 }}>Diagnosis & Clinical Impression</div>
                            <input 
                              type="text" 
                              className="form-control" 
                              value={report.impression}
                              onChange={(e) => setReport({ ...report, impression: e.target.value })}
                              style={{ background: 'transparent', padding: '6px 10px', fontSize: 13 }}
                            />
                          </div>
                        )}

                        {report.plan && (
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: previewStyles.sectionColor, textTransform: 'uppercase', marginBottom: 3 }}>Treatment Plan</div>
                            <textarea
                              className="form-control" 
                              value={report.plan}
                              rows={3}
                              onChange={(e) => setReport({ ...report, plan: e.target.value })}
                              style={{ background: 'transparent', padding: '8px 10px', fontSize: 13 }}
                            />
                          </div>
                        )}

                        {report.medications && report.medications.length > 0 && (
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: previewStyles.sectionColor, textTransform: 'uppercase', marginBottom: 3 }}>Prescribed Medications</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {report.medications.map((med, index) => (
                                <input 
                                  key={index}
                                  type="text" 
                                  className="form-control" 
                                  value={med}
                                  onChange={(e) => {
                                    const newMeds = [...(report.medications || [])]
                                    newMeds[index] = e.target.value
                                    setReport({ ...report, medications: newMeds })
                                  }}
                                  style={{ background: 'transparent', padding: '4px 8px', fontSize: 12.5 }}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {report.follow_up && (
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: previewStyles.sectionColor, textTransform: 'uppercase', marginBottom: 3 }}>Follow-up</div>
                            <input 
                              type="text" 
                              className="form-control" 
                              value={report.follow_up}
                              onChange={(e) => setReport({ ...report, follow_up: e.target.value })}
                              style={{ background: 'transparent', padding: '6px 10px', fontSize: 13 }}
                            />
                          </div>
                        )}

                        {report.notes && (
                          <div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: previewStyles.sectionColor, textTransform: 'uppercase', marginBottom: 3 }}>Additional Notes</div>
                            <textarea
                              className="form-control" 
                              value={report.notes}
                              rows={2}
                              onChange={(e) => setReport({ ...report, notes: e.target.value })}
                              style={{ background: 'transparent', padding: '8px 10px', fontSize: 13 }}
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Signatures */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 32, borderTop: '1px solid #eee', paddingTop: 16 }}>
                    <div style={{ textAlign: 'center', fontSize: 11, color: '#6b7280', width: 200 }}>
                      <div style={{ borderBottom: '1px solid #ccc', height: 36, marginBottom: 6 }}></div>
                      Doctor Signature / Stamp
                    </div>
                  </div>
                </div>

                <button
                  onClick={handlePrint}
                  disabled={pdfGenerating}
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {pdfGenerating ? (
                    <>
                      <RefreshCw size={16} className="spin" /> Exporting Branded Document...
                    </>
                  ) : (
                    <>
                      <Printer size={16} /> Print Branded PDF Report
                    </>
                  )}
                </button>
              </div>
            ) : currentTemplate ? (
              <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  boxShadow: 'var(--shadow-sm)',
                  background: '#ffffff',
                  padding: 24,
                  color: '#1f2937',
                  fontFamily: previewStyles.fontFamily,
                  opacity: 0.6,
                  pointerEvents: 'none'
                }}>
                  {/* Letterhead Preview Header */}
                  {letterheadPreview ? (
                    <div style={{ borderBottom: previewStyles.borderStyle, paddingBottom: 14, marginBottom: 16 }}>
                      <img src={letterheadPreview} alt="Branded Banner" style={{ width: '100%', maxHeight: 80, objectFit: 'contain' }} />
                    </div>
                  ) : (
                    <div style={{
                      border: '2px dashed var(--border)',
                      borderRadius: 8,
                      padding: '14px 20px',
                      textAlign: 'center',
                      background: 'var(--surface-hover)',
                      marginBottom: 16,
                      fontSize: 12,
                      color: 'var(--text-3)',
                    }}>
                      [Hospital/Clinic Letterhead Banner will render here]
                    </div>
                  )}

                  {/* Consultation Details Placeholder */}
                  <div style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: 12, marginBottom: 16 }}>
                    <h2 style={{ fontSize: 18, color: previewStyles.headerColor, fontWeight: 700, margin: '0 0 10px', textAlign: previewStyles.titleAlign, fontFamily: previewStyles.fontFamily }}>
                      CLINICAL CONSULTATION SHEET
                    </h2>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px 16px', fontSize: 12, color: '#374151' }}>
                      <div><strong>Patient:</strong> [Patient Name]</div>
                      <div><strong>Date:</strong> {new Date().toLocaleDateString()}</div>
                      <div><strong>Age / Gender:</strong> [Age] / [Gender]</div>
                      <div><strong>Consultant:</strong> [Doctor Name]</div>
                    </div>
                  </div>

                  {/* Fields Placeholder */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 13, color: '#1f2937' }}>
                    {currentTemplate.schema_json?.fields?.map((field: any, idx: number) => (
                      <div key={idx}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: previewStyles.sectionColor, textTransform: 'uppercase', marginBottom: 3 }}>
                          {field.label || field.name.replace(/_/g, ' ')}
                        </div>
                        <div style={{
                          background: 'transparent',
                          border: '1px dashed #ccc',
                          borderRadius: '4px',
                          padding: '8px 10px',
                          fontSize: 13,
                          color: '#9ca3af',
                          minHeight: field.type === 'textarea' ? '60px' : '36px',
                          display: 'flex',
                          alignItems: 'flex-start'
                        }}>
                          [Content will be generated here]
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Signatures Placeholder */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 32, borderTop: '1px solid #eee', paddingTop: 16 }}>
                    <div style={{ textAlign: 'center', fontSize: 11, color: '#6b7280', width: 200 }}>
                      <div style={{ borderBottom: '1px solid #ccc', height: 36, marginBottom: 6 }}></div>
                      Doctor Signature / Stamp
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'center', color: 'var(--text-4)', fontSize: 13 }}>
                  Start dictating to fill this template with your clinical notes.
                </div>
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '80px 20px' }}>
                <div className="icon-box-premium" style={{ color: 'var(--text-4)', width: 54, height: 54, marginBottom: 12 }}>
                  <FileText size={24} />
                </div>
                <h3>No report generated yet</h3>
                <p style={{ maxWidth: 280, margin: '0 auto' }}>
                  Link a patient details, upload a custom letterhead branding, and record your dictation notes to begin.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
