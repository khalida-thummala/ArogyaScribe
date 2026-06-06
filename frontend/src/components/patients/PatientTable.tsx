import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { patientsApi } from '@/api/patients'
import { Search, Plus, Pencil, Trash2, Users, UserCheck, UserX } from 'lucide-react'
import { format } from 'date-fns'
import Modal from '@/components/shared/Modal'
import PatientForm from './PatientForm'
import toast from 'react-hot-toast'
import type { Patient } from '@/types'

const getInitials = (first: string, last: string) =>
  `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase()

const AVATAR_COLORS = [
  ['#eff6ff','#2563eb'], ['#ecfdf5','#059669'], ['#f5f3ff','#7c3aed'],
  ['#fffbeb','#d97706'], ['#fff1f2','#e11d48'], ['#f0fdfa','#0d9488'],
]
const getAvatarColor = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length]

export default function PatientTable() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Patient | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['patients'],
    queryFn: () => patientsApi.list(),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => patientsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['patients'] })
      toast.success('Patient archived successfully')
    },
  })

  const patients: Patient[] = Array.isArray(data) ? data : (data as any)?.data ?? []

  const filtered = patients.filter((p) => {
    const q = search.toLowerCase()
    
    // Add date formatting to search fields
    const dobFormatted = p.date_of_birth ? format(new Date(p.date_of_birth), 'MMM d, yyyy').toLowerCase() : ''
    const registeredFormatted = p.created_at ? format(new Date(p.created_at), 'MMM d, yyyy').toLowerCase() : ''

    return (
      p.first_name?.toLowerCase().includes(q) ||
      p.last_name?.toLowerCase().includes(q) ||
      p.medical_id?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      dobFormatted.includes(q) ||
      registeredFormatted.includes(q)
    )
  })

  const activeCount   = patients.filter(p => p.status === 'active').length
  const inactiveCount = patients.filter(p => p.status !== 'active').length

  return (
    <div className="fade-in">
      {/* ── Action Bar ────────────────────────── */}
      <div className="page-header" style={{ marginBottom: 16 }}>
        <h2 className="page-title">Patient Management</h2>
        <button
          onClick={() => { setEditing(null); setShowForm(true) }}
          className="btn btn-primary btn-sm"
          style={{ padding: '8px 16px', fontSize: 13, borderRadius: 10 }}
        >
          <Plus size={14} />
          Add Patient
        </button>
      </div>

      {/* ── Stats ────────────────────────────── */}
      <div className="grid-responsive grid-cols-3" style={{ display: 'grid', gap: 16, marginBottom: 24 }}>
        {[
          { icon: Users,     label: 'Total Patients', value: patients.length,  color: '#3b82f6' },
          { icon: UserCheck, label: 'Active',          value: activeCount,      color: '#10b981' },
          { icon: UserX,     label: 'Inactive',        value: inactiveCount,    color: '#6b7280' },
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
                  <Icon size={20} />
                </div>
                <div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-1)', lineHeight: 1, letterSpacing: '-0.02em' }}>
                    {isLoading ? '—' : s.value}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {s.label}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Table Card ───────────────────────── */}
      <div className="card" style={{ overflow: 'hidden' }}>
        {/* Toolbar */}
        <div className="stack-on-mobile" style={{
          padding: '14px 20px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={14} style={{
              position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
              color: 'var(--text-3)',
            }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, medical ID or email…"
              className="form-control"
              style={{ paddingLeft: 32, width: '100%', maxWidth: 'none' }}
            />
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
            {filtered.length} of {patients.length} patients
          </span>
        </div>

        {/* Table */}
        {isLoading ? (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: 56, borderRadius: 8 }} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Users size={40} color="var(--text-4)" />
            </div>
            <h3>{search ? 'No patients match your search' : 'No patients registered'}</h3>
            <p>{search ? 'Try a different name, medical ID, or email.' : 'Add your first patient to get started with consultations.'}</p>
            {!search && (
              <button className="btn btn-primary btn-sm" onClick={() => { setEditing(null); setShowForm(true) }}>
                <Plus size={14} /> Add Patient
              </button>
            )}
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  {['Patient', 'IDs', 'Gender', 'Date of Birth', 'Status', 'Registered', 'Actions'].map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const initials = getInitials(p.first_name, p.last_name)
                  const [avatarBg, avatarColor] = getAvatarColor(p.first_name ?? 'A')
                  return (
                    <tr 
                      key={p.patient_id} 
                      onClick={() => navigate(`/app/patients/${p.patient_id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Patient */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                            background: avatarBg, color: avatarColor,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 12.5, fontWeight: 700,
                            border: `1.5px solid ${avatarColor}22`,
                          }}>
                            {initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text-1)' }}>
                              {p.first_name} {p.last_name}
                            </div>
                            <div style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{p.email ?? '—'}</div>
                          </div>
                        </div>
                      </td>
                      {/* IDs */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span style={{ fontSize: 11, color: 'var(--text-3)' }}>MRN: <strong>{p.medical_id ?? '—'}</strong></span>
                          <button
                            onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(p.patient_id); toast.success('System ID Copied!') }}
                            title="Click to copy System ID for AI Upload"
                            style={{
                              background: 'var(--surface-2)', border: '1px solid var(--border)',
                              padding: '3px 8px', borderRadius: 4, fontSize: 10, color: 'var(--text-2)',
                              cursor: 'pointer', textAlign: 'left', fontFamily: 'monospace',
                              transition: 'all 0.2s', width: 'fit-content'
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--teal)'; e.currentTarget.style.color = 'var(--teal)' }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)' }}
                          >
                            Sys ID: {p.patient_id.slice(0, 8)}...
                          </button>
                        </div>
                      </td>
                      {/* Gender */}
                      <td style={{ textTransform: 'capitalize', fontSize: 13 }}>{p.gender ?? '—'}</td>
                      {/* DOB */}
                      <td style={{ fontSize: 13 }}>
                        {p.date_of_birth ? format(new Date(p.date_of_birth), 'MMM d, yyyy') : '—'}
                      </td>
                      {/* Status */}
                      <td>
                        <span style={{
                          display: 'inline-block', padding: '3px 10px', borderRadius: 20,
                          fontSize: 11.5, fontWeight: 600,
                          background: p.status === 'active' ? '#ecfdf5' : p.status === 'archived' ? '#f3f4f6' : '#fffbeb',
                          color: p.status === 'active' ? '#059669' : p.status === 'archived' ? '#4b5563' : '#d97706',
                          border: `1px solid ${p.status === 'active' ? '#a7f3d0' : p.status === 'archived' ? '#e5e7eb' : '#fde68a'}`,
                        }}>
                          {p.status ?? 'active'}
                        </span>
                      </td>
                      {/* Registered */}
                      <td style={{ fontSize: 12, color: 'var(--text-3)' }}>
                        {p.created_at ? format(new Date(p.created_at), 'MMM d, yyyy') : '—'}
                      </td>
                      {/* Actions */}
                      <td>
                        <div style={{ display: 'flex', gap: 7, justifyContent: 'flex-end' }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditing(p); setShowForm(true) }}
                            title="Edit patient"
                            style={{
                              width: 30, height: 30, borderRadius: 8, cursor: 'pointer',
                              background: 'var(--surface-2)', border: '1px solid var(--border)',
                              color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: 'all 0.15s',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.color = '#2563eb'; e.currentTarget.style.borderColor = '#bfdbfe'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); if (confirm(`Archive ${p.first_name} ${p.last_name}?`)) deleteMut.mutate(p.patient_id) }}
                            title="Archive patient"
                            style={{
                              width: 30, height: 30, borderRadius: 8, cursor: 'pointer',
                              background: 'var(--surface-2)', border: '1px solid var(--border)',
                              color: 'var(--text-3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: 'all 0.15s',
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = '#fff1f2'; e.currentTarget.style.color = '#e11d48'; e.currentTarget.style.borderColor = '#fecdd3'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                          >
                            <Trash2 size={13} />
                          </button>
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

      {/* ── Modal ────────────────────────────── */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editing ? 'Edit Patient Record' : 'Register New Patient'}
        width={850}
      >
        <PatientForm
          initial={editing}
          onSuccess={() => { setShowForm(false); qc.invalidateQueries({ queryKey: ['patients'] }) }}
        />
      </Modal>
    </div>
  )
}
