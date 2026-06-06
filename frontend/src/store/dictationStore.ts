import { create } from 'zustand'
import { DictationReport } from '@/api/dictation'

interface DictationState {
  patientId: string
  letterhead: File | null
  transcript: string
  realtimeText: string
  statusText: string
  report: DictationReport | null
  currentReportId: string | null
  setPatientId: (id: string) => void
  setLetterhead: (file: File | null) => void
  setTranscript: (text: string) => void
  setRealtimeText: (text: string) => void
  setStatusText: (text: string) => void
  setReport: (report: DictationReport | null) => void
  setCurrentReportId: (id: string | null) => void
  clearDictation: () => void
}

export const useDictationStore = create<DictationState>((set) => ({
  patientId: '',
  letterhead: null,
  transcript: '',
  realtimeText: '',
  statusText: 'Ready to dict',
  report: null,
  currentReportId: null,
  setPatientId: (patientId) => set({ patientId }),
  setLetterhead: (letterhead) => set({ letterhead }),
  setTranscript: (transcript) => set({ transcript }),
  setRealtimeText: (realtimeText) => set({ realtimeText }),
  setStatusText: (statusText) => set({ statusText }),
  setReport: (report) => set({ report }),
  setCurrentReportId: (currentReportId) => set({ currentReportId }),
  clearDictation: () => set({
    transcript: '',
    realtimeText: '',
    statusText: 'Ready',
    report: null,
    currentReportId: null
  })
}))
