import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { adminApi } from '@/api/admin'
import {
  Building2,
  Users,
  UserRound,
  FileText
} from 'lucide-react'

export default function OrganizationDetails() {
  const { organizationId } = useParams()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const res =
        await adminApi.getOrganizationDetails(
          organizationId!
        )

      setData(res)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        Loading...
      </div>
    )
  }

  if (!data) {
    return (
      <div className="p-6">
        Organization not found
      </div>
    )
  }

  return (
    <div className="fade-in">

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 24
        }}
      >
        <div
          style={{
            width: 50,
            height: 50,
            borderRadius: 12,
            background: '#eff6ff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Building2
            size={22}
            color="#2563eb"
          />
        </div>

        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 800
            }}
          >
            {data.organization.name}
          </h1>

          <p
            style={{
              margin: 0,
              color: '#6b7280'
            }}
          >
            {data.organization.email}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns:
            'repeat(auto-fit,minmax(220px,1fr))',
          gap: 16,
          marginBottom: 24
        }}
      >

        <div className="card p-4">
          <Users size={20} />
          <h4>Doctors</h4>
          <h2>{data.doctor_count}</h2>
        </div>

        <div className="card p-4">
          <UserRound size={20} />
          <h4>Patients</h4>
          <h2>{data.patient_count}</h2>
        </div>

        <div className="card p-4">
          <Building2 size={20} />
          <h4>Consultations</h4>
          <h2>{data.consultation_count}</h2>
        </div>

        <div className="card p-4">
          <FileText size={20} />
          <h4>Reports</h4>
          <h2>{data.report_count}</h2>
        </div>

      </div>

      {/* Organization Info */}
      <div
        className="card"
        style={{
          padding: 20,
          marginBottom: 24
        }}
      >
        <h3>Organization Details</h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit,minmax(250px,1fr))',
            gap: 12
          }}
        >
          <div>
            <strong>Name:</strong>
            <br />
            {data.organization.name}
          </div>

          <div>
            <strong>Email:</strong>
            <br />
            {data.organization.email}
          </div>

          <div>
            <strong>Phone:</strong>
            <br />
            {data.organization.phone}
          </div>

          <div>
            <strong>Plan:</strong>
            <br />
            {data.organization.subscription_plan}
          </div>
        </div>
      </div>

      {/* Doctors */}
      <div className="card">
        <div
          style={{
            padding: 20
          }}
        >
          <h3>
            Doctors (
            {data.doctors?.length || 0}
            )
          </h3>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
              </tr>
            </thead>

            <tbody>
              {data.doctors?.map(
                (doctor: any) => (
                  <tr
                    key={doctor.user_id}
                  >
                    <td>
                      {doctor.full_name ||
                        doctor.name}
                    </td>

                    <td>
                      {doctor.email}
                    </td>

                    <td>
                      {doctor.role}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Administrative Actions */}
      <div className="card" style={{ padding: 20, marginTop: 24 }}>
        <h3 style={{ color: 'var(--rose)', display: 'flex', alignItems: 'center', gap: 8 }}>
          Administrative Actions
        </h3>
        <div style={{ marginTop: 16 }}>
          <h4>Reset Organization Admin Password</h4>
          <p style={{ color: 'var(--text-3)', fontSize: 14, marginBottom: 16 }}>
            Set a new password for this organization's administrator account.
          </p>
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <input
              type="password"
              placeholder="New Admin Password"
              className="input-field"
              style={{ maxWidth: 300 }}
              id="new-admin-password"
            />
            <button
              className="btn btn-primary"
              style={{ background: 'var(--rose)' }}
              onClick={async () => {
                const input = document.getElementById('new-admin-password') as HTMLInputElement;
                if (!input.value) return alert('Please enter a new password');
                try {
                  await adminApi.resetOrganizationAdminPassword(organizationId!, input.value);
                  alert('Password reset successfully');
                  input.value = '';
                } catch (e: any) {
                  alert(e.response?.data?.detail || 'Failed to reset password');
                }
              }}
            >
              Reset Password
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}