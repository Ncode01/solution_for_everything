import React from 'react';
import { Member } from '../../types';

interface Props {
  member?: Pick<Member, 'displayName' | 'role' | 'committee' | 'organization' | 'organizationRole' | 'source'> | null;
  name?: string;
  detail?: string;
  compact?: boolean;
  className?: string;
}

export default function PersonToken({ member, name, detail, compact = false, className = '' }: Props) {
  const label = member?.displayName ?? name ?? 'Unassigned';
  const meta = detail ?? member?.organizationRole ?? member?.role ?? member?.organization ?? member?.committee;
  const initials = label
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || '?';

  return (
    <span className={`inline-flex min-w-0 items-center gap-2 ${className}`}>
      <span className={`${compact ? 'w-6 h-6 text-[10px]' : 'w-8 h-8 text-xs'} flex shrink-0 items-center justify-center rounded-full border border-[var(--border-subtle)] bg-[var(--accent-soft)] font-bold text-[var(--text-primary)]`}>
        {initials}
      </span>
      {!compact && (
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-[var(--text-primary)]">{label}</span>
          {meta && <span className="block truncate text-xs text-[var(--text-tertiary)]">{meta}</span>}
        </span>
      )}
    </span>
  );
}
