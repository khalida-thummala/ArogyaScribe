import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/api/auth';
import toast from 'react-hot-toast';
import { Loader2, Save } from 'lucide-react';

const OrganizationSettings: React.FC = () => {
  const { user } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);
  const [orgData, setOrgData] = useState({
    hospital_name_override: '',
    address: '',
    contact_info: ''
  });

  useEffect(() => {
    // If the org fields are populated in user or you fetch them elsewhere,
    // populate them here. Currently user might not have them natively unless updated
    if (user && (user as any).organization) {
       const org = (user as any).organization;
       setOrgData({
         hospital_name_override: org.hospital_name_override || '',
         address: org.address || '',
         contact_info: org.contact_info || ''
       });
    }
  }, [user]);

  const details = [
    { label: 'Organization ID', value: (user as any)?.organization_id },
    { label: 'Account Status', value: user?.status },
    { label: 'Organization Name', value: (user as any)?.organization_name || 'N/A' },
  ];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await authApi.updateOrganization(orgData);
      toast.success('Organization branding updated!');
    } catch (e: any) {
      toast.error('Failed to update organization: ' + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-1)', marginBottom: 4 }}>
          Organization Information
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
          Details about your healthcare facility and membership.
        </p>
      </div>

      <div style={{ display: 'grid', gap: 16 }} className="org-grid">
        {details.map((item) => (
          <div
            key={item.label}
            style={{
              padding: 16,
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 12,
            }}
          >
            <div style={{
              fontSize: 10.5,
              fontWeight: 700,
              color: 'var(--text-4)',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              marginBottom: 6,
            }}>
              {item.label}
            </div>
            <div style={{
              fontSize: 13,
              fontFamily: 'monospace',
              color: 'var(--text-1)',
              wordBreak: 'break-all',
            }}>
              {item.value || '—'}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        padding: 16,
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        borderRadius: 12,
      }}>
        <h4 style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-1)', marginBottom: 12 }}>
          Hospital Branding
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Hospital Name Override (for reports)</label>
            <input 
              className="form-control" 
              placeholder="e.g. City General Hospital"
              value={orgData.hospital_name_override}
              onChange={e => setOrgData({...orgData, hospital_name_override: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Address</label>
            <input 
              className="form-control" 
              placeholder="e.g. 123 Health Ave, Medical City"
              value={orgData.address}
              onChange={e => setOrgData({...orgData, address: e.target.value})}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Contact Info (Phone / Email)</label>
            <input 
              className="form-control" 
              placeholder="e.g. +1 555-0199 | contact@hospital.com"
              value={orgData.contact_info}
              onChange={e => setOrgData({...orgData, contact_info: e.target.value})}
            />
          </div>
          
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn btn-primary"
            style={{ alignSelf: 'flex-start', marginTop: 8 }}
          >
            {isSaving ? <Loader2 className="spin" size={14} /> : <Save size={14} />}
            Save Branding
          </button>
        </div>
      </div>

      <div style={{
        padding: 16,
        background: 'var(--blue-light)',
        border: '1px solid var(--border)',
        borderRadius: 12,
      }}>
        <h4 style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--blue)', marginBottom: 6 }}>
          Subscription Plan
        </h4>
        <p style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 12 }}>
          You are currently on the Professional Plan.
        </p>
        <button
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--blue)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            fontFamily: 'inherit',
            textDecoration: 'underline',
          }}
        >
          View Billing Details →
        </button>
      </div>
    </div>
  );
};

export default OrganizationSettings;
