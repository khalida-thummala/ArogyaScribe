import { useState } from 'react'
import FileUploadPanel from '@/components/ai-analysis/FileUploadPanel'
import AnalysisResultPanel from '@/components/ai-analysis/AnalysisResultPanel'
import { BrainCircuit, Upload, Sparkles } from 'lucide-react'

export default function AIAnalysisPage() {
  const [analysisId, setAnalysisId] = useState<string | null>(null)

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Header / Top Section ─────────────────────────── */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 8
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          color: 'var(--text-1)',
          fontWeight: 700,
          fontSize: 18,
        }}>
          <BrainCircuit size={20} color="var(--violet)" />
          Clinical Document RAG
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 7,
          background: 'var(--violet-light)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '6px 12px', fontSize: 12, color: 'var(--violet)', fontWeight: 600,
        }}>
          <Sparkles size={13} />
          GPT-4 Enabled
        </div>
      </div>

      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* ── Info Banner ────────────────────── */}
        <div style={{
          background: 'var(--violet-light)',
          border: '1px solid var(--border)', borderRadius: 16,
          padding: '20px 24px',
          display: 'flex', alignItems: 'flex-start', gap: 16,
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div className="icon-box-premium" style={{ color: 'var(--violet)' }}>
            <BrainCircuit size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--violet)', marginBottom: 4 }}>
              How AI Analysis Works
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.6, opacity: 0.9 }}>
              Our upgraded AI now uses <strong>RAG (Retrieval-Augmented Generation)</strong> to analyze documents.
              It automatically retrieves relevant information from historical patient records and medical documents
              to generate highly contextualized and accurate SOAP reports.
            </div>
          </div>
        </div>

        {/* ── Main Content ───────────────────── */}
        <div className={`grid-responsive ${analysisId ? 'ai-analysis-split' : ''}`} style={{
          display: 'grid',
          gap: 24,
          transition: 'grid-template-columns 0.3s ease',
        }}>
          {/* Upload Panel */}
          <div className="card">
            <div style={{ padding: '18px 22px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="icon-box-premium" style={{ color: 'var(--violet)' }}>
                <Upload size={16} />
              </div>
              <div>
                <h3 style={{ fontSize: 15, margin: 0, fontWeight: 700 }}>
                  Upload Document
                </h3>
                <p style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 2 }}>PDF, DOCX, or image</p>
              </div>
            </div>
            <div style={{ padding: 22 }}>
              <FileUploadPanel onAnalysisReady={(id) => setAnalysisId(id)} />
            </div>
          </div>

          {/* Results Panel */}
          {analysisId && (
            <div className="card slide-in">
              <div style={{
                padding: '18px 22px 14px', borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="icon-box-premium" style={{ color: 'var(--emerald)' }}>
                    <BrainCircuit size={16} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 15, margin: 0, fontWeight: 700 }}>
                      Analysis Results
                    </h3>
                    <p style={{ fontSize: 11.5, color: 'var(--emerald)', marginTop: 2 }}>AI-generated SOAP note ready</p>
                  </div>
                </div>
                <button
                  onClick={() => setAnalysisId(null)}
                  className="btn btn-sm"
                  style={{ fontSize: 12, padding: '4px 10px' }}
                >
                  ✕ Clear
                </button>
              </div>
              <div style={{ padding: 22 }}>
                <AnalysisResultPanel analysisId={analysisId} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
