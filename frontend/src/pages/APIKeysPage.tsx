import { useEffect, useState } from 'react'
import { apiKeysApi } from '@/api/apiKeys'
import { Key, Plus, Trash2, Shield, Activity, Clock } from 'lucide-react'

export default function APIKeysPage() {
  const [keys, setKeys] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadKeys = async () => {
    setLoading(true)
    try {
      const data = await apiKeysApi.getKeys()
      setKeys(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadKeys()
  }, [])

  const handleGenerate = async () => {
    await apiKeysApi.generateKey()
    loadKeys()
  }

  const handleRevoke = async (id: string) => {
    if (confirm("Are you sure you want to revoke this API Key? This action cannot be undone and any integrations using it will break.")) {
      await apiKeysApi.revokeKey(id)
      loadKeys()
    }
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ── Header ─────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="icon-box-premium" style={{ color: 'var(--violet)' }}>
            <Key size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: 'var(--text-1)' }}>
              Developer API Keys
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-3)', margin: '4px 0 0' }}>
              Manage access credentials for B2B clinical integrations.
            </p>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px' }}
        >
          <Plus size={16} />
          Generate New Key
        </button>
      </div>

      {/* ── Info Banner ─────────────────────── */}
      <div style={{
        background: 'var(--violet-light)',
        border: '1px solid var(--border)', 
        borderRadius: 16,
        padding: '20px 24px',
        display: 'flex', alignItems: 'flex-start', gap: 16,
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div className="icon-box-premium" style={{ color: 'var(--violet)' }}>
          <Shield size={20} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--violet)', marginBottom: 4 }}>
            Secure B2B Radiology Analysis
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-2)', lineHeight: 1.6, opacity: 0.9 }}>
            Use these API keys to authenticate against the external <strong>/api/v1/external/radiology</strong> endpoints.
            All API activity is strictly monitored and recorded in the audit logs to maintain full HIPAA and CDSCO compliance.
          </div>
        </div>
      </div>

      {/* ── Keys List ───────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
        {loading && keys.length === 0 ? (
          <div style={{ color: 'var(--text-3)', padding: 20 }}>Loading keys...</div>
        ) : keys.length === 0 ? (
          <div style={{ 
            gridColumn: '1 / -1', 
            padding: 40, 
            textAlign: 'center',
            background: 'var(--surface)',
            border: '1px dashed var(--border)',
            borderRadius: 16,
            color: 'var(--text-3)'
          }}>
            <Key size={40} style={{ opacity: 0.3, margin: '0 auto 12px' }} />
            <p>No API keys generated yet.</p>
          </div>
        ) : (
          keys.map((key) => (
            <div
              key={key.api_key_id}
              className="card slide-in"
              style={{
                padding: 20,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: 16,
                border: '1px solid rgba(124, 58, 237, 0.15)', // Subtle violet border
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-1)', margin: 0 }}>
                    {key.name || 'Unnamed Key'}
                  </h3>
                  <div style={{ 
                    background: key.request_count > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.05)',
                    color: key.request_count > 0 ? 'var(--emerald)' : 'var(--text-3)',
                    padding: '4px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600
                  }}>
                    {key.request_count > 0 ? 'Active' : 'Never Used'}
                  </div>
                </div>

                <div style={{ 
                  background: 'rgba(0,0,0,0.2)', 
                  padding: '10px 14px', 
                  borderRadius: 8, 
                  fontFamily: 'monospace',
                  fontSize: 13,
                  color: 'var(--violet)',
                  wordBreak: 'break-all',
                  border: '1px solid rgba(255,255,255,0.05)'
                }}>
                  {key.key}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-3)', fontSize: 12 }}>
                    <Activity size={14} />
                    <span>{key.request_count || 0} Requests</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-3)', fontSize: 12 }}>
                    <Clock size={14} />
                    <span>{key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : '—'}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleRevoke(key.api_key_id)}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '8px', borderRadius: 8,
                    background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    cursor: 'pointer', fontSize: 13, fontWeight: 600,
                    transition: 'background 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                >
                  <Trash2 size={14} />
                  Revoke Key
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}