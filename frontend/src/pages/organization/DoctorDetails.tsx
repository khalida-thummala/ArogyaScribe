import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { adminApi } from '@/api/admin'
import { ArrowLeft, UserCircle2, Mail, Phone, Hash, Building2, ShieldAlert, KeyRound, Activity, Users, FileText, Briefcase } from 'lucide-react'
import toast from 'react-hot-toast'

export default function DoctorDetails() {
  const { doctorId } = useParams()
  const navigate = useNavigate()
  const [editing, setEditing] = useState(false)
  const [doctor, setDoctor] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [newPassword, setNewPassword] = useState('')
  const [showResetPassword, setShowResetPassword] = useState(false)
  const [resettingPassword, setResettingPassword] = useState(false)

  useEffect(() => {
    if (doctorId) {
      loadDoctor()
    }
  }, [doctorId])

  const loadDoctor = async () => {
    setLoading(true)
    try {
      const data = await adminApi.getDoctorDetails(doctorId as string)
      setDoctor(data)
    } catch (err) {
      console.error(err)
      toast.error('Failed to load doctor details')
    } finally {
      setLoading(false)
    }
  }

  const saveDoctor = async () => {
    setSaving(true)
    try {
      await adminApi.updateDoctor(doctorId as string, {
        full_name: doctor.full_name,
        phone: doctor.phone,
        license_number: doctor.license_number,
        department: doctor.department
      })
      toast.success('Doctor updated successfully')
      setEditing(false)
      loadDoctor()
    } catch (err) {
      console.error(err)
      toast.error('Failed to update doctor')
    } finally {
      setSaving(false)
    }
  }

  const resetPassword = async () => {
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    setResettingPassword(true)
    try {
      await adminApi.resetDoctorPassword(doctorId as string, newPassword)
      toast.success('Password reset successfully')
      setNewPassword('')
      setShowResetPassword(false)
    } catch (err) {
      console.error(err)
      toast.error('Failed to reset password')
    } finally {
      setResettingPassword(false)
    }
  }

  if (loading) {
    return (
      <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div className="skeleton" style={{ height: 60, borderRadius: 12, width: '40%' }} />
        <div className="skeleton" style={{ height: 300, borderRadius: 16 }} />
      </div>
    )
  }

  if (!doctor) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon"><UserCircle2 size={36} color="var(--text-4)" /></div>
        <h3>Doctor not found</h3>
        <p>The requested doctor could not be located.</p>
        <button onClick={() => navigate('/organization/doctors')} className="btn btn-primary" style={{ marginTop: 16 }}>Go Back</button>
      </div>
    )
  }

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <button 
          onClick={() => navigate('/organization/doctors')}
          style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--surface-2)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-2)' }}
        >
          <ArrowLeft size={20} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--blue-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--blue)' }}>
            <UserCircle2 size={28} />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, color: 'var(--text-1)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
              {doctor.full_name}
              <span style={{ 
                padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'capitalize', letterSpacing: '0.02em',
                background: doctor.status === 'active' ? '#ecfdf5' : '#f3f4f6', 
                color: doctor.status === 'active' ? '#059669' : '#6b7280' 
              }}>
                {doctor.status}
              </span>
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-3)', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Briefcase size={14} /> {doctor.department || 'No Department'} • {doctor.specialization || 'General'}
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
        
        {/* Profile Card */}
        <div className="card" style={{ padding: 24, alignSelf: 'start' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: 'var(--text-1)' }}>Profile Details</h3>
            <button onClick={() => setEditing(!editing)} className="btn" style={{ padding: '6px 14px', fontSize: 12, background: 'var(--surface-2)', color: 'var(--text-1)' }}>
              {editing ? 'Cancel Editing' : 'Edit Doctor'}
            </button>
          </div>

          {editing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 4, textTransform: 'uppercase' }}>Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  style={{ height: 38 }}
                  value={doctor.full_name || ''}
                  onChange={(e) => setDoctor({ ...doctor, full_name: e.target.value })}
                />
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 4, textTransform: 'uppercase' }}>Phone Number</label>
                  <input
                    type="tel"
                    className="form-control"
                    style={{ height: 38 }}
                    value={doctor.phone || ''}
                    onChange={(e) => setDoctor({ ...doctor, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 4, textTransform: 'uppercase' }}>License</label>
                  <input
                    type="text"
                    className="form-control"
                    style={{ height: 38 }}
                    value={doctor.license_number || ''}
                    onChange={(e) => setDoctor({ ...doctor, license_number: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 4, textTransform: 'uppercase' }}>Department</label>
                <input
                  type="text"
                  className="form-control"
                  style={{ height: 38 }}
                  value={doctor.department || ''}
                  onChange={(e) => setDoctor({ ...doctor, department: e.target.value })}
                />
              </div>

              <button onClick={saveDoctor} disabled={saving} className="btn btn-primary" style={{ height: 40, marginTop: 8 }}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Mail size={16} color="var(--text-3)" />
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase' }}>Email</div>
                  <div style={{ fontSize: 14, color: 'var(--text-1)', fontWeight: 500 }}>{doctor.email}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Phone size={16} color="var(--text-3)" />
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase' }}>Phone</div>
                  <div style={{ fontSize: 14, color: 'var(--text-1)', fontWeight: 500 }}>{doctor.phone || 'Not provided'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Hash size={16} color="var(--text-3)" />
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase' }}>License Number</div>
                  <div style={{ fontSize: 14, color: 'var(--text-1)', fontWeight: 500 }}>{doctor.license_number || 'Not provided'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <Building2 size={16} color="var(--text-3)" />
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, textTransform: 'uppercase' }}>Department</div>
                  <div style={{ fontSize: 14, color: 'var(--text-1)', fontWeight: 500 }}>{doctor.department || 'Not specified'}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Security Card */}
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <ShieldAlert size={18} color="var(--rose)" />
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-1)' }}>Security Settings</h3>
            </div>
            
            <button 
              onClick={() => setShowResetPassword(!showResetPassword)} 
              className="btn" 
              style={{ width: '100%', background: showResetPassword ? 'var(--surface-2)' : '#fff1f2', color: showResetPassword ? 'var(--text-1)' : 'var(--rose)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <KeyRound size={16} />
              {showResetPassword ? 'Cancel Reset' : 'Reset Doctor Password'}
            </button>

            {showResetPassword && (
              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }} className="slide-up">
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 4, textTransform: 'uppercase' }}>New Password</label>
                  <input
                    type="password"
                    className="form-control"
                    style={{ height: 38 }}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                  />
                </div>
                <button onClick={resetPassword} disabled={resettingPassword} className="btn" style={{ background: 'var(--rose)', color: 'white', fontWeight: 600 }}>
                  {resettingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            )}
          </div>

          {/* Stats Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
            <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-3)' }}>
                <Users size={16} /> <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>Patients</span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-1)' }}>{doctor.patient_count || 0}</div>
            </div>
            
            <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-3)' }}>
                <Activity size={16} /> <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>Consultations</span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-1)' }}>{doctor.consultation_count || 0}</div>
            </div>
            
            <div className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-3)' }}>
                <FileText size={16} /> <span style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>Reports</span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-1)' }}>{doctor.report_count || 0}</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}