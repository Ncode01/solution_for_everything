import React from 'react';

const TONE_DOT: Record<string, string> = {
  critical: 'bg-[var(--danger)]',
  warning: 'bg-[var(--warning)]',
  waiting: 'bg-[var(--text-tertiary)]',
  success: 'bg-[var(--success)]',
  launch: 'bg-[var(--launch)]',
  accent: 'bg-[var(--accent)]',
  neutral: 'bg-[var(--text-faint)]',
};

interface WorkQueueRowProps {
  title: React.ReactNode;
  meta?: React.ReactNode;
  owner?: React.ReactNode;
  due?: React.ReactNode;
  status?: React.ReactNode;
  action?: React.ReactNode;
  tone?: keyof typeof TONE_DOT;
  onClick?: () => void;
}

export default function WorkQueueRow({
  title,
  meta,
  owner,
  due,
  status,
  action,
  tone = 'neutral',
  onClick,
}: WorkQueueRowProps) {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={`grid w-full grid-cols-1 gap-3 border-b border-[var(--border-hairline)] px-4 py-3 text-left last:border-b-0 md:grid-cols-[minmax(0,2.3fr)_minmax(0,1fr)_auto_auto_auto] md:items-center md:px-5 ${onClick ? 'transition-colors hover:bg-white/[0.03]' : ''}`}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 shrink-0 rounded-full ${TONE_DOT[tone]}`} />
          <div className="truncate text-sm font-medium text-[var(--text-primary)]">{title}</div>
        </div>
        {meta && <div className="mt-1 truncate text-xs text-[var(--text-tertiary)]">{meta}</div>}
      </div>
      <div className="min-w-0 text-xs text-[var(--text-secondary)]">{owner}</div>
      <div className="text-xs text-[var(--text-secondary)]">{due}</div>
      <div className="text-xs text-[var(--text-secondary)]">{status}</div>
      <div className="flex justify-start md:justify-end">{action}</div>
    </Component>
  );
}
