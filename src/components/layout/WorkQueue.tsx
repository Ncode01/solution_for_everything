import React from 'react';

interface WorkQueueProps {
  title?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export default function WorkQueue({ title, action, children, className = '' }: WorkQueueProps) {
  return (
    <section className={`solid-panel overflow-hidden rounded-[var(--radius-xl)] ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-[var(--border-hairline)] px-4 py-3 md:px-5">
          <div className="text-[15px] font-semibold text-[var(--text-primary)]">{title}</div>
          {action}
        </div>
      )}
      <div>{children}</div>
    </section>
  );
}
