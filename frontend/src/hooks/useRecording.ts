import {
  useRef,
  useCallback,
  useEffect,
  useState
} from 'react'

import toast from 'react-hot-toast'

import { useConsultationStore } from '@/store/consultationStore'
import { apiClient } from '@/api/client'

export function useRecording() {

  const {
    isRecording,
    isPaused,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    appendTranscript,
    setLiveText,
    tick,
  } = useConsultationStore()

  const timerRef         = useRef<number | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef        = useRef<MediaStream | null>(null)
  const audioChunksRef   = useRef<Blob[]>([])
  const recorderMimeRef  = useRef('audio/webm')
  const audioContextRef  = useRef<AudioContext | null>(null)
  const workletNodeRef   = useRef<AudioWorkletNode | null>(null)
  const finalTextRef     = useRef('')
  const wsRef            = useRef<WebSocket | null>(null)
  const sessionReadyRef  = useRef(false)
  const pausedRef        = useRef(false)   // blocks PCM sends while paused

  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)


  // ─── ASSEMBLYAI SESSION SETUP ─────────────────────────────────────────────
  const connectAssemblyAI = useCallback(async (ctx: AudioContext, source: MediaStreamAudioSourceNode) => {
    const { data } = await apiClient.get('/speech/assemblyai-token')
    const token: string = data.token

    const wsUrl =
      `wss://streaming.assemblyai.com/v3/ws` +
      `?sample_rate=16000` +
      `&speech_model=universal-streaming-english` +
      `&format_turns=true` +
      `&token=${token}`

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => console.log('[AssemblyAI] WebSocket connected')

    ws.onmessage = (evt) => {
      let msg: any
      try { msg = JSON.parse(evt.data) } catch { return }

      if (msg.error) {
        console.error('[AssemblyAI] error:', msg.error)
        toast.error('Transcription error: ' + msg.error)
        return
      }

      if (msg.type === 'Begin') {
        console.log('[AssemblyAI] Session ready — id:', msg.id)
        sessionReadyRef.current = true
        return
      }

      if (msg.type === 'Turn') {
        const text: string = msg.transcript || ''
        if (!msg.end_of_turn) {
          setLiveText(text)
        } else {
          if (text) {
            finalTextRef.current = `${finalTextRef.current} ${text}`.trim()
            appendTranscript(finalTextRef.current)
          }
          setLiveText('')
        }
      }
    }

    ws.onerror = () => {
      console.error('[AssemblyAI] WebSocket error')
    }

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
    
    await ctx.audioWorklet.addModule(workletUrl)
    const worklet = new AudioWorkletNode(ctx, 'pcm-processor')
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
    worklet.connect(ctx.destination)
  }, [appendTranscript, setLiveText])


  // ─── START ────────────────────────────────────────────────────────────────
  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })
      streamRef.current = stream
      pausedRef.current = false

      const ctx = new AudioContext({ sampleRate: 16000 })
      if (ctx.state === 'suspended') {
        await ctx.resume()
      }
      audioContextRef.current = ctx
      
      const source = ctx.createMediaStreamSource(stream)

      // Analyser for waveform visualiser
      const analyserNode = ctx.createAnalyser()
      analyserNode.fftSize = 256
      source.connect(analyserNode)
      setAnalyser(analyserNode)

      // Reset state
      audioChunksRef.current = []
      finalTextRef.current   = ''

      // AssemblyAI WebSocket + AudioWorklet
      try {
        await connectAssemblyAI(ctx, source)
      } catch (err: any) {
        console.warn('[Recording] AssemblyAI setup failed:', err)
        toast.error('Live transcription unavailable: ' + (err?.response?.data?.detail ?? err?.message ?? 'unknown'))
      }

      // MediaRecorder for final batch upload
      const mime = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
        'audio/ogg;codecs=opus',
      ].find(MediaRecorder.isTypeSupported)

      const recorder = mime
        ? new MediaRecorder(stream, { mimeType: mime })
        : new MediaRecorder(stream)

      recorderMimeRef.current = recorder.mimeType || mime || 'audio/webm'
      console.log('[Recording] MIME:', recorderMimeRef.current)

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      recorder.start(1000)
      mediaRecorderRef.current = recorder

      startRecording()
      timerRef.current = window.setInterval(tick, 1000)
      console.log('[Recording] Started')

    } catch (err) {
      console.error('[Recording] Failed to start:', err)
      toast.error('Could not access microphone')
    }
  }, [connectAssemblyAI, startRecording, tick])


  // ─── PAUSE ────────────────────────────────────────────────────────────────
  const pause = useCallback(() => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') return

    pausedRef.current = true
    mediaRecorderRef.current.pause()

    // Freeze timer
    if (timerRef.current) {
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }

    // Gracefully close AssemblyAI session (audio will resume on resume())
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'Terminate' }))
      wsRef.current.close()
      wsRef.current = null
      sessionReadyRef.current = false
    }

    pauseRecording()
    console.log('[Recording] Paused')
  }, [pauseRecording])


  // ─── RESUME ───────────────────────────────────────────────────────────────
  const resume = useCallback(async () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'paused') return

    pausedRef.current = false
    mediaRecorderRef.current.resume()

    // Restart timer
    timerRef.current = window.setInterval(tick, 1000)

    // Re-establish AssemblyAI session
    if (audioContextRef.current && streamRef.current) {
      try {
        const source = audioContextRef.current.createMediaStreamSource(streamRef.current)
        // Disconnect old worklet if still connected
        if (workletNodeRef.current) {
          workletNodeRef.current.disconnect()
          workletNodeRef.current = null
        }
        await connectAssemblyAI(audioContextRef.current, source)
      } catch (err: any) {
        console.warn('[Recording] AssemblyAI reconnect failed:', err)
        toast.error('Live transcription reconnect failed — audio still recording')
      }
    }

    resumeRecording()
    console.log('[Recording] Resumed')
  }, [connectAssemblyAI, resumeRecording, tick])


  // ─── STOP ─────────────────────────────────────────────────────────────────
  const stop = useCallback((): Promise<Blob> => {
    return new Promise((resolve) => {

      pausedRef.current = false
      stopRecording()

      // Close WebSocket gracefully
      if (wsRef.current) {
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'Terminate' }))
        }
        wsRef.current.close()
        wsRef.current       = null
        sessionReadyRef.current = false
      }

      // Disconnect worklet
      if (workletNodeRef.current) {
        workletNodeRef.current.disconnect()
        workletNodeRef.current = null
      }

      // Stop timer
      if (timerRef.current) {
        window.clearInterval(timerRef.current)
        timerRef.current = null
      }

      const recorder = mediaRecorderRef.current

      if (recorder && recorder.state !== 'inactive') {

        // If paused, resume briefly so onstop fires correctly
        if (recorder.state === 'paused') recorder.resume()

        recorder.onstop = () => {
          if (audioContextRef.current) {
            audioContextRef.current.close()
            audioContextRef.current = null
            setAnalyser(null)
          }

          const blob = new Blob(audioChunksRef.current, {
            type: recorderMimeRef.current,
          })
          console.log(`[Recording] Stopped — chunks: ${audioChunksRef.current.length}, size: ${blob.size} bytes`)

          streamRef.current?.getTracks().forEach((t) => t.stop())
          streamRef.current = null

          resolve(blob)
        }

        if (recorder.state === 'recording') recorder.requestData()
        recorder.stop()

      } else {
        if (audioContextRef.current) {
          audioContextRef.current.close()
          audioContextRef.current = null
          setAnalyser(null)
        }
        streamRef.current?.getTracks().forEach((t) => t.stop())
        streamRef.current = null
        resolve(new Blob([], { type: recorderMimeRef.current }))
      }
    })
  }, [stopRecording])


  // ─── CLEANUP on unmount ───────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (wsRef.current) { wsRef.current.close(); wsRef.current = null }
      if (workletNodeRef.current) { workletNodeRef.current.disconnect(); workletNodeRef.current = null }
      if (audioContextRef.current) { audioContextRef.current.close(); audioContextRef.current = null }
      streamRef.current?.getTracks().forEach((t) => t.stop())
      const rec = mediaRecorderRef.current
      if (rec && rec.state !== 'inactive') rec.stop()
    }
  }, [])


  return { isRecording, isPaused, start, pause, resume, stop, analyser }
}
