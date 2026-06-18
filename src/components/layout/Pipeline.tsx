import React from 'react';

interface PipelineProps {
  title?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export default function Pipeline({ title, children, className = '' }: PipelineProps) {
  return (
    <section className={`space-y-3 ${className}`}>
      {title && <div className="text-[15px] font-semibold text-[var(--text-primary)]">{title}</div>}
      <div className="grid gap-3 xl:grid-cols-5">{children}</div>
    </section>
  );
}
