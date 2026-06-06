import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { authApi } from '@/api/auth';

interface OTPVerificationProps {
  userId: string;
  onSuccess: () => void;
  onBack: () => void;
}

const OTPVerification: React.FC<OTPVerificationProps> = ({ userId, onSuccess, onBack }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) value = value[0];
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join('');
    if (otpValue.length < 6) {
      toast.error('Please enter the full 6-digit OTP');
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.verifyOtp(userId, otpValue);
      toast.success('Account verified successfully!');
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'Verification failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-bold" style={{ color: 'var(--text-1)' }}>Verify Your Account</h3>
        <p className="text-sm mt-1" style={{ color: 'var(--text-3)' }}>
          Enter the 6-digit code sent to your email and phone.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-between gap-2">
          {otp.map((digit, index) => (
            <input
              key={index}
              id={`otp-${index}`}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-12 h-12 text-center text-xl font-bold rounded-lg outline-none transition-all"
              style={{ 
                background: 'var(--bg-2)', 
                border: '1px solid var(--border)',
                color: 'var(--text-1)'
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--teal)')}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
            />
          ))}
        </div>

        <div className="space-y-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary w-full py-3"
          >
            {isSubmitting ? 'Verifying...' : 'Verify OTP'}
          </button>
          
          <button
            type="button"
            onClick={onBack}
            className="btn w-full py-2.5"
            style={{ border: 'none', background: 'transparent', color: 'var(--text-3)' }}
          >
            Back to Registration
          </button>
        </div>
      </form>
    </div>
  );
};

export default OTPVerification;
