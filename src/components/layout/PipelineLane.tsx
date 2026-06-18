import React from 'react';

interface PipelineLaneProps {
  title: string;
  count?: React.ReactNode;
  total?: React.ReactNode;
  children: React.ReactNode;
}

export default function PipelineLane({ title, count, total, children }: PipelineLaneProps) {
  return (
    <div className="glass-panel rounded-[var(--radius-xl)] p-3">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-[var(--text-primary)]">{title}</div>
          {count !== undefined && <div className="mt-1 text-xs text-[var(--text-tertiary)]">{count}</div>}
        </div>
        {total !== undefined && <div className="text-xs font-medium text-[var(--text-secondary)]">{total}</div>}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
