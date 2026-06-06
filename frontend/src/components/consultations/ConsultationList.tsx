import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { consultationsApi } from '@/api/consultations'
import { patientsApi } from '@/api/patients'
import { Plus, Mic, Stethoscope, Calendar, Clock, Edit2, Trash2, RefreshCw, Sparkles } from 'lucide-react'
import { format } from 'date-fns'
import Modal from '@/components/shared/Modal'
import ConsultationForm from './ConsultationForm'
import RecordingPanel from './RecordingPanel'
import SOAPEditor from '@/components/soap/SOAPEditor'
import toast from 'react-hot-toast'
import { useConsultationStore } from '@/store/consultationStore'

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; label: string }> = {
  completed:   { color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', label: 'Completed' },
  in_progress: { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', label: 'Recording' },
  scheduled:   { color: '#d97706', bg: '#fffbeb', border: '#fde68a', label: 'Scheduled' },
  pending:             { color: '#d97706', bg: '#fffbeb', border: '#fde68a', label: 'Scheduled' },
  cancelled:           { color: '#e11d48', bg: '#fff1f2', border: '#fecdd3', label: 'Cancelled' },
  failed_transcription:{ color: '#e11d48', bg: '#fff1f2', border: '#fecdd3', label: 'Transcription Failed' },
  failed_soap:         { color: '#e11d48', bg: '#fff1f2', border: '#fecdd3', label: 'SOAP AI Failed' },
}

export default function ConsultationList() {
  const qc = useQueryClient()
  const [showNew, setShowNew] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [editSoapId, setEditSoapId] = useState<string | null>(null)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [reconsultData, setReconsultData] = useState<any>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['consultations'],
    queryFn: () => consultationsApi.list(),
  })

  const startMut = useMutation({
    mutationFn: (id: string) => consultationsApi.start(id),
    onSuccess: (_, id) => { setActiveId(id); qc.invalidateQueries({ queryKey: ['consultations'] }) },
    onError: () => toast.error('Failed to start consultation'),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => consultationsApi.delete(id),
    onSuccess: () => { 
      qc.invalidateQueries({ queryKey: ['consultations'] })
      toast.success('Consultation deleted')
    },
    onError: () => toast.error('Failed to delete consultation'),
  })

  const generateSoapMut = useMutation({
    mutationFn: (id: string) => consultationsApi.generateSoap(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['consultations'] })
      toast.success('SOAP note generated from transcript')
    },
    onError: (e: any) => {
      toast.error(e.response?.data?.detail || 'SOAP generation failed')
    },
  })


  const { data: patientsData } = useQuery({
    queryKey: ['patients'],
    queryFn: () => patientsApi.list(),
  })

  const patients = Array.isArray(patientsData) ? patientsData : (patientsData as any)?.data ?? []
  const consultations = Array.isArray(data) ? data : (data as any)?.data ?? []
  const getPatient = (id: string) => patients.find((p: any) => p.patient_id === id)

  const stats = [
    { label: 'Total', value: consultations.length, icon: Stethoscope, color: '#3b82f6', bg: '#eff6ff' },
    { label: 'Completed', value: consultations.filter((c: any) => c.status === 'completed').length, icon: Clock, color: '#10b981', bg: '#ecfdf5' },
    { label: 'Scheduled', value: consultations.filter((c: any) => c.status === 'scheduled' || c.status === 'pending').length, icon: Calendar, color: '#f59e0b', bg: '#fffbeb' },
    { label: 'Recording', value: consultations.filter((c: any) => c.status === 'in_progress').length, icon: Mic, color: '#f43f5e', bg: '#fff1f2' },
  ]

  return (
    <div className="fade-in">
      {/* ── Action Bar ────────────────────────── */}
      <div className="page-header" style={{ marginBottom: 16 }}>
        <h2 className="page-title">Consultations</h2>
        <button
          onClick={() => setShowNew(true)}
          className="btn btn-primary btn-sm"
          style={{ padding: '8px 16px', fontSize: 13, borderRadius: 10 }}
        >
          <Plus size={14} />
          New Consultation
        </button>
      </div>

      {/* ── Mini Stats ───────────────────────── */}
      <div className="grid-responsive grid-cols-stats" style={{ display: 'grid', gap: 16, marginBottom: 24 }}>
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div 
              key={s.label} 
              className="stat-card-premium"
              style={{ '--card-grad': `linear-gradient(90deg, ${s.color} 0%, ${s.color}88 100%)` } as any}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div className="icon-box-premium" style={{ color: s.color }}>
                  <Icon size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-1)', lineHeight: 1, letterSpacing: '-0.02em' }}>
                    {isLoading ? '—' : s.value}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {s.label}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Table ────────────────────────────── */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="stack-on-mobile" style={{
          padding: '16px 22px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h3 style={{ fontSize: 14, margin: 0, color: 'var(--text-2)', fontFamily: 'DM Sans, sans-serif', fontWeight: 600 }}>
            All Sessions
          </h3>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
            {isLoading ? '…' : `${consultations.length} total`}
          </span>
        </div>

        {isLoading ? (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 52, borderRadius: 8 }} />)}
          </div>
        ) : consultations.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Stethoscope size={40} color="var(--text-4)" /></div>
            <h3>No consultations yet</h3>
            <p>Create your first consultation session to begin recording and generating SOAP notes.</p>
            <button className="btn btn-primary" onClick={() => setShowNew(true)}>
              <Plus size={14} /> New Consultation
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  {['Patient', 'Type', 'Chief Complaint', 'Status', 'Duration', 'Conf.', 'Created', 'Actions'].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {consultations.map((c: any) => {
                  const patient = getPatient(c.patient_id)
                  const st = STATUS_CONFIG[c.status] ?? STATUS_CONFIG.scheduled
                  return (
                    <tr key={c.consultation_id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: 8,
                            background: 'linear-gradient(135deg, #0d9488, #14b8a6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 700, color: '#fff', flexShrink: 0,
                          }}>
                            {patient ? `${patient.first_name[0]}${patient.last_name[0]}` : '?'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-1)' }}>
                              {patient ? `${patient.first_name} ${patient.last_name}` : c.patient_id.slice(0, 8) + '…'}
                            </div>
                            {patient?.medical_id && (
                              <div style={{ fontSize: 11, color: 'var(--text-4)' }}>#{patient.medical_id}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ textTransform: 'capitalize', fontSize: 13 }}>
                          {c.consultation_type?.replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          maxWidth: 160, display: 'block', overflow: 'hidden',
                          textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13,
                          color: 'var(--text-2)',
                        }}>
                          {c.chief_complaint ?? '—'}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-block', padding: '3px 10px', borderRadius: 20,
                          fontSize: 11.5, fontWeight: 600,
                          background: st.bg, color: st.color,
                          border: `1px solid ${st.border}`,
                        }}>
                          {st.label}
                        </span>
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--text-2)' }}>
                        {c.duration_minutes ? `${c.duration_minutes}m` : (c.audio_duration_seconds ? `${Math.ceil(c.audio_duration_seconds / 60)}m` : '—')}
                      </td>
                      <td style={{ fontSize: 13 }}>
                        {c.transcription_confidence ? (
                          <span style={{ 
                            color: c.transcription_confidence > 0.8 ? '#059669' : '#d97706',
                            fontWeight: 600 
                          }}>
                            {(c.transcription_confidence * 100).toFixed(0)}%
                          </span>
                        ) : '—'}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-3)' }}>
                        {c.created_at ? format(new Date(c.created_at), 'MMM d, h:mm a') : '—'}
                      </td>

                      <td>
                        <div className="consultation-actions" style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                          {/* Start/Resume Button for anything not completed */}
                          {(c.status === 'scheduled' || c.status === 'pending' || c.status === 'failed_transcription') && (
                            <button
                              onClick={() => startMut.mutate(c.consultation_id)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 5,
                                padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
                                background: c.status.startsWith('failed') ? '#6b7280' : '#0d9488', 
                                color: '#fff',
                                border: 'none', fontSize: 12, fontWeight: 600,
                                transition: 'all 0.15s',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                              }}
                            >
                              <Mic size={12} /> {c.status.startsWith('failed') ? 'Retry' : 'Start Session'}
                            </button>
                          )}
  
                          {c.status === 'failed_soap' && (
                            <button
                              onClick={() => generateSoapMut.mutate(c.consultation_id)}
                              disabled={generateSoapMut.isPending}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 5,
                                padding: '6px 14px', borderRadius: 8, cursor: generateSoapMut.isPending ? 'not-allowed' : 'pointer',
                                background: '#7c3aed', color: '#fff',
                                border: 'none', fontSize: 12, fontWeight: 600,
                                transition: 'all 0.15s',
                                boxShadow: '0 2px 4px rgba(124, 58, 237, 0.2)',
                                opacity: generateSoapMut.isPending ? 0.7 : 1,
                              }}
                            >
                              <Sparkles size={12} /> {generateSoapMut.isPending ? 'Generating' : 'Generate SOAP'}
                            </button>
                          )}
                          
                          {c.status === 'in_progress' && (
                            <button
                              onClick={() => setActiveId(c.consultation_id)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 5,
                                padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
                                background: '#2563eb', color: '#fff',
                                border: 'none', fontSize: 12, fontWeight: 600,
                                transition: 'all 0.15s',
                                boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
                              }}
                            >
                              <Mic size={12} /> Resume Session
                            </button>
                          )}
  
                          {c.status === 'completed' && (
                            <div style={{ display: 'flex', gap: 5 }}>
                              <button
                                onClick={() => window.location.href = `/app/consultations/${c.consultation_id}/soap`}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 5,
                                  padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
                                  background: '#7c3aed', color: '#fff',
                                  border: 'none', fontSize: 12, fontWeight: 600,
                                  transition: 'all 0.15s',
                                  boxShadow: '0 2px 4px rgba(124, 58, 237, 0.2)'
                                }}
                              >
                                <Stethoscope size={12} /> View SOAP
                              </button>
                              <button
                                onClick={() => setEditSoapId(c.consultation_id)}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 5,
                                  padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
                                  background: '#fff', color: '#7c3aed',
                                  border: '1px solid #ddd6fe', fontSize: 12, fontWeight: 600,
                                  transition: 'all 0.15s',
                                }}
                                title="Edit SOAP Note"
                              >
                                <Edit2 size={12} />
                              </button>
                            </div>
                          )}
  
                          {c.status !== 'in_progress' && (
                            <button
                              onClick={() => setReconsultData({
                                patient_id: c.patient_id,
                                consultation_type: c.consultation_type,
                                chief_complaint: '',
                              })}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 5,
                                padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
                                background: '#fff', color: '#0d9488',
                                border: '1px solid #99f6e4', fontSize: 12, fontWeight: 600,
                                transition: 'all 0.15s',
                              }}
                              title="Start a new consultation for the same patient"
                            >
                              <RefreshCw size={12} /> Reconsult
                            </button>
                          )}
                          
                          {/* Edit/Delete Buttons */}
                          <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
                            <button 
                              className="btn-icon" 
                              style={{ padding: 6, color: 'var(--text-3)' }}
                              onClick={() => setEditItem(c)}
                            >
                              <Edit2 size={14} />
                            </button>
                            <button 
                              className="btn-icon" 
                              style={{ padding: 6, color: '#f43f5e' }}
                              onClick={() => {
                                if(confirm('Are you sure you want to delete this consultation?')) {
                                  deleteMut.mutate(c.consultation_id);
                                }
                              }}
                              disabled={deleteMut.isPending}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modals ───────────────────────────── */}
      <Modal open={showNew} onClose={() => setShowNew(false)} title="New Consultation" width={520}>
        <ConsultationForm
          patients={patients}
          onSuccess={() => { setShowNew(false); qc.invalidateQueries({ queryKey: ['consultations'] }) }}
        />
      </Modal>

      <Modal open={!!editItem} onClose={() => setEditItem(null)} title="Edit Consultation" width={520}>
        {editItem && (
          <ConsultationForm
            patients={patients}
            initialData={editItem}
            onSuccess={() => { setEditItem(null); qc.invalidateQueries({ queryKey: ['consultations'] }) }}
          />
        )}
      </Modal>

      <Modal open={!!editSoapId} onClose={() => setEditSoapId(null)} title="Edit SOAP Report" width={800}>
        {editSoapId && (
          <SOAPEditor consultationId={editSoapId} />
        )}
      </Modal>

      {activeId && (
        <Modal
          open={!!activeId}
          onClose={() => {
            // Reset paused state when modal closes — stream is dead after close
            useConsultationStore.getState().reset()
            setActiveId(null)
          }}
          title="Active Recording Session"
          width={700}
        >
          <RecordingPanel
            consultationId={activeId}
            onComplete={() => { setActiveId(null); qc.invalidateQueries({ queryKey: ['consultations'] }) }}
          />
        </Modal>
      )}

      {/* Reconsult Modal — pre-fills same patient & type, new chief complaint */}
      <Modal
        open={!!reconsultData}
        onClose={() => setReconsultData(null)}
        title="New Follow-up Consultation"
        width={520}
      >
        {reconsultData && (
          <ConsultationForm
            patients={patients}
            initialData={reconsultData}
            isReconsult
            onSuccess={() => {
              setReconsultData(null)
              qc.invalidateQueries({ queryKey: ['consultations'] })
            }}
          />
        )}
      </Modal>
    </div>
  )
}
