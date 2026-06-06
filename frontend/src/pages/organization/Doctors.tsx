import { useEffect, useState } from 'react'
import { adminApi } from '@/api/admin'
import { useNavigate } from 'react-router-dom'
import { Plus, X, Activity, UserCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function OrganizationDoctors() {
  const [doctors, setDoctors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [doctor, setDoctor] = useState({
    full_name: '', email: '', password: '', phone: '',
    license_number: '', specialization: '', department: ''
  })
  
  const navigate = useNavigate()

  useEffect(() => {
    loadDoctors()
  }, [])

  const loadDoctors = async () => {
    setLoading(true)
    try {
      const data = await adminApi.getOrganizationDoctors()
      setDoctors(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const toggleStatus = async (doctorId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    try {
      await adminApi.updateDoctorStatus(doctorId, newStatus)
      toast.success(`Doctor status updated to ${newStatus}`)
      loadDoctors()
    } catch (err) {
      toast.error('Failed to update status')
    }
  }

  const createDoctor = async () => {
    if (!doctor.full_name.trim() || doctor.full_name.length < 2) { toast.error('Doctor name must be at least 2 characters'); return }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(doctor.email)) { toast.error('Valid email is required'); return }
    if (!doctor.password || doctor.password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    if (!/^(?:\+91|91)?\d{10}$/.test(doctor.phone)) { toast.error('Phone must be a valid 10-digit Indian number (e.g. +919876543210)'); return }
    if (!doctor.license_number || doctor.license_number.length < 3) { toast.error('License number must be at least 3 characters'); return }
    
    setSaving(true)
    try {
      await adminApi.createOrganizationDoctor(doctor)
      toast.success('Doctor created successfully')
      setDoctor({
        full_name: '', email: '', password: '', phone: '',
        license_number: '', specialization: '', department: ''
      })
      setShowForm(false)
      loadDoctors()
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Failed to create doctor')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 11, background: '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Activity size={20} color="#10b981" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, color: 'var(--text-1)', letterSpacing: '-0.02em' }}>Organization Doctors</h1>
            <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '2px 0 0' }}>{doctors.length} doctors total</p>
          </div>
        </div>
        
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', background: 'var(--blue)', color: 'white' }}
        >
          {showForm ? <X size={15} /> : <Plus size={15} />}
          {showForm ? 'Cancel' : 'Add Doctor'}
        </button>
      </div>

      {showForm && (
        <div className="card slide-up" style={{ padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, color: 'var(--text-1)' }}>New Doctor Profile</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {[
              { label: 'Full Name *', key: 'full_name', type: 'text', placeholder: 'Dr. Jane Smith' },
              { label: 'Email *', key: 'email', type: 'email', placeholder: 'doctor@clinic.com' },
              { label: 'Password *', key: 'password', type: 'password', placeholder: 'Min. 8 characters' },
              { label: 'Phone *', key: 'phone', type: 'tel', placeholder: '9876543210', maxLength: 10 },
              { label: 'License Number *', key: 'license_number', type: 'text', placeholder: 'MCI-12345' },
              { label: 'Specialization', key: 'specialization', type: 'text', placeholder: 'e.g. Cardiology' },
              { label: 'Department', key: 'department', type: 'text', placeholder: 'e.g. Cardiology Dept' },
            ].map(({ label, key, type, placeholder, maxLength }) => (
              <div key={key}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.02em' }}>{label}</label>
                <input
                  type={type}
                  placeholder={placeholder}
                  maxLength={maxLength}
                  className="form-control"
                  style={{ height: 38, fontSize: 13 }}
                  value={(doctor as any)[key]}
                  onChange={(e) => {
                    let val = e.target.value;
                    if (key === 'phone') val = val.replace(/\D/g, '').slice(0, 10);
                    setDoctor({ ...doctor, [key]: val });
                  }}
                />
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
            <button onClick={createDoctor} disabled={saving} className="btn btn-primary" style={{ padding: '9px 24px', display: 'flex', alignItems: 'center', gap: 8, background: 'var(--blue)', color: 'white' }}>
              {saving ? 'Creating...' : 'Create Doctor'}
            </button>
          </div>
        </div>
      )}

      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 50, borderRadius: 8 }} />)}
          </div>
        ) : doctors.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon"><Activity size={36} color="var(--text-4)" /></div>
            <h3>No doctors found</h3>
            <p>Click "Add Doctor" to onboard a practitioner.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Specialization</th>
                  <th>License</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map((doc) => (
                  <tr key={doc.user_id}>
                    <td>
                      <div 
                        onClick={() => navigate(`/organization/doctors/${doc.user_id}`)}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
                      >
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue)' }}>
                          <UserCircle size={18} />
                        </div>
                        <span style={{ fontWeight: 600, color: 'var(--blue)' }}>{doc.full_name}</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-2)' }}>{doc.email}</td>
                    <td style={{ color: 'var(--text-2)' }}>{doc.department || '—'}</td>
                    <td style={{ color: 'var(--text-2)' }}>{doc.specialization || '—'}</td>
                    <td style={{ color: 'var(--text-2)' }}>{doc.license_number || '—'}</td>
                    <td>
                      <span style={{
                        padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'capitalize',
                        background: doc.status === 'active' ? '#ecfdf5' : '#f3f4f6',
                        color: doc.status === 'active' ? '#059669' : '#6b7280'
                      }}>
                        {doc.status}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => toggleStatus(doc.user_id, doc.status)}
                        style={{
                          padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
                          background: doc.status === 'active' ? '#fee2e2' : '#ecfdf5',
                          color: doc.status === 'active' ? '#e11d48' : '#059669'
                        }}
                      >
                        {doc.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}