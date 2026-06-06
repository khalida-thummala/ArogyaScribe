import { FileImage } from 'lucide-react'
import { DicomViewer } from '@/components/ai-analysis/DicomViewer'
import RadiologyPanel from '@/components/ai-analysis/RadiologyPanel'
import { ComparisonSplitView } from '@/components/ai-analysis/ComparisonSplitView'
import SplitPane from '@/components/shared/SplitPane'
import { useRadiologyStore } from '@/store/radiologyStore'

export default function RadiologyViewerPage() {
  const { selectedFile, patientId, showComparison, setShowComparison } = useRadiologyStore()
  
  const leftViewerContent = (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', height: '100%', minWidth: 0, minHeight: 0 }}>
      {/* Header Overlay */}
      <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 50, display: 'flex', gap: 12 }}>
        {selectedFile && patientId && (
          <button 
            onClick={() => setShowComparison(!showComparison)} 
            className="btn" 
            style={{ 
              background: showComparison ? '#3b82f6' : 'rgba(15, 23, 42, 0.7)', 
              color: 'white', 
              border: showComparison ? '1px solid #3b82f6' : '1px solid rgba(255,255,255,0.1)', 
              backdropFilter: 'blur(8px)',
              padding: '8px 16px'
            }}
          >
            <FileImage size={16} style={{ marginRight: 6 }} />
            {showComparison ? 'Close Side-by-Side' : 'Open Side-by-Side View'}
          </button>
        )}
      </div>
      
      <div style={{ flex: 1, padding: '70px 24px 24px', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {showComparison && selectedFile && patientId ? (
          <SplitPane 
            id="radiologyInnerSplit"
            defaultSplit={50}
            minSplit={20}
            maxSplit={80}
            leftPane={
              <div style={{ flex: 1, borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', minWidth: 0 }}>
                <DicomViewer file={selectedFile} />
              </div>
            }
            rightPane={
              <ComparisonSplitView patientId={patientId} />
            }
          />
        ) : selectedFile ? (
          <div style={{ flex: 1, borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', minWidth: 0 }}>
            <DicomViewer file={selectedFile} />
          </div>
        ) : (
          <div style={{ 
            flex: 1, 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center', 
            color: '#64748b', 
            border: '2px dashed rgba(255,255,255,0.1)', 
            borderRadius: 16,
            background: 'rgba(0,0,0,0.2)'
          }}>
            <FileImage size={48} style={{ opacity: 0.5, marginBottom: 16 }} />
            <div style={{ fontSize: 16, fontWeight: 500, color: '#94a3b8' }}>Upload a DICOM or image file to begin</div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 8 }}>Use the sidebar controls to link a patient and load a scan</div>
          </div>
        )}
      </div>
    </div>
  )

  const rightSidebarContent = (
    <div style={{ 
      width: '100%', 
      height: '100%',
      minHeight: 0,
      background: 'var(--surface)', 
      overflowY: 'auto', 
      display: 'flex', 
      flexDirection: 'column',
      boxShadow: '-4px 0 15px rgba(0,0,0,0.05)',
      zIndex: 40
    }}>
      <RadiologyPanel />
    </div>
  )

  return (
    <>
      {/* Desktop: SplitPane side-by-side */}
      <div
        className="desktop-only"
        style={{ height: 'calc(100vh - 100px)', width: '100%', overflow: 'hidden', background: '#0f172a', borderRadius: 16, border: '1px solid var(--border)' }}
      >
        <SplitPane 
          id="radiologyMainSplit"
          defaultSplit={70}
          minSplit={40}
          maxSplit={85}
          leftPane={leftViewerContent}
          rightPane={rightSidebarContent}
        />
      </div>

      {/* Mobile: stacked layout */}
      <div
        className="mobile-only"
        style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%' }}
      >
        {/* Viewer panel — fixed height on mobile */}
        <div style={{ background: '#0f172a', borderRadius: 16, border: '1px solid var(--border)', height: 320, overflow: 'hidden', position: 'relative' }}>
          {leftViewerContent}
        </div>
        {/* Controls panel — scrollable */}
        <div style={{ background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
          <RadiologyPanel />
        </div>
      </div>
    </>
  )
}
