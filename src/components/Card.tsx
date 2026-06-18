import React from 'react';

interface Props {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
}

export default function Card({ children, className = '', onClick, interactive }: Props) {
  const base = 'apple-card';
  const hover = interactive || onClick ? 'cursor-pointer transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--surface-elevated)]' : '';
  return (
    <div className={`${base} ${hover} ${className}`} onClick={onClick}>
      {children}
    </div>
  );
}
