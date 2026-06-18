import React from 'react';

type MetricTone = 'default' | 'accent' | 'success' | 'warning' | 'danger' | 'launch';

const TONE_CLASS: Record<MetricTone, string> = {
  default: 'text-[var(--text-primary)]',
  accent: 'text-[var(--accent)]',
  success: 'text-[var(--success)]',
  warning: 'text-[var(--warning)]',
  danger: 'text-[var(--danger)]',
  launch: 'text-[var(--launch)]',
};

interface MetricCapsuleProps {
  label: string;
  value: React.ReactNode;
  detail?: React.ReactNode;
  tone?: MetricTone;
  icon?: React.ReactNode;
  onClick?: () => void;
}

export default function MetricCapsule({
  label,
  value,
  detail,
  tone = 'default',
  icon,
  onClick,
}: MetricCapsuleProps) {
  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      onClick={onClick}
      className={`flex min-h-[4.25rem] items-start gap-3 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] bg-[var(--surface-solid)] px-4 py-3 text-left shadow-[var(--shadow-inner-highlight)] ${onClick ? 'transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--surface-elevated)]' : ''}`}
    >
      {icon && <div className="mt-0.5 text-[var(--text-tertiary)]">{icon}</div>}
      <div className="min-w-0">
        <div className={`text-lg font-semibold leading-tight ${TONE_CLASS[tone]}`}>{value}</div>
        <div className="mt-1 text-xs text-[var(--text-tertiary)]">{label}</div>
        {detail && <div className="mt-1 text-[11px] text-[var(--text-faint)]">{detail}</div>}
      </div>
    </Component>
  );
}
