import Logo from '@/components/shared/Logo';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  wide?: boolean;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children, subtitle, wide = false }) => {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'var(--bg)',
      }}
    >
      {/* Decorative blobs */}
      <div style={{ position: 'fixed', top: -100, right: -100, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle,rgba(37,99,235,0.08) 0%,transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: -80, left: -80, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle,rgba(29,78,216,0.06) 0%,transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div
        className={`w-full rounded-2xl p-8 md:p-10 transition-all duration-300 ${wide ? 'max-w-2xl' : 'max-w-md'}`}
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-lg)',
          position: 'relative',
          zIndex: 1,
          animation: 'slideUp 0.4s cubic-bezier(0.34,1.56,0.64,1) both',
        }}
      >
        {/* Logo — centered, shows teal stethoscope + bold ArogyaScribe */}
        <div className="flex flex-col items-center text-center mb-8">
          <div style={{ marginBottom: 20 }}>
            <Logo size="lg" variant="light" />
          </div>

          {subtitle && (
            <p style={{ fontSize: 13, color: 'var(--text-3)', lineHeight: 1.6, maxWidth: 280 }}>
              {subtitle}
            </p>
          )}
        </div>

        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
