import { useState } from 'react'
import ReportList from '@/components/reports/ReportList'
import RadiologyReportList from '@/components/reports/RadiologyReportList'
import { FileText, Search, Image } from 'lucide-react'

export default function ReportsPage() {
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'soap' | 'rag' | 'dictation' | 'radiology'>('soap')

  return (
    <div className="fade-in">
      {/* Page header */}
      <div className="page-header" style={{ marginBottom: 20, flexWrap: 'wrap' }}>
        <h1 className="page-title">Reports</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-4)' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${activeTab === 'soap' ? 'SOAP notes' : activeTab === 'dictation' ? 'Voice dictation reports' : 'radiology reports'}...`}
              className="form-control"
              style={{ paddingLeft: 32, width: '100%' }}
            />
          </div>
          {/* SOAP Standard badge */}
          {activeTab === 'soap' && (
            <div className="desktop-only" style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: 'var(--teal-light)', border: '1px solid var(--teal-glow)',
              borderRadius: 10, padding: '8px 14px', fontSize: 12, color: 'var(--teal-dark)', fontWeight: 700,
              whiteSpace: 'nowrap', boxShadow: '0 2px 10px var(--teal-glow-op)',
            }}>
              <FileText size={14} />
              SOAP Standard
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <button
          onClick={() => setActiveTab('soap')}
          style={{
            padding: '10px 16px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'soap' ? '2px solid var(--teal)' : '2px solid transparent',
            color: activeTab === 'soap' ? 'var(--teal)' : 'var(--text-3)',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.2s',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          <FileText size={16} /> Clinical SOAP Notes
        </button>
        <button
          onClick={() => setActiveTab('rag')}
          style={{
            padding: '10px 16px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'rag' ? '2px solid var(--blue)' : '2px solid transparent',
            color: activeTab === 'rag' ? 'var(--blue)' : 'var(--text-3)',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.2s',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          <FileText size={16} /> Clinical RAG Reports
        </button>
        <button
          onClick={() => setActiveTab('dictation')}
          style={{
            padding: '10px 16px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'dictation' ? '2px solid #ec4899' : '2px solid transparent',
            color: activeTab === 'dictation' ? '#ec4899' : 'var(--text-3)',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.2s',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          <FileText size={16} /> Voice Dictation Reports
        </button>
        <button
          onClick={() => setActiveTab('radiology')}
          style={{
            padding: '10px 16px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'radiology' ? '2px solid var(--violet)' : '2px solid transparent',
            color: activeTab === 'radiology' ? 'var(--violet)' : 'var(--text-3)',
            fontWeight: 600,
            fontSize: 14,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            transition: 'all 0.2s',
            whiteSpace: 'nowrap',
            flexShrink: 0,
          }}
        >
          <Image size={16} /> Radiology AI Reports
        </button>
      </div>

      {activeTab === 'soap' && (
        <ReportList search={search} filterType="soap" />
      )}
      {activeTab === 'rag' && (
        <ReportList search={search} filterType="rag" />
      )}
      {activeTab === 'dictation' && (
        <ReportList search={search} filterType="dictation" />
      )}
      {activeTab === 'radiology' && (
        <RadiologyReportList />
      )}
    </div>
  )
}
