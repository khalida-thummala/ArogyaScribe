import React from 'react';

interface CardProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  footer,
  children,
  className = '',
}) => {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm ${className}`}>
      {(title || subtitle) && (
        <div className="flex flex-col space-y-1.5 p-6">
          {title && <h3 className="text-lg font-semibold leading-none tracking-tight">{title}</h3>}
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>
      )}
      <div className="p-6 pt-0">{children}</div>
      {footer && (
        <div className="flex items-center p-6 pt-0 border-t border-slate-100 mt-4">
          {footer}
        </div>
      )}
    </div>
  );
};
