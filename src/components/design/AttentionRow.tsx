import React from 'react';
import { ChevronRight } from 'lucide-react';

type Severity = 'danger' | 'warning' | 'info';

const SEVERITY: Record<Severity, string> = {
  danger: 'border-l-red-400 text-red-300',
  warning: 'border-l-amber-400 text-amber-300',
  info: 'border-l-blue-400 text-blue-300',
};

interface Props {
  title: string;
  metadata?: React.ReactNode;
  owner?: React.ReactNode;
  dueDate?: React.ReactNode;
  action?: React.ReactNode;
  severity?: Severity;
  onClick?: () => void;
}

export default function AttentionRow({
  title,
  metadata,
  owner,
  dueDate,
  action,
  severity = 'info',
  onClick,
}: Props) {
  const Component = onClick ? 'button' : 'div';
  return (
    <Component
      onClick={onClick}
      className={`apple-list-row group w-full border-l-2 ${SEVERITY[severity]} px-3 py-2.5 text-left flex items-center justify-between gap-3`}
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium text-slate-100 truncate">{title}</span>
        {metadata && <span className="block text-xs text-slate-500 truncate">{metadata}</span>}
      </span>
      <span className="flex items-center gap-2 shrink-0 text-xs text-slate-500">
        {owner}
        {dueDate}
        {action}
        {onClick && <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-300 transition-colors" />}
      </span>
    </Component>
  );
}
