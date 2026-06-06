import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { reportsApi } from '@/api/reports'
import { patientsApi } from '@/api/patients'
import { FileText, Download, CheckCircle2, Clock, PenLine, Archive, Edit2, RefreshCw, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import SOAPEditor from '@/components/soap/SOAPEditor'
import Modal from '@/components/shared/Modal'

const STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; icon: any; label: string }> = {
  approved: { color: '#059669', bg: '#ecfdf5', border: '#a7f3d0', icon: CheckCircle2, label: 'Approved' },
  signed:   { color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4', icon: PenLine,      label: 'Signed' },
  draft:    { color: '#d97706', bg: '#fffbeb', border: '#fde68a', icon: Clock,        label: 'Draft' },
  reviewed: { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', icon: FileText,     label: 'Reviewed' },
  archived: { color: '#6b7280', bg: '#f3f4f6', border: '#e5e7eb', icon: Archive,      label: 'Archived' },
}

interface Props {
  search?: string
  filterType: 'soap' | 'rag' | 'dictation' | 'all'
}

export default function ReportList({ search = '', filterType = 'all' }: Props) {
  const [editSoapId, setEditSoapId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['reports'],
    queryFn: () => reportsApi.list(),
    refetchOnWindowFocus: true,
    staleTime: 0,
  })

  const { data: patientsData } = useQuery({
    queryKey: ['patients'],
    queryFn: () => patientsApi.list(),
  })

  const allReports: any[] = (Array.isArray(data) ? data : (data as any)?.data ?? []).filter((r: any) => {
    const isVoiceDictation = r.key_entities?.source === 'voice_dictation';
    const isClinicalRag = !!r.key_entities?.analysis_id;
    const isSoap = !isVoiceDictation && !isClinicalRag;

    if (filterType === 'soap') return isSoap;
    if (filterType === 'rag') return isClinicalRag;
    if (filterType === 'dictation') return isVoiceDictation;
    return true
  })
  const patients: any[] = Array.isArray(patientsData) ? patientsData : (patientsData as any)?.data ?? []

  const getPatient = (report: any) => {
    return patients.find((p: any) => p.patient_id === report.patient_id)
  }

  // Apply search filter client-side
  const reports = search.trim()
    ? allReports.filter((r: any) => {
        const patient = getPatient(r)
        const patientName = patient ? `${patient.first_name} ${patient.last_name}`.toLowerCase() : ''
        const q = search.toLowerCase()
        return (
          r.report_id?.toLowerCase().includes(q) ||
          patientName.includes(q) ||
          r.status?.toLowerCase().includes(q)
        )
      })
    : allReports


  const handleExport = async (report: any, fmt: 'pdf' | 'docx') => {
    try {
      const reportId = report.report_id
      const blob = await reportsApi.export(reportId, { format: fmt })
      if (!blob) throw new Error('Empty file received')

      let prefix = 'SOAP_Report'
      if (report.key_entities?.analysis_id) prefix = 'Clinical_RAG_Report'
      else if (report.key_entities?.source === 'voice_dictation') prefix = 'Dictation_Report'

      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${prefix}_${reportId.slice(0, 8)}.${fmt}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success(`Report downloaded as ${fmt.toUpperCase()}`)
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.message || 'Failed to export report')
    }
  }

  const handleDelete = async (reportId: string) => {
    if (!window.confirm('Are you sure you want to delete this report? This action cannot be undone.')) return
    try {
      await reportsApi.delete(reportId)
      toast.success('Report deleted successfully')
      refetch()
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || err?.message || 'Failed to delete report')
    }
  }

  const draftCount    = allReports.filter((r: any) => r.status === 'draft').length
  const approvedCount = allReports.filter((r: any) => r.status === 'approved' || r.status === 'signed').length

  return (
    <div>
      {/* Mini Stats */}
      <div className="grid-responsive grid-cols-3" style={{ display: 'grid', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Reports',    value: allReports.length, color: '#7c3aed', icon: FileText },
          { label: 'Approved / Signed',value: approvedCount,     color: '#059669', icon: CheckCircle2 },
          { label: 'Drafts Pending',   value: draftCount,        color: '#d97706', icon: Clock },
        ].map((s) => {
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

      {/* Table Card */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div className="stack-on-mobile" style={{ padding: '16px 22px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: 14, margin: 0, fontFamily: 'DM Sans, sans-serif', fontWeight: 600, color: 'var(--text-2)' }}>
            {filterType === 'dictation' ? 'Voice Dictation Reports' : 'All SOAP Reports'}
          </h3>
          <button
            onClick={() => refetch()}
            title="Refresh"
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 10px', borderRadius: 7, cursor: 'pointer',
              background: 'var(--surface-2)', border: '1px solid var(--border)',
              fontSize: 12, color: 'var(--text-3)',
            }}
          >
            <RefreshCw size={12} /> Refresh
          </button>
        </div>

        {isLoading ? (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 56, borderRadius: 8 }} />)}
          </div>
        ) : reports.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><FileText size={40} color="var(--text-4)" /></div>
            <h3>{search ? 'No reports match your search' : 'No reports generated yet'}</h3>
            <p>{search ? 'Try a different search term.' : 'Complete a consultation session to automatically generate SOAP notes.'}</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  {['Report', 'Patient', 'Status', 'Created', 'Actions'].map((h) => (
                    h === 'Actions'
                      ? <th key={h} style={{ textAlign: 'right' }}>{h}</th>
                      : <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reports.map((r: any) => {
                  const st = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.draft
                  const StatusIcon = st.icon
                  const patient = getPatient(r)
                  return (
                    <tr key={r.report_id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 34, height: 34, borderRadius: 8, background: '#f5f3ff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '1px solid #ddd6fe', flexShrink: 0,
                          }}>
                            <FileText size={15} color="#7c3aed" />
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-1)' }}>
                              {r.key_entities?.analysis_id ? 'Clinical RAG Report' : (r.key_entities?.source === 'voice_dictation' ? 'Dictation Report' : 'SOAP Report')}
                            </div>
                            <code style={{ fontSize: 11, color: 'var(--text-3)' }}>
                              #{r.report_id?.slice(0, 8)}…
                            </code>
                          </div>
                        </div>
                      </td>
                      <td>
                        {patient ? (
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-1)' }}>
                              {patient.first_name} {patient.last_name}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                              #{patient.patient_id?.slice(0, 8)}
                            </div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-4)', fontSize: 12 }}>Unlinked Patient</span>
                        )}
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '3px 10px', borderRadius: 20, fontSize: 11.5, fontWeight: 600,
                          background: st.bg, color: st.color, border: `1px solid ${st.border}`,
                        }}>
                          <StatusIcon size={11} /> {st.label}
                        </span>
                      </td>
                      <td style={{ fontSize: 12.5, color: 'var(--text-3)' }}>
                        {r.created_at ? format(new Date(r.created_at), 'MMM d, yyyy') : '—'}
                        <br />
                        <span style={{ fontSize: 11 }}>{r.created_at ? format(new Date(r.created_at), 'h:mm a') : ''}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 7, justifyContent: 'flex-end' }}>
                          {filterType === 'dictation' || r.key_entities?.source === 'voice_dictation' ? (
                            <button
                              onClick={() => handleExport(r, 'pdf')}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 5,
                                padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
                                background: '#0d9488', color: '#fff',
                                border: 'none', fontSize: 11.5, fontWeight: 600,
                                transition: 'all 0.15s',
                              }}
                            >
                              <FileText size={12} /> View Branded PDF
                            </button>
                          ) : (
                            <button
                              onClick={() => setEditSoapId(r.consultation_id || r.report_id)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 5,
                                padding: '6px 12px', borderRadius: 8, cursor: 'pointer',
                                background: r.status === 'approved' ? '#0d9488' : '#7c3aed', color: '#fff',
                                border: 'none', fontSize: 11.5, fontWeight: 600,
                                transition: 'all 0.15s',
                              }}
                            >
                              <Edit2 size={12} /> {r.status === 'approved' ? 'View' : 'Edit'}
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleDelete(r.report_id)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 5,
                              padding: '6px 10px', borderRadius: 8, cursor: 'pointer',
                              background: '#fee2e2', color: '#ef4444',
                              border: 'none', fontSize: 11.5, fontWeight: 600,
                              transition: 'all 0.15s',
                            }}
                            title="Delete Report"
                          >
                            <Trash2 size={14} />
                          </button>

                          {(['pdf'] as const).map((fmt) => (
                            <button
                              key={fmt}
                              onClick={() => handleExport(r, fmt)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 5,
                                padding: '5px 11px', borderRadius: 8, cursor: 'pointer',
                                background: 'var(--surface-2)', border: '1px solid var(--border)',
                                fontSize: 11.5, fontWeight: 600, color: 'var(--text-2)',
                                transition: 'all 0.15s', textTransform: 'uppercase',
                              }}
                            >
                              <Download size={12} /> {fmt}
                            </button>
                          ))}
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

      <Modal open={!!editSoapId} onClose={() => { setEditSoapId(null); queryClient.invalidateQueries({ queryKey: ['reports'] }) }} title="Edit SOAP Report" width={800}>
        {editSoapId && (
          <SOAPEditor consultationId={editSoapId} />
        )}
      </Modal>
    </div>
  )
}