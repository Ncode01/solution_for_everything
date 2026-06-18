import React from 'react';
import { ChevronRight, List } from 'lucide-react';

interface Props {
  count: number;
  onClick: () => void;
  label?: string;
  icon?: React.ReactNode;
  compact?: boolean;
}

export default function ViewAllButton({
  count,
  onClick,
  label,
  icon,
  compact = false,
}: Props) {
  const text = label ?? `View all${count > 0 ? ` (${count})` : ''}`;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 rounded-full border border-[var(--border-subtle)] text-[var(--text-tertiary)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] ${
        compact ? 'px-2 py-1 text-[11px]' : 'px-2.5 py-1.5 text-xs'
      }`}
    >
      {icon ?? <List size={compact ? 11 : 12} />}
      <span>{text}</span>
      <ChevronRight size={compact ? 11 : 12} />
    </button>
  );
}
