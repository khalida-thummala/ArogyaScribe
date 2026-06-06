import { create } from 'zustand'

interface RadiologyState {
  selectedFile: File | null
  patientId: string
  showComparison: boolean
  setSelectedFile: (file: File | null) => void
  setPatientId: (id: string) => void
  setShowComparison: (show: boolean) => void
  reset: () => void
}

export const useRadiologyStore = create<RadiologyState>((set) => ({
  selectedFile: null,
  patientId: '',
  showComparison: false,
  setSelectedFile: (selectedFile) => set({ selectedFile }),
  setPatientId: (patientId) => set({ patientId }),
  setShowComparison: (showComparison) => set({ showComparison }),
  reset: () => set({ selectedFile: null, patientId: '', showComparison: false })
}))
