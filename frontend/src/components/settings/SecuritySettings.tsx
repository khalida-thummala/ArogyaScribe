import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '@/api/auth';
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

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12.5,
  fontWeight: 600,
  color: 'var(--text-2)',
  marginBottom: 5,
};

const SecuritySettings: React.FC = () => {
  const [pwForm, setPwForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });

  const mutation = useMutation({
    mutationFn: (data: any) => authApi.updateSecurity(data),
    onSuccess: () => {
      toast.success('Password updated successfully');
      setPwForm({ current_password: '', new_password: '', confirm_password: '' });
    },
    onError: (e: any) => toast.error(e.response?.data?.detail || 'Failed to update password'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm_password) {
      toast.error('Passwords do not match');
      return;
    }
    mutation.mutate(pwForm);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'var(--teal)';
    e.target.style.boxShadow = '0 0 0 3px var(--teal-glow)';
  };
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'var(--border)';
    e.target.style.boxShadow = 'none';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-1)', marginBottom: 4 }}>
          Security Settings
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
          Manage your password and account security.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{ maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 16 }}
      >
        <div>
          <label style={labelStyle}>Current Password</label>
          <input
            type="password"
            required
            value={pwForm.current_password}
            onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })}
            style={inputStyle}
            className="form-control"
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        </div>

        <div>
          <label style={labelStyle}>New Password</label>
          <input
            type="password"
            required
            value={pwForm.new_password}
            onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })}
            style={inputStyle}
            className="form-control"
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        </div>

        <div>
          <label style={labelStyle}>Confirm New Password</label>
          <input
            type="password"
            required
            value={pwForm.confirm_password}
            onChange={(e) => setPwForm({ ...pwForm, confirm_password: e.target.value })}
            style={inputStyle}
            className="form-control"
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
        </div>

        <button
          type="submit"
          disabled={mutation.isPending}
          style={{
            background: 'var(--grad-teal)',
            border: 'none',
            color: '#fff',
            padding: '9px 24px',
            borderRadius: 8,
            fontWeight: 500,
            fontSize: 13.5,
            cursor: mutation.isPending ? 'not-allowed' : 'pointer',
            opacity: mutation.isPending ? 0.6 : 1,
            transition: 'all 0.15s',
            fontFamily: 'inherit',
            boxShadow: 'var(--shadow-teal)',
            alignSelf: 'flex-start',
          }}
        >
          {mutation.isPending ? 'Updating...' : 'Update Password'}
        </button>
      </form>
    </div>
  );
};

export default SecuritySettings;
