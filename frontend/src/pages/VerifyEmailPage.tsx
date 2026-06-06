import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { authApi } from '@/api/auth';
import toast from 'react-hot-toast';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { AuthLayout } from '@/components/auth';

const VerifyEmailPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      toast.error('No verification token found');
      return;
    }

    const verify = async () => {
      try {
        await authApi.verifyEmail(token);
        setStatus('success');
        toast.success('Email verified successfully!');
        // Auto redirect after 3 seconds
        setTimeout(() => navigate('/login'), 3000);
      } catch (err: any) {
        setStatus('error');
        toast.error(err.response?.data?.detail || 'Verification failed');
      }
    };

    verify();
  }, [token, navigate]);

  return (
    <AuthLayout
      title="Account Verification"
      subtitle="We are verifying your clinical credentials and email address."
    >
      <div className="flex flex-col items-center">
        {status === 'loading' && (
          <div className="flex flex-col items-center">
            <Loader2 className="animate-spin mb-4" style={{ color: 'var(--teal)' }} size={40} />
            <p className="text-sm font-medium" style={{ color: 'var(--text-3)' }}>Processing your request...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center w-full">
            <CheckCircle2 style={{ color: 'var(--emerald)' }} className="mb-4" size={48} />
            <h2 className="text-lg font-semibold" style={{ color: 'var(--emerald)' }}>Verified!</h2>
            <p className="text-sm mt-2" style={{ color: 'var(--text-3)' }}>
              Your account is now active. Redirecting you to login...
            </p>
            <button 
              onClick={() => navigate('/login')}
              className="btn btn-primary w-full mt-6 py-3"
            >
              Go to Login
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center w-full">
            <XCircle style={{ color: 'var(--rose)' }} className="mb-4" size={48} />
            <h2 className="text-lg font-semibold" style={{ color: 'var(--rose)' }}>Verification Link Invalid</h2>
            <p className="text-sm mt-2" style={{ color: 'var(--text-3)' }}>
              This link may have expired or is incorrect. Please contact support if you believe this is an error.
            </p>
            <button 
              onClick={() => navigate('/register')}
              className="btn w-full mt-6 py-3"
            >
              Back to Registration
            </button>
          </div>
        )}
      </div>
    </AuthLayout>
  );
};

export default VerifyEmailPage;
