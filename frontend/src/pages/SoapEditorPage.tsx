import { useParams } from 'react-router-dom'
import SOAPEditor from '@/components/soap/SOAPEditor'

export default function SoapEditorPage() {
  const { id } = useParams<{ id: string }>()

  if (!id) return <div style={{ color: 'var(--text-3)', padding: 40 }}>Consultation ID missing</div>

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>SOAP Note Editor</h1>
        <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>Consultation ID: {id}</p>
      </div>
      <div style={{ background: 'var(--surface)', borderRadius: 12, border: '1px solid var(--border)', padding: 28 }}>
        <SOAPEditor consultationId={id} />
      </div>
    </div>
  )
}
