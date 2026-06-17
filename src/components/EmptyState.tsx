import React from 'react';
import { LucideIcon } from 'lucide-react';

interface Props {
  /** Either a LucideIcon component or a ReactNode element */
  icon: LucideIcon | React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon, title, description, action }: Props) {
  const iconContent = typeof icon === 'function'
    ? React.createElement(icon as LucideIcon, { size: 28, className: 'text-slate-500' })
    : icon;

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
        {iconContent}
      </div>
      <h3 className="text-slate-300 font-semibold text-base mb-1">{title}</h3>
      {description && <p className="text-slate-500 text-sm max-w-xs mb-4">{description}</p>}
      {action}
    </div>
  );
}
