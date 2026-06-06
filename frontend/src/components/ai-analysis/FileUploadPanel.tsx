import { useState, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { UploadCloud, FileText, Loader2, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props {
  onAnalysisReady: (analysisId: string) => void
}

type UploadPhase = 'idle' | 'uploading' | 'analyzing' | 'done' | 'error'

export default function FileUploadPanel({ onAnalysisReady }: Props) {
  const [phase, setPhase] = useState<UploadPhase>('idle')
  const [progress, setProgress] = useState(0)
  const [fileName, setFileName] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const [patientId, setPatientId] = useState('')
  const [manualText, setManualText] = useState('')
  const [uploadMode, setUploadMode] = useState<'file' | 'text'>('file')
  const [analysisMode, setAnalysisMode] = useState<'patient' | 'population'>('patient')

  const uploadMut = useMutation({
    mutationFn: async (payload: { file?: File; text?: string }) => {
      const formData = new FormData()
      if (payload.file) {
        formData.append('file', payload.file)
        formData.append('file_type', payload.file.type.includes('pdf') ? 'pdf' : payload.file.type.includes('image') ? 'image' : 'docx')
      } else if (payload.text) {
        // Create a dummy file for the backend which expects a file upload
        const blob = new Blob([payload.text], { type: 'text/plain' })
        const file = new File([blob], 'manual_entry.txt', { type: 'text/plain' })
        formData.append('file', file)
        formData.append('file_type', 'docx') // Backend handles docx/txt similarly
      }
      
      if (patientId) formData.append('patient_id', patientId)
      
      const res = await apiClient.post('/ai-analysis/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => { if (e.total) setProgress(Math.round((e.loaded * 100) / e.total)) },
      })
      return res.data
    },
    onSuccess: async (uploadData: any) => {
      setPhase('analyzing')
      try {
        const analyzeRes = await apiClient.post(`/ai-analysis/${uploadData.analysis_id}/analyze`)
        setPhase('done')
        toast.success('AI Analysis complete!')
        onAnalysisReady(analyzeRes.data?.analysis_id || uploadData.analysis_id)
      } catch {
        setPhase('error')
        toast.error('Analysis failed')
      }
    },
    onError: () => { setPhase('error'); toast.error('Upload failed') },
  })

  const handleFile = (file: File) => {
    if (analysisMode === 'patient' && !patientId.trim()) { toast.error('Please enter a Patient ID for Individual RAG'); return }
    const MAX_MB = 50
    if (file.size > MAX_MB * 1024 * 1024) { toast.error(`File must be under ${MAX_MB} MB`); return }
    setFileName(file.name)
    setPhase('uploading')
    setProgress(0)
    uploadMut.mutate({ file })
  }

  const handleManualSubmit = () => {
    if (analysisMode === 'patient' && !patientId.trim()) { toast.error('Please enter a Patient ID for Individual RAG'); return }
    if (!manualText.trim()) { toast.error('Please enter some text'); return }
    setFileName('Manual Clinical Note')
    setPhase('uploading')
    setProgress(100)
    uploadMut.mutate({ text: manualText })
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.doc,.png,.jpg,.jpeg"
        style={{ display: 'none' }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />

      {phase === 'idle' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Analysis Mode Toggle */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginBottom: 8, display: 'block' }}>
              Analysis Mode
            </label>
            <div style={{ display: 'flex', gap: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', color: 'var(--text-1)' }}>
                <input 
                  type="radio" 
                  name="analysisMode" 
                  value="patient" 
                  checked={analysisMode === 'patient'} 
                  onChange={() => setAnalysisMode('patient')} 
                  style={{ accentColor: 'var(--teal)' }}
                />
                Individual Patient (RAG)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', color: 'var(--text-1)' }}>
                <input 
                  type="radio" 
                  name="analysisMode" 
                  value="population" 
                  checked={analysisMode === 'population'} 
                  onChange={() => { setAnalysisMode('population'); setPatientId(''); }} 
                  style={{ accentColor: 'var(--teal)' }}
                />
                Population Research
              </label>
            </div>
          </div>

          {/* Patient ID Input (Only shown for Individual Patient Mode) */}
          {analysisMode === 'patient' && (
            <div style={{ marginBottom: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginBottom: 8, display: 'block' }}>
                Patient ID (Required)
              </label>
              <input 
                type="text"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                placeholder="e.g. a933ce10-0415-4901-ba2b-c448a841caeb"
                className="form-control"
                style={{ fontSize: 13, padding: '10px 14px' }}
              />
            </div>
          )}

          {/* Mode Toggle */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 4 }}>
            <button 
              onClick={() => setUploadMode('file')}
              style={{ 
                flex: 1, padding: '8px', fontSize: 12, fontWeight: 600, borderRadius: 8, cursor: 'pointer',
                background: uploadMode === 'file' ? 'var(--teal-light)' : 'var(--surface)',
                border: uploadMode === 'file' ? '1px solid var(--teal)' : '1px solid var(--border)',
                color: uploadMode === 'file' ? 'var(--teal)' : 'var(--text-2)'
              }}
            >
              Upload File
            </button>
            <button 
              onClick={() => setUploadMode('text')}
              style={{ 
                flex: 1, padding: '8px', fontSize: 12, fontWeight: 600, borderRadius: 8, cursor: 'pointer',
                background: uploadMode === 'text' ? 'var(--teal-light)' : 'var(--surface)',
                border: uploadMode === 'text' ? '1px solid var(--teal)' : '1px solid var(--border)',
                color: uploadMode === 'text' ? 'var(--teal)' : 'var(--text-2)'
              }}
            >
              Paste Text
            </button>
          </div>

          {uploadMode === 'file' ? (
            <div
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
              style={{
                border: '2px dashed var(--border)', borderRadius: 14, padding: '48px 32px',
                textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s',
                background: 'var(--surface-hover-op)'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--teal)'; e.currentTarget.style.background = 'var(--surface-hover)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface-hover-op)' }}
            >
              <UploadCloud size={48} color="var(--teal)" style={{ marginBottom: 12, opacity: 0.7 }} />
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)', marginBottom: 6 }}>Drop a file or click to upload</div>
              <div style={{ fontSize: 12.5, color: 'var(--text-3)' }}>Supports PDF, DOCX, JPG, PNG — up to 50 MB</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <textarea 
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                placeholder="Paste the clinical visit note here..."
                className="form-control"
                rows={8}
                style={{ resize: 'vertical', fontSize: 13, lineHeight: 1.6 }}
              />
              <button 
                onClick={handleManualSubmit}
                className="btn btn-primary"
                style={{ background: 'var(--teal)', border: 'none', padding: '10px', fontWeight: 600 }}
              >
                Start AI Analysis
              </button>
            </div>
          )}
        </div>
      )}

      {phase === 'uploading' && (
        <div style={{ padding: 32, textAlign: 'center' }}>
          <FileText size={36} color="var(--teal)" style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-1)', marginBottom: 8 }}>{fileName}</div>
          <div style={{ background: 'var(--border)', borderRadius: 6, height: 6, overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ width: `${progress}%`, height: '100%', background: 'var(--teal)', transition: 'width 0.3s' }} />
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Uploading… {progress}%</div>
        </div>
      )}

      {phase === 'analyzing' && (
        <div style={{ padding: 32, textAlign: 'center' }}>
          <Loader2 size={36} color="var(--teal)" style={{ marginBottom: 12, animation: 'spin 1s linear infinite' }} />
          <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text-1)' }}>AI is analyzing your document…</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>This may take 15–30 seconds</div>
        </div>
      )}

      {phase === 'done' && (
        <div style={{ padding: 32, textAlign: 'center' }}>
          <CheckCircle size={36} color="#0e7c4a" style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 13.5, fontWeight: 500, color: '#0e7c4a' }}>Analysis complete!</div>
        </div>
      )}

      {phase === 'error' && (
        <div style={{ padding: 32, textAlign: 'center' }}>
          <XCircle size={36} color="#e74c3c" style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 13.5, fontWeight: 500, color: '#e74c3c', marginBottom: 12 }}>Upload or analysis failed</div>
          <button onClick={() => setPhase('idle')} style={{ padding: '8px 20px', background: 'var(--teal)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Try Again</button>
        </div>
      )}
    </div>
  )
}
