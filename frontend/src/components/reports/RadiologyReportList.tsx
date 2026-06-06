import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { radiologyApi } from '@/api/radiology'
import { FileImage, Loader2, Calendar, Download, Trash2 } from 'lucide-react'
import { API_BASE_URL } from '@/api/client'
import toast from 'react-hot-toast'

export default function RadiologyReportList() {
  const queryClient = useQueryClient()
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['radiology-reports'],
    queryFn: () => radiologyApi.getAllReports(),
  })

  const deleteMutation = useMutation({
    mutationFn: radiologyApi.deleteReport,
    onSuccess: () => {
      toast.success('Report deleted')
      queryClient.invalidateQueries({ queryKey: ['radiology-reports'] })
    },
    onError: () => toast.error('Failed to delete report')
  })

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      deleteMutation.mutate(id)
    }
  }

  if (isLoading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)' }}>
        <Loader2 size={24} className="spin" style={{ margin: '0 auto 10px' }} />
        Loading radiology reports...
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: 'var(--rose)' }}>
        Failed to load radiology reports.
      </div>
    )
  }

  const reports = data?.reports || []

  if (reports.length === 0) {
    return (
      <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-4)' }}>
        <FileImage size={40} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
        <p style={{ fontSize: 14, fontWeight: 500 }}>No Radiology Reports Found</p>
        <p style={{ fontSize: 13, marginTop: 4 }}>Radiology analyses generated via the Viewer will appear here.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {reports.map((report: any) => (
        <div 
          key={report.report_id} 
          className="fade-in"
          style={{ 
            background: 'var(--surface)', 
            border: '1px solid var(--border)', 
            borderRadius: 12, 
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 16
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ 
                width: 40, height: 40, borderRadius: 10, background: 'var(--violet-light)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--violet)' 
              }}>
                <FileImage size={20} />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)' }}>
                  {report.patient_name}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <span className="badge badge-teal" style={{ padding: '2px 6px', fontSize: 10 }}>{report.modality || 'X-RAY'}</span>
                  {report.body_part && <span>• {report.body_part}</span>}
                  {report.status === 'DRAFT' && (
                    <span className="badge badge-amber" style={{ padding: '2px 6px', fontSize: 10, marginLeft: 4 }}>DRAFT</span>
                  )}
                  {report.status === 'FINAL' && (
                    <span className="badge badge-emerald" style={{ padding: '2px 6px', fontSize: 10, marginLeft: 4 }}>FINAL</span>
                  )}
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-4)', fontSize: 12 }}>
                <Calendar size={14} />
                {report.created_at || report.study_date}
              </div>
              <button
                className="btn btn-outline"
                style={{ padding: '4px 12px', fontSize: 12, height: 28, color: 'var(--rose)', borderColor: 'var(--rose)' }}
                onClick={() => handleDelete(report.report_id)}
                disabled={deleteMutation.isPending}
              >
                <Trash2 size={14} />
              </button>
              <button
                className="btn btn-outline"
                style={{ padding: '4px 12px', fontSize: 12, height: 28 }}
                onClick={() => window.open(`${API_BASE_URL}/radiology/export/${report.report_id}?format=pdf`, '_blank')}
              >
                <Download size={14} style={{ marginRight: 6 }} />
                PDF
              </button>
            </div>
          </div>

          {/* Body */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, background: 'var(--surface-2)', padding: 16, borderRadius: 10 }}>
            {report.indication && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>Indication</div>
                <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5, margin: 0 }}>
                  {report.indication}
                </p>
              </div>
            )}
            {report.technique && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>Technique</div>
                <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5, margin: 0 }}>
                  {report.technique}
                </p>
              </div>
            )}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>Findings</div>
              <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.5, margin: 0 }}>
                {report.findings}
              </p>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>Impression</div>
              <p style={{ fontSize: 13, color: 'var(--text-1)', fontWeight: 500, lineHeight: 1.5, margin: 0 }}>
                {report.impression}
              </p>
            </div>
            {report.comparison && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>Comparison</div>
                <p style={{ fontSize: 13, color: 'var(--text-2)', fontStyle: 'italic', lineHeight: 1.5, margin: 0 }}>
                  {report.comparison}
                </p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
