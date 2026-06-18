import React from 'react';

interface Props {
  children: React.ReactNode;
  className?: string;
}

export default function FloatingBar({ children, className = '' }: Props) {
  return (
    <div className={`floating-control flex flex-wrap items-center gap-2 p-2 ${className}`}>
      {children}
    </div>
  );
}
