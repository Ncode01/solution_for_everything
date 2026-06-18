import React from 'react';
import { Member } from '../../types';

interface Props {
  member?: Pick<Member, 'displayName' | 'role' | 'committee'> | null;
  name?: string;
  detail?: string;
  compact?: boolean;
  className?: string;
}

export default function PersonToken({ member, name, detail, compact = false, className = '' }: Props) {
  const label = member?.displayName ?? name ?? 'Unassigned';
  const meta = detail ?? member?.role ?? member?.committee;
  const initials = label
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || '?';

  return (
    <span className={`inline-flex items-center gap-2 min-w-0 ${className}`}>
      <span className={`${compact ? 'w-6 h-6 text-[10px]' : 'w-8 h-8 text-xs'} rounded-full bg-blue-400/12 border border-blue-200/20 text-blue-200 flex items-center justify-center font-bold shrink-0`}>
        {initials}
      </span>
      {!compact && (
        <span className="min-w-0">
          <span className="block text-sm text-slate-100 font-medium truncate">{label}</span>
          {meta && <span className="block text-xs text-slate-500 truncate">{meta}</span>}
        </span>
      )}
    </span>
  );
}
