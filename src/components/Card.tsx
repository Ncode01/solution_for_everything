import React from 'react';

interface Props {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
}

export default function Card({ children, className = '', onClick, interactive }: Props) {
  const base = 'bg-slate-900 border border-slate-800 rounded-xl p-4';
  const hover = interactive || onClick ? 'hover:border-slate-700 transition-colors cursor-pointer' : '';
  return (
    <div className={`${base} ${hover} ${className}`} onClick={onClick}>
      {children}
    </div>
  );
}
