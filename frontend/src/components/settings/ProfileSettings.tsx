import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/authStore';
import { LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 14px',
  border: '1.5px solid var(--border)',
  borderRadius: 8,
  background: 'var(--surface)',
  color: 'var(--text-1)',
  fontSize: 13.5,
  outline: 'none',
  transition: 'border-color 0.15s, box-shadow 0.15s',
  fontFamily: 'inherit',
};

const disabledInputStyle: React.CSSProperties = {
  ...inputStyle,
  background: 'var(--surface-2)',
  color: 'var(--text-3)',
  cursor: 'not-allowed',
  border: '1.5px solid var(--border)',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12.5,
  fontWeight: 600,
  color: 'var(--text-2)',
  marginBottom: 5,
};

const ProfileSettings: React.FC = () => {
  const { user, setAuth, accessToken, refreshToken, logout } = useAuthStore();
  const qc = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['me'],
    queryFn: () => authApi.getProfile(),
    staleTime: 0,
  });

  const effectiveUser = profile ?? user;

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    timezone: 'UTC',
    language_preference: 'en',
    signature_url: '',
  });

  useEffect(() => {
    if (effectiveUser) {
      setFormData({
        full_name: (effectiveUser as any).full_name ?? '',
        phone: (effectiveUser as any).phone ?? '',
        timezone: (effectiveUser as any).timezone ?? 'UTC',
        language_preference: (effectiveUser as any).language_preference ?? 'en',
        signature_url: (effectiveUser as any).signature_url ?? '',
      });
    }
  }, [effectiveUser]);

  const mutation = useMutation({
    mutationFn: (data: any) => authApi.updateProfile(data),
    onSuccess: async (updated) => {
      toast.success('Profile updated successfully');
      setAuth(updated, accessToken!, refreshToken!);
      qc.invalidateQueries({ queryKey: ['me'] });
    },
    onError: () => toast.error('Failed to update profile'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.phone && formData.phone.length !== 10) {
      toast.error('Phone number must be exactly 10 digits');
      return;
    }
    mutation.mutate(formData);
  };

  const handleSignOut = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-1)', marginBottom: 4 }}>
          Profile Information
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
          Update your personal details and preferences.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 20 }} className="profile-form-grid">
        {/* Full Name */}
        <div>
          <label style={labelStyle}>Full Name</label>
          <input
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            style={inputStyle}
            className="form-control"
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--teal)';
              e.target.style.boxShadow = '0 0 0 3px var(--teal-glow)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border)';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Phone Number */}
        <div>
          <label style={labelStyle}>Phone Number</label>
          <input
            type="text"
            inputMode="numeric"
            value={formData.phone}
            maxLength={10}
            onChange={(e) => {
              const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
              setFormData((prev) => ({ ...prev, phone: val }));
            }}
            placeholder="9876543210"
            style={inputStyle}
            className="form-control"
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--teal)';
              e.target.style.boxShadow = '0 0 0 3px var(--teal-glow)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border)';
              e.target.style.boxShadow = 'none';
            }}
          />
          <p style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 4 }}>
            Please enter exactly 10 digits (Numbers only)
          </p>
        </div>

        {/* Email — read-only */}
        <div>
          <label style={labelStyle}>Email (Read-only)</label>
          <input
            value={(effectiveUser as any)?.email ?? ''}
            disabled
            style={disabledInputStyle}
            className="form-control"
          />
        </div>

        {/* License No — read-only */}
        <div>
          <label style={labelStyle}>License No. (Read-only)</label>
          <input
            value={(effectiveUser as any)?.license_number ?? ''}
            disabled
            style={disabledInputStyle}
            className="form-control"
          />
        </div>

        {/* Timezone */}
        <div>
          <label style={labelStyle}>Timezone</label>
          <select
            value={formData.timezone}
            onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
            style={inputStyle}
            className="form-control"
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--teal)';
              e.target.style.boxShadow = '0 0 0 3px var(--teal-glow)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border)';
              e.target.style.boxShadow = 'none';
            }}
          >
            <option value="UTC">UTC</option>
            <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
            <option value="America/New_York">America/New_York (EST)</option>
            <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
            <option value="Europe/London">Europe/London (GMT)</option>
          </select>
        </div>

        {/* Language */}
        <div>
          <label style={labelStyle}>Language</label>
          <select
            value={formData.language_preference}
            onChange={(e) => setFormData({ ...formData, language_preference: e.target.value })}
            style={inputStyle}
            className="form-control"
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--teal)';
              e.target.style.boxShadow = '0 0 0 3px var(--teal-glow)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border)';
              e.target.style.boxShadow = 'none';
            }}
          >
            <option value="en">English</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
          </select>
        </div>

        {/* Signature URL */}
        <div style={{ gridColumn: '1 / -1' }}>
          <label style={labelStyle}>Digital Signature (URL or Base64)</label>
          <input
            value={formData.signature_url}
            onChange={(e) => setFormData({ ...formData, signature_url: e.target.value })}
            style={inputStyle}
            placeholder="https://... or data:image/png;base64,..."
            className="form-control"
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--teal)';
              e.target.style.boxShadow = '0 0 0 3px var(--teal-glow)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border)';
              e.target.style.boxShadow = 'none';
            }}
          />
          <p style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 4 }}>
            Provide an image URL or Base64 string for your signature to automatically apply it to reports.
          </p>
        </div>

        {/* Actions row */}
        <div style={{
          gridColumn: '1 / -1',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: 20,
          borderTop: '1px solid var(--border)',
          flexWrap: 'wrap',
          gap: 12,
        }}>
          <button
            type="button"
            onClick={handleSignOut}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid var(--rose-light)',
              background: 'var(--rose-light)',
              color: 'var(--rose)',
              fontWeight: 500,
              fontSize: 13.5,
              cursor: 'pointer',
              transition: 'all 0.15s',
              fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--rose)';
              (e.currentTarget as HTMLButtonElement).style.color = '#fff';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'var(--rose-light)';
              (e.currentTarget as HTMLButtonElement).style.color = 'var(--rose)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--rose-light)';
            }}
          >
            <LogOut size={15} />
            Sign Out of Account
          </button>

          <button
            type="submit"
            disabled={mutation.isPending}
            style={{
              background: 'var(--grad-teal)',
              border: 'none',
              color: '#fff',
              padding: '8px 24px',
              borderRadius: 8,
              fontWeight: 500,
              fontSize: 13.5,
              cursor: mutation.isPending ? 'not-allowed' : 'pointer',
              opacity: mutation.isPending ? 0.6 : 1,
              transition: 'all 0.15s',
              fontFamily: 'inherit',
              boxShadow: 'var(--shadow-teal)',
            }}
          >
            {mutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileSettings;
