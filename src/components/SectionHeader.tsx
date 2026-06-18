import React from 'react';
import { LucideIcon } from 'lucide-react';

interface Props {
  title: string;
  icon?: LucideIcon;
  count?: number;
  tone?: 'default' | 'danger' | 'warning';
  action?: React.ReactNode;
}

const TONE: Record<string, string> = {
  default: 'text-[var(--text-primary)]',
  danger: 'text-[var(--danger)]',
  warning: 'text-[var(--warning)]',
};

export default function SectionHeader({ title, icon: Icon, count, tone = 'default', action }: Props) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className={`flex items-center gap-2 text-[15px] font-semibold tracking-normal ${TONE[tone]}`}>
        {Icon && <Icon size={15} />}
        {title}
        {count !== undefined && <span className="text-xs font-normal text-[var(--text-tertiary)]">{count}</span>}
      </h2>
      {action}
    </div>
  );
}
