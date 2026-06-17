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
  default: 'text-white',
  danger: 'text-red-400',
  warning: 'text-amber-400',
};

export default function SectionHeader({ title, icon: Icon, count, tone = 'default', action }: Props) {
  return (
    <div className="flex items-center justify-between gap-3 mb-3">
      <h2 className={`flex items-center gap-2 text-sm font-semibold ${TONE[tone]}`}>
        {Icon && <Icon size={15} />}
        {title}
        {count !== undefined && (
          <span className="text-xs font-normal text-slate-500">({count})</span>
        )}
      </h2>
      {action}
    </div>
  );
}
