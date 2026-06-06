import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/api/client'
import { CheckCircle, Loader2, FileText, Activity, CheckCircle2, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import ComparisonPanel from './ComparisonPanel'
import { formatSoapField } from '@/utils'

interface Props {
  analysisId: string
}

export default function AnalysisResultPanel({ analysisId }: Props) {
  const qc = useQueryClient()
  const [activeTab, setActiveTab] = useState<'soap' | 'audit' | 'source'>('soap')
  
  const { data, isLoading } = useQuery({
    queryKey: ['analysis', analysisId],
    queryFn: () => apiClient.get(`/ai-analysis/${analysisId}`).then((r) => r.data),
  })

  const approveMut = useMutation({
    mutationFn: () => apiClient.post(`/ai-analysis/${analysisId}/approve`, { notes: 'Approved via UI' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reports'] })
      qc.invalidateQueries({ queryKey: ['analysis', analysisId] })
      toast.success('Analysis approved and saved to Reports')
    },
    onError: () => toast.error('Failed to approve'),
  })

  if (isLoading) return (
    <div style={{ textAlign: 'center', padding: 40 }}>
      <Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} color="var(--teal)" />
      <div style={{ marginTop: 10, color: 'var(--text-3)', fontSize: 13 }}>Loading analysis…</div>
    </div>
  )

  if (!data || data.error) return (
    <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-3)', fontSize: 13 }}>Analysis not found</div>
  )

  const sections = [
    { key: 'generated_subjective', label: 'Subjective', color: '#5a3fad' },
    { key: 'generated_objective', label: 'Objective', color: '#0e7c4a' },
    { key: 'generated_assessment', label: 'Assessment', color: '#e67e22' },
    { key: 'generated_plan', label: 'Plan', color: '#2980b9' },
  ]

  const tabStyle = (id: string) => ({
    padding: '10px 0',
    fontSize: 13,
    fontWeight: 600,
    color: activeTab === id ? 'var(--teal)' : 'var(--text-3)',
    borderBottom: activeTab === id ? '2px solid var(--teal)' : 'none',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer',
    transition: 'all 0.2s',
    background: 'none',
    borderTop: 'none',
    borderLeft: 'none',
    borderRight: 'none',
  })

  return (
    <div>
      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: 24, 
        borderBottom: '1px solid var(--border)', 
        marginBottom: 20,
        padding: '0 4px'
      }}>
        <button onClick={() => setActiveTab('soap')} style={tabStyle('soap') as any}>
          <FileText size={15} /> Generated SOAP
        </button>
        <button onClick={() => setActiveTab('audit')} style={tabStyle('audit') as any}>
          <Activity size={15} /> Clinical Audit
        </button>
        <button onClick={() => setActiveTab('source')} style={tabStyle('source') as any}>
          <Sparkles size={15} /> Extracted Text
        </button>
      </div>


      {activeTab === 'soap' ? (
        <div className="fade-in">
          {/* Confidence */}
          <div style={{ background: 'var(--surface-hover)', borderRadius: 10, padding: '12px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: 'var(--text-2)' }}>AI Confidence Score</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#0e7c4a' }}>
              {data.confidence_score !== undefined && data.confidence_score !== null 
                ? Number(data.confidence_score).toFixed(1) 
                : '—'}%
            </span>
          </div>

          {/* SOAP Sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
            {sections.map(({ key, label, color }) => (
              <div key={key} style={{ border: `1px solid ${color}30`, borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ background: `${color}10`, padding: '8px 14px', fontSize: 11.5, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                <div style={{ padding: '12px 14px', fontSize: 13, lineHeight: 1.7, color: 'var(--text-2)', whiteSpace: 'pre-wrap' }}>
                  {formatSoapField((data as any)[key]) || <span style={{ color: 'var(--text-3)', fontStyle: 'italic' }}>No content generated</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Key Entities */}
          {data.key_entities && Object.keys(data.key_entities).length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)', marginBottom: 10 }}>Key Medical Entities</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {Object.entries(data.key_entities).map(([k, v]) => (
                  <span key={k} style={{ padding: '4px 12px', background: 'var(--teal-light)', color: 'var(--teal)', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>
                    {String(v)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : activeTab === 'audit' ? (
        <div className="fade-in">
          <ComparisonPanel data={data.comparison_data} />
        </div>
      ) : (
        <div className="fade-in">
          <div style={{ 
            background: 'var(--surface-hover)', 
            border: '1px solid var(--border)', 
            borderRadius: 10, 
            padding: 20,
            maxHeight: 400,
            overflowY: 'auto'
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 12 }}>Raw Extracted Content</div>
            <pre style={{ 
              fontSize: 12.5, 
              lineHeight: 1.6, 
              color: 'var(--text-2)', 
              whiteSpace: 'pre-wrap',
              fontFamily: 'inherit',
              margin: 0
            }}>
              {data.extracted_text || 'No text extracted from this document.'}
            </pre>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 16, marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
        {data.approved_at && (
          <div style={{ fontSize: 13, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle2 size={14} color="#0e7c4a" />
            Saved to Reports on {new Date(data.approved_at).toLocaleDateString()}
          </div>
        )}
        
        <button
          onClick={() => approveMut.mutate()}
          disabled={approveMut.isPending || !!data.approved_at}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 6, 
            padding: '10px 22px', 
            background: data.approved_at ? 'var(--surface-hover)' : '#0e7c4a', 
            color: data.approved_at ? 'var(--text-2)' : '#fff', 
            border: data.approved_at ? '1px solid var(--border)' : 'none', 
            borderRadius: 8, 
            fontSize: 13.5, 
            fontWeight: 500, 
            cursor: data.approved_at ? 'default' : 'pointer' 
          }}
        >
          <CheckCircle size={15} /> 
          {approveMut.isPending ? 'Approving…' : data.approved_at ? 'Approved & Saved' : 'Approve & Save to Reports'}
        </button>

        {data.approved_at && (
          <a 
            href="/reports" 
            className="btn btn-outline btn-sm"
            style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            Go to Reports
          </a>
        )}
      </div>
    </div>
  )
}
