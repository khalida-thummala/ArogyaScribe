import { useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { patientsApi } from '@/api/patients'
import { radiologyApi, RadiologyResponse, SimilarReport } from '@/api/radiology'
import { 
  UploadCloud, Loader2, 
  AlertTriangle, History, Search, BookOpen, User,
  Sparkles, RefreshCw, ShieldAlert, CheckCircle, Activity
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useRadiologyStore } from '@/store/radiologyStore'

export default function RadiologyPanel() {
  const { 
    selectedFile, setSelectedFile, 
    patientId, setPatientId, 
    setShowComparison 
  } = useRadiologyStore()
  
  const [loading, setLoading] = useState(false)
  const [statusText, setStatusText] = useState('')
  const [report, setReport] = useState<RadiologyResponse['report'] | null>(null)
  const [reportId, setReportId] = useState<string | null>(null)
  const [isApproved, setIsApproved] = useState(false)
  
  // pgvector search states
  const [searchQuery, setSearchQuery] = useState('')
  const [searchingCases, setSearchingCases] = useState(false)
  const [similarCases, setSimilarCases] = useState<SimilarReport[]>([])
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch patients list
  const { data: patients } = useQuery({
    queryKey: ['patients'],
    queryFn: () => patientsApi.list(),
  })

  // Handle image upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      // Allow DICOM files as well as images
      if (!file.type.startsWith('image/') && !file.name.toLowerCase().endsWith('.dcm')) {
        toast.error('Please upload an image or DICOM (.dcm) file')
        return
      }
      setSelectedFile(file)
      setReport(null) // reset previous report
      setReportId(null)
      setShowComparison(false)
      setIsApproved(false)
    }
  }

  // Trigger Azure Vision AI Analysis
  const handleAnalyze = async () => {

  if (!patientId) {

    toast.error(
      'Please link a patient to match medical records'
    )

    return
  }

  if (!selectedFile) {

    toast.error(
      'Please select or upload an X-ray image'
    )

    return
  }

  setLoading(true)

  setStatusText(
    'Uploading radiology scan to secure storage...'
  )

  setReport(null)

  setReportId(null)

  setShowComparison(false)

  setIsApproved(false)

  try {

    console.log(
      "UPLOADING FILE:",
      selectedFile
    )

    setTimeout(() => {

      setStatusText(
        'Analyzing image utilizing Azure OpenAI Vision...'
      )

    }, 1500)

    setTimeout(() => {

      setStatusText(
        'Cross-referencing findings with patient history...'
      )

    }, 3500)

    setTimeout(() => {

      setStatusText(
        'Generating structured radiology JSON report...'
      )

    }, 5500)

    const response =
      await radiologyApi.analyzeXray(
        patientId,
        selectedFile
      )

    console.log(
      "ANALYZE RESPONSE:",
      response
    )

    if (
      response.success &&
      response.report
    ) {

      setReport(
        response.report
      )

      setReportId(
        response.report_id
      )

      toast.success(
        'Radiology Vision analysis complete!'
      )

      // Refresh comparison history

      setShowComparison(false)

      setTimeout(() => {

        setShowComparison(true)

      }, 100)

    } else {

      toast.error(
        'Failed to analyze radiology image'
      )
    }

  } catch (err: any) {

    console.error(
      "ANALYZE ERROR:",
      err
    )

    toast.error(

    typeof err?.response?.data?.detail === 'string'

      ? err.response.data.detail

      : 'Radiology analysis failed'

  )

} finally {

  setLoading(false)

  setStatusText('')
}

 
}

  // Search similar reports with pgvector
  const handleSearchSimilar = async (queryStr = searchQuery) => {
    const queryToUse = queryStr || searchQuery
    if (!queryToUse.trim()) {
      toast.error('Please enter a clinical condition or query')
      return
    }
    
    setSearchingCases(true)
    try {
      const res = await radiologyApi.getSimilarReports(queryToUse)
      setSimilarCases(res.matches || [])
      if (res.matches?.length === 0) {
        toast.error('No matching records found')
      }
    } catch (err) {
      console.error(err)
      toast.error('Failed to perform similar case search')
    } finally {
      setSearchingCases(false)
    }
  }

  // Rapid Query Buttons for Testing
  const handlePredefinedSearch = (term: string) => {
    setSearchQuery(term)
    handleSearchSimilar(term)
  }

  const handleApproveReport = async () => {
    if (!reportId || !report) return
    try {
      await radiologyApi.updateReport(reportId, { ...report, status: 'FINAL' })
      setIsApproved(true)
      toast.success('Report reviewed, finalized, and pushed to patient record!')
    } catch (err) {
      toast.error('Failed to finalize report')
    }
  }

  const handleDeleteReport = async () => {
    if (!reportId) return
    if (!window.confirm('Are you sure you want to delete this report?')) return
    try {
      await radiologyApi.deleteReport(reportId)
      setReport(null)
      setReportId(null)
      setIsApproved(false)
      setSelectedFile(null)
      toast.success('Report deleted')
    } catch (err) {
      toast.error('Failed to delete report')
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: '24px 20px', gap: 24, flexShrink: 0 }}>
      {/* 1. Link Patient & Upload Scan */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-1)' }}>
          <User size={18} color="var(--violet)" />
          1. Patient & Scan
        </h3>

        {/* Patient Dropdown */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <select 
            className="form-control"
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            style={{ height: 42, background: 'var(--surface-2)' }}
          >
            <option value="">-- Choose Patient --</option>
            {patients?.map((p: any) => (
              <option key={p.patient_id} value={p.patient_id}>
                {p.first_name} {p.last_name} ({p.gender}, DOB: {p.date_of_birth})
              </option>
            ))}
          </select>
        </div>

        {/* Drag and Drop Container */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <div 
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                const file = e.dataTransfer.files[0]
                if (file.type.startsWith('image/') || file.name.toLowerCase().endsWith('.dcm')) {
                  setSelectedFile(file)
                  setReport(null)
                  setShowComparison(false)
                } else {
                  toast.error('Please upload an image or DICOM (.dcm) file')
                }
              }
            }}
            style={{
              border: '1px dashed var(--border)',
              borderRadius: 12,
              padding: '24px 16px',
              textAlign: 'center',
              background: 'var(--surface-2)',
              position: 'relative',
              cursor: 'pointer',
              transition: 'border 0.2s',
            }}
          >
            <input 
              type="file"
              ref={fileInputRef}
              accept="image/*,.dcm"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <UploadCloud size={24} color="var(--violet)" style={{ margin: '0 auto 8px', opacity: 0.8 }} />
            <p style={{ fontSize: 13, fontWeight: 600, margin: 0, color: 'var(--text-1)' }}>
              {selectedFile ? selectedFile.name : 'Choose or drop scan'}
            </p>
            <p style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 4 }}>Native DICOM (.dcm), PNG, JPG</p>
          </div>
        </div>

        {/* Action Button */}
        {selectedFile && !loading && (
          <button
            onClick={handleAnalyze}
            className="btn btn-primary"
            style={{
              width: '100%',
              justifyContent: 'center',
              background: 'var(--grad-violet)',
              boxShadow: 'var(--shadow-violet)',
              border: 'none',
              fontWeight: 600,
              padding: '12px',
              height: 'auto'
            }}
          >
            <Sparkles size={16} /> Run Vision AI Analysis
          </button>
        )}

        {/* Loading spinner */}
        {loading && (
          <div style={{
            padding: '16px',
            borderRadius: 10,
            background: 'var(--violet-light)',
            border: '1px solid rgba(124, 58, 237, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <Loader2 size={18} className="spin" color="var(--violet)" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--violet)', lineHeight: 1.4 }}>
              {statusText}
            </div>
          </div>
        )}
      </div>

      <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '4px 0' }} />

      {/* 2. AI Results Display */}
      {report && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-1)' }}>
            <Sparkles size={18} color="var(--violet)" />
            AI Findings
          </h3>
          
          {/* Compliance Banner */}
          <div style={{ background: 'var(--amber-light)', borderRadius: 10, padding: 12, border: '1px solid var(--amber-border)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <ShieldAlert size={16} color="var(--amber)" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--amber-dark)', marginBottom: 2 }}>COMPLIANCE NOTICE: PRE-READ</div>
              <div style={{ fontSize: 11, color: 'var(--amber-dark)', lineHeight: 1.4 }}>
                Not an FDA-cleared standalone diagnostic tool. Mandatory doctor review required.
              </div>
            </div>
          </div>

          {/* Critical Flags */}
          {report.critical_flags && report.critical_flags.length > 0 && (
            <div style={{ background: 'rgba(239, 68, 68, 0.1)', borderRadius: 10, padding: 12, border: '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <AlertTriangle size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', marginBottom: 2, textTransform: 'uppercase' }}>CRITICAL FINDING DETECTED</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                  {report.critical_flags.map((flag, idx) => (
                    <span key={idx} style={{ background: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>
                      {flag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Indication & Technique */}
          {(report.indication !== undefined || report.technique !== undefined) && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {report.indication !== undefined && (
                <div style={{ background: 'var(--surface-hover)', borderRadius: 10, padding: 14, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>Clinical Indication</div>
                  {isApproved ? (
                    <p style={{ fontSize: 13, color: 'var(--text-1)', lineHeight: 1.5, margin: 0 }}>{report.indication}</p>
                  ) : (
                    <input 
                      type="text" 
                      className="form-control" 
                      value={report.indication} 
                      onChange={e => setReport({ ...report, indication: e.target.value })} 
                      style={{ background: 'transparent', padding: '6px 10px', fontSize: 13 }}
                    />
                  )}
                </div>
              )}
              {report.technique !== undefined && (
                <div style={{ background: 'var(--surface-hover)', borderRadius: 10, padding: 14, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 4 }}>Technique</div>
                  {isApproved ? (
                    <p style={{ fontSize: 13, color: 'var(--text-1)', lineHeight: 1.5, margin: 0 }}>{report.technique}</p>
                  ) : (
                    <input 
                      type="text" 
                      className="form-control" 
                      value={report.technique} 
                      onChange={e => setReport({ ...report, technique: e.target.value })} 
                      style={{ background: 'transparent', padding: '6px 10px', fontSize: 13 }}
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {/* Findings */}
          <div style={{ background: 'var(--surface-hover)', borderRadius: 10, padding: 14, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--violet)', textTransform: 'uppercase', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              Findings
            </div>
            {isApproved ? (
              <p style={{ fontSize: 13, color: 'var(--text-1)', lineHeight: 1.5, margin: 0 }}>{report.findings}</p>
            ) : (
              <textarea 
                className="form-control" 
                value={report.findings} 
                rows={5}
                onChange={e => setReport({ ...report, findings: e.target.value })} 
                style={{ background: 'transparent', padding: '8px 10px', fontSize: 13 }}
              />
            )}
          </div>

          {/* Impression */}
          <div style={{ background: 'var(--surface-hover)', borderRadius: 10, padding: 14, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--violet)', textTransform: 'uppercase', marginBottom: 4 }}>
              Impression
            </div>
            {isApproved ? (
              <p style={{ fontSize: 13, color: 'var(--text-1)', lineHeight: 1.5, margin: 0 }}>{report.impression}</p>
            ) : (
              <textarea 
                className="form-control" 
                value={report.impression} 
                rows={3}
                onChange={e => setReport({ ...report, impression: e.target.value })} 
                style={{ background: 'transparent', padding: '8px 10px', fontSize: 13 }}
              />
            )}
          </div>

          {/* Abnormalities */}
          {report.abnormalities && report.abnormalities.length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--rose)', textTransform: 'uppercase', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <AlertTriangle size={12} /> Detected Clinical Markers
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {report.abnormalities.map((item, idx) => (
                  <span 
                    key={idx} 
                    className="badge badge-red"
                    style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, fontWeight: 600 }}
                  >
                    ⚠️ {item}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Clinical Codes */}
          {(report.snomed_codes && report.snomed_codes.length > 0) || (report.loinc_codes && report.loinc_codes.length > 0) ? (
            <div style={{ background: 'rgba(124, 58, 237, 0.05)', borderRadius: 10, padding: 14, border: '1px solid rgba(124, 58, 237, 0.15)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--violet)', textTransform: 'uppercase', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Activity size={12} /> Clinical Codes (Azure Health Insights)
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {report.snomed_codes && report.snomed_codes.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, marginBottom: 4 }}>SNOMED CT</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {report.snomed_codes.map((code, idx) => (
                        <span key={idx} style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: 4, fontSize: 11, color: 'var(--text-1)' }}>
                          <strong>{code.code}</strong>: {code.term}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {report.loinc_codes && report.loinc_codes.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-3)', fontWeight: 600, marginBottom: 4 }}>LOINC</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {report.loinc_codes.map((code, idx) => (
                        <span key={idx} style={{ background: 'var(--surface-1)', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: 4, fontSize: 11, color: 'var(--text-1)' }}>
                          <strong>{code.code}</strong>: {code.term}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* Comparisons */}
          {report.comparison && (
            <div style={{ background: 'rgba(59, 130, 246, 0.06)', borderRadius: 10, padding: 14, border: '1px solid rgba(59, 130, 246, 0.15)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <History size={12} /> Comparison with Previous Reports
                </div>
                <button 
                  onClick={() => setShowComparison(true)}
                  className="btn btn-sm"
                  style={{ background: '#3b82f6', color: '#fff', fontSize: 11, padding: '6px 12px', borderRadius: 8, border: 'none', alignSelf: 'flex-start' }}
                >
                  <History size={14} style={{ marginRight: 6 }} /> Open Side-by-Side View
                </button>
              </div>
              {isApproved ? (
                <p style={{ fontSize: 12.5, color: 'var(--text-1)', lineHeight: 1.5, margin: 0, fontStyle: 'italic' }}>
                  {report.comparison}
                </p>
              ) : (
                <textarea 
                  className="form-control" 
                  value={report.comparison} 
                  rows={2}
                  onChange={e => setReport({ ...report, comparison: e.target.value })} 
                  style={{ background: 'transparent', padding: '8px 10px', fontSize: 12.5 }}
                />
              )}
            </div>
          )}

          {/* Approve & Push / Delete Buttons */}
          <div style={{ marginTop: 4, display: 'flex', gap: 12 }}>
            <button
              onClick={handleDeleteReport}
              className="btn btn-outline"
              style={{ flex: 1, borderColor: 'var(--rose)', color: 'var(--rose)', height: 'auto', padding: '12px' }}
            >
              Delete Draft
            </button>
            <button
              onClick={handleApproveReport}
              disabled={isApproved}
              className="btn btn-primary"
              style={{
                flex: 2,
                justifyContent: 'center',
                background: isApproved ? 'var(--emerald)' : 'var(--grad-violet)',
                boxShadow: isApproved ? 'none' : 'var(--shadow-violet)',
                border: 'none',
                fontWeight: 600,
                padding: '12px',
                height: 'auto',
                opacity: isApproved ? 0.9 : 1,
                cursor: isApproved ? 'default' : 'pointer'
              }}
            >
              {isApproved ? (
                <><CheckCircle size={16} /> Saved</>
              ) : (
                <><CheckCircle size={16} /> Finalize</>
              )}
            </button>
          </div>
        </div>
      )}

      {report && <hr style={{ border: 'none', borderTop: '1px solid var(--border)', margin: '4px 0' }} />}

      {/* 3. pgvector Similarity Search Finder */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-1)' }}>
          <BookOpen size={18} color="var(--violet)" />
          Semantic Case Search
        </h3>
        
        {/* Predefined Search Help Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
          {['Cardiomegaly', 'Pleural Effusion', 'Pneumothorax'].map((term) => (
            <button
              key={term}
              onClick={() => handlePredefinedSearch(term)}
              className="btn btn-ghost"
              style={{
                fontSize: 10.5,
                padding: '4px 8px',
                borderRadius: 20,
                border: '1px solid var(--border)',
                background: 'var(--surface-2)',
                color: 'var(--text-2)'
              }}
            >
              🔎 {term}
            </button>
          ))}
        </div>

        {/* Search Bar Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} color="var(--text-4)" style={{ position: 'absolute', left: 12, top: 12 }} />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. enlarged cardiac silhouette..."
              className="form-control"
              style={{ paddingLeft: 34, height: 38, fontSize: 13 }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearchSimilar() }}
            />
          </div>
          <button
            onClick={() => handleSearchSimilar()}
            disabled={searchingCases}
            className="btn btn-primary"
            style={{
              background: 'var(--grad-violet)',
              boxShadow: 'var(--shadow-violet)',
              border: 'none',
              fontWeight: 600,
              height: 38,
              justifyContent: 'center'
            }}
          >
            {searchingCases ? <RefreshCw size={14} className="spin" /> : 'Search Database'}
          </button>
        </div>

        {/* Results List */}
        {similarCases.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--violet)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Top pgvector Matches:
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {similarCases.map((match, index) => (
                <div 
                  key={index} 
                  className="fade-in"
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    background: 'var(--surface-hover-op)',
                    padding: 14,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, flexWrap: 'wrap', gap: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-4)' }}>MATCH #{index + 1}</span>
                    <span className="badge badge-teal" style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4 }}>
                      Patient: {match.patient_name || `${match.patient_id.slice(0, 8)}...`}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 2 }}>Findings</div>
                      <p style={{ fontSize: 12, color: 'var(--text-1)', margin: 0, lineHeight: 1.4 }}>{match.findings}</p>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', marginBottom: 2 }}>Impression</div>
                      <p style={{ fontSize: 12, color: 'var(--text-1)', margin: 0, lineHeight: 1.4 }}>{match.impression}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          searchQuery && !searchingCases && (
            <div style={{
              textAlign: 'center',
              padding: '16px 0',
              color: 'var(--text-4)',
              fontSize: 12.5,
              border: '1px dashed var(--border)',
              borderRadius: 10
            }}>
              No matching records found.
            </div>
          )
        )}
      </div>
    </div>
  )
}
