import { create } from 'zustand'

interface ConsultationState {
  isRecording: boolean
  isPaused: boolean
  transcript: string
  liveText: string        // live partial text during speech
  recSeconds: number
  confidence: number

  startRecording: () => void
  stopRecording: () => void
  pauseRecording: () => void
  resumeRecording: () => void

  appendTranscript: (text: string) => void
  setLiveText: (text: string) => void

  setConfidence: (v: number) => void

  tick: () => void

  reset: () => void
}

export const useConsultationStore =
  create<ConsultationState>((set) => ({

    isRecording: false,

    isPaused: false,

    transcript: '',

    liveText: '',

    recSeconds: 0,

    confidence: 0,

    startRecording: () =>
      set({
        isRecording: true,
        isPaused: false,
        transcript: '',
        liveText: '',
        recSeconds: 0
      }),

    stopRecording: () =>
      set({
        isRecording: false,
        isPaused: false,
        liveText: '',
      }),

    pauseRecording: () =>
      set({
        isRecording: false,
        isPaused: true,
        liveText: '',
      }),

    resumeRecording: () =>
      set({
        isRecording: true,
        isPaused: false,
      }),

    appendTranscript: (text) =>
      set({
        transcript: text,
        liveText: '',   // clear partial when a turn is committed
      }),

    setLiveText: (text) =>
      set({ liveText: text }),

    setConfidence: (confidence) =>
      set({
        confidence
      }),

    tick: () =>
      set((s) => ({
        recSeconds: s.recSeconds + 1
      })),

    reset: () =>
      set({
        isRecording: false,
        isPaused: false,
        transcript: '',
        liveText: '',
        recSeconds: 0,
        confidence: 0
      })

  }))