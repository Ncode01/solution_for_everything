import React from 'react';

interface ContextActionBarProps {
  children: React.ReactNode;
  className?: string;
}

export default function ContextActionBar({ children, className = '' }: ContextActionBarProps) {
  return (
    <div className={`floating-control flex flex-wrap items-center gap-2 p-2 ${className}`}>
      {children}
    </div>
  );
}
